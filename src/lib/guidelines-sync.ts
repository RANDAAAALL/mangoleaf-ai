import type { DiseaseGuideline } from "@/lib/db";

export type GuidelineChange =
  | { type: "INSERT" | "UPDATE"; guideline: DiseaseGuideline }
  | { type: "DELETE"; id: string };

type GuidelineSyncOptions = {
  isOnline: () => boolean;
  readSnapshot: () => Promise<DiseaseGuideline[]>;
  fetchSnapshot: () => Promise<DiseaseGuideline[]>;
  replaceSnapshot: (
    rows: DiseaseGuideline[],
    baseline: DiseaseGuideline[],
    canWrite: () => boolean,
  ) => Promise<boolean>;
  applyChange: (change: GuidelineChange) => Promise<void>;
  onError: (error: unknown) => void;
};

/** Compare saved values, not array order or object identity returned by IndexedDB. */
export function sameGuidelineSnapshot(
  left: DiseaseGuideline[],
  right: DiseaseGuideline[],
) {
  const values = (rows: DiseaseGuideline[]) =>
    rows
      .map((row) =>
        JSON.stringify([
          row.id,
          row.disease_name,
          row.guidelines_en,
          row.guidelines_bis,
        ]),
      )
      .sort();
  return JSON.stringify(values(left)) === JSON.stringify(values(right));
}

/** Keep direct Realtime edits safe while a complete HTTP snapshot is in flight. */
export function createGuidelineSyncManager(options: GuidelineSyncOptions) {
  let enabled = true;
  let revision = 0;
  let connection = 0;
  let refreshRequested = false;
  let pending: Promise<boolean> | null = null;
  let writeTail: Promise<void> = Promise.resolve();
  const ready = () => enabled && options.isOnline();

  function write<T>(work: () => Promise<T>): Promise<T> {
    const task = writeTail.then(work);
    // A failed local write must not prevent the next edit or refresh from running.
    writeTail = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }

  function refresh(afterSubscription = false): Promise<boolean> {
    if (!ready()) return Promise.resolve(false);
    if (pending) {
      if (afterSubscription) {
        // The existing request may have read before the subscription was ready.
        revision += 1;
        refreshRequested = true;
      }
      return pending;
    }

    pending = Promise.resolve()
      .then(async () => {
        let succeeded = false;
        do {
          refreshRequested = false;
          if (!ready()) return false;
          // Save received Realtime values before reading the next HTTP baseline.
          await writeTail;
          const startingRevision = revision;
          const canWrite = () => ready() && revision === startingRevision;
          try {
            const baseline = await options.readSnapshot();
            if (!canWrite()) {
              refreshRequested = ready();
              continue;
            }
            const rows = await options.fetchSnapshot();
            if (!ready()) return false;
            succeeded = await write(async () => {
              if (!canWrite()) return false;
              return options.replaceSnapshot(rows, baseline, canWrite);
            });
            if (!succeeded) refreshRequested = ready();
          } catch (error) {
            options.onError(error);
            succeeded = false;
          }
          // Several edits during one request need one follow-up, not one per edit.
        } while (refreshRequested && ready());
        return succeeded;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  return {
    refresh,
    receive: async (change: GuidelineChange): Promise<boolean> => {
      if (!ready()) return false;
      revision += 1;
      if (pending) refreshRequested = true;
      const receivedConnection = connection;
      try {
        return await write(async () => {
          if (!ready() || connection !== receivedConnection) return false;
          await options.applyChange(change);
          return true;
        });
      } catch (error) {
        options.onError(error);
        return false;
      }
    },
    pause: () => {
      enabled = false;
      connection += 1;
      revision += 1;
      refreshRequested = false;
    },
    resume: () => {
      if (enabled) return;
      enabled = true;
      if (pending) refreshRequested = true;
    },
  };
}

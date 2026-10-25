import type { ScanRecord, DiseaseGuideline } from "@/lib/db";
import { nativeRequest } from "@/lib/native-bridge";
import { nativePhotoUrl, type ScanListRecord } from "@/lib/scan-photo";

export type NativeRecord = Omit<ScanRecord, "image_blob"> & {
  photoUri?: string | null;
};
export type SerializedRecord = {
  record: Omit<ScanRecord, "image_blob">;
  image: { base64: string; mimeType: string } | null;
};
export type StorageScope = "reports" | "guidelines" | "all";
const listeners = new Set<{ listener: () => void; scope: StorageScope }>();
let storageRevision = 0;

/** Invalidate only affected readers; an unspecified scope preserves compatibility. */
export function notifyStorageChange(scope: StorageScope = "all") {
  if (scope !== "guidelines") storageRevision++;
  for (const subscription of listeners) {
    if (
      scope !== "all" &&
      subscription.scope !== "all" &&
      subscription.scope !== scope
    )
      continue;
    try {
      subscription.listener();
    } catch {
      /* Storage completion must not depend on a view's listener. */
    }
  }
}

/** Keep report/photo and public-guideline work independent after local commits. */
export function subscribeStorageChange(
  listener: () => void,
  scope: StorageScope = "all",
) {
  const subscription = { listener, scope };
  listeners.add(subscription);
  return () => {
    listeners.delete(subscription);
  };
}

/** Native photos are fetched only from the dedicated private local handler. */
export async function hydrateNativeRecord(
  record: NativeRecord,
): Promise<ScanRecord> {
  const { photoUri, ...metadata } = record;
  let imageBlob = new Blob();
  if (photoUri) {
    const url = nativePhotoUrl(photoUri);
    if (!url) throw new Error("Native photo path is invalid.");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Local photo could not be read.");
    imageBlob = await response.blob();
  }
  return { ...metadata, image_blob: imageBlob };
}

/** Transfer one bounded compressed photo; report lists never contain base64 photos. */
export async function serializeRecord(
  record: ScanRecord,
): Promise<SerializedRecord> {
  const { image_blob: image, ...metadata } = record;
  if (!(image instanceof Blob) || image.size === 0)
    return { record: metadata, image: null };
  if (image.size > 8 * 1024 * 1024)
    throw new Error("Local photo exceeds the supported transfer size.");
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 16_384) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 16_384));
  }
  return {
    record: metadata,
    image: {
      base64: btoa(binary),
      mimeType: image.type || "application/octet-stream",
    },
  };
}

let historyRead: Promise<ScanListRecord[]> | undefined;

/** List metadata only; mounted cards/details read their private photo through an img element. */
async function readNativeHistory() {
  const rows = await nativeRequest<NativeRecord[]>("storage.report.list");
  return rows
    .filter((row) => row._status !== "pending-delete")
    .map((row) => ({
      ...row,
      photoUri: row.photoUri ? nativePhotoUrl(row.photoUri) : null,
    }));
}

/** Collapse concurrent view refreshes; strict save/backup reads still validate their own local photo. */
export function readNativeScans() {
  historyRead ??= (async () => {
    // A consumer joining after a notification must not inherit an older in-flight snapshot.
    let revision: number;
    let rows: ScanListRecord[];
    do {
      revision = storageRevision;
      rows = await readNativeHistory();
    } while (revision !== storageRevision);
    return rows;
  })().finally(() => {
    historyRead = undefined;
  });
  return historyRead;
}

export async function findNativeScan(hash: string, modelVersion: string) {
  const row = await nativeRequest<NativeRecord | null>(
    "storage.report.findByHash",
    { hash, modelVersion },
  );
  return row ? hydrateNativeRecord(row) : undefined;
}

export async function saveNativeScan(record: ScanRecord, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const payload = await serializeRecord(record);
  signal?.throwIfAborted();
  const row = await nativeRequest<NativeRecord>("storage.report.save", payload);
  notifyStorageChange("reports");
  // A cancellation after native commit leaves this prepared ID available for retry.
  signal?.throwIfAborted();
  return hydrateNativeRecord(row);
}

export async function deleteNativeScans(ids: string[]) {
  await nativeRequest("storage.report.delete", { ids });
  notifyStorageChange("reports");
}

export async function readNativeGuidelines() {
  return nativeRequest<DiseaseGuideline[]>("storage.guidelines.get");
}

export async function importNativeRecords(
  records: ScanRecord[],
  guidelines?: DiseaseGuideline[],
) {
  // Commit records separately to keep the bridge payload bounded. Existing IDs are immutable.
  let imported = 0;
  try {
    for (const record of records) {
      const payload = await serializeRecord(record);
      const before = await nativeRequest<NativeRecord | null>(
        "storage.report.get",
        { id: record.id },
      );
      if (before && before.id !== record.id)
        throw new Error("Native import confirmation returned another report.");
      await nativeRequest("storage.import", { records: [payload] });
      const after = await nativeRequest<NativeRecord | null>(
        "storage.report.get",
        { id: record.id },
      );
      if (after && after.id !== record.id)
        throw new Error("Native import confirmation returned another report.");
      // Count the actual visible insertion, not an optional or stale host acknowledgment.
      // A rejected/timed-out import never reaches this check; tombstones remain absent.
      if (!before && after && after._status !== "pending-delete") imported++;
    }
    if (guidelines)
      await nativeRequest("storage.import", { records: [], guidelines });
  } finally {
    // A later conflict must not hide records committed earlier in this import.
    notifyStorageChange(guidelines ? "all" : "reports");
  }
  return imported;
}

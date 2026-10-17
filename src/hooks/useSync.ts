import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { guidelinesClient } from "@/lib/supabase-client";
import { db, type DiseaseGuideline } from "@/lib/db";
import { deleteLocalScans, saveLocalScan } from "@/lib/local-scans";
import {
  createDiagnosticOperation,
  diagnosticErrorName,
  recordDiagnostic,
} from "@/lib/diagnostics";
import {
  createGuidelineSyncManager,
  sameGuidelineSnapshot,
} from "@/lib/guidelines-sync";

const SYNC_RETRY_DELAYS_MS = [10_000, 30_000, 60_000, 300_000];

/** Scan reports stay local; only public treatment guidelines synchronize. */
export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  const [guidelinesSync] = useState(() =>
    createGuidelineSyncManager({
      isOnline: () => typeof navigator !== "undefined" && navigator.onLine,
      readSnapshot: () => db.guidelines.toArray(),
      fetchSnapshot: async () => {
        const operation = createDiagnosticOperation("guidelines");
        recordDiagnostic("guidelines.download.started", { operation });
        try {
          const { data, error } = await guidelinesClient
            .from("guidelines")
            .select("id,disease_name,guidelines_en,guidelines_bis");
          if (error) throw error;
          if (!data) throw new Error("Guideline response has no snapshot.");
          recordDiagnostic("guidelines.download.completed", {
            operation,
            count: data.length,
          });
          return data as DiseaseGuideline[];
        } catch (error) {
          recordDiagnostic("guidelines.download.failed", {
            operation,
            errorName: diagnosticErrorName(error),
          });
          throw error;
        }
      },
      replaceSnapshot: (rows, baseline, canWrite) =>
        db
          .transaction("rw", db.guidelines, async (transaction) => {
            const stored = await db.guidelines.toArray();
            // Another tab may have saved advice while this tab was downloading.
            if (!canWrite() || !sameGuidelineSnapshot(stored, baseline)) {
              return false;
            }
            // An unchanged download is successful; keep the saved advice as is.
            if (sameGuidelineSnapshot(stored, rows)) return true;

            await db.guidelines.clear();
            await db.guidelines.bulkPut(rows);
            // Roll back this snapshot if a notification arrived during saving.
            if (!canWrite()) transaction.abort();
            return true;
          })
          .catch((error) => {
            if (error?.name === "AbortError" && !canWrite()) return false;
            throw error;
          }),
      applyChange: async (change) => {
        if (change.type === "DELETE") {
          await db.guidelines.delete(change.id);
        } else {
          await db.guidelines.put(change.guideline);
        }
      },
      onError: (error) =>
        console.warn("Public guideline synchronization deferred:", error),
    }),
  );
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncRef = useRef<() => Promise<void>>(async () => {});

  const clearScheduledRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (!navigator.onLine || retryTimerRef.current !== null) return;
    const delay =
      SYNC_RETRY_DELAYS_MS[
        Math.min(retryAttemptRef.current, SYNC_RETRY_DELAYS_MS.length - 1)
      ];
    retryAttemptRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      void syncRef.current();
    }, delay);
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    // The manager coalesces overlapping downloads and reconciles Realtime edits.
    // It never needs a guest identity or a private scan request.
    const ready = await guidelinesSync.refresh();
    if (!ready) {
      scheduleRetry();
    } else {
      retryAttemptRef.current = 0;
      clearScheduledRetry();
    }
  }, [clearScheduledRetry, scheduleRetry, guidelinesSync]);

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  useEffect(() => clearScheduledRetry, [clearScheduledRetry]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      clearScheduledRetry();
      retryAttemptRef.current = 0;
      void sync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearScheduledRetry, sync]);

  const deleteScan = useCallback((id: string) => deleteLocalScans([id]), []);

  useEffect(() => {
    if (!isOnline) {
      guidelinesSync.pause();
      clearScheduledRetry();
      return;
    }
    guidelinesSync.resume();
    retryAttemptRef.current = 0;
    const timer = setTimeout(() => void sync(), 0);
    return () => {
      clearTimeout(timer);
      guidelinesSync.pause();
    };
  }, [clearScheduledRetry, guidelinesSync, isOnline, sync]);

  useEffect(() => {
    if (!isOnline) return;
    let active = true;
    const channel = guidelinesClient
      .channel("supabase-realtime-guidelines")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guidelines" },
        async (payload: {
          eventType: string;
          new: Record<string, unknown>;
          old: Record<string, unknown>;
        }) => {
          if (!active) return;
          const { eventType, new: next, old: previous } = payload;
          let saved = true;
          if (eventType === "INSERT" || eventType === "UPDATE") {
            saved = await guidelinesSync.receive({
              type: eventType,
              guideline: {
                id: String(next.id),
                disease_name: String(next.disease_name),
                guidelines_en: String(next.guidelines_en),
                guidelines_bis: String(next.guidelines_bis),
              },
            });
          } else if (eventType === "DELETE") {
            saved = await guidelinesSync.receive({
              type: "DELETE",
              id: String(previous.id),
            });
          }
          if (!saved && active && navigator.onLine) scheduleRetry();
        },
      )
      .subscribe((status) => {
        recordDiagnostic("guidelines.realtime.state", { status });
        // Reconcile edits missed while the Realtime connection was unavailable.
        if (status === "SUBSCRIBED" && active) {
          void guidelinesSync.refresh(true).then((saved) => {
            if (!saved && active && navigator.onLine) scheduleRetry();
          });
        }
      });
    return () => {
      active = false;
      void guidelinesClient.removeChannel(channel);
    };
  }, [guidelinesSync, isOnline, scheduleRetry]);

  return useMemo(
    () => ({
      createScan: saveLocalScan,
      deleteScan,
      deleteScans: deleteLocalScans,
      triggerSync: sync,
    }),
    [deleteScan, sync],
  );
}

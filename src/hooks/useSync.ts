import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { guidelinesClient, supabase } from "@/lib/supabase-client";
import { db, type DiseaseGuideline } from "@/lib/db";
import { modelVersion } from "@/lib/constants";
import { getCloudOwnerId, peekCloudOwnerId } from "@/lib/cloud-session";
import { syncPrivateScans } from "@/lib/cloud-sync";
import {
  createGuidelineSyncManager,
  sameGuidelineSnapshot,
} from "@/lib/guidelines-sync";

const SYNC_RETRY_DELAYS_MS = [10_000, 30_000, 60_000, 300_000];

/** Local saves work immediately; private cloud copies synchronize afterward. */
export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  // This is a local browser label, not proof of cloud ownership.
  const [deviceId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    return id;
  });

  const isSyncingRef = useRef(false);
  const syncRequestedRef = useRef(false);
  const [guidelinesSync] = useState(() =>
    createGuidelineSyncManager({
      isOnline: () => typeof navigator !== "undefined" && navigator.onLine,
      readSnapshot: () => db.guidelines.toArray(),
      fetchSnapshot: async () => {
        const { data, error } = await guidelinesClient
          .from("guidelines")
          .select("id,disease_name,guidelines_en,guidelines_bis");
        if (error) throw error;
        if (!data) throw new Error("Guideline response has no snapshot.");
        return data as DiseaseGuideline[];
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

  const syncGuidelines = useCallback(
    () => guidelinesSync.refresh(),
    [guidelinesSync],
  );

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    // Public guidance starts immediately, even if another cloud task or guest
    // session is stalled. No guest identity is needed to read published advice.
    const guidelinesTask = syncGuidelines();
    if (isSyncingRef.current) {
      syncRequestedRef.current = true;
      return;
    }
    isSyncingRef.current = true;
    let needsRetry = false;
    try {
      const cloudTask = (async () => {
        try {
          const ownerId = await getCloudOwnerId();
          return await syncPrivateScans(ownerId);
        } catch (error) {
          console.warn("Private cloud synchronization deferred:", error);
          return false;
        }
      })();
      const [guidelinesReady, cloudReady] = await Promise.all([
        guidelinesTask,
        cloudTask,
      ]);
      needsRetry = !guidelinesReady || !cloudReady;
    } finally {
      isSyncingRef.current = false;
      if (syncRequestedRef.current && navigator.onLine) {
        syncRequestedRef.current = false;
        setTimeout(() => void syncRef.current(), 0);
      } else if (needsRetry) {
        scheduleRetry();
      } else {
        retryAttemptRef.current = 0;
        clearScheduledRetry();
      }
    }
  }, [clearScheduledRetry, scheduleRetry, syncGuidelines]);

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

  const createScan = useCallback(
    async (
      diseaseName: string,
      confidence: number,
      imageBlob: Blob,
      imageHash?: string,
    ) => {
      const scanId = crypto.randomUUID();
      await db.scans.add({
        id: scanId,
        cloud_id: scanId,
        owner_id: peekCloudOwnerId(),
        disease_name: diseaseName,
        confidence,
        image_blob: imageBlob,
        image_url: null,
        image_hash: imageHash,
        model_version: modelVersion,
        updated_at: new Date().toISOString(),
        device_id: deviceId,
        _status: "pending-insert",
      });
      // No Auth or cloud operation is awaited before returning the local result.
      if (navigator.onLine) void sync();
    },
    [deviceId, sync],
  );

  const deleteScans = useCallback(
    async (ids: string[]) => {
      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length === 0) return;

      // Read and change the selected rows in one transaction. An upload cannot
      // claim an unowned row between this ownership check and its deletion.
      const changed = await db.transaction("rw", db.scans, async () => {
        const scans = await db.scans.bulkGet(uniqueIds);
        const localIds: string[] = [];
        const ownedIds: string[] = [];
        for (const scan of scans) {
          if (!scan) continue;
          if (scan._status === "local-only" || !scan.owner_id) {
            localIds.push(scan.id);
          } else if (scan._status !== "pending-delete") {
            // A claimed photo may already be uploading. Keep its hidden row
            // until the existing sync queue removes the cloud row and photo.
            ownedIds.push(scan.id);
          }
        }

        if (localIds.length > 0) await db.scans.bulkDelete(localIds);
        if (ownedIds.length > 0) {
          const updatedAt = new Date().toISOString();
          await db.scans.bulkUpdate(
            ownedIds.map((id) => ({
              key: id,
              changes: {
                _status: "pending-delete" as const,
                updated_at: updatedAt,
              },
            })),
          );
        }
        return localIds.length + ownedIds.length > 0;
      });
      // One request serves the whole batch; offline deletions remain queued.
      if (changed && navigator.onLine) void sync();
    },
    [sync],
  );

  const deleteScan = useCallback(
    (id: string) => deleteScans([id]),
    [deleteScans],
  );

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
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED") return;
      // Never await Auth inside its callback: the SDK holds a session lock.
      setTimeout(() => {
        if (navigator.onLine) void syncRef.current();
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
    () => ({ createScan, deleteScan, deleteScans, triggerSync: sync }),
    [createScan, deleteScan, deleteScans, sync],
  );
}

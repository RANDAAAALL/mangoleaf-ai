import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { db, type ScanRecord } from "@/lib/db";
import type { RealtimeChannel } from "@supabase/supabase-js";

const SYNC_RETRY_DELAYS_MS = [10_000, 30_000, 60_000, 300_000];

/**
 * Keeps scan data local-first and reconciles pending changes with Supabase
 * whenever the browser is online.
 */
export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  // Read once from localStorage, or generated there on first run. Identifies
  // this browser so a scan can be tied to it without any account or login.
  const [deviceId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    return id;
  });

  // Held so the channel can be removed on disconnect or unmount.
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Lock so two syncs never run at once on a slow 3G connection.
  const isSyncingRef = useRef<boolean>(false);
  const syncRequestedRef = useRef(false);
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
    if (
      typeof navigator === "undefined" ||
      !navigator.onLine ||
      retryTimerRef.current !== null
    ) {
      return;
    }

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

  // Handle online tracking
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

  // Push pending local changes: upload each image, then insert its row.
  const flushLocalMutations = useCallback(async (): Promise<boolean> => {
    try {
      const pendingScans = await db.scans
        .where("_status")
        .anyOf(["pending-insert", "pending-delete"])
        .toArray();

      if (pendingScans.length === 0) return false;

      for (const scan of pendingScans) {
        if (scan._status === "pending-insert") {
          let uploadedUrl = scan.image_url;

          // 1. Upload the photo bytes if they are not in Storage yet
          if (!uploadedUrl) {
            // The extension has to match what the compressor actually produced
            const isWebP = scan.image_blob.type === "image/webp";
            const fileName = `${scan.id}.${isWebP ? "webp" : "jpg"}`;

            try {
              const { error: uploadError } = await supabase.storage
                .from("scans")
                .upload(fileName, scan.image_blob, {
                  contentType: scan.image_blob.type || "image/jpeg",
                  upsert: true,
                });

              if (uploadError) {
                console.error(
                  "Error uploading image file:",
                  uploadError.message,
                );
                continue; // No image means there is no row worth inserting
              }
            } catch {
              console.warn(
                "---Upload timed out on slow 3G — will retry next sync.---",
              );
              continue; // Stays pending-insert, picked up by the next sync
            }

            // 2. Read back the public URL of the uploaded file
            const { data } = supabase.storage
              .from("scans")
              .getPublicUrl(fileName);
            uploadedUrl = data.publicUrl;

            // Save the URL before inserting the row. If the insert then fails,
            // the retry reuses this upload instead of sending the bytes again.
            await db.scans.update(scan.id, { image_url: uploadedUrl });
          }

          // 3. Insert the scan row in the Supabase table
          const { error: dbError } = await supabase.from("scans").insert({
            id: scan.id,
            disease_name: scan.disease_name,
            confidence: scan.confidence,
            image_url: uploadedUrl,
            image_hash: scan.image_hash || null,
            device_id: scan.device_id,
            updated_at: scan.updated_at,
          });

          if (!dbError) {
            // Mark the local copy as synced
            await db.scans.update(scan.id, {
              image_url: uploadedUrl,
              _status: "synced",
            });
          } else {
            console.error("Error inserting scan record row:", dbError.message);
          }
        } else if (scan._status === "pending-delete") {
          // 4. Remove the row from the Supabase scans table
          const { error: dbError } = await supabase
            .from("scans")
            .delete()
            .eq("id", scan.id);

          // PGRST116 means the row was already gone, which is the outcome wanted
          if (!dbError || dbError.code === "PGRST116") {
            await db.scans.delete(scan.id);
            // The extension is unknown here, so clear both candidates
            await supabase.storage
              .from("scans")
              .remove([`${scan.id}.webp`, `${scan.id}.jpg`]);
          } else {
            console.error("Error deleting scan record row:", dbError.message);
          }
        }
      }

      return (
        (await db.scans
          .where("_status")
          .anyOf(["pending-insert", "pending-delete"])
          .count()) > 0
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error flushing scans mutations:", msg);
      return true;
    }
  }, []);

  // Pull from Supabase: treatment guidelines, and this device's own scan history
  const pullRemoteChanges = useCallback(async (): Promise<boolean> => {
    if (!deviceId) return true;
    try {
      // 1. Guidelines, which are written on the server side
      const { data: remoteGuidelines, error: guidelinesError } = await supabase
        .from("guidelines")
        .select("id,disease_name,guidelines_en,guidelines_bis");

      if (guidelinesError) throw guidelinesError;
      if (remoteGuidelines) {
        const guidelinesToPut = remoteGuidelines.map((rGuideline) => ({
          id: rGuideline.id,
          disease_name: rGuideline.disease_name,
          guidelines_en: rGuideline.guidelines_en,
          guidelines_bis: rGuideline.guidelines_bis,
        }));
        await db.guidelines.bulkPut(guidelinesToPut);
      }

      // 2. This device's scans, so history survives a reinstall or cleared storage
      const { data: remoteScans, error: scansError } = await supabase
        .from("scans")
        .select(
          "id,disease_name,confidence,image_url,image_hash,updated_at,device_id",
        )
        .eq("device_id", deviceId);

      if (scansError) throw scansError;
      if (remoteScans) {
        const localScans = await db.scans.bulkGet(
          remoteScans.map((scan) => scan.id),
        );
        const scansToPut: ScanRecord[] = remoteScans.flatMap((rScan, index) =>
          localScans[index]
            ? []
            : [
                {
                  id: rScan.id,
                  disease_name: rScan.disease_name,
                  confidence: rScan.confidence,
                  image_blob: new Blob(), // Empty: the photo is served from image_url
                  image_url: rScan.image_url,
                  image_hash: rScan.image_hash || undefined,
                  updated_at: rScan.updated_at,
                  device_id: rScan.device_id,
                  _status: "synced",
                },
              ],
        );
        if (scansToPut.length > 0) {
          await db.scans.bulkPut(scansToPut);
        }
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error pulling remote changes:", msg);
      return false;
    }
  }, [deviceId]);

  // Push first, then pull
  const sync = useCallback(async () => {
    if (!navigator.onLine) return;

    // A sync is already running. Flag it and return, so triggers do not stack
    // up on a slow connection.
    if (isSyncingRef.current) {
      syncRequestedRef.current = true;
      console.log(
        "---Sync already in progress — skipping duplicate trigger.---",
      );
      return;
    }

    isSyncingRef.current = true;

    let needsRetry = false;

    try {
      const hasPendingMutations = await flushLocalMutations();
      const pulledRemoteChanges = await pullRemoteChanges();
      needsRetry = hasPendingMutations || !pulledRemoteChanges;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error synchronizing data:", msg);
      needsRetry = true;
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
  }, [
    clearScheduledRetry,
    flushLocalMutations,
    pullRemoteChanges,
    scheduleRetry,
  ]);

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  useEffect(() => {
    return clearScheduledRetry;
  }, [clearScheduledRetry]);

  // Background timers are throttled on mobile. Reconcile immediately when the
  // user returns to an online app instead of waiting for a delayed retry timer.
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

  // Saved locally first, so a scan is never lost when the network is not there
  const createScan = useCallback(
    async (
      diseaseName: string,
      confidence: number,
      imageBlob: Blob,
      imageHash?: string,
    ) => {
      const scanId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const newScan: ScanRecord = {
        id: scanId,
        disease_name: diseaseName,
        confidence: confidence,
        image_blob: imageBlob,
        image_url: null,
        image_hash: imageHash,
        updated_at: timestamp,
        device_id: deviceId,
        _status: "pending-insert",
      };

      await db.scans.add(newScan);

      if (navigator.onLine) {
        void sync();
      }
    },
    [sync, deviceId],
  );

  // A scan that never reached Supabase can go immediately; one that did is
  // marked pending-delete so the server row is removed on the next sync.
  const deleteScan = useCallback(
    async (id: string) => {
      const localScan = await db.scans.get(id);
      if (!localScan) return;

      if (localScan._status === "pending-insert") {
        await db.scans.delete(id);
      } else {
        await db.scans.update(id, {
          _status: "pending-delete",
          updated_at: new Date().toISOString(),
        });

        if (navigator.onLine) {
          void sync();
        }
      }
    },
    [sync],
  );

  // Sync as soon as the network returns or the device ID becomes available
  useEffect(() => {
    if (!isOnline) {
      clearScheduledRetry();
      return;
    }

    if (deviceId) {
      retryAttemptRef.current = 0;
      const timer = setTimeout(() => {
        void sync();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [clearScheduledRetry, isOnline, deviceId, sync]);

  // Realtime channel: a guideline edited on the server reaches the device
  // without waiting for the next sync.
  useEffect(() => {
    if (!isOnline || !deviceId) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    console.log("---Subscribing to Supabase Realtime guidelines channel...---");
    const channel = supabase
      .channel("supabase-realtime-guidelines")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guidelines" },
        async (payload: {
          eventType: string;
          new: Record<string, unknown>;
          old: Record<string, unknown>;
        }) => {
          console.log("---Realtime Postgres change detected---", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            await db.guidelines.put({
              id: String(newRecord.id),
              disease_name: String(newRecord.disease_name),
              guidelines_en: String(newRecord.guidelines_en),
              guidelines_bis: String(newRecord.guidelines_bis),
            });
          } else if (eventType === "DELETE") {
            await db.guidelines.delete(String(oldRecord.id));
          }
        },
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [isOnline, deviceId]);

  return useMemo(
    () => ({
      createScan,
      deleteScan,
      triggerSync: sync,
    }),
    [createScan, deleteScan, sync],
  );
}

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { db, type ScanRecord } from "@/lib/db";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Keeps scan data local-first and reconciles pending changes with Supabase
 * whenever the browser is online.
 */
export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Initialize device ID lazily from localStorage
  const [deviceId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    return id;
  });

  // Retain the active Realtime channel so it can be removed on disconnect or unmount.
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Sync lock: prevents concurrent sync operations from stacking on slow 3G networks
  const isSyncingRef = useRef<boolean>(false);

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

  // Flush local pending changes (Upload Images to Storage, then Insert DB Rows)
  const flushLocalMutations = useCallback(async () => {
    try {
      const pendingScans = await db.scans
        .where('_status').anyOf(['pending-insert', 'pending-delete'])
        .toArray();

      if (pendingScans.length === 0) return;

      for (const scan of pendingScans) {
        if (scan._status === "pending-insert") {
          let uploadedUrl = scan.image_url;

          // 1. If not uploaded yet, upload binary Blob to Supabase Storage Bucket
          if (!uploadedUrl) {
            // Dynamic file extension based on compressed format (WebP or JPEG fallback)
            const isWebP = scan.image_blob.type === "image/webp";
            const fileName = `${scan.id}.${isWebP ? "webp" : "jpg"}`;

            // 3G Safety: Abort upload if it takes longer than 10 seconds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10_000);

            try {
              const { error: uploadError } = await supabase.storage
                .from("scans")
                .upload(fileName, scan.image_blob, {
                  contentType: scan.image_blob.type || "image/jpeg",
                  upsert: true,
                  // @ts-expect-error -- Supabase JS v2 supports signal via fetch options
                  signal: controller.signal,
                });

              clearTimeout(timeoutId);

              if (uploadError) {
                console.error("Error uploading image file:", uploadError.message);
                continue; // Skip database row insertion if image upload fails
              }
            } catch (_abortErr) {
              clearTimeout(timeoutId);
              console.warn("⏱️ Upload timed out on slow 3G — will retry next sync.");
              continue; // Skip this scan, it stays as pending-insert for next retry
            }

            // 2. Fetch the uploaded file's public URL
            const { data } = supabase.storage.from("scans").getPublicUrl(fileName);
            uploadedUrl = data.publicUrl;
          }

          // 3. Insert the text log row in the Supabase Database table
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
            // Update local database record as synced
            await db.scans.update(scan.id, {
              image_url: uploadedUrl,
              _status: "synced",
            });
          } else {
            console.error("Error inserting scan record row:", dbError.message);
          }
        } else if (scan._status === "pending-delete") {
          // 4. Delete the row from the Supabase scans table
          const { error: dbError } = await supabase
            .from("scans")
            .delete()
            .eq("id", scan.id);

          if (!dbError || dbError.code === "PGRST116") {
            // Delete from local IndexedDB
            await db.scans.delete(scan.id);
            // Clean up storage bucket (try both WebP and JPEG extensions)
            await supabase.storage.from("scans").remove([`${scan.id}.webp`, `${scan.id}.jpg`]);
          } else {
            console.error("Error deleting scan record row:", dbError.message);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error flushing scans mutations:", msg);
    }
  }, []);

  // Pull latest data from Supabase (Guidelines & Scan History restoration)
  const pullRemoteChanges = useCallback(async () => {
    if (!deviceId) return;
    try {
      // 1. Pull the pre-written guidelines from Supabase
      const { data: remoteGuidelines, error: guidelinesError } = await supabase
        .from("guidelines")
        .select("*");

      if (guidelinesError) throw guidelinesError;
      if (remoteGuidelines) {
        const guidelinesToPut = remoteGuidelines.map(rGuideline => ({
          id: rGuideline.id,
          disease_name: rGuideline.disease_name,
          guidelines_en: rGuideline.guidelines_en,
          guidelines_bis: rGuideline.guidelines_bis,
          color: rGuideline.color,
        }));
        await db.guidelines.bulkPut(guidelinesToPut);
      }

      // 2. Pull own Scans to restore local history
      const { data: remoteScans, error: scansError } = await supabase
        .from("scans")
        .select("*")
        .eq("device_id", deviceId);

      if (scansError) throw scansError;
      if (remoteScans) {
        const scansToPut: ScanRecord[] = [];
        for (const rScan of remoteScans) {
          const local = await db.scans.get(rScan.id);
          if (!local) {
            scansToPut.push({
              id: rScan.id,
              disease_name: rScan.disease_name,
              confidence: rScan.confidence,
              image_blob: new Blob(), // Empty placeholder for synced remote scans
              image_url: rScan.image_url,
              image_hash: rScan.image_hash || undefined,
              updated_at: rScan.updated_at,
              device_id: rScan.device_id,
              _status: "synced",
            });
          }
        }
        if (scansToPut.length > 0) {
          await db.scans.bulkPut(scansToPut);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error pulling remote changes:", msg);
      setSyncError(msg);
    }
  }, [deviceId]);

  // Main synchronization routine
  const sync = useCallback(async () => {
    if (!navigator.onLine) return;

    // 3G Safety: Prevent concurrent sync operations from stacking
    if (isSyncingRef.current) {
      console.log("🔒 Sync already in progress — skipping duplicate trigger.");
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      await flushLocalMutations();
      await pullRemoteChanges();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [flushLocalMutations, pullRemoteChanges]);

  // Create a new scan record (saved locally first, retries sync if online)
  const createScan = useCallback(
    async (diseaseName: string, confidence: number, imageBlob: Blob, imageHash?: string) => {
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
        sync();
      }
    },
    [sync, deviceId]
  );

  // Delete scan history record
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
          sync();
        }
      }
    },
    [sync]
  );

  // Auto-sync when network reconnects or device ID loads
  useEffect(() => {
    if (isOnline && deviceId) {
      const timer = setTimeout(() => {
        sync();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOnline, deviceId, sync]);

  // Real-time WebSocket connection to listen to database guidelines updates
  useEffect(() => {
    if (!isOnline || !deviceId) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    console.log("🔌 Subscribing to Supabase Realtime guidelines channel...");
    const channel = supabase
      .channel("supabase-realtime-guidelines")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guidelines" },
        async (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          console.log("⚡ Realtime Postgres change detected:", payload);
          const { eventType, new: newRecord } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            await db.guidelines.put({
              id: String(newRecord.id),
              disease_name: String(newRecord.disease_name),
              guidelines_en: String(newRecord.guidelines_en),
              guidelines_bis: String(newRecord.guidelines_bis),
              color: (newRecord.color as "yellow" | "pink" | "blue" | "green" | "purple") || "yellow",
            });
          }
        }
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

  return useMemo(() => ({
    isOnline,
    isSyncing,
    syncError,
    deviceId,
    createScan,
    deleteScan,
    triggerSync: sync,
  }), [isOnline, isSyncing, syncError, deviceId, createScan, deleteScan, sync]);
}

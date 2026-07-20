import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { db, type ScanRecord, type DiseaseGuideline } from "@/lib/db";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Initialize device ID from localStorage and handle online tracking
  useEffect(() => {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    setDeviceId(id);

    setIsOnline(navigator.onLine);
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
        .filter((scan) => scan._status !== undefined && scan._status !== "synced")
        .toArray();

      if (pendingScans.length === 0) return;

      for (const scan of pendingScans) {
        if (scan._status === "pending-insert") {
          let uploadedUrl = scan.image_url;

          // 1. If not uploaded yet, upload binary Blob to Supabase Storage Bucket
          if (!uploadedUrl) {
            const fileName = `${scan.id}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("scans")
              .upload(fileName, scan.image_blob, {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (uploadError) {
              console.error("Error uploading image file:", uploadError.message);
              continue; // Skip database row insertion if image upload fails
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
            // Optionally clean up storage bucket
            const fileName = `${scan.id}.jpg`;
            await supabase.storage.from("scans").remove([fileName]);
          } else {
            console.error("Error deleting scan record row:", dbError.message);
          }
        }
      }
    } catch (err: any) {
      console.error("Error flushing scans mutations:", err.message);
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
        for (const rGuideline of remoteGuidelines) {
          await db.guidelines.put({
            id: rGuideline.id,
            disease_name: rGuideline.disease_name,
            guidelines_en: rGuideline.guidelines_en,
            guidelines_bis: rGuideline.guidelines_bis,
            color: rGuideline.color,
          });
        }
      }

      // 2. Pull own Scans to restore local history
      const { data: remoteScans, error: scansError } = await supabase
        .from("scans")
        .select("*")
        .eq("device_id", deviceId);

      if (scansError) throw scansError;
      if (remoteScans) {
        for (const rScan of remoteScans) {
          const local = await db.scans.get(rScan.id);
          if (!local) {
            await db.scans.add({
              id: rScan.id,
              disease_name: rScan.disease_name,
              confidence: rScan.confidence,
              image_blob: new Blob(), // Empty placeholder for synced remote scans
              image_url: rScan.image_url,
              updated_at: rScan.updated_at,
              device_id: rScan.device_id,
              _status: "synced",
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Error pulling remote changes:", err.message);
      setSyncError(err.message);
    }
  }, [deviceId]);

  // Main synchronization routine
  const sync = useCallback(async () => {
    if (!navigator.onLine) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      await flushLocalMutations();
      await pullRemoteChanges();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [flushLocalMutations, pullRemoteChanges]);

  // Create a new scan record (saved locally first, retries sync if online)
  const createScan = useCallback(
    async (diseaseName: string, confidence: number, imageBlob: Blob) => {
      const scanId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const newScan: ScanRecord = {
        id: scanId,
        disease_name: diseaseName,
        confidence: confidence,
        image_blob: imageBlob,
        image_url: null,
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
      sync();
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

    const channel = supabase
      .channel("supabase-realtime-guidelines")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guidelines" },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            await db.guidelines.put({
              id: newRecord.id,
              disease_name: newRecord.disease_name,
              guidelines_en: newRecord.guidelines_en,
              guidelines_bis: newRecord.guidelines_bis,
              color: newRecord.color,
            });
          } else if (eventType === "DELETE") {
            await db.guidelines.delete(oldRecord.id);
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

  return {
    isOnline,
    isSyncing,
    syncError,
    deviceId,
    createScan,
    deleteScan,
    triggerSync: sync,
  };
}

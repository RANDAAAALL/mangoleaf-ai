import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { db, Note } from "@/lib/db";
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

  // Flush local pending changes to Supabase (Only Private Notes are flushed)
  const flushLocalMutations = useCallback(async () => {
    try {
      const pendingNotes = await db.notes
        .filter((note) => note._status !== undefined && note._status !== "synced")
        .toArray();

      if (pendingNotes.length === 0) return;

      for (const note of pendingNotes) {
        // Enforce that clients can only sync notes belonging to their device ID
        if (note.device_id === null || note.device_id !== deviceId) {
          continue; 
        }

        if (note._status === "pending-insert") {
          const { error } = await supabase.from("notes").insert({
            id: note.id,
            title: note.title,
            content: note.content,
            color: note.color,
            updated_at: note.updated_at,
            device_id: note.device_id,
          });

          if (!error) {
            await db.notes.update(note.id, { _status: "synced" });
          } else {
            console.error("Error syncing pending-insert note:", error.message);
          }
        } else if (note._status === "pending-update") {
          const { error } = await supabase
            .from("notes")
            .update({
              title: note.title,
              content: note.content,
              color: note.color,
              updated_at: note.updated_at,
              device_id: note.device_id,
            })
            .eq("id", note.id);

          if (!error) {
            await db.notes.update(note.id, { _status: "synced" });
          } else {
            console.error("Error syncing pending-update note:", error.message);
          }
        } else if (note._status === "pending-delete") {
          const { error } = await supabase.from("notes").delete().eq("id", note.id);

          if (!error || error.code === "PGRST116") {
            await db.notes.delete(note.id);
          } else {
            console.error("Error syncing pending-delete note:", error.message);
          }
        }
      }
    } catch (err: any) {
      console.error("Error flushing mutations:", err.message);
    }
  }, [deviceId]);

  // Pull latest data from Supabase and merge
  const pullRemoteChanges = useCallback(async () => {
    if (!deviceId) return;
    try {
      const { data: remoteNotes, error } = await supabase
        .from("notes")
        .select("*")
        .or(`device_id.is.null,device_id.eq.${deviceId}`);

      if (error) throw error;
      if (!remoteNotes) return;

      const remoteIds = new Set(remoteNotes.map((n) => n.id));

      for (const remote of remoteNotes) {
        const local = await db.notes.get(remote.id);

        if (!local) {
          await db.notes.add({
            id: remote.id,
            title: remote.title,
            content: remote.content,
            color: remote.color as any,
            updated_at: remote.updated_at,
            device_id: remote.device_id,
            _status: "synced",
          });
        } else {
          if (local._status === "synced") {
            if (new Date(remote.updated_at) > new Date(local.updated_at)) {
              await db.notes.update(remote.id, {
                title: remote.title,
                content: remote.content,
                color: remote.color as any,
                updated_at: remote.updated_at,
                device_id: remote.device_id,
              });
            }
          } else {
            if (new Date(remote.updated_at) > new Date(local.updated_at)) {
              await db.notes.update(remote.id, {
                title: remote.title,
                content: remote.content,
                color: remote.color as any,
                updated_at: remote.updated_at,
                device_id: remote.device_id,
                _status: "synced",
              });
            }
          }
        }
      }

      const localNotes = await db.notes.toArray();
      for (const local of localNotes) {
        const isWithinScope = local.device_id === null || local.device_id === deviceId;
        if (isWithinScope && !remoteIds.has(local.id) && local._status === "synced") {
          await db.notes.delete(local.id);
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

  // Handle local mutations (All new notes created on client are private by default)
  const createNote = useCallback(
    async (title: string, content?: string, color: Note["color"] = "yellow") => {
      const noteId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const newNote: Note = {
        id: noteId,
        title,
        content,
        color,
        updated_at: timestamp,
        device_id: deviceId, // Always bind client-created notes to device ID
        _status: "pending-insert",
      };

      await db.notes.add(newNote);

      if (navigator.onLine) {
        sync();
      }
    },
    [sync, deviceId]
  );

  const editNote = useCallback(
    async (id: string, title: string, content?: string, color?: Note["color"]) => {
      const timestamp = new Date().toISOString();

      const localNote = await db.notes.get(id);
      if (!localNote || localNote.device_id === null) return; // Prevent editing read-only global notes

      await db.notes.update(id, {
        title,
        content,
        color: color || localNote.color,
        updated_at: timestamp,
        _status: localNote._status === "pending-insert" ? "pending-insert" : "pending-update",
      });

      if (navigator.onLine) {
        sync();
      }
    },
    [sync]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const localNote = await db.notes.get(id);
      if (!localNote || localNote.device_id === null) return; // Prevent deleting read-only global notes

      if (localNote._status === "pending-insert") {
        await db.notes.delete(id);
      } else {
        await db.notes.update(id, {
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

  // Automatically trigger sync when network reconnects or device ID loads
  useEffect(() => {
    if (isOnline && deviceId) {
      sync();
    }
  }, [isOnline, deviceId, sync]);

  // Setup validated Supabase Realtime WebSocket listener
  useEffect(() => {
    if (!isOnline || !deviceId) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel("supabase-realtime-notes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            // Ignore updates to other devices' private records
            if (newRecord.device_id !== null && newRecord.device_id !== deviceId) {
              return;
            }

            // Validation Check: See if it exists locally in IndexedDB
            const local = await db.notes.get(newRecord.id);

            if (!local) {
              // 1. If it DOES NOT exist locally, fetch it fresh from Supabase to validate
              const { data: verifiedRecord, error } = await supabase
                .from("notes")
                .select("*")
                .eq("id", newRecord.id)
                .single();

              if (!error && verifiedRecord) {
                await db.notes.add({
                  id: verifiedRecord.id,
                  title: verifiedRecord.title,
                  content: verifiedRecord.content,
                  color: verifiedRecord.color as any,
                  updated_at: verifiedRecord.updated_at,
                  device_id: verifiedRecord.device_id,
                  _status: "synced",
                });
              }
            } else {
              // 2. If it ALREADY exists, protect local offline edits (pending sync)
              if (local._status === "synced") {
                // Only overwrite if the incoming server update is newer than our local cache
                if (new Date(newRecord.updated_at) > new Date(local.updated_at)) {
                  await db.notes.update(newRecord.id, {
                    title: newRecord.title,
                    content: newRecord.content,
                    color: newRecord.color,
                    updated_at: newRecord.updated_at,
                    device_id: newRecord.device_id,
                  });
                }
              }
            }
          } else if (eventType === "DELETE") {
            const local = await db.notes.get(oldRecord.id);
            // Only delete locally if it was already synced (protects offline deletes from colliding)
            if (local && local._status === "synced") {
              await db.notes.delete(oldRecord.id);
            }
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
    createNote,
    editNote,
    deleteNote,
    triggerSync: sync,
  };
}

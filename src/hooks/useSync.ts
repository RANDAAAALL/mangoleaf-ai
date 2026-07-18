import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { db, Task } from "@/lib/db";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Helper to check online status safely on client-side
  useEffect(() => {
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

  // Flush local pending changes to Supabase
  const flushLocalMutations = useCallback(async () => {
    try {
      const pendingTasks = await db.tasks
        .filter((task) => task._status !== undefined && task._status !== "synced")
        .toArray();

      if (pendingTasks.length === 0) return;

      for (const task of pendingTasks) {
        if (task._status === "pending-insert") {
          const { error } = await supabase.from("tasks").insert({
            id: task.id,
            title: task.title,
            description: task.description,
            is_completed: task.is_completed,
            updated_at: task.updated_at,
          });

          if (!error) {
            await db.tasks.update(task.id, { _status: "synced" });
          } else {
            console.error("Error syncing pending-insert task:", error.message);
          }
        } else if (task._status === "pending-update") {
          const { error } = await supabase
            .from("tasks")
            .update({
              title: task.title,
              description: task.description,
              is_completed: task.is_completed,
              updated_at: task.updated_at,
            })
            .eq("id", task.id);

          if (!error) {
            await db.tasks.update(task.id, { _status: "synced" });
          } else {
            console.error("Error syncing pending-update task:", error.message);
          }
        } else if (task._status === "pending-delete") {
          const { error } = await supabase.from("tasks").delete().eq("id", task.id);

          if (!error || error.code === "PGRST116") {
            // Delete from local DB if remote delete was successful or not found (PGRST116)
            await db.tasks.delete(task.id);
          } else {
            console.error("Error syncing pending-delete task:", error.message);
          }
        }
      }
    } catch (err: any) {
      console.error("Error flushing mutations:", err.message);
    }
  }, []);

  // Pull latest data from Supabase and merge
  const pullRemoteChanges = useCallback(async () => {
    try {
      const { data: remoteTasks, error } = await supabase
        .from("tasks")
        .select("*");

      if (error) throw error;
      if (!remoteTasks) return;

      const remoteIds = new Set(remoteTasks.map((t) => t.id));

      // Handle server updates / insertions
      for (const remote of remoteTasks) {
        const local = await db.tasks.get(remote.id);

        if (!local) {
          // If not in Dexie, insert as synced
          await db.tasks.add({
            id: remote.id,
            title: remote.title,
            description: remote.description,
            is_completed: remote.is_completed,
            updated_at: remote.updated_at,
            _status: "synced",
          });
        } else {
          // Conflict resolution: Server Wins if server is newer or local is marked synced
          if (local._status === "synced") {
            if (new Date(remote.updated_at) > new Date(local.updated_at)) {
              await db.tasks.update(remote.id, {
                title: remote.title,
                description: remote.description,
                is_completed: remote.is_completed,
                updated_at: remote.updated_at,
              });
            }
          } else {
            // Local change exists but we are resolving.
            // If local was updated later than server, we'll keep local (will be flushed on next sync).
            // Otherwise, overwrite with server.
            if (new Date(remote.updated_at) > new Date(local.updated_at)) {
              await db.tasks.update(remote.id, {
                title: remote.title,
                description: remote.description,
                is_completed: remote.is_completed,
                updated_at: remote.updated_at,
                _status: "synced", // Resolve conflict in favor of server
              });
            }
          }
        }
      }

      // Delete local items that were deleted from Supabase (unless pending local insert)
      const localTasks = await db.tasks.toArray();
      for (const local of localTasks) {
        if (!remoteIds.has(local.id) && local._status === "synced") {
          await db.tasks.delete(local.id);
        }
      }
    } catch (err: any) {
      console.error("Error pulling remote changes:", err.message);
      setSyncError(err.message);
    }
  }, []);

  // Main synchronization routine
  const sync = useCallback(async () => {
    if (!navigator.onLine) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // 1. Flush local changes to remote
      await flushLocalMutations();
      // 2. Fetch latest changes from remote
      await pullRemoteChanges();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [flushLocalMutations, pullRemoteChanges]);

  // Handle local mutations (add/update/delete wrapper)
  const createTask = useCallback(async (title: string, description?: string) => {
    const taskId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newTask: Task = {
      id: taskId,
      title,
      description,
      is_completed: false,
      updated_at: timestamp,
      _status: "pending-insert",
    };

    // 1. Save to local IndexedDB (source of truth)
    await db.tasks.add(newTask);

    // 2. Try online sync immediately
    if (navigator.onLine) {
      sync();
    }
  }, [sync]);

  const toggleTask = useCallback(async (id: string, is_completed: boolean) => {
    const timestamp = new Date().toISOString();

    const localTask = await db.tasks.get(id);
    if (!localTask) return;

    // 1. Update local database
    await db.tasks.update(id, {
      is_completed,
      updated_at: timestamp,
      _status: localTask._status === "pending-insert" ? "pending-insert" : "pending-update",
    });

    // 2. Try online sync immediately
    if (navigator.onLine) {
      sync();
    }
  }, [sync]);

  const editTask = useCallback(async (id: string, title: string, description?: string) => {
    const timestamp = new Date().toISOString();

    const localTask = await db.tasks.get(id);
    if (!localTask) return;

    // 1. Update local database
    await db.tasks.update(id, {
      title,
      description,
      updated_at: timestamp,
      _status: localTask._status === "pending-insert" ? "pending-insert" : "pending-update",
    });

    // 2. Try online sync immediately
    if (navigator.onLine) {
      sync();
    }
  }, [sync]);

  const deleteTask = useCallback(async (id: string) => {
    const localTask = await db.tasks.get(id);
    if (!localTask) return;

    if (localTask._status === "pending-insert") {
      // If never uploaded to server, simply delete locally
      await db.tasks.delete(id);
    } else {
      // Mark as pending-delete so it doesn't show in lists, but we sync it
      await db.tasks.update(id, {
        _status: "pending-delete",
        updated_at: new Date().toISOString(),
      });

      if (navigator.onLine) {
        sync();
      }
    }
  }, [sync]);

  // Automatically trigger sync when network reconnects
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  // Setup Supabase Realtime channel connection when online
  useEffect(() => {
    if (!isOnline) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    // Subscribe to realtime changes on tasks table
    const channel = supabase
      .channel("supabase-realtime-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            const local = await db.tasks.get(newRecord.id);

            // If we have local pending changes, let's keep them (handled during full sync)
            if (local && local._status !== "synced") return;

            await db.tasks.put({
              id: newRecord.id,
              title: newRecord.title,
              description: newRecord.description,
              is_completed: newRecord.is_completed,
              updated_at: newRecord.updated_at,
              _status: "synced",
            });
          } else if (eventType === "DELETE") {
            const local = await db.tasks.get(oldRecord.id);
            if (local && local._status === "synced") {
              await db.tasks.delete(oldRecord.id);
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
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    syncError,
    createTask,
    toggleTask,
    editTask,
    deleteTask,
    triggerSync: sync,
  };
}

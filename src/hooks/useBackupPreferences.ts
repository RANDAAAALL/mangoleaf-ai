"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { backupPreferences } from "@/lib/cloud-backup";
import type { BackupPreferences } from "@/lib/backup-status";

/** One mounted Settings controller shares local status; reading it never creates an owner. */
export function useBackupPreferences(enabled: boolean) {
  const [value, setValue] = useState<BackupPreferences | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(enabled);
  const mounted = useRef(false);
  const pending = useRef<Promise<BackupPreferences | null> | null>(null);

  const refresh = useCallback((): Promise<BackupPreferences | null> => {
    if (!enabled || !mounted.current) return Promise.resolve(null);
    if (pending.current) return pending.current;
    setRefreshing(true);
    const request = Promise.resolve()
      .then(backupPreferences)
      .then((preferences) => {
        if (mounted.current && pending.current === request) {
          setValue(preferences);
          setFailed(false);
        }
        return preferences;
      })
      .catch(() => {
        if (mounted.current && pending.current === request) setFailed(true);
        return null;
      })
      .finally(() => {
        if (pending.current !== request) return;
        pending.current = null;
        if (mounted.current) setRefreshing(false);
      });
    pending.current = request;
    return request;
  }, [enabled]);

  const refreshAfterChange = useCallback(async () => {
    // A read begun before a mutation cannot certify the newly saved On/Pause choice.
    await pending.current;
    return refresh();
  }, [refresh]);

  useEffect(() => {
    mounted.current = enabled;
    if (enabled) void refresh();
    return () => {
      mounted.current = false;
      pending.current = null;
    };
  }, [enabled, refresh]);

  return { value, failed, refreshing, refresh, refreshAfterChange };
}

export type BackupPreferencesController = ReturnType<
  typeof useBackupPreferences
>;

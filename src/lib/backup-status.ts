import type { backupPreferences } from "@/lib/cloud-backup";

export type BackupPreferences = Awaited<ReturnType<typeof backupPreferences>>;

/** Keep the Settings summary and backup page consistent without starting extra reads. */
export function backupStatusKey(
  preferences: BackupPreferences | null,
  failed: boolean,
  online: boolean,
) {
  if (failed) return "backupStatusError";
  if (!preferences) return "backupChecking";
  if (!preferences.hasCode) return "backupNotSetUp";
  if (!preferences.enabled) return "backupPaused";
  return online ? "backupEnabled" : "backupWaiting";
}

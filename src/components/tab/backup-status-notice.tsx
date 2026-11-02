import type { BackupPreferencesController } from "@/hooks/useBackupPreferences";
import { BackupActionButton } from "@/components/tab/backup-action-button";
import { translations, type Language } from "@/lib/translations";

/** Retry reads local status; it never enrolls an owner or changes the saved Pause choice. */
export function BackupStatusNotice({
  language,
  controller,
}: {
  language: Language;
  controller: BackupPreferencesController;
}) {
  if (!controller.failed) return null;
  const t = translations[language];
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[#d9e6d5] bg-white p-4 text-sm text-[#526d58]"
    >
      <p>{t.backupError}</p>
      <BackupActionButton
        className="mt-3"
        disabled={controller.refreshing}
        aria-busy={controller.refreshing}
        onClick={() => void controller.refresh()}
      >
        {t.backupRetry}
      </BackupActionButton>
    </div>
  );
}

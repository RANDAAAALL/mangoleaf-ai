"use client";

import { translations, type Language } from "@/lib/translations";
import { isAndroidBuild } from "@/lib/native-bridge";
import { backupStatusKey } from "@/lib/backup-status";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { useBackupRecovery } from "@/hooks/useBackupRecovery";
import type { BackupPreferencesController } from "@/hooks/useBackupPreferences";
import { Icon } from "@/components/brand/icon";
import { BackupRecoveryForm } from "@/components/tab/backup-recovery-form";
import { BackupActionButton } from "@/components/tab/backup-action-button";
import { BackupStatusNotice } from "@/components/tab/backup-status-notice";

/** Screen markup stays separate from async recovery state and the ownership-enforcing service. */
export function BackupRecoveryPanel({
  language,
  embedded = false,
  preferencesController,
}: {
  language: Language;
  embedded?: boolean;
  preferencesController?: BackupPreferencesController;
}) {
  const t = translations[language];
  const online = useConnectionStatus();
  const recovery = useBackupRecovery(language, preferencesController);
  const {
    preferences,
    code,
    showing,
    copying,
    input,
    codeRejected,
    inputRef,
    busy,
    toggling,
    message,
    restoring,
    restoredCount,
  } = recovery;
  const value = preferences.value;
  const disabled = busy || !value || preferences.failed;
  const status = t[backupStatusKey(value, preferences.failed, online)];
  if (!isAndroidBuild()) return null;

  return (
    <section aria-label={t.backupTitle} className="w-full text-[#173a1d]">
      {!embedded && <h2 className="text-xl font-bold mb-5">{t.backupTitle}</h2>}
      <BackupStatusNotice language={language} controller={preferences} />
      {!value ? (
        !preferences.failed && (
          <p className="rounded-2xl border border-[#d9e6d5] bg-white p-4 text-sm text-[#526d58]">
            {t.backupChecking}
          </p>
        )
      ) : (
        <>
          <div className="rounded-2xl border border-[#d9e6d5] bg-white p-4">
            {value.hasCode ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{t.backupToggle}</p>
                  <p className="mt-1 text-sm text-[#526d58]">
                    {t.backupUploadHint}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value.enabled}
                  aria-busy={toggling || undefined}
                  aria-label={t.backupToggle}
                  disabled={disabled || toggling}
                  onClick={() => void recovery.toggle()}
                  className={`min-h-12 min-w-14 flex shrink-0 items-center justify-center ${disabled ? "opacity-50" : ""}`}
                >
                  <span
                    className={`w-13 h-8 rounded-full p-1 flex items-center transition-colors ${value.enabled ? "bg-[#277839]" : "bg-[#78877b]"}`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${value.enabled ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </span>
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm leading-relaxed text-[#526d58]">
                  {t.backupSetupHint}
                </p>
                <BackupActionButton
                  type="button"
                  tone="primary"
                  className="w-full"
                  disabled={disabled}
                  onClick={() => void recovery.create()}
                >
                  {t.backupCreate}
                </BackupActionButton>
              </>
            )}
            <p className="mt-2 text-sm font-semibold text-[#526d58]">
              {status}
            </p>
            {value.hasCode && !value.enabled && (
              <p className="mt-1 text-sm text-[#526d58]">
                {t.backupPausedHint}
              </p>
            )}
          </div>

          {value.hasCode && (
            <div className="mt-6">
              <h3 className="font-bold">{t.backupRecoveryLabel}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#526d58]">
                {t.backupRecoveryHint}
              </p>
              {code ? (
                <div
                  role="textbox"
                  aria-label={t.backupRecoveryLabel}
                  aria-readonly="true"
                  aria-multiline="true"
                  tabIndex={0}
                  className="mt-3 w-full rounded-2xl border border-[#d9e6d5] bg-white p-4 font-mono text-sm break-all whitespace-pre-wrap select-all"
                >
                  {code}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-[#d9e6d5] bg-white p-4">
                  <span
                    aria-hidden="true"
                    className="font-mono text-sm break-all"
                  >
                    {"\u2022".repeat(32)}
                  </span>
                  <span className="sr-only">{t.backupCodeHidden}</span>
                </div>
              )}
              <div className="mt-3 grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                <BackupActionButton
                  type="button"
                  className="flex items-center justify-center gap-2"
                  disabled={disabled}
                  onClick={() => void recovery.showOrHide()}
                >
                  <Icon
                    name={code || showing ? "eye-off" : "eye"}
                    size={20}
                    className="shrink-0"
                  />
                  <span>
                    {code || showing ? t.backupHideCode : t.backupShowCode}
                  </span>
                </BackupActionButton>
                <BackupActionButton
                  type="button"
                  tone="primary"
                  className="flex items-center justify-center gap-2"
                  disabled={disabled}
                  aria-busy={copying || undefined}
                  onClick={() => void recovery.copyCode()}
                >
                  <Icon name="copy" size={20} className="shrink-0" />
                  <span>{t.backupCopy}</span>
                </BackupActionButton>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-bold">{t.backupRestore}</h3>
            <p className="mt-2 mb-3 text-sm leading-relaxed text-[#526d58]">
              {t.backupRestoreHint}
            </p>
            <BackupRecoveryForm
              language={language}
              busy={disabled}
              value={input}
              inputRef={inputRef}
              onChange={recovery.changeInput}
              codeRejected={codeRejected}
              onRestore={() => void recovery.restore()}
            />
            <p className="mt-2 text-sm leading-relaxed text-[#526d58]">
              {value.hasCode ? t.backupKeepOwnCode : t.backupRestoreSetupHint}
            </p>
          </div>
        </>
      )}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 min-h-6 text-sm leading-relaxed"
      >
        {(busy || message) && (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 ${!busy && restoredCount !== null && restoredCount > 0 ? "border-[#b9d9bd] bg-[#edf7ee] text-[#173a1d]" : "border-[#d9e6d5] bg-white text-[#35543b]"}`}
          >
            {busy ? (
              <span
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
              />
            ) : restoredCount !== null && restoredCount > 0 ? (
              <Icon
                name="check"
                size={20}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <p className="font-semibold">
                {busy
                  ? restoring
                    ? t.backupRestoring
                    : t.backupBusy
                  : message}
              </p>
              {!busy && restoredCount !== null && restoredCount > 0 && (
                <p className="mt-1">{t.backupRestoredHint}</p>
              )}
            </div>
          </div>
        )}
      </div>
      <details className="mt-5 border-t border-[#d9e6d5] py-3 text-sm text-[#35543b]">
        <summary className="min-h-11 flex items-center justify-between gap-3 cursor-pointer font-semibold">
          {t.backupHowWorks}
          <Icon name="chevron-down" size={20} />
        </summary>
        <div className="flex flex-col gap-3 pt-2 leading-relaxed">
          <p>{t.backupHowUploads}</p>
          <p>{t.backupMergeHint}</p>
          <p>{t.backupOwnRestoreHint}</p>
          <p>{t.backupDeletionExplanation}</p>
        </div>
      </details>
    </section>
  );
}

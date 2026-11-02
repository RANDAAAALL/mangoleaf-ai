"use client";

import { type RefCallback } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { BackupRecoveryPanel } from "@/components/tab/backup-recovery-panel";
import { DiagnosticsPanel } from "@/components/tab/diagnostics-panel";
import { AndroidUpdatePanel } from "@/components/tab/android-update-panel";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { useBackupPreferences } from "@/hooks/useBackupPreferences";
import { useSettingsNavigation } from "@/hooks/useSettingsNavigation";
import { backupStatusKey } from "@/lib/backup-status";
import { BackupStatusNotice } from "@/components/tab/backup-status-notice";
import type { AndroidApkOffer } from "@/lib/android-update";
import { isAndroidBuild } from "@/lib/native-bridge";
import { translations, type Language } from "@/lib/translations";

function SettingsEntry({
  label,
  hint,
  icon,
  onOpen,
  buttonRef,
}: {
  label: string;
  hint: string;
  icon: IconName;
  onOpen: () => void;
  buttonRef: RefCallback<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-[#d9e6d5] bg-white p-4 flex items-center gap-3 text-left"
    >
      <span className="rounded-full bg-[#e6eee3] p-3 text-[#277839] shrink-0">
        <Icon name={icon} size={24} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-sm text-[#526d58]">{hint}</span>
      </span>
      <Icon
        name="chevron-right"
        size={20}
        className="shrink-0 text-[#526d58]"
      />
    </button>
  );
}

export function SettingsTab({
  language,
  onLanguageChange,
  updateOffer,
  onUpdate,
  updateBusy = false,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  updateOffer: AndroidApkOffer | null;
  onUpdate: (offer: AndroidApkOffer) => void;
  updateBusy?: boolean;
}) {
  const t = translations[language];
  const online = useConnectionStatus();
  const production = process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT === "production";
  const preferences = useBackupPreferences(isAndroidBuild());
  const { screen, open, back, registerEntry, titleRef } = useSettingsNavigation(
    isAndroidBuild(),
    production,
  );
  if (!isAndroidBuild()) return null;
  const status =
    t[backupStatusKey(preferences.value, preferences.failed, online)];
  const title =
    screen === "backup"
      ? t.backupTitle
      : screen === "diagnostics"
        ? t.settingsDiagnostics
        : t.settingsUpdates;
  const sectionTitle =
    "mb-2 text-xs uppercase tracking-wider font-bold text-[#526d58]";

  if (screen)
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            aria-label={t.settingsBack}
            onClick={back}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-[#173a1d] hover:bg-[#e6efe2]"
          >
            <Icon name="arrow-left" size={24} />
          </button>
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="text-xl font-bold outline-none"
          >
            {title}
          </h1>
        </div>
        {screen === "backup" && (
          <BackupRecoveryPanel
            language={language}
            embedded
            preferencesController={preferences}
          />
        )}
        {screen === "diagnostics" && (
          <DiagnosticsPanel language={language} embedded />
        )}
        {screen === "updates" && production && (
          <AndroidUpdatePanel
            language={language}
            offer={updateOffer}
            onUpdate={onUpdate}
            busy={updateBusy}
            showEmpty
          />
        )}
      </div>
    );

  return (
    <section
      className="w-full max-w-lg mx-auto flex flex-col gap-6"
      aria-labelledby="settings-title"
    >
      <h1 id="settings-title" className="text-3xl font-bold">
        {t.navSettings}
      </h1>
      <div>
        <h2 className={sectionTitle}>{t.settingsLanguage}</h2>
        <div className="rounded-2xl border border-[#d9e6d5] bg-white p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">{t.settingsAppLanguage}</span>
          <div
            className="inline-flex rounded-full bg-[#e6eee3] p-1"
            role="group"
            aria-label={t.settingsAppLanguage}
          >
            {(["bis", "en"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={language === value}
                onClick={() => onLanguageChange(value)}
                className={`min-h-11 px-5 rounded-full text-sm font-semibold ${language === value ? "bg-[#277839] text-white shadow-sm" : "text-[#35543b]"}`}
              >
                {value === "bis" ? t.settingsBisaya : t.settingsEnglish}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h2 className={sectionTitle}>{t.settingsBackup}</h2>
        <BackupStatusNotice language={language} controller={preferences} />
        <SettingsEntry
          label={t.backupTitle}
          hint={status}
          icon="cloud-check"
          onOpen={() => open("backup")}
          buttonRef={(el) => registerEntry("backup", el)}
        />
      </div>
      <div>
        <h2 className={sectionTitle}>{t.settingsDiagnosticsSection}</h2>
        <SettingsEntry
          label={t.settingsDiagnostics}
          hint={t.settingsDiagnosticsHint}
          icon="clipboard-check"
          onOpen={() => open("diagnostics")}
          buttonRef={(el) => registerEntry("diagnostics", el)}
        />
      </div>
      {production && (
        <div>
          <h2 className={sectionTitle}>{t.settingsUpdatesSection}</h2>
          <SettingsEntry
            label={t.settingsUpdates}
            hint={t.settingsUpdatesHint}
            icon="install"
            onOpen={() => open("updates")}
            buttonRef={(el) => registerEntry("updates", el)}
          />
        </div>
      )}
    </section>
  );
}

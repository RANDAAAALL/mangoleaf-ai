"use client";

import { useEffect, useRef, useState } from "react";
import { translations, type Language } from "@/lib/translations";
import { isAndroidBuild } from "@/lib/native-bridge";
import { isAutomaticTestBackup } from "@/lib/cloud-target";
import { BackupRecoveryForm } from "@/components/tab/backup-recovery-form";
import {
  backupPreferences,
  createBackupVault,
  restoreCloudBackup,
  savedRecoveryCode,
  setBackupEnabled,
} from "@/lib/cloud-backup";

/** Recovery never replaces local History. Revealing or copying a credential requires a deliberate action. */
export function BackupRecoveryPanel({ language }: { language: Language }) {
  const t = translations[language];
  const testing = isAutomaticTestBackup();
  const [preferences, setPreferences] = useState({
    enabled: false,
    hasCode: false,
  });
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [inputVisible, setInputVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const preferenceRevision = useRef(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAndroidBuild()) return;
    let active = true;
    const revision = preferenceRevision.current;
    void backupPreferences()
      .then((value) => {
        if (active && revision === preferenceRevision.current)
          setPreferences(value);
      })
      .catch(() => {
        if (active && revision === preferenceRevision.current)
          setMessage(t.backupError);
      });
    return () => {
      active = false;
    };
  }, [t.backupError]);

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  if (!isAndroidBuild()) return null;

  async function run(action: () => Promise<string | void>) {
    // React state can lag a rapid second action; own the operation synchronously.
    if (busyRef.current) return;
    busyRef.current = true;
    preferenceRevision.current++;
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      setMessage(result || t.backupDone);
    } catch {
      setMessage(t.backupError);
    } finally {
      // A verified owner may have changed before a later photo failed to restore.
      // Refresh controls even on failure, rather than presenting stale credential actions.
      try {
        setPreferences(await backupPreferences());
      } catch {
        setMessage(t.backupError);
      }
      busyRef.current = false;
      setBusy(false);
    }
  }

  const button =
    "min-h-11 rounded-xl bg-[#1c682d] px-4 py-3 font-semibold text-white disabled:opacity-50";
  const secondary =
    "min-h-11 rounded-xl border border-[#277839] px-4 py-3 font-semibold text-[#1c682d] disabled:opacity-50";

  return (
    <section
      className="rounded-3xl border border-[#b8d7b5] bg-white/70 p-6"
      aria-labelledby="backup-title"
      aria-busy={busy}
    >
      <h2 id="backup-title" className="text-xl font-bold text-[#1c682d]">
        {t.backupTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed">
        {testing ? t.backupTestingDescription : t.backupDescription}
      </p>
      <p className="mt-3 font-semibold">
        {!preferences.hasCode
          ? t.backupLocalOnly
          : preferences.enabled
            ? t.backupEnabled
            : t.backupPaused}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {!preferences.hasCode ? (
          <>
            <button
              type="button"
              className={button}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setCode(await createBackupVault());
                  return (await backupPreferences()).enabled
                    ? t.backupStarted
                    : t.backupPaused;
                })
              }
            >
              {t.backupCreate}
            </button>
            <p className="text-sm leading-relaxed">{t.backupNewCodeHint}</p>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={secondary}
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    setCode(code ? "" : (await savedRecoveryCode()) || "");
                  })
                }
              >
                {code ? t.backupHideCode : t.backupShowCode}
              </button>
              <button
                type="button"
                className={button}
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const value = await savedRecoveryCode();
                    if (!value)
                      throw new Error("Recovery credential is unavailable.");
                    try {
                      await navigator.clipboard.writeText(value);
                      return t.backupCodeCopied;
                    } catch {
                      return t.backupCodeCopyFailed;
                    }
                  })
                }
              >
                {t.backupCopy}
              </button>
            </div>
            <p className="text-sm leading-relaxed">{t.backupRecoveryHint}</p>
          </>
        )}

        {code && (
          <label className="flex flex-col gap-2 text-sm font-semibold">
            {t.backupRecoveryLabel}
            <textarea
              readOnly
              value={code}
              rows={3}
              autoComplete="off"
              spellCheck={false}
              className="w-full resize-none break-all rounded-xl border border-[#b8d7b5] p-3 font-mono text-sm"
            />
          </label>
        )}

        <button
          type="button"
          className={secondary}
          disabled={busy}
          onClick={() => {
            setInputVisible(true);
            inputRef.current?.focus();
          }}
        >
          {t.backupEnterCode}
        </button>

        {inputVisible && (
          <BackupRecoveryForm
            language={language}
            busy={busy}
            value={input}
            inputRef={inputRef}
            onChange={setInput}
            onRestore={() =>
              void run(async () => {
                // Hide the previously revealed credential before a potential owner switch.
                setCode("");
                const restored = await restoreCloudBackup(input);
                setInput("");
                setInputVisible(false);
                return t.backupRestored.replace("{n}", String(restored));
              })
            }
          />
        )}

        {preferences.hasCode && !inputVisible && (
          <button
            type="button"
            className={secondary}
            disabled={busy}
            onClick={() =>
              void run(async () =>
                t.backupRestored.replace(
                  "{n}",
                  String(await restoreCloudBackup()),
                ),
              )
            }
          >
            {t.backupRestore}
          </button>
        )}

        {preferences.hasCode && (
          <button
            type="button"
            className={secondary}
            disabled={busy}
            onClick={() =>
              void run(() => setBackupEnabled(!preferences.enabled))
            }
          >
            {preferences.enabled ? t.backupPause : t.backupResume}
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm">
        {busy ? t.backupBusy : message}
      </p>
    </section>
  );
}

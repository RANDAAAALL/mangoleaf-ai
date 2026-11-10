"use client";

import { useEffect, useRef, useState } from "react";
import {
  useBackupPreferences,
  type BackupPreferencesController,
} from "@/hooks/useBackupPreferences";
import { isAndroidBuild } from "@/lib/native-bridge";
import { RecoveryCodeError } from "@/lib/cloud-backup-format";
import { translations, type Language } from "@/lib/translations";
import {
  backupPreferences,
  createBackupVault,
  restoreCloudBackup,
  savedRecoveryCode,
  setBackupEnabled,
} from "@/lib/cloud-backup";

/** UI lifecycle and feedback only; the service retains setup, ownership and transfer verification. */
export function useBackupRecovery(
  language: Language,
  shared?: BackupPreferencesController,
) {
  const local = useBackupPreferences(isAndroidBuild() && !shared);
  const preferences = shared ?? local;
  const t = translations[language];
  const [code, setCode] = useState("");
  const [showing, setShowing] = useState(false);
  const [copying, setCopying] = useState(false);
  const [input, setInput] = useState("");
  const [codeRejected, setCodeRejected] = useState(false);
  const [pending, setPending] = useState<"setup" | "restore" | "toggle" | null>(
    null,
  );
  const [message, setMessage] = useState<string | { restored: number }>("");
  const [pendingNotice, setPendingNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  // Backgrounding invalidates all feedback; Hide additionally cancels pending credential exposure.
  const viewRevision = useRef(0);
  const privacyRevision = useRef(0);
  const visibleIntent = useRef(false);
  const mutation = useRef<"transfer" | "toggle" | null>(null);
  const copyPending = useRef(false);
  const codeRead = useRef<Promise<string | null> | null>(null);

  function conceal() {
    privacyRevision.current++;
    visibleIntent.current = false;
    if (mounted.current) {
      setCode("");
      setShowing(false);
    }
  }

  useEffect(() => {
    if (!isAndroidBuild()) return;
    mounted.current = true;
    const inactive = () => {
      viewRevision.current++;
      privacyRevision.current++;
      visibleIntent.current = false;
      if (mounted.current) {
        setCode("");
        setShowing(false);
      }
    };
    const visibility = () => {
      if (document.visibilityState !== "visible") inactive();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", inactive);
    return () => {
      mounted.current = false;
      inactive();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", inactive);
    };
  }, []);

  function current(revision: number) {
    return (
      mounted.current &&
      viewRevision.current === revision &&
      document.visibilityState === "visible"
    );
  }

  function reveal(value: string, revision: number, view: number) {
    if (current(view) && privacyRevision.current === revision) {
      visibleIntent.current = true;
      setCode(value);
    }
  }

  function readCode() {
    // Show and Copy can share an in-flight local read; never cache a resolved credential here.
    if (codeRead.current) return codeRead.current;
    const request = savedRecoveryCode().finally(() => {
      if (codeRead.current === request) codeRead.current = null;
    });
    codeRead.current = request;
    return request;
  }

  async function showOrHide() {
    // Concealment is always immediate, including while another local read is pending.
    if (visibleIntent.current) {
      conceal();
      return;
    }
    if (
      !preferences.value ||
      preferences.failed ||
      mutation.current === "transfer"
    )
      return;
    const revision = privacyRevision.current,
      view = viewRevision.current;
    visibleIntent.current = true;
    setShowing(true);
    try {
      const value = await readCode();
      if (!value) throw new Error("Recovery credential is unavailable.");
      reveal(value, revision, view);
    } catch {
      if (current(view) && privacyRevision.current === revision) {
        visibleIntent.current = false;
        setMessage(t.backupError);
      }
    } finally {
      if (mounted.current && privacyRevision.current === revision)
        setShowing(false);
    }
  }

  async function copyCode() {
    if (!preferences.value || preferences.failed) return;
    if (copyPending.current || mutation.current) {
      setPendingNotice(true);
      return;
    }
    copyPending.current = true;
    setCopying(true);
    setPendingNotice(false);
    setMessage("");
    const revision = privacyRevision.current,
      view = viewRevision.current;
    try {
      const value = await readCode();
      // A cancelled view/read must not write a private credential to the clipboard later.
      if (!current(view) || privacyRevision.current !== revision) return;
      if (!value) throw new Error("Recovery credential is unavailable.");
      try {
        await navigator.clipboard.writeText(value);
        if (current(view) && privacyRevision.current === revision)
          setMessage(t.backupCodeCopied);
      } catch {
        if (current(view) && privacyRevision.current === revision)
          setMessage(t.backupCodeCopyFailed);
      }
    } catch {
      if (current(view) && privacyRevision.current === revision)
        setMessage(t.backupError);
    } finally {
      copyPending.current = false;
      if (mounted.current) {
        setCopying(false);
        setPendingNotice(false);
      }
    }
  }

  async function run(
    action: () => Promise<string | { restored: number } | void>,
    operation: "setup" | "restore" | "toggle" = "setup",
  ) {
    if (!preferences.value || preferences.failed) return;
    if (mutation.current || copyPending.current) {
      setPendingNotice(true);
      return;
    }
    mutation.current = operation === "toggle" ? "toggle" : "transfer";
    setPending(operation);
    setPendingNotice(false);
    setMessage("");
    const view = viewRevision.current;
    try {
      const result = await action();
      if (current(view)) setMessage(result || "");
    } catch {
      if (current(view)) setMessage(t.backupError);
    } finally {
      await preferences.refreshAfterChange();
      mutation.current = null;
      if (mounted.current) {
        setPending(null);
        setPendingNotice(false);
      }
    }
  }

  function create() {
    return run(async () => {
      const revision = privacyRevision.current,
        view = viewRevision.current;
      reveal(await createBackupVault(), revision, view);
      return t.backupStarted;
    });
  }

  function restore() {
    const entered = input.trim();
    if (!entered) return;
    return run(async () => {
      setCodeRejected(false);
      conceal();
      const revision = privacyRevision.current,
        view = viewRevision.current;
      const hadCode = (await backupPreferences()).hasCode;
      try {
        const restored = await restoreCloudBackup(entered);
        if (mounted.current) setInput("");
        return { restored };
      } catch (error) {
        if (!(error instanceof RecoveryCodeError)) throw error;
        if (current(view)) {
          setCodeRejected(true);
          inputRef.current?.focus({ preventScroll: true });
        }
      } finally {
        // Own setup can succeed before a later photo fails; retain access to the receiver's new code.
        if (!hadCode && current(view) && privacyRevision.current === revision)
          reveal((await savedRecoveryCode()) || "", revision, view);
      }
    }, "restore");
  }

  const restoredCount = typeof message === "string" ? null : message.restored;
  const feedback =
    typeof message === "string"
      ? message
      : message.restored === 0
        ? t.backupRestoredNone
        : (message.restored === 1
            ? t.backupRestoredSingle
            : t.backupRestored
          ).replace("{n}", String(message.restored));

  return {
    preferences,
    code,
    showing,
    copying,
    input,
    codeRejected,
    inputRef,
    // Pending notices describe actual work, so they cannot survive its final status refresh.
    message: pendingNotice && (pending || copying) ? t.backupBusy : feedback,
    restoredCount,
    restoring: pending === "restore",
    busy: pending === "setup" || pending === "restore",
    toggling: pending === "toggle",
    showOrHide,
    copyCode,
    create,
    restore,
    toggle: () => {
      const value = preferences.value;
      if (value) return run(() => setBackupEnabled(!value.enabled), "toggle");
    },
    changeInput: (value: string) => {
      setCodeRejected(false);
      setInput(value);
    },
  };
}

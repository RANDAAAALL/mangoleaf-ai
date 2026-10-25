import { useCallback, useEffect, useId, useRef, useState } from "react";
import { nativeRequest } from "@/lib/native-bridge";
import {
  watchAndroidUpdate,
  watchAndroidApkUpdate,
  type AndroidApkOffer,
} from "@/lib/android-update";
import { translations, type Language } from "@/lib/translations";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Icon } from "@/components/brand/icon";
import { isCloudBackupRunning } from "@/lib/cloud-backup";

type UpdateOffer =
  { kind: "ota"; canRestart: boolean } | ({ kind: "apk" } & AndroidApkOffer);

/** APK dismissal lasts until the next foreground visit; OTA dismissal lasts for the page. */
export function AndroidUpdateModal({
  language,
  blocked,
  onApkOffer,
  onUpdate,
  suppressApkReoffer,
}: {
  language: Language;
  blocked: boolean;
  onApkOffer?: (offer: AndroidApkOffer) => void;
  onUpdate: (offer: AndroidApkOffer) => void;
  suppressApkReoffer?: () => boolean;
}) {
  const blockedRef = useRef(blocked);
  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);
  const [offer, setOffer] = useState<UpdateOffer | null>(null);
  const offerRef = useRef<UpdateOffer | null>(null);
  const suppressRef = useRef(suppressApkReoffer);
  useEffect(() => {
    suppressRef.current = suppressApkReoffer;
  }, [suppressApkReoffer]);
  const [apkDismissed, setApkDismissed] = useState(false);
  const [otaDismissed, setOtaDismissed] = useState(false);
  const [foregroundSession, setForegroundSession] = useState(0);
  useEffect(() => {
    let backgrounded = document.visibilityState !== "visible";
    let backgroundWasInstaller = false;
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        backgrounded = true;
        backgroundWasInstaller = suppressRef.current?.() === true;
      } else if (backgrounded) {
        backgrounded = false;
        const expectedReturn =
          backgroundWasInstaller || suppressRef.current?.() === true;
        backgroundWasInstaller = false;
        if (expectedReturn) return;
        // Recheck the installed version/release after reopening, never on ordinary tab navigation.
        if (offerRef.current?.kind === "apk") {
          offerRef.current = null;
          setOffer(null);
        }
        setApkDismissed(false);
        setForegroundSession((value) => value + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  const idle = useCallback(
    () =>
      !offerRef.current &&
      !blockedRef.current &&
      !isCloudBackupRunning() &&
      !document.querySelector(
        'dialog[open], [role="dialog"], [aria-busy="true"]',
      ) &&
      !(
        document.activeElement instanceof HTMLElement &&
        document.activeElement.matches(
          'input, textarea, select, [contenteditable="true"]',
        )
      ),
    [],
  );
  const show = useCallback((value: UpdateOffer) => {
    if (offerRef.current) return;
    offerRef.current = value;
    setOffer(value);
  }, []);
  useEffect(() => {
    if (apkDismissed) return;
    return watchAndroidApkUpdate((value) => {
      onApkOffer?.(value);
      show({ kind: "apk", ...value });
    }, idle);
  }, [apkDismissed, foregroundSession, onApkOffer, idle, show]);
  useEffect(() => {
    if (otaDismissed) return;
    return watchAndroidUpdate(
      (canRestart) => show({ kind: "ota", canRestart }),
      idle,
    );
  }, [otaDismissed, idle, show]);

  if (!offer || blocked) return null;
  return (
    <ReadyDialog
      language={language}
      offer={offer}
      onLater={() => {
        if (offerRef.current?.kind === "apk") setApkDismissed(true);
        else setOtaDismissed(true);
        offerRef.current = null;
        setOffer(null);
      }}
      onUpdate={onUpdate}
    />
  );
}

function ReadyDialog({
  language,
  offer,
  onLater,
  onUpdate,
}: {
  language: Language;
  offer: UpdateOffer;
  onLater: () => void;
  onUpdate: (offer: AndroidApkOffer) => void;
}) {
  const t = translations[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const laterRef = useRef<HTMLButtonElement>(null);
  const [restarting, setRestarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  useScrollLock(true);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    laterRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  async function restart() {
    setRestarting(true);
    setFailed(false);
    try {
      if (!(await nativeRequest<boolean>("ota.restart")))
        throw new Error("Update restart deferred.");
    } catch {
      setFailed(true);
      setRestarting(false);
    }
  }
  return (
    <dialog
      data-apk-update={offer.kind === "apk" ? "" : undefined}
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={restarting}
      onCancel={(event) => {
        event.preventDefault();
        if (!restarting) onLater();
      }}
      className="relative m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border border-[#cfe2c8] bg-[#f6faf1] p-6 text-[#143519] shadow-2xl backdrop:bg-black/60"
    >
      {offer.kind === "apk" && (
        <button
          type="button"
          aria-label={t.closeBtn}
          onClick={onLater}
          className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-[#e2ebd9]"
        >
          <Icon name="close" size={20} />
        </button>
      )}
      <h2
        id={titleId}
        className={`text-xl font-bold ${offer.kind === "apk" ? "pr-8" : ""}`}
      >
        {offer.kind === "apk"
          ? t.androidApkUpdateTitle.replace("{version}", offer.version)
          : t.androidUpdateReadyTitle}
      </h2>
      <p id={descriptionId} className="mt-3 text-sm leading-relaxed">
        {offer.kind === "apk"
          ? t.androidApkUpdateText
          : offer.canRestart
            ? t.androidUpdateReadyText
            : t.androidUpdateManualRestart}
      </p>
      <p role="status" aria-live="polite" className="mt-3 text-sm">
        {failed
          ? t.androidUpdateRestartError
          : restarting
            ? t.androidUpdateRestarting
            : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          ref={laterRef}
          type="button"
          disabled={restarting}
          onClick={onLater}
          className="min-h-11 flex-1 rounded-xl border border-[#277839] px-4 py-3 font-semibold disabled:opacity-50"
        >
          {offer.kind === "apk"
            ? t.androidApkUpdateLater
            : t.androidUpdateLater}
        </button>
        {offer.kind === "apk" ? (
          <button
            type="button"
            onClick={() => {
              onLater();
              onUpdate(offer);
            }}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#277839] px-4 py-3 text-center font-semibold text-white"
          >
            {t.androidApkUpdateNow}
          </button>
        ) : (
          offer.canRestart && (
            <button
              type="button"
              disabled={restarting}
              onClick={() => void restart()}
              className="min-h-11 flex-1 rounded-xl bg-[#277839] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {t.androidUpdateRestart}
            </button>
          )
        )}
      </div>
    </dialog>
  );
}

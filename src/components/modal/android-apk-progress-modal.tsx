import { useEffect, useId, useRef } from "react";
import { Icon } from "@/components/brand/icon";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { AndroidApkInstallState } from "@/lib/android-apk-install";
import { translations, type Language } from "@/lib/translations";

export function AndroidApkProgressModal({
  language,
  state,
  onCancel,
  onDismiss,
}: {
  language: Language;
  state: AndroidApkInstallState | null;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  if (!state || state.status === "cancelled" || state.status === "installed")
    return null;
  return (
    <ProgressDialog
      language={language}
      state={state}
      onCancel={onCancel}
      onDismiss={onDismiss}
    />
  );
}

function ProgressDialog({
  language,
  state,
  onCancel,
  onDismiss,
}: {
  language: Language;
  state: AndroidApkInstallState;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const t = translations[language];
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();
  const failed = state.status === "failed";
  const installing = state.status === "installing";
  const close = failed ? onDismiss : onCancel;
  const percent =
    state.total > 0
      ? Math.floor((state.downloaded / state.total) * 100)
      : undefined;
  useScrollLock(true);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement;
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      data-apk-update
      aria-labelledby={titleId}
      aria-describedby={textId}
      aria-busy={!failed}
      onCancel={(event) => {
        event.preventDefault();
        if (!installing) close();
      }}
      className="relative m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border border-[#cfe2c8] bg-[#f6faf1] p-6 text-[#143519] shadow-2xl backdrop:bg-black/60"
    >
      {!installing && (
        <button
          ref={closeRef}
          type="button"
          aria-label={t.closeBtn}
          onClick={close}
          className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-[#e2ebd9]"
        >
          <Icon name="close" size={20} />
        </button>
      )}
      <h2 id={titleId} className="pr-8 text-xl font-bold">
        {failed
          ? t.androidApkInstallFailedTitle
          : installing
            ? t.androidApkInstallingTitle
            : state.status === "verifying" || state.status === "ready"
              ? t.androidApkVerifyingTitle
              : t.androidApkDownloadingTitle}
      </h2>
      <p id={textId} className="mt-3 text-sm leading-relaxed">
        {failed
          ? state.error === "UNSUPPORTED"
            ? t.androidApkInstallUnavailable
            : t.androidApkInstallFailedText
          : installing
            ? t.androidApkInstallingText
            : t.androidApkDownloadingText}
      </p>
      {!failed && !installing && (
        <div className="mt-4">
          <progress
            aria-label={t.androidApkDownloadingTitle}
            max={100}
            value={percent}
            className="h-3 w-full accent-[#277839]"
          />
          <p role="status" aria-live="polite" className="mt-2 text-sm">
            {percent === undefined
              ? t.androidApkConnecting
              : t.androidApkDownloadPercent.replace("{n}", String(percent))}
          </p>
        </div>
      )}
      {failed && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 min-h-11 rounded-xl border border-[#277839] px-4 py-3 font-semibold"
        >
          {t.closeBtn}
        </button>
      )}
    </dialog>
  );
}

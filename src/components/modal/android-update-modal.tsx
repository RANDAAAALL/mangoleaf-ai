import { useEffect, useId, useRef, useState } from "react";
import { nativeRequest } from "@/lib/native-bridge";
import { watchAndroidUpdate } from "@/lib/android-update";
import { translations, type Language } from "@/lib/translations";
import { useScrollLock } from "@/hooks/useScrollLock";

/** One verified-update offer per page lifetime; Later never restarts or repeatedly nags. */
export function AndroidUpdateModal({
  language,
  blocked,
}: {
  language: Language;
  blocked: boolean;
}) {
  const blockedRef = useRef(blocked);
  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);
  const [offer, setOffer] = useState<{ canRestart: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (dismissed) return;
    return watchAndroidUpdate(
      (canRestart) => setOffer({ canRestart }),
      () =>
        !blockedRef.current &&
        !document.querySelector(
          'dialog[open], [role="dialog"], [aria-busy="true"]',
        ) &&
        !(
          document.activeElement instanceof HTMLElement &&
          document.activeElement.matches(
            'input, textarea, select, [contenteditable="true"]',
          )
        ),
    );
  }, [dismissed]);

  if (!offer || blocked || dismissed) return null;
  return (
    <ReadyDialog
      language={language}
      canRestart={offer.canRestart}
      onLater={() => setDismissed(true)}
    />
  );
}

function ReadyDialog({
  language,
  canRestart,
  onLater,
}: {
  language: Language;
  canRestart: boolean;
  onLater: () => void;
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
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={restarting}
      onCancel={(event) => {
        event.preventDefault();
        if (!restarting) onLater();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border border-[#cfe2c8] bg-[#f6faf1] p-6 text-[#143519] shadow-2xl backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-xl font-bold">
        {t.androidUpdateReadyTitle}
      </h2>
      <p id={descriptionId} className="mt-3 text-sm leading-relaxed">
        {canRestart ? t.androidUpdateReadyText : t.androidUpdateManualRestart}
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
          {t.androidUpdateLater}
        </button>
        {canRestart && (
          <button
            type="button"
            disabled={restarting}
            onClick={() => void restart()}
            className="min-h-11 flex-1 rounded-xl bg-[#277839] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {t.androidUpdateRestart}
          </button>
        )}
      </div>
    </dialog>
  );
}

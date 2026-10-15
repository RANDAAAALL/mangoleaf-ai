import { useEffect, useId, useRef } from "react";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "@/components/brand/icon";

interface StorageFullModalProps {
  language: Language;
  isSaving: boolean;
  error: "quota" | "failed" | "timeout" | null;
  onManageHistory: () => void;
  onRetry: () => void;
  onDiscard: () => void;
}

export function StorageFullModal({
  language,
  isSaving,
  error,
  onManageHistory,
  onRetry,
  onDiscard,
}: StorageFullModalProps) {
  const t = translations[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    // Native modal behavior contains focus and makes the page behind it inert.
    dialog.showModal();
    historyRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (isSaving) dialogRef.current?.focus({ preventScroll: true });
    else if (document.activeElement === dialogRef.current) {
      historyRef.current?.focus({ preventScroll: true });
    }
  }, [isSaving]);

  const errorText =
    error === "quota"
      ? t.storageStillFullText
      : error === "timeout"
        ? t.storageSaveTimeoutText
        : t.storageSaveFailedText;

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isSaving}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || isSaving) return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [tabindex="0"]',
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        // Escape keeps the unsaved result and opens its recovery controls.
        if (!isSaving) onManageHistory();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[90dvh] overflow-hidden rounded-3xl border border-[#e2ebd9] bg-white p-6 text-[#143519] shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex max-h-[calc(90dvh-3rem)] flex-col gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <Icon name="about" size={24} aria-hidden="true" />
          </div>
          <h2 id={titleId} className="text-xl font-black leading-snug">
            {t.storageFullTitle}
          </h2>
        </div>
        <div
          id={descriptionId}
          role="region"
          aria-label={t.storageHelpLabel}
          tabIndex={0}
          className="min-h-0 space-y-3 overflow-y-auto overscroll-contain text-sm leading-relaxed text-[#526856] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#277839]"
        >
          {error && (
            <p role="alert" className="text-sm font-semibold text-rose-700">
              {errorText}
            </p>
          )}
          <p>{t.storageFullText}</p>
          <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
            {t.storagePendingText}
          </p>
        </div>
        {isSaving && (
          <p
            role="status"
            className="shrink-0 text-center text-sm font-semibold"
          >
            {t.storageSavingText}
          </p>
        )}
        {/* Keep recovery actions visible while longer translated help scrolls. */}
        <div className="flex shrink-0 flex-col gap-2">
          <button
            ref={historyRef}
            type="button"
            onClick={onManageHistory}
            disabled={isSaving}
            className="min-h-11 rounded-xl bg-[#277839] px-5 py-3 text-sm font-bold text-white cursor-pointer hover:bg-[#1f622d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-60"
          >
            {t.storageManageHistoryBtn}
          </button>
          <button
            type="button"
            onClick={onRetry}
            disabled={isSaving}
            className="min-h-11 rounded-xl border border-[#cce0be] bg-[#f6faf1] px-5 py-3 text-sm font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-60"
          >
            {t.storageRetrySaveBtn}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="min-h-11 rounded-xl px-5 py-3 text-sm font-bold text-rose-700 cursor-pointer hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-wait disabled:opacity-60"
          >
            {t.storageDiscardBtn}
          </button>
        </div>
      </div>
    </dialog>
  );
}

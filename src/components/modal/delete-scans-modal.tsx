import { useEffect, useId, useRef, type RefObject } from "react";
import { translations, type Language } from "@/lib/translations";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Icon } from "@/components/brand/icon";
import { isAndroidBuild } from "@/lib/native-bridge";
import { isBrowserTestSync } from "@/lib/cloud-target";

interface DeleteScansModalProps {
  count: number;
  language: Language;
  isDeleting: boolean;
  hasError: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fallbackFocusRef: RefObject<HTMLElement | null>;
}

export function DeleteScansModal({
  count,
  language,
  isDeleting,
  hasError,
  onConfirm,
  onCancel,
  fallbackFocusRef,
}: DeleteScansModalProps) {
  const t = translations[language];
  // The confirmed count chooses the wording for both single and batch deletion.
  const singleScan = count === 1;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useScrollLock(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const fallbackFocus = fallbackFocusRef.current;

    // A native modal dialog keeps keyboard focus inside and blocks background
    // controls. Start on Cancel so opening it never favors a destructive action.
    dialog.showModal();
    cancelRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        !previousFocus.matches(":disabled")
      ) {
        previousFocus.focus({ preventScroll: true });
      }
      if (document.activeElement !== previousFocus) {
        // A resize can hide the original button without removing it. If focus
        // cannot return there, use the list heading, which stays visible.
        fallbackFocus?.focus({ preventScroll: true });
      }
    };
  }, [fallbackFocusRef]);

  useEffect(() => {
    // All actions are disabled while the local deletion is being saved.
    // Focus the dialog itself rather than leaving focus on a disabled button.
    if (isDeleting) dialogRef.current?.focus({ preventScroll: true });
    else if (document.activeElement === dialogRef.current) {
      cancelRef.current?.focus({ preventScroll: true });
    }
  }, [isDeleting]);

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isDeleting}
      onCancel={(event) => {
        event.preventDefault();
        if (!isDeleting) onCancel();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border border-[#e2ebd9] bg-white p-6 text-[#143519] shadow-2xl backdrop:bg-black/60"
    >
      <div className="relative flex flex-col gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          aria-label={t.closeBtn}
          className="absolute -top-4 -right-4 flex h-11 w-11 items-center justify-center rounded-xl text-[#526856] cursor-pointer hover:bg-[#f1f5f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-60"
        >
          <Icon name="close" size={20} aria-hidden="true" />
        </button>
        {/* Keep the centered title below the close button so wrapped text and
            the selected count cannot overlap it on narrow phones. */}
        <h3
          id={titleId}
          className="pt-8 text-center text-xl font-black leading-snug"
        >
          {(singleScan
            ? t.historyDeleteConfirmOneTitle
            : t.historyDeleteConfirmTitle
          ).replace("{n}", String(count))}
        </h3>
        <p
          id={descriptionId}
          className="text-sm leading-relaxed text-[#526856]"
        >
          {singleScan
            ? t.historyDeleteConfirmOneDescription
            : t.historyDeleteConfirmDescription}
          {(isAndroidBuild() || isBrowserTestSync()) && (
            <span className="mt-2 block">{t.historyCloudDeleteHint}</span>
          )}
        </p>
        {hasError && (
          <p role="alert" className="text-sm font-semibold text-rose-700">
            {singleScan ? t.historyDeleteOneFailed : t.historyDeleteFailed}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-11 rounded-xl bg-[#f1f5f9] px-5 py-3 text-sm font-bold text-[#4a634e] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-wait disabled:opacity-60"
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-h-11 rounded-xl bg-rose-700 px-5 py-3 text-sm font-bold text-white cursor-pointer hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isDeleting ? t.historyDeletingBtn : t.historyDeleteConfirmBtn}
          </button>
        </div>
      </div>
    </dialog>
  );
}

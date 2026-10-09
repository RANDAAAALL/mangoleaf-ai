import { useEffect, useId, useRef, memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "@/components/brand/icon";

interface DiagnosticScannerProps {
  previewUrl: string | null;
  isScanning: boolean;
  isCheckingPhoto: boolean;
  photoCheckFailed: boolean;
  isDuplicate: boolean;
  canRunDiagnosis: boolean;
  scanningProgress: number;
  language: Language;
  onRunDiagnosis: () => void;
  onRetake: () => void;
  onClose: () => void;
  onViewSavedResult: () => void;
  onRetryPhotoCheck: () => void;
}

export const DiagnosticScanner = memo(function DiagnosticScanner({
  previewUrl,
  isScanning,
  isCheckingPhoto,
  photoCheckFailed,
  isDuplicate,
  canRunDiagnosis,
  scanningProgress,
  language,
  onRunDiagnosis,
  onRetake,
  onClose,
  onViewSavedResult,
  onRetryPhotoCheck,
}: DiagnosticScannerProps) {
  const t = translations[language];
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // The parent restores the persistent Scan launcher on dismissal.
  useEffect(() => {
    if (!previewUrl) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.focus({ preventScroll: true });

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        dialog.focus({ preventScroll: true });
      }
    };
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("focusin", containFocus);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!previewUrl) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isScanning) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const buttons = Array.from(
        dialog.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
      ).filter((button) => button.getClientRects().length > 0);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
      } else if (
        !buttons.includes(document.activeElement as HTMLButtonElement)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewUrl, isScanning, onClose]);

  useEffect(() => {
    // A lookup or inference can remove the focused action. Keep focus local.
    const dialog = dialogRef.current;
    if (previewUrl && dialog && !dialog.contains(document.activeElement)) {
      dialog.focus({ preventScroll: true });
    }
  }, [previewUrl, isScanning, isCheckingPhoto, isDuplicate, photoCheckFailed]);

  return (
    <div className="relative mb-10">
      {/* Floating Active Photo Preview & AI Scanning Overlay Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={isScanning ? undefined : descriptionId}
            tabIndex={-1}
            className="relative bg-white border border-[#e2ebd9] rounded-3xl p-6 max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col items-center gap-5 shadow-2xl text-center outline-none"
          >
            {!isScanning && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t.closeBtn}
                className="absolute top-2 right-2 h-11 w-11 rounded-full text-[#143519] hover:bg-[#f0f7eb] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
              >
                <Icon name="close" size={18} aria-hidden="true" />
              </button>
            )}
            <h3 id={titleId} className="text-lg font-bold text-[#143519] px-7">
              {isScanning
                ? t.runningAI
                : isDuplicate
                  ? t.duplicatePhotoTitle
                  : t.reviewPhotoTitle}
            </h3>

            {/* Photo quality reminder (hidden while scanning) */}
            {!isScanning && (
              <p
                id={descriptionId}
                className="text-xs text-[#526856] font-medium leading-relaxed -mt-2 max-w-[280px]"
              >
                {isDuplicate ? t.duplicatePhotoDescription : t.photoCheckHint}
              </p>
            )}

            {/* Photo Thumbnail */}
            <div className="relative w-48 h-48 shrink-0 rounded-2xl overflow-hidden border-2 border-[#277839] shadow-md">
              <img
                src={previewUrl}
                alt={t.photoPreviewAlt}
                className="w-full h-full object-contain"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-[#277839]/30 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Keep the live region mounted so completed checks are announced. */}
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={
                isCheckingPhoto && !isScanning
                  ? "text-xs font-semibold text-[#526856]"
                  : "sr-only"
              }
            >
              {!isScanning &&
                (isCheckingPhoto
                  ? t.checkingPhoto
                  : isDuplicate
                    ? `${t.duplicatePhotoTitle}. ${t.duplicatePhotoDescription}`
                    : "")}
            </p>
            {!isScanning && photoCheckFailed && (
              <p role="alert" className="text-xs font-medium text-[#8a3d10]">
                {t.photoCheckFailedText}
              </p>
            )}

            {/* Scanning Progress Bar */}
            {isScanning ? (
              <div className="w-full flex flex-col gap-2">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#277839] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${scanningProgress}%` }}
                  />
                </div>
                <span
                  role="status"
                  className="text-xs font-semibold text-[#526856]"
                >
                  {t.runningAI} ({scanningProgress}%)
                </span>
              </div>
            ) : (
              /* Action Buttons Container (Responsive stacking on mobile, no text squishing!) */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={
                    isDuplicate
                      ? onClose
                      : photoCheckFailed
                        ? onRetryPhotoCheck
                        : onRunDiagnosis
                  }
                  disabled={
                    isCheckingPhoto ||
                    (!isDuplicate && !photoCheckFailed && !canRunDiagnosis)
                  }
                  className="w-full py-3 bg-[#277839] text-white hover:bg-[#1f622d] font-extrabold rounded-xl text-xs transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {isDuplicate
                    ? t.cancelBtn
                    : photoCheckFailed
                      ? t.retryPhotoCheckBtn
                      : t.runDiagnosisBtn}
                </button>
                <button
                  type="button"
                  onClick={onRetake}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer order-2 sm:order-1 flex items-center justify-center gap-1.5"
                >
                  <Icon name="camera" size={16} fill="currentColor" />
                  <span>{t.retakeBtn}</span>
                </button>
              </div>
            )}
            {!isScanning && isDuplicate && (
              <button
                type="button"
                onClick={onViewSavedResult}
                className="text-xs font-semibold text-[#277839] underline underline-offset-4 rounded-md py-2 px-3 cursor-pointer hover:text-[#143519]"
              >
                {t.viewSavedResultBtn}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

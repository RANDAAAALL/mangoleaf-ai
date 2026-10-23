import { memo, useEffect, useId, useRef } from "react";
import { translations, type Language } from "@/lib/translations";
import { isAndroidBuild } from "@/lib/native-bridge";
import { isAutomaticTestBackup } from "@/lib/cloud-target";
import { Icon } from "@/components/brand/icon";

interface LegalModalProps {
  type: "privacy" | "terms" | null;
  language: Language;
  onClose: () => void;
}

export const LegalModal = memo(function LegalModal({
  type,
  language,
  onClose,
}: LegalModalProps) {
  const t = translations[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!type || !dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [type]);

  if (!type) return null;
  const isPrivacy = type === "privacy";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-2xl max-h-[85dvh] rounded-3xl border border-[#cce0be] bg-white p-6 text-[#143519] shadow-2xl backdrop:bg-black/60 sm:p-8"
    >
      <div className="flex max-h-[calc(85dvh-4rem)] flex-col gap-5">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2ebd9] pb-4">
          <h2 id={titleId} className="text-xl font-bold sm:text-2xl">
            {isPrivacy ? t.privacyPolicy : t.termsOfService}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6faf1] text-[#277839] cursor-pointer hover:bg-[#e2ebd9]"
          >
            <Icon name="close" size={20} aria-hidden="true" />
          </button>
        </div>

        <div
          lang={language === "en" ? "en" : "ceb"}
          className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-2 text-sm leading-relaxed text-[#3b523f]"
        >
          {isPrivacy ? (
            <>
              <p className="font-semibold">
                {isAndroidBuild() ? t.nativePrivacyUpdated : t.privacyUpdated}
              </p>
              {(isAutomaticTestBackup()
                ? t.testingPrivacySections
                : isAndroidBuild()
                  ? t.nativePrivacySections
                  : t.privacySections
              ).map((section) => (
                <section key={section.title}>
                  <h3 className="font-bold">{section.title}</h3>
                  <p>{section.text}</p>
                </section>
              ))}
            </>
          ) : (
            <>
              <p className="font-semibold">{t.termsUpdated}</p>
              <p className="font-semibold">{t.termsIntro}</p>
              <p>
                <strong>{t.termsScopeTitle}</strong> {t.termsScopeText}
              </p>
              <p>
                <strong>{t.termsConfidenceTitle}</strong>{" "}
                {t.termsConfidenceText}
              </p>
              <p>
                <strong>{t.termsGuidanceTitle}</strong> {t.termsGuidanceText}
              </p>
              <p>
                <strong>{t.termsEthicsTitle}</strong> {t.termsEthicsText}
              </p>
            </>
          )}
        </div>

        <div className="border-t border-[#e2ebd9] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-xl bg-[#277839] px-6 py-3 text-sm font-bold text-white cursor-pointer hover:bg-[#1f622d]"
          >
            {t.legalCloseBtn}
          </button>
        </div>
      </div>
    </dialog>
  );
});

"use client";

import Image from "next/image";
import { memo, useEffect, useId, useRef } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { Logo } from "@/components/brand/logo";
import { useScrollLock } from "@/hooks/useScrollLock";
import { translations, type Language } from "@/lib/translations";
import { useAndroidAppLink } from "@/hooks/useAndroidAppLink";

interface InstallGuideOverlayProps {
  language: Language;
  onClose: () => void;
}

interface GuideStep {
  title: string;
  description: string;
  icon: IconName;
}

function InstallationSteps({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#277839] text-xs font-bold text-white"
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Icon
                name={step.icon}
                size={20}
                className="shrink-0 text-[#277839]"
                aria-hidden="true"
              />
              <h4 className="text-sm font-bold">{step.title}</h4>
            </div>
            <p className="text-sm leading-relaxed text-[#526856]">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export const InstallGuideOverlay = memo(function InstallGuideOverlay({
  language,
  onClose,
}: InstallGuideOverlayProps) {
  const t = translations[language];
  const { href: appLink, installed } = useAndroidAppLink();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  useScrollLock(true);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        closeRef.current?.focus({ preventScroll: true });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      // Recheck visible controls because resizing changes the desktop QR link.
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
      } else if (!controls.includes(document.activeElement as HTMLElement)) {
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

    document.addEventListener("focusin", containFocus);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("focusin", containFocus);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  const androidSteps: GuideStep[] = [
    {
      title: t.installGuideAndroidOpen,
      description: t.installGuideAndroidOpenDescription,
      icon: "browser",
    },
    {
      title: t.installGuideAndroidInstall,
      description: t.installGuideAndroidInstallDescription,
      icon: "install",
    },
    {
      title: t.installGuideConfirm,
      description: t.installGuideConfirmDescription,
      icon: "check",
    },
  ];
  return (
    <div
      ref={dialogRef}
      role="dialog"
      lang={language === "en" ? "en" : "ceb"}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      className="fixed inset-0 z-[100] isolate overflow-y-auto overscroll-contain text-[#143519] outline-none"
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Keep blur outside the scroller's fixed-position containing block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[#143519]/35 backdrop-blur-sm"
      />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t.closeBtn}
        className="fixed z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#cfe2c8] bg-[#edf6e9] text-[#143519] shadow-sm transition-colors hover:bg-[#dcebd6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
        style={{
          top: "calc(env(safe-area-inset-top) + 1rem)",
          right: "calc(env(safe-area-inset-right) + 1rem)",
        }}
      >
        <Icon name="close" size={23} aria-hidden="true" />
      </button>

      <div
        className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6 sm:pb-12"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 5rem)" }}
      >
        <div className="rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] p-6 shadow-lg sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cfe2c8] bg-white">
            <Logo width={36} height={36} aria-hidden="true" />
          </div>
          <h2
            id={titleId}
            className="mt-4 text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            <span className="md:hidden">
              {installed ? t.androidOpenApp : t.installGuideMobileTitle}
            </span>
            <span className="hidden md:inline">
              {t.installGuideDesktopTitle}
            </span>
          </h2>
          <p
            id={descriptionId}
            className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-[#526856] sm:text-base"
          >
            {installed
              ? t.androidInstalledConfirmed
              : t.installGuideDescription}
          </p>

          {appLink && (
            <div className="mt-5 text-center">
              <p className="mb-2 text-sm text-[#526856]">
                {installed
                  ? t.androidInstalledConfirmed
                  : t.androidAlreadyInstalled}
              </p>
              <a
                href={appLink}
                className="inline-flex min-h-11 items-center rounded-xl bg-[#277839] px-5 py-3 font-bold text-white"
              >
                {installed ? t.androidOpenApp : t.androidOpenOrInstall}
              </a>
              {/* Use a fresh document for the download page and its availability policy. */}
              <a
                href="/download"
                className="mt-3 block text-sm font-semibold underline"
              >
                {t.androidDownloadGuide}
              </a>
            </div>
          )}

          <div className="mx-auto mt-6 hidden max-w-md flex-col items-center md:flex">
            <p className="mb-4 text-center text-sm leading-relaxed text-[#526856]">
              {t.installGuideQRDescription}
            </p>
            <div className="rounded-2xl border border-[#cfe2c8] bg-white p-3">
              <Image
                src="/install-qr.svg"
                width={232}
                height={232}
                alt={t.installGuideQRAlt}
                unoptimized
                className="h-auto w-58 max-w-full"
              />
            </div>
            <a
              href="https://mangoleafai.vercel.app/?install=1"
              aria-label={t.installGuideWebsiteLink}
              className="mt-3 rounded-sm text-sm font-semibold break-all text-[#277839] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#277839]"
            >
              mangoleafai.vercel.app
            </a>
          </div>
        </div>

        {/* The supported APK and its instructions are the same on every screen. */}
        {!installed && (
          <div className="mt-5">
            <section className="rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] p-6 shadow-lg sm:p-8">
              <h3 className="mb-6 flex items-center gap-3 text-lg font-bold">
                <Icon
                  name="android"
                  size={27}
                  className="text-[#277839]"
                  aria-hidden="true"
                />
                {t.installGuideAndroid}
              </h3>
              <InstallationSteps steps={androidSteps} />
            </section>
          </div>
        )}

        <div className="mt-5 rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] p-5 shadow-lg sm:p-6">
          <div className="mx-auto flex max-w-md flex-col gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-xl border border-[#277839] bg-white px-5 py-3 font-bold text-[#277839] transition-colors hover:bg-[#dcebd6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
            >
              {t.installGuideContinue}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

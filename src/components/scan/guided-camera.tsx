"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/brand/icon";
import { useGuidedCamera } from "@/hooks/useGuidedCamera";
import { translations, type Language } from "@/lib/translations";

interface GuidedCameraProps {
  language: Language;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const GuidedCamera = memo(function GuidedCamera({
  language,
  onCapture,
  onClose,
}: GuidedCameraProps) {
  const t = translations[language];
  const camera = useGuidedCamera();
  const { stop } = camera;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [guideSize, setGuideSize] = useState(0);

  const close = useCallback(() => {
    stop();
    onClose();
  }, [onClose, stop]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.focus({ preventScroll: true });

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        dialog.focus({ preventScroll: true });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;

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

    document.addEventListener("focusin", containFocus);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("focusin", containFocus);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || camera.frameSize.width === 0) return;

    const measureGuide = () => {
      const { width, height } = preview.getBoundingClientRect();
      const ratio = camera.frameSize.width / camera.frameSize.height;
      const imageWidth = Math.min(width, height * ratio);
      const imageHeight = imageWidth / ratio;
      // Object-contain may leave empty space. Size the guide within the image.
      setGuideSize(Math.min(imageWidth, imageHeight) * 0.75);
    };

    const observer = new ResizeObserver(measureGuide);
    observer.observe(preview);
    return () => observer.disconnect();
  }, [camera.frameSize]);

  const messages = {
    unsupported: t.guidedCameraUnsupported,
    permission: t.guidedCameraPermissionDenied,
    unavailable: t.guidedCameraUnavailable,
    start: t.guidedCameraStartFailed,
    capture: t.guidedCameraCaptureFailed,
    interrupted: t.guidedCameraInterrupted,
  };
  const message =
    camera.phase === "paused"
      ? t.guidedCameraPaused
      : camera.error
        ? messages[camera.error]
        : camera.phase === "capturing"
          ? t.guidedCameraCapturing
          : t.guidedCameraStarting;
  const retryAvailable = camera.phase === "error" || camera.phase === "paused";
  const showGuide =
    (camera.phase === "ready" || camera.phase === "capturing") && guideSize > 0;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={hintId}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-y-auto bg-[#edf6e9] text-[#143519] outline-none"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between gap-4 px-5 py-4">
        <h2 id={titleId} className="text-lg font-bold">
          {t.guidedCameraTitle}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label={t.closeBtn}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#143519] transition-colors hover:bg-[#dcebd6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
        >
          <Icon name="close" size={23} aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto flex min-h-56 w-full max-w-3xl flex-1 flex-col px-4">
        <p
          id={hintId}
          className="shrink-0 pb-3 text-center text-sm text-[#526856]"
        >
          {t.guidedCameraHint}
        </p>
        <div
          ref={previewRef}
          className="relative min-h-40 flex-1 overflow-hidden rounded-3xl border border-[#cfe2c8] bg-black"
        >
          <video
            ref={camera.videoRef}
            autoPlay
            playsInline
            muted
            aria-hidden="true"
            onLoadedData={camera.refreshReadiness}
            onCanPlay={camera.refreshReadiness}
            onPlaying={camera.refreshReadiness}
            onResize={camera.refreshReadiness}
            onError={camera.handleVideoError}
            className="absolute inset-0 h-full w-full object-contain"
          />

          {showGuide && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-[3px] border-[#a6f2b1] shadow-[0_0_0_1px_rgba(16,42,22,0.6),0_0_0_999px_rgba(0,0,0,0.18)]"
              style={{ width: guideSize, height: guideSize }}
            />
          )}

          {camera.phase !== "ready" && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 flex items-center justify-center bg-[#edf6e9]/95 p-6 text-center"
            >
              <div className="max-w-sm space-y-4">
                <Icon
                  name="camera-outline"
                  size={36}
                  className="mx-auto text-[#277839]"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-[#143519]">
                  {message}
                </p>
                {retryAvailable && camera.error !== "unsupported" && (
                  <button
                    type="button"
                    onClick={() => void camera.start()}
                    className="min-h-11 rounded-xl bg-[#277839] px-5 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839]"
                  >
                    {t.guidedCameraRetryBtn}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl shrink-0 space-y-3 px-5 pt-3 pb-4">
        <p className="text-center text-xs text-[#526856]">
          {t.guidedCameraGuideNote}
        </p>
        <button
          type="button"
          disabled={camera.phase !== "ready"}
          onClick={() => void camera.capture(onCapture)}
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#277839] px-4 py-4 font-bold text-white transition-colors hover:bg-[#1f622d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#277839] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Icon name="camera" size={22} aria-hidden="true" />
          {camera.phase === "capturing"
            ? t.guidedCameraCapturing
            : t.guidedCameraCaptureBtn}
        </button>
      </div>
    </div>
  );
});

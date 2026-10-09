"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import { translations, type Language } from "@/lib/translations";
import { Icon } from "@/components/brand/icon";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ScanSheetProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onCamera: () => void;
}

const DISMISS_THRESHOLD_PX = 80;
const EXIT_MS = 220;
const SNAP_MS = 220;

export const ScanSheet = memo(function ScanSheet({
  isOpen,
  language,
  onClose,
  onCamera,
}: ScanSheetProps) {
  const t = translations[language];
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [enterAnimationDone, setEnterAnimationDone] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);
  const mouseListenersRef = useRef<{
    move: (e: MouseEvent) => void;
    up: () => void;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setDragY(0);
      dragYRef.current = 0;
      setIsDismissing(false);
      setEnterAnimationDone(false);
      const frame = requestAnimationFrame(() => setIsVisible(true));
      const enterTimer = window.setTimeout(
        () => setEnterAnimationDone(true),
        280,
      );
      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(enterTimer);
      };
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => {
      setShouldRender(false);
      setIsDismissing(false);
      setDragY(0);
      dragYRef.current = 0;
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
      }
      if (mouseListenersRef.current) {
        window.removeEventListener("mousemove", mouseListenersRef.current.move);
        window.removeEventListener("mouseup", mouseListenersRef.current.up);
        mouseListenersRef.current = null;
      }
    };
  }, []);

  useScrollLock(shouldRender);

  const handleCamera = () => {
    onClose();
    onCamera();
  };

  const handleGallery = () => {
    const input = document.getElementById(
      "scan-gallery-input",
    ) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      input.click();
    }
    onClose();
  };

  const handleDragStart = useCallback((clientY: number) => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
      setIsDismissing(false);
    }

    setEnterAnimationDone(true);
    dragStartY.current = clientY - dragYRef.current;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    const delta = clientY - dragStartY.current;
    const nextY = Math.max(0, delta);
    dragYRef.current = nextY;

    // Direct DOM manipulation — zero React re-renders during drag
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${nextY}px)`;
    }
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(Math.max(0, 1 - nextY / 280));
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Clean up window-level mouse listeners
    if (mouseListenersRef.current) {
      window.removeEventListener("mousemove", mouseListenersRef.current.move);
      window.removeEventListener("mouseup", mouseListenersRef.current.up);
      mouseListenersRef.current = null;
    }

    const current = dragYRef.current;
    if (current > DISMISS_THRESHOLD_PX) {
      const sheetHeight = sheetRef.current?.offsetHeight ?? 320;
      setIsDismissing(true);
      dragYRef.current = sheetHeight;
      setDragY(sheetHeight);
      dismissTimerRef.current = window.setTimeout(() => {
        dismissTimerRef.current = null;
        onClose();
      }, SNAP_MS);
      return;
    }

    dragYRef.current = 0;
    setDragY(0);
  }, [onClose]);

  const handleDragStartRef = useRef(handleDragStart);
  const handleDragMoveRef = useRef(handleDragMove);
  const handleDragEndRef = useRef(handleDragEnd);
  handleDragStartRef.current = handleDragStart;
  handleDragMoveRef.current = handleDragMove;
  handleDragEndRef.current = handleDragEnd;

  useEffect(() => {
    const handle = dragHandleRef.current;
    if (!handle || !shouldRender) return;

    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      handleDragStartRef.current(event.touches[0].clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      handleDragMoveRef.current(event.touches[0].clientY);
    };

    const onTouchEnd = () => {
      handleDragEndRef.current();
    };

    const onMouseDown = (event: MouseEvent) => {
      handleDragStartRef.current(event.clientY);

      const onMouseMove = (e: MouseEvent) =>
        handleDragMoveRef.current(e.clientY);
      const onMouseUp = () => {
        handleDragEndRef.current();
      };

      mouseListenersRef.current = { move: onMouseMove, up: onMouseUp };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("touchstart", onTouchStart, { passive: false });
    handle.addEventListener("touchmove", onTouchMove, { passive: false });
    handle.addEventListener("touchend", onTouchEnd);
    handle.addEventListener("touchcancel", onTouchEnd);
    handle.addEventListener("mousedown", onMouseDown);

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
      handle.removeEventListener("touchcancel", onTouchEnd);
      handle.removeEventListener("mousedown", onMouseDown);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  const useInlineTransform = isDragging || isDismissing || dragY > 0;
  const sheetTransform = useInlineTransform
    ? `translateY(${isDragging ? dragYRef.current : dragY}px)`
    : undefined;

  const sheetMotionClass = useInlineTransform
    ? ""
    : !isVisible
      ? "sheet-exit"
      : !enterAnimationDone
        ? "sheet-enter"
        : "";

  return (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/40 md:backdrop-blur-xs ${
          isVisible ? "backdrop-enter" : "backdrop-exit"
        }`}
        style={{
          opacity: isDragging
            ? Math.max(0, 1 - dragYRef.current / 280)
            : isDismissing || dragY > 0
              ? Math.max(0, 1 - dragY / 280)
              : undefined,
          transition: isDragging ? "none" : `opacity ${SNAP_MS}ms ease-out`,
        }}
      />

      {/* Auto margins center the desktop panel without competing with the vertical drag transform. */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[calc(100dvh-1rem)] md:mx-auto md:max-w-[520px] flex flex-col bg-white rounded-t-3xl shadow-2xl touch-none will-change-transform ${sheetMotionClass}`}
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          transform: sheetTransform,
          transition: isDragging ? "none" : `transform ${SNAP_MS}ms ease-out`,
        }}
      >
        <div
          ref={dragHandleRef}
          className="shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="w-10 h-1.5 bg-[#d2e2c4] rounded-full" />
        </div>

        {/* Only the content scrolls; the drag handle stays available on short screens. */}
        <div className="min-h-0 overflow-y-auto px-6 flex flex-col gap-3 touch-auto">
          <h3 className="shrink-0 text-lg font-bold text-[#143519] text-center">
            {t.scanSheetTitle}
          </h3>

          {/* Shared advice applies to both camera capture and existing gallery photos. */}
          <div className="shrink-0 space-y-2 rounded-2xl border border-[#d2e2c4] bg-[#f0f7eb] p-3 text-left">
            <h4 className="flex items-center gap-2 text-[13px] font-bold text-[#143519]">
              <Icon
                name="about"
                size={16}
                className="shrink-0"
                aria-hidden="true"
              />
              {t.scanSheetTipsTitle}
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-[13px] leading-[1.45] text-[#526856]">
              <li>
                <span className="font-bold text-[#143519]">
                  {t.scanSheetFramingLabel}
                </span>{" "}
                {t.scanSheetFramingTip}
              </li>
              <li>
                <span className="font-bold text-[#143519]">
                  {t.scanSheetLightingLabel}
                </span>{" "}
                {t.scanSheetLightingTip}
              </li>
            </ul>
          </div>

          {/* Auto rows, not grid-rows-2: the camera card is md:hidden, and an
              explicit second row would still reserve its gap on desktop. */}
          <div className="shrink-0 grid gap-3">
            {/* The mobile camera opens a guided live preview. */}
            <button
              onClick={handleCamera}
              className="md:hidden flex flex-col items-center gap-3 p-5 bg-[#277839] text-white rounded-2xl shadow-md cursor-pointer active:scale-[0.97] transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-[#a6f2b1] flex items-center justify-center">
                <Icon name="camera" size={24} fill="#1b5e28" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold">{t.takePhotoBtn}</span>
                <span className="text-xs text-emerald-100 leading-relaxed text-center">
                  {t.scanSheetCameraDesc}
                </span>
              </div>
            </button>

            <button
              onClick={handleGallery}
              className="flex flex-col items-center gap-3 p-5 bg-[#f59e2b] text-[#2c1806] rounded-2xl shadow-md cursor-pointer active:scale-[0.97] transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-[#3d2008] flex items-center justify-center">
                <Icon
                  name="gallery"
                  size={22}
                  strokeWidth={2.5}
                  color="white"
                />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold">{t.uploadPhotoBtn}</span>
                <span className="text-xs text-[#523012] leading-relaxed text-center">
                  {t.scanSheetGalleryDesc}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Cancel stays visible while the photo options and tips scroll on short screens. */}
        <div className="shrink-0 px-6 pt-3 touch-auto">
          <button
            onClick={onClose}
            className="shrink-0 w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm cursor-pointer hover:bg-slate-200 transition-colors"
          >
            {t.cancelBtn}
          </button>
        </div>
      </div>
    </>
  );
});

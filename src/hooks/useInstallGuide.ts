import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

export type InstallPlatform = "android" | "ios" | "other";

/** Open the optional installation guide from a button or a QR landing URL. */
export function useInstallGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const launcherRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // Read the browser after hydration; StrictMode's cancelled pass consumes nothing.
    queueMicrotask(() => {
      if (cancelled) return;
      // Choose instructions only. Native install support comes from its event.
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setPlatform(
        isIOS
          ? "ios"
          : /Android/.test(navigator.userAgent)
            ? "android"
            : "other",
      );

      const url = new URL(window.location.href);
      if (url.searchParams.get("install") !== "1") return;

      // Consume this flag, keeping other query values, the hash and router state.
      url.searchParams.delete("install");
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + url.search + url.hash,
      );

      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as Record<string, unknown>).standalone === true;
      if (!isStandalone) setIsOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isOpen || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const launcher = launcherRef.current;
    const target =
      launcher?.isConnected && launcher !== document.body
        ? launcher
        : document.querySelector<HTMLElement>("main");
    target?.focus({ preventScroll: true });
  }, [isOpen]);

  const openGuide = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    // Safari clicks need not focus a button. Keep the actual launcher before
    // the underlying page becomes inert and loses focus.
    launcherRef.current =
      event?.currentTarget ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    setIsOpen(true);
  }, []);
  const closeGuide = useCallback(() => {
    restoreFocusRef.current = true;
    setIsOpen(false);
  }, []);

  return { isOpen, platform, openGuide, closeGuide };
}

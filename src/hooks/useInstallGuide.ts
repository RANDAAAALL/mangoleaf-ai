import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { isAndroidBuild } from "@/lib/native-bridge";

/** Open the optional installation guide from a button or a QR landing URL. */
export function useInstallGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (isAndroidBuild()) return;
    let cancelled = false;
    // The supported mobile app is the Android APK, not a browser installation.
    const suppressBrowserInstall = (event: Event) => event.preventDefault();
    window.addEventListener("beforeinstallprompt", suppressBrowserInstall);
    // Read the browser after hydration; StrictMode's cancelled pass consumes nothing.
    queueMicrotask(() => {
      if (cancelled) return;
      const url = new URL(window.location.href);
      if (url.searchParams.get("install") !== "1") return;

      // Consume this flag, keeping other query values, the hash and router state.
      url.searchParams.delete("install");
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + url.search + url.hash,
      );

      // A legacy Home Screen website does not prove the separate Android APK is installed.
      setIsOpen(true);
    });
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", suppressBrowserInstall);
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
    if (isAndroidBuild()) return;
    // Pointer clicks need not focus a button. Keep the actual launcher before
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

  return { isOpen, openGuide, closeGuide };
}

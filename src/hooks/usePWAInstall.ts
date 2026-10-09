import { useCallback, useEffect, useRef, useState } from "react";

// Supporting browsers provide this event. iOS uses Home Screen instructions.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Keep a native install request available until an explicit button tap. */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);
  const installingRef = useRef(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const checkStandalone = () => {
      if (
        standalone.matches ||
        (window.navigator as unknown as Record<string, unknown>).standalone ===
          true
      ) {
        setIsInstalled(true);
        setInstallPrompt(null);
      }
    };

    checkStandalone();

    // Native install eligibility can arrive after the guide has opened.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setInstallError(false);
    };

    // Capture successful installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstallError(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    // Older Safari exposes the legacy MediaQueryList listener methods.
    if (typeof standalone.addEventListener === "function") {
      standalone.addEventListener("change", checkStandalone);
    } else {
      standalone.addListener(checkStandalone);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (typeof standalone.removeEventListener === "function") {
        standalone.removeEventListener("change", checkStandalone);
      } else {
        standalone.removeListener(checkStandalone);
      }
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt || isInstalled || installingRef.current) return;

    installingRef.current = true;
    setIsInstalling(true);
    setInstallError(false);
    // A native prompt event is single-use, including after cancellation.
    setInstallPrompt(null);

    try {
      // Call within the tap handler; URL loading never calls this.
      await installPrompt.prompt();
      await installPrompt.userChoice;
      // appinstalled/standalone confirms installation, rather than acceptance.
    } catch {
      setInstallError(true);
    } finally {
      installingRef.current = false;
      setIsInstalling(false);
    }
  }, [installPrompt, isInstalled]);

  return {
    showInstallButton: Boolean(installPrompt) && !isInstalled,
    installApp,
    isInstalled,
    isInstalling,
    installError,
  };
}

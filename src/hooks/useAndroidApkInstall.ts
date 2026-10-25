import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAndroidApkInstaller,
  isApkInstallActive,
  type AndroidApkInstallState,
} from "@/lib/android-apk-install";
import type { AndroidApkOffer } from "@/lib/android-update";
import { isCloudBackupRunning } from "@/lib/cloud-backup";

/** One native transfer shared by the update notice and About; no private cloud identity is created. */
export function useAndroidApkInstall(blocked: boolean) {
  const [state, setState] = useState<AndroidApkInstallState | null>(null);
  const blockedRef = useRef(blocked);
  const controller = useRef<ReturnType<
    typeof createAndroidApkInstaller
  > | null>(null);
  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);
  useEffect(() => {
    const active = createAndroidApkInstaller(
      setState,
      () =>
        !blockedRef.current &&
        !isCloudBackupRunning() &&
        !document.querySelector(
          'dialog[open]:not([data-apk-update]), [role="dialog"]:not([data-apk-update]), [aria-busy="true"]:not([data-apk-update])',
        ),
    );
    controller.current = active;
    return () => {
      controller.current = null;
      active.dispose();
    };
  }, []);
  return {
    state,
    busy: isApkInstallActive(state),
    start: useCallback((offer: AndroidApkOffer) => {
      void controller.current?.start(offer);
    }, []),
    cancel: useCallback(() => controller.current?.cancel(), []),
    dismiss: useCallback(() => controller.current?.dismiss(), []),
    isInstalling: useCallback(
      () => controller.current?.isInstalling() === true,
      [],
    ),
  };
}

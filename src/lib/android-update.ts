import {
  connectionHint,
  initializeNativeRuntime,
  isAndroidBuild,
  nativeRequest,
  subscribeConnection,
} from "@/lib/native-bridge";
import {
  fetchAndroidRelease,
  type AndroidRelease,
} from "@/lib/android-release";
import { isNewerAndroidApk } from "@/lib/android-version.mjs";

export type AndroidApkOffer = { tag: string; version: string };

/** Native APK offers use a verified published asset label, independently of the web release tag/OTA. */
export function watchAndroidApkUpdate(
  onReady: (offer: AndroidApkOffer) => void,
  isIdle: () => boolean,
) {
  if (
    !isAndroidBuild() ||
    process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT !== "production"
  )
    return () => {};
  let stopped = false;
  let disabled = false;
  let checking = false;
  let lastCheck: number | undefined;
  let pending: AndroidRelease | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  async function poll() {
    clearTimeout(timer);
    if (
      stopped ||
      disabled ||
      checking ||
      document.visibilityState !== "visible"
    )
      return;
    checking = true;
    try {
      if (!isIdle()) return;
      const info = await initializeNativeRuntime();
      if (
        info.cloudEnvironment !== "production" ||
        info.apkUpdateSupported !== true ||
        !info.hostVersionName ||
        info.hostVersionName.endsWith("-dev")
      ) {
        disabled = true;
        return;
      }
      if (
        stopped ||
        document.visibilityState !== "visible" ||
        !connectionHint() ||
        !isIdle()
      )
        return;
      if (
        !pending &&
        connectionHint() &&
        (lastCheck === undefined || Date.now() - lastCheck >= 15 * 60_000)
      ) {
        lastCheck = Date.now();
        controller = new AbortController();
        pending = await fetchAndroidRelease(controller.signal);
        if (controller.signal.aborted) lastCheck = undefined;
      }
      if (
        stopped ||
        document.visibilityState !== "visible" ||
        !connectionHint() ||
        !isIdle()
      )
        return;
      if (
        pending?.apkVersion &&
        isNewerAndroidApk(pending.apkVersion, info.hostVersionName)
      ) {
        stopped = true;
        onReady({ tag: pending.tag, version: pending.apkVersion });
      }
      // Equal/older/unlabelled releases do not need another comparison on each idle tick.
      if (
        pending &&
        (!pending.apkVersion ||
          !isNewerAndroidApk(pending.apkVersion, info.hostVersionName))
      )
        pending = null;
    } catch {
      // Public update discovery cannot interrupt offline scanning or expose a false offer.
    } finally {
      checking = false;
      if (!stopped && !disabled && document.visibilityState === "visible")
        timer = setTimeout(() => void poll(), 15_000);
    }
  }
  const wake = () => {
    if (document.visibilityState !== "visible") {
      clearTimeout(timer);
      controller?.abort();
    } else void poll();
  };
  const unsubscribe = subscribeConnection(wake);
  document.addEventListener("visibilitychange", wake);
  void poll();
  return () => {
    stopped = true;
    clearTimeout(timer);
    controller?.abort();
    unsubscribe();
    document.removeEventListener("visibilitychange", wake);
  };
}

/** Observe native verification, never interpret a check acknowledgment as a ready update. */
export function watchAndroidUpdate(
  onReady: (canRestart: boolean) => void,
  isIdle: () => boolean,
) {
  if (!isAndroidBuild()) return () => {};
  let stopped = false;
  let disabled = false;
  let polling = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastCheck: number | undefined;

  async function poll() {
    clearTimeout(timer);
    if (stopped || disabled || polling) return;
    if (document.visibilityState !== "visible") return;
    if (!isIdle()) {
      timer = setTimeout(() => void poll(), 5000);
      return;
    }
    polling = true;
    try {
      const info = await initializeNativeRuntime();
      const result = await nativeRequest<{ status: string }>("ota.status");
      if (stopped) return;
      if (result.status === "disabled") {
        disabled = true;
        return;
      }
      if (result.status === "staged") {
        // A scan or recovery may have started while the bridge request was settling.
        if (document.visibilityState === "visible" && isIdle()) {
          stopped = true;
          onReady(info.updateRestartSupported === true);
          return;
        }
      } else if (
        connectionHint() &&
        isIdle() &&
        (lastCheck === undefined || Date.now() - lastCheck >= 15 * 60_000)
      ) {
        lastCheck = Date.now();
        await nativeRequest("ota.check");
      }
    } catch {
      // A failed check never interrupts offline diagnosis or displays a false update offer.
    } finally {
      polling = false;
      if (!stopped && !disabled) timer = setTimeout(() => void poll(), 15_000);
    }
  }

  const wake = () => void poll();
  const unsubscribe = subscribeConnection(wake);
  document.addEventListener("visibilitychange", wake);
  void poll();
  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
    document.removeEventListener("visibilitychange", wake);
  };
}

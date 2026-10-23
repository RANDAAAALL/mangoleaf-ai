import {
  connectionHint,
  initializeNativeRuntime,
  isAndroidBuild,
  nativeRequest,
  subscribeConnection,
} from "@/lib/native-bridge";

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

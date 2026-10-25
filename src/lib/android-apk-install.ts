import {
  connectionHint,
  initializeNativeRuntime,
  isAndroidBuild,
  nativeRequest,
  subscribeConnection,
} from "@/lib/native-bridge";
import { isNewerAndroidApk } from "@/lib/android-version.mjs";
import type { AndroidApkOffer } from "@/lib/android-update";

export type AndroidApkInstallState = {
  id: string;
  version: string;
  status:
    | "starting"
    | "downloading"
    | "verifying"
    | "ready"
    | "installing"
    | "cancelled"
    | "failed"
    | "installed";
  downloaded: number;
  total: number;
  error?: "UNSUPPORTED" | "NETWORK" | "FAILED";
};

export const isApkInstallActive = (state: AndroidApkInstallState | null) =>
  Boolean(
    state &&
    state.status !== "failed" &&
    state.status !== "cancelled" &&
    state.status !== "installed",
  );

const maximumBytes = 128 * 1024 * 1024;
const nativeStates = new Set([
  "downloading",
  "verifying",
  "ready",
  "installing",
  "cancelled",
  "failed",
  "installed",
]);

/** A caller-generated ID binds late native replies and cancellation to one explicit attempt. */
export function createAndroidApkInstaller(
  changed: (state: AndroidApkInstallState | null) => void,
  isIdle: () => boolean,
) {
  let current: AndroidApkInstallState | null = null;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let startedAt = 0;
  let installRequested = false;
  let nativeStartedId: string | undefined;
  let inFlight: string | undefined;
  let stoppedListening: (() => void) | undefined;

  const publish = (state: AndroidApkInstallState | null) => {
    current = state;
    if (!disposed) changed(state);
  };
  const owns = (id: string) =>
    !disposed && current?.id === id && isApkInstallActive(current);
  const cancelNative = (id: string) =>
    nativeRequest("apkUpdate.cancel", { id }, 10_000).catch(() => {});
  const stopTimer = () => clearTimeout(timer);

  function cancel() {
    if (
      !current ||
      !isApkInstallActive(current) ||
      current.status === "installing"
    )
      return;
    const value = current;
    stopTimer();
    publish({ ...value, status: "cancelled" });
    if (nativeStartedId === value.id) void cancelNative(value.id);
  }

  function fail(id: string, error: AndroidApkInstallState["error"] = "FAILED") {
    if (!owns(id)) return;
    stopTimer();
    publish({ ...current!, status: "failed", error });
    if (nativeStartedId === id) void cancelNative(id);
  }

  function read(value: unknown, id: string): AndroidApkInstallState {
    const state = value as Partial<AndroidApkInstallState> | null;
    if (
      !state ||
      state.id !== id ||
      (state.version !== current?.version &&
        !(state.status === "cancelled" && state.version === "")) ||
      !nativeStates.has(state.status || "") ||
      !Number.isSafeInteger(state.downloaded) ||
      !Number.isSafeInteger(state.total) ||
      state.downloaded! < 0 ||
      state.total! < 0 ||
      state.total! > maximumBytes ||
      state.downloaded! > state.total! ||
      (["ready", "installing"].includes(state.status || "") &&
        (state.total === 0 || state.downloaded !== state.total)) ||
      (state.status === "installing" && !installRequested) ||
      (state.status === "installed" && !installRequested) ||
      (installRequested &&
        !["installing", "cancelled", "failed", "installed"].includes(
          state.status || "",
        ))
    )
      throw new Error("Invalid native installer state.");
    return {
      id,
      version: current!.version,
      status: state.status!,
      downloaded: state.downloaded!,
      total: state.total!,
    };
  }

  function schedule(id: string) {
    // A superseded request's finally must never clear the new attempt's polling timer.
    if (!owns(id)) return;
    stopTimer();
    if (
      owns(id) &&
      !(
        document.visibilityState !== "visible" &&
        current?.status === "installing"
      )
    )
      timer = setTimeout(() => void poll(id), 500);
  }

  async function accept(value: unknown, id: string) {
    if (!owns(id)) return;
    const state = read(value, id);
    publish(state);
    if (!owns(id)) return;
    if (
      state.status === "ready" &&
      !installRequested &&
      document.visibilityState === "visible" &&
      connectionHint() &&
      isIdle()
    ) {
      // Mark handoff synchronously before native Android UI can background this page.
      installRequested = true;
      publish({ ...state, status: "installing" });
      const result = await nativeRequest("apkUpdate.install", { id }, 10_000);
      if (!owns(id)) return;
      publish(read(result, id));
    }
  }

  async function poll(id: string) {
    if (!owns(id)) return;
    if (inFlight === id) {
      schedule(id);
      return;
    }
    if (
      document.visibilityState !== "visible" &&
      current?.status === "installing"
    )
      return;
    if (
      current?.status !== "installing" &&
      (!connectionHint() || document.visibilityState !== "visible")
    ) {
      fail(id, "NETWORK");
      return;
    }
    // Native download has its own tighter limits; never keep a caller waiting indefinitely.
    if (
      current?.status !== "installing" &&
      Date.now() - startedAt > 15 * 60_000
    ) {
      fail(id);
      return;
    }
    try {
      inFlight = id;
      await accept(await nativeRequest("apkUpdate.status", { id }, 10_000), id);
    } catch {
      fail(id);
    } finally {
      if (inFlight === id) inFlight = undefined;
      schedule(id);
    }
  }

  const wake = () => {
    if (!current || !isApkInstallActive(current)) return;
    if (
      current.status !== "installing" &&
      (!connectionHint() || document.visibilityState !== "visible")
    ) {
      if (!connectionHint()) fail(current.id, "NETWORK");
      else cancel();
    } else if (document.visibilityState === "visible") {
      // A single scheduled poll avoids overlap with a still-settling native request.
      schedule(current.id);
    }
  };

  async function start(offer: AndroidApkOffer) {
    if (disposed || isApkInstallActive(current)) return;
    const id = crypto.randomUUID();
    installRequested = false;
    startedAt = Date.now();
    publish({
      id,
      version: offer.version,
      status: "starting",
      downloaded: 0,
      total: 0,
    });
    try {
      inFlight = id;
      if (
        !isAndroidBuild() ||
        process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT !== "production"
      ) {
        fail(id, "UNSUPPORTED");
        return;
      }
      if (
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(offer.tag) ||
        offer.tag.includes("..")
      )
        throw new Error("Invalid native installer release.");
      const info = await initializeNativeRuntime();
      if (!owns(id)) return;
      if (
        info.cloudEnvironment !== "production" ||
        info.apkUpdateSupported !== true ||
        !isNewerAndroidApk(offer.version, info.hostVersionName)
      ) {
        fail(id, "UNSUPPORTED");
        return;
      }
      if (
        !connectionHint() ||
        document.visibilityState !== "visible" ||
        !isIdle()
      )
        throw new Error("Native installer is not idle.");
      if (!stoppedListening) {
        const unsubscribe = subscribeConnection(wake);
        document.addEventListener("visibilitychange", wake);
        stoppedListening = () => {
          unsubscribe();
          document.removeEventListener("visibilitychange", wake);
        };
      }
      nativeStartedId = id;
      await accept(
        await nativeRequest(
          "apkUpdate.start",
          { id, tag: offer.tag, version: offer.version },
          10_000,
        ),
        id,
      );
    } catch {
      fail(id);
    } finally {
      if (inFlight === id) inFlight = undefined;
      schedule(id);
    }
  }

  return {
    start,
    cancel,
    dismiss() {
      if (isApkInstallActive(current)) return;
      publish(null);
    },
    isInstalling: () => current?.status === "installing",
    dispose() {
      if (
        current &&
        nativeStartedId === current.id &&
        isApkInstallActive(current) &&
        current.status !== "installing"
      )
        void cancelNative(current.id);
      disposed = true;
      stopTimer();
      stoppedListening?.();
    },
  };
}

/** Android bundles must fail closed when their trusted native bridge is missing. */
export const isAndroidBuild = () =>
  process.env.NEXT_PUBLIC_APP_TARGET === "android";

const nativeOrigin = "https://appassets.androidplatform.net";
type NativePort = {
  postMessage: (message: string) => void;
  onmessage?: (message: { data: string }) => void;
};
type NativeEvent = { event: string; payload: unknown };
type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
const requests = new Map<string, PendingRequest>();
const subscribers = new Set<(event: NativeEvent) => void>();
let attachedPort: NativePort | undefined;
let connection = { connected: false, validated: false };
let initialization: Promise<NativeInfo> | undefined;

export type NativeInfo = {
  hostVersion: number;
  hostVersionName?: string;
  bridgeVersion: number;
  schemaVersion: number;
  connected: boolean;
  validated: boolean;
  cloudEnvironment: "testing" | "production";
  updateRestartSupported?: boolean;
};

function bridgeError(code: string) {
  const error = new Error("Android operation could not complete.");
  error.name =
    code === "QUOTA_EXCEEDED" ? "QuotaExceededError" : "NativeBridgeError";
  return error;
}

/** Only the fixed local app origin may use the native message channel. */
function getPort(): NativePort {
  if (
    !isAndroidBuild() ||
    typeof window === "undefined" ||
    window.location.origin !== nativeOrigin
  ) {
    throw bridgeError("UNAVAILABLE");
  }
  const port = (window as unknown as { MangoLeafNative?: NativePort })
    .MangoLeafNative;
  if (!port || typeof port.postMessage !== "function")
    throw bridgeError("UNAVAILABLE");
  if (attachedPort !== port) {
    port.onmessage = ({ data }) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(data);
      } catch {
        return;
      }
      if (!message || typeof message !== "object") return;
      if (typeof message.event === "string") {
        if (message.event === "connectivity") {
          const status = message.payload as Partial<typeof connection> | null;
          connection = {
            connected: status?.connected === true,
            validated: status?.validated === true,
          };
        }
        for (const subscriber of subscribers) {
          try {
            subscriber({ event: message.event, payload: message.payload });
          } catch {
            /* One view cannot prevent other subscribers from receiving a change. */
          }
        }
        return;
      }
      if (typeof message.id !== "string") return;
      const pending = requests.get(message.id);
      if (!pending) return;
      requests.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) {
        const code = (message.error as { code?: string }).code;
        pending.reject(bridgeError(typeof code === "string" ? code : "FAILED"));
      } else pending.resolve(message.result);
    };
    attachedPort = port;
  }
  return port;
}

/** Timeout releases the caller; a native write can still settle and is retried by ID. */
export function nativeRequest<T>(
  method: string,
  payload: unknown = {},
  timeoutMs = 30_000,
): Promise<T> {
  let port: NativePort;
  try {
    port = getPort();
  } catch (error) {
    return Promise.reject(error);
  }
  if (requests.size >= 64) return Promise.reject(bridgeError("BUSY"));
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      requests.delete(id);
      reject(bridgeError("TIMEOUT"));
    }, timeoutMs);
    requests.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
      timer,
    });
    try {
      port.postMessage(JSON.stringify({ id, method, payload }));
    } catch (error) {
      requests.delete(id);
      clearTimeout(timer);
      reject(error);
    }
  });
}

export function subscribeNativeEvents(callback: (event: NativeEvent) => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/** Native connectivity is a hint; network operations still verify their own responses. */
export function connectionHint() {
  if (isAndroidBuild()) return connection.validated;
  return typeof navigator === "undefined" || navigator.onLine;
}

export function initializeNativeRuntime() {
  if (!initialization) {
    initialization = nativeRequest<NativeInfo>("app.info").then((info) => {
      if (info.bridgeVersion !== 1 || info.schemaVersion !== 1)
        throw bridgeError("INCOMPATIBLE");
      connection = {
        connected: info.connected === true,
        validated: info.validated === true,
      };
      for (const subscriber of subscribers) {
        try {
          subscriber({ event: "connectivity", payload: connection });
        } catch {
          /* Subscribers own their rendering failures. */
        }
      }
      return info;
    });
  }
  return initialization;
}

export function subscribeConnection(callback: () => void) {
  if (isAndroidBuild()) {
    const unsubscribe = subscribeNativeEvents(({ event }) => {
      if (event === "connectivity") callback();
    });
    void initializeNativeRuntime().catch(() => {
      /* Startup failure is displayed by the app, not the sync layer. */
    });
    return unsubscribe;
  }
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

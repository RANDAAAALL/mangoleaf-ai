import { modelVersion } from "@/lib/constants";
import { connectionHint } from "@/lib/native-bridge";

type DiagnosticValue = string | number | boolean | null;
export interface DiagnosticEvent {
  readonly timestamp: string;
  readonly event: string;
  readonly details: Readonly<Record<string, DiagnosticValue>>;
}
export interface DiagnosticSnapshot {
  readonly enabled: boolean;
  readonly events: readonly DiagnosticEvent[];
  readonly persistence: "available" | "unavailable";
}

const STORAGE_KEY = "mangoleaf-diagnostics-v1";
export const DIAGNOSTICS_MAX_EVENTS = 200;
const MAX_BYTES = 64 * 1024;
const PERSIST_DELAY_MS = 250;
const DETAIL_KEYS = new Set([
  "operation",
  "stage",
  "durationMs",
  "width",
  "height",
  "count",
  "backend",
  "textureBits",
  "float32Capable",
  "float32Enabled",
  "status",
  "reason",
  "errorName",
  "tab",
  "language",
  "online",
  "visibility",
  "standalone",
  "appVersion",
  "modelVersion",
  "browser",
  "platform",
  "source",
  "outcome",
]);
const ERROR_NAMES = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "AbortError",
  "QuotaExceededError",
  "SecurityError",
  "UnknownError",
  "InvalidStateError",
  "NotFoundError",
  "NotAllowedError",
  "NotSupportedError",
  "DataError",
  "DataCloneError",
  "ConstraintError",
  "TransactionInactiveError",
  "ReadOnlyError",
  "TimeoutError",
  "NetworkError",
  "DatabaseClosedError",
  "OpenFailedError",
  "VersionError",
  "InvalidAccessError",
  "BulkError",
  "WarmupTimeoutError",
  "InitializationBusyError",
  "InferenceBusyError",
  "DiagnosisTimeoutError",
]);
const SERVER_SNAPSHOT: DiagnosticSnapshot = Object.freeze({
  enabled: false,
  events: Object.freeze([]),
  persistence: "unavailable",
});
let snapshot = SERVER_SNAPSHOT;
let initialized = false;
let storage: Storage | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let operationCount = 0;
const operationSession = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const listeners = new Set<() => void>();

function publish(next: DiagnosticSnapshot) {
  snapshot = Object.freeze(next);
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // A diagnostic subscriber must never change the result of application work.
    }
  }
}

function serialized(events = snapshot.events, enabled = snapshot.enabled) {
  return JSON.stringify({ version: 1, enabled, events });
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function boundedEvents(events: readonly DiagnosticEvent[], enabled: boolean) {
  const bounded = events.slice(-DIAGNOSTICS_MAX_EVENTS);
  while (
    bounded.length &&
    byteLength(serialized(bounded, enabled)) > MAX_BYTES
  ) {
    bounded.shift();
  }
  return Object.freeze(bounded);
}

function safeDetails(
  details: unknown,
): Readonly<Record<string, DiagnosticValue>> {
  const safe: Record<string, DiagnosticValue> = {};
  if (!details || typeof details !== "object") return Object.freeze(safe);
  for (const [key, value] of Object.entries(details)) {
    if (!DETAIL_KEYS.has(key) || Object.keys(safe).length >= 16) continue;
    if (typeof value === "string") {
      // Only short technical labels are accepted, never messages, URLs or payloads.
      if (/^[A-Za-z0-9_.:+ -]*$/.test(value)) safe[key] = value.slice(0, 96);
    } else if (
      value === null ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      safe[key] = value;
    }
  }
  return Object.freeze(safe);
}

/** Error messages/stacks may contain private URLs or input; retain known names only. */
export function diagnosticErrorName(error: unknown): string {
  try {
    const name =
      error && typeof error === "object" && "name" in error ? error.name : null;
    return typeof name === "string" && ERROR_NAMES.has(name) ? name : "Error";
  } catch {
    return "Error";
  }
}

function flushDiagnostics() {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serialized());
    if (snapshot.persistence !== "available") {
      publish({ ...snapshot, persistence: "available" });
    }
    return true;
  } catch {
    if (snapshot.persistence !== "unavailable") {
      publish({ ...snapshot, persistence: "unavailable" });
    }
    return false;
  }
}

function schedulePersistence() {
  if (!storage || persistTimer !== null) return;
  persistTimer = setTimeout(flushDiagnostics, PERSIST_DELAY_MS);
}

function diagnosticContext(): Record<string, DiagnosticValue> {
  const context: Record<string, DiagnosticValue> = {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    modelVersion,
  };
  try {
    const agent = navigator.userAgent ?? "";
    context.online = connectionHint();
    context.platform =
      /iPhone|iPad|iPod/.test(agent) ||
      (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)
        ? "iOS"
        : /Android/.test(agent)
          ? "Android"
          : /Windows/.test(agent)
            ? "Windows"
            : /Macintosh/.test(agent)
              ? "macOS"
              : /Linux/.test(agent)
                ? "Linux"
                : "unknown";
    const families = [
      ["Edge", /Edg(?:e|A|iOS)?\/([0-9.]+)/],
      ["Firefox-iOS", /FxiOS\/([0-9.]+)/],
      ["Firefox", /Firefox\/([0-9.]+)/],
      ["Chrome-iOS", /CriOS\/([0-9.]+)/],
      ["Chromium", /(?:Chrome|Chromium)\/([0-9.]+)/],
      ["Safari", /Version\/([0-9.]+).*Safari/],
    ] as const;
    context.browser = "unknown";
    for (const [family, pattern] of families) {
      const match = agent.match(pattern);
      if (match) {
        context.browser = `${family}-${match[1].slice(0, 24)}`;
        break;
      }
    }
  } catch {
    // Context is optional; never export the complete user agent or URL.
  }
  return context;
}

/** Idempotent and SSR safe. Keep diagnostics independent of the scan database. */
export function initializeDiagnostics(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let enabled = false;
  let events: readonly DiagnosticEvent[] = Object.freeze([]);
  let saved: string | null = null;
  try {
    storage = window.localStorage;
    saved = storage.getItem(STORAGE_KEY);
  } catch {
    storage = null;
  }
  try {
    if (saved && saved.length <= MAX_BYTES && byteLength(saved) <= MAX_BYTES) {
      const parsed: unknown = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        parsed.version === 1 &&
        "enabled" in parsed &&
        typeof parsed.enabled === "boolean" &&
        "events" in parsed &&
        Array.isArray(parsed.events)
      ) {
        enabled = parsed.enabled;
        events = boundedEvents(
          parsed.events
            .slice(-DIAGNOSTICS_MAX_EVENTS)
            .flatMap((item: unknown) => {
              if (
                !item ||
                typeof item !== "object" ||
                !("event" in item) ||
                typeof item.event !== "string" ||
                !/^[a-z][a-z0-9.-]{0,79}$/.test(item.event) ||
                !("timestamp" in item) ||
                typeof item.timestamp !== "string" ||
                !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
                  item.timestamp,
                )
              )
                return [];
              return [
                Object.freeze({
                  timestamp: item.timestamp,
                  event: item.event,
                  details: safeDetails("details" in item ? item.details : null),
                }),
              ];
            }),
          enabled,
        );
      }
    }
  } catch {
    // A malformed saved log does not prevent enabling a fresh in-memory session.
  }
  publish({
    enabled,
    events,
    persistence: storage ? "available" : "unavailable",
  });
  window.addEventListener("pagehide", flushDiagnostics);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushDiagnostics();
    });
  }
  if (enabled) {
    recordDiagnostic("session.started", diagnosticContext());
  }
}

export function getDiagnosticsSnapshot(): DiagnosticSnapshot {
  return snapshot;
}

export function getDiagnosticsServerSnapshot(): DiagnosticSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setDiagnosticsEnabled(enabled: boolean): void {
  initializeDiagnostics();
  if (typeof window === "undefined") return;
  if (snapshot.enabled === enabled) return;
  publish({ ...snapshot, enabled });
  if (enabled) {
    recordDiagnostic("diagnostics.enabled", diagnosticContext());
  }
  // Persist opt-in immediately, before a subsequent operation can become stuck.
  flushDiagnostics();
}

export function clearDiagnostics(): void {
  initializeDiagnostics();
  if (typeof window === "undefined") return;
  publish({ ...snapshot, events: Object.freeze([]) });
  if (!flushDiagnostics() && storage) {
    try {
      // Removing history can still succeed when quota prevents replacing it.
      // The next visit defaults to opt-out if preference preservation failed.
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Browser denial can prevent any persistent change; memory is still clear.
    }
  }
}

/** Only explicit, controlled event codes/fields belong here; no console interception. */
export function recordDiagnostic(
  event: string,
  details?: Record<string, DiagnosticValue>,
): void {
  try {
    initializeDiagnostics();
    if (!snapshot.enabled || !/^[a-z][a-z0-9.-]{0,79}$/.test(event)) return;
    const entry = Object.freeze({
      timestamp: new Date().toISOString(),
      event,
      details: safeDetails(details),
    });
    publish({
      ...snapshot,
      events: boundedEvents([...snapshot.events, entry], snapshot.enabled),
    });
    schedulePersistence();
  } catch {
    // Instrumentation must not change application outcomes, even with bad inputs.
  }
}

/** Ephemeral diagnostic IDs never reuse a report, photo, guest or device identity. */
export function createDiagnosticOperation(prefix: string): string {
  operationCount += 1;
  const safePrefix = /^[a-z][a-z0-9-]{0,31}$/.test(prefix)
    ? prefix
    : "operation";
  return `${safePrefix}-${operationSession}-${operationCount}`;
}

/** Technical evidence export; UI labels and help remain in translations.ts. */
export function formatDiagnostics(): string {
  const lines = [
    "MangoLeafAI diagnostics",
    `exportedAt=${new Date().toISOString()}`,
    `appVersion=${process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown"}`,
    `modelVersion=${modelVersion}`,
    `enabled=${snapshot.enabled}`,
    `persistence=${snapshot.persistence}`,
    `events=${snapshot.events.length}`,
    ...Object.entries(diagnosticContext())
      .filter(([key]) => key !== "appVersion" && key !== "modelVersion")
      .map(([key, value]) => `${key}=${value}`),
    "",
  ];
  for (const entry of snapshot.events) {
    const details = Object.entries(entry.details)
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    lines.push(
      `${entry.timestamp} ${entry.event}${details ? ` ${details}` : ""}`,
    );
  }
  return lines.join("\n");
}

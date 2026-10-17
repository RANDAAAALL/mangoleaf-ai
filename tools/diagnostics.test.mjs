import { expect, test } from "bun:test";

// Fresh child processes isolate browser storage, timers and module-level state.
const setup = String.raw`
import assert from "node:assert/strict";
const saved = new Map();
const timers = new Map();
const pagehide = [];
const visibility = [];
let denied = false;
let timerId = 0;
let writes = 0;
const storage = {
  getItem(key) { return saved.get(key) ?? null; },
  setItem(key, value) {
    if (denied) throw new DOMException("Controlled write denial", "QuotaExceededError");
    writes += 1;
    saved.set(key, value);
  },
  removeItem(key) { saved.delete(key); },
};
globalThis.setTimeout = (callback) => { const id = ++timerId; timers.set(id, callback); return id; };
globalThis.clearTimeout = (id) => timers.delete(id);
function flush() {
  for (const [id, callback] of [...timers]) { timers.delete(id); callback(); }
}
function browser() {
  globalThis.window = { localStorage: storage, addEventListener(name, callback) {
    if (name === "pagehide") pagehide.push(callback);
  } };
  Object.defineProperty(globalThis, "navigator", { value: {
    onLine: true, userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/143.0.0.0 Mobile Safari/537.36", maxTouchPoints: 5,
  }, configurable: true });
  globalThis.document = { visibilityState: "visible", addEventListener(name, callback) {
    if (name === "visibilitychange") visibility.push(callback);
  } };
}
const key = "mangoleaf-diagnostics-v1";
const diagnostics = await import("./src/lib/diagnostics.ts");
`;

function runScenario(source) {
  const result = Bun.spawnSync([process.execPath, "--eval", setup + source], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  const stderr = result.stderr.toString();
  expect(result.exitCode, stderr).toBe(0);
}

test("diagnostics is SSR safe, opt-in and stable until events change", () => {
  runScenario(String.raw`
const server = diagnostics.getDiagnosticsServerSnapshot();
assert.equal(diagnostics.getDiagnosticsSnapshot(), server);
diagnostics.initializeDiagnostics();
diagnostics.recordDiagnostic("server.ignored");
assert.equal(diagnostics.getDiagnosticsSnapshot(), server);
browser();
diagnostics.initializeDiagnostics();
const disabled = diagnostics.getDiagnosticsSnapshot();
diagnostics.recordDiagnostic("test.ignored");
assert.equal(diagnostics.getDiagnosticsSnapshot(), disabled);
assert.equal(disabled.enabled, false);
assert.equal(writes, 0);
let changes = 0;
const unsubscribe = diagnostics.subscribeDiagnostics(() => { changes += 1; });
diagnostics.setDiagnosticsEnabled(true);
const enabled = diagnostics.getDiagnosticsSnapshot();
assert.equal(enabled.enabled, true);
assert.equal(diagnostics.getDiagnosticsSnapshot(), enabled);
assert.equal(enabled.events[0].details.browser, "Chromium-143.0.0.0");
assert.equal(enabled.events[0].details.platform, "Android");
diagnostics.recordDiagnostic("test.started", { operation: diagnostics.createDiagnosticOperation("test") });
assert.notEqual(diagnostics.getDiagnosticsSnapshot(), enabled);
assert.equal(changes > 0, true);
unsubscribe();
const stoppedAt = changes;
diagnostics.recordDiagnostic("test.completed");
assert.equal(changes, stoppedAt);
assert.equal(diagnostics.getDiagnosticsServerSnapshot(), server);
assert.equal(server.enabled, false);
`);
});

test("diagnostics rotates by count and serialized bytes without unbounded persistence", () => {
  runScenario(String.raw`
browser(); diagnostics.setDiagnosticsEnabled(true); diagnostics.clearDiagnostics();
for (let count = 0; count < 250; count += 1) diagnostics.recordDiagnostic("test.event", { count });
assert.equal(diagnostics.getDiagnosticsSnapshot().events.length, diagnostics.DIAGNOSTICS_MAX_EVENTS);
assert.equal(diagnostics.getDiagnosticsSnapshot().events[0].details.count, 50);
assert.equal(timers.size, 1, "one deferred persistence write serves a burst");
flush();
let persisted = saved.get(key);
assert.equal(new TextEncoder().encode(persisted).byteLength <= 65536, true);
const details = Object.fromEntries([
  "operation", "stage", "backend", "status", "reason", "errorName", "tab", "language",
  "visibility", "appVersion", "modelVersion", "browser", "platform", "source", "outcome",
].map((name) => [name, "x".repeat(400)]));
for (let count = 0; count < 250; count += 1) diagnostics.recordDiagnostic("test.large", details);
flush();
persisted = saved.get(key);
assert.equal(new TextEncoder().encode(persisted).byteLength <= 65536, true);
assert.equal(diagnostics.getDiagnosticsSnapshot().events.length < 200, true);
assert.equal(diagnostics.getDiagnosticsSnapshot().events.at(-1).details.operation.length, 96);
`);
});

test("saved opt-in history restores after reload and off retains history until clear", () => {
  runScenario(String.raw`
browser(); diagnostics.setDiagnosticsEnabled(true); diagnostics.clearDiagnostics();
const operation = diagnostics.createDiagnosticOperation("delete");
diagnostics.recordDiagnostic("database.delete.started", { operation, count: 1 });
pagehide[0]();
assert.equal(timers.size, 0);
const reloaded = await import("./src/lib/diagnostics.ts?restored");
reloaded.initializeDiagnostics();
assert.equal(reloaded.getDiagnosticsSnapshot().enabled, true);
assert.equal(reloaded.getDiagnosticsSnapshot().events[0].event, "database.delete.started");
assert.equal(reloaded.getDiagnosticsSnapshot().events.at(-1).event, "session.started");
assert.notEqual(reloaded.createDiagnosticOperation("delete"), operation);
reloaded.setDiagnosticsEnabled(false);
const retained = reloaded.getDiagnosticsSnapshot().events;
reloaded.recordDiagnostic("disabled.ignored");
assert.equal(reloaded.getDiagnosticsSnapshot().events, retained);
reloaded.clearDiagnostics();
assert.equal(reloaded.getDiagnosticsSnapshot().enabled, false);
assert.equal(reloaded.getDiagnosticsSnapshot().events.length, 0);
assert.deepEqual(JSON.parse(saved.get(key)), { version: 1, enabled: false, events: [] });
assert.equal([...saved.keys()].every((name) => name === key), true);
`);
});

test("background flush persists recent evidence and clear removes history despite a quota failure", () => {
  runScenario(String.raw`
browser(); diagnostics.setDiagnosticsEnabled(true); diagnostics.clearDiagnostics();
diagnostics.recordDiagnostic("delete.pending");
document.visibilityState = "hidden"; visibility[0]();
assert.equal(JSON.parse(saved.get(key)).events.at(-1).event, "delete.pending");
assert.equal(timers.size, 0);
denied = true; diagnostics.clearDiagnostics();
assert.equal(saved.has(key), false, "clear falls back to removing prior history when replacement fails");
assert.equal(diagnostics.getDiagnosticsSnapshot().events.length, 0);
assert.equal(diagnostics.getDiagnosticsSnapshot().enabled, true, "current in-memory opt-in is retained");
assert.equal(diagnostics.getDiagnosticsSnapshot().persistence, "unavailable");
const nextVisit = await import("./src/lib/diagnostics.ts?after-clear-failure");
nextVisit.initializeDiagnostics();
assert.equal(nextVisit.getDiagnosticsSnapshot().enabled, false);
assert.equal(nextVisit.getDiagnosticsSnapshot().events.length, 0);
`);
});

test("malformed and excessive saved payloads do not enable diagnostics or break startup", () => {
  runScenario(String.raw`
browser(); saved.set(key, "{broken"); diagnostics.initializeDiagnostics();
assert.equal(diagnostics.getDiagnosticsSnapshot().enabled, false);
assert.equal(diagnostics.getDiagnosticsSnapshot().events.length, 0);
saved.set(key, "x".repeat(65537));
const oversized = await import("./src/lib/diagnostics.ts?oversized");
oversized.initializeDiagnostics();
assert.equal(oversized.getDiagnosticsSnapshot().enabled, false);
saved.set(key, JSON.stringify({ version: 1, enabled: true, events: [
  { timestamp: "not-a-date", event: "unsafe", details: {} },
  { timestamp: "2026-10-17T00:00:00.000Z", event: "safe.event", details: {
    token: "private", imageHash: "private", status: "ready", reason: "https://private.example"
  } },
] }));
const sanitized = await import("./src/lib/diagnostics.ts?sanitized");
sanitized.initializeDiagnostics();
assert.deepEqual(sanitized.getDiagnosticsSnapshot().events[0].details, { status: "ready" });
assert.equal(sanitized.getDiagnosticsSnapshot().events.some((event) => event.event === "unsafe"), false);
`);
});

test("storage quota and denied reads leave recording and application control flow usable", () => {
  runScenario(String.raw`
browser(); denied = true;
assert.doesNotThrow(() => diagnostics.setDiagnosticsEnabled(true));
diagnostics.recordDiagnostic("save.failed", { errorName: "QuotaExceededError" });
flush();
assert.equal(diagnostics.getDiagnosticsSnapshot().persistence, "unavailable");
assert.equal(diagnostics.getDiagnosticsSnapshot().events.at(-1).event, "save.failed");
denied = false; diagnostics.recordDiagnostic("retry.started"); flush();
assert.equal(diagnostics.getDiagnosticsSnapshot().persistence, "available");
Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Controlled denial", "SecurityError"); } });
const deniedRead = await import("./src/lib/diagnostics.ts?denied");
assert.doesNotThrow(() => deniedRead.initializeDiagnostics());
assert.doesNotThrow(() => deniedRead.setDiagnosticsEnabled(true));
deniedRead.recordDiagnostic("memory.only");
assert.equal(deniedRead.getDiagnosticsSnapshot().events.at(-1).event, "memory.only");
assert.equal(deniedRead.getDiagnosticsSnapshot().persistence, "unavailable");
assert.doesNotThrow(() => deniedRead.clearDiagnostics());
`);
});

test("exports retain technical evidence, exclude sensitive fields and isolate subscriber errors", () => {
  runScenario(String.raw`
browser(); diagnostics.setDiagnosticsEnabled(true); diagnostics.clearDiagnostics();
diagnostics.subscribeDiagnostics(() => { throw new Error("Controlled subscriber failure"); });
assert.doesNotThrow(() => diagnostics.recordDiagnostic("database.delete.started", {
  operation: "delete-1", count: 2, imageHash: "private-image", reportId: "private-report",
  token: "private-token", reason: "https://private.example/?secret=value", durationMs: Infinity,
}));
assert.doesNotThrow(() => diagnostics.recordDiagnostic("bad.details", { get status() { throw new Error("Controlled getter"); } }));
assert.deepEqual(diagnostics.getDiagnosticsSnapshot().events[0].details, { operation: "delete-1", count: 2 });
assert.equal(diagnostics.diagnosticErrorName(new DOMException("secret", "QuotaExceededError")), "QuotaExceededError");
assert.equal(diagnostics.diagnosticErrorName({ name: "private-error-content" }), "Error");
assert.equal(diagnostics.diagnosticErrorName({ get name() { throw new Error("secret"); } }), "Error");
const output = diagnostics.formatDiagnostics();
assert.match(output, /database\.delete\.started operation=delete-1 count=2/);
assert.match(output, /modelVersion=v4\.5\.0/);
assert.match(output, /browser=Chromium-143\.0\.0\.0/);
assert.equal(output.includes("private"), false);
assert.equal(Object.isFrozen(diagnostics.getDiagnosticsSnapshot().events), true);
assert.equal(Object.isFrozen(diagnostics.getDiagnosticsSnapshot().events[0].details), true);
`);
});

test("database instrumentation never labels pending or rejected work as completed", () => {
  runScenario(String.raw`
browser(); diagnostics.setDiagnosticsEnabled(true); diagnostics.clearDiagnostics();
const { mock } = await import("bun:test");
let finishDelete;
const pendingDelete = new Promise((resolve) => { finishDelete = resolve; });
const failure = new DOMException("Private failing report details", "QuotaExceededError");
const db = {
  scans: { bulkDelete: () => pendingDelete, get: async () => null, add: async () => { throw failure; } },
  transaction: async (_mode, _table, work) => work({ abort() {} }),
};
mock.module("@/lib/db", () => ({ db }));
const { deleteLocalScans, saveLocalScan } = await import("./src/lib/local-scans.ts");
const deletion = deleteLocalScans(["private-report-id"]);
assert.deepEqual(diagnostics.getDiagnosticsSnapshot().events.map((event) => event.event), ["database.delete.started"]);
finishDelete(); await deletion;
assert.deepEqual(diagnostics.getDiagnosticsSnapshot().events.map((event) => event.event), ["database.delete.started", "database.delete.completed"]);
await assert.rejects(saveLocalScan({ id: "private-report-id" }), (error) => error === failure);
const events = diagnostics.getDiagnosticsSnapshot().events;
assert.equal(events.some((event) => event.event === "database.save.transaction-entered"), true);
assert.equal(events.some((event) => event.event === "database.save.completed"), false);
assert.equal(events.at(-1).event, "database.save.failed");
assert.equal(events.at(-1).details.errorName, "QuotaExceededError");
assert.equal(diagnostics.formatDiagnostics().includes("private"), false);
`);
});

test("enabling after model load records actual precision without changing TensorFlow flags", () => {
  runScenario(String.raw`
browser(); diagnostics.setDiagnosticsEnabled(true); diagnostics.clearDiagnostics();
const { mock } = await import("bun:test");
const input = { cast() { return this; }, expandDims() { return this; } };
mock.module("@tensorflow/tfjs", () => ({
  browser: { fromPixels: () => input }, tidy: (work) => work(),
  getBackend: () => "webgl", env: () => ({
    getBool: (flag) => flag === "WEBGL_RENDER_FLOAT32_CAPABLE",
    set() { assert.fail("Diagnosis instrumentation must not change precision flags"); },
  }),
}));
document.createElement = () => ({ getContext: () => ({ drawImage() {} }) });
const classifier = await import("./src/lib/classifier.ts");
let disposed = false;
const model = { predict: () => ({
  data: async () => Float32Array.from([0.8, 0.05, 0.04, 0.03, 0.03, 0.03, 0.02]),
  dispose() { disposed = true; },
}) };
await classifier.predictMangoDisease(model, {});
const runtime = diagnostics.getDiagnosticsSnapshot().events.find((event) => event.event === "inference.runtime");
assert.equal(runtime.details.backend, "webgl");
assert.equal(runtime.details.float32Capable, true);
assert.equal(runtime.details.float32Enabled, false);
assert.equal(runtime.details.textureBits, 16);
assert.equal(disposed, true);
assert.equal(classifier.isMangoInferencePending(), false);
assert.equal(diagnostics.formatDiagnostics().includes("Anthracnose"), false);
assert.equal(diagnostics.formatDiagnostics().includes("Probability"), false);
`);
});

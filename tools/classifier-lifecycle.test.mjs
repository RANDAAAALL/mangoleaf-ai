import { expect, test } from "bun:test";

// Each child owns its TFJS/DOM stubs, so other tooling tests retain real globals.
const setup = String.raw`
import assert from "node:assert/strict";
import { mock } from "bun:test";
const scores = Float32Array.from([0.8, 0.05, 0.04, 0.03, 0.03, 0.03, 0.02]);
const input = { cast() { return this; }, expandDims() { return this; } };
let loadGraphModel = async () => { throw new Error("No controlled model configured"); };
mock.module("@tensorflow/tfjs", () => ({
  browser: { fromPixels: () => input },
  tidy: (work) => work(),
  zeros: () => input,
  env: () => ({ set() {} }),
  ready: async () => {},
  loadGraphModel: (...args) => loadGraphModel(...args),
}));
globalThis.document = {
  createElement: () => ({ getContext: () => ({ drawImage() {} }) }),
};
globalThis.fetch = async () => ({ ok: false });
const classifier = await import("./src/lib/classifier.ts");
const { CLASSES, UNCERTAIN_LABEL } = await import("./src/lib/constants.ts");
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function drain() { await new Promise(setImmediate); }
function fakeClock() {
  let now = 0;
  let timerId = 0;
  const timers = new Map();
  globalThis.setTimeout = (callback, delay = 0) => {
    const id = ++timerId;
    timers.set(id, { callback, deadline: now + delay });
    return id;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  Object.defineProperty(globalThis, "performance", {
    value: { now: () => now }, configurable: true,
  });
  return {
    // Elapsing without callbacks represents main-thread work delaying timers.
    elapse: (duration) => { now += duration; },
    async advance(duration) {
      now += duration;
      for (const [id, task] of timers) {
        if (task.deadline <= now) { timers.delete(id); task.callback(); }
      }
      await drain();
    },
  };
}
`;

function runScenario(source) {
  const result = Bun.spawnSync([process.execPath, "--eval", setup + source], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  const stderr = result.stderr.toString();
  expect(stderr).not.toContain("AssertionError");
  expect(result.exitCode, stderr).toBe(0);
}

test("classifier releases rejected output and permits the next prediction", () => {
  runScenario(String.raw`
let disposals = 0;
let calls = 0;
const failure = new Error("Controlled GPU read failure");
const model = { predict: () => {
  calls += 1;
  return { data: () => calls === 1 ? Promise.reject(failure) : Promise.resolve(scores),
    dispose: () => { disposals += 1; } };
} };
await assert.rejects(classifier.predictMangoDisease(model, {}), (error) => error === failure);
assert.equal(disposals, 1);
assert.equal(classifier.isMangoInferencePending(), false);
const result = await classifier.predictMangoDisease(model, {});
assert.equal(result.diseaseName, CLASSES[0]);
assert.equal(result.confidence, scores[0]);
assert.equal(disposals, 2);
assert.equal(classifier.isMangoInferencePending(), false);
`);
});

test("classifier retains raw confidence on both sides of the unchanged 70% gate", () => {
  runScenario(String.raw`
const model = { predict: () => ({ data: async () => scores, dispose() {} }) };
for (const [probability, label] of [
  [0.698, UNCERTAIN_LABEL],
  [0.69999, UNCERTAIN_LABEL],
  [0.700001, CLASSES[0]],
  [0.75, CLASSES[0]],
]) {
  scores[0] = probability;
  const result = await classifier.predictMangoDisease(model, {});
  assert.equal(result.diseaseName, label);
  assert.equal(result.confidence, scores[0], "Saving must not round the model output");
}
`);
});

test("already canceled diagnosis submits no prediction", () => {
  runScenario(String.raw`
let calls = 0;
const controller = new AbortController();
const reason = new Error("Controlled diagnosis timeout");
controller.abort(reason);
await assert.rejects(
  classifier.predictMangoDisease({ predict: () => { calls += 1; } }, {}, controller.signal),
  (error) => error === reason,
);
assert.equal(calls, 0);
assert.equal(classifier.isMangoInferencePending(), false);
`);
});

test("canceling readback retains the output and blocks overlap until late success", () => {
  runScenario(String.raw`
const read = deferred();
const controller = new AbortController();
const reason = new Error("Controlled diagnosis timeout");
let disposals = 0;
let calls = 0;
let reported = 0;
console.groupCollapsed = () => { reported += 1; };
const model = { predict: () => {
  calls += 1;
  return { data: () => read.promise, dispose: () => { disposals += 1; } };
} };
const pending = classifier.predictMangoDisease(model, {}, controller.signal);
assert.equal(classifier.isMangoInferencePending(), true);
controller.abort(reason);
await assert.rejects(pending, (error) => error === reason);
assert.equal(disposals, 0);
assert.equal(classifier.isMangoInferencePending(), true);
await assert.rejects(classifier.predictMangoDisease(model, {}), (error) =>
  error instanceof classifier.InferenceBusyError && error.code === "INFERENCE_BUSY");
assert.equal(calls, 1);
read.resolve(scores);
await drain();
assert.equal(disposals, 1);
assert.equal(reported, 0);
assert.equal(classifier.isMangoInferencePending(), false);
await classifier.predictMangoDisease(model, {});
assert.equal(calls, 2);
assert.equal(disposals, 2);
assert.equal(reported, 1);
`);
});

test("canceled readback handles late failure without releasing resources early", () => {
  runScenario(String.raw`
const read = deferred();
const controller = new AbortController();
let disposals = 0;
const unhandled = [];
process.on("unhandledRejection", (error) => unhandled.push(error));
const model = { predict: () => ({ data: () => read.promise,
  dispose: () => { disposals += 1; } }) };
const pending = classifier.predictMangoDisease(model, {}, controller.signal);
controller.abort();
await assert.rejects(pending, (error) => error.name === "AbortError");
assert.equal(disposals, 0);
assert.equal(classifier.isMangoInferencePending(), true);
read.reject(new Error("Controlled late GPU read failure"));
await drain();
assert.equal(disposals, 1);
assert.equal(classifier.isMangoInferencePending(), false);
assert.deepEqual(unhandled, []);
`);
});

test("concurrent model loads await warmup readback before caching readiness", () => {
  runScenario(String.raw`
const read = deferred();
let loads = 0;
let outputDisposals = 0;
let modelDisposals = 0;
let completed = 0;
const model = { predict: () => ({ data: () => read.promise,
  dispose: () => { outputDisposals += 1; } }), dispose: () => { modelDisposals += 1; } };
loadGraphModel = async () => { loads += 1; return model; };
const first = classifier.loadMangoModel().then((result) => { completed += 1; return result; });
const second = classifier.loadMangoModel().then((result) => { completed += 1; return result; });
await drain();
assert.equal(loads, 1);
assert.equal(completed, 0);
assert.equal(outputDisposals, 0);
assert.equal(modelDisposals, 0);
read.resolve(scores);
assert.equal(await first, model);
assert.equal(await second, model);
assert.equal(completed, 2);
assert.equal(outputDisposals, 1);
assert.equal(modelDisposals, 0);
assert.equal(await classifier.loadMangoModel(), model);
assert.equal(loads, 1);
`);
});

test("failed warmup releases output and model, then permits a fresh load", () => {
  runScenario(String.raw`
let loads = 0;
let outputDisposals = 0;
let modelDisposals = 0;
const failure = new Error("Controlled warmup read failure");
loadGraphModel = async () => {
  loads += 1;
  const first = loads === 1;
  return { predict: () => ({ data: () => first ? Promise.reject(failure) : Promise.resolve(scores),
    dispose: () => { outputDisposals += 1; } }), dispose: () => { modelDisposals += 1; } };
};
await assert.rejects(classifier.loadMangoModel(), (error) => error === failure);
assert.equal(outputDisposals, 1);
assert.equal(modelDisposals, 1);
const model = await classifier.loadMangoModel();
assert.equal(loads, 2);
assert.equal(outputDisposals, 2);
assert.equal(modelDisposals, 1);
assert.equal(await classifier.loadMangoModel(), model);
assert.equal(loads, 2);
`);
});

test("failed model download clears the cached rejection for retry", () => {
  runScenario(String.raw`
let loads = 0;
loadGraphModel = async () => { loads += 1; throw new Error("Controlled model download failure"); };
await assert.rejects(classifier.loadMangoModel());
await assert.rejects(classifier.loadMangoModel());
assert.equal(loads, 2);
`);
});

test("warmup timeout retains resources, blocks overlap, and discards late success before retry", () => {
  runScenario(String.raw`
const clock = fakeClock();
const read = deferred();
let loads = 0;
let outputDisposals = 0;
let modelDisposals = 0;
let callersSettled = 0;
loadGraphModel = async () => {
  loads += 1;
  const first = loads === 1;
  return { predict: () => ({ data: () => first ? read.promise : Promise.resolve(scores),
    dispose: () => { outputDisposals += 1; } }), dispose: () => { modelDisposals += 1; } };
};
const first = classifier.loadMangoModel();
const second = classifier.loadMangoModel();
const observeTimeout = (pending) => pending.then(
  () => { throw new Error("Timed-out warmup must not return a model"); },
  (error) => {
    assert.equal(error instanceof classifier.WarmupTimeoutError, true);
    assert.equal(error.code, "MODEL_WARMUP_TIMEOUT");
    callersSettled += 1;
  },
);
const observed = [observeTimeout(first), observeTimeout(second)];
await drain();
assert.equal(loads, 1);
assert.equal(classifier.isMangoInitializationPending(), true);
await clock.advance(classifier.MODEL_WARMUP_TIMEOUT_MS - 1);
assert.equal(callersSettled, 0);
await clock.advance(1);
await Promise.all(observed);
assert.equal(callersSettled, 2);
assert.equal(outputDisposals, 0);
assert.equal(modelDisposals, 0);
assert.equal(classifier.isMangoInitializationPending(), true);
await assert.rejects(classifier.loadMangoModel(), (error) =>
  error instanceof classifier.InitializationBusyError && error.code === "INITIALIZATION_BUSY");
assert.equal(loads, 1);
read.resolve(scores);
await drain();
assert.equal(outputDisposals, 1);
assert.equal(modelDisposals, 1);
assert.equal(classifier.isMangoInitializationPending(), false);
const model = await classifier.loadMangoModel();
assert.equal(loads, 2);
assert.equal(outputDisposals, 2);
assert.equal(modelDisposals, 1);
assert.equal(await classifier.loadMangoModel(), model);
assert.equal(loads, 2);
`);
});

test("timed-out warmup handles late rejection and releases its initialization gate", () => {
  runScenario(String.raw`
const clock = fakeClock();
const read = deferred();
let outputDisposals = 0;
let modelDisposals = 0;
const unhandled = [];
process.on("unhandledRejection", (error) => unhandled.push(error));
loadGraphModel = async () => ({ predict: () => ({ data: () => read.promise,
  dispose: () => { outputDisposals += 1; } }), dispose: () => { modelDisposals += 1; } });
const pending = classifier.loadMangoModel();
const observed = assert.rejects(pending, (error) => error instanceof classifier.WarmupTimeoutError);
await drain();
await clock.advance(classifier.MODEL_WARMUP_TIMEOUT_MS);
await observed;
assert.equal(outputDisposals, 0);
assert.equal(modelDisposals, 0);
assert.equal(classifier.isMangoInitializationPending(), true);
read.reject(new Error("Controlled late warmup read failure"));
await drain();
assert.equal(outputDisposals, 1);
assert.equal(modelDisposals, 1);
assert.equal(classifier.isMangoInitializationPending(), false);
assert.deepEqual(unhandled, []);
`);
});

test("warmup rejects overdue synchronous completion before its timer callback can run", () => {
  runScenario(String.raw`
const clock = fakeClock();
let loads = 0;
let outputDisposals = 0;
let modelDisposals = 0;
loadGraphModel = async () => {
  loads += 1;
  const first = loads === 1;
  return { predict: () => {
    if (first) clock.elapse(classifier.MODEL_WARMUP_TIMEOUT_MS);
    return { data: async () => scores, dispose: () => { outputDisposals += 1; } };
  }, dispose: () => { modelDisposals += 1; } };
};
await assert.rejects(classifier.loadMangoModel(), (error) => error instanceof classifier.WarmupTimeoutError);
assert.equal(outputDisposals, 1);
assert.equal(modelDisposals, 1);
assert.equal(classifier.isMangoInitializationPending(), false);
await classifier.loadMangoModel();
assert.equal(loads, 2);
assert.equal(outputDisposals, 2);
assert.equal(modelDisposals, 1);
`);
});

test("warmup deadline starts after asset downloads and preserves their existing wait policy", () => {
  runScenario(String.raw`
const clock = fakeClock();
const download = deferred();
const read = deferred();
let settled = false;
let outputDisposals = 0;
let modelDisposals = 0;
const model = { predict: () => ({ data: () => read.promise,
  dispose: () => { outputDisposals += 1; } }), dispose: () => { modelDisposals += 1; } };
loadGraphModel = () => download.promise;
const pending = classifier.loadMangoModel().then((result) => { settled = true; return result; });
await drain();
await clock.advance(classifier.MODEL_WARMUP_TIMEOUT_MS * 2);
assert.equal(settled, false);
assert.equal(classifier.isMangoInitializationPending(), false);
download.resolve(model);
await drain();
assert.equal(classifier.isMangoInitializationPending(), true);
await clock.advance(classifier.MODEL_WARMUP_TIMEOUT_MS - 1);
assert.equal(settled, false);
read.resolve(scores);
assert.equal(await pending, model);
assert.equal(outputDisposals, 1);
assert.equal(modelDisposals, 0);
assert.equal(classifier.isMangoInitializationPending(), false);
`);
});

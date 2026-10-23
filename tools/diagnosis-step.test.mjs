import { test } from "node:test";
import { execFileSync } from "node:child_process";

// Keep fake clocks and globals in child processes so other tooling tests stay real.
function probe(script) {
  execFileSync(
    "bun",
    [
      "--eval",
      `
    import { strict as assert } from "node:assert";
    import { runDiagnosisStep, DiagnosisTimeoutError } from "./src/lib/diagnosis-step.ts";
    ${script}
  `,
    ],
    { cwd: process.cwd(), stdio: "pipe", timeout: 10_000 },
  );
}

test("diagnosis deadline releases a missing completion and consumes its late rejection", () => {
  probe(`
    const originalTimeout = globalThis.setTimeout;
    let deadline;
    // Trigger the deadline only after work starts; machine load must not turn
    // this late-rejection case into cancellation before the operation is called.
    globalThis.setTimeout = (callback, delay, ...args) => {
      if (delay >= 15_000) { deadline = () => callback(...args); return -1; }
      return originalTimeout(callback, delay, ...args);
    };
    const controller = new AbortController();
    let markStarted;
    const started = new Promise(resolve => { markStarted = resolve; });
    let failLate;
    const work = new Promise((_, reject) => { failLate = reject; });
    const unhandled = [];
    process.on("unhandledRejection", (error) => unhandled.push(error));
    const rejected = assert.rejects(runDiagnosisStep(controller, "prepare", () => {
      markStarted(); return work;
    }), (error) => error instanceof DiagnosisTimeoutError && error.stage === "prepare");
    await started;
    deadline();
    await rejected;
    assert.equal(controller.signal.aborted, true);
    failLate(new Error("Late decode failure"));
    await new Promise(setImmediate);
    assert.deepEqual(unhandled, []);
  `);
});

test("diagnosis discards completion that exceeded the budget while timers could not run", () => {
  probe(`
    let now = 0;
    Object.defineProperty(globalThis, "performance", { value: { now: () => now } });
    const controller = new AbortController();
    await assert.rejects(runDiagnosisStep(controller, "analyze", async () => {
      now = 60_001;
      return "late prediction";
    }), DiagnosisTimeoutError);
    assert.equal(controller.signal.aborted, true);
  `);
});

test("diagnosis external cancellation preserves its reason and ignores late fulfillment", () => {
  probe(`
    const controller = new AbortController();
    const reason = new DOMException("Cancelled by user", "AbortError");
    let finish;
    let markStarted;
    const started = new Promise(resolve => { markStarted = resolve; });
    const work = new Promise((resolve) => { finish = resolve; });
    const task = runDiagnosisStep(controller, "process", () => { markStarted(); return work; });
    const rejected = assert.rejects(task, (error) => error === reason);
    await started;
    controller.abort(reason);
    await rejected;
    finish("late compressed photo");
    await new Promise(setImmediate);
    await assert.rejects(runDiagnosisStep(controller, "save", async () => {
      assert.fail("Cancelled task must never start saving");
    }), (error) => error === reason);
  `);
});

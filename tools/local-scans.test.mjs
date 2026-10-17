import { expect, test } from "bun:test";

// Isolate module mocks so unrelated tooling tests keep the real Dexie database.
const setup = String.raw`
import assert from "node:assert/strict";
import { mock } from "bun:test";
let rows = new Map();
let additions = 0;
let transactions = 0;
let afterRead = () => {};
let afterAdd = () => {};
let beforeTransaction = () => {};
let quotaFailure = false;
let deletedIds = [];
const db = {
  scans: {
    async get(id) { const row = rows.get(id); afterRead(); return row; },
    async add(record) {
      additions += 1;
      if (quotaFailure) throw new DOMException("Controlled storage full", "QuotaExceededError");
      assert.equal(rows.has(record.id), false, "add must never replace a row");
      rows.set(record.id, structuredClone(record));
      afterAdd();
    },
    async bulkDelete(ids) { deletedIds = ids; ids.forEach((id) => rows.delete(id)); },
  },
  async transaction(_mode, _table, work) {
    transactions += 1;
    beforeTransaction();
    const snapshot = new Map(rows);
    let aborted = false;
    try {
      const result = await work({ abort() { aborted = true; } });
      if (aborted) throw new DOMException("Controlled abort", "AbortError");
      return result;
    } catch (error) { rows = snapshot; throw error; }
  },
};
mock.module("@/lib/db", () => ({ db }));
const { prepareLocalScan, saveLocalScan, deleteLocalScans, isStorageQuotaError } =
  await import("./src/lib/local-scans.ts");
const input = {
  diseaseName: "Anthracnose", confidence: 0.77,
  imageBlob: new Blob(["controlled-photo"], { type: "image/webp" }),
  imageHash: "selected-original-sha256",
};
const prepared = prepareLocalScan(input);
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

test("prepared scans contain the local photo and active model without cloud identity", () => {
  runScenario(String.raw`
const { modelVersion } = await import("./src/lib/constants.ts");
assert.match(prepared.id, /^[a-f0-9-]{36}$/);
assert.equal(prepared.model_version, modelVersion);
assert.equal(prepared.image_blob, input.imageBlob);
assert.equal(prepared.image_hash, input.imageHash);
assert.equal(prepared._status, "local-only");
assert.equal(prepared.image_url, null);
assert.equal("device_id" in prepared, false);
assert.equal("owner_id" in prepared, false);
assert.equal("cloud_id" in prepared, false);
assert.equal("storage_path" in prepared, false);
assert.equal(await saveLocalScan(prepared), prepared);
assert.equal(rows.size, 1);
`);
});

test("quota retry saves the same prepared report and committed retry adds no row", () => {
  runScenario(String.raw`
quotaFailure = true;
await assert.rejects(saveLocalScan(prepared), (error) => isStorageQuotaError(error));
assert.equal(rows.size, 0);
quotaFailure = false;
const first = await saveLocalScan(prepared);
const second = await saveLocalScan(prepared);
assert.equal(first.id, second.id);
assert.equal(first.updated_at, second.updated_at);
assert.equal(await second.image_blob.text(), "controlled-photo");
assert.equal(additions, 2); // One failed write and one committed write.
assert.equal(rows.size, 1);
`);
});

test("saving preserves fractional confidence and leaves older rounded reports intact", () => {
  runScenario(String.raw`
const legacy = { ...prepared, id: "legacy-rounded", confidence: 0.7 };
rows.set(legacy.id, legacy);
const rawConfidence = Math.fround(0.698);
const current = prepareLocalScan({ ...input, confidence: rawConfidence });
await saveLocalScan(current);
assert.equal(rows.get(current.id).confidence, rawConfidence);
assert.equal(rows.get(legacy.id).confidence, 0.7);
assert.equal(rows.size, 2);
`);
});

test("a prepared ID cannot overwrite another report or resurrect a deletion", () => {
  runScenario(String.raw`
rows.set(prepared.id, { ...prepared, disease_name: "Mango Scab" });
await assert.rejects(saveLocalScan(prepared), /different report/);
assert.equal(rows.get(prepared.id).disease_name, "Mango Scab");
rows.set(prepared.id, { ...prepared, _status: "pending-delete" });
await assert.rejects(saveLocalScan(prepared), /different report/);
assert.equal(rows.get(prepared.id)._status, "pending-delete");
assert.equal(additions, 0);
`);
});

test("an already canceled save never opens a transaction", () => {
  runScenario(String.raw`
const controller = new AbortController();
controller.abort();
await assert.rejects(saveLocalScan(prepared, controller.signal), { name: "AbortError" });
assert.equal(transactions, 0);
assert.equal(additions, 0);
`);
});

test("cancellation while opening or reading prevents an insert", () => {
  runScenario(String.raw`
const first = new AbortController();
beforeTransaction = () => first.abort();
await assert.rejects(saveLocalScan(prepared, first.signal), { name: "AbortError" });
beforeTransaction = () => {};
const second = new AbortController();
afterRead = () => second.abort();
await assert.rejects(saveLocalScan(prepared, second.signal), { name: "AbortError" });
assert.equal(additions, 0);
assert.equal(rows.size, 0);
`);
});

test("cancellation during insertion rolls back and permits the same ID retry", () => {
  runScenario(String.raw`
const controller = new AbortController();
afterAdd = () => controller.abort();
await assert.rejects(saveLocalScan(prepared, controller.signal), { name: "AbortError" });
assert.equal(rows.size, 0);
afterAdd = () => {};
await saveLocalScan(prepared);
assert.equal(rows.size, 1);
assert.equal(rows.get(prepared.id).id, prepared.id);
`);
});

test("local deletion removes owned legacy rows too and deduplicates selected IDs", () => {
  runScenario(String.raw`
rows.set("owned", { ...prepared, id: "owned", owner_id: "former-owner", _status: "synced" });
rows.set("keep", { ...prepared, id: "keep" });
await deleteLocalScans(["owned", "owned", "missing"]);
assert.deepEqual(deletedIds, ["owned", "missing"]);
assert.equal(rows.has("owned"), false);
assert.equal(rows.has("keep"), true);
deletedIds = [];
await deleteLocalScans([]);
assert.deepEqual(deletedIds, []);
`);
});

test("quota detection follows Dexie wrappers and terminates on cyclic errors", () => {
  runScenario(String.raw`
const quota = new DOMException("Full", "QuotaExceededError");
assert.equal(isStorageQuotaError(quota), true);
assert.equal(isStorageQuotaError({ name: "UnknownError", inner: { cause: quota } }), true);
assert.equal(isStorageQuotaError({ cause: new Error("failure", { cause: quota }) }), true);
const cyclic = { name: "UnknownError" };
cyclic.inner = cyclic;
assert.equal(isStorageQuotaError(cyclic), false);
cyclic.cause = quota;
assert.equal(isStorageQuotaError(cyclic), true);
for (const failure of [null, "QuotaExceededError", new Error("disk full"),
  new DOMException("Canceled", "AbortError"), { name: "UnknownError" }]) {
  assert.equal(isStorageQuotaError(failure), false);
}
`);
});

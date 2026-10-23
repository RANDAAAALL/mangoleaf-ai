import { expect, test } from "bun:test";
import { observeStorageQuery } from "../src/lib/storage-query";

test("native refresh bursts produce one follow-up read and suppress stale snapshots", async () => {
  let changed,
    finish,
    reads = 0;
  const snapshots = [];
  const stop = observeStorageQuery(
    () => {
      reads++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    (callback) => {
      changed = callback;
      return () => {
        changed = undefined;
      };
    },
    (value) => snapshots.push(value),
    () => {
      throw Error("Unexpected failure");
    },
  );
  for (let i = 0; i < 100; i++) changed();
  expect(reads).toBe(1);
  finish("outdated");
  await Promise.resolve();
  expect(reads).toBe(2);
  expect(snapshots).toEqual([]);
  finish("current");
  await Promise.resolve();
  expect(snapshots).toEqual(["current"]);
  stop();
  expect(changed).toBeUndefined();
});

test("query failures recover and cleanup neither publishes nor queues another read", async () => {
  let changed,
    finish,
    fail = true,
    errors = 0,
    reads = 0;
  const snapshots = [];
  const stop = observeStorageQuery(
    () => {
      reads++;
      if (fail) throw Error("Storage unavailable");
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    (callback) => {
      changed = callback;
      return () => {};
    },
    (value) => snapshots.push(value),
    () => errors++,
  );
  expect(errors).toBe(1);
  fail = false;
  changed();
  changed();
  stop();
  finish("late");
  await Promise.resolve();
  expect(reads).toBe(2);
  expect(snapshots).toEqual([]);
});

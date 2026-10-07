import { describe, expect, test } from "bun:test";
import {
  createGuidelineSyncManager,
  sameGuidelineSnapshot,
} from "../src/lib/guidelines-sync";

const advice = (label, id = "anthracnose") => ({
  id,
  disease_name: id,
  guidelines_en: `Advice ${label}`,
  guidelines_bis: `Tambag ${label}`,
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function harness() {
  let rows = [advice("A")];
  let online = true;
  let saveGate = null;
  let failNextEdit = false;
  const requests = [];
  const commits = [];
  const errors = [];
  const requested = [];
  const saveStarted = deferred();
  const manager = createGuidelineSyncManager({
    isOnline: () => online,
    readSnapshot: async () => structuredClone(rows),
    fetchSnapshot: () => {
      const request = deferred();
      requests.push(request);
      requested.splice(0).forEach((notify) => notify());
      return request.promise;
    },
    replaceSnapshot: async (next, baseline, canWrite) => {
      saveStarted.resolve();
      if (saveGate) await saveGate.promise;
      if (!canWrite() || !sameGuidelineSnapshot(rows, baseline)) return false;
      rows = structuredClone(next);
      commits.push(structuredClone(rows));
      return true;
    },
    applyChange: async (change) => {
      if (failNextEdit) {
        failNextEdit = false;
        throw new Error("Local edit failed");
      }
      const id = change.type === "DELETE" ? change.id : change.guideline.id;
      rows = rows.filter((row) => row.id !== id);
      if (change.type !== "DELETE")
        rows.push(structuredClone(change.guideline));
      commits.push(structuredClone(rows));
    },
    onError: (error) => errors.push(error),
  });
  return {
    manager,
    requests,
    commits,
    errors,
    rows: () => structuredClone(rows),
    otherTabWrites: (next) => {
      rows = structuredClone(next);
    },
    setOnline: (value) => {
      online = value;
    },
    holdSave: () => {
      saveGate = deferred();
      return saveGate;
    },
    saveStarted: saveStarted.promise,
    failNextEdit: () => {
      failNextEdit = true;
    },
    async nextRequest(count) {
      // Wait for a real request, rather than assuming a timer proves ordering.
      while (requests.length < count) {
        await new Promise((resolve) => requested.push(resolve));
      }
      return requests[count - 1];
    },
  };
}

describe("guideline HTTP and Realtime ordering", () => {
  test("direct INSERT, UPDATE and DELETE save without requesting HTTP", async () => {
    const run = harness();
    await run.manager.receive({
      type: "INSERT",
      guideline: advice("new", "scab"),
    });
    await run.manager.receive({ type: "UPDATE", guideline: advice("C") });
    await run.manager.receive({ type: "DELETE", id: "scab" });
    expect(run.rows()).toEqual([advice("C")]);
    expect(run.requests).toHaveLength(0);
  });

  test("Realtime C saves immediately and held HTTP B never replaces it", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    await run.manager.receive({ type: "UPDATE", guideline: advice("C") });
    expect(run.rows()).toEqual([advice("C")]);
    older.resolve([advice("B")]);
    (await run.nextRequest(2)).resolve([advice("C")]);
    expect(await refresh).toBe(true);
    expect(run.commits).toEqual([[advice("C")], [advice("C")]]);
  });

  test("HTTP completing first does not force an extra GET for a later event", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    (await run.nextRequest(1)).resolve([advice("B")]);
    expect(await refresh).toBe(true);
    await run.manager.receive({ type: "UPDATE", guideline: advice("C") });
    expect(run.rows()).toEqual([advice("C")]);
    expect(run.requests).toHaveLength(1);
  });

  test("several changes share one follow-up and a deleted row stays deleted", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    await run.manager.receive({ type: "UPDATE", guideline: advice("C") });
    await run.manager.receive({
      type: "INSERT",
      guideline: advice("new", "scab"),
    });
    await run.manager.receive({ type: "DELETE", id: "anthracnose" });
    older.resolve([advice("B")]);
    (await run.nextRequest(2)).resolve([advice("new", "scab")]);
    expect(await refresh).toBe(true);
    expect(run.requests).toHaveLength(2);
    expect(run.rows()).toEqual([advice("new", "scab")]);
    expect(
      run.commits.some((rows) =>
        rows.some((row) => row.guidelines_en === "Advice B"),
      ),
    ).toBe(false);
  });

  test("a failed old GET still follows up; a failed follow-up preserves C", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    await run.manager.receive({ type: "UPDATE", guideline: advice("C") });
    older.reject(new Error("Old request failed"));
    (await run.nextRequest(2)).reject(new Error("Follow-up failed"));
    expect(await refresh).toBe(false);
    expect(run.rows()).toEqual([advice("C")]);
    expect(run.errors).toHaveLength(2);
    expect(run.requests).toHaveLength(2);
  });

  test("a failed local edit does not block the next edit or HTTP refresh", async () => {
    const run = harness();
    run.failNextEdit();
    expect(
      await run.manager.receive({ type: "UPDATE", guideline: advice("B") }),
    ).toBe(false);
    expect(
      await run.manager.receive({ type: "UPDATE", guideline: advice("C") }),
    ).toBe(true);
    const refresh = run.manager.refresh();
    (await run.nextRequest(1)).resolve([advice("D")]);
    expect(await refresh).toBe(true);
    expect(run.rows()).toEqual([advice("D")]);
  });

  test("offline cleanup rejects an old response and reconnect fetches again", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    run.setOnline(false);
    run.manager.pause();
    expect(
      await run.manager.receive({ type: "UPDATE", guideline: advice("C") }),
    ).toBe(false);
    older.resolve([advice("B")]);
    expect(await refresh).toBe(false);
    expect(run.rows()).toEqual([advice("A")]);
    expect(run.requests).toHaveLength(1);
    run.setOnline(true);
    run.manager.resume();
    const fresh = run.manager.refresh();
    (await run.nextRequest(2)).resolve([advice("C")]);
    expect(await fresh).toBe(true);
    expect(run.rows()).toEqual([advice("C")]);
  });

  test("a response pending across quick offline and online transitions is invalidated", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    run.manager.pause();
    run.manager.resume();
    expect(run.manager.refresh()).toBe(refresh);
    older.resolve([advice("B")]);
    (await run.nextRequest(2)).resolve([advice("C")]);
    expect(await refresh).toBe(true);
    expect(run.commits).toEqual([[advice("C")]]);
  });

  test("subscription readiness invalidates a snapshot started before it could hear edits", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    expect(run.manager.refresh(true)).toBe(refresh);
    older.resolve([advice("B")]);
    (await run.nextRequest(2)).resolve([advice("C")]);
    expect(await refresh).toBe(true);
    expect(run.commits).toEqual([[advice("C")]]);
  });

  test("an unobserved write from another tab invalidates the HTTP baseline", async () => {
    const run = harness();
    const refresh = run.manager.refresh();
    const older = await run.nextRequest(1);
    run.otherTabWrites([advice("C")]);
    older.resolve([advice("B")]);
    (await run.nextRequest(2)).resolve([advice("C")]);
    expect(await refresh).toBe(true);
    expect(run.commits).toEqual([[advice("C")]]);
  });

  test("an event received during snapshot saving prevents the old commit", async () => {
    const run = harness();
    const save = run.holdSave();
    const refresh = run.manager.refresh();
    (await run.nextRequest(1)).resolve([advice("B")]);
    await run.saveStarted;
    // The event marks B invalid before its local edit waits behind the save.
    const receive = run.manager.receive({
      type: "UPDATE",
      guideline: advice("C"),
    });
    save.resolve();
    expect(await receive).toBe(true);
    (await run.nextRequest(2)).resolve([advice("C")]);
    expect(await refresh).toBe(true);
    expect(run.commits).toEqual([[advice("C")], [advice("C")]]);
  });

  test("snapshot comparison ignores order but checks every saved field", () => {
    const original = [advice("A"), advice("B", "scab")];
    const copy = structuredClone(original);
    expect(sameGuidelineSnapshot(original, [...copy].reverse())).toBe(true);
    for (const field of [
      "id",
      "disease_name",
      "guidelines_en",
      "guidelines_bis",
    ]) {
      const changed = structuredClone(copy);
      changed[0][field] += " changed";
      expect(sameGuidelineSnapshot(original, changed)).toBe(false);
    }
    expect(original).toEqual(copy);
  });

  test("snapshot comparison distinguishes added, deleted and empty guidance", () => {
    const first = advice("A");
    const second = advice("B", "scab");
    expect(sameGuidelineSnapshot([], [])).toBe(true);
    expect(sameGuidelineSnapshot([first], [])).toBe(false);
    expect(sameGuidelineSnapshot([], [first])).toBe(false);
    expect(sameGuidelineSnapshot([first], [first, second])).toBe(false);
    expect(sameGuidelineSnapshot([first, second], [first])).toBe(false);
    expect(sameGuidelineSnapshot([first, second], [first, first])).toBe(false);
    expect(
      sameGuidelineSnapshot([first, second], structuredClone([first, second])),
    ).toBe(true);
  });

  test("a successful no-op snapshot finishes without another GET or error", async () => {
    const snapshot = [advice("A")];
    const fetched = structuredClone(snapshot);
    const errors = [];
    let requests = 0;
    let replacements = 0;
    const manager = createGuidelineSyncManager({
      isOnline: () => true,
      readSnapshot: async () => snapshot,
      fetchSnapshot: async () => {
        requests += 1;
        return fetched;
      },
      // Returning true also means an adapter checked guidance and needed no
      // writes. Actual IndexedDB write suppression is proved in browser cases.
      replaceSnapshot: async (rows, baseline, canWrite) => {
        expect(rows).toBe(fetched);
        expect(baseline).toBe(snapshot);
        expect(canWrite()).toBe(true);
        replacements += 1;
        return true;
      },
      applyChange: async () => {
        throw new Error("No Realtime change expected");
      },
      onError: (error) => errors.push(error),
    });
    expect(await manager.refresh()).toBe(true);
    expect(requests).toBe(1);
    expect(replacements).toBe(1);
    expect(errors).toEqual([]);
  });
});

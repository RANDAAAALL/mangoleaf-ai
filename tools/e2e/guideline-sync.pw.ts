import type { APIRequestContext, Page } from "@playwright/test";
import {
  test,
  expect,
  attachJson,
  controlledModel,
  details,
  openApp,
  photos,
  runScan,
  scoresFor,
} from "./support/fixtures";
import type { DiseaseGuideline } from "../../src/lib/db";
import { translations } from "../../src/lib/translations";

declare global {
  interface Window {
    mangoGuidelineWrites?: { id: string; advice: string | null }[];
    mangoGuidelineWriteAttempts?: {
      operation: "clear" | "put" | "delete";
      id?: string;
      advice?: string;
    }[];
    mangoGuidelineCompletedTransactions?: number;
  }
}

const advice = (label: string, id = "anthracnose"): DiseaseGuideline => ({
  id,
  disease_name: id === "anthracnose" ? "Anthracnose" : "Mango Scab",
  guidelines_en: `Isolated guideline ${label}.`,
  guidelines_bis: `Isolated Bisaya guideline ${label}.`,
});
type GuidelineState = {
  reads: number;
  joins: number;
  events: number;
  held: number;
  connections: string[];
  recipients?: number;
};
async function control(
  request: APIRequestContext,
  settings?: Record<string, unknown>,
): Promise<GuidelineState> {
  const response = settings
    ? await request.post("/__test__/guidelines", { data: settings })
    : await request.get("/__test__/guidelines");
  expect(response.ok()).toBe(true);
  return response.json();
}
async function localGuidelines(page: Page): Promise<DiseaseGuideline[]> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const opening = indexedDB.open("MangoLeafDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const query = database
            .transaction("guidelines")
            .objectStore("guidelines")
            .getAll();
          query.onsuccess = () => {
            database.close();
            resolve(query.result);
          };
          query.onerror = () => {
            database.close();
            reject(query.error);
          };
        };
      }),
  );
}
async function expectAdvice(page: Page, row: DiseaseGuideline) {
  await expect
    .poll(async () =>
      (await localGuidelines(page)).find((saved) => saved.id === row.id),
    )
    .toEqual(row);
  await expect(
    details(page).getByText(row.guidelines_en, { exact: true }),
  ).toBeVisible();
}
async function settleReads(request: APIRequestContext) {
  let last = -1;
  let stable = 0;
  // Startup may request another pass after channel readiness.
  // Observe the completed baseline before measuring requests caused by an event.
  await expect
    .poll(
      async () => {
        const state = await control(request);
        stable = state.reads === last && state.held === 0 ? stable + 1 : 0;
        last = state.reads;
        return stable;
      },
      { intervals: [100], timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(3);
  return last;
}
async function observeCommittedWrites(page: Page) {
  await page.addInitScript(() => {
    window.mangoGuidelineWrites = [];
    window.mangoGuidelineWriteAttempts = [];
    window.mangoGuidelineCompletedTransactions = 0;
    const transaction = IDBDatabase.prototype.transaction;
    const clear = IDBObjectStore.prototype.clear;
    const put = IDBObjectStore.prototype.put;
    const remove = IDBObjectStore.prototype.delete;
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<typeof transaction>
    ) {
      const result = transaction.apply(this, args);
      if (
        result.mode === "readwrite" &&
        result.objectStoreNames.contains("guidelines")
      ) {
        result.addEventListener(
          "complete",
          () => {
            window.mangoGuidelineCompletedTransactions! += 1;
          },
          { once: true },
        );
      }
      return result;
    };
    IDBObjectStore.prototype.clear = function (
      ...args: Parameters<typeof clear>
    ) {
      if (this.name === "guidelines")
        window.mangoGuidelineWriteAttempts!.push({ operation: "clear" });
      return clear.apply(this, args);
    };
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      const result = put.apply(this, args);
      if (this.name === "guidelines") {
        const row = args[0] as { id: string; guidelines_en: string };
        window.mangoGuidelineWriteAttempts!.push({
          operation: "put",
          id: row.id,
          advice: row.guidelines_en,
        });
        // Log only committed writes. A result eventually becoming C does not
        // prove that an older B was never saved in between.
        this.transaction.addEventListener(
          "complete",
          () => {
            window.mangoGuidelineWrites!.push({
              id: row.id,
              advice: row.guidelines_en,
            });
          },
          { once: true },
        );
      }
      return result;
    };
    IDBObjectStore.prototype.delete = function (
      ...args: Parameters<typeof remove>
    ) {
      const result = remove.apply(this, args);
      if (this.name === "guidelines") {
        const id = String(args[0]);
        window.mangoGuidelineWriteAttempts!.push({ operation: "delete", id });
        this.transaction.addEventListener(
          "complete",
          () => {
            window.mangoGuidelineWrites!.push({ id, advice: null });
          },
          { once: true },
        );
      }
      return result;
    };
  });
}

async function writeObservation(page: Page) {
  return page.evaluate(() => ({
    attempts: window.mangoGuidelineWriteAttempts!,
    completedTransactions: window.mangoGuidelineCompletedTransactions!,
  }));
}

async function finishHeldRefresh(
  page: Page,
  request: APIRequestContext,
  previousTransactions: number,
) {
  await control(request, { action: "release" });
  // A completed readwrite transaction proves the HTTP save/check finished,
  // even when identical guidance required no clear or put calls at all.
  await expect
    .poll(async () => (await writeObservation(page)).completedTransactions)
    .toBeGreaterThan(previousTransactions);
  await settleReads(request);
}
async function prepare(page: Page, request: APIRequestContext) {
  await observeCommittedWrites(page);
  await controlledModel(page, scoresFor("Anthracnose"));
  await openApp(page);
  await expect
    .poll(async () => (await control(request)).connections.length)
    .toBe(1);
  // Controlled scores open the actual treatment UI without claiming accuracy.
  await runScan(page, photos[0].file);
  await expectAdvice(page, advice("A"));
  await settleReads(request);
}
async function startHeldRefresh(page: Page, request: APIRequestContext) {
  // The foreground handler runs only for a visible tab, including the peer case.
  await page.bringToFront();
  await control(request, { action: "hold" });
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect.poll(async () => (await control(request)).held).toBe(1);
  return (await control(request)).reads;
}
async function expectNoRegression(
  page: Page,
  newer: DiseaseGuideline,
  older: DiseaseGuideline,
) {
  const writes = await page.evaluate(() => window.mangoGuidelineWrites!);
  const firstNewer = writes.findIndex(
    (write) => write.advice === newer.guidelines_en,
  );
  expect(firstNewer).toBeGreaterThanOrEqual(0);
  expect(
    writes
      .slice(firstNewer + 1)
      .some((write) => write.advice === older.guidelines_en),
  ).toBe(false);
}

test.beforeEach(async ({ request }) => {
  await control(request, { action: "reset", rows: [advice("A")] });
});
test.afterEach(async ({ request }) => {
  await control(request, { action: "reset" });
});

test("G01: Realtime C is shown before held HTTP B finishes and B never replaces it", async ({
  page,
  request,
}, info) => {
  await prepare(page, request);
  // Install B without delivering a notification to this connected page.
  const connection = (await control(request)).connections[0];
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("B"),
    skipConnectionId: connection,
  });
  const heldReads = await startHeldRefresh(page, request);
  const change = await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  expect(change.recipients).toBe(1);
  await expectAdvice(page, advice("C"));
  expect((await control(request)).held).toBe(1);
  await control(request, { action: "release" });
  await expect
    .poll(async () => (await control(request)).reads)
    .toBe(heldReads + 1);
  expect(await settleReads(request)).toBe(heldReads + 1);
  await expectAdvice(page, advice("C"));
  await expectNoRegression(page, advice("C"), advice("B"));
  await attachJson(info, "guideline-overlap", {
    network: await control(request),
    committedWrites: await page.evaluate(() => window.mangoGuidelineWrites),
  });
});

test("G02: HTTP saves first, then direct INSERT, UPDATE and DELETE need no extra GET", async ({
  page,
  request,
}, info) => {
  await prepare(page, request);
  const baseline = await settleReads(request);
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  await expectAdvice(page, advice("C"));
  const inserted = advice("inserted", "mango_scab");
  await control(request, {
    action: "change",
    eventType: "INSERT",
    row: inserted,
  });
  await expect
    .poll(() => localGuidelines(page))
    .toEqual([advice("C"), inserted]);
  await control(request, {
    action: "change",
    eventType: "DELETE",
    row: advice("C"),
  });
  await expect.poll(() => localGuidelines(page)).toEqual([inserted]);
  await expect(
    details(page).getByText(translations.en.guidelinesUnavailable, {
      exact: true,
    }),
  ).toBeVisible();
  expect(await settleReads(request)).toBe(baseline);
  await attachJson(info, "direct-realtime-events", await control(request));
});

test("G03: failed overlap follow-up retains the advice already received through Realtime", async ({
  page,
  request,
  runtimeErrors,
}, info) => {
  await prepare(page, request);
  const heldReads = await startHeldRefresh(page, request);
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  await expectAdvice(page, advice("C"));
  await control(request, { action: "fail" });
  const failure = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/__mock__/rest/v1/guidelines" &&
      response.status() === 503,
  );
  await control(request, { action: "release" });
  await failure;
  await expectAdvice(page, advice("C"));
  expect(await settleReads(request)).toBe(heldReads + 1);
  await expectNoRegression(page, advice("C"), advice("A"));
  // The deliberately failed request may produce a browser resource error.
  const expectedErrors = runtimeErrors.filter(
    (error) =>
      error.includes("503") && error.includes("/__mock__/rest/v1/guidelines"),
  );
  for (let index = runtimeErrors.length - 1; index >= 0; index -= 1)
    if (expectedErrors.includes(runtimeErrors[index]))
      runtimeErrors.splice(index, 1);
  await attachJson(info, "deliberate-guideline-failure", {
    expectedErrors,
    network: await control(request),
  });
});

test("G04: multiple overlapping changes share one follow-up and deleted advice stays deleted", async ({
  page,
  request,
}) => {
  await prepare(page, request);
  const heldReads = await startHeldRefresh(page, request);
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  await expectAdvice(page, advice("C"));
  const inserted = advice("new entry", "mango_scab");
  await control(request, {
    action: "change",
    eventType: "INSERT",
    row: inserted,
  });
  await control(request, {
    action: "change",
    eventType: "DELETE",
    row: advice("C"),
  });
  await expect.poll(() => localGuidelines(page)).toEqual([inserted]);
  await control(request, { action: "release" });
  await expect
    .poll(async () => (await control(request)).reads)
    .toBe(heldReads + 1);
  expect(await settleReads(request)).toBe(heldReads + 1);
  await expect.poll(() => localGuidelines(page)).toEqual([inserted]);
  await expectNoRegression(page, advice("C"), advice("A"));
});

test("G05: reconnect catches missed table changes, then Realtime resumes direct updates", async ({
  page,
  context,
  request,
}) => {
  await prepare(page, request);
  const before = await control(request);
  await context.setOffline(true);
  await control(request, { action: "disconnect" });
  await expect
    .poll(async () => (await control(request)).connections.length)
    .toBe(0);
  const missed = await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("B"),
  });
  expect(missed.recipients).toBe(0);
  await expectAdvice(page, advice("A"));
  await context.setOffline(false);
  await expect
    .poll(async () => (await control(request)).connections.length)
    .toBe(1);
  await expectAdvice(page, advice("B"));
  const baseline = await settleReads(request);
  expect(baseline).toBeGreaterThan(before.reads);
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  await expectAdvice(page, advice("C"));
  expect(await settleReads(request)).toBe(baseline);
});

test("G06: another tab's Realtime write protects shared IndexedDB from held old HTTP", async ({
  page,
  context,
  request,
}, info) => {
  await prepare(page, request);
  const firstConnection = (await control(request)).connections[0];
  const peer = await context.newPage();
  await controlledModel(peer, scoresFor("Anthracnose"));
  await openApp(peer);
  await expect
    .poll(async () => (await control(request)).connections.length)
    .toBe(2);
  await settleReads(request);
  const heldReads = await startHeldRefresh(page, request);
  // Only the peer hears C. The first page must notice its shared database
  // changed instead of relying on a counter private to its own subscription.
  const change = await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
    skipConnectionId: firstConnection,
  });
  expect(change.recipients).toBe(1);
  await expectAdvice(page, advice("C"));
  await control(request, { action: "release" });
  await expect
    .poll(async () => (await control(request)).reads)
    .toBe(heldReads + 1);
  expect(await settleReads(request)).toBe(heldReads + 1);
  await expectAdvice(page, advice("C"));
  await expect.poll(() => localGuidelines(peer)).toEqual([advice("C")]);
  await attachJson(info, "shared-guideline-state", await control(request));
  await peer.close();
});

test("G08: identical HTTP guidance and reordered rows finish without clear or put calls", async ({
  page,
  request,
}, info) => {
  const rows = [advice("A"), advice("A", "mango_scab")];
  await control(request, { action: "reset", rows });
  await prepare(page, request);
  const evidence = [];
  for (const incoming of [rows, [...rows].reverse()]) {
    // Reset changes the mock table silently; only the measured HTTP response
    // can reconcile these rows. Array order must not manufacture a change.
    await control(request, { action: "reset", rows: incoming });
    await startHeldRefresh(page, request);
    const before = await writeObservation(page);
    const response = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/__mock__/rest/v1/guidelines" &&
        response.status() === 200,
    );
    await finishHeldRefresh(page, request, before.completedTransactions);
    expect(await (await response).json()).toEqual(incoming);
    const after = await writeObservation(page);
    expect(after.attempts).toEqual(before.attempts);
    await expect.poll(() => localGuidelines(page)).toEqual(rows);
    await expectAdvice(page, rows[0]);
    expect((await control(request)).reads).toBe(1);
    evidence.push({ incoming, before, after });
  }
  await attachJson(info, "unchanged-guidance-no-writes", evidence);
});

test("G09: English, Bisaya, names, additions, deletions and an empty HTTP set remain meaningful changes", async ({
  page,
  request,
}, info) => {
  await prepare(page, request);
  const english = { ...advice("A"), guidelines_en: "Changed English only." };
  const bisaya = { ...english, guidelines_bis: "Nausab ang tambag sa Bisaya." };
  const renamed = { ...bisaya, disease_name: "Renamed mango advice" };
  const scab = advice("added", "mango_scab");
  const evidence = [];
  for (const rows of [
    [english],
    [bisaya],
    [renamed],
    [renamed, scab],
    [scab],
    [],
  ]) {
    await control(request, { action: "reset", rows });
    await startHeldRefresh(page, request);
    const before = await writeObservation(page);
    await finishHeldRefresh(page, request, before.completedTransactions);
    await expect.poll(() => localGuidelines(page)).toEqual(rows);
    const after = await writeObservation(page);
    const attempts = after.attempts.slice(before.attempts.length);
    expect(
      attempts.filter((attempt) => attempt.operation === "clear"),
    ).toHaveLength(1);
    expect(
      attempts.filter((attempt) => attempt.operation === "put"),
    ).toHaveLength(rows.length);
    expect((await control(request)).reads).toBe(1);
    evidence.push({ rows, attempts });
  }
  await expect(
    details(page).getByText(translations.en.guidelinesUnavailable, {
      exact: true,
    }),
  ).toBeVisible();
  // An authoritative empty set deletes saved advice once; repeating that empty
  // set should then succeed without issuing a second clear operation.
  await control(request, { action: "reset", rows: [] });
  await startHeldRefresh(page, request);
  const beforeEmpty = await writeObservation(page);
  await finishHeldRefresh(page, request, beforeEmpty.completedTransactions);
  expect((await writeObservation(page)).attempts).toEqual(beforeEmpty.attempts);
  await expect.poll(() => localGuidelines(page)).toEqual([]);
  expect((await control(request)).reads).toBe(1);
  await attachJson(info, "changed-guidance-and-empty-set", evidence);
});

test("G10: identical overlap follow-up checks the complete set without rewriting Realtime C", async ({
  page,
  request,
}, info) => {
  await prepare(page, request);
  const connection = (await control(request)).connections[0];
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("B"),
    skipConnectionId: connection,
  });
  const heldReads = await startHeldRefresh(page, request);
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  await expectAdvice(page, advice("C"));
  const before = await writeObservation(page);
  await finishHeldRefresh(page, request, before.completedTransactions);
  const after = await writeObservation(page);
  expect(after.attempts).toEqual(before.attempts);
  expect((await control(request)).reads).toBe(heldReads + 1);
  await expectAdvice(page, advice("C"));
  await expectNoRegression(page, advice("C"), advice("B"));
  await attachJson(info, "identical-overlap-follow-up", {
    network: await control(request),
    before,
    after,
  });
});

test("G11: overlap follow-up still saves a missed Scab update alongside Realtime Anthracnose", async ({
  page,
  request,
}, info) => {
  const oldScab = advice("old Scab", "mango_scab");
  const newScab = advice("new Scab", "mango_scab");
  await control(request, { action: "reset", rows: [advice("A"), oldScab] });
  await prepare(page, request);
  const connection = (await control(request)).connections[0];
  const missed = await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: newScab,
    skipConnectionId: connection,
  });
  expect(missed.recipients).toBe(0);
  const heldReads = await startHeldRefresh(page, request);
  await control(request, {
    action: "change",
    eventType: "UPDATE",
    row: advice("C"),
  });
  await expectAdvice(page, advice("C"));
  await expect
    .poll(() => localGuidelines(page))
    .toEqual([advice("C"), oldScab]);
  const before = await writeObservation(page);
  await finishHeldRefresh(page, request, before.completedTransactions);
  await expect
    .poll(() => localGuidelines(page))
    .toEqual([advice("C"), newScab]);
  const after = await writeObservation(page);
  const attempts = after.attempts.slice(before.attempts.length);
  expect(
    attempts.filter((attempt) => attempt.operation === "clear"),
  ).toHaveLength(1);
  expect(
    attempts.filter((attempt) => attempt.operation === "put"),
  ).toHaveLength(2);
  expect((await control(request)).reads).toBe(heldReads + 1);
  await expectAdvice(page, advice("C"));
  await expectNoRegression(page, advice("C"), advice("A"));
  await attachJson(info, "overlap-follow-up-with-missed-row", {
    network: await control(request),
    saved: await localGuidelines(page),
    attempts,
  });
});

test.describe("Guideline worker cache", () => {
  test.use({ serviceWorkers: "allow" });
  test("G07: worker removes old guideline responses, bypasses HTTP cache, and keeps IndexedDB advice offline", async ({
    page,
    context,
    request,
    browserName,
    runtimeErrors,
  }, info) => {
    test.skip(
      browserName !== "chromium",
      "Service-worker coverage uses the installed Chromium runtime.",
    );
    // Visit a harmless local document before the application registers its worker.
    await page.goto("/__test__/ready");
    await page.evaluate(async (row) => {
      const cache = await caches.open("others");
      await cache.put(
        "/__mock__/rest/v1/guidelines?select=id%2Cdisease_name%2Cguidelines_en%2Cguidelines_bis",
        new Response(JSON.stringify([row]), {
          headers: { "Content-Type": "application/json" },
        }),
      );
      await cache.put(
        "/__test__/preserved-cache-sentinel",
        new Response("Keep unrelated cached files"),
      );
    }, advice("stale HTTP cache"));
    await prepare(page, request);
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => undefined),
    );
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const cache = await caches.open("others");
          return {
            guidance: Boolean(
              await cache.match(
                "/__mock__/rest/v1/guidelines?select=id%2Cdisease_name%2Cguidelines_en%2Cguidelines_bis",
              ),
            ),
            unrelated: Boolean(
              await cache.match("/__test__/preserved-cache-sentinel"),
            ),
          };
        }),
      )
      .toEqual({ guidance: false, unrelated: true });
    await page.evaluate(async (row) => {
      // Recreate the old fallback response after activation to check routing too.
      const cache = await caches.open("others");
      await cache.put(
        "/__mock__/rest/v1/guidelines?select=id%2Cdisease_name%2Cguidelines_en%2Cguidelines_bis",
        new Response(JSON.stringify([row]), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    }, advice("stale HTTP cache"));
    const connection = (await control(request)).connections[0];
    await control(request, {
      action: "change",
      eventType: "UPDATE",
      row: advice("B"),
      skipConnectionId: connection,
    });
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await expectAdvice(page, advice("B"));
    await settleReads(request);
    await context.setOffline(true);
    // A network-only request must fail despite a successful cached HTTP 200.
    const response = await page.evaluate(async () => {
      try {
        await fetch(
          "/__mock__/rest/v1/guidelines?select=id%2Cdisease_name%2Cguidelines_en%2Cguidelines_bis",
        );
        return "unexpected cached response";
      } catch {
        return "network failed";
      }
    });
    expect(response).toBe("network failed");
    await expectAdvice(page, advice("B"));
    const expectedErrors = runtimeErrors.filter(
      (error) =>
        error.includes("/__mock__/rest/v1/guidelines") &&
        /ERR_INTERNET_DISCONNECTED|ERR_FAILED|Failed to load resource/.test(
          error,
        ),
    );
    for (let index = runtimeErrors.length - 1; index >= 0; index -= 1)
      if (expectedErrors.includes(runtimeErrors[index]))
        runtimeErrors.splice(index, 1);
    await attachJson(info, "intentional-offline-guideline-request", {
      response,
      expectedErrors,
    });
    await context.setOffline(false);
  });
});

import { test, expect } from "@playwright/test";
import {
  closeDetails,
  controlledModel,
  mockGuestToken,
  nav,
  openApp,
  photos,
  records,
  runScan,
  scoresFor,
} from "./support/fixtures";

// Expected HTTP failures are part of these cases, so use the base fixture;
// page crashes/errors are checked separately from rejected network requests.
test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    localStorage.setItem("preferred_language", "en");
    Reflect.deleteProperty(Object.getPrototypeOf(navigator), "serviceWorker");
  });
  await controlledModel(page, scoresFor("Healthy Leaf"));
});

test("S03: deleting during a private upload does not resurrect a row or orphan its photo", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let releaseUpload!: () => void;
  let signalUpload!: () => void;
  const released = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  const started = new Promise<void>((resolve) => {
    signalUpload = resolve;
  });
  let held = false;
  await page.route("**/__mock__/storage/v1/object/scans/**", async (route) => {
    if (route.request().method() === "POST" && !held) {
      held = true;
      signalUpload();
      await released;
    }
    await route.continue();
  });
  await openApp(page);
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await started;
  const pending = (await records(page))[0];
  expect(pending.owner_id).toBeTruthy();
  await nav(page, "History");
  await page.getByTitle("Delete scan log").click();
  await expect
    .poll(async () => (await records(page))[0]?._status)
    .toBe("pending-delete");
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(0);
  releaseUpload();
  await expect.poll(() => records(page), { timeout: 20_000 }).toEqual([]);
  const headers = { Authorization: `Bearer ${await mockGuestToken(page)}` };
  const remote = await page.request.get("/__mock__/rest/v1/scans", {
    headers,
    params: { id: "eq." + pending.cloud_id },
  });
  expect(await remote.json()).toEqual([]);
  const object = await page.request.get(
    `/__mock__/storage/v1/object/authenticated/scans/${pending.owner_id}/${pending.cloud_id}.webp`,
    { headers },
  );
  expect(object.status()).toBe(404);
  expect(errors).toEqual([]);
});

test("S04: failed private photo deletion keeps its tombstone until cleanup succeeds", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openApp(page);
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await expect
    .poll(async () => (await records(page))[0]?._status)
    .toBe("synced");
  const saved = (await records(page))[0];
  let rejectCleanup = true;
  let signalCleanup!: () => void;
  const attempted = new Promise<void>((resolve) => {
    signalCleanup = resolve;
  });
  await page.route("**/__mock__/storage/v1/object/scans", async (route) => {
    if (route.request().method() === "DELETE" && rejectCleanup) {
      signalCleanup();
      await route.fulfill({
        status: 503,
        json: { error: "Isolated cleanup failure" },
      });
      return;
    }
    await route.continue();
  });
  await nav(page, "History");
  await page.getByTitle("Delete scan log").click();
  await attempted;
  await expect
    .poll(async () => (await records(page))[0]?._status)
    .toBe("pending-delete");
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(0);
  const headers = { Authorization: `Bearer ${await mockGuestToken(page)}` };
  expect(
    (
      await page.request.get(
        `/__mock__/storage/v1/object/authenticated/scans/${saved.storage_path}`,
        { headers },
      )
    ).ok(),
  ).toBe(true);
  rejectCleanup = false;
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect.poll(() => records(page), { timeout: 20_000 }).toEqual([]);
  expect(
    (
      await page.request.get(
        `/__mock__/storage/v1/object/authenticated/scans/${saved.storage_path}`,
        { headers },
      )
    ).status(),
  ).toBe(404);
  expect(errors).toEqual([]);
});

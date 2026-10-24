import {
  test,
  expect,
  photos,
  openApp,
  scannerHarnessPath,
  runScan,
  closeDetails,
  records,
  nav,
  attachJson,
  recentHeading,
  homeHeading,
  historyDetails,
} from "./support/fixtures";
import type { ConsoleMessage } from "@playwright/test";

test.use({ serviceWorkers: "allow" });
test("R02: real service worker reloads history and diagnoses a new photo offline", async ({
  page,
  context,
  runtimeErrors,
}, info) => {
  test.setTimeout(180_000);
  await openApp(page);
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await expect
    .poll(async () => {
      const saved = await records(page);
      return saved.length === 1 && saved[0]._status === "local-only";
    })
    .toBe(true);
  await nav(page, "History");
  await nav(page, "Home");
  // Static-export HTML enters the runtime cache on a controlled online visit.
  await page.reload();
  await expect(homeHeading(page)).toBeVisible();
  const required = await page.evaluate(async (navigationPath) => {
    const model = await (await fetch("/model/model.json")).json();
    return [
      navigationPath,
      "/model/model.json",
      "/model/model_config.json",
      ...model.weightsManifest.flatMap((group: { paths: string[] }) =>
        group.paths.map((path) => "/model/" + path),
      ),
    ];
  }, scannerHarnessPath);
  const cacheInventory = await page.evaluate(async () =>
    Object.fromEntries(
      await Promise.all(
        (await caches.keys()).map(async (name) => [
          name,
          (await (await caches.open(name)).keys()).map(
            (request) => request.url,
          ),
        ]),
      ),
    ),
  );
  await attachJson(info, "cache-inventory", cacheInventory);
  await expect
    .poll(
      () =>
        page.evaluate(
          async (paths) =>
            Promise.all(
              paths.map(async (path) =>
                Boolean(await caches.match(path, { ignoreSearch: true })),
              ),
            ),
          required,
        ),
      { timeout: 60_000 },
    )
    .toEqual(required.map(() => true));
  const hits: string[] = [];
  page.on("response", (response) => {
    if (response.fromServiceWorker())
      hits.push(new URL(response.url()).pathname);
  });
  const guidelineUrl = new URL(
    "/__mock__/rest/v1/guidelines?select=id%2Cdisease_name%2Cguidelines_en%2Cguidelines_bis",
    page.url(),
  ).href;
  const offlineGuidelineErrors: string[] = [];
  const isOfflineGuidelineError = (message: ConsoleMessage) =>
    message.type() === "error" &&
    message.location().url === guidelineUrl &&
    /^Failed to load resource: net::ERR_(INTERNET_DISCONNECTED|FAILED)$/.test(
      message.text(),
    );
  const observeOfflineGuidelineError = (message: ConsoleMessage) => {
    if (isOfflineGuidelineError(message))
      offlineGuidelineErrors.push(
        `${message.text()} (${message.location().url})`,
      );
  };
  // Cutting the network may also interrupt an application's guideline refresh.
  page.on("console", observeOfflineGuidelineError);
  await context.setOffline(true);
  // Exercise the expected browser error even when no refresh crosses the cut.
  const failureMessage = page.waitForEvent("console", {
    predicate: isOfflineGuidelineError,
    timeout: 15_000,
  });
  const offlineGuidelineResponse = await page.evaluate(async (url) => {
    try {
      await fetch(url);
      return "unexpected response";
    } catch {
      return "network failed";
    }
  }, guidelineUrl);
  expect(offlineGuidelineResponse).toBe("network failed");
  await failureMessage;
  await page.reload();
  await expect(homeHeading(page)).toBeVisible({ timeout: 90_000 });
  await nav(page, "History");
  await expect(historyDetails(page)).toHaveCount(1);
  await historyDetails(page).click();
  const offlineImage = page
    .getByRole("button", { name: "Close details" })
    .first()
    .locator("..")
    .locator("img");
  await expect(offlineImage).toBeVisible();
  await expect
    .poll(() =>
      offlineImage.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await closeDetails(page);
  // A different file proves offline inference, rather than duplicate-report reuse.
  await runScan(page, photos[1].file);
  const saved = await records(page);
  expect(saved).toHaveLength(2);
  expect(
    saved.some(
      (row) =>
        row.image_hash === photos[1].sha256 && row._status === "local-only",
    ),
  ).toBe(true);
  await page.reload();
  await expect(homeHeading(page)).toBeVisible();
  if (page.viewportSize()!.width < 768)
    await expect(recentHeading(page)).toBeVisible();
  else await expect(recentHeading(page)).toHaveCount(0);
  // Home shows one phone preview or a desktop Download card; History retains both.
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount((page.viewportSize()?.width ?? 0) < 768 ? 1 : 0);
  await nav(page, "History");
  await expect(historyDetails(page)).toHaveCount(2);
  for (const path of required) expect(hits).toContain(path);
  await attachJson(info, "offline-evidence", {
    requiredCachedAssets: required,
    serviceWorkerResponses: [...new Set(hits)],
    savedHashes: saved.map((row) => row.image_hash),
  });
  page.off("console", observeOfflineGuidelineError);
  await attachJson(info, "intentional-offline-guideline-errors", {
    guidelineUrl,
    response: offlineGuidelineResponse,
    expectedErrors: offlineGuidelineErrors,
  });
  expect(offlineGuidelineErrors.length).toBeGreaterThan(0);
  // Consume only exact guideline errors observed during this offline window.
  // Other requests, application errors, crashes and reconnect errors stay strict.
  for (const error of offlineGuidelineErrors) {
    expect(runtimeErrors).toContain(error);
    runtimeErrors.splice(runtimeErrors.indexOf(error), 1);
  }
  await context.setOffline(false);
  // A worker update may reload once after reconnection; read IndexedDB only after it settles.
  await page.waitForLoadState("domcontentloaded");
  await expect
    .poll(
      async () => {
        try {
          const synced = await records(page);
          return (
            synced.length === 2 &&
            synced.every((row) => row._status === "local-only")
          );
        } catch (error) {
          if (String(error).includes("Execution context was destroyed"))
            return false;
          throw error;
        }
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  const reconnected = await records(page);
  expect(reconnected.map((row) => row.id).sort()).toEqual(
    saved.map((row) => row.id).sort(),
  );
  expect(
    reconnected.every(
      (row) =>
        row._status === "local-only" &&
        !row.owner_id &&
        !row.cloud_id &&
        !row.storage_path,
    ),
  ).toBe(true);
  await attachJson(
    info,
    "reconnected-local-records",
    reconnected.map((row) => ({
      id: row.id,
      image_hash: row.image_hash,
      status: row._status,
    })),
  );
});

import {
  test,
  expect,
  photos,
  openApp,
  runScan,
  closeDetails,
  records,
  nav,
  attachJson,
  mockGuestToken,
} from "./support/fixtures";
import { createHash } from "node:crypto";

test.use({ serviceWorkers: "allow" });
test("R02: real service worker reloads history and diagnoses a new photo offline", async ({
  page,
  context,
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
      return saved.length === 1 && saved[0]._status === "synced";
    })
    .toBe(true);
  await nav(page, "History");
  await nav(page, "Home");
  // Static-export HTML enters the runtime cache on a controlled online visit.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Recent Scans" }),
  ).toBeVisible();
  const required = await page.evaluate(async () => {
    const model = await (await fetch("/model/model.json")).json();
    return [
      "/",
      "/model/model.json",
      "/model/model_config.json",
      ...model.weightsManifest.flatMap((group: { paths: string[] }) =>
        group.paths.map((path) => "/model/" + path),
      ),
    ];
  });
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
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Recent Scans" })).toBeVisible(
    { timeout: 90_000 },
  );
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Details", exact: true }).click();
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
        row.image_hash === photos[1].sha256 && row._status === "pending-insert",
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(2);
  for (const path of required) expect(hits).toContain(path);
  await attachJson(info, "offline-evidence", {
    requiredCachedAssets: required,
    serviceWorkerResponses: [...new Set(hits)],
    savedHashes: saved.map((row) => row.image_hash),
  });
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
            synced.every((row) => row._status === "synced")
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
  // Read the mock independently: a local synced flag alone cannot prove delivery.
  const synced = await records(page);
  expect(synced.map((row) => row.id).sort()).toEqual(
    saved.map((row) => row.id).sort(),
  );
  const response = await page.request.get("/__mock__/rest/v1/scans", {
    params: { owner_id: "eq." + synced[0].owner_id },
    headers: { Authorization: `Bearer ${await mockGuestToken(page)}` },
  });
  expect(response.ok()).toBe(true);
  const remote = await response.json();
  expect(remote).toHaveLength(2);
  for (const row of synced) {
    expect(remote).toContainEqual(
      expect.objectContaining({
        id: row.cloud_id,
        disease_name: row.disease_name,
        confidence: row.confidence,
        image_url: row.image_url,
        image_hash: row.image_hash,
        owner_id: row.owner_id,
        storage_path: row.storage_path,
        model_version: row.model_version,
        device_id: row.device_id,
        updated_at: row.updated_at,
      }),
    );
    expect(row.image_url).toBeNull();
    expect(row.storage_path).toMatch(/^[0-9a-f-]+\/[0-9a-f-]+\.(webp|jpg)$/);
    const uploaded = await page.request.get(
      `/__mock__/storage/v1/object/authenticated/scans/${row.storage_path}`,
      { headers: { Authorization: `Bearer ${await mockGuestToken(page)}` } },
    );
    expect(uploaded.ok()).toBe(true);
    const localHash = await page.evaluate(
      (id) =>
        new Promise<string>((resolve, reject) => {
          const opening = indexedDB.open("MangoLeafDB");
          opening.onerror = () => reject(opening.error);
          opening.onsuccess = () => {
            const database = opening.result;
            const query = database
              .transaction("scans")
              .objectStore("scans")
              .get(id);
            query.onerror = () => {
              database.close();
              reject(query.error);
            };
            query.onsuccess = () => {
              database.close();
              (query.result.image_blob as Blob)
                .arrayBuffer()
                .then((bytes) => crypto.subtle.digest("SHA-256", bytes))
                .then((hash) =>
                  resolve(
                    Array.from(new Uint8Array(hash))
                      .map((byte) => byte.toString(16).padStart(2, "0"))
                      .join(""),
                  ),
                )
                .catch(reject);
            };
          };
        }),
      row.id,
    );
    expect(
      createHash("sha256")
        .update(await uploaded.body())
        .digest("hex"),
    ).toBe(localHash);
  }
  await attachJson(info, "reconnected-mock-records", remote);
});

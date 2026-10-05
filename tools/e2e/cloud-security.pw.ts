import { test, expect } from "@playwright/test";

import {
  controlledModel,
  scoresFor,
  openApp,
  runScan,
  closeDetails,
  records,
  mockGuestToken,
  savedPhotoSize,
  photos,
  nav,
  historyDetails,
} from "./support/fixtures";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem("preferred_language", "en");
    Reflect.deleteProperty(Object.getPrototypeOf(navigator), "serviceWorker");
  });
});

test("S01: guest cloud history and private photos stay separate across browsers", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  await runScan(page, photos[0].file);
  await closeDetails(page);
  await expect
    .poll(async () => (await records(page))[0]?._status)
    .toBe("synced");
  const first = (await records(page))[0];
  const firstToken = await mockGuestToken(page);
  const secondContext = await browser.newContext({
    serviceWorkers: "block",
    locale: "en-US",
  });
  try {
    await secondContext.addInitScript(() => {
      localStorage.setItem("preferred_language", "en");
      Reflect.deleteProperty(Object.getPrototypeOf(navigator), "serviceWorker");
    });
    const second = await secondContext.newPage();
    await controlledModel(second, scoresFor("Healthy Fruit"));
    await openApp(second);
    await runScan(second, photos[1].file);
    await closeDetails(second);
    await expect
      .poll(async () => (await records(second))[0]?._status)
      .toBe("synced");
    const other = (await records(second))[0];
    expect(other.owner_id).not.toBe(first.owner_id);
    const otherToken = await mockGuestToken(second);
    const otherHeaders = { Authorization: `Bearer ${otherToken}` };
    const firstHeaders = { Authorization: `Bearer ${firstToken}` };
    const ownRows = await second.request.get("/__mock__/rest/v1/scans", {
      headers: otherHeaders,
    });
    expect(await ownRows.json()).toEqual([
      expect.objectContaining({ id: other.cloud_id, owner_id: other.owner_id }),
    ]);
    const forgedDevice = await second.request.get("/__mock__/rest/v1/scans", {
      headers: otherHeaders,
      params: { device_id: "eq." + first.device_id },
    });
    expect(await forgedDevice.json()).toEqual([]);
    await second.request.delete("/__mock__/rest/v1/scans", {
      headers: otherHeaders,
      params: { id: "eq." + first.cloud_id },
    });
    const untouched = await page.request.get("/__mock__/rest/v1/scans", {
      headers: firstHeaders,
      params: { id: "eq." + first.cloud_id },
    });
    expect(await untouched.json()).toHaveLength(1);
    const forgedInsert = await second.request.post("/__mock__/rest/v1/scans", {
      headers: otherHeaders,
      data: { ...first, id: crypto.randomUUID() },
    });
    expect(forgedInsert.status()).toBe(403);
    const privatePath = `/__mock__/storage/v1/object/authenticated/scans/${first.storage_path}`;
    expect(
      (await page.request.get(privatePath, { headers: firstHeaders })).ok(),
    ).toBe(true);
    expect(
      (
        await second.request.get(privatePath, { headers: otherHeaders })
      ).status(),
    ).toBe(403);
    expect((await second.request.get(privatePath)).status()).toBe(401);
    expect(
      (
        await second.request.get(
          "/__mock__/storage/v1/object/public/scans/" + first.storage_path,
          { headers: otherHeaders },
        )
      ).status(),
    ).toBe(403);
    expect(
      (
        await second.request.delete("/__mock__/storage/v1/object/scans", {
          headers: otherHeaders,
          data: { prefixes: [first.storage_path] },
        })
      ).status(),
    ).toBe(403);
    await page.reload();
    await openApp(page);
    expect(await mockGuestToken(page)).toBe(firstToken);
    expect(await savedPhotoSize(page, first.id)).toBeGreaterThan(0);
  } finally {
    await secondContext.close();
  }
});

test("S02: failed guest sign-in does not block diagnosis or public guidelines", async ({
  page,
}) => {
  const advice = {
    id: "healthy",
    disease_name: "Healthy",
    guidelines_en:
      "Isolated updated advice still downloads when guest sign-in fails.",
    guidelines_bis: "Tambag sa lokal nga pagsulay.",
  };
  await page.route("**/__mock__/auth/v1/**", (route) =>
    route.fulfill({
      status: 400,
      json: { msg: "Guest sign-in unavailable in isolated test" },
    }),
  );
  await page.route("**/__mock__/rest/v1/guidelines?*", (route) =>
    route.fulfill({ json: [advice] }),
  );
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  await runScan(page, photos[0].file);
  await expect(
    page.getByText(advice.guidelines_en, { exact: true }),
  ).toBeVisible();
  await closeDetails(page);
  const saved = await records(page);
  expect(saved).toHaveLength(1);
  expect(saved[0]._status).toBe("pending-insert");
  expect(await savedPhotoSize(page, saved[0].id)).toBeGreaterThan(0);
  await nav(page, "History");
  await expect(historyDetails(page)).toHaveCount(1);
});

test("S05: upgrading legacy IndexedDB keeps local history and does not claim old cloud photos", async ({
  page,
}) => {
  const withPhoto = crypto.randomUUID();
  const withoutPhoto = crypto.randomUUID();
  const legacyReads: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/storage/v1/object/public/"))
      legacyReads.push(request.url());
  });
  await page.goto("/__test__/ready");
  await page.evaluate(
    async ({ withPhoto, withoutPhoto, file }) => {
      const image = await (await fetch("/__test__/photos/" + file)).blob();
      await new Promise<void>((resolve, reject) => {
        // Dexie multiplies its declared version by 10 in native IndexedDB.
        const opening = indexedDB.open("MangoLeafDB", 70);
        opening.onupgradeneeded = () => {
          const scans = opening.result.createObjectStore("scans", {
            keyPath: "id",
          });
          for (const field of [
            "image_hash",
            "disease_name",
            "confidence",
            "updated_at",
            "device_id",
            "_status",
          ])
            scans.createIndex(field, field);
          const guidelines = opening.result.createObjectStore("guidelines", {
            keyPath: "id",
          });
          guidelines.createIndex("disease_name", "disease_name");
        };
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const transaction = database.transaction("scans", "readwrite");
          for (const id of [withPhoto, withoutPhoto])
            transaction.objectStore("scans").put({
              id,
              disease_name: "Healthy Leaf",
              confidence: 0.95,
              image_blob: id === withPhoto ? image : new Blob(),
              image_url:
                location.origin +
                "/__mock__/storage/v1/object/public/scans/" +
                id +
                ".jpg",
              model_version: "model-v4.3.0",
              updated_at: new Date().toISOString(),
              device_id: crypto.randomUUID(),
              _status: "synced",
            });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      });
    },
    { withPhoto, withoutPhoto, file: photos[0].file },
  );
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  await expect.poll(async () => (await records(page)).length).toBe(2);
  const migrated = await records(page);
  expect(migrated.map((row) => row.id).sort()).toEqual(
    [withPhoto, withoutPhoto].sort(),
  );
  expect(
    migrated.every((row) => row._status === "local-only" && !row.owner_id),
  ).toBe(true);
  for (const row of migrated) {
    expect(row).toMatchObject({
      disease_name: "Healthy Leaf",
      confidence: 0.95,
      model_version: "model-v4.3.0",
    });
  }
  expect(await savedPhotoSize(page, withPhoto)).toBeGreaterThan(0);
  await nav(page, "History");
  await expect(
    page.getByText("Photo not saved on this device", { exact: true }),
  ).toBeVisible();
  const token = await mockGuestToken(page);
  const remote = await page.request.get("/__mock__/rest/v1/scans", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(await remote.json()).toEqual([]);
  expect(legacyReads).toEqual([]);
});

import {
  test,
  expect,
  controlledModel,
  scoresFor,
  openApp,
  runScan,
  closeDetails,
  records,
  savedPhotoSize,
  photos,
  nav,
  historyDetails,
  homeHeading,
  attachJson,
} from "./support/fixtures";

test("L01: reports and photos stay in their own browser without Auth or private cloud requests", async ({
  page,
  browser,
}, info) => {
  const privateRequests: string[] = [];
  const observe = (target: typeof page) =>
    target.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      if (/\/__mock__\/(auth\/v1|storage\/v1|rest\/v1\/scans)/.test(path))
        privateRequests.push(path);
    });
  observe(page);
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  await runScan(page, photos[0].file);
  await closeDetails(page);
  const first = (await records(page))[0];
  expect(first).toMatchObject({ _status: "local-only", image_url: null });
  expect(first.owner_id).toBeUndefined();
  expect(first.cloud_id).toBeUndefined();
  expect(first.storage_path).toBeUndefined();
  expect(first.device_id).toBeUndefined();
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
    observe(second);
    await controlledModel(second, scoresFor("Healthy Fruit"));
    await openApp(second);
    expect(await records(second)).toEqual([]);
    await runScan(second, photos[1].file);
    await closeDetails(second);
    expect((await records(second))[0].id).not.toBe(first.id);
    expect((await records(page)).map((row) => row.id)).toEqual([first.id]);
    await page.reload();
    // Wait for this reload; a second navigation can abort its model download.
    await expect(homeHeading(page)).toBeVisible({ timeout: 90_000 });
    expect((await records(page)).map((row) => row.id)).toEqual([first.id]);
    expect(await savedPhotoSize(page, first.id)).toBeGreaterThan(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).some((key) => key.endsWith("-auth-token")),
      ),
    ).toBe(false);
    expect(privateRequests).toEqual([]);
    await attachJson(info, "local-only-network", {
      privateRequests,
      recordId: first.id,
    });
  } finally {
    await secondContext.close();
  }
});

test("L02: public guidelines download without a guest session and no scan is uploaded", async ({
  page,
}) => {
  const advice = {
    id: "healthy",
    disease_name: "Healthy",
    guidelines_en: "Isolated public advice.",
    guidelines_bis: "Tambag sa lokal nga pagsulay.",
  };
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/__mock__/"))
      requests.push(new URL(request.url()).pathname);
  });
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
  expect(saved[0]._status).toBe("local-only");
  expect(await savedPhotoSize(page, saved[0].id)).toBeGreaterThan(0);
  expect(requests).toContain("/__mock__/rest/v1/guidelines");
  expect(
    requests.some((path) =>
      /\/(auth|storage)\/v1|\/rest\/v1\/scans/.test(path),
    ),
  ).toBe(false);
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
    migrated.every((row) => row._status === "synced" && !row.owner_id),
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
  // Both cards briefly show placeholders while the preserved Blob URL loads.
  await expect(
    page.getByRole("img", { name: "Healthy Leaf", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Photo not saved on this device", { exact: true }),
  ).toBeVisible();
  expect(legacyReads).toEqual([]);
});

test("L06: v8 upgrade preserves reports and hidden deletions without writing photo rows", async ({
  page,
}) => {
  await page.goto("/__test__/ready");
  const seed = await page.evaluate(async (file) => {
    const image = await (await fetch("/__test__/photos/" + file)).blob();
    const visible = crypto.randomUUID();
    const hidden = crypto.randomUUID();
    const owner = crypto.randomUUID();
    const cloud = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open("MangoLeafDB", 80);
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
          "owner_id",
          "cloud_id",
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
        const db = opening.result;
        const transaction = db.transaction("scans", "readwrite");
        for (const [id, status] of [
          [visible, "pending-insert"],
          [hidden, "pending-delete"],
        ])
          transaction.objectStore("scans").add({
            id,
            disease_name: "Healthy Leaf",
            confidence: 0.95,
            image_blob: image,
            image_url: "https://old.invalid/photo.jpg",
            image_hash: "legacy-original-hash",
            model_version: "legacy-model",
            updated_at: "2026-10-14T00:00:00.000Z",
            device_id: "legacy-device",
            owner_id: owner,
            cloud_id: cloud,
            storage_path: owner + "/" + cloud + ".webp",
            _status: status,
          });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onabort = transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      };
    });
    return { visible, hidden, owner, cloud, imageBytes: image.size };
  }, photos[0].file);
  await page.addInitScript(() => {
    for (const operation of ["add", "put"] as const) {
      const native = IDBObjectStore.prototype[operation];
      IDBObjectStore.prototype[operation] = function (
        ...args: Parameters<typeof native>
      ) {
        if (this.name === "scans")
          throw new DOMException(
            "No room to rewrite historical photos",
            "QuotaExceededError",
          );
        return native.apply(this, args);
      };
    }
  });
  await controlledModel(page, scoresFor("Healthy Leaf"));
  await openApp(page);
  const saved = await records(page);
  expect(saved).toHaveLength(2);
  expect(saved.find((row) => row.id === seed.visible)).toMatchObject({
    _status: "pending-insert",
    owner_id: seed.owner,
    cloud_id: seed.cloud,
    storage_path: seed.owner + "/" + seed.cloud + ".webp",
    device_id: "legacy-device",
    image_hash: "legacy-original-hash",
    model_version: "legacy-model",
  });
  expect(saved.find((row) => row.id === seed.hidden)?._status).toBe(
    "pending-delete",
  );
  expect(await savedPhotoSize(page, seed.visible)).toBe(seed.imageBytes);
  expect(await savedPhotoSize(page, seed.hidden)).toBe(seed.imageBytes);
  const schema = await page.evaluate(
    () =>
      new Promise<{ version: number; indexes: string[] }>((resolve, reject) => {
        const opening = indexedDB.open("MangoLeafDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const indexes = Array.from(
            db.transaction("scans").objectStore("scans").indexNames,
          );
          resolve({ version: db.version, indexes });
          db.close();
        };
      }),
  );
  expect(schema).toEqual({
    version: 90,
    indexes: ["image_hash", "updated_at"],
  });
  await nav(page, "History");
  await expect(historyDetails(page)).toHaveCount(1);
});

import { test, expect, openApp, nav, attachJson } from "./support/fixtures";
import { modelVersion } from "../../src/lib/constants";
import { translations } from "../../src/lib/translations";
import packageInfo from "../../package.json";

test("R04: cross-browser navigation and mobile scan controls remain usable", async ({
  page,
}) => {
  await openApp(page);
  await nav(page, "History");
  await expect(
    page.getByRole("heading", {
      name: translations.en.scanHistoryTitle,
      exact: true,
    }),
  ).toBeVisible();
  if (page.viewportSize()!.width >= 768) {
    await expect(
      page.getByRole("button", { name: "Scan", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^Upload Photo/ }),
    ).toHaveCount(0);
    await nav(page, translations.en.downloadApp);
    const guide = page.getByRole("dialog", {
      name: translations.en.installGuideDesktopTitle,
      exact: true,
    });
    await expect(guide).toBeVisible();
    await expect(
      guide.getByRole("heading", {
        name: translations.en.installGuideAndroid,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      guide.getByRole("heading", {
        name: translations.en.installGuideIOS,
        exact: true,
      }),
    ).toBeVisible();
    await guide
      .getByRole("button", { name: translations.en.closeBtn, exact: true })
      .click();
    await expect(guide).toHaveCount(0);
    return;
  }
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toBeVisible();
  // Native camera behavior is checked manually; this only verifies the correct control is reachable.
  await expect(
    page.getByRole("button", { name: /^Take Photo/ }).filter({ visible: true }),
  ).toHaveCount(1);
  await expect(
    page
      .getByRole("button", { name: /^Upload Photo/ })
      .filter({ visible: true }),
  ).toHaveCount(1);
  const photoTips = page.getByRole("heading", {
    name: translations.en.scanSheetTipsTitle,
    exact: true,
  });
  await expect(photoTips).toHaveCount(1);
  await expect(photoTips).toBeVisible();
  const cancelButton = page.getByRole("button", {
    name: translations.en.cancelBtn,
    exact: true,
  });
  await expect(cancelButton).toBeInViewport({ ratio: 1 });
  const originalViewport = page.viewportSize()!;
  await page.setViewportSize({ ...originalViewport, height: 480 });
  // The content may scroll on short screens; Cancel must remain reachable.
  await expect(cancelButton).toBeInViewport({ ratio: 1 });
  await page.setViewportSize(originalViewport);
  await cancelButton.click();
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toHaveCount(0);
});

test("R04: About and footer show the current app and model versions in both languages", async ({
  page,
}) => {
  await openApp(page);
  await nav(page, "About");
  for (const language of ["en", "bis"] as const) {
    const t = translations[language];
    if (language === "bis")
      await page
        .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
        .filter({ visible: true })
        .first()
        .click();
    await expect(page.getByText(modelVersion, { exact: true })).toBeVisible();
    await expect(
      page.getByText(t.aboutModelVersionLabel, { exact: true }),
    ).toBeVisible();
    const versions = t.footerVersions
      .replace("{appVersion}", `v${packageInfo.version}`)
      .replace("{modelVersion}", modelVersion);
    await expect(page.getByText(versions, { exact: true })).toBeVisible();
    for (const type of ["privacy", "terms"] as const) {
      await page
        .getByRole("button", {
          name: type === "privacy" ? t.privacyPolicy : t.termsOfService,
          exact: true,
        })
        .click();
      const legal = page.getByRole("dialog");
      await expect(legal).toBeVisible();
      if (type === "privacy") {
        // Legal copy must still describe local History rather than guest sync.
        await expect(legal).toContainText(t.privacySections[1].text);
        await expect(legal).toContainText(t.privacySections[3].text);
      } else {
        await expect(legal).toContainText(t.termsUpdated);
        await expect(legal).toContainText(t.termsConfidenceText);
        await expect(legal).not.toContainText(
          /Republic Act No\. 8293|DOST-PHREB/,
        );
      }
      await legal
        .getByRole("button", { name: t.legalCloseBtn, exact: true })
        .click();
      await expect(legal).toHaveCount(0);
    }
  }
});

test("R04: scan cards keep photo proportions and compact details after viewport changes", async ({
  page,
  browserName,
}, info) => {
  if (browserName === "webkit") {
    await page.goto("/__test__/ready");
    // Probe native storage separately so an application/database failure cannot skip this case.
    const capability = await page.evaluate(async () => {
      const name = `mangoleaf-layout-blob-probe-${crypto.randomUUID()}`;
      let database: IDBDatabase | undefined;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 1400;
        const drawing = canvas.getContext("2d")!;
        drawing.fillStyle = "#7bbf67";
        drawing.fillRect(0, 0, canvas.width, canvas.height);
        const photo = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(
                    new Error("Native PNG probe could not encode its photo."),
                  ),
            "image/png",
          ),
        );
        database = await new Promise<IDBDatabase>((resolve, reject) => {
          const opening = indexedDB.open(name, 1);
          opening.onupgradeneeded = () =>
            opening.result.createObjectStore("photos");
          opening.onerror = () => reject(opening.error);
          opening.onsuccess = () => resolve(opening.result);
        });
        await new Promise<void>((resolve, reject) => {
          const transaction = database!.transaction("photos", "readwrite");
          transaction.oncomplete = () => resolve();
          transaction.onabort = () => reject(transaction.error);
          transaction.objectStore("photos").put(photo, 1);
        });
        const saved = await new Promise<Blob>((resolve, reject) => {
          const request = database!
            .transaction("photos")
            .objectStore("photos")
            .get(1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        if (!(saved instanceof Blob) || saved.type !== photo.type)
          throw new Error("Native IndexedDB Blob round-trip changed the data.");
        const original = new Uint8Array(await photo.arrayBuffer());
        const restored = new Uint8Array(await saved.arrayBuffer());
        if (
          original.length !== restored.length ||
          !original.every((byte, index) => byte === restored[index])
        )
          throw new Error("Native IndexedDB Blob round-trip changed the data.");
        return { supported: true } as const;
      } catch (error) {
        if (!(error instanceof DOMException)) throw error;
        return {
          supported: false,
          name: error.name,
          message: error.message,
        } as const;
      } finally {
        database?.close();
        await new Promise<void>((resolve) => {
          const deletion = indexedDB.deleteDatabase(name);
          deletion.onsuccess = deletion.onerror = () => resolve();
        });
      }
    });
    await attachJson(info, "native-indexeddb-blob-capability", {
      browserName,
      platform: process.platform,
      ...capability,
    });
    test.skip(
      !capability.supported &&
        capability.name === "UnknownError" &&
        capability.message ===
          "Error preparing Blob/File data to be stored in object store",
      "This WebKit runtime cannot persist the layout fixture's native PNG Blob. Chromium/Firefox retain photo-layout coverage; physical iOS validation remains separate.",
    );
    expect(capability.supported, JSON.stringify(capability)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 1400;
    const drawing = canvas.getContext("2d")!;
    drawing.fillStyle = "#7bbf67";
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    const photo = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), "image/png"),
    );
    // Seed the same local Blob representation used by saved scan photos.
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open("MangoLeafDB");
      opening.onerror = () => reject(opening.error);
      opening.onsuccess = () => {
        const database = opening.result;
        const transaction = database.transaction("scans", "readwrite");
        const scans = transaction.objectStore("scans");
        scans.put({
          id: crypto.randomUUID(),
          disease_name: "Healthy Leaf",
          confidence: 0.95,
          image_blob: photo,
          image_url: null,
          updated_at: new Date().toISOString(),
          device_id: "local-layout-test",
          _status: "local-only",
        });
        scans.put({
          id: crypto.randomUUID(),
          disease_name: "Anthracnose",
          confidence: 0.95,
          image_blob: null,
          image_url: null,
          updated_at: new Date(Date.now() - 60_000).toISOString(),
          device_id: "local-layout-test",
          _status: "local-only",
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error);
        };
      };
    });
  });
  await page.reload();
  const image = page.locator('img[loading="lazy"]').first();
  await image.scrollIntoViewIfNeeded();
  await image.evaluate((element: HTMLImageElement) => element.decode());

  const expectPhotoLayout = async (ratio: number) => {
    await expect
      .poll(() =>
        image.evaluate((element, expectedRatio) => {
          const bounds = element.parentElement!.getBoundingClientRect();
          return Math.abs(bounds.width / bounds.height - expectedRatio);
        }, ratio),
      )
      .toBeLessThan(0.02);
  };
  for (const width of [390, 767, 320, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expectPhotoLayout(4 / 3);
    // An intrinsic portrait image must not leave a tall empty information area.
    const information = image.locator("../..").locator(":scope > div").last();
    await expect
      .poll(async () => (await information.boundingBox())!.height)
      .toBeLessThan(150);
    await expect(
      image.locator("..").getByText("Healthy Leaf", { exact: true }),
    ).toBeVisible();
  }

  await nav(page, translations.en.navHistory);
  await expectPhotoLayout(1);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expectPhotoLayout(4 / 3);
  const missingPhoto = page.getByText(translations.en.noImageOffline, {
    exact: true,
  });
  await expect(missingPhoto).toBeVisible();
  await expect
    .poll(() =>
      missingPhoto.evaluate((element) => {
        const bounds =
          element.parentElement!.parentElement!.getBoundingClientRect();
        return Math.abs(bounds.width / bounds.height - 4 / 3);
      }),
    )
    .toBeLessThan(0.02);
});

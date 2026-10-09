import { test, expect, openApp, nav } from "./support/fixtures";
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
  }
});

test("R04: scan cards keep photo proportions and compact details after viewport changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 1400;
    const drawing = canvas.getContext("2d")!;
    drawing.fillStyle = "#7bbf67";
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    // Seed presentation only. Windows WebKit cannot store Blobs in IndexedDB;
    // the existing image URL fallback exercises the same CSS without inference.
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
          image_blob: null,
          image_url: canvas.toDataURL("image/png"),
          updated_at: new Date().toISOString(),
          device_id: "local-layout-test",
          _status: "synced",
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

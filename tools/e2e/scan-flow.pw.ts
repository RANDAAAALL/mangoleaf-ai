import {
  test,
  expect,
  photos,
  photoPath,
  controlledModel,
  scoresFor,
  openApp,
  nav,
  choosePhoto,
  runScan,
  expectResult,
  closeDetails,
  records,
  details,
  uncertain,
  attachJson,
  holdGuidelineReads,
  releaseGuidelineReads,
  waitForMockScanPull,
  recentHeading,
  homeHeading,
  historyDetails,
} from "./support/fixtures";
import { CLASSES, modelVersion } from "../../src/lib/constants";
import { translations } from "../../src/lib/translations";

test("F01–F05: empty states, scan sheet, picker cancellation and retake", async ({
  page,
}) => {
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  if (page.viewportSize()!.width < 768)
    await expect(
      page.getByText("No Scan History Yet", { exact: true }),
    ).toBeVisible();
  else await expect(recentHeading(page)).toHaveCount(0);
  await nav(page, "History");
  await expect(
    page.getByText("No Scan History Yet", { exact: true }),
  ).toBeVisible();
  const originalViewport = page.viewportSize()!;
  if (originalViewport.width >= 768) {
    await expect(
      page.getByRole("button", { name: "Scan", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^Upload Photo/ }),
    ).toHaveCount(0);
    await nav(page, translations.en.downloadApp);
    await expect(
      page.getByRole("dialog", {
        name: translations.en.installGuideDesktopTitle,
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    // Continue photo-picker checks at a permitted viewport without bypassing UI.
    await page.setViewportSize({ ...originalViewport, width: 767 });
  }
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Take Photo/ }).filter({ visible: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: translations.en.scanSheetTitle }),
  ).toHaveCount(0);
  await nav(page, "Scan");
  const picking = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /^Upload Photo/ }).click();
  await (await picking).setFiles([]);
  await expect(page.getByRole("heading", { name: "Review Photo" })).toHaveCount(
    0,
  );
  expect(await records(page)).toHaveLength(0);
  for (const dismiss of ["close", "escape"] as const) {
    await choosePhoto(page, photos[0].file);
    if (dismiss === "close")
      await page.getByRole("button", { name: "Close", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await records(page)).toHaveLength(0);
  }
  // Guided-camera cases cover live capture and Retake; this checks uploads.
  await choosePhoto(page, photos[0].file);
  const retaking = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Retake", exact: true }).click();
  const chooser = await retaking;
  expect(await chooser.element().getAttribute("id")).toBe("scan-gallery-input");
  await chooser.setFiles(photoPath(photos[1].file));
  expect(await records(page)).toHaveLength(0);
  await page.setViewportSize(originalViewport);
  await page.getByRole("button", { name: "Run AI Diagnosis" }).click();
  await expectResult(page, "Healthy Fruit", 0.95);
});

for (const label of CLASSES) {
  test(`F06/F08/F09/F12: ${label} result, Recent, History, and reload`, async ({
    page,
  }, info) => {
    await controlledModel(page, scoresFor(label));
    await openApp(page);
    const photo = photos.find((item) => item.expectedLabel === label)!;
    await attachJson(info, "controlled-ui", {
      source: "Controlled UI scores; does not measure disease accuracy",
      modelVersion,
      photo,
      scores: scoresFor(label),
    });
    await runScan(page, photo.file);
    await expectResult(page, label, 0.95);
    const saved = await records(page);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      disease_name: label,
      confidence: 0.95,
      image_hash: photo.sha256,
      model_version: modelVersion,
    });
    await info.attach("result.png", {
      body: await details(page).screenshot(),
      contentType: "image/png",
    });
    await closeDetails(page);
    const originalViewport = page.viewportSize()!;
    if (originalViewport.width >= 768) {
      await expect(recentHeading(page)).toHaveCount(0);
      await page.setViewportSize({ ...originalViewport, width: 767 });
    }
    await expect(
      page.getByRole("button", { name: "Details", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("img", { name: label, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /^View All/ })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByRole("heading", { name: translations.en.scanHistoryTitle }),
    ).toBeVisible();
    await page.setViewportSize(originalViewport);
    await historyDetails(page).click();
    await expectResult(page, label, 0.95);
    await page.reload();
    await expect(homeHeading(page)).toBeVisible();
    if (originalViewport.width >= 768)
      await page.setViewportSize({ ...originalViewport, width: 767 });
    await expect(recentHeading(page)).toBeVisible();
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await expectResult(page, label, 0.95);
    await page.setViewportSize(originalViewport);
    expect((await records(page))[0].id).toBe(saved[0].id);
  });
}

test("F07/F13/F14: rejection diagnostics and duplicate review preserve the saved result", async ({
  page,
}, info) => {
  const rejectionLogs: string[] = [];
  const duplicateLogs: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("---Rejected:"))
      rejectionLogs.push(message.text());
    if (message.text().includes("Duplicate photo detected"))
      duplicateLogs.push(message.text());
  });
  await controlledModel(page, [0.35, 0.25, 0.15, 0.1, 0.07, 0.05, 0.03]);
  await openApp(page);
  const photo = photos.find((item) => item.expectedKind === "ood")!;
  await runScan(page, photo.file);
  await expectResult(page, uncertain, 0.35);
  await expect(
    details(page).getByText(/Raw PredictedDisease|margin=|entropy=/),
  ).toHaveCount(0);
  expect(rejectionLogs).toHaveLength(1);
  expect(rejectionLogs[0]).toMatch(
    /Raw PredictedDisease=Anthracnose confidence=0\.3500 margin=0\.1000 entropy=/,
  );
  const original = (await records(page))[0];
  await closeDetails(page);
  const review = page.getByRole("dialog");
  for (const dismiss of ["cancel", "close", "retake"] as const) {
    await choosePhoto(page, photo.file, true);
    await expect(
      review.getByRole("button", { name: "Run AI Diagnosis" }),
    ).toHaveCount(0);
    if (dismiss === "retake") {
      const choosing = page.waitForEvent("filechooser");
      await review.getByRole("button", { name: "Retake", exact: true }).click();
      const chooser = await choosing;
      expect(await chooser.element().getAttribute("id")).toBe(
        "scan-gallery-input",
      );
      await chooser.setFiles([]);
    } else {
      await review
        .getByRole("button", {
          name: dismiss === "cancel" ? "Cancel" : "Close",
          exact: true,
        })
        .click();
    }
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await records(page)).toHaveLength(1);
    expect(rejectionLogs).toHaveLength(1);
  }
  await choosePhoto(page, photo.file, true);
  await review
    .getByRole("button", { name: "View saved result", exact: true })
    .click();
  expect(await records(page)).toHaveLength(1);
  expect((await records(page))[0].id).toBe(original.id);
  expect(rejectionLogs).toHaveLength(1);
  expect(duplicateLogs).toHaveLength(4);
  await expectResult(page, uncertain, 0.35);
  for (const viewport of [
    { width: 320, height: 710 },
    { width: 740, height: 360 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await expectResult(page, uncertain, 0.35);
    await expect(
      page.getByRole("button", { name: "Close details" }).first(),
    ).toBeInViewport();
  }
  await attachJson(info, "rejection-diagnostics", {
    source: "controlled UI scores; console values rounded to four decimals",
    rejectionLogs,
    duplicateLogs,
  });
});

test("F15: accepted results load saved guidance, download advice and reopen it offline", async ({
  page,
  context,
}) => {
  await holdGuidelineReads(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  const initialPull = waitForMockScanPull(page);
  await openApp(page);
  await initialPull;
  const savedScanPull = waitForMockScanPull(page);
  await runScan(page, photos[0].file);
  const modal = page.locator("div.fixed.inset-0").filter({
    has: page.getByRole("button", { name: "English", exact: true }),
  });
  await expect(
    modal.getByText(translations.en.guidelinesLoading, { exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByText(translations.en.guidelinesUnavailable, { exact: true }),
  ).toHaveCount(0);
  await modal.getByRole("button", { name: "Bisaya", exact: true }).click();
  await expect(
    modal.getByText(translations.bis.guidelinesLoading, { exact: true }),
  ).toBeVisible();
  await releaseGuidelineReads(page);
  // The held guidance baseline delays queued sync until these reads resume.
  await savedScanPull;
  await expect(
    modal.getByText(translations.bis.guidelinesUnavailable, { exact: true }),
  ).toBeVisible();
  await modal.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    modal.getByText(translations.en.guidelinesUnavailable, { exact: true }),
  ).toBeVisible();

  // Advice enters through the local HTTP mock and the application's real sync path.
  const advice = {
    id: "healthy",
    disease_name: "Healthy",
    guidelines_en: "Local test advice for healthy mango leaves and fruit.",
    guidelines_bis:
      "Lokal nga giya para sa himsog nga dahon ug bunga sa mangga.",
  };
  await page.route("**/__mock__/rest/v1/guidelines?*", (route) =>
    route.fulfill({ json: [advice] }),
  );
  await expect
    .poll(async () => (await records(page))[0]._status)
    .toBe("synced");
  const advicePull = waitForMockScanPull(page);
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(
    modal.getByText(advice.guidelines_en, { exact: true }),
  ).toBeVisible();
  await advicePull;
  await context.setOffline(true);
  await closeDetails(page);
  await nav(page, "History");
  await historyDetails(page).click();
  await expect(
    modal.getByText(advice.guidelines_en, { exact: true }),
  ).toBeVisible();
  await modal.getByRole("button", { name: "Bisaya", exact: true }).click();
  await expect(
    modal.getByText(advice.guidelines_bis, { exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByText(translations.bis.guidelinesUnavailable, { exact: true }),
  ).toHaveCount(0);
});

test("F13: older and unversioned diagnoses remain in History while the current model infers again", async ({
  page,
}, info) => {
  const rejectionLogs: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("---Rejected:"))
      rejectionLogs.push(message.text());
  });
  await controlledModel(page, [0.35, 0.25, 0.15, 0.1, 0.07, 0.05, 0.03]);
  await openApp(page);
  const historicalIds: string[] = [];
  for (const [index, historicalVersion] of ["v4.1.1", null].entries()) {
    const photo = photos[index];
    const id = await page.evaluate(
      async ({ file, hash, historicalVersion }) => {
        const image = await (await fetch("/__test__/photos/" + file)).blob();
        return new Promise<string>((resolve, reject) => {
          const opening = indexedDB.open("MangoLeafDB");
          opening.onerror = () => reject(opening.error);
          opening.onsuccess = () => {
            const database = opening.result;
            const transaction = database.transaction("scans", "readwrite");
            const id = crypto.randomUUID();
            transaction.objectStore("scans").add({
              id,
              disease_name: "Healthy Leaf",
              confidence: 0.95,
              image_blob: image,
              image_url: null,
              image_hash: hash,
              ...(historicalVersion
                ? { model_version: historicalVersion }
                : {}),
              updated_at: "2026-09-29T00:00:00.000Z",
              device_id: localStorage.getItem("device_id"),
              _status: "synced",
            });
            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => {
              database.close();
              resolve(id);
            };
          };
        });
      },
      { file: photo.file, hash: photo.sha256, historicalVersion },
    );
    historicalIds.push(id);
    await runScan(page, photo.file);
    await expectResult(page, uncertain, 0.35);
    const samePhoto = (await records(page)).filter(
      (row) => row.image_hash === photo.sha256,
    );
    expect(samePhoto).toHaveLength(2);
    expect(samePhoto.find((row) => row.id === id)?.model_version ?? null).toBe(
      historicalVersion,
    );
    expect(
      samePhoto.filter((row) => row.model_version === modelVersion),
    ).toHaveLength(1);
    expect(rejectionLogs).toHaveLength(index + 1);
    await closeDetails(page);
  }
  expect((await records(page)).map((row) => row.id)).toEqual(
    expect.arrayContaining(historicalIds),
  );
  await attachJson(info, "historical-model-regression", {
    source:
      "Controlled UI scores with historical local records; fresh classifier calls observed",
    modelVersion,
    historicalIds,
    rejectionLogs,
  });
});

test("F16: uncertain results keep photo guidance across pending, empty and downloaded advice offline", async ({
  page,
  context,
}) => {
  await holdGuidelineReads(page);
  await controlledModel(page, [0.35, 0.25, 0.15, 0.1, 0.07, 0.05, 0.03]);
  const initialPull = waitForMockScanPull(page);
  await openApp(page);
  await initialPull;
  const savedScanPull = waitForMockScanPull(page);
  await runScan(
    page,
    photos.find((photo) => photo.expectedKind === "ood")!.file,
  );
  const modal = page.locator("div.fixed.inset-0").filter({
    has: page.getByRole("button", { name: "English", exact: true }),
  });
  const checkReminder = async () => {
    for (const language of ["en", "bis"] as const) {
      await modal
        .getByRole("button", {
          name: language === "en" ? "English" : "Bisaya",
          exact: true,
        })
        .click();
      const t = translations[language];
      await expect(
        modal.getByText(t.uncertainPhotoHeading, { exact: true }),
      ).toBeVisible();
      await expect(
        modal.getByText(t.uncertainPhotoReminder, { exact: true }),
      ).toBeVisible();
      await expect(
        modal.getByText(t.guidelinesLoading, { exact: true }),
      ).toHaveCount(0);
      await expect(
        modal.getByText(t.guidelinesUnavailable, { exact: true }),
      ).toHaveCount(0);
      await expect(
        modal.getByText(t.preTreatmentGuidelines, { exact: true }),
      ).toHaveCount(0);
    }
    await modal.getByRole("button", { name: "English", exact: true }).click();
  };
  await checkReminder();
  await releaseGuidelineReads(page);
  // The held guidance baseline delays queued sync until these reads resume.
  await savedScanPull;
  await checkReminder();
  const advice = {
    id: "uncertain_/_unrecognized",
    disease_name: uncertain,
    guidelines_en:
      "Test treatment text that must never replace photo guidance.",
    guidelines_bis:
      "Giya sa pagsulay nga dili mopuli sa pahinumdom sa litrato.",
  };
  await page.route("**/__mock__/rest/v1/guidelines?*", (route) =>
    route.fulfill({ json: [advice] }),
  );
  await expect
    .poll(async () => (await records(page))[0]._status)
    .toBe("synced");
  const advicePull = waitForMockScanPull(page);
  const downloaded = page.waitForResponse((response) =>
    response.url().includes("/__mock__/rest/v1/guidelines"),
  );
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  expect((await downloaded).ok()).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const opening = indexedDB.open("MangoLeafDB");
            opening.onerror = () => reject(opening.error);
            opening.onsuccess = () => {
              const database = opening.result;
              const request = database
                .transaction("guidelines")
                .objectStore("guidelines")
                .count();
              request.onerror = () => reject(request.error);
              request.onsuccess = () => {
                database.close();
                resolve(request.result);
              };
            };
          }),
      ),
    )
    .toBe(1);
  await advicePull;
  await context.setOffline(true);
  await closeDetails(page);
  await nav(page, "History");
  await historyDetails(page).click();
  await checkReminder();
  await expect(
    modal.getByText(advice.guidelines_en, { exact: true }),
  ).toHaveCount(0);
  await expect(
    modal.getByText(advice.guidelines_bis, { exact: true }),
  ).toHaveCount(0);
});

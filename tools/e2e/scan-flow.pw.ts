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
} from "./support/fixtures";
import { CLASSES } from "../../src/lib/constants";

test("F01–F05: empty states, scan sheet, picker cancellation and retake", async ({
  page,
  isMobile,
}) => {
  await controlledModel(page, scoresFor("Healthy"));
  await openApp(page);
  await expect(
    page.getByText("No Scan History Yet", { exact: true }),
  ).toBeVisible();
  await nav(page, "History");
  await expect(
    page.getByText("No Scan History Yet", { exact: true }),
  ).toBeVisible();
  await nav(page, "Scan");
  await expect(
    page.getByRole("heading", { name: "Start a Scan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Take Photo/ }).filter({ visible: true }),
  ).toHaveCount(isMobile ? 1 : 0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Start a Scan" })).toHaveCount(
    0,
  );
  await nav(page, "Scan");
  const picking = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /^Upload Photo/ }).click();
  await (await picking).setFiles([]);
  await expect(page.getByRole("heading", { name: "Review Photo" })).toHaveCount(
    0,
  );
  expect(await records(page)).toHaveLength(0);
  await choosePhoto(page, photos[0].file, isMobile);
  if (isMobile)
    await expect(page.locator("#scan-camera-input")).toHaveAttribute(
      "capture",
      "environment",
    );
  const retaking = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Retake", exact: true }).click();
  const chooser = await retaking;
  expect(await chooser.element().getAttribute("id")).toBe(
    isMobile ? "scan-camera-input" : "scan-gallery-input",
  );
  await chooser.setFiles(photoPath(photos[1].file));
  expect(await records(page)).toHaveLength(0);
  await page.getByRole("button", { name: "Run AI Diagnosis" }).click();
  await expectResult(page, "Healthy", 0.95);
});

for (const label of CLASSES) {
  test(`F06/F08/F09/F12: ${label} result, Recent, History, and reload`, async ({
    page,
  }, info) => {
    await controlledModel(page, scoresFor(label));
    await openApp(page);
    const photo = photos.find((item) => item.expectedLabel === label)!;
    await runScan(page, photo.file);
    await expectResult(page, label, 0.95);
    const saved = await records(page);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      disease_name: label,
      confidence: 0.95,
      image_hash: photo.sha256,
    });
    await info.attach("result.png", {
      body: await details(page).screenshot(),
      contentType: "image/png",
    });
    await closeDetails(page);
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
      page.getByRole("heading", { name: "Scan History" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await expectResult(page, label, 0.95);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Recent Scans" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await expectResult(page, label, 0.95);
    expect((await records(page))[0].id).toBe(saved[0].id);
  });
}

test("F07/F13/F14: rejection diagnostics stay in report; duplicate reopens same record", async ({
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
  await controlledModel(page, [0.35, 0.25, 0.15, 0.1, 0.1, 0.05]);
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
  await runScan(page, photo.file);
  expect(await records(page)).toHaveLength(1);
  expect((await records(page))[0].id).toBe(original.id);
  expect(rejectionLogs).toHaveLength(1);
  expect(duplicateLogs).toHaveLength(1);
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

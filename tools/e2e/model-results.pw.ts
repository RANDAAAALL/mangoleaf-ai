import {
  test,
  expect,
  photos,
  openApp,
  runScan,
  records,
  expectResult,
  closeDetails,
  nav,
  attachJson,
  photoPath,
} from "./support/fixtures";
import { CLASSES, modelVersion } from "../../src/lib/constants";

for (const photo of photos) {
  test(`M01: real-model report and saved UI — ${photo.file}`, async ({
    page,
    context,
    browser,
  }, info) => {
    const diagnostics: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("---Rejected:"))
        diagnostics.push(message.text());
    });
    const harness = await context.newPage();
    await harness.goto("/__test__/harness.html");
    await harness.waitForFunction(
      () => window.mangoTest || window.mangoTestError,
      null,
      { timeout: 90_000 },
    );
    expect(await harness.evaluate(() => window.mangoTestError)).toBeUndefined();
    const metadata = await harness.evaluate(() => window.mangoTest.metadata);
    expect(metadata.modelVersion).toBe(modelVersion);
    expect(metadata.modelAssetVersion).toBe(`model-${modelVersion}`);
    expect(metadata.classes).toEqual(CLASSES);
    const prediction = await harness.evaluate(
      (file) => window.mangoTest.predict("/__test__/photos/" + file),
      photo.file,
    );
    await harness.close();
    expect(prediction.probabilities).toHaveLength(CLASSES.length);
    expect(
      prediction.probabilities.every(
        (p) => Number.isFinite(p) && p >= 0 && p <= 1,
      ),
    ).toBe(true);
    expect(
      Math.abs(prediction.probabilities.reduce((a, b) => a + b, 0) - 1),
    ).toBeLessThan(0.02);
    expect(prediction.accepted).toBe(prediction.failedGates.length === 0);
    await openApp(page);
    const started = Date.now();
    await runScan(page, photo.file);
    await expectResult(page, prediction.diseaseName, prediction.confidence);
    const saved = (await records(page))[0];
    expect(saved.image_hash).toBe(photo.sha256);
    expect(saved.disease_name).toBe(prediction.diseaseName);
    expect(saved.confidence).toBe(prediction.confidence);
    expect(saved.model_version).toBe(modelVersion);
    if (!prediction.accepted) expect(diagnostics).toHaveLength(1);
    const labelMatches =
      photo.expectedKind === "ood"
        ? !prediction.accepted
        : prediction.diseaseName === photo.expectedLabel;
    // Report classification mistakes separately; an accurate UI can display a wrong diagnosis.
    info.annotations.push({
      type: "model-observation",
      description: labelMatches
        ? "Matches supplied label"
        : "Does not match supplied label; inspect model report",
    });
    await attachJson(info, "model-observation", {
      source: "Actual production classifier with original fixture bytes",
      photo,
      labelMatches,
      labelStatus: "provisional; expert verification pending",
      prediction,
      diagnostics,
      metadata,
      browser: browser.version(),
      viewport: page.viewportSize(),
      uploadToResultMs: Date.now() - started,
      inputFingerprint: (
        await (await page.request.get("/__test__/ready")).json()
      ).fingerprint,
    });
    await info.attach("input-photo", {
      path: photoPath(photo.file),
      contentType: photo.file.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg",
    });
    await info.attach("result.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await closeDetails(page);
    await expect(
      page.getByRole("img", { name: prediction.diseaseName, exact: true }),
    ).toBeVisible();
    await nav(page, "History");
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await expectResult(page, prediction.diseaseName, prediction.confidence);
  });
}

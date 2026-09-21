import { test, expect, photos, attachJson } from "./support/fixtures";

test("R01: thirty actual predictions per photo in one browser session", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(15 * 60_000);
  await page.goto("/__test__/harness.html");
  await page.waitForFunction(
    () => window.mangoTest || window.mangoTestError,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.mangoTestError)).toBeUndefined();
  const metadata = await page.evaluate(() => window.mangoTest.metadata);
  const observations = [];
  for (const photo of photos) {
    const predictions = [];
    for (let run = 0; run < 30; run++) {
      predictions.push(
        await page.evaluate(
          (file) => window.mangoTest.predict("/__test__/photos/" + file),
          photo.file,
        ),
      );
    }
    const confidenceRange =
      Math.max(...predictions.map((p) => p.rawConfidence)) -
      Math.min(...predictions.map((p) => p.rawConfidence));
    const labels = [...new Set(predictions.map((p) => p.diseaseName))];
    const rawClasses = [...new Set(predictions.map((p) => p.rawClass))];
    const tensorGrowth = predictions.at(-1)!.tensors - predictions[0].tensors;
    observations.push({
      photo,
      confidenceRange,
      labels,
      rawClasses,
      tensorGrowth,
      predictions,
    });
  }
  // Fixed before measurement; this is a same-session regression tolerance, not clinical accuracy.
  await attachJson(info, "repeatability", {
    repeats: 30,
    maxConfidenceRange: 0.001,
    metadata,
    browser: browser.version(),
    observations,
  });
  for (const result of observations) {
    expect.soft(result.labels, result.photo.file).toHaveLength(1);
    expect.soft(result.rawClasses, result.photo.file).toHaveLength(1);
    expect
      .soft(result.confidenceRange, result.photo.file)
      .toBeLessThanOrEqual(0.001);
    expect.soft(result.tensorGrowth, result.photo.file).toBe(0);
  }
});

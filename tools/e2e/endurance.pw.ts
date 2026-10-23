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
  homeHeading,
  historyDetails,
  requestScanDeletion,
  confirmScanDeletion,
  expectResult,
  savedPhotoSize,
  uncertain,
} from "./support/fixtures";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Page } from "@playwright/test";
import { modelVersion } from "../../src/lib/constants";
import { translations } from "../../src/lib/translations";

interface EnduranceCamera {
  file: string;
  starts: number;
  stops: number;
  liveTracks: number;
}

declare global {
  interface Window {
    mangoEnduranceCamera: EnduranceCamera;
  }
}

async function installSyntheticCamera(page: Page) {
  // Like C07, use real video/canvas/JPEG work. Only hardware acquisition is
  // replaced; source photos and the production classifier remain real.
  await page.addInitScript(() => {
    const control: EnduranceCamera = {
      file: "",
      starts: 0,
      stops: 0,
      liveTracks: 0,
    };
    window.mangoEnduranceCamera = control;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        const image = new Image();
        image.src = "/__test__/photos/" + encodeURIComponent(control.file);
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const context = canvas.getContext("2d")!;
        const paint = () =>
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        paint();
        const stream = canvas.captureStream(10);
        control.starts += 1;
        // Real recurring frames make video readiness and drawImage run through
        // the browser. Timer cleanup is tied to the application's track stop.
        const timer = window.setInterval(paint, 100);
        for (const track of stream.getTracks()) {
          control.liveTracks += 1;
          const stop = track.stop.bind(track);
          let stopped = false;
          track.stop = () => {
            if (stopped) return;
            stopped = true;
            control.stops += 1;
            control.liveTracks -= 1;
            window.clearInterval(timer);
            stop();
          };
        }
        return stream;
      },
    });
  });
}

async function captureAndRetake(page: Page, file: string) {
  const t = translations.en;
  await page.evaluate((name) => {
    window.mangoEnduranceCamera.file = name;
  }, file);
  const before = await page.evaluate(() => ({
    ...window.mangoEnduranceCamera,
  }));
  await page.setViewportSize({ width: 360, height: 740 });
  await nav(page, t.navScan);
  await page
    .getByRole("button", { name: new RegExp(`^${t.takePhotoBtn}`) })
    .click();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const camera = page.getByRole("dialog", {
      name: t.guidedCameraTitle,
      exact: true,
    });
    const capture = camera.getByRole("button", {
      name: t.guidedCameraCaptureBtn,
      exact: true,
    });
    await expect(capture).toBeEnabled();
    await expect(camera.locator("video")).toHaveJSProperty("videoWidth", 1280);
    await expect(camera.locator("video")).toHaveJSProperty("videoHeight", 720);
    await capture.click();
    await expect(camera).not.toBeVisible();
    const review = page.getByRole("dialog", {
      name: t.reviewPhotoTitle,
      exact: true,
    });
    await expect(review).toBeVisible();
    const photo = review.getByRole("img", {
      name: t.photoPreviewAlt,
      exact: true,
    });
    // The 1280x720 stream is center-cropped to the guide's 720x720 square.
    await expect(photo).toHaveJSProperty("naturalWidth", 720);
    await expect(photo).toHaveJSProperty("naturalHeight", 720);
    await expect
      .poll(() => page.evaluate(() => window.mangoEnduranceCamera.liveTracks))
      .toBe(0);
    expect(await records(page)).toHaveLength(0);
    if (attempt === 0) {
      await page.setViewportSize({ width: 740, height: 360 });
      await review
        .getByRole("button", { name: t.retakeBtn, exact: true })
        .click();
    }
  }

  const after = await page.evaluate(() => ({ ...window.mangoEnduranceCamera }));
  expect(after.starts - before.starts).toBe(2);
  expect(after.stops - before.stops).toBe(2);
  const captureHash = await page
    .getByRole("img", { name: t.photoPreviewAlt, exact: true })
    .evaluate(async (image: HTMLImageElement) => {
      const bytes = await (await fetch(image.src)).arrayBuffer();
      return Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
    });
  return { captureHash, starts: 2, stops: 2, retakes: 1 };
}

test("R03: thirty-minute mixed-use session with fresh real predictions", async ({
  page,
  browser,
}, info) => {
  const durationMs = 30 * 60_000;
  test.setTimeout(durationMs + 180_000);
  await installSyntheticCamera(page);
  let predictionCalls = 0;
  const texturePrecisionMessages: string[] = [];
  const privateCloudRequestPaths: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (/\/(auth\/v1|storage\/v1|rest\/v1\/scans)(?:\/|$)/.test(path))
      privateCloudRequestPaths.push(path);
  });
  page.on("console", (message) => {
    if (message.text().startsWith("Class probabilities ("))
      predictionCalls += 1;
    if (message.text().startsWith("---WebGL texture precision: "))
      texturePrecisionMessages.push(message.text());
  });
  // Record the served configuration and exact build identity before the timed
  // session. This observes the current model without replacing its scores.
  const response = await page.request.get("/model/model_config.json");
  expect(response.ok()).toBe(true);
  const configurationBytes = await response.body();
  const configuration = JSON.parse(configurationBytes.toString("utf8"));
  const inputHashes = info.config.metadata.inputHashes as Record<
    string,
    string
  >;
  expect(createHash("sha256").update(configurationBytes).digest("hex")).toBe(
    inputHashes["public/model/model_config.json"],
  );
  expect(configuration.modelVersion).toBe(`model-${modelVersion}`);
  expect(configuration.thresholds).toEqual({
    confidenceThreshold: 0.7,
    marginThreshold: null,
    entropyThreshold: null,
  });
  const identity = {
    appVersion: info.config.metadata.appVersion,
    modelVersion,
    modelAssetVersion: configuration.modelVersion,
    thresholds: configuration.thresholds,
    browser: browser.version(),
    applicationFingerprint: info.config.metadata.applicationFingerprint,
    modelFiles: Object.fromEntries(
      Object.entries(inputHashes).filter(([path]) =>
        path.startsWith("public/model/"),
      ),
    ),
    storage: "IndexedDB local-only reports and photo Blobs",
  };
  await openApp(page);
  const originalViewport = page.viewportSize()!;
  const started = Date.now();
  const cycles: {
    file: string;
    source: "gallery" | "guided-camera";
    sourcePhotoSha256: string;
    selectedPhotoSha256: string;
    result: string;
    accepted: boolean;
    predictionCalls: number;
    cameraStarts: number;
    cameraStops: number;
    retakes: number;
    savedPhotoBytes: number;
    durationMs: number;
    heapBytes: number | null;
  }[] = [];
  let activeCycle: {
    file: string;
    source: "gallery" | "guided-camera";
  } | null = null;
  let completed = false;
  const progress = (status: string) =>
    writeFileSync(
      info.outputPath("endurance-progress.json"),
      JSON.stringify(
        {
          status,
          plannedDurationMs: durationMs,
          elapsedMs: Date.now() - started,
          source: "Actual classifier; gallery photos and synthetic live camera",
          cameraLimit:
            "Synthetic streams do not establish physical-phone behavior or accuracy.",
          identity,
          texturePrecisionMessages,
          privateCloudRequestPaths,
          predictionCalls,
          activeCycle,
          cycles,
        },
        null,
        2,
      ),
    );
  progress("running");
  try {
    while (Date.now() - started < durationMs) {
      // Each fixture exercises both sources before moving to the next photo.
      const photo = photos[Math.floor(cycles.length / 2) % photos.length];
      const source = cycles.length % 2 === 0 ? "gallery" : "guided-camera";
      activeCycle = { file: photo.file, source };
      progress("running");
      const cycleStart = Date.now();
      const callsBefore = predictionCalls;
      let selectedPhotoSha256 = photo.sha256;
      let cameraStarts = 0;
      let cameraStops = 0;
      let retakes = 0;
      if (source === "gallery") {
        await runScan(page, photo.file);
      } else {
        const captured = await captureAndRetake(page, photo.file);
        selectedPhotoSha256 = captured.captureHash;
        cameraStarts = captured.starts;
        cameraStops = captured.stops;
        retakes = captured.retakes;
        // Capture and Retake must never substitute a saved result or start AI.
        expect(predictionCalls).toBe(callsBefore);
        await page
          .getByRole("button", {
            name: translations.en.runDiagnosisBtn,
            exact: true,
          })
          .click();
        await expect(
          page.getByRole("button", { name: "Close details" }).first(),
        ).toBeVisible({ timeout: 90_000 });
      }
      const saved = await records(page);
      expect(saved).toHaveLength(1);
      expect(predictionCalls - callsBefore).toBe(1);
      expect(saved[0].image_hash).toBe(selectedPhotoSha256);
      expect(saved[0].model_version).toBe(modelVersion);
      expect(saved[0]).toMatchObject({
        _status: "local-only",
        image_url: null,
      });
      expect(privateCloudRequestPaths).toEqual([]);
      await expectResult(page, saved[0].disease_name, saved[0].confidence);
      const savedPhotoBytes = await savedPhotoSize(page, saved[0].id);
      expect(savedPhotoBytes).toBeGreaterThan(0);
      await expect
        .poll(() => page.evaluate(() => window.mangoEnduranceCamera.liveTracks))
        .toBe(0);
      await closeDetails(page);
      await page.setViewportSize(originalViewport);
      await nav(page, "History");
      await historyDetails(page).click();
      await expectResult(page, saved[0].disease_name, saved[0].confidence);
      await closeDetails(page);
      // Delete this test record so the next upload must perform inference again.
      await expect
        .poll(async () =>
          (await records(page)).every((row) => row._status === "local-only"),
        )
        .toBe(true);
      await requestScanDeletion(page);
      await confirmScanDeletion(page);
      await expect.poll(async () => (await records(page)).length).toBe(0);
      await nav(page, "Home");
      if (cycles.length % 10 === 9) {
        await page.reload();
        await expect(homeHeading(page)).toBeVisible();
      }
      const heapBytes = await page.evaluate(
        () =>
          (performance as Performance & { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize ?? null,
      );
      cycles.push({
        file: photo.file,
        source,
        sourcePhotoSha256: photo.sha256,
        selectedPhotoSha256,
        result: saved[0].disease_name,
        accepted: saved[0].disease_name !== uncertain,
        predictionCalls: predictionCalls - callsBefore,
        cameraStarts,
        cameraStops,
        retakes,
        savedPhotoBytes,
        durationMs: Date.now() - cycleStart,
        heapBytes,
      });
      // Preserve useful partial evidence if a laptop or runner stops before 30 minutes.
      activeCycle = null;
      progress("running");
      // A short pause models user reading time and avoids a tight stress loop.
      await page.waitForTimeout(1000);
    }
    expect(Date.now() - started).toBeGreaterThanOrEqual(durationMs);
    expect(cycles.length).toBeGreaterThan(1);
    expect(cycles.some((cycle) => cycle.source === "guided-camera")).toBe(true);
    expect(cycles.some((cycle) => cycle.source === "gallery")).toBe(true);
    expect(privateCloudRequestPaths).toEqual([]);
    completed = true;
  } finally {
    // Failed cycles also retain their source and completed-cycle evidence.
    progress(completed ? "completed" : "interrupted");
  }
  await attachJson(info, "endurance", {
    plannedDurationMs: durationMs,
    elapsedMs: Date.now() - started,
    source: "Actual classifier; gallery photos and synthetic live camera",
    identity,
    texturePrecisionMessages,
    privateCloudRequestPaths,
    predictionCalls,
    cycles,
  });
});

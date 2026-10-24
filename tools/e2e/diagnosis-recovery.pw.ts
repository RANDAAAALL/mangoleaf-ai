import type { Page } from "@playwright/test";
import {
  test,
  expect,
  controlledModel,
  scoresFor,
  openApp,
  scannerHarnessPath,
  homeHeading,
  choosePhoto,
  photos,
  records,
  closeDetails,
  expectResult,
  nav,
  attachJson,
} from "./support/fixtures";
import { translations } from "../../src/lib/translations";

type DiagnosisFault =
  "none" | "decode" | "webp" | "null-webp" | "null-jpeg" | "save";

interface DiagnosisControl {
  fault: DiagnosisFault;
  decodesHeld: number;
  encodesHeld: number;
  savesHeld: number;
  encodings: string[];
  releaseDecode: () => void;
  releaseEncoding: () => void;
  releaseSave: () => void;
}

declare global {
  interface Window {
    mangoDiagnosisControl: DiagnosisControl;
    mangoRecoveryCamera: { starts: number; stops: number; liveTracks: number };
    mangoGpuReadControl: { hold: boolean; waits: number };
    mangoStartupReadControl: { hold: boolean; waits: number };
  }
}

test("D11: stalled startup warmup recovers and discards its late model", async ({
  page,
  runtimeErrors,
  browserName,
}, info) => {
  test.skip(
    browserName !== "chromium",
    "Native WebGL startup fence interception is scoped to Chromium.",
  );
  await page.addInitScript(() => {
    const control = {
      hold: sessionStorage.getItem("mango-startup-fault-released") !== "1",
      waits: 0,
    };
    window.mangoStartupReadControl = control;
    const wait = WebGL2RenderingContext.prototype.clientWaitSync;
    WebGL2RenderingContext.prototype.clientWaitSync = function (...args) {
      if (control.hold) {
        control.waits += 1;
        return this.TIMEOUT_EXPIRED;
      }
      return wait.apply(this, args);
    };
  });
  let completedWarmups = 0;
  page.on("console", (message) => {
    if (message.text() === "---GPU model warmup complete.---")
      completedWarmups += 1;
  });
  // Install before navigation so the real initialization deadline is governed
  // by the virtual clock, including timers scheduled during application startup.
  await page.clock.install();
  await page.goto(scannerHarnessPath);
  await expect
    .poll(() => page.evaluate(() => window.mangoStartupReadControl.waits))
    .toBeGreaterThan(0);
  expect(completedWarmups).toBe(0);
  await page.clock.fastForward(60_001);
  await expect(homeHeading(page)).toBeVisible();
  const banner = page.getByRole("alert").filter({
    hasText: translations.en.modelLoadFailedText,
  });
  await expect(banner).toBeVisible();
  await expect(
    banner.getByRole("button", {
      name: translations.en.reloadAppBtn,
      exact: true,
    }),
  ).toBeEnabled();
  const heldFenceWaits = await page.evaluate(
    () => window.mangoStartupReadControl.waits,
  );
  await page.evaluate(() => {
    window.mangoStartupReadControl.hold = false;
    sessionStorage.setItem("mango-startup-fault-released", "1");
  });
  await page.clock.runFor(1000);
  await expect(banner).toBeVisible();
  expect(completedWarmups).toBe(0);
  await choosePhoto(page, photos[0].file);
  await expect(
    page.getByRole("button", {
      name: translations.en.runDiagnosisBtn,
      exact: true,
    }),
  ).toBeDisabled();
  expect(await records(page)).toHaveLength(0);
  await page
    .getByRole("dialog", {
      name: translations.en.reviewPhotoTitle,
      exact: true,
    })
    .getByRole("button", { name: translations.en.closeBtn, exact: true })
    .click();
  await banner
    .getByRole("button", {
      name: translations.en.reloadAppBtn,
      exact: true,
    })
    .click();
  await expect(homeHeading(page)).toBeVisible({ timeout: 90_000 });
  await expect(banner).toHaveCount(0);
  expect(completedWarmups).toBe(1);
  await choosePhoto(page, photos[0].file);
  await runDiagnosis(page);
  await expect(
    page.getByRole("button", { name: "Close details" }).first(),
  ).toBeVisible({ timeout: 90_000 });
  const saved = await records(page);
  expect(saved).toHaveLength(1);
  expect(saved[0].image_hash).toBe(photos[0].sha256);
  const expected = runtimeErrors.filter((error) =>
    error.startsWith("Error loading TensorFlow.js model:"),
  );
  expect(
    expected,
    "The injected startup stall must reach loader recovery",
  ).toHaveLength(1);
  runtimeErrors.splice(
    0,
    runtimeErrors.length,
    ...runtimeErrors.filter((error) => !expected.includes(error)),
  );
  await attachJson(info, "startup-warmup-recovery", {
    source:
      "Current real model with deliberately withheld native warmup fence; no hardware or accuracy claim",
    advancedClockMs: 60_001,
    heldFenceWaits,
    completedWarmupsAfterLateRead: 0,
    completedWarmupsAfterReload: completedWarmups,
    savedRowsAfterReload: saved.length,
  });
});

test("D08: stalled GPU read releases the UI and guards retry until the read settles", async ({
  page,
  runtimeErrors,
  browserName,
}, info) => {
  test.skip(
    browserName !== "chromium",
    "Native WebGL fence interception is scoped to Chromium.",
  );
  // The constant-score fixture can read directly from CPU storage. Use the
  // current real model to reach its native WebGL fence, after initial warmup.
  await openApp(page);
  await choosePhoto(page, photos[0].file);
  await page.evaluate(() => {
    const control = { hold: true, waits: 0 };
    window.mangoGpuReadControl = control;
    const wait = WebGL2RenderingContext.prototype.clientWaitSync;
    WebGL2RenderingContext.prototype.clientWaitSync = function (...args) {
      if (control.hold) {
        control.waits += 1;
        return this.TIMEOUT_EXPIRED;
      }
      return wait.apply(this, args);
    };
  });
  await page.clock.install();
  await runDiagnosis(page);
  await expect
    .poll(() => page.evaluate(() => window.mangoGpuReadControl.waits))
    .toBeGreaterThan(0);
  await expect(page.getByText(/\(45%\)$/)).toBeVisible();
  await page.clock.fastForward(60_001);
  const review = page.getByRole("dialog", {
    name: translations.en.reviewPhotoTitle,
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(
    review.getByText(translations.en.scanInferencePendingText, { exact: true }),
  ).toBeVisible();
  await expect(
    review.getByRole("button", {
      name: translations.en.reloadAppBtn,
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    review.getByRole("button", {
      name: translations.en.retryDiagnosisBtn,
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await records(page)).toHaveLength(0);
  await page.evaluate(() => {
    window.mangoGpuReadControl.hold = false;
  });
  await page.clock.runFor(1000);
  await expect(review.getByRole("alert")).toBeVisible();
  expect(await records(page)).toHaveLength(0);
  // Recovery conservatively keeps Reload until a new selection. The old GPU
  // output must settle and be discarded before any fresh inference can run.
  await review
    .getByRole("button", { name: translations.en.closeBtn, exact: true })
    .click();
  await choosePhoto(page, photos[0].file);
  await runDiagnosis(page);
  await expect(
    page.getByRole("button", { name: "Close details" }).first(),
  ).toBeVisible({ timeout: 90_000 });
  const saved = await records(page);
  expect(saved).toHaveLength(1);
  expect(saved[0].image_hash).toBe(photos[0].sha256);
  expectedDiagnosisError(runtimeErrors);
  await attachJson(info, "gpu-read-recovery", {
    source:
      "Current real model; native WebGL fence completion deliberately withheld. No model-accuracy claim",
    advancedClockMs: 60_001,
    fenceWaits: await page.evaluate(() => window.mangoGpuReadControl.waits),
    savedRowsAfterRetry: 1,
  });
});

test.use({ viewport: { width: 360, height: 740 } });

// Replace only completion delivery. Native decoding, encoding and IndexedDB
// still run when released, so stale callbacks exercise the production guards.
async function installFaults(page: Page) {
  await page.addInitScript(() => {
    const pendingDecode: (() => void)[] = [];
    const pendingEncoding: (() => void)[] = [];
    const pendingSave: (() => void)[] = [];
    const control: DiagnosisControl = {
      fault: "none",
      decodesHeld: 0,
      encodesHeld: 0,
      savesHeld: 0,
      encodings: [],
      releaseDecode: () =>
        pendingDecode.splice(0).forEach((deliver) => deliver()),
      releaseEncoding: () =>
        pendingEncoding.splice(0).forEach((deliver) => deliver()),
      releaseSave: () => pendingSave.splice(0).forEach((deliver) => deliver()),
    };
    window.mangoDiagnosisControl = control;

    const NativeImage = window.Image;
    window.Image = function (...args: ConstructorParameters<typeof Image>) {
      const image = new NativeImage(...args);
      if (control.fault === "decode") {
        image.addEventListener(
          "load",
          (event) => {
            // Decode natively before delaying the handler. Reassigning a
            // revoked source after timeout would create an artificial network error.
            event.stopImmediatePropagation();
            const loaded = image.onload;
            control.decodesHeld += 1;
            pendingDecode.push(() => loaded?.call(image, event));
          },
          { once: true },
        );
      }
      return image;
    } as unknown as typeof Image;

    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (...args) {
      const type = args[1] ?? "image/png";
      control.encodings.push(type);
      if (type === "image/webp" && control.fault === "webp") {
        control.encodesHeld += 1;
        pendingEncoding.push(() => toBlob.apply(this, args));
        return;
      }
      if (
        (type === "image/webp" &&
          ["null-webp", "null-jpeg"].includes(control.fault)) ||
        (type === "image/jpeg" && control.fault === "null-jpeg")
      ) {
        queueMicrotask(() => args[0](null));
        return;
      }
      toBlob.apply(this, args);
    };

    const transact = IDBDatabase.prototype.transaction;
    const complete = Object.getOwnPropertyDescriptor(
      IDBTransaction.prototype,
      "oncomplete",
    )!;
    IDBDatabase.prototype.transaction = function (...args) {
      const names =
        typeof args[0] === "string" ? [args[0]] : Array.from(args[0]);
      const transaction = transact.call(this, names, args[1], args[2]);
      if (
        names.includes("scans") &&
        args[1] === "readwrite" &&
        control.fault === "save"
      ) {
        Object.defineProperty(transaction, "oncomplete", {
          configurable: true,
          set(callback: IDBTransaction["oncomplete"]) {
            complete.set!.call(transaction, (event: Event) => {
              control.savesHeld += 1;
              pendingSave.push(() => callback?.call(transaction, event));
            });
          },
        });
      }
      return transaction;
    };
  });
}

async function armFault(page: Page, fault: DiagnosisFault) {
  await page.evaluate((value) => {
    window.mangoDiagnosisControl.fault = value;
  }, fault);
}

async function runDiagnosis(page: Page) {
  await page
    .getByRole("button", { name: translations.en.runDiagnosisBtn, exact: true })
    .click();
}

function expectedDiagnosisError(runtimeErrors: string[]) {
  const expected = runtimeErrors.filter((error) =>
    error.startsWith("[Diagnosis]"),
  );
  expect(
    expected,
    "Injected fault must reach the diagnosis error boundary",
  ).toHaveLength(1);
  const remaining = runtimeErrors.filter((error) => !expected.includes(error));
  runtimeErrors.splice(0, runtimeErrors.length, ...remaining);
}

async function expectRecoverablePhoto(page: Page) {
  const t = translations.en;
  const review = page.getByRole("dialog", {
    name: t.reviewPhotoTitle,
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review.getByRole("alert")).toBeVisible();
  await expect(
    review.getByRole("button", { name: t.closeBtn, exact: true }),
  ).toBeEnabled();
  await expect(
    review.getByRole("button", { name: t.retakeBtn, exact: true }),
  ).toBeEnabled();
  await expect(
    review.getByRole("button", { name: t.retryDiagnosisBtn, exact: true }),
  ).toBeEnabled();
  return review;
}

for (const { fault, held, progress, budget } of [
  { fault: "decode", held: "decodesHeld", progress: 15, budget: 20_001 },
  { fault: "webp", held: "encodesHeld", progress: 75, budget: 20_001 },
] as const) {
  test(`D0${fault === "decode" ? 1 : 2}: ${fault} timeout recovers and ignores late completion`, async ({
    page,
    runtimeErrors,
  }, info) => {
    await installFaults(page);
    await controlledModel(page, scoresFor("Healthy Fruit"));
    await openApp(page);
    await choosePhoto(page, photos[0].file);
    await page.clock.install();
    await armFault(page, fault);
    await runDiagnosis(page);
    await expect
      .poll(() =>
        page.evaluate((key) => window.mangoDiagnosisControl[key], held),
      )
      .toBe(1);
    await expect(
      page.getByText(new RegExp(`\\(${progress}%\\)$`)),
    ).toBeVisible();
    await page.clock.fastForward(budget);
    const review = await expectRecoverablePhoto(page);
    await expect(
      review.getByText(translations.en.scanTimeoutText, { exact: true }),
    ).toBeVisible();
    expect(await records(page)).toHaveLength(0);
    await armFault(page, "none");
    await page.evaluate((mode) => {
      if (mode === "decode") window.mangoDiagnosisControl.releaseDecode();
      else window.mangoDiagnosisControl.releaseEncoding();
    }, fault);
    await expect(review.getByRole("alert")).toBeVisible();
    expect(await records(page)).toHaveLength(0);
    await review
      .getByRole("button", {
        name: translations.en.retryDiagnosisBtn,
        exact: true,
      })
      .click();
    await expectResult(page, "Healthy Fruit", Math.fround(0.95));
    expect(await records(page)).toHaveLength(1);
    expectedDiagnosisError(runtimeErrors);
    await attachJson(info, "fault-recovery", {
      source:
        "Controlled UI scores and delayed browser completion; not phone performance or model accuracy",
      fault,
      progress,
      advancedClockMs: budget,
      savedRowsAfterRetry: 1,
    });
  });
}

test("D03: null WebP export falls back to JPEG with a saved photo", async ({
  page,
}) => {
  await installFaults(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await choosePhoto(page, photos[0].file);
  await armFault(page, "null-webp");
  await runDiagnosis(page);
  await expectResult(page, "Healthy Fruit", Math.fround(0.95));
  const formats = await page.evaluate(
    () => window.mangoDiagnosisControl.encodings,
  );
  expect(formats).toEqual(expect.arrayContaining(["image/webp", "image/jpeg"]));
  expect(await records(page)).toHaveLength(1);
  const type = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const opening = indexedDB.open("MangoLeafDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const query = database
            .transaction("scans")
            .objectStore("scans")
            .getAll();
          query.onerror = () => reject(query.error);
          query.onsuccess = () => {
            database.close();
            resolve(query.result[0].image_blob.type);
          };
        };
      }),
  );
  expect(type).toBe("image/jpeg");
});

test("D04: failed JPEG export shows recovery and retries the retained photo", async ({
  page,
  runtimeErrors,
}) => {
  await installFaults(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await choosePhoto(page, photos[0].file);
  await armFault(page, "null-jpeg");
  await runDiagnosis(page);
  const review = await expectRecoverablePhoto(page);
  await expect(
    review.getByText(translations.en.scanFailedText, { exact: true }),
  ).toBeVisible();
  expect(await records(page)).toHaveLength(0);
  await armFault(page, "none");
  await review
    .getByRole("button", {
      name: translations.en.retryDiagnosisBtn,
      exact: true,
    })
    .click();
  await expectResult(page, "Healthy Fruit", Math.fround(0.95));
  expect(await records(page)).toHaveLength(1);
  expectedDiagnosisError(runtimeErrors);
});

test("D05: local-save timeout ignores late result and prevents a second saved row", async ({
  page,
  runtimeErrors,
  context,
}, info) => {
  await installFaults(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await choosePhoto(page, photos[0].file);
  // Keep cloud sync outside this native local-transaction fault.
  await context.setOffline(true);
  await page.clock.install();
  await armFault(page, "save");
  await runDiagnosis(page);
  await expect
    .poll(() => page.evaluate(() => window.mangoDiagnosisControl.savesHeld))
    .toBe(1);
  await expect(page.getByText(/\(90%\)$/)).toBeVisible();
  await page.clock.fastForward(15_001);
  const review = await expectRecoverablePhoto(page);
  await expect(
    review.getByText(translations.en.scanTimeoutText, { exact: true }),
  ).toBeVisible();
  await armFault(page, "none");
  await page.evaluate(() => window.mangoDiagnosisControl.releaseSave());
  await expect(review.getByRole("alert")).toBeVisible();
  const afterTimeout = await records(page);
  expect(afterTimeout.length).toBeLessThanOrEqual(1);
  // The save fault is local. This fixture blocks the service worker, so allow
  // the result's first dynamic import after testing the offline transaction.
  await context.setOffline(false);
  await review
    .getByRole("button", {
      name: translations.en.retryDiagnosisBtn,
      exact: true,
    })
    .click();
  if (afterTimeout.length === 1) {
    // A native transaction can commit before delayed Promise delivery times out.
    await expect(
      page.getByRole("heading", {
        name: translations.en.duplicatePhotoTitle,
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: translations.en.viewSavedResultBtn,
        exact: true,
      })
      .click();
  }
  await expectResult(page, "Healthy Fruit", Math.fround(0.95));
  expect(await records(page)).toHaveLength(1);
  expectedDiagnosisError(runtimeErrors);
  await attachJson(info, "local-save-recovery", {
    source:
      "Delayed real IndexedDB transaction completion delivery; a commit can precede the timeout",
    rowsAfterTimeout: afterTimeout.length,
    rowsAfterRetry: 1,
  });
});

for (const { fault, held, dismiss } of [
  { fault: "decode", held: "decodesHeld", dismiss: "cancel" },
  { fault: "webp", held: "encodesHeld", dismiss: "escape" },
] as const) {
  test(`D${dismiss === "cancel" ? "09" : "10"}: ${dismiss} cancels ${fault} without saving late work`, async ({
    page,
  }) => {
    await installFaults(page);
    await controlledModel(page, scoresFor("Healthy Fruit"));
    await openApp(page);
    await choosePhoto(page, photos[0].file);
    await armFault(page, fault);
    await runDiagnosis(page);
    await expect
      .poll(() =>
        page.evaluate((key) => window.mangoDiagnosisControl[key], held),
      )
      .toBe(1);
    if (dismiss === "cancel")
      await page
        // The closing scan sheet can still contain its own Cancel action.
        .getByRole("dialog", { name: translations.en.runningAI, exact: true })
        .getByRole("button", { name: translations.en.cancelBtn, exact: true })
        .click();
    else await page.keyboard.press("Escape");
    const review = await expectRecoverablePhoto(page);
    await expect(
      review.getByText(translations.en.scanCancelledText, { exact: true }),
    ).toBeVisible();
    await armFault(page, "none");
    await page.evaluate((mode) => {
      if (mode === "decode") window.mangoDiagnosisControl.releaseDecode();
      else window.mangoDiagnosisControl.releaseEncoding();
    }, fault);
    await expect(review.getByRole("alert")).toBeVisible();
    expect(await records(page)).toHaveLength(0);
    await review
      .getByRole("button", {
        name: translations.en.retryDiagnosisBtn,
        exact: true,
      })
      .click();
    await expectResult(page, "Healthy Fruit", Math.fround(0.95));
    expect(await records(page)).toHaveLength(1);
  });
}

async function installSyntheticCamera(page: Page) {
  await page.addInitScript(() => {
    const control = { starts: 0, stops: 0, liveTracks: 0 };
    window.mangoRecoveryCamera = control;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () => {
        control.starts += 1;
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const context = canvas.getContext("2d")!;
        context.fillStyle = control.starts % 2 ? "#356f31" : "#719f40";
        const paint = () => context.fillRect(0, 0, 1280, 720);
        paint();
        const stream = canvas.captureStream(10);
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
            clearInterval(timer);
            stop();
          };
        }
        return Promise.resolve(stream);
      },
    });
  });
}

for (const offline of [false, true]) {
  test(`D0${offline ? 7 : 6}: two distinct guided captures finish ${offline ? "with the second offline" : "online"}`, async ({
    page,
    context,
    browserName,
  }, info) => {
    test.skip(
      browserName !== "chromium",
      "Synthetic real camera stream is scoped to Chromium.",
    );
    await installSyntheticCamera(page);
    await controlledModel(page, scoresFor("Healthy Fruit"));
    let predictions = 0;
    page.on("console", (message) => {
      if (message.text().startsWith("Class probabilities (")) predictions += 1;
    });
    await openApp(page);
    for (let capture = 1; capture <= 2; capture += 1) {
      // The unsupported-SW fixture loads its dynamic result module online.
      // The second capture then measures the reported repeated offline path.
      if (offline && capture === 2) await context.setOffline(true);
      await nav(page, translations.en.navScan);
      await page
        .getByRole("button", {
          name: new RegExp(`^${translations.en.takePhotoBtn}`),
        })
        .click();
      const camera = page.getByRole("dialog", {
        name: translations.en.guidedCameraTitle,
        exact: true,
      });
      await expect(camera.locator("video")).toHaveJSProperty(
        "videoWidth",
        1280,
      );
      await camera
        .getByRole("button", {
          name: translations.en.guidedCameraCaptureBtn,
          exact: true,
        })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.mangoRecoveryCamera.liveTracks))
        .toBe(0);
      await runDiagnosis(page);
      await expectResult(page, "Healthy Fruit", Math.fround(0.95));
      expect(await records(page)).toHaveLength(capture);
      expect(predictions).toBe(capture);
      if (offline && capture === 1)
        await expect
          .poll(async () => (await records(page))[0]._status)
          .toBe("local-only");
      await closeDetails(page);
    }
    const saved = await records(page);
    expect(saved[0].image_hash).not.toBe(saved[1].image_hash);
    const camera = await page.evaluate(() => window.mangoRecoveryCamera);
    expect(camera).toEqual({ starts: 2, stops: 2, liveTracks: 0 });
    await attachJson(info, "two-guided-captures", {
      source:
        "Real synthetic video/canvas/JPEG with controlled UI scores; excludes physical hardware and model accuracy",
      secondCaptureOffline: offline,
      predictions,
      camera,
      hashes: saved.map((row) => row.image_hash),
    });
  });
}

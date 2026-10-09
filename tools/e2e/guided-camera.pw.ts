import type { Page } from "@playwright/test";
import {
  test,
  expect,
  openApp,
  nav,
  controlledModel,
  scoresFor,
  records,
  photoPath,
  photos,
  expectResult,
} from "./support/fixtures";
import { translations, type Language } from "../../src/lib/translations";

interface CameraControl {
  constraints: MediaStreamConstraints[];
  stops: number;
  draws: number[][];
  encodesCompleted: number;
  releasePermission: () => void;
  allowFrame: () => void;
  releaseEncoding: () => void;
  endTrack: () => void;
  hide: () => void;
  show: () => void;
}

declare global {
  interface Window {
    mangoCameraControl: CameraControl;
    mangoRealCameraControl: {
      constraints: MediaStreamConstraints[];
      stops: number;
    };
  }
}

test.use({ viewport: { width: 360, height: 740 } });

// Controlled media and scores prove UI/lifecycle behavior, not phone performance
// or model accuracy. Real canvas encoding and photo decoding remain in use.
async function mockCamera(
  page: Page,
  options: {
    permission?: "allow" | "defer" | "deny";
    frame?: "ready" | "defer";
    encoding?: "normal" | "defer";
    language?: Language;
  } = {},
) {
  await page.addInitScript((settings) => {
    localStorage.setItem("preferred_language", settings.language ?? "en");
    let frameReady = settings.frame !== "defer";
    let hidden = false;
    const videos = new Set<HTMLVideoElement>();
    const attached = new WeakMap<HTMLMediaElement, MediaStream | null>();
    const pendingPermission: (() => void)[] = [];
    const pendingEncoding: (() => void)[] = [];
    const tracks: MediaStreamTrack[] = [];

    const deliverFrames = () => {
      if (!frameReady) return;
      for (const video of videos) {
        for (const event of [
          "loadedmetadata",
          "loadeddata",
          "canplay",
          "playing",
        ])
          video.dispatchEvent(new Event(event));
      }
    };
    const control: CameraControl = {
      constraints: [],
      stops: 0,
      draws: [],
      encodesCompleted: 0,
      releasePermission() {
        pendingPermission.splice(0).forEach((resolve) => resolve());
      },
      allowFrame() {
        frameReady = true;
        deliverFrames();
      },
      releaseEncoding() {
        pendingEncoding.splice(0).forEach((encode) => encode());
      },
      endTrack() {
        tracks
          .find((track) => track.readyState === "live")
          ?.dispatchEvent(new Event("ended"));
      },
      hide() {
        hidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
      },
      show() {
        hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
      },
    };
    window.mangoCameraControl = control;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => (hidden ? "hidden" : "visible"),
    });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });

    const getUserMedia = (constraints: MediaStreamConstraints) => {
      control.constraints.push(constraints);
      if (settings.permission === "deny")
        return Promise.reject(
          new DOMException("Test camera denied", "NotAllowedError"),
        );
      const eventTracks = Array.from({ length: 2 }, () => {
        const track = new EventTarget() as MediaStreamTrack;
        let stopped = false;
        Object.defineProperties(track, {
          kind: { value: "video" },
          readyState: { get: () => (stopped ? "ended" : "live") },
          stop: {
            value() {
              if (!stopped) control.stops += 1;
              stopped = true;
            },
          },
          getSettings: {
            value: () => ({
              width: 1280,
              height: 720,
              facingMode: "environment",
            }),
          },
        });
        tracks.push(track);
        return track;
      });
      const stream = {
        getTracks: () => eventTracks,
        getVideoTracks: () => eventTracks,
        getAudioTracks: () => [],
        get active() {
          return eventTracks.some((track) => track.readyState === "live");
        },
      } as unknown as MediaStream;
      if (settings.permission === "defer")
        return new Promise<MediaStream>((resolve) =>
          pendingPermission.push(() => resolve(stream)),
        );
      return Promise.resolve(stream);
    };
    // Windows WebKit lacks this API. Supply the controlled capability here;
    // C08 separately verifies the application's real unsupported path.
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {},
      });
    }
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: getUserMedia,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
      configurable: true,
      get() {
        return attached.get(this) ?? null;
      },
      set(value: MediaStream | null) {
        attached.set(this, value);
      },
    });
    Object.defineProperties(HTMLVideoElement.prototype, {
      videoWidth: { configurable: true, get: () => (frameReady ? 1280 : 0) },
      videoHeight: { configurable: true, get: () => (frameReady ? 720 : 0) },
      readyState: { configurable: true, get: () => (frameReady ? 4 : 0) },
      paused: { configurable: true, get: () => false },
      play: {
        configurable: true,
        value() {
          videos.add(this);
          queueMicrotask(deliverFrames);
          return Promise.resolve();
        },
      },
      pause: { configurable: true, value() {} },
    });
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (
      image: CanvasImageSource,
      ...coordinates: number[]
    ) {
      if (image instanceof HTMLVideoElement && attached.has(image)) {
        control.draws.push(coordinates);
        this.fillStyle = "#277839";
        this.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }
      Reflect.apply(drawImage, this, [image, ...coordinates]);
    };
    if (settings.encoding === "defer") {
      const toBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (...args) {
        pendingEncoding.push(() =>
          toBlob.call(
            this,
            (encoded) => {
              control.encodesCompleted += 1;
              args[0](encoded);
            },
            args[1],
            args[2],
          ),
        );
      };
    }
  }, options);
}

async function openCamera(page: Page, language: Language = "en") {
  const t = translations[language];
  await nav(page, t.navScan);
  await page
    .getByRole("button", { name: new RegExp(`^${t.takePhotoBtn}`) })
    .click();
  const camera = page.getByRole("dialog", {
    name: t.guidedCameraTitle,
    exact: true,
  });
  await expect(camera).toBeVisible();
  return camera;
}

async function cameraStops(page: Page) {
  return page.evaluate(() => window.mangoCameraControl.stops);
}

test("C01: guided capture keeps full frame, waits for Run, and Retake opens a new stream", async ({
  page,
}) => {
  await mockCamera(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  let predictions = 0;
  page.on("console", (message) => {
    if (message.text().startsWith("Class probabilities (")) predictions += 1;
  });
  await openApp(page);
  let camera = await openCamera(page);
  await expect(camera).toHaveCSS("background-color", "rgb(237, 246, 233)");
  await expect(camera.getByRole("button")).toHaveCount(2);
  const capture = () =>
    camera.getByRole("button", {
      name: translations.en.guidedCameraCaptureBtn,
      exact: true,
    });
  await expect(capture()).toBeEnabled();
  const guide = camera.locator('div[aria-hidden="true"]');
  await expect(guide).toBeVisible();
  for (const viewport of [
    { width: 360, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const measurement = await guide.evaluate((element) => {
          const rectangle = element.getBoundingClientRect();
          const preview = element.parentElement!.getBoundingClientRect();
          const imageHeight = Math.min(
            preview.height,
            (preview.width * 720) / 1280,
          );
          return {
            width: rectangle.width,
            height: rectangle.height,
            expected: imageHeight * 0.75,
            color: getComputedStyle(element).borderTopColor,
            centered:
              Math.abs(
                rectangle.x +
                  rectangle.width / 2 -
                  preview.x -
                  preview.width / 2,
              ) < 1,
          };
        });
        return (
          Math.abs(measurement.width - measurement.expected) < 1 &&
          Math.abs(measurement.width - measurement.height) < 1 &&
          measurement.centered &&
          measurement.color === "rgb(166, 242, 177)"
        );
      })
      .toBe(true);
    await test
      .info()
      .attach(`controlled-camera-${viewport.width}x${viewport.height}.png`, {
        body: await camera.screenshot(),
        contentType: "image/png",
      });
  }
  await page.setViewportSize({ width: 360, height: 740 });
  const constraints = await page.evaluate(
    () => window.mangoCameraControl.constraints[0],
  );
  expect(constraints).toMatchObject({
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });
  await capture().click();
  const review = page.getByRole("dialog", {
    name: translations.en.reviewPhotoTitle,
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect.poll(() => cameraStops(page)).toBe(2);
  const preview = review.getByRole("img", {
    name: translations.en.photoPreviewAlt,
    exact: true,
  });
  await expect(preview).toHaveJSProperty("naturalWidth", 1280);
  await expect(preview).toHaveJSProperty("naturalHeight", 720);
  expect(await page.evaluate(() => window.mangoCameraControl.draws)).toEqual([
    [0, 0, 1280, 720],
  ]);
  expect(predictions).toBe(0);
  expect(await records(page)).toHaveLength(0);
  await review
    .getByRole("button", { name: translations.en.retakeBtn, exact: true })
    .click();
  camera = page.getByRole("dialog", {
    name: translations.en.guidedCameraTitle,
    exact: true,
  });
  await expect(capture()).toBeEnabled();
  expect(
    await page.evaluate(() => window.mangoCameraControl.constraints.length),
  ).toBe(2);
  await page.keyboard.press("Escape");
  await expect(camera).not.toBeVisible();
  await expect.poll(() => cameraStops(page)).toBe(4);
  expect(predictions).toBe(0);
});

test("C02: captured photo reaches one controlled diagnosis through existing review", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Windows WebKit does not complete this TFJS inference path.",
  );
  await mockCamera(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  let predictions = 0;
  page.on("console", (message) => {
    if (message.text().startsWith("Class probabilities (")) predictions += 1;
  });
  await openApp(page);
  const camera = await openCamera(page);
  await camera
    .getByRole("button", {
      name: translations.en.guidedCameraCaptureBtn,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: translations.en.runDiagnosisBtn, exact: true })
    .click();
  await expectResult(page, "Healthy Fruit", 0.95);
  expect(await records(page)).toHaveLength(1);
  expect(await cameraStops(page)).toBe(2);
  expect(predictions).toBe(1);
});

test("C03: closing pending permission stops late stream and restores launcher focus", async ({
  page,
}) => {
  await mockCamera(page, { permission: "defer" });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  const camera = await openCamera(page);
  await expect(
    camera.getByRole("button", {
      name: translations.en.guidedCameraCaptureBtn,
      exact: true,
    }),
  ).toBeDisabled();
  const close = camera.getByRole("button", {
    name: translations.en.closeBtn,
    exact: true,
  });
  // Only Close is enabled while permission is pending; focus stays on it.
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await camera
    .getByRole("button", { name: translations.en.closeBtn, exact: true })
    .click();
  await expect(camera).not.toBeVisible();
  await page.evaluate(() => window.mangoCameraControl.releasePermission());
  await expect.poll(() => cameraStops(page)).toBe(2);
  await expect(
    page
      .getByRole("button", { name: "Scan", exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeFocused();
  expect(await records(page)).toHaveLength(0);
  await openCamera(page);
  await page.evaluate(() => {
    window.mangoCameraControl.hide();
    window.mangoCameraControl.releasePermission();
  });
  await expect.poll(() => cameraStops(page)).toBe(4);
  await page.evaluate(() => window.mangoCameraControl.show());
  expect(
    await page.evaluate(() => window.mangoCameraControl.constraints.length),
  ).toBe(2);
});

test("C04: backgrounding stops camera and ignores delayed capture encoding", async ({
  page,
}) => {
  await mockCamera(page, { encoding: "defer" });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  const camera = await openCamera(page);
  await camera
    .getByRole("button", {
      name: translations.en.guidedCameraCaptureBtn,
      exact: true,
    })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.mangoCameraControl.draws.length))
    .toBe(1);
  await page.evaluate(() => window.mangoCameraControl.hide());
  await expect.poll(() => cameraStops(page)).toBe(2);
  await page.evaluate(() => {
    window.mangoCameraControl.show();
    window.mangoCameraControl.releaseEncoding();
  });
  await expect
    .poll(() => page.evaluate(() => window.mangoCameraControl.encodesCompleted))
    .toBe(1);
  await expect(
    page.getByRole("dialog", {
      name: translations.en.reviewPhotoTitle,
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await records(page)).toHaveLength(0);
});

test("C05: missing frame blocks capture and an ended track releases stream", async ({
  page,
}) => {
  await mockCamera(page, { frame: "defer" });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  const camera = await openCamera(page);
  const capture = camera.getByRole("button", {
    name: translations.en.guidedCameraCaptureBtn,
    exact: true,
  });
  await expect(capture).toBeDisabled();
  await page.evaluate(() => window.mangoCameraControl.allowFrame());
  await expect(capture).toBeEnabled();
  await page.evaluate(() => window.mangoCameraControl.endTrack());
  await expect(capture).toBeDisabled();
  await expect.poll(() => cameraStops(page)).toBe(2);
  await camera
    .getByRole("button", {
      name: translations.en.guidedCameraRetryBtn,
      exact: true,
    })
    .click();
  await expect(capture).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(capture).toBeDisabled();
  await expect.poll(() => cameraStops(page)).toBe(4);
});

test("C06: denied permission can close and upload original gallery bytes in Bisaya", async ({
  page,
}) => {
  await mockCamera(page, { permission: "deny" });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await page
    .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: translations.bis.recentScansTitle,
      exact: true,
    }),
  ).toBeVisible({ timeout: 90_000 });
  const camera = await openCamera(page, "bis");
  const t = translations.bis;
  await expect(
    camera.getByRole("button", { name: t.guidedCameraCaptureBtn, exact: true }),
  ).toBeDisabled();
  await expect(
    camera.getByText(t.guidedCameraPermissionDenied, { exact: true }),
  ).toBeVisible();
  await expect(
    camera.getByRole("button", { name: t.uploadPhotoBtn, exact: true }),
  ).toHaveCount(0);
  await camera.getByRole("button", { name: t.closeBtn, exact: true }).click();
  await expect(camera).not.toBeVisible();
  await nav(page, t.navScan);
  const uploading = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: new RegExp(`^${t.uploadPhotoBtn}`) })
    .click();
  await (await uploading).setFiles(photoPath(photos[0].file));
  const review = page.getByRole("dialog", {
    name: t.reviewPhotoTitle,
    exact: true,
  });
  await expect(review).toBeVisible();
  const hash = await review
    .getByRole("img", { name: t.photoPreviewAlt, exact: true })
    .evaluate(async (image: HTMLImageElement) => {
      const bytes = await (await fetch(image.src)).arrayBuffer();
      return Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
    });
  expect(hash).toBe(photos[0].sha256);
  expect(await records(page)).toHaveLength(0);
});

test("C07: real video playback and capture work with a synthetic camera stream", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Synthetic canvas-stream bridge smoke is scoped to Chromium.",
  );
  await page.addInitScript(() => {
    const control = { constraints: [] as MediaStreamConstraints[], stops: 0 };
    window.mangoRealCameraControl = control;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: (constraints: MediaStreamConstraints) => {
        control.constraints.push(constraints);
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const context = canvas.getContext("2d")!;
        context.fillStyle = "#356f31";
        context.fillRect(0, 0, 1280, 720);
        context.fillStyle = "#8fbb51";
        context.beginPath();
        context.ellipse(640, 360, 250, 145, -0.25, 0, Math.PI * 2);
        context.fill();
        const stream = canvas.captureStream(10);
        let frame = 0;
        // Repaint a corner to provide real browser frames without a webcam.
        const timer = window.setInterval(() => {
          context.fillStyle = frame++ % 2 ? "#356f31" : "#356f32";
          context.fillRect(0, 0, 1, 1);
        }, 100);
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            control.stops += 1;
            window.clearInterval(timer);
            stop();
          };
        }
        return Promise.resolve(stream);
      },
    });
  });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  const camera = await openCamera(page);
  const capture = camera.getByRole("button", {
    name: translations.en.guidedCameraCaptureBtn,
    exact: true,
  });
  await expect(capture).toBeEnabled();
  const video = camera.locator("video");
  await expect(video).toHaveJSProperty("videoWidth", 1280);
  await expect(video).toHaveJSProperty("videoHeight", 720);
  await expect(video).toHaveJSProperty("paused", false);
  await test.info().attach("synthetic-real-video-camera.png", {
    body: await camera.screenshot(),
    contentType: "image/png",
  });
  await capture.click();
  const review = page.getByRole("dialog", {
    name: translations.en.reviewPhotoTitle,
    exact: true,
  });
  await expect(review).toBeVisible();
  const preview = review.getByRole("img", {
    name: translations.en.photoPreviewAlt,
    exact: true,
  });
  await expect(preview).toHaveJSProperty("naturalWidth", 1280);
  await expect(preview).toHaveJSProperty("naturalHeight", 720);
  await expect
    .poll(() => page.evaluate(() => window.mangoRealCameraControl.stops))
    .toBe(1);
  expect(await records(page)).toHaveLength(0);
});

test("C08: unavailable browser camera API can close and return to Upload Photo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
  });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  const camera = await openCamera(page);
  await expect(
    camera.getByText(translations.en.guidedCameraUnsupported, { exact: true }),
  ).toBeVisible();
  await expect(
    camera.getByRole("button", {
      name: translations.en.guidedCameraCaptureBtn,
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    camera.getByRole("button", {
      name: translations.en.guidedCameraRetryBtn,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(camera.getByRole("button")).toHaveCount(2);
  await camera
    .getByRole("button", { name: translations.en.closeBtn, exact: true })
    .click();
  await expect(camera).not.toBeVisible();
  await nav(page, translations.en.navScan);
  const choosing = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /^Upload Photo/ }).click();
  const chooser = await choosing;
  expect(await chooser.element().getAttribute("id")).toBe("scan-gallery-input");
  await chooser.setFiles([]);
  await expect(camera).not.toBeVisible();
  expect(await records(page)).toHaveLength(0);
});

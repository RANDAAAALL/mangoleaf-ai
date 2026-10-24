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
  streamAssignments: number;
  playCalls: number;
  nativeVideoErrors: number[];
  tabEvents: { shift: boolean; prevented: boolean; active: string }[];
  stops: number;
  draws: number[][];
  encodesCompleted: number;
  encoderJobs: number;
  encoderStops: number;
  releasePermission: () => void;
  allowFrame: () => void;
  setFrame: (width: number, height: number) => void;
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
    encoding?: "normal" | "defer" | "error";
    language?: Language;
  } = {},
) {
  await page.addInitScript((settings) => {
    localStorage.setItem("preferred_language", settings.language ?? "en");
    let frameReady = settings.frame !== "defer";
    let frameWidth = 1280;
    let frameHeight = 720;
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
      streamAssignments: 0,
      playCalls: 0,
      nativeVideoErrors: [],
      tabEvents: [],
      stops: 0,
      draws: [],
      encodesCompleted: 0,
      encoderJobs: 0,
      encoderStops: 0,
      releasePermission() {
        pendingPermission.splice(0).forEach((resolve) => resolve());
      },
      allowFrame() {
        frameReady = true;
        deliverFrames();
      },
      setFrame(width, height) {
        frameWidth = width;
        frameHeight = height;
        for (const video of videos) video.dispatchEvent(new Event("resize"));
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
    // Keep native-media failures and completed keyboard handling visible in CI.
    document.addEventListener(
      "error",
      (event) => {
        if (event.target instanceof HTMLVideoElement)
          control.nativeVideoErrors.push(event.target.error?.code ?? 0);
      },
      true,
    );
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      setTimeout(() => {
        const active = document.activeElement;
        control.tabEvents.push({
          shift: event.shiftKey,
          prevented: event.defaultPrevented,
          active:
            active?.getAttribute("aria-label") ?? active?.tagName ?? "none",
        });
      }, 0);
    });
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
              width: frameWidth,
              height: frameHeight,
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
    // Own the complete capability on every platform. Linux WebKit reached
    // native permission handling when only its returned object's method changed.
    // C07 covers real playback separately; C08 covers the unsupported API.
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
      configurable: true,
      get() {
        return attached.get(this) ?? null;
      },
      set(value: MediaStream | null) {
        if (value) control.streamAssignments += 1;
        attached.set(this, value);
      },
    });
    Object.defineProperties(HTMLVideoElement.prototype, {
      videoWidth: {
        configurable: true,
        get: () => (frameReady ? frameWidth : 0),
      },
      videoHeight: {
        configurable: true,
        get: () => (frameReady ? frameHeight : 0),
      },
      readyState: { configurable: true, get: () => (frameReady ? 4 : 0) },
      paused: { configurable: true, get: () => false },
      play: {
        configurable: true,
        value() {
          control.playCalls += 1;
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
    if (settings.encoding === "defer" || settings.encoding === "error") {
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        stopped = false;
        postMessage(
          message: { bitmap: ImageBitmap },
          options: Transferable[] | StructuredSerializeOptions = [],
        ) {
          const transfer = Array.isArray(options)
            ? options
            : (options.transfer ?? []);
          control.encoderJobs++;
          this.addEventListener(
            "message",
            () => {
              control.encodesCompleted++;
            },
            { once: true },
          );
          if (settings.encoding === "error") {
            message.bitmap.close();
            queueMicrotask(() => this.dispatchEvent(new ErrorEvent("error")));
          } else {
            pendingEncoding.push(() => {
              if (this.stopped) message.bitmap.close();
              else super.postMessage(message, transfer);
            });
          }
        }
        terminate() {
          if (!this.stopped) control.encoderStops++;
          this.stopped = true;
          super.terminate();
        }
      };
    }
  }, options);
}

test.afterEach(async ({ page }, info) => {
  if (page.isClosed()) return;
  const state = await page
    .evaluate(() => {
      const control = window.mangoCameraControl;
      if (!control) return null;
      const video = document.querySelector("video");
      const dialog = video?.closest('[role="dialog"]');
      return {
        constraints: control.constraints,
        streamAssignments: control.streamAssignments,
        playCalls: control.playCalls,
        nativeVideoErrors: control.nativeVideoErrors,
        tabEvents: control.tabEvents,
        stops: control.stops,
        draws: control.draws,
        video: video
          ? {
              attached: video.srcObject !== null,
              width: video.videoWidth,
              height: video.videoHeight,
              readyState: video.readyState,
              paused: video.paused,
              error: video.error?.code ?? null,
            }
          : null,
        status: dialog?.querySelector('[role="status"]')?.textContent ?? null,
        buttons: Array.from(
          dialog?.querySelectorAll("button") ?? [],
          (button) => ({
            name: button.getAttribute("aria-label") ?? button.textContent,
            disabled: button.disabled,
          }),
        ),
        activeElement: {
          tag: document.activeElement?.tagName,
          role: document.activeElement?.getAttribute("role"),
          name: document.activeElement?.getAttribute("aria-label"),
        },
      };
    })
    .catch(() => ({ collectionError: "Camera page became unavailable." }));
  if (state)
    await info.attach("controlled-camera-state.json", {
      body: JSON.stringify(state, null, 2),
      contentType: "application/json",
    });
});

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
  if (await page.evaluate(() => Boolean(window.mangoCameraControl))) {
    // Prove the controlled request ran, rather than waiting on native permission.
    await expect
      .poll(() =>
        page.evaluate(() => window.mangoCameraControl.constraints.length),
      )
      .toBeGreaterThan(0);
  }
  return camera;
}

async function cameraStops(page: Page) {
  return page.evaluate(() => window.mangoCameraControl.stops);
}

test("C01: square capture matches preview, waits for Run, and Retake opens a new stream", async ({
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
  const capture = () =>
    camera.getByRole("button", {
      name: translations.en.guidedCameraCaptureBtn,
      exact: true,
    });
  await expect(capture()).toBeEnabled();
  await expect(camera.getByRole("button")).toHaveCount(2);
  const guide = camera.locator('div[aria-hidden="true"]');
  await expect(guide).toBeVisible();
  await expect(guide.locator("span")).toHaveCount(4);
  await expect(guide.locator("span").first()).toHaveCSS("width", "36px");
  await expect(guide.locator("span").first()).toHaveCSS(
    "border-top-width",
    "4px",
  );
  await expect(guide.locator("span").first()).toHaveCSS(
    "border-top-left-radius",
    "16px",
  );
  await expect(camera.locator("video").locator("..")).toHaveCSS(
    "border-radius",
    "16px",
  );
  await expect(camera.locator("video").locator("..")).toHaveCSS(
    "overflow",
    "hidden",
  );
  await expect(camera.locator("video")).toHaveCSS("object-fit", "cover");
  await expect(camera.locator("video")).toHaveCSS("object-position", "50% 50%");
  for (const viewport of [
    { width: 360, height: 740 },
    { width: 740, height: 360 },
    { width: 320, height: 568 },
    { width: 768, height: 900 },
    { width: 280, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const measurement = await guide.evaluate((element) => {
          const rectangle = element.getBoundingClientRect();
          const preview = element.parentElement!.getBoundingClientRect();
          const available =
            element.parentElement!.parentElement!.getBoundingClientRect();
          return {
            width: rectangle.width,
            height: rectangle.height,
            availableWidth: available.width,
            availableHeight: available.height,
            color: getComputedStyle(element.firstElementChild!).borderTopColor,
            fillsPreview:
              Math.abs(rectangle.width - preview.width) < 1 &&
              Math.abs(rectangle.height - preview.height) < 1,
            centered:
              Math.abs(
                rectangle.x +
                  rectangle.width / 2 -
                  available.x -
                  available.width / 2,
              ) < 1 &&
              Math.abs(
                rectangle.y +
                  rectangle.height / 2 -
                  available.y -
                  available.height / 2,
              ) < 1,
          };
        });
        return (
          measurement.width >= 280 &&
          measurement.width <= 360 &&
          measurement.width <= Math.max(280, measurement.availableWidth) &&
          measurement.width <= measurement.availableHeight &&
          Math.abs(measurement.width - measurement.height) < 1 &&
          measurement.fillsPreview &&
          measurement.centered &&
          measurement.color === "rgb(166, 242, 177)"
        );
      })
      .toBe(true);
    // The hard bounds survive rotation; short screens scroll to their controls.
    if (viewport.width === 768) await expect(guide).toHaveCSS("width", "360px");
    if (viewport.width === 280) await expect(guide).toHaveCSS("width", "280px");
    await capture().scrollIntoViewIfNeeded();
    await expect(capture()).toBeInViewport({ ratio: 1 });
    await camera
      .getByRole("button", { name: translations.en.closeBtn, exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      camera.getByRole("button", {
        name: translations.en.closeBtn,
        exact: true,
      }),
    ).toBeInViewport({ ratio: 1 });
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
  await expect(preview).toHaveJSProperty("naturalWidth", 720);
  await expect(preview).toHaveJSProperty("naturalHeight", 720);
  expect(await page.evaluate(() => window.mangoCameraControl.draws)).toEqual([
    [280, 0, 720, 720, 0, 0, 720, 720],
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

test("C09: live portrait and odd frame sizes keep the square crop aligned in Bisaya", async ({
  page,
}) => {
  await mockCamera(page);
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  await page
    .getByRole("button", { name: /^(EN\/BIS|EN)$/ })
    .filter({ visible: true })
    .first()
    .click();
  const t = translations.bis;
  let camera = await openCamera(page, "bis");
  const scenarios = [
    {
      width: 720,
      height: 1280,
      viewport: { width: 360, height: 740 },
      crop: [0, 280, 720, 720, 0, 0, 720, 720],
      size: 720,
    },
    {
      width: 1001,
      height: 720,
      viewport: { width: 740, height: 360 },
      crop: [140.5, 0, 720, 720, 0, 0, 720, 720],
      size: 720,
    },
    {
      width: 720,
      height: 1001,
      viewport: { width: 360, height: 740 },
      crop: [0, 140.5, 720, 720, 0, 0, 720, 720],
      size: 720,
    },
    {
      width: 641,
      height: 641,
      viewport: { width: 740, height: 360 },
      crop: [0, 0, 641, 641, 0, 0, 641, 641],
      size: 641,
    },
  ];
  for (const [index, scenario] of scenarios.entries()) {
    if (index > 0) {
      await page
        .getByRole("button", { name: t.retakeBtn, exact: true })
        .click();
      camera = page.getByRole("dialog", {
        name: t.guidedCameraTitle,
        exact: true,
      });
    }
    await page.setViewportSize(scenario.viewport);
    await page.evaluate(
      ({ width, height }) => window.mangoCameraControl.setFrame(width, height),
      scenario,
    );
    await expect(camera.locator("video")).toHaveJSProperty(
      "videoWidth",
      scenario.width,
    );
    await expect(camera.locator("video")).toHaveJSProperty(
      "videoHeight",
      scenario.height,
    );
    await expect(
      camera.getByText(t.guidedCameraGuideNote, { exact: true }),
    ).toBeVisible();
    const capture = camera.getByRole("button", {
      name: t.guidedCameraCaptureBtn,
      exact: true,
    });
    await expect(capture).toBeEnabled();
    await capture.scrollIntoViewIfNeeded();
    await expect(capture).toBeInViewport({ ratio: 1 });
    await capture.click();
    const review = page.getByRole("dialog", {
      name: t.reviewPhotoTitle,
      exact: true,
    });
    const image = review.getByRole("img", {
      name: t.photoPreviewAlt,
      exact: true,
    });
    await expect(image).toHaveJSProperty("naturalWidth", scenario.size);
    await expect(image).toHaveJSProperty("naturalHeight", scenario.size);
    const draws = await page.evaluate(() => window.mangoCameraControl.draws);
    expect(draws).toHaveLength(index + 1);
    expect(draws[index]).toEqual(scenario.crop);
    await expect.poll(() => cameraStops(page)).toBe((index + 1) * 2);
  }
  expect(await records(page)).toHaveLength(0);
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
  const capture = camera.getByRole("button", {
    name: translations.en.guidedCameraCaptureBtn,
    exact: true,
  });
  await expect(capture).toBeEnabled();
  await capture.click();
  await page
    .getByRole("button", { name: translations.en.runDiagnosisBtn, exact: true })
    .click();
  await expectResult(page, "Healthy Fruit", Math.fround(0.95));
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
  // If the browser moves focus outside the modal, return to its enabled action.
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("button")!.focus();
  });
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
  const capture = camera.getByRole("button", {
    name: translations.en.guidedCameraCaptureBtn,
    exact: true,
  });
  await expect(capture).toBeEnabled();
  await capture.click();
  await expect
    .poll(() => page.evaluate(() => window.mangoCameraControl.draws.length))
    .toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.mangoCameraControl.encoderJobs))
    .toBe(1);
  await page.evaluate(() => window.mangoCameraControl.hide());
  await expect.poll(() => cameraStops(page)).toBe(2);
  await expect
    .poll(() => page.evaluate(() => window.mangoCameraControl.encoderStops))
    .toBe(1);
  await page.evaluate(() => {
    window.mangoCameraControl.show();
    window.mangoCameraControl.releaseEncoding();
  });
  expect(
    await page.evaluate(() => window.mangoCameraControl.encodesCompleted),
  ).toBe(0);
  await expect(
    page.getByRole("dialog", {
      name: translations.en.reviewPhotoTitle,
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await records(page)).toHaveLength(0);
});

test("C10: capture releases the stream before JPEG encoding settles and records stage timings", async ({
  page,
}) => {
  await mockCamera(page, { encoding: "defer" });
  await page.addInitScript(() => {
    localStorage.setItem(
      "mangoleaf-diagnostics-v1",
      JSON.stringify({ version: 1, enabled: true, events: [] }),
    );
  });
  await controlledModel(page, scoresFor("Healthy Fruit"));
  await openApp(page);
  const camera = await openCamera(page);
  const capture = camera.getByRole("button", {
    name: translations.en.guidedCameraCaptureBtn,
    exact: true,
  });
  await expect(capture).toBeEnabled();
  await capture.click();
  // Keep the encoder blocked: hardware must already be stopped without a second photo or premature review.
  await expect.poll(() => cameraStops(page)).toBe(2);
  expect(
    await page.evaluate(() => window.mangoCameraControl.encodesCompleted),
  ).toBe(0);
  await expect(camera.locator("video")).toHaveJSProperty("srcObject", null);
  await expect
    .poll(() => page.evaluate(() => window.mangoCameraControl.encoderJobs))
    .toBe(1);
  await expect(
    camera.getByRole("button", {
      name: translations.en.guidedCameraCapturing,
      exact: true,
    }),
  ).toBeDisabled();
  await page.evaluate(() => window.mangoCameraControl.releaseEncoding());
  const review = page.getByRole("dialog", {
    name: translations.en.reviewPhotoTitle,
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(
    review.getByRole("img", {
      name: translations.en.photoPreviewAlt,
      exact: true,
    }),
  ).toHaveJSProperty("naturalWidth", 720);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const events =
          JSON.parse(localStorage.getItem("mangoleaf-diagnostics-v1") || "{}")
            .events || [];
        return events
          .filter((row: { event: string }) =>
            row.event.startsWith("camera.capture."),
          )
          .map((row: { event: string }) => row.event);
      }),
    )
    .toEqual([
      "camera.capture.started",
      "camera.capture.frame.completed",
      "camera.capture.encode.completed",
      "camera.capture.finished",
    ]);
  const captureEvents = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mangoleaf-diagnostics-v1")!).events.filter(
      (row: { event: string }) => row.event.startsWith("camera.capture."),
    ),
  );
  expect(captureEvents[0].details).toMatchObject({ width: 720, height: 720 });
  expect(captureEvents[2].details).toMatchObject({ source: "worker" });
  expect(captureEvents[3].details.outcome).toBe("complete");
  expect(
    captureEvents.every(
      (row: { details: { operation: string } }) =>
        row.details.operation === captureEvents[0].details.operation,
    ),
  ).toBe(true);
  expect(await records(page)).toHaveLength(0);
});

for (const encoding of ["error", "defer"] as const) {
  test(`C${encoding === "error" ? "11" : "12"}: ${encoding === "error" ? "failed" : "unresponsive"} worker falls back to a decodable JPEG and ignores late work`, async ({
    page,
  }) => {
    await mockCamera(page, { encoding });
    await page.addInitScript(() =>
      localStorage.setItem(
        "mangoleaf-diagnostics-v1",
        JSON.stringify({ version: 1, enabled: true, events: [] }),
      ),
    );
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
      .poll(() => page.evaluate(() => window.mangoCameraControl.encoderJobs))
      .toBe(1);
    const review = page.getByRole("dialog", {
      name: translations.en.reviewPhotoTitle,
      exact: true,
    });
    await expect(review).toBeVisible();
    await expect(
      review.getByRole("img", {
        name: translations.en.photoPreviewAlt,
        exact: true,
      }),
    ).toHaveJSProperty("naturalWidth", 720);
    expect(await cameraStops(page)).toBe(2);
    expect(
      await page.evaluate(() => window.mangoCameraControl.encoderStops),
    ).toBe(1);
    // Diagnostics batch their writes; a fast fallback can reach Review before the log flush.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(
              localStorage.getItem("mangoleaf-diagnostics-v1")!,
            ).events.find(
              (row: { event: string }) =>
                row.event === "camera.capture.encode.completed",
            )?.details,
        ),
      )
      .toMatchObject({
        source: "main-fallback",
        reason: encoding === "error" ? "error" : "timeout",
      });
    await page.evaluate(() => window.mangoCameraControl.releaseEncoding());
    await expect(review).toHaveCount(1);
    expect(await records(page)).toHaveLength(0);
  });
}

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
  await page.setViewportSize({ width: 740, height: 360 });
  const retry = camera.getByRole("button", {
    name: translations.en.guidedCameraRetryBtn,
    exact: true,
  });
  // Landscape errors scroll inside the status area so Retry stays reachable.
  await retry.scrollIntoViewIfNeeded();
  // Scroll rounding can leave a subpixel of the 44 px button at the screen edge.
  await expect(retry).toBeInViewport({ ratio: 0.98 });
  await retry.click();
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
        // Distinct outer and inner edges catch off-center or full-frame capture.
        context.fillStyle = "#d62828";
        context.fillRect(0, 0, 280, 720);
        context.fillStyle = "#283cd6";
        context.fillRect(1000, 0, 280, 720);
        context.fillStyle = "#f0d21e";
        context.fillRect(280, 0, 80, 720);
        context.fillStyle = "#1ed2dc";
        context.fillRect(920, 0, 80, 720);
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
  await expect(preview).toHaveJSProperty("naturalWidth", 720);
  await expect(preview).toHaveJSProperty("naturalHeight", 720);
  const samples = await preview.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return [40, 360, 680].map((x) =>
      Array.from(context.getImageData(x, 360, 1, 1).data).slice(0, 3),
    );
  });
  for (const [index, expected] of [
    [240, 210, 30],
    [143, 187, 81],
    [30, 210, 220],
  ].entries()) {
    samples[index].forEach((channel, index) =>
      expect(Math.abs(channel - expected[index])).toBeLessThan(12),
    );
  }
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

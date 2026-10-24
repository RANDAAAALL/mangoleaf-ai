import { expect, test } from "bun:test";
import { encodeCameraImage } from "../src/lib/camera-image.ts";

// These controlled workers prove ownership/cancellation/fallback, not phone speed.
async function withEncoder(mode, run) {
  const keys = ["Worker", "OffscreenCanvas", "createImageBitmap"];
  const originals = new Map(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const state = { workers: [], closes: 0, fallbacks: 0, bitmapReady: null };
  const bitmap = {
    close() {
      state.closes++;
    },
  };
  class Encoder {
    constructor() {
      this.terminations = 0;
      state.workers.push(this);
    }
    postMessage(message, transfer) {
      expect(message.bitmap).toBe(bitmap);
      expect(transfer).toEqual([bitmap]);
      if (mode === "success")
        queueMicrotask(() =>
          this.onmessage({
            data: { blob: new Blob(["jpeg"], { type: "image/jpeg" }) },
          }),
        );
      if (mode === "error")
        queueMicrotask(() => this.onerror({ preventDefault() {} }));
      if (mode === "invalid")
        queueMicrotask(() =>
          this.onmessage({
            data: { blob: new Blob(["not jpeg"], { type: "image/png" }) },
          }),
        );
    }
    terminate() {
      this.terminations++;
    }
  }
  const values = {
    Worker: Encoder,
    OffscreenCanvas:
      mode === "unsupported"
        ? undefined
        : class {
            convertToBlob() {}
          },
    createImageBitmap: () =>
      mode === "late-bitmap"
        ? new Promise((resolve) => {
            state.bitmapReady = () => resolve(bitmap);
          })
        : Promise.resolve(bitmap),
  };
  for (const key of keys)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: values[key],
    });
  const canvas = {
    toDataURL(type, quality) {
      state.fallbacks++;
      expect(type).toBe("image/jpeg");
      expect(quality).toBe(0.92);
      return "data:image/jpeg;base64,anBlZw==";
    },
  };
  try {
    await run(state, canvas);
  } finally {
    for (const key of keys) {
      const descriptor = originals.get(key);
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("camera worker returns JPEG and terminates without invoking the idle encoder", async () => {
  await withEncoder("success", async (state, canvas) => {
    const result = await encodeCameraImage(
      canvas,
      new AbortController().signal,
    );
    expect(result.source).toBe("worker");
    expect(result.reason).toBeNull();
    expect(await result.blob.text()).toBe("jpeg");
    expect(state.workers[0].terminations).toBe(1);
    expect(state.fallbacks).toBe(0);
  });
});

for (const mode of ["unsupported", "error", "invalid"]) {
  test(`camera uses same-quality immediate JPEG when worker is ${mode}`, async () => {
    await withEncoder(mode, async (state, canvas) => {
      const result = await encodeCameraImage(
        canvas,
        new AbortController().signal,
      );
      expect(result.source).toBe("main-fallback");
      expect(result.reason).toBe(
        mode === "unsupported" ? "unsupported" : "error",
      );
      expect(result.blob.type).toBe("image/jpeg");
      expect(await result.blob.text()).toBe("jpeg");
      expect(state.fallbacks).toBe(1);
      if (state.workers.length) expect(state.workers[0].terminations).toBe(1);
    });
  });
}

test("camera cancels before bitmap creation and closes the late bitmap without creating a worker", async () => {
  await withEncoder("late-bitmap", async (state, canvas) => {
    const controller = new AbortController();
    const pending = encodeCameraImage(canvas, controller.signal);
    const rejection = pending.then(
      () => null,
      (error) => error,
    );
    controller.abort();
    expect(await rejection).toMatchObject({ name: "AbortError" });
    state.bitmapReady();
    await Promise.resolve();
    expect(state.closes).toBe(1);
    expect(state.workers).toHaveLength(0);
    expect(state.fallbacks).toBe(0);
  });
});

test("camera cancels an active worker and ignores a late response without a fallback", async () => {
  await withEncoder("hang", async (state, canvas) => {
    const controller = new AbortController();
    const pending = encodeCameraImage(canvas, controller.signal);
    const rejection = pending.then(
      () => null,
      (error) => error,
    );
    await Promise.resolve();
    expect(state.workers).toHaveLength(1);
    controller.abort();
    expect(await rejection).toMatchObject({ name: "AbortError" });
    state.workers[0].onmessage({
      data: { blob: new Blob(["late"], { type: "image/jpeg" }) },
    });
    expect(state.workers[0].terminations).toBe(1);
    expect(state.fallbacks).toBe(0);
  });
});

test("camera bounds an unresponsive worker before immediate fallback", async () => {
  await withEncoder("hang", async (state, canvas) => {
    const original = globalThis.setTimeout;
    globalThis.setTimeout = (callback, delay, ...args) =>
      original(callback, delay === 5000 ? 0 : delay, ...args);
    try {
      const result = await encodeCameraImage(
        canvas,
        new AbortController().signal,
      );
      expect(result.source).toBe("main-fallback");
      expect(result.reason).toBe("timeout");
      expect(state.workers[0].terminations).toBe(1);
      expect(state.fallbacks).toBe(1);
    } finally {
      globalThis.setTimeout = original;
    }
  });
});

// A dedicated worker avoids Chromium's main-thread idle JPEG encoder deadlines.
const encoderWorker = self as unknown as {
  onmessage: ((event: MessageEvent<{ bitmap: ImageBitmap }>) => void) | null;
  postMessage: (result: { blob: Blob } | { failed: true }) => void;
};

encoderWorker.onmessage = async ({ data }) => {
  const bitmap = data.bitmap;
  let canvas: OffscreenCanvas | undefined;
  try {
    canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Camera encoder is unavailable.");
    context.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.92,
    });
    encoderWorker.postMessage({ blob });
  } catch {
    // Only a controlled failure crosses back; no image data or raw errors enter logs.
    encoderWorker.postMessage({ failed: true });
  } finally {
    bitmap.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
};

export {};

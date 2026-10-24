const WORKER_TIMEOUT_MS = 5000;
const JPEG_PREFIX = "data:image/jpeg;base64,";

interface CameraImage {
  blob: Blob;
  source: "worker" | "main-fallback";
  reason: "unsupported" | "error" | "timeout" | null;
}

/** Preserve the copied square and JPEG quality without main-thread idle encoding. */
export async function encodeCameraImage(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<CameraImage> {
  signal.throwIfAborted();
  let reason: CameraImage["reason"] = "unsupported";
  if (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof OffscreenCanvas.prototype.convertToBlob === "function" &&
    typeof createImageBitmap === "function"
  ) {
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        let worker: Worker | undefined;
        let bitmap: ImageBitmap | undefined;
        let settled = false;
        const finish = (error?: unknown, value?: Blob) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          signal.removeEventListener("abort", abort);
          worker?.terminate();
          bitmap?.close();
          if (error) reject(error);
          else resolve(value!);
        };
        const abort = () => finish(signal.reason);
        const timer = setTimeout(() => {
          reason = "timeout";
          finish(new Error("Camera encoder timed out."));
        }, WORKER_TIMEOUT_MS);
        signal.addEventListener("abort", abort, { once: true });
        // Bitmap creation can settle after cancellation; its late resource still needs closing.
        void createImageBitmap(canvas).then(
          (image) => {
            bitmap = image;
            if (settled || signal.aborted) {
              image.close();
              return;
            }
            try {
              worker = new Worker(
                new URL("./camera-image-worker.ts", import.meta.url),
              );
              worker.onmessage = (event: MessageEvent<{ blob?: unknown }>) => {
                const encoded = event.data?.blob;
                if (
                  !(encoded instanceof Blob) ||
                  encoded.type !== "image/jpeg" ||
                  encoded.size === 0
                ) {
                  finish(new Error("Camera photo encoding failed."));
                } else finish(undefined, encoded);
              };
              worker.onerror = (event) => {
                event.preventDefault();
                finish(new Error("Camera encoder failed."));
              };
              worker.onmessageerror = () =>
                finish(new Error("Camera encoder response is unavailable."));
              worker.postMessage({ bitmap: image }, [image]);
              bitmap = undefined; // Ownership transferred to the worker.
            } catch (error) {
              finish(error);
            }
          },
          (error: unknown) => finish(error),
        );
      });
      return { blob, source: "worker", reason: null };
    } catch {
      signal.throwIfAborted();
      reason ??= "error";
      if (reason === "unsupported") reason = "error";
    }
  }

  // Compatibility fallback uses immediate encoding, avoiding toBlob's same idle queue.
  // It is limited to the already-copied frame; no resize, quality or model-input change.
  signal.throwIfAborted();
  const encoded = canvas.toDataURL("image/jpeg", 0.92);
  if (!encoded.startsWith(JPEG_PREFIX))
    throw new Error("Camera JPEG encoding is unavailable.");
  const binary = atob(encoded.slice(JPEG_PREFIX.length));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytes.length === 0) throw new Error("Camera photo is empty.");
  signal.throwIfAborted();
  return {
    blob: new Blob([bytes], { type: "image/jpeg" }),
    source: "main-fallback",
    reason,
  };
}

/**
 * Creates the smaller photo saved with the report in local History.
 * This module uses browser Canvas only, so other callers can reuse compression
 * without importing TensorFlow.js. Call it after diagnosis; the model should
 * keep reading the original photo rather than this compressed storage copy.
 *
 * The longest side stays at most 1000px by default. WebP uses 75% quality;
 * browsers without WebP canvas export fall back to JPEG at 80% quality.
 */
export async function compressImageForStorage(
  imgElement: HTMLImageElement,
  maxDimension: number = 1000,
  quality: number = 0.75,
  signal?: AbortSignal,
): Promise<Blob> {
  signal?.throwIfAborted();
  let width = imgElement.naturalWidth || imgElement.width;
  let height = imgElement.naturalHeight || imgElement.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Storage photo canvas is unavailable.");
  ctx.drawImage(imgElement, 0, 0, width, height);

  const encode = (type: string, encodingQuality: number) =>
    new Promise<Blob | null>((resolve, reject) => {
      const onAbort = () => {
        signal?.removeEventListener("abort", onAbort);
        reject(signal?.reason);
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) {
        onAbort();
        return;
      }
      try {
        canvas.toBlob(
          (blob) => {
            signal?.removeEventListener("abort", onAbort);
            if (signal?.aborted) reject(signal.reason);
            else resolve(blob);
          },
          type,
          encodingQuality,
        );
      } catch (error) {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      }
    });

  try {
    // Prefer WebP when the browser supports encoding it.
    const webpBlob = await encode("image/webp", quality);

    // Check the type, not just that a blob came back: a browser without WebP
    // support silently hands back a PNG instead, which is larger than the JPEG.
    if (webpBlob && webpBlob.type === "image/webp") {
      console.log(
        `---Compressed to WebP: ${(webpBlob.size / 1024).toFixed(0)} KB---`,
      );
      return webpBlob;
    }

    // JPEG at 80% for browsers without WebP export
    const jpegBlob = await encode("image/jpeg", 0.8);
    if (!jpegBlob) throw new Error("Canvas blob compression failed");
    console.log(
      `---Compressed to JPEG (fallback): ${(jpegBlob.size / 1024).toFixed(0)} KB---`,
    );
    return jpegBlob;
  } finally {
    // Encoders snapshot the canvas; release its backing surface after settling/abort.
    canvas.width = 0;
    canvas.height = 0;
  }
}

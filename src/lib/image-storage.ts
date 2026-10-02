/**
 * Creates the smaller photo saved in local History and uploaded to the cloud.
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
): Promise<Blob> {
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
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.drawImage(imgElement, 0, 0, width, height);

  // Prefer WebP when the browser supports encoding it.
  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });

  // Check the type, not just that a blob came back: a browser without WebP
  // support silently hands back a PNG instead, which is larger than the JPEG.
  if (webpBlob && webpBlob.type === "image/webp") {
    console.log(
      `---Compressed to WebP: ${(webpBlob.size / 1024).toFixed(0)} KB---`,
    );
    return webpBlob;
  }

  // JPEG at 80% for browsers without WebP export
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log(
            `---Compressed to JPEG (fallback): ${(blob.size / 1024).toFixed(0)} KB---`,
          );
          resolve(blob);
        } else reject(new Error("Canvas blob compression failed"));
      },
      "image/jpeg",
      0.8,
    );
  });
}

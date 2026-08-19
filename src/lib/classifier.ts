import * as tf from "@tensorflow/tfjs";
import { CLASSES } from "./constants";

export interface DiagnosisResult {
  diseaseName: string;
  confidence: number;
}

// Module-level singleton cache: ensures the model is loaded & warmed only ONCE
// across all component mounts, remounts, and network reconnection events.
let cachedModel: tf.GraphModel | null = null;
let loadingPromise: Promise<tf.GraphModel> | null = null;
let sharedCanvas: HTMLCanvasElement | null = null;

/**
 * Loads the compiled TensorFlow.js Graph Model from the public directory
 * and runs a dummy prediction warmup to compile WebGL shaders in the background.
 * Uses a module-level singleton cache so the model is only loaded once.
 */
export async function loadMangoModel(): Promise<tf.GraphModel> {
  // Return cached model instantly if already loaded
  if (cachedModel) {
    console.log("---Model already cached — returning instantly.---");
    return cachedModel;
  }

  // Prevent duplicate concurrent loads (e.g. React StrictMode double-mount)
  if (loadingPromise) {
    console.log("---Model load already in progress — awaiting...---");
    return loadingPromise;
  }

  loadingPromise = (async () => {
    console.log("---Initializing TensorFlow.js engine...---");

    // OPTIMIZATION: Force GPU to use 16-bit float textures.
    // This halves GPU memory usage on phones and perfectly matches our Float16 quantized model.
    // NOTE: If you ever encounter rendering/GPU issues on very old devices, you can remove or comment out this line.
    tf.env().set("WEBGL_FORCE_F16_TEXTURES", true);

    await tf.ready();

    const modelPath = "/model/model.json";
    const model = await tf.loadGraphModel(modelPath);
    console.log("---Graph model JSON loaded from assets.---");

    // Run a dummy warmup to force compile WebGL shaders on device startup
    console.log("---Warming up GPU WebGL shaders...---");
    tf.tidy(() => {
      const dummyTensor = tf.zeros([1, 224, 224, 3]);
      model.predict(dummyTensor);
    });
    console.log("---GPU model warmup complete.---");

    cachedModel = model;
    return model;
  })();

  return loadingPromise;
}

/**
 * Downscales a full-resolution camera photo to 224x224 using an offscreen Canvas.
 * This avoids creating a massive GPU tensor from a 12-108 megapixel raw camera image
 * just to immediately discard 99.97% of its pixels during tf.image.resizeBilinear.
 * Canvas resizing is a lightweight CPU operation handled natively by the browser.
 */
function downscaleToCanvas(
  imgElement: HTMLImageElement,
  targetSize: number = 224
): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
  }
  sharedCanvas.width = targetSize;
  sharedCanvas.height = targetSize;
  const ctx = sharedCanvas.getContext("2d", { alpha: false })!;
  // drawImage handles bilinear scaling natively in the browser engine
  ctx.drawImage(imgElement, 0, 0, targetSize, targetSize);
  return sharedCanvas;
}

/**
 * Preprocesses an image element and performs on-device WebGL inference
 * using the provided Graph Model. Enforces the 70% confidence threshold.
 *
 * Optimization notes:
 * - Camera photos are pre-downscaled to 224x224 via Canvas before tensor conversion
 *   to avoid allocating multi-megabyte GPU tensors from raw camera shots.
 * - Uses async data() instead of blocking dataSync() to keep the UI thread responsive.
 */
export async function predictMangoDisease(
  model: tf.GraphModel,
  imgElement: HTMLImageElement
): Promise<DiagnosisResult> {
  // 1. Downscale the raw camera photo to 224x224 on a lightweight CPU canvas
  //    A 12MP photo (4000x3000) = 36 million floats vs 224x224 = 150K floats (240x smaller)
  const smallCanvas = downscaleToCanvas(imgElement, 224);

  // 2. Execute tensor calculations wrapped in tf.tidy to purge temporary GPU memory
  const outputTensor = tf.tidy(() => {
    // Convert the pre-scaled 224x224 canvas directly into a compact 3D tensor
    const tensor = tf.browser.fromPixels(smallCanvas);

    // Add batch dimension [1, 224, 224, 3] and cast to float
    // Note: MobileNetV3's internal layer automatically handles pixel normalization
    const batched = tensor.cast("float32").expandDims(0);

    // Run prediction
    return model.predict(batched) as tf.Tensor;
  });

  // 3. Use async data() instead of blocking dataSync() to keep UI animations smooth
  const results = await outputTensor.data();
  outputTensor.dispose();

  // Find the class index with the highest probability score
  let maxIndex = 0;
  let maxProb = 0;
  for (let i = 0; i < results.length; i++) {
    if (results[i] > maxProb) {
      maxProb = results[i];
      maxIndex = i;
    }
  }

  const confidence = Math.round(maxProb * 100) / 100;

  // Enforce the 70% threshold check from capstone specifications
  const diseaseName = confidence >= 0.70
    ? CLASSES[maxIndex]
    : "Uncertain / Unrecognized";

  return {
    diseaseName,
    confidence
  };
}

/**
 * Efficiently compresses a high-resolution camera photo to a max dimension of 1000px
 * using modern WebP format (with automatic JPEG fallback for older devices).
 * 
 * WebP at 75% quality ≈ 70–90 KB (vs JPEG 80% ≈ 150–250 KB) — halves 3G upload time.
 * Falls back to JPEG 80% if the browser doesn't support WebP canvas export.
 */
export async function compressImageForStorage(
  imgElement: HTMLImageElement,
  maxDimension: number = 1000,
  quality: number = 0.75
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

  // Try WebP first (50% smaller than JPEG on 3G networks)
  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/webp",
      quality
    );
  });

  // If WebP succeeded AND the browser actually produced a WebP blob (not a fallback PNG),
  // use it. Otherwise fall back to JPEG for maximum compatibility.
  if (webpBlob && webpBlob.type === "image/webp") {
    console.log(`---Compressed to WebP: ${(webpBlob.size / 1024).toFixed(0)} KB---`);
    return webpBlob;
  }

  // Fallback: JPEG at 80% quality for older devices
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log(`---Compressed to JPEG (fallback): ${(blob.size / 1024).toFixed(0)} KB---`);
          resolve(blob);
        }
        else reject(new Error("Canvas blob compression failed"));
      },
      "image/jpeg",
      0.80
    );
  });
}

/**
 * Computes a unique SHA-256 binary fingerprint (hash) of an image file using
 * the browser-native Web Crypto API. Used for instant local duplicate photo detection.
 */
export async function computeImageHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}



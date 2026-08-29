import * as tf from "@tensorflow/tfjs";
import { CLASSES, UNCERTAIN_LABEL } from "./constants";

export interface DiagnosisResult {
  diseaseName: string;
  confidence: number;
}

/**
 * The 70% minimum confidence rule is a fixed specification, not a tuned value,
 * so it lives in code rather than in model_config.json. If a future config file
 * disagrees with it, the code value wins and a warning is logged.
 */
const CONFIDENCE_THRESHOLD = 0.70;

/** Optional extra rejection thresholds, fitted in the training notebook. */
interface ModelConfigThresholds {
  /** Minimum gap between the top two probabilities. null = check disabled. */
  marginThreshold: number | null;
  /** Maximum normalized entropy, 0 to 1. null = check disabled. */
  entropyThreshold: number | null;
}

// Module-level singleton cache: ensures the model is loaded & warmed only ONCE
// across all component mounts, remounts, and network reconnection events.
let cachedModel: tf.GraphModel | null = null;
let loadingPromise: Promise<tf.GraphModel> | null = null;
let sharedCanvas: HTMLCanvasElement | null = null;

// Both null until model_config.json is read, which means only the confidence
// check runs. That is the correct default: the notebook exports null for these
// two whenever no out-of-scope image set was available to fit them against.
let thresholds: ModelConfigThresholds = {
  marginThreshold: null,
  entropyThreshold: null,
};

/**
 * Reads the rejection thresholds exported alongside the model weights.
 * Never throws. A missing, malformed, or offline config leaves both optional
 * thresholds null, which disables those two checks and keeps the 70% rule.
 */
async function loadModelConfig(): Promise<void> {
  try {
    const response = await fetch("/model/model_config.json");
    if (!response.ok) {
      console.log("---No model_config.json — using the 70% check only.---");
      return;
    }
    const config = await response.json();

    const margin = config?.thresholds?.marginThreshold;
    const entropy = config?.thresholds?.entropyThreshold;
    thresholds = {
      marginThreshold: typeof margin === "number" ? margin : null,
      entropyThreshold: typeof entropy === "number" ? entropy : null,
    };

    const configured = config?.thresholds?.confidenceThreshold;
    if (typeof configured === "number" && configured !== CONFIDENCE_THRESHOLD) {
      console.warn(
        `---model_config.json asks for a ${configured} confidence threshold, ` +
          `but ${CONFIDENCE_THRESHOLD} is fixed by specification. Using ${CONFIDENCE_THRESHOLD}.---`,
      );
    }

    console.log(
      `---Model config loaded: margin=${thresholds.marginThreshold}, ` +
        `entropy=${thresholds.entropyThreshold} (null means the check is off).---`,
    );
  } catch {
    console.log("---model_config.json unreadable — using the 70% check only.---");
  }
}

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
    // This halves GPU texture memory on phones. Trial 3 ships float32 weight
    // shards, while this WebGL setting stores the deployed weights in half-float
    // textures on supported devices. The model artifact is never altered here.
    // NOTE: If you ever encounter rendering/GPU issues on very old devices, you can remove or comment out this line.
    tf.env().set("WEBGL_FORCE_F16_TEXTURES", true);

    await tf.ready();

    // Fetch the weights and the threshold config concurrently rather than in
    // sequence. The config is only 567 bytes, but on a rural 3G first load a
    // sequential request costs an extra round trip before the GPU warmup can
    // start. Nothing reads the thresholds until the first prediction, so there
    // is no ordering requirement between the two.
    const modelPath = "/model/model.json";
    const [model] = await Promise.all([
      tf.loadGraphModel(modelPath),
      // Deliberately non-fatal: if this file is missing or unreachable the
      // classifier keeps the hardcoded confidence check and skips the optional
      // margin and entropy checks, so a config problem can never block a scan.
      loadModelConfig(),
    ]);
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
 * using the provided Graph Model. Returns UNCERTAIN_LABEL when the
 * prediction fails the 70% confidence rule, or the optional margin and entropy
 * rules when model_config.json supplies them.
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

  // Find the top two class probabilities in a single pass. The runner-up is
  // needed for the margin check below.
  let maxIndex = 0;
  let maxProb = -1;
  let secondProb = -1;
  for (let i = 0; i < results.length; i++) {
    const p = results[i];
    if (p > maxProb) {
      secondProb = maxProb;
      maxProb = p;
      maxIndex = i;
    } else if (p > secondProb) {
      secondProb = p;
    }
  }

  const margin = maxProb - secondProb;

  // Normalized Shannon entropy: 0 when one class takes everything, 1 when all six
  // are equally likely. Dividing by log(number of classes) is what makes the value
  // comparable to the threshold the training notebook fits.
  let entropy = 0;
  for (let i = 0; i < results.length; i++) {
    const p = results[i];
    if (p > 0) entropy -= p * Math.log(p);
  }
  const normalizedEntropy = entropy / Math.log(results.length);

  // Compare the RAW probability, never a rounded one. Rounding first would let
  // 0.695 clear a 0.70 gate, silently lowering the real threshold to 69.5%.
  const meetsConfidence = maxProb >= CONFIDENCE_THRESHOLD;
  const meetsMargin =
    thresholds.marginThreshold === null || margin >= thresholds.marginThreshold;
  const meetsEntropy =
    thresholds.entropyThreshold === null ||
    normalizedEntropy <= thresholds.entropyThreshold;

  // Round for display only, after every check has already run on the raw value.
  const confidence = Math.round(maxProb * 100) / 100;

  const accepted = meetsConfidence && meetsMargin && meetsEntropy;
  if (!accepted) {
    console.log(
      `---Rejected: confidence=${maxProb.toFixed(4)} margin=${margin.toFixed(4)} ` +
        `entropy=${normalizedEntropy.toFixed(4)}---`,
    );
  }

  const diseaseName = accepted ? CLASSES[maxIndex] : UNCERTAIN_LABEL;

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


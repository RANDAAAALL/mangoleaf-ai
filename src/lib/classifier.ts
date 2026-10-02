import * as tf from "@tensorflow/tfjs";
import { CLASSES, UNCERTAIN_LABEL } from "./constants";

export interface DiagnosisResult {
  diseaseName: string;
  confidence: number;
}

/**
 * The 70% minimum confidence rule is fixed by specification, not tuned, so it
 * lives in code instead of model_config.json. If a config file disagrees, this
 * value wins and a warning is logged.
 */
const CONFIDENCE_THRESHOLD = 0.7;

/** Optional extra rejection thresholds, fitted in the training notebook. */
interface ModelConfigThresholds {
  /** Minimum gap between the top two probabilities. null = check disabled. */
  marginThreshold: number | null;
  /** Maximum normalized entropy, 0 to 1. null = check disabled. */
  entropyThreshold: number | null;
}

// Loaded and warmed once, then reused across every mount, remount, and
// reconnection.
let cachedModel: tf.GraphModel | null = null;
let loadingPromise: Promise<tf.GraphModel> | null = null;
let sharedCanvas: HTMLCanvasElement | null = null;

// Null until model_config.json is read, so only the confidence check runs. That
// is the intended default: the notebook exports null for both whenever it had no
// out-of-scope image set to fit them against.
let thresholds: ModelConfigThresholds = {
  marginThreshold: null,
  entropyThreshold: null,
};

/**
 * Reads the rejection thresholds shipped with the model weights. Never throws:
 * a missing, malformed, or offline config leaves both thresholds null, which
 * turns those two checks off and keeps the 70% rule.
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
    console.log(
      "---model_config.json unreadable — using the 70% check only.---",
    );
  }
}

/**
 * Loads the TensorFlow.js Graph Model from the public directory and runs one
 * dummy prediction to compile the WebGL shaders up front. Cached at module level
 * so the load happens once.
 */
export async function loadMangoModel(): Promise<tf.GraphModel> {
  if (cachedModel) {
    console.log("---Model already cached — returning instantly.---");
    return cachedModel;
  }

  // Stops a second load starting mid-flight, e.g. a React StrictMode double-mount.
  if (loadingPromise) {
    console.log("---Model load already in progress — awaiting...---");
    return loadingPromise;
  }

  loadingPromise = (async () => {
    console.log("---Initializing TensorFlow.js engine...---");

    // Halves GPU texture memory on phones. Trial 3 ships float32 weight shards;
    // this setting only changes how WebGL stores them on device, and leaves the
    // model artifact untouched. Remove it if a very old GPU renders incorrectly.
    tf.env().set("WEBGL_FORCE_F16_TEXTURES", true);

    await tf.ready();

    // Fetched together, not one after the other. The config is only 567 bytes,
    // but on rural 3G a sequential request adds a round trip before the GPU
    // warmup can start. Nothing reads the thresholds until the first prediction,
    // so the order does not matter.
    const modelPath = "/model/model.json";
    const [model] = await Promise.all([
      tf.loadGraphModel(modelPath),
      // Non-fatal on purpose: if this file is missing the classifier keeps the
      // confidence check and skips margin and entropy, so a config problem can
      // never block a scan.
      loadModelConfig(),
    ]);
    console.log("---Graph model JSON loaded from assets.---");

    // Compile the shaders now, so the first real scan is not the one that pays.
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
 * Shrinks a full-resolution camera photo to 224x224 on an offscreen canvas.
 * Doing it here avoids building a huge GPU tensor from a 12-108 megapixel photo
 * only to throw away 99.97% of its pixels in tf.image.resizeBilinear. The canvas
 * path is plain CPU work the browser already does natively.
 */
function downscaleToCanvas(
  imgElement: HTMLImageElement,
  targetSize: number = 224,
): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
  }
  sharedCanvas.width = targetSize;
  sharedCanvas.height = targetSize;
  const ctx = sharedCanvas.getContext("2d", { alpha: false })!;
  // drawImage does the bilinear scaling inside the browser engine
  ctx.drawImage(imgElement, 0, 0, targetSize, targetSize);
  return sharedCanvas;
}

/**
 * Preprocesses an image and runs on-device WebGL inference with the given Graph
 * Model. Returns UNCERTAIN_LABEL when the prediction fails the 70% confidence
 * rule, or the margin and entropy rules when model_config.json supplies them.
 *
 * Two speed decisions worth knowing:
 * - Photos are downscaled to 224x224 on a canvas before becoming a tensor, so no
 *   multi-megabyte GPU allocation is made from a raw camera shot.
 * - Results are read with async data(), not blocking dataSync(), so the UI thread
 *   keeps running.
 */
export async function predictMangoDisease(
  model: tf.GraphModel,
  imgElement: HTMLImageElement,
): Promise<DiagnosisResult> {
  // 1. Downscale on the CPU canvas first. A 12MP photo (4000x3000) is 36 million
  //    floats; 224x224 is 150K, roughly 240x smaller.
  const smallCanvas = downscaleToCanvas(imgElement, 224);

  // 2. tf.tidy frees every temporary GPU tensor made inside it
  const outputTensor = tf.tidy(() => {
    // The canvas is already 224x224, so this is a small 3D tensor
    const tensor = tf.browser.fromPixels(smallCanvas);

    // Batch dimension gives [1, 224, 224, 3]. No manual normalization: the
    // MobileNetV3 graph rescales pixels in its own first layer.
    const batched = tensor.cast("float32").expandDims(0);

    return model.predict(batched) as tf.Tensor;
  });

  // 3. async data() keeps animations smooth; dataSync() would block the thread
  const results = await outputTensor.data();
  outputTensor.dispose();

  // Top two probabilities in one pass. The runner-up feeds the margin check.
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

  // Normalized Shannon entropy: 0 when one class takes everything, 1 when all
  // classes are equally likely. Dividing by log(number of classes) is what makes it
  // comparable to the threshold fitted in the training notebook.
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

  // Round for display only, once every check has run on the raw value.
  const confidence = Math.round(maxProb * 100) / 100;

  const accepted = meetsConfidence && meetsMargin && meetsEntropy;
  // Show every score during local development; sort copies so class indices stay intact.
  if (process.env.NODE_ENV === "development") {
    const ranked = Array.from(results, (probability, index) => ({
      className: CLASSES[index],
      probability,
    })).sort((a, b) => b.probability - a.probability);
    console.groupCollapsed(
      `Class probabilities (${accepted ? "accepted" : "rejected"})`,
    );
    console.table(
      ranked.map(({ className, probability }) => ({
        Class: className,
        Probability: `${(probability * 100).toFixed(2)}%`,
      })),
    );
    console.groupEnd();
  }
  if (!accepted) {
    console.log(
      `---Rejected: Raw PredictedDisease=${CLASSES[maxIndex]} confidence=${maxProb.toFixed(4)} margin=${margin.toFixed(4)} ` +
        `entropy=${normalizedEntropy.toFixed(4)}---`,
    );
  }

  const diseaseName = accepted ? CLASSES[maxIndex] : UNCERTAIN_LABEL;

  return {
    diseaseName,
    confidence,
  };
}

/**
 * Compresses a camera photo to a maximum of 1000px on its longest side, as WebP
 * where the browser supports it and JPEG where it does not.
 *
 * WebP at 75% quality is about 70-90 KB against 150-250 KB for JPEG at 80%,
 * which halves the upload time on 3G.
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

  // Try WebP first, around half the size of JPEG
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

/**
 * SHA-256 fingerprint of an image file, via the browser's Web Crypto API. Two
 * identical files hash the same, which is how a duplicate photo is caught
 * locally before it is ever saved.
 */
export { computeImageHash } from "@/lib/image-hash";

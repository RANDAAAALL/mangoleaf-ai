import * as tf from "@tensorflow/tfjs";
import { CLASSES, UNCERTAIN_LABEL } from "./constants";
import {
  createDiagnosticOperation,
  diagnosticErrorName,
  getDiagnosticsSnapshot,
  recordDiagnostic,
} from "@/lib/diagnostics";

export interface DiagnosisResult {
  diagnosedResultTabular: {
    Class: string;
    Probability: string;
  }[];
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
let inferencePending = false;
let initializationPending = false;

/** A recovery deadline for GPU warmup, independent of model asset downloads. */
export const MODEL_WARMUP_TIMEOUT_MS = 60_000;

export class WarmupTimeoutError extends Error {
  readonly code = "MODEL_WARMUP_TIMEOUT";

  constructor() {
    super("On-device model warmup exceeded its recovery deadline.");
    this.name = "WarmupTimeoutError";
  }
}

export class InitializationBusyError extends Error {
  readonly code = "INITIALIZATION_BUSY";

  constructor() {
    super("The previous on-device model warmup is still running.");
    this.name = "InitializationBusyError";
  }
}

export function isMangoInitializationPending(): boolean {
  return initializationPending;
}

export class InferenceBusyError extends Error {
  readonly code = "INFERENCE_BUSY";

  constructor() {
    super("The previous on-device prediction is still running.");
    this.name = "InferenceBusyError";
  }
}

/** An aborted caller does not cancel TensorFlow.js's underlying GPU read. */
export function isMangoInferencePending(): boolean {
  return inferencePending;
}

function recordRuntimePrecision(operation: string) {
  if (!getDiagnosticsSnapshot().enabled) return;
  try {
    const backend =
      typeof tf.getBackend === "function" ? tf.getBackend() : "unknown";
    if (backend === "webgl") {
      const float32Capable = tf.env().getBool("WEBGL_RENDER_FLOAT32_CAPABLE");
      const float32Enabled = tf.env().getBool("WEBGL_RENDER_FLOAT32_ENABLED");
      recordDiagnostic("inference.runtime", {
        operation,
        backend,
        textureBits: float32Enabled ? 32 : 16,
        float32Capable,
        float32Enabled,
      });
    } else {
      recordDiagnostic("inference.runtime", { operation, backend });
    }
  } catch {
    recordDiagnostic("inference.runtime", {
      operation,
      reason: "capability-unavailable",
    });
  }
}

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
  const operation = createDiagnosticOperation("model-config");
  const started = performance.now();
  recordDiagnostic("model.config.started", { operation });
  try {
    const response = await fetch("/model/model_config.json");
    if (!response.ok) {
      recordDiagnostic("model.config.fallback", {
        operation,
        reason: "response-unavailable",
        durationMs: Math.round(performance.now() - started),
      });
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
    recordDiagnostic("model.config.completed", {
      operation,
      durationMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    recordDiagnostic("model.config.fallback", {
      operation,
      reason: "unreadable",
      errorName: diagnosticErrorName(error),
      durationMs: Math.round(performance.now() - started),
    });
    console.log(
      "---model_config.json unreadable — using the 70% check only.---",
    );
  }
}

/** Reject a stalled caller while the original read retains all GPU resources. */
function warmMangoModel(model: tf.GraphModel): Promise<tf.GraphModel> {
  initializationPending = true;
  const started = performance.now();
  const diagnosticOperation = createDiagnosticOperation("warmup");
  recordDiagnostic("model.warmup.started", { operation: diagnosticOperation });
  let timeoutError: WarmupTimeoutError | null = null;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      timeoutError = new WarmupTimeoutError();
      recordDiagnostic("model.warmup.timeout", {
        operation: diagnosticOperation,
        durationMs: Math.round(performance.now() - started),
      });
      reject(timeoutError);
    }, MODEL_WARMUP_TIMEOUT_MS);

    const operation = (async () => {
      try {
        const warmupOutput = tf.tidy(() => {
          const dummyTensor = tf.zeros([1, 224, 224, 3]);
          return model.predict(dummyTensor) as tf.Tensor;
        });
        try {
          // predict() submits GPU work; readback confirms it has finished.
          await warmupOutput.data();
        } finally {
          warmupOutput.dispose();
        }
        // Driver/shader work can block timers. Never cache an overdue model.
        if (
          timeoutError ||
          performance.now() - started >= MODEL_WARMUP_TIMEOUT_MS
        ) {
          throw timeoutError ?? new WarmupTimeoutError();
        }
        cachedModel = model;
        recordDiagnostic("model.warmup.completed", {
          operation: diagnosticOperation,
          durationMs: Math.round(performance.now() - started),
        });
        return model;
      } catch (error) {
        recordDiagnostic("model.warmup.failed", {
          operation: diagnosticOperation,
          errorName: diagnosticErrorName(error),
          durationMs: Math.round(performance.now() - started),
        });
        model.dispose();
        throw error;
      } finally {
        clearTimeout(timer);
        initializationPending = false;
      }
    })();
    // Consume late success/failure after the caller's timeout. The operation
    // alone releases the output, graph, and initialization gate after readback.
    operation.then(resolve, reject);
  });
}

/**
 * Loads the TensorFlow.js Graph Model from the public directory and runs one
 * dummy prediction to compile the WebGL shaders up front. Cached at module level
 * so the load happens once.
 */
export async function loadMangoModel(): Promise<tf.GraphModel> {
  if (cachedModel) {
    recordDiagnostic("model.cache.reused");
    console.log("---Model already cached — returning instantly.---");
    return cachedModel;
  }

  // Stops a second load starting mid-flight, e.g. a React StrictMode double-mount.
  if (loadingPromise) {
    recordDiagnostic("model.load.joined");
    console.log("---Model load already in progress — awaiting...---");
    return loadingPromise;
  }
  if (initializationPending) {
    recordDiagnostic("model.load.blocked", {
      reason: "previous-warmup-pending",
    });
    throw new InitializationBusyError();
  }

  const operation = createDiagnosticOperation("model-load");
  const started = performance.now();
  recordDiagnostic("model.load.started", { operation });

  loadingPromise = (async () => {
    recordDiagnostic("model.engine.started", { operation });
    console.log("---Initializing TensorFlow.js engine...---");

    // Force 16-bit WebGL textures for the current release. Comment out the
    // active override below to restore TensorFlow.js capability selection.
    // Neither choice automatically retries a failed GPU allocation/readback.
    // tf.env().set("WEBGL_FORCE_F16_TEXTURES", false);
    tf.env().set("WEBGL_FORCE_F16_TEXTURES", true);

    await tf.ready();
    recordDiagnostic("model.engine.completed", {
      operation,
      backend:
        typeof tf.getBackend === "function" ? tf.getBackend() : "unknown",
      durationMs: Math.round(performance.now() - started),
    });

    if (typeof tf.getBackend === "function" && tf.getBackend() === "webgl") {
      const float32Capable = tf.env().getBool("WEBGL_RENDER_FLOAT32_CAPABLE");
      const float32Enabled = tf.env().getBool("WEBGL_RENDER_FLOAT32_ENABLED");
      recordDiagnostic("model.webgl.precision", {
        operation,
        textureBits: float32Enabled ? 32 : 16,
        float32Capable,
        float32Enabled,
      });
      console.info(
        `---WebGL texture precision: ${float32Enabled ? "32-bit" : "16-bit"}; ` +
          `32-bit capable=${float32Capable}.---`,
      );
    }

    // Fetched together, not one after the other. The config is only 567 bytes,
    // but on rural 3G a sequential request adds a round trip before the GPU
    // warmup can start. Nothing reads the thresholds until the first prediction,
    // so the order does not matter.
    const modelPath = "/model/model.json";
    const assetsStarted = performance.now();
    recordDiagnostic("model.assets.started", { operation });
    const [model] = await Promise.all([
      tf.loadGraphModel(modelPath).then((loaded) => {
        recordDiagnostic("model.assets.completed", {
          operation,
          durationMs: Math.round(performance.now() - assetsStarted),
        });
        return loaded;
      }),
      // Non-fatal on purpose: if this file is missing the classifier keeps the
      // confidence check and skips margin and entropy, so a config problem can
      // never block a scan.
      loadModelConfig(),
    ]);
    console.log("---Graph model JSON loaded from assets.---");

    // Compile the shaders now, so the first real scan is not the one that pays.
    console.log("---Warming up GPU WebGL shaders...---");
    const warmedModel = await warmMangoModel(model);
    console.log("---GPU model warmup complete.---");

    return warmedModel;
  })();

  try {
    const model = await loadingPromise;
    recordDiagnostic("model.load.completed", {
      operation,
      durationMs: Math.round(performance.now() - started),
    });
    return model;
  } catch (error) {
    recordDiagnostic("model.load.failed", {
      operation,
      errorName: diagnosticErrorName(error),
      durationMs: Math.round(performance.now() - started),
    });
    throw error;
  } finally {
    // A failed load must be retryable; concurrent callers still share this load.
    loadingPromise = null;
  }
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
 * - Results use async data(), so GPU readback can yield to the UI. Canvas work
 *   and predict() shader submission still run synchronously on the main thread.
 */
export async function predictMangoDisease(
  model: tf.GraphModel,
  imgElement: HTMLImageElement,
  signal?: AbortSignal,
): Promise<DiagnosisResult> {
  signal?.throwIfAborted();
  if (inferencePending) {
    recordDiagnostic("inference.blocked", { reason: "previous-read-pending" });
    throw new InferenceBusyError();
  }

  const diagnosticOperation = createDiagnosticOperation("inference");
  recordDiagnostic("inference.started", { operation: diagnosticOperation });
  recordRuntimePrecision(diagnosticOperation);
  inferencePending = true;
  const operation = runPrediction(
    model,
    imgElement,
    signal,
    diagnosticOperation,
  ).finally(() => {
    inferencePending = false;
    recordDiagnostic("inference.resources-released", {
      operation: diagnosticOperation,
    });
  });
  if (!signal) return operation;

  // Cancel only the caller's wait. Keep the tensor and the busy gate until the
  // original read settles, and handle that late settlement after cancellation.
  return new Promise<DiagnosisResult>((resolve, reject) => {
    const onAbort = () => {
      recordDiagnostic("inference.caller-cancelled", {
        operation: diagnosticOperation,
        reason: "underlying-read-not-cancelled",
      });
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason);
    };
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then(
      (result) => {
        signal.removeEventListener("abort", onAbort);
        resolve(result);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
    if (signal.aborted) onAbort();
  });
}

async function runPrediction(
  model: tf.GraphModel,
  imgElement: HTMLImageElement,
  signal?: AbortSignal,
  diagnosticOperation?: string,
): Promise<DiagnosisResult> {
  const started = performance.now();
  // 1. Downscale on the CPU canvas first. A 12MP photo (4000x3000) is 36 million
  //    floats; 224x224 is 150K, roughly 240x smaller.
  const smallCanvas = downscaleToCanvas(imgElement, 224);
  recordDiagnostic("inference.canvas.completed", {
    operation: diagnosticOperation ?? "unknown",
  });

  // 2. tf.tidy frees every temporary GPU tensor made inside it
  const outputTensor = tf.tidy(() => {
    // The canvas is already 224x224, so this is a small 3D tensor
    const tensor = tf.browser.fromPixels(smallCanvas);

    // Batch dimension gives [1, 224, 224, 3]. No manual normalization: the
    // MobileNetV3 graph rescales pixels in its own first layer.
    const batched = tensor.cast("float32").expandDims(0);

    return model.predict(batched) as tf.Tensor;
  });
  recordDiagnostic("inference.submitted", {
    operation: diagnosticOperation ?? "unknown",
  });

  // 3. Release the retained output after readback succeeds or fails. Aborting
  //    the caller must not dispose a tensor while the GPU still owns its read.
  let results: Awaited<ReturnType<tf.Tensor["data"]>>;
  try {
    results = await outputTensor.data();
    recordDiagnostic("inference.readback.completed", {
      operation: diagnosticOperation ?? "unknown",
      durationMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    recordDiagnostic("inference.readback.failed", {
      operation: diagnosticOperation ?? "unknown",
      errorName: diagnosticErrorName(error),
      durationMs: Math.round(performance.now() - started),
    });
    throw error;
  } finally {
    outputTensor.dispose();
  }
  signal?.throwIfAborted();

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

  // Preserve the raw score in saved reports; percentage formatting belongs in the UI.
  const confidence = maxProb;

  const accepted = meetsConfidence && meetsMargin && meetsEntropy;
  // Keep this table in development and production for technical review in DevTools.
  // Sort copies so class order and raw scores used by rejection rules stay unchanged.
  const ranked = Array.from(results, (probability, index) => ({
    className: CLASSES[index],
    probability,
  })).sort((a, b) => b.probability - a.probability);
  console.groupCollapsed(
    `Class probabilities (${accepted ? "accepted" : "rejected"})`,
  );
  // Round only the printed percentages; these are model scores, not accuracy.
  console.table(
    ranked.map(({ className, probability }) => ({
      Class: className,
      Probability: `${(probability * 100).toFixed(2)}%`,
    })),
  );

  // Format a copy for display only;
  // the raw scores and rejection checks above remain unchanged.
  const diagnosedResultTabular = ranked.map(({ className, probability }) => ({
    Class: className,
    Probability: `${(probability * 100).toFixed(2)}%`,
  }));

  console.groupEnd();
  // if (!accepted) {
  console.log(
    `---${accepted ? "Accepted" : "Rejected"}: Raw PredictedDisease=${CLASSES[maxIndex]} confidence=${maxProb.toFixed(4)} margin=${margin.toFixed(4)} ` +
      `entropy=${normalizedEntropy.toFixed(4)}---`,
  );
  // }

  const diseaseName = accepted ? CLASSES[maxIndex] : UNCERTAIN_LABEL;
  recordDiagnostic("inference.completed", {
    operation: diagnosticOperation ?? "unknown",
    durationMs: Math.round(performance.now() - started),
  });

  return {
    diagnosedResultTabular,
    diseaseName,
    confidence,
  };
}

// Existing callers can keep importing this helper here. New callers should use
// image-storage directly so compression does not pull in the TensorFlow.js engine.
export { compressImageForStorage } from "@/lib/image-storage";

/**
 * SHA-256 fingerprint of an image file, via the browser's Web Crypto API. Two
 * identical files hash the same, which is how a duplicate photo is caught
 * locally before it is ever saved.
 */
export { computeImageHash } from "@/lib/image-hash";

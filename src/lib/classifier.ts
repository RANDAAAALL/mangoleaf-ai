import * as tf from "@tensorflow/tfjs";
import { CLASSES } from "./constants";

export interface DiagnosisResult {
  diseaseName: string;
  confidence: number;
}

/**
 * Loads the compiled TensorFlow.js Graph Model from the public directory
 * and runs a dummy prediction warmup to compile WebGL shaders in the background.
 */
export async function loadMangoModel(): Promise<tf.GraphModel> {
  console.log("🤖 Initializing TensorFlow.js engine...");
  await tf.ready();
  
  const modelPath = "/model/model.json";
  const model = await tf.loadGraphModel(modelPath);
  console.log("💾 Graph model JSON loaded from assets.");

  // Run a dummy warmup to force compile WebGL shaders on device startup
  console.log("⚡ Warming up GPU WebGL shaders...");
  tf.tidy(() => {
    const dummyTensor = tf.zeros([1, 224, 224, 3]);
    model.predict(dummyTensor);
  });
  console.log("✨ GPU model warmup complete.");

  return model;
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
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d")!;
  // drawImage handles bilinear scaling natively in the browser engine
  ctx.drawImage(imgElement, 0, 0, targetSize, targetSize);
  return canvas;
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

  const confidence = parseFloat(maxProb.toFixed(2));

  // Enforce the 70% threshold check from capstone specifications
  const diseaseName = confidence >= 0.70
    ? CLASSES[maxIndex]
    : "Uncertain / Unrecognized";

  return {
    diseaseName,
    confidence
  };
}

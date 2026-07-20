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
 * Preprocesses an image element and performs on-device WebGL inference
 * using the provided Graph Model. Enforces the 70% confidence threshold.
 */
export async function predictMangoDisease(
  model: tf.GraphModel,
  imgElement: HTMLImageElement
): Promise<DiagnosisResult> {
  // Execute calculations in tf.tidy to automatically purge temporary tensors from WebGL memory
  const results = tf.tidy(() => {
    // 1. Convert pixels into a raw 3D tensor
    const tensor = tf.browser.fromPixels(imgElement);

    // 2. Resize to 224x224 (required by MobileNetV3 input shape)
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);

    // 3. Expand dimensions to add batch size [1, 224, 224, 3] and cast
    const batched = resized.cast("float32").expandDims(0);

    // 4. Run prediction
    const prediction = model.predict(batched) as tf.Tensor;
    return prediction.dataSync(); // Returns probability scores array
  });

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

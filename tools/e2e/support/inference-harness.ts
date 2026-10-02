import * as tf from "@tensorflow/tfjs";
import {
  loadMangoModel,
  predictMangoDisease,
} from "../../../src/lib/classifier";
import {
  CLASSES,
  modelVersion,
  UNCERTAIN_LABEL,
} from "../../../src/lib/constants";

async function initialize() {
  const model = await loadMangoModel();
  const config = await (await fetch("/model/model_config.json")).json();
  const predict = model.predict.bind(model);
  let captured: Promise<number[]>;
  // Observe the same output consumed by the production classifier; no second inference.
  model.predict = (...args: Parameters<typeof predict>) => {
    const output = predict(...args) as tf.Tensor;
    captured = output.data().then((values) => Array.from(values));
    return output;
  };
  return {
    metadata: {
      modelVersion,
      modelAssetVersion: config.modelVersion,
      tfjs: tf.version.tfjs,
      backend: tf.getBackend(),
      forcedFloat16: tf.env().getBool("WEBGL_FORCE_F16_TEXTURES"),
      renderer: (() => {
        const gl = document.createElement("canvas").getContext("webgl");
        const info = gl?.getExtension("WEBGL_debug_renderer_info");
        return info
          ? gl?.getParameter(info.UNMASKED_RENDERER_WEBGL)
          : "unavailable";
      })(),
      thresholds: config.thresholds,
      classes: CLASSES,
    },
    async predict(url: string) {
      const image = new Image();
      image.src = url;
      await image.decode();
      const started = performance.now();
      const result = await predictMangoDisease(model, image);
      const probabilities = await captured;
      const ranked = [...probabilities].sort((a, b) => b - a);
      const confidence = ranked[0];
      const margin = confidence - ranked[1];
      const entropy =
        -probabilities.reduce(
          (sum, p) => sum + (p > 0 ? p * Math.log(p) : 0),
          0,
        ) / Math.log(probabilities.length);
      const failedGates = [
        ...(confidence < 0.7 ? ["confidence"] : []),
        ...(typeof config.thresholds.marginThreshold === "number" &&
        margin < config.thresholds.marginThreshold
          ? ["margin"]
          : []),
        ...(typeof config.thresholds.entropyThreshold === "number" &&
        entropy > config.thresholds.entropyThreshold
          ? ["entropy"]
          : []),
      ];
      return {
        ...result,
        rawClass: CLASSES[probabilities.indexOf(confidence)],
        rawConfidence: confidence,
        margin,
        entropy,
        probabilities,
        failedGates,
        accepted: result.diseaseName !== UNCERTAIN_LABEL,
        durationMs: performance.now() - started,
        tensors: tf.memory().numTensors,
      };
    },
  };
}

export type InferenceHarness = Awaited<ReturnType<typeof initialize>>;
declare global {
  interface Window {
    mangoTest: InferenceHarness;
    mangoTestError?: string;
  }
}
initialize()
  .then((harness) => {
    window.mangoTest = harness;
  })
  .catch((error) => {
    window.mangoTestError = String(error);
    console.error(error);
  });

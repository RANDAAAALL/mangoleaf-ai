// Label for the model assets in public/model/. Bump it whenever those files are
// replaced by a retraining cycle. See docs/versions/AI_MODEL_VERSIONING.md.
// Adopted V4.5.0 OE model. See docs/versions/AI_MODEL_VERSIONING.md.
export const modelVersion = "v4.5.0";

// The 7 Carabao Mango classes, in the order the v4 through v4.5.0 exports use.
// CLASSES[i] must name the class the model scores at
// output position i, so reordering this array would mislabel every prediction.
export const CLASSES = [
  "Anthracnose",
  "Bacterial Black Spot",
  "Bacterial Canker",
  "Healthy Fruit",
  "Healthy Leaf",
  "Mango Scab",
  "Sooty Mold",
];

// Written into ScanRecord.disease_name when a scan fails the confidence gate
// or any optional configured gate in classifier.ts. It is not a class, so any
// UI that expects a real prediction must check for it first.
export const UNCERTAIN_LABEL = "Uncertain / Unrecognized";

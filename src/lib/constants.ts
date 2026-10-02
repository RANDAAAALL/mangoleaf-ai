// Label for the model assets in public/model/. Bump it whenever those files are
// replaced by a retraining cycle. See docs/MODEL_VERSIONING.md.
// Adopted seven-class v4.3.0 Combined model. Training provenance stays in its saved run.
export const modelVersion = "v4.3.0";

// The 7 Carabao Mango classes, in the order the v4 through v4.3.0 exports use.
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

// Written into ScanRecord.disease_name when a scan fails any of the three
// rejection gates in classifier.ts: confidence, margin, or entropy. It is not a
// class, so any UI that expects a real prediction must check for it first.
export const UNCERTAIN_LABEL = "Uncertain / Unrecognized";

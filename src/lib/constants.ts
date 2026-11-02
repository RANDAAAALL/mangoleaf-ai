// Label for the model assets in public/model/. Bump it whenever those files are
// replaced by a retraining cycle. See docs/versions/AI_MODEL_VERSIONING.md.
// V5.1.0 adopted November 3; production publication remains a separate step.
export const modelVersion = "v5.1.0";

// The seven mango classes, in the classifier export's output order.
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

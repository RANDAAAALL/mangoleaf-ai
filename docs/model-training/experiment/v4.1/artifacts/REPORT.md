# MangoLeaf AI V4.1: four-arm threshold experiment

Experimental candidate. No app model was changed or deployed.
Training run: `/content/drive/MyDrive/mangoleaf_experiments/v4.1/training/v4-1-training-20260924T182154Z-2dcd4023`
Selection SHA-256: `74c7deebf705bf424d745ed7bb62b68fb39d60a5a343345f77b87fa56b05e3b7`
Evaluation SHA-256: `514f619f8a6e06f5f83c0d9ddcde5985fd21346a341ef0c9c5c10632432dc1b8`

Gates were fitted per arm on mango validation and old OOD tune, then all four selections were frozen before test and report inference.
Old mango test and old OOD report results are exploratory because those collections were used in earlier development.
New OOD photos were a separate report-only collection in this run. Collector history remains as recorded below.

Counts: validation 391, mango test 393, old OOD tune 84, old OOD report 84, new OOD uploaded 32, new OOD retained 32.
New OOD scope review: Checked all numbered photos; all are non-mango plants.
Collection history: User supplied a separately uploaded new OOD folder; prior use outside this run is unverified.

| Arm | Gate | Test correct accepted | Test wrong accepted | Mango rejected | Old OOD accepted | New OOD accepted |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| control | confidence_only (infeasible) | 373/393 | 4 | 16 | 31/84 | 7/32 |
| background | selected | 373/393 | 3 | 17 | 26/84 | 1/32 |
| lighting | selected | 373/393 | 3 | 17 | 21/84 | 4/32 |
| combined | selected | 373/393 | 3 | 17 | 26/84 | 1/32 |

Confidence-only and selected-gate metrics, seven-class per-class precision/recall/F1, class confusion, and full-precision per-image probabilities are in `evaluation.json` and `arms/` CSV files.
Paired per-image CSVs show where an arm changed the decision on the same photo.
Validation retention measures accepted images, including accepted wrong diagnoses; it is not accuracy.
Background replacement does not train an explicit non-mango class. No field mango accuracy or TensorFlow.js browser parity was measured here.
If new OOD scores guide arm choice, collect another untouched OOD set for final independent evaluation.
Expert-labeled mango field images are needed to evaluate harsh-light disease diagnosis.

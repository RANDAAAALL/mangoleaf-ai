# MangoLeaf AI V4.1.1: four-arm threshold experiment

Experimental candidate. No app model was changed or deployed.
Training run: `/content/drive/MyDrive/mangoleaf_experiments/v4.1.1/training/v4-1-1-training-20260928T043539Z-37576200`
Selection SHA-256: `58b7316f426c320912df516973ce58c3dad7ae49d2c2522756d3d405b80bf212`
Evaluation SHA-256: `c18db308c8af22e26fa0a229d2363bab59873ab842e6bc76b5878b5d44e7fb8b`

Gates were fitted per arm on mango validation and old OOD tune, then all four selections were frozen before test and report inference.
Old mango test and old OOD report results are exploratory because those collections were used in earlier development.
The V4.1 new OOD photos are reused as a report-only collection in this run; they are not fresh independent evidence. Collection history appears below.

Counts: validation 391, mango test 393, old OOD tune 84, old OOD report 84, new OOD uploaded 32, new OOD retained 32.
New OOD scope review: Checked all numbered photos; all are non-mango plants
Collection history: This is the V4.1 new OOD collection, already reported in V4.1. Record any later reuse or replacement here.

| Arm | Gate | Test correct accepted | Test wrong accepted | Mango rejected | Old OOD accepted | New OOD accepted |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| control | confidence_only (infeasible) | 373/393 | 4 | 16 | 32/84 | 7/32 |
| background | selected | 373/393 | 3 | 17 | 26/84 | 1/32 |
| lighting | selected | 373/393 | 3 | 17 | 21/84 | 4/32 |
| combined | selected | 373/393 | 3 | 17 | 26/84 | 1/32 |

Confidence-only and selected-gate metrics, seven-class per-class precision/recall/F1, class confusion, and full-precision per-image probabilities are in `evaluation.json` and `arms/` CSV files.
Paired per-image CSVs show where an arm changed the decision on the same photo.
Validation retention measures accepted images, including accepted wrong diagnoses; it is not accuracy.
Background replacement does not train an explicit non-mango class. No field mango accuracy or TensorFlow.js browser parity was measured here.
If new OOD scores guide arm choice, collect another untouched OOD set for final independent evaluation.
Expert-labeled mango field images are needed to evaluate harsh-light disease diagnosis.

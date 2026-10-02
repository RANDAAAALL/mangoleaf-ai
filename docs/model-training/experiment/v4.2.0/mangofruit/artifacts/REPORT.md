# Mango Fruit V4.2.0: single-model threshold experiment

Experimental candidate. No app model was changed or deployed.
Training run: `/content/drive/MyDrive/mangoleaf_experiments/v4.2.0/training/mangofruit/v4-2-0-mangofruit-training-20260928T164258Z-a4e1abae`
Selection SHA-256: `8aee54a3d019a3c0e9b6d711aa0cce09e65ba92b6fad00df13751566cd18c33e`
Evaluation SHA-256: `8215f0bdd5ada95860ba1e12d80bdf41131576a6acc48de013d0cabb8950c3cc`

Gate was fitted on mango validation and old OOD tune, then frozen before test and report inference.
Old mango test and old OOD report results are exploratory because those collections were used in earlier development.
The 32 V4.1 new OOD photos are reused as a report-only collection here; they are not fresh independent evidence. Collection history appears below.

Counts: validation 94, mango test 96, old OOD tune 84, old OOD report 84, new OOD uploaded 32, new OOD retained 32.
New OOD scope review: Reviewed all the images.
Collection history: These 32 OOD photos were already reported in V4.1/V4.1.1; V4.2.0 reuse is exploratory, not independent.

| Model | Gate | Test correct accepted | Test wrong accepted | Mango rejected | Old OOD accepted | New OOD accepted |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| combined | confidence_only (infeasible) | 72/96 | 0 | 24 | 64/84 | 23/32 |

Confidence-only and selected-gate metrics, 3-class per-class precision/recall/F1, class confusion, and full-precision per-image probabilities are in `evaluation.json` and `arms/` CSV files.
Full-precision per-image CSVs record every decision and rejection reason.
Validation retention measures accepted images, including accepted wrong diagnoses; it is not accuracy.
Background replacement and local light do not train an explicit non-mango class. No field mango accuracy or TensorFlow.js browser parity was measured here.
If reused OOD scores guide model choice, collect another untouched OOD set for final independent evaluation.
Expert-labeled mango field images are needed to evaluate harsh-light disease diagnosis.

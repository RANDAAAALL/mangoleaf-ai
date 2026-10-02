# Mango Leaf V4.2.0: single-model threshold experiment

Experimental candidate. No app model was changed or deployed.
Training run: `/content/drive/MyDrive/mangoleaf_experiments/v4.2.0/training/mangoleaf/v4-2-0-mangoleaf-training-20260928T152551Z-a88e1405`
Selection SHA-256: `e00b6e631f937a63b762e96c3699f0cdb535a7c39db81b7f3c7bb75946cb0e8d`
Evaluation SHA-256: `e20ff505724000992d43e7d6293a78e3432ab0f32c088dc0f6013e0b5270f3fe`

Gate was fitted on mango validation and old OOD tune, then frozen before test and report inference.
Old mango test and old OOD report results are exploratory because those collections were used in earlier development.
The 32 V4.1 new OOD photos are reused as a report-only collection here; they are not fresh independent evidence. Collection history appears below.

Counts: validation 297, mango test 297, old OOD tune 84, old OOD report 84, new OOD uploaded 32, new OOD retained 32.
New OOD scope review: Done checked all the indexed photo
Collection history: These 32 OOD photos were already reported in V4.1/V4.1.1; V4.2.0 reuse is exploratory, not independent.

| Model | Gate | Test correct accepted | Test wrong accepted | Mango rejected | Old OOD accepted | New OOD accepted |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| combined | selected | 295/297 | 0 | 2 | 36/84 | 8/32 |

Confidence-only and selected-gate metrics, 4-class per-class precision/recall/F1, class confusion, and full-precision per-image probabilities are in `evaluation.json` and `arms/` CSV files.
Full-precision per-image CSVs record every decision and rejection reason.
Validation retention measures accepted images, including accepted wrong diagnoses; it is not accuracy.
Background replacement and local light do not train an explicit non-mango class. No field mango accuracy or TensorFlow.js browser parity was measured here.
If reused OOD scores guide model choice, collect another untouched OOD set for final independent evaluation.
Expert-labeled mango field images are needed to evaluate harsh-light disease diagnosis.

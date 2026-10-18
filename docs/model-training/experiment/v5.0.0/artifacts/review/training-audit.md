# V5.0.0 training evidence audit ? October 19, 2026

## Outcome

The supplied sealed run is internally consistent and suitable for a reversible local candidate test. This audit does not establish that V5.0.0 is better than V4.5.0 or approve adoption/deployment. No source files, notebook outputs, model weights, or scientific settings were changed.

Source: `C:\Users\My Pc\Desktop\workspace\capstone\model\brain\v5.0.0\training\v5-0-0-oe-finetune-20261018T153838Z-5a6fce69`.

The companion `training-audit.json` contains exact hashes, recomputed metrics, serialized signatures, full per-class metrics, and the preserved dependency findings. Review used JSON, CSV, NumPy and ZIP parsing. It did not execute supplied Python/notebook cells or deserialize/run Keras models.

## Integrity and training

All 86 files bound by `experiment_complete.json` match SHA-256 and length. Frozen inputs (44 files), training state (5), calibration (4), evaluation (2), export (5), and figure manifest (7) also pass. The receipt SHA-256 is `b16c880e9ba571d19a85898634daa54d73cb5270c5df424009c3674471e722b2`. Canonical plan and manifest hashes match the frozen run.

Five epochs are the recorded fine-tuning plan, initialized from the exact uncalibrated V4.5.0 stage-two weights with fresh Adam. Learning rate is 1e-5, batch size 16, OE loss weight 0.5, seed 42. All 46 nested batch-normalization layers are frozen. The model uses serial completed CPU augmentation batches with synchronized compiled training steps. Epoch five is the minimum clean mango validation loss, 0.0759361014, below the epoch-zero parent baseline 0.0813713744. Epoch-five validation accuracy is 383/398 = 96.23%. Validation accuracy is not test or field accuracy.

All 2,511 unique OE photos are exposed, with 9,277 successfully consumed OE examples. These include the original 2,011 approved OE photos and 500 previously evaluated OOD photos. Those old 500 are now training data and cannot serve as V5 unseen reporting evidence.

## Membership and leakage checks

The exact V4.5.0 mango membership, labels and subsets are preserved: 1,854 training, 398 validation, 397 test, total 2,649. No byte hash, decoded RGB hash or recorded mango group crosses subsets; no byte/decoded overlap exists between mango and OE. Independently recomputed pHash distance <=5 checks produce zero flags across mango subsets and mango versus OE.

All historical source/capture group fields are blank. These checks verify recorded metadata and rule out those detected overlaps; they do not establish full source/capture independence. Original training image pixels are absent from this supplied run folder, so this audit does not freshly hash the source photos. The 397 test images have historical research use and remain an exploratory paired reference.

## Calibration and diagnosis

Temperature 0.909599105656865 is fitted on the 398 mango validation rows, with no OE/OOD fitting and one recorded fold into the classifier head. Recomputed negative log-likelihood is 0.07593608955 before and 0.07553699546 after. `softmax(logits/T)` agrees with saved calibrated probabilities within 4.38e-7 maximum absolute difference; top classes are unchanged. Do not divide predictions by temperature again in the app.

| Outcome on the same 397 historical mango test images | V4.5 confidence-only | V5 confidence-only |
| --- | ---: | ---: |
| Raw correct | 384 (96.73%) | 383 (96.47%) |
| Correct accepted / all inputs | 377 (94.96%) | 377 (94.96%) |
| Wrong accepted | 12 | 12 |
| Rejected mango inputs | 8 | 8 |
| Accepted-only accuracy | 377/389 (96.92%) | 377/389 (96.92%) |

The fixed gate is confidence >=0.70, with margin and entropy disabled. All 397 saved CSV rows pass finite probability, sum, maximum confidence, argmax and gate checks. Recomputed raw and gated confusion matrices match saved JSON exactly. V5 raw macro F1 is 95.10%; rejection-aware macro F1 is 94.05%.

Nine black-spot photos are accepted as scab, two scab photos as black spot, and one sooty-mold photo as anthracnose. Black spot has 32/45 correct accepted diagnoses; scab has 30/34. V5 has no aggregate confidence-only advantage on these inputs. The separate evaluation audit handles exact paired outcome changes and new OOD results; OOD rates from different pools must not be treated as a matched ranking.

## Export and illustrations

The exported graph is TensorFlow.js graph-model generated from TF2.19 with converter4.22.0. Input is float32 `[N,224,224,3]`, output float32 `[N,7]`, matching the fixed seven-class order. There are 212 weight specifications (199 float32, 13 int32); three shards total 11,886,412 bytes, exactly the expected byte count. No quantization metadata or Keras Lambda layer appears. The five files in `candidate_model.zip` match `tfjs_model/` byte for byte.

Graph SHA-256: `b3e3ae0550f6f2dcb7990aad3e042e385b465315c92c8031dbc29c7750f7bbc8`. Calibrated Keras SHA-256: `4e124aa15875e180736e818732a0e899483caaf9b71e8640ad44a1308b53dc1f`.

The seven original figure files are hash-bound and should be copied together under `figures/training/`. Grad-CAM targets the true class and is a validation illustration, not proof of diagnosis. The selected healthy-leaf illustration remains predicted anthracnose. Actual browser/Keras numerical agreement, phone behavior, performance and field accuracy remain separate checks.

## Preserved dependency findings

The historical training dependency audit reports no vulnerability findings. The provider-wide pip compatibility check returns 1: missing Jedi; Colab Requests version mismatch; Gradio/Pillow, Numba/NumPy and sklearn-compat/scikit-learn version conflicts remain visible.

The isolated converter audit is explicitly **unresolved**, with setuptools81.0.0 (`PYSEC-2026-3447` / `GHSA-h35f-9h28-mq5c`) and wheel0.45.1 (`CVE-2026-24049` / `GHSA-8rrh-rw8j-w5fx`). Its saved operation review allowed conversion because affected source-distribution publishing and wheel permission-unpack operations were absent. That historical allowance does not resolve the vulnerabilities. These are preserved records, not current installation advice or a fresh security assessment; this audit did not execute that environment.

## Copy and rollback recommendations

Copy original assets without moving or editing the source run. Preserve original receipts and historical statuses; the later OOD completion has its own record. A selected repository archive should list omitted large SavedModel/Keras/probe files and map copied paths/hashes rather than altering receipts to imply a complete archive.

Before replacing `public/model/`, preserve all five V4.5.0 model files plus the active version label and gate configuration with hashes. Copy the five V5 TFJS files as one coherent candidate bundle, and update the displayed version consistently. Keep `model-v5.0.0-candidate` and experimental status until explicit adoption. Rollback must restore both model assets and version/configuration identity. Retain completed notebooks with their original outputs.

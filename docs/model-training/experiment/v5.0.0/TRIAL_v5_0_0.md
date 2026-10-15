# V5.0.0 Outlier Exposure fine-tuning experiment

**October 16, 2026 status:** V5.0.0 is untrained and on standby. V4.5.0 is the adopted repository model with confidence-only rejection at 0.70. This guide remains preparation for a future experiment.

## Status and scope, October 15, 2026

**Prepared experimental workflow; not trained, evaluated, adopted, or deployed.** The [fine-tuning notebook](../../../../notebooks/experiment/v5.0.0/MangoLeaf_AI_OE_Fine_Tuning_v5_0_0.ipynb) and its [Python helper](../../../../notebooks/experiment/v5.0.0/v5_workflow.py) prepare a new candidate from the completed V4.5.0 training run. The optional [later OOD evaluation notebook](../../../../notebooks/experiment/v5.0.0/MangoLeaf_AI_Evaluate_v5_0_0.ipynb) evaluates a sealed V5.0.0 handoff when fresh unsupported photos become available, without retraining. Upload the helper with whichever notebook you run. This preparation does not replace `public/model/`, change the application/model labels, or update existing application inference code.

The confirmed scope keeps the original seven classes and all V4.5.0 mango membership: **1,854 training, 398 validation, and 397 test photos**. It expands only the approved Outlier Exposure (OE) pool. The roughly 9.4k mango collection discussed separately is not an input to this experiment.

V5.0.0 is a major model candidate under the [dataset-expansion version rule](../../../versions/AI_MODEL_VERSIONING.md#model-versions). Its label does not imply higher accuracy. The application release version is independent.

## What the shortcut means

Rebuild the matching MobileNetV3-Large classifier, load the parent's **uncalibrated** `stage2_best.weights.h5`, and fine-tune with mango training photos and the expanded OE pool. This preserves learned weights instead of repeating the original ImageNet-initialized five-plus-ten-epoch training schedule.

The default new attempt uses **five fine-tuning epochs, learning rate 0.00001, batch size 16, OE loss weight 0.5, seed 42, a fresh Adam optimizer, and frozen BatchNormalization layers**. It selects the checkpoint with the lowest clean, unweighted mango validation loss, including the unmodified parent's epoch-zero baseline. If no new epoch improves that validation loss, the selected weights remain the parent weights; the experiment must report that outcome rather than assume improvement. These are starting research settings, not a guaranteed minimum duration or a proven optimum. Changes require a new frozen attempt rather than editing a started run.

This is a **warm start**, not an exact resume of the old optimizer or epoch counter. A weights-only checkpoint does not provide the original optimizer state. Training uses the same seven-class architecture, full-photo RGB 224 by 224 preprocessing, mango augmentation, balanced mango training weights, and uniform-target OE objective. OE does not create an eighth class. See the [Keras fine-tuning guide](https://keras.io/guides/transfer_learning/) for low-learning-rate and BatchNormalization considerations.

Do not load `model_calibrated.keras`, browser shards, or an already temperature-folded classifier as the training parent. Reusing a folded classifier would change the starting logits and risk applying calibration twice.

## Drive inputs and preservation

The second account can run Colab against the files already present in its actual My Drive. No download, extraction, or re-upload of the V4.5.0 run is required.

The known parent is:

```text
MyDrive/mangoleaf_experiments/v4.5.0/training/
  v4-5-0-training-20261011T063913Z-40b7b0fe/
```

Its required material includes the original `dataset/` split photos, `input_manifest.json`, `class_names.json`, `example_selection.json`, approved `oe_dataset/` photos and OE manifests, the training plan, frozen inputs, and completion receipt. The required stage-two checkpoint SHA-256 is:

```text
ac7337a69ceed1ac1279072a4605fb47717949cc6a7ede8c725bb214ddb663ad
```

Select the matching completed V4.5.0 threshold-fitting run when importing the old 500-photo review. The supplied run identity is `v4-5-0-thresholds-20261011T171525Z-e488eb05`. For this purpose, access to these five unchanged files is enough; there is no need to duplicate its entire model/contact-sheet collection:

```text
threshold_fitting_complete.json
evaluation_inputs.json
ood_inventory.json
ood_review.csv
similarity_review.csv
```

Share the old review folder or a five-file byte-identical bundle from the third account with the second account and add an explicit My Drive shortcut when needed. Set `PARENT_THRESHOLD_RUN` to its actual selected path. The original 500 photos are read separately from `OLD_OOD`; the review bundle does not replace them. The notebook stops before creating a new run while `PARENT_THRESHOLD_RUN` is unset, rather than forcing the user to redo all 500 decisions. Inspect the notebook's selected/resolved input paths. Keep output in the running account's actual My Drive, not a shared output shortcut.

The old unsupported-photo folder remains an input. **Do not manually move all 500 files into the raw OE folder.** The workflow merges reviewed identities, verifies content hashes, and writes a new approved manifest. It must not change the parent training run, threshold-fitting run, original review CSVs, or original photos.

New runs live separately under `MyDrive/mangoleaf_experiments/v5.0.0/`, with a unique attempt identity:

```text
v5.0.0/
  training/v5-0-0-oe-finetune-<timestamp>-<unique-id>/
    source_provenance.json, input_manifest.json, plan.json, frozen_inputs.json
    legacy_review/, review CSVs, and targeted previews
    fine_tuned_best.weights.h5, oe_exposure.json, training_history.json
    model_selected.keras, model_calibrated.keras, temperature.json
    evaluation.json, figures/, figure_manifest.json
    tfjs_model/, candidate_model.zip, experiment_complete.json
  evaluation/v5-0-0-report-<timestamp>-<unique-id>/
    review CSVs, inventory.json, reporting_lock.json
    ood_report_predictions.csv, evaluation.json, reporting_complete.json
```

This is the intended output layout, not evidence that those runs have occurred. Parent photos are referenced in place rather than copied into another full dataset. Preserve the exact output path, parent input folders, helper/notebook pair, and completed notebook copy. A failed or interrupted attempt remains evidence; do not delete its start/freeze markers to force a restart.

## Running the notebooks

Upload the current matching helper to the Colab Files panel as `/content/v5_workflow.py`, then open the corresponding notebook. Both notebooks verify the helper SHA-256 before installation. Uploading only the notebook, or mixing a helper from a different revision, stops before execution.

### Main fine-tuning notebook

Use the second account with a Python 3.11/3.12 GPU runtime. GPU availability is not guaranteed by an account subscription.

| Steps | Action and expected boundary                                                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–2   | Mount Drive, install explicit packages, restart the session, rerun Step 1, then audit the actual dependency closure and GPU operation. Installation requires a restart; rerunning Step 2 in the installing process is refused.                   |
| 3     | Verify `PARENT_RUN` and `OLD_OOD`, set the required `PARENT_THRESHOLD_RUN`, and optionally set `FRESH_OOD`. Keep `OUTPUT_ROOT` under this account's actual `mangoleaf_experiments/v5.0.0/training`. Creating a run again creates a new identity. |
| 4–5   | Verify original photo identities/splits, import matching old review decisions, inspect only new flags and any new reporting photos, then set the approval flag with truthful notes.                                                              |
| 6–7   | Pass the converter preflight before fitting, load the parent weights, inspect augmentation previews, then freeze reviewed inputs/settings.                                                                                                       |
| 8–9   | Fine-tune with a fresh optimizer, select by clean validation loss, then fit and fold a fresh validation-only temperature once.                                                                                                                   |
| 10–11 | Evaluate the fixed confidence rule, save mango predictions and any available fresh OOD report, then create new training, metric, and Grad-CAM figures.                                                                                           |
| 12–13 | Export the experimental browser bundle and seal the run. Without fresh OOD, the receipt explicitly records a training handoff with OOD evaluation pending.                                                                                       |

Leave `FRESH_OOD=None` when a genuinely unseen reporting collection does not yet exist. Do not insert the old 500 there. Each training epoch processes all 1,854 mango training photos; a continuous shuffled OE iterator carries remaining photos across epochs. `oe_exposure.json` records actual exposure and selected-checkpoint coverage, including zero new exposure when the parent epoch-zero checkpoint is retained.

### Later OOD evaluation notebook

Run this only after the main notebook sealed its training handoff and new reporting photos are available. Upload the matching helper, install/restart in Step 1, and audit in Step 2. A GPU is optional for this reporting-only notebook; CPU inference may take longer. In Step 3 set `TRAINING_RUN` to the sealed new V5.0.0 run and `FRESH_OOD` to the new collection. Its outputs go under the running account's actual `mangoleaf_experiments/v5.0.0/evaluation`.

Step 4 reviews and freezes the new reporting membership. Step 5 loads the same verified calibrated model and reports once. This can use a different account through permitted input shortcuts without copying or modifying the parent run. If a flagged historical image is unavailable, set the optional `SOURCE_PARENT_RUN` or `SOURCE_OLD_OOD` input shortcut so its original bytes can supply a comparison preview. The new reporting attempt preserves its own helper, runtime inventory, and audit evidence. No new training or converter setup occurs in this notebook.

## OE counts and inherited review

The parent discovered 2,481 raw OE photos and approved **2,011** for training. Those 2,011 already exclude the **300** reserved as part of the old 500-photo OOD collection. The other 200 old OOD photos came from the previously evaluated collection.

The intended union is therefore **2,011 + 500 = 2,511 unique approved OE photos**, subject to identity, scope, and overlap checks. The saved manifests have no byte-hash or decoded-RGB-hash intersection between the approved 2,011 and the old 500; each collection is internally unique by those identities. That supports the expected count, while current Drive file hashes and broader capture relationships still need verification. Do not subtract the 300 again or add them a second time. They already exist in the raw OE source collection, which is why blindly copying folders is unsafe for counting.

The user has already reviewed and deduplicated the old 500-photo collection for V4.5.0. Its saved review has 500 `keep=yes` / `unsupported=yes` rows, with 200 `previously_evaluated` and 300 `new_for_v4_5_0` entries. The old similarity-review CSV has a header and no flagged-pair rows. Reuse its recorded decisions when the completion receipt, review files, inventory identities, and actual image hashes match. This is not a request to repeat all 500 manual decisions. Recheck changed or unmatched inputs and newly flagged relationships at the merged-pool boundary.

Inherited source/capture fields remain unknown where the old review recorded them as unknown. A generic collection note does not establish per-image provenance or independence. Preserve the recorded prior-use history and distinguish researcher-supplied scope decisions from independent image inspection. Byte hashes, decoded-image hashes, and perceptual similarity checks support review; they do not prove the absence of every related capture.

Mango training, validation, and test groups must remain disjoint from approved OE, including related crops, recompressions, neighboring frames, or captures of the same specimen/session. Do not resolve a conflict by silently moving a mango validation/test photo into training. Stop and record an explicit resolution without rewriting the parent evidence.

### Review CSVs in a new run

- With `parent_threshold_run` selected, matching old 500-photo approvals are imported automatically. If the historical review is inaccessible, share that completed run into the current account rather than reconstructing decisions from memory. The fallback `transferred_ood_review.csv` requires explicit review and does not silently approve unknown inputs.
- `fresh_ood_review.csv` concerns only newly supplied reporting photos. Set `keep` to `yes` or `no`; retained photos require `unsupported=yes`, truthful `sourceNotes`, and `priorUse=never_used_for_training_or_tuning`. Exclusions require a reason in `notes`. Keep `captureGroup` and `sourceGroup` blank when unknown, and describe that limitation; never invent group identities or a source attribution.
- `cross_pool_similarity_review.csv` identifies targeted candidate pairs, not confirmed duplicates. A retained pair needs `decision=distinct` and a specific inspection reason. If related or uncertain photos cross a boundary, remove the conflicting fresh input and create a new attempt; do not mark every pair distinct to bypass the guard. The unchanged mango split and expected 2,511 OE design cannot be silently altered to resolve a conflict.

The separate approval flag and notes record completion of the applicable inherited/new review, including remaining limitations. An empty similarity CSV means no pairs met this checker threshold, not that every possible relationship has been disproved.

## Fresh OOD evaluation is separate

All old **500 OOD photos become training data** in this experiment. The old 250 tuning / 250 reporting assignment is historical evidence and cannot become an unbiased V5.0.0 evaluation. A confidence-only rule still needs unsupported-photo evaluation.

New, unseen, reviewed unsupported photos are required for the new OOD report. They must be independent of mango and OE training data and related capture/source groups. Since confidence is fixed at 0.70 and no margin/entropy search is performed, no new OOD threshold-tuning pool is needed for this workflow. Freeze the reporting membership before viewing its predictions; do not change gates after examining that report and continue presenting it as untouched evaluation.

Training may proceed without this fresh reporting collection. The main notebook can still produce the new mango test metrics, training/Grad-CAM figures, and an experimental browser export; its OOD result remains explicitly pending. Missing fresh OOD data prevents a completed combined mango/OOD evaluation or adoption claim. Do not substitute old training photos, fabricated metrics, or a zero-photo rejection percentage.

When fresh photos become available, open the later evaluation notebook with the same helper, select the sealed V5.0.0 training run, and create a separate reporting run. Review the new photos and targeted similarities, then freeze their membership before inference. That notebook loads the verified calibrated model, preserves its 0.70 rule, and performs no training, recalibration, or margin/entropy fitting. It does not rewrite the earlier training handoff or its export metadata; retain both receipts together for a later adoption review.

The unchanged 397-photo mango test set supports a paired exploratory comparison with V4.5.0. It has already been evaluated in earlier work; reuse does not make it a newly independent test or establish field performance. Validation remains the checkpoint/calibration input; test and OOD report predictions must not drive model selection.

Any result difference combines extra fine-tuning, the expanded OE pool, and new calibration. Without a matched control attempt, it does not isolate the effect of the extra 500 photos. OOD percentages measured on a new reporting collection also have a different denominator and photo membership from V4.5.0's saved 250-photo report.

## Calibration and confidence-only decisions

After selecting the new uncalibrated checkpoint, fit a **new temperature using clean mango validation photos only**. Do not reuse V4.5.0's temperature. Fold the new temperature into the classifier logits exactly once and retain both uncalibrated and calibrated artifact identities.

Evaluation uses the fixed rule **accept when maximum calibrated probability is at least 0.70**. Margin and normalized-entropy rejection are disabled, represented by `null` in the candidate configuration. No margin/entropy grid search or new fitted margin/entropy claim belongs to this workflow. This setting does not guarantee that every unsupported photo is rejected.

Save raw predictions and probabilities, class/subset identities, rules, and exact model/configuration hashes. Report raw mango accuracy, correct accepted / all mango inputs, accepted-only accuracy, wrong accepted counts, rejected mango counts, and OOD rejection/false acceptance with their denominators. Rejected mango photos remain in support and reduce recall. Do not describe an unsupported photo accepted with high confidence as a successful diagnosis.

## New figures and Grad-CAM

Generate figures only after actual V5.0.0 execution. No placeholder plot or copied V4.5.0 result is new evidence.

- `training_curves.png`: new fine-tuning history, including clean validation metrics. Do not label it as the parent's original five-plus-ten-epoch schedule. Keep weighted mango loss, OE loss, and total objective distinguishable.
- `confusion_matrix.png` and `per_class_metrics.png`: new raw mango test predictions.
- `confusion_matrix_with_rejection.png` and `per_class_metrics_with_rejection.png`: new 70%-confidence-only decisions, including rejected mango photos.
- `grad_cam.png`: new heatmaps from the new weights on the same seven validation originals identified by the parent's `example_selection.json`.

Grad-CAM depends on the current model's activations and gradients, so reuse the original photos but recompute the heatmaps. Preserve their validation membership and related groups. This workflow uses the true-class target, matching V4.5.0, and records the prediction separately. Record the target class and preprocessing; if two models predict different classes, distinguish that from a comparison of the same class's heatmap. The color scale can stay the same while highlighted regions change. Heatmaps explain selected predictions; they do not establish overall model accuracy. See the [Keras Grad-CAM example](https://keras.io/examples/vision/grad_cam/).

An unchanged augmentation illustration may be referenced with its original provenance; a V5.0.0 label must not imply it was newly generated. Keep V4.5.0 figures and results intact. Store any later curated V5.0.0 results under this version's own `artifacts/` and `figures/` with a source-hash mapping.

## Runtime and dependency review

Do not install a historical package snapshot. The notebook declares explicit packages, installs binary wheels, requires a session restart, audits the installed research dependency closure, and saves runtime/GPU evidence. A successful metadata lookup or local syntax check is not an installed-runtime, GPU, training, or conversion pass.

**October 15, 2026 preparation review:** Read-only [PyPI release metadata](https://docs.pypi.org/api/json/) was checked for all 18 direct training pins carried by the new workflow and 12 additional converter-specific releases, including its different packaging/setuptools pins. These 30 release records were available and their declared Python requirements permit Python 3.11/3.12. The 18 direct training releases returned no advisory entries at the time of inspection; the two affected converter releases are listed below. This covers those exact release records only, not all transitive dependencies, provider packages, or future advisories. The actual Colab audit remains required and must block unfamiliar findings, skipped packages, collection failures, or dependency conflicts.

The converter's compatibility constraints still leave these **unresolved findings** visible:

- `setuptools==81.0.0`: [GHSA-h35f-9h28-mq5c / CVE-2026-59890](https://github.com/advisories/GHSA-h35f-9h28-mq5c), fixed in 83.0.0. The retained review concerns the absent source-distribution build/publish operation; it does not mean the package is patched.
- `wheel==0.45.1`: [GHSA-8rrh-rw8j-w5fx / CVE-2026-24049](https://github.com/advisories/GHSA-8rrh-rw8j-w5fx), fixed in 0.46.2. TensorFlow.js 4.22.0 requires packaging 23.x while the compatible converter dependency closure requires wheel. The retained review concerns the absent wheel-unpack/RECORD permission operation; it is not permission to unpack arbitrary wheels or suppress new findings.

Exact advisory/version/operation reviews remain separate from a clean audit and from provider-runtime conflicts. Preserve raw audit reports, installation logs, interpreter/package versions, and export probes. Any changed findings require new review before executing affected operations. The [historical dependency review](../../../security/DEPENDENCY_SECURITY.md) provides the existing compatibility context without changing original evidence.

## Validation, completion, and adoption boundaries

Local workflow checks can prove notebook structure, Python syntax, path/hash guards, dataset-count rules, review inheritance, overlap handling, and fixed-rule metric calculations. They cannot prove a successful Colab GPU run or a better classifier. Record actual runtime startup, training, calibration, conversion, fresh evaluation, figures, and browser/Keras parity separately when performed.

From the repository root, run the focused local safeguard checks with Python 3.11 or newer in an environment containing `nbformat`, `Pillow`, and `ImageHash` (including its NumPy/SciPy dependencies):

```powershell
python tools/verify-v5-notebooks.py
```

The [verifier](../../../../tools/verify-v5-notebooks.py) uses synthetic fixtures and does not install the Colab packages, train a model, or run browser reliability sessions. Its controlled scores are test inputs, not measured MangoLeaf accuracy. The Colab scientific dependencies are installed and audited by the notebook separately.

**Local preparation verification, October 15, 2026:** All 30 focused tests passed in the existing local notebook-verification environment. These cover both clean notebook schemas and Python cells, matching helper hashes, read-only input/output boundaries, altered artifacts, preserved split/group membership, inherited review identities and prior-use history, bounded image decoding, decoded duplicates, the unrounded 0.70 boundary, metric denominators, incomplete evaluation handoffs, and blocking dependency-audit cases. Known converter operation reviews remain unresolved in their test reports rather than becoming clean audit claims.

Read-only checks against the downloaded V4.5.0 source verified the required parent artifacts and checkpoint receipt, successfully matched the sealed 500-row review while retaining its 200/300 prior-use history, and reproduced all seven selected examples' file/decoded/pHash identities. Recorded manifests show no exact/decoded overlap in the 2,511-photo OE union and no perceptual candidates at distance at most five between mango and expanded OE or between original OE and transferred OOD. These are checks of saved evidence; the notebook still verifies actual mounted Drive images before fitting. Source comparison confirmed unchanged augmentation, uniform OE objective/trainer, and true-class Grad-CAM logic. Preservation checks found all 187 protected application, model, V4.5.0 notebook/evidence, and configuration files byte-identical to the task's starting state. Applicable changed Markdown files passed pinned Prettier checks.

Until those runs occur, the new candidate has **no accuracy, OOD rejection, training-duration, or browser-parity result**. The earlier V4.5.0 findings remain attached to their original model. No application build, asset swap, release, or deployment is part of this workflow preparation. The 30-minute R03 test and shortened substitutes are excluded at the maintainer's request.

Before any later adoption, review the fresh mango/OOD results and provenance, preserve the active model for rollback, obtain explicit model-selection authorization, prepare matching cache/configuration identities, and complete the applicable browser/device checks. Follow [AI model versioning](../../../versions/AI_MODEL_VERSIONING.md) and the [physical-device evidence checklist](../../../testing/PHYSICAL_RELIABILITY_CHECKLIST.md). Creating a candidate does not adopt it.

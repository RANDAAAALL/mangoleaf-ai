# Adopted seven-class model v4.3.0

> **Status: ADOPTED CURRENT MODEL — October 2, 2026.** The completed V4.3.0 Combined model was selected as the current application model, replacing V3 as the adopted baseline. App version is `0.4.9`; the model label is `v4.3.0` and the public configuration identifies `model-v4.3.0`. The original graph, weights, fitted gates, and completed evidence are preserved. This records source adoption; live deployment, remote CI, browser/Keras parity, and independent field accuracy are not established by this change. The workflow preparation and dated local trials below remain historical. See the [adoption record](#current-model-adoption-october-2-2026) and unchanged [comparison](COMPARISON_v4_1_1_vs_v4_3_0.md).

**App release preparation, October 3, 2026:** PWA candidate `0.5.0` retains this same adopted model. The new app version packages cloud synchronization and documentation changes; it does not rerun training, fitting, or evaluation. The October 2 adoption statement above and its receipt preserve their original `0.4.9` identity. See the [v0.5.0 release record](../../../versions/PWA_VERSIONING.md#v050-private-cloud-synchronization-candidate-october-3-2026).

**Current app release preparation, October 5, 2026:** PWA candidate `0.5.1` retains the same adopted V4.3.0 model while preparing the scan-thumbnail and treatment-guidelines layout patch. This application update does not change training, fitting, evaluation, or model asset hashes. See the [v0.5.1 release record](../../../versions/PWA_VERSIONING.md#v051-scan-thumbnail-stability-candidate-october-5-2026) and [candidate validation](../../../testing/TESTING.md#v051-candidate-validation-october-5-2026).

V4.3.0 returns to one classifier for mango leaves and fruit. It starts from the [V4.1.1 workflow and evidence](../../experiment/v4.1.1/TRIAL_v4_1_1.md), keeps its mango image identities and split, and trains **one combined recipe**. It does not rerun four arms or separate the application into leaf and fruit models. There are exactly two V4.3.0 workflow notebooks, each with a separately preserved completed result copy:

- [Training, export, and integrated figures](../../../../notebooks/non-experiment/v4.3.0/MangoLeaf_AI_Training_v4_3_0.ipynb).
- [Separate threshold fitting and evaluation](../../../../notebooks/non-experiment/v4.3.0/MangoLeaf_AI_Threshold_Fitting_v4_3_0.ipynb).

Completed evidence: [training result](../../../../notebooks/non-experiment/v4.3.0/MangoLeaf_AI_Training_v4_3_0_Post_Training.ipynb) and [threshold result](../../../../notebooks/non-experiment/v4.3.0/MangoLeaf_AI_Threshold_Fitting_v4_3_0_Results.ipynb). Their saved candidate wording documents the original experiment; the [notebook index](../../../../notebooks/README.md) distinguishes that provenance from current adoption.

There is no separate figures notebook. The suggested order is training Steps 1 through 26, run threshold-fitting Steps 1 through 12, then return to training Steps 27 through 30. Step 20 is optional recovery: leave its path empty during a normal connected run. Steps 25 through 26 create diagnostics using training/validation photos only; Step 27 waits for the frozen threshold evaluation before any test-based charts. Every code cell has a preceding explanation of its inputs, outputs, and checks. Each notebook starts its own numbered sequence at Step 1.

## What stays comparable, and what changes

The seven output classes remain in this order: `anthracnose`, `bacterial_black_spot`, `bacterial_canker`, `healthy_fruit`, `healthy_leaf`, `mango_scab`, `sooty_mold`. Preserve the saved per-class approximate **70% training / 15% validation / 15% test** membership; do not draw a new split. The expected totals are **1,819 train, 391 validation, and 393 test** mango photos. Training verifies those identities and counts using the completed V4.1.1 run's saved split ZIP and records.

The single recipe includes the common V4.1.1 flip, rotation, zoom, shear, and global-brightness transforms. It also uses background replacement with probability **30% for an eligible training photo in each epoch**, and localized lighting with probability **30% during training**. The eligibility rule requires an approved white-background original and an approved foreground mask. Rejected or ineligible photos keep their original backgrounds. The effects may occur together; 30% does not mean 30% of all mango images become composites. Common transforms, scene replacement, and local lighting do not alter validation or test pixels. The architecture, class weighting, five head-training epochs, ten fine-tuning epochs, validation checkpoint selection, and validation-only temperature calibration follow V4.1.1.

The intended scene pool is **62 original backgrounds + 138 supplied new backgrounds = 200 scene photos**. These are augmentation scenes, not 200 mango training photos. More scene photos do not increase the number of eligible foregrounds, change the 30% probability, or guarantee that every scene is used. The Colab inventory must establish actual readable counts, identities, duplicates, overlap, and approved counts; the repository alone cannot establish the contents of the Drive upload. Review suitability and use rights for both folders, including the previously noted airplane-view scene in the old pool. Record any exclusions or count difference rather than describing the intended 200 as an observed result.

New scene inputs and new review decisions make this a changed experiment, rather than a strict V4.1.1 reproduction. New training produces new weights and requires new threshold fitting. Keep all V4.1.1 and V4.2.0 notebooks, records, and results intact.

## Drive upload and reuse checklist

The paths below are **Google Drive inputs**, not repository folders. The notebooks use `/content/drive/MyDrive/` after mounting Drive. Keep original folders and completed runs in place; new runs write elsewhere.

| Needed when                | Put or keep this in `MyDrive/`                                                                                      | What must be present and why                                                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before training            | `mangoleaf_experiments/v4.1.1/training/v4-1-1-training-20260928T043539Z-37576200/`                                  | Set `V4_1_1_TRAINING_RUN` to this completed run, or the exact archived copy of it. Required files: `training_complete.json`, `plan.json`, `input_manifest.json`, `dataset_split.zip`, and `duplicate_audit.json`. They preserve mango image identities, class labels, and split membership. |
| Optional before training   | `white_background_review.json`, `mask_review.json`, and `masks/*.png` in that V4.1.1 run                            | Starting review suggestions and reusable masks. Reuse requires the source completion hashes, original training-image hashes, mask hashes, and dimensions to match. The new run still requires review of all white-background pages and all mask previews.                                   |
| Before training            | `mangoleaf_background_photos/`                                                                                      | The original 62 scene photos. This is the actual old V4.1.1 default path. Keep the original bytes and folder; do not move the old photos into the new folder.                                                                                                                               |
| Before training            | `mangoleaf_new_background_photos/`                                                                                  | The 138 supplied new scene photos. Upload the actual image files, with their source/use-rights notes. Check that this folder directly contains the intended images or their subfolders, rather than an unexplained nested copy.                                                             |
| Before threshold fitting   | `mango_ood_test/`                                                                                                   | The previously used old OOD collection. Preserve existing photo bytes and tune/report roles. Old OOD tune photos help select gates; old OOD report photos are reused exploratory evidence.                                                                                                  |
| Before threshold fitting   | `mango_ood_test_new_photos/`                                                                                        | The previously used V4.1/V4.1.1 32-photo OOD report collection. Its name does not make it untouched for V4.3.0. Preserve its bytes and report role.                                                                                                                                         |
| Before threshold fitting   | `mangoleaf_experiments/v4.1.1/threshold_fitting/v4-1-1-thresholds-20260928T060638Z-a3a7418c/evaluation_inputs.json` | Set `REFERENCE_V411_INPUTS` to this exact historical role record, or its hash-matching archived copy. It checks that reused test/OOD photo identities and roles have not silently changed.                                                                                                  |
| After training             | The newly completed V4.3.0 `training/<unique-run-id>/` folder                                                       | Set the threshold notebook's `TRAINING_RUN` to this full path or its exact run-folder name. It must contain the saved models, split, review/plan records, hashes, and `training_complete.json`.                                                                                             |
| After threshold evaluation | The newly completed V4.3.0 `threshold_fitting/<unique-run-id>/` folder                                              | Give this full path or its exact run-folder name to the training notebook's remaining figure steps so figures read the exact frozen selection and evaluation.                                                                                                                               |

**You do not need to upload `mango_dataset_v3/`, the original `mangoleaf_v3/dataset_split/dataset_split/` folder, or old model weights for training.** The completed V4.1.1 `dataset_split.zip` is the mango source for this workflow, and it is copied byte for byte before extracting the same split. Uploading a split ZIP alone is insufficient: keep its companion completion, plan, manifest, and duplicate-audit records. Earlier model weights and old fitted thresholds are historical evidence, not initialization or gate settings for this new run.

Optional mask reuse defaults to `REUSE_REVIEWED_MASKS = True`. Keep the prior mask folder and its review files together. A source hash or image/mask mismatch must stop reuse; investigate it or choose fresh mask generation explicitly. Do not silently approve every imported review row. Review every training contact-sheet page, including photos the automatic white-border suggestion missed. Inspect every mask preview for erased lesions, clipped leaf or fruit edges, and retained old background. A failed mask remains in the mango training set as an original image.

Training can audit the OOD folders when they are already present. Upload both OOD folders and the historical evaluation-input record before threshold fitting, even if they were absent during training setup. Do not add scene photos to an OOD folder or use mango test photos as replacement scenes. Review exact and near-duplicate flags between mango images, scenes, and OOD collections before freezing inputs.

## Run the two notebooks in this order

Open the clean templates in Colab. Select a GPU runtime for training, mount Drive, read each cell's explanation, and run sequentially. Save a completed notebook copy separately from the clean template; preserve partial runs if a session ends early.

### 1. Training Steps 1 through 26: settings, completed export, and training diagnostics

1. **Set paths and runtime.** Check the completed V4.1.1 training-run path, both scene paths, expected counts, source/use-rights notes, seed, and combined-only settings. Runtime and dependency details are saved as provenance.
2. **Verify the saved split and input inventory.** Check the source completion and referenced hashes, preserve the original split ZIP bytes, extract the seven-class split, and confirm 1,819/391/393 counts. Read the duplicate and overlap audits; visual similarity flags require a decision rather than automatic relabeling.
3. **Review scene contact sheets.** Inspect every old and new scene page, record exclusions and source notes, and freeze the approved pool. The new run stores audited scene copies under `backgrounds/`, so later figures use the exact recorded bytes from both inputs.
4. **Review all white-background training pages.** Use previous suggestions when hash-valid, then approve or reject current IDs explicitly. No validation/test image can become an eligible replacement foreground.
5. **Generate or validate reusable masks, then inspect all mask previews.** Check original image, mask, and sample composite together. Freeze the mask decisions and read the mask-reuse audit. Reuse saves computation; it does not bypass human review.
6. **Inspect localized-light previews.** Review highlights and shadows at 224 × 224, especially whether lesions remain visible. Freeze the lighting decision before fitting.
7. **Freeze augmentation schedule and plan.** Confirm one `combined` arm, the two 30% probabilities, approved foreground/mask counts, scene hashes, historical split identity, architecture, class weights, checkpoint rule, and calibration rule.
8. **Train and calibrate.** Fit five head epochs and ten fine-tuning epochs, retain the prescribed validation-loss checkpoints, and fit temperature with validation labels only. Save actual history, weights, validation predictions, and calibration provenance. Do not alter settings to chase a historical percentage.
9. **Inspect training curves and complete the TensorFlow.js export.** Verify browser export files and save `training_complete.json`. Record the full new training-run path. Test/report prediction remains deferred to threshold fitting. Use the notebook's recovery step after a disconnect only with its integrity-checked saved state; it is not another training run.

10. **Create training diagnostics in Steps 25 through 26.** Verify the completed run, then generate the representative augmentation preview and validation-only Grad-CAM. These steps do not use test or OOD report predictions.

The suggested pause is after Step 26, before Step 27. Threshold fitting may also run immediately after successful Step 24; Steps 25 through 26 create diagnostics and do not alter model weights or thresholds. Finish those diagnostics before Step 27. In a normal connected run, skip optional Step 20; it is recovery only.

### 2. Threshold-fitting Steps 1 through 12: validate, select, freeze, evaluate

1. **Set paths and runtime.** Paste the full newly completed V4.3.0 `TRAINING_RUN`, check both OOD folders, and check `REFERENCE_V411_INPUTS`. The notebook defines prediction, browser-file checks, rejection metrics, and overlap audits before inference.
2. **Verify training and audit photos.** Validate the completion record, split, model/config hashes, seven-class order, and `combined` identity. Compare reused evaluation photo identities and roles with V4.1.1. Inspect preflight counts, contact sheets, exact duplicates, near-duplicate flags, and exclusions.
3. **Review scope and freeze inputs.** Confirm which photos are validation, old OOD tune, mango test, old OOD report, and reused new OOD report. Freeze `evaluation_inputs.json` before threshold selection and reporting.
4. **Fit and freeze the combined gate.** Confidence stays at 0.70. Search margin/entropy using mango validation and old OOD tune photos with the 95% minimum validation-retention rule. Save `selected_thresholds.json` and its durable selection lock. Inspect the saved decision before any mango test or OOD report inference. Fitting thresholds does not train model weights.
5. **Evaluate the frozen decision.** Run the reused mango test and both reused OOD report collections once under the frozen selection. Save per-image probabilities, predictions, gate decisions, metrics, and the evaluation lock. Read correct accepted, wrong accepted, mango rejected, and OOD accepted together with their denominators.
6. **Inspect a saved prediction and package evidence.** Trace its raw scores and gate decision. Save the report, hashes, evidence ZIP, and a fitted candidate only when selection was feasible.

If no search pair meets the rule, selection remains **`infeasible` with a null gate**. The notebook may report its fixed confidence-only reference to explain the failure. Those rows must be labeled reference evidence; they are not a fitted candidate. No fitted candidate model or candidate ZIP is produced for an infeasible selection. Do not change thresholds after reading test/report outcomes and describe the same photos as untouched evaluation.

### 3. Return to training Steps 27 through 30: frozen evaluation figures

1. **Restore helpers if Colab disconnected.** Rerun Step 25 to reopen the completed training run and define the figure helpers. Step 26 verifies and reuses completed training diagnostics. It does not rerun model training.
2. **Load the frozen threshold run in Step 27.** Supply the completed threshold-run path. Validate its training linkage, selection and evaluation locks, CSVs, input identities, and model hashes.
3. **Generate evaluation charts in Step 28.** Use saved predictions and the frozen search; do not refit thresholds or infer extra test results to draw the plots. The raw confusion matrix precedes rejection; accepted/rejected behavior belongs in the threshold report.
4. **Inspect output and save the evidence handoff in Steps 29 through 30.** Check every figure, the per-class CSV, and figure provenance. Save the completed training and threshold notebooks and preserve both full Drive run folders before copying any curated evidence into the repository.

## Where new Drive outputs go

Only these two run families are created:

```text
MyDrive/mangoleaf_experiments/v4.3.0/
  training/<unique-run-id>/
    backgrounds/                    audited scene copies
    masks/                          approved/generated foreground masks
    figures/                        integrated training/evaluation figures
    ...                             split, reviews, models, hashes, provenance
  threshold_fitting/<unique-run-id>/
    arms/combined/                  search and prediction CSVs
    candidate_models/combined/      feasible fitted export only
    ...                             audits, frozen selection/evaluation, report
```

Each run uses a new UTC/unique-ID folder. Never overwrite a completed run. Keep the source V4.1.1 folders intact. Threshold outputs belong to the exact new training weights; figures belong to the exact new training and threshold runs. There is no V4.3.0 `post_training_figures/` run family.

## Expected artifacts and how to read them

An artifact is a saved record such as JSON, CSV, model weights, or a ZIP. The table is an **output plan**, not a list of completed V4.3.0 evidence.

| Expected record                                                                                                                 | Where it is made        | What to check                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `source_provenance.json`, `input_manifest.json`, `dataset_split.zip`, `duplicate_audit.json`                                    | Training input audit    | Source V4.1.1 identities, unchanged split ZIP, actual mango membership, duplicate review, and source hashes.                                                                                                       |
| `scene_inventory.json`, `scene_review.json`, `backgrounds/`                                                                     | Scene audit and review  | Separate old/new counts and roots, photo identities, decisions, notes, and copied scene-byte hashes. Intended 200 and approved/observed counts must remain distinct.                                               |
| `white_background_review.json`, `mask_review.json`, `mask_reuse_audit.json`, `lighting_review.json`                             | Human review            | Approved IDs and counts, reused versus generated mask provenance, rejected masks, and preserved disease signs.                                                                                                     |
| `background_schedule.json`, `plan.json`                                                                                         | Before training         | Eligibility, both probabilities, epoch schedule, one combined recipe, class order, split and input identities, checkpoint/calibration rules.                                                                       |
| `arms/combined/training_history.json`, calibrated Keras model, `resume_info.json`, validation predictions                       | Training/calibration    | Actual loss/accuracy curves, chosen checkpoint, temperature, and the exact new weights. These are not held-out field accuracy.                                                                                     |
| `colab-runtime-snapshot.txt` (original run filename: `requirements.txt`), `recovery_state.json`, `training_complete.json`       | Runtime/export          | Historical library inventory, integrity of recoverable state, complete export hashes, and no training-time test/report prediction. Not an installation manifest.                                                   |
| `preflight.json`, overlap audits, OOD indices, `evaluation_inputs.json`                                                         | Threshold input audit   | Historical role comparison, exclusions, reviewed overlap, exact evaluation files, and reused-data labels.                                                                                                          |
| `arms/combined/threshold_search.csv`, `arms/combined/tuning_predictions.csv`, `selected_thresholds.json`, `selection_lock.json` | Threshold selection     | Validation retention, OOD tune trade-offs, feasible/infeasible status, selected gate, and hash lock before reporting.                                                                                              |
| `evaluation_started.json`, `evaluation.json`, `evaluation_lock.json`, `arms/combined/raw_per_class_metrics.csv`                 | Frozen evaluation       | Boundary before report inference, completed metrics, denominators, and frozen-output hashes.                                                                                                                       |
| `arms/combined/{selected,confidence_only}_{mango_test,old_ood_report,new_ood_report}_predictions.csv`                           | Frozen evaluation       | Actual output filenames follow selection status: selected rows for a feasible gate; confidence-only reference rows when infeasible. Read full class probabilities, prediction, and acceptance with the photo role. |
| `candidate_models/combined/`, `candidate_hashes.json`, candidate ZIP                                                            | Feasible packaging only | Model JSON, every manifest shard, matching `model_config.json`, and hashes. No fitted package exists after infeasible selection.                                                                                   |
| `REPORT.md`, evidence ZIP                                                                                                       | Threshold handoff       | Combined-only results, rejected/accepted counts, data reuse, run identity, and selection status. Keep the entire Drive training run separately; there is no separate training-evidence ZIP requirement.            |
| Figure provenance records                                                                                                       | Integrated figure steps | Exact input run identities, model/input hashes, generated-output hashes, and representative-preview limitations.                                                                                                   |

`threshold_complete.json` records the completed threshold run, its classes, Combined recipe, training linkage, selection/evaluation hashes, and artifact ledger. The integrated figure steps validate that record before reading report data. `candidate_exports.json` records candidate ZIP hashes and feasible/infeasible status; `evidence_hashes.json` records the report files included in the evidence ZIP. Both old and reused-new OOD collections require explicit scope-review confirmation before fitting.

Training diagnostics run in Steps 25 through 26 and may run before or after threshold fitting. Steps 27 through 30 read the matching completed threshold run. Figure attempts are staged and their recorded hashes are checked when resuming a partial publication; completed figures are preserved.

## Expected figures and repository copy plan

| Expected figure or CSV                                                     | When generated                    | What it shows and what to inspect                                                                                                                  |
| -------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scene, white-background, mask/composite, and localized-light preview pages | Before training                   | Full review coverage, realistic scenes, clean foreground edges, and visible lesions. They explain input decisions; they do not establish accuracy. |
| `training_curves.png`                                                      | After training                    | Actual training/validation history and checkpoint choice. Inspect divergence and overfitting.                                                      |
| `augmentation_preview.png`                                                 | Integrated diagnostic steps       | A source/mask/scene example and representative combined transforms. It is not proof that the pictured random tensor was used in an earlier epoch.  |
| `grad_cam.png`                                                             | Integrated diagnostic steps       | Attention on selected validation photos across the seven classes. Attention does not certify biological correctness.                               |
| `confusion_matrix.png`                                                     | After frozen threshold evaluation | Raw top-class predictions versus true class on the reused mango test, before rejection. Check class counts and the small healthy-fruit group.      |
| `per_class_metrics.png`, `per_class_metrics.csv`                           | After frozen threshold evaluation | Precision, recall, F1, and support by class. Read denominators alongside percentages and consult acceptance/rejection records separately.          |
| `threshold_search.png`                                                     | After frozen threshold evaluation | Saved validation/OOD tune trade-offs and selection status. It is not another round of test tuning.                                                 |

This version's [`artifacts/`](artifacts/) and [`figures/`](figures/) folders now contain verified copies from the completed October 1 run. The dated results section distinguishes original records, independently derived review files, and the fitted local model. Figures were copied unchanged, not regenerated from an older experiment.

After a real run, copy selected JSON/CSV/report records into `artifacts/` and selected reviewed plots into `figures/`. The completed run uses [`evidence_copy_manifest.json`](artifacts/evidence_copy_manifest.json), which records the exact original Drive path, run ID, source SHA-256, and copied-file SHA-256 for each file. Include selection/evaluation locks and figure provenance so the plot, report, and candidate can be traced to the same weights. Keep full model exports, split ZIP, review pages, masks, copied scenes, completed notebooks, and full runs in the archived handoff; curated repository evidence is only an index. Add a new dated results entry here and in the affected version/progress documents. Preserve clean templates and historical results.

## Historical runtime archive security (October 3, 2026)

The repository copy of the full Colab `pip freeze` list is now [colab-runtime-snapshot.txt](artifacts/training/colab-runtime-snapshot.txt). Its original 14,117 bytes and SHA-256 `99667286f3b0645093f75218230e26f7b1ad2f32fdf0afe0aa570e37c28598cb` are unchanged. [runtime-snapshot-provenance.json](artifacts/runtime-snapshot-provenance.json) maps the repository name to the original Drive `requirements.txt`; `training_complete.json`, `evidence_copy_manifest.json`, completed notebooks, and external source files retain their original identities. Verify the mapping with `bun run verify:training-archive`.

The [dependency security review](../../../security/DEPENDENCY_SECURITY.md) retains all 112 Python advisories. The PWA and its CI do not install this list. Archiving it under a descriptive name corrects its purpose; it does not patch the original packages. Do not recreate that historical environment or rerun preserved completed notebooks. A new training run requires a reviewed, patched environment, trusted inputs, and new compatibility/evaluation records.

## Evaluation boundary before any adoption

The mango test, old OOD report, and `mango_ood_test_new_photos/` report have already influenced earlier development. Reusing them supports an exploratory comparison; none becomes independent or untouched by receiving a V4.3.0 filename. Report data reuse and exact identities. Scene backgrounds used during training cannot also serve as independent OOD evidence.

A frozen candidate still needs separately reserved OOD photos for rejection assessment, expert-labeled mango field photos for disease accuracy, browser TensorFlow.js parity, and applicable application/reliability/physical-device checks before adoption. Save actual results and limitations without inferring improvement from a training curve or a repeated historical percentage. Preparing these notebooks does not change `public/model/`, the app/model version labels, release state, or deployment.

## Workflow-template verification before the completed run

The clean templates passed notebook schema, empty-output, sequential-step, and Python syntax checks. Local fixtures checked scene content identity and overlap, mask reuse, interrupted figure publication, rejection boundaries and infeasible gates, frozen record changes, and copied candidate/ZIP integrity. The application typecheck, lint, production build, export checks, and affected local documentation links passed. These checks do not run the Colab GPU pipeline: actual uploaded counts, training scores, converter execution, Grad-CAM, and generated figures still require the real notebooks and Drive inputs.

## Completed run and local trial: October 1, 2026

### Exact run and candidate identity

- Training: `v4-3-0-training-20261001T112311Z-961e5eb7`.
- Threshold fitting: `v4-3-0-thresholds-20261001T120051Z-e1c5cdb0`.
- Original local archive: `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v4.3.0/`. Full Drive originals remain under `MyDrive/mangoleaf_experiments/v4.3.0/` with those run IDs.
- Calibrated Keras model SHA-256: `e5d323cfdca00fde64b1da4da6a5f1328ff627d9616d518b6ca82595c3f8137e`.
- Training completion SHA-256: `b59585c2f574318997a507331fe36a003674c18e6efd6064c8d65755e627297e`.
- Selected thresholds SHA-256: `fd213d6ed4fc37e10738f391d989dc32e7ad3555d048e02ac7ba9921f5bb26b3`.
- Evaluation SHA-256: `46da4aa3d2fd2532bc45256447302f58938e53ee16b6fe58d7794b73bc035de1`.
- Threshold completion SHA-256: `daba6fc62c90be8eaec43e50032935bfaae68179f1b2d76c3ee605a21766c452`.

The chosen training checkpoint is global epoch 14 (fine-tuning epoch 9), validation loss 0.0895712 and accuracy 379/391 = 96.93%. Epoch 15 also ran but did not win the minimum-loss rule. Temperature 1.1602258301498714 was fitted on validation and folded into the saved logits weights.

The fitted gate is **0.70 confidence / 0 margin / 0.42 normalized entropy** and retains 372/391 validation photos. Raw mango test classification is **386/393 = 98.22%**. With the gate, **373 correct and 3 wrong** are accepted, **17 mango photos are rejected**, and **24/84 old OOD** and **5/32 reused newer OOD** are falsely accepted. See the [full comparison and review caveats](COMPARISON_v4_1_1_vs_v4_3_0.md); this is mixed exploratory evidence, not a proven upgrade.

### Background use in plain English

There are two different groups of images:

1. **200 scene photos:** backgrounds behind the leaf or fruit, including 62 old and 138 new.
2. **66 approved mango photos:** foreground originals with usable white-background masks.

All 66 foreground photos were shown with replaced backgrounds at least once. Across the 15 epochs, replacement happened **273 times**, using **149 different scenes: 48 old and 101 new**. A mango photo may appear with a different background in another epoch, so 273 is not 273 distinct mango photos or new dataset files. The remaining 51 scenes were never sampled. The loader feeds these composites into actual training; it does not alter validation or test backgrounds.

The chosen export restores epoch 14 rather than the last epoch. Through that retained checkpoint, all 66 foregrounds had received replacement across **256 presentations using 143 scenes (47 old and 96 new)**. The six additional scene choices introduced in discarded epoch 15 do not belong to the retained checkpoint's training path.

| Mango class          | Distinct approved/replaced photos | Replacement presentations |
| -------------------- | --------------------------------: | ------------------------: |
| Anthracnose          |                                 0 |                         0 |
| Bacterial Black Spot |                                15 |                        57 |
| Bacterial Canker     |                                 0 |                         0 |
| Healthy Fruit        |                                 0 |                         0 |
| Healthy Leaf         |                                42 |                       178 |
| Mango Scab           |                                 3 |                        13 |
| Sooty Mold           |                                 6 |                        25 |
| Total                |                                66 |                       273 |

Replacement's 30% chance applies to eligible foregrounds, so it accounts for only **1.00055% of 27,285 total training presentations**. Local highlights/shadows applied 8,194 times, including 78 with background replacement. The new scene count expands variety, not the number of eligible foregrounds.

### Run order, arms, and figure folders

Skipping **Step 20** was correct in this connected training run: it only restores a saved run after a disconnect. The completed notebook records it as unexecuted. Running training 1 through 24, threshold fitting 1 through 12, then training 25 through 30 is valid. Step 24 saved the trained model; the later steps only load evidence and create pictures. Step 30 is a written handoff, not another training cell.

An **arm** means one experiment recipe. V4.1.1 compared four arms. V4.3.0 keeps the familiar folder naming but trains only `arms/combined/`: base transforms plus replacement plus local light. It is one seven-class model.

- **`figures/`:** final verified pictures and class-metrics CSV to use in reports.
- **`figure_attempts/`:** staging folders where pictures are generated before final publication. Pending records and hashes allow an interrupted copy to resume safely. They are not additional trained models. Successful staging copies may remain after publication.

Copy the final `figures/` outputs. Keep attempts with the original run as recovery/debug evidence; they do not need a second repository figures folder.

### Evidence copied into this repository

```text
docs/model-training/non-experiment/v4.3.0/
  TRIAL_v4_3_0.md
  COMPARISON_v4_1_1_vs_v4_3_0.md
  artifacts/
    evidence_copy_manifest.json
    training/                     completion, provenance, inputs/reviews, schedule, history
    threshold_fitting/            selection/evaluation locks, audits, CSVs, report, candidate metadata
    review/                       independent calculations and paired comparisons
  figures/
    training_curves.png
    augmentation_preview.png
    grad_cam.png
    confusion_matrix.png
    per_class_metrics.png
    per_class_metrics.csv
    threshold_search.png
```

[`evidence_copy_manifest.json`](artifacts/evidence_copy_manifest.json) maps each untouched copied record/figure to its original relative source, hash, byte count, and run. [`derived_review_manifest.json`](artifacts/review/derived_review_manifest.json) identifies the separate calculations made during this review. Original downloaded folders, clean templates, completed notebooks, model checkpoints, source photos, masks, ZIPs, and staging attempts remain intact. Large binary models and dataset ZIPs stay in the full archive; copied completion ledgers intentionally refer to some source files outside this curated evidence subset.

<a id="requested-local-model-test-and-rollback"></a>

### Local model test and rollback

`public/model/` contains the **five fitted files** from threshold fitting's `candidate_models/combined/`: `model.json`, `model_config.json`, and three manifest-listed `.bin` shards. They must be copied together. The training-only export has null fitted gates and is not the installation source. All copied graph/shard bytes match training and candidate hashes; temperature is already folded.

The app displays `v4.3.0-candidate`; its runtime cache is `mangoleaf-model-cache-v4-3-0-candidate`, and the prior V4.1.1 cache is on the eviction list. Existing seven-class preprocessing, startup loading, photo-review interface, and single scan flow stay in use. Duplicate lookup already matches the active model label, so a saved V4.1.1 result does not replace a new V4.3.0 inference. Existing history remains available.

Before replacement, the five exact V4.1.1 files and matching app-source snapshots were hash-verified into an ignored `.tools/model-backups/v4.1.1-background-before-v4.3.0-20261001/` backup. Follow its `ROLLBACK.md` to restore the five files and matching model label/cache together, rebuild, and reload. Do not restore only `model.json`, use V4.3.0 gates with V4.1.1 weights, or erase local history to change models. Older V3/V4/V4.1.1/V4.2.0 backups are preserved.

This is a local experimental swap with app version `0.4.8`, not a release. Physical phones, browser prediction parity, untouched OOD, and expert-labeled field evaluation remain pending. Scene suitability and source/permissions notes also need stronger evidence; the completed archive is preserved as recorded rather than edited after training.

### Verification of the local evidence and installed candidate

- Original downloaded tree: all 444 file paths, byte counts, and SHA-256 hashes remained unchanged after copying and installation. Completed result notebooks and clean templates were also preserved byte for byte.
- Archived source evidence: 55 original artifact records and seven final figure/CSV files copied unchanged, with an original-source manifest. Independent metric/schedule/pair calculations have a separate derived-review manifest.
- Installed candidate: all five fitted model files match source hashes, all 2,971,553 floating-point weight values are finite, the graph accepts 224 by 224 RGB and returns seven probabilities, and the selected gate/config matches the frozen run.
- Actual graph smoke check: the installed TensorFlow.js graph loaded and executed on CPU with a synthetic zero input, returned seven finite probabilities summing to one, and released all tensors. This does not measure browser/Keras parity or image accuracy.
- App checks: `bun run typecheck`, `bun run lint`, and `bun run build` passed in order. The sandbox initially blocked Bun's build-worker spawn with `EPERM`; the approved build outside the sandbox passed and regenerated the worker. `bun run verify:export` verified ten exported PWA/model assets. All five static-export model files match `public/model/` byte for byte; the generated worker contains the new cache identity and the prior cache eviction entry.
- Maintenance checks: affected document/source formatting, 174 local Markdown targets, and `git diff --check` passed. Unrelated pre-existing translation comment formatting was preserved. Husky, GitHub workflows, tracked tools, and existing test cases were unchanged; the existing browser suite was not run. Physical device and independent model-quality checks remain pending.

Documentation-impact review updated this guide, the comparison, the V4.1.1 successor note, `README.md`, the experimental notebook index, architecture, performance, model-version policy, and development progress. The source swap changes only the model label in `src/lib/constants.ts` and worker cache identity/eviction in `src/sw.ts`; classifier behavior already reads the bundled configuration. No commit, push, deployment, or release was performed.

<a id="requested-rollback-to-v411-background-october-2-2026"></a>

## Rollback to V4.1.1 Background: October 2, 2026

This local V4.3.0 test ended, and V4.1.1 Background was restored. Before replacement, the exact five fitted Combined files and seven current source snapshots were copied and hash-verified into ignored `.tools/model-backups/v4.3.0-combined-before-v4.1.1-20261002/`. Every saved model file matches this experiment's original `candidate_models/combined/` export. The backup includes `backup_manifest.json` and `ROLLBACK.md`; source snapshots preserve current UI/guideline work and should not overwrite later edits wholesale.

All five V4.1.1 Background files were restored together to root `public/model/`, with their original confidence 0.70, margin 0, entropy 0.38 and folded temperature. Its active label is `v4.1.1-candidate`; its worker cache is `mangoleaf-model-cache-v4-1-1-candidate`. The V4.3.0 cache is evicted on activation. See the [V4.1.1 restoration record](../../experiment/v4.1.1/TRIAL_v4_1_1.md#local-restoration-october-2-2026) and [exact-hash receipt](../../experiment/v4.1.1/artifacts/local_restore_20261002.json).

This section supersedes the October 1 local installation status, not its measured results. Every original V4.3.0 run, completed/clean notebook, copied artifact, figure and comparison remains unchanged. Recent photo-review, Supabase guideline and uncertain-photo reminder changes remain active. App version stays 0.4.8; the last released model remains V3. This is a reversible local experiment rollback, not adoption, deployment, or release.

## Local retest restoration: October 2, 2026

The same verified five-file V4.3.0 Combined bundle was later restored from ignored `.tools/model-backups/v4.3.0-combined-before-v4.1.1-20261002/model/` to root `public/model/` for local testing. Its bytes match the completed experiment's original `candidate_models/combined/` export. The [restoration receipt](artifacts/local_restore_20261002.json) records the exact source identities and restored hashes; this restoration does not train a new model or change the frozen results.

Before replacement, the active V4.1.1 Background bundle and latest source/documentation snapshots were preserved in ignored `.tools/model-backups/v4.1.1-background-before-v4.3.0-retest-20261002/`. Earlier backups, original run folders, historical notebooks, and all curated comparison evidence remain intact. Restore model files, label, and cache identity together when switching candidates; preserve newer application work.

The active export is `model-v4.3.0-candidate`, display label `v4.3.0-candidate`, confidence 0.70, margin 0, entropy 0.42, with its original temperature already folded into the weights. The worker uses `mangoleaf-model-cache-v4-3-0-candidate` and evicts the V4.1.1 runtime cache on activation; content revisions refresh precached assets. App version remains 0.4.8. The seven-class single-model scan and photo-review flow, current guideline/reminder/capture guidance, landing-page copy, and stored history remain in place. Model-aware duplicate reuse keeps reports separated by candidate identity.

The reused-data comparison remains V4.3.0 raw 386/393 (98.22%) versus V4.1.1 Background 387/393 (98.47%), with both selecting 373 correct accepted, 3 wrong accepted, and 17 mango rejections. Old OOD false accepts remain 24/84 versus 26/84; reused newer OOD remains 5/32 versus 1/32. These mixed results do not establish an overall improvement. This is local retesting, not adoption, deployment, or release; the last released model remains V3. Formatting, typecheck, lint, and production build passed. All five restored model files match the verified source hashes; unrelated UI source, hooks, workflows, tooling, and notebooks are preserved. The existing browser cases were not rerun. Browser/Keras probability parity, fresh field/OOD evaluation, and physical-device reliability/performance evidence remain pending.

## Current model adoption: October 2, 2026

The [v0.4.9 PWA history entry](../../../versions/PWA_VERSIONING.md#v049-adoption-of-v430-combined) summarizes the application changes and verified local tags. This section preserves the model adoption evidence; the [dated local validation record](../../../testing/TESTING.md#v049-local-validation-october-2-2026) retains the original test scope and results.

**Current notebook location:** All four V4.3.0 templates and completed result notebooks are now under [`notebooks/non-experiment/v4.3.0/`](../../../../notebooks/non-experiment/v4.3.0/). The earlier adoption move to `notebooks/v4.3.0/` recorded below remains part of the event history. The later folder grouping preserves every notebook byte, cell output, and original Drive path; `non-experiment/` contains the current adopted model and earlier models kept as evidence.

**V4.3.0 Combined** was adopted as the current application model, replacing six-class V3 as the adopted baseline. This selects the already completed October 1 run; it does not retrain weights or refit thresholds. App `0.4.9` displays `v4.3.0`. The public configuration uses `model-v4.3.0`, with `exportSourceModelVersion: model-v4.3.0-candidate` preserving the original export identity.

The exact graph and three shards retain the hashes in the original [candidate ledger](artifacts/threshold_fitting/candidate_hashes.json). Only adoption metadata in the public `model_config.json` changes, so its new hash is recorded separately in the [adoption receipt](artifacts/adoption_20261002.json). The archived candidate configuration and every earlier hash ledger/receipt keep their original bytes and candidate labels. The seven classes, RGB 224 × 224 input, raw float32 0–255 pixels, internal rescaling, folded temperature `1.1602258301498714`, and fitted gates **confidence 0.70 / margin 0 / normalized entropy 0.42** are unchanged. Temperature must not be applied twice.

The runtime cache identity is `mangoleaf-model-cache-v4-3-0`. Earlier candidate caches are evicted on activation and content revisions refresh the precached configuration. Stored reports retain their original model identities; current-model duplicate reuse uses the adopted `v4.3.0` label. Selecting a current model does not establish browser/Keras probability parity or independent disease accuracy. The reused mango/OOD results and comparison limitations above remain unchanged.

The evidence folder moved from `docs/model-training/experiment/v4.3.0/` to `docs/model-training/non-experiment/v4.3.0/`; all four notebook files moved from `notebooks/experiment/v4.3.0/` to `notebooks/v4.3.0/`. Clean templates retain their original candidate-workflow provenance, and both completed notebooks retain all saved outputs. The only removed evidence-tree files are the two redundant zero-byte `.gitkeep` placeholders in already populated `artifacts/` and `figures/` directories. Relative guide links now follow the adopted locations; historical JSON receipts retain their saved source paths.

Before these changes, a hash-verified snapshot of the affected source, model, evidence, and notebooks was saved under ignored `.tools/release-backups/v0.4.9-model-v4.3.0-20261002/before/`. Original local archive/Drive runs, V3 through V4.3.0 rollback bundles, and completed notebook evidence remain preserved. The adoption receipt records file identity and source boundaries. Source adoption does not claim a live deployment, remote CI result, or completed release.

Local adoption validation passed formatting, typecheck, lint, production build, export verification, security checks, ten tooling tests, and all 65 core browser cases. Filtered R01 made 240 actual predictions across eight photos in one Chromium mobile browser session: classes and acceptance stayed stable, the maximum raw confidence range was zero, and no net tensor growth was observed. The 16 real-model smoke observations matched their provisional supplied labels; these examples and consistency checks do not create a new accuracy estimate. The [adoption receipt](artifacts/adoption_20261002.json) records the exact application fingerprint, report hashes, and preserved local report archives; the [release procedure](../../../versions/PWA_VERSIONING.md#candidate-testing-and-promotion) describes the remaining GitHub CI, production promotion, and tag steps.

# V4.5.0 Seven Class Outlier Exposure experiment

## Current model adoption (October 16, 2026)

V4.5.0 is now the adopted model in this repository, replacing V4.3.0 as the source-tree default. The original three TensorFlow.js weight shards and graph retain their verified V4.5.0 hashes. The app label is `v4.5.0`, model-config identity is `model-v4.5.0`, and the Serwist model cache is `mangoleaf-model-cache-v4-5-0`.

The maintainer selected **confidence 0.70 only**. Margin and entropy checks are disabled in the adopted configuration. This uses the saved confidence-only analysis, not a retraining run: 377/397 mango test photos were correctly accepted (94.96% of all mango inputs), 12 were wrongly accepted, and eight were rejected; nine of 250 OOD reporting photos were falsely accepted. The original fitted-rule evaluation remains preserved and reports four OOD false accepts. These are saved experiment results, not field accuracy or independent expert validation.

The [adoption receipt](artifacts/adoption_20261016.json) records exact graph, shard, configuration, notebook, and rollback identities. It maps original repository paths in preserved figure provenance to their new `non-experiment/` locations. All 117 archived manifest entries retain their original hashes and byte counts. That original adoption used app `0.5.5`; the subsequent [PWA version correction](../../../versions/PWA_VERSIONING.md#v060-local-history-and-v450-prepared-release-october-16-2026) prepares app `0.6.0` without rewriting the receipt or changing model files. PWA `0.6.1` added uncertain-score display and Terms clarification. The current [prepared PWA `0.7.0`](../../../versions/PWA_VERSIONING.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026) adds optional local diagnostics and preserves raw scores for new reports, while retaining this same model, scientific evidence, and rejection rule. Its current WebGL runtime preference is forced 16-bit; stored model weights are unchanged. Repository adoption does not mean production deployment; physical-device evaluation and final release approval are recorded against the evaluated build.

V4.3.0's five-file backup remains in ignored `.tools/model-backups/v4.3.0-before-v4.5.0-local-test-20261012/`. Its new `restore-adopted-model.ps1` accepts the recorded adopted V4.5.0 configuration and restores only the original five model files plus matching active model/cache labels when explicitly passed `-Apply`. It retains both V4.5.0 runtime caches for eviction. The original candidate helper and backup bytes are preserved. This dry-run command passed without changing the active model:

```powershell
powershell -NoProfile -File ".tools/model-backups/v4.3.0-before-v4.5.0-local-test-20261012/restore-adopted-model.ps1"
```

After an actual rollback, review the adoption documentation and run formatting, typecheck, lint, and build, then reload/reopen the app. The ignored backup and helper must be copied separately to another checkout.

The browser backend uses TensorFlow.js's capability-based texture precision: WebGL uses 32-bit textures when supported and 16-bit when the device only supports 16-bit. The app logs selected precision. This does not retry after GPU memory exhaustion or a runtime crash. Saved model weights remain unquantized float32 in either case; texture precision describes browser calculations, not the stored weight format.

## Confidence-only reference figures (October 14, 2026)

Two new figures were generated locally from the preserved `confidenceOnlyReference.mangoTest` results and [confidence-only predictions](artifacts/threshold_fitting/confidence_only_mango_test_predictions.csv), using confidence **0.70** with margin and entropy rejection disabled:

- [Confusion matrix with rejection](figures/confidence_only/confusion_matrix_with_rejection.png): counts and row percentages, including a Rejected column.
- [Per-class metrics with rejection](figures/confidence_only/per_class_metrics_with_rejection.png): precision, recall, and F1 with all true mango test photos retained in class support.

The saved reference has **397 mango test photos: 377 correct accepted, 12 wrong accepted, and 8 rejected**. Correct accepted diagnoses are **377/397 = 94.96% of all inputs**; accepted-only accuracy is **377/389 = 96.92%**. Raw accuracy remains **384/397 = 96.73%**. Rejected mango photos count as missed diagnoses in recall. The metrics figure's dashed line shows correct accepted / all mango photos, not accepted-only accuracy.

The generator independently recalculates decisions, both confusion matrices, and per-class metrics from the CSV, checks them against the original evaluation JSON, and verifies unchanged test identities, class labels, and probability fields against the original prediction export. [Generation provenance](figures/confidence_only/generation_provenance.json) records source/output/generator hashes, exact unrounded metrics, and plotting-library versions; [captions](figures/confidence_only/figure_captions.json) identify the confidence-only rule and evidence limits. The reproducible generator is [tools/generate-v4-5-confidence-only-figures.py](../../../../tools/generate-v4-5-confidence-only-figures.py); it needs Python, NumPy, and Matplotlib, without TensorFlow or a GPU:

```powershell
python tools/generate-v4-5-confidence-only-figures.py
```

These are derived figures from the existing completed evaluation, not new training, model inference, an independent field test, or a browser/Keras parity measurement. Original archived figures, prediction files, evaluation receipts, and notebooks are preserved. Training curves, raw confusion/per-class figures, augmentation examples, and Grad-CAM remain valid; the original threshold search remains historical evidence of the fitted margin/entropy choice. Generating these reference figures does not edit application gates or model/cache identities, or verify a separate application configuration change. The same saved 250-photo OOD report has nine false accepts under confidence-only rules versus four under the fitted rules, as already recorded in the completed evaluation. No 30-minute R03 test or shortened substitute was run.

## V4.5.0 completed results and local test (October 12, 2026)

Training and threshold fitting are complete. The [in-depth results review](RESULTS_REVIEW_v4_5_0.md) distinguishes raw accuracy, correct accepted diagnoses, rejection, class errors, prior-use groups, and comparison limits. The preserved [training result notebook](../../../../notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Training_v4_5_0_Post_Training.ipynb) and [threshold result notebook](../../../../notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Threshold_Fitting_v4_5_0_Results.ipynb) retain their outputs. The clean templates remain separate and unexecuted.

| Outcome                                 | Saved result                                       |
| --------------------------------------- | -------------------------------------------------- |
| Mango test raw accuracy                 | 384/397, 96.73%                                    |
| Correct accepted mango diagnoses        | 375/397, 94.46% of all mango inputs                |
| Wrong accepted / rejected mango inputs  | 12 / 10                                            |
| Reporting OOD rejection                 | 246/250, 98.40%; four false accepts                |
| Reporting OOD confidence-only reference | 241/250 rejected; nine false accepts               |
| Fitted gates                            | Confidence 0.70; margin 0; normalized entropy 0.40 |

The selected evidence archive contains **117 byte-identical file copies, 36,474,749 bytes**, grouped under `artifacts/training/`, `artifacts/threshold_fitting/`, `figures/training/`, and `figures/threshold_fitting/`. [Archive provenance](artifacts/archive_provenance.json) maps every copy to its original run-relative path and SHA-256. The complete threshold receipt and every selected file were checked. The complete training photo archive was not rehashed during this local task. Original receipts, notebook outputs, and source exports were not edited or moved.

Raw photographs, split ZIP, Keras weights/checkpoints, review contact sheets, and unused failed converter attempts remain in the downloaded source collection. Binary browser shards are installed in `public/model/` rather than duplicated in the evidence folder; the archive retains the browser graph/configuration and exact shard hashes. Historical package snapshots remain evidence, not installation instructions. Converter audit findings remain visible in the copied audit reports.

### Earlier local candidate installation and rollback (October 12, 2026)

These original candidate instructions are historical. The original helper below rejects the later adopted configuration; use `restore-adopted-model.ps1` above for the current V4.5.0 bundle.

At the maintainer's request, the five V4.5.0 browser assets were copied into `public/model/` for a reversible local test. At that time, the display/storage label was `v4.5.0-candidate`, the worker cache was `mangoleaf-model-cache-v4-5-0-candidate`, and V4.3.0 remained adopted. The [local installation provenance](artifacts/local_test_installation.json) preserves those earlier identities and protected UI-testing file hashes. The later October 16 adoption is recorded above.

All five original V4.3.0 assets, pre-test constants/service-worker source, and the two intentional UI-testing files have independent verified copies in ignored `.tools/model-backups/v4.3.0-before-v4.5.0-local-test-20261012/`. Its `backup-manifest.json` records hashes, and `ROLLBACK.md` explains the targeted restore. The backup stays outside `public/` and is not included in Git or deployment. Preserve it separately when moving to a new checkout.

From the repository root, verify rollback without changing the active candidate:

```powershell
powershell -NoProfile -File ".tools/model-backups/v4.3.0-before-v4.5.0-local-test-20261012/restore-model.ps1"
```

After deciding to return to V4.3.0, add `-Apply`. The script restores only the original five assets and their active label/cache identity; other application edits and History remain. It keeps V4.5.0 in the outdated-cache list so the candidate cache can be removed. After either swap, restart the development server or rebuild the production preview, wait for worker activation, and reload/reopen the page. In-memory model and thresholds survive hot reload until the page reloads.

### Evidence limits and validation

The experiment is promising for local evaluation, with bacterial-black-spot versus mango-scab confusion remaining the main diagnostic weakness. Its test membership differs from V4.3.0 and V4.4.0, so the headline percentages do not establish superiority on matched test photos. The 200 previously evaluated OOD photos and 300 newly reserved OE photos remain exploratory evidence; unknown capture/source groups and researcher-supplied scope decisions do not establish image independence or expert review.

The source receipts explicitly leave browser/Keras probability parity unmeasured. A browser load/inference or offline check cannot change that claim or establish field accuracy. The 30-minute R03 case and any shortened substitute were not run during the October 12 local test. Physical-device evaluation remains pending for subsequent release validation. Local build and focused browser results are recorded separately in [testing evidence](../../../testing/TESTING.md#v450-local-candidate-validation-october-12-2026).

## Status and purpose

**October 11, 2026: experimental workflow preparation.** At that time these were clean notebook templates, not completed training results; V4.3.0 remained adopted. V4.5.0 training, frozen evaluation, and conversion completed before the October 16 adoption recorded above.

This experiment trains a fresh seven-class mango classifier from ImageNet initialization. It keeps the V4.4.0 architecture and learning-rate schedule, adds Outlier Exposure (OE), removes background replacement and localized lighting, and adds mild random contrast. It creates its own inventories, grouped split, weights, calibration, thresholds, and figures. Earlier MangoLeaf models, run folders, split archives, scene pools, and masks are not runtime inputs.

| Notebook                                                                                                     | What it produces                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Training](../../../../notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Training_v4_5_0.ipynb)                   | Reviewed raw inputs, fresh mango membership, OE training, temperature calibration, model export, training curves, augmentation examples, and Grad-CAM.    |
| [Threshold fitting](../../../../notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Threshold_Fitting_v4_5_0.ipynb) | Verified training input, reviewed OOD groups, fitted and frozen rejection settings, test metrics, evaluation figures, and an experimental browser bundle. |

Both notebooks use ordinary Colab Python cells. There is no custom `%%mangoleaf` execution layer. Each numbered step explains **What**, **Why**, **How**, and **Expected result** in plain English. Clean templates have no execution outputs; save completed copies separately after running them.

## Original Drive inputs

Mount the account whose actual My Drive folder will store the new results. Original photo collections can belong to that account or be shared from another account through explicitly enabled My Drive shortcuts. Inspect the displayed selected and resolved paths before continuing.

| Input under `My Drive`                      | Role                                                                                                                    | Expected count                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `final_mangoleafai_dataset_public_and_bpi/` | Labeled mango photos for the fresh grouped training/validation/test split.                                              | Count and decode the actual collection; do not copy historical split counts.     |
| `mangoleafai_oe_images/`                    | Auxiliary unsupported photos used during training.                                                                      | Count automatically; the estimate of more than 1,500 is not a verified count.    |
| `mango_ood_test_v4_4_0/`                    | Unsupported photos reserved for later tuning and reporting. Its folder name does not make it a previous-run dependency. | **500 photos for the intended first run**, after adding 300 to the existing 200. |
| `mangoleaf_experiments/`                    | Parent directory for new output runs.                                                                                   | An actual writable directory in the mounted account's My Drive.                  |

The expected OOD count is checked before training. Collect the additional 300 unsupported photos before starting; the notebook cannot supply them. Keep them separate from OE training photos, including crops, recompressions, neighboring video frames, and captures of the same scene. A count of 500 files alone does not establish 500 independent examples. Duplicate exclusions or inseparable groups can require replacing photos before the 250/250 assignment is possible.

The original 200 OOD photos have been used in earlier experiments. Their reuse remains visible. Review records distinguish known prior use, newly collected photos, and unknown history; unknown history is not silently treated as new. The full mixed collection is exploratory evidence. Report results by prior-use status as well as for the full reporting pool.

Input shortcuts resolving under `/content/drive/.shortcut-targets-by-id/<id>/<folder>` require `ALLOW_SHARED_INPUT_SHORTCUTS = True`. Other external input paths remain unsupported. Output folders and completed training-run paths must resolve inside the mounted account's My Drive; shared output shortcuts are rejected. A browser screenshot is not proof that a mounted Colab path exists.

### Using another account with shared original photos

This supports the same account arrangement described for V4.2.0: shared source photos and a separate actual `mangoleaf_experiments` output folder in the account running Colab. V4.5.0 still creates fresh inventories, membership, weights, and receipts; it does not read V4.2.0 artifacts.

1. Open the updated notebook under the account that will run it. A different account uses a separate runtime, so begin with Step 1 and follow the installation/restart instructions.
2. Share the original mango, OE, and OOD folders with that account as needed. In its Drive, use **Organize > Add shortcut** to place each shared input in **My Drive**, keeping the input folder names above. Sharing alone does not select a notebook path. The shortcut needs permission to the original folder. See [Google Drive shortcut instructions](https://support.google.com/drive/answer/9700156?co=GENIE.Platform%3DDesktop&hl=en).
3. In training Step 3, set `ALLOW_SHARED_INPUT_SHORTCUTS = True`. In threshold fitting Step 1, enable the same setting if the OOD input is shared. The notebooks display both the selected path and its resolved target, and still require each training input/output location to be separate.
4. Select the actual `mangoleaf_experiments` output folder in the mounted account. If a shared output shortcut has the same name, rename that shortcut to a different name before starting so the actual folder retains the selected path. If the actual output folder has a different name, update training `OUTPUT_ROOT` and threshold `EXPERIMENT_ROOT` consistently. Preserve all earlier run folders.
5. Carry review decisions explicitly. For the supplied 300-image OE/OOD overlap, save the unique OE ID list before leaving the original runtime and put those IDs in the new run's Step 6 `REJECTED_OE_IDS`. That excludes these photos from approved OE training while reserving them for OOD. The Python variable `overlapping_oe_ids` does not transfer between accounts. All remaining capture/source and similarity reviews still apply.

An already open Colab copy does not receive repository edits automatically. Replace training Step 3's Markdown/code cell with the updated template before creating a new run, or upload the updated template and restore the reviewed settings. For threshold fitting, use the updated Step 1. Enabling shared inputs does not provide a scan cache; normal Step 4 still inventories the selected photos.

## Where Google Drive outputs go

All new results stay in the selected account's actual **My Drive → mangoleaf_experiments** parent:

```text
MyDrive/mangoleaf_experiments/
└── v4.5.0/
    ├── training/
    │   └── v4-5-0-training-<timestamp>-<unique-id>/
    │       ├── inventories, review decisions, and split archive
    │       ├── checkpoints, class weights, temperature, and receipts
    │       ├── tfjs_model/
    │       └── figures/
    └── threshold_fitting/
        └── v4-5-0-thresholds-<timestamp>-<unique-id>/
            ├── OOD reviews, grouped assignments, and selection lock
            ├── predictions, metrics, and completion evidence
            ├── figures/
            └── experimental export bundles
```

Paste only the completed V4.5.0 training run's folder name into the threshold notebook, for example `v4-5-0-training-<timestamp>-<unique-id>`. Do not paste `/training/...`: that leading slash changes a relative name into an absolute Linux path. The printed training-completion location and its receipt identify the correct input. A failed run folder is not a completed training input.

Runs have unique identities and receipts. Existing completed results are not overwritten. The raw collections remain inputs; new audits and artifacts are written to the new version's run directory.

## Dataset and review boundaries

### Retain the 62 reviewed photos

Step 5 of the completed V4.4.0 training notebook embeds **62 previously reviewed distinct photo identities**. V4.5.0 embeds those literal labels, names, and SHA-256 fingerprints as review evidence. Their presence does not require a previous notebook or run folder in Colab.

Keep those 62 identities. Perceptual similarity is a reason to group related photos, not automatically delete them. Genuine byte-identical or decoded-identical copies still need one representative; a conflict involving reviewed identities must stop for explicit resolution rather than silently remove a protected photo. A conflicting label also needs review. Save retained/excluded identities and reasons in the new audit.

### Fresh approximately 70/15/15 mango membership

Group exact/related captures before splitting. Assign whole groups to training, validation, or test with seed 42, aiming for 70%, 15%, and 15% per class. Groups and reserved illustration photos can make counts differ slightly from exact percentages; save the actual class/subset table rather than claiming an exact split.

Validation images fit temperature and rejection settings. Mango test images are not predicted until rejection settings are frozen. OE images never enter mango class counts, class weights, validation accuracy, temperature fitting, or the mango confusion matrix. OOD tuning/reporting images never supply training gradients.

The cross-pool audit checks source identities, byte hashes, decoded pixels, perceptual similarities, and reviewed capture groups. Keep related OE/OOD sources out of both pools. Perceptual hashing cannot prove complete independence, so human review of related captures and source provenance remains necessary.

### Fixed illustration photos

Use the same selected source photos in both augmentation and Grad-CAM figures. Reserve their entire related groups in validation before assigning the remaining groups.

| Mango class          | Preferred original filename                          |
| -------------------- | ---------------------------------------------------- |
| Anthracnose          | `DSC_0488.JPG`                                       |
| Bacterial Black Spot | Seeded choice from eligible originals.               |
| Bacterial Canker     | Seeded choice from eligible originals.               |
| Healthy Fruit        | `723624552_976005712089787_680463173797746853_n.jpg` |
| Healthy Leaf         | `HealthyLeaf_1.jpg`                                  |
| Mango Scab           | `verified mango disease 67.jpg`                      |
| Sooty Mold           | `IMG_20260219_134935.jpg`                            |

Save the selected source paths and hashes. Missing or ambiguous named examples stop for correction; a different photo is not silently substituted.

## Training recipe

| Setting                 | V4.5.0 rule                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classifier              | ImageNet-initialized MobileNetV3-Large with seven mango outputs.                                                                                              |
| Class order             | Anthracnose, Bacterial Black Spot, Bacterial Canker, Healthy Fruit, Healthy Leaf, Mango Scab, Sooty Mold.                                                     |
| Model input             | Whole-photo RGB resize to 224 × 224, float32 values in 0–255; MobileNet's built-in preprocessing handles scaling.                                             |
| Seed / mango batch size | 42 / 32.                                                                                                                                                      |
| Stage 1                 | Five epochs, frozen backbone, learning rate **0.001**.                                                                                                        |
| Stage 2                 | Ten epochs, fine-tuning, learning rate **0.00001**, BatchNormalization kept frozen.                                                                           |
| Checkpoint selection    | Restore the best clean mango validation-loss checkpoint from stage 1 before stage 2; select the best stage-2 validation-loss checkpoint.                      |
| Class weights           | Compute balanced weights from fresh mango training counts: `training_total / (7 × class_training_count)`.                                                     |
| OE objective            | Mango supervised loss plus **0.5 ×** the mean uniform-target loss on approved OE photos. This is a starting research setting, not a proven MangoLeaf optimum. |
| Temperature             | Fit on clean mango validation logits only, then fold it into the final classifier once.                                                                       |

Class weights increase the contribution of a minority class's training mistakes. They do not add photos, relabel another class's photos, or balance the test set. Fresh split counts determine fresh weights; do not reuse V4.3.0's Healthy Fruit value of 3.3748.

Training records mango accuracy separately from OE loss. Weighted, augmented training loss and clean, unweighted validation loss have different measurement conditions; a lower validation loss is not automatically a bug. The history also records loss components and learning rates so the OE contribution remains visible.

### Augmentation

| Technique                     | Meaning                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Horizontal and vertical flips | Change leaf/fruit orientation while keeping its label.                                  |
| Random rotation, ±30°         | Rotate by a randomly sampled angle within the same range as V4.4.0.                     |
| Random zoom, 0.2              | Apply the retained zoom range during training.                                          |
| Random shear, 0.2             | Apply the retained mild slant range during training.                                    |
| Global brightness, 0.2        | Brighten or darken the whole image; this remains separate from contrast.                |
| **Random contrast, 0.1**      | Sample a factor between **0.9 and 1.1**, changing differences from each channel's mean. |

Background replacement and localized lighting are excluded. There is no scene collection, mask proposal, white-background review, or mask approval stage. Train-only transformations must remain connected to actual training inputs; declaring an unused augmentation layer does not augment a model. Validation/test scoring uses original resized pixels. See the [Keras contrast definition](https://keras.io/api/layers/preprocessing_layers/image_augmentation/random_contrast/).

### What Outlier Exposure does

For a mango training photo, the classifier learns its correct mango class. For an approved unsupported training photo, OE encourages its seven probabilities to be less concentrated on one mango class, using a uniform target of `1/7` per class. The OE coefficient controls how strongly that auxiliary loss contributes; it is separate from mango class weights and the contrast factor.

OE does not add an eighth “non-mango” class. Rejection still depends on the fitted confidence, margin, and entropy rules. It may improve rejection of unseen unsupported photos, but it does not guarantee rejection of every object or every disease outside the seven labels. A supported mango photo must not be incorrectly placed in OE. The [original OE paper](https://arxiv.org/abs/1812.04606) describes auxiliary outliers that remain separate from evaluation outliers.

Include diverse, reviewed unsupported scenes and objects, including realistic phone captures. Check source permissions and record honest provenance. A fruits dataset that contains mango categories requires removing those categories from OE. Repeated adjacent frames and a large number of nearly identical white-background fruits are not equivalent to diverse unsupported phone photos.

## Calibration, threshold fitting, and reporting

The threshold notebook verifies the completed training receipt, required artifact hashes, seven-class order, validation ordering, and folded temperature. It checks the same declared OOD pool against the frozen mango and approved OE inventories, then assigns **250 tuning and 250 reporting photos** without splitting related groups.

Confidence stays fixed at **0.70**. Search margin and normalized entropy on mango validation and OOD tuning only, using the retained grid and **95% minimum mango validation retention** rule. If no setting is feasible, record that result clearly; do not invent a fitted candidate or reduce the agreed retention target silently.

Freeze settings and input identities before mango test and OOD reporting inference. Report raw mango accuracy, all-image accepted-correct fraction, accepted-only accuracy, rejection counts, per-class scores, and reporting OOD false acceptance. Rejected mango photos must remain in full-set denominators. Lower false acceptance is useful only alongside retained correct mango diagnoses.

This is a changed split and a changed training recipe, with partially reused OOD evidence. Comparing its results with V4.3.0 or V4.4.0 is exploratory. Changing OE and augmentation together does not isolate the benefit of OE alone; a later matched control would be needed for that causal claim.

## Figures generated from actual V4.5.0 results

| Figure                     | How to read it                                                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `training_curves.png`      | Side-by-side mango accuracy and loss curves, training/validation legend, stage boundary after epoch five, and both learning rates. Read the loss labels because OE and class weighting change training conditions. |
| `confusion_matrix.png`     | Left: raw test-image counts. Right: each actual-class row as percentages; the diagonal is per-class recall. Actual classes are rows and predicted classes are columns.                                             |
| `per_class_metrics.png`    | Precision, recall, and F1 bars for all seven classes, actual support counts, and a dashed overall raw-accuracy reference. A displayed rounded 1.00 is not proof of an exact perfect score.                         |
| `augmentation_preview.png` | Each fixed original alongside examples of the actual six training transforms. These are illustrations, not extra dataset members.                                                                                  |
| `grad_cam.png`             | Original and heatmap for the same seven selected photos, with true/predicted labels and source identity. Heatmaps show model attention, not proof of disease localization or correctness.                          |

The confusion matrix, per-class bars, and paired training panels follow the requested V2.1 layout. Their labels identify **V4.5.0** and their numbers come from this new run. No V2.1 or V4.4.0 metric values are copied. Display a plain-English caption under each plot and save its source/figure identity. Gated results remain separate from the raw seven-class charts so rejected images are visible.

## Colab setup and review workflow

1. Add the planned OOD photos and check that input folders belong to the original account.
2. Upload the clean training template. Open **Runtime > Change runtime type**, keep **Python 3**, choose a GPU such as **T4**, and select **Runtime Version 2026.04**. Google lists this image as Python 3.12.13 with TensorFlow 2.19.0. If unavailable, choose another listed Python 3.11/3.12 runtime. Run package setup and follow the restart instruction before importing the pinned scientific packages. See the [official runtime list](https://research.google.com/colaboratory/runtime-version-faq.html).
3. Mount Drive, verify paths, and complete inventories and source/capture-group reviews. Review OE scope carefully; do not approve mango examples as unsupported.
4. Finish grouped mango membership and converter preflight before the 15 training epochs. Keep GPU, package/audit, conversion, input, and checkpoint evidence.
5. Finish calibration, figures, export, and `training_complete.json`. Save a separate completed training notebook.
6. Upload the threshold template, prepare its runtime, mount the same Drive, and paste the completed run folder name.
7. Review OOD membership, provenance, and related groups. Fit gates, freeze selection, then generate reporting results and bundles. Save a separate completed threshold notebook.

When editing a review in Google Sheets, download the result as **CSV** and replace the exact CSV file read by the notebook. A native `.gsheet` is a separate Drive object. “Saved to Drive” in Sheets does not update the original CSV. Preserve identity/hash columns, lowercase decision values, and honest source notes; do not enter claims about individual sources that have not been verified.

The new setup installs a narrow explicit package plan rather than a historical freeze. Normal Colab cells share the provider interpreter, so a restart and import/version/GPU checks matter. Runtime audit findings and provider conflicts remain visible. The CPU converter has its own package environment and preflight; that is a subprocess used for conversion, not a custom notebook kernel. Local template checks do not establish successful Colab GPU training or browser numerical parity.

Colab generally recommends its latest runtime with notebook-specific library installation. **Recommended** selects a provider image; it does not certify this notebook's pinned packages or audit result. It can be used with this workflow only when its actual interpreter is Python 3.11/3.12 and installation, restart, audit, GPU, and converter checks pass. The listed 2026.04 image provides a known starting interpreter. Switching images alone does not replace the security fixes below. See Google's [runtime guidance](https://research.google.com/colaboratory/runtime-version-faq.html).

### If Step 1 reports an unsupported Python version

The **T4** label identifies the GPU, and **Python 3** identifies the language family. Neither establishes Python 3.11 or 3.12. Setup prints the exact interpreter version and stops before package installation when it is unsupported. TensorFlow 2.19.0 publishes Python 3.11/3.12 wheels, with no Python 3.13 wheel in that release's [package files](https://pypi.org/project/tensorflow/2.19.0/#files).

Select the compatible runtime image under **Runtime > Change runtime type**, save the runtime choice, reconnect, and rerun notebook Step 1. Changing the runtime image replaces the live session, so rerun its cells in order. Removing the guard or upgrading only TensorFlow would change the reviewed training/converter package contract. Successful Drive mounting does not establish package compatibility.

### If Pillow reports that `_Ink` cannot be imported

An upgraded Pillow module can reference `_Ink` while an older `PIL._typing` module remains loaded in the session. The [Pillow 12.3.0 source](https://pillow.readthedocs.io/en/stable/_modules/PIL/_typing.html) defines that symbol. The screenshot alone cannot distinguish cached older modules from an inconsistent installation, so restart first: use **Runtime > Restart session**, rerun **Step 1**, then rerun **Step 2**. Do not repeat the installation while keeping previously imported scientific modules alive.

The training notebook now checks the installation process ID before its scientific imports. The threshold notebook already checks restart status before imports; its redundant later check was removed. These guards preserve the existing package plan and stop with restart instructions before a stale Pillow import can obscure that instruction.

If the same import still fails after the restart, reinstall only the pinned Pillow package in a new ordinary Python cell, restart again, and rerun Steps 1 and 2. A reinstall does not itself clear modules already imported into the kernel:

```python
import subprocess
import sys

subprocess.check_call([
    sys.executable, "-m", "pip", "install",
    "--only-binary=:all:", "--no-deps", "--no-cache-dir", "--force-reinstall",
    "Pillow==12.3.0",
])
```

### If Step 2 reports unresolved training dependencies

The October 11 supplied audit completed with **33 reported findings across seven packages**, with no missing or unexpected package names. Some advisory entries repeat, so this is not a count of 33 unique vulnerabilities. The cause was that pip retained older Colab helper packages whose versions satisfied the scientific packages' minimum requirements. A completed audit with vulnerabilities must stop training; it is not fixed by ignoring the return code.

Both templates now install these explicit security versions alongside their unchanged scientific pins. Setup updates pip first, records both installer and package logs, and requires a restart before scientific imports. Failed audits print package names, advisory IDs, available fix versions, skipped packages, and collection gaps before stopping.

The dependency walk now includes enabled extras, such as the `filelock` dependency requested by `CacheControl[filecache]`, and checks each installed dependency against its required version range. Research dependency conflicts block execution. Conflicts involving unrelated Colab provider packages remain a separate visible report.

| Package    | Supplied session version | Selected version and official package metadata         |
| ---------- | ------------------------ | ------------------------------------------------------ |
| idna       | 3.11                     | [3.15](https://pypi.org/pypi/idna/3.15/json)           |
| msgpack    | 1.1.2                    | [1.2.1](https://pypi.org/pypi/msgpack/1.2.1/json)      |
| pip        | 24.1.2                   | [26.2.1](https://pypi.org/pypi/pip/26.2.1/json)        |
| requests   | 2.32.4                   | [2.33.0](https://pypi.org/pypi/requests/2.33.0/json)   |
| setuptools | 75.2.0                   | [83.0.0](https://pypi.org/pypi/setuptools/83.0.0/json) |
| urllib3    | 2.5.0                    | [2.8.0](https://pypi.org/pypi/urllib3/2.8.0/json)      |
| Werkzeug   | 3.1.7                    | [3.1.9](https://pypi.org/pypi/werkzeug/3.1.9/json)     |

These releases publish wheels and support Python 3.11/3.12. Their published requirements fit the reviewed TensorFlow, Requests, TensorBoard, and audit-tool dependency bounds. The selected version metadata returned no advisory entries during the targeted lookup. That lookup does not replace the notebook's audit of the entire installed dependency closure or prove a successful GPU run.

**Using the updated templates:** save your current notebook outputs, use a fresh compatible Colab runtime, upload the updated template, and run setup. Restart as instructed, then rerun Step 1 and Step 2. A receipt from the earlier package list deliberately stops with “Setup pins changed”; restarting alone does not replace that receipt. Do not delete Drive run folders or modify their evidence to bypass this check.

**Continuing the existing Colab training copy that stopped before training:** if its package list still has the original eleven scientific/setup pins, run this ordinary Python cell once to patch the seven reported helpers. Copy the updated training template's **Step 2 verification cell** into that existing copy so it also checks enabled extras and dependency bounds. Then use **Runtime > Restart session**, rerun its unchanged Step 1, and rerun Step 2. This keeps its original setup receipt consistent while repairing the scientific runtime's helper packages; the complete audit must still pass. Use the fresh-template route above for the simplest reproducible setup. Do not use this repair cell inside the separate converter environment.

```python
import subprocess
import sys
from pathlib import Path

security_pins = [
    "pip==26.2.1", "setuptools==83.0.0", "idna==3.15", "msgpack==1.2.1",
    "requests==2.33.0", "urllib3==2.8.0", "werkzeug==3.1.9",
]
log_path = Path("/content/mangoleaf-v450-security-repair.log")
with log_path.open("w", encoding="utf-8") as log:
    for packages in ([security_pins[0]], security_pins[1:]):
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--disable-pip-version-check",
             "--only-binary=:all:", *packages],
            capture_output=True, text=True, check=False,
        )
        log.write(result.stdout + "\n" + result.stderr + "\n")
        log.flush()
        if result.returncode:
            raise RuntimeError("Security repair failed. Read " + str(log_path))
print("Repair installed. Restart session, then rerun Step 1 and Step 2.")
```

The training/threshold interpreter can use setuptools 83.0.0. The separate converter retains setuptools 81.0.0 because TensorFlow Hub 0.16.1 imports `pkg_resources`, which newer setuptools removed. Its exact source-distribution advisory stays visible with the documented unused-operation review; the other helper fixes also apply there. No unrelated converter finding is waived. The [security review](../../../security/DEPENDENCY_SECURITY.md#october-11-2026-experimental-notebook-runtime) keeps those two environments distinct.

### If Step 9 reports a wheel and packaging conflict

The supplied installation log showed `wheel==0.46.3` requiring `packaging>=24.0` while the converter pins `packaging==23.2`. TensorFlow.js 4.22.0 requires packaging 23.x, and TensorFlow Decision Forests 1.12.0 requires wheel without a version bound. Removing the direct wheel pin would still install that dependency. The corrected converter selects `wheel==0.45.1`, whose packaging requirement accepts 23.2. See the published [TensorFlow.js requirements](https://pypi.org/pypi/tensorflowjs/4.22.0/json), [TFDF requirements](https://pypi.org/pypi/tensorflow-decision-forests/1.12.0/json), and [compatible wheel requirements](https://pypi.org/pypi/wheel/0.45.1/json).

Wheel 0.45.1 retains [GHSA-8rrh-rw8j-w5fx / CVE-2026-24049](https://github.com/advisories/GHSA-8rrh-rw8j-w5fx), affecting `wheel unpack` and permission handling for archive RECORD entries. The converter uses uv for binary-wheel installation and never invokes those wheel extraction APIs. Its audit records this exact package/version/advisory as an unused-operation review alongside the existing setuptools source-distribution review. Both findings remain unresolved and visible; unknown aliases, other versions, other findings, skipped packages, collection failures, and dependency conflicts still block. This is compatibility with a reviewed operation boundary, not a security patch or a clean audit.

**Continue the existing live Colab run:**

1. Keep the session connected. Open the corrected training template and copy its complete **Step 9 code cell** into the existing notebook, replacing that cell's code. Keep your review settings and other cells.
2. Run the replacement Step 9 cell. It accepts only the demonstrated installation conflict with the two expected setup logs and no completed preflight or frozen/trained state. It preserves the original log directory as `converter_preflight.failed-<timestamp>-<identity>/`, copies its original bytes into the new preflight evidence, records hashes in `retry-provenance.json`, and creates a fresh converter subprocess environment.
3. Continue to Step 10 only after package installation, `pip check`, the full installed-converter audit, and the architecture conversion probe pass their gates. Steps 3–8 and image inventories do not need rerunning for this converter-only repair.

Do not upload a separate notebook into a fresh runtime when trying to retain this live session's inventories. A successful or frozen preflight cannot be reset with this retry, and a failure with a different cause stops for diagnosis without archiving or replacing its evidence. The retry does not change the scientific interpreter, learning rates, class weights, OE membership, augmentation, calibration, or thresholds.

**Local proof:** a binary-only Linux Python 3.11 resolution of the corrected converter plan selects 82 packages. A metadata audit of those exact versions exits 1 with three entries representing two distinct advisories in setuptools and wheel, including a repeated setuptools record; no packages are skipped. This checks package metadata rather than an installed Colab environment. The actual converter install, audit, and conversion probe must still finish in Colab.

### If Step 4 counted 200 OOD photos after a long scan

The supplied October 11 run spent about an hour in inventory before reporting **200 OOD photos instead of the planned 500**. This is an incomplete input collection, not evidence of a T4 failure. The earlier 15–40 minute estimate did not describe that session's observed duration. No fixed completion time is established for future runs.

Extract and upload 300 additional distinct unsupported photos into `MyDrive/mango_ood_test_v4_4_0`, keeping the existing 200. Nested image folders work; an unopened ZIP is not an image collection. Keep OOD photos separate from OE training photos. Exact-copy and cross-pool review gates remain in place.

The updated training template counts OOD candidates before reading mango/OE image contents. It then validates mango/OE counts and runs the original decode/hash checks, with progress every 100 files and every ten preview pages. This avoids a long scan before a known count failure; it does not establish faster successful inventory processing. Step 5 now requires matching saved inventories and the expected counts before doing its mango review.

**A normal Step 4 rerun starts its inventories again.** It has no checkpoint/resume cache. Uploading images changes Drive files, not the existing `held_out_ood_rows` variable. Step 5 handles mango duplicates and review sheets only; it does not refresh OOD. If the older copy's Step 5 is already running, let that mango-only work finish, then check:

```python
print("OOD images in memory:", len(held_out_ood_rows))
```

If this says 500 and Step 4 completed successfully, continue normally. If it says 200, use the recovery below before proceeding to OE/cross-pool review. New repository edits do not automatically update an already open Colab copy.

**Recovery for this specific failure:** keep the same live session, `RUN_DIR`, and unchanged mango/OE inputs. After uploading all 500 OOD images, run this new ordinary Python cell. It reuses the completed mango/OE inventories, rescans OOD, writes the three checked inventories, and creates the unfinished OE previews. It still performs OOD decoding and exact-copy checks. The later pre-training source-hash verification remains required. Do not rerun Step 3, which creates another run, or delete earlier evidence to bypass a conflict. If the session was reset or input collections changed, rerun the normal preparation instead.

```python
required = {"raw_rows", "oe_raw_rows", "held_out_ood_rows", "RUN_DIR"}
if not required.issubset(globals()):
    raise RuntimeError("Previous inventory variables are gone. Rerun normal preparation.")
if len(raw_rows) != EXPECTED_RAW_IMAGE_COUNT or not oe_raw_rows:
    raise RuntimeError("Mango/OE inventories did not finish. Rerun Step 4.")
if any((RUN_DIR / name).exists() for name in (
    "cross_pool_overlap_audit.json", "frozen_inputs.json", "training_started.json",
)):
    raise RuntimeError("Later input evidence already exists. Preserve this run; do not replace its OOD inventory.")

ood_files = [path for path in Path(OOD_INPUT).rglob("*")
             if path.suffix.lower() in IMAGE_EXTENSIONS and path.is_file()]
if len(ood_files) != EXPECTED_OOD_IMAGE_COUNT:
    raise ValueError("Expected 500 OOD image files; counted " + str(len(ood_files)))

print("Rescanning OOD only; keeping completed mango/OE inventories.", flush=True)
held_out_ood_rows = image_inventory(OOD_INPUT, "ood")
if len(held_out_ood_rows) != EXPECTED_OOD_IMAGE_COUNT:
    raise ValueError("The readable OOD inventory must contain 500 photos.")
if (len({row["sha256"] for row in held_out_ood_rows}) != EXPECTED_OOD_IMAGE_COUNT
        or len({row["decodedRgbSha256"] for row in held_out_ood_rows}) != EXPECTED_OOD_IMAGE_COUNT):
    raise ValueError("OOD contains exact copies. Replace them with distinct photos before continuing.")

save_json_once(RUN_DIR / "mango_inventory.json", {"images": portable_rows(raw_rows)})
save_json_once(RUN_DIR / "oe_raw_inventory.json", {"images": portable_rows(oe_raw_rows)})
save_json_once(RUN_DIR / "held_out_ood_raw_inventory.json", {"images": portable_rows(held_out_ood_rows)})
save_contact_sheets(
    oe_raw_rows, RUN_DIR / "oe_review_previews",
    "V4.5.0 OE input review: verify unsupported scope and related captures",
)
print("Step 4 recovered. OOD images:", len(held_out_ood_rows))
```

If mango-only Step 5 already finished, its results remain applicable when mango inputs are unchanged. Resume at the next unfinished mango review/OE review cell after completing this recovery; the new OOD inventory must be used in cross-pool checks. This recovery does not approve any review automatically.

## Local developer verification

Run the focused verifier from the repository root with Python 3.11+ and its documented local check dependencies:

The local verifier needs **nbformat, NumPy, Pillow, Matplotlib, and packaging**. Use a separate development environment containing them; this small fixture environment is not the Colab training package plan.

```bash
python tools/verify-v4-5-notebooks.py
```

It checks notebook structure, ordinary executable cells, embedded review identities, split and leakage boundaries, OE loss accounting, temperature/gate contracts, and synthetic chart inputs. Converter fixtures check that the demonstrated install failure can resume without changing completed inventories, both failed logs remain byte-identical and hashed, frozen runs and unrelated failures cannot reset, and operation reviews retain all findings while rejecting unreviewed aliases or versions. It must not install training packages, download ImageNet weights, run training, mutate Drive, or start application reliability tests. Its fixture scores are validation inputs, not model results.

Application TypeScript, lint, and static build checks remain separate. The requested 30-minute R03 testcase and shortened substitutes are excluded from this preparation task.

### Preparation checks — October 11, 2026

| Check                              | Recorded result                                                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notebook structure                 | Both clean templates pass notebook-format validation and Python syntax checks: 17 training steps and 13 threshold-fitting steps.                                                   |
| Synthetic data boundaries          | Reviewed identities, grouped mango membership, 500-photo OOD assignment, provenance, overlap rejection, and incomplete-review failures pass.                                       |
| Training and evaluation safeguards | OE loss accounting, fresh class-weight checks, temperature folding, artifact hashes, live model/prediction-input checks, and frozen gate-selection checks pass.                    |
| Chart calculations                 | Actual plotting helpers render synthetic V4.5.0 fixtures; counts, row percentages, class bars, and the two-stage history are checked. These fixture numbers are not model results. |
| Application checks                 | Typecheck, lint, and production build pass. Lint retains one existing unused-import warning in `scan-details-modal.tsx`.                                                           |
| Export and archives                | All 10 exported PWA/model assets pass verification; both preserved historical package-evidence records pass their archive checks.                                                  |
| Preservation and documentation     | All 411 protected older notebook, scientific evidence, and browser-model files retain their original bytes. Reviewed local documentation targets resolve.                          |

The OE formula check uses a NumPy adapter; it does not establish TensorFlow gradient behavior or GPU compatibility. The training notebook includes a real TensorFlow gradient/serialization probe and converter preflight to run in Colab before fitting. Colab package installation, GPU training, browser numerical parity, and the reliability session were not executed during these local preparation checks. Save their actual evidence when they are run.

The Step 1 runtime follow-up also passes synthetic interpreter checks: Python 3.11/3.12 reach the mocked Drive mount, while 3.10/3.13/3.14 stop beforehand and report the detected version with runtime-selection instructions. Both templates keep their original TensorFlow 2.19.0 pins. This checks the preflight behavior, not a successful remote Colab installation.

The dependency-repair fixtures execute the actual setup and audit branches with controlled subprocess results. They verify that installer/main-install failures write no success receipt, reruns do not reinstall packages, changed receipts require a fresh setup, and vulnerabilities, skipped/missing/unexpected packages, or nonzero audit exits remain blocking. Additional fixtures include enabled extras reached through different paths, a dependency cycle, an incompatible installed version, and a missing extra dependency. Duplicate advisory entries print once when their ID and fix details match. The seven package selections and unchanged scientific plan are checked in both templates. An actual Colab installation and full audit rerun remain required.

Inventory regression fixtures reproduce the 200/500 count failure at the actual Step 4 entry and prove that no mango/OE listing or decoding starts first. They check supported files in nested folders, excessive/missing counts, unchanged image hashes and IDs, final progress, unreadable-image evidence, and the Step 5 saved-inventory gate. The documented recovery is separately exercised with controlled inventories; it must rescan only OOD and retain the later review and source-hash checks. These are implementation checks, not a Colab timing benchmark.

## Evidence to preserve after execution

Keep original completed notebooks, source inventories, review decisions, grouping/split membership, configuration/runtime hashes, checkpoints, class weights, temperature fit, conversion receipts, gate-selection lock, predictions, metrics, figure manifests, and completion records in Drive. Archive only important result files under this version's repository `artifacts/` and `figures/` after they exist, with a separate source-path/hash mapping. Do not copy whole raw collections, temporary runtimes, weight directories, or unfinished run folders into documentation.

Neither successful template verification nor a generated candidate bundle establishes model adoption, phone reliability, deployment, or real-world diagnostic accuracy. Record those decisions and checks separately under the [model-version policy](../../../versions/AI_MODEL_VERSIONING.md).

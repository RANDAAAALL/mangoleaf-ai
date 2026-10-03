# Separate leaf and fruit experiment v4.2.0

> **Status: completed experimental runs; local two-model test ended and app returned to V4.1.1.** The Mango Leaf threshold fit produced a feasible candidate. Mango Fruit produced a training export, but **no feasible threshold candidate**: even the fixed 0.70 confidence-only gate retained only 77 of 94 validation fruit photos, below the required 95%. The fruit export was used only for exploratory local testing, not as an approved fitted model. Neither V4.2.0 model is adopted or released. [V4.3.0 Combined](../../non-experiment/v4.3.0/TRIAL_v4_3_0.md#current-model-adoption-october-2-2026) was later adopted as the current application model on October 2, 2026, with app `0.4.9` and model `v4.3.0`; the dated V4.2.0 records remain historical.

V4.2.0 tested two separate classifiers behind a local user choice: **Mango Leaf** and **Mango Fruit**. It did not establish fewer false diagnoses. Each classifier learned only its assigned classes and used one recipe with the existing base augmentation, background replacement, and localized lighting. Threshold fitting ran separately for each organ; only leaf produced a feasible gate. The V4.1.1 completed notebooks and original exports remain intact for comparison.

## Class groups and preserved split

The [V4.1.1 saved plan](../v4.1.1/artifacts/plan.json) and [validation](../v4.1.1/artifacts/selected_thresholds.json) and [test](../v4.1.1/artifacts/arms/background/raw_per_class_metrics.csv) records give these existing, content-preserved memberships:

| Model                 | Class                |     Train | Validation |    Test |     Total |
| --------------------- | -------------------- | --------: | ---------: | ------: | --------: |
| Mango Leaf            | Anthracnose          |       339 |         73 |      73 |       485 |
| Mango Leaf            | Bacterial Canker     |       343 |         74 |      74 |       491 |
| Mango Leaf            | Healthy Leaf         |       347 |         75 |      75 |       497 |
| Mango Leaf            | Sooty Mold           |       349 |         75 |      75 |       499 |
| **Mango Leaf total**  |                      | **1,378** |    **297** | **297** | **1,972** |
| Mango Fruit           | Bacterial Black Spot |       207 |         44 |      45 |       296 |
| Mango Fruit           | Healthy Fruit        |        77 |         16 |      17 |       110 |
| Mango Fruit           | Mango Scab           |       157 |         34 |      34 |       225 |
| **Mango Fruit total** |                      |   **441** |     **94** |  **96** |   **631** |
| **Both models**       | Seven source classes | **1,819** |    **391** | **393** | **2,603** |

These are approximately 70% / 15% / 15% **per class**, with whole-photo rounding. Keep every photo in its existing train, validation, or test role. The 491 Bacterial Canker photos are assigned to Mango Leaf for this experiment; inspect the actual photos before freezing the plan. If any are fruits or mixed-organ scenes, record and resolve them before training instead of silently changing labels. The fruit model has only 77 Healthy Fruit training photos and 17 test photos; its per-class conclusions will be limited by that sample size.

## Google Drive inputs

The paths below refer to existing folders under `/content/drive/MyDrive/`. Their presence and contents **must be checked in Colab**; repository files cannot prove what currently exists in Drive.

| Needed for               | Drive folder                                                                                                        | What to check                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Both training notebooks  | `mango_dataset_v3/`                                                                                                 | Seven original class folders and unchanged image bytes.                                                                                                                                                                                                        |
| Both training notebooks  | `mangoleaf_v3/dataset_split/dataset_split/`                                                                         | Inner folder directly contains `train/`, `val/`, and `test/`. Match V4.1.1 memberships by content hash.                                                                                                                                                        |
| Both training notebooks  | `mangoleaf_background_photos/`                                                                                      | Same 62 scene photos; inspect suitability and source rights.                                                                                                                                                                                                   |
| Both threshold notebooks | `mango_ood_test/`                                                                                                   | Same old OOD collection and saved tune/report roles.                                                                                                                                                                                                           |
| Both threshold notebooks | `mango_ood_test_new_photos/`                                                                                        | Same 32 previously used OOD report photos. They are exploratory, **not independent new evidence**.                                                                                                                                                             |
| Both threshold notebooks | `mangoleaf_experiments/v4.1.1/threshold_fitting/v4-1-1-thresholds-20260928T060638Z-a3a7418c/evaluation_inputs.json` | Reference inventory for the previously used OOD files and their tune/report roles. The V4.2.0 notebooks check the actual photo bytes against it before fitting; if it is missing or differs, stop and investigate instead of silently changing the comparison. |

Review the saved V4.1.1 [white-background](../v4.1.1/artifacts/white_background_review.json), [mask](../v4.1.1/artifacts/mask_review.json), [lighting](../v4.1.1/artifacts/lighting_review.json), and [background schedule](../v4.1.1/artifacts/background_schedule.json) records. The V4.2.0 notebooks must verify their own selected files, hashes, masks, and previews before training; do not assume an old review automatically approves a changed input. Background and lighting effects apply **only to training images**. Validation and test images keep original pixels. Every source photo appears once per epoch; modified views do not create extra split members.

The training notebooks intentionally pause at scene, white-background, mask, and lighting review cells. Open every requested preview, record exclusions and reasons, then set the matching `*_REVIEW_COMPLETE` flag. Fill `BACKGROUND_NOTES` with source and usage-right information before starting. A review flag is a human decision, not a setting to bypass for a faster run.

The V4.1.1 mask review approved 66 photos for replacement: 48 in the leaf group and 18 in the fruit group. At the planned 30% per-epoch scene chance, this would affect only about 1% of all training presentations in either organ model if V4.2.0 approvals stay the same. Record the actual approved and replaced counts in each new run; the phrase “background replacement” alone does not mean most white backgrounds changed. Review all 62 scene photos and exclude unsuitable scenes, including the airplane view found in the prior pool, before freezing the schedule.

## Notebook order

1. Open [Mango Leaf training](../../../../notebooks/experiment/v4.2.0/MangoLeaf_AI_Training_v4_2_0.ipynb) in Colab. Run its setup, input review, training, export, and training/validation figure steps in order. Save a completed copy; do not run its marked **post-threshold figure** steps yet.
2. Open [Mango Fruit training](../../../../notebooks/experiment/v4.2.0/MangoFruit_AI_Training_v4_2_0.ipynb). Repeat the same process with fruit classes and a separate run folder. Each model starts from its own fresh initialization; never mix checkpoints or class maps.
3. Point [Mango Leaf threshold fitting](../../../../notebooks/experiment/v4.2.0/MangoLeaf_AI_Threshold_Fitting_v4_2_0.ipynb) to the **completed leaf training run**. Verify hashes and class order, fit its confidence/margin/entropy gate on leaf validation and old OOD tune photos, freeze the gate, then evaluate leaf test and OOD report photos.
4. Point [Mango Fruit threshold fitting](../../../../notebooks/experiment/v4.2.0/MangoFruit_AI_Threshold_Fitting_v4_2_0.ipynb) to the **completed fruit training run**. Repeat independently; never reuse the leaf thresholds.
5. Return to **each training notebook's post-threshold figure section**. It restores its saved training and threshold runs and draws remaining figures from frozen records. The leaf notebook saves these figures in its training run; the fruit notebook writes a separate `post_training_figures/mangofruit/<run-id>/` Drive folder from cells inside the same training notebook. No test or OOD report inference should run in that section, and no separate figures notebook is needed.

For Mango Leaf Step 25 after a disconnect, `FIGURE_TRAINING_RUN` accepts either the complete Drive path or just the run folder name. The complete path has this form: `/content/drive/MyDrive/mangoleaf_experiments/v4.2.0/training/mangoleaf/<run-id>`. Check the printed resolved path and confirm `training_complete.json` exists before making figures. If using an older uploaded Colab copy that still treats the value as a plain path, paste the **complete** path; a folder name alone makes Colab look in its current working directory.

The 0.70 minimum confidence rule remains fixed. Margin and entropy are fitted **per model**, using only validation mango photos and old OOD tune photos. Freeze each selection before its test or OOD report pass. If no gate meets the validation-retention rule, report that result; do not invent a candidate or retune on report photos. The two threshold notebooks may report different gates.

The previously used mango test set and OOD report sets support only exploratory comparison. A later, untouched expert-labeled field set should record organ, disease, capture group, lighting, and whether a user picked the correct organ. Compare the full two-choice flow with V4.1.1 on the same photos; a high score after an assumed correct choice does not measure wrong-choice behavior.

## Saved run layout

Each notebook writes new, versioned run folders under `MyDrive/mangoleaf_experiments/v4.2.0/` rather than overwriting V4.1.1:

```text
mangoleaf_experiments/v4.2.0/
|-- training/
|   |-- mangoleaf/<new-run-id>/
|   `-- mangofruit/<new-run-id>/
|-- threshold_fitting/
|   |-- mangoleaf/<new-run-id>/
|   `-- mangofruit/<new-run-id>/
`-- post_training_figures/
    `-- mangofruit/<new-run-id>/            # Created by Fruit training notebook's final figure steps
```

Selected completed-run evidence, with original source paths and SHA-256 hashes in each organ's `artifacts/source_manifest.json`, now uses this repository layout:

```text
docs/model-training/experiment/v4.2.0/
|-- TRIAL_v4_2_0.md
|-- mangoleaf/
|   |-- artifacts/
|   `-- figures/
`-- mangofruit/
    |-- artifacts/
    `-- figures/
```

During the ended local application trial, complete TensorFlow.js file sets were copied to `public/model/mangoleaf/` and `public/model/mangofruit/`. The leaf files came from the fitted `candidate_models/combined/` export; fruit files came from the training `arms/combined/tfjs_model/` export because no fitted fruit candidate exists. Their exact ten model files and eight matching app source files are now in ignored `.tools/model-backups/v4.2.0-dual-experiment-20260929/`, with SHA-256 manifest and restoration notes. Root `public/model/` again contains the single V4.1.1 Background candidate. The source runs and curated evidence remain unchanged. Neither local trial was an adoption or deployment.

## Completed results and comparison (September 29, 2026)

The completed [Mango Leaf training](../../../../notebooks/experiment/v4.2.0/MangoLeaf_AI_Training_v4_2_0_Post_Training.ipynb), [leaf threshold](../../../../notebooks/experiment/v4.2.0/MangoLeaf_AI_Threshold_Fitting_v4_2_0_Results.ipynb), [Mango Fruit training](../../../../notebooks/experiment/v4.2.0/MangoFruit_AI_Training_v4_2_0_Post_Training.ipynb), and [fruit threshold](../../../../notebooks/experiment/v4.2.0/MangoFruit_AI_Threshold_Fitting_v4_2_0_Results.ipynb) notebooks record two independent runs. The downloaded source is `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v4.2.0/`; the curated [leaf](mangoleaf/artifacts/source_manifest.json) and [fruit](mangofruit/artifacts/source_manifest.json) manifests identify each copied file, original run path, size, and SHA-256. Those manifests also distinguish the leaf fitted candidate from the fruit training export.

Both run reviews approved all **62 / 62** scene photos, excluding none. That includes the previously flagged airplane view, so scene suitability and image-use rights still need review; the saved source note is too vague to verify rights. Background replacement occurred in **203 leaf** and **70 fruit** training presentations across 15 epochs, about **0.98%** and **1.06%** of presentations respectively. Validation and test images were not background-replaced. These counts show the effect entered training, but do not show that it improved field performance.

| Measure                                                  | Mango Leaf (4 classes) |                   Mango Fruit (3 classes) |
| -------------------------------------------------------- | ---------------------: | ----------------------------------------: |
| Historical mango test, raw correct                       |     296 / 297 (99.66%) |                          86 / 96 (89.58%) |
| Gate status                                              | Feasible selected gate | **Infeasible; confidence-only reference** |
| Confidence / margin / entropy                            |        0.70 / 0 / 0.01 |                0.70 / disabled / disabled |
| Mango test: correct accepted / wrong accepted / rejected |            295 / 0 / 2 |                               72 / 0 / 24 |
| Old OOD report accepted                                  |                36 / 84 |                                   64 / 84 |
| Reused new OOD report accepted                           |                 8 / 32 |                                   23 / 32 |

The fruit validation reference retained **77 / 94 (81.91%)** known fruit photos, missing the notebook's **95% minimum**. Its [selection record](mangofruit/artifacts/selected_thresholds.json) has `status: infeasible` and `thresholds: null`; `candidate_hashes.json` is empty. The fruit report numbers describe a **reference gate**, not a selected candidate. In particular, zero wrongly accepted fruit test photos comes with **24 rejected fruit photos**. Do not call that result a reliable fruit classifier.

With a correct organ choice assumed for every test image, the two models classify **382 / 393 (97.20%)** raw test images correctly. The V4.1.1 Background seven-class model classified **387 / 393 (98.47%)** on these reused files; V4.0 classified **383 / 393 (97.46%)**. V4.1.1 classified **295 / 297 leaf** and **92 / 96 fruit** images correctly, versus V4.2.0's 296 and 86 respectively. The released V3 report also recorded **383 / 393 (97.46%)**, but it used **six classes with a merged healthy class**, so its headline accuracy is not a like-for-like seven-class comparison. These reused test and OOD photos are exploratory evidence, not an independent field estimate. OOD acceptance is a mistake rate on non-mango images: lower is preferable, but neither organ model's result proves a general OOD capability.

The [fruit per-class CSV](mangofruit/figures/per_class_metrics.csv) shows **41 / 45** Bacterial Black Spot, **28 / 34** Mango Scab, and **17 / 17** Healthy Fruit test photos classified correctly before rejection. The 17 healthy-fruit test photos are too few to establish field reliability. The [leaf per-class CSV](mangoleaf/figures/per_class_metrics.csv) shows only one raw error, in Sooty Mold (**74 / 75** correct). These are the reused test counts, not new field observations.

The [leaf figures](mangoleaf/figures/) and [fruit figures](mangofruit/figures/) each include training curves, augmentation preview, confusion matrix, per-class chart and CSV, threshold-search chart, and Grad-CAM. The previews are representative examples, not saved pixels from every random training presentation. Read the detailed [leaf](mangoleaf/artifacts/REPORT.md) and [fruit](mangofruit/artifacts/REPORT.md) reports together with the source manifests; figures alone do not establish model quality.

The ended local two-choice app experiment asked users to select Mango Leaf or Mango Fruit before opening the scan sheet and loaded both exports on initial page load. It routed a photo only to the selected classifier. If either model/config failed to load, startup showed a translated reload prompt instead of allowing a scan with a missing route. Duplicate reports were reused only when the original photo hash, local model label, and chosen organ matched. The app could not verify that a user chose the correct organ, and a wrong choice forced that image through the wrong three- or four-class model. The team found local behavior unsatisfactory and returned to V4.1.1; no formal wrong-choice or field-performance rate was recorded. A future reconsideration needs the full user flow, browser TensorFlow.js parity, first-load time, memory use on low-end devices, and fresh expert-labeled field/OOD photos. Existing single-model automated test cases were intentionally untouched and did not certify the two-model flow. The V4.1.1 and V4.2.0 ignored backups preserve exact model and app states independently.

The two model asset sets total about **24.17 MB**, versus about **12.10 MB** for the restored single candidate. Preloading both was part of the local trial and may have increased first-load time, network transfer, storage, and runtime memory; no device measurements were recorded. The OOD photos had no user-selected organ, so their per-model acceptance counts do **not** describe the real two-choice flow. Do not combine them into one apparent deployment OOD rate.

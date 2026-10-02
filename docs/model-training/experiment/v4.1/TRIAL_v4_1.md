# Seven-class background and lighting experiment v4.1

> **Status: completed experiment, not adopted or released.** The V4.1 Background arm was the September 25 local test candidate; the [V4.1.1 Background reproduction](../v4.1.1/TRIAL_v4_1_1.md#completed-run-and-local-trial-september-28-2026) was a later local test candidate. The user adopted [V4.3.0 Combined](../../non-experiment/v4.3.0/TRIAL_v4_3_0.md#current-model-adoption-october-2-2026) as the current model on October 2, 2026, with app `0.4.9` and model `v4.3.0`. Both earlier completed experiments and their backups remain preserved. The exact earlier V4 app state and the V3 shipping state remain in ignored `.tools/model-backups/`.

This experiment asks two questions: does replacing plain training backgrounds help the seven-class classifier, and does realistic uneven light help it handle field photos? Four matched training arms answer those questions separately. The folder name `v4.1` identifies this notebook workflow; it does not change the app version or deploy a model.

## Open these notebooks in order

1. [Training v4.1](../../../../notebooks/experiment/v4.1/MangoLeaf_AI_Training_v4_1.ipynb) prepares and reviews inputs, then trains control, background, lighting, and combined arms from matching initialization.
2. [Threshold fitting v4.1](../../../../notebooks/experiment/v4.1/MangoLeaf_AI_Threshold_Fitting_v4_1.ipynb) fits each arm's rejection settings, freezes all selections, and then evaluates them.

The completed [training notebook](../../../../notebooks/experiment/v4.1/MangoLeaf_AI_Training_v4_1_Post_Training.ipynb) and [threshold notebook](../../../../notebooks/experiment/v4.1/MangoLeaf_AI_Threshold_Fitting_v4_1_Results.ipynb) preserve the September 24–25 outputs. Keep them separate from clean templates and preserve the existing [v4 run and guide](../v4/TRIAL_v4.md).

## Google Drive inputs

| Folder under `MyDrive/`                     | Purpose                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `mango_dataset_v3/`                         | Original seven source folders. Training verifies their image hashes.                                       |
| `mangoleaf_v3/dataset_split/dataset_split/` | Historical `train/`, `val/`, and `test/` folders. Use the inner folder that directly contains those three. |
| `mangoleaf_background_photos/`              | Replacement scene photos; the previous experiment used 62. These are backgrounds, not OOD examples.        |
| `mango_ood_test/`                           | Previously used OOD tuning and report photos. Keep the collection unchanged.                               |
| `mango_ood_test_new_photos/`                | Newly collected OOD photos, reserved for a separate report after thresholds are frozen.                    |

Set the notebook paths to the actual Drive folders. The completed run recorded 168 old OOD photos and 32 newly uploaded photos, for 200 total. The new set was inspected through contact sheets; it includes fields, people, and cattle as well as vegetation. Its saved description as entirely "non-mango plants" is too narrow. The new 32 photos measure rejection of these scenes, not rejection of close-up lookalike leaves or disease accuracy.

Review background-photo origin and suitability. Use scene photos that do not contain mango disease specimens, another labeled mango leaf or fruit, text overlays, or sensitive information. Do not reuse validation, test, or OOD photos as replacement scenes. Record source notes and hashes. The notebooks create new outputs under `MyDrive/mangoleaf_experiments/v4.1/`; do not upload masks or synthetic photos manually.

## What changes during training

The verified v4 split stays fixed: **1,819 train, 391 validation, and 393 test photos**, with seven classes and separate healthy-leaf and healthy-fruit labels. The 62-image `mango_dataset_v3_notes_non_duplicate.md` review list is not a list of white backgrounds. Check backgrounds across the entire training split. Only verified training photos can receive new backgrounds or lighting effects; validation and test photos keep their original pixels.

Generate foreground masks from training photos, then inspect the saved original/mask/composite previews. Automatic checks catch extreme mask sizes, but cannot tell whether a mask erased a lesion or leaf edge. Reject bad IDs before training. A rejected mask keeps its original photo in every arm. Record which masks were approved, background-photo hashes, augmentation settings, and the frozen input manifest.

For an eligible training presentation, the loader may keep the original or place its masked leaf or fruit onto one of the scene photos. This composite is fed into model training and changes the learned weights. The 62 scene photos can be reused with different mango photos and across epochs. Keep original presentations in the mix; do not replace every white background. No replacement runs in the app when someone scans a photo.

V4 already has global random brightness, flips, rotation, zoom, and shear. The new lighting policy targets **local** glare or shadow, such as a bright patch on part of a leaf. Preview effects at the 224 × 224 model input size; reject settings that hide disease signs or produce unrealistic white blocks. Severe overexposure in a captured photo can erase detail that augmentation cannot restore.

| Arm        | Extra training effect                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Control    | Original v4 augmentation only                                          |
| Background | Reviewed training-background replacement plus original v4 augmentation |
| Lighting   | Local light/shadow variation plus original v4 augmentation             |
| Combined   | Background replacement and local light/shadow variation                |

Keep split membership, ImageNet initialization, model architecture, class weights, epoch schedule, and validation preprocessing matched across arms. Each arm gets its own output subfolder, calibrated model, training history, and provenance. The original clean split ZIP stays available for threshold fitting.

## Threshold fitting and evaluation

The old OOD collection may be flat or already divided into `tune/` and `report/`. Preserve its existing partition and image identities. Inspect the new OOD folder for out-of-scope content and duplicates or related captures across mango, old OOD, and background collections.

For **each arm**, use clean mango validation photos and **old OOD tune** photos to select margin and entropy. Confidence stays at 0.70. Temperature calibration uses clean validation photos during training. Save and freeze **all four** selected settings before predicting on any test or OOD report photo. Newly trained weights require newly fitted thresholds; do not copy v4.0.0's margin or entropy values.

After the freeze, report three groups separately:

1. Mango `test/`: previously used in earlier development, so its comparison is exploratory.
2. Old OOD report subset: previously used, also exploratory.
3. `mango_ood_test_new_photos/`: fresh OOD report **only if** those exact photos and related captures were not used to choose the model, augmentation, calibration, or thresholds. State its actual count; the combined old-plus-new total is not the fresh count.

Compare raw accuracy, correct and wrong accepted diagnoses, valid mango rejections, OOD false accepts, and per-class counts. Inspect black spot versus scab, both healthy classes, and harsh-light cases. High accepted accuracy alone can hide excessive rejection. A separate **new, expert-labeled mango field set** is still needed to measure field diagnosis accuracy; OOD photos only measure rejection behavior. The four shared harsh-light photos are development examples until labels and an evaluation role are recorded.

## Output and adoption boundary

Training saves a unique run under `MyDrive/mangoleaf_experiments/v4.1/training/`. Copy its printed full path into `TRAINING_RUN` in the threshold notebook. Threshold fitting writes its own unique run under `MyDrive/mangoleaf_experiments/v4.1/threshold_fitting/`. Keep manifests, reviewed-mask evidence, per-arm weights, configurations, prediction CSVs, and reports together so results can be audited after Colab disconnects.

Candidate labels may use the `model-v4.1.0` family with an arm name. A same-image training-procedure change is a minor model candidate under [model versioning](../../../versions/AI_MODEL_VERSIONING.md). No arm is adopted because it has the newest number. Review independent evidence and complete the normal release checks before any later app model swap.

## Completed result and local test

The saved training run is `v4-1-training-20260924T182154Z-2dcd4023`; threshold fitting is `v4.1-thresholds-20260924T202255Z-62a52fc0`. All four arms finished 15 epochs, and the recorded training and candidate file hashes match the saved files. Control missed the 95% validation-retention requirement by one image, so it has no selected-gate candidate.

| Arm                                | Raw correct on 393 mango test photos | Correct accepted | Wrong accepted | Mango rejected | Old OOD accepted / 84 | New OOD accepted / 32 |
| ---------------------------------- | -----------------------------------: | ---------------: | -------------: | -------------: | --------------------: | --------------------: |
| Control, confidence-only reference |                                  385 |              373 |              4 |             16 |                    31 |                     7 |
| Background                         |                                  387 |              373 |              3 |             17 |                    26 |                     1 |
| Lighting                           |                                  385 |              373 |              3 |             17 |                    21 |                     4 |
| Combined                           |                                  387 |              373 |              3 |             17 |                    26 |                     1 |

Background and combined made the same accept/reject decisions on every saved mango, old OOD report, and new OOD photo. The background arm was the simpler **provisional local test choice**, not a field-accuracy or release decision. Its fitted gates are confidence `0.70`, margin `0.00` (inactive), and entropy `0.38`. At the time, the app displayed `v4.1.0-candidate`; app version remained `0.4.8`.

Only 66 of 1,819 training photos were marked eligible for background replacement; 273 of 27,285 background-arm training presentations used a replacement scene (1.00%). The review recorded no manual additions, although the saved white-background sheets visibly include missed pale backgrounds. This run weakly tests the intended broad scene replacement. Lighting previews show mild local changes; no new expert-labeled harsh-glare mango set measured their effect. Ten retained image-similarity flags still need visual review and are not confirmed duplicates.

The 393 historical mango test photos match v4 by file hash, but they were already used in development. The old OOD folder gained one photo since v4, changing tune/report membership, so its two 84-photo report totals are not paired. The 32 new OOD photos were report-only within this run. Once their results guide arm choice, use another untouched OOD set for final evaluation. Broader browser and physical-phone inference still need testing.

The local browser suite passed 52 app cases after the background-arm swap. Its real-model Chromium desktop and mobile-emulation reports agreed: a photo named `mangofruit_mango_scab.jpg` was rejected (raw Mango Scab, 47.46%), while one named `mangoleaf_bacterial_canker.jpg` was accepted as Anthracnose (79.49%). Fixture labels come from user-supplied filenames, not expert review. These observations need review on labeled field photos and physical phones; the browser pass establishes app behavior, not diagnosis accuracy.

### Saved experimental evidence in this repository

Curated byte-for-byte run-record copies live under [artifacts/v4.1](artifacts/), with copied review sheets and newly generated post-training diagnostics under [figures/v4.1](figures/). Training provenance includes [completion and hashes](artifacts/training_complete.json), [plan](artifacts/plan.json), [white-background review](artifacts/white_background_review.json), [mask review](artifacts/mask_review.json), [replacement schedule](artifacts/background_schedule.json), and four `arms/<arm>/training_history.json` records. Threshold evidence includes the [human-readable report](artifacts/REPORT.md), [selected gates](artifacts/selected_thresholds.json), [evaluation](artifacts/evaluation.json), [candidate hashes](artifacts/candidate_hashes.json), [paired mango decisions](artifacts/paired_selected_mango_test.csv), and per-arm searches and metrics. The copied [background candidate config](artifacts/background_model_config.json) traveled with its weights during the September 25 `public/model/` trial.

The selected figures show [missed white backgrounds](figures/white_background_healthy_leaf.jpg), [mask composites](figures/mask_composites.jpg), and [lighting examples](figures/lighting_healthy_leaf.jpg). Other white-background class sheets are saved beside them. Source photos remain in their Drive input folders; full mask pages, prediction probabilities, candidate exports, and OOD contact sheets remain in the external run folders. These copies document an experiment; they do not approve deployment.

### Post-training figures, September 25, 2026

The [standalone figures notebook](../../../../notebooks/experiment/v4.1/MangoLeaf_AI_Post_Training_Figures_v4_1.ipynb) reads the two **completed** run folders and the original 62-photo `MyDrive/mangoleaf_background_photos/` folder. Set the three paths in its first code cell, then run top to bottom. It writes a new `MyDrive/mangoleaf_experiments/v4.1/post_training_figures/v4-1-figures-<UTC time>/` folder; no training or threshold fitting runs again. The notebook and local [generator](../../../../tools/generate-v4-1-figures.py) contain the same figure code; regenerate the uploadable notebook with [its builder](../../../../tools/build-v4-1-figures-notebook.py) after changing that code.

The locally checked copies are [training curves](figures/training_curves.png), [four raw confusion matrices](figures/confusion_matrix.png), [per-class metrics](figures/per_class_metrics.png) and [CSV](figures/per_class_metrics.csv), [threshold search](figures/threshold_search.png), [augmentation preview](figures/augmentation_preview.png), and [background-arm Grad-CAM](figures/grad_cam.png). The [figure provenance](artifacts/figure_provenance.json) records the exact model, input image, mask, scene, evaluation, and figure hashes. Grad-CAM uses one saved **validation** photo per class and the saved calibrated Keras model. Its colors show model attention for those examples, not proof that the diagnosis is correct.

In the augmentation preview, the top row recreates one recorded training image at a recorded epoch **before** the common Keras augmentation: control, background, lighting, and combined. The chosen scene and mask hashes match the frozen run. The bottom row applies **new random draws** of flip, rotation, zoom, shear, and brightness; the exact old draws were not saved. The first eligible scheduled scene inspected while building this figure was an airplane view (`gfhfghgfhgfhgfh.jpg`), and that scene appears in the frozen training schedule. The figure uses a recorded orchard scene instead. Review the full background pool for scope and source rights before another training run; changing this preview does not change the already trained V4.1 weights. The original test and old OOD tune sets were used during earlier development, so these plots remain exploratory evidence.

For rollback, restore the five model files and `constants.ts` and `sw.ts` from ignored `.tools/model-backups/v4.0.0-local-before-v4.1-20260925/`, then rebuild and recheck the app. All five earlier V4 model files also match the separate V4 `candidate_model/` archive byte-for-byte. Keep the local backup until the model decision is final; the separate v3 backup remains untouched.

## Export recovery for an earlier Colab copy

If all four arms printed `All four arm models saved` but Section 6 fails with `UnboundLocalError: cannot access local variable 'subprocess'`, an earlier notebook copy imported `subprocess` and `sys` inside `convert_one_arm` after using them. In that Colab copy, change this line inside `def convert_one_arm`:

```python
import re, os, sys, glob, json, subprocess
```

to:

```python
import re, os, glob
```

Run the edited `def convert_one_arm` cell again, then rerun the final Section 6 export cell. The failed export attempt remains in `export_attempts/`; a new attempt gets its own folder. The four saved calibrated models do not need retraining. If Colab has started a new runtime, first follow the notebook's `Resume export after a Colab disconnect` section and select the saved Drive run.

## Local notebook checks

Use the Python environment from the [v4 verification guide](../v4/TRIAL_v4.md#local-developer-verification), then run this from the repository root:

```bash
.tools/notebook-v4-env/Scripts/python.exe tools/verify-v4-1-notebooks.py
```

On macOS/Linux, use `.tools/notebook-v4-env/bin/python`. The checker uses small synthetic photos to verify notebook structure, unchanged split helpers, train-only effects, and the fitting/evaluation boundary. It does not train the models or prove field accuracy. The full four-arm run, mask preview review, and real-photo evaluation require Colab and human review.

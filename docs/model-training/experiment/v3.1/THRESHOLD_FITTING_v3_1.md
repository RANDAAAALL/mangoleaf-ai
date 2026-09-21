# Threshold-fitting notebook v3.1

> **Status: experimental candidate — not shipped or deployed.**

Use [the Colab notebook](../../../../notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb) to fit margin and entropy against the existing calibrated Trial 3 weights. It uses validation mango images for selection, saves the selected settings, then evaluates them with test mango images and separate OOD report images.

## Upload checklist

Upload or reuse this Google Drive layout:

```text
MyDrive/
  mangoleaf_v3/
    resume/
      mangoleaf_v3_calibrated.keras
      resume_info.json
  dataset_split/
    val/                         # 391 images in the original split
      anthracnose/
      bacterial_black_spot/
      bacterial_canker/
      healthy/
      mango_scab/
      sooty_mold/
    test/                        # 393 images in the original split
      anthracnose/
      bacterial_black_spot/
      bacterial_canker/
      healthy/
      mango_scab/
      sooty_mold/
  mango_ood_test/                 # 168 images in the original collection
    ...image files...
```

- Copy `val/` and `test/` from the innermost `dataset_split` directory supplied for this project. Keep the class directories and their contents. Avoid accidentally adding another `dataset_split/` layer; alternatively, edit `DATASET_DIR` in Step 1 to match your Drive layout.
- Extract ZIP inputs into a separate folder first. The notebook reads image directories; it does not read images directly from an archive.
- Reuse `mangoleaf_v3_calibrated.keras` and `resume_info.json` from the original training run's Drive resume bundle. They are not supplied by the repository. Browser model shards cannot substitute for the calibrated Keras file.
- Copy the OOD collection into `mango_ood_test/`. Existing `tune/` and `report/` subfolders are supported. Otherwise, the notebook makes a seed-42 split in memory and records its membership without moving images.
- The training folder, raw unsplit images, saved test `.npy` arrays, and `public/model/` files are not required. Uploading the entire split folder is also fine; `train/` is ignored.
- Upload the notebook through Colab's **File > Upload notebook**, then save a working copy in Drive. Files already in Drive do not need uploading again.

Review the OOD labels before using their scores. The supplied collection contains `Mango-Scab-Disease-Management-1.jpg`, a candidate for an in-scope mango image. Its name and appearance do not establish the disease. If expert review confirms that it belongs to a supported mango class, put its path relative to `OOD_DIR` in `OOD_EXCLUDE`. This excludes it from the experiment without deleting or changing the original. Exclusions occur after OOD split assignment, so they do not reshuffle the remaining images.

Related photos of the same specimen or capture session should stay in the same OOD subset. The notebook detects exact byte overlaps across subsets and labels; it cannot certify independence from near-duplicate photos or verify disease labels. Same-subset duplicates are reported for review.

## Run in Colab

1. Choose a Python runtime; a GPU is optional. The notebook uses TensorFlow, NumPy, and Pillow from the runtime and records their versions. A Keras loading error requires a runtime compatible with the saved model, not a fresh training run.
2. Edit the Drive paths in Step 1, then run the cells in order. Inputs are read-only. Results go into a new dated directory under `MyDrive/mangoleaf_v3_1_threshold_results/`.
3. Check the input counts and OOD membership. No unreadable image is silently skipped. Cross-subset or cross-label byte-identical images stop the run.
4. Let Step 4 choose settings using `val/` and OOD tune only. Confidence remains `0.70`. The search targets at least 95% validation retention and maximizes OOD tune rejection over a 0.01 grid. Ties prefer greater retention, then a lower margin, then a higher entropy limit. An infeasible target stops selection.
5. Step 4 saves `selected_thresholds.json` before Step 5 runs test/report predictions. Step 5 reads the saved values, verifies model/data identity, and scores the candidate and the predeclared current baseline. It never searches for replacement thresholds.
6. Step 6 saves a candidate configuration and downloads a ZIP of the evidence. Save the completed notebook as `MangoLeaf_AI_Threshold_Fitting_v3_1_Results.ipynb` separately from the clean template and completed v3 runs.

Each experiment gets its own output directory. To rerun the experiment, start from Step 1. The notebook refuses to overwrite a saved selection or completed evaluation within the same run.

## Interpret the results

Retention means the prediction was accepted; it does not establish that the disease label was correct. The evaluation reports accepted correct diagnoses, accepted wrong diagnoses, rejected mango images, OOD false accepts, and a per-class confusion matrix with an extra rejection column. Per-image CSVs identify cases to inspect. Zero accepted predictions produce an undefined accepted accuracy (`null`), not a fabricated zero or perfect score.

The existing v3 test predictions influenced earlier threshold selection. The old OOD report predictions also entered a later precision-band adjustment. Therefore, this notebook defaults to `EVALUATION_STATUS = 'previously_used'`. Its default evaluation describes those reused collections; it is not a new independent final test. For genuinely fresh reserved evaluation data, change `TEST_DIR` and the OOD `report/` contents through separate input folders, set `EVALUATION_STATUS = 'fresh_reserved'`, and document their origin in `EVALUATION_NOTES`. Changing a status label or shuffling the old images does not make them unseen.

Confidence, margin, and entropy come from the same output probabilities. Confidence at least `0.70` already implies a margin at least `0.40` for normalized probabilities, apart from numerical rounding. A selected zero margin is valid. The notebook reports the margin's incremental rejection; it does not force a positive value to imply extra protection.

Images use Pillow RGB decoding and TensorFlow bilinear resizing to 224 by 224, followed by raw float32 pixels in 0–255. The existing model handles rescaling and already contains temperature calibration. These measurements use the saved Keras layer precision policies. They are not TensorFlow.js phone measurements, and the notebook does not reuse the old simulated float16 bands to choose settings. Browser inference and real farm photos still need separate checks before adopting the candidate.

## Generated files and release labels

Each results ZIP contains:

- `model_config.json`: candidate configuration for the app's existing threshold loader.
- `selected_thresholds.json`: settings, model/runtime identity, objective, and validation/tuning results saved before evaluation.
- `evaluation.json`: candidate and fixed-baseline evaluation results, including data provenance.
- `input_manifest.json`: image paths, hashes, subset assignments, and exclusions.
- `threshold_search.csv`: all searched candidates and whether they meet the retention target.
- `tuning_predictions.csv`, `candidate_evaluation_predictions.csv`, and `baseline_evaluation_predictions.csv`: predictions and rejection reasons per image.
- `REPORT.md`: a short summary and limitations.

The ZIP contains no model weights or image copies. Review its Drive paths before sharing it.

`v3.1` is the requested notebook revision name, using `model-v3.0.0` weights. Under the current [model version policy](../../../MODEL_VERSIONING.md), a threshold-only deployment is a patch, so the candidate config is labelled `model-v3.0.1`. The notebook does not change the deployed app/model version, replace `public/model/`, or alter the original training accuracy record. Review the run and perform the documented model-deployment steps separately if the candidate is adopted.

The clean template itself makes no measured accuracy, retention, or rejection claim. An archived [result notebook](../../../../notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1_Results.ipynb) is available separately; review its actual outputs and exported evidence before considering adoption. Its presence does not mean the candidate was deployed or passed field testing.

## Local verification

For new background-replacement training weights, use the [paired experiment guide](BACKGROUND_EXPERIMENT_v3_1.md) and its v3.2 threshold notebook. This v3.1 workflow intentionally remains tied to the original Trial 3 resume bundle.

Run `python tools/verify-threshold-notebook.py` from the repository root. This standard-library check validates clean notebook cells, Python syntax, threshold selection, undefined accepted accuracy when all images are rejected, saved-selection integrity, and the reporting/export flow using synthetic predictions. Changing only evaluation predictions must leave selected thresholds unchanged. It does not execute TensorFlow, load the real model, or measure model accuracy.

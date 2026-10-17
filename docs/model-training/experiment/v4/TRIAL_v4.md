# Seven-class training experiment v4

> **Status: experimental candidate `model-v4.0.0`; copied into the local app for testing on September 24, 2026. Not adopted or deployed.**

This experiment separates `healthy_leaf` and `healthy_fruit`. It trains one model using the v3 recipe, then fits rejection thresholds in a separate notebook. The notebooks alone do not change the application's model, version, labels, or assets.

The notebook workflow itself does not change the app. A later, reversible local trial copied the fitted candidate into `public/model/` with matching seven-class app labels. See [model versioning](../../../versions/history/AI_MODEL_HISTORY.md#september-24-2026-local-v4-candidate-trial) for the backup and rollback boundary.

## Files to open

1. [Training notebook](../../../../notebooks/experiment/v4/MangoLeaf_AI_Training_v4.ipynb): data preparation, training, confidence calibration, validation Grad-CAM, and TensorFlow.js export.
2. [Threshold notebook](../../../../notebooks/experiment/v4/MangoLeaf_AI_Threshold_Fitting_v4.ipynb): threshold selection, final evaluation, and candidate packaging.

Both notebooks contain plain-English instructions before each major step. Open the clean training notebook in Colab and select a GPU runtime. Run cells in order. Save completed results under a separate filename so the clean templates and historical notebooks remain available.

## What to upload to Drive

| Input          | Required contents                                                                                                       | Used by           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Raw dataset    | The original seven source folders under `mango_dataset_v3/`                                                             | Training          |
| Original split | The historical v3 `train/`, `val/`, and `test/` folders, with the merged `healthy/` class and source-prefixed filenames | Training          |
| OOD photos     | Images outside the supported classes; a flat folder or separate `tune/` and `report/` folders                           | Threshold fitting |

Extract these input ZIPs before running. Set each notebook path to the actual folder containing the required children. A folder named `dataset_split` may contain another folder with the same name; select the inner folder that contains `train`, `val`, and `test`.

Default training paths:

```python
RAW_DIR = Path('/content/drive/MyDrive/mango_dataset_v3')
BASELINE_SPLIT_DIR = Path('/content/drive/MyDrive/mangoleaf_v3/dataset_split/dataset_split')
EXPERIMENT_ROOT = Path('/content/drive/MyDrive/mangoleaf_experiments/v4')
OUTPUT_ROOT = EXPERIMENT_ROOT / 'training'
```

No background photographs, masks, existing v3 weights, or separate first-eight-cells notebook are required. The training notebook saves its new split as `dataset_split.zip`. The threshold notebook reads that saved ZIP automatically; it does not need the raw dataset again.

## Where Google Drive outputs go

Both notebooks group new outputs under one versioned experiment folder:

```text
MyDrive/mangoleaf_experiments/v4/
|-- training/
|   `-- v4-training-<timestamp>-<id>/
|       |-- dataset_split.zip
|       |-- model_calibrated.keras
|       |-- training_complete.json
|       |-- v4-export-<id>/model/
|       `-- ...training records and figures
`-- threshold_fitting/
    `-- v4-thresholds-<timestamp>-<id>/
        |-- selected_thresholds.json
        |-- evaluation.json
        |-- v4-thresholds-<timestamp>-<id>-evidence.zip
        |-- v4-thresholds-<timestamp>-<id>-candidate_model.zip  (feasible runs only)
        `-- ...prediction CSVs, figures, and candidate files
```

Each timestamp is UTC, and the short random ID prevents repeated runs from sharing a folder. Export retries get their own `v4-export-<id>` folder. ZIP names include the version and run ID so downloaded evidence and candidate models remain identifiable outside Drive. Internal filenames such as `model.json`, `model_calibrated.keras`, and `dataset_split.zip` stay consistent because notebook loaders read those names.

After training completes, copy its printed full run path into `TRAINING_RUN` in the threshold notebook. Its default output root is `EXPERIMENT_ROOT / 'threshold_fitting'`. These paths label notebook workflow v4; they do not change the candidate model version or indicate deployment.

Existing completed v4 runs under the older `mangoleaf_v4/` folder still work by setting `TRAINING_RUN` to their full path. No existing Drive folder is automatically moved or renamed. Keep raw images, the original v3 split, and OOD inputs at their existing paths. Temporary datasets under `/content/mangoleaf-v4/` and `/content/mangoleaf-threshold-v4/` live on the Colab runtime; the persistent split ZIP and results live in Drive.

## Data and filename handling

The seven output classes, in order, are:

```text
anthracnose
bacterial_black_spot
bacterial_canker
healthy_fruit
healthy_leaf
mango_scab
sooty_mold
```

The historical split already selected images separately within each source folder before merging healthy labels. V4 uses the original split as the record of which images survived deduplication and where each belongs. It verifies that record using SHA-256 hashes, which identify file contents independently of filenames.

The supplied non-duplicate notes contain 62 distinct entries; `DSC_0205.JPG` is listed twice. Their content identities are embedded in the training notebook. Thirteen mango-scab filenames intentionally drop the `non ` prefix. The old and new names are recorded, and matching uses the image contents. These notes do not automatically resolve other similarity flags or establish expert disease labels.

The raw dataset and original split are read-only inputs. New copies use seven class folders and retain historical prefixed filenames for stable ordering. Every run gets a separate output folder. The notebook stops if the input contents differ from the reviewed v3 collection; it does not silently resplit a changed dataset. A future dataset revision requires a new reviewed manifest and comparison plan.

Expected counts for this exact collection:

| Class                |     Train | Validation |    Test |
| -------------------- | --------: | ---------: | ------: |
| Anthracnose          |       339 |         73 |      73 |
| Bacterial black spot |       207 |         44 |      45 |
| Bacterial canker     |       343 |         74 |      74 |
| Healthy fruit        |        77 |         16 |      17 |
| Healthy leaf         |       347 |         75 |      75 |
| Mango scab           |       157 |         34 |      34 |
| Sooty mold           |       349 |         75 |      75 |
| **Total**            | **1,819** |    **391** | **393** |

This is the original rounded 70/15/15 split. A read-only local audit found 5,098 raw files, 2,449 excluded byte-identical copies, and 46 additional excluded near matches, leaving 2,603 images. The retained images have 10 perceptual-similarity flags, including 5 crossing subsets. Inspect `duplicate_audit.json`: similarity alone does not prove an identical photo or a wrong label. The older count of 49 cross-label pairs included raw copies and is not the same measurement.

Healthy fruit has only 17 test images. Report counts alongside percentages. Preserving membership supports a controlled class-separation experiment; it does not establish independence between physical specimens or turn previously used test images into untouched evidence.

## Settings kept from v3

- MobileNetV3Large with ImageNet initialization, global average pooling, dropout 0.2, and a seven-output softmax head.
- RGB input resized to 224 × 224 with TensorFlow bilinear interpolation. Input remains float32 on the 0–255 scale; MobileNetV3 rescales internally.
- Seed 42 and batch size 32.
- Five head-training epochs at learning rate 0.001, followed by ten fine-tuning epochs at 0.00001.
- Frozen BatchNormalization during fine-tuning and best-validation-loss checkpoints for both stages.
- Recalculated balanced class weights and the existing horizontal/vertical flip, rotation, zoom, shear, and brightness augmentation.
- Validation-based temperature scaling, folded into the saved final layer once.
- Float32 TensorFlow.js weight export. No new Gaussian noise or background replacement is added.

Training and threshold inference use matching TensorFlow decoding/resizing. The notebook checks validation predictions across loaders and after saving/reloading the calibrated model. Those checks do not establish browser/WebGL parity.

## Read every class score

These outputs are **class probability distributions**: the model's scores for one image, not accuracy measured across a dataset. They sum to approximately 100%; percentages rounded to two decimals can differ slightly from that total. A high score can still be wrong, and a rejected image still has a distribution across the seven known classes.

- Training Step 6 prints all seven class percentages for each validation Grad-CAM example, ranked from highest to lowest and identified by filename and actual label.
- Threshold Step 4 saves full-precision `probability_<class>` columns in prediction CSVs, including both healthy classes. A separate preview cell displays the saved test or OOD report scores as percentages. Change its `DEBUG_SUBSET` and `DEBUG_IMAGE_INDEX`, then rerun only that cell to inspect another already evaluated image.
- During the local v4 trial, the application console and notebooks both show seven-class distributions. Notebook scores use the calibrated model before rejection gates; threshold previews also show whether the saved gates accepted or rejected the image.

The preview reuses existing predictions and does not train the model, select thresholds, or predict evaluation images early. Do not use test/OOD report previews to retune the same evaluation run.

## Training outputs and reconnects

Keep the entire run folder printed after `TRAINING AND EXPORT READY`. It contains:

- `plan.json`, `input_manifest.json`, `raw_inventory.json`, `reviewed_images.json`, and `duplicate_audit.json`.
- `dataset_split.zip`, containing the new seven-class directory layout.
- Both best-weight checkpoints, training histories, and figures.
- `model_calibrated.keras`, `validation_probabilities.npy`, and `resume_info.json`.
- `training_ready.json`, written after the calibrated model is safely saved.
- A `v4-export-<id>/model/` directory with Graph Model files and provisional metadata.
- `training_complete.json`, identifying the completed export and its file hashes.

If training stops before `TRAINING SAVED`, start a new run from Step 2. This notebook does not claim automatic optimizer/checkpoint recovery.

If only export needs recovery after a runtime restart:

1. Run Step 1 and the `file-helpers` and `export-helpers` definition cells.
2. Set `RUN_DIR = Path('the existing completed-training folder in Drive')`.
3. Continue from Step 7. Do not rerun data preparation, training, or calibration.

Each export retry gets a new attempt folder. A successfully completed export cannot be overwritten by rerunning that cell. Preserve the completed run and proceed to threshold fitting.

## Threshold fitting and final reports

Set `TRAINING_RUN` to the completed training run folder. Leave that folder intact; its ZIP is extracted into a separate local Colab directory and checked against the manifest.

| Stage                     | Mango images | OOD images             |
| ------------------------- | ------------ | ---------------------- |
| Choose margin and entropy | Validation   | Tuning subset          |
| Evaluate saved settings   | Test         | Separate report subset |

Confidence stays at 0.70. The selection target is at least 95% validation retention: accepted images, not necessarily correct diagnoses. Ties prefer greater validation retention, then a lower margin and higher entropy threshold. The seven-class normalized entropy uses `log(7)`.

`OOD_EXCLUDE` lists exact relative paths only after content review. Do not exclude images because the model gets them wrong. Exact repeated files across experiment collections stop the run. Folder validation also stops if one OOD partition is missing or extra images would be ignored.

The notebook saves `selected_thresholds.json` before any test/report predictions. If no setting meets the target, it records `infeasible`. Evaluation can still report the same model's confidence-only behavior; no deployable candidate ZIP is created. Do not lower the target after reading the report and present a rerun as untouched evaluation.

Reports distinguish raw accuracy, accepted wrong diagnoses, rejected mango images, and falsely accepted OOD images. They include separate healthy-leaf/healthy-fruit results, per-class precision/recall/F1, prediction CSVs, confusion matrices, and a confidence-only comparison using the same model. Seven-class accuracy is not directly equivalent to the historical six-class 97.46% figure.

`v4-thresholds-<timestamp>-<id>-evidence.zip` contains the report files and training provenance. A feasible run also produces the matching `-candidate_model.zip` with unchanged exported weights and the newly fitted configuration. The notebook prints both exact paths. Neither ZIP proves the candidate is better or approved for deployment.

## Saved experimental evidence in this repository

The September 23 completed training and threshold runs have byte-for-byte copies of selected outputs under [figures/v4](figures/) and [artifacts/v4](artifacts/). They are **experimental evidence, not shipped-model evidence**. The original run folders and exports remain untouched.

- Training: [curves](figures/training_curves.png), [validation Grad-CAM](figures/grad_cam.png), [augmentation preview](figures/augmentation_preview.png), [training history](artifacts/training_history.json), and [completion record](artifacts/training_complete.json).
- Threshold evaluation: [confusion matrix](figures/confusion_matrix.png), [per-class chart](figures/per_class_metrics.png), [per-class CSV](figures/per_class_metrics.csv), [run record](artifacts/run_record.json), and [evaluation summary](artifacts/evaluation.json).
- Candidate provenance: [selected thresholds](artifacts/selected_thresholds.json), [threshold search](artifacts/threshold_search.csv), [candidate configuration](artifacts/model_config.json), and [candidate file hashes](artifacts/candidate_hashes.json).

The copied `training_curves.png` was named `training_history.png` in the training run; `grad_cam.png` was named `validation_grad_cam.png`. The test and OOD report collections were previously used during development, so these records are not independent field-test results. Keep the complete original run folders for per-image predictions, manifests, model weights, and ZIP exports.

## Local developer verification

The helper tests use temporary synthetic images. The optional data audit reads the provided dataset paths without writing to them.

```bash
python -m venv .tools/notebook-v4-env
.tools/notebook-v4-env/Scripts/python.exe -m pip install numpy Pillow ImageHash==4.3.2 nbformat==5.10.4
.tools/notebook-v4-env/Scripts/python.exe tools/verify-v4-notebooks.py
```

On macOS/Linux, use `.tools/notebook-v4-env/bin/python` instead. To audit the real input collection, append `--raw "path/to/mango_dataset_v3" --baseline "path/to/original/dataset_split"`. The baseline path must contain `train`, `val`, and `test`.

These checks cover notebook schema/syntax, preserved training settings, renamed-file matching, class mapping, ZIP integrity, threshold logic, report counts, and export metadata/weight checks. They do not measure model accuracy or replace a full Colab run.

## Adoption comes later

Review actual training and threshold results before selecting this candidate. The local trial updates all seven application class indices, English/Bisaya labels, healthy guidance, model assets/configuration, cache/version handling, and affected tests together; it is not an adoption decision. Accepted healthy predictions should display **Healthy Leaf** or **Healthy Fruit**; rejected predictions remain **Uncertain / Unrecognized**.

Keep the shipped deployment unchanged while this experiment is evaluated. Follow the [model versioning policy](../../../versions/AI_MODEL_VERSIONING.md) and the existing release checks before any application deployment.

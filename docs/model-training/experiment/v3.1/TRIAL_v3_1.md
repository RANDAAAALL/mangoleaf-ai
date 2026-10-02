# Background replacement experiment v3.1

> **Status: experimental candidate — not shipped or deployed.**

This experiment tests whether changing training backgrounds improves the existing six-class MangoLeaf classifier. The guide does not adopt or deploy either experimental model; review its Colab evidence separately under the model-version policy.

## Notebooks and version labels

1. [Training v3.1](../../../../notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1.ipynb) prepares automatic masks, records a visual review, and trains a control model and a background-replacement model.
2. [Threshold fitting v3.2](../../../../notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2.ipynb) fits and freezes thresholds for both new models, then compares their evaluation results.

The existing [threshold-only v3.1 notebook](../../../../notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb) stays unchanged. It uses the original Trial 3 model; its inputs are not interchangeable with these newly trained models. The new fitting notebook reuses its validation-based selection method and adds a contract for the two new training bundles.

The experiment's background model is a candidate `model-v3.1.0`; the control uses `model-v3.1.0-control`. The fitting filename `v3.2` identifies a notebook revision, not another weight update. No deployed model label, application version, or `public/model/` asset changes in this task.

Archived [training results](../../../../notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1_Results.ipynb) and [paired threshold results](../../../../notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2_Results.ipynb) are preserved separately from the clean templates. Review their recorded outputs and bundles; the existence of a result notebook does not establish successful adoption, browser parity, or field accuracy.

## Review findings behind the design

- The completed v3 training notebook uses MobileNetV3-Large, six classes, raw 0–255 inputs, class weighting, 5 head-training epochs at `1e-3`, and 10 fine-tuning epochs at `1e-5`. Batch normalization stays frozen during fine-tuning. The experiment retains those choices.
- Existing augmentation includes flips, rotation, zoom, shear, and brightness. It does not isolate the leaf/fruit from its background.
- The displayed Grad-CAM figure selects the first sorted test image in each class and enlarges a 7×7 map. It is a diagnostic sample, not proof that backgrounds never affect predictions. Its `OK` label checks the winning class, not the rejection thresholds. This experiment's optional figure uses validation images and labels that limitation.
- The older v3 fitting workflow used mango test predictions during threshold selection. The newer validation-based method is the basis for v3.2; both new models' settings are frozen before test/report inference.
- Background replacement addresses dependence on scene context. It does not explicitly teach a non-mango class or guarantee lower false-positive/false-negative rates. A cutout can also introduce artifacts or remove useful disease evidence.

## What a mask means

A mask is an image marking which pixels belong to the leaf or fruit. White means keep the original object; black means replace the background. Intermediate values blend edges. A cutout is the object retained by that mask.

You do **not** need to cut each photo manually or save its old background separately. The notebook generates masks automatically using U2-Net through pinned `rembg[cpu]==2.0.67`. The segmenter runs in an isolated CPU Python environment in Colab; it is not included in the trained classifier or PWA.

You still review the previews. Automatic segmentation can erase lesions, leaf tips, damaged edges, stems, or even keep the wrong object. Excluding a bad mask only disables replacement for that photo; its original still trains both models. No manual mask correction is required by this workflow.

## Google Drive upload checklist

Reuse the already extracted dataset and OOD images. Add a separate collection of replacement backgrounds:

```text
MyDrive/
  mangoleaf_v3/
    dataset_split/
      dataset_split/
        train/
          anthracnose/
          bacterial_black_spot/
          bacterial_canker/
          healthy/
          mango_scab/
          sooty_mold/
        val/                       # same six class directories
        test/                      # same six class directories
  mango_ood_test/
    ...original OOD images...
  mangoleaf_background_photos/
    soil-01.jpg
    grass-01.jpg
    wall-01.jpg
    bark-01.jpg
    table-01.jpg
```

- Point `DATASET_DIR` at the folder directly containing `train/`, `val/`, and `test/`. The notebook checks the original counts: 1,819 / 391 / 393. It does not repeat the old deduplication or create a new split.
- The raw unsplit dataset, old `.npy` predictions, original calibrated MangoLeaf model, and browser shards are not needed for this retraining experiment. Both models start from ImageNet weights.
- ZIPs must be extracted into a separate input folder first. The notebooks do not unzip, move, delete, or overwrite dataset images.
- Upload the two clean notebooks through Colab's **File > Upload notebook**, then save working copies in Drive.

### Preparing replacement backgrounds

Start with roughly 30–100 distinct photos as a practical pilot collection, not a proven minimum. Photograph varied soil, grass, bark, walls, tables, and other relevant scenes at different lighting conditions and distances. Use your own photos or images whose license permits this use, and record their origin in `BACKGROUND_NOTES`.

Avoid mango disease specimens, mango fruit/leaves, recognizable people, sensitive information, and text overlays in these backgrounds. Apply the same background pool across all six classes. Do not give one disease a distinct background category.

Do not reuse validation, test, OOD tune, or OOD report images as backgrounds, including crops or edited versions. The notebook blocks exact content overlaps; it cannot detect all near-duplicates or related capture sessions. Background images serve only augmentation. They are not automatically examples teaching the model to reject non-mango inputs.

## Run training v3.1

1. Select a Colab GPU runtime. The notebook uses its installed TensorFlow, Keras, NumPy, Pillow, SciPy, and Matplotlib. It records the runtime and enables deterministic operations. Internet access is needed for dependency, U2-Net, and ImageNet downloads.
2. Edit the Drive paths and fill in `BACKGROUND_NOTES`. Outputs go into a new timestamped folder under `MyDrive/mangoleaf_background_v3_1/`. Keep the printed run path.
3. Run the input audit. It records image hashes and prevents output/input directory overlap. Exact duplicate images across subsets or labels stop the experiment; label quality and specimen independence still need review.
4. Generate masks automatically. Preparation creates an isolated Python environment without `ensurepip`, then uses Colab's existing pip with `--python` to install `pip==25.2` and `rembg[cpu]==2.0.67` into it. Mask dependencies do not replace TensorFlow's dependencies. Generation covers training images only and can take time on CPU.
5. Review **all** contact sheets under the run's `mask_previews/`. The notebook displays the first page and saves the rest. Each row shows the original, mask, and sample composite. A nearly empty/full mask is automatically skipped; this check cannot recognize a wrongly cut lesion.
6. Copy bad mask IDs into `REJECT_MASK_IDS`, then set `MASK_REVIEW_COMPLETE = True`. The review records mask hashes and per-class coverage. Run the remaining training cells. Keep original photos for every rejected mask.
7. Wait for both models to finish. Each arm trains for 15 epochs; two arms require roughly twice the classifier-training work of one run. Best validation loss selects a checkpoint within each stage. Temperature calibration uses validation images only.
8. Optionally generate validation Grad-CAM comparisons. Run Step 5's restoration cell, then its plotting cell. In the original session, the restoration cell uses the current `RUN_DIR`; after a runtime restart, set `GRADCAM_RUN` to the completed run folder. Save the completed notebook separately as `MangoLeaf_AI_Training_v3_1_Results.ipynb`.

The default replacement probability is `0.50` for approved masks. Other presentations retain their original backgrounds. Each original appears once per epoch, so augmentation does not inflate class sizes. Both arms use matching initial weights, class weights, epoch order, optimizer schedules, and the existing geometric/brightness transforms. The control is a new controlled run; implementation/runtime differences mean it need not reproduce the old 97.46% figure exactly.

An input or mask change invalidates the recorded experiment. Start a new run to change reviewed settings. Cells that freeze evidence refuse to overwrite it. If a Colab runtime is lost before both arms finish, this first version does not resume an interrupted optimizer state; start a new run. Completed files remain in Drive. A browser disconnect alone does not establish that the runtime or training stopped; inspect its state and saved outputs first.

### Recovering from an `ensurepip` setup failure

The original mask setup called `venv.EnvBuilder(with_pip=True)`. In the reported Colab runtime, its `python -m ensurepip` subprocess exited with status 1 before dependency installation or mask generation. It could leave a Python executable in an environment without pip, so checking only whether that executable exists was insufficient on retry.

The September 19 patch creates or repairs the environment with `with_pip=False` and installs packages using Colab's pip with `--python`. This is a [documented pip workflow for environments without pip](https://pip.pypa.io/en/stable/topics/python-option/). It preserves isolation from the TensorFlow runtime and does not clear the existing environment.

If an already uploaded copy fails at `ensurepip`, copy the setup block from the updated notebook's **2. Generate masks automatically** cell, from `import venv` through the installation call immediately before `mask_dir = RUN_DIR / 'masks'`. Replace the old block in Colab and rerun that cell. Keep the current runtime and `RUN_DIR`; no input audit or training restart is needed for this specific failure because it happens before `mask_jobs.json` is written. This recovery does not imply that mask generation or frozen experiment cells can be rerun after later failures.

### Recovering Grad-CAM after a runtime restart

`NameError: name 'CLASS_NAMES' is not defined` in the plotting cell means the current session lacks the earlier setup variables. Saved notebook output can remain visible after Colab loses its in-memory variables. Defining the class names alone does not restore the validation records, preprocessing helper, run path, or model metadata that the plot also needs.

If training printed `BOTH MODELS READY`, preserve that completed notebook and the printed run folder. The September 19 Grad-CAM patch adds a self-contained restoration cell immediately before the plotting cell in Step 5. For an older Colab copy, copy that new cell from the updated template and insert it immediately before the existing plot. Set `GRADCAM_RUN` to the original completed run directory, then run the restoration and plotting cells only. Do not use **Run all** or rerun training to recover the figure.

Restoration mounts Drive, imports its own dependencies, and reads `training_complete.json`, `input_manifest.json`, and each arm's `resume_info.json`. It verifies model and manifest hashes, class mappings, TensorFlow/Keras/NumPy/Pillow versions, and the six selected validation image hashes. It restores the same Pillow RGB and TensorFlow bilinear preprocessing used by training. Dataset paths recorded in the manifest must still exist. Restoration reads existing evidence; plotting saves `validation_grad_cam.png` in the original run folder.

An incomplete bundle stops with a message naming the missing completion file. This recovery loads completed models for diagnostics; it does not resume training or reconstruct missing model weights. Grad-CAM remains optional for the v3.2 threshold notebook.

### Training outputs

Each run contains input and mask inventories, preview pages, the mask review, dependency/runtime records, the experiment plan, and:

```text
control/
  stage1_best.weights.h5
  stage2_best.weights.h5
  training_history.json
  model_calibrated.keras
  resume_info.json
background/
  ...the same files...
training_complete.json
validation_grad_cam.png             # if the optional cell runs
```

`training_complete.json` is written only after both arms finish and source hashes still match. The saved model is reloaded and checked against an inference probe. Threshold fitting requires the complete paired bundle.

## Run threshold fitting v3.2

1. Set `TRAINING_RUN` to the printed training-run directory. Keep the dataset and OOD paths correct. Use matching TensorFlow, Keras, NumPy, and Pillow versions; the notebook stops on a mismatch.
2. Run the audit. Both model hashes, their metadata, the mask review, and the original train/validation/test membership must match training. The same OOD collection must remain; reviewed `OOD_EXCLUDE` entries are applied after subset assignment.
3. The notebook uses existing OOD `tune/` and `report/` folders, or the previous seed-42 split for a flat collection. Keep related photos in the same subset. Changing the split does not make previously used images independent.
4. Each model gets its own threshold search on validation + OOD tune. Confidence stays `0.70`; required validation retention stays 95%. The objective maximizes OOD rejection, then prefers greater mango retention, lower margin, and higher entropy. Zero margin is valid.
5. Both selections are saved before either model sees test/report predictions. An infeasible target is recorded explicitly. It is not lowered automatically; that arm receives no candidate configuration.
6. The evaluation reports accepted correct diagnoses, accepted wrong diagnoses, rejected mango images, OOD false accepts, and per-class confusion counts. It also reports confidence-only results for each newly trained model. That reference is not the historical deployed model.
7. Download the evidence ZIP and save the completed notebook separately as `MangoLeaf_AI_Threshold_Fitting_v3_2_Results.ipynb`.

The ZIP includes `selected_thresholds.json`, `evaluation.json`, `REPORT.md`, input provenance, each arm's search/prediction CSVs, and `paired_cases.csv` when both targets are feasible. Each feasible arm gets a `model_config.json` linked to its calibrated model hash. Images and model weights stay outside the ZIP.

## How to judge the experiment

Compare both models' accepted wrong diagnoses, rejected valid mango images, and accepted OOD images. Inspect per-class results, especially black spot versus scab and healthy fruit. Use paired cases to see whether one gain is offset by another failure. High accepted accuracy alone can hide excessive rejection.

These are exploratory comparisons on previously used test/report data. The old collections do not become fresh by renaming or reshuffling them. One seed cannot establish a general augmentation benefit. Further confirmatory work needs predeclared repeated runs and genuinely reserved field/OOD images. Thousands of backgrounds are not thousands of independent disease specimens.

The notebooks do not convert TensorFlow.js assets, replace `public/model/`, or deploy a model. Adopting a candidate requires a separate measured decision, conversion, browser parity checks, and the model-deployment steps in [MODEL_VERSIONING.md](../../../MODEL_VERSIONING.md).

## Local verification and limits

```bash
python tools/verify-background-notebooks.py
python tools/verify-threshold-notebook.py
```

The new check uses Python's standard library plus Pillow. It validates notebook/worker syntax, environment creation and repair when `ensurepip` is unavailable (with package installation mocked), mask review and immutable inputs, compositing on synthetic images, repeatable background choices, model-input membership, infeasible threshold handling, and the full paired reporting/ZIP flow with synthetic predictions. Evaluation predictions cannot affect saved threshold selection. Grad-CAM checks execute restoration in an empty namespace with mocked Colab/ML imports, verify that evidence files stay unchanged, reject incomplete or changed bundles, and compare preprocessing with the training helper. They do not calculate actual heatmaps.

These checks do not run U2-Net or TensorFlow training, measure cutout quality, or establish model accuracy. Full execution requires the user's Drive assets and Colab runtime. The root Bun/CI workflow does not run these notebooks.

## Primary references

- [Noise or Signal: image backgrounds in object recognition](https://arxiv.org/abs/2006.09994) motivates testing background dependence.
- [Grad-CAM](https://arxiv.org/abs/1610.02391) describes coarse diagnostic localization.
- [Simple Copy-Paste](https://openaccess.thecvf.com/content/CVPR2021/html/Ghiasi_Simple_Copy-Paste_Is_a_Strong_Data_Augmentation_Method_for_Instance_CVPR_2021_paper.html) reports augmentation results for instance segmentation; those gains are not proof of improvement for this classifier.
- [rembg v2.0.67](https://github.com/danielgatis/rembg/tree/v2.0.67) supplies automatic masks.
- [TensorFlow determinism](https://www.tensorflow.org/api_docs/python/tf/config/experimental/enable_op_determinism) explains reproducibility requirements and limits.
- [Outlier Exposure](https://arxiv.org/abs/1812.04606) describes a separate approach to training for OOD rejection; it is not implemented by this background experiment.

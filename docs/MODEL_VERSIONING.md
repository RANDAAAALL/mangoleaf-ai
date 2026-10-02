# MangoLeaf AI Versioning Guide

This file records how to version the application, model, and training notebooks without losing historical evidence.

**Current adopted application baseline, October 2, 2026:** App `0.4.9` uses V4.3.0 Combined (`v4.3.0`) in root `public/model/`, replacing the former V3 baseline. Original experiment exports and prior trial backups remain preserved. See the [adoption record](#v049-adoption-of-v430-combined-october-2-2026) and [local validation record](TESTING.md). Production promotion and tag/release publication remain pending final checks; repository adoption does not establish deployment.

## Training Notebooks

Historical and adopted trial notebooks live under `notebooks/v{n}/`. Experimental candidates and completed experimental evidence live under `notebooks/experiment/<notebook-version>/`; that workflow version does not imply a shipped app/model version. An explicit adoption moves the preserved version folder into `notebooks/v{n}/`, and its report/evidence into `docs/model-training/non-experiment/v{n}/`, while keeping cell contents, outputs, and original artifact identities intact. Keep every notebook.

| File                                                                   | Role                                          | Recommendation                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `notebooks/v1/MangoLeaf_AI_Training_v1.ipynb`                          | Trial 1 baseline                              | Keep as historical evidence. Do not use it as the next active training file.                                                                                                                                                                                                                                       |
| `notebooks/v2/MangoLeaf_AI_Training_v2.ipynb`                          | Trial 2                                       | Keep as historical evidence. Superseded as the template by v2.1.                                                                                                                                                                                                                                                   |
| `notebooks/v2.1/MangoLeaf_AI_Training_v2.1.ipynb`                      | Trial 2.1 clean template                      | Keep as historical evidence. Superseded as the template by v3. Outputs are cleared.                                                                                                                                                                                                                                |
| `notebooks/v2.1/MangoLeaf_AI_Training_v2_1_Post_Training.ipynb`        | Trial 2.1 completed run                       | Keep as historical evidence. All cell outputs preserved, including the metrics quoted in the manuscript. Do not rerun.                                                                                                                                                                                             |
| `notebooks/v2.1/MangoLeaf_AI_Threshold_Fitting_v2_1_1_Results.ipynb`   | Margin and entropy fitting for `model-v2.1.1` | Keep as historical evidence. Fitted against the Trial 2.1 resume bundle with no retraining.                                                                                                                                                                                                                        |
| `notebooks/v3/MangoLeaf_AI_Training_v3.ipynb`                          | Trial 3 historical training template          | Recovered and committed August 30, 2026. 34 code cells; outputs cleared. Preserve it as the six-class reference.                                                                                                                                                                                                   |
| `notebooks/v3/MangoLeaf_AI_Training_v3_1st_to_8th_Cells_Results.ipynb` | Trial 3 partial run, cells 1 to 8 only        | Recovered and committed August 30, 2026. 34 code cells of which the first 8 carry outputs: the data-preparation half, covering the deduplication counts, class counts, and the 70/15/15 split that produced the 393-image test set. Superseded as evidence by the completed run below, which reran the same cells. |
| `notebooks/v3/MangoLeaf_AI_Training_v3_Post_Training.ipynb`            | Trial 3 completed run, manuscript evidence    | Recovered and committed August 30, 2026. All 34 code cells carry outputs, including 97.46%, 0.0686 test loss, and `T = 1.188751`. Do not rerun: it holds the figures and tables the manuscript cites.                                                                                                              |
| `notebooks/v3/MangoLeaf_AI_Threshold_Fitting_v3.ipynb`                 | Margin and entropy fitting for `model-v3.0.0` | Recovered and committed August 30, 2026. Eight code cells; outputs cleared.                                                                                                                                                                                                                                        |
| `notebooks/v3/MangoLeaf_AI_Threshold_Fitting_v3_Results.ipynb`         | Trial 3 threshold fitting, completed run      | Recovered and committed August 30, 2026. Nine code cells, all with outputs. Cell 9 is the record of why the margin is `0.40`.                                                                                                                                                                                      |
| `notebooks/v4.3.0/`                                                    | Adopted seven-class Combined workflow         | Training and threshold-fitting templates plus separately preserved completed result copies. Keep original candidate labels and saved outputs as provenance; the adoption receipt records the current release identity.                                                                                             |

**All ten notebooks were deleted from `notebooks/` at some point on August 26 or 27, 2026, and all ten are now committed.** The five Trial 1 through 2.1 files were committed at the time and were restored with `git checkout -- notebooks/`. The five Trial 3 files had never been committed, were matched by no `.gitignore` pattern, and were absent from the Recycle Bin and from every other directory in the user profile, so git could not recover them; the Colab copies in Google Drive were the only surviving originals. They were recovered from Drive and committed on August 30, 2026, which closes the only outstanding item in this project that carried a real risk of permanent loss. The numbers they contain were already recorded in [TRIAL_v3.md](model-training/non-experiment/v3/TRIAL_v3.md) and in `public/model/model_config.json`, so no measurement had been lost even while the files were gone, but the evidence files themselves existed in one place only for three days.

**The lesson is the one this table now enforces: commit a notebook the day it runs, not the day the trial is written up.** Every file in the paragraph above that survived was survivable because it was tracked, and every file that nearly did not was untracked. A completed training run is evidence, and evidence that exists in one Google Drive is not backed up. `MangoLeaf_AI_Training_v3_1st_to_8th_Cells_Results.ipynb` had additionally never appeared in any document, so it could have been lost without anyone noticing it was missing.

Current report paths are under `docs/model-training/non-experiment/v{n}/`; candidate guides and their saved evidence are under `docs/model-training/experiment/v{n}/`. Decimal-version report filenames use underscores, such as `TRIAL_v4_1.md`. Historical notebook cells that mention older report paths remain unchanged because their saved outputs document what was written at the time; use the current paths linked in this guide.

For the next experiment, copy an appropriate preserved training template into a new folder under `notebooks/experiment/` instead of overwriting a completed run. The current seven-class Combined reference is under `notebooks/v4.3.0/`; the V3 template remains a six-class historical reference. Record the candidate model version inside the new notebook and its exported metadata. The folder and filename identify the workflow; they do not establish the model version or adoption status:

```text
notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1.ipynb   same images, changed training procedure only
notebooks/experiment/v4/MangoLeaf_AI_Training_v4.ipynb     seven-class healthy-leaf/healthy-fruit experiment

notebooks/experiment/v4.1/MangoLeaf_AI_Training_v4_1.ipynb  same seven-class images, four training recipes
```

A new biological dataset is a major model change under this project's policy, so a future adopted dataset revision would use a label such as `model-v4.0.0`. Keep its guide and evidence under `docs/model-training/experiment/v4/` while it is a candidate; an adoption decision can add a separate adopted-trial report under `docs/model-training/non-experiment/v4/TRIAL_v4.md`. The experimental `TRIAL_v4.md` filename is a guide label, not evidence of adoption. Same-data retraining, including the v3.1 background experiment, can use a minor model version. Trial 3 introduced a new image pool and is recorded as `model-v3.0.0` in [TRIAL_v3.md](model-training/non-experiment/v3/TRIAL_v3.md).

Each completed training notebook should record:

- dataset source and snapshot date
- raw class counts
- train/validation/test split counts
- split seed
- augmentation plan
- model architecture
- training stages and hyperparameters
- validation and test metrics
- confusion matrix
- exported model format
- exported file size and checksum

### September 17, 2026: threshold-fitting notebook revision v3.1

Use [`notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb`](../notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb) for the next threshold-only experiment against the existing Trial 3 weights. It replaces the older template as the recommended fitting workflow: validation mango images and OOD tune select settings; saved settings are then evaluated with test mango images and OOD report. Historical v3 notebooks and outputs remain intact.

The requested `v3.1` filename identifies a **notebook revision**, not retrained weights. This is an explicit naming exception to the training-notebook convention above. The source model remains `model-v3.0.0`; the candidate configuration uses the patch label `model-v3.0.1`. No app/model label changes until a measured candidate is adopted and deployed. A future same-data retraining still follows the minor-version rule below.

The original test/report collections influenced previous tuning, so the notebook labels their evaluation as previously used data. A fresh independent evaluation requires genuinely reserved images. See the [upload checklist and fitting guide](model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md). The notebook template carries no claimed new results.

### September 18, 2026: background experiment and paired threshold fitting

Use [training v3.1](../notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1.ipynb) for the controlled background-replacement experiment and [threshold fitting v3.2](../notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2.ipynb) for its two new calibrated models. Both are clean experimental templates. The completed v3 notebooks and the earlier threshold-only v3.1 templates/results remain historical evidence.

The background candidate is `model-v3.1.0`; its freshly trained control is identified as `model-v3.1.0-control`. This is a training-procedure experiment using the unchanged biological source images and original split. Replacement scene photos are auxiliary training augmentation, recorded separately; they do not expand or resplit the mango evaluation dataset. This explicitly falls under the minor-version rule. Adding new biological specimens, changing the evaluation dataset, classes, or architecture requires revisiting the version and comparison protocol.

The fitting notebook's `v3.2` is a **workflow revision**, not `model-v3.2.0`. It reuses the validation-based fitting method and adds paired-model provenance, a freeze before either evaluation, and comparison reports. No model is adopted automatically and no deployed version changes until measured review and deployment. See the [experiment/upload guide](model-training/experiment/v3.1/TRIAL_v3_1.md).

### September 23, 2026: seven-class experiment v4

The [v4 training and threshold notebooks](model-training/experiment/v4/TRIAL_v4.md) prepare candidate `model-v4.0.0`. The class list changes from six outputs to seven by separating `healthy_leaf` and `healthy_fruit`, so this is a major model candidate under the policy below. The original v3 ImageNet architecture and training recipe are retained, apart from the required seven-output head and recomputed class weights.

The notebooks preserve the original rounded 70/15/15 image membership using file hashes, including intentionally renamed photos, and record the 62 reviewed image identities. Training contains preparation through calibrated export; the separate fitting notebook uses validation/OOD tune, freezes the selected settings, then evaluates test/OOD report. A failed retention target is recorded as infeasible. The old evaluation collections remain previously used evidence, and seven-class accuracy measures a different task from the historical six-class score even when image membership is preserved.

This prepares experimental workflows, not a new shipped model or app release. `public/model/`, application class mapping, `package.json`, and `src/lib/constants.ts` remain unchanged. Application adoption requires a coordinated seven-class update and the normal evaluation/release checks.

The default Drive output root is `mangoleaf_experiments/v4/`, with separate `training/` and `threshold_fitting/` folders. Run folders and downloadable evidence/model ZIPs include `v4` and a unique run ID. This is a storage label for workflow v4; the model candidate remains `model-v4.0.0`. Existing completed v4 bundles remain readable at their original paths.

### September 24, 2026: local v4 candidate trial

For local testing, `public/model/` now holds an exact copy of the five files from the v4 threshold-fitting `candidate_model/` directory, including its fitted `model_config.json`. The original export is untouched. The app class mapping and model label are `v4.0.0`, with separate Healthy Fruit and Healthy Leaf outputs; the service-worker model cache name is `mangoleaf-model-cache-v4-0-0`. App version `0.4.8` is unchanged. This working-tree trial is **not a release or deployment**; the last committed baseline is v3. The v4 model's field behavior still needs evaluation before adoption.

Exact pre-trial v3 assets and app files are saved under ignored `.tools/model-backups/v3.0.0-shipping-b048442e/`. Keep that directory until the trial ends. Restoring v3 requires the five model files **and** the matching class mapping, About copy, guideline lookup, tests, and cache name; restoring weights alone would mislabel results. The v3 model files also match Git HEAD, but the local backup preserves the exact working-tree source files, including preexisting edits. Do not copy from the separate capstone v3 archive: its config differs from the shipping threshold config.

Selected completed-run plots and summary records are copied under `docs/model-training/experiment/v4/figures/` and `docs/model-training/experiment/v4/artifacts/`; see the [v4 evidence index](model-training/experiment/v4/TRIAL_v4.md#saved-experimental-evidence-in-this-repository). These copies document the experimental candidate and do not approve or release it.

### September 24, 2026: four-arm training workflow v4.1

The [v4.1 experiment guide](model-training/experiment/v4.1/TRIAL_v4_1.md) pairs a new training notebook with separate threshold fitting. The workflow keeps the verified seven-class v4 biological images and split. It compares a freshly trained control with background replacement, localized lighting, and both effects together. Its `v4.1` directory names an **experimental notebook workflow**, not a released app or model. Candidate models may use the `model-v4.1.0` family with distinct arm names because this changes the training recipe without adding mango specimens.

Fit each new arm's thresholds from clean validation and the old OOD tune partition. Freeze all selections before running on mango test, the old OOD report partition, or the newly collected OOD report photos. The older evaluation sets were used during development, so comparisons on them remain exploratory. The new OOD folder measures rejection behavior only; it does not measure disease-classification accuracy. The locally copied v4.0.0 candidate and ignored v3 backup remain in place while v4.1 is evaluated. No v4.1 result, adoption, app-version change, or deployment is claimed by creating the workflow.

### September 25, 2026: completed v4.1 experiment and local background-arm trial

The completed [v4.1 evidence index](model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test) records four trained arms and frozen threshold evaluations. On the same 393 historical mango test files, background and combined each classified 387 correctly before rejection versus v4's 383. After rejection, each correctly accepted 373, wrongly accepted 3, and rejected 17 mango photos. These small, reused-set differences do not establish field superiority. Only 66 training photos were eligible for replacement, so actual background composites were 1.00% of all training presentations. The new OOD report contained 32 broad scene photos; it did not test disease accuracy. The older OOD folder gained one photo since v4 and its tune/report membership changed.

The [V4.1 post-training figures notebook](../notebooks/experiment/v4.1/MangoLeaf_AI_Post_Training_Figures_v4_1.ipynb) draws saved metrics and fresh validation Grad-CAM without changing any model weights or rejection thresholds. Its figures and provenance are indexed in the [experiment guide](model-training/experiment/v4.1/TRIAL_v4_1.md#post-training-figures-september-25-2026). This evidence-only workflow does not create a new model version or app version.

For **local testing only**, the five files in `public/model/` now match the completed v4.1 threshold run's `candidate_models/background/` and its `candidate_hashes.json`. The displayed model label is `v4.1.0-candidate`, matching `model_config.json`'s `model-v4.1.0-candidate` identity. The Serwist runtime cache is `mangoleaf-model-cache-v4-1-0-candidate`; the old v4 cache name is on the eviction list. Seven-class output order stays unchanged. App version `0.4.8` stays unchanged. This working-tree trial is not a model adoption, release, or deployment; the last committed/released model remains v3.

Before replacement, all five local v4 files were checked against the external v4 threshold `candidate_model/` archive and matched byte-for-byte. The exact local v4 files plus `src/lib/constants.ts` and `src/sw.ts` were saved in ignored `.tools/model-backups/v4.0.0-local-before-v4.1-20260925/`, with their hashes. The separate v3 shipping backup remains. To restore v4, restore all seven saved files together, rebuild, and update current candidate documentation. Keep both backups until the final model choice.

This section records the September 25 local state. See the September 28 entry below for the current local candidate.

### September 27, 2026: guided V4.1.1 reproduction workflow

[V4.1.1](model-training/experiment/v4.1.1/TRIAL_v4_1_1.md) is a new **notebook workflow label** for a readable rerun of the V4.1 four-arm recipe. The clean training, threshold-fitting, and figure notebooks use separate `MyDrive/mangoleaf_experiments/v4.1.1/` run folders. `model-v4.1.1-candidate` names possible new run weights and does not rename the completed V4.1 model or the app. No V4.1.1 weights, thresholds, accuracy result, adoption, or release are claimed by preparing the workflow. Preserve the historical V4.1 run and its hashes.

The old mango test, old OOD report, and V4.1's 32-photo new-OOD report have all influenced development; rerun comparisons on them are exploratory. A later untouched OOD set and expert-labeled mango field set are needed for independent rejection and accuracy claims. Changing biological photos, labels, split, scene pool, or review decisions is a corrected new experiment rather than a strict V4.1 reproduction. Identical numeric results are not guaranteed even when inputs and settings match.

### September 28, 2026: completed V4.1.1 reproduction and local Background-arm trial

The [V4.1.1 result and evidence guide](model-training/experiment/v4.1.1/TRIAL_v4_1_1.md#completed-run-and-local-trial-september-28-2026) records four newly trained arms, frozen threshold fitting, and post-training figures. V4.1.1 Background classified 387 of 393 reused mango test images correctly before rejection. With its fitted 0.70 confidence, 0 margin, and 0.38 entropy gates, it accepted 373 correct and 3 wrong mango predictions, rejected 17 mango images, and accepted 26 of 84 old OOD report photos and 1 of 32 reused new-OOD photos. The corresponding V4.1 Background arm made the same accept/reject decisions on these 509 evaluated photos; the new weights and probabilities can still differ. This is exploratory evidence, not an independent improvement or field-accuracy result.

For **local testing only**, `public/model/` now holds all five files from V4.1.1 threshold fitting's `candidate_models/background/`. The displayed label is `v4.1.1-candidate`, matching the export's `model-v4.1.1-candidate` identity; the service-worker runtime cache is `mangoleaf-model-cache-v4-1-1-candidate`, with the prior V4.1 candidate cache on the eviction list. The seven output classes and app version `0.4.8` are unchanged. Copy the model JSON, configuration, and three shards together: the gates in `model_config.json` belong to these exact weights. No adoption, deployment, or release has occurred; the last released model remains V3.

The full V4.1.1 Colab runs and original candidate export remain outside the repository. Curated records and figures under `docs/model-training/experiment/v4.1.1/` are evidence copies. Ignored `.tools/model-backups/v4.1.1-background-candidate-20260928/` keeps all five candidate model files, matching app files, and a hash manifest for later comparison or restoration. Exact V3 shipping and V4.0 local backups also remain. There was no separate V4.1 backup to remove. Restore model files and matching app labels/cache together. Independent OOD, expert-labeled field accuracy, browser TensorFlow.js parity, and physical-device checks remain open before any adoption decision.

### September 28, 2026: V4.2.0 separate-model experiment prepared

The [V4.2.0 experiment guide](model-training/experiment/v4.2.0/TRIAL_v4_2_0.md) describes **unrun notebook templates**, not a new shipped model. It separates four leaf classes, including Bacterial Canker, from three fruit classes while preserving the existing per-class train/validation/test membership and approximate 70/15/15 split. Each organ has one training notebook with figure steps and one independent threshold-fitting notebook. Both use the base, background-replacement, and localized-lighting training effects. `v4.2.0` labels this two-model workflow only; no V4.2.0 accuracy, thresholds, exports, app integration, adoption, deployment, or release are claimed. The app stays at `0.4.8`, its local test model remains `v4.1.1-candidate`, and the last released model remains V3. Any future model artifact labels must identify leaf and fruit exports separately so neither class map or threshold set can be confused with the other.

### September 29, 2026: completed V4.2.0 runs and local dual-model trial

The [completed V4.2.0 evidence index](model-training/experiment/v4.2.0/TRIAL_v4_2_0.md#completed-results-and-comparison-september-29-2026) records separate four-class leaf and three-class fruit training, frozen threshold fitting, and selected figures. Each organ has its own `artifacts/` and `figures/` under `docs/model-training/experiment/v4.2.0/<organ>/`, with a `source_manifest.json` containing source paths and hashes. These are experimental records, not adopted model releases.

The Mango Leaf selected gate was feasible: confidence `0.70`, margin `0`, entropy `0.01`. It classified 296 of 297 reused leaf test photos correctly before rejection and accepted 295 correct, 0 wrong, while rejecting 2. Mango Fruit **had no feasible threshold candidate**. Its fixed confidence-only validation reference retained only 77 of 94 fruit photos (81.91%), below the 95% rule. Its training export classified 86 of 96 reused fruit test photos correctly before rejection; the confidence-only reference accepted 72 correct, 0 wrong, and rejected 24. No fruit fitted threshold set or candidate ZIP exists. The correct-choice raw total is 382 of 393 (97.20%), below V4.1.1 Background's 387 of 393 (98.47%) on the same reused files. This does not estimate the behavior when a user chooses the wrong organ or on fresh field photos. V3's six-class score is not directly comparable.

For **local testing only**, the leaf fitted candidate was placed under `public/model/mangoleaf/`, and the fruit **training export** under `public/model/mangofruit/`; each had its own model JSON, class mapping, config, and weight shards. `src/lib/constants.ts` displayed `v4.2.0-dual-experiment`, and the service-worker runtime cache was `mangoleaf-model-cache-v4-2-0-dual-experiment`. Both models loaded during startup, and the user selected an organ before the scan sheet. Duplicate-report reuse required matching local model label and organ; old V4.1.1 scans did not silently substitute for a V4.2.0 prediction. App version `0.4.8` stayed unchanged. Ignored `.tools/model-backups/v4.1.1-background-candidate-20260928/` kept the exact V4.1.1 Background model files, pre-trial app source copies, SHA-256 hashes, and `ROLLBACK.md` instructions. V3 and V4 backups remained. No deployment or release was claimed. The existing single-model browser test cases were deliberately left unchanged and did not verify this route. Model parity, first-load and memory cost, a wrong-choice study, fresh independent field/OOD evidence, and physical checks remained open before any adoption.

### September 29, 2026: returned local app to V4.1.1 Background

Local testing of the V4.2.0 two-model interface did not satisfy the team's expectations. The app again opens its scan sheet directly and loads only the seven-class V4.1.1 Background candidate from the five root `public/model/` files. The restored display label is `v4.1.1-candidate`, with its matching `model-v4.1.1-candidate` config and confidence `0.70`, margin `0`, entropy `0.38` gates. The V4.2.0 organ selector, dual-model loading, and organ-specific production asset directories are no longer active. Local history keeps V4.2.0 trial rows, but same-photo reuse excludes rows marked with the V4.2.0 model version so a new scan receives a V4.1.1 inference. The service worker uses the V4.1.1 candidate cache label and evicts the former V4.2.0 trial cache.

Ignored `.tools/model-backups/v4.2.0-dual-experiment-20260929/` keeps the exact two-model files, matching app source copies, hash manifest, and rollback instructions. The V4.1.1 backup and all V4.2.0 notebooks, curated artifacts, figures, and comparison results remain intact. This is a **local experiment rollback**, not a release or deployment. App version stays `0.4.8`; the last released model remains V3. Typecheck, lint, and build are the requested checks for this change; the existing browser test cases were left untouched and not run.

### October 1, 2026: V4.3.0 single seven-class workflow prepared

The [V4.3.0 candidate guide](model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) describes two unrun notebooks: one seven-class training notebook with integrated figures and one threshold-fitting notebook. It preserves the saved V4.1.1 per-class train/validation/test membership and approximate 70/15/15 split. One combined recipe keeps the common augmentation and adds reviewed training-only background replacement and local lighting, each at 30%. The intended scene input is the original 62 photos plus 138 supplied new photos; inventory, hashes, duplicates, overlap, suitability, and use-rights review must confirm the usable pool. This expands scene diversity without adding labeled mango specimens. Optional prior masks and review records may be reused only after their source and file hashes validate.

`v4.3.0` identifies this notebook workflow; `model-v4.3.0-candidate` identifies possible new exported weights and settings. No completed run, score, fitted gate, export, adoption, deployment, or release is claimed. Prior mango test and both OOD report collections remain reused exploratory evaluation data. The app stays at `0.4.8`, its local single-model trial remains V4.1.1 Background (`v4.1.1-candidate`), and the last released model remains V3. Preserve every earlier notebook and evidence file. Any future V4.3.0 adoption requires evaluation of its exact hashes and the normal app/release checks.

## Model Versions

Model versions should be separate from app versions because the app can change without a new model, and the model can be retrained without a major UI change.

Recommended model version names:

```text
model-v1.0.0  Trial 1 baseline
model-v2.0.0  Trial 2 MobileNetV3-Large Graph Model
model-v2.1.0  Trial 2.1 deduplicated pool, temperature-calibrated, Float16 (superseded before release, never committed)
model-v2.1.1  Trial 2.1 weights plus fitted margin and entropy rejection thresholds
model-v3.0.0  Trial 3 new dataset pool, recalibrated temperature, float32 export, refitted margin and entropy thresholds
model-v4.0.0  seven-class experimental candidate, archived with exact local rollback backup; not released
model-v4.1.0-candidate  completed four-arm experiment; prior local background trial, not released
model-v4.1.1-candidate  guided four-arm reproduction; background arm copied locally for testing, not released
model-v4.2.0-mangoleaf-candidate  four-class leaf fitted candidate; local experiment, not released
model-v4.2.0-mangofruit-candidate  three-class training export only; threshold fit infeasible, not released
model-v4.3.0-candidate  completed single seven-class combined recipe; restored for local retesting, not released
model-v4.3.0  adopted Combined export for app v0.4.9; original candidate identity preserved in provenance
```

Choose the level by the model/data change. A version identifies an artifact; it does not rank its accuracy:

| Level | Meaning                                                                     | Test accuracy is                                                                                                  | Example                                                                             |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Patch | No retraining. Rejection settings fitted against existing weights.          | Raw class scores stay the same for the same preprocessing/backend; accepted accuracy and retention can change.    | `v2.1.0` to `v2.1.1`, margin and entropy fitted on the existing resume bundle       |
| Minor | Retrained on the same source images with a changed procedure.               | Comparable but not identical. Report both numbers and explain the difference.                                     | `v2.0.0` to `v2.1.0`, deduplication and temperature calibration on the Trial 2 pool |
| Major | New or expanded dataset, a changed class list, or a different architecture. | Review comparability: changed images or classes describe a different measurement, even if some images are reused. | `v1.0.0` to `v2.0.0`, or the seven-class `model-v4.0.0` candidate                   |

New images make the version major even when the six classes and the architecture are untouched, because they land in a new 70/15/15 split and therefore a new test set. `97.12%` was measured on 417 specific images; an accuracy measured on a different set is not a higher or lower version of that number, it is a different number. Recalibration follows for the same reason: the temperature and both fitted thresholds are properties of one set of weights, so all three are refitted rather than carried over.

Trial 2.1 is a minor version rather than a major one: the architecture, the six-class mapping, and the 70/15/15 split are unchanged. What changed is that the pool was deduplicated before splitting, so the evaluation baseline moved from 98.25% to a comparable-but-not-identical 97.12%. The two numbers are measured on different test sets and should never be presented as a regression.

**Why `model-v2.1.0` is listed but skipped.** The Trial 2.1 export was swapped into `public/model/` on August 23, 2026 and labelled `v2.1.0`, but it was never committed and never installed on any device. The next day, out-of-scope images were collected and the margin and entropy thresholds were fitted against the same resume bundle, which rewrote `model_config.json` without retraining. The weight shards are byte-identical between the two states; the only differences are the two threshold values, the version constant, and the cache name. The label became `v2.1.1` and the `v2.1.0` state was never released.

A version label exists to tell one deployed client from another. Because `v2.1.0` never reached a client, nothing was skipped in any sense that matters, and reconstructing a commit for it would permanently bake the dead cache name `mangoleaf-model-cache-v2-1` into history having never served a byte. `model_config.json` already records the distinction correctly: `"trial": "2.1"` identifies the weights, `"modelVersion": "model-v2.1.1"` identifies the configuration revision. Thresholds and weights are one calibrated artifact, since `0.55` and `0.30` were fitted on the softmax outputs of exactly those weights, so they belong in a single commit.

**Swapping the weights in `public/model/` requires three coupled changes.** Doing any one alone leaves the app in a wrong state:

1. Copy the new files in and **delete every stale shard the new export does not overwrite**. Shard filenames encode the total count, so an export with fewer shards than the previous one leaves orphans behind: Trial 2.1 ships `group1-shard1of2.bin` and `group1-shard2of2.bin`, which do not overwrite Trial 2's three `of3` files. Copy `model_config.json` in alongside them, and check that its `classes` array matches the order of `CLASSES` in `src/lib/constants.ts`. A class-order mismatch mislabels every prediction without raising any error.
2. Bump `modelVersion` in `src/lib/constants.ts`, which is what the footer displays.
3. Bump the runtime cache name in `src/sw.ts`, and add the previous name to `OUTDATED_MODEL_CACHES` so the superseded weights are deleted from the device instead of sitting there forever. This step is defence in depth rather than the update mechanism itself; the next paragraph explains what actually forces the refetch. Its real payoff is reclaiming the space, since a superseded model directory is several megabytes and would otherwise stay on the device.

The Trial 2.1 swap completed all three across August 23 and 24, 2026: `public/model/` holds 2 shards plus `model_config.json`, `modelVersion` is `v2.1.1`, and the runtime cache is `mangoleaf-model-cache-v2-1-1` with both `mangoleaf-model-cache` and `mangoleaf-model-cache-v2-1` listed for eviction. Verify a future swap the same way that one was verified: run `bun run build`, then check the generated `public/sw.js` for the new cache name and confirm its precache manifest lists the new shard filenames and no old ones.

The Trial 3 swap on August 27, 2026 completed all three the same way, and the shard count reversed direction: Trial 3 ships `group1-shard1of3.bin` through `group1-shard3of3.bin`, which do not overwrite Trial 2.1's two `of2` files. Both `of2` shards were deleted by hand before the build. This is the second time the orphan trap has appeared and the second time it pointed the other way, so never assume the new export has more shards than the old one — list the directory after copying.

**A fourth change is needed whenever the test accuracy moves: the user-facing copy.** `aiEngineDesc` in `src/lib/translations.ts` states the diagnostic accuracy in the About tab, in both the `en` and `bis` blocks, and it is the only accuracy figure the app shows anyone. It said `98.25%` — Trial 2's leakage-inflated number — from Trial 2 until August 27, 2026, straight through the entire Trial 2.1 cycle, because the three steps above cover the weights, the version constant, and the cache name and none of them touches copy. Grep for the outgoing figure across `src/` before committing a swap; a stale claim in two languages is worse than a stale cache name, because a cache name is invisible and a printed accuracy is a promise to a farmer.

Every file under `public/` enters the Serwist precache manifest with a content-revision hash, and `PrecacheRoute` is registered before `runtimeCaching`, so the router matches it first and the `CacheFirst` rule for `/model/*` never fires. A changed shard therefore gets a changed revision hash and is refetched on the next service-worker activation regardless of the cache name. Serwist's own `activate` handler also evicts precache entries that are absent from the current manifest, which is what removes the deleted `of3` shards. Step 3 above is still worth doing as defence in depth, but do not treat a `CacheStorage` inspection as the verification: `mangoleaf-model-cache-v2-1-1` can legitimately be empty on a correctly updated device.

Two details make that inspection easy to get wrong. `public/sw.js` is minified, and its precache entries use single-quoted keys, so a search for `"url"` finds nothing; search for `'url':` instead. On Windows the generated paths also use backslash separators, as in `/model\group1-shard1of2.bin`, so a grep for `/model/group1-shard1of2.bin` returns no match even when the entry is present and correct. The backslashes are harmless, because the WHATWG URL parser treats a backslash as a path separator for HTTP URLs and Serwist derives every cache key through `new URL()`; a Linux build of the same commit simply emits forward slashes. This command lists the entries on either platform:

```bash
grep -o "'url':'[^']*'" public/sw.js | grep -v _next/static
```

Finally, confirm the new weight files are actually visible to git with `git status --short public/model/` before committing. Files that a `.gitignore` pattern excludes are not reported as untracked, so a swap can look complete in the working tree while committing nothing. See the static asset notes in `docs/ARCHITECTURE.md` for how an unanchored pattern caused exactly this with the icon directory.

A model swap does not by itself require an app version bump, because the two version labels are independent. It does require a rebuild and a redeploy, since both labels are baked into the bundle as literal strings at build time.

## App Releases

Use semantic versioning for the PWA:

```text
v0.1.0  first public pre-field-evaluation milestone
v0.2.0  feature update before final evaluation
v0.2.1  confirmation-modal title clarity patch
v0.2.2  repository documentation and filename-organization patch
v0.2.3  collapsible home-screen scan-flow guide
v0.2.4  version-label sourcing and scan-guide layout patch
v0.2.5  localized scan history and UI reorganization
v0.2.6  Trial 2.1 model and three-gate rejection ship to the app
v0.2.7  organ-label removal and a filter for rejected scans
v0.3.0  Trial 3 model ships to the app
v0.4.0  mobile field-experience redesign and resilient scan synchronization
v0.4.1  bottom-navigation padding patch
v0.4.2  scan-sheet drag performance and motion accessibility
v0.4.3  desktop scan entry points
v0.4.4  shared icon registry and scan-sheet label sizes
v0.4.5  equal-height How it works cards
v0.4.6  unified How it works card styling
v0.4.7  compact history pagination and scan-details badge clipping fix
v0.4.8  scan-photo URL fix, browser reliability testing, and documentation alignment
v0.4.9  adopts V4.3.0 Combined, current scan/guidance regressions, and preserved model evidence
v1.0.0  stable field-tested release
v1.0.1  small fix after v1.0.0
```

The project history records `v0.2.0` as a published release and `v0.2.1` as the following title-clarity patch. The repository-organization work is the `v0.2.2` patch. `v0.2.3` adds the collapsible home-screen scan-flow guide. `v0.2.4` moves version-label sourcing into the build configuration and refines the scan-guide list layout. `v0.2.5` localizes scan history and reorganizes UI components. The model stayed at `model-v2.0.0` through all of those because no model assets, class mapping, or training results changed. The Trial 2.1 swap on August 23, 2026 and threshold fitting on August 24, 2026 together moved the model to `model-v2.1.1` without an app release of their own. `v0.2.6` ships them: Trial 2.1 weights, folded temperature `T = 0.754966`, and fitted rejection thresholds. `v0.2.7` removes the organ label from scan cards and adds a rejected-scan filter; its model stays `model-v2.1.1`. `v0.3.0` ships Trial 3 and its model bump to `model-v3.0.0`. `v0.4.0` redesigns the mobile field experience and makes local-first synchronization retry-safe; model assets, class mapping, thresholds, and the 97.46% Trial 3 result remain unchanged. It has an app tag only, not a new model tag. `v0.4.1` is a one-line bottom-navigation padding patch with the same model, and it is worth stating why a change that small still earned a version: two builds must never share a version label. The footer is the only place a phone can be asked what it is running, so shipping changed markup under an unchanged label makes that answer useless. `v0.4.2` rewrites the scan sheet's drag to write `transform` and `opacity` directly instead of calling `setState` on every frame, removes the full-screen backdrop blur on phones, and adds the `prefers-reduced-motion` support the app had never had. Its model is unchanged too. It is a useful counterpart to `v0.4.1` in one respect: patch releases in this project have so far carried visual changes, and this one is mostly a change in how the same pixels are produced, which is exactly the kind of release whose label matters most, because nothing on screen tells a tester which build they are holding. `v0.4.3` gives desktop three scan entry points it never had: a CTA in the empty scan-history state, a Scan item in the header nav, and a sheet that no longer offers a camera card on machines without a camera. Its model is unchanged as well. It is a patch rather than a minor for the reason the list above shows repeatedly: feature additions inside a minor line have always been patches here, as `v0.2.3`, `v0.2.5`, and `v0.2.7` each were, and minor bumps are reserved for model swaps and redesigns. What earns `v0.4.3` a label of its own is that it changes which controls exist on a class of device, so two testers on a desktop and a phone now see genuinely different affordances and need to be able to say which build produced them. `v0.4.4` moves the four local SVG components out of `how-it-works-steps.tsx` into the shared `brand/icon.tsx` registry and raises the two scan-sheet card descriptions from `text-[10px]` to `sm:text-[12px]` at 40rem and above. Its model is unchanged. It is the extreme case of the argument `v0.4.2` opened: the icon half is a pure refactor that emits byte-identical shapes at identical sizes and colours, so there is nothing on screen at all to distinguish it from the build before it, and the label is the only way a tester can report which one is on the device. The two changes ship under one version because `public/sw.js` is tracked and its precache manifest cannot honestly describe one of them without the other. `v0.4.5` changes two Tailwind class names in `how-it-works-steps.tsx` so the three step cards are equal height on a wide row, which makes it the smallest release in the project after `v0.4.1`. Its model is unchanged. It exists as a release of its own rather than as an amendment to `v0.4.4` because that tag had already been pushed, and the rule below on tagging only final commits is worth more than the tidiness of one fewer version number. `v0.4.6` restyles the same three step cards from green, amber, and blue solid fills to one pale green bordered card, and darkens the step descriptions. Its model is unchanged. It is a patch for the same reason the list above shows repeatedly, and it is the plain case for a label rather than a borderline one: the section looks materially different, so a tester describing it is describing a specific build.

**Any source edit obliges a rebuild before the commit, whatever its size.** `public/sw.js` is tracked and its precache manifest embeds the `_next/static` chunk hashes, so a one-character change to a class name invalidates the committed service worker exactly as thoroughly as a rewritten component does. Committing the source without the regenerated `sw.js` leaves a service worker in history describing a bundle that never existed. `v0.4.1` is the smallest change in the project's history and it still required the full `bun run typecheck`, `bun run lint`, and `bun run build` pass.

**Release tag commits.** `v0.2.6` sits on `e493009` and `model-v2.1.1` on `9b31c7b`. `model-v3.0.0` and `v0.3.0` both sit on `f73f0b8`, sharing one commit because the weights, the thresholds, and the version bumps landed together, which is correct: thresholds and weights are one calibrated artifact. `v0.4.0` sits on `af3474d` with no model tag beside it, `v0.4.1` on `b652b4a`, `v0.4.2` on `bcae4a1`, `v0.4.3` on `4792266`, `v0.4.4` on `959d565`, `v0.4.5` on `441ee89`, and `v0.4.6` on `7cba324`, all seven app-tag-only. Record the commit for every future tag here, so a reader can reach the exact bytes a reported metric was measured on without trusting the tag name alone.

The `v0.2.3` tag was originally created on a commit that predated an amend and was missing `src/components/how-it-works-card.tsx`, so a checkout of that tag could not build. The tag was moved to the corrected commit `50514f8` on August 18, 2026. The superseded commit was `175d7ddc4094ea84139b0526bfa1abd6265a40a9`. Create tags only after the release commit is final to avoid repeating this.

The PWA footer reads two version labels, and neither is an environment variable.

| Label         | Source                                                                                                          | Bump when                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| App version   | `version` field in `package.json`, injected as `NEXT_PUBLIC_APP_VERSION` by the `env` block in `next.config.ts` | Any app release                            |
| Model version | `modelVersion` constant in `src/lib/constants.ts`                                                               | The assets in `public/model/` are replaced |

Both values are baked into the bundle as literal strings at build time, so a
version change requires a rebuild. Neither can be overridden by `.env.local`, a
shell variable, or a hosting dashboard variable, which is deliberate: a stale
override would silently display the wrong version. Do not add
`NEXT_PUBLIC_APP_VERSION` or `NEXT_PUBLIC_MODEL_VERSION` to `.env.local` or to
the Vercel project settings. These values are public and safe to expose because
they are version labels, not secrets.

`src/env.d.ts` declares `NEXT_PUBLIC_APP_VERSION` as a required string so usage
sites do not need a non-null assertion. It is a declaration, not a runtime
guarantee; if the `env` block in `next.config.ts` is removed, the footer renders
an empty label with no type error.

### v0.4.7: history pagination and scan details

The history list uses localized previous/next controls around `Page {n} of {total}` and returns to a valid page when records are deleted. The scan-details modal constrains its desktop grid and removes the photo's intrinsic dimensions from layout, keeping disease and confidence badges inside the visible photo. On phones, the modal scrolls as a whole so its close action remains reachable. The model stays at `v3.0.0`; no model files or diagnosis thresholds changed.

### v0.4.8: scan photo fix and reliability testing

This patch prepares app version `0.4.8`. Scan cards track which image blob owns each local URL, avoiding a revoked URL when that blob is replaced. The release also adds isolated browser tests for scan/history flows and offline behavior, explicit repeated-inference and 30-minute reliability commands, and core E2E coverage in the `master` push workflow. Test guides, checklist examples, release instructions, and experimental notebook locations are aligned with the implementation.

The model remains `v3.0.0`; model assets, class mapping, preprocessing, and rejection thresholds are unchanged. The intended app tag is `v0.4.8`. Record its actual commit after the tag is created.

## Candidate testing and promotion

Added September 20, 2026. Preparing an intended version is separate from publishing it. Commit candidate code, matching version labels, and affected documentation together after local checks. Mark new entries **candidate / not released** until their release decision is made. Do not write that CI, physical-device testing, or deployment passed before it happened. App and model labels remain independent; tooling-only changes do not require a new model label.

1. Finalize candidate source/model files and intended version labels. A model label must identify the files actually included in that candidate. Keep the currently deployed baseline explicitly distinguished in documentation.
2. Run `bun run format`, then `bun run typecheck`, `bun run lint`, and `bun run build` in that order. Run core E2E and applicable reliability checks from [TESTING.md](TESTING.md). A new model also needs accuracy/OOD evaluation.
3. Commit and push the candidate. Husky handles staged formatting and pre-push checks; repeat affected checks/builds if formatting or another edit changes the tested source.
4. Wait for CI on that `master` commit. For manual approval, configure Vercel **Settings > Environments > Production > Branch Tracking**, keep `master`, and disable **Auto-assign Custom Production Domains**. Documentation does not change this dashboard setting; confirm it before relying on staged deployment behavior.
5. Complete the approved validation scope against the exact candidate. Record commit, deployment URL, app/model versions, model hashes, and actual results. When physical-device evaluation is in scope, use the same checklist and confirm the intended worker/model loaded instead of an older cache. Staged Production uses Production environment variables and is not an isolated database.
6. After required checks and review pass, manually promote that exact deployment, verify its live version, and publish the tag/release for its tested commit. Staged promotion reuses the build. Creating a GitHub Release does not deploy the app or gate Vercel.

Multiple attempts can share an intended unreleased version; distinguish them by commit ID and build/model hashes. If code, model files, labels, or build settings change, rebuild and repeat affected checks. A failed candidate receives fixes and another evaluation; do not move a published release tag to hide it. Add final evidence/release status as a subsequent documentation entry rather than rewriting historical measurements or moving the tested tag to a later docs-only commit.

Reference: [Vercel staged production promotion](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).

## Creating a GitHub Release

Prepare version labels, review and commit the intended files, and finish the candidate testing and promotion procedure above before tagging. Only app tags get a GitHub Release in this project; model tags are provenance markers.

Replace `vX.Y.Z` with the approved app version and `TESTED_COMMIT_SHA` with the full commit ID from the completed evidence record. Do not reuse an existing published tag:

```bash
git tag -a vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf AI vX.Y.Z"
git push origin vX.Y.Z
```

Then open GitHub:

1. Go to the repository.
2. Open **Releases**.
3. Choose **Draft a new release**.
4. Select the pushed tag.
5. Add a short title and release notes.
6. Publish the release.

If the release adopts a new model, also create its provenance tag on the tested commit that contains those exact assets. For a model-only milestone, create only this tag; do not publish a separate GitHub Release. Replace both placeholders before running:

```bash
git tag -a model-vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf model-vX.Y.Z"
git push origin model-vX.Y.Z
```

Do not attach large raw datasets to GitHub Releases unless the dataset license and file size are appropriate. Keep release notes focused on what changed, what was tested, and what should be treated as the current baseline.

## Completed V4.3.0 local candidate: October 1, 2026

The [completed V4.3.0 guide](model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#completed-run-and-local-trial-october-1-2026) records one seven-class Combined model, 200 approved unique scene inputs, 66 replacement foregrounds, 273 replacement presentations, integrated figures, and frozen threshold fitting. The [V4.1.1 comparison](model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md) establishes matching evaluation identities and mixed results: raw 386/393 (98.22%), 373 correct/3 wrong accepted, 17 mango rejections, old OOD 24/84 false accepts, reused newer OOD 5/32. These figures do not establish an improvement over the previous Background candidate or field accuracy.

At the user's request, root `public/model/` now holds all five fitted `candidate_models/combined/` files. Export identity is `model-v4.3.0-candidate`, display label `v4.3.0-candidate`, confidence 0.70, margin 0, entropy 0.42, and folded temperature 1.1602258301498714. The seven-class order and app version 0.4.8 stay unchanged. The worker uses `mangoleaf-model-cache-v4-3-0-candidate` and evicts the former V4.1.1 runtime cache. The existing duplicate lookup is already model-aware; earlier saved diagnoses remain in History and do not substitute for a current-label inference.

Before installation, the previous five V4.1.1 assets and matching source snapshots were preserved in ignored `.tools/model-backups/v4.1.1-background-before-v4.3.0-20261001/`, with hashes and rollback instructions. Restore the model bundle and matching label/cache together, then rebuild and reload; do not mix gates and weights. Historical V3, V4, V4.1.1, V4.2.0 notebooks/results/backups and every original V4.3.0 run file remain intact. No adoption, deployment, release, commit, or promotion is claimed by this local test. The last released model remains V3.

## Restored V4.1.1 Background local candidate: October 2, 2026

The user requested a return to the exact V4.1.1 Background candidate. All five fitted model files were copied together from the verified October 1 backup; each matches the original Background candidate export. Root `public/model/` again uses `model-v4.1.1-candidate`, display label `v4.1.1-candidate`, confidence 0.70, margin 0, entropy 0.38 and folded temperature 1.162061222701274. The [restoration receipt](model-training/experiment/v4.1.1/artifacts/local_restore_20261002.json) preserves source paths and model/config/shard hashes.

Before replacement, the exact active V4.3.0 bundle and seven current source snapshots were hash-verified into `.tools/model-backups/v4.3.0-combined-before-v4.1.1-20261002/`. Its `ROLLBACK.md` restores the five assets plus their model label and cache identity without reverting newer UI/guidance work. The worker now uses `mangoleaf-model-cache-v4-1-1-candidate`; the V4.3.0 cache is on the eviction list and the active-cache filter protects V4.1.1. Precache revisions, followed by worker activation and page reload, update the downloaded weights; an already open page can retain its previous in-memory graph until reloaded.

The app stays at 0.4.8. Recent photo-review and guideline/reminder changes remain in place; model-aware duplicate reuse still checks the active label. V4.3.0 history stays readable, while its saved results do not replace V4.1.1 inference. Original notebooks, artifacts, figures, archives and older backups remain intact. This records a local rollback, not a new training result, adoption, deployment, or release. The last released model remains V3. Browser/Keras parity, independent field/OOD evaluation, and physical-device checks remain pending before adoption.

Curated source records and final figures are under the existing experiment version folder, with original-source and derived-review manifests. Browser/Keras prediction parity, fresh OOD, expert-labeled field accuracy, physical-device reliability/performance, and stronger scene suitability/source notes remain open. Existing test cases, Husky, and GitHub workflows were left unchanged during this experimental swap.

## Restored V4.3.0 Combined for local retesting: October 2, 2026

The user requested another local test of the saved V4.3.0 Combined candidate. All five root `public/model/` files match both the verified October 2 V4.3.0 backup and the original fitted `candidate_models/combined/` export. Display label `v4.3.0-candidate`, config identity `model-v4.3.0-candidate`, confidence 0.70, margin 0, entropy 0.42, and folded temperature 1.1602258301498714 identify this exact bundle. The [restoration receipt](model-training/non-experiment/v4.3.0/artifacts/local_restore_20261002.json) records both model bundles and their hashes. Saved training/evaluation results are unchanged; this swap performs no retraining or new accuracy evaluation.

The exact previous V4.1.1 Background files and latest source/document references were preserved in `.tools/model-backups/v4.1.1-background-before-v4.3.0-retest-20261002/`, with a verified manifest and `ROLLBACK.md`. Older backups and original runs remain intact. Restoring only the model files and matching label/cache retains newer UI and translation edits. The active worker cache is `mangoleaf-model-cache-v4-3-0-candidate`; activation protects it and evicts the V4.1.1 runtime cache. Changed precache revisions update model downloads, while a page reload replaces an already loaded in-memory graph.

App version remains 0.4.8. The single scan flow, photo guidance, Bisaya copy, guideline handling, and history stay in place. Duplicate-report reuse continues to require the current model label. These files remain an experimental local candidate; the last released model remains V3. Browser/Keras parity, independent field/OOD evaluation, and physical-device checks remain pending before adoption.

## v0.4.9 adoption of V4.3.0 Combined: October 2, 2026

The user selected V4.3.0 Combined as the current application model, replacing the former six-class V3 baseline. App `package.json` version is `0.4.9`; `src/lib/constants.ts` displays `v4.3.0`. The adopted configuration identifies `model-v4.3.0` and retains `model-v4.3.0-candidate` as its original export identity. The graph and three weight shards are unchanged from the verified Combined export. Class order, 224 × 224 preprocessing, folded temperature `1.1602258301498714`, confidence `0.70`, margin `0`, and normalized entropy `0.42` remain unchanged. The configuration hash changes with release metadata; the [adoption receipt](model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) records original and adopted hashes separately.

The active model runtime cache is `mangoleaf-model-cache-v4-3-0`. Activation protects that cache and removes superseded candidate caches. Content revisions in the regenerated precache manifest update cached configuration/application files; a page reload replaces an already loaded graph. History is preserved. Duplicate reuse now requires the exact active `model_version`: another model label or an unlabeled legacy row cannot substitute for adopted-model inference. This is a narrow promotion change from the earlier local trial's legacy-row behavior.

The preserved V4.3.0 trial, comparison, artifacts, and figures are now under `docs/model-training/non-experiment/v4.3.0/`. Its two clean workflow templates and completed result copies are under `notebooks/v4.3.0/`, with original notebook contents and outputs retained. Earlier trial records and backups remain intact. The exact pre-adoption source, documentation, model, notebooks, tooling, fixtures, and hook/workflow files are backed up under ignored `.tools/release-backups/v0.4.9-model-v4.3.0-20261002/before/`.

The existing eight-photo smoke suite uses the current supplied photo set, including the replaced Mango Scab PNG and Bacterial Canker JPG with recorded hashes. Regression cases cover photo-review dismissal, explicit duplicate-report actions, all seven controlled class outputs, downloaded/missing bilingual guidance, and the uncertain-photo reminder. Numerical gates are unchanged. Controlled UI assertions and repeated real-model calls measure different behavior; neither supplies independent field accuracy or full browser/Keras probability parity.

Repository adoption is complete when the coordinated model/source/documentation update is prepared. Local validation results are recorded in the [testing guide](TESTING.md) and adoption receipt; CI on the final `master` commit and production promotion remain pending. After those gates pass, tag the exact tested commit as `v0.4.9` and `model-v4.3.0`, and publish only the app tag's GitHub Release. No commit, tag, push, release publication, or deployment is implied by preparing the adoption files. Preserve the adopted/released distinction in later evidence entries.

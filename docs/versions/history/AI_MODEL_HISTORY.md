<a id="mangoleaf-ai-model-versioning-guide"></a>

# AI model history and archived notes

This archive preserves the full earlier version guide as maintained on October 18, 2026, including original records, evidence, and release templates. For current instructions, use the [short version guide](../AI_MODEL_VERSIONING.md).

References to a "current" model, pending check, or deployment describe the record's date. They do not verify today's production state. The archived guide was titled **MangoLeaf AI Model Versioning Guide**.

The model version identifies the weights, class list, rejection settings, and evidence behind a diagnosis. The [PWA guide](../PWA_VERSIONING.md) separately tracks the interface, local/offline behavior, and deployment procedure. An app update can keep the same model; a model change still needs its own validation, build, and deployment review.

## Contents

- [Current adopted model](#current-adopted-model-v450-october-16-2026)
- [Model version rules and identities](#model-versions)
- [Training notebooks and evidence storage](#training-notebooks)
- [Model replacement checklist](#model-replacement-checklist)
- [Timeline, oldest first](#model-timeline)
- [Prepared V5.0.0 workflow](#v500-oe-fine-tuning-workflow-prepared-october-15-2026)
- [Completed V5.0.0 review and local candidate](#october-19-2026-v500-completed-review-and-local-candidate)

## Current adopted model: V4.5.0 (October 16, 2026)

- Repository source now uses V4.5.0 in `public/model/`, replacing V4.3.0.

  - The active label is `v4.5.0`, config identity is `model-v4.5.0`, and cache identity is `mangoleaf-model-cache-v4-5-0`.
  - The selected rejection rule is **confidence >= 0.70 only**; margin and entropy gates are disabled (`null`).
  - The prepared app version is `0.7.0`; the [diagnostics and raw-confidence update](PWA_RELEASE_HISTORY.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026) leaves the model files, confidence rule, and original adoption receipt unchanged.

- For the October 17 app candidate, the existing `WEBGL_FORCE_F16_TEXTURES=true` override selects 16-bit WebGL textures.

  - Stored model weights and float32 input casting are unchanged; this runtime setting is separate from model provenance and is not an automatic retry after a GPU failure.
  - New reports retain the raw highest-class score; the badge truncates to at most one decimal percentage and hides a trailing `.0`.
  - Previously rounded History scores cannot recover lost precision.
  - These app changes do not retrain the model, regenerate scientific accuracy results, or change the rejection rule.

- This adopts saved V4.5.0 weights and the previously generated confidence-only evaluation reference.

  - No training or scientific prediction export was regenerated; browser integration checks are recorded separately.
  - That reference reports 377/397 correct accepted mango diagnoses (94.96% of all mango inputs), 12 wrong accepted, eight rejected, and nine false accepts among 250 OOD reporting photos.
  - The original fitted-rule report remains unchanged as historical evidence and reports four OOD false accepts.
  - Neither result is independent field accuracy.
  - Test-set overlap, class confusion, review limitations, and browser/Keras parity are documented in the [trial report](../../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md).

- The [adoption receipt](../../model-training/non-experiment/v4.5.0/artifacts/adoption_20261016.json) records active asset hashes, the chosen configuration, and the verified V4.3.0 rollback backup.

  - The October 16 adoption record left app release validation, physical-device evaluation, and production deployment pending. Later app checks have separate dated records in the [testing guide](../../testing/TESTING.md#v070-diagnostics-and-raw-confidence-october-17-2026); do not treat local checks as proof of production deployment or device results.
  - The original model adoption itself did not bump the app version. The later PWA version correction and app updates are recorded separately in the timeline.

- V5.0.0 remains an untrained, prepared workflow on standby.

  - Its notebooks and helper remain under `notebooks/experiment/v5.0.0/`; no V5.0.0 weights or evaluation results exist.

## Model Versions

- Model versions should be separate from app versions because the app can change without a new model, and the model can be retrained without a major UI change.

- Recommended model version names:

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
model-v4.5.0  adopted V4.5.0 OE export in repository source; confidence-only 0.70; production deployment pending
```

- Choose the level by the model/data change.

  - A version identifies an artifact; it does not rank its accuracy:

| Level | Meaning                                                                     | Test accuracy is                                                                                                  | Example                                                                             |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Patch | No retraining. Rejection settings fitted against existing weights.          | Raw class scores stay the same for the same preprocessing/backend; accepted accuracy and retention can change.    | `v2.1.0` to `v2.1.1`, margin and entropy fitted on the existing resume bundle       |
| Minor | Retrained on the same source images with a changed procedure.               | Comparable but not identical. Report both numbers and explain the difference.                                     | `v2.0.0` to `v2.1.0`, deduplication and temperature calibration on the Trial 2 pool |
| Major | New or expanded dataset, a changed class list, or a different architecture. | Review comparability: changed images or classes describe a different measurement, even if some images are reused. | `v1.0.0` to `v2.0.0`, or the seven-class `model-v4.0.0` candidate                   |

- For the historical six-class dataset expansion, new images produced a new 70/15/15 split and therefore a different test set.

  - New or expanded training data can justify a major label without requiring a new split in every experiment: V5.0.0 expands OE training while preserving its mango split.
  - `97.12%` was measured on 417 specific images; an accuracy measured on a different set is not a higher or lower version of that number, it is a different number.
  - Recalibration follows for the same reason: the temperature and both fitted thresholds are properties of one set of weights, so all three are refitted rather than carried over.

- Trial 2.1 is a minor version rather than a major one: the architecture, the six-class mapping, and the 70/15/15 split are unchanged.

  - What changed is that the pool was deduplicated before splitting, so the evaluation baseline moved from 98.25% to a comparable-but-not-identical 97.12%.
  - The two numbers are measured on different test sets and should never be presented as a regression.

## Training Notebooks

- Historical and adopted trial notebooks live under `notebooks/non-experiment/v{n}/`.

  - This group includes the current adopted model and older models kept as evidence; it does not identify every contained model as currently active.
  - Experimental candidates and completed experimental evidence live under `notebooks/experiment/<notebook-version>/`; that workflow version does not imply a shipped app/model version.
  - An explicit adoption moves the preserved version folder into `notebooks/non-experiment/v{n}/`, and its report/evidence into `docs/model-training/non-experiment/v{n}/`, while keeping cell contents, outputs, and original artifact identities intact.
  - Keep every notebook.

- **Trial 1 baseline**

  - File: `notebooks/non-experiment/v1/MangoLeaf_AI_Training_v1.ipynb`
  - Keep as historical evidence. Do not use it as the next active training file.

- **Trial 2**

  - File: `notebooks/non-experiment/v2/MangoLeaf_AI_Training_v2.ipynb`
  - Keep as historical evidence. Superseded as the template by v2.1.

- **Trial 2.1 clean template**

  - File: `notebooks/non-experiment/v2.1/MangoLeaf_AI_Training_v2.1.ipynb`
  - Keep as historical evidence. Superseded as the template by v3. Outputs are cleared.

- **Trial 2.1 completed run**

  - File: `notebooks/non-experiment/v2.1/MangoLeaf_AI_Training_v2_1_Post_Training.ipynb`
  - Keep as historical evidence. All cell outputs preserved, including the metrics quoted in the manuscript. Do not rerun.

- **Margin and entropy fitting for `model-v2.1.1`**

  - File: `notebooks/non-experiment/v2.1/MangoLeaf_AI_Threshold_Fitting_v2_1_1_Results.ipynb`
  - Keep as historical evidence. Fitted against the Trial 2.1 resume bundle with no retraining.

- **Trial 3 historical training template**

  - File: `notebooks/non-experiment/v3/MangoLeaf_AI_Training_v3.ipynb`
  - Recovered and committed August 30, 2026. 34 code cells; outputs cleared. Preserve it as the six-class reference.

- **Trial 3 partial run, cells 1 to 8 only**

  - File: `notebooks/non-experiment/v3/MangoLeaf_AI_Training_v3_1st_to_8th_Cells_Results.ipynb`
  - Recovered and committed August 30, 2026. 34 code cells of which the first 8 carry outputs: the data-preparation half, covering the deduplication counts, class counts, and the 70/15/15 split that produced the 393-image test set. Superseded as evidence by the completed run below, which reran the same cells.

- **Trial 3 completed run, manuscript evidence**

  - File: `notebooks/non-experiment/v3/MangoLeaf_AI_Training_v3_Post_Training.ipynb`
  - Recovered and committed August 30, 2026. All 34 code cells carry outputs, including 97.46%, 0.0686 test loss, and `T = 1.188751`. Do not rerun: it holds the figures and tables the manuscript cites.

- **Margin and entropy fitting for `model-v3.0.0`**

  - File: `notebooks/non-experiment/v3/MangoLeaf_AI_Threshold_Fitting_v3.ipynb`
  - Recovered and committed August 30, 2026. Eight code cells; outputs cleared.

- **Trial 3 threshold fitting, completed run**

  - File: `notebooks/non-experiment/v3/MangoLeaf_AI_Threshold_Fitting_v3_Results.ipynb`
  - Recovered and committed August 30, 2026. Nine code cells, all with outputs. Cell 9 is the record of why the margin is `0.40`.

- **Adopted seven-class Combined workflow**

  - File: `notebooks/non-experiment/v4.3.0/`
  - Training and threshold-fitting templates plus separately preserved completed result copies. Keep original candidate labels and saved outputs as provenance; the adoption receipt records the current release identity.

- Current report paths are under `docs/model-training/non-experiment/v{n}/`; candidate guides and their saved evidence are under `docs/model-training/experiment/v{n}/`.

  - Decimal-version report filenames use underscores, such as `TRIAL_v4_1.md`.
  - Historical notebook cells that mention older report paths remain unchanged because their saved outputs document what was written at the time; use the current paths linked in this guide.

- For the next experiment, copy an appropriate preserved training template into a new folder under `notebooks/experiment/` instead of overwriting a completed run.

  - The current adopted OE reference is under `notebooks/non-experiment/v4.5.0/`; the earlier seven-class Combined reference remains under `notebooks/non-experiment/v4.3.0/`, and the V3 template remains a six-class historical reference.
  - Record the candidate model version inside the new notebook and its exported metadata.
  - The folder and filename identify the workflow; they do not establish the model version or adoption status:

```text
notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1.ipynb   same images, changed training procedure only
notebooks/experiment/v4/MangoLeaf_AI_Training_v4.ipynb     seven-class healthy-leaf/healthy-fruit experiment

notebooks/experiment/v4.1/MangoLeaf_AI_Training_v4_1.ipynb  same seven-class images, four training recipes
```

- In the historical V3-to-V4 planning example, a new biological dataset was a major model change and the candidate label was `model-v4.0.0`.

  - This is a historical example, not the next label after the current V4.5.0 model.
  - Keep its guide and evidence under `docs/model-training/experiment/v4/` while it is a candidate; an adoption decision can add a separate adopted-trial report under `docs/model-training/non-experiment/v4/TRIAL_v4.md`.
  - The experimental `TRIAL_v4.md` filename is a guide label, not evidence of adoption.
  - Same-data retraining, including the v3.1 background experiment, can use a minor model version.
  - Trial 3 introduced a new image pool and is recorded as `model-v3.0.0` in [TRIAL_v3.md](../../model-training/non-experiment/v3/TRIAL_v3.md).

- Each completed training notebook should record:

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

## Model replacement checklist

- **Coordinate the replacement:** the first three steps keep weights, labels, and cached files matched. Step 4 checks the displayed claims. Do not update only one part of the model bundle.

1. Copy the new files in and **delete every stale shard the new export does not overwrite**. Shard filenames encode the total count, so an export with fewer shards than the previous one leaves orphans behind: Trial 2.1 ships `group1-shard1of2.bin` and `group1-shard2of2.bin`, which do not overwrite Trial 2's three `of3` files. Copy `model_config.json` in alongside them, and check that its `classes` array matches the order of `CLASSES` in `src/lib/constants.ts`. A class-order mismatch mislabels every prediction without raising any error.
2. Bump `modelVersion` in `src/lib/constants.ts`, which is what the footer displays.
3. Bump the runtime cache name in `src/sw.ts`, and add the previous name to `OUTDATED_MODEL_CACHES` so the superseded weights are deleted from the device instead of sitting there forever. This is extra protection that reclaims several megabytes of old weights; the cache notes below explain what forces the refetch.
4. Review any displayed model claims in both language blocks of `src/lib/translations.ts`. Use the new evidence's correct denominators and limits. The August 27 record below preserves the earlier `aiEngineDesc` copy mistake as an example.

- Every file under `public/` enters the Serwist precache manifest with a content-revision hash, and `PrecacheRoute` is registered before `runtimeCaching`, so the router matches it first and the `CacheFirst` rule for `/model/*` never fires.

  - A changed shard therefore gets a changed revision hash and is refetched on the next service-worker activation regardless of the cache name.
  - Serwist's own `activate` handler also evicts precache entries that are absent from the current manifest, which is what removes the deleted `of3` shards.
  - Step 3 above is still worth doing as defence in depth, but do not treat a `CacheStorage` inspection as the verification: `mangoleaf-model-cache-v2-1-1` can legitimately be empty on a correctly updated device.

- Two details make that inspection easy to get wrong.

  - `public/sw.js` is minified, and its precache entries use single-quoted keys, so a search for `"url"` finds nothing; search for `'url':` instead.
  - On Windows the generated paths also use backslash separators, as in `/model\group1-shard1of2.bin`, so a grep for `/model/group1-shard1of2.bin` returns no match even when the entry is present and correct.
  - The backslashes are harmless, because the WHATWG URL parser treats a backslash as a path separator for HTTP URLs and Serwist derives every cache key through `new URL()`; a Linux build of the same commit simply emits forward slashes.
  - This command lists the entries on either platform:

```bash
grep -o "'url':'[^']*'" public/sw.js | grep -v _next/static
```

- Finally, confirm the new weight files are actually visible to git with `git status --short public/model/` before committing.

  - Files that a `.gitignore` pattern excludes are not reported as untracked, so a swap can look complete in the working tree while committing nothing.
  - See the static asset notes in `docs/ARCHITECTURE.md` for how an unanchored pattern caused exactly this with the icon directory.

- A model swap does not by itself require an app version bump, because the two version labels are independent.

  - It does require a rebuild and a redeploy, since both labels are baked into the bundle as literal strings at build time.

<a id="reading-the-historical-records"></a>

## Model timeline

- The dated records below preserve what was prepared, copied locally, restored, or adopted at that time.

  - Phrases such as "current model" and "now holds" inside an older record describe that date, not the latest application state.
  - Original scores, export identities, rollback paths, and pending checks remain unchanged.
  - The current adoption is V4.5.0.
  - V4.3.0 Combined remains the October 2 adoption record.
  - Earlier pending production/publication statements retain their historical context. The [October 7 release-status confirmation](PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026) and current prepared app release have separate records.

### August 23–24, 2026: Trial 2.1 configuration revision

- **Why `model-v2.1.0` is listed but skipped.** The Trial 2.1 export was swapped into `public/model/` on August 23, 2026 and labelled `v2.1.0`, but it was never committed and never installed on any device.

  - The next day, out-of-scope images were collected and the margin and entropy thresholds were fitted against the same resume bundle, which rewrote `model_config.json` without retraining.
  - The weight shards are byte-identical between the two states; the only differences are the two threshold values, the version constant, and the cache name.
  - The label became `v2.1.1` and the `v2.1.0` state was never released.

- A version label exists to tell one deployed client from another.

  - Because `v2.1.0` never reached a client, nothing was skipped in any sense that matters, and reconstructing a commit for it would permanently bake the dead cache name `mangoleaf-model-cache-v2-1` into history having never served a byte.
  - `model_config.json` already records the distinction correctly: `"trial": "2.1"` identifies the weights, `"modelVersion": "model-v2.1.1"` identifies the configuration revision.
  - Thresholds and weights are one calibrated artifact, since `0.55` and `0.30` were fitted on the softmax outputs of exactly those weights, so they belong in a single commit.

- The Trial 2.1 swap completed all three across August 23 and 24, 2026: `public/model/` holds 2 shards plus `model_config.json`, `modelVersion` is `v2.1.1`, and the runtime cache is `mangoleaf-model-cache-v2-1-1` with both `mangoleaf-model-cache` and `mangoleaf-model-cache-v2-1` listed for eviction.

  - Verify a future swap the same way that one was verified: run `bun run build`, then check the generated `public/sw.js` for the new cache name and confirm its precache manifest lists the new shard filenames and no old ones.

### August 27, 2026: Trial 3 replacement and copy review

- The Trial 3 swap on August 27, 2026 completed all three the same way, and the shard count reversed direction: Trial 3 ships `group1-shard1of3.bin` through `group1-shard3of3.bin`, which do not overwrite Trial 2.1's two `of2` files.

  - Both `of2` shards were deleted by hand before the build.
  - This is the second time the orphan trap has appeared and the second time it pointed the other way, so never assume the new export has more shards than the old one — list the directory after copying.

- **Historical copy correction:** at that time, `aiEngineDesc` in `src/lib/translations.ts` stated the diagnostic accuracy in the About tab, in both the `en` and `bis` blocks. It was the only accuracy figure the app displayed.

  - It said `98.25%` — Trial 2's leakage-inflated number — from Trial 2 until August 27, 2026, straight through the entire Trial 2.1 cycle, because the three steps above cover the weights, the version constant, and the cache name and none of them touches copy.
  - Grep for the outgoing figure across `src/` before committing a swap; a stale claim in two languages is worse than a stale cache name, because a cache name is invisible and a printed accuracy is a promise to a farmer.

- **Current maintenance rule:** review any displayed model claims in both language blocks of `src/lib/translations.ts` whenever the model evidence changes. The historical `aiEngineDesc` example above does not mean the current interface still contains that key or a fixed accuracy claim.

### August 30, 2026: recovered completed notebooks

- **All ten notebooks were deleted from `notebooks/` at some point on August 26 or 27, 2026, and all ten are now committed.** The five Trial 1 through 2.1 files were committed at the time and were restored with `git checkout -- notebooks/`.

  - The five Trial 3 files had never been committed, were matched by no `.gitignore` pattern, and were absent from the Recycle Bin and from every other directory in the user profile, so git could not recover them; the Colab copies in Google Drive were the only surviving originals.
  - They were recovered from Drive and committed on August 30, 2026, which closes the only outstanding item in this project that carried a real risk of permanent loss.
  - The numbers they contain were already recorded in [TRIAL_v3.md](../../model-training/non-experiment/v3/TRIAL_v3.md) and in `public/model/model_config.json`, so no measurement had been lost even while the files were gone, but the evidence files themselves existed in one place only for three days.

- **The lesson is the one this table now enforces: commit a notebook the day it runs, not the day the trial is written up.** Every file in the paragraph above that survived was survivable because it was tracked, and every file that nearly did not was untracked.

  - A completed training run is evidence, and evidence that exists in one Google Drive is not backed up.
  - `MangoLeaf_AI_Training_v3_1st_to_8th_Cells_Results.ipynb` had additionally never appeared in any document, so it could have been lost without anyone noticing it was missing.

### September 17, 2026: threshold-fitting notebook revision v3.1

- Use [`notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb`](../../../notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb) for the next threshold-only experiment against the existing Trial 3 weights.

  - It replaces the older template as the recommended fitting workflow: validation mango images and OOD tune select settings; saved settings are then evaluated with test mango images and OOD report.
  - Historical v3 notebooks and outputs remain intact.

- The `v3.1` filename identifies a **notebook revision**, not retrained weights.

  - This is an explicit naming exception to the training-notebook convention above.
  - The source model remains `model-v3.0.0`; the candidate configuration uses the patch label `model-v3.0.1`.
  - No app/model label changes until a measured candidate is adopted and deployed.
  - A future same-data retraining still follows the minor-version rule below.

- The original test/report collections influenced previous tuning, so the notebook labels their evaluation as previously used data.

  - A fresh independent evaluation requires genuinely reserved images.
  - See the [upload checklist and fitting guide](../../model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md).
  - The notebook template carries no claimed new results.

### September 18, 2026: background experiment and paired threshold fitting

- Use [training v3.1](../../../notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1.ipynb) for the controlled background-replacement experiment and [threshold fitting v3.2](../../../notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2.ipynb) for its two new calibrated models.

  - Both are clean experimental templates.
  - The completed v3 notebooks and the earlier threshold-only v3.1 templates/results remain historical evidence.

- The background candidate is `model-v3.1.0`; its freshly trained control is identified as `model-v3.1.0-control`.

  - This is a training-procedure experiment using the unchanged biological source images and original split.
  - Replacement scene photos are auxiliary training augmentation, recorded separately; they do not expand or resplit the mango evaluation dataset.
  - This explicitly falls under the minor-version rule.
  - Adding new biological specimens, changing the evaluation dataset, classes, or architecture requires revisiting the version and comparison protocol.

- The fitting notebook's `v3.2` is a **workflow revision**, not `model-v3.2.0`.

  - It reuses the validation-based fitting method and adds paired-model provenance, a freeze before either evaluation, and comparison reports.
  - No model is adopted automatically and no deployed version changes until measured review and deployment.
  - See the [experiment/upload guide](../../model-training/experiment/v3.1/TRIAL_v3_1.md).

### September 23, 2026: seven-class experiment v4

- The [v4 training and threshold notebooks](../../model-training/experiment/v4/TRIAL_v4.md) prepare candidate `model-v4.0.0`.

  - The class list changes from six outputs to seven by separating `healthy_leaf` and `healthy_fruit`, so this is a major model candidate under the policy below.
  - The original v3 ImageNet architecture and training recipe are retained, apart from the required seven-output head and recomputed class weights.

- The notebooks preserve the original rounded 70/15/15 image membership using file hashes, including intentionally renamed photos, and record the 62 reviewed image identities.

  - Training contains preparation through calibrated export; the separate fitting notebook uses validation/OOD tune, freezes the selected settings, then evaluates test/OOD report.
  - A failed retention target is recorded as infeasible.
  - The old evaluation collections remain previously used evidence, and seven-class accuracy measures a different task from the historical six-class score even when image membership is preserved.

- This prepares experimental workflows, not a new shipped model or app release.

  - `public/model/`, application class mapping, `package.json`, and `src/lib/constants.ts` remain unchanged.
  - Application adoption requires a coordinated seven-class update and the normal evaluation/release checks.

- The default Drive output root is `mangoleaf_experiments/v4/`, with separate `training/` and `threshold_fitting/` folders.

  - Run folders and downloadable evidence/model ZIPs include `v4` and a unique run ID.
  - This is a storage label for workflow v4; the model candidate remains `model-v4.0.0`.
  - Existing completed v4 bundles remain readable at their original paths.

### September 24, 2026: local v4 candidate trial

- For local testing, `public/model/` now holds an exact copy of the five files from the v4 threshold-fitting `candidate_model/` directory, including its fitted `model_config.json`.

  - The original export is untouched.
  - The app class mapping and model label are `v4.0.0`, with separate Healthy Fruit and Healthy Leaf outputs; the service-worker model cache name is `mangoleaf-model-cache-v4-0-0`.
  - App version `0.4.8` is unchanged.
  - This working-tree trial is **not a release or deployment**; the last committed baseline is v3.
  - The v4 model's field behavior still needs evaluation before adoption.

- Exact pre-trial v3 assets and app files are saved under ignored `.tools/model-backups/v3.0.0-shipping-b048442e/`.

  - Keep that directory until the trial ends.
  - Restoring v3 requires the five model files **and** the matching class mapping, About copy, guideline lookup, tests, and cache name; restoring weights alone would mislabel results.
  - The v3 model files also match Git HEAD, but the local backup preserves the exact working-tree source files, including preexisting edits.
  - Do not copy from the separate capstone v3 archive: its config differs from the shipping threshold config.

- Selected completed-run plots and summary records are copied under `docs/model-training/experiment/v4/figures/` and `docs/model-training/experiment/v4/artifacts/`; see the [v4 evidence index](../../model-training/experiment/v4/TRIAL_v4.md#saved-experimental-evidence-in-this-repository).

  - These copies document the experimental candidate and do not approve or release it.

### September 24, 2026: four-arm training workflow v4.1

- The [v4.1 experiment guide](../../model-training/experiment/v4.1/TRIAL_v4_1.md) pairs a new training notebook with separate threshold fitting.

  - The workflow keeps the verified seven-class v4 biological images and split.
  - It compares a freshly trained control with background replacement, localized lighting, and both effects together.
  - Its `v4.1` directory names an **experimental notebook workflow**, not a released app or model.
  - Candidate models may use the `model-v4.1.0` family with distinct arm names because this changes the training recipe without adding mango specimens.

- Fit each new arm's thresholds from clean validation and the old OOD tune partition.

  - Freeze all selections before running on mango test, the old OOD report partition, or the newly collected OOD report photos.
  - The older evaluation sets were used during development, so comparisons on them remain exploratory.
  - The new OOD folder measures rejection behavior only; it does not measure disease-classification accuracy.
  - The locally copied v4.0.0 candidate and ignored v3 backup remain in place while v4.1 is evaluated.
  - No v4.1 result, adoption, app-version change, or deployment is claimed by creating the workflow.

### September 25, 2026: completed v4.1 experiment and local background-arm trial

- The completed [v4.1 evidence index](../../model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test) records four trained arms and frozen threshold evaluations.

  - On the same 393 historical mango test files, background and combined each classified 387 correctly before rejection versus v4's 383.
  - After rejection, each correctly accepted 373, wrongly accepted 3, and rejected 17 mango photos.
  - These small, reused-set differences do not establish field superiority.
  - Only 66 training photos were eligible for replacement, so actual background composites were 1.00% of all training presentations.
  - The new OOD report contained 32 broad scene photos; it did not test disease accuracy.
  - The older OOD folder gained one photo since v4 and its tune/report membership changed.

- The [V4.1 post-training figures notebook](../../../notebooks/experiment/v4.1/MangoLeaf_AI_Post_Training_Figures_v4_1.ipynb) draws saved metrics and fresh validation Grad-CAM without changing any model weights or rejection thresholds.

  - Its figures and provenance are indexed in the [experiment guide](../../model-training/experiment/v4.1/TRIAL_v4_1.md#post-training-figures-september-25-2026).
  - This evidence-only workflow does not create a new model version or app version.

- For **local testing only**, the five files in `public/model/` now match the completed v4.1 threshold run's `candidate_models/background/` and its `candidate_hashes.json`.

  - The displayed model label is `v4.1.0-candidate`, matching `model_config.json`'s `model-v4.1.0-candidate` identity.
  - The Serwist runtime cache is `mangoleaf-model-cache-v4-1-0-candidate`; the old v4 cache name is on the eviction list.
  - Seven-class output order stays unchanged.
  - App version `0.4.8` stays unchanged.
  - This working-tree trial is not a model adoption, release, or deployment; the last committed/released model remains v3.

- Before replacement, all five local v4 files were checked against the external v4 threshold `candidate_model/` archive and matched byte-for-byte.

  - The exact local v4 files plus `src/lib/constants.ts` and `src/sw.ts` were saved in ignored `.tools/model-backups/v4.0.0-local-before-v4.1-20260925/`, with their hashes.
  - The separate v3 shipping backup remains.
  - To restore v4, restore all seven saved files together, rebuild, and update current candidate documentation.
  - Keep both backups until the final model choice.

- This section records the September 25 local state.

  - See the September 28 entry below for the current local candidate.

### September 27, 2026: guided V4.1.1 reproduction workflow

- [V4.1.1](../../model-training/experiment/v4.1.1/TRIAL_v4_1_1.md) is a new **notebook workflow label** for a readable rerun of the V4.1 four-arm recipe.

  - The clean training, threshold-fitting, and figure notebooks use separate `MyDrive/mangoleaf_experiments/v4.1.1/` run folders.
  - `model-v4.1.1-candidate` names possible new run weights and does not rename the completed V4.1 model or the app.
  - No V4.1.1 weights, thresholds, accuracy result, adoption, or release are claimed by preparing the workflow.
  - Preserve the historical V4.1 run and its hashes.

- The old mango test, old OOD report, and V4.1's 32-photo new-OOD report have all influenced development; rerun comparisons on them are exploratory.

  - A later untouched OOD set and expert-labeled mango field set are needed for independent rejection and accuracy claims.
  - Changing biological photos, labels, split, scene pool, or review decisions is a corrected new experiment rather than a strict V4.1 reproduction.
  - Identical numeric results are not guaranteed even when inputs and settings match.

### September 28, 2026: completed V4.1.1 reproduction and local Background-arm trial

- The [V4.1.1 result and evidence guide](../../model-training/experiment/v4.1.1/TRIAL_v4_1_1.md#completed-run-and-local-trial-september-28-2026) records four newly trained arms, frozen threshold fitting, and post-training figures.

  - V4.1.1 Background classified 387 of 393 reused mango test images correctly before rejection.
  - With its fitted 0.70 confidence, 0 margin, and 0.38 entropy gates, it accepted 373 correct and 3 wrong mango predictions, rejected 17 mango images, and accepted 26 of 84 old OOD report photos and 1 of 32 reused new-OOD photos.
  - The corresponding V4.1 Background arm made the same accept/reject decisions on these 509 evaluated photos; the new weights and probabilities can still differ.
  - This is exploratory evidence, not an independent improvement or field-accuracy result.

- For **local testing only**, `public/model/` now holds all five files from V4.1.1 threshold fitting's `candidate_models/background/`.

  - The displayed label is `v4.1.1-candidate`, matching the export's `model-v4.1.1-candidate` identity; the service-worker runtime cache is `mangoleaf-model-cache-v4-1-1-candidate`, with the prior V4.1 candidate cache on the eviction list.
  - The seven output classes and app version `0.4.8` are unchanged.
  - Copy the model JSON, configuration, and three shards together: the gates in `model_config.json` belong to these exact weights.
  - No adoption, deployment, or release has occurred; the last released model remains V3.

- The full V4.1.1 Colab runs and original candidate export remain outside the repository.

  - Curated records and figures under `docs/model-training/experiment/v4.1.1/` are evidence copies.
  - Ignored `.tools/model-backups/v4.1.1-background-candidate-20260928/` keeps all five candidate model files, matching app files, and a hash manifest for later comparison or restoration.
  - Exact V3 shipping and V4.0 local backups also remain.
  - There was no separate V4.1 backup to remove.
  - Restore model files and matching app labels/cache together.
  - Independent OOD, expert-labeled field accuracy, browser TensorFlow.js parity, and physical-device checks remain open before any adoption decision.

### September 28, 2026: V4.2.0 separate-model experiment prepared

- The [V4.2.0 experiment guide](../../model-training/experiment/v4.2.0/TRIAL_v4_2_0.md) describes **unrun notebook templates**, not a new shipped model.

  - It separates four leaf classes, including Bacterial Canker, from three fruit classes while preserving the existing per-class train/validation/test membership and approximate 70/15/15 split.
  - Each organ has one training notebook with figure steps and one independent threshold-fitting notebook.
  - Both use the base, background-replacement, and localized-lighting training effects.
  - `v4.2.0` labels this two-model workflow only; no V4.2.0 accuracy, thresholds, exports, app integration, adoption, deployment, or release are claimed.
  - The app stays at `0.4.8`, its local test model remains `v4.1.1-candidate`, and the last released model remains V3.
  - Any future model artifact labels must identify leaf and fruit exports separately so neither class map or threshold set can be confused with the other.

### September 29, 2026: completed V4.2.0 runs and local dual-model trial

- The [completed V4.2.0 evidence index](../../model-training/experiment/v4.2.0/TRIAL_v4_2_0.md#completed-results-and-comparison-september-29-2026) records separate four-class leaf and three-class fruit training, frozen threshold fitting, and selected figures.

  - Each organ has its own `artifacts/` and `figures/` under `docs/model-training/experiment/v4.2.0/<organ>/`, with a `source_manifest.json` containing source paths and hashes.
  - These are experimental records, not adopted model releases.

- The Mango Leaf selected gate was feasible: confidence `0.70`, margin `0`, entropy `0.01`.

  - It classified 296 of 297 reused leaf test photos correctly before rejection and accepted 295 correct, 0 wrong, while rejecting 2.
  - Mango Fruit **had no feasible threshold candidate**.
  - Its fixed confidence-only validation reference retained only 77 of 94 fruit photos (81.91%), below the 95% rule.
  - Its training export classified 86 of 96 reused fruit test photos correctly before rejection; the confidence-only reference accepted 72 correct, 0 wrong, and rejected 24.
  - No fruit fitted threshold set or candidate ZIP exists.
  - The correct-choice raw total is 382 of 393 (97.20%), below V4.1.1 Background's 387 of 393 (98.47%) on the same reused files.
  - This does not estimate the behavior when a user chooses the wrong organ or on fresh field photos.
  - V3's six-class score is not directly comparable.

- For **local testing only**, the leaf fitted candidate was placed under `public/model/mangoleaf/`, and the fruit **training export** under `public/model/mangofruit/`; each had its own model JSON, class mapping, config, and weight shards.

  - `src/lib/constants.ts` displayed `v4.2.0-dual-experiment`, and the service-worker runtime cache was `mangoleaf-model-cache-v4-2-0-dual-experiment`.
  - Both models loaded during startup, and the user selected an organ before the scan sheet.
  - Duplicate-report reuse required matching local model label and organ; old V4.1.1 scans did not silently substitute for a V4.2.0 prediction.
  - App version `0.4.8` stayed unchanged.
  - Ignored `.tools/model-backups/v4.1.1-background-candidate-20260928/` kept the exact V4.1.1 Background model files, pre-trial app source copies, SHA-256 hashes, and `ROLLBACK.md` instructions.
  - V3 and V4 backups remained.
  - No deployment or release was claimed.
  - The existing single-model browser test cases were deliberately left unchanged and did not verify this route.
  - Model parity, first-load and memory cost, a wrong-choice study, fresh independent field/OOD evidence, and physical checks remained open before any adoption.

### September 29, 2026: returned local app to V4.1.1 Background

- Local testing of the V4.2.0 two-model interface did not satisfy the team's expectations.

  - The app again opens its scan sheet directly and loads only the seven-class V4.1.1 Background candidate from the five root `public/model/` files.
  - The restored display label is `v4.1.1-candidate`, with its matching `model-v4.1.1-candidate` config and confidence `0.70`, margin `0`, entropy `0.38` gates.
  - The V4.2.0 organ selector, dual-model loading, and organ-specific production asset directories are no longer active.
  - Local history keeps V4.2.0 trial rows, but same-photo reuse excludes rows marked with the V4.2.0 model version so a new scan receives a V4.1.1 inference.
  - The service worker uses the V4.1.1 candidate cache label and evicts the former V4.2.0 trial cache.

- Ignored `.tools/model-backups/v4.2.0-dual-experiment-20260929/` keeps the exact two-model files, matching app source copies, hash manifest, and rollback instructions.

  - The V4.1.1 backup and all V4.2.0 notebooks, curated artifacts, figures, and comparison results remain intact.
  - This is a **local experiment rollback**, not a release or deployment.
  - App version stays `0.4.8`; the last released model remains V3.
  - Validation for this change consists of typecheck, lint, and build; the existing browser test cases were left untouched and not run.

### October 1, 2026: V4.3.0 single seven-class workflow prepared

- The [V4.3.0 candidate guide](../../model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) describes two unrun notebooks: one seven-class training notebook with integrated figures and one threshold-fitting notebook.

  - It preserves the saved V4.1.1 per-class train/validation/test membership and approximate 70/15/15 split.
  - One combined recipe keeps the common augmentation and adds reviewed training-only background replacement and local lighting, each at 30%.
  - The intended scene input is the original 62 photos plus 138 supplied new photos; inventory, hashes, duplicates, overlap, suitability, and use-rights review must confirm the usable pool.
  - This expands scene diversity without adding labeled mango specimens.
  - Optional prior masks and review records may be reused only after their source and file hashes validate.

- `v4.3.0` identifies this notebook workflow; `model-v4.3.0-candidate` identifies possible new exported weights and settings.

  - No completed run, score, fitted gate, export, adoption, deployment, or release is claimed.
  - Prior mango test and both OOD report collections remain reused exploratory evaluation data.
  - The app stays at `0.4.8`, its local single-model trial remains V4.1.1 Background (`v4.1.1-candidate`), and the last released model remains V3.
  - Preserve every earlier notebook and evidence file.
  - Any future V4.3.0 adoption requires evaluation of its exact hashes and the normal app/release checks.

### Completed V4.3.0 local candidate: October 1, 2026

- The [completed V4.3.0 guide](../../model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#completed-run-and-local-trial-october-1-2026) records one seven-class Combined model, 200 approved unique scene inputs, 66 replacement foregrounds, 273 replacement presentations, integrated figures, and frozen threshold fitting.

  - The [V4.1.1 comparison](../../model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md) establishes matching evaluation identities and mixed results: raw 386/393 (98.22%), 373 correct/3 wrong accepted, 17 mango rejections, old OOD 24/84 false accepts, reused newer OOD 5/32.
  - These figures do not establish an improvement over the previous Background candidate or field accuracy.

- For this local trial, root `public/model/` holds all five fitted `candidate_models/combined/` files.

  - Export identity is `model-v4.3.0-candidate`, display label `v4.3.0-candidate`, confidence 0.70, margin 0, entropy 0.42, and folded temperature 1.1602258301498714.
  - The seven-class order and app version 0.4.8 stay unchanged.
  - The worker uses `mangoleaf-model-cache-v4-3-0-candidate` and evicts the former V4.1.1 runtime cache.
  - The existing duplicate lookup is already model-aware; earlier saved diagnoses remain in History and do not substitute for a current-label inference.

- Before installation, the previous five V4.1.1 assets and matching source snapshots were preserved in ignored `.tools/model-backups/v4.1.1-background-before-v4.3.0-20261001/`, with hashes and rollback instructions.

  - Restore the model bundle and matching label/cache together, then rebuild and reload; do not mix gates and weights.
  - Historical V3, V4, V4.1.1, V4.2.0 notebooks/results/backups and every original V4.3.0 run file remain intact.
  - No adoption, deployment, release, commit, or promotion is claimed by this local test.
  - The last released model remains V3.

### Restored V4.1.1 Background local candidate: October 2, 2026

- The exact V4.1.1 Background candidate was restored for local testing.

  - All five fitted model files were copied together from the verified October 1 backup; each matches the original Background candidate export.
  - Root `public/model/` again uses `model-v4.1.1-candidate`, display label `v4.1.1-candidate`, confidence 0.70, margin 0, entropy 0.38 and folded temperature 1.162061222701274.
  - The [restoration receipt](../../model-training/experiment/v4.1.1/artifacts/local_restore_20261002.json) preserves source paths and model/config/shard hashes.

- Before replacement, the exact active V4.3.0 bundle and seven current source snapshots were hash-verified into `.tools/model-backups/v4.3.0-combined-before-v4.1.1-20261002/`.

  - Its `ROLLBACK.md` restores the five assets plus their model label and cache identity without reverting newer UI/guidance work.
  - The worker now uses `mangoleaf-model-cache-v4-1-1-candidate`; the V4.3.0 cache is on the eviction list and the active-cache filter protects V4.1.1.
  - Precache revisions, followed by worker activation and page reload, update the downloaded weights; an already open page can retain its previous in-memory graph until reloaded.

- The app stays at 0.4.8.

  - Recent photo-review and guideline/reminder changes remain in place; model-aware duplicate reuse still checks the active label.
  - V4.3.0 history stays readable, while its saved results do not replace V4.1.1 inference.
  - Original notebooks, artifacts, figures, archives and older backups remain intact.
  - This records a local rollback, not a new training result, adoption, deployment, or release.
  - The last released model remains V3.
  - Browser/Keras parity, independent field/OOD evaluation, and physical-device checks remain pending before adoption.

- Curated source records and final figures are under the existing experiment version folder, with original-source and derived-review manifests.

  - Browser/Keras prediction parity, fresh OOD, expert-labeled field accuracy, physical-device reliability/performance, and stronger scene suitability/source notes remain open.
  - Existing test cases, Husky, and GitHub workflows were left unchanged during this experimental swap.

### Restored V4.3.0 Combined for local retesting: October 2, 2026

- The saved V4.3.0 Combined candidate was restored for another local test.

  - All five root `public/model/` files match both the verified October 2 V4.3.0 backup and the original fitted `candidate_models/combined/` export.
  - Display label `v4.3.0-candidate`, config identity `model-v4.3.0-candidate`, confidence 0.70, margin 0, entropy 0.42, and folded temperature 1.1602258301498714 identify this exact bundle.
  - The [restoration receipt](../../model-training/non-experiment/v4.3.0/artifacts/local_restore_20261002.json) records both model bundles and their hashes.
  - Saved training/evaluation results are unchanged; this swap performs no retraining or new accuracy evaluation.

- The exact previous V4.1.1 Background files and latest source/document references were preserved in `.tools/model-backups/v4.1.1-background-before-v4.3.0-retest-20261002/`, with a verified manifest and `ROLLBACK.md`.

  - Older backups and original runs remain intact.
  - Restoring only the model files and matching label/cache retains newer UI and translation edits.
  - The active worker cache is `mangoleaf-model-cache-v4-3-0-candidate`; activation protects it and evicts the V4.1.1 runtime cache.
  - Changed precache revisions update model downloads, while a page reload replaces an already loaded in-memory graph.

- App version remains 0.4.8.

  - The single scan flow, photo guidance, Bisaya copy, guideline handling, and history stay in place.
  - Duplicate-report reuse continues to require the current model label.
  - These files remain an experimental local candidate; the last released model remains V3.
  - Browser/Keras parity, independent field/OOD evaluation, and physical-device checks remain pending before adoption.

### v0.4.9 adoption of V4.3.0 Combined: October 2, 2026

- For the application changes and verified local tag identity, see the [v0.4.9 PWA history entry](PWA_RELEASE_HISTORY.md#v049-adoption-of-v430-combined).

  - The model provenance and original adoption status are preserved below.

- V4.3.0 Combined was selected as the current application model, replacing the former six-class V3 baseline.

  - App `package.json` version is `0.4.9`; `src/lib/constants.ts` displays `v4.3.0`.
  - The adopted configuration identifies `model-v4.3.0` and retains `model-v4.3.0-candidate` as its original export identity.
  - The graph and three weight shards are unchanged from the verified Combined export.
  - Class order, 224 × 224 preprocessing, folded temperature `1.1602258301498714`, confidence `0.70`, margin `0`, and normalized entropy `0.42` remain unchanged.
  - The configuration hash changes with release metadata; the [adoption receipt](../../model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) records original and adopted hashes separately.

- The active model runtime cache is `mangoleaf-model-cache-v4-3-0`.

  - Activation protects that cache and removes superseded candidate caches.
  - Content revisions in the regenerated precache manifest update cached configuration/application files; a page reload replaces an already loaded graph.
  - History is preserved.
  - Duplicate reuse now requires the exact active `model_version`: another model label or an unlabeled legacy row cannot substitute for adopted-model inference.
  - This is a narrow promotion change from the earlier local trial's legacy-row behavior.

- The preserved V4.3.0 trial, comparison, artifacts, and figures are now under `docs/model-training/non-experiment/v4.3.0/`.

  - Its two clean workflow templates and completed result copies are under `notebooks/non-experiment/v4.3.0/`, with original notebook contents and outputs retained.
  - Earlier trial records and backups remain intact.
  - The exact pre-adoption source, documentation, model, notebooks, tooling, fixtures, and hook/workflow files are backed up under ignored `.tools/release-backups/v0.4.9-model-v4.3.0-20261002/before/`.

- The existing eight-photo smoke suite uses the current supplied photo set, including the replaced Mango Scab PNG and Bacterial Canker JPG with recorded hashes.

  - Regression cases cover photo-review dismissal, explicit duplicate-report actions, all seven controlled class outputs, downloaded/missing bilingual guidance, and the uncertain-photo reminder.
  - Numerical gates are unchanged.
  - Controlled UI assertions and repeated real-model calls measure different behavior; neither supplies independent field accuracy or full browser/Keras probability parity.

- Repository adoption is complete when the coordinated model/source/documentation update is prepared.

  - Local validation results are recorded in the [testing guide](../../testing/TESTING.md) and adoption receipt; CI on the final `master` commit and production promotion remain pending.
  - After those gates pass, tag the exact tested commit as `v0.4.9` and `model-v4.3.0`, and publish only the app tag's GitHub Release.
  - No commit, tag, push, release publication, or deployment is implied by preparing the adoption files.
  - Preserve the adopted/released distinction in later evidence entries.

### October 3, 2026: historical Colab dependency snapshot

- **Historical runtime security, October 3, 2026:** The V4.3.0 Colab package freeze is archived as `colab-runtime-snapshot.txt`, with [separate provenance](../../model-training/non-experiment/v4.3.0/artifacts/runtime-snapshot-provenance.json).

  - Its 14,117 bytes, original filename in the run ledgers, notebook outputs, and model hashes are preserved.
  - The [security review](../../security/DEPENDENCY_SECURITY.md) records 112 advisories against that old environment.
  - The PWA does not install it; a future training run must use a reviewed, patched runtime rather than reinstalling the snapshot.
  - This repository archive clarification does not change model version or establish retraining compatibility.

### October 6, 2026: app-only History changes

- **October 6, 2026 application snapshot:** App `0.5.2` retains V4.3.0 Combined (`v4.3.0`) in root `public/model/`.

  - This app update prepares responsive scan lists, report selection, and confirmed single/batch deletion.
  - Model weights, classes, preprocessing, temperature, and fitted gates remain unchanged.
  - Original exports, dated evidence, and earlier rollback backups remain preserved.
  - See the [October 2 adoption record](#v049-adoption-of-v430-combined-october-2-2026), [v0.5.2 release status](PWA_RELEASE_HISTORY.md#v052-scan-history-and-deletion-candidate-october-6-2026), and [October 6 candidate validation](../../testing/TESTING.md#v052-candidate-validation-october-6-2026).
  - The [v0.5.1 validation](../../testing/TESTING.md#v051-candidate-validation-october-5-2026) remains evidence for its original build.
  - The existing local `model-v4.3.0` tag remains the model provenance marker; no new model tag is required.

### October 7, 2026: app-only guidance changes

- **October 7, 2026 application snapshot:** App `0.5.4` retains V4.3.0 Combined (`v4.3.0`) in root `public/model/` and skips unchanged HTTP guidance writes after the existing ordering safeguards pass.

  - The five model assets, classes, preprocessing, folded temperature, and fitted gates are unchanged.
  - See [v0.5.4 release status](PWA_RELEASE_HISTORY.md#v054-unchanged-guidance-check-prepared-release-october-7-2026) and [versioned validation](../../testing/TESTING.md#v054-release-validation-october-7-2026).
  - The existing `model-v4.3.0` provenance tag remains; no new model tag is required.
  - The [reported release status](PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026) identifies `v0.5.3` as the live baseline and records that the earlier `v0.5.0`–`v0.5.2` versions were also published and used.

### V4.4.0 fresh experimental workflow, October 8, 2026

- The [V4.4.0 Seven Class guide](../../model-training/experiment/v4.4.0/TRIAL_v4_4_0.md) introduces two standalone clean templates under `notebooks/experiment/v4.4.0/`.

  - Candidate `model-v4.4.0-candidate` uses the existing biological source pool, a newly audited grouped 70/15/15 split, 225 scene inputs subject to review, and a reused 200-photo OOD pool with a target of 100 tuning and 100 reporting photos.
  - Training starts from ImageNet, with newly generated masks, class weights, temperature, and rejection settings.
  - Previous MangoLeaf split, mask, checkpoint, and run folders are not inputs.
  - The embedded 62 reviewed source-image identities preserve known nonduplicate findings without inheriting previous split membership.

- The architecture, five plus ten epoch schedule, and seven augmentation categories retain the V4.3.0 method.

  - The new membership changes the evaluation protocol; historical V4.3.0 accuracy is not a directly paired baseline, and previous OOD use remains visible.
  - The `v4.4.0` workflow/model candidate label does not establish adoption, accuracy, a PWA release, or deployment.
  - Outputs remain experimental under `MyDrive/mangoleaf_experiments/v4.4.0/`; the adopted application model remains V4.3.0.
  - Fresh runtime audits, conversion preflight, completed training, prediction parity, frozen evaluation, and an explicit adoption decision are required before changing application model assets.

- **Runtime repair, October 8, 2026:** Both templates execute their scientific cells in a persistent isolated kernel, with dedicated package audits and a separate unresolved-provider report.

  - The training recipe and experiment identity remain V4.4.0; the repair does not adopt a new model or change the PWA version.
  - Different attempts retain separate runtime evidence and hashes.

- **Converter dependency repair, October 8, 2026:** The experimental converter pins YDF 0.11.0 and Protobuf 5.29.6 to avoid the confirmed newer-gencode/older-runtime import failure.

  - The [compatibility evidence](../../model-training/experiment/v4.4.0/artifacts/converter-protobuf-review.json) and experiment guide distinguish local generated-code proof from pending complete Colab conversion.
  - This changes setup dependencies, not the architecture, training recipe, adopted model, or PWA version.

### V4.4.0 local test completed; V4.3.0 restored, October 9, 2026

- The maintainer completed local testing of `model-v4.4.0-candidate` and declined it.

  - The five original V4.3.0 files in `public/model/` were restored from the verified pre-trial backup, together with display label `v4.3.0`.
  - Confidence `0.70`, margin `0.00`, normalized entropy `0.42`, class order, preprocessing, and the folded V4.3.0 temperature are restored with the original model configuration.
  - The service worker again uses `mangoleaf-model-cache-v4-3-0` and removes the temporary `mangoleaf-model-cache-v4-4-0-candidate` cache on activation.
  - Existing scan records retain their original model labels; exact-file reuse still requires a match with the active model.

- The [completed V4.4.0 report](../../model-training/experiment/v4.4.0/TRIAL_v4_4_0.md#completed-results-and-local-rollback-october-9-2026) preserves the 15-epoch run, fitted rejection settings, metrics, curated figures, and source hashes.

  - Raw test accuracy was 380/397 (95.72%); accepted-only accuracy was 366/374 (97.86%), with 23 rejected mango photos.
  - Report-only OOD false acceptance was 31/100.
  - Changed mango split membership and reused OOD assignments limit direct comparisons with V4.3.0.
  - Completed notebooks remain under `notebooks/experiment/v4.4.0/`; original cells, outputs, downloaded folders, and run ledgers remain intact.
  - This decision is a local rollback, not V4.4.0 adoption, retraining, an app version bump, or production promotion.
  - App label remains `0.5.4`; earlier release evidence applies to its recorded build.

### October 10, 2026: archive clarification and app release preparation

- **Mask reuse note archive correction, October 10, 2026:** The prose-only V4.3.0 `mask_requirements.txt` is archived as `mask-reuse-note.txt` to prevent pip dependency scanning from treating its sentence as a package requirement.

  - Its 104 bytes, original run ledgers, completed notebooks, and model files remain unchanged.
  - The [separate filename mapping](../../model-training/non-experiment/v4.3.0/artifacts/mask-reuse-note-provenance.json) and [dated trial note](../../model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#mask-reuse-note-archive-correction-october-10-2026) preserve the source identity.
  - `bun run verify:training-archive` checks both archive mappings.
  - This changes repository evidence storage, not the app/model version or original training workflow.

- **Historical prepared application release, October 10, 2026:** App `0.5.5` retains V4.3.0 Combined (`v4.3.0`) in root `public/model/` after the temporary V4.4.0 local test and restoration.

  - Guided camera capture, photo review/retake, installation guidance, and History refinements change the PWA workflow without retraining or changing the five model files, classes, full-photo 224 × 224 preprocessing, folded temperature, or fitted gates.
  - See [v0.5.5 release status](PWA_RELEASE_HISTORY.md#v055-guided-camera-and-installation-prepared-release-october-10-2026) and [versioned validation](../../testing/TESTING.md#v055-release-validation-october-10-2026).
  - The existing `model-v4.3.0` provenance tag remains; no new model tag is required.
  - V4.4.0 evidence stays experimental, and preparation does not establish production promotion or a new accuracy result.

### V4.5.0 fresh Outlier Exposure workflow, October 11, 2026

- The [V4.5.0 experiment guide](../../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md) defines two clean templates under `notebooks/non-experiment/v4.5.0/`: training and threshold fitting.

  - Ordinary Colab cells replace the earlier custom execution layer.
  - Raw owned mango, OE, and OOD collections are inputs; previous MangoLeaf runs, checkpoints, masks, and split archives are not.
  - New results stay under `MyDrive/mangoleaf_experiments/v4.5.0/training/` and `threshold_fitting/`.

- Training retains MobileNetV3-Large, seven classes, RGB 224 × 224 float32 0–255 input, the five-epoch 0.001 / ten-epoch 0.00001 schedule, fresh balanced class weights, and validation-only temperature fitting.

  - It retains the 62 reviewed source identities, creates a new grouped approximately 70/15/15 split, adds OE and random contrast 0.1, and removes background replacement/localized lighting.
  - The intended first run declares 500 reviewed OOD photos before training and assigns 250 tuning / 250 reporting without splitting related groups.
  - Reused OOD history remains visible.

- These are unexecuted experimental templates, not completed results, adoption, or a PWA release.

  - The adopted V4.3.0 assets and app label remain unchanged.
  - Runtime, GPU, training, conversion, browser parity, frozen evaluation, and any later adoption must have their own recorded evidence.
  - Changed membership and multiple simultaneous recipe changes prevent attributing a historical score difference to OE alone.

### V4.5.0 local candidate test (October 12, 2026)

- At the maintainer's request, the working tree temporarily tested **`v4.5.0-candidate`** from the completed OE experiment.

  - Its original fitted configuration used confidence 0.70, margin 0, and entropy 0.40, with temperature already folded into the weights.
  - This passage describes that earlier temporary state only.
  - On October 16, V4.5.0 was initially adopted in the repository with confidence 0.70 only under app `0.5.5`; see the current adoption section above.
  - The subsequent PWA version correction prepared `0.6.0`, followed by the `0.6.1` score-display patch and `0.7.0` diagnostics/raw-confidence preparation.
  - Production release/deployment are separate.

- The [completed results/local-test guide](../../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#v450-completed-results-and-local-test-october-12-2026) records selected evidence, exact hashes, an ignored independent V4.3.0 backup, and targeted rollback.

  - Existing History labels remain; duplicate-report reuse requires the active candidate label.
  - Reload/reopen the page after switching because the model and fitted thresholds are cached in memory.
  - Browser/Keras parity and field evaluation remain unverified.
  - The 30-minute R03 testcase and shortened alternatives are excluded by the maintainer.
  - Earlier dated release/model records below remain historical evidence.

### V4.5.0 confidence-only reference figures (October 14, 2026)

- Two locally generated rejection-aware charts now visualize the saved V4.5.0 **70%-confidence-only reference**, with margin/entropy rejection disabled for those plotted decisions.

  - The [experiment's derived-figure record](../../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#confidence-only-reference-figures-october-14-2026) links figures, exact source/output hashes, and the reproducible plotting tool.
  - This operation did not retrain or run inference, edit archived evidence, or change the active app/model/cache identity.
  - The plotter does not edit or verify application configuration; a separate threshold change still requires its own identity, cache, and validation review.
  - Figure generation does not establish adoption or deployment of confidence-only behavior.

### V5.0.0 OE fine-tuning workflow prepared (October 15, 2026)

- The [V5.0.0 candidate guide](../../model-training/experiment/v5.0.0/TRIAL_v5_0_0.md) and [clean notebook/helper](../../../notebooks/experiment/v5.0.0) prepare a warm start from the verified, uncalibrated V4.5.0 stage-two checkpoint.

  - Original mango train/validation/test membership stays fixed at 1,854/398/397.
  - The old reviewed 500-photo OOD pool becomes OE training input, giving an expected 2,511 unique approved OE photos with the existing 2,011.
  - Matching old review evidence is inherited; new cross-pool relationships still require verification.
  - The 300 reserved photos were already excluded from the 2,011 and must not be counted twice.

- Expanding the approved training dataset uses the major candidate identity **`model-v5.0.0-candidate`** under the policy below.

  - The new attempt uses a fresh optimizer, validation-only checkpoint selection and temperature calibration, and fixed confidence 0.70 with margin/entropy disabled.
  - A fresh unseen OOD reporting collection is required because the old 500 now supply training gradients.
  - New weights require new predictions and figures, including recomputed Grad-CAM on the same seven validation originals.
  - This is workflow preparation with no training/evaluation result, adoption, deployment, app-version bump, public model replacement, or application inference change.

- For this experiment, the expanded dataset is the **approved OE training pool**; the mango test membership stays fixed.

  - The major label therefore does not require reshuffling mango data or imply a new independent test set.
  - The earlier six-class explanation below describes those historical dataset changes, not a reason to alter this confirmed V5.0.0 split.

### October 16, 2026: V4.5.0 repository adoption

- **Decision:** the saved V4.5.0 OE export replaces V4.3.0 in repository source with confidence >=0.70 only. The [current adopted-model record](#current-adopted-model-v450-october-16-2026) retains asset/configuration/cache identity, rollback receipt, exact mango/OOD counts, and evaluation limits.
- **Version context:** the adoption started under app `0.5.5`; the subsequent version correction prepared `0.6.0`, followed by `0.6.1` and `0.7.0` app preparation. Those changes do not imply that a prepared deployment was promoted.

### October 17, 2026: app diagnostics, confidence storage, and texture setting

- **Model unchanged:** the prepared `0.7.0` app keeps V4.5.0 weights, classes, preprocessing, calibration, and model-cache identity.
- **Runtime and display:** the current-model summary records the existing forced 16-bit WebGL override and raw-confidence storage/display behavior. These app settings do not create new training or accuracy results.
- **Feature preparation:** commit `88a479d` contains the app update. The scanner follow-up and branch handoff have their own October 18 record below.

### October 18, 2026: app scanner follow-up and branch handoff

- **Handoff:** scanner follow-up `116e462` was pushed to `master` after feature preparation `88a479d`; a local annotated `v0.7.0` candidate tag was prepared. The [dated PWA handoff](PWA_RELEASE_HISTORY.md#october-18-2026-v070-scanner-follow-up-and-branch-handoff) and [validation follow-up](../../testing/TESTING.md#final-local-v070-validation) preserve the scanner scope and evidence.
- **Model unchanged:** the follow-up does not change application/model inputs, app `0.7.0`, or adopted model `v4.5.0`. It adds no model training or scientific evaluation result.
- **Status boundary:** remote CI, tag publication, and production deployment remain unverified in this documentation pass; the maintainer handles those release steps.

### October 18, 2026: V5.0.0 serial training batch correction

- **Reported attempts:** one Colab attempt stopped in mango `RandomZoom` after three epochs; a fresh attempt stopped in OE `RandomShear` after one epoch. The earlier 12-batch diagnostic passed without establishing full-run reliability. No completed V5.0.0 training/evaluation handoff is recorded.
- **Prepared correction:** the helper now finishes CPU decoding/augmentation before each synchronized compiled model step. Explicit training/validation batches replace the nested training generator and prefetch; a continuous OE cursor preserves ordering and short tails. Epoch metrics, clean validation selection, the parent baseline, and research settings remain intact. Exposure counts advance after successful update/readback. Both clean notebook templates verify the new matching helper hash. Step 2 adds a synthetic execution probe; Step 3 checks all five review files before inventory. The [trial follow-up](../../model-training/experiment/v5.0.0/TRIAL_v5_0_0.md#october-18-2026-serial-training-batch-correction) records the failure evidence, execution-policy changes, retry instructions, and validation limits.
- **Identity and scope:** a fresh frozen attempt must record its helper/configuration hashes; failed Drive runs and historical evidence remain preserved. This is a workflow correction, not model adoption, a PWA version change, a training-duration result, or a new accuracy/OOD result. Full Colab execution remains required.

### October 19, 2026: V5.0.0 completed review and local candidate

Two independent audits verified completed training run `v5-0-0-oe-finetune-20261018T153838Z-5a6fce69` and reporting run `v5-0-0-report-20261018T211040Z-e49c5359`. All 86 training and 58 reporting receipt entries passed. Original-byte copies and unchanged executed notebooks remain under the experimental V5 folders; original source files were never moved. The [results review](../../model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md) records calibration, class errors, independent checks, and hashes.

At confidence >=0.70 only, both models have 377 correct accepted, 12 wrong accepted and eight rejected on the same 397 historical mango photographs. Raw correct is 384 for V4.5 and 383 for V5. V5 separately rejected 942 of 995 AI-assisted reviewed unsupported internet photographs, with 53 accepted. Historical OOD pools differ, and source/capture independence remains incomplete; a matched local browser follow-up is recorded separately from the Colab report. These findings do not establish overall V5 superiority.

The maintainer explicitly requested a reversible local installation. Copied graph/shards and current provenance metadata now occupy `public/model/`, with label `v5.0.0-candidate` and cache `mangoleaf-model-cache-v5-0-0-candidate`. Only configuration status and later-report provenance differ from the original sealed export; numerical settings remain fixed. The [installation receipt](../../model-training/experiment/v5.0.0/artifacts/local_test_installation.json) identifies all active and original files. Exact confidence-only V4.5 assets and prior label/cache source were backed up under ignored `.tools/model-backups/v4.5.0-before-v5.0.0-local-test-20261019/`; isolated rollback checks passed, including corrupt-backup refusal before mutation. App version remains `0.7.0`. V4.5 remains adopted, while V5 stays experimental; no adoption, deployment, commit or release occurred.

The later matched browser run completed 1,990 predictions using the same 995 images and production classifier: V4.5 accepted 95/995 (9.55%) and V5 accepted 45/995 (4.52%). Both used confidence >=0.70 only, canvas resizing and forced-float16 WebGL on the recorded software renderer. V5 rejected 52 additional previously accepted images but newly accepted two dogs; mango accepted correctness remained tied. This supports improved unsupported-image rejection on that pool, not overall field superiority. V5 browser and Colab differ on 20 acceptance decisions; numerical parity remains unverified. [Paired browser evidence](../../model-training/experiment/v5.0.0/artifacts/review/browser-ood-summary.json) preserves the distinct pipeline and denominator.

The maintainer subsequently selected a research-only push: notebooks, result records, figures, tooling and documentation may be committed, while `public/model/`, `src/lib/constants.ts`, `src/sw.ts`, and generated `public/sw.js` remain local overrides. Committed application files retain V4.5 and PWA `0.7.0`; no version bump or adoption follows from publishing research evidence. Shared guidance now distinguishes that committed baseline from the maintainer's uncommitted V5 test. The reusable evaluation template again requires fresh selected input paths and explicit review approval rather than the local collection-specific import kit; the preset and all completed notebook outputs were preserved. Verification did not stage, commit or push files.

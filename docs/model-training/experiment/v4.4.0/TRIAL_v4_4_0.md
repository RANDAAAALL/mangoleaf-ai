# V4.4.0 Seven Class experiment

## Status and purpose

**October 9, 2026: training and threshold fitting completed. The user tested V4.4.0 locally, declined it, and requested restoration of the adopted V4.3.0 model. V4.4.0 remains archived experimental evidence; it was not adopted or deployed.** See [completed results and rollback](#completed-results-and-local-rollback-october-9-2026).

**Historical status, October 8, 2026:** Only experimental workflow templates existed. No completed V4.4.0 result was claimed at that point. The dated setup and repair notes below preserve that earlier state.

This experiment starts from the raw seven-class mango collection and ImageNet initialization. It creates new image audits, related-photo groups, approximately stratified 70/15/15 membership, mask proposals and approvals, weights, class weights, temperature, rejection settings, and figures. It does not load a V4.1.1 or V4.3.0 run, split archive, trained checkpoint, mask folder, or evaluation result.

The V4.3.0 training methods remain the methodological reference: the same architecture, preprocessing, five plus ten epoch schedule, and seven augmentation categories. The embedded 62 previously reviewed nonduplicate image identities are source-image review evidence, rather than an inherited split or training artifact. The adopted application continues to use V4.3.0; preparing this experimental workflow does not require a PWA release.

| Notebook                                                                                                 | Purpose                                                                                                                               |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [Training](../../../../notebooks/experiment/v4.4.0/MangoLeaf_AI_Training_v4_4_0.ipynb)                   | Audit raw inputs, review groups and masks, train from ImageNet, calibrate, export, and generate training illustrations.               |
| [Threshold fitting](../../../../notebooks/experiment/v4.4.0/MangoLeaf_AI_Threshold_Fitting_v4_4_0.ipynb) | Verify the new completed training run, split the OOD pool, fit and freeze gates, evaluate, and package an experimental browser model. |

Every notebook uses numbered steps with What, Why, How, and Expected result descriptions. Code and review records use general wording, readable spacing, and explanatory comments. Clean templates have no execution outputs; completed Colab copies belong beside them as separate evidence files.

## Completed results and local rollback: October 9, 2026

### Decision and exact evidence

V4.4.0 was a temporary local test. The user was not satisfied and chose to return to V4.3.0. The application again uses the adopted five-file V4.3.0 bundle in `public/model/`, its `v4.3.0` display label, and its matching model cache. V4.4.0 remains under `experiment/`; no adoption move, production promotion, or new release is implied. The current camera implementation and unrelated application work remain separate from this model decision.

The completed evidence is:

- Training run: `v4-4-0-training-20261009T005929Z-28e79277`.
- Threshold-fitting run: `v4-4-0-thresholds-20261009T024417Z-dc2cf99d`.
- Original downloaded archive: `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v4.4.0/`.
- [Completed training notebook](../../../../notebooks/experiment/v4.4.0/MangoLeaf_AI_Training_v4_4_0_Post_Training.ipynb).
- [Completed threshold-fitting notebook](../../../../notebooks/experiment/v4.4.0/MangoLeaf_AI_Threshold_Fitting_v4_4_0_Results.ipynb).

Both completed notebooks retain their original cells and outputs. The training output records `MyDrive/mangoleaf_experiments/...`; the threshold output records `MyDrive/mangoleaf_experiments (1)/...`. These are preserved execution paths. Both identify the same training run and training-completion hash; repository archive names do not replace those historical paths.

| Identity                 | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Training completion      | `fd2adc7262697fa0064c67475a5160b53affa7dddf57816d4ebc1fb93d86a1a0` |
| Calibrated Keras model   | `ef35b24ac863a60337b74a0ef41b0e9a9f11fa04969dc78d8d09fb0ff8e2e77a` |
| Selected thresholds      | `c0ae3ecef5ab0f289525b5a1eaea6b182778b0c7f503611f0bc31dbb2fae1d03` |
| Evaluation               | `87c77fdeddf54015ac6db9d121c35557016f04ab3b1fb16f5871f40fc818ae59` |
| Frozen evaluation inputs | `4bd66304186e4a6f3bd94706c73835cc42b2fe4378ad6c636c670721efadab97` |

The [copy manifest](artifacts/evidence_copy_manifest.json) records the original source path, run identity, hash, size, and repository location of every copied file, plus both completed-notebook hashes. The [verification summary](artifacts/review/verification_summary.json) contains separate calculations and their input identities; it is not an original Colab receipt.

### Dataset, recipe, and reviewed masks

The completed audit starts with **5,098 mango photos**. Removing exact byte/decoded copies retains **2,649 unique image identities**; **2,449 exact copies** are excluded. The 36 flagged similar-image pairs are handled through related-photo grouping, giving 2,613 groups. The fresh grouped split contains **1,854 training, 398 validation, and 397 test photos**, with no recorded group overlap between subsets. These are study photos, not a separately collected field test.

Training used ImageNet-initialized MobileNetV3-Large, seven classes, RGB 224 × 224 float32 input in the 0–255 range, batch 32, seed 42, five head-training epochs at learning rate 0.001 and ten fine-tuning epochs at 0.00001. The [recorded plan](artifacts/training/plan.json) preserves the seven augmentation categories and exact preprocessing. V4.3.0 supplied the methodological reference, not earlier trained mango weights or split membership.

There are **225 approved scene backgrounds**, **167 eligible training foreground-mask proposals**, and **19 approved training masks**. The approved foregrounds are one anthracnose, five bacterial canker, four healthy leaf, and nine sooty mold photos. No approved training mask belongs to bacterial black spot, healthy fruit, or mango scab. The 30% background-replacement chance applies only to those 19 approved foregrounds; 225 backgrounds does not mean 225 mango photos receive replacement.

Two separate validation masks were approved for display use. Later, all seven illustration-only mask proposals were marked `skip`. Those skips leave background-replacement panels unapplied in the final [augmentation overview](figures/training/augmentation_preview.png). They do not undo training augmentation, change trained weights, or alter validation/test scoring. The [mask decisions](artifacts/training/mask_review.json), [illustration decisions](artifacts/training/illustration_masks/review.csv), and [figure manifest](artifacts/training/figure_manifest.json) retain these distinct roles. The [Grad-CAM figure](figures/training/grad_cam.png) uses the same seven recorded examples; heatmaps do not themselves prove accuracy.

### Training curves and checkpoint

[Training accuracy](figures/training/training_accuracy.png) and [training loss](figures/training/training_loss.png) each contain the original training and validation curves, with the stage boundary after epoch five. All 15 epochs completed.

- Final training accuracy: **97.73%**; loss: **0.08173**.
- Final validation accuracy: **96.73%**; loss: **0.07387**.
- Highest validation accuracy: **96.98%**, at epochs 11 and 12.
- Selected checkpoint: **epoch 15**, because its second-stage validation loss was lowest.

The saved curves show no sustained increase in validation loss across these epochs. Training uses augmentation and class weights while validation uses original held-out images, so the two losses are not identical measurement conditions. This curve review does not establish field generalization. The original [epoch history](artifacts/training/training_history.json) and [checkpoint selection](artifacts/training/stage2_selection.json) supply the exact values.

Temperature **1.0101912885132576** was fitted on validation logits and folded into the classifier weights once. Saved validation negative log-likelihood changes from approximately 0.07386977 to 0.07386431, a small improvement. Neither the browser app nor later threshold fitting should apply this temperature a second time.

### Mango test results and rejection tradeoff

The selected gates are **confidence 0.70 / margin 0 / normalized entropy 0.30**. The 10,201-row margin/entropy search uses validation and OOD tuning only, with at least 95% mango-validation retention. It accepts **380/398 validation photos = 95.48%**. The [threshold-search figure](figures/threshold_fitting/threshold_search.png) preserves the saved tuning result. Reporting inputs remain outside fitting in this run; the underlying photos were reused from the study.

| Mango test measure                           | Completed V4.4.0 result |
| -------------------------------------------- | ----------------------: |
| Raw correct predictions, before rejection    |    **380/397 = 95.72%** |
| Accepted mango photos                        |    **374/397 = 94.21%** |
| Correct accepted diagnoses                   |                 **366** |
| Wrong accepted diagnoses                     |                   **8** |
| Rejected mango photos                        |                  **23** |
| Accuracy among accepted photos only          |    **366/374 = 97.86%** |
| Correct accepted diagnoses across all inputs |    **366/397 = 92.19%** |

Accepted-only accuracy excludes rejected inputs. It must not be described as accuracy over all 397 test photos. Of the 23 rejected mango photos, nine had wrong raw predictions and **14 had correct raw predictions**.

The [raw confusion matrix](figures/threshold_fitting/confusion_matrix.png) has 17 errors: nine actual bacterial black spot photos predicted as mango scab, six actual mango scab photos predicted as black spot, one healthy leaf predicted as anthracnose, and one sooty mold predicted as mango scab. Black spot/scab confusion therefore accounts for **15 of 17 errors**.

Raw per-class test results, before rejection:

| Class                | Precision |  Recall |      F1 | Test photos |
| -------------------- | --------: | ------: | ------: | ----------: |
| Anthracnose          |    98.67% | 100.00% |  99.33% |          74 |
| Bacterial Black Spot |    85.71% |  80.00% |  82.76% |          45 |
| Bacterial Canker     |   100.00% | 100.00% | 100.00% |          75 |
| Healthy Fruit        |   100.00% | 100.00% | 100.00% |          18 |
| Healthy Leaf         |   100.00% |  98.67% |  99.33% |          75 |
| Mango Scab           |    73.68% |  82.35% |  77.78% |          34 |
| Sooty Mold           |   100.00% |  98.68% |  99.34% |          76 |

Precision asks how often a predicted class is correct. Recall asks how many actual class photos are correctly found. F1 combines precision and recall. Healthy fruit's perfect result covers only 18 test photos.

The [rejection-aware matrix](figures/threshold_fitting/confusion_matrix_with_rejection.png) keeps rejected mango photos in their actual-class support. Black spot recall becomes **29/45 = 64.44%**, with precision 100% and F1 78.38%. Mango scab recall becomes **21/34 = 61.76%**, with precision 75% and F1 67.74%. All 23 mango rejections occur in those two classes. A 100% accepted black spot precision does not mean all black spot cases were detected.

Original [raw metrics CSV](artifacts/threshold_fitting/raw_per_class_metrics.csv), [rejection-aware metrics CSV](artifacts/threshold_fitting/rejection_aware_per_class_metrics.csv), and [test prediction CSV](artifacts/threshold_fitting/mango_test_predictions.csv) preserve the exact measurements. The [raw per-class chart](figures/threshold_fitting/per_class_metrics.png) and [rejection-aware chart](figures/threshold_fitting/per_class_metrics_with_rejection.png) partly overlap the bottom sooty-mold score labels with their legends. The original plots are preserved; the CSVs and independently recomputed metrics match.

### Unsupported-photo reporting

OOD means photos outside the seven supported mango classes. Of 200 reviewed photos, 100 are assigned to tuning and 100 to reporting. The selected gates reject **77/100 tuning photos** and **69/100 reporting photos**. Reporting therefore has **31/100 false accepts = 31%**. The confidence-only 0.70 reference falsely accepts **46/100** reporting photos. The selected entropy gate reduces those false accepts while also rejecting some correctly classified mango photos.

The [OOD decisions](artifacts/threshold_fitting/ood_review.csv) contain generic source notes describing device captures and public internet images. All 200 manual `captureGroup` fields are blank. Recorded assignment groups do not overlap between tuning and reporting, but this does not establish independence of real subjects or capture sessions. The empty similarity-review CSV records no flagged pairs under the saved similarity audit, not proof that every photo is unrelated. Source ownership, permission, and per-photo origin remain less specific than an independent field study requires.

### Comparison with V4.3.0

| Saved whole-set result              |           V4.3.0 |           V4.4.0 |
| ----------------------------------- | ---------------: | ---------------: |
| Raw mango test accuracy             | 386/393 = 98.22% | 380/397 = 95.72% |
| Accepted-only accuracy              | 373/376 = 99.20% | 366/374 = 97.86% |
| Correct accepted / all mango inputs | 373/393 = 94.91% | 366/397 = 92.19% |
| Wrong accepted mango predictions    |                3 |                8 |
| Rejected mango photos               |               17 |               23 |
| OOD reporting false accepts         |  29/116 = 25.00% |  31/100 = 31.00% |

These whole-set scores use different membership. V4.4.0 retains all 2,603 V4.3.0 mango identities and adds 46; the split is regenerated. Only **59 mango test photos** occur in both versions. On those shared photos, both models have **58/59 raw correct**. V4.3.0 accepts 56 correct and one wrong, rejecting two; V4.4.0 accepts 57 correct and one wrong, rejecting one.

OOD reporting roles also change. Among the **60 shared reporting photos**, V4.3.0 falsely accepts 18 and V4.4.0 falsely accepts 20. These small reused subsets do not establish general superiority. The [derived comparison](artifacts/review/verification_summary.json) records counts and exact source identities; the [V4.3.0 trial](../../non-experiment/v4.3.0/TRIAL_v4_3_0.md) preserves its adopted-model evidence. The user's rollback decision is recorded separately from statistical claims.

### Curated repository archive and preservation

Only the important completed-run evidence is copied:

```text
docs/model-training/experiment/v4.4.0/
  TRIAL_v4_4_0.md
  artifacts/
    evidence_copy_manifest.json
    training/              recipe, history, decisions, receipts, dependency evidence
    threshold_fitting/     frozen selection, metrics, predictions, OOD reviews
    review/                separate verification and comparison calculations
  figures/
    training/              accuracy, loss, augmentation overview, Grad-CAM
    threshold_fitting/     two matrices, two per-class charts, threshold search
```

The archive copies **57 original artifact files and nine important figures**, totaling **10,181,826 bytes**. It excludes raw photos, dataset ZIPs, model weights/graph/shards, candidate ZIPs, mask images/arrays, review/contact sheets, failed runs, export attempts, repeated per-class augmentation sheets, large inventories, and repeated installation logs. The full originals remain in the downloaded archive. Historical completion receipts and the figure manifest intentionally reference some omitted source files, so this subset is not a standalone retraining package.

Every copied file matches its original hash and byte count. Original completed-run receipt checks match **296 training entries and 41 threshold-fitting entries**. The copy manifest marks whether each selected file is present in a completion receipt. All **6,781 files**, totaling **1,716,614,134 bytes**, in the original downloaded V4.4.0 tree retain the same paths, sizes, and SHA-256 hashes before and after archiving. Both supplied completed notebooks remain byte-identical.

Dependency snapshots are historical run evidence, not installation recommendations. The completed runtime records TensorFlow 2.19.0 and Keras 3.15.1. The [converter audit](artifacts/training/runtime_preflight/converter-audit-summary.json) retains unresolved findings for setuptools 81.0.0 and wheel 0.45.1, with recorded operation-specific decisions: source-distribution build/publish and `wheel.cli.unpack` were absent from conversion. `executionAllowed: true` does not mean those advisories were fixed. The provider-host audit also remains unresolved; package isolation did not patch or sandbox that host. Its full original reports remain outside this curated subset, with their identities in the copied runtime ledger and derived summary.

This archive review verifies saved identities, counts, confusion matrices, per-class metrics, and comparison membership. It does not retrain the model. Complete TensorFlow.js/Keras probability parity, physical-phone reliability, independently collected mango/OOD evaluation, and expert disease-label review remain unestablished by these saved results. The local test and rollback do not claim production deployment or field accuracy.

## Google Drive inputs

The confirmed default folders are directly under `My Drive`:

```text
My Drive/
  final_mangoleafai_dataset_public_and_bpi/
    anthracnose/
    bacterial_black_spot/
    bacterial_canker/
    healthy_fruit/
    healthy_leaf/
    mango_scab/
    sooty_mold/
  mangoleaf_background_photos_v4_4_0/
  mango_ood_test_v4_4_0/
```

The Colab mount names these paths `/content/drive/MyDrive/...`. The training configuration also accepts a raw dataset ZIP. Folder selection and file inventories are checked at execution; a Drive upload counter is not an image audit.

| Input                  | Local preparation evidence                                                                                                   | Execution requirement                                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw mango collection   | The local ZIP contains 5,098 image files across seven classes, with 2,649 distinct byte contents and 2,449 identical copies. | Fresh byte, decoded-image, and perceptual-similarity review. Preserve aliases in provenance and keep related captures in one subset.                                                                        |
| Background photos      | The local folder contains 225 readable photos, including the earlier scene pool and additions.                               | Review scene suitability and related photos. People, animals, text, and distracting foregrounds need explicit decisions; no collection-wide approval is implied.                                            |
| Unsupported/OOD photos | The local folder contains 200 distinct byte contents matching the previously used 168-photo pool and 32-photo addition.      | Fresh scope, duplicate, related-capture, and cross-collection review before a seeded target of 100 tuning and 100 reporting photos.                                                                         |
| Source notes           | No new source attribution is inferred from a filename or folder title.                                                       | Manually enter known origins and permission notes in the training `SOURCE_NOTES` dictionary and the OOD review CSV. Record related capture groups at their review gates. Unknown details remain unverified. |

The local checks do not establish that every Drive file is identical. Runtime inventories and hashes identify the actual inputs used by a completed run.

Source information can be typed manually in the notebook's `SOURCE_NOTES` setting. A separate `source_notes.csv` is optional preparation material, rather than a required inherited file. Image origins and label verification are separate facts; a verified diagnosis does not by itself establish the photograph's author or permission.

### Reviewed nonduplicate images

The ignored preparation note `docs/local-ignored-files/mango_dataset_v3_notes_non_duplicate.md` currently lists **62 distinct reviewed image identities**, including one `DSC_0205.JPG`. All 62 matched the raw local ZIP and the existing reviewed filename/class/hash records. The new notebook embeds these identities, so that local ignored note and historical notebooks are not required in Colab.

A close perceptual hash is a review flag, not proof of duplication. A genuinely distinct reviewed photo must not be silently deleted because it resembles another specimen. Related photos can remain distinct while sharing a group that prevents train/validation/test leakage. Byte-identical aliases remain listed even when only one content representative is used for training.

### OOD tuning and reporting

**Tuning** chooses rejection settings using mango validation predictions and unsupported photos. **Reporting** measures the already frozen settings using mango test predictions and a separate unsupported group. OOD photos never train the classifier weights.

The target is 100 tuning and 100 reporting photos after review. Related captures stay together. If the audited groups cannot make an exact 100/100 partition, the workflow stops instead of splitting a group or silently changing the target. Corrected grouping or an explicitly documented revised experiment is needed before continuing.

All 200 OOD photos have been used in earlier experiments. A new assignment creates disjoint groups for this run, but it does not erase their earlier use. Results must be described as **reused exploratory evidence**, not a fresh independent test. Fresh mango split membership also limits direct numerical comparisons with the historical V4.3.0 test scores.

## Runtime and export checks

**Runtime repair, October 8, 2026:** The original setup stopped on the complete Colab host audit. The supplied report contains 14 affected packages, 75 unique package/advisory pairs, and seven skipped provider packages. A successful `pip check` does not clear those findings. Auditing every provider package as a training gate prevented the experiment from reaching its separately prepared converter.

Both notebooks now mount Drive through Colab and prepare actual isolated execution environments. They install no packages into Colab's kernel and do not change its imported TensorFlow, NumPy, Pillow, IPython, or Jedi. No manual environment activation is required.

**Setup bootstrap repair, October 8, 2026:** The next Colab attempt stopped in `tools-environment.log` because the new environment's `python3 -m ensurepip --upgrade --default-pip` command failed. This happened before package installation or audits. Both templates now create the setup environment with `venv --without-pip`, then use the provider's `pip --python <tools-python> install` to install the pinned setup packages explicitly into that empty environment. [Pip documents this pip-less installation route](https://pip.pypa.io/en/stable/topics/python-option/); provider pip 22.3 or newer is required. Provider packages remain unchanged. Setup still preserves full diagnostics and stops on installation or audit failures; this repair does not clear any dependency finding.

| Process                    | Purpose                                                                                       | Check behavior                                                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colab host                 | Mount Drive and forward cell output.                                                          | Preserve its package inventory, dependency conflicts, advisories, skipped packages, and audit collection failures as a separate provider report. Unresolved findings remain explicit; they do not approve or block the separate scientific package set.  |
| Isolated setup tools       | Resolve packages and scan the actual installed environments.                                  | Dependency conflicts, advisories, skipped packages, or incomplete audits stop setup.                                                                                                                                                                     |
| Isolated scientific kernel | Execute image decoding, model loading, training, calibration, threshold fitting, and figures. | Use managed Python 3.11 without host site packages. Audit all resolved direct and indirect packages before execution. Failures stop setup.                                                                                                               |
| Isolated converter         | Convert the training model into TensorFlow.js assets.                                         | Use TensorFlow.js 4.22.0 and TensorFlow 2.19.0, matching TensorFlow Decision Forests 1.12.0. Its own full audit, operation review, and compatibility checks must complete. Threshold fitting reads the completed export instead of repeating conversion. |

The first two code cells run in Colab. Every later code cell begins with `%%mangoleaf`, which sends the visible code to one persistent isolated Python process. Variables remain available between steps, and logs, learning-rate output, figures, and error tracebacks return to the same notebook. Review errors stop the cell while preserving earlier variables. A kernel interruption or lost Colab runtime requires Step 1 again and the appropriate saved-run recovery controls; it does not authorize repeating completed training in an existing run folder.

Scientific dependencies include TensorFlow 2.19.0 with its matching CUDA packages, Keras 3.15.1, NumPy 2.1.3, Pillow 12.3.0, and the notebook's image, plotting, and evaluation tools. The training preflight executes in the isolated interpreter, checks a real GPU operation, and converts a full untrained MobileNetV3-Large architecture before the 15 training epochs. Full freezes, audit summaries, logs, probe outputs, and hashes are preserved under a unique `runtime_preflight/` attempt. Private local kernel connection files and full process environments are not copied into Drive evidence.

Package isolation shares the Colab machine, operating system, GPU driver, and mounted Drive. It does not patch the host advisories or create a separate security sandbox. No advisory is ignored, and no historical package freeze, package source edit, NumPy monkey patch, fake module, or dependency-resolution override is used.

**Converter compatibility review:** Released TensorFlow Hub 0.16.1 imports the real `pkg_resources` API, which setuptools removed in version 82. The converter therefore pins setuptools 81.0.0. Its [GHSA-h35f-9h28-mq5c / CVE-2026-59890 advisory](https://github.com/advisories/GHSA-h35f-9h28-mq5c) concerns building and publishing an sdist with Unicode filename exclusions. This converter installs binary wheels and converts SavedModels; it does not build or publish Python source distributions. The full finding and nonzero audit exit code remain in evidence, with status `unresolved` and a separate operation review. Only the documented exact package/version/advisory combinations can continue in the converter. Unreviewed advisories, unfamiliar advisory aliases, missing reports, skipped packages, dependency conflicts, and audit errors block setup. Training and setup tools use setuptools 84.0.0 and permit no such operation exceptions. The converter is not described as advisory-free.

**Converter wheel review:** The converter retains wheel 0.45.1 from its initial packaging plan. The October 8 metadata recheck corrected the earlier explanation: [TFDF 1.12.0 metadata](https://pypi.org/pypi/tensorflow-decision-forests/1.12.0/json) lists `wheel` without a version bound; the exact version is a workflow pin. Its [GHSA-8rrh-rw8j-w5fx / CVE-2026-24049](https://github.com/advisories/GHSA-8rrh-rw8j-w5fx) finding affects `wheel.cli.unpack` and its vendored setuptools equivalent. Installation uses uv's own installer; the notebook does not call those unpack APIs. This finding also remains `unresolved` with a specific operation review. It is not a security patch, and the converter must not be reused for those affected packaging operations. The separate training plan resolves a patched wheel version.

The repaired bootstrap still requires actual Colab execution. Local tests do not establish that the complete Linux/GPU package set is compatible or advisory-free. Each session must record its own installation, audit, GPU, and conversion outcomes. See the [dependency security record](../../../security/DEPENDENCY_SECURITY.md#v440-experimental-runtime-october-8-2026).

### Converter Protobuf repair, October 8, 2026

The following Colab attempt passed tools/scientific audits, SavedModel loading, and output comparison, then failed while importing Yggdrasil during TensorFlow.js conversion. TFDF's broad requirement `ydf>=0.11.0` selected YDF 0.16.0. Its metadata permits Protobuf 5, but its wheel contains generated code from Protobuf 6.31.1. TensorFlow 2.19.0 requires Protobuf below 6, so the resolved runtime 5.29.6 rejected that code. Resolver success and `pip check` do not detect this mismatch. [Protobuf's version guarantee](https://protobuf.dev/support/cross-version-runtime-guarantee/) explains why newer generated code cannot use an older runtime.

The converter now pins `ydf==0.11.0` and `protobuf==5.29.6`. The verified YDF 0.11.0 wheel uses generated code from 5.29.1, matching the runtime range and TFDF's published requirement. Only YDF changed in the revised 82-package binary-only Linux resolution. Nested subprocess failures forward the specific child diagnostic log while preserving the outer log. Runtime preparation remains part of the current notebook's setup; all audit and conversion gates remain active.

The [local compatibility record](artifacts/converter-protobuf-review.json) preserves official wheel hashes, metadata sources, the reproduced failure for YDF 0.16.0, and successful imports of all 40 generated modules plus message serialization for 0.11.0 against Protobuf 5.29.6. These are actual generated Python imports executed locally on Windows. Native Linux YDF loading, complete TensorFlow.js conversion, and Colab GPU execution still require the new session's outcomes.

**Repair verification:** Both notebook templates passed the focused verifier, including safe child-log forwarding and existing runtime, grouping, and recovery contracts. Formatting, TypeScript, lint, and production static build passed. All 48 historical notebook/model hashes matched, and 236 local documentation targets resolved. No 30-minute R03 session ran during this repair.

### Starting the repaired Colab copy

**Kernel startup repair, October 8, 2026:** The latest supplied Colab output reached `Isolated runtime prepared` after the GPU and architecture export/conversion probes. The next failure occurred while starting the persistent scientific kernel. A direct startup diagnostic identified an inherited setting requesting `google.colab._kernel.Kernel`, which is unavailable in the separate scientific package set. These supplied observations concern setup probes; they do not establish completed training, browser parity, or model accuracy.

Python's `-I` flag isolates imports, but does not stop IPython from reading provider configuration. [IPython's configuration guide](https://ipython.readthedocs.io/en/stable/config/intro.html) describes profile and system configuration discovery. Both templates now launch the real standard IPython kernel with a fresh private profile and configuration search restricted to that profile. Automatic provider startup scripts are excluded, including system startup directories. Colab's packages, configuration files, dependency findings, and already prepared environments remain unchanged.

Kernel startup output is saved in `/content/mangoleaf-bridge-<id>/kernel-startup.log`. A failed startup identifies that local log and stops the process and communication channels. The authenticated loopback connection file remains local and is never copied to Drive evidence.

**Reuse a completed preparation in the same Colab session:** When `RUNTIME_REVIEW` already exists and preparation printed `Isolated runtime prepared`, replace the first Step 1 helper-definition cell with the current template's helper cell and execute it. Run the following in a new ordinary Colab code cell, without `%%mangoleaf`:

```python
start_notebook_kernel(RUNTIME_REVIEW)
```

After `Scientific cells use: .../training/bin/python` appears, continue with the third Step 1 cell, which contains the scientific imports. This retries only kernel startup. If the session was reset or preparation never completed, use the complete startup procedure below.

**Local regression evidence:** The provider-profile fixture reproduced the exact missing `google.colab._kernel.Kernel` error before repair. Both repaired templates passed real local CPU kernel checks with provider profile and system configuration/startup fixtures present. Variables, figures, execution failures, cleanup, unchanged provider settings, and original startup-error logs were verified. The repaired launcher still requires its Colab retry outcome.

Formatting, TypeScript, lint, and the production static build passed after the launcher repair. All 48 historical notebook/model hashes matched and 236 local documentation targets resolved. Loading the retry helper through IPython's `%run -i` retained the existing `RUNTIME_REVIEW` object. No 30-minute R03 session ran during this repair.

1. Preserve earlier notebook copies and failed runtime reports as diagnostic evidence.
2. Upload the current repository training template as a new Colab copy. The Drive datasets and existing experiment outputs remain inputs and evidence; they do not need another upload.
3. Start a fresh Colab GPU runtime. Run all three Step 1 cells in order: helper definitions, environment setup, then scientific imports. Setup can take several minutes while the dedicated packages download.
4. Confirm the printed scientific interpreter is under `/content/mangoleaf-v440-runtime/.../training/bin/python`. Continue with Step 2 and the numbered review gates.
5. Use the matching repaired threshold template after a completed training run. Set its completed training folder name in the third Step 1 cell.

Extra `%pip install` fixes in the Colab host are not part of the repaired setup. An isolated setup failure names its saved log or audit report; that specific result determines the next repair.

**Colab startup follow-up, October 8, 2026:** The supplied 07:33 screenshot shows successful startup through the retry helper and a subsequent full preparation, ending with `Scientific cells use: .../training/bin/python`. The later screenshot reaches the Step 4 inventory using the scientific process. This confirms the reported startup repair in that session; completed training, evaluation, and browser parity remain separate evidence requirements.

### Step 4 WebP decoding repair, October 8, 2026

The next supplied traceback stops inside the background inventory, naming `46erl_ld.jpg`. The local 225-photo background copy contains three readable WebP images with `.jpg` filenames:

- `46erl_ld.jpg`
- `dkhkkdfkgkdfg.jpg`
- `thedoighouse-earthship-forest-edge-rv-site-vancouver-island.jpg`

The first file has a `RIFF`/`WEBP` signature, 600 × 400 RGB pixels, 51,032 bytes, and SHA-256 `e33f8dec6fbf3d9a4426c81702486bafe397fc1aa5e2d302882962442334fbc7`. Both local source copies have those exact bytes. The complete local pool contains 220 JPEG, three WebP, and two JPEG-based MPO files. These local checks identify the decoder mismatch; they do not prove the Drive collection is byte-identical.

The original loader chose Pillow only for the `.webp` extension, so misnamed WebP content reached `tf.io.decode_image`. [TensorFlow documents that decoder's supported formats](https://www.tensorflow.org/api_docs/python/tf/io/decode_image) as JPEG, PNG, BMP, and GIF. Both new templates now inspect the first 12 bytes for the WebP signature and use the existing Pillow EXIF/RGB path for WebP content. Other images retain the native TensorFlow decoder, RGB channels, 224 × 224 bilinear resizing without antialiasing, and float32 0–255 values. Input files, names, source hashes, and counts are not rewritten. Corrupt or missing files still stop the inventory.

For an existing session stopped at Step 4, replace only `has_webp_content` and `load_pixels` in the scientific process through a new `%%mangoleaf` cell, then rerun Step 4. The current template's Step 3 contains those exact helpers. For the confirmed raw-folder input, this retry preserves the current `RUN_DIR`; rerunning Step 3 would create another run. A ZIP-input retry must instead use a new run because extraction directories are deliberately not overwritten.

Regression coverage decodes real lossless WebP fixtures with Pillow and checks backend selection through a small TensorFlow adapter. Misnamed WebP stays on Pillow; genuine JPEG/PNG/BMP/GIF stays on the native route, including misleading `.webp` names. Source bytes, existing resize arguments, dtype/range, and corrupt/missing-image failures are checked. This adapter does not run TensorFlow's native decoder or interpolation; the current Colab Step 4 retry remains the actual TensorFlow execution check.

**Repair verification:** Both templates passed the focused notebook verifier, including the existing kernel, audit, grouping, and export-recovery cases. Formatting, TypeScript, lint, and the production static build passed. All 48 historical notebook/model identities matched and 237 local documentation targets resolved. No 30-minute R03 session ran. V4.4.0 remains experimental; these checks do not establish completed training or model accuracy.

## Training recipe

| Setting           | Fresh-run behavior                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Class order       | Anthracnose, Bacterial Black Spot, Bacterial Canker, Healthy Fruit, Healthy Leaf, Mango Scab, Sooty Mold. Export keys use lowercase underscores.                |
| Backbone          | MobileNetV3-Large with ImageNet initialization and a new seven-output head. No previous MangoLeaf weights are loaded.                                           |
| Input             | RGB, bilinear resize to 224 × 224 without antialiasing, float32 values in 0–255. MobileNet performs its internal preprocessing.                                 |
| Split             | Seed 42, approximately stratified 70/15/15, whole related-photo groups, fresh membership. Named illustration groups are reserved in validation before freezing. |
| Batch             | 32.                                                                                                                                                             |
| Head stage        | Five epochs, Adam learning rate 0.001.                                                                                                                          |
| Fine-tuning stage | Ten epochs, Adam learning rate 0.00001; selected backbone layers are trainable and Batch Normalization stays frozen.                                            |
| Checkpoint        | Lowest validation loss within each stage; the best second-stage checkpoint supplies the final model.                                                            |
| Learning-rate log | Actual optimizer value appears in epoch progress and the saved training history.                                                                                |
| Class weights     | Recomputed from the fresh training subset.                                                                                                                      |
| Calibration       | Temperature fitted on fresh mango validation logits only and folded into the linear classifier once.                                                            |
| Browser export    | Unquantized float32 TensorFlow.js graph and shards, with hashes and preprocessing/class metadata.                                                               |

### Seven augmentation categories

1. Horizontal and vertical flips.
2. Rotation within ±30 degrees.
3. Random zoom with factor 0.2.
4. Centered shear with factor 0.2.
5. Global brightness with factor 0.2 on the 0–255 input range.
6. Background replacement with an independent 30% chance, restricted to approved training masks and approved scenes.
7. Localized highlight or shadow with an independent 30% chance, amplitude 18–40 and Gaussian radius 0.18–0.35 of the image side.

These effects apply only during training. Validation and test scoring use the original pixels and standard preprocessing. Blur, noise, JPEG artifacts, cutout, and hue shifts are outside this experiment.

White-background eligibility and generated specimen masks require fresh review. An unsuitable proposal keeps the original image during training. The validation illustration masks have their own review; approving one never makes that validation photo eligible for training.

## Threshold selection and frozen evaluation

Confidence stays at **0.70** for this experiment. Margin and normalized entropy are searched from 0.00 to 1.00 in increments of 0.01. At least 95% of all mango validation photos must remain accepted, including both correctly and incorrectly classified photos. The search ranks feasible settings by OOD tuning rejection, then mango retention, then the documented permissive tie-break rules. An infeasible search records that outcome without creating a fitted candidate.

The model, inputs, split, search recipe, and selected gates are hashed and frozen before mango test or OOD reporting predictions. Later cells verify those locks. A reporting run cannot silently retune thresholds or reuse results against changed files.

Reporting distinguishes raw accuracy, correct accepted diagnoses, wrong accepted diagnoses, mango rejections, accepted-only accuracy, full-set correctness, and OOD false accepts. A rejected mango remains in its true-class support and lowers rejection-aware recall. The confidence-only reference and selected gates use the same frozen evaluation inputs.

## Figures and shared example photos

New titles start with **V4.4.0 Seven Class**. The historical recipe label “Combined” is not used in these new figure titles.

| Class                | Shared augmentation and Grad-CAM photo                          |
| -------------------- | --------------------------------------------------------------- |
| Anthracnose          | `verified mango leaf disease 21.jpg`                            |
| Sooty Mold           | `DSC_1029.JPG`                                                  |
| Healthy Leaf         | `HealthyLeaf_2.jpg`                                             |
| Mango Scab           | `DSC_0281.JPG`                                                  |
| Healthy Fruit        | `DSC_1021.JPG`                                                  |
| Bacterial Canker     | One seeded random validation photo, selected once and recorded. |
| Bacterial Black Spot | One seeded random validation photo, selected once and recorded. |

The five named image groups enter validation before the split lock. The other two photos are not selected based on prediction correctness. Source hashes and selected names identify all seven examples.

Training creates separate `training_loss.png` and `training_accuracy.png`, an augmentation overview and seven readable class sheets, and `grad_cam.png`. Each curve shows both training and validation, with the stage boundary marked. Augmentation sheets show individual techniques, plus background with localized light. They are newly generated illustrations, not exact training-tensor records. Unapproved illustration masks produce clearly labeled unapplied background panels.

Grad-CAM follows the actual backbone feature tensor through the trained pooling, dropout, and linear logits layer. It targets the true class and displays the predicted class and calibrated confidence separately. Missing gradients stop the step; an all-zero positive map is labeled honestly. A heatmap does not itself establish classification accuracy.

Threshold fitting creates raw and rejection-aware confusion matrices, per-class charts with actual measured values and support, and the validation/OOD tuning search plot. No figure copies a V4.3.0 measurement.

## Run order and output folders

1. Execute the training notebook in order, beginning with Drive paths and runtime checks.
2. Complete the generated source, similarity, related-group, scene, eligibility, and mask reviews at their stop points.
3. Freeze the new split, train five plus ten epochs, calibrate, export, and complete illustration review.
4. Preserve the completed training notebook and its unique run folder.
5. Set the threshold notebook's training-run path to that completed V4.4.0 folder; repeat its fresh-session runtime checks.
6. Review OOD scope and groups, freeze the 100/100 assignment, fit gates, and freeze selection.
7. Run reporting and packaging once, then preserve the completed fitting notebook and exported evidence.

```text
My Drive/mangoleaf_experiments/v4.4.0/
  runtime_preflight/                  # Preserved dependency/export audit attempts
  training/<unique-run-id>/
    input_manifest.json
    dataset_split.zip
    runtime.json
    model_calibrated.keras
    temperature.json
    class_names.json
    tfjs_model/
    illustration_masks/
    figures/
    training_complete.json
  threshold_fitting/<unique-run-id>/
    evaluation_inputs.json
    selection_lock.json
    threshold_search.csv
    evaluation_started.json
    evaluation.json
    figures/
    candidate_model/
    threshold_fitting_complete.json
```

The notebooks preserve more review records and hashes than this abbreviated layout shows. Unique run folders prevent overwriting completed evidence. A runtime disconnection does not authorize restarting completed training or retuning a reported selection; verified restoration follows the notebook's explicit controls.

## Repository verification and remaining execution

Run the focused CPU verifier from the repository root:

```powershell
.tools/notebook-v4-env/Scripts/python.exe tools/verify-v4-4-notebooks.py
```

The local verifier needs NumPy, Pillow, nbformat, IPython, ipykernel, jupyter-client, and Matplotlib. A separate development environment can supply them. This CPU test environment is not the Colab training environment or the converter dependency list, and its packages are not certified by the fixture results.

With another reviewed Python environment, the portable command is `python tools/verify-v4-4-notebooks.py`.

The verifier checks notebook structure and syntax, representative data/grouping and rejection rules, and immutable evidence boundaries without mounting Drive or training a model. The repository's TypeScript, lint, and static build checks remain separate application gates. Local structural and synthetic checks do not establish Colab compatibility, trained-model accuracy, TensorFlow.js prediction parity, physical-device behavior, or deployment.

The runtime regression cases also start a real local Python kernel and check retained variables, ignored host import paths, streamed output, rendered figures, error propagation, and shutdown. Audit fixtures distinguish unresolved provider findings from blocking worker findings, including missing and malformed reports. On Windows, Jupyter must be able to restrict its temporary connection file to the current account; a filesystem sandbox can require permission for this local check.

The bootstrap regression cases reproduce unavailable `ensurepip` in a real local environment-creation process. Both templates then install a tiny local fixture wheel into an environment that still has no pip, without downloads. The checks verify target isolation, unchanged host package versions and import paths, and preserved diagnostics when installation fails. This tests the repaired bootstrap mechanism, not the complete Colab package installation.

**Local verification, October 8, 2026:** The focused verifier passed 20 ordered training steps and 13 fitting steps, with clean outputs and valid notebook structure. Synthetic cases passed for whole-group mango/OOD assignment, reserved validation examples, probability and gate boundaries, feasible/infeasible selection, rejected-photo denominators, artifact tampering, audit failures, illustration masks, localized light, 62 reviewed identities, and export-only state restoration. Formatting, TypeScript, lint, and the production static build passed. Preservation checks matched all 48 existing notebook/model files, and 231 local documentation targets resolved. No Colab setup, model training, actual inference, or 30-minute R03 session ran during these local checks.

**Runtime repair verification, October 8, 2026:** The revised verifier passed all earlier contracts plus real local kernel state, ignored host import paths, stdout, Matplotlib figure output, review-error propagation, and shutdown. IPython source extraction produced a valid standalone export probe. Missing/malformed audits, wrong package versions, unfamiliar advisory identities, skipped packages, and audit errors stopped; the exact reviewed converter findings remained visible with `unresolved` status. Both binary-only Linux dependency plans resolved, and 134 distinct package/version metadata records were reviewed. Formatting, TypeScript, lint, and static build passed; all 48 historical notebook/model hashes matched and 232 local documentation targets resolved. These checks did not mount Colab Drive, execute the Linux GPU stack, train a model, or run R03.

The October 9 completed evidence above supplies Colab training and frozen evaluation. Browser prediction parity and physical-device evidence remain separate requirements for any future adoption proposal; the current decision keeps V4.3.0 active. Physical-device evaluation can be recorded through the existing [testing guide](../../../testing/TESTING.md) and [physical reliability checklist](../../../testing/PHYSICAL_RELIABILITY_CHECKLIST.md) when a model enters that scope.

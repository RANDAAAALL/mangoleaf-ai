# V5.1.0 fresh training experiment

## Repository adoption (November 3, 2026)

The maintainer selected **V5.1.0** for the next release, replacing V4.5.0 as the repository's adopted model. App **0.13.0** / APK **0.1.9/code 10** remain release candidates. Adoption keeps the exact graph/shards, seven-class order, internal preprocessing, folded temperature and confidence >=0.70-only rule. Margin and entropy remain disabled. Only runtime labels/configuration metadata and cache identity change; no retraining or scientific threshold search was performed.

The [adoption receipt](artifacts/adoption_20261103.json) separately maps old/new repository locations and before/after runtime hashes. Original artifacts, notebook cells, figures, candidate IDs and Drive paths stay unchanged. Historical `experiment/v5.1.0` repository paths in immutable ledgers resolve through that mapping. Recorded results remain **396/408 raw correct**, **390/400 accepted correct**, **8 mango rejections** and **193/995 unsupported false acceptances**. These reused collections do not establish field accuracy or perfect unsupported-image rejection. Numerical Keras/browser parity, exact Production/CI and physical-device acceptance remain pending; repository adoption is not publication.

For rollback, restore the entire reviewed V4.5.0 runtime/configuration/constants/cache from published tag `v0.12.0` or the preserved baseline kit into a new candidate, retaining all History/photos and research originals. The earlier local-Debug rollback instructions below describe the pre-adoption experiment and do not authorize silently reverting an adopted release.

The November 3 inventory also includes the original [completed training notebook](../../../../notebooks/non-experiment/v5.1.0/MangoLeaf_AI_Training_v5_1_0_Post_Training.ipynb) and [completed evaluation notebook](../../../../notebooks/non-experiment/v5.1.0/MangoLeaf_AI_Evaluate_v5_1_0_Results.ipynb). They identify the same recorded training/evaluation run IDs. Training retains one earlier Step 4 perceptual-hash RuntimeError plus subsequent fifteen-epoch outputs; evaluation has nine executed code cells and no error outputs. These originals were not cleaned or rerun. The separate completion/evaluation receipts remain authoritative; the initial missing-notebook statement below describes the earlier inspection.

## Historical November 1 status: training and recorded evaluation complete; adoption pending

On November 1, 2026, the completed fifteen-epoch V5.1.0 training/export run was preserved and a temporary local Debug APK model test was authorized. **V5.1.0 remains experimental. V4.5.0 remains the adopted baseline; this does not adopt or deploy V5.1.0.**

The initial archive contained training outputs only. Later on November 1 the maintainer supplied the separate completed evaluation run `v5-1-0-evaluation-20261101T010417Z-d8dc996b`. Its [evaluation receipt](artifacts/evaluation/evaluation_complete.json) and measured results are now preserved below. The original [training receipt](artifacts/training/training_complete.json) still correctly records `testPredictionsRun: false`: that immutable receipt predates the separate test pass. Numerical browser parity, physical-phone evaluation and adoption remain unconfirmed; a successful Debug build or a few manual scans cannot establish those outcomes.

| Identity                             | Recorded value                                                     |
| ------------------------------------ | ------------------------------------------------------------------ |
| Training run                         | `v5-1-0-training-20261031T185635Z-46c45fe8`                        |
| Completed training/export            | `2026-10-31T23:19:16.082569+00:00` (November 1 in the Philippines) |
| Experiment / candidate identity      | `v5.1.0` / `model-v5.1.0-candidate`                                |
| Frozen configuration SHA-256         | `1b474cc6eb3250ae47873d7d84489e0f3307fef8d8cb61ecf0c00f1830fde397` |
| Training receipt SHA-256             | `a76510fc9cef900c218346dfd4b725603f4a1f2de0ee786eb20142cac18e11ce` |
| Input manifest SHA-256               | `f602200d75b2332c56ab38eb95e7e45f40e28af2ec6733b1630bf690e48618a2` |
| Selected checkpoint                  | Stage 2, overall epoch 13; lowest clean mango validation loss      |
| Calibrated Keras SHA-256             | `4135b93672716e3ed148ae63313da1feec1dbc10aa968d3e6c5d43155c487df3` |
| Original TensorFlow.js graph SHA-256 | `f4da51e246767a3f1e310d53c2e147bc5ab6a22842ec9baf3a21dbb0fa8ea4b2` |

The full local source is `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v5.1.0/training/v5-1-0-training-20261031T185635Z-46c45fe8/`. Its five downloaded ZIP parts were merged into that single run, preserving the relative paths. All 6,345 files were checked by SHA-256 before and after the move; all 6,327 sealed artifacts matched the completion receipt. Only the emptied extraction wrapper folders were removed. This organization did not retrain or change any image/model/receipt bytes.

## How this differs from V5.0.0

V5.0.0 inherited an existing MangoLeaf checkpoint and performed five additional fine-tuning epochs. V5.1.0 instead starts a **new ImageNet-initialized MobileNetV3-Large** backbone and new seven-class head. It does not restore learned V4.5.0 or V5.0.0 weights, optimizer state, temperature, predictions, or heatmaps.

V5.1.0 reuses the V4.5.0 five-plus-ten-epoch training recipe, augmentation settings, and seven original validation illustration identities. It reuses V5.0.0's recorded image selections to identify 2,511 approved OE photos, the original mango split, and the 995 retained unsupported reporting photos. Reusing identities and review records is distinct from inheriting trained weights. Those collections have prior development/evaluation use and are not fresh independent field evidence.

The [clean training notebook](../../../../notebooks/non-experiment/v5.1.0/MangoLeaf_AI_Training_v5_1_0.ipynb), [clean evaluation notebook](../../../../notebooks/non-experiment/v5.1.0/MangoLeaf_AI_Evaluate_v5_1_0.ipynb), and three [reference inputs](../../../../notebooks/non-experiment/v5.1.0/reference-inputs/) were initially kept in the experiment group. At the initial inspection, no executed V5.1.0 notebook with its original cell outputs was supplied for archival; the run's receipts, epoch records, and actual figures provide the completed evidence available here. Do not relabel a clean template as an executed result notebook.

## Dataset membership and split

The full mango collection contains **2,720 labeled images**: the preserved original 2,649 plus 71 additions from `new_dataset`. Historical train/validation/test membership stays unchanged. Related new groups target 70/15/15 while respecting their relationship to historical groups; individual images are not manually assigned to improve test performance. The actual split is exactly 1,904 / 408 / 408 in this run.

| Class                |     Train | Validation |    Test |     Total |
| -------------------- | --------: | ---------: | ------: | --------: |
| Anthracnose          |       346 |         74 |      74 |       494 |
| Bacterial Black Spot |       210 |         45 |      45 |       300 |
| Bacterial Canker     |       350 |         75 |      75 |       500 |
| Healthy Fruit        |       115 |         24 |      24 |       163 |
| Healthy Leaf         |       361 |         78 |      78 |       517 |
| Mango Scab           |       167 |         36 |      36 |       239 |
| Sooty Mold           |       355 |         76 |      76 |       507 |
| **Total**            | **1,904** |    **408** | **408** | **2,720** |

The 71 additions contain 45 Healthy Fruit, 15 Healthy Leaf, nine Mango Scab, one Bacterial Black Spot, and one Sooty Mold photo; no Anthracnose or Bacterial Canker photo was added. They contribute **50 training, 10 validation, and 11 test** images. The 408-photo test set therefore contains the original 397 and 11 additions. Keep those two groups separately identifiable in later reporting.

The exact membership, labels, file/pixel hashes, groups, and source-relative names are in [input_manifest.json](artifacts/training/input_manifest.json). The [independent review summary](artifacts/review/verification_summary.json) confirms retained historical membership, unique mango byte/pixel identities, and no exact byte/pixel overlap between mango, approved OE, and reporting OOD inputs. These checks do not prove that every capture relationship was discovered or independently verify labels, mango cultivar, geography, or disease diagnosis.

### OE and unsupported-image collections

- **Training OE: 2,511 images**, exactly V5.0.0's recorded selection: 2,011 approved `mangoleafai_oe_images` photos plus 500 transferred `mango_ood_test_v4_4_0` photos. Do not combine every raw source file or subtract the historical reserved 300 again. The full raw OE folder and the approved selection have different counts.
- **Reporting OOD: 995 images**, exactly the retained V5.0.0 reporting list. They remain separate from mango/OE training inputs. Five previously excluded candidates remain excluded. These 995 have prior evaluation use; they support a reused-collection comparison, not a fresh independent test claim.
- OE is not an eighth class. OE images do not enter mango class counts, class weights, mango accuracy, validation checkpoint selection, or temperature fitting.
- [oe_exposure.json](artifacts/training/oe_exposure.json) records all 2,511 unique approved photos exposed, **28,800 successful OE examples across all updates**, and **24,960 examples in the selected checkpoint's training lineage**. Those are exposure counts with repeats, not additional unique photos. Discarded updates remain in full-run totals without being counted as part of the selected lineage.

## Training procedure and actual selection

The [frozen plan](artifacts/training/plan.json) records the procedure before test inference:

1. Decode RGB, resize bilinearly to 224 by 224 with antialias disabled, and cast to float32 in the 0–255 range. MobileNetV3 performs its internal rescaling. Rectangular source images are resized to a square; this pipeline does not add aspect-ratio padding. Original photos remain unchanged.
2. Use MobileNetV3-Large ImageNet features, global average pooling, 0.2 dropout, and a new seven-logit classifier. Dropout applies during training and is disabled for validation/inference.
3. Train the head for five epochs at learning rate 0.001 with the backbone frozen. Restore its lowest-clean-validation-loss checkpoint before fine-tuning.
4. Fine-tune for ten epochs at learning rate 0.00001 with BatchNormalization layers frozen. Batch size is 32. No early-stopping callback shortens the planned fifteen epochs.
5. Optimize mean class-weighted mango sparse categorical cross-entropy plus 0.5 times mean uniform-target OE cross-entropy. Mango class weights come from training labels only. One independently shuffled OE batch accompanies each mango batch, cycling as needed. The 0.5 OE weight is a research starting value, not a demonstrated optimum.
6. Use horizontal/vertical flips, rotation up to 30 degrees, zoom 0.2, shear 0.2, brightness 0.2, and contrast 0.1 on training images. Validation and reporting images are not augmented.

All fifteen [epoch records](artifacts/training/training_history.json) are present. Stage 1 selected epoch 5 (`val_loss = 0.15745627880096436`). Stage 2 selected **overall epoch 13** (`val_loss = 0.07510613650083542`), rather than the final epoch 15. At epoch 13, mango training accuracy was approximately **97.32%** and validation accuracy **97.30%**. These describe training/validation inputs before confidence rejection; **neither is final test accuracy**. Validation was used for model selection and calibration.

## Calibration and fixed confidence rule

The selected model's newly fitted temperature is **0.6105417906980811**, using 408 clean mango validation photos only. Validation negative log likelihood changed from **0.07510613069845565** to **0.06545311077748221**. Temperature was folded into the classifier logits exactly once; no inference-time second fold is required. See [temperature.json](artifacts/training/temperature.json) and [calibration_complete.json](artifacts/training/calibration_complete.json).

The reporting rule is fixed before test predictions: **accept when the highest calibrated class probability is at least 0.70; otherwise return uncertain**. There is no confidence-cutoff search and no margin or normalized-entropy rejection gate. The OE cross-entropy training objective is unrelated to an entropy rejection threshold.

“Raw” in this workflow means the calibrated model's highest-scoring class **before confidence rejection**. It does not mean an uncalibrated model. Both reporting views must use the same model and photo scores:

- Raw accuracy: correct highest-scoring classes / all mango test photos.
- Correct accepted rate: correct accepted predictions / all mango test photos.
- Accepted-only accuracy: correct accepted predictions / all accepted mango photos.
- Also report incorrect accepted predictions, uncertain mango rejections, accepted coverage, and unsupported acceptance/rejection counts with their denominators.

Rejected mango photos remain in their true-class support and count as recall misses. An unsupported image accepted into a mango class is a false acceptance, not a successful diagnosis. Thresholding can reject correct predictions as well as incorrect ones; do not assume that accepted-only accuracy or overall usefulness improves without measuring it.

## Preserved figures and artifacts

The repository contains **73 independent byte-identical source copies**, about 32.50 MB, under `artifacts/training/` and `figures/training/`. The [copy manifest](artifacts/evidence_copy_manifest.json) maps each original relative filename to its archive path, SHA-256, byte count, and receipt coverage. The separate [review summary](artifacts/review/verification_summary.json) contains derived checks, not overwritten source evidence. Scoped Git attributes disable text conversion for the copied training evidence.

| Existing figure                                                       | What it establishes                                                                                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [training_curves.png](figures/training/training_curves.png)           | Recorded fifteen-epoch training/clean-validation history, separate objective components and learning rates                                            |
| [augmentation_preview.png](figures/training/augmentation_preview.png) | This run's six-transform illustration using the same seven preserved validation originals; those originals are never augmented for validation scoring |
| [grad_cam.png](figures/training/grad_cam.png)                         | New true-class heatmaps from this run's weights, with the original seven validation photo identities                                                  |

Grad-CAM illustrates individual activations/gradients. It does not certify diagnosis correctness, dataset validity, causal explanations, or field accuracy. The original V4.5.0/V5.0.0 figures remain untouched.

The full source remains about **9.56 GB**, primarily 8.67 GB of OE photo originals. Repository copies omit raw image datasets, dataset ZIPs, Keras/H5 weight bundles, TensorFlow.js binary shards, disposable converter models, contact sheets, and repeated decode inventories/caches. Their original identities remain in the receipt and the full local source. The curated repository archive alone is not the complete input folder required to rerun evaluation.

The later evaluation import adds **30 independent source copies**, including six actual result figures and their original captions under `figures/evaluation/`. Receipts, frozen inputs, score arrays, predictions, CSV tables, runtime evidence, and original export metadata are under `artifacts/evaluation/`. The separate [evaluation copy manifest](artifacts/evaluation_evidence_copy_manifest.json) records all source identities and archive paths; duplicated binary weight shards remain in the complete external source. The [derived evaluation review](artifacts/review/evaluation_verification_summary.json) records independent verification without changing the original outputs. Together the archive contains three training figures and six evaluation figures. No old-model plots or placeholders were substituted.

## Completed raw and 70% confidence evaluation

The supplied GPU evaluation completed at `2026-11-01T01:08:46.713226+00:00`. Its completion receipt SHA-256 is `fb78e1a7d6543a63272abf110f22df3268b9d14606c1ba1b7e6de79fcc808930`; [evaluation.json](artifacts/evaluation/evaluation.json) has SHA-256 `5fa8951b9264f8612214248d05e6c3ed09463ad3dd4e808b9402c07f04b6f908`. It identifies the same completed training receipt and calibrated Keras weights. The runtime records TensorFlow 2.19.0 on `/GPU:0`; shared source inputs were read through the explicitly enabled shortcut.

All **32 sealed evaluation artifacts** matched their recorded SHA-256 and byte counts before import. Independent review decoded all **1,403 saved score vectors** without running the model again, checked probability validity, class order, argmax and the fixed `>=0.70` decision, and recomputed all confusion matrices and per-class precision/recall/F1. Frozen membership matches the 408 training-run mango test identities and the 995 locked reporting identities. These are evidence-integrity checks, not numerical Keras/browser parity or independent label verification.

| Mango measure                                 | Numerator / denominator                                | Result |
| --------------------------------------------- | ------------------------------------------------------ | -----: |
| Raw accuracy before confidence rejection      | 396 correct highest-scoring classes / 408 mango photos | 97.06% |
| Correct accepted rate over all mango photos   | 390 correct accepted / 408 mango photos                | 95.59% |
| Incorrect accepted rate over all mango photos | 10 wrong accepted / 408 mango photos                   |  2.45% |
| Uncertain rejection rate                      | 8 rejected / 408 mango photos                          |  1.96% |
| Accepted coverage                             | 400 accepted / 408 mango photos                        | 98.04% |
| Accepted-only accuracy                        | 390 correct accepted / 400 accepted mango photos       | 97.50% |

The 400 accepted photos consist of 390 correct and 10 incorrect predictions. Of the eight rejected photos, six had a correct raw highest-scoring class and two had an incorrect one. The threshold suppresses both kinds; it does not retrain or change the class ranking. Do not call 95.59% accepted-only accuracy or treat 97.50% as covering all 408 photos.

The historical 397-photo subset had 385 raw correct predictions (96.98%), 379 correct accepted, 10 wrong accepted and eight uncertain; accepted-only accuracy was 379/389 (97.43%). All 11 added test photos were correctly accepted: six Healthy Fruit, three Healthy Leaf and two Mango Scab. That small, limited-class subset does not establish performance for the other four classes or independently verified Philippine field accuracy.

The 995-photo unsupported collection had **802 uncertain rejections (80.60%)** and **193 false acceptances (19.40%)**. An unsupported photo assigned a mango class with at least 70% confidence remains a false acceptance. A matching version number, high mango accuracy, or successful UI test does not resolve this observed limitation. The 995 images have prior V5.0.0 reporting use; this is a reused-collection comparison rather than a fresh independent test.

| Result figure                                                                                 | Scope                                                              |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [raw_confusion_matrix.png](figures/evaluation/raw_confusion_matrix.png)                       | Seven-class predictions before rejection; 408 mango photos         |
| [confidence_70_confusion_matrix.png](figures/evaluation/confidence_70_confusion_matrix.png)   | Same inputs and scores, with an uncertain/rejected column          |
| [raw_per_class_metrics.png](figures/evaluation/raw_per_class_metrics.png)                     | Precision, recall and F1 before rejection                          |
| [confidence_70_per_class_metrics.png](figures/evaluation/confidence_70_per_class_metrics.png) | All true-class photos remain in support, including rejected photos |
| [mango_overall_comparison.png](figures/evaluation/mango_overall_comparison.png)               | Raw, correct-accepted, coverage and accepted-only measures         |
| [unsupported_confidence_70.png](figures/evaluation/unsupported_confidence_70.png)             | The 802 uncertain and 193 false-accepted unsupported outcomes      |

Original captions are preserved in [figure_captions.json](figures/evaluation/figure_captions.json). Full-precision [raw per-class CSV](artifacts/evaluation/raw_per_class_metrics.csv), [70% per-class CSV](artifacts/evaluation/confidence_70_per_class_metrics.csv) and [overall CSV](artifacts/evaluation/confidence_70_overall_results.csv) accompany the figures. At 70%, Bacterial Black Spot recall is 33/45 (73.33%), with F1 0.825; Mango Scab recall is 32/36 (88.89%), with F1 approximately 0.8533. Those class-specific weaknesses remain visible alongside the overall measures.

## Colab reproduction and recovery notes

### Training inputs and runtime

Training reads the original mango source, the 71-image `new_dataset`, the two approved OE source folders, the separate 995-photo reporting source, and the supplied three-file `reference-inputs` folder. Reference JSON records identify approved inputs; they are not model weights or extra training photos. The training notebook creates unique runs inside the existing plural `MyDrive/mangoleaf_experiments/v5.1.0/training/` parent.

Use a compatible Python 3.11/3.12 Colab runtime with a GPU for training; this completed run records Python 3.12.13, TensorFlow 2.19.0, Keras 3.15.1, and a successful GPU execution probe. Run Step 1, restart when instructed, rerun Step 1, and pass Step 2 before continuing. Historical package snapshots are evidence, not installation instructions for a new session.

The current candidate pins repair the initial Step 2 findings in `certifi`, `filelock`, `msgpack`, `Pillow`, `setuptools`, and `uv`. The saved [training audit](artifacts/training/runtime_preflight/training-audit.json) reports no known findings for the audited research closure at that time. The [provider pip check](artifacts/training/runtime_preflight/provider-pip-check.log) still records unrelated preinstalled Colab conflicts and a nonzero return code; successful training does not establish that every provider package is compatible.

The isolated converter preserves unresolved `setuptools==81.0.0` and `wheel==0.45.1` findings in its [audit summary](artifacts/training/converter_preflight/audit-summary.json). Recorded operation-specific Linux/binary-install reviews allowed this converter use while retaining the findings; they do not label these versions patched or permit suppressing new advisories. Review current advisories before another execution and keep the audit gates. Final conversion succeeded, but conversion success is separate from numerical browser parity and physical-device validation.

### Step 4 derived-fingerprint repair

An initial inventory stopped when a reused photo's derived perceptual hash differed even though its file SHA-256, decoded-RGB SHA-256, dimensions, and byte count matched. The [repair record](artifacts/training/step4_repair_20261101.json) recovered already completed inventories rather than repeating them all. The [drift audit](artifacts/training/phash_drift_audit.json) preserves two transferred-OE pHash changes, both with distance 2; it does not establish the specific library/platform cause.

Exact content checks remain mandatory. Similarity screening consistently uses current-runtime pHashes, with old values retained separately and affected cross-pool relationships checked again. The [duplicate audit](artifacts/training/duplicate_audit.json) records no newly flagged mango/cross-pool candidate pairs for this run; that is not proof of perfect independence. The one-time `repair-v5-1-step4.py`, `repair-v5-1-step5.py`, and `repair-v5-1-step12.py` remain beside the notebooks for the earlier live-session recovery. New attempts should use the corrected full template; do not apply recovery code to a run already training or complete.

### Separate evaluation, CPU, and shared folders

Finish all training steps through Step 18 and retain `training_complete.json` before opening the evaluation notebook. Evaluation loads that exact calibrated model and copied snapshots. It never retrains, refits temperature, or searches thresholds.

1. Open the clean evaluation notebook in a fresh compatible Python 3.11/3.12 session. GPU is optional; hardware accelerator **None** enables CPU evaluation. Install/restart through Step 1, then audit and record the selected device in Step 2. CPU may run more slowly, and small hardware-dependent floating-point differences can affect close class ties or scores near 70%; do not promise bitwise CPU/GPU equivalence.
2. In Step 3 select the exact completed run. For another account, the owner can share the complete `v5.1.0` folder as Viewer. In the evaluating account add a shortcut named `v5.1.0` directly to My Drive; sharing alone does not add it to the mounted filesystem. Authorize the mount using that receiving account.
3. Set `ALLOW_SHARED_INPUT_SHORTCUTS = True` and `TRAINING_RUN = DRIVE_ROOT / 'v5.1.0/training/v5-1-0-training-20261031T185635Z-46c45fe8'`. Shared inputs remain read-only in this workflow. Other external paths stay rejected, and all source artifact hashes still have to match.
4. Results are created automatically in the evaluating account's own `MyDrive/mangoleaf_v5_1_0_evaluations/<unique-run>/`. This output root must not be a shortcut to the shared source. Existing source files are never overwritten. Resource access remains subject to Colab's rules.
5. Freeze the 408 mango test and 995 unsupported inputs before one inference pass, then generate the raw/70% figures, full-precision measurements, CSV tables, candidate export copy, and completion receipt. Do not rerun a started output/inference attempt in place or delete start markers to force it to run again.

Local `tools/verify-v5-1-notebooks.py` checks notebook contracts and synthetic data-boundary fixtures. Those tests cover CPU/GPU selection logic, shared-input permission, owned output paths, no source mutation, scoring boundaries, receipt changes, and historical recipe preservation. They do not execute real Colab sharing, TensorFlow training, or field evaluation. The completed training evidence here is separate from those local checks.

## Local Debug model and rollback

The maintainer authorized a temporary local runtime replacement for Debug APK testing. The original training/export configuration is preserved byte-for-byte in [tfjs_model/model_config.json](artifacts/training/tfjs_model/model_config.json); it has no final evaluation thresholds. The local runtime configuration explicitly declares confidence 0.70, disabled margin/entropy gates, and the already-folded temperature. This is derived runtime metadata; keep its identity separate from the original export receipt. Do not claim that the original artifact was rewritten.

The local runtime label is `v5.1.0-candidate`; the adopted label stays `v4.5.0`. Existing reports/photos remain intact, and duplicate-result reuse requires the exact active model label. An old V4.5.0 diagnosis cannot substitute for current V5.1.0 inference. Production and ordinary committed-model bundles retain the adopted model unless an explicit approved adoption changes them.

**Debug staging must explicitly select working model assets:** use `bun run android:bundle --working-model`, then the Android Gradle `assembleDebug` and `verifyDebugBundle` tasks. The default bundler reads committed model assets/constants; `bun run android:debug` invokes that default and can replace candidate staging with V4.5.0. Keep the testing backend and Debug variant; do not publish, sign a Production release, or change application/model adoption merely to test this candidate. Follow the [Android guide](../../../versions/ANDROID_APK_VERSIONING.md) for packaging and physical checks.

The exact rollback kit is `.tools/model-backups/v4.5.0-before-v5.1.0-20261101/`, with `original/`, `rollback/`, `model-swap-receipt.json`, and `restore-v4.5.0.ps1`. Its isolated restore rehearsal passed and guards refuse to overwrite later edits. From the repository root, restore the baseline with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .tools/model-backups/v4.5.0-before-v5.1.0-20261101/restore-v4.5.0.ps1
```

The local derived configuration SHA-256 is `9bbd38b90bae0ff8bccb00633adaa32cca4cb215723ce639c76fb9a36512793d`, distinct from the original archived export configuration SHA-256 `7848afe863f829dc5a0e770c8225309e68d8078096a1dce9a14265fd8296f485`. The original graph and three shard hashes match [export_complete.json](artifacts/training/export_complete.json); no calibration or learned weights changed during the local installation.

**No model reinsertion is needed after this evaluation import.** The evaluation export's graph and all three weight shards are byte-identical to the current `public/model/` and packaged Debug assets. Input/class/temperature settings and the confidence-only rule also agree. The [evaluation configuration](artifacts/evaluation/tfjs_model/model_config.json) adds completion status and uses top-level confidence metadata; the tested local configuration uses explicit nested thresholds plus Debug/provenance fields. These descriptive/schema differences do not change inference. Keep the existing tested APK, runtime config, rollback receipt and their exact hashes. Their older pending-evaluation wording identifies the build-time state; the separate evaluation receipt records the later supplied research evidence. Replacing metadata merely to change that wording would require fresh package identities without changing the learned model.

The [model-swap receipt](artifacts/local-debug/model-swap-receipt.json), [derived runtime configuration](artifacts/local-debug/runtime-model-config.json), and [local copy mapping](artifacts/local-debug/copy_manifest.json) preserve the exact installation/rollback identities independently of the original training artifacts. Restoring baseline assets must also restore constants and cache identity together, rebuild/repackage the Debug bundle, and confirm the actual installed model. A file swap alone does not update an already installed APK. This trial's archived evidence remains intact after any rollback.

### Prepared Debug installer

Explicit working-model staging and Gradle `assembleDebug` / `verifyDebugBundle` passed; all 81 packaged web assets were verified. Independent inspection confirmed all five packaged model files match the local runtime graph/configuration/shards. The [packaged-bundle receipt](artifacts/local-debug/packaged-bundle-receipt.json) identifies an unpublished testing-backend APK:

| Item                 | Exact candidate                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Native / web / model | `0.1.8-dev` (code 9) / `0.12.0` / `model-v5.1.0-candidate`                                    |
| APK                  | `.tools/android-debug-candidates/v5.1.0-20261101/mangoleaf-ai-0.1.8-dev-v5.1.0-candidate.apk` |
| APK bytes            | `15721413`                                                                                    |
| APK SHA-256          | `05af505b8300bf1c296f60fb901caf600ef21a3b97e4032c62a8f122d8c6e9f8`                            |
| Model identity       | `12e1efd65a7f017770ead8b7d1693bc7a1d8374902e0bbfe8c72ca8456f220fb`                            |
| Input fingerprint    | `6ceaaad0e87518bbd46b155ff44d771b89dd99ebf49d2156a6e6b572bdbc059a`                            |

The receipt's source commit is the underlying checkout; `workingTreeCandidate: true` and the input fingerprint identify the uncommitted candidate changes. No APK was installed on a physical phone as part of packaging. These checks establish packaging identity, not diagnostic accuracy, Keras/browser numerical parity, current-build R03, device reliability, expert agreement, adoption, or publication. The ignored APK binary remains outside Git.

## Local browser integration observations

The existing M01 cases passed **8/8** on the isolated Chromium mobile-viewport harness using the actual V5.1.0 classifier, local backend mocks, and saved-result UI. Full vectors and runtime metadata are preserved in [browser-smoke-observations.json](artifacts/local-debug/browser-smoke-observations.json). These fixtures have provisional labels and prior testing use; they are not an independent accuracy sample or physical phone test. A passing UI assertion can display an uncertain or incorrect prediction correctly.

Six mango fixtures produced accepted predictions matching their supplied labels. The Anthracnose fixture returned **Uncertain / Unrecognized** at confidence **0.6435546875**; the unsupported fixture was also uncertain at **0.33203125**. Keep these observations visible rather than interpreting eight integration passes as eight correct disease diagnoses. The [local validation record](artifacts/local-debug/local_validation.json) separates build/packaging checks from pending scientific, numerical-parity, reliability and physical-device evidence.

The final local gates passed pinned formatting, Node runtime validation, ordered typecheck/lint/static build, security scanning, and all 24 notebook contract tests. Independent review rechecked all 73 source copies against their original SHA-256 and byte counts. Debug assembly and verification passed all 81 packaged web assets; the five packaged model files match the active local candidate exactly. An isolated rollback fixture restored the baseline and rejected simulated later edits. No APK installation, production signing, publication, formal reliability session, or field evaluation was performed in this task.

## Remaining evidence and limits

- Preserve and review the completed 408-photo raw/70% mango report and 995-photo unsupported report. Keep original 397 versus added 11 results, exact denominators, per-class support, 193 unsupported false acceptances, and uncertainty counts visible. Additional independently collected and appropriately verified data is still needed for stronger field evidence.
- Run numerical exported-model parity checks and the affected Debug APK/physical-device checks. A successful graph load or build does not establish Keras/TensorFlow.js probability parity.
- Complete the intended farmer usability/SUS and agriculture-expert assessments before claiming user acceptance, expert diagnostic agreement, or field effectiveness. None is established by the training artifacts.
- Retain source/capture/cultivar/label limitations. Prior model-development and evaluation use limits independence even when current byte/pixel hashes and split membership are disjoint. Further independently collected, appropriately verified Philippine Carabao mango images would strengthen the intended-setting evidence.
- Compare V5.1.0 with V4.5.0 using matched inputs and clearly identified historical subsets. New photos, extra OE, fresh initialization, selected checkpoints, and recalibration change several factors together; no matched control here isolates one improvement cause.
- Make any adoption and production release explicit only after reviewing actual model/OOD, runtime, reliability, and device evidence. A higher version number, completed training, or a preferred manual scan is insufficient by itself.

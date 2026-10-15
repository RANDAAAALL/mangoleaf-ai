# V4.5.0 completed experiment review

**Repository status, October 16, 2026:** V4.5.0 is now the adopted repository model with confidence-only rejection at 0.70. See the [adoption record](TRIAL_v4_5_0.md#current-model-adoption-october-16-2026) and its separate configuration hashes. The review below retains the October 12 fitted-rule metrics, candidate recommendations, and status at that time; those historical statements do not describe today's active configuration. The confidence-only reference has 377/397 correct accepted mango inputs and nine false accepts among 250 OOD reporting photos. Production release validation and physical-device evaluation remain pending.

**Review date: October 12, 2026. Status: experimental candidate for reversible local testing; not adopted or deployed.**

## Verdict

V4.5.0 has promising results on the saved study photographs, particularly its rejection of unsupported inputs. The reporting pool contains **four false accepts out of 250 unsupported photos**, compared with nine using this same model's confidence-only gate. It also retains **387 of 397 mango test photos**. These results justify local testing of the exported candidate.

Its main weakness is diagnosis of **bacterial black spot versus mango scab**. Nine black-spot test photos receive accepted scab diagnoses, and two scab photos receive accepted black-spot diagnoses. Several errors have confidence above 98%, so rejection thresholds do not reliably remove this confusion. The candidate is not uniformly better at diagnosis simply because its OOD rejection is strong.

The headline raw accuracy is **384/397 = 96.73%**. The more useful full-input outcome is **375/397 = 94.46% correct accepted diagnoses**, with **12 wrong accepted diagnoses** and **10 rejected mango photos**. The **96.90% accuracy among accepted photos** uses a different denominator and must not replace the full-input figure.

The evidence does not establish independently collected field accuracy, complete source/capture independence, expert verification of every unsupported label, or browser/Keras prediction parity. V4.3.0 remains the adopted model unless a separate adoption decision is made. A local asset swap and its rollback are testing operations.

## Evidence identity and review scope

The completed source runs are:

- Training: `v4-5-0-training-20261011T063913Z-40b7b0fe`.
- Threshold fitting: `v4-5-0-thresholds-20261011T171525Z-e488eb05`.
- Local original collection: `C:\Users\My Pc\Desktop\workspace\capstone\model\brain\v4.5.0\`.

The executed [training notebook](../../../../notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Training_v4_5_0_Post_Training.ipynb) and [threshold results notebook](../../../../notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Threshold_Fitting_v4_5_0_Results.ipynb) preserve the run outputs. The tables below were checked against saved JSON metrics and CSV prediction rows; this review did not execute training or threshold notebook cells, change thresholds, or visually classify every source image.

| Identity                                                                                         | SHA-256                                                            |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [Training completion receipt](artifacts/training/training_complete.json)                         | `7bf59fb00836d554f25aa310bdb1f93db36a79b87ec72f5627f830e2302e3dd5` |
| [Mango input manifest](artifacts/training/input_manifest.json)                                   | `aa04c5105e2aa0a15d1ca4f46da0722c130577eb7bc62e8cef4830e45ec48d5c` |
| [Selected thresholds](artifacts/threshold_fitting/selected_thresholds.json)                      | `f356631f548304f32c11514c92e53615798c324384d5b3a24f4704efae53fe45` |
| [Frozen evaluation inputs](artifacts/threshold_fitting/evaluation_inputs.json)                   | `b2b19112cda8ae16fd756417d115c9264de3880c84df55604c1b50748953eca2` |
| [Evaluation](artifacts/threshold_fitting/evaluation.json)                                        | `10e058bed7812831cd618d0a6a27d406aa42ecf97de10a222c156ff2c1395737` |
| [Threshold completion receipt](artifacts/threshold_fitting/threshold_fitting_complete.json)      | `22d4d6da5dfc126444c3764a2cd481df560086763cdafa2a9222820ef1477b96` |
| Browser graph, recorded in [candidate hashes](artifacts/threshold_fitting/candidate_hashes.json) | `0fd24e1f0f6bd5595566b8f4aec130808fbd510208ed82abbdc4d319fd2aa2a1` |

Preserved completion receipts reference the full original runs, including files omitted from a selected repository archive. They must not be edited to make a smaller archive appear to be a complete training package. Copied evidence and derived review material should identify their origins separately.

## Training, membership, and calibration

The run inventories **5,098 raw mango photos**, retains **2,649 representatives** after exact-copy removal, and preserves all **62 protected image fingerprints**. Its saved groups produce **1,854 train / 398 validation / 397 test** photos. The membership contains **2,613 group IDs**. No exact byte hash, decoded RGB hash, or recorded group ID crosses the three saved mango subsets. This verifies the recorded grouping; unknown source or capture relationships remain a limitation.

The raw OE pool contains **2,481 files**, reduced to **2,311 exact representatives**. The run rejects **300 representatives reserved for OOD**, leaving **2,011 approved OE training photos**. The 500 held-out OOD photos contain exactly 300 byte-hash matches with the raw OE inventory and **zero matches with approved OE training or retained mango images**. These 300 are newly reserved for V4.5.0 evaluation; they were not independently collected for this experiment. Source-family separation beyond those saved hashes and groups is not established.

These counts and exclusions are supported by the [input manifest](artifacts/training/input_manifest.json), [OE review](artifacts/training/oe_review.json), [OE training manifest](artifacts/training/oe_training_manifest.json), [held-out inventory](artifacts/training/held_out_ood_inventory.json), and [cross-pool overlap audit](artifacts/training/cross_pool_overlap_audit.json).

The [training plan](artifacts/training/plan.json) starts MobileNetV3Large from ImageNet, with no prior MangoLeaf weights. It uses a uniform seven-class OE objective with loss weight **0.5**, five frozen-backbone epochs at **0.001**, and ten fine-tuning epochs at **0.00001** with BatchNormalization frozen. OE does not enter mango class accuracy, class weights, validation, or temperature fitting. This is one run, not an ablation proving that OE caused the observed differences.

The selected checkpoint is **epoch 14**, with clean mango validation loss **0.08137137**. Epoch 15 loss rises to **0.08953860**, so selecting the lower-loss checkpoint is consistent with the recorded rule. The [history](artifacts/training/training_history.json) separates mango and OE loss; total training loss is not directly comparable with clean unweighted validation loss.

Validation-only temperature fitting chooses **0.80020938**, improving validation negative log likelihood from **0.08137135 to 0.07882078**. The [temperature receipt](artifacts/training/temperature.json) records that temperature was folded into the classifier weights **once**. Browser inference must not apply the temperature again.

## Threshold selection and evaluation order

The frozen gates are:

- Confidence at least **0.70**.
- Margin at least **0.00**, which adds no practical restriction to sorted class probabilities.
- Normalized entropy at most **0.40**.

The [search](artifacts/threshold_fitting/threshold_search.csv) contains **10,201** margin/entropy settings. **3,613** satisfy the minimum acceptance requirement. The selected setting rejects **247/250 tuning OOD photos**, the highest rejection count among feasible settings, while accepting **382/398 validation mango photos = 95.98%**. The required count is `ceil(0.95 * 398) = 379`; this is an acceptance constraint on all validation photos, including incorrect predictions, not a 95% accuracy guarantee.

The [selection lock](artifacts/threshold_fitting/selection_lock.json) was written at **2026-10-11 17:57:33 UTC**. [Reporting evaluation](artifacts/threshold_fitting/evaluation_started.json) started at **18:00:56 UTC**, after selection. The executed notebook also reports that mango test and OOD reporting predictions remained unused at selection. These saved records support the declared order; they are not proof that no external viewing or earlier experiment informed the research design.

## Full-input mango outcomes

| Outcome                             | Validation, n = 398   | Test, n = 397         |
| ----------------------------------- | --------------------- | --------------------- |
| Raw correct predictions             | 384 / 398, **96.48%** | 384 / 397, **96.73%** |
| Accepted photos                     | 382 / 398, **95.98%** | 387 / 397, **97.48%** |
| Correct accepted diagnoses          | 376 / 398, **94.47%** | 375 / 397, **94.46%** |
| Wrong accepted diagnoses            | 6 / 398, **1.51%**    | 12 / 397, **3.02%**   |
| Rejected mango photos               | 16 / 398, **4.02%**   | 10 / 397, **2.52%**   |
| Accuracy among accepted photos only | 376 / 382, **98.43%** | 375 / 387, **96.90%** |

Source: [evaluation JSON](artifacts/threshold_fitting/evaluation.json), [validation predictions](artifacts/threshold_fitting/validation_predictions.csv), and [mango test predictions](artifacts/threshold_fitting/mango_test_predictions.csv).

Of the 13 raw test errors, the gates reject only **one**, retaining **12**. Nine raw-correct test predictions are also rejected. The gates are useful for unsupported-image rejection but provide limited protection from confident within-mango disease errors in this test.

### Per-class test outcomes

Each row below keeps every true-class photo in its denominator. “Wrong accepted” counts incorrect diagnoses among photos whose actual class is that row.

| Actual class         | Support | Raw correct | Correct accepted | Wrong accepted | Rejected | Correct accepted / support |
| -------------------- | ------- | ----------- | ---------------- | -------------- | -------- | -------------------------- |
| Anthracnose          | 74      | 74          | 73               | 0              | 1        | **98.65%**                 |
| Bacterial black spot | 45      | 35          | 31               | 9              | 5        | **68.89%**                 |
| Bacterial canker     | 75      | 75          | 75               | 0              | 0        | **100.00%**                |
| Healthy fruit        | 18      | 18          | 17               | 0              | 1        | **94.44%**                 |
| Healthy leaf         | 75      | 75          | 75               | 0              | 0        | **100.00%**                |
| Mango scab           | 34      | 32          | 29               | 2              | 3        | **85.29%**                 |
| Sooty mold           | 76      | 75          | 75               | 1              | 0        | **98.68%**                 |

Precision measures correctness among accepted predictions assigned to a class; recall measures correct accepted predictions among all real photos of that class. Rejections lower recall. The supporting [raw metrics](artifacts/threshold_fitting/raw_per_class_metrics.csv) and [rejection-aware metrics](artifacts/threshold_fitting/rejection_aware_per_class_metrics.csv) distinguish both views.

| Class                | Raw precision | Raw recall | Raw F1  | Gated precision | Gated recall | Gated F1 |
| -------------------- | ------------- | ---------- | ------- | --------------- | ------------ | -------- |
| Anthracnose          | 98.67%        | 100.00%    | 99.33%  | 98.65%          | 98.65%       | 98.65%   |
| Bacterial black spot | 94.59%        | 77.78%     | 85.37%  | 93.94%          | 68.89%       | 79.49%   |
| Bacterial canker     | 100.00%       | 100.00%    | 100.00% | 100.00%         | 100.00%      | 100.00%  |
| Healthy fruit        | 100.00%       | 100.00%    | 100.00% | 100.00%         | 94.44%       | 97.14%   |
| Healthy leaf         | 100.00%       | 100.00%    | 100.00% | 100.00%         | 100.00%      | 100.00%  |
| Mango scab           | 76.19%        | 94.12%     | 84.21%  | 76.32%          | 85.29%       | 80.56%   |
| Sooty mold           | 100.00%       | 98.68%     | 99.34%  | 100.00%         | 98.68%       | 99.34%   |

Macro F1 is **95.46% raw** and **93.60% with rejection**. Black spot's nine accepted scab errors represent **20.00% of its 45-photo support**. Scab's accepted precision is **29/38 = 76.32%**, because nine true black-spot photos are accepted as scab. Healthy fruit has only **18** test photos; a perfect raw result on that small support is not strong evidence of general fruit recognition.

### Exact accepted mango errors

The source filenames below are identifiable in [mango test predictions](artifacts/threshold_fitting/mango_test_predictions.csv), which preserves their full paths, IDs, hashes, and seven probabilities. Confidence is a model score, not a verified probability that the diagnosis is correct.

| Source filename                                         | Actual class         | Accepted diagnosis   | Confidence |
| ------------------------------------------------------- | -------------------- | -------------------- | ---------- |
| `Bc99.jpg`                                              | Bacterial black spot | Mango scab           | 89.65%     |
| `Bc221.jpg`                                             | Bacterial black spot | Mango scab           | 70.93%     |
| `Bc103.jpg`                                             | Bacterial black spot | Mango scab           | 90.45%     |
| `Bc188.jpg`                                             | Bacterial black spot | Mango scab           | 98.64%     |
| `Bc119.jpg`                                             | Bacterial black spot | Mango scab           | 91.17%     |
| `Bc101.jpg`                                             | Bacterial black spot | Mango scab           | 94.03%     |
| `Bc244.jpg`                                             | Bacterial black spot | Mango scab           | 91.21%     |
| `Bc113.jpg`                                             | Bacterial black spot | Mango scab           | 99.27%     |
| `Bc272.jpg`                                             | Bacterial black spot | Mango scab           | 83.63%     |
| `Sc34.jpg`                                              | Mango scab           | Bacterial black spot | 99.79%     |
| `Sc159.jpg`                                             | Mango scab           | Bacterial black spot | 98.38%     |
| `724869371_27534362222843583_7670640125862653147_n.jpg` | Sooty mold           | Anthracnose          | 91.42%     |

These mistakes warrant diagnosis and label/source review. Tightening a gate until these saved reporting errors disappear would tune on reporting evidence; it would require a new documented selection process and independent evaluation, rather than silently improving this run's reported result.

## Unsupported-image outcomes and threshold tradeoff

| OOD subset | Total | False accepted | Rejected | False acceptance rate | Rejection rate |
| ---------- | ----- | -------------- | -------- | --------------------- | -------------- |
| Tuning     | 250   | 3              | 247      | **1.20%**             | **98.80%**     |
| Reporting  | 250   | 4              | 246      | **1.60%**             | **98.40%**     |

The reporting result is separate from the tuning objective. Combining both into 500-photo accuracy would mix fitted and reporting evidence.

The [review CSV](artifacts/threshold_fitting/ood_review.csv) records **200 previously evaluated** and **300 new-for-V4.5.0** histories. The [assignments](artifacts/threshold_fitting/ood_assignments.csv) split them as follows:

| Subset and recorded history     | Photos | False accepts | Rejected | False acceptance rate |
| ------------------------------- | ------ | ------------- | -------- | --------------------- |
| Tuning, previously evaluated    | 102    | 2             | 100      | 1.96%                 |
| Tuning, new for V4.5.0          | 148    | 1             | 147      | 0.68%                 |
| Reporting, previously evaluated | 98     | 2             | 96       | 2.04%                 |
| Reporting, new for V4.5.0       | 152    | 2             | 150      | 1.32%                 |

“New for V4.5.0” describes this evaluation history, not independently collected external evidence. The 300 were reserved from the raw OE collection before gradients were applied. Original and new photos can share collection characteristics even when exact files are excluded from training.

### Exact false accepts in the reporting pool

Source: [OOD reporting predictions](artifacts/threshold_fitting/ood_report_predictions.csv).

| Photo                     | Accepted class | Confidence | Normalized entropy |
| ------------------------- | -------------- | ---------- | ------------------ |
| `Copy of Tomato_0021.jpg` | Healthy fruit  | 81.70%     | 0.3575             |
| `Copy of Tomato_0023.jpg` | Healthy fruit  | 91.10%     | 0.2222             |
| `avocado_3.png`           | Sooty mold     | 98.31%     | 0.0493             |
| `random_img_5.jpg`        | Healthy leaf   | 84.30%     | 0.3618             |

The two tomato names identify photos newly reserved for V4.5.0; the other two have previously evaluated history. The labels above are the saved review/prediction claims, not new visual verification of photo content by this review.

### Confidence-only versus the frozen gates

Both columns use the same V4.5.0 weights and reporting/test inputs. Source: [evaluation](artifacts/threshold_fitting/evaluation.json), [confidence-only mango rows](artifacts/threshold_fitting/confidence_only_mango_test_predictions.csv), and [confidence-only OOD rows](artifacts/threshold_fitting/confidence_only_ood_report_predictions.csv).

| Outcome                          | Confidence 0.70 only | Confidence 0.70, margin 0.00, entropy 0.40 |
| -------------------------------- | -------------------- | ------------------------------------------ |
| Accepted mango photos            | 389 / 397, 97.98%    | 387 / 397, 97.48%                          |
| Correct accepted mango diagnoses | 377 / 397, 94.96%    | 375 / 397, 94.46%                          |
| Wrong accepted mango diagnoses   | 12 / 397             | 12 / 397                                   |
| Rejected mango photos            | 8 / 397              | 10 / 397                                   |
| OOD reporting false accepts      | 9 / 250, 3.60%       | 4 / 250, 1.60%                             |

Adding entropy rejects **five additional unsupported photos** and **two additional correctly classified mango photos**. It does not remove additional wrong accepted mango diagnoses in this test. This is a visible tradeoff, not an across-the-board improvement. The total OOD false-accept reduction is **2.00 percentage points**, or **55.56% relative to nine false accepts**, on this particular reporting pool.

## Protected photographs and chosen examples

The [protected image ledger](artifacts/training/reviewed_images.json) contains 62 unique byte hashes. All survive into the saved manifest: **42 training, 12 validation, eight test**. Retaining them does not mean all 62 were independent test examples or all 62 were diagnosed correctly.

Among the eight protected test photos, **seven** are raw-correct; the gates produce **five correct accepted diagnoses, one wrong accepted diagnosis, and two rejections**. The failed accepted diagnosis is the sooty-mold photo listed above. `DSC_0281.JPG` is raw-correct scab but rejected by entropy at **70.53% confidence**; `Scab1.JPG` is raw-correct scab but rejected by confidence and entropy at **50.21%**.

Among 12 protected validation photos, **11** are raw-correct, **nine** are correctly accepted, **none** is wrongly accepted, and **three** are rejected. These are calibration/selection data, not an extra test set.

The [figure manifest](artifacts/training/figure_manifest.json) preserves all seven selected illustration examples and their scores. Two requested examples remain problematic:

- `DSC_0488.JPG`, actual anthracnose: raw prediction anthracnose, **37.20%** confidence, rejected.
- `HealthyLeaf_1.jpg`, actual healthy leaf: raw prediction anthracnose, **61.96%** confidence, rejected.

The other requested examples are correctly classified and accepted: healthy fruit **99.83%**, mango scab **97.32%**, and sooty mold **94.62%**. The additional black-spot and canker illustration examples also receive correct high-confidence predictions. These seven were reserved in validation before predictions; their selection is documented, but their outcomes do not measure field generalization.

Grad-CAM is targeted to the true class while displaying predicted class separately. A positive heatmap or a visually plausible highlighted region does not prove a correct diagnosis.

## Historical comparison and its limits

The following table describes each saved run on its own inputs. It is **not a matched experiment** or a basis for declaring one model superior in the field.

| Saved run                                                                                  | Raw mango test correct | Correct accepted / all mango test | Wrong accepted | Rejected mango | Reporting OOD false accepts            |
| ------------------------------------------------------------------------------------------ | ---------------------- | --------------------------------- | -------------- | -------------- | -------------------------------------- |
| [V4.3.0 combined](../../non-experiment/v4.3.0/artifacts/threshold_fitting/evaluation.json) | 386 / 393, 98.22%      | 373 / 393, 94.91%                 | 3 / 393        | 17 / 393       | Old pool 24 / 84; then-new pool 5 / 32 |
| [V4.4.0](../../experiment/v4.4.0/artifacts/threshold_fitting/evaluation.json)              | 380 / 397, 95.72%      | 366 / 397, 92.19%                 | 8 / 397        | 23 / 397       | 31 / 100                               |
| V4.5.0                                                                                     | 384 / 397, 96.73%      | 375 / 397, 94.46%                 | 12 / 397       | 10 / 397       | 4 / 250                                |

The V4.5.0 mango test's 397 hashes intersect **53** of V4.3.0's 393 test hashes and **68** of V4.4.0's 397 test hashes. Their saved training manifests place the other V4.5.0 test photos as follows:

| V4.5.0 test photos' earlier role | V4.3.0 manifest | V4.4.0 manifest |
| -------------------------------- | --------------- | --------------- |
| Earlier training                 | 281             | 267             |
| Earlier validation               | 46              | 62              |
| Earlier test                     | 53              | 68              |
| Not present by exact byte hash   | 17              | 0               |

These role counts were derived from the original completed training manifests. They do not indicate within-V4.5.0 leakage: V4.5.0 starts new weights and keeps its own recorded groups separate. They do show that scoring older models on the entire new test set would expose those older models to many photos they previously trained on. A direct paired comparison requires a common eligible evaluation pool whose history is checked for both models.

V4.5.0's OE objective, approved external-photo pool, split membership, and reporting OOD composition differ from the historical trials. Its much lower saved OOD false acceptance is encouraging, but the sizes and histories differ substantially. Neither that difference nor the aggregate mango scores isolate a causal OE benefit. Its lower raw accuracy and larger count of accepted disease errors than the saved V4.3.0 result are useful cautions, not proof of regression on identical photos.

The current study mango photographs and original 200 OOD photographs have been used in earlier experiments. A new split prevents current-run subset overlap but does not make the research pool pristine external evidence.

## Review provenance and remaining limits

All 500 [OOD review](artifacts/threshold_fitting/ood_review.csv) rows have `keep=yes` and `unsupported=yes`. Their notes explicitly state that these flags were set at the researcher's request and that the CSV update did **not independently inspect image content**. Individual sources are not recorded. This review preserves that limitation; a completed CSV is not proof that every photo is outside the seven supported mango classes.

Every OOD `captureGroup` and `sourceGroup` is blank. The mango source/capture maps are also empty. The [similarity review](artifacts/threshold_fitting/similarity_review.csv) has zero data rows, consistent with the notebook's zero flagged pairs. OOD assignment therefore records **500 singleton group IDs**. This means no relationship was recorded or detected by this audit; it does not prove 500 independent specimens, capture sessions, or source images. Perceptual-hash distance checks can miss related images.

The preserved threshold receipt sets `browserPredictionParityMeasured=false`. Successful export establishes an available graph/shard bundle, not equal predictions across Python and the browser's real image decoding and resizing. Local loading, deterministic inference, probability comparison, cache refresh, physical devices, and field performance must be reported according to the checks actually performed. No browser parity, speed benchmark, or physical-device result is claimed here.

No 30-minute R03 reliability run or shortened substitute belongs to this review. Source notebooks and downloaded run files remain evidence; local testing does not move this version into the adopted `non-experiment/` group or authorize deployment.

## Important figures

The following copied figures retain their original measured values and captions:

- [Training curves](figures/training/training_curves.png): stage boundary, learning rates, mango accuracy, and labeled mango loss. OE changes the total objective, so read the loss labels.
- [Augmentation overview](figures/training/augmentation_preview.png): examples of the configured transformations; an illustration, not an accuracy measurement.
- [Grad-CAM](figures/training/grad_cam.png): selected validation examples, predicted class, confidence, and true-class heatmaps.
- [Raw confusion matrix](figures/threshold_fitting/confusion_matrix.png) and [raw class metrics](figures/threshold_fitting/per_class_metrics.png): classification before gates.
- [Confusion matrix with rejection](figures/threshold_fitting/confusion_matrix_with_rejection.png) and [class metrics with rejection](figures/threshold_fitting/per_class_metrics_with_rejection.png): all 397 mango photos remain in support, including rejects.
- [Threshold search](figures/threshold_fitting/threshold_search.png): a slice of the recorded two-dimensional search, fitted on validation and tuning inputs only.

The [training figure manifest](artifacts/training/figure_manifest.json) and [threshold captions](figures/threshold_fitting/figure_captions.json) explain provenance and denominators. Keep raw and rejection-aware charts together so acceptance filtering cannot hide missed diagnoses.

## Local testing decision

Use V4.5.0 as a reversible candidate to test unsupported-photo rejection and the black-spot/scab weakness under the application's actual preprocessing. Preserve the exact V4.3.0 assets and configuration before the swap, identify the candidate consistently, and record observations against the candidate's hashes. The selected confidence, entropy, and already-folded temperature should follow the preserved export rather than be adjusted to produce pleasing local results.

A model adoption proposal should address source/label review, comparison membership, and browser prediction agreement. New independent mango and unsupported photographs would provide stronger evidence than repeated experimentation on the present pools. The saved results support **local testing now**, with the diagnosis and evidence limitations above remaining visible.

## Local browser follow-up (October 12, 2026)

After the candidate installation, a direct check using the actual production classifier and existing inference harness passed 32 predictions across desktop and emulated mobile Chromium 153.0.8010.12. Each profile evaluated the same eight developer fixtures online and offline. All seven supported-class fixtures received their provisional supported label, and the unsupported fixture was rejected. Probability vectors were finite with seven entries, class order/configuration identity matched, and the acceptance decision agreed with the raw confidence/margin/entropy gates. [Browser observations](artifacts/local_browser_model_smoke.json) preserve the outputs, hashes, backend, and tested application fingerprint.

This is an integration observation, not a new independently sampled accuracy estimate or browser/Keras probability comparison. The backend used WebGL with forced float16 textures. Offline checks supplied original fixture bytes as data URLs to an already-loaded model; they do not establish offline startup, page reload, History, or saved-result UI. The standard gallery-based M01/R02 run was interrupted after a file-chooser timeout; full UI integration remains unverified in this temporary local testing state. [Validation provenance](artifacts/local_test_validation.json) distinguishes the passed build/model checks from those incomplete flows. No R03 or shortened substitute was run.

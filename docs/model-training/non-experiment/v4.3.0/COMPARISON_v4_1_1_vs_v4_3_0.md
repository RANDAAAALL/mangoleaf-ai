# V4.1.1 versus V4.3.0: completed exploratory comparison

> **Status: ADOPTED CURRENT MODEL — October 2, 2026.** The user adopted V4.3.0 Combined as the current application model, with app `0.4.9` and model `v4.3.0`. The exact V4.1.1 Background bundle remains preserved in verified backups. The October 1 review, historical table labels, measured results, and comparison figures below retain their original context. Adoption does not establish an overall accuracy improvement or a live deployment. See the [adoption record](TRIAL_v4_3_0.md#current-model-adoption-october-2-2026).

## Historical review: October 1, 2026

Reviewed October 1, 2026. Both experiments use the same seven-class task and the same mango and OOD evaluation photo identities. V4.3.0 is installed for local testing only; it is not adopted, deployed, or released.

## Result and practical conclusion

V4.3.0 is a valid completed experiment, but these results do not establish an overall improvement over V4.1.1 Background. It makes the same final accepted/rejected mango decisions, rejects two more old OOD photos in total, and falsely accepts four more photos from the reused newer OOD report. Its raw mango classification has one additional mistake. Keep both exact candidates for comparison; the requested local V4.3.0 test is not an adoption decision.

| Experiment / arm                         | Confidence / margin / entropy     | Raw correct / 393 | Correct / wrong accepted | Mango rejected | Old OOD falsely accepted / 84 | Reused newer OOD falsely accepted / 32 |
| ---------------------------------------- | --------------------------------- | ----------------: | -----------------------: | -------------: | ----------------------------: | -------------------------------------: |
| V4.1.1 Control (reference only)          | No feasible gate; confidence-only |               385 |                  373 / 4 |             16 |                            32 |                                      7 |
| V4.1.1 Background (previous local model) | 0.70 / 0 / 0.38                   |               387 |                  373 / 3 |             17 |                            26 |                                      1 |
| V4.1.1 Lighting                          | 0.70 / 0 / 0.35                   |               385 |                  373 / 3 |             17 |                            21 |                                      4 |
| V4.1.1 Combined (matching recipe)        | 0.70 / 0 / 0.37                   |               387 |                  373 / 3 |             17 |                            26 |                                      1 |
| V4.3.0 Combined (new local model)        | 0.70 / 0 / 0.42                   |               386 |                  373 / 3 |             17 |                            24 |                                      5 |

Control has no feasible fitted gate because its confidence-only validation retention is 371/391, below the required 372. Its row is a reference, not a deployable selected candidate. Lighting, Background, and Combined are experiment recipes, not disease labels.

For the two primary candidates:

- **Raw test accuracy:** V4.1.1 Background 387/393 = 98.47%; V4.3.0 Combined 386/393 = 98.22%. This is one photo, a 0.25 percentage-point difference on reused data.
- **Accuracy among accepted mango predictions:** both 373/376 = 99.20%. Both reject 17/393 = 4.33%. Accepted accuracy excludes rejected photos; it must not be described as accuracy on all 393 inputs.
- **Old OOD false acceptance:** 26/84 = 30.95% versus 24/84 = 28.57%. Lower is better. Corresponding rejection is 69.05% versus 71.43%.
- **Reused newer OOD false acceptance:** 1/32 = 3.13% versus 5/32 = 15.63%. Lower is better. Corresponding rejection is 96.88% versus 84.38%.
- **Validation retention:** 374/391 = 95.65% versus 372/391 = 95.14%. Retention counts accepted wrong predictions too; it is not classification accuracy. The rule is global, not a 95% guarantee for every class.
- **OOD fitting rejection:** 63/84 versus 69/84. This is the fitting half, not the held-out report half. Do not substitute it for the old OOD report result.

Combining the two report collections gives 27/116 false accepts for Background and 29/116 for V4.3.0. That descriptive total depends on this particular mix of OOD photos; it is not a population estimate or evidence of statistical significance.

## Comparison controls and changed inputs

The saved dataset ZIP SHA-256 is `670c52544cb14cec872b78f74721152d1079ca30f8b66bbdb864276d21240dfd`. All 1,819 training, 391 validation, and 393 test mango identities, labels, paths, and split memberships match V4.1.1. The old OOD fitting/report subsets contain 84 photos each; the reused newer report contains 32. No exclusions were recorded in this run.

All runs use ImageNet MobileNetV3Large, a new seven-class classifier, batch size 32, seed 42, class weights, five head epochs at Adam 0.001, ten fine-tuning epochs at Adam 0.00001, stage-specific minimum-validation-loss checkpoints, and validation-only temperature fitting. V4.3.0 does not continue training the old V4.1.1 model weights.

The primary application comparison is Background versus Combined, so both the background pool and local-light policy differ. The more controlled recipe comparison is V4.1.1 Combined versus V4.3.0 Combined: both include local light and background replacement, but the scene pool expands from 62 to 200. Those two old V4.1.1 recipes have equal selected report counts. A single new run, new fitted gate, and reused reports cannot isolate a causal benefit from the added backgrounds. More scenes did not add foreground mango specimens or increase replacement coverage.

## Paired changes on the same photos

Hash-based matching compares photos individually rather than inferring behavior from equal totals:

- **Mango test:** all 393 returned decisions are identical between V4.1.1 Background/Combined and V4.3.0: 376 accepted and 17 uncertain. The raw top class changes on one rejected Bacterial Black Spot photo, `Bc234.jpg`; V4.1.1 is correct there and V4.3.0 predicts Mango Scab. Both reject it.
- **Old OOD report:** 20 accepted by both, 54 rejected by both, six newly rejected by V4.3.0, and four newly falsely accepted. The net improvement of two hides these ten changed acceptance decisions.
- **Reused newer OOD report:** one falsely accepted by both, 27 rejected by both, and four newly falsely accepted by V4.3.0. No old false accept becomes a rejection.

The three accepted mango mistakes are unchanged: `Bc103.jpg` and `Bc153.jpg` are Bacterial Black Spot returned as Mango Scab; `Sc154.jpg` is Mango Scab returned as Bacterial Black Spot. The selected mango test has no accepted healthy-to-disease, disease-to-healthy, or healthy-organ errors, but 393 reused photos cannot establish their absence in field use.

Full paired rows, changed decisions, accepted mistakes, and the independent calculation summary are under [`artifacts/review/`](artifacts/review/). These are new analyses of saved predictions, not additional model inference or altered original reports.

## Class and confidence limits

Raw Bacterial Black Spot recall falls from 42/45 = 93.33% to 41/45 = 91.11%; its F1 falls from 0.9545 to 0.9425. Raw Mango Scab F1 falls from 0.9429 to 0.9296 because one extra Bacterial Black Spot photo enters its predicted class. Other raw class metrics match. Healthy Fruit is correct on 17/17 raw test photos, but the selected gate accepts only 15 and rejects two. The class has only 77 training and 16 validation photos; a perfect raw test percentage is a small-sample observation.

Selected validation retention is especially lower for Bacterial Black Spot (35/44 = 79.55%) and Mango Scab (25/34 = 73.53%) despite the global 95% rule. The model can therefore refuse many genuine fruit disease photos while meeting the overall retention target.

V4.3.0 temperature is 1.1602258301498714, compared with Background's 1.162061222701274. Validation NLL changes from 0.0895712 before calibration to 0.0882013 after; the slight reduction verifies the saved calibration calculation, not a general calibration guarantee. Test NLL is 0.0660527 versus 0.0641241 for Background; lower is better, so this measure also does not improve. Temperature is already folded into exported weights and must not be applied again.

The selected gate is confidence >= 0.70, top-two margin >= 0, normalized entropy <= 0.42. The independent search reproduces this optimum and the 372 validation-acceptance floor. Margin zero means no additional margin restriction. At confidence >= 0.70, the runner-up cannot exceed 0.30, so any margin threshold <= 0.40 is redundant; tie-breaking chooses the smaller margin. The looser numerical entropy limit is fitted to different scores and must not be copied onto V4.1.1 weights.

A saved-score sensitivity calculation explains that tradeoff. Applying entropy 0.37 or 0.38 to V4.3.0 gives 371 validation acceptances, failing the preset floor by one. At 0.42, correctly predicted validation Mango Scab `Sc24.jpg` is also accepted (confidence 0.7093754, entropy 0.4102781), reaching 372. The older limits would accept 23 old-report OOD photos and respectively one or two newer-report photos; 0.42 accepts 24 and five. Mango test returned decisions do not change. This is retrospective analysis of saved scores, not a retuned export: the exported V4.3.0 gate remains the originally frozen 0.42. The preserved V4.1.1 Background config uses its own frozen 0.38 gate.

## Background replacement and lighting evidence

All 200 approved scenes are unique by file bytes and decoded RGB content: 62 old plus 138 new. The frozen seeded schedule contains 273 replacement presentations involving all 66 approved foreground mango photos. Across 15 epochs there are 27,285 total training presentations; replacement is 1.00055% of them. A presentation means showing one photo during one epoch, not creating another labeled dataset image.

Actual scene use is 48 old scenes across 80 presentations and 101 new scenes across 193 presentations: 149 distinct scenes used, 51 unused. There is no guarantee every scene is sampled. The 30% replacement chance applies only to the 66 approved foregrounds, not all 1,819 training photos. Anthracnose, Bacterial Canker, and Healthy Fruit have zero approved/replaced foregrounds in this run. The class counts and every epoch are in [`training_counts.json`](artifacts/review/training_counts.json).

Those are **whole-run counts across all 15 epochs**. The exported model restores epoch 14, so its retained training path includes **256 replacement presentations and 143 scenes (47 old and 96 new)**. Epoch 15 introduced six additional scenes but its weights were discarded. All 66 foregrounds had received replacement by epoch 14. Do not describe all 149 scenes as exposures retained in the exported checkpoint.

The reconstructed local-light policy applies 8,194 times (30.03% of all training presentations): 4,123 highlights and 4,071 shadows, including 78 presentations with both light and replacement. These counts reconstruct deterministic loader choices; exact stochastic Keras flip/rotation/zoom/shear/brightness tensors were not saved. Loader inspection confirms these scene/light inputs are fed to `model.fit`; validation and test use their original backgrounds without training augmentation.

## Concrete review caveats

1. **Scene suitability review was too broad.** All scenes were approved with no exclusion notes, although the notebook's review guidance says to avoid text and people. Verified frozen examples include scene `735a10552a52f34e3696` (monitor with game text and a person inset; used once), `534cab3e52799ecde06f` (people, dog, and guitar; used once), and `e7755db263471ef34f6c` (prominent alcohol-bottle text; used four times). These are actual scheduled inputs. Their effect on accuracy is unmeasured; they make the claim that every scene is a suitable farm background too strong. Preserve this completed run and review suitability before any future experiment.
2. **Sources and permissions remain incomplete.** The saved note says scenes came from a personal cellphone and public internet images, but does not record per-image source URLs, dates, or permissions. Hash checks establish identity, not source rights or human-review quality.
3. **Evaluation data are reused.** Neither mango test nor either OOD report is untouched final evidence. Gate freezing protects this run from direct report-driven refitting but does not erase earlier development exposure.
4. **Figure interpretation is limited.** Grad-CAM uses seven validation examples and does not prove diagnosis correctness. The Healthy Fruit example is predicted as Mango Scab at raw confidence 0.47; it would fail the 0.70 confidence gate. The augmentation preview's top Combined input is reconstructed from a scheduled choice; bottom Keras transforms are new representative draws.
5. **Browser and field evidence are separate.** File/hash checks and application build checks do not prove full TensorFlow.js/Keras prediction parity, phone speed, or accuracy on expert-labeled field photos. Those remain pending before adoption.
6. **Minor inherited notebook wording remains.** The completed training copy's final Markdown still calls itself a template with no numerical results, despite saved outputs. The threshold debug cell samples only indices 0 through 299 and is not an exhaustive review of all 393 mango test images. Neither changes training, frozen scores, or packaging. Original completed notebooks are preserved as evidence; this addendum corrects their interpretation.

## Integrity and run order

All 300 training completion hashes, 287 recovery artifact hashes, 2,603 source image hashes, 200 frozen scene identities, and 66 mask hashes match. Threshold artifacts, input/selection/evaluation locks, model identities, figure provenance, candidate ZIP entries, and the finite unquantized exported weights match. All 51,005 searched grid rows across the five compared arms, per-class/confusion/gated counts, and saved probability decisions were independently recalculated without discrepancies. Both completed notebooks contain no recorded error outputs. Their six displayed PNGs have identical decoded pixels to the saved figures even where notebook encoding differs.

Step 20 was not executed and is optional recovery. Training Steps 1 through 24 completed export; threshold Steps 1 through 12 completed selection/evaluation/packaging; training Steps 25 through 30 then created and inspected figures. This order is valid because threshold fitting requires Step 24, not the diagnostic pictures. Step 30 is a final Markdown handoff, not another executable training cell. Neither figures nor gate fitting update neural-network weights.

Original run folders and completed notebooks were preserved. See [`TRIAL_v4_3_0.md`](TRIAL_v4_3_0.md) for copy inventory, model identity, local testing, backup, and rollback.

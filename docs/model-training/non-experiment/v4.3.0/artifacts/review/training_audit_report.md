# V4.3.0 read-only training/background audit

Original training: `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v4.3.0/training/v4-3-0-training-20261001T112311Z-961e5eb7`.
Original threshold: `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v4.3.0/threshold_fitting/v4-3-0-thresholds-20261001T120051Z-e1c5cdb0`.

## Integrity and chronology

All 300 artifacts frozen by training_complete.json and all 287 recovery ledger artifacts match their SHA-256 records. Rehashed all 2,603 ZIP images; each matches its manifest. Manifest membership/order equals source_records/input_manifest.json exactly. The 2,603 retained paths and image hashes are unique. All 200 frozen background byte hashes and recomputed decoded-RGB identities match; all 200 are distinct. All 66 approved mask hashes match. All six final PNGs, the metrics CSV, both figure attempt folders, both pending publication records, and cross-run model/completion/selection/evaluation identity links match.

Training run created 2026-10-01 11:23:11 UTC; scene review 11:30:07; white review 11:32:12; mask review 11:34:23; light review 11:35:11; training complete 11:52:28. Threshold run created 12:00:51; gates selected 12:08:49; evaluation saved 12:09:20; threshold complete 12:13:50. Diagnostic figure attempt 12:25:51; evaluation figure attempt 12:28:24. These are internally coherent and match notebook paths/output IDs.

Training Steps 1-19 and 21-24 have executed cells. Step 20 has execution_count=null, no outputs, an empty recovery path, and is explicitly optional export-only recovery after disconnect. Skipping it did not skip training/export work. The threshold results have all twelve code steps with outputs, no saved errors. Diagnostic training Steps 25-29 executed in a later session (execution counts reset to 3-8). Step 30 is a Markdown evidence handoff, not a runnable cell. Completed notebook differs from template only by filled source/run paths, notes, and four review flags set True; loader, augmentation and fitting code is unchanged.

## Background coverage

The recorded 62 old + 138 new = 200 expectation is confirmed as the supported, readable, byte-unique, decoded-RGB-unique and approved pool. Automatic exclusions, manual exclusions, within-pool similarity flags and scene/mango/OOD flags are all empty. Hence countMismatchAcknowledged=false and countMismatchNotes=null are correct. The smaller used scene count is sampling coverage, not an inventory discrepancy.

| Pool | Approved unique | Used unique across 15 epochs | Unused unique | Replacement presentations |
|---|---:|---:|---:|---:|
| old | 62 | 48 | 14 | 80 |
| new | 138 | 101 | 37 | 193 |

Background sampling exactly recomputes the stored 273-row schedule using the notebook SHA-256 seed rule and Python random.Random. All 66 approved foreground content hashes are unique, and all 66 were replaced at least once. Replacement is a different presentation of an existing training image; it does not add 273 new photos or change the split.

| Class | Train photos | Approved/replaced unique foregrounds | Replacement presentations | Class presentation share | Light presentations | BG + light |
|---|---:|---:|---:|---:|---:|---:|
| anthracnose | 339 | 0/0 | 0 | 0.000000% | 1517 | 0 |
| bacterial_black_spot | 207 | 15/15 | 57 | 1.835749% | 916 | 17 |
| bacterial_canker | 343 | 0/0 | 0 | 0.000000% | 1566 | 0 |
| healthy_fruit | 77 | 0/0 | 0 | 0.000000% | 350 | 0 |
| healthy_leaf | 347 | 42/42 | 178 | 3.419789% | 1504 | 48 |
| mango_scab | 157 | 3/3 | 13 | 0.552017% | 764 | 6 |
| sooty_mold | 349 | 6/6 | 25 | 0.477555% | 1577 | 7 |

Denominator: 1,819 training photos × 15 epochs = 27,285 presentations. Scene replacement: 273/27,285 = 1.0005497526%; expected policy share: 0.30 × 66/1,819 = 1.0885101704%. The 30% blend probability is conditional on having an approved mask, not a promise that 30% of all training presentations or all 200 scenes are used.

| Epoch (1 based) | Bacterial black spot | Healthy leaf | Mango scab | Sooty mold | Total scenes | Light | BG + light |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 5 | 9 | 2 | 2 | 18 | 558 | 7 |
| 2 | 3 | 10 | 0 | 2 | 15 | 565 | 3 |
| 3 | 1 | 14 | 0 | 2 | 17 | 520 | 3 |
| 4 | 4 | 11 | 1 | 0 | 16 | 517 | 1 |
| 5 | 3 | 11 | 1 | 2 | 17 | 552 | 5 |
| 6 | 5 | 15 | 1 | 3 | 24 | 544 | 7 |
| 7 | 3 | 13 | 1 | 1 | 18 | 547 | 8 |
| 8 | 4 | 11 | 1 | 0 | 16 | 558 | 4 |
| 9 | 3 | 12 | 1 | 1 | 17 | 572 | 4 |
| 10 | 4 | 10 | 1 | 1 | 16 | 533 | 8 |
| 11 | 3 | 11 | 1 | 2 | 17 | 548 | 5 |
| 12 | 5 | 17 | 1 | 3 | 26 | 551 | 5 |
| 13 | 7 | 10 | 0 | 3 | 20 | 539 | 6 |
| 14 | 6 | 11 | 1 | 1 | 19 | 569 | 5 |
| 15 | 1 | 13 | 1 | 2 | 17 | 521 | 7 |

Anthracnose, bacterial canker, and healthy fruit receive zero background replacements in every epoch. Local lighting independently applies to all classes. Recomputed deterministic lighting decisions: 8,194/27,285 = 30.031152648%, with 4,123 highlights and 4,071 shadows, covering 1,809 distinct train photos at least once. Both scene+light: 78; scene only: 195; local light only: 8,116; neither: 18,896. Base Keras transforms still apply to every training sample, including the neither group.

## Actual fitting path and checkpoint

`model.fit(make_dataset(train_rows, arm, completed_epochs, augmentation), validation_data=make_dataset(val_rows), epochs=1, class_weight=...)` calls the combined loader, which applies approved alpha masks/backgrounds according to the frozen schedule, independently applies local light, then applies flip/rotation/zoom/shear/global brightness in tf.data. It is not a preview-only background pipeline. Augmented input guards require train rows; unaugmented helpers require validation rows. Training never predicts the 393 test images or OOD. Validation uses the unchanged resize/decode with no scene/light/Keras augmentation. Later threshold reports use their own unaugmented prediction path.

Five frozen-backbone epochs use Adam 0.001, then ten fine-tuning epochs use Adam 0.00001 with BatchNorm frozen. Minimum validation loss selects weights separately within each stage. Stage 1 best is global epoch 5 (val_loss 0.13250292837619781, val_accuracy 0.9514066576957703). Stage 2 best is global epoch 14 / fine-tuning epoch 9 (val_loss 0.08957116305828094, val_accuracy 0.9693094491958618). Last epoch 15 (val_loss 0.09271787852048874, val_accuracy 0.9590792655944824) is restored away before calibration. Temperature 1.1602258301498714 is fitted on validation NLL and folded once into the logits weights. No GPU/inference was rerun during this audit.

The 149-used-scenes/273-presentations table describes all actual fit epochs. Through the selected epoch-14 checkpoint there were 143 unique scenes (47 old + 96 new) and 256 replacements (76 old + 180 new); all 66 foregrounds were already replaced. Six scene identities first appeared only in the discarded last epoch. Best checkpoint files themselves are outside the completion artifact hash ledger; loss selection is supported by unchanged code and saved history, not an independent HDF5 weight comparison in this audit.

## Figures and review limitations

Final authoritative figures live in figures/. figure_attempts/ holds the two successful staging/publication sources (2 training PNGs, 3 evaluation PNGs + CSV). Matching pending.json records remain because finish_pending_figure_phase never deletes them; final provenance exists and all copies match, so pending filenames do not mean these phases are incomplete. The Step 28 printed attempt path is the local rendering variable, while publication copied the same files to final figures/. The training curves depict all 15 saved epochs rather than only the selected checkpoint.

The augmentation chart reconstructs the selected scheduled pre-Keras combined input; the other three top columns isolate effects. Bottom transforms are new representative random draws, not recovered fit tensors. Grad-CAM uses one raw validation prediction per class and does not establish accuracy; the chosen healthy-fruit example is predicted mango_scab with raw confidence 0.47039031982421875. The charts are correctly marked diagnostic.

Scene suitability remains a review-quality limitation. All nine scene contact sheets and all nine mask contact sheets were inspected in this audit. Concrete approved sampled scenes contain people or prominent text despite the Step 6 exclusion instruction. Exact IDs, hashes, and uses are in training_scene_suitability.json. Root independently confirmed the monitor/person inset, people/dog/guitar, and alcohol bottle files. Visibility in composites depends on masks/cropping. This is not numerical or hash corruption and does not itself invalidate a local experimental installation.

The source note only says photos came from own cellphone and public internet; it does not record per-image sources, collection dates, rights, or new-collection details requested by the notebook. Blanket review notes and true booleans attest review, but cannot prove all pages were inspected appropriately. Byte/RGB uniqueness and no pHash flags do not prove independent places, capture conditions, or absence of semantically unsuitable content. At contact-sheet resolution, masks preserve visible mango subjects and lesion areas; no quantitative segmentation/halo evaluation was performed.

Minor notebook wording: completed Post_Training notebook retains the final template sentence “This notebook template has no completed V4.3.0 numerical results.” Its saved outputs clearly contain completed results; this inherited sentence should not be interpreted as evidence that training was incomplete.

No originals, tracked notebooks, docs, product files, tools, hooks or workflows were changed by this sub-audit. Only .tools/v430-results-review scratch artifacts were written. Documentation-impact review: audit-only work requires no source documentation changes; release/adoption remains outside these checks.

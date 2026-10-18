# V5.0.0 evaluation and paired V4.5.0 review

**Later follow-up:** This independent saved-evidence audit preceded the local matched browser run. See the [combined review](../../RESULTS_REVIEW_v5_0_0.md#matched-browser-follow-up) for the later V4.5/V5 results on identical 995 images. Its runtime results are separate from this Colab audit.

Review date: October 19, 2026. Scope: saved results and image inspection only. No supplied code or notebook cells were executed; model weights, thresholds, labels and reporting membership were not changed.

## Conclusion

V5 is suitable for reversible local candidate testing. The supplied evidence does not establish that V5 is better overall than the active confidence-only V4.5 model. On the exact same historical 397 mango photos, both models produce 377 correct accepted diagnoses, 12 wrong accepted diagnoses and eight rejections. V5 has one fewer raw-correct prediction, although that changed example is rejected by both models. V5 separately rejects 942/995 new broad unsupported photographs, leaving 53 accepted unsupported examples under the saved AI-assisted scope labels.

A direct OOD ranking requires both models to be evaluated at their fixed settings on the same frozen 995-image pool. The historical V4.5 250-image OOD report has different inputs and cannot settle that ranking. No additional training or threshold changes are justified merely to improve these reported numbers.

## Verified evidence identity

- Source reporting run: `C:\Users\My Pc\Desktop\workspace\capstone\model\brain\v5.0.0\evaluation\v5-0-0-report-20261018T211040Z-e49c5359`.
- Source training run: `C:\Users\My Pc\Desktop\workspace\capstone\model\brain\v5.0.0\training\v5-0-0-oe-finetune-20261018T153838Z-5a6fce69`.
- Executed reporting notebook: `notebooks/experiment/v5.0.0/MangoLeaf_AI_Evaluate_v5_0_0_Reults.ipynb`.
- Completion receipt SHA-256: `2e261f0b200c9cd2e8cdf7c25ba74af7af005f693af9ea3134ddeac0ac41ed0c`.
- Calibrated Keras model SHA-256: `4e124aa15875e180736e818732a0e899483caaf9b71e8640ad44a1308b53dc1f`.
- Frozen helper SHA-256: `1c38d9d592028ce2497281ce9855c7aa5718aac2065a4b2e96394bbe93e3fe8d`.

All 58 completion-receipt artifacts and all three lock-receipt artifacts match their recorded SHA-256 and byte lengths. No extra unreceipted file is present. The report references the supplied sealed training receipt and the supplied calibrated model exactly. All 995 prediction IDs match the locked retained pool, all probabilities are finite and valid, each predicted class equals the argmax, confidence equals that maximum, and rejection equals confidence below 0.70. Margin and entropy remain disabled. The 995 retained local original images match the saved byte identities.

The executed reporting notebook has no saved error outputs. Its six executed code cells identify the same report run, import 995 retained/five excluded scope rows, print 995/942/53, and confirm the completion receipt exists. Notebook outputs are corroboration; hash checks above bind the actual saved files.

## Fresh unsupported-image report

| Outcome | Saved/recomputed result |
| --- | --- |
| Candidates screened | 1000 |
| Retained for reporting | 995 |
| Rejected below 70% confidence | 942 / 995, 94.67% |
| Accepted unsupported examples | 53 / 995, 5.33% |
| Accepted scores at least 90% / 95% / 99% | 8 / 5 / 1 |
| Maximum accepted score | 99.68% |

The descriptive Wilson 95% interval for 53/995 is 4.10% to 6.90% under an independent-binomial model. It is not a field-performance confidence guarantee: sampled sources, repeated author profiles and unknown capture relationships limit that assumption. Rejection on this broad internet collection is not seven-class mango accuracy.

### Accepted diagnoses assigned to unsupported photos

| Assigned class | Accepted photos |
| --- | --- |
| bacterial_black_spot | 19 |
| bacterial_canker | 11 |
| anthracnose | 8 |
| sooty_mold | 8 |
| healthy_fruit | 4 |
| healthy_leaf | 2 |
| mango_scab | 1 |

All 53 accepted originals were visually inspected on [sheet 1](../../figures/review/accepted-ood-1.jpg) and [sheet 2](../../figures/review/accepted-ood-2.jpg); six were also opened at original size. Observed subjects include dogs, birds, reptiles, insects, people, shoes, a dress, documents/graphics, food and non-target scenes. The highest-scoring failure is a small damaged seed/bean held in fingers, assigned anthracnose at 99.68%. A millimeter-scale jaw/bone specimen is assigned sooty mold at 97.58%. These are concrete signs of confident unsupported-image acceptance, not evidence of the internal features responsible.

One jarred processed-fruit example has unverified fruit species. The completed pre-report AI-assisted scope label is preserved, with this uncertainty visible. This post-report inspection did not remove difficult examples, relabel the pool, tune thresholds or recompute a more favorable denominator.

### Scope and independence limits

All 1,000 candidates were screened before predictions on 20 numbered sheets, with 17 full-size checks. Five uncertain/unidentifiable examples were excluded, leaving 995. Scope labels are AI-assisted rather than expert-validated botanical ground truth. The user declared that the collection was not used for training, temperature fitting, checkpoint selection or threshold tuning. This is a declaration, not an independently observed history.

Recomputed recorded metadata finds zero byte matches, zero decoded-RGB matches and zero pHash-distance-at-most-five matches against 5,160 supplied mango/OE records. All 5,160 historical source and capture fields are blank. The retained 995 record 945 author-profile groups and no capture groups. Absence of exact/perceptual matches does not prove source/capture independence.

## Paired historical mango comparison

The comparison joins all 397 rows by full image SHA-256 and confirms identical actual labels. Both columns use confidence at least 0.70, with margin and entropy disabled. The older entropy-fitted V4.5 rule is historical and is not the active baseline here.

| Outcome | V4.5.0 active gate | V5.0.0 candidate |
| --- | --- | --- |
| Raw correct / all | 384/397, 96.73% | 383/397, 96.47% |
| Accepted photos | 389/397 | 389/397 |
| Correct accepted / all | 377/397, 94.96% | 377/397, 94.96% |
| Wrong accepted / all | 12/397, 3.02% | 12/397, 3.02% |
| Rejected mango photos | 8/397, 2.02% | 8/397, 2.02% |
| Accuracy among accepted only | 377/389, 96.92% | 377/389, 96.92% |
| Raw macro F1 | 95.46% | 95.10% |
| Gated macro F1 | 93.93% | 94.05% |

All 12 wrong accepted photo/class pairs persist unchanged: nine black-spot photos are called scab, two scab photos are called black spot, and one sooty-mold photo is called anthracnose. The primary within-mango confusion has not been resolved.

Only three images change argmax or acceptance:

| Source photo | V4.5.0 | V5.0.0 |
| --- | --- | --- |
| `Bc268.jpg`, actual black spot | Correct black spot, 69.39%, rejected | Correct black spot, 82.73%, accepted |
| `HealthyLeaf_2.jpg`, actual healthy leaf | Correct healthy leaf, 82.33%, accepted | Correct healthy leaf, 51.80%, rejected |
| `Scab1.JPG`, actual scab | Correct scab, 50.21%, rejected | Wrong black spot, 56.45%, rejected |

The first two changes offset each other in overall correct accepted counts. The third lowers raw accuracy by one example without changing the rejection-aware outcome. Historical full-input outcomes tie; V5 improves black-spot accepted recall by one photo and loses one healthy-leaf accepted photo.

### Per-class outcomes

Each cell keeps all actual-class photos in its denominator.

| Actual class | Support | V4.5 raw correct | V5 raw correct | V4.5 correct accepted | V5 correct accepted | V4.5 / V5 rejected |
| --- | --- | --- | --- | --- | --- | --- |
| anthracnose | 74 | 74 | 74 | 74 | 74 | 0 / 0 |
| bacterial_black_spot | 45 | 35 | 35 | 31 | 32 | 5 / 4 |
| bacterial_canker | 75 | 75 | 75 | 75 | 75 | 0 / 0 |
| healthy_fruit | 18 | 18 | 18 | 17 | 17 | 1 / 1 |
| healthy_leaf | 75 | 75 | 75 | 75 | 74 | 0 / 1 |
| mango_scab | 34 | 32 | 31 | 30 | 30 | 2 / 2 |
| sooty_mold | 76 | 75 | 75 | 75 | 75 | 0 / 0 |

### Probability-quality diagnostics

These are recomputed descriptive metrics on the same historical test rows, not a new calibration fit. Lower is better for each metric.

| Metric | V4.5.0 | V5.0.0 |
| --- | --- | --- |
| Mean negative log likelihood | 0.123981178 | 0.123978012 |
| Multiclass Brier score | 0.062288654 | 0.062286216 |
| Expected calibration error, ten equal-width bins | 2.48% | 2.63% |

Negative log likelihood and Brier differences are extremely small; the ten-bin calibration error is slightly higher for V5. Bin choice affects that calibration diagnostic. These mixed, tiny differences do not establish meaningful overall probability-quality improvement.

## OOD comparison that is and is not supported

The historical active V4.5 confidence-only report rejects 241/250 and accepts nine unsupported photos, a 3.60% acceptance rate. V5 rejects 942/995 and accepts 53, a 5.33% acceptance rate. These are different pools, so neither percentage proves one model rejects unsupported photos better. V5 also uses all 500 older OOD photos as OE training inputs; replaying that older pool under V5 would measure training exposure.

A useful next comparison would run the preserved V4.5 model against the same locked 995 originals, without changing thresholds, membership or V5 outputs. Report paired outcomes, including cases rejected only by V4.5 or only by V5. Any later tuning based on this report consumes its reporting role and requires an independent pool for a new generalization claim.

## Runtime and remaining checks

The reporting runtime records Python 3.12.13, TensorFlow 2.19.0 and one GPU. Its audited scientific dependency subset passes, while the Colab provider `pip check` return code is 1 and is preserved rather than concealed. The report explicitly records unchanged model weights, browser parity not measured, and adoption false. A valid completion receipt establishes completion of this reporting workflow; it does not establish browser/Keras numerical parity, native-camera reliability, physical-device results, independently collected field accuracy or deployment.

## Copy and backup recommendations

- Copy selected immutable source files into artifacts/training and artifacts/evaluation while preserving original relative paths and original completion receipts; keep original source runs unchanged.
- Copy source PNG figures into figures/training. Keep original evaluation contact sheets under figures/evaluation/fresh_ood_review; current contact sheets are derived post-report error-review material and belong under a separately identified review folder.
- Record all selected-copy relative destinations and original source hashes in a new archive provenance manifest. An omitted source file must be identified as omitted; do not rewrite original receipts.
- Keep full Keras weights and raw image pools out of public/model. public/model should contain the exported TFJS graph, referenced weight shards and compatible model_config.json only.
- Before local candidate installation, save a complete hash-verified copy of current V4.5 public/model and the active model version/preprocessing/gate settings. Test rollback by checksum. Mark V5 as a local candidate, not adopted or deployed.
- Preserve executed notebooks including their outputs and original notebook filenames/identities; if renaming the Reults typo, record the original name/hash separately and update links.

## Complete accepted-example ledger

These are saved scores and descriptive visual observations, not verified probabilities of correct diagnosis.

| # | Filename | Assigned class | Confidence | Visible subject |
| --- | --- | --- | --- | --- |
| 1 | `5b58df3e6289cf40.jpg` | anthracnose | 99.68% | A small damaged seed/bean held between fingers; exact species not established. |
| 2 | `d9292474d7978f07.jpg` | sooty_mold | 97.58% | A millimeter-scale jaw/bone specimen with tooth-like structures and a scale bar. |
| 3 | `b15e3f00702fece6.jpg` | bacterial_black_spot | 96.03% | Gold mirrored/disco-ball graphic. |
| 4 | `f0d4e4829b720b11.jpg` | sooty_mold | 96.00% | Green dress product photograph. |
| 5 | `4c59262d4c44c5a6.jpg` | sooty_mold | 95.41% | Black boot product photograph. |
| 6 | `3e2b05cbaed570e4.jpg` | anthracnose | 93.52% | Green snake among leaves. |
| 7 | `bd6577963b809683.jpg` | bacterial_black_spot | 92.40% | Spotted domestic dog. |
| 8 | `65d506d1af76242e.jpg` | bacterial_black_spot | 90.09% | Bird on a branch. |
| 9 | `25172ce2ec3756a8.jpg` | anthracnose | 89.48% | Crab on sand. |
| 10 | `aaa8bd02f557fc5c.jpg` | bacterial_black_spot | 87.29% | Ocean and a marine animal at the water surface. |
| 11 | `aa94ea924fa65333.jpg` | bacterial_canker | 86.34% | A worn or cracked painted wall/surface; inspected full size. |
| 12 | `353c8610de9283c1.jpg` | healthy_fruit | 85.92% | Green soup in a bowl. |
| 13 | `0b44f28fa177010c.jpg` | bacterial_canker | 84.40% | White domestic dog. |
| 14 | `69caa4b44d14310a.jpg` | sooty_mold | 83.53% | Red high-heeled shoe product photograph. |
| 15 | `df4a83986db3556b.jpg` | anthracnose | 83.20% | Person posing beside a pool float. |
| 16 | `cb253006c68125ba.jpg` | bacterial_black_spot | 82.97% | Spider on a brick surface. |
| 17 | `22d4d11c1784f52b.jpg` | anthracnose | 82.92% | Grasshopper-like insect on ground. |
| 18 | `16a5bb4322ddc426.jpg` | bacterial_black_spot | 82.58% | Koala-like mammal. |
| 19 | `6457afd6f3730403.jpg` | bacterial_black_spot | 81.71% | Lizard. |
| 20 | `71a9fd73ccdc9d69.jpg` | bacterial_black_spot | 81.63% | Primate in a tree. |
| 21 | `2304c3e074765cb6.jpg` | bacterial_black_spot | 81.52% | Large bird in a nest. |
| 22 | `1c9b9a0d7907df88.jpg` | sooty_mold | 80.61% | Human hand with writing. |
| 23 | `adbc1b2b19eec3a7.jpg` | bacterial_canker | 80.61% | Certificates or printed documents. |
| 24 | `cdcf0e9d2f37c190.jpg` | bacterial_black_spot | 80.13% | Domestic dog. |
| 25 | `9d5a759bad6fb3e1.jpg` | anthracnose | 80.06% | Two fish on a wooden surface. |
| 26 | `9a96742348ccecc8.jpg` | bacterial_canker | 80.05% | Handwritten text on paper. |
| 27 | `d62fd9eb0ddf9a13.jpg` | bacterial_black_spot | 79.48% | Domestic dog. |
| 28 | `6b7bf4936e01619d.jpg` | sooty_mold | 79.23% | Heeled ankle boot product photograph. |
| 29 | `de6ff4398ce50f91.jpg` | anthracnose | 79.03% | Flowers on a plant; no mango fruit or leaf diagnosis target visible. |
| 30 | `18deefd6a2a21338.jpg` | bacterial_canker | 78.55% | Rock/granite surface with a small coin for scale; inspected full size. |
| 31 | `d818030c3f473014.jpg` | healthy_fruit | 78.40% | A cake or tart on a plate. |
| 32 | `fcc7a64a32ff820c.jpg` | healthy_leaf | 77.86% | Person wearing red tights and shoes. |
| 33 | `725ebd38c195241e.jpg` | healthy_fruit | 77.04% | Sliced or preserved fruit-like contents in a jar; exact fruit species cannot be established visually. |
| 34 | `0120b68b17927977.jpg` | bacterial_canker | 76.78% | Embroidered flower design on fabric. |
| 35 | `87e975e4c6885387.jpg` | bacterial_canker | 76.75% | Black domestic dog on snow. |
| 36 | `5573d8a084ba4771.jpg` | bacterial_canker | 76.71% | Person lying on snow. |
| 37 | `022c1f420446d118.jpg` | healthy_leaf | 76.49% | Person in roller-skating/sports gear. |
| 38 | `97d737715b334efd.jpg` | bacterial_black_spot | 75.68% | Two rodent-like mammals. |
| 39 | `eee273732a3b2608.jpg` | bacterial_canker | 75.54% | Small white domestic dog on snow. |
| 40 | `3dfc41aa64a85843.jpg` | bacterial_black_spot | 75.54% | Bar-chart graphic. |
| 41 | `ce95072da9c4b610.jpg` | sooty_mold | 74.67% | Icicles or ice. |
| 42 | `1561435395442d9c.jpg` | anthracnose | 74.52% | Flower; no mango fruit or leaf diagnosis target visible. |
| 43 | `01039e3a5c729020.jpg` | bacterial_black_spot | 74.08% | Raccoon-like animals. |
| 44 | `2de4fa46ea5037cb.jpg` | bacterial_black_spot | 73.86% | Person wearing a colorful hat. |
| 45 | `1ed9b72cc4667832.jpg` | sooty_mold | 72.98% | Black high-heeled shoe product photograph. |
| 46 | `67ed8f2f2f332aae.jpg` | bacterial_canker | 72.69% | An emblem/crest on textured material. |
| 47 | `de5d7a3375722b61.jpg` | bacterial_black_spot | 71.36% | Small domestic dog. |
| 48 | `bbc1921cc7fb24fb.jpg` | mango_scab | 71.16% | Person cycling. |
| 49 | `3c9d7d205ad63381.jpg` | bacterial_black_spot | 70.79% | Dried plant-bud material in a jar; inspected full size; no mango leaf or fruit target visible. |
| 50 | `c640616034445299.jpg` | healthy_fruit | 70.56% | Portrait of a person. |
| 51 | `ed239716233bac2b.jpg` | bacterial_canker | 70.27% | White domestic cat. |
| 52 | `d871866d69f583d1.jpg` | bacterial_black_spot | 70.16% | Small speaker-like electronic object. |
| 53 | `3b05534cd5c3e2c4.jpg` | bacterial_black_spot | 70.04% | A slice of crumb-topped cake. |

Full source hashes, receipt checks, original prediction rows, excluded rows, pairwise transitions, per-class metrics and visual observations are preserved in [evaluation-audit.json](evaluation-audit.json). Originals remain unchanged.

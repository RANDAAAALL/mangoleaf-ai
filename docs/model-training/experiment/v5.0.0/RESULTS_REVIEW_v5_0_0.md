# V5.0.0 results, V4.5.0 comparison, and local candidate test

Review date: October 19, 2026. V5 is a completed experimental model installed for the requested reversible local test. V4.5 remains the adopted baseline. No deployment, adoption, threshold tuning, or additional training is included in this review.

## Decision

**V5 is better at rejecting unsupported photos on the matched local browser pool: 45/995 false accepts versus V4.5's 95/995.** That is a 5.03 percentage-point reduction, or 52.63% fewer false accepts on these same images. Accepted mango correctness is tied. This supports trying V5 locally for improved rejection, while preserving the V4.5 rollback; it does not establish an overall field-performance winner.

**The saved mango results do not show an overall V5 improvement.** On the exact same 397 photos and the active confidence-only 0.70 rule, both versions produce 377 correct accepted diagnoses, 12 wrong accepted diagnoses, and eight rejections. V5 has one fewer raw-correct prediction. Lower validation loss and a larger training OE pool do not by themselves establish a better diagnostic model.

V5's separate Colab report rejects 942 of 995 broad unsupported internet photographs. Its 53 accepted examples include animals, people, clothing, food, graphics, and scenery, sometimes with very high confidence. These measurements support local testing with known limitations. They do not establish universal unsupported-image rejection or independently measured field accuracy.

The historical V4.5 OOD reporting pool contains 250 different photographs. Its confidence-only 9/250 false accepts cannot be directly ranked against V5's 53/995. The matched browser follow-up below uses identical images and settings for both models and is recorded separately from the original Colab report.

## Runs and preserved originals

| Item                      | Identity                                                           |
| ------------------------- | ------------------------------------------------------------------ |
| Training                  | `v5-0-0-oe-finetune-20261018T153838Z-5a6fce69`                     |
| Later reporting           | `v5-0-0-report-20261018T211040Z-e49c5359`                          |
| Source root               | `C:/Users/My Pc/Desktop/workspace/capstone/model/brain/v5.0.0/`    |
| Training receipt SHA-256  | `b16c880e9ba571d19a85898634daa54d73cb5270c5df424009c3674471e722b2` |
| Reporting receipt SHA-256 | `2e261f0b200c9cd2e8cdf7c25ba74af7af005f693af9ea3134ddeac0ac41ed0c` |
| Calibrated Keras SHA-256  | `4e124aa15875e180736e818732a0e899483caaf9b71e8640ad44a1308b53dc1f` |
| Browser graph SHA-256     | `b3e3ae0550f6f2dcb7990aad3e042e385b465315c92c8031dbc29c7750f7bbc8` |

The [copy manifest](artifacts/evidence_copy_manifest.json) maps 130 independent byte-identical evidence copies to their source paths. Original source files were copied, never moved or rewritten. Original training/reporting receipts remain unchanged, including the training handoff's then-pending fresh-OOD status. The later reporting receipt supplies that completion separately. Large Python weight/SavedModel bundles and disposable converter probe models remain in the supplied source folder rather than being duplicated into the documentation archive.

The [executed training notebook](../../../../notebooks/experiment/v5.0.0/MangoLeaf_AI_OE_Fine_Tuning_v5_0_0_Post_Training.ipynb) and [executed evaluation notebook](../../../../notebooks/experiment/v5.0.0/MangoLeaf_AI_Evaluate_v5_0_0_Reults.ipynb) retain their original bytes, cells, outputs, and filenames. The supplied `Reults` spelling is intentional preservation. Both have completed outputs and no saved error outputs. The missing reusable helper was recovered byte for byte from the sealed run. Only the supplied unexecuted, collection-specific evaluation copy replaced its Colab `%run` with equivalent `runpy.run_path` so the ordinary-Python verifier can parse it; its prior bytes are preserved in the ignored local review workspace. No completed notebook was rewritten.

## Independent audits

Two agents separately reviewed training and reporting without executing supplied notebook/Python code or loading Keras models:

- [Training audit](artifacts/review/training-audit.md), with [machine-readable calculations](artifacts/review/training-audit.json).
- [Evaluation and paired comparison audit](artifacts/review/EVALUATION_REVIEW_v5_0_0.md), with [full findings and 53 accepted examples](artifacts/review/evaluation-audit.json).

All 86 training-completion artifact hashes and lengths pass. Frozen-input, training, calibration, evaluation, export, and figure ledgers also pass. All 58 reporting-completion artifacts and three reporting-lock artifacts pass. The later report binds the exact supplied training receipt, model, helper, retained membership, and review files. CSV identities, all seven probability values, argmax labels, confidence, gate decisions, totals, and confusion matrices were independently recomputed.

The 995 retained local image files also match the reporting lock by byte hash. Training images are not included in the supplied V5 run folder: historical mango/OE pixel fingerprints were checked as receipt-bound metadata rather than freshly decoded from original training photos.

## Training and calibration

The model warm-starts from V4.5's uncalibrated stage-two checkpoint, not its temperature-folded browser weights. Five epochs are the frozen fine-tuning plan, not an incomplete scratch-training schedule. Settings remain learning rate `1e-5`, batch size 16, OE loss weight 0.5, seed 42, fresh Adam, and 46 frozen BatchNormalization layers. The model retains seven outputs; OE uses a uniform seven-class target and does not introduce an eighth class.

- Mango membership is unchanged: **1,854 train / 398 validation / 397 test**.
- OE expands from 2,011 to **2,511** by adding the old 500-photo OOD pool. All 2,511 unique OE images were exposed; the successful-step exposure count is 9,277 samples.
- Epoch five is selected by clean, unweighted mango validation loss, **0.07593610**, below the parent epoch-zero **0.08137137**. Epoch-five validation accuracy is **383/398, 96.23%**.
- Validation-only temperature is **0.9095991057**, folded into the exported classifier once. Independent recomputation gives NLL **0.07593609 before / 0.075536995 after**; saved probabilities agree with softmax(logits/temperature) within `4.38e-7`. Calibration leaves argmax unchanged.

See the original [plan](artifacts/training/plan.json), [history](artifacts/training/training_history.json), [checkpoint selection](artifacts/training/checkpoint_selection.json), [temperature](artifacts/training/temperature.json), and [OE exposure](artifacts/training/oe_exposure.json). The old 500 OOD photos are now training inputs and cannot be used as unseen V5 reporting evidence.

No recorded byte/decoded overlap exists across the preserved mango subsets or between mango and OE. Recomputed cross-subset pHash distance <=5 checks also find no flags. These checks do not prove specimen/source independence: the 5,160 historical mango/OE source and capture fields are blank, and the research photographs have been reused across experiments.

## Same-photo mango comparison

All 397 rows join one to one by SHA-256 with matching labels. V4.5 uses its currently adopted confidence-only rule, not the older entropy-fitted rule. Sources: [V5 test rows](artifacts/training/mango_test_predictions.csv) and [V4.5 confidence-only rows](../../non-experiment/v4.5.0/artifacts/threshold_fitting/confidence_only_mango_test_predictions.csv).

| Metric                   | V4.5.0              | V5.0.0              |
| ------------------------ | ------------------- | ------------------- |
| Raw correct / all        | 384/397, **96.73%** | 383/397, **96.47%** |
| Correct accepted / all   | 377/397, **94.96%** | 377/397, **94.96%** |
| Wrong accepted / all     | 12/397, **3.02%**   | 12/397, **3.02%**   |
| Rejected / all           | 8/397, **2.02%**    | 8/397, **2.02%**    |
| Correct among accepted   | 377/389, **96.92%** | 377/389, **96.92%** |
| Raw macro F1             | 95.46%              | 95.10%              |
| Rejection-aware macro F1 | 93.93%              | 94.05%              |

Macro F1 averages class F1 values equally; it differs from overall correctness. The small rejection-aware change reflects the class-specific acceptance swap below, while total accepted correctness is tied. Mean test negative log-likelihood is effectively unchanged (0.12398118 versus 0.12397801). These descriptive differences on reused study data do not establish a meaningful field improvement.

The tied totals hide two acceptance changes. `Bc268.jpg` becomes correctly accepted as black spot (69.39% to 82.73%). `HealthyLeaf_2.jpg` becomes rejected (82.33% to 51.80%). `Scab1.JPG` changes from raw-correct scab to raw-wrong black spot, while both versions reject it. All 12 wrong accepted diagnoses persist on the same photos and with the same assigned classes: nine black-spot photos as scab, two scab photos as black spot, and one sooty-mold photo as anthracnose.

| True class           | Support | V5 raw correct | V5 correct accepted | V5 wrong accepted | V5 rejected |
| -------------------- | ------- | -------------- | ------------------- | ----------------- | ----------- |
| Anthracnose          | 74      | 74             | 74                  | 0                 | 0           |
| Bacterial black spot | 45      | 35             | 32                  | 9                 | 4           |
| Bacterial canker     | 75      | 75             | 75                  | 0                 | 0           |
| Healthy fruit        | 18      | 18             | 17                  | 0                 | 1           |
| Healthy leaf         | 75      | 75             | 74                  | 0                 | 1           |
| Mango scab           | 34      | 31             | 30                  | 2                 | 2           |
| Sooty mold           | 76      | 75             | 75                  | 1                 | 0           |

This is an exploratory paired comparison on a reused study test set. It establishes the recorded changes on these photos, not independent field superiority. Black-spot/scab confusion remains the principal visible class weakness.

## Fresh unsupported-image report

The collection sampled the 41,620-image public Open Images CVDF bounding-box validation mirror, with publisher-resized image bytes up to 1024 pixels. It is not a sample of the entire nine-million-image training table originally discussed. Of 1,000 candidates screened before inference, five uncertain/unidentifiable examples were excluded and 995 retained.

| Saved Colab outcome                            | Count               |
| ---------------------------------------------- | ------------------- |
| Rejected below 70%                             | **942/995, 94.67%** |
| Accepted unsupported                           | **53/995, 5.33%**   |
| Accepted with confidence >=90% / >=95% / >=99% | **8 / 5 / 1**       |

Accepted class assignments are black spot 19, canker 11, anthracnose 8, sooty mold 8, healthy fruit 4, healthy leaf 2, and scab 1. The highest score, 99.68% anthracnose, belongs to a damaged seed/bean held between fingers. A small jaw/bone specimen is assigned sooty mold at 97.58%. All 53 were inspected on [sheet one](figures/review/accepted-ood-1.jpg) and [sheet two](figures/review/accepted-ood-2.jpg), with six full-size follow-ups. These observations demonstrate confident acceptance of unrelated content; they do not explain which internal features caused it.

One processed-fruit example has uncertain fruit species. Its completed pre-report AI-assisted scope label is preserved and the later uncertainty is recorded; this review did not remove difficult examples after seeing predictions. Labels are AI-assisted screening, not expert botanical validation. Prior non-use is the user's declaration. Zero exact/decoded/pHash matches against the supplied training manifest strengthen the identity check, but unknown historical capture/source groups remain unknown. The retained collection has 945 publisher author-profile groups and no capture groups. A high rejection percentage on this collection is not disease accuracy or a guarantee for arbitrary camera photos.

## Matched browser follow-up

The local follow-up runs both fixed bundles on the same 995 retained originals through the actual production classifier, existing inference harness, browser image decoding/canvas resize, and forced-float16 WebGL setting. It uses fresh contexts, a local mock server, and locally intercepted baseline assets. Production services are blocked. Results and backend fingerprints are recorded separately from the original Keras/Colab metrics; this is not a browser/Keras numerical-parity or physical-device test.

All **1,990 predictions** completed with finite seven-class vectors and gate decisions matching raw confidence >=0.70. Chromium 153.0.8010.12 used TensorFlow.js 4.22.0, WebGL, forced-float16 textures and the recorded ANGLE/SwiftShader software renderer on Windows. These are desktop software-GPU observations, not Android measurements. The same compiled harness has the candidate display constant in both contexts; actual configuration/graph identity, independently verified against each bundle, identifies which model produced each prediction.

| Same 995 AI-assisted reviewed images | V4.5.0 browser      | V5.0.0 browser      |
| ------------------------------------ | ------------------- | ------------------- |
| Accepted unsupported                 | **95/995, 9.55%**   | **45/995, 4.52%**   |
| Rejected                             | **900/995, 90.45%** | **950/995, 95.48%** |

Both models reject 898 and both accept 43. V5 rejects 52 that V4.5 accepted, but newly accepts two that V4.5 rejected. Full-size inspection confirms both newly accepted examples are dogs: `87e975e4c6885387.jpg` is assigned canker at 73.19%, and `cdcf0e9d2f37c190.jpg` black spot at 71.68%. Thus the aggregate gain does not mean every individual decision improved.

See the [matched summary](artifacts/review/browser-ood-summary.json), [raw probabilities and runtime provenance](artifacts/review/browser-ood-comparison.json), [all paired rows](artifacts/review/browser-ood-paired.csv), and [comparison figure](figures/review/v45-v5-comparison.png). These fixed observations are separate from the Colab reporting receipt.

V5's browser result (45 accepts) differs from its Colab result (53 accepts): **20 acceptance decisions and 127 raw class assignments differ**. Fourteen Colab accepts become browser rejections, and six Colab rejections become browser accepts. Browser canvas decoding/resizing and forced-float16 inference differ from the TensorFlow image pipeline. The comparison does not isolate their respective contributions. It therefore does not establish numerical parity; canonical identical-pixel runtime comparisons remain necessary before claiming that agreement. No preprocessing, precision setting, threshold, label, model, or reporting membership was changed to improve these numbers.

## Figures and artifact layout

- [Training curves](figures/training/training_curves.png), [augmentation preview](figures/training/augmentation_preview.png), and [Grad-CAM](figures/training/grad_cam.png) are unchanged original figures. Selected validation examples and true-class heatmaps are illustrations, not independent accuracy measurements.
- [Raw confusion matrix](figures/training/confusion_matrix.png) and [raw class metrics](figures/training/per_class_metrics.png) describe predictions before rejection.
- [Rejection-aware confusion matrix](figures/training/confusion_matrix_with_rejection.png) and [rejection-aware class metrics](figures/training/per_class_metrics_with_rejection.png) keep rejected mango photos in support.
- `figures/evaluation/fresh_ood_review/` preserves the 40 original reporting contact sheets. `figures/review/` holds new, separately identified review illustrations.
- `artifacts/training/` and `artifacts/evaluation/` preserve original ledgers/predictions/runtime audits; `artifacts/review/` contains derived checks. The original browser export, including its then-pending OOD configuration flag, is preserved under `artifacts/training/tfjs_model/`.

## Local installation and rollback

`public/model/` now contains the copied V5 graph, three shards, and configuration. The [installation receipt](artifacts/local_test_installation.json) records original export hashes and active hashes. Only current status and later OOD completion/provenance metadata were added to the public configuration; weights, class order, temperature, preprocessing declaration, and thresholds are unchanged. Application label is `v5.0.0-candidate`; cache identity is `mangoleaf-model-cache-v5-0-0-candidate`; app version stays `0.7.0`.

Start local testing with `bun run dev`, then open the server URL shown in the terminal. Restart an already-running development server and reload the page so its in-memory model is replaced. For a production preview, rebuild and let the new worker activate before reloading. New candidate scans cannot reuse V4.5 duplicate predictions; previous History reports retain their original labels and bytes.

Exact V4.5 baseline backup:

```text
.tools/model-backups/v4.5.0-before-v5.0.0-local-test-20261019/
```

From the repository root, verify without changing files:

```powershell
& '.tools/model-backups/v4.5.0-before-v5.0.0-local-test-20261019/restore-model.ps1'
```

To restore V4.5 assets and matching label/cache:

```powershell
& '.tools/model-backups/v4.5.0-before-v5.0.0-local-test-20261019/restore-model.ps1' -Apply
```

The script checks the complete baseline backup and allows only recorded V5/V4.5 active assets before writing. It preserves unrelated source edits, retains candidate-cache eviction, and does not touch History. Isolated tests verified exact baseline asset restoration, label/cache restoration, repeated restoration, no-mutation dry run, and refusal before mutation when a backup is corrupted. After restoration, update current local-test status in the guides, run typecheck/lint/build, restart the server and reload. Keep the ignored backup folder: it is local and will not be restored by Git on another machine.

## Research-only push scope

The maintainer chose to publish the V5 notebooks, results, figures, workflow tooling and documentation while keeping the application on V4.5. The V5 runtime installation remains an **uncommitted local override**. A fresh checkout of the research-only commit retains V4.5 model assets, `v4.5.0` report labels, the V4.5 worker/cache and app version `0.7.0`.

Exclude these tracked paths from the commit:

- `public/model/`
- `src/lib/constants.ts`
- `src/sw.ts`
- generated `public/sw.js`

The first path covers five model files, so eight modified runtime files remain local in total. These paths are a commit-selection boundary, not an automatic ignore rule. Select research paths explicitly and inspect `git diff --cached --name-only` before committing; nothing was staged or pushed by this verification. No PWA version bump, model adoption, release tag or production promotion belongs to the research-only update. Push-triggered CI/hosting builds remain separate from release approval.

The copied export under `artifacts/training/tfjs_model/` is research evidence, separate from the excluded served bundle. Local installation/validation receipts describe the exact uncommitted test build; they do not claim that the research-only commit serves V5. The prior collection-specific unexecuted evaluation preset remains in the ignored local review workspace. The shared evaluation template now starts with unset run/pool paths, explicit review approval, and no dependency on the private local review-import kit. Both completed result notebooks retain their original bytes and outputs.

## Verification and remaining work

The [local verification record](artifacts/local_test_validation.json) identifies checks against this candidate's hashes. Scientific audit results, browser integration, offline flows, R01/R03 reliability, physical-device checks, expert review, and production promotion are separate evidence. Full physical-device and independent field evaluation remain pending and should be recorded for the exact tested model/build.

Formatting, typecheck, lint, production build, ten static-export checks, pinned secret scanning, 40 workflow safeguard checks, original/copy hash checks, and isolated rollback validation pass. The tested application fingerprint is `9018bd786093fa7f45a430e5921cf6a4e6f9314cd34747dbf0460d4cb91023ad`.

All **18 selected browser cases** pass across the recorded runs: 16 real-model M01 report/save/History cases and two real-worker R02 offline reload/History/new-inference/reconnect cases, across desktop and emulated mobile Chromium. The first run passed 14; four mobile cases lost their mock-server connection when the comparison process finished and closed that shared server. Those four passed after starting an independent server with the same build, with no application change or weaker assertion. The [UI summary](artifacts/review/ui-summary.json) preserves this interruption and both result hashes. This is focused integration evidence, not a full core-suite, R01/R03, physical-device, or disease-accuracy result.

The preserved converter audit still reports reviewed, unresolved setuptools 81 and wheel 0.45.1 advisories for operations outside the recorded conversion path. The provider's `pip check` exit code is 1. Original findings remain visible; no historical environment was installed or executed to review this model, and these statements do not certify the old packages for future reuse.

Documentation impact review covers model identity/cache behavior, local setup and rollback, notebook/evidence indexes, trial/history records, progress, performance limits, and test provenance. V5 remains under `experiment/` until an explicit adoption decision. No commit, push, tag, release, or production change was made.

# MangoLeaf AI Model Versioning Guide

Use this guide to identify the active model and understand how a replacement is adopted. Detailed experiments, original measurements, and past decisions are in the [model history](history/AI_MODEL_HISTORY.md#model-timeline).

## Local candidate test: V5.0.0 (October 19, 2026)

**October 24 status:** the maintainer ended the local V5 runtime experiment and restored actual weights, model configuration and constants from committed adopted V4.5.0. The browser worker again uses `mangoleaf-model-cache-v4-5-0` and retires the V5 model runtime cache. The normal production build regenerates `public/sw.js`; no manual worker edit is used. Existing History/photos, including V5-labeled reports, remain intact; duplicate reuse still requires an exact active-model match.

V5 notebooks, frozen artifacts, original ledgers and scientific results remain preserved under the experiment folders. An ignored byte-hashed backup retains the previous local runtime for rollback; it is not an active installation or model adoption. See the [October 24 history](history/AI_MODEL_HISTORY.md#local-v5-runtime-ended-october-24-2026), [comparison and earlier rollback procedure](../model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md), and [original local test hashes](../model-training/experiment/v5.0.0/artifacts/local_test_installation.json). Earlier V5 test hashes describe that historical candidate.

## Current adopted model: V4.5.0 (October 16, 2026)

Published app v0.10.0 and the unpublished v0.10.1 patch retain adopted V4.5.0. Local browser development now uses that same model identity instead of the retired V5 override. Phone websites remain landing/download-only; the Android APK and isolated compatibility harness perform diagnosis. Earlier [v0.9.0 preparation](history/PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026) and [v0.8.0 preparation](history/PWA_RELEASE_HISTORY.md#v080-square-camera-prepared-release-october-19-2026) retain their dated evidence.

| Item                 | Recorded value                                                    |
| -------------------- | ----------------------------------------------------------------- |
| Adopted model label  | `v4.5.0`                                                          |
| Asset identity       | `model-v4.5.0`                                                    |
| Baseline files       | `public/model/` in committed source; backup for local rollback    |
| Classification scope | Seven mango leaf/fruit classes                                    |
| Acceptance rule      | Raw confidence at least `0.70`; margin and entropy gates disabled |
| Model cache identity | `mangoleaf-model-cache-v4-5-0`                                    |

- **Adopted** means selected in repository source. It does not establish production deployment or field accuracy.
- Use the [V4.5.0 trial report](../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md) for dataset details, accuracy measures, and their limitations. Its [adoption receipt](../model-training/non-experiment/v4.5.0/artifacts/adoption_20261016.json) identifies the adopted files.
- V5.0.0 completed five fine-tuning epochs and a separate 995-photo OOD report after the earlier failed attempts. Its [review](../model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md) distinguishes the saved measurements, local browser checks, and remaining adoption/device/field checks.

## Model Versions

Treat weights, class order, preprocessing, calibration, and rejection configuration as one reviewed model bundle. Record which bundle produced each scan.

| Model change                                             | Version category | Historical example   |
| -------------------------------------------------------- | ---------------- | -------------------- |
| Fit rejection settings without retraining weights        | Patch            | `v2.1.0` to `v2.1.1` |
| Retrain on the same source pool with a changed procedure | Minor            | `v2.0.0` to `v2.1.0` |
| Expand the dataset or change classes/architecture        | Major            | `v1.0.0` to `v2.0.0` |

- A version number identifies an artifact and method; a larger number does not prove higher accuracy.
- Changed test images or acceptance rules change what the reported percentages mean. Keep test membership, denominators, and OOD reporting limits explicit.
- UI changes such as decimal confidence formatting do not retrain the model. Browser precision settings still need their own validation; see [runtime and performance notes](../PERFORMANCE.md).
- Keep app and model labels independent. A model change requires a new build and deployment review even when the app label stays unchanged.

## Training Notebooks

| Location                                   | Purpose                                         |
| ------------------------------------------ | ----------------------------------------------- |
| `notebooks/experiment/<version>/`          | Candidate workflows and experimental evidence   |
| `notebooks/non-experiment/<version>/`      | Adopted models and older preserved trials       |
| `docs/model-training/experiment/v{n}/`     | Candidate trial report and evidence             |
| `docs/model-training/non-experiment/v{n}/` | Adopted or historical trial report and evidence |

- Keep a clean template separate from a completed notebook. Preserve completed cells, outputs, original file identities, and run ledgers; rerunning can overwrite evidence.
- A notebook or folder version does not establish that its model was trained, adopted, or deployed.
- Historical package snapshots are evidence, not installation instructions for a new runtime. Review dependency advisories before reusing a workflow.
- Use the [complete notebook inventory](history/AI_MODEL_HISTORY.md#training-notebooks) when locating a specific older run.

## Model replacement checklist

1. **Preserve the baseline.** Back up the current bundle, configuration, labels, cache identity, and rollback instructions before changing them.
2. **Review the candidate's evidence.** Identify training inputs, split membership, calibration, rejection rules, and model hashes. Record accuracy/OOD results with clear denominators and known reuse or overlap. Confirm the exported model's predictions and browser compatibility; repeatability alone does not establish accuracy.
3. **Make adoption explicit.** Preparing or evaluating a candidate does not select it for the app. Record the adoption decision and the exact approved bundle.
4. **Replace the whole reviewed bundle.** Copy graph, shards, and `model_config.json` into `public/model/`; remove superseded shards after preserving the baseline. Match the configuration's class order with `CLASSES` in `src/lib/constants.ts` and confirm preprocessing matches the export.
5. **Update its identities together.** Set `modelVersion` in `src/lib/constants.ts`, update the model-cache identity in `src/sw.ts`, and add the previous cache to `OUTDATED_MODEL_CACHES`. Review model-related claims in both languages in `src/lib/translations.ts`.
6. **Update the evidence and guides.** Keep the trial report, adoption receipt, and hashes together. On adoption, move the preserved candidate notebooks/report into their `non-experiment/` locations and update links without changing their scientific contents.
7. **Build and release the reviewed commit.** Confirm the assets appear in `git status --short public/model/`, complete required checks, and follow the [PWA release procedure](PWA_VERSIONING.md#candidate-testing-and-promotion). Generate `public/sw.js` through the build; do not edit it manually.

### Model provenance tag

After release approval, a model tag records the tested commit containing those exact assets. It does not create an app deployment or a separate GitHub Release. Replace both placeholders before running:

```bash
git tag -a model-vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf model-vX.Y.Z"
git push origin model-vX.Y.Z
```

## Historical records

- [Chronological model decisions and experiments](history/AI_MODEL_HISTORY.md#model-timeline)
- [V4.5.0's original adoption context](history/AI_MODEL_HISTORY.md#current-adopted-model-v450-october-16-2026)
- [Prepared V5.0.0 workflow](history/AI_MODEL_HISTORY.md#v500-oe-fine-tuning-workflow-prepared-october-15-2026)

The archive preserves earlier scores, workflows, notebooks, and decisions. Statements about an older "current model" describe that record's date. They do not change the active bundle listed above.

<details>
<summary>Links from older documents</summary>

Older section bookmarks still resolve here. Each link opens the complete archived record.

- <a id="contents"></a> [Contents](history/AI_MODEL_HISTORY.md#contents)
- <a id="model-timeline"></a><a id="reading-the-historical-records"></a> [Model timeline](history/AI_MODEL_HISTORY.md#model-timeline)
- <a id="august-2324-2026-trial-21-configuration-revision"></a> [August 23–24, 2026: Trial 2.1 configuration revision](history/AI_MODEL_HISTORY.md#august-2324-2026-trial-21-configuration-revision)
- <a id="august-27-2026-trial-3-replacement-and-copy-review"></a> [August 27, 2026: Trial 3 replacement and copy review](history/AI_MODEL_HISTORY.md#august-27-2026-trial-3-replacement-and-copy-review)
- <a id="august-30-2026-recovered-completed-notebooks"></a> [August 30, 2026: recovered completed notebooks](history/AI_MODEL_HISTORY.md#august-30-2026-recovered-completed-notebooks)
- <a id="september-17-2026-threshold-fitting-notebook-revision-v31"></a> [September 17, 2026: threshold-fitting notebook revision v3.1](history/AI_MODEL_HISTORY.md#september-17-2026-threshold-fitting-notebook-revision-v31)
- <a id="september-18-2026-background-experiment-and-paired-threshold-fitting"></a> [September 18, 2026: background experiment and paired threshold fitting](history/AI_MODEL_HISTORY.md#september-18-2026-background-experiment-and-paired-threshold-fitting)
- <a id="september-23-2026-seven-class-experiment-v4"></a> [September 23, 2026: seven-class experiment v4](history/AI_MODEL_HISTORY.md#september-23-2026-seven-class-experiment-v4)
- <a id="september-24-2026-local-v4-candidate-trial"></a> [September 24, 2026: local v4 candidate trial](history/AI_MODEL_HISTORY.md#september-24-2026-local-v4-candidate-trial)
- <a id="september-24-2026-four-arm-training-workflow-v41"></a> [September 24, 2026: four-arm training workflow v4.1](history/AI_MODEL_HISTORY.md#september-24-2026-four-arm-training-workflow-v41)
- <a id="september-25-2026-completed-v41-experiment-and-local-background-arm-trial"></a> [September 25, 2026: completed v4.1 experiment and local background-arm trial](history/AI_MODEL_HISTORY.md#september-25-2026-completed-v41-experiment-and-local-background-arm-trial)
- <a id="september-27-2026-guided-v411-reproduction-workflow"></a> [September 27, 2026: guided V4.1.1 reproduction workflow](history/AI_MODEL_HISTORY.md#september-27-2026-guided-v411-reproduction-workflow)
- <a id="september-28-2026-completed-v411-reproduction-and-local-background-arm-trial"></a> [September 28, 2026: completed V4.1.1 reproduction and local Background-arm trial](history/AI_MODEL_HISTORY.md#september-28-2026-completed-v411-reproduction-and-local-background-arm-trial)
- <a id="september-28-2026-v420-separate-model-experiment-prepared"></a> [September 28, 2026: V4.2.0 separate-model experiment prepared](history/AI_MODEL_HISTORY.md#september-28-2026-v420-separate-model-experiment-prepared)
- <a id="september-29-2026-completed-v420-runs-and-local-dual-model-trial"></a> [September 29, 2026: completed V4.2.0 runs and local dual-model trial](history/AI_MODEL_HISTORY.md#september-29-2026-completed-v420-runs-and-local-dual-model-trial)
- <a id="september-29-2026-returned-local-app-to-v411-background"></a> [September 29, 2026: returned local app to V4.1.1 Background](history/AI_MODEL_HISTORY.md#september-29-2026-returned-local-app-to-v411-background)
- <a id="october-1-2026-v430-single-seven-class-workflow-prepared"></a> [October 1, 2026: V4.3.0 single seven-class workflow prepared](history/AI_MODEL_HISTORY.md#october-1-2026-v430-single-seven-class-workflow-prepared)
- <a id="completed-v430-local-candidate-october-1-2026"></a> [Completed V4.3.0 local candidate: October 1, 2026](history/AI_MODEL_HISTORY.md#completed-v430-local-candidate-october-1-2026)
- <a id="restored-v411-background-local-candidate-october-2-2026"></a> [Restored V4.1.1 Background local candidate: October 2, 2026](history/AI_MODEL_HISTORY.md#restored-v411-background-local-candidate-october-2-2026)
- <a id="restored-v430-combined-for-local-retesting-october-2-2026"></a> [Restored V4.3.0 Combined for local retesting: October 2, 2026](history/AI_MODEL_HISTORY.md#restored-v430-combined-for-local-retesting-october-2-2026)
- <a id="v049-adoption-of-v430-combined-october-2-2026"></a> [v0.4.9 adoption of V4.3.0 Combined: October 2, 2026](history/AI_MODEL_HISTORY.md#v049-adoption-of-v430-combined-october-2-2026)
- <a id="october-3-2026-historical-colab-dependency-snapshot"></a> [October 3, 2026: historical Colab dependency snapshot](history/AI_MODEL_HISTORY.md#october-3-2026-historical-colab-dependency-snapshot)
- <a id="october-6-2026-app-only-history-changes"></a> [October 6, 2026: app-only History changes](history/AI_MODEL_HISTORY.md#october-6-2026-app-only-history-changes)
- <a id="october-7-2026-app-only-guidance-changes"></a> [October 7, 2026: app-only guidance changes](history/AI_MODEL_HISTORY.md#october-7-2026-app-only-guidance-changes)
- <a id="v440-fresh-experimental-workflow-october-8-2026"></a> [V4.4.0 fresh experimental workflow, October 8, 2026](history/AI_MODEL_HISTORY.md#v440-fresh-experimental-workflow-october-8-2026)
- <a id="v440-local-test-completed-v430-restored-october-9-2026"></a> [V4.4.0 local test completed; V4.3.0 restored, October 9, 2026](history/AI_MODEL_HISTORY.md#v440-local-test-completed-v430-restored-october-9-2026)
- <a id="october-10-2026-archive-clarification-and-app-release-preparation"></a> [October 10, 2026: archive clarification and app release preparation](history/AI_MODEL_HISTORY.md#october-10-2026-archive-clarification-and-app-release-preparation)
- <a id="v450-fresh-outlier-exposure-workflow-october-11-2026"></a> [V4.5.0 fresh Outlier Exposure workflow, October 11, 2026](history/AI_MODEL_HISTORY.md#v450-fresh-outlier-exposure-workflow-october-11-2026)
- <a id="v450-local-candidate-test-october-12-2026"></a> [V4.5.0 local candidate test (October 12, 2026)](history/AI_MODEL_HISTORY.md#v450-local-candidate-test-october-12-2026)
- <a id="v450-confidence-only-reference-figures-october-14-2026"></a> [V4.5.0 confidence-only reference figures (October 14, 2026)](history/AI_MODEL_HISTORY.md#v450-confidence-only-reference-figures-october-14-2026)
- <a id="v500-oe-fine-tuning-workflow-prepared-october-15-2026"></a> [V5.0.0 OE fine-tuning workflow prepared (October 15, 2026)](history/AI_MODEL_HISTORY.md#v500-oe-fine-tuning-workflow-prepared-october-15-2026)
- <a id="october-16-2026-v450-repository-adoption"></a> [October 16, 2026: V4.5.0 repository adoption](history/AI_MODEL_HISTORY.md#october-16-2026-v450-repository-adoption)
- <a id="october-17-2026-app-diagnostics-confidence-storage-and-texture-setting"></a> [October 17, 2026: app diagnostics, confidence storage, and texture setting](history/AI_MODEL_HISTORY.md#october-17-2026-app-diagnostics-confidence-storage-and-texture-setting)
- <a id="october-18-2026-app-scanner-follow-up-and-branch-handoff"></a> [October 18, 2026: app scanner follow-up and branch handoff](history/AI_MODEL_HISTORY.md#october-18-2026-app-scanner-follow-up-and-branch-handoff)

</details>

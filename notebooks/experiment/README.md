# Experimental notebooks

> **Status: experimental candidates — not shipped or deployed.**

This folder holds candidate notebook workflows and completed experimental evidence. A completed notebook does not automatically change application assets or deployment. An explicit local candidate test may copy verified model files after preserving a rollback backup; adoption and release still follow the model-version policy.

V4.5.0 is the current repository model; V4.3.0 is preserved as a previous model. Adopted and historical notebooks live under `notebooks/non-experiment/`; see the [notebook index](../README.md) and [V4.5.0 adoption record](../../docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#current-model-adoption-october-16-2026). Workflows remaining below are experimental candidates.

Folder versions identify notebook workflows, not model versions:

- `v5.0.0/` contains the prepared OE fine-tuning and evaluation notebooks plus their helper. V5.0.0 is untrained and on standby; this folder is preparation only. See the [V5.0.0 guide](../../docs/model-training/experiment/v5.0.0/TRIAL_v5_0_0.md). No model weights or evaluation results exist.
- `v3.1/` contains the threshold-only workflow against the shipped Trial 3 weights and the background-replacement training experiment. See the [background experiment guide](../../docs/model-training/experiment/v3.1/TRIAL_v3_1.md) and [original-weight threshold guide](../../docs/model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md).
- `v3.2/` contains paired threshold fitting for the v3.1 experiment models. See the [paired fitting guide](../../docs/model-training/experiment/v3.2/TRIAL_v3_2.md).
- `v4/` contains seven-class training and separate threshold fitting, with healthy leaves and healthy fruits separated. See the [v4 upload and run guide](../../docs/model-training/experiment/v4/TRIAL_v4.md).
- `v4.1/` contains a four-arm seven-class background and lighting experiment, separate threshold fitting, and a post-training figures notebook that reads the completed runs. See the [v4.1 upload and run guide](../../docs/model-training/experiment/v4.1/TRIAL_v4_1.md).
- `v4.1.1/` contains a completed guided reproduction of the same four-arm recipe: clean templates, separate result notebooks, explicit input review, training, threshold fitting, and figure generation. Its earlier Background local trial and restoration remain historical; the candidate is preserved in verified backups after V4.3.0 adoption. See the [v4.1.1 result and evidence guide](../../docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md).
- `v4.2.0/` contains clean templates and completed result notebooks for separate Mango Leaf and Mango Fruit classifiers. Each training notebook includes its own figure steps; each model has a separate threshold notebook. The local two-choice app trial was rolled back to V4.1.1; its app/model state is preserved in an ignored backup. **Fruit did not meet the threshold-selection rule; there is no fitted fruit candidate.** See the [v4.2.0 input, run, and evidence guide](../../docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md).

- `v4.4.0/` contains a fresh seven-class training template and its threshold-fitting template. They create new audits, grouped 70/15/15 membership, reviewed masks, ImageNet-initialized weights, calibration, and fitted gates without loading previous MangoLeaf runs. The 225-scene and reused 200-photo OOD pools require fresh review; the OOD target is 100 tuning and 100 reporting photos with related captures kept together. See the [V4.4.0 Seven Class experiment guide](../../docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md).

The V4.4.0 runtime repair executes scientific cells in an audited isolated kernel through `%%mangoleaf`. Colab libraries remain unmodified, with unresolved provider findings preserved separately. The guide includes fresh-copy startup and recovery instructions; Linux/GPU execution still needs its actual session evidence.

The subsequent setup fix creates its empty tools environment without `ensurepip`, then installs into that explicit target through provider pip's `--python` option (pip 22.3 or newer). Both templates include the repair; local bootstrap regression checks passed, while complete Colab startup still requires its actual outcome.

Use the matching guide in [`docs/model-training/experiment/`](../../docs/model-training/experiment/). Preserve clean templates and completed result notebooks as evidence. Do not overwrite results or treat a candidate folder as a shipping-model directory.

## V4.4.0 completed run and local decision, October 9, 2026

The folder now also contains the unchanged [completed training notebook](v4.4.0/MangoLeaf_AI_Training_v4_4_0_Post_Training.ipynb) and [completed threshold-fitting notebook](v4.4.0/MangoLeaf_AI_Threshold_Fitting_v4_4_0_Results.ipynb). Actual Colab completion, saved metrics, and selected scientific figures are documented in the [trial report](../../docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md#completed-results-and-local-rollback-october-9-2026). Original downloaded run folders remain intact; the repository holds a curated evidence copy with source hashes rather than raw datasets and full model exports.

The maintainer completed the temporary V4.4.0 local candidate test and chose to restore V4.3.0 at that time. V4.4.0 remains in `experiment/`; the later V4.5.0 adoption is recorded separately. Earlier pending execution notes above retain their October 8 preparation context and do not describe these completed run identities.

# Experimental notebooks

> **Status: experimental candidates — not shipped or deployed.**

This folder holds candidate notebook workflows and completed experimental evidence. A completed notebook does not automatically change application assets or deployment. An explicit local candidate test may copy verified model files after preserving a rollback backup; adoption and release still follow the model-version policy.

V4.3.0 Combined was adopted as the current application model on October 2, 2026. Its unchanged clean templates and completed result notebooks now live under [`notebooks/non-experiment/v4.3.0/`](../non-experiment/v4.3.0/); see the [adopted and historical notebook index](../README.md) and [current-model record](../../docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#current-model-adoption-october-2-2026). The `non-experiment/` group contains both the current adopted model and older models; the workflows below retain their experimental status.

Folder versions identify notebook workflows, not model versions:

- `v3.1/` contains the threshold-only workflow against the shipped Trial 3 weights and the background-replacement training experiment. See the [background experiment guide](../../docs/model-training/experiment/v3.1/TRIAL_v3_1.md) and [original-weight threshold guide](../../docs/model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md).
- `v3.2/` contains paired threshold fitting for the v3.1 experiment models. See the [paired fitting guide](../../docs/model-training/experiment/v3.2/TRIAL_v3_2.md).
- `v4/` contains seven-class training and separate threshold fitting, with healthy leaves and healthy fruits separated. See the [v4 upload and run guide](../../docs/model-training/experiment/v4/TRIAL_v4.md).
- `v4.1/` contains a four-arm seven-class background and lighting experiment, separate threshold fitting, and a post-training figures notebook that reads the completed runs. See the [v4.1 upload and run guide](../../docs/model-training/experiment/v4.1/TRIAL_v4_1.md).
- `v4.1.1/` contains a completed guided reproduction of the same four-arm recipe: clean templates, separate result notebooks, explicit input review, training, threshold fitting, and figure generation. Its earlier Background local trial and restoration remain historical; the candidate is preserved in verified backups after V4.3.0 adoption. See the [v4.1.1 result and evidence guide](../../docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md).
- `v4.2.0/` contains clean templates and completed result notebooks for separate Mango Leaf and Mango Fruit classifiers. Each training notebook includes its own figure steps; each model has a separate threshold notebook. The local two-choice app trial was rolled back to V4.1.1; its app/model state is preserved in an ignored backup. **Fruit did not meet the threshold-selection rule; there is no fitted fruit candidate.** See the [v4.2.0 input, run, and evidence guide](../../docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md).

Use the matching guide in [`docs/model-training/experiment/`](../../docs/model-training/experiment/). Preserve clean templates and completed result notebooks as evidence. Do not overwrite results or treat a candidate folder as a shipping-model directory.

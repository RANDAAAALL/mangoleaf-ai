# Experimental notebooks

> **Status: experimental candidates — not shipped or deployed.**

This folder holds candidate notebook workflows and completed experimental evidence. A notebook may have completed outputs, but it does not change the application version, `public/model/`, or the deployed model until its results are evaluated, adopted, and released through the model-version policy.

Folder versions identify notebook workflows, not model versions:

- `v3.1/` contains the threshold-only workflow against the shipped Trial 3 weights and the background-replacement training experiment.
- `v3.2/` contains paired threshold fitting for the v3.1 experiment models.

Use the matching guide in [`docs/model-training/experiment/`](../../docs/model-training/experiment/). Preserve clean templates and completed result notebooks as evidence. Do not overwrite results or treat a candidate folder as a shipping-model directory.

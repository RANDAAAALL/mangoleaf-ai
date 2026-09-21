# Paired threshold fitting v3.2

> **Status: experimental candidate — not shipped or deployed.**

This folder follows `notebooks/experiment/v3.2/`. The version identifies the threshold-fitting workflow; it does not mean that model v3.2.0 was trained or deployed.

## Inputs

- [Clean notebook](../../../../notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2.ipynb).
- [Completed notebook](../../../../notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2_Results.ipynb), preserved as evidence.
- A complete paired run from [background training v3.1](../v3.1/BACKGROUND_EXPERIMENT_v3_1.md): `control/`, `background/`, `input_manifest.json`, `mask_review.json`, `plan.json`, and `training_complete.json`.
- The same dataset, replacement backgrounds, and OOD collection recorded by that training run. Point paths to extracted directories, not ZIP files.

Set `TRAINING_RUN` to the directory containing both model folders and the completion file. It is an input directory. New threshold reports go under `OUTPUT_ROOT` in a separate timestamped directory. A partial or unrelated training run cannot substitute for the recorded bundle.

## Procedure

1. Match the training runtime and audit the recorded model, input, plan, and mask-review hashes.
2. Review OOD membership. `OOD_EXCLUDE` contains paths relative to `OOD_DIR` for expert-confirmed in-scope images; it is not a list of inconvenient model mistakes.
3. Fit each arm's margin and entropy on mango validation images and OOD tune images. Confidence stays at 0.70 and required validation retention at 95%.
4. Save both selections before evaluating either arm. An infeasible arm is reported explicitly and receives no candidate configuration.
5. Evaluate fixed selections with mango test images and OOD report images. Compare accepted wrong diagnoses, rejected mango images, OOD false accepts, and per-class outcomes.
6. Preserve the completed notebook and evidence ZIP. Do not retune from report outcomes and then describe those same images as an untouched final test.

See the [original paired-run instructions](../v3.1/BACKGROUND_EXPERIMENT_v3_1.md#run-threshold-fitting-v32) for output files and limitations. The older [threshold-only v3.1 workflow](../v3.1/THRESHOLD_FITTING_v3_1.md) uses the original Trial 3 weights and has different inputs.

## Deployment decision

Running or archiving this notebook does not adopt its models. Keep the deployed v3.0.0 baseline unless a candidate is explicitly accepted following model evaluation and browser/device testing. Reused evaluation data and a single training seed do not establish a general improvement. Follow [model versioning](../../../MODEL_VERSIONING.md) and [application testing](../../../TESTING.md) before deployment.

Local notebook checks remain `python tools/verify-background-notebooks.py`. They validate notebook logic with synthetic data; they do not train models, judge mask quality, or measure field accuracy.

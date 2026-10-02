# Adopted and historical notebooks

**Current model: V4.3.0 Combined, adopted October 2, 2026.** App candidate `0.5.0` retains model label `v4.3.0`. The [adoption guide](../docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#current-model-adoption-october-2-2026) records the selected weights and metadata; source adoption does not claim a live deployment or new accuracy evaluation.

Notebooks are grouped by purpose:

- [`non-experiment/`](non-experiment/) contains the current adopted model and older models kept as evidence. It does not mean every model in that folder is currently used by the app.
- [`experiment/`](experiment/README.md) contains candidate workflows and completed experimental runs that were not adopted.

[`non-experiment/v4.3.0/`](non-experiment/v4.3.0/) holds the current model's four unchanged notebooks:

| Notebook | Role |
| --- | --- |
| [Training template](non-experiment/v4.3.0/MangoLeaf_AI_Training_v4_3_0.ipynb) | Reproducible workflow for one seven-class Combined recipe, with integrated figure steps. |
| [Threshold-fitting template](non-experiment/v4.3.0/MangoLeaf_AI_Threshold_Fitting_v4_3_0.ipynb) | Separate validation/OOD tuning, frozen evaluation, and export workflow. |
| [Completed training and figures](non-experiment/v4.3.0/MangoLeaf_AI_Training_v4_3_0_Post_Training.ipynb) | October 1 completed run with all saved outputs preserved. |
| [Completed threshold fitting](non-experiment/v4.3.0/MangoLeaf_AI_Threshold_Fitting_v4_3_0_Results.ipynb) | October 1 frozen selection/evaluation and original candidate packaging evidence. |

The saved notebooks use `model-v4.3.0-candidate` and the original `mangoleaf_experiments/v4.3.0/` Drive paths as experiment provenance. Those bytes remain intact. The public app configuration now identifies the adopted `model-v4.3.0` and preserves `exportSourceModelVersion: model-v4.3.0-candidate`; graph, shards, preprocessing, calibration, and fitted gates are unchanged. Running a clean template again produces a new candidate run and does not automatically replace the adopted model.

The completed Combined run reused V4.1.1 mango split membership and used 62 original plus 138 supplied scenes. Training, frozen threshold evaluation, and integrated figures completed in that run. Its reported mango and OOD collections were reused exploratory evidence; see the unchanged [comparison and limitations](../docs/model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md).

Older trial notebooks remain under [`non-experiment/v1/`](non-experiment/v1/), [`non-experiment/v2/`](non-experiment/v2/), [`non-experiment/v2.1/`](non-experiment/v2.1/), and [`non-experiment/v3/`](non-experiment/v3/) as historical evidence. Trial 3 is the previous adopted baseline. Folder versions identify notebook workflows; the explicit model-selection record determines the current application weights. Preserve clean templates, completed outputs, and archived runs when preparing future candidates. Original repository and Drive paths inside saved notebooks remain unchanged as provenance; use this index for their current repository locations.

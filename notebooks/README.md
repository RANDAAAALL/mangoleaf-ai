# Adopted and historical notebooks

**V5.0.0 prepared but untrained and on standby, October 15, 2026:** [OE fine-tuning notebook](experiment/v5.0.0/MangoLeaf_AI_OE_Fine_Tuning_v5_0_0.ipynb) and its [required Python helper](experiment/v5.0.0/v5_workflow.py) describe the proposed warm start from V4.5.0. No V5.0.0 training or evaluation results exist and no V5.0.0 model is adopted. Keep its workflow on standby.

**V4.5.0 adopted in the repository, October 16, 2026:** Its completed notebooks and templates are now preserved under [`non-experiment/v4.5.0/`](non-experiment/v4.5.0/), alongside its trial evidence under `docs/model-training/non-experiment/v4.5.0/`. Original notebook contents and outputs remain preserved. The adoption uses confidence >=0.70 only; margin and entropy are disabled. Production deployment remains pending.

**V4.5.0 original experiment workflow, October 11, 2026:** Clean training and threshold-fitting templates, completed result copies, and outputs are preserved under [`non-experiment/v4.5.0/`](non-experiment/v4.5.0/). The dated [trial guide](../docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md) distinguishes completed evidence from the later repository adoption.

**Current model: V4.5.0, adopted October 16, 2026.** See the [adoption record](../docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#current-model-adoption-october-16-2026). V4.3.0 remains preserved as a previous model and rollback option.

**Fresh experimental workflow, October 8, 2026:** [`experiment/v4.4.0/`](experiment/v4.4.0/) contains standalone training and threshold-fitting templates titled **V4.4.0 Seven Class**. They start from raw photos and ImageNet initialization, create fresh grouped splits and reviewed masks, and save unique runs under `MyDrive/mangoleaf_experiments/v4.4.0/`. Earlier MangoLeaf run folders are not execution inputs. The [experiment guide](../docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md) covers the embedded 62 nonduplicate identities, reviewed 225-scene pool, reused OOD 100/100 target, numbered steps, figures, runtime checks, and evidence limits. The adopted application model remains V4.3.0.

**V4.4.0 runtime repair, October 8, 2026:** The first two setup cells execute in Colab; all scientific cells use `%%mangoleaf` to execute in a persistent isolated Python kernel. Logs and figures return to the notebook. Separate worker audits block unreviewed execution-package findings, while the unmodified provider host retains its own explicit findings report. Two exact converter packaging findings remain unresolved with documented reviews of unused operations. See [starting the repaired copy](../docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md#starting-the-repaired-colab-copy). Actual Colab GPU validation remains required.

The revised V4.4.0 setup also avoids the observed Colab `ensurepip` failure: it creates an empty environment and installs into it using provider pip's `--python` option (pip 22.3 or newer). Upload the current template copy and run Step 1 again; the linked startup instructions cover this revision.

**Completed experimental evidence, October 9, 2026:** The saved [V4.4.0 training results](experiment/v4.4.0/MangoLeaf_AI_Training_v4_4_0_Post_Training.ipynb) and [threshold-fitting results](experiment/v4.4.0/MangoLeaf_AI_Threshold_Fitting_v4_4_0_Results.ipynb) preserve the actual Colab cells, outputs, runtime checks, and completion records. Do not rerun or edit these evidence copies. Their clean templates remain separate. The [completed trial report](../docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md#completed-results-and-local-rollback-october-9-2026) links the curated artifacts, plots, and source-hash mapping. The maintainer declined the local candidate after testing, and the app again uses V4.3.0. The earlier pending setup statements above describe October 8 preparation; actual completion is recorded separately for these exact runs. This is not adoption or deployment.

Notebooks are grouped by purpose:

- [`non-experiment/`](non-experiment/) contains the current adopted model and older models kept as evidence. It does not mean every model in that folder is currently used by the app.
- [`experiment/`](experiment/README.md) contains candidate workflows and completed experimental runs that were not adopted.

[`non-experiment/v4.5.0/`](non-experiment/v4.5.0/) holds the current model's four unchanged notebooks:

- `MangoLeaf_AI_Training_v4_5_0.ipynb` and `MangoLeaf_AI_Threshold_Fitting_v4_5_0.ipynb`: clean workflow templates.
- `MangoLeaf_AI_Training_v4_5_0_Post_Training.ipynb` and `MangoLeaf_AI_Threshold_Fitting_v4_5_0_Results.ipynb`: completed evidence with original cells and outputs preserved. Their original candidate identities remain historical provenance; the adoption receipt records the active configuration separately.

[`non-experiment/v4.3.0/`](non-experiment/v4.3.0/) preserves the previous model's four notebooks:

| Notebook | Role |
| --- | --- |
| [Training template](non-experiment/v4.3.0/MangoLeaf_AI_Training_v4_3_0.ipynb) | Reproducible workflow for one seven-class Combined recipe, with integrated figure steps. |
| [Threshold-fitting template](non-experiment/v4.3.0/MangoLeaf_AI_Threshold_Fitting_v4_3_0.ipynb) | Separate validation/OOD tuning, frozen evaluation, and export workflow. |
| [Completed training and figures](non-experiment/v4.3.0/MangoLeaf_AI_Training_v4_3_0_Post_Training.ipynb) | October 1 completed run with all saved outputs preserved. |
| [Completed threshold fitting](non-experiment/v4.3.0/MangoLeaf_AI_Threshold_Fitting_v4_3_0_Results.ipynb) | October 1 frozen selection/evaluation and original candidate packaging evidence. |

The V4.3.0 notebooks use `model-v4.3.0-candidate` and original `mangoleaf_experiments/v4.3.0/` Drive paths as provenance. Those bytes remain intact. Its October 2 adoption configuration is preserved separately from the original candidate. V4.5.0 is now the active repository model. Running a clean template again produces a new candidate run and does not automatically replace the adopted model.

The completed Combined run reused V4.1.1 mango split membership and used 62 original plus 138 supplied scenes. Training, frozen threshold evaluation, and integrated figures completed in that run. Its reported mango and OOD collections were reused exploratory evidence; see the unchanged [comparison and limitations](../docs/model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md).

Older trial notebooks remain under [`non-experiment/v1/`](non-experiment/v1/), [`non-experiment/v2/`](non-experiment/v2/), [`non-experiment/v2.1/`](non-experiment/v2.1/), and [`non-experiment/v3/`](non-experiment/v3/) as historical evidence. Trial 3 is the previous adopted baseline. Folder versions identify notebook workflows; the explicit model-selection record determines the current application weights. Preserve clean templates, completed outputs, and archived runs when preparing future candidates. Original repository and Drive paths inside saved notebooks remain unchanged as provenance; use this index for their current repository locations.

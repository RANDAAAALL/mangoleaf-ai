# Current and older model notebooks

**Current repository model: V4.5.0.** Prepared app `0.7.0` uses seven classes and confidence-only rejection at 0.70; margin and entropy are disabled. Its diagnostics and confidence presentation changes do not alter training notebooks or model artifacts. See the [current model report](../../docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md) for preserved results and adoption identity, and the [PWA release record](../../docs/versions/PWA_VERSIONING.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026) for app validation and manual promotion.

This folder contains the current adopted model and older models kept as evidence. A version being here does not mean the app still uses it.

| Folder | Purpose |
| --- | --- |
| [v4.5.0](v4.5.0/) | Current adopted model: clean templates and completed training/threshold result notebooks. |
| [v4.3.0](v4.3.0/) | Previous adopted model and rollback baseline: templates and completed results. |
| [v3](v3/) | Previous adopted model: templates, partial and completed training results, and threshold-fitting results. |
| [v2.1](v2.1/) | Older model: training template, completed training, and threshold-fitting results. |
| [v2](v2/) | Older Trial 2 training workflow. |
| [v1](v1/) | Original Trial 1 training workflow. |

Keep completed notebooks unchanged: rerunning their cells can overwrite saved evidence. Use a copy of a clean template under [`notebooks/experiment/`](../experiment/README.md) for a new experiment. Original repository and Google Drive paths inside preserved notebooks remain as provenance; use these folder links for current repository locations.

See the [overall notebook index](../README.md) and [AI model versioning guide](../../docs/versions/AI_MODEL_VERSIONING.md) for the distinction between notebook workflows, adopted model assets, and releases.

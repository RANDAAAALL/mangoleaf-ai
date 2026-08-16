# MangoLeaf AI Versioning Guide

This file records how to version the application, model, and training notebooks without losing historical evidence.

## Training Notebooks

Keep the existing notebooks.

| File | Role | Recommendation |
| --- | --- | --- |
| `MangoLeaf_AI_Training_v1.ipynb` | Trial 1 baseline | Keep as historical evidence. Do not use it as the next active training file. |
| `MangoLeaf_AI_Training_v2.ipynb` | Trial 2 and current retraining template | Use this as the basis for the next retraining cycle, but copy it first. |

For the next dataset update, create a new notebook instead of overwriting the completed run:

```text
MangoLeaf_AI_Training_v3.ipynb
```

Each completed training notebook should record:

- dataset source and snapshot date
- raw class counts
- train/validation/test split counts
- split seed
- augmentation plan
- model architecture
- training stages and hyperparameters
- validation and test metrics
- confusion matrix
- exported model format
- exported file size and checksum

## Model Versions

Model versions should be separate from app versions because the app can change without a new model, and the model can be retrained without a major UI change.

Recommended model version names:

```text
model-v1.0.0  Trial 1 baseline
model-v2.0.0  Trial 2 MobileNetV3-Large Graph Model
model-v3.0.0  Next retraining cycle with new datasets
```

Use a major model version when the dataset, class mapping, architecture, or evaluation baseline materially changes.

## App Releases

Use semantic versioning for the PWA:

```text
v0.1.0  first public pre-field-evaluation milestone
v0.2.0  feature update before final evaluation
v0.2.1  confirmation-modal title clarity patch
v0.2.2  repository documentation and filename-organization patch
v0.2.3  collapsible home-screen scan-flow guide
v1.0.0  stable field-tested release
v1.0.1  small fix after v1.0.0
```

The project history records `v0.2.0` as a published release and `v0.2.1` as the following title-clarity patch. The repository-organization work is the `v0.2.2` patch. `v0.2.3` adds the collapsible home-screen scan-flow guide. The model remains `model-v2.0.0` because no model assets, class mapping, or training results changed.

The PWA footer reads these public build values:

```env
NEXT_PUBLIC_APP_VERSION=v0.2.3
NEXT_PUBLIC_MODEL_VERSION=v2.0.0
```

If the variables are not set, the app falls back to `v0.2.3` and `v2.0.0`. These values are public and safe to expose because they are version labels, not secrets.

## Creating a GitHub Release

From the project root:

```bash
git status
git add -u
git add package.json .env.example SETUP.md docs/MODEL_VERSIONING.md docs/PROGRESS.md src/app/page.tsx src/components/how-it-works-card.tsx src/lib/app-version.ts src/lib/translations.ts
git commit -m "feat: add collapsible scan-flow guide"
git tag -a v0.2.3 -m "MangoLeaf AI v0.2.3 - collapsible scan-flow guide"
git push origin master --follow-tags
```

Review `git status` before committing to confirm that only intended project files are staged.

Then open GitHub:

1. Go to the repository.
2. Open **Releases**.
3. Choose **Draft a new release**.
4. Select the pushed tag.
5. Add a short title and release notes.
6. Publish the release.

For a model-only milestone, use a model tag instead:

```bash
git tag -a model-v2.0.0 -m "Trial 2 MobileNetV3-Large TFJS Graph Model"
git push origin model-v2.0.0
```

Do not attach large raw datasets to GitHub Releases unless the dataset license and file size are appropriate. Keep release notes focused on what changed, what was tested, and what should be treated as the current baseline.

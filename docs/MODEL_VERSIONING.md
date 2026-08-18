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
v0.2.4  version-label sourcing and scan-guide layout patch
v1.0.0  stable field-tested release
v1.0.1  small fix after v1.0.0
```

The project history records `v0.2.0` as a published release and `v0.2.1` as the following title-clarity patch. The repository-organization work is the `v0.2.2` patch. `v0.2.3` adds the collapsible home-screen scan-flow guide. `v0.2.4` moves version-label sourcing into the build configuration and refines the scan-guide list layout. The model remains `model-v2.0.0` because no model assets, class mapping, or training results changed.

The `v0.2.3` tag was originally created on a commit that predated an amend and was missing `src/components/how-it-works-card.tsx`, so a checkout of that tag could not build. The tag was moved to the corrected commit `50514f8` on August 18, 2026. The superseded commit was `175d7ddc4094ea84139b0526bfa1abd6265a40a9`. Create tags only after the release commit is final to avoid repeating this.

The PWA footer reads two version labels, and neither is an environment variable.

| Label | Source | Bump when |
| --- | --- | --- |
| App version | `version` field in `package.json`, injected as `NEXT_PUBLIC_APP_VERSION` by the `env` block in `next.config.ts` | Any app release |
| Model version | `modelVersion` constant in `src/lib/constants.ts` | The assets in `public/model/` are replaced |

Both values are baked into the bundle as literal strings at build time, so a
version change requires a rebuild. Neither can be overridden by `.env.local`, a
shell variable, or a hosting dashboard variable, which is deliberate: a stale
override would silently display the wrong version. Do not add
`NEXT_PUBLIC_APP_VERSION` or `NEXT_PUBLIC_MODEL_VERSION` to `.env.local` or to
the Vercel project settings. These values are public and safe to expose because
they are version labels, not secrets.

`src/env.d.ts` declares `NEXT_PUBLIC_APP_VERSION` as a required string so usage
sites do not need a non-null assertion. It is a declaration, not a runtime
guarantee; if the `env` block in `next.config.ts` is removed, the footer renders
an empty label with no type error.

## Creating a GitHub Release

From the project root. Bump the `version` field in `package.json` first, because
the footer label is derived from it:

```bash
git status
git add -u
git add package.json
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

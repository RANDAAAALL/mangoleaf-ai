# MangoLeaf AI Versioning Guide

This file records how to version the application, model, and training notebooks without losing historical evidence.

## Training Notebooks

All notebooks live in `notebooks/` at the repository root. Keep every one of them.

| File | Role | Recommendation |
| --- | --- | --- |
| `notebooks/MangoLeaf_AI_Training_v1.ipynb` | Trial 1 baseline | Keep as historical evidence. Do not use it as the next active training file. |
| `notebooks/MangoLeaf_AI_Training_v2.ipynb` | Trial 2 | Keep as historical evidence. Superseded as the template by v2.1. |
| `notebooks/MangoLeaf_AI_Training_v2.1.ipynb` | **Trial 2.1 and current retraining template** | Use this as the basis for the next retraining cycle, but copy it first. Outputs are cleared. |
| `notebooks/MangoLeaf_AI_Training_v2_1_Post_Training.ipynb` | Trial 2.1 completed run | Keep as historical evidence. All cell outputs preserved, including the metrics quoted in the manuscript. Do not rerun. |
| `notebooks/MangoLeaf_AI_Threshold_Fitting_v2_1_1_Results.ipynb` | Margin and entropy fitting for `model-v2.1.1` | Keep as historical evidence. Fitted against the Trial 2.1 resume bundle with no retraining. |

For the next dataset update, copy `notebooks/MangoLeaf_AI_Training_v2.1.ipynb` into a new notebook in the same folder instead of overwriting a completed run. Name the notebook after the model version it produces, so a notebook filename and its exported model always agree:

```text
notebooks/MangoLeaf_AI_Training_v2.2.ipynb   same images, changed training procedure only
notebooks/MangoLeaf_AI_Training_v3.ipynb     new or expanded dataset, new classes, or a new architecture
```

A new dataset is a major change, so the next retraining cycle produces `notebooks/MangoLeaf_AI_Training_v3.ipynb`, `model-v3.0.0`, and `docs/model-training/TRIAL_3.md`. The next section explains why.

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
model-v2.1.0  Trial 2.1 deduplicated pool, temperature-calibrated, Float16 (superseded before release, never committed)
model-v2.1.1  Trial 2.1 weights plus fitted margin and entropy rejection thresholds
model-v3.0.0  Next retraining cycle with new datasets, notebook `v3`, report `TRIAL_3.md`
```

Choose the level by what the change does to the previous test accuracy, because a version label exists to tell one deployed artifact from another and the accuracy figure is what the manuscript quotes:

| Level | Meaning | Test accuracy is | Example |
| --- | --- | --- | --- |
| Patch | No retraining. Configuration only, fitted against weights that already exist. | Unchanged. The same weights produce the same predictions. | `v2.1.0` to `v2.1.1`, margin and entropy fitted on the existing resume bundle |
| Minor | Retrained on the same source images with a changed procedure. | Comparable but not identical. Report both numbers and explain the difference. | `v2.0.0` to `v2.1.0`, deduplication and temperature calibration on the Trial 2 pool |
| Major | New or expanded dataset, a changed class list, or a different architecture. | Not comparable. The test set itself is different, so the old figure describes a different measurement. | `v1.0.0` to `v2.0.0`, and the next cycle when the new dataset arrives |

New images make the version major even when the six classes and the architecture are untouched, because they land in a new 70/15/15 split and therefore a new test set. `97.12%` was measured on 417 specific images; an accuracy measured on a different set is not a higher or lower version of that number, it is a different number. Recalibration follows for the same reason: the temperature and both fitted thresholds are properties of one set of weights, so all three are refitted rather than carried over.

Trial 2.1 is a minor version rather than a major one: the architecture, the six-class mapping, and the 70/15/15 split are unchanged. What changed is that the pool was deduplicated before splitting, so the evaluation baseline moved from 98.25% to a comparable-but-not-identical 97.12%. The two numbers are measured on different test sets and should never be presented as a regression.

**Why `model-v2.1.0` is listed but skipped.** The Trial 2.1 export was swapped into `public/model/` on August 23, 2026 and labelled `v2.1.0`, but it was never committed and never installed on any device. The next day, out-of-scope images were collected and the margin and entropy thresholds were fitted against the same resume bundle, which rewrote `model_config.json` without retraining. The weight shards are byte-identical between the two states; the only differences are the two threshold values, the version constant, and the cache name. The label became `v2.1.1` and the `v2.1.0` state was never released.

A version label exists to tell one deployed client from another. Because `v2.1.0` never reached a client, nothing was skipped in any sense that matters, and reconstructing a commit for it would permanently bake the dead cache name `mangoleaf-model-cache-v2-1` into history having never served a byte. `model_config.json` already records the distinction correctly: `"trial": "2.1"` identifies the weights, `"modelVersion": "model-v2.1.1"` identifies the configuration revision. Thresholds and weights are one calibrated artifact, since `0.55` and `0.30` were fitted on the softmax outputs of exactly those weights, so they belong in a single commit.

**Swapping the weights in `public/model/` requires three coupled changes.** Doing any one alone leaves the app in a wrong state:

1. Copy the new files in and **delete every stale shard the new export does not overwrite**. Shard filenames encode the total count, so an export with fewer shards than the previous one leaves orphans behind: Trial 2.1 ships `group1-shard1of2.bin` and `group1-shard2of2.bin`, which do not overwrite Trial 2's three `of3` files. Copy `model_config.json` in alongside them, and check that its `classes` array matches the order of `CLASSES` in `src/lib/constants.ts`. A class-order mismatch mislabels every prediction without raising any error.
2. Bump `modelVersion` in `src/lib/constants.ts`, which is what the footer displays.
3. Bump the runtime cache name in `src/sw.ts`, and add the previous name to `OUTDATED_MODEL_CACHES` so the superseded weights are deleted from the device instead of sitting there forever. This step is defence in depth rather than the update mechanism itself; the next paragraph explains what actually forces the refetch. Its real payoff is reclaiming the space, since a superseded model directory is several megabytes and would otherwise stay on the device.

The Trial 2.1 swap completed all three across August 23 and 24, 2026: `public/model/` holds 2 shards plus `model_config.json`, `modelVersion` is `v2.1.1`, and the runtime cache is `mangoleaf-model-cache-v2-1-1` with both `mangoleaf-model-cache` and `mangoleaf-model-cache-v2-1` listed for eviction. Verify a future swap the same way that one was verified: run `bun run build`, then check the generated `public/sw.js` for the new cache name and confirm its precache manifest lists the new shard filenames and no old ones.

**The precache is what actually invalidates a replaced model, not the cache name.** Every file under `public/` enters the Serwist precache manifest with a content-revision hash, and `PrecacheRoute` is registered before `runtimeCaching`, so the router matches it first and the `CacheFirst` rule for `/model/*` never fires. A changed shard therefore gets a changed revision hash and is refetched on the next service-worker activation regardless of the cache name. Serwist's own `activate` handler also evicts precache entries that are absent from the current manifest, which is what removes the deleted `of3` shards. Step 3 above is still worth doing as defence in depth, but do not treat a `CacheStorage` inspection as the verification: `mangoleaf-model-cache-v2-1-1` can legitimately be empty on a correctly updated device.

Two details make that inspection easy to get wrong. `public/sw.js` is minified, and its precache entries use single-quoted keys, so a search for `"url"` finds nothing; search for `'url':` instead. On Windows the generated paths also use backslash separators, as in `/model\group1-shard1of2.bin`, so a grep for `/model/group1-shard1of2.bin` returns no match even when the entry is present and correct. The backslashes are harmless, because the WHATWG URL parser treats a backslash as a path separator for HTTP URLs and Serwist derives every cache key through `new URL()`; a Linux build of the same commit simply emits forward slashes. This command lists the entries on either platform:

```bash
grep -o "'url':'[^']*'" public/sw.js | grep -v _next/static
```

Finally, confirm the new weight files are actually visible to git with `git status --short public/model/` before committing. Files that a `.gitignore` pattern excludes are not reported as untracked, so a swap can look complete in the working tree while committing nothing. See the static asset notes in `docs/ARCHITECTURE.md` for how an unanchored pattern caused exactly this with the icon directory.

A model swap does not by itself require an app version bump, because the two version labels are independent. It does require a rebuild and a redeploy, since both labels are baked into the bundle as literal strings at build time.

## App Releases

Use semantic versioning for the PWA:

```text
v0.1.0  first public pre-field-evaluation milestone
v0.2.0  feature update before final evaluation
v0.2.1  confirmation-modal title clarity patch
v0.2.2  repository documentation and filename-organization patch
v0.2.3  collapsible home-screen scan-flow guide
v0.2.4  version-label sourcing and scan-guide layout patch
v0.2.5  localized scan history and UI reorganization
v0.2.6  Trial 2.1 model and three-gate rejection ship to the app
v1.0.0  stable field-tested release
v1.0.1  small fix after v1.0.0
```

The project history records `v0.2.0` as a published release and `v0.2.1` as the following title-clarity patch. The repository-organization work is the `v0.2.2` patch. `v0.2.3` adds the collapsible home-screen scan-flow guide. `v0.2.4` moves version-label sourcing into the build configuration and refines the scan-guide list layout. `v0.2.5` localizes scan-history dates in English and Bisaya and reorganizes the UI components. The model stayed at `model-v2.0.0` through all of those because no model assets, class mapping, or training results changed. The Trial 2.1 swap on August 23, 2026 and the threshold fitting on August 24, 2026 together moved the model to `model-v2.1.1` without an app release of their own. `v0.2.6` is the app release that ships them: the Trial 2.1 weights, the folded temperature `T = 0.754966`, and the fitted margin and entropy thresholds. Its tag sits on commit `e493009`, and `model-v2.1.1` on commit `9b31c7b`.

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
git commit -m "feat(app): localize scan history and reorganize UI"
git tag -a v0.2.5 -m "MangoLeaf AI v0.2.5 - localized scan history and UI reorganization"
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
git tag -a model-v2.1.1 -m "Trial 2.1 deduplicated, temperature-calibrated, Float16 TFJS Graph Model with fitted rejection thresholds"
git push origin model-v2.1.1
```

Do not attach large raw datasets to GitHub Releases unless the dataset license and file size are appropriate. Keep release notes focused on what changed, what was tested, and what should be treated as the current baseline.

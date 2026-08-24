# MangoLeaf AI Development Progress

Last updated: August 25, 2026

This file tracks the project work from the first committed implementation through the current local documentation pass. It is based on the repository history from July 18, 2026 onward, plus the current local working tree.

## Timeline

### July 18-20, 2026: PWA foundation

- Created the Next.js PWA foundation for MangoLeaf AI.
- Added the first offline-first architecture pieces: service worker support, IndexedDB/Dexie local storage, Supabase synchronization, install prompts, and scan-history persistence.
- Integrated the initial model assets and early classifier flow.
- Updated the manuscript plan after panel comments: broader Davao City respondent scope, revised title/objectives, improved SDLC section, IEEE formatting cleanup, updated related literature, and support for the 70% confidence threshold.

### July 21, 2026: Browser classifier and GPU path

- Added TensorFlow.js browser inference using the exported model.
- Added WebGL/GPU acceleration support where available.
- Improved classifier preprocessing, confidence handling, and sync behavior.
- Added supporting model-training and integration notes.

### July 22, 2026: Application integration

- Expanded the app into reusable scanner, header, scan-history, scan-details, splash, profile/device, footer, and sync components.
- Improved offline scan flow and local diagnostic storage.
- Added early promotional/video-related source, which was later removed from the main app history on August 9.

### July 24-25, 2026: Trial 2 training and model optimization

- Added performance documentation and production optimization notes.
- Retrained the model using a combined 5,329-image raw pool with a stratified 70/15/15 split.
- Recorded Trial 2 dataset split: 3,730 training images, 798 validation images, and 801 test images before class merging.
- Used MobileNetV3-Large with two-stage fine-tuning.
- Reported Trial 2 test performance: 98.25% accuracy and 0.0541 test loss.
- Exported the model as a TensorFlow.js Graph Model with 3 weight shards, approximately 11.51 MB total.
- Added `docs/model-training/TRIAL_2.md` as the report for that run. It was the shipping model until Trial 2.1 superseded it on August 22, 2026.

### July 28, 2026: Reliability and performance pass

- Added singleton model caching and shared canvas reuse to reduce repeated memory allocations.
- Added SHA-256 duplicate-photo detection.
- Added WebP compression with JPEG fallback for local image storage.
- Added 3G upload timeout handling and sync locking to avoid stacked sync jobs.
- Added Blob URL cleanup, batch database operations, code splitting, and PWA preconnect improvements.

### July 30, 2026: UI and UX redesign

- Refactored major UI surfaces into cleaner reusable components.
- Updated scanner, splash, scan history, scan details, header, footer, legal modal, icons, and information callout patterns.
- Added or refined English and Bisaya treatment-guidance text.
- Updated README and performance documentation around the app architecture.

### August 5-6, 2026: Brand assets and icons

- Replaced default app icons with MangoLeaf AI icon assets.
- Updated favicon, manifest icons, recent icons, tab icon color, and icon background behavior.

### August 7-8, 2026: Treatment guidance refinement

- Replaced placeholder treatment-guideline content.
- Improved treatment-guideline layout across scan details, scan history, and legal/supporting UI.

### August 9, 2026: App cleanup

- Removed obsolete Remotion configuration and source from the main application.
- Updated service-worker and dependency references after the cleanup.

### August 11, 2026: Current local documentation pass

- Identified `MangoLeaf_AI_Training_v1.ipynb` as the historical first training notebook.
- Identified `MangoLeaf_AI_Training_v2.ipynb` as the current retraining notebook and the preferred base for the next dataset update.
- Refreshed the manuscript draft from the supplied July 24 DOCX.
- Added a model and release versioning policy.
- Corrected stale documentation references that still pointed to the previous project name.

### August 13, 2026: Capture flow refinement (v0.2.0) and title-clarity patch (v0.2.1)

**v0.2.0 — published as a GitHub Release**

- Reworked the photo confirmation modal: replaced the Cancel button with a Retake action that reopens the same source the farmer used (camera or gallery), so a poor shot can be redone in one tap without backing out.
- Added a pre-diagnosis photo quality reminder under the modal title in English and Bisaya, covering both leaf and fruit: "Make sure the leaf or fruit is clear and in the center. If it's blurry or dark, take another photo."
- Recorded the picker source on selection so Retake reopens the correct input; preserved existing Blob URL cleanup and the on-device scan pipeline.
- Bumped the app release from v0.1.0 to v0.2.0 (feature update before final evaluation) via `NEXT_PUBLIC_APP_VERSION`. Model version unchanged at model-v2.0.0 (no retraining).

**v0.2.1 — patch**

- Renamed the confirmation modal title from "Take Photo" to a neutral "Review Photo" / "Susiha ang Litrato", since the photo is already captured or selected at that step (accurate for camera, gallery, and desktop upload alike). This shipped after v0.2.0 was already published, so it is tracked as a patch release.
- Bumped `NEXT_PUBLIC_APP_VERSION` to 0.2.1. Verified with `bun run typecheck` and `bun run lint` (0 errors).

**v0.2.2 — repository organization patch**

- Organized detailed engineering and model-training documents under `docs/`, while keeping `README.md`, `SETUP.md`, and `AGENTS.md` at the repository root.
- Added `docs/ARCHITECTURE.md` and documented the current project structure and application data flow.
- Renamed component and multiword library files to lowercase kebab-case; custom hook filenames remain camelCase.
- Added focused explanatory comments around non-obvious model-loading, synchronization, PWA-installation, version-label, and database-status behavior without changing application functionality.
- Bumped the application and package version to `0.2.2`. The model remains `model-v2.0.0` because no model files or training results changed.

### August 15, 2026: Version display label normalization

- Normalized version display labels across `.env.example`, `src/lib/app-version.ts`, and `docs/MODEL_VERSIONING.md` to use explicit `v`-prefixes directly (`v0.2.2`, `v2.0.0`).
- Removed redundant string prefix check from `src/lib/app-version.ts`.

### August 16, 2026: Collapsible scan-flow guide

- Replaced the home-screen information callout with an expanded-by-default, collapsible **How it works** guide.
- Kept the three scan steps localized in English and Bisaya, rendered as a semantic ordered list, and added accessible expanded-state controls.

**v0.2.3 â€” release preparation**

- Bumped the PWA and package version to `v0.2.3` / `0.2.3` for the collapsible scan-flow guide release.
- Kept model version `v2.0.0`; no model assets, classes, training data, or evaluation results changed.

### August 18, 2026: Version labels sourced from package.json

- Made `package.json` the single source of the footer app version. `next.config.ts` now reads its `version` field and injects `NEXT_PUBLIC_APP_VERSION` through the `env` block, so a release requires bumping one number instead of also editing `.env.local` and the hosting dashboard.
- Removed `src/lib/app-version.ts`. Its fallback logic was unreachable once the version was injected at build time, and its `package.json` import placed the whole manifest in the client module graph.
- Moved the model label to a `modelVersion` constant in `src/lib/constants.ts`. Placing it in `classifier.ts` would have made the footer transitively depend on TensorFlow.js just to print a string.
- Removed `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_MODEL_VERSION` from `.env.local` and `.env.example`. The stale `.env.local` value was `v0.2.2` and had been silently overriding the real release version.
- Added `src/env.d.ts` to type `NEXT_PUBLIC_APP_VERSION` as a required string.
- Verified against the production build: the compiled footer chunk contains the injected version literal, and the name `NEXT_PUBLIC_APP_VERSION` no longer appears in any emitted JavaScript.
- Added `.vercel` to `.gitignore` for Vercel CLI output.
- Recorded a `AGENTS.md` convention against reintroducing version labels as environment variables.

**Corrected the `v0.2.3` tag**

- The `v0.2.3` tag pointed to commit `175d7dd`, which predated an amend and did not contain `src/components/how-it-works-card.tsx`. Because `src/app/page.tsx` at that commit imported the component, a checkout of the tag could not build.
- Moved the tag to the corrected commit `50514f8`, which contains the component. The superseded commit was `175d7ddc4094ea84139b0526bfa1abd6265a40a9`.

**v0.2.4 — version-label sourcing and scan-guide layout patch**

- Refined the **How it works** step list: full-width section, `list-inside` markers, and justified body text.
- Bumped the PWA and package version to `v0.2.4` / `0.2.4`, which is now derived from `package.json` rather than an environment variable.
- Kept model version `v2.0.0`; no model assets, classes, training data, or evaluation results changed.

### August 19, 2026: Tab extraction and component reorganization

- Split the three inline `activeTab` branches out of `src/app/page.tsx` into `tab/home-tab.tsx`, `tab/history-tab.tsx`, and `tab/about-tab.tsx`. `page.tsx` still owns every piece of state and every handler and now renders one tab component per branch, so screen markup and application state are no longer edited in the same file.
- Moved the four-item home preview slice into `HomeTab`. `page.tsx` passes the full scan array and the tab decides how much of it to show.
- `AboutTab` reads `translations[language]` itself, which removed the last use of a shared `t` binding in `page.tsx`.
- Grouped `src/components/` into five subfolders by role instead of one flat directory: `brand/`, `layout/`, `modal/`, `scan/`, and `tab/`. Every folder holds at least two files and follows a single naming scheme.
- Placed `scan-history-list.tsx` under `scan/` rather than with either tab, because it is rendered in full by `HistoryTab` and as a four-item preview by `HomeTab`. Grouping by role instead of by consuming tab avoids giving shared components an arbitrary owner.
- Renamed `header.tsx` to `layout/navbar.tsx` and its export from `Header` to `Navbar` to match how the component is described in the interface.
- Named the inner function of every `memo(...)` wrapper after its export. `Navbar` had kept `function Header`, which made React DevTools and stack traces report the old name.
- Deleted `device-profile-card.tsx` and `sql-schema-card.tsx`. Neither was imported anywhere; both were left over from early development scaffolding.
- Removed the unused `AppIcon` and `NavIcon` aliases from `brand/icon.tsx`. Both re-exported `Icon` for backward compatibility with a call site that no longer exists.
- Extracted `formatTimeAgo` and `getBadgeStyles` from `scan-card.tsx` into `src/lib/format-time-ago.ts` and `src/lib/get-badge-styles.ts`. Both are pure functions with no React import, so they can be tested without rendering a component.
- Moved component imports onto the `@/components/...` alias for cross-folder references, keeping relative `./` paths only for same-folder imports.
- Replaced emoji prefixes in `console.log` diagnostics with plain `---` delimiters so log output stays readable in terminals and device logs that do not render emoji. The Realtime handler now passes its `payload` as a separate console argument instead of concatenating it into the message string, which had been logging `[object Object]`.
- Removed the trailing arrow glyphs from the `viewAllHistory` and `viewAllHistoryShort` translation strings so the label text carries no decoration, and dropped the now-inert `gap-1` from both view-all buttons, which each hold a single child after the arrow was removed.
- Fully localized relative scan times. `formatTimeAgo` previously returned `justNow` and `yesterday` from `translations.ts` but hardcoded English for its minute, hour, and day branches and formatted absolute dates with `en-US`, so a farmer using Bisaya saw entries such as "3 days ago" and "Aug 19, 2026". Added `minutesAgo`, `hourAgo`, `hoursAgo`, `daysAgo`, and a `monthsShort` array to both languages.
- Used `{n}` placeholder templates for the counted labels so plural rules stay inside `translations.ts`. English keeps separate singular and plural hour forms; Cebuano/Bisaya does not inflect the noun, so one form covers every count.
- Built absolute dates from the translated `monthsShort` array instead of `toLocaleDateString`, because browsers have no reliable Cebuano/Bisaya month data and would silently fall back to English.
- Added an explicit `Number.isNaN(date.getTime())` guard to `formatTimeAgo`. An unparseable timestamp made every comparison false and reached the absolute-date branch, which rendered `NaN`; the surrounding `try`/`catch` never fired because `new Date()` returns an invalid date rather than throwing.
- Verified with `bun run typecheck`, `bun run lint`, and `bun run build`. Lint reports the same five pre-existing unused-variable warnings as before the reorganization.

**v0.2.5 — localized scan history and UI reorganization**

- Bumped the PWA and package version to `v0.2.5` / `0.2.5`.
- Shipped localized relative and absolute scan-history dates in English and Bisaya alongside the component reorganization.
- Kept model version `v2.0.0`; no model assets, classes, training data, or evaluation results changed.

### August 22-23, 2026: Trial 2.1 retraining, temperature calibration, and model swap

Retrained the classifier to resolve a leakage problem discovered in Trial 2's dataset. Full report in [model-training/TRIAL_2_1.md](model-training/TRIAL_2_1.md).

**Why the retrain happened.** Trial 2's 5,329-image pool was assembled from local field photos and two open repositories, and the open repositories had already been augmented by Roboflow. Rotated, flipped, and re-encoded copies of the same physical leaf therefore sat in the same folder, and a random file-level split scattered those copies across train, validation, and test. 4,308 of the 5,329 images had a distance-0 perceptual-hash twin somewhere in the pool, so part of Trial 2's 98.25% measured memorization rather than generalization.

**Dataset.** Deduplicated with `imagehash.phash` computed over all 8 dihedral variants of each image, taking the lexicographic minimum as the canonical key so that a rotation or a mirror maps to the same hash. Greedy per-folder selection at `PHASH_DISTANCE = 5` left 2,762 unique images from 5,329, removing 2,567 across 1,777 duplicate groups, a 48.2% redundancy rate. `bacterial_black_spot` and `mango_scab` lost only 4 and 9 images because they are original field photography that Roboflow never inflated; every other class shrank by roughly 60%.

**Split.** Stratified 70/15/15 as stated in the manuscript, seed fixed: 1,930 train, 415 validation, 417 test. Zero exact-duplicate leakage. 5 near-duplicate pairs straddle two splits, all cross-folder and therefore carrying different labels, which per-folder deduplication cannot remove by construction. A further 49 cross-label pairs, all `anthracnose` against `healthy`, indicate mislabeling in the source data and are recorded for hand inspection before any v3 run.

**Training.** MobileNetV3-Large, two-stage fine-tuning. Replaced Trial 2's on-disk minority-class file duplication with `compute_class_weight('balanced')`, because duplicated files would have re-entered the very problem the trial exists to solve. Stage 2 explicitly freezes all 46 BatchNormalization layers, leaving 80 trainable weight tensors. That freeze is the fix for Trial 2's fine-tuning collapse, where accuracy fell from 0.9735 at the end of stage 1 to 0.8535 at the first stage-2 epoch because unfreezing the base also let the BatchNorm layers overwrite ImageNet's population statistics from small batches.

**Results.** 97.12% test accuracy (405 of 417 correct, 12 errors) and 0.0768 test loss, with a 95% Wilson score interval of roughly 95.0% to 98.3%. Every one of the 12 errors involves `bacterial_black_spot` or `mango_scab`, the two smallest training classes at 207 and 203 images and genuinely similar in appearance. The other four classes are perfect. A dedicated diagnostic ruled out residual leakage as the explanation for those perfect scores: the classes scoring 1.0000 have the *fewest* nearby training images, which is the inverse of the leakage pattern.

**Calibration.** Fitted a single scalar temperature `T = 0.754966` on the validation logits by minimizing negative log-likelihood, then folded it into the final Dense layer as `W/T` and `b/T`. Accuracy is identical to six decimal places because argmax is invariant to division by a positive constant. Because `T < 1.0` the model was underconfident, so folding *raises* confidence, which makes the fixed 70% floor a weaker out-of-scope rejector rather than a stronger one.

**Export.** TensorFlow.js Graph Model with Float16 quantization: 5.88 MB across 2 weight shards, down from 11.51 MB across 3. Verified by walking the shard bytes against the `weightsManifest` rather than trusting the file size: 199 of 199 float-valued tensors quantized, no `inf` or `NaN` anywhere. Comparing the two `model.json` files node by node found zero op-count differences (461 nodes, 62 convolutions, 2,970,642 weight scalars in both), so inference cost on device is unchanged and the whole 5.63 MB saving is a transfer saving.

**App changes.** Swapped `public/model/`, deleting the three stale `of3` shards and adding `model_config.json`. Bumped `modelVersion` in `constants.ts`, renamed the Serwist runtime cache, and added an `activate` handler that deletes superseded model caches. The rename was written that day as the mechanism that stops an already-installed PWA from serving the Trial 2 weights forever, which is not correct. `PrecacheRoute` registers ahead of `runtimeCaching`, so the `CacheFirst` rule for `/model/*` never fires, and the changed precache revision hash is what actually forces the refetch. The rename and the eviction handler are still worth keeping, as defence in depth and to reclaim the old 11.51 MB from the device. The labels written that day were `v2.1.0` and `mangoleaf-model-cache-v2-1`. Both were superseded the following day by `v2.1.1` and `mangoleaf-model-cache-v2-1-1`, before anything was committed, so neither label ever reached a device. In `classifier.ts`, the confidence check now compares the raw probability instead of a two-decimal rounding that let `0.695` clear a `0.70` gate, and optional margin and normalized-entropy checks read from `model_config.json`, fetched in parallel with the weights. Deleted the unreferenced `_fix_conv.py` from the repository root; it had never been git-tracked and carried a `sysconfig.get_paths()["purelib"]` path bug that would have silently no-opped in Colab.

**Known gap at the time.** `marginThreshold` and `entropyThreshold` shipped as `null` in `model_config.json` because no out-of-scope image set existed to fit them against. Only the 70% floor ran, and at 97.2% mean top-1 confidence it rejected almost nothing, so a photograph of something that is not a mango leaf still received a confident disease label. This is structural to a six-class softmax rather than a regression. **Closed on August 24, 2026** by the threshold-fitting run below; both values are now fitted and active.

- Verified with `bun run typecheck`, `bun run lint`, and `bun run build`, all exiting 0. Confirmed the generated `public/sw.js` carries the new cache name and lists exactly two weight shards.
- Not committed on the day of the swap. Committing adds 5.88 MB of binaries to git history permanently, on top of Trial 2's 11.51 MB. The model shipped instead as part of the v2.1.1 commit described below, so the intermediate `v2.1.0` state has no commit of its own.


### August 23, 2026: Static asset move and a gitignore anchoring fix

`public/icons/` was moved to `public/images/icons/`, and `public/images/mangoleaf-architecture.svg` was added as the diagram embedded by `docs/ARCHITECTURE.md`. All six URL references were repointed correctly, three in `src/app/layout.tsx` and two in `src/app/manifest.ts`, plus the image link in `ARCHITECTURE.md`.

The move exposed a latent `.gitignore` defect. The file carried a bare `images` pattern, written for a root scratch folder that is now empty. A pattern with no slash matches a directory of that name at any depth, so the moved icon tree became invisible to git the moment it was renamed. The old `public/icons/**` paths remained tracked and were staged as deletions, while none of the eight replacement files could be added. A commit in that state would have produced a repository with no icon files at all: no favicon, no Apple touch icon, and no 192x192 or 512x512 `maskable` PWA icons. Because `manifest.ts` declares those two and browsers require a declared icon of at least 192x192 to be fetchable, the deployed application would have been uninstallable.

Two properties of git made this hard to notice. Ignored paths are not listed as untracked, so `git status` showed only the deletions and never mentioned the new directory. A negation such as `!public/images/` would not have helped either, because git does not descend into a directory that a parent pattern has already excluded, so the offending pattern itself had to change.

The bare `images` was replaced with an anchored `/images/` plus an explicit `/video/.media/images/`, which preserves the previous effect on the video production assets while leaving `public/images/` tracked. Verified with `git check-ignore -v`, which now reports nothing for the icon files and still reports the video media, and with `git status --short public/`, which now lists `public/images/` as untracked and therefore addable.

Two observations recorded while inspecting the generated service worker, neither a defect:

- The Serwist precache manifest covers every file under `public/`, so the 12 KB architecture diagram is now downloaded to each installed device even though only the documentation uses it. Moving it to `docs/` would remove it from the manifest.
- Precache URLs generated on Windows contain backslash separators, for example `/images\icons\png\icon-192x192.png`. These resolve correctly, because the WHATWG URL parser treats a backslash as a path separator for HTTP URLs and Serwist derives every cache key through `new URL()`. A Linux build of the same commit emits forward slashes, so the two produce a noisy diff of an identical service worker.


### August 24, 2026: out-of-scope threshold fitting and model v2.1.1

168 out-of-scope photographs were collected and fitted against the Trial 2.1 resume bundle. **No retraining occurred**, and the weight files are byte-identical to the August 23 export; only `model_config.json` changed. The work is recorded in `MangoLeaf_AI_Threshold_Fitting_v2_1_1_Results.ipynb`.

**Split.** The 168 images were split in half by a fixed seed: 84 for fitting the thresholds and 84 held back for reporting, so the reported rejection rate is measured on images the thresholds never saw.

**Fitted values.** Margin threshold `0.55`, entropy threshold `0.30`, both selected to keep in-distribution retention at or above 95% on the 417-image test set. Measured results: **95.2% retention** (397 of 417 test images still accepted) and **51.2% out-of-scope rejection** (43 of 84 reporting images rejected). Accuracy on the accepted subset rises to **99.24%**, because the checks remove three quarters of the model's 12 errors. The 95% binomial confidence interval on the rejection rate is roughly 40.5% to 61.9%, since 84 images is a small sample; quote the interval alongside the point estimate.

**The 70% confidence floor was not tuned.** It is a fixed manuscript specification cited to [31]. Only margin and entropy were fitted.

**Float16 safety band, measured rather than borrowed.** The thresholds are fitted on float32 weights in Colab and shipped as float16, so the conversion shift matters. Measuring per-signal on the reporting set gave a worst-case shift of `0.010638` for entropy and `0.053285` for margin. Scaling by 1.489 to account for `WEBGL_FORCE_F16_TEXTURES` activation quantization gives `0.015841` and `0.079346`. Both fitted thresholds sit further than that from their decision boundaries. This supersedes the earlier blanket advice to leave a 0.05 band, which came from the top-1 confidence shift of `0.040207` and was the wrong quantity for these two signals.

**App changes.** `model_config.json` rewritten with the fitted thresholds, `modelVersion` bumped to `v2.1.1` in `constants.ts`, runtime cache renamed to `mangoleaf-model-cache-v2-1-1`, and both `mangoleaf-model-cache` and `mangoleaf-model-cache-v2-1` listed in `OUTDATED_MODEL_CACHES` for eviction. The confidence badge in `scan-details-modal.tsx` is now hidden on `Uncertain / Unrecognized` results, where a percentage would have implied a confidence in a rejection. The English terms text in `legal-modal.tsx` was updated to name all three gates.

**Field evidence from four rejected phone scans.** Confidence rejected nothing and margin rejected nothing; entropy rejected all four. Every one of them cleared the 70% floor at 0.7720, 0.8467, and 0.8501, and every one cleared the 0.55 margin at 0.5962, 0.7626, and 0.7617. A 70%-only build would have labelled sky, gourds, and avocados as mango diseases at 77% to 85% displayed confidence. Two caveats: one scan's entropy of `0.3096` clears the `0.30` line by only `0.0096`, which is inside the `0.0158` scaled float16 band, so it is not robust evidence; and a photograph of lemons returned `Healthy` at 100%, a genuine closed-set miss and one of the roughly 48.8% that slips through. Fixing that case needs a seventh class or an open-set method, both out of scope for v2.1.1.

**Still open at the end of that day.** The phone session was a development build with Fast Refresh present, so the service worker and precache paths were never exercised. Production-build verification was outstanding on every platform. The desktop half was closed the following day, recorded below; the phone half is still open.


### August 25, 2026: local production verification, Bisaya terms parity, and the v0.2.6 release

**Local production verification of the model swap.** Serwist is disabled in development by `disable: process.env.NODE_ENV === "development"` in `next.config.ts`, so the service worker, the precache, and the offline path are only ever exercised by a production build. `bun run start` cannot serve this project: `output: "export"` means there is no server, and `next start` exits with `Error: "next start" does not work with "output: export" configuration`. The static bundle in `out/` was served with `bunx serve out` instead, over `localhost`, which is a secure context and therefore registers a service worker. A LAN address such as `http://192.168.x.x:3000` is not a secure context, so testing a phone against the development server registers no service worker and verifies nothing; phone verification needs the deployed HTTPS URL.

Results on that build, which carried app version `v0.2.5` and model `v2.1.1`. The service worker reached `activated and is running`. The precache manifest lists both weight shards, `model.json`, and `model_config.json`, each with its own `__WB_REVISION__` hash, alongside the icons moved to `/images/icons/` and the architecture diagram. The console printed `Model config loaded: margin=0.55, entropy=0.3` rather than `null`, which confirms the fitted thresholds are read on device. The footer showed the injected version pair. The confidence badge was absent on `Uncertain / Unrecognized` cards. Inference ran with the network disabled.

Two out-of-scope photographs were rejected during the session, and both are stronger evidence than the four development-build scans recorded on August 24, because each failed **all three** gates rather than entropy alone:

- Avocados: `confidence=0.6704`, `margin=0.3989`, `entropy=0.4600`.
- A bruised green mango: `confidence=0.5552`, `margin=0.1128`, `entropy=0.3919`.

The bruised mango is a real Carabao mango with physical damage that belongs to no class in the six-class mapping, so rejecting it is correct behaviour rather than a failure. It is also a limitation worth stating in the manuscript, because a farmer photographing damaged fruit gets no diagnosis. Combined with the August 24 scans, entropy has now rejected six of six, but confidence and margin do fire on harder inputs. That is the argument for keeping three gates rather than raising the confidence floor.

Five of the six classes were accepted during the session. **`mango_scab` was not tested on any build.** It is one of the two classes that account for every one of the model's 12 test errors, so it is the weakest remaining point in the verification.

**Bisaya terms parity.** Item 2 of the Bisaya terms text in `src/components/modal/legal-modal.tsx` named only the 70% floor while the English item named all three gates. It now names the prediction-margin and entropy criteria as well, and states that a result failing any of the three is flagged `Uncertain`. Apostrophes are written as `&apos;` because `react/no-unescaped-entities` ships enabled through `eslint-config-next/core-web-vitals` and errors on a raw apostrophe in JSX text.

**`public/sw.js` is a tracked build artifact and goes stale on any source change.** `NEXT_PUBLIC_APP_VERSION` is injected from `package.json` by the `env` block in `next.config.ts`, so any source edit or version bump changes the `_next/static` chunk hashes inside the precache manifest. The committed copy therefore has to be regenerated and recommitted alongside whatever invalidated it, which is why the Bisaya fix and the version bump each carry a one-line `public/sw.js` diff. The model precache entries stayed byte-identical across every rebuild that day, so no model re-invalidation was triggered. Whether to keep tracking the file at all is undecided; `eslint.config.mjs` already ignores `public/sw.js*`.

**README title fix.** The repository header was a `<div style="display: flex; ...">` wrapping the icon and a `<span style="font-size: 2.3em">`. GitHub's markdown sanitizer strips `style` attributes but permits `align`, so on GitHub the icon floated left, the title rendered as small plain body text, and the document had no H1 at all. The defect is invisible in the VSCode preview, which applies inline styles. Replaced with `<h1 align="center">`, which survives sanitization. No `style` attribute remains in the file.

**Notebooks committed.** `MangoLeaf_AI_Training_v2.1.ipynb`, `MangoLeaf_AI_Training_v2_1_Post_Training.ipynb`, and `MangoLeaf_AI_Threshold_Fitting_v2_1_1_Results.ipynb` were added in one commit, 8,344 inserted lines across the three files. The post-training notebook is the manuscript evidence file and none of its cells may be rerun.

**v0.2.6 — Trial 2.1 model and three-gate rejection ship to the app**

- Bumped the PWA and package version to `v0.2.6` / `0.2.6`. This is the first app release that ships the Trial 2.1 weights, the folded temperature, and the fitted margin and entropy thresholds. The model work itself landed across August 22 to 24 with no app release of its own.
- Model version stays `v2.1.1`. The weight shards are byte-identical to the August 23 export; only `model_config.json` differs from the intermediate state.
- Two annotated tags were created and pushed: `model-v2.1.1` on commit `9b31c7b`, and `v0.2.6` on commit `e493009`. Three-part model tags are kept to match the existing `model-v2.0.0`, and `model-v2.1.0` is deliberately skipped because that state was never committed and never reached a device.
- The GitHub Release for `v0.2.6` is not published yet. A tag is only a named pointer into history; the Releases page is a separate layer and the only one of the three that appears in the repository sidebar.


## Current Notebook Decision

Keep all three training notebooks, and keep the two Trial 2.1 files separate. All notebooks live in `notebooks/` at the repository root, moved there from the root on August 25, 2026 so the folder does not accumulate one loose file per retraining cycle. The filenames below are unchanged.

- `MangoLeaf_AI_Training_v1.ipynb` is the Trial 1 baseline and historical proof of the first training approach.
- `MangoLeaf_AI_Training_v2.ipynb` is the Trial 2 record. It is no longer the retraining template, because it lacks perceptual-hash deduplication, class weighting, the BatchNorm freeze, temperature calibration, and the resume-artifact export.
- `MangoLeaf_AI_Training_v2.1.ipynb` is the **clean retraining template**, 33 code cells with outputs cleared. Copy this one for the next cycle.
- `MangoLeaf_AI_Training_v2_1_Post_Training.ipynb` is the completed Trial 2.1 run with every output preserved. It is the manuscript evidence file: it holds the 97.12% figure, the per-class report, the confusion matrix, `T = 0.754966`, and the Float16 verification that the manuscript quotes. **Do not rerun any cell in it.** Rerunning overwrites the numbers the manuscript cites.
- For the next retraining cycle, copy `MangoLeaf_AI_Training_v2.1.ipynb` to a new versioned notebook named after the model version it produces. A new or expanded dataset is a major change, so the next cycle is `v3`: it lands in a new 70/15/15 split and therefore a new test set, which makes its accuracy a different measurement rather than a higher or lower version of 97.12%. Reserve `v2.2` for a retrain on the same images with a changed procedure. See `docs/MODEL_VERSIONING.md` for the full rule. Then update the dataset, metrics, and export notes there. Do not overwrite a completed training run without recording what changed.
- The template's final cell writes the resume bundle to Drive: the calibrated `.keras` file at roughly 35 MB, `y_prob_cal.npy`, `y_true.npy`, and `resume_info.json`. That cell is not optional. Without it the trained weights are lost when the Colab session ends, and thresholds fitted after a fresh retrain would not match the weights already shipped in the app.

## Current Model Baseline

- Architecture: MobileNetV3-Large
- Runtime format: TensorFlow.js Graph Model, Float16 quantized
- Classes: six output classes after healthy leaf and healthy fruit are merged into one `healthy` class
- Current documented training run: Trial 2.1, August 22, 2026
- Current documented test result: 97.12% accuracy and 0.0768 test loss on 417 deduplicated test images
- Current documented export size: 5.88 MB across 2 weight shards, plus `model_config.json`
- Current app model version label: `v2.1.1`
- Calibration: temperature `T = 0.754966` folded into the final Dense layer
- Rejection: three gates, all active. Fixed 70% confidence floor, fitted margin threshold `0.55`, fitted normalized-entropy threshold `0.30`. Measured 95.2% in-distribution retention and 51.2% out-of-scope rejection on 84 held-out non-mango images, with a 95% confidence interval of roughly 40.5% to 61.9%.

Trial 2's 98.25% is superseded, not beaten. The lower Trial 2.1 figure is the honest one, because near-duplicate images were removed before splitting. Do not present Trial 2.1 as more accurate than Trial 2.

## Next Work

- Fill the measured rejection numbers into the manuscript's future Results chapter. Quote 51.2% (43 of 84 held-out images) together with its 40.5% to 61.9% confidence interval, and lead with the two stronger framings: three quarters of the model's errors are caught, and accuracy on accepted predictions rises to 99.24%. Never quote a rate computed from a handful of phone scans.
- Apply the modifications recorded in [MANUSCRIPT_MODIFICATIONS.md](MANUSCRIPT_MODIFICATIONS.md) to the manuscript draft.
- Test the swapped model on a **production build on a physical phone**. The desktop half of this item is done and recorded in the August 25, 2026 entry above. The phone half needs the **deployed HTTPS URL**, because a LAN address such as `http://192.168.x.x:3000` is not a secure context and registers no service worker at all. Confirm the footer reads `v0.2.6` and `v2.1.1`, that the console prints real margin and entropy values rather than `null`, that a non-mango photograph returns `Uncertain / Unrecognized`, and that at least one real scan per class is still accepted. Verify caching against the **precache manifest** in the generated `public/sw.js`, not against `CacheStorage` contents: every `/model/*` file is in the Serwist precache, which registers ahead of `runtimeCaching`, so the `CacheFirst` route never fires and `mangoleaf-model-cache-v2-1-1` can legitimately be empty. The precache revision hash is what actually invalidates a replaced model; the cache-name bump is defensive only.
- Accept one real `mango_scab` photograph on a production build. It is the only class never tested on either the desktop production build or the phone, and it is one of the two classes responsible for all 12 test errors, so it is the weakest point in the verification.
- Decide whether the Trial 2.1 record gets a v2.1.1 addendum or its own `TRIAL_2_1_1.md`. No retraining happened, so an addendum is the more honest option.
- Export `"Uncertain / Unrecognized"` as a shared constant. The literal is currently duplicated between `src/lib/classifier.ts` and `src/components/modal/scan-details-modal.tsx`, where a typo in either copy would silently show a confidence badge on a rejection.
- Decide whether to keep tracking `public/sw.js`. It is a generated file whose precache manifest embeds the `_next/static` chunk hashes and the injected app version, so it goes stale on any source or version change and has to be regenerated and recommitted alongside it.
- Inspect the 49 cross-label near-duplicate pairs by hand before any v3 run. Every one is `anthracnose` against `healthy`, so one label in each pair is wrong.
- Consider raising `STAGE2_EPOCHS` above 10 for a v2.2 run. Validation loss was still improving at the final stage-2 epoch, so training stopped early rather than converging.
- Collect more `bacterial_black_spot` and `mango_scab` field photographs. They are the two smallest training classes and they account for all 12 test errors.
- Freeze the next dataset snapshot before retraining, and split by physical leaf group rather than by file if the new data again contains multiple photographs of one leaf.
- Record class counts, split seed, augmentation plan, metrics, confusion matrix, model size, and export checksum for every new run.
- Re-run `bun run typecheck`, `bun run lint`, and `bun run build` before publishing a new app release.
- Publish the GitHub Release for `v0.2.6`. The annotated tag is already pushed, but a tag is only a named pointer into history; the Releases page is a separate layer and the only one of the three that appears in the repository sidebar. Repository, then Releases, then Draft a new release, then select the existing `v0.2.6` tag rather than creating one. Keep preparing separate releases for app milestones and model milestones.

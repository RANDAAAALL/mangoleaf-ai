# MangoLeaf AI Development Progress

Last updated: August 29, 2026

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
- The GitHub Release for `v0.2.6` was published on August 24, 2026, titled "v0.2.6 — Trial 2.1 model with out-of-scope rejection". A tag is only a named pointer into history; the Releases page is a separate layer and the only one of the three that appears in the repository sidebar.
- **Only app tags get a Release.** `model-v2.0.0` and `model-v2.1.1` are bare tags with no Release page, and that is deliberate: a model tag is a provenance marker so `git checkout model-v2.1.1` returns exactly the weights that produced the reported metrics. It is not an announcement. Every published Release in this repository sits on a `v0.*` app tag.

**v0.2.7 — organ-label removal and a filter for rejected scans**

- **The scan card claimed an organ the model cannot identify.** Each card carried a "Leaf Scan" or "Fruit Scan" heading derived from the predicted class name: `disease_name.includes("scab") || disease_name.includes("black")` meant Mango Scab and Bacterial Black Spot printed "Fruit Scan" and everything else, including a rejected scan, printed "Leaf Scan". The model has six outputs and none of them encodes an organ, `ScanRecord` has no organ field, and `healthy_leaf` and `healthy_fruit` were deliberately merged into a single `healthy` class during training, which destroyed the organ information for exactly the class that misfired. A photograph of a healthy mango fruit therefore displayed "Leaf Scan".
- **The app's own guideline text disproves the split.** Every one of the six classes affects both organs: the anthracnose entry treats emerging leaf flushes in order to protect flowers and fruit, the bacterial canker entry says to monitor leaves as an early warning for fruit infection, and the mango scab and sooty mold entries both prescribe burning fallen leaves and bagging fruit. The decisive case is that `bacterial_black_spot` states it is caused by "the same Xanthomonas pathogen as Bacterial Canker", yet the heuristic labelled Black Spot as fruit and Canker as leaf. One pathogen, two opposite organ labels, provable from the strings shipped in `src/lib/constants.ts`.
- **Removed rather than repaired.** Suppressing the heading only for `Uncertain / Unrecognized` would have left it wrong for the four accepted classes it also mislabels. The only sound source of organ information is asking the farmer at capture time and storing it as a new `ScanRecord` field, which is a Dexie schema change plus a Supabase column, not a patch. The two derived constants and the `<h4>` are gone, the now-single-child flex wrapper collapsed, and the four `leafScanLabel` and `fruitScanLabel` translation keys were deleted from both `en` and `bis`.
- **`UNCERTAIN_LABEL` extracted to `src/lib/constants.ts`.** The literal `"Uncertain / Unrecognized"` was written out in `classifier.ts` where it is produced and again in `scan-details-modal.tsx` where it is compared, so a typo in either place would silently show a confidence badge on a rejected scan. Both sites now read the constant, and the JSDoc in `classifier.ts` names it instead of quoting it.
- **Rejected scans are now filterable.** The history filter listed the six classes and nothing else, so there was no way to review what the three rejection gates had turned away. Added an `uncertain` option. The existing `matchesFilter` is a substring test rather than an equality test, so the single word is enough and no real class name contains it. The search box already matched these records; the dropdown was the only gap.
- **Delete button visible on touch devices.** The trash icon was `text-slate-300 hover:text-rose-600`, and a hover state never fires on a touch screen, so on a phone it stayed light grey against white. Now `text-rose-600 sm:text-slate-300 sm:hover:text-rose-600`, which keeps the desktop hover reveal and shows the icon outright on mobile.
- Also centred the About tab heading and widened the README icon from 50 to 80 pixels.
- Model version stays `v2.1.1` and `MODEL_CACHE` stays `mangoleaf-model-cache-v2-1-1`. Nothing in `public/model/` changed, and the four model precache entries are byte-identical across the rebuild. `public/sw.js` was regenerated after the version bump so the committed manifest matches the shipped bundle hashes.


### August 26-27, 2026: Trial 3 retraining, threshold refit, and the v0.3.0 release

Retrained the classifier on a new image pool and shipped it. Full report in [model-training/TRIAL_3.md](model-training/TRIAL_3.md).

**Dataset.** A new snapshot of 5,098 raw images. Perceptual-hash deduplication reran with the Trial 2.1 settings unchanged, `phash` over 8 dihedral variants at distance 5, and removed 2,495 redundant files across 1,714 duplicate groups, leaving 2,603 unique. Redundancy at 48.9% is essentially identical to Trial 2.1's 48.2%, which is expected because the same Roboflow-augmented repositories dominate both pools. Split 70/15/15 stratified at seed 42: 1,819 train, 391 validation, 393 test.

**Two data defects carried forward unfixed.** 49 cross-label duplicate pairs, all `anthracnose` against `healthy`, and 5 near-duplicate pairs straddling two splits. Both counts are unchanged from Trial 2.1, which means the hand inspection that TRIAL_2_1.md flagged as required before a v3 run did not happen. The cross-label pairs inflate test accuracy by an unmeasured amount and are the largest known threat to the headline figure.

**`mango_scab` shrank.** It fell from 291 unique images to 225, so its loss weight rose to 1.931 and it is now the smallest class by a wide margin. It is also the weakest, at 0.9014 F1 on 34 test images. Restoring that class is the highest-value dataset action before any Trial 4.

**Training.** MobileNetV3-Large, unchanged architecture and unchanged two-stage schedule: 5 epochs at `1e-3` with the base frozen, then 10 epochs at `1e-5` with the base unfrozen and every BatchNormalization layer explicitly frozen. Augmentation gained a vertical flip, which is a physically plausible photograph and therefore a legitimate widening rather than label noise. Test accuracy **97.46%** (383 of 393 correct, 10 errors) at 0.0686 test loss. Best validation loss `0.0982` landed on epoch 15, the final epoch, so the model was still improving when training stopped.

**Six of the 10 errors are `bacterial_black_spot` against `mango_scab`** in one direction or the other. Those are the two smallest classes and the two whose folders are original field photography rather than Roboflow output. `bacterial_canker` and `anthracnose` are perfect on recall.

**Calibration.** Fitted `T = 1.188751` on the validation logits and folded it into the final Dense layer as `W/T` and `b/T`. Validation NLL improved from 0.098212 to 0.096231. Note the direction: `T > 1` means the model was **over**confident, so folding *lowers* confidence and makes the fixed 70% floor a stronger out-of-scope rejector. Trial 2.1's `T = 0.754966` did the opposite. The two trials were miscalibrated in opposite directions, so no calibration behaviour carries over between them.

**The training run shipped a dead margin gate, and the refit fixed it.** `run_record.json` recorded `marginThreshold: 0.0`, which is vacuously true for every input, so the margin gate rejected nothing. Two causes compounded: the sweep started at margin 0.00, and the candidate comparison used a strict `>`, so 0.00 won every tie by being tried first. Refitting found **88 tied `(margin, entropy)` pairs across 44 distinct margins from 0.00 to 0.43**, all at the same tune rejection of 0.8690, so the threshold was free to be chosen and the training run chose the only value that does nothing.

**Margin `0.40` was selected on half-float robustness, not on nominal metrics.** All 88 pairs are identical nominally. The largest tied margin, 0.43, fails the 95% retention floor once the measured half-float band is applied, falling to 94.1% because 4 test images sit within one band-width of the 0.43 line. Only 1 image sits that close to 0.40, which holds 95.2%. `0.40` is not provably the largest margin that holds the floor; the band-aware search maximized worst-case rejection first and margin second, so 0.41 and 0.42 were never tested.

**The export is float32, not float16, and that is safe.** `run_record.json` records `"quantizeFloat16": false` and the shipped `model.json` contains zero per-weight `quantization` blocks against Trial 2.1's 199. Halving the Trial 3 weight bytes gives 5,941,284, within 100 bytes of Trial 2.1's float16 total of 5,941,384, which proves it is the same graph at twice the precision. `src/lib/classifier.ts` sets `WEBGL_FORCE_F16_TEXTURES`, so the WebGL backend uploads every weight into a half-float texture regardless of the file's precision and the extra 5.67 MB buys no accuracy on a phone. Direct inspection of the three shipped shards confirms it is safe: 212 tensors, **0 exceeding the 65,504 half-float ceiling**, largest weight `117.53` in `expanded_conv_7_project_bn/batchnorm/sub`, which is 557× headroom. The Keras model's overflowing `expanded_conv_depthwise_bn/moving_variance` at 243,318.3 does not exist in the deployed graph, because the converter folds BatchNorm into the preceding convolution. Re-exporting with `--quantize_float16` would recover the 5.67 MB and is safe, but was judged not worth another Colab run for a numerically neutral change.

**Provenance closed.** All four SHA-256 checksums in `run_record.json` match the files in `public/model/` exactly, which proves the shipped weights are the same artifact the thresholds were fitted on.

**All nine notebooks were deleted from `notebooks/`.** The five Trial 1 through 2.1 files were committed and were restored with `git checkout -- notebooks/`; all five are back on disk and tracked. The four Trial 3 files were never committed, are matched by no `.gitignore` pattern, and are absent from the Recycle Bin and from every other directory in the user profile, so git cannot recover them. The Colab copies in Google Drive are the only surviving originals. Every number they held survives in `run_record.json`, in `figures/per_class_metrics.csv`, in `public/model/model_config.json`, and in TRIAL_3.md, so no measurement was lost, but the evidence files themselves were. Commit them the moment they are re-downloaded.

**v0.3.0 — Trial 3 model ships to the app**

- The three coupled model-swap changes all landed. `public/model/` now holds `group1-shard1of3.bin` through `group1-shard3of3.bin` plus `model.json` and a rewritten `model_config.json`; `modelVersion` in `src/lib/constants.ts` is `v3.0.0`; `MODEL_CACHE` in `src/sw.ts` is `mangoleaf-model-cache-v3-0-0` with `mangoleaf-model-cache-v2-1-1` added to `OUTDATED_MODEL_CACHES`.
- **The shard count reversed direction from last time.** Trial 2.1 shipped two `of2` shards and Trial 3 ships three `of3`, so neither export overwrites the other's files. Both stale `of2` shards were deleted by hand before the build. This is the second appearance of the orphan trap and the second time it pointed the other way, so never assume the new export has more shards than the old one.
- `model_config.json` deliberately renames every `float16*` field from the refit notebook to `halfFloat*`, because the shipped export is float32 and keeping the old names would plant a false claim in the manuscript. It also records `largestDeployedWeight: 117.5306` and annotates the pessimistic scaled band as a loose upper bound rather than a measurement.
- **The About tab was advertising 98.25%,** which is Trial 2's leakage-inflated figure and was two model versions stale. `aiEngineDesc` in both the `en` and `bis` blocks of `src/lib/translations.ts` now reads 97.46%. This is the only user-visible accuracy claim in the app, and it had survived the entire Trial 2.1 cycle unnoticed because the swap checklist covers `public/model/`, the version constant, and the cache name, but never mentioned the copy.
- Verified: `bun run typecheck` clean; `bun run build` compiled successfully with TypeScript clean and 4 of 4 static pages; `bun run lint` reported 0 errors and 5 pre-existing unused-variable warnings, none in changed files; the regenerated `public/sw.js` precache manifest carries all five `/model/` files with fresh revision hashes, all three shards as `of3`, and no `of2` entries.
- The app bump is minor while the model bump is major. That is normal: the only source diff is version strings and a cache name, but the new image pool produced a new test set, which makes the model change major regardless of how small the app diff is.
- Two annotated tags were created and pushed, both on the release commit `f73f0b8`: `model-v3.0.0` and `v0.3.0`. They share a commit because the weights, the thresholds, and the version bumps landed together, which is correct — thresholds and weights are one calibrated artifact. Only `v0.3.0` gets a GitHub Release, following the pattern set by `model-v2.0.0` and `model-v2.1.1`, which are bare provenance tags.

### August 28, 2026: About tab rebuild, result-colour system, and mobile navigation polish

- Rebuilt the existing About tab as a mobile-first product story: field motivation, offline/on-device/sync capabilities, the verified 97.46% Trial 3 model-accuracy showcase, research-to-application timeline, and scan-sheet CTAs. It intentionally does not repeat Home tab scan steps, condition lists, or recent scans.
- Replaced per-disease presentation colors with one red disease treatment (`bg-red-100`, `#FF2C2C` text and dots); the healthy treatment remains green. Removed the now-unused `color` field from the Supabase and IndexedDB guideline shape, cached fallback data, synchronization flow, and scan-history props.
- Changed disease result badges to solid `#FF2C2C` with white text after review; healthy result badges remain green.
- Removed `public.guidelines.color` after application readers stopped using it. Existing guideline text and all six rows were preserved.
- Synced every bundled offline fallback guideline byte-for-byte with its corresponding Supabase `public.guidelines` row, including the stored line breaks and color labels. Supabase remains the source of truth for these records.
- Fixed footer legal links hidden behind the fixed bottom navigation bar on mobile by adding `pb-28` clearance and allowing the Privacy Policy / Terms of Service row to wrap for longer Bisaya labels.
- Added shared CSS motion utilities in `src/app/globals.css` for tab content fade-slide, scan-sheet slide-up/down, and backdrop fade.
- `ScanSheet` now animates open and closed, and the drag handle supports swipe-down-to-dismiss past an 80px threshold.
- Bottom navigation tab switches use a short fade-slide transition and scroll the page back to the top.
- Fixed scan-sheet swipe dismiss calling parent `setState` inside a `setDragY` updater, which triggered React's cross-component render warning.
- Tab content and bottom-nav items now slide by direction: Home → About → History moves left-to-right; reverse moves right-to-left. Scan FAB and language toggle excluded.
- Simplified tab switches to fade-only content transitions; bottom-nav active scale and sliding green dot removed.
- Scan sheet swipe now animates smoothly on partial release and on dismiss, without replaying the open animation or sticking mid-drag.
- Fixed swipe-dismiss snap-back: dismiss no longer resets `dragY` before close, and `isDismissing` blocks `sheet-enter` from replaying while the sheet slides off screen.
- Later refined the Home coverage panel to use neutral disease-list dots instead of red disease pills, reducing visual noise while keeping solid red result badges in scan cards.

### August 29, 2026: Component consolidation

- Merged the active visual home layout into `tab/home-tab.tsx`; removed the temporary `home-tab-v2.tsx` name so the app has one canonical Home tab component.
- Promoted reusable Leaf, Fruit, and Check SVGs into the shared `brand/icon.tsx` icon registry. `disease-coverage-card.tsx` now consumes those icons instead of defining local SVG components.
- Removed unreferenced legacy `layout/navbar.tsx` and `scan/how-it-works-card.tsx` after confirming current routing uses `TopHeader`, `BottomNav`, and `HowItWorksSteps`.
- Audited `translations.ts` against source usage and removed stale scanner-progress, legacy how-it-works paragraph, legacy hero labels, disease-count, and footer-subtitle entries. Existing explanatory comments were preserved.

### August 29, 2026: Offline synchronization reliability pass

- Corrected the Storage upload timeout so it reaches the fetch call actually used by Supabase JS. A stalled upload now aborts after 10 seconds rather than holding the synchronization lock.
- Pending scans retry with bounded exponential delays while online. A sync trigger that arrives during active work queues one follow-up pass, so a newly saved local scan is not missed.
- Stored a completed image URL locally before inserting its metadata row, avoiding an unnecessary re-upload if only the database request fails. Remote history restoration now uses a batched IndexedDB existence lookup, and guideline deletes also propagate through Realtime.
- Confirmed the current model artifact, class order, thresholds, and inference source are unchanged. All four shipped Trial 3 checksums still match the model-training record, so the documented 97.46% test accuracy is unchanged.

### August 29, 2026: v0.4.0 release preparation

- Bumped the PWA and package version to `v0.4.0` / `0.4.0` for the reviewed mobile field-experience redesign, six-condition presentation refinement, component cleanup, and synchronization reliability work.
- Model version stays `v3.0.0`. No files in `public/model/`, model class mapping, rejection thresholds, or inference logic changed; Trial 3 remains the 97.46% documented model baseline.
- Release verification passes: `bun run typecheck`, `bun run lint`, and `bun run build`. The regenerated service-worker manifest still precaches all five Trial 3 model files.
- One annotated tag was created and pushed: `v0.4.0` on the release commit `af3474d`, with the message "MangoLeaf AI v0.4.0 - mobile field experience and resilient offline sync". No model tag belongs to this release, because `public/model/` is untouched and `model-v3.0.0` still describes the shipped weights.
- The GitHub Release "MangoLeaf AI v0.4.0" was published on August 29, 2026 and is the current Latest release. It is the eleventh published Release, and like the ten before it, from `v0.1.0` onward, it sits on a `v0.*` app tag. No model tag has ever had a Release page.

### August 29, 2026: v0.4.0 production verification on a physical phone

- The `v0.4.0` production build was verified on a physical phone against the deployed HTTPS URL. All four checks passed: the footer reads `v0.4.0` and `v3.0.0`, the console prints `margin=0.4, entropy=0.4` with neither value `null`, a non-mango photograph returns `Uncertain / Unrecognized`, and one real `mango_scab` photograph was accepted.
- **The `mango_scab` acceptance closes the longest-standing verification gap in the project.** It was the outstanding item after Trial 2.1 and it survived the whole Trial 3 cycle unclosed, so the weakest class had never once been confirmed to pass the three gates on a real device across two model versions. `mango_scab` is the weakest class at 0.9014 F1, it appears in 6 of the 10 test errors, and it lost 66 unique images between trials, which is why it was the one class worth testing by hand.
- What this establishes and what it does not: the three gates do not categorically reject the weakest class on a real phone photograph, and the deployed thresholds are live rather than `null`. It is a single scan, so it measures no rate. Do not quote it as an acceptance rate for `mango_scab` or for anything else, in the manuscript or elsewhere; the 95.17% in-distribution retention figure from the threshold refit is the only retention number with a test set behind it.
- Per-scan confidence values were not recorded. Capture them next time, because a scan that is accepted at 0.71 and a scan accepted at 0.98 say very different things about how much headroom the 70% floor leaves the weakest class.
- The other five classes were not each tested by hand in this pass.

### August 29, 2026: v0.4.1 bottom-navigation padding patch

- Changed the bottom navigation's inner flex row from `px-1` to `p-1` in `src/components/layout/bottom-nav.tsx`, adding 0.25rem of vertical padding to the row. The `<nav>` element's own `paddingBottom: max(0.25rem, env(safe-area-inset-bottom))` is unchanged, so on a device with a home-bar inset the two paddings stack and the fixed `h-16` row loses 0.5rem of content height. This was checked on a phone before shipping and is the wanted appearance.
- Bumped the PWA and package version to `v0.4.1` / `0.4.1`. A one-line padding change still needs a version bump, because a version label exists to tell one deployed client from another: shipping this under the `v0.4.0` label would leave two different builds both reporting `v0.4.0` in the footer, which is the one place a phone can be asked what it is running.
- Model version stays `v3.0.0`. Nothing in `public/model/`, the class mapping, the thresholds, or the inference path changed, so no model tag belongs to this release and `model-v3.0.0` still describes the shipped weights.
- Regenerated `public/sw.js` with `bun run build`. The source edit changed the `_next/static` chunk hashes embedded in the precache manifest, so the committed service worker had gone stale the moment the padding changed. The regenerated manifest still precaches all five Trial 3 model files as three `of3` shards with no `of2` orphans, and the runtime cache is still `mangoleaf-model-cache-v3-0-0` with the three superseded names listed for eviction.
- Release verification passes: `bun run typecheck`, `bun run lint`, and `bun run build`.

## Current Notebook Decision

Keep every training notebook, and keep each trial's clean template separate from its completed run. All notebooks live in `notebooks/` at the repository root, moved there from the root on August 25, 2026 so the folder does not accumulate one loose file per retraining cycle. The filenames below are unchanged.

**All nine were deleted from disk on August 26 or 27, 2026.** The five Trial 1 through 2.1 files were committed and have been restored with `git checkout -- notebooks/`; all five are back on disk and tracked. The four Trial 3 files were never committed and git cannot recover them; re-download from Colab and commit immediately. See the notebook table in [MODEL_VERSIONING.md](MODEL_VERSIONING.md) for per-file recovery status.

- `MangoLeaf_AI_Training_v1.ipynb` is the Trial 1 baseline and historical proof of the first training approach.
- `MangoLeaf_AI_Training_v2.ipynb` is the Trial 2 record. It is no longer a retraining template, because it lacks perceptual-hash deduplication, class weighting, the BatchNorm freeze, temperature calibration, and the resume-artifact export.
- `MangoLeaf_AI_Training_v2.1.ipynb` is the Trial 2.1 clean template, 33 code cells with outputs cleared. It was the basis for the Trial 3 notebook.
- `MangoLeaf_AI_Training_v2_1_Post_Training.ipynb` is the completed Trial 2.1 run with every output preserved. It holds the 97.12% figure, its per-class report, its confusion matrix, and `T = 0.754966`. **Do not rerun any cell in it.**
- `MangoLeaf_AI_Training_v3.ipynb` is the **current clean retraining template**. Copy this one for the next cycle.
- `MangoLeaf_AI_Training_v3_Post_Training.ipynb` is the completed Trial 3 run and the current manuscript evidence file: it holds the 97.46% figure, the per-class report, the confusion matrix, and `T = 1.188751`. **Do not rerun any cell in it.** Rerunning overwrites the numbers the manuscript cites.
- `MangoLeaf_AI_Threshold_Fitting_v3.ipynb` is the Trial 3 threshold-fitting template, nine code cells with outputs cleared. Copy this one to refit thresholds against a future resume bundle.
- `MangoLeaf_AI_Threshold_Fitting_v3_Results.ipynb` is the completed Trial 3 threshold refit. Its cell 9 is the record of why the margin is `0.40` rather than `0.43` or `0.00`.
- For the next retraining cycle, copy `MangoLeaf_AI_Training_v3.ipynb` to a new versioned notebook named after the model version it produces. A new or expanded dataset is a major change; reserve `v3.1` for a retrain on the same images with a changed procedure. See `docs/MODEL_VERSIONING.md` for the full rule. Do not overwrite a completed training run without recording what changed.
- The template's final cell writes the resume bundle to Drive: the calibrated `.keras` file at roughly 35 MB, `y_prob_cal.npy`, `y_true.npy`, and `resume_info.json`. That cell is not optional. Without it the trained weights are lost when the Colab session ends, and thresholds fitted after a fresh retrain would not match the weights already shipped in the app.
- The Trial 3 run also wrote `run_record.json` and `figures/per_class_metrics.csv` outside the notebook. Those two files are what made the lost notebooks survivable, because every quoted number could be recovered from them and checked against the shipped weights. Keep writing them on every future run.

## Current Model Baseline

- Architecture: MobileNetV3-Large
- Runtime format: TensorFlow.js Graph Model, **float32, not quantized**. The WebGL backend forces half-float textures, so the deployed arithmetic is 16-bit regardless; verified safe with 0 of 212 tensors above the 65,504 ceiling and a largest weight of `117.53`.
- Classes: six output classes after healthy leaf and healthy fruit are merged into one `healthy` class
- Current documented training run: Trial 3, August 26, 2026
- Current documented test result: 97.46% accuracy and 0.0686 test loss on 393 deduplicated test images, 95% Wilson interval roughly 95.4% to 98.6%
- Current documented export size: 11.53 MB total across 3 weight shards plus `model.json`, of which 11.33 MB is weights, plus `model_config.json`
- Current app model version label: `v3.0.0`, app version `v0.4.1`
- Calibration: temperature `T = 1.188751` folded into the final Dense layer. `T > 1`, so the model was overconfident and folding lowers confidence, which strengthens the 70% floor.
- Rejection: three gates, all active. Fixed 70% confidence floor, selected margin threshold `0.40`, fitted normalized-entropy threshold `0.40`. Measured 95.17% in-distribution retention, 70.24% out-of-scope rejection on 84 held-out non-mango images with a 95% confidence interval of roughly 60.5% to 80.0%, and 99.20% accuracy on accepted predictions.

Trial 2's 98.25%, Trial 2.1's 97.12%, and Trial 3's 97.46% are three measurements on three different test sets, not a trend. Trial 2's set contained near-duplicates of its own training images. Trial 3's set is a different pool entirely. Never present any of these figures as beating another.

## Next Work

- **Recover the four Trial 3 notebooks from Colab and commit them.** They were never committed and git cannot restore them. This is the only outstanding item with a real risk of permanent loss: the numbers survive in `run_record.json` and TRIAL_3.md, but the evidence files do not exist anywhere except Google Drive. The five committed Trial 1 through 2.1 files were already restored with `git checkout -- notebooks/` and need no further action.
- **Test v0.4.1 on a production build on a physical phone.** `v0.4.0` passed all four checks on August 29, 2026, so this is a re-verification of the padding patch and its regenerated service worker, not a fresh investigation. The phone needs the deployed HTTPS URL, because a LAN address such as `http://192.168.x.x:3000` is not a secure context and registers no service worker. Confirm the footer now reads `v0.4.1` and `v3.0.0`, and that the bottom navigation still looks right once the new service worker has actually activated: a padding change is invisible until the update takes effect, so a phone still showing `v0.4.0` in the footer is showing the old layout and proves nothing about the new one.
- **Accept one real photograph from each of the remaining five classes on a production build.** `mango_scab` was accepted on `v0.4.0` on August 29, 2026, which closed the class that mattered most: weakest at 0.9014 F1, in 6 of the 10 test errors, and never tested across two model versions. The other five have not each been hand-tested. Record the confidence value for every scan this time. These are single scans and measure no rate; never quote one as an acceptance rate.
- **Update the manuscript's Results figures to Trial 3.** Every measured number changed: 97.46% on 393 images, `T = 1.188751`, margin `0.40`, entropy `0.40`, and 70.24% out-of-scope rejection (59 of 84 held-out images) with its 60.5% to 80.0% confidence interval. Lead with accuracy on accepted predictions rising to 99.20%. Never quote the 86.90% tune-half rejection rate, and never quote the `85.7%` figure that appears in Section D of the refit cell, which is also a tune-half number. Never quote a rate computed from a handful of phone scans.
- **Apply the modifications recorded in [MANUSCRIPT_MODIFICATIONS.md](MANUSCRIPT_MODIFICATIONS.md)**, which is still written against Trial 2.1 throughout and needs a Trial 3 revision pass of its own.
- **Hand-inspect the 49 cross-label duplicate pairs.** All are `anthracnose` against `healthy`, one label in each pair is wrong, and the count has now survived two trials unchanged because the inspection keeps being deferred. It is the largest known threat to the headline accuracy figure.
- **Rebuild the `mango_scab` folder** before any Trial 4. 225 unique images is not enough to support a per-class figure, and it lost 66 genuinely distinct field photographs between Trial 2.1 and Trial 3.
- **Consider more stage-2 epochs.** Best validation loss landed on the final epoch in both Trial 2.1 and Trial 3, so neither run was trained to convergence. This is the cheapest untested lever available.
- **Correct three defects in the Trial 3 notebooks** once they are recovered: cell 9's `marginSelection` string overclaims that `0.40` is the largest margin holding the retention floor, markdown cell 0 documents `tune/` and `report/` subfolders that do not exist and says "Eight code cells" when there are nine, and markdown cell 10's bump table says `src/lib/constants.ts` holds `model-v2.1.1` when it holds `v2.1.1` with no prefix. Also patch the training notebook's cell 32 to skip the overflowing variance tensor before casting, though that is now largely moot: the converter folds the tensor away and the deployed graph has 557× headroom.
- **Decide whether to keep tracking `public/sw.js`.** It is a generated file whose precache manifest embeds the `_next/static` chunk hashes and the injected app version, so it goes stale on any source or version change and has to be regenerated and recommitted alongside it.
- **Optional: re-export at float16.** It would halve the download from 11.33 MB to 5.94 MB with no accuracy cost on the WebGL path, and the overflow analysis shows it is safe. It needs another Colab run and another provenance verification, which is why it was skipped.

## Standing Rules

These are not tasks to close. They apply to every future retraining cycle and every future app release.

- Freeze the next dataset snapshot before retraining, and split by physical leaf group rather than by file if the new data again contains multiple photographs of one leaf.
- Record class counts, split seed, augmentation plan, metrics, confusion matrix, model size, and export checksum for every new run. Keep writing `run_record.json` and `figures/per_class_metrics.csv` outside the notebook, because those two files are what made the lost Trial 3 notebooks survivable.
- Re-run `bun run typecheck`, `bun run lint`, and `bun run build` before publishing a new app release.
- Only app tags get a GitHub Release. Every published Release in this repository sits on a `v0.*` tag; model tags stay bare provenance markers. Draft a release by selecting the pushed tag rather than creating one, so a tag never points at an unfinished commit.
- Grep `src/` for the outgoing accuracy figure whenever a model swap changes the test accuracy. `aiEngineDesc` in `src/lib/translations.ts` is the only accuracy claim the app shows anyone, and it went two model versions stale before anyone noticed.

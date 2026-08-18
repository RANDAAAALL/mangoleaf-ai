# MangoLeaf AI Development Progress

Last updated: August 18, 2026

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
- Added `docs/model-training/TRIAL_2.md` as the current model report.

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


## Current Notebook Decision

Keep both training notebooks for now.

- `MangoLeaf_AI_Training_v1.ipynb` should be treated as the Trial 1 baseline and historical proof of the first training approach.
- `MangoLeaf_AI_Training_v2.ipynb` should be treated as the canonical retraining template for the next dataset update.
- For the next retraining cycle, copy the current notebook into a new versioned notebook, such as `MangoLeaf_AI_Training_v3.ipynb`, then update the dataset, metrics, and export notes there. Do not overwrite a completed training run without recording what changed.

## Current Model Baseline

- Architecture: MobileNetV3-Large
- Runtime format: TensorFlow.js Graph Model
- Classes: six output classes after healthy leaf and healthy fruit are merged into one `healthy` class
- Current documented training run: Trial 2, July 25, 2026
- Current documented test result: 98.25% accuracy and 0.0541 test loss
- Current documented export size: approximately 11.51 MB across 3 weight shards

## Next Work

- Freeze the next dataset snapshot before retraining.
- Create a new versioned notebook for the next model run.
- Record class counts, split seed, augmentation plan, metrics, confusion matrix, model size, and export checksum for every new run.
- Re-run `bun run typecheck`, `bun run lint`, and `bun run build` before publishing a new app release.
- Review the manuscript for consistency with the latest implementation, especially model export format, confidence threshold language, and the exact leaf/fruit disease scope.
- Prepare GitHub Releases for app milestones and separate model milestones.

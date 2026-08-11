# MangoLeaf AI Development Progress

Last updated: August 11, 2026

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
- Added `model_training_and_integration_notes_v2.md` as the current model report.

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

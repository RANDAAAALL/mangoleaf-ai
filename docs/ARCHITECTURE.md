# MangoLeaf AI Architecture

## System overview

MangoLeaf AI is a client-heavy, offline-first Next.js 16 application. The browser is the primary runtime: it loads the TensorFlow.js model, performs image classification, stores scan records in IndexedDB, and queues synchronization work. Supabase adds backup, image hosting, and shared treatment-guideline updates when the device is online.

![MangoLeaf AI Architecture](../public/images/mangoleaf-architecture.svg)

**Current candidate:** PWA `0.5.0` retains the adopted V4.3.0 Combined model. The version bump packages the guest-owned private-cloud client, local-history upgrade, and public-guideline separation described below. See the [release record](versions/PWA_VERSIONING.md#v050-private-cloud-synchronization-candidate-october-3-2026) for validation and pending publication status; model adoption and earlier measurements remain dated records.

## Test and release boundaries

The [dependency security review](security/DEPENDENCY_SECURITY.md) separates the current Bun application from the archived Colab environment. Next.js and its ESLint configuration use `16.3.6`; a root Browserslist override and compatible lockfile updates address additional package advisories. The historical Python freeze is stored as `colab-runtime-snapshot.txt`, with a separate repository-path mapping and unchanged original ledgers. Neither the app build nor CI installs those Python packages. This classification does not make the old training environment safe to recreate.

`tools/e2e/` holds Playwright functional and reliability cases. Controlled model responses exercise all accepted/rejected UI branches; separate real-model cases import the production classifier in a test-only harness and upload the supplied photos through the real app. Diagnostics remain in reports. The harness is served only by the local test server and is not part of `src/` or the deployed export.

`tools/build-test-app.mjs` copies application inputs into an ignored, hash-addressed `.test-app/` directory and builds a private static export with a loopback mock backend. It excludes the existing generated worker and regenerates one there. This leaves the normal `out/` and tracked `public/sw.js` alone. Fresh browser contexts isolate local data; the server's connection policy prevents external service access. The mock verifies client flow, not Supabase's server behavior or RLS.

The local server uses pinned, development-only Busboy to extract photo bytes from multipart uploads. This preserves the unnamed file field sent by the installed Supabase client, which Bun 1.4's built-in form parser drops. R02 compares the stored bytes with the local scan image after reconnect.

Core desktop/mobile and Chromium service-worker cases run in the existing `master` push CI. R01 repeated inference and R03 extended use run explicitly; [TESTING.md](testing/TESTING.md) defines scope and [PHYSICAL_RELIABILITY_CHECKLIST.md](testing/PHYSICAL_RELIABILITY_CHECKLIST.md) records real-device coverage. Reports, traces, and the private build stay untracked. A scan-card object-URL lifecycle fix accompanied the tests so a replaced photo blob cannot leave a revoked URL in the rendered image; the tests use the existing inference path and model assets.

The manual release workflow uses Vercel staged production builds: disable automatic domain assignment in the dashboard, test the exact candidate commit/deployment, then promote it after review. Candidate labels/docs may be committed before release, with pending status stated honestly. Staging uses Production settings; it does not isolate the database. See [candidate testing and promotion](versions/PWA_VERSIONING.md#candidate-testing-and-promotion). CI checks do not themselves deploy or gate an independent Vercel promotion.

Experiment guides live under [experiment/v3.1](model-training/experiment/v3.1/TRIAL_v3_1.md), [experiment/v3.2](model-training/experiment/v3.2/TRIAL_v3_2.md), [experiment/v4](model-training/experiment/v4/TRIAL_v4.md), [experiment/v4.1](model-training/experiment/v4.1/TRIAL_v4_1.md), [experiment/v4.1.1](model-training/experiment/v4.1.1/TRIAL_v4_1_1.md), and [experiment/v4.2.0](model-training/experiment/v4.2.0/TRIAL_v4_2_0.md). Their candidate notebooks and completed experimental evidence live in [notebooks/experiment](../notebooks/experiment/README.md): **experimental candidates, not shipped or deployed**. V4 introduced separate healthy-leaf and healthy-fruit outputs while preserving historical split membership by file contents. V4.1 compared control, background replacement, local lighting, and both effects; V4.1.1 completed a guided reproduction. V4.2.0 completed separate leaf and fruit runs; only leaf met the threshold-selection rule. On October 2, 2026, the single seven-class V4.3.0 Combined model was adopted for app `0.4.9`, replacing V3 as the current application baseline. The [adoption receipt](model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) records original export and adopted identities/hashes. Exact earlier model/app backups remain in ignored `.tools/model-backups/`; `.tools/release-backups/v0.4.9-model-v4.3.0-20261002/before/` preserves the pre-adoption state. Production promotion remains pending the final CI and release checks.

Historical and adopted trial reports live under `docs/model-training/non-experiment/v{n}/`. Each version keeps its report beside any saved `artifacts/` and `figures/`; those evidence folders exist only when files are available. Their preserved templates and completed notebooks live under `notebooks/non-experiment/v{n}/`, including the current adopted V4.3.0 model and older versions. Experimental notebooks stay under `notebooks/experiment/v{n}/` and remain candidates regardless of the `TRIAL_*.md` filename. Moving these records does not change notebook cell contents, saved outputs, or original Google Drive run paths. V3.1 also retains its separate [original-weight threshold guide](model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md).

V4 notebook outputs default to `MyDrive/mangoleaf_experiments/v4/training/` and `MyDrive/mangoleaf_experiments/v4/threshold_fitting/`. Each run and downloadable evidence/model ZIP carries its v4 workflow label and unique run ID. See the [Drive output layout](model-training/experiment/v4/TRIAL_v4.md#where-google-drive-outputs-go) for folder contents and existing-run compatibility.

V4.1 writes training and fitting runs under `MyDrive/mangoleaf_experiments/v4.1/`. Its replacement and lighting effects touch training images only. Validation and test pixels stay unchanged. The completed run froze every arm's threshold selection before predicting on the 32 newly uploaded OOD photos. Selected result records and preview sheets are copied under `docs/model-training/experiment/v4.1/artifacts/` and `docs/model-training/experiment/v4.1/figures/`; see the [v4.1 evidence guide](model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test).

The separate V4.1 post-training figures notebook reads those completed runs, the saved Keras background model, and original scene photos. It writes charts, a reconstructed training-augmentation example, and validation Grad-CAM under a new Drive `post_training_figures/` run. Selected local copies and input hashes are indexed in the [V4.1 figure guide](model-training/experiment/v4.1/TRIAL_v4_1.md#post-training-figures-september-25-2026); the figures do not change weights, thresholds, or deployed assets.

V4.1.1 saved separate `MyDrive/mangoleaf_experiments/v4.1.1/` training, threshold-fitting, and figure runs. Its [guide](model-training/experiment/v4.1.1/TRIAL_v4_1_1.md) separates raw mango/split/scene inputs from later OOD inputs, records review gates, and labels reused evaluation collections as exploratory. Its Background candidate was the previous local `public/model/` copy and remains in an ignored backup; selected evidence is indexed under `docs/model-training/experiment/v4.1.1/`. This did not adopt or deploy the model.

The [V4.2.0 guide](model-training/experiment/v4.2.0/TRIAL_v4_2_0.md) defines two separate experimental classifiers: four leaf classes (including Bacterial Canker) and three fruit classes. Each has one training notebook with integrated figure steps, a separate threshold notebook, and completed Drive runs under `MyDrive/mangoleaf_experiments/v4.2.0/`. Curated evidence is under each organ's `artifacts/` and `figures/`, with source paths and SHA-256 hashes in `source_manifest.json`. The local two-choice app trial is over; the exact two-model asset and app-source state is retained in ignored `.tools/model-backups/v4.2.0-dual-experiment-20260929/`. The fruit gate was infeasible. Neither model was adopted or deployed.

The [V4.3.0 adopted trial report](model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) records one completed seven-class Combined model, two workflow notebooks, and separately preserved completed result copies now under `notebooks/non-experiment/v4.3.0/`. Training reads the saved V4.1.1 split and provenance, reviews the original 62 scene photos plus the supplied 138 new scene photos, and fits a single combined recipe. Background replacement and local lighting each keep their 30% probability during training only; validation and test retain original pixels. The reviewed 200-scene pool is augmentation input, not an expanded mango dataset. Original training and fitting runs retain their `MyDrive/mangoleaf_experiments/v4.3.0/` paths and candidate metadata. Figure steps are integrated into the training notebook: training charts first, then evaluation charts after fitting. Verified evidence copies retain their artifacts/training/, artifacts/threshold_fitting/, artifacts/review/, and final figures/ grouping. The [comparison](model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md) records unchanged selected mango decisions and mixed OOD results. Root `public/model/` now contains the adopted Combined graph, configuration, and three shards, with `v4.3.0` display label and `mangoleaf-model-cache-v4-3-0` cache identity. Only configuration release metadata changes from the original fitted export; numerical settings and weights are preserved. Current photo guidance, bilingual text, and history remain in use. Adoption is recorded separately from pending production promotion.

## Project structure

The tree below highlights the files and directories that define the application. Generated directories such as `.next/` and `out/` are intentionally omitted. See [local generated folders](testing/TESTING.md#local-generated-folders) for the test builds, downloaded scanner, and reports that appear after running developer commands.

Testing instructions and physical-device checklists are grouped under `docs/testing/`. Treatment-advice source reviews and proposed English/Bisaya wording are grouped under `docs/treatment-guidelines/`. Supabase ownership, configuration, and recovery instructions live in [SECURITY-AND-SYNC.md](supabase/SECURITY-AND-SYNC.md), with SQL explanations beside the maintenance files. App and model version records live under `docs/versions/`; dated performance reviews stay within `docs/PERFORMANCE.md`. These folder names describe the documents they contain; the Supabase table remains named `guidelines`.

```text
mangoleaf-ai/
|-- .github/workflows/ci.yml        # Security and app checks on master pushes
|-- .husky/pre-commit               # Format staged files before committing
|-- .husky/pre-push                 # Security, TypeScript, lint, and formatting checks
|-- playwright.config.ts            # Browser projects and core/reliability suites
|-- supabase/sql/                   # Reviewed cloud-security transition and verification SQL
|   |-- README.md                   # Plain-English guide to the maintenance scripts
|-- tools/                          # Shared checks and isolated browser-test tooling
|   |-- verify-training-archive.mjs # Verify historical runtime bytes and provenance
|   |-- e2e/                        # .pw.ts cases, photo fixtures, test-only inference harness
|   |-- build-test-app.mjs          # Private static export with a local mock backend
|   |-- generate-v4-1-figures.py    # V4.1 charts, preview, and Grad-CAM from completed runs
|   |-- build-v4-1-figures-notebook.py   # Regenerate the uploadable figures notebook
|   |-- build-v4-1-1-figures-notebook.py # Build the guided V4.1.1 figures notebook from the V4.1 recipe
|   |-- serve-test-app.mjs          # Loopback static/mock server
|   |-- verify-v4-notebooks.py      # Seven-class notebook contracts and optional read-only data audit
|   |-- verify-v4-1-notebooks.py    # Four-arm experiment contracts and synthetic data-boundary checks
|   `-- run-browser-tests.mjs       # Build verification and Node.js Playwright runner
|-- public/                         # Files served directly from the site root
|   |-- images/
|   |   |-- icons/
|   |   |   |-- png/                # PWA, favicon, and Apple touch icons
|   |   |   `-- svg/                # Vector application and favicon icons
|   |   `-- mangoleaf-architecture.svg  # Diagram embedded by this document
|   |-- model/                      # Adopted V4.3.0 Combined seven-class model
|   |   |-- model.json              # Seven-output TensorFlow.js graph
|   |   |-- model_config.json       # Class order, preprocessing, fitted thresholds
|   |   |-- group1-shard1of3.bin
|   |   |-- group1-shard2of3.bin
|   |   `-- group1-shard3of3.bin
|   `-- sw.js                       # Generated Serwist service worker; do not edit
|-- src/                            # Application source code
|   |-- app/                        # Next.js App Router entry points
|   |   |-- globals.css             # Global Tailwind and application styles
|   |   |-- layout.tsx              # Root document, metadata, fonts, and viewport
|   |   |-- manifest.ts             # Installable PWA manifest
|   |   `-- page.tsx                # Main client-side application coordinator
|   |-- components/                 # Reusable interface components, grouped by role
|   |   |-- brand/                  # Application logo and icon set
|   |   |-- layout/                 # Top header, navigation bar, footer, and splash screen
|   |   |-- modal/                  # Legal, scan-details, and scan bottom sheet
|   |   |-- scan/                   # Scan controls, result card, history list, guide
|   |   `-- tab/                    # Home, history, and about screen content
|   |-- hooks/
|   |   |-- usePWAInstall.ts        # PWA installation prompt state and actions
|   |   |-- useScrollLock.ts        # Shared scroll lock for overlapping modals
|   |   `-- useSync.ts              # IndexedDB and Supabase synchronization
|   |-- lib/
|   |   |-- classifier.ts           # Model loading, inference; compatible helper exports
|   |   |-- cloud-session.ts        # Serialized background guest-session reuse
|   |   |-- cloud-scan.ts           # Owner-scoped cloud IDs and photo paths
|   |   |-- cloud-sync.ts           # Owned row mutations and private photo downloads
|   |   |-- constants.ts            # Model classes and model version label
|   |   |-- db.ts                   # Dexie schema and scan record types
|   |   |-- format-time-ago.ts      # Relative timestamp formatting for scan cards
|   |   |-- get-badge-styles.ts     # Disease-name to badge color class mapping
|   |   |-- image-hash.ts           # Lightweight original-file SHA-256 fingerprint
|   |   |-- image-storage.ts        # Canvas compression after diagnosis, without TensorFlow.js
|   |   |-- supabase-client.ts      # Browser-side Supabase client
|   |   `-- translations.ts         # English and Cebuano/Bisaya interface text
|   |-- env.d.ts                    # Types for build-time injected public env values
|   `-- sw.ts                       # Serwist source configuration
|-- docs/                           # Detailed engineering and project history
|   |-- security/                   # Application dependencies and historical environment risks
|   |   `-- DEPENDENCY_SECURITY.md   # Advisory review, remediation, and residual findings
|   |-- supabase/                   # Cloud ownership, configuration, and recovery
|   |   `-- SECURITY-AND-SYNC.md     # Overview, setup links, evidence, and recovery
|   |-- treatment-guidelines/       # Treatment-advice source reviews and bilingual drafts
|   |-- testing/                    # Test instructions and physical-device checklists
|   |   |-- TESTING.md              # Automated cases, reliability protocol, device checklist
|   |   |-- PHYSICAL_RELIABILITY_CHECKLIST.md        # Fillable physical-device evidence
|   |   `-- PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md # Fictional example; never evidence
|   |-- model-training/             # Versioned model guides, evidence, and trial reports
|   |   |-- experiment/             # Candidate workflows; not shipped or deployed
|   |   |   |-- v3.1/               # TRIAL_v3_1.md plus separate threshold-only guide
|   |   |   |-- v3.2/               # TRIAL_v3_2.md paired threshold guide
|   |   |   |-- v4/                 # TRIAL_v4.md, artifacts/, figures/
|   |   |   |-- v4.1/               # TRIAL_v4_1.md, artifacts/, figures/
|   |   |   |-- v4.1.1/             # TRIAL_v4_1_1.md, artifacts/, figures/; completed candidate
|   |   |   `-- v4.2.0/             # TRIAL_v4_2_0.md; mangoleaf/ and mangofruit/ evidence
|   |   `-- non-experiment/         # Historical and adopted model trials
|   |       |-- v1/                 # TRIAL_v1.md
|   |       |-- v2/                 # TRIAL_v2.md, figures/
|   |       |-- v2.1/               # TRIAL_v2_1.md, artifacts/, figures/
|   |       |-- v3/                 # TRIAL_v3.md, artifacts/, figures/; previous released baseline
|   |       `-- v4.3.0/             # Adopted trial/comparison, artifacts/, figures/
|   |-- ARCHITECTURE.md             # This architecture reference
|   |-- versions/                   # Separate app and model version records
|   |   |-- PWA_VERSIONING.md        # App versions, release history, and deployment
|   |   `-- AI_MODEL_VERSIONING.md   # Model versions, notebooks, and saved evidence
|   |-- PERFORMANCE.md              # Performance mechanisms, dated reviews, and measurements
|   `-- PROGRESS.md                 # Development timeline and current baseline
|-- notebooks/                      # Colab notebooks: trial records and experimental workflows
|   |-- README.md                   # Current model and notebook-group overview
|   |-- non-experiment/             # Current adopted model and older model pipelines
|   |   |-- README.md               # Current and older training-notebook index
|   |   |-- v1/
|   |   |   `-- MangoLeaf_AI_Training_v1.ipynb                  # Historical Trial 1
|   |   |-- v2/
|   |   |   `-- MangoLeaf_AI_Training_v2.ipynb                  # Historical Trial 2
|   |   |-- v2.1/
|   |   |   |-- MangoLeaf_AI_Training_v2.1.ipynb                # Trial 2.1 template, outputs cleared
|   |   |   |-- MangoLeaf_AI_Training_v2_1_Post_Training.ipynb  # Completed Trial 2.1 run, do not rerun
|   |   |   `-- MangoLeaf_AI_Threshold_Fitting_v2_1_1_Results.ipynb # Trial 2.1 margin and entropy fitting, no retraining
|   |   |-- v3/
|   |   |   |-- MangoLeaf_AI_Training_v3.ipynb                  # Historical retraining template, 34 cells, outputs cleared
|   |   |   |-- MangoLeaf_AI_Training_v3_1st_to_8th_Cells_Results.ipynb # Partial Trial 3 run, data-preparation cells only
|   |   |   |-- MangoLeaf_AI_Training_v3_Post_Training.ipynb    # Completed Trial 3 run, manuscript evidence, do not rerun
|   |   |   |-- MangoLeaf_AI_Threshold_Fitting_v3.ipynb         # Trial 3 threshold template, 8 cells, outputs cleared
|   |   |   `-- MangoLeaf_AI_Threshold_Fitting_v3_Results.ipynb # Trial 3 fitting run; cell 9 settles the margin at 0.40
|   |   `-- v4.3.0/                 # Current adopted model; templates and completed runs
|   `-- experiment/                  # Experimental notebooks/evidence; candidates, not shipped or deployed
|       |-- README.md                # Status, scope, and notebook-version boundary
|       |-- v3.1/                    # v3.1 workflow templates and completed results
|       |-- v3.2/                    # v3.2 workflow template and completed results
|       |-- v4/                      # Seven-class experimental training and threshold templates
|       |-- v4.1/                    # Four-arm training, thresholds, and post-training figures
|       |-- v4.1.1/                  # Guided templates and completed reproduction notebooks
|       `-- v4.2.0/                  # Separate leaf/fruit templates and completed result notebooks
|-- video/                           # Promotional video, a separate HyperFrames project
|   |-- assets/                      # Render inputs plus the thumbnail still
|   |-- index.html                   # Root composition and timeline
|   |-- index.motion.json            # Motion and keyframe definitions
|   |-- hyperframes.json             # Composition paths and media settings
|   |-- meta.json                    # Composition id and name
|   |-- package.json                 # Pinned hyperframes CLI scripts
|   |-- AGENTS.md                    # HyperFrames instructions for coding agents
|   `-- MangoLeafAI-walkthrough.mp4  # Rendered output
|-- .env.example                     # Public environment-variable template
|-- AGENTS.md                        # Repository instructions for coding agents
|-- README.md                        # Project overview and quick start
|-- SETUP.md                         # Complete local and Supabase setup guide
|-- next.config.ts                   # Static export and Serwist integration
|-- package.json                     # Bun scripts and project dependencies
`-- tsconfig.json                    # TypeScript and @/* path-alias configuration
```

This is a single Next.js application rather than separate frontend and backend folders. Browser code owns diagnosis and local storage, while Supabase is an external synchronization service.

`video/` is the one directory that is not part of the application. It is a self-contained HyperFrames composition project for the promotional video, with its own `package.json`, its own dependency tree, and its own `AGENTS.md`. Nothing in it is imported by `src/`, and nothing in it reaches a device: `public/` is the only directory a static export copies verbatim, so the composition, the voice-over, and the rendered MP4 are absent from `out/` and from the service worker's precache manifest. The `static-video-assets` runtime cache in `public/sw.js` is unrelated to it and matches only `.mp4` and `.webm` files the app itself requests. Treat the two projects as neighbours that share a repository and nothing else; running `bun install` at the root does not install the video project's dependencies, and `bun run build` does not render the video.

## Application layers

### App shell and orchestration

- `src/app/layout.tsx` defines metadata, fonts, viewport behavior, and the root document.
- `src/app/manifest.ts` defines installable PWA metadata and icons.
- `src/app/page.tsx` is the main client coordinator for navigation, model loading, image selection, diagnosis, language state, scan history, and modals.

### User interface

Reusable UI lives in `src/components/`. Filenames use lowercase kebab-case, while exported React components remain PascalCase. For example, `modal/scan-details-modal.tsx` exports `ScanDetailsModal`. Components wrapped in `React.memo()` name the inner function after the export so React DevTools and stack traces show the real component name.

Components are grouped into subfolders by the role they play rather than kept in one flat directory:

| Folder    | Contents                                                                                                                  | Role                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `brand/`  | `logo.tsx`, `icon.tsx`                                                                                                    | Identity marks and the shared icon set  |
| `layout/` | `top-header.tsx`, `bottom-nav.tsx`, `footer.tsx`, `splash-screen.tsx`                                                     | Application frame around screen content |
| `modal/`  | `legal-modal.tsx`, `scan-details-modal.tsx`, `scan-sheet.tsx`                                                             | Overlay dialogs and sheets              |
| `scan/`   | `diagnostic-scanner.tsx`, `scan-card.tsx`, `scan-history-list.tsx`, `how-it-works-steps.tsx`, `disease-coverage-card.tsx` | Diagnosis feature surface               |
| `tab/`    | `home-tab.tsx`, `history-tab.tsx`, `about-tab.tsx`                                                                        | One component per navigation tab        |

The three tab components are the boundary between `page.tsx` and screen content. `page.tsx` owns all state and handlers, and renders exactly one of `HomeTab`, `HistoryTab`, or `AboutTab` per active tab. Adding a screen means adding a tab component and one branch in `page.tsx`, not editing shared markup.

Grouping is by role, not by which tab uses a file. `scan/scan-history-list.tsx` is rendered by both `HistoryTab` in full and by `HomeTab` as a four-item preview, so it belongs to the scan feature rather than to either tab. Folders group files for navigation and do not define access boundaries.

`modal/scan-sheet.tsx` is the sharper case of the same rule: it is a dismissible bottom sheet, so it is grouped with the overlays even though its content is the camera-or-gallery choice that starts a scan. It is also the one component that reaches outside React to drive another file's markup.

The sheet shows shared English/Bisaya framing and lighting tips below its title, before either picker. Its descriptions explain camera and gallery actions rather than repeating the tips. The content scrolls within the available viewport while the drag handle stays visible. The existing review dialog reads a shorter inspection reminder from `photoCheckHint`. These are static instructions, not automatic quality checks; they do not crop photos or change model inputs, rejection rules, duplicate handling, or camera behavior.

**The sheet's drag deliberately bypasses React, and that is not an oversight to tidy up.** The drag-move handler assigns `sheetRef.current.style.transform` and `backdropRef.current.style.opacity` directly instead of calling `setState`, because a `touchmove` handler runs at the digitizer's sampling rate and a React re-render per event is far more work than the one style write the frame needs. To keep the imperative writes and React consistent, the render path reads `dragYRef.current` rather than the `dragY` state while a drag is in progress, so an unrelated parent re-render commits the live drag offset instead of a stale zero. `dragY` state is written only at drag end, which is what lets React clear the imperative `transform` and run the snap-back or dismiss transition. Reverting any one of those three pieces to ordinary state breaks the other two. `page.tsx` renders two hidden `<input type="file">` elements carrying the ids `scan-camera-input` and `scan-gallery-input`, and the sheet calls `document.getElementById` on those ids and clicks the input directly, because a file picker only opens from a real user gesture on the input itself. **Renaming or removing either id breaks image selection silently:** the lookup returns `null`, the sheet still closes, and nothing reports an error. Keep the ids and the sheet in step, and keep both inputs mounted whenever the sheet can be opened. That obligation is why the desktop sheet, which since `v0.4.3` shows only the gallery card because a desktop browser ignores `capture="environment"`, hides the camera _button_ with `md:hidden` and leaves `scan-camera-input` mounted: the retake flow in `page.tsx` reopens whichever picker was last used, keyed by that id, so unmounting the input would break retake for camera-captured photos on phones.

A reusable SVG belongs in `brand/icon.tsx` under a name in the exported `IconName` union, not inline in whichever component needs it first. Icons that share the 24x24 stroke wrapper are held in the `STROKE_24_SHAPES` map, so adding one is a shape entry rather than another render branch. No entry hardcodes a colour or a size: every icon inherits `currentColor` from the surrounding text colour and takes its pixel dimensions from the `size` prop, which is what lets one shape serve call sites with different colours. Two entries can look like duplicates without being interchangeable. `camera` is a filled FontAwesome glyph on a 640x640 viewBox and `camera-outline` is a stroked viewfinder on a 24x24 one, so they are separate names rather than one icon with a variant flag.

Use the `@/components/...` path alias for imports across folders, and relative `./` paths only within the same folder, so a file can be moved without rewriting unrelated paths.

### Presentation helpers

Two pure formatting functions in `src/lib/` are kept out of the components that render them so the component files stay markup-only:

- `format-time-ago.ts` turns a scan's ISO `updated_at` into a relative label. It reads every string from `translations.ts`, including the `{n}` count templates for minutes, hours, and days and the `monthsShort` abbreviations used for dates older than a week, so the label is fully localized in both languages. Month names come from `translations.ts` rather than `toLocaleDateString` because browsers have no reliable Cebuano/Bisaya month data. An unparseable timestamp returns the `justNow` label instead of falling through to a `NaN` date.
- `get-badge-styles.ts` maps a disease name to the shared red disease-badge classes or the green healthy-badge classes. It matches on substrings, so an unrecognized class name falls back to neutral slate styling rather than throwing.

Both are imported by `scan/scan-card.tsx`. Neither imports React, so both can be called from any component or tested directly.

When adding a relative-time string, add it to both the `en` and `bis` objects in `translations.ts` and use the `{n}` placeholder for any number. Cebuano/Bisaya does not inflect nouns for plurals, so only English needs separate singular and plural forms.

### On-device AI pipeline

`src/app/page.tsx` coordinates photo review and saving. `src/lib/image-hash.ts` hashes files without importing TensorFlow.js, and `src/lib/image-storage.ts` creates the compressed photo saved after diagnosis. `src/lib/classifier.ts` provides browser inference and re-exports both helpers for existing callers. The page imports storage compression directly and dynamically loads the prediction function when diagnosis starts:

1. During initial loading, fetch `/model/model.json` with `tf.loadGraphModel` and `/model/model_config.json` for its rejection settings.
2. Cache and warm the single seven-class V4.3.0 Combined model once per browser session.
3. On photo selection, show the preview and asynchronously hash the original file with SHA-256. Query the indexed local `image_hash` column before enabling diagnosis. Keep the hash for this selection so diagnosis does not hash the same file again.
4. If an eligible saved scan matches, keep the preview open with the bilingual "Photo already scanned" message. Retake opens the original picker; Cancel or X closes review; View saved result opens the existing report. Reuse requires an exact `model_version` match with `v4.3.0`. Pending-deletion rows, another model label, and legacy rows without a label do not block a new inference.
5. For a new photo, Run AI Diagnosis rechecks the local duplicate lookup before inference. Downscale the image to `224 x 224` with a shared canvas, run TensorFlow.js inference, and dispose temporary tensors.
6. Apply the model's rejection gates and return the highest-probability class only if they pass; otherwise return `Uncertain / Unrecognized`.
7. Compress the image for storage and save the existing original-file hash with the new scan record.

Photo review uses `scan/diagnostic-scanner.tsx`. X and Escape discard the selected photo before diagnosis, without opening a picker or saving a record. These dismiss controls are unavailable during active diagnosis. A duplicate check must finish successfully before diagnosis can start; a failed check offers a retry. Closing or replacing a photo invalidates its pending check and releases its preview URL, so a delayed result cannot reopen an old selection. `useScrollLock.ts` counts active locks shared by the page and scan sheet so closing the sheet cannot unlock scrolling behind a newly opened preview. Duplicate detection compares file contents, not visual similarity: renaming an unchanged file still matches, while cropping or recompressing can produce a different hash.

The adopted V4.3.0 Combined model uses these settings:

| Gate       | Test                                                 | Source                           | Setting |
| ---------- | ---------------------------------------------------- | -------------------------------- | ------- |
| Confidence | Top-1 probability at least the threshold             | Hardcoded `CONFIDENCE_THRESHOLD` | `0.70`  |
| Margin     | Top-1 minus top-2 probability at least the threshold | `model_config.json`              | `0.00`  |
| Entropy    | Normalized Shannon entropy at most the threshold     | `model_config.json`              | `0.42`  |

The confidence floor is hardcoded and deliberately not configurable. It is a manuscript specification cited to [31], so a `model_config.json` that asks for a different value is refused: the classifier logs a warning and keeps `0.70`. Margin and entropy are optional; `null` disables that gate. The config travels with the exact fitted weights.

Entropy is normalized by `Math.log(results.length)` so it stays on a 0-to-1 scale comparable to the fitted threshold. Confidence is compared before rounding; the rounded value is returned for display only, because comparing the rounded number would let `0.695` clear a `0.70` gate and silently lower the real floor to 69.5%.

Root `public/model/` contains the adopted seven-output V4.3.0 Combined model, with fitted confidence 0.70, margin 0, and entropy 0.42 gates. Its class order is Anthracnose, Bacterial Black Spot, Bacterial Canker, Healthy Fruit, Healthy Leaf, Mango Scab, and Sooty Mold, as defined in `src/lib/constants.ts`. Both healthy outputs reuse the existing `healthy` treatment-guidance key. Original candidate files and earlier model baselines remain preserved; the adoption receipt distinguishes unchanged graph/shard hashes from the relabeled configuration. See [AI model versioning](versions/AI_MODEL_VERSIONING.md).

Each inference prints a collapsed browser-console table of all seven class probabilities in development and production, ranked from highest to lowest. This supports technical review through DevTools without adding scores to the result modal. The table sorts copies of the scores and rounds only the display percentages; prediction and rejection still use the original scores. These probabilities describe one photo, not per-class accuracy. An eligible saved duplicate does not run inference or print a new table. See [TESTING.md](testing/TESTING.md#fixture-and-report-interpretation) for reading it and handling duplicate photos.

### Local persistence

`src/lib/db.ts` defines version 8 of the Dexie database `MangoLeafDB` with two stores:

- `scans`: image blobs, predictions, sync metadata, timestamps, a browser label, and optional verified cloud-owner/private-object references. Existing V4.2.0 trial rows may also retain local model/organ fields.
- `guidelines`: cached English and Cebuano/Bisaya treatment guidance. Disease and healthy presentation colors are fixed in the client, not stored in Supabase.

New scans are written locally first. This allows diagnosis and history features to keep working without a network connection. Cloud-owned rows additionally retain `owner_id`, `cloud_id`, and `storage_path`; the cloud ID can differ from a retained pre-upgrade local ID. The upgrade preserves legacy reports and photo Blobs, marks formerly uploaded unowned rows local-only, and gives purely local pending rows a new cloud identity rather than colliding with inaccessible historical server rows.

Treatment guidance is authored in Supabase's `public.guidelines` table and read from its downloaded IndexedDB copy. `getGuidelineForScan()` in `src/app/page.tsx` maps both healthy classes to `healthy`, preserves valid cached text during offline use, and handles English and Bisaya independently. While the local query is pending it shows a translated loading message. A missing row or blank language field shows a translated unavailable message from `src/lib/translations.ts`. The application no longer bundles treatment advice in `src/lib/constants.ts` or uses generic treatment instructions when guidance is missing. Users need a successful guideline download before advice is available offline.

An `Uncertain / Unrecognized` result is handled before the cached-guideline lookup. It displays the approved English/Bisaya photo reminder immediately, including offline use and while IndexedDB is loading. Scan details use the heading “Try another photo” / “Sulayi og laing litrato” for this result. The reminder is interface text in `src/lib/translations.ts`; it does not require a Supabase guideline row or change model rejection rules. Loading and unavailable guideline messages still apply to accepted class results.

Historical trial and legacy rows remain visible in local history. Duplicate reuse requires the exact active `model_version`, so V4.2.0, the former V4.3.0 candidate identity, V3, and unlabeled legacy rows do not substitute for adopted V4.3.0 inference. This prevents an unidentified older diagnosis from blocking the promoted model. The V4.2.0 route metadata stays local; new owned cloud rows preserve `model_version` without converting older unlabeled diagnoses into current-model reports.

### Synchronization

`src/hooks/useSync.ts` coordinates Supabase synchronization:

- Creates a stable per-browser `device_id` in `localStorage`.
- Obtains and reuses a saved anonymous guest session for private cloud operations, without a login screen or a diagnosis dependency.
- Uploads pending image blobs into the guest's directory in the private `scans` Storage bucket.
- Inserts metadata with a verified owner and private object path. RLS compares that owner with the signed session; the browser's `device_id` is a label, not proof of ownership.
- Marks deletions locally and removes only the guest's owned remote rows/files when online.
- Pulls the signed guest's remote scans and downloads private photos into IndexedDB for later offline display.
- Pulls publicly readable treatment guidelines independently of guest sign-in. A successful full response atomically replaces the local guideline snapshot, including removal of deleted remote rows; a failed fetch preserves cached advice.
- Subscribes to Realtime changes for the `guidelines` table.
- Uses a sync lock with one queued follow-up pass, a real 10-second cloud-request timeout, a 15-second session-wait bound, exponential retry while online, and an immediate retry when the app returns to foreground. The guest get-or-create sequence is also serialized across supported tabs with Web Locks.

Supabase is therefore a synchronization and recovery layer; IndexedDB remains the immediate source used by the UI. Guest creation needs a network connection. A failed sign-in, refresh, or upload leaves local scanning available and cloud changes pending. Losing the saved anonymous session also loses access to that guest's cloud records; there is no cross-device account recovery in this design. The live server's private bucket and ownership policies were applied and verified on October 2; the matching client described here is validated locally and awaits deployment.

Older cloud rows/files remain preserved without automatically assigning them to a submitted `device_id`. Their former public image links are not a fallback for private downloads. Existing local image Blobs remain usable. A local-only report without photo bytes keeps its diagnosis and shows “Photo not saved on this device” / “Walay litrato nga natipigan niini nga device”; it does not request the old unowned URL. Recovering that remote photo needs an administrator's explicit decision. The old deployed client cannot sync private scans after the server transition until it receives the matching updated app. See [cloud ownership and recovery](supabase/SECURITY-AND-SYNC.md) for status, verification, and rollout boundaries.

### PWA and offline caching

Private cloud endpoints for Auth, scans metadata, and Storage use a `NetworkOnly` rule before Serwist's default runtime rules. Their responses are not kept in a shared service-worker URL cache. Worker activation also removes matching entries left by earlier workers. Offline scan/photo access comes from IndexedDB Blobs; publicly downloaded guideline rows remain in their local table.

`src/sw.ts` configures Serwist. It precaches the generated application assets, claims active clients, applies a `CacheFirst` strategy to `/model/*`, and adds its own `activate` handler that deletes every superseded model cache listed in `OUTDATED_MODEL_CACHES`. `next.config.ts` integrates Serwist, disables it during development, and enables static export. It also reads the `version` field from `package.json` and injects it as `NEXT_PUBLIC_APP_VERSION`, which Next replaces with a literal string at build time wherever the code references it. Because the site is a static export, every public value must be baked in during the build; nothing is resolved at runtime. See [PWA versioning](versions/PWA_VERSIONING.md).

The precache manifest that Serwist generates covers the build output _and every file under `public/`_. Anything added to `public/` is therefore downloaded to each installed device during service-worker installation, whether or not the application ever requests it. Keep assets that only documentation uses out of `public/` unless they also have to be reachable at a site URL.

**That manifest, not the `CacheFirst` rule, is what actually updates the model.** `PrecacheRoute` is registered before `runtimeCaching`, so the router matches it first and the `/model/*` rule never fires in practice. Every file under `public/model/` carries a content-revision hash in the manifest, so a changed weight shard is refetched on the next service-worker activation regardless of the cache name, and Serwist's own `activate` handler evicts precache entries missing from the current manifest. The current `MODEL_CACHE` label `mangoleaf-model-cache-v4-3-0` and the `OUTDATED_MODEL_CACHES` eviction are defence in depth whose real payoff is reclaiming superseded weights, including the V4.1.1, V4.2.0, and V4.3.0 candidate runtime caches, not the update mechanism. The activation filter protects the active V4.3.0 runtime cache. The runtime cache can legitimately be empty on a correctly updated device.

### Static assets

Application images live under `public/images/`, with the icon set in `public/images/icons/png/` and `public/images/icons/svg/`. The PNG icons are not decorative: `src/app/manifest.ts` declares the 192x192 and 512x512 files as `maskable`, and browsers refuse to offer the install prompt when a declared icon of at least 192x192 cannot be fetched. `src/app/layout.tsx` points the favicon and Apple touch icon at the same tree. Renaming or moving this directory means updating both files and rebuilding.

These files must stay tracked in git. `.gitignore` patterns that could match them need a leading slash so they stay anchored to the repository root; a bare pattern such as `images` matches a directory of that name at _any_ depth and silently excludes `public/images/`. Such a mistake does not surface in `git status`, because ignored paths are not reported as untracked, and it cannot be undone with a negation such as `!public/images/`, because git never descends into a directory that a parent pattern has excluded. The symptom appears only after a fresh clone or a deployment build: no favicon, and an uninstallable PWA.

## Data flow for a scan

1. The user captures or selects an image from the scan sheet.
2. The app hashes the original file and checks IndexedDB for a matching eligible scan. Reuse requires the exact active `model_version`; another label or an unlabeled legacy row cannot substitute for adopted V4.3.0 inference.
3. The single classifier preprocesses the image and runs on-device inference.
4. The result and compressed image are saved to IndexedDB with `pending-insert` status.
5. The scan appears immediately in the UI through Dexie live queries.
6. If online, background synchronization obtains a guest session, uploads the image into its private owner directory, and inserts the owned metadata row. This does not delay steps 3–5.
7. The local record becomes `synced`; failed operations remain pending for a later retry.

## Build and deployment constraints

- The project uses Next.js App Router inside `src/app`.
- `output: "export"` produces a static site in `out/`.
- Server-only Next.js features are not part of the current architecture.
- The Serwist integration currently uses webpack, matching the installed Next.js PWA guidance.
- The deployed origin must serve model files and the service worker from the expected root paths.

### Local checks and continuous integration

Husky registers `.husky/pre-commit` and `.husky/pre-push` during root dependency installation. Before commits, `lint-staged` formats staged files with Prettier and stages the fixes. `.prettierignore` keeps generated assets, model files, notebooks, and the separate video project outside formatting. Before upload, the push hook checks secrets and private filenames with `tools/check-security.mjs`, then runs TypeScript, ESLint, and Prettier's check-only command. The security scan includes tracked filenames and fetched Git history, including explicit push commits. `tools/install-gitleaks.mjs` installs the pinned, checksum-verified scanner under ignored `.tools/`. No scanner code or binaries are included in the application export.

`.github/workflows/ci.yml` runs only on pushes to `master`. Independent security and application jobs run tooling tests, repeat the history scan, and perform typecheck, lint, formatting checks, static build, and exported-asset verification. The application job also runs core E2E against an isolated export and retains browser reports for 14 days; R01 and R03 remain explicit reliability runs. CI invokes checks directly with Husky disabled. The build uses public-client fallback settings and does not deploy; production configuration and hosting deployment remain separate. Local checks can stop an upload, while CI reports failures after the push. See [SETUP.md](../SETUP.md#local-security-checks-and-github-ci) for installation, file rules, and limits.

## Naming and organization conventions

- Source filenames: lowercase kebab-case for multiword files.
- React component identifiers: PascalCase.
- Custom hooks: camelCase `useSomething.ts` filenames with matching `useSomething` exports.
- Detailed engineering and history documentation: `docs/`.
- Test instructions and device checklists: `docs/testing/`; treatment-advice source reviews: `docs/treatment-guidelines/`.
- Supabase configuration, cloud ownership, and recovery: `docs/supabase/`.
- Training notebooks: `notebooks/non-experiment/` for the current adopted and older models, and `notebooks/experiment/` for experimental candidates.
- Root documentation: `README.md` for the overview, `SETUP.md` for installation, and `AGENTS.md` for coding-agent instructions.
- Generated files such as `public/sw.js`, `.next/`, `out/`, and `next-env.d.ts` should not be edited by hand.

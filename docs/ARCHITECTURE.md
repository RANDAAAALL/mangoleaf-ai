# MangoLeaf AI Architecture

## System overview

MangoLeaf AI is a client-heavy, offline-first Next.js 16 application. The browser is the primary runtime: it loads the TensorFlow.js model, performs image classification, stores scan records in IndexedDB, and queues synchronization work. Supabase adds backup, image hosting, and shared treatment-guideline updates when the device is online.

![MangoLeaf AI Architecture](../public/images/mangoleaf-architecture.svg)

## Project structure

The tree below highlights the files and directories that define the application. Generated directories such as `.next/` and `out/` are intentionally omitted. A few listed files are marked local only, meaning they are gitignored working notes that are not part of a fresh clone.

```text
mangoleaf-ai/
|-- public/                         # Files served directly from the site root
|   |-- images/
|   |   |-- icons/
|   |   |   |-- png/                # PWA, favicon, and Apple touch icons
|   |   |   `-- svg/                # Vector application and favicon icons
|   |   `-- mangoleaf-architecture.svg  # Diagram embedded by this document
|   |-- model/                      # TensorFlow.js model JSON, weight shards, and model_config.json
|   `-- sw.js                       # Generated Serwist service worker; do not edit
|-- src/                            # Application source code
|   |-- app/                        # Next.js App Router entry points
|   |   |-- globals.css             # Global Tailwind and application styles
|   |   |-- layout.tsx              # Root document, metadata, fonts, and viewport
|   |   |-- manifest.ts             # Installable PWA manifest
|   |   `-- page.tsx                # Main client-side application coordinator
|   |-- components/                 # Reusable interface components, grouped by role
|   |   |-- brand/                  # Application logo and icon set
|   |   |-- layout/                 # Navigation bar, footer, and splash screen
|   |   |-- modal/                  # Legal and scan-details dialogs
|   |   |-- scan/                   # Scan controls, result card, history list, guide
|   |   `-- tab/                    # Home, history, and about screen content
|   |-- hooks/
|   |   |-- usePWAInstall.ts        # PWA installation prompt state and actions
|   |   `-- useSync.ts              # IndexedDB and Supabase synchronization
|   |-- lib/
|   |   |-- classifier.ts           # Model loading, inference, hashing, compression
|   |   |-- constants.ts            # Model classes, fallback guidance, model version label
|   |   |-- db.ts                   # Dexie database schema and record types
|   |   |-- format-time-ago.ts      # Relative timestamp formatting for scan cards
|   |   |-- get-badge-styles.ts     # Disease-name to badge color class mapping
|   |   |-- supabase-client.ts      # Browser-side Supabase client
|   |   `-- translations.ts         # English and Cebuano/Bisaya interface text
|   |-- env.d.ts                    # Types for build-time injected public env values
|   `-- sw.ts                       # Serwist source configuration
|-- docs/                           # Detailed engineering and project history
|   |-- model-training/             # Trial 1, Trial 2, and Trial 2.1 training reports
|   |-- ARCHITECTURE.md             # This architecture reference
|   |-- MANUSCRIPT_MODIFICATIONS.md # Manuscript corrections traced to measured results (local only, gitignored)
|   |-- MODEL_VERSIONING.md         # App, model, notebook, and release versioning
|   |-- PERFORMANCE.md              # Performance decisions and measurements
|   `-- PROGRESS.md                 # Development timeline and current baseline
|-- MangoLeaf_AI_Training_v1.ipynb  # Historical Trial 1 notebook
|-- MangoLeaf_AI_Training_v2.ipynb  # Historical Trial 2 notebook
|-- MangoLeaf_AI_Training_v2.1.ipynb              # Current retraining template, outputs cleared
|-- MangoLeaf_AI_Training_v2_1_Post_Training.ipynb # Completed Trial 2.1 run, do not rerun
|-- .env.example                    # Public environment-variable template
|-- AGENTS.md                       # Repository instructions for coding agents
|-- README.md                       # Project overview and quick start
|-- SETUP.md                        # Complete local and Supabase setup guide
|-- next.config.ts                  # Static export and Serwist integration
|-- package.json                    # Bun scripts and project dependencies
`-- tsconfig.json                   # TypeScript and @/* path-alias configuration
```

This is a single Next.js application rather than separate frontend and backend folders. Browser code owns diagnosis and local storage, while Supabase is an external synchronization service.

## Application layers

### App shell and orchestration

- `src/app/layout.tsx` defines metadata, fonts, viewport behavior, and the root document.
- `src/app/manifest.ts` defines installable PWA metadata and icons.
- `src/app/page.tsx` is the main client coordinator for navigation, model loading, image selection, diagnosis, language state, scan history, and modals.

### User interface

Reusable UI lives in `src/components/`. Filenames use lowercase kebab-case, while exported React components remain PascalCase. For example, `modal/scan-details-modal.tsx` exports `ScanDetailsModal`. Components wrapped in `React.memo()` name the inner function after the export so React DevTools and stack traces show the real component name.

Components are grouped into subfolders by the role they play rather than kept in one flat directory:

| Folder | Contents | Role |
| --- | --- | --- |
| `brand/` | `logo.tsx`, `icon.tsx` | Identity marks and the shared icon set |
| `layout/` | `navbar.tsx`, `footer.tsx`, `splash-screen.tsx` | Application frame around screen content |
| `modal/` | `legal-modal.tsx`, `scan-details-modal.tsx` | Overlay dialogs |
| `scan/` | `diagnostic-scanner.tsx`, `scan-card.tsx`, `scan-history-list.tsx`, `how-it-works-card.tsx` | Diagnosis feature surface |
| `tab/` | `home-tab.tsx`, `history-tab.tsx`, `about-tab.tsx` | One component per navigation tab |

The three tab components are the boundary between `page.tsx` and screen content. `page.tsx` owns all state and handlers, and renders exactly one of `HomeTab`, `HistoryTab`, or `AboutTab` per active tab. Adding a screen means adding a tab component and one branch in `page.tsx`, not editing shared markup.

Grouping is by role, not by which tab uses a file. `scan/scan-history-list.tsx` is rendered by both `HistoryTab` in full and by `HomeTab` as a four-item preview, so it belongs to the scan feature rather than to either tab. Folders group files for navigation and do not define access boundaries.

Use the `@/components/...` path alias for imports across folders, and relative `./` paths only within the same folder, so a file can be moved without rewriting unrelated paths.

### Presentation helpers

Two pure formatting functions in `src/lib/` are kept out of the components that render them so the component files stay markup-only:

- `format-time-ago.ts` turns a scan's ISO `updated_at` into a relative label. It reads every string from `translations.ts`, including the `{n}` count templates for minutes, hours, and days and the `monthsShort` abbreviations used for dates older than a week, so the label is fully localized in both languages. Month names come from `translations.ts` rather than `toLocaleDateString` because browsers have no reliable Cebuano/Bisaya month data. An unparseable timestamp returns the `justNow` label instead of falling through to a `NaN` date.
- `get-badge-styles.ts` maps a disease name to the Tailwind badge classes for its severity color. It matches on substrings, so an unrecognized class name falls back to neutral slate styling rather than throwing.

Both are imported by `scan/scan-card.tsx`. Neither imports React, so both can be called from any component or tested directly.

When adding a relative-time string, add it to both the `en` and `bis` objects in `translations.ts` and use the `{n}` placeholder for any number. Cebuano/Bisaya does not inflect nouns for plurals, so only English needs separate singular and plural forms.

### On-device AI pipeline

`src/lib/classifier.ts` owns the browser inference flow:

1. Load `/model/model.json` with `tf.loadGraphModel`.
2. Cache and warm the model once per browser session.
3. Downscale the image to `224 x 224` with a shared canvas.
4. Run TensorFlow.js inference and dispose temporary tensors.
5. Return the highest-probability class when confidence is at least 70%; otherwise return `Uncertain / Unrecognized`.
6. Compress the image for storage and calculate a SHA-256 hash for duplicate detection.

The model assets are committed under `public/model/` and contain six output classes defined in `src/lib/constants.ts`.

### Local persistence

`src/lib/db.ts` defines the Dexie database `MangoLeafDB` with two stores:

- `scans`: image blobs, predictions, sync metadata, timestamps, and device ownership.
- `guidelines`: cached English and Cebuano/Bisaya treatment guidance.

New scans are written locally first. This allows diagnosis and history features to keep working without a network connection.

### Synchronization

`src/hooks/useSync.ts` coordinates Supabase synchronization:

- Creates a stable per-browser `device_id` in `localStorage`.
- Uploads pending image blobs to the public `scans` Storage bucket.
- Inserts scan metadata into the `scans` table.
- Marks deletions locally and removes remote rows/files when online.
- Pulls the current device's remote scans for history restoration.
- Pulls and caches treatment guidelines.
- Subscribes to Realtime changes for the `guidelines` table.
- Uses a sync lock and a 10-second upload timeout for slow connections.

Supabase is therefore a synchronization and recovery layer; IndexedDB remains the immediate source used by the UI.

### PWA and offline caching

`src/sw.ts` configures Serwist. It precaches the generated application assets, claims active clients, and applies a `CacheFirst` strategy to `/model/*`. `next.config.ts` integrates Serwist, disables it during development, and enables static export. It also reads the `version` field from `package.json` and injects it as `NEXT_PUBLIC_APP_VERSION`, which Next replaces with a literal string at build time wherever the code references it. Because the site is a static export, every public value must be baked in during the build; nothing is resolved at runtime. See `docs/MODEL_VERSIONING.md`.

The precache manifest that Serwist generates covers the build output *and every file under `public/`*. Anything added to `public/` is therefore downloaded to each installed device during service-worker installation, whether or not the application ever requests it. Keep assets that only documentation uses out of `public/` unless they also have to be reachable at a site URL.

### Static assets

Application images live under `public/images/`, with the icon set in `public/images/icons/png/` and `public/images/icons/svg/`. The PNG icons are not decorative: `src/app/manifest.ts` declares the 192x192 and 512x512 files as `maskable`, and browsers refuse to offer the install prompt when a declared icon of at least 192x192 cannot be fetched. `src/app/layout.tsx` points the favicon and Apple touch icon at the same tree. Renaming or moving this directory means updating both files and rebuilding.

These files must stay tracked in git. `.gitignore` patterns that could match them need a leading slash so they stay anchored to the repository root; a bare pattern such as `images` matches a directory of that name at *any* depth and silently excludes `public/images/`. Such a mistake does not surface in `git status`, because ignored paths are not reported as untracked, and it cannot be undone with a negation such as `!public/images/`, because git never descends into a directory that a parent pattern has excluded. The symptom appears only after a fresh clone or a deployment build: no favicon, and an uninstallable PWA.

## Data flow for a scan

1. The user captures or selects an image.
2. The app hashes the original file and checks IndexedDB for a duplicate.
3. The classifier preprocesses the image and runs on-device inference.
4. The result and compressed image are saved to IndexedDB with `pending-insert` status.
5. The scan appears immediately in the UI through Dexie live queries.
6. If online, synchronization uploads the image and inserts the remote metadata row.
7. The local record becomes `synced`; failed operations remain pending for a later retry.

## Build and deployment constraints

- The project uses Next.js App Router inside `src/app`.
- `output: "export"` produces a static site in `out/`.
- Server-only Next.js features are not part of the current architecture.
- The Serwist integration currently uses webpack, matching the installed Next.js PWA guidance.
- The deployed origin must serve model files and the service worker from the expected root paths.

## Naming and organization conventions

- Source filenames: lowercase kebab-case for multiword files.
- React component identifiers: PascalCase.
- Custom hooks: camelCase `useSomething.ts` filenames with matching `useSomething` exports.
- Detailed engineering and history documentation: `docs/`.
- Root documentation: `README.md` for the overview, `SETUP.md` for installation, and `AGENTS.md` for coding-agent instructions.
- Generated files such as `public/sw.js`, `.next/`, `out/`, and `next-env.d.ts` should not be edited by hand.

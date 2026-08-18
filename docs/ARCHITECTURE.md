# MangoLeaf AI Architecture

## System overview

MangoLeaf AI is a client-heavy, offline-first Next.js 16 application. The browser is the primary runtime: it loads the TensorFlow.js model, performs image classification, stores scan records in IndexedDB, and queues synchronization work. Supabase adds backup, image hosting, and shared treatment-guideline updates when the device is online.

```text
Camera or gallery image
        |
        v
Browser preprocessing and SHA-256 duplicate check
        |
        v
TensorFlow.js Graph Model (on-device inference)
        |
        v
Dexie / IndexedDB (local-first scan record)
        |
        +---- offline: retain pending mutation
        |
        `---- online: Supabase Storage + Database sync

Supabase guidelines ----> Realtime/pull sync ----> IndexedDB ----> UI
Serwist service worker -> caches app assets and /model/* for repeat/offline use
```

## Project structure

The tree below highlights the files and directories that define the application. Generated directories such as `.next/` and `out/` are intentionally omitted.

```text
mangoleaf-ai/
|-- public/                         # Files served directly from the site root
|   |-- icons/
|   |   |-- png/                    # PWA, favicon, and Apple touch icons
|   |   `-- svg/                    # Vector application and favicon icons
|   |-- model/                      # TensorFlow.js model JSON and weight shards
|   `-- sw.js                       # Generated Serwist service worker; do not edit
|-- src/                            # Application source code
|   |-- app/                        # Next.js App Router entry points
|   |   |-- globals.css             # Global Tailwind and application styles
|   |   |-- layout.tsx              # Root document, metadata, fonts, and viewport
|   |   |-- manifest.ts             # Installable PWA manifest
|   |   `-- page.tsx                # Main client-side application coordinator
|   |-- components/                 # Reusable interface components
|   |-- hooks/
|   |   |-- usePWAInstall.ts        # PWA installation prompt state and actions
|   |   `-- useSync.ts              # IndexedDB and Supabase synchronization
|   |-- lib/
|   |   |-- classifier.ts           # Model loading, inference, hashing, compression
|   |   |-- constants.ts            # Model classes, fallback guidance, model version label
|   |   |-- db.ts                   # Dexie database schema and record types
|   |   |-- supabase-client.ts      # Browser-side Supabase client
|   |   `-- translations.ts         # English and Cebuano/Bisaya interface text
|   |-- env.d.ts                    # Types for build-time injected public env values
|   `-- sw.ts                       # Serwist source configuration
|-- docs/                           # Detailed engineering and project history
|   |-- model-training/             # Trial 1 and Trial 2 training reports
|   |-- ARCHITECTURE.md             # This architecture reference
|   |-- MODEL_VERSIONING.md         # App, model, notebook, and release versioning
|   |-- PERFORMANCE.md              # Performance decisions and measurements
|   `-- PROGRESS.md                 # Development timeline and current baseline
|-- MangoLeaf_AI_Training_v1.ipynb  # Historical Trial 1 notebook
|-- MangoLeaf_AI_Training_v2.ipynb  # Current retraining template
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

Reusable UI lives in `src/components/`. Filenames use lowercase kebab-case, while exported React components remain PascalCase. For example, `scan-details-modal.tsx` exports `ScanDetailsModal`.

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

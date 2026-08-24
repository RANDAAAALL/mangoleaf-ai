<h1 align="center">
  <img src="./public/images/icons/svg/favicon.svg" alt="mangoleaf-ai icon" width="50"><br/>
  MangoLeaf AI
</h1>

MangoLeaf AI is an offline-first progressive web application that helps identify possible diseases affecting mango leaves and fruit. Classification runs in the browser with TensorFlow.js, scans are stored locally in IndexedDB, and pending records synchronize with Supabase when connectivity is available.

## Features

- Capture a photo or upload an existing mango leaf or fruit image.
- Run on-device classification with a six-class TensorFlow.js Graph Model.
- Review the predicted condition, confidence score, and treatment guidance.
- Switch treatment guidance between English and Cebuano/Bisaya.
- Keep a local scan history that remains available offline.
- Detect duplicate images with SHA-256 hashing.
- Compress stored images to WebP with a JPEG fallback.
- Synchronize scan records and treatment guidelines with Supabase.
- Install the app on supported devices as a PWA.

## Technology

- Next.js 16 App Router and React 19
- Bun and TypeScript
- Tailwind CSS 4
- TensorFlow.js
- Dexie / IndexedDB
- Supabase Database, Storage, and Realtime
- Serwist service worker

## Quick start

Install dependencies, copy the environment template, and start the development server:

```bash
bun install
cp .env.example .env.local
bun run dev
```

Then open `http://localhost:3000`.

The Supabase values in `.env.local` must be replaced before cloud synchronization will work. See [SETUP.md](./SETUP.md) for the complete local setup, Supabase requirements, static-export notes, and pre-commit checks.

## Documentation

- [Setup guide](./SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Performance and optimization notes](./docs/PERFORMANCE.md)
- [Development progress](./docs/PROGRESS.md)
- [Model and release versioning](./docs/MODEL_VERSIONING.md)
- [Trial 2.1 model report (current shipping model)](./docs/model-training/TRIAL_2_1.md)
- [Trial 2 model report (superseded)](./docs/model-training/TRIAL_2.md)
- [Trial 1 model report (superseded)](./docs/model-training/TRIAL_1.md)

## Commands

| Command             | Description                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| `bun run dev`       | Start the Next.js development server with webpack.                                     |
| `bun run typecheck` | Run TypeScript checks without emitting files.                                          |
| `bun run lint`      | Run ESLint across the repository.                                                      |
| `bun run build`     | Create the production static export and service worker.                                |
| `bun run start`     | Run `next start`; this is not the deployment path while `output: "export"` is enabled. |

Before committing, run these checks in order:

```bash
bun run typecheck
bun run lint
bun run build
```

## Important note

MangoLeaf AI provides AI-assisted classifications and treatment guidance. It is a field-support tool, not a substitute for expert diagnosis, laboratory testing, or locally appropriate agricultural advice.

## License and data use

The application is developed for use in the Philippine agricultural context. Deployment operators are responsible for privacy notices, data handling, treatment guidance, and compliance with applicable requirements, including the Data Privacy Act of 2012.

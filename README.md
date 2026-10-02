<h1 align="center">
  <img src="./public/images/icons/svg/favicon.svg" alt="mangoleaf-ai icon" width="80"><br/>
  MangoLeaf AI
</h1>

<p align="center">
  <video src="https://github.com/user-attachments/assets/aa0b1b2c-b1c8-403b-bdcf-2e15da83f343" controls></video>
</p>

MangoLeaf AI is an offline-first progressive web application that helps identify possible diseases affecting mango leaves and fruit. Classification runs in the browser with TensorFlow.js, scans are stored locally in IndexedDB, and pending records synchronize with Supabase when connectivity is available.

## Features

- Capture a photo or upload an existing mango leaf or fruit image.
- Run on-device seven-class classification with a TensorFlow.js Graph Model.
- Review the predicted condition, confidence score, and treatment guidance.
- Switch treatment guidance between English and Cebuano/Bisaya.
- Keep a local scan history that remains available offline.
- Check exact-file duplicates before diagnosis; retake, cancel, or open the saved result from photo review.
- Compress stored images to WebP with a JPEG fallback.
- Synchronize scan records and treatment guidelines with Supabase.
- Read downloaded treatment guidelines offline; missing guidance shows an English/Bisaya status message rather than bundled treatment advice.
- Install the app on supported devices as a PWA.

App `0.4.9` adopts the seven-class V4.3.0 Combined model (`v4.3.0`) as the current application model, replacing the former six-class V3 baseline. The single scan flow remains in use, with separate Healthy Fruit and Healthy Leaf results. The [adopted trial report](docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) and [adoption receipt](docs/model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) preserve export provenance, fitted gates, and model hashes. Its [comparison with V4.1.1](docs/model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md) reports mixed reused-set results; adoption does not establish improved field accuracy. Production promotion and the `v0.4.9` GitHub Release remain pending the final checks described in the [release procedure](docs/MODEL_VERSIONING.md#candidate-testing-and-promotion). The [testing guide](docs/TESTING.md) records local validation. Earlier trials and rollback backups remain preserved.

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
bun install --frozen-lockfile
bun run security:install
cp .env.example .env.local
bun run dev
```

Then open `http://localhost:3000`.

The Supabase values in `.env.local` must be replaced before cloud synchronization will work. See [SETUP.md](./SETUP.md) for the complete local setup, Supabase requirements, static-export notes, and pre-commit checks.

Dependency installation registers Husky hooks. Before commits, `lint-staged` formats staged files with the project's Prettier configuration and includes the fixes in the commit; no editor extension is required. The separate scanner setup downloads a pinned, checksum-verified Gitleaks binary into ignored `.tools/`. Pushes check Git history for secrets and forbidden files, TypeScript, linting, and formatting locally. GitHub repeats these checks and verifies the app on pushes to `master`; see [local checks and CI](./SETUP.md#local-security-checks-and-github-ci).

## Documentation

- [Setup guide](./SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Performance and optimization notes](./docs/PERFORMANCE.md)
- [Testing and reliability guide](./docs/TESTING.md)
- [Physical reliability checklist](./docs/PHYSICAL_RELIABILITY_CHECKLIST.md)
- [Physical checklist answer example (fictional)](./docs/PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md)
- [Development progress](./docs/PROGRESS.md)
- [Treatment-guideline review and proposed English/Bisaya corrections](./docs/guidelines/treatment-guidelines-review-2026-10-02.md)
- [Model and release versioning](./docs/MODEL_VERSIONING.md)
- [Experimental notebook workflows (candidates, not shipped or deployed)](./notebooks/experiment/README.md)
- [V4.1 completed experiment and local test evidence](./docs/model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test)
- [V4.1.1 completed reproduction, inputs, and evidence](./docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md)
- [V4.2.0 separate leaf/fruit experiment results, notebooks, and limits](./docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md)
- [V4.3.0 adopted Combined model: inputs, evidence, comparison, and rollback](./docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md)
- [V4.3.0 preserved workflow and completed notebooks](./notebooks/v4.3.0/)
- [Trial 3 model report (previous released baseline)](./docs/model-training/non-experiment/v3/TRIAL_v3.md)
- [Trial 2.1 model report (superseded)](./docs/model-training/non-experiment/v2.1/TRIAL_v2_1.md)
- [Trial 2 model report (superseded)](./docs/model-training/non-experiment/v2/TRIAL_v2.md)
- [Trial 1 model report (superseded)](./docs/model-training/non-experiment/v1/TRIAL_v1.md)

## Commands

See [application testing](./docs/TESTING.md) for browser installation and report interpretation. Use the [physical reliability checklist](./docs/PHYSICAL_RELIABILITY_CHECKLIST.md) to record real-device evidence. Long reliability runs are explicit commands; core E2E runs in CI on `master` pushes.

| Command                           | Description                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `bun run dev`                     | Start the Next.js development server with webpack.                                     |
| `bun run typecheck`               | Run TypeScript checks without emitting files.                                          |
| `bun run lint`                    | Run ESLint across the repository.                                                      |
| `bun run format`                  | Format supported project files, respecting `.prettierignore`.                          |
| `bun run format:check`            | Check formatting without changing files.                                               |
| `bun run format:staged`           | Format staged files; called automatically by Husky before commits.                     |
| `bun run build`                   | Create the production static export and service worker.                                |
| `bun run security:install`        | Install the pinned local Gitleaks scanner.                                             |
| `bun run security:check`          | Check tracked paths and fetched Git history for private files and secrets.             |
| `bun run test:tooling`            | Test security and export checks using disposable fixtures.                             |
| `bun run test:build`              | Prepare or reuse the isolated production export used by browser tests.                 |
| `bun run test:e2e`                | Build an isolated app and test desktop/mobile scan workflows.                          |
| `bun run test:reliability`        | Run 30 predictions per photo and a 30-minute mixed-use session.                        |
| `bun run test:report`             | Open the core browser-test HTML report.                                                |
| `bun run test:report:reliability` | Open the latest reliability HTML report.                                               |
| `bun run verify:export`           | Verify required PWA and model assets after a production build.                         |
| `bun run start`                   | Run `next start`; this is not the deployment path while `output: "export"` is enabled. |

Before committing, run these checks in order:

```bash
bun run typecheck
bun run lint
bun run build
```

Husky repeats security, TypeScript, ESLint, and formatting checks automatically when you run `git push`. It does not run `bun run build`, so this full list remains required before committing. When preparing source changes, run `bun run format` before these checks so the build reflects the formatted source.

## Important note

MangoLeaf AI provides AI-assisted classifications and treatment guidance. It is a field-support tool, not a substitute for expert diagnosis, laboratory testing, or locally appropriate agricultural advice.

## License and data use

The application is developed for use in the Philippine agricultural context. Deployment operators are responsible for privacy notices, data handling, treatment guidance, and compliance with applicable requirements, including the Data Privacy Act of 2012.

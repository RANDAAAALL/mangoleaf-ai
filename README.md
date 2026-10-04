<h1 align="center">
  <img src="./public/images/icons/svg/favicon.svg" alt="mangoleaf-ai icon" width="80"><br/>
  MangoLeaf AI
</h1>

<p align="center">
  <video src="https://github.com/user-attachments/assets/aa0b1b2c-b1c8-403b-bdcf-2e15da83f343" controls></video>
</p>

MangoLeaf AI is an offline-first progressive web application that helps identify possible diseases affecting mango leaves and fruit. Classification runs in the browser with TensorFlow.js, scans are stored locally in IndexedDB, and pending records synchronize with Supabase when connectivity is available.

**Current app model: V4.3.0 Combined.** One model identifies seven classes covering mango leaves and fruit. **App version: v0.5.1 (candidate / not released).**

## Features

- Capture a photo or upload an existing mango leaf or fruit image.
- Run on-device seven-class classification with a TensorFlow.js Graph Model.
- Review the predicted condition, confidence score, and treatment guidance.
- Switch treatment guidance between English and Cebuano/Bisaya.
- Keep a local scan history that remains available offline.
- Check exact-file duplicates before diagnosis; retake, cancel, or open the saved result from photo review.
- Compress stored images to WebP with a JPEG fallback.
- Synchronize private scan records and photos through an automatic guest session; no registration screen is required.
- Download public treatment guidelines independently of guest sign-in and keep their saved copy available offline.
- Read downloaded treatment guidelines offline; missing guidance shows an English/Bisaya status message rather than bundled treatment advice.
- Install the app on supported devices as a PWA.

[App `0.4.9`](docs/versions/PWA_VERSIONING.md#v049-adoption-of-v430-combined) adopted the seven-class V4.3.0 Combined model (`v4.3.0`) on October 2, 2026, replacing the former six-class V3 baseline. The single scan flow remains in use, with separate Healthy Fruit and Healthy Leaf results. The [adopted trial report](docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) and [adoption receipt](docs/model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) preserve export provenance, fitted gates, and model hashes. Its [comparison with V4.1.1](docs/model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md) reports mixed reused-set results; adoption does not establish improved field accuracy. App `0.5.1` packages scan-thumbnail stability and a horizontal treatment-guidelines header while retaining the private-cloud client and this model. See the [v0.5.1 candidate record](docs/versions/PWA_VERSIONING.md#v051-scan-thumbnail-stability-candidate-october-5-2026) for scope and publication status, and [v0.5.1 validation](docs/testing/TESTING.md#v051-candidate-validation-october-5-2026) for the labeled build's check results. Earlier trials and rollback backups remain preserved.

The [cloud-security update](docs/supabase/SECURITY-AND-SYNC.md#implementation-status) adds guest-owned private scans while preserving the local scan flow. Its private backup and October 2 local checks passed, with additional [v0.5.0 candidate evidence](docs/testing/TESTING.md#v050-candidate-validation-october-3-2026) preserved separately. The October 2 server verification confirmed the private Supabase bucket and owner policies, with original cloud records/files retained. Older clients can still scan locally and read public guidance, but cannot synchronize private scans until updated. Production client status is separate from these local checks; the [v0.5.1 record](docs/versions/PWA_VERSIONING.md#v051-scan-thumbnail-stability-candidate-october-5-2026) tracks this candidate's pending release steps.

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

Then open `http://localhost:3000` on the same computer. This is the usual way to run the app locally.

The Supabase values in `.env.local` must be replaced before cloud synchronization will work. See [SETUP.md](./SETUP.md) for the complete local setup, Supabase requirements, static-export notes, and pre-commit checks.

Dependency installation registers Husky hooks. Before commits, `lint-staged` formats staged files with the project's Prettier configuration and includes the fixes in the commit; no editor extension is required. The separate scanner setup downloads a pinned, checksum-verified Gitleaks binary into ignored `.tools/`. Pushes check Git history for secrets and forbidden files, TypeScript, linting, and formatting locally. GitHub repeats these checks and verifies the app on pushes to `master`; see [local checks and CI](./SETUP.md#local-security-checks-and-github-ci).

### Optional: test the local app on a phone or another computer

Use this option when you want to try the app on another device through a temporary internet link. The app still runs on your development computer, which must stay on with both terminals running. You can skip this section when testing only on the same computer.

Install [Cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) first. Keep the development server running in one terminal:

```bash
# Terminal 1
bun run dev
```

Open a second terminal in the project folder:

```bash
# Terminal 2
bun run tunnel
```

Open the temporary `trycloudflare.com` link printed in Terminal 2. Anyone with that link can reach your local development server while the tunnel runs. Stop it with `Ctrl+C` when finished. See [Cloudflare's Quick Tunnel guide](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) and the [setup notes](./SETUP.md#optional-temporary-link-to-the-local-app).

## Documentation

### Current model used by the app

**V4.3.0 Combined is the current application model.** These links describe its training, results, and saved files. Production promotion is tracked separately in the [release procedure](docs/versions/PWA_VERSIONING.md#candidate-testing-and-promotion).

- [V4.3.0 current model report and saved results](./docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md)
- [V4.3.0 training notebooks and completed runs](./notebooks/non-experiment/v4.3.0/)
- [V4.3.0 compared with V4.1.1](./docs/model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md)

### Experimental models

These versions are preserved experiments; they are not the current application model.

- [All experimental training notebooks](./notebooks/experiment/README.md)
- [V4.1 experiment results](./docs/model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test)
- [V4.1.1 repeated training and results](./docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md)
- [V4.2.0 separate leaf and fruit model results](./docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md)

### Older models

- [V3 previous application model report](./docs/model-training/non-experiment/v3/TRIAL_v3.md)
- [V2.1 older model report](./docs/model-training/non-experiment/v2.1/TRIAL_v2_1.md)
- [V2 older model report](./docs/model-training/non-experiment/v2/TRIAL_v2.md)
- [V1 older model report](./docs/model-training/non-experiment/v1/TRIAL_v1.md)
- [Current and older model training notebooks](./notebooks/non-experiment/README.md)

### Project guides

- [Setup guide](./SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Supabase setup, cloud privacy, and recovery](docs/supabase/SECURITY-AND-SYNC.md)
- [Performance and optimization notes](./docs/PERFORMANCE.md)
- [October 3 performance review and recommended improvements](docs/PERFORMANCE.md#low-end-device-performance-review-october-3-2026)
- [Testing and reliability guide](./docs/testing/TESTING.md)
- [Physical reliability checklist](./docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md)
- [Physical checklist answer example (fictional)](./docs/testing/PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md)
- [Development progress](./docs/PROGRESS.md)
- [Dependency security: app patches and archived training advisories](docs/security/DEPENDENCY_SECURITY.md)
- [Treatment-guideline review and proposed English/Bisaya corrections](./docs/treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md)
- [PWA versions and releases](docs/versions/PWA_VERSIONING.md)
- [AI model versions, training history, and saved evidence](docs/versions/AI_MODEL_VERSIONING.md)

## Commands

See [application testing](./docs/testing/TESTING.md) for browser installation and report interpretation. Use the [physical reliability checklist](./docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md) to record real-device evidence. Long reliability runs are explicit commands; core E2E runs in CI on `master` pushes.

| Command                           | Description                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `bun run dev`                     | Start the Next.js development server with webpack.                                     |
| `bun run tunnel`                  | Create a temporary link to the local server on port 3000; requires Cloudflared.        |
| `bun run typecheck`               | Run TypeScript checks without emitting files.                                          |
| `bun run lint`                    | Run ESLint across the repository.                                                      |
| `bun run format`                  | Format supported project files, respecting `.prettierignore`.                          |
| `bun run format:check`            | Check formatting without changing files.                                               |
| `bun run format:staged`           | Format staged files; called automatically by Husky before commits.                     |
| `bun run build`                   | Create the production static export and service worker.                                |
| `bun run security:install`        | Install the pinned local Gitleaks scanner.                                             |
| `bun run security:check`          | Check tracked paths and fetched Git history for private files and secrets.             |
| `bun run security:dependencies`   | Audit installed app packages; unresolved findings keep a nonzero exit.                 |
| `bun run verify:training-archive` | Verify the unchanged historical Colab snapshot against its original ledgers.           |
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

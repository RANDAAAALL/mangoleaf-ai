<h1 align="center">
  <img src="./public/images/icons/svg/favicon.svg" alt="mangoleaf-ai icon" width="80"><br/>
  MangoLeaf AI
</h1>

<p align="center">
  <video src="https://github.com/user-attachments/assets/af5323fb-f4be-4060-9812-2338c3de1027" controls></video>
</p>

MangoLeaf AI is an offline-first progressive web application that helps identify possible diseases affecting mango leaves and fruit. Classification runs in the browser with TensorFlow.js, scan reports and compressed photos stay in this browser's IndexedDB, and Supabase publishes shared treatment guidelines.

**Current repository model: V4.5.0; prepared PWA version: `0.6.1`.** It uses the 0.70 confidence gate only; margin and entropy rejection are disabled. The [v0.6.1 release record](docs/versions/PWA_VERSIONING.md#v061-uncertain-result-scores-prepared-release-october-16-2026) tracks the scan-details confidence badge and bilingual Terms update separately from the preserved [V4.5.0 trial](docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md) and [model version guide](docs/versions/AI_MODEL_VERSIONING.md). Release validation, physical-device evaluation, and production deployment are separate and pending. V5.0.0 remains untrained and on standby.

## Local-only History candidate (October 15, 2026)

This working tree stores scan reports and compressed photo Blobs only in this browser's IndexedDB. Supabase supplies public treatment guidelines through HTTP GET and Realtime; the app does not create guest sessions, upload scans/photos, pull private History, or queue cloud deletions. This is a source candidate, not a deployment or release announcement. Existing cloud tables, photos, users, policies, and Auth settings were left unchanged.

Existing local report IDs, photos, hashes, model labels, and legacy metadata are preserved. Version 9 removes unused scan indexes without rewriting those records. Previously hidden `pending-delete` rows stay hidden. New reports have `local-only` status; older status values are retained as historical fields and do not trigger cloud work. Clearing site data, browser eviction, or losing the device can remove local History; there is no account or automatic cloud recovery.

If a scan cannot save because browser storage is full, the translated dialog says so explicitly. Open History retains that unsaved result in memory while the user chooses reports to delete. Retry save uses the same prepared record ID and photo without running inference again. Discard releases the unsaved result; no report is automatically deleted. Reloading or closing the page loses an unsaved result. Other database errors retain the existing failure handling.

## Features

- Capture a mango leaf or fruit photo with the guided camera preview, then review, retake, or use the photo; upload an existing image on phones.
- Run on-device seven-class classification with a TensorFlow.js Graph Model.
- Review the predicted condition, confidence score, and treatment guidance.
- Switch treatment guidance between English and Cebuano/Bisaya.
- Keep a local scan history that remains available offline.
- Browse one recent scan on phones. At 768px and wider, Home shows an Install prompt instead; the header offers Home, About, and Install. Phone History keeps its search, filters, and report controls.
- Search History, inspect condition-filter counts, select matching reports across pages, and confirm single or bulk deletion.
- Read compact photo tips in the scan sheet, with Cancel kept visible while its content scrolls.
- Check exact-file duplicates before diagnosis; retake, cancel, or open the saved result from photo review.
- Compress stored images to WebP with a JPEG fallback.
- Save scan reports and photos locally, with an explicit storage-full dialog and a retry that reuses the completed prediction.
- Download public treatment guidelines through HTTP and Realtime, and keep their saved copy available offline.
- Protect received guideline updates from older overlapping downloads and changes made by another open tab.
- Skip rewriting saved guidance when a valid full download contains exactly the same records and text.
- Read downloaded treatment guidelines offline; missing guidance shows an English/Bisaya status message rather than bundled treatment advice.
- Install the app on supported devices as a PWA.

**Historical local candidate test, October 12, 2026:** V4.5.0 was temporarily installed as `v4.5.0-candidate` with its original fitted gates for reversible evaluation. The October 16 adoption supersedes that temporary state; see the current model record above.

**Local development state, October 9, 2026:** The V4.4.0 candidate completed training and threshold fitting, was tested locally, and was declined by the maintainer. The verified V4.3.0 model, label, and fitted settings are restored in `public/model/`. [V4.4.0 results and figures](docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md#completed-results-and-local-rollback-october-9-2026) remain experimental evidence. Original downloaded runs and completed notebooks are preserved.

The [guided camera](docs/ARCHITECTURE.md#guided-camera-capture) and [responsive installation guide](docs/ARCHITECTURE.md#installation-guide), prepared in app `0.5.5` and first implemented under the earlier local `0.5.4` label, remain part of `0.6.1`. Desktop installation shows both platform instructions and a QR link to the public website; phone instructions use detected iOS/Android identity, while native install support is determined separately by the browser's install event. Phone History now shows four reports per page, with its selection-delete action above pagination; wider History retains six. Photo cards reserve their image height when the viewport changes. The [October 9 development record](docs/versions/PWA_VERSIONING.md#local-development-changes-october-9-2026) retains its original validation identity.

[App `0.4.9`](docs/versions/PWA_VERSIONING.md#v049-adoption-of-v430-combined) adopted the seven-class V4.3.0 Combined model (`v4.3.0`) on October 2, 2026, replacing the former six-class V3 baseline. The single scan flow remains in use, with separate Healthy Fruit and Healthy Leaf results. The [adopted trial report](docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md) and [adoption receipt](docs/model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) preserve export provenance, fitted gates, and model hashes. Its [comparison with V4.1.1](docs/model-training/non-experiment/v4.3.0/COMPARISON_v4_1_1_vs_v4_3_0.md) reports mixed reused-set results; adoption does not establish improved field accuracy. App `0.5.2` introduced responsive Home and History layouts, report selection with confirmed deletion, filter counts, compact photo tips, and badge/icon refinements. See the [v0.5.2 candidate record](docs/versions/PWA_VERSIONING.md#v052-scan-history-and-deletion-candidate-october-6-2026) for its dated scope and release checks. The [v0.5.1 validation](docs/testing/TESTING.md#v051-candidate-validation-october-5-2026) remains evidence for the earlier thumbnail-stability build. Earlier trials and rollback backups remain preserved.

App `0.5.3` introduced protected guideline downloads and direct Realtime updates, network-only guideline HTTP reads, and retained offline advice. Its [dated preparation record](docs/versions/PWA_VERSIONING.md#v053-guideline-update-ordering-candidate-october-7-2026) retains the original candidate evidence. App `0.5.4` adds a content check before an accepted HTTP response is saved: identical guidance finishes successfully without clearing or rewriting IndexedDB. HTTP still downloads the complete guidance set, and direct Realtime updates keep their existing behavior. See the [v0.5.4 prepared release record](docs/versions/PWA_VERSIONING.md#v054-unchanged-guidance-check-prepared-release-october-7-2026) and [reported release status](docs/versions/PWA_VERSIONING.md#release-status-confirmation-october-7-2026).

The historical [cloud-security update](docs/supabase/SECURITY-AND-SYNC.md#implementation-status) adds guest-owned private scans while preserving the local scan flow. Its private backup and October 2 local checks passed, with additional [v0.5.0 candidate evidence](docs/testing/TESTING.md#v050-candidate-validation-october-3-2026) preserved separately. The October 2 server verification confirmed the private Supabase bucket and owner policies, with original cloud records/files retained. Older clients can still scan locally and read public guidance, but cannot synchronize private scans until updated. The [October 7 release-status confirmation](docs/versions/PWA_VERSIONING.md#release-status-confirmation-october-7-2026) records the published versions separately from those earlier local checks; the [v0.6.1 record](docs/versions/PWA_VERSIONING.md#v061-uncertain-result-scores-prepared-release-october-16-2026) tracks the current prepared release with local-only History.

The [treatment-source date clarification](docs/treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md#source-dates-and-review-scope--2026-10-06-clarification) distinguishes the 2025 BAFS explanatory manual from the underlying 2009 GAP standard. Five of the review's six named publications fall within five years of October 6, 2026. The original standard is older, and the review's proposed wording is separate from its October 2 database snapshot; the clarification does not verify today's live guidance.

## Technology

- Next.js 16.3.8 App Router and React 19
- Bun and TypeScript
- Tailwind CSS 4
- TensorFlow.js
- Dexie / IndexedDB
- Supabase Database and Realtime for public treatment guidelines
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

Next.js's built-in development MCP endpoint is disabled in `next.config.ts`. This setting is independent of an agent's GitHub MCP connector. See the [dependency security review](docs/security/DEPENDENCY_SECURITY.md) for the October 10 framework patch and its validation status.

The Supabase values in `.env.local` must be replaced before public treatment-guideline downloads and Realtime updates will work. See [SETUP.md](./SETUP.md) for the complete local setup, Supabase requirements, static-export notes, and pre-commit checks.

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

The development-origin allowance supports browser requests through the tunnel; it does not authenticate visitors. The tunnel remains public with the Next.js development MCP endpoint disabled.

## Documentation

### Current model in the repository

**V4.5.0 OE is the adopted repository model**, using confidence >=0.70 only. The saved confidence-only reference is not a field-accuracy claim. Production promotion is tracked separately in the [release procedure](docs/versions/PWA_VERSIONING.md#candidate-testing-and-promotion).

- [V4.5.0 current model report and saved results](./docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md)
- [V4.5.0 training notebooks and completed runs](./notebooks/non-experiment/v4.5.0/)
- [V4.3.0 historical report and rollback provenance](./docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md)

### Experimental models

V5.0.0 remains an untrained candidate workflow on standby. Repository adoption of V4.5.0 is complete; production deployment remains separate.

- [All experimental training notebooks](./notebooks/experiment/README.md)
- [V4.5.0 Outlier Exposure inputs, notebooks, and run guide](./docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md)
- [V4.1 experiment results](./docs/model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test)
- [V4.1.1 repeated training and results](./docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md)
- [V4.2.0 separate leaf and fruit model results](./docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md)
- [V4.4.0 Seven Class completed results, figures, and local rollback](./docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md)

### Older models

- [V3 previous application model report](./docs/model-training/non-experiment/v3/TRIAL_v3.md)
- [V2.1 older model report](./docs/model-training/non-experiment/v2.1/TRIAL_v2_1.md)
- [V2 older model report](./docs/model-training/non-experiment/v2/TRIAL_v2.md)
- [V1 older model report](./docs/model-training/non-experiment/v1/TRIAL_v1.md)
- [Current and older model training notebooks](./notebooks/non-experiment/README.md)

### Project guides

- [Setup guide](./SETUP.md)
- [Codebase review guide for a coworker's AI agent](./docs/CODEBASE_REVIEW.md)
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

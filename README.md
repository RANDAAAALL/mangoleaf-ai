<h1 align="center">

<img src="public/images/icons/svg/favicon.svg" alt="MangoLeaf AI logo" width="80"><br/>
MangoLeaf AI
</h1>

MangoLeaf AI helps identify possible conditions affecting mango leaves and fruit from photos. Built for Android phones, it runs diagnosis on the device and keeps scan History available offline. Treatment guidance is available in English and Cebuano/Bisaya. The companion website explains the app and provides Android installation on phones and desktop.

## Walkthrough (depricated)

https://github.com/user-attachments/assets/71f91a97-ebe4-4ed2-86fe-6a4aeee69536

## Features

- Capture a mango leaf or fruit with a square guided camera preview and matching crop; review, retake, or upload an existing photo on phones.
- Run on-device seven-class classification with a TensorFlow.js Graph Model.
- Review the predicted condition, confidence percentage with up to one decimal, and treatment guidance. Uncertain results also show confidence.
- Switch the interface and treatment guidance between English and Cebuano/Bisaya.
- Keep reports and photos in local History for offline access. The APK requests portrait orientation on phones.
- Browse recent scans and manage History in the APK. The website offers Home, About and Android installation on every screen size, including local development. Phone websites use a centered header and bottom navigation with Home, About, open/install and language controls; scanning and Diagnostics are APK features.
- Search History, view condition-filter counts, select matching reports across pages, and confirm single or bulk deletion.
- Read compact photo tips in the scan sheet while Cancel stays visible as the content scrolls.
- Check exact-file duplicates before diagnosis; retake, cancel, or open a saved result. Reuse requires the saved report's model version to match the active model.
- Compress stored photos to WebP with a JPEG fallback.
- Handle full storage with an explicit dialog and a save retry that reuses the completed prediction.
- Refresh public treatment guidelines through HTTP and Realtime, and read saved guidance offline. The APK also includes starter guidelines for first use.
- Protect guidance from older overlapping downloads and changes made in another open browser tab; skip rewriting identical downloaded guidance.
- Show an English/Bisaya status message when matching guidance is unavailable. The browser needs a successful download before it can read guidance offline.
- Back up eligible APK reports and photos automatically while the app is open and online. Create and save a recovery code, then restore and merge cloud reports on another Android phone. Pause/Resume remains available.
- Queue deletion of a report's copies in its connected cloud backup, including offline retries. This does not delete copies already restored on another phone; see [backup and deletion behavior](docs/security/SECURITY-AND-SYNC.md).
- Open an installed Android app from the website, or follow the APK installation guide. Supported browsers show **Open app** when they can confirm the installation.
- Offer **Restart now** / **Later** when a compatible, signed web update is ready in the production APK. Debug does not install production OTA updates.
- Enable optional diagnostics in the APK About tab, reproduce an issue, and copy or download recent local events without phone DevTools. Recording is off by default.

## Download and status

The [official download page](https://mangoleafai.vercel.app/download) provides the published v0.9.0 release, with Android APK v0.1.4 and model v4.5.0. This source prepares v0.10.0 with browser landing changes and a native v0.1.5/code 6 icon candidate. The new artifacts are not published. See the [Android guide](docs/versions/ANDROID_APK_VERSIONING.md) and [release history](docs/versions/history/PWA_RELEASE_HISTORY.md).

## Technology

- Next.js **16.4.1** App Router, static export, and React **19.2.4**
- Bun **1.4.4**, TypeScript, and Tailwind CSS **4**
- TensorFlow.js for on-device inference
- Java Android host and WebView, SQLite reports, and photos in private app files
- Dexie / IndexedDB retained for legacy browser data compatibility and isolated regression tests; the website does not open History
- Supabase Auth, Database and Storage for private cloud backup; public treatment guidelines through Database and Realtime
- Serwist service worker for the website; separately bundled offline assets and signed OTA updates for Android

See [Architecture](docs/ARCHITECTURE.md) for the application layers, storage boundaries and update flow.

## Quick start

Use **Bun 1.4.4**, pinned by `packageManager` in root `package.json`, and **Node.js 24.22.1 or a newer stable 24.x patch**. Both CI jobs read the Bun pin from `package.json`; `.node-version` selects the reviewed Node default. See [prerequisites](SETUP.md#prerequisites) and [Node security checks](SETUP.md#check-and-update-nodejs).

From the project folder, check the runtime and install dependencies and the pinned secret scanner:

```bash
bun run security:runtime
bun install --frozen-lockfile
bun run security:install
```

For a fresh checkout, copy the environment template. Skip each copy command if that file already contains your settings:

```powershell
Copy-Item .env.example .env.local
Copy-Item .env.example .env.testing.local
```

Before starting the app, edit `.env.local` with the production project's public URL/key and `.env.testing.local` with the separate testing project's public URL/key. Never use a secret or service-role key. Development and default Debug bundles explicitly select the pinned testing project; placeholders and other project identities are rejected. See [environment configuration](SETUP.md#configure-environment-variables).

Start the development server:

```bash
bun run dev
```

Open `http://localhost:3000` on the same computer. Development and production browsers provide the same landing/download experience without scanning, History controls, Diagnostics or private backup uploads. Use the Debug APK for scan testing against the separate testing project. Existing browser reports remain stored without migration or deletion. See [Android setup](docs/versions/ANDROID_APK_VERSIONING.md).

Dependency installation registers Husky hooks. Before a commit, `lint-staged` formats staged files using the project's Prettier configuration. Pushes run local secret/history, TypeScript, lint and formatting checks. GitHub CI also builds and tests the application on `master` pushes; automation uses a local mock backend. See [local checks and CI](SETUP.md#local-security-checks-and-github-ci).

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

Open the temporary `trycloudflare.com` link printed in Terminal 2. Anyone with that link can reach your local development server while the tunnel runs. Stop it with `Ctrl+C` when finished. See [Cloudflare's Quick Tunnel guide](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) and the [setup notes](SETUP.md#optional-temporary-link-to-the-local-app).

The development-origin allowance supports browser requests through the tunnel; it does not authenticate visitors. Next.js's development MCP endpoint remains disabled in `next.config.ts`.

## Documentation

### Current model in the repository

**V4.5.0 OE is the adopted repository model**, using confidence >=0.70 only, with margin and entropy rejection disabled. The saved confidence-only reference is not a field-accuracy claim. Production promotion is tracked separately in the [release procedure](docs/versions/PWA_VERSIONING.md#candidate-testing-and-promotion).

- [V4.5.0 report, Outlier Exposure inputs, run guide and saved results](docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md)
- [V4.5.0 training notebooks and completed runs](notebooks/non-experiment/v4.5.0/)
- [V4.3.0 historical report and rollback provenance](docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md)

### Experimental models

These are research records. **V5.0.0 remains experimental and is excluded from this application release; V4.5.0 stays adopted.** Training results, comparisons and their limits belong in the linked reports and [model history](docs/versions/history/AI_MODEL_HISTORY.md#october-19-2026-v500-completed-review-and-local-candidate).

- [V5.0.0 completed training and unsupported-image results review](docs/model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md)
- [All experimental training notebooks](notebooks/experiment/README.md)
- [V4.1 experiment results](docs/model-training/experiment/v4.1/TRIAL_v4_1.md#completed-result-and-local-test)
- [V4.1.1 repeated training and results](docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md)
- [V4.2.0 separate leaf and fruit model results](docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md)
- [V4.4.0 Seven Class completed results, figures, and local rollback](docs/model-training/experiment/v4.4.0/TRIAL_v4_4_0.md)

### Older models

- [V3 previous application model report](docs/model-training/non-experiment/v3/TRIAL_v3.md)
- [V2.1 older model report](docs/model-training/non-experiment/v2.1/TRIAL_v2_1.md)
- [V2 older model report](docs/model-training/non-experiment/v2/TRIAL_v2.md)
- [V1 older model report](docs/model-training/non-experiment/v1/TRIAL_v1.md)
- [Current and older model training notebooks](notebooks/non-experiment/README.md)

### Project guides

- [Setup guide](SETUP.md)
- [Codebase review guide for a coworker's AI agent](docs/CODEBASE_REVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Supabase setup, cloud privacy, and recovery](docs/security/SECURITY-AND-SYNC.md)
- [Performance and optimization notes](docs/PERFORMANCE.md)
- [October 3 performance review and recommended improvements](docs/PERFORMANCE.md#low-end-device-performance-review-october-3-2026)
- [Android testing](docs/testing/ANDROID_TESTING.md)
- [Testing and reliability guide](docs/testing/TESTING.md)
- [Physical reliability checklist](docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md)
- [Physical checklist answer example (fictional)](docs/testing/PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md)
- [Development progress](docs/PROGRESS.md)
- [Dependency security: app patches and archived training advisories](docs/security/DEPENDENCY_SECURITY.md)
- [Treatment-guideline review and proposed English/Bisaya corrections](docs/treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md)
- [PWA version rules and release steps](docs/versions/PWA_VERSIONING.md) · [Full release history](docs/versions/history/PWA_RELEASE_HISTORY.md#release-timeline)
- [Active AI model, version rules, and adoption steps](docs/versions/AI_MODEL_VERSIONING.md) · [Full model history](docs/versions/history/AI_MODEL_HISTORY.md#model-timeline)
- [Android APK version, signing and release steps](docs/versions/ANDROID_APK_VERSIONING.md) · [Full Android APK history](docs/versions/history/ANDROID_APK_HISTORY.md)

<details>
<summary>Earlier README candidate bookmarks</summary>

<a id="android-implementation-candidate-october-20-2026"></a>
<a id="square-guided-camera-candidate-v080"></a>
<a id="local-diagnostics-and-confidence-display-prepared-v070"></a>
<a id="local-only-history-candidate-october-15-2026"></a>

Dated implementation notes belong in the [Android history](docs/versions/history/ANDROID_APK_HISTORY.md#preserved-implementation-notes), [square-camera release record](docs/versions/history/PWA_RELEASE_HISTORY.md#v080-square-camera-prepared-release-october-19-2026), [diagnostics release record](docs/versions/history/PWA_RELEASE_HISTORY.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026), and [October 15 local-only History record](docs/versions/history/PWA_RELEASE_HISTORY.md#local-only-history-candidate-october-15-2026). Later dated records explain the changes since each candidate.

</details>

## Commands

See [application testing](docs/testing/TESTING.md) for browser installation and report interpretation. Use the [physical reliability checklist](docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md) to record real-device evidence. Long reliability runs are explicit commands; core E2E runs in CI on `master` pushes.

| Command                                         | Description                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `bun run dev`                                   | Start the Next.js development server with webpack.                                                       |
| `bun run tunnel`                                | Create a temporary link to the local server on port 3000; requires Cloudflared.                          |
| `bun run typecheck`                             | Run TypeScript checks without emitting files.                                                            |
| `bun run lint`                                  | Run ESLint across the repository.                                                                        |
| `bun run format`                                | Format supported project files, respecting `.prettierignore`.                                            |
| `bun run format:check`                          | Check formatting without changing files.                                                                 |
| `bun run format:staged`                         | Format staged files; called automatically by Husky before commits.                                       |
| `bun run build`                                 | Create the website's production static export and service worker.                                        |
| `bun run security:runtime`                      | Check that the actual Node executable meets the reviewed security floor.                                 |
| `bun run security:install`                      | Install the pinned local Gitleaks scanner.                                                               |
| `bun run security:check`                        | Check tracked paths and fetched Git history for private files and secrets.                               |
| `bun run security:dependencies`                 | Audit installed app packages; unresolved findings keep a nonzero exit.                                   |
| `bun run verify:training-archive`               | Verify all preserved training snapshot mappings against their original ledgers.                          |
| `bun run test:tooling`                          | Run tooling, storage, backup and release regression cases with local fixtures.                           |
| `bun run test:build`                            | Prepare or reuse the isolated production export used by browser tests.                                   |
| `bun run test:e2e`                              | Build an isolated app and test desktop/mobile scan workflows.                                            |
| `bun run test:reliability`                      | Run the full reliability suite, including repeated real predictions and the 30-minute R03 session.       |
| `bun run test:report`                           | Open the core browser-test HTML report.                                                                  |
| `bun run test:report:reliability`               | Open the latest reliability HTML report.                                                                 |
| `bun run verify:export`                         | Verify required PWA and model assets after a production build.                                           |
| `bun run android:bundle`                        | Prepare offline Android web assets with testing settings and the committed model; does not build an APK. |
| `bun run android:release:windows -Action check` | Check the external production signing configuration on Windows.                                          |
| `bun run start`                                 | Run `next start`; this is not the deployment path while `output: "export"` is enabled.                   |

For Debug APK rebuild/install commands and production APK/OTA signing, follow the [Android guide](docs/versions/ANDROID_APK_VERSIONING.md). Those steps are separate from building or deploying the website.

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

Original project material is covered by the [MangoLeaf AI Restricted Use License](LICENSE.md), attributed to MangoLeaf AI contributors. Anyone may use the official APK and website; source reuse, modification, and redistribution require written permission from the relevant copyright holders, subject to GitHub's platform permissions, applicable law, and third-party licenses. Each contributor retains rights to their own original work.

The application is developed for use in the Philippine agricultural context. Deployment operators are responsible for privacy notices, data handling, treatment guidance, and compliance with applicable requirements, including the Data Privacy Act of 2012.

# MangoLeaf AI Setup Guide

**October 24 patch preparation:** source app 0.10.1 / APK 0.1.6/code 7 is unpublished; published v0.10.0 uses APK 0.1.5. The installer branding correction restores the same white-backed adaptive leaf for application, archive and launcher icons; the separate system-splash leaf remains. Rebuild/install the same-signer APK for changed native resources. The preceding plain-package-leaf experiment is superseded, and Samsung My Files decoration remains a separate device observation. The production `/apk/<tag>/mangoleaf-ai.apk` attachment route is unchanged and the maintainer reported successful phone downloads. See [the current Android guide](docs/versions/ANDROID_APK_VERSIONING.md#icon-and-apk-download-follow-up-october-24-2026).

## Current browser and APK behavior (October 24, 2026)

Since published v0.10.0, the website is landing/download-only. App v0.10.1 is the new unpublished patch candidate. Production and development browsers at every viewport show Home, About and Android installation. They do not start scanning, open History, mount Diagnostics, or enroll/upload private backups. Existing IndexedDB reports, photos, credentials and queued jobs are preserved; nothing is migrated into an APK automatically. Use a Debug APK for scanning and testing-project backup; the production APK continues using production. Production and development phone bottom navigation use the current EN or BIS label. Local model assets/configuration/constants are restored to adopted V4.5.0; V5 research evidence remains preserved. Desktop QR installation and the phone download guide remain available. The dated notes below describe earlier implementations.

**Version display, October 23:** APK footers now show the installed Android version and bundled model, with Debug retaining `-dev`; About keeps the separate web-bundle version. Browser footers retain app/model labels. The download page accepts a native version only from the validated APK asset label printed by the release builder. See [version display and publishing](docs/versions/ANDROID_APK_VERSIONING.md#installed-and-available-apk-versions).

**Earlier implementation audit, October 23 (superseded by the version-display follow-up):** native candidate **0.1.4/code 5** (Debug **0.1.4-dev**), default host bounds **5-5**, repairs OTA rollback/restart/cancellation and History/recovery races. Rebuild and install the matching-signer APK to test the Java changes; `adb install -r` alone installs the existing file. Web remains the 0.8.0 working candidate, bridge/schema 1/1, and default Android model committed V4.5.0. Native version stays out of the footer. See [audit evidence](docs/testing/ANDROID_TESTING.md#october-23-2026-implementation-audit). No deployment or publication is performed.

**Website install follow-up, October 22:** Android actions say **Open or install**, changing to **Open app** only when a supporting browser confirms the exact package. Unknown/older installs retain an explicit guide; confirmed installs put another APK download behind a reinstall/update choice. Release association needs native **0.1.3/code 4** and the matching website manifest; web 0.8.0/model V4.5 remain unchanged. See [website launch and detection](docs/versions/ANDROID_APK_VERSIONING.md#website-open-or-install). No APK download or public deployment happens automatically.

**Earlier October 22 backup follow-up:** both APK variants back up eligible saved reports automatically, without an initial enable step. Production uses production Supabase; Debug/development browser use testing. Create/save a recovery code outside the phone for recovery. Pause/Resume remains available. A verified-update modal replaces the About update card; Debug retains its production-OTA block. Native 0.1.2/code 3 needs a rebuilt/reinstalled APK. See [current behavior and release flow](docs/versions/history/ANDROID_APK_HISTORY.md#automatic-production-backup-and-update-prompt-october-22-2026). Earlier dated notes describe preceding candidates.

This guide covers local development and the external services required by the current application.

**Production APK, October 22:** use `bun run android:release:windows -Action check` and then `bun run android:release:windows -Action build` from the repository root. This account's approved permanent keys live outside the repository under `%USERPROFILE%\.mangoleaf-ai\signing`; its protected credentials must be accessible to that Windows account. A missing key fails closed rather than creating a replacement. The wrapper validates, builds, signs and retains an unpublished APK/receipt under ignored `.tools/android-release/`. Debug still uses testing and its SDK debug key. Production backup resources/function are deployed and the maintainer enabled its server-only flag; automatic enrollment and real-device checks remain separate. See [production preparation](docs/versions/history/ANDROID_APK_HISTORY.md#production-apk-preparation-october-22-2026) for prerequisites, portable key/password backup, OTA, exact-artifact verification, current server evidence and publication gates. No new public environment variables are required; signing passwords never belong in public app settings.

**October 21 camera follow-up:** rebuild/reinstall the Debug APK for the native permission-dialog lifecycle fix and `mangoleaf://open` handler. The website's Android **Open MangoLeaf AI** link targets Debug during `bun run dev` and the production package in published builds, with a same-origin download-information fallback. That October 21 version did not detect installation or download an APK automatically; the later positive-only detection is described above. No new dependency, backend setting or environment variable is required. See [camera and launch behavior](docs/versions/history/ANDROID_APK_HISTORY.md#camera-permission-capture-and-installed-app-opening-october-21-2026).

**October 21 automatic testing backup:** in `mangoleafai-testing`, enable both **Allow anonymous sign-ins** and **Allow new users to sign up** in Authentication settings. The maintainer enabled both and a real signup was verified. Testing provisioning function version 2 enrolls that verified owner before private uploads; creating an APK recovery code keeps its UUID. No enable button or recovery code is required for testing uploads. Production backup remains opt-in and its server rollout is pending. See [testing recovery setup](docs/versions/history/ANDROID_APK_HISTORY.md#automatic-testing-backup-and-recovery-october-21-2026).

**October 21 synchronized History deletion:** rebuild/reinstall Android host `0.1.1-dev`/code `2` for the atomic cloud-delete queue. Browser development uses Dexie v10; keep that schema declaration in rollback builds and never clear user storage to downgrade it. Confirmed deletions remove connected backup copies with foreground/offline retries, including when uploads are paused. Preserve recovery credentials and pause other writers holding stale copies. See [deletion, recovery and rollback](docs/versions/history/ANDROID_APK_HISTORY.md#history-deletion-and-recovery-october-21-2026). Production server rollout remains a separate pending step.

The supported mobile product is the Android APK, requiring Android 8.0 or newer and a current Android System WebView. Desktop and phone browsers, including local development, provide the landing/download website. Scanning, History, Diagnostics and recovery are APK features. Legacy browser data is retained without being displayed. Manual report import/export controls remain retired.

The browser landing candidate uses shared app version `0.10.0` and adopted model `v4.5.0`, with confidence >=0.70 only; margin and entropy are disabled. The maintainer's uncommitted local V5 override is separate from this app release. A fresh checkout uses V4.5 unless the experimental model is deliberately installed. See the [V5 local test and rollback record](docs/model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md#local-installation-and-rollback). Android/cloud setup uses the resources and settings described below; model retraining is unnecessary. Its [candidate release record](docs/versions/history/PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026) tracks validation, publication, and promotion separately.

## Prerequisites

For Java Android development, follow [Android build and recovery setup](docs/versions/ANDROID_APK_VERSIONING.md). JDK 21, SDK platform 36, and the checked-in Gradle Wrapper build the APK from VS Code/PowerShell. `bun run android:guidelines` prepares public offline advice; `bun run android:bundle` stages the separate Android export. Browser instructions below start the landing/download website; use the Debug APK for supported scanner testing. Cloud backup needs the additional reviewed SQL and provisioning function; no service-role secret belongs in the web environment.

Use the [separate testing project](docs/versions/ANDROID_APK_VERSIONING.md#separate-testing-project) for development cloud tests. Keep production public settings in `.env.local`; put the testing URL/public key under the same variable names in ignored `.env.testing.local`. `bun run dev` and default `bun run android:bundle` explicitly select testing, including when Bun inherited production variables. The six public production guideline rows were copied with permission on October 21; production reports/photos/users were not copied. Restart the development server after configuration changes.

Development browsers do not scan or upload private reports. Use the Debug APK for automatic testing uploads and explicit recovery. A first eligible saved APK photo lazily creates its verified owner; empty History does not create an identity. Existing browser sessions and outboxes are left intact but the website does not start their worker.

Diagnostics is available only in Debug and production APK builds. Recording stays optional; APK log download opens Android's document picker. No browser Diagnostics card is mounted at any screen size.

- [Bun](https://bun.sh/) **1.4.4** available on the command line. Root `package.json` pins `bun@1.4.4`; both CI jobs read that field through `bun-version-file: package.json`.
- Git and Node.js **24.22.1 or a newer stable 24.x patch** for local tooling; `.node-version` pins the reviewed default. Git for Windows supplies the hook shell.
- `tar` for scanner installation (included with current Windows, macOS, and typical Linux installations)
- A modern browser with IndexedDB, Web Workers, Web Crypto, Canvas, and WebGL support
- A Supabase project for public treatment-guideline downloads and Realtime updates
- Optional: [Cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) available on the command line for `bun run tunnel`

Confirm Bun is installed:

```bash
bun --version
```

Expect `1.4.4`. Use [Bun's installation instructions](https://bun.sh/docs/installation) to install that version if needed, then check again. The `packageManager` field records the project version; it does not replace your installed executable. Keep `bun.lock` unchanged unless intentionally changing dependencies.

### Check and update Node.js

The October 21, 2026 Node security release requires updating the Node executable, even though the main Next.js development/build commands use Bun. Playwright, OTA packaging, archive verification, and the separate video project's `npx` commands use Node. `@types/node` is only a type package and does not patch that executable.

On Windows, install the official **24.22.1 LTS or newer stable 24.x** installer from the [Node 24 security release](https://nodejs.org/en/blog/release/v24.22.1/). Close and reopen VS Code and its terminals after upgrading. Then, from this project folder, run:

```powershell
node --version
bun run security:runtime
```

Both must identify an accepted patched Node 24 runtime. The version file and `package.json` engine requirement describe the policy; they do not install Node. The explicit check rejects an old executable or Bun's reported Node compatibility version. The browser test runner checks its actual Node child before building, and the OTA/archive CLIs check before processing files.

CI reads `.node-version`, enables `check-latest`, and runs the same check before browser tooling. With an exact version file, `check-latest` ensures that selected version is available; it does not automatically advance the pin to future patches. Review and update the version file and engine floor together for later security releases. Vercel manages patches within the selected Node major; verify the actual version in its build log rather than assuming the local pin controls its patch level. See the [dated exposure review](docs/security/DEPENDENCY_SECURITY.md#october-21-2026-nodejs-runtime-security-review).

## Install the project

```bash
git clone https://github.com/RANDAAAALL/mangoleaf-ai.git
cd mangoleaf-ai
bun install --frozen-lockfile
bun run security:install
```

## Dependency security and archived training records

The root app pins Next.js and its ESLint configuration to `16.4.1` for the October 23 framework security patch. `package.json` retains the Browserslist `4.28.7` override introduced by the October 3 review. Use the frozen installation command above to reproduce the committed Bun lockfile selections. The [dependency security review](docs/security/DEPENDENCY_SECURITY.md#october-23-2026-public-release-security-review) records advisory scope and current audit evidence.

Run `bun run security:dependencies` for an online package-vulnerability audit. This is separate from the credential/history scanner, `bun run security:check`. The October 23 patched selection has a clean production-only audit; its full audit still reports the unpatched development-only `braces` finding (high). Keep unresolved findings visible; a nonzero audit exit is not a scanner malfunction or a reason to add an ignore rule. The dependency security review preserves the original 113-alert inventory, the newer 83-alert inventory, and each dated review's evidence and limits.

The saved Colab `colab-runtime-snapshot.txt` and V4.4 `training-runtime-snapshot.txt` / `converter-runtime-snapshot.txt` are historical inventories, not supported installation files. Do not pass them to `pip install -r`; their original versions have unresolved advisories. `bun run verify:training-archive` checks their unchanged bytes and archive mappings against the original training ledgers. The [complete alert inventories](docs/security/DEPENDENCY_SECURITY.md) preserve those findings. A new training session requires a separately reviewed, patched environment and compatibility checks.

## Configure environment variables

For a fresh checkout, copy the committed template into separate production and testing files. Skip a copy command when its destination already contains your settings:

```bash
cp .env.example .env.local
cp .env.example .env.testing.local
```

On PowerShell, use:

```powershell
Copy-Item .env.example .env.local
Copy-Item .env.example .env.testing.local
```

Use the production project's public settings in `.env.local` and the pinned testing project's public settings in `.env.testing.local`:

| Variable                               | Required                 | Purpose                                                          |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | For the selected backend | Supabase project API URL.                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For the selected backend | Browser-safe key for public guidelines and authenticated backup. |

`bun run dev` and default Android bundles explicitly read testing settings; `android:bundle --release` selects production. Variant, host and project checks must agree. These files do not redirect a client to an arbitrary new project. Use the reviewed projects and [Android routing rules](docs/versions/ANDROID_APK_VERSIONING.md#separate-testing-project); never point automated scans at production.

Version labels are not environment variables. The shared web-bundle version comes
from `package.json` through `next.config.ts`; the model label comes from
`modelVersion` in `src/lib/constants.ts`. Browser footers show app/model labels.
APK footers instead show the installed native host version and model, with the
independent web-bundle version in About. See
[PWA versioning](docs/versions/PWA_VERSIONING.md) and [AI model versioning](docs/versions/AI_MODEL_VERSIONING.md).

The committed template uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Older projects may keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the compatible public-key setting. Configure one browser-safe project key; neither name may contain a secret or service-role key.

Do not commit either environment file. Both are covered by `.gitignore`. Anonymous-provider settings and server provisioning flags belong in Supabase, not additional public environment variables.

## Configure Supabase

Public guideline downloads in the production and testing projects use:

- A `public.guidelines` table containing `id`, `disease_name`, `guidelines_en`, and `guidelines_bis`.
- Public SELECT access for published guidance, with RLS enabled and no browser write access.
- The `guidelines` table in the Realtime publication for live INSERT/UPDATE/DELETE notifications.
- The selected project's URL and browser-safe publishable key; never a secret or service-role key.

Android stores reports and guidelines in SQLite and photos in private app files. Both APK variants automatically back up eligible photo reports while foreground and connected. Debug and guarded browser development use testing; Production APK uses production. Private backup also needs the reviewed `scans` and `android_backup_reports` tables, private `scans` bucket, owner policies, transfer functions and provisioning Edge Function. Supabase must allow anonymous sign-ins and new-user signups; the server-only `ANDROID_BACKUP_PROVISIONING_ENABLED` flag permits first enrollment. Use the [reviewed deployment and preservation instructions](docs/security/SECURITY-AND-SYNC.md), not an ad hoc replacement schema. Existing projects are already initialized; do not recreate them.

The website leaves legacy Dexie/IndexedDB reports and photo Blobs untouched but exposes no History or scanning controls and performs no private backup work. This also applies to development browsers. Browser storage remains subject to browser-managed eviction; the APK does not automatically import those records. Preserve existing cloud resources, users, policies and backups; this interface change authorizes no cleanup.

An installed APK includes its app/model assets and starter guidelines for offline use. Browser offline use requires a production website load to cache app/model assets and a successful guideline download first; development disables Serwist. Automatic backup and explicit APK recovery need a connection, but local diagnosis and saving do not wait for them. Create and save an APK recovery code outside the phone before losing it; restore merges owned cloud reports rather than replacing local History. See [runtime and recovery behavior](docs/versions/ANDROID_APK_VERSIONING.md#runtime-and-data-preservation).

When storage prevents saving, the app offers Open History, Retry save, and Discard unsaved result. Retry reuses the completed prediction and same record ID. The unsaved result exists only in memory until local commit; reloading or closing the page loses it. Deleting reports requires the user's explicit choice. Clearing all site data removes local reports and photos and does not trigger a cloud restore.

Maintain treatment text in `public.guidelines` only. Use the existing IDs `anthracnose`, `bacterial_black_spot`, `bacterial_canker`, `mango_scab`, `sooty_mold`, and `healthy`; Healthy Leaf and Healthy Fruit both read `healthy`. Populate both language fields with nonblank text. The [dated source review](./docs/treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md) contains proposed replacements for manual review and entry; it has not applied them to Supabase.

Successful synchronization saves these rows in the runtime's local guideline store: SQLite in Android, IndexedDB in browsers. Android seeds an empty store from `android/starter-guidelines.json`; refresh that reviewed build snapshot deliberately with `bun run android:guidelines`. Browsers have no bundled treatment fallback. Missing rows or blank selected-language fields display a translated unavailable message. Downloaded updates remain readable offline; changing Supabase does not instantly update an offline device.

## Run locally

```bash
bun run dev
```

Open `http://localhost:3000`.

Serwist is disabled in development to prevent stale service-worker caches. Test production caching and offline behavior from a production build served over HTTPS or localhost.

`next.config.ts` also sets `experimental.mcpServer: false`, disabling Next.js's built-in development endpoint at `/_next/mcp`. This removes development project and log access through that endpoint, including when a tunnel is running. It does not configure or disable an agent's separate GitHub MCP connector.

### Optional: temporary link to the local app

Use this option to try the app on a phone or another computer through a temporary internet link. The app still runs on your development computer, which must stay on with both terminals running. For local development on the same computer, use `bun run dev` and open `http://localhost:3000`; the tunnel is optional.

The existing `bun run tunnel` script runs `cloudflared tunnel --url http://localhost:3000`. Install Cloudflared using the prerequisite link above, then confirm it is available:

```bash
cloudflared --version
```

Start the app in one terminal and keep it running:

```bash
# Terminal 1, from the project folder
bun run dev
```

Open another terminal in the same folder:

```bash
# Terminal 2
bun run tunnel
```

Open the printed `trycloudflare.com` link on the other device. The script targets port 3000, so the app must be running on that port. Anyone with the link can access this development server until you stop the tunnel with `Ctrl+C`. Quick Tunnels are temporary development links; see [Cloudflare's guide](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

The configured `*.trycloudflare.com` development-origin allowance supports the tunnel's browser requests; it does not authenticate visitors. Disabling the Next.js MCP endpoint does not make the public tunnel private.

Serwist remains disabled when using `bun run dev` through the link. Use a production export for service-worker and offline-caching checks.

## Optional: review the codebase after setup

Open this repository in your AI coding agent, reference `@docs/CODEBASE_REVIEW.md` or attach the [codebase review guide](docs/CODEBASE_REVIEW.md), and write your own initial request. The guide provides the detailed instructions for a read-only review in plain English. The agent asks how to deliver the analysis and whether to create a separate technical Q&A file, with independent format and location choices. Reports saved under `docs/local-ignored-files/` remain ignored by Git.

## Production build

```bash
bun run build
```

The project uses `output: "export"` in `next.config.ts`, so the build creates static output in `out/`. Deploy the contents through a static host that serves the generated service worker and model files from the site root.

## Required pre-commit checks

Run all checks in this order before committing:

```bash
bun run typecheck
bun run lint
bun run build
```

Do not commit until all three commands pass. TypeScript and ESLint run in their own steps; the build separately verifies the static export and Serwist service-worker generation. Next.js 16 does not run ESLint as part of the build.

Husky repeats security, TypeScript, ESLint, and formatting checks automatically when you run `git push`. It does not run `bun run build`, so this full list remains required before committing. Run `bun run format` before these checks when preparing source changes. If the commit hook subsequently reformats source files, rebuild and include the regenerated service worker in a follow-up commit.

## Local security checks and GitHub CI

`bun install` runs the `prepare` script and registers Husky's `.husky/pre-commit` and `.husky/pre-push` hooks in this clone. Every coworker must install dependencies after cloning. `bun run security:install` downloads Gitleaks 8.30.1 from its official GitHub release, verifies the archive's pinned SHA-256 checksum, and installs it under ignored `.tools/`. Supported systems are Windows, macOS, and Linux on x64 or arm64. Installation needs internet access; push checks do not. No Gitleaks account or license key is needed for this direct CLI installation.

Before a commit, Husky runs `bun run format:staged`. The pinned `lint-staged` package passes staged filenames to `prettier --write --ignore-unknown` and stages formatting fixes automatically. Its default backup and handling of partially staged files preserve unstaged edits; a task failure stops the commit. No VSCode extension is required. An installed Prettier extension can use the project's local package and `.prettierrc.json`, so editor formatting follows the same rules as hooks and CI.

Use `bun run format` to format the project manually and `bun run format:check` to check without editing. `.prettierignore` excludes generated output, model assets, notebooks, lockfiles, local-only files, and the separate `video/` project. Source, tooling, workflows, and project Markdown remain included. Line endings use `auto` to accept Windows and Unix checkouts; Git attributes still require LF for hooks. ESLint loads `eslint-config-prettier` last to disable conflicting formatting rules while retaining code-quality checks.

When you push, the hook runs `bun run security:check --pre-push`, `bun run typecheck`, `bun run lint`, then `bun run format:check`. The security check examines tracked file paths and all fetched Git history, including HEAD and the exact commits supplied by Git for the push. It catches credentials and forbidden files even when a later commit deletes them. A missing scanner, incomplete shallow history, scanner error, security finding, type error, lint error, or formatting error stops the push. Ref deletions alone do not upload commits and skip the security scan, but still run typecheck, lint, and formatting checks. Push hooks and CI only check formatting; they never rewrite files. If formatting blocks a push, run `bun run format`, review and commit the fixes, then retry.

The file policy blocks `.env*` except `.env.example`, private-key/container extensions (`.pem`, `.key`, `.p12`, `.pfx`, `.keystore`), SSH private-key filenames, `secrets/` and `confidential/` directories, and the two local-only documents `docs/EMAIL_DISPATCH_WORKFLOW.md` and `docs/MANUSCRIPT_MODIFICATIONS.md`. Ignored, uncommitted `.env.local` files stay on your computer and are not scanned or uploaded. The `.env.example` template remains subject to credential scanning once committed. Other confidential documents need an explicit rule in `tools/check-security.mjs`; the scanner cannot infer business sensitivity.

Useful manual checks:

```bash
bun run security:check
bun run test:tooling
bun run verify:export  # Run after bun run build.
```

Findings show filenames, lines, rules, and commit IDs without credential values. Remove an unpushed secret from every affected local commit before retrying. If a real credential already reached GitHub, revoke or rotate it; deleting its latest file does not remove earlier exposure. Review false positives individually instead of broadly excluding files or history.

The root `.gitleaksignore` contains three audited fingerprints for the public diagnostics localStorage name in commit `88a479d153eaeebc6487774caa9324dd4f18ec62`. They identify only those historical commit/file/rule/line combinations; no directory, file, rule, or history range is excluded. A security regression verifies that the storage-name occurrence can pass while a later synthetic credential at the same path and line still fails without printing its value. Review any future finding separately. This uses the pinned scanner's [finding fingerprints](https://github.com/gitleaks/gitleaks/blob/v8.30.1/README.md#gitleaksignore), not a skipped hook or disabled rule.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs only for pushes to `master`, including merges. Its `security` job installs the same scanner, tests the tooling, and scans the full fetched history. Its independent `check` job installs frozen dependencies, runs typecheck, lint, formatting checks, and webpack build in order, then verifies exported PWA/model files. It also installs Playwright browsers, tests an isolated static export, and saves reports/failure traces for 14 days. Both have read-only repository permission; newer pushes cancel unfinished older runs. No video dependencies or training notebooks are executed.

CI sets `HUSKY=0` because it invokes checks directly. The build uses the existing public-client fallback settings and requires no production credentials; it is not a deployment artifact for public guideline access. Production builds still need the public Supabase values described above. App/model version labels remain sourced from code. The workflow does not deploy, change Dependabot settings, or gate an independent hosting deployment. It starts after GitHub receives a push and does not inspect pushes isolated on other branches. Local hooks can be skipped, so keep both layers. The hook deliberately excludes production build and export verification because the build is slower and downloads Google Fonts. CI runs these checks automatically; developers still run the required local build before committing and can run `bun run verify:export` afterward.

Tooling regression tests cover secret/file history checks, export assets, diagnosis lifecycle, local scans, diagnostics retention/privacy, and confidence formatting through controlled inputs. They do not establish real-camera behavior, GPU/device performance, or live Supabase behavior; the isolated browser suite and physical-device evidence have separate scopes.

## Browser tests and reliability

Use Node.js 24.22.1 or a newer stable 24.x patch alongside Bun. Install the pinned browser binaries once after `bun install`:

```bash
bun run security:runtime
node node_modules/@playwright/test/cli.js install chromium firefox
bun run test:e2e
bun run test:report
```

On Linux, include `--with-deps` when installing browsers. `test:e2e` prepares a production export in ignored `.test-app/`, compiles only local mock backend settings, and serves it on `127.0.0.1:4173`. It reuses the export only when input hashes match. It never overwrites the normal `out/` build or manually edits `public/sw.js`. Never deploy `.test-app/`; it contains test backend settings and tooling. Keep port 4173 free and run browser suites one at a time.

Run `bun run test:reliability` explicitly for 30 real predictions per supplied photo and a 30-minute mixed-use session. It defaults to one emulated Chromium phone; select another supported project explicitly to repeat measurements. These long checks are not in Husky or per-push CI. Reports are under ignored `playwright-report/` and `test-results/`; preserve formal evidence before rerunning. See [TESTING.md](docs/testing/TESTING.md) for case IDs, report-only rejection diagnostics, fixture labels, limitations, and the manual physical-device checklist.

The core CI suite includes guided-camera, installation-guide, and diagnostics cases. R03 now alternates gallery uploads and synthetic guided-camera captures, including photo review, Retake, stream cleanup, and actual inference. Updating this protocol does not execute it; the October 9 alignment task did not run R03. Physical camera/lens behavior, permission recovery, OS background behavior, and cached offline capture still require recorded phone checks. For manual camera use, open HTTPS or localhost; an ordinary HTTP LAN address cannot provide the live camera API.

For why `.test-app/`, `.tools/`, `playwright-report/`, and `test-results/` appear locally, what creates them, and what happens if you remove them, see [local generated folders](docs/testing/TESTING.md#local-generated-folders).

## Staged releases on Vercel

To review each `master` deployment before it serves users, open Vercel **Settings > Environments > Production > Branch Tracking**, keep `master`, and disable **Auto-assign Custom Production Domains**. Confirm the dashboard setting; these repository changes do not configure Vercel. Builds remain Production/Staged until manually promoted. The previous Current deployment keeps serving the production domain.

Wait for CI and the approved release validation, then promote the exact tested deployment. Staged builds still use Production environment variables and do not create an isolated database. Prepared version labels and documentation may be pushed before approval, but must not claim an unpublished version has shipped. Follow the [release procedure](docs/versions/PWA_VERSIONING.md#candidate-testing-and-promotion) and [v0.9.0 preparation record](docs/versions/history/PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026). Earlier dated results remain evidence for their original builds. The [October 7 release-status confirmation](docs/versions/history/PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026) preserves its earlier publication and live-version report.

## Threshold-fitting notebook inputs

For threshold-only experiments against the existing Trial 3 model, follow the [v3.1 Colab upload checklist](docs/model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md). It requires the original calibrated `.keras` model and `resume_info.json`, the existing `val/` and `test/` class folders, and the OOD image collection. The root Bun dependencies do not execute this Python notebook. It writes candidate results into a separate Drive folder; application deployment remains a separate step.

## Background-replacement training experiment

For the paired retraining experiment, use the [v3.1 preparation and Colab guide](docs/model-training/experiment/v3.1/TRIAL_v3_1.md). Training needs the original `train/`, `val/`, and `test/` split, the reserved OOD collection, and a separate pool of replacement-background photos. Cutouts are generated automatically in Colab and reviewed before training. The companion v3.2 fitting notebook consumes both newly calibrated models and freezes both threshold selections before evaluation. The original threshold-only v3.1 notebook remains for the old Trial 3 weights.

The [v3.2 paired threshold guide](docs/model-training/experiment/v3.2/TRIAL_v3_2.md) documents that workflow separately. Experiment documentation follows notebook versions; these directories do not announce deployed model versions.

For the seven-class experiment with separate background and localized-lighting arms, follow the original [V4.1 Colab guide](docs/model-training/experiment/v4.1/TRIAL_v4_1.md) or the completed, step-by-step [V4.1.1 reproduction guide](docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md). Both use the verified V4 split and existing background photos. The 32-photo OOD folder was new for V4.1 but reused in V4.1.1, so it is no longer independent evidence. Review masks and lighting previews before training; finish all four arms before threshold fitting. Colab notebooks saved separate Drive runs; the V4.1.1 Background bundle is preserved in an ignored backup for local rollback, not a deployed model.

For the completed **V4.2.0 two-model experiment**, follow the [leaf/fruit Colab guide and evidence report](docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md). It uses the same source folders and preserved split, with Bacterial Canker assigned to the leaf group. If reproducing it, run each training notebook, then its matching threshold notebook, then return to the training notebook's saved-result figure steps. Check the actual Google Drive contents before starting. The local two-model app trial has ended; its files are preserved in ignored `.tools/model-backups/v4.2.0-dual-experiment-20260929/`. **Only leaf had a feasible fitted candidate**; neither model was deployed or released.

## V4.5.0 Outlier Exposure notebook setup

For the fresh OE experiment, follow the [V4.5.0 Colab guide](docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md). Its clean training and threshold-fitting notebooks use ordinary Colab cells and an explicit package plan; do not install any archived requirements snapshot. Under **Runtime > Change runtime type**, keep **Python 3**, choose a GPU such as **T4**, and select **Runtime Version 2026.04**. Google's [runtime list](https://research.google.com/colaboratory/runtime-version-faq.html) identifies this image as Python 3.12.13 with TensorFlow 2.19.0. If that image is unavailable, use another listed Python 3.11/3.12 runtime. The generic Python 3 label and GPU choice do not set the Python minor version. Check the version printed by setup, follow the package restart instruction, and mount the original account's Drive. Read the printed and resolved paths before starting a run.

The intended first run needs the original labeled mango collection, the separate `mangoleafai_oe_images` training collection, and 500 reserved photos in `mango_ood_test_v4_4_0` after adding 300 to its existing 200. The full OOD inventory must be declared before training and stay separate from OE photos. New outputs remain under the existing `MyDrive/mangoleaf_experiments/v4.5.0/` parent. Finish and seal training before opening threshold fitting; paste the completed run folder name without a leading `/training/`. CSV reviews require replacing the actual CSV, not saving a separate native Google Sheet.

The new notebooks update pip first and explicitly patch seven helper packages that the initial Colab audit found vulnerable. Use a fresh runtime when the template's package plan changes; an old setup receipt intentionally stops. The [dependency-repair instructions](docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#if-step-2-reports-unresolved-training-dependencies) also cover continuing the older copy that stopped before training. Colab's Recommended image alone does not replace those fixes or establish compatibility; check its actual Python version and run every setup gate.

V5.0.0 completed five fine-tuning epochs and a later 995-photo OOD report. Its [completed review](docs/model-training/experiment/v5.0.0/RESULTS_REVIEW_v5_0_0.md) preserves source identities, copied evidence, comparison and limitations. The research-only push does not replace the V4.5 model in committed application files. The earlier failed attempts remain historical evidence.

## Phone diagnostics and stalled operations

Diagnostics in About was introduced in v0.7.0 and remains in the v0.9.0 candidate. It needs no account, backend table, or new environment setting, and works offline after the app is available. Recording is off by default. Enable **Record diagnostic events** before reproducing a problem; the choice is remembered when localStorage works. Unchecking stops new events without clearing earlier history. Earlier actions performed while recording was off cannot be recovered.

Use **View logs** in About to inspect, copy, download a `.txt` file, or clear diagnostic history. If clipboard permission fails, select and copy the visible text manually. This is one shared recorder, not separate logs for each modal. Events remain when a modal closes or the user changes tabs; no log controls are added to scan, result, or deletion dialogs. Clearing diagnostic logs does not delete IndexedDB scans, photos, or guidelines.

The recorder keeps at most 200 recent events and a serialized UTF-8 payload of 64 KiB, removing the oldest entries as needed. Logs and the preference use localStorage key `mangoleaf-diagnostics-v1`, separate from `MangoLeafDB`. Writes are grouped behind a 250 ms timer, with a best-effort flush when the page hides or exits; the opt-in choice is written immediately. localStorage is synchronous when the write runs. A denied or failed write produces the memory-only warning rather than failing a scan or deletion. Reload survival is best effort: a frozen/terminated browser can lose recent unwritten entries, storage clearing or eviction removes the saved log, and memory-only history disappears when the page session ends. Copy or download evidence before further attempts rotate it out.

Logs contain controlled technical event names, timestamps, operation/stage durations and counts, connectivity/visibility, app/model labels, browser family/version and OS family, backend/texture precision, and known error names. They do not collect photos, original filenames, hashes, report/device/guest IDs, diagnosis classes/confidence tables, raw error messages/stacks, credentials, full user-agent strings, or page/request URLs. There is no automatic log upload or console interception. Copy/download is an explicit local export; share it deliberately with the maintainer.

### Recover and preserve evidence

1. Enable recording in About before testing. Note the phone/browser version and whether it is a browser tab or installed app; the export does not reliably identify an exact phone model or OS version.
2. If Run AI Diagnosis is faded, repeated tapping cannot activate it. Close photo review with X if possible, then download the logs. Readiness events can distinguish an unfinished photo check from an unavailable model; disabled-button taps themselves are not recorded.
3. If analysis starts, the existing analysis stage has a 60-second recovery deadline. This is not a completion guarantee: blocking browser/GPU work or a backgrounded page can delay timers. Use Cancel or the error's Reload action if available.
4. If analysis or deletion remains stuck and controls do not respond, reload or fully close and reopen the same app/browser. The deletion dialog currently waits for the database operation without an automatic timeout. About is not accessible through a blocking stuck modal, and a whole-browser freeze also prevents reading logs in place.
5. Open About and download the retained logs before retrying. Check History first: a save or deletion may have committed even when its screen did not advance. An unsaved scan draft is lost on reload. Do not clear site data or uninstall as a troubleshooting shortcut, because local reports/photos and logs can be erased.

A started event without a completion narrows the last observed step; it does not prove a specific GPU driver, precision setting, IndexedDB bug, or exact cause. Reopening is temporary recovery, not a fix supplied by diagnostics. Browser automation and controlled failure checks do not substitute for the [physical-device evidence record](docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md).

New accepted and uncertain reports keep the raw classifier confidence. Scan details display up to one decimal rounded down, without `.0` (`62%`, `62.1%`, `69.8%`); a 69.99% score displays `69.9%` rather than `70%`. The 0.70 acceptance check continues using the raw score. Existing reports and duplicate reuse keep their saved precision; original discarded decimals cannot be reconstructed. This is a presentation/storage change, not retraining or evidence of higher accuracy. The current classifier explicitly forces 16-bit WebGL textures; no automatic 32-bit-first behavior or memory-failure retry is being introduced by this release.

## Common setup issues

The release model in prepared app `0.9.0` remains [V4.5.0](docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md). The October 19 maintainer workspace temporarily uses uncommitted `v5.0.0-candidate` files for local testing; these runtime overrides are excluded from the app release. Keep all five matching model files together in `public/model/`. The [local installation receipt](docs/model-training/experiment/v5.0.0/artifacts/local_test_installation.json) records that tested override, its original hashes and exact V4.5 backup; it does not change what a fresh checkout loads. Build the release worker from the matching V4.5.0 model, label, and cache identity rather than copying a local V5-generated worker. After an intentional model swap, restart the development server and reload the page; a production preview also needs a rebuild and activated worker. Production promotion remains separate.

- If a push reports a missing scanner, run `bun run security:install`. If the hook cannot find Bun, make Bun available to the terminal or Git GUI's PATH and restart that application.
- For a shallow clone, run `git fetch --unshallow` before scanning. If hooks were not registered during dependency installation, run `bun run prepare` and confirm `git config --get core.hooksPath` prints `.husky/_`.
- Scan reports are intentionally local. For a storage-full warning, delete chosen History reports and retry saving before reloading the page.
- If guidelines do not update, verify the `guidelines` table, select policy, and Realtime publication.
- If the model does not load, confirm `public/model/model.json` and all referenced weight shards are present.
- If offline behavior seems stale during development, test a fresh production build because the service worker is intentionally disabled by `next dev`.

## V4.5.0 completed local candidate test (October 12, 2026)

At that time, the five browser assets in `public/model/` temporarily identified `model-v4.5.0-candidate` and used confidence 0.70, margin 0, entropy 0.40. This is historical evidence; the current adopted configuration uses confidence 0.70 only. See the current adoption guide above.

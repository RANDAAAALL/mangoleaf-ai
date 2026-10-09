# MangoLeaf AI Setup Guide

This guide covers local development and the external services required by the current application.

The current prepared app release is `0.5.5`, with model `v4.3.0`. Version labels come from repository files; no additional environment variable or Supabase schema change is required for the guided-camera and installation-guide release.

## Prerequisites

- [Bun](https://bun.sh/) available on the command line (CI uses 1.4.0)
- Git and Node.js 24 for local tooling; Git for Windows supplies the hook shell
- `tar` for scanner installation (included with current Windows, macOS, and typical Linux installations)
- A modern browser with IndexedDB, Web Workers, Web Crypto, Canvas, and WebGL support
- A Supabase project if cloud synchronization is required
- Optional: [Cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) available on the command line for `bun run tunnel`

Confirm Bun is installed:

```bash
bun --version
```

## Install the project

```bash
git clone https://github.com/RANDAAAALL/mangoleaf-ai.git
cd mangoleaf-ai
bun install --frozen-lockfile
bun run security:install
```

## Dependency security and archived training records

The root app pins Next.js and its ESLint configuration to `16.3.8` for the October 10 framework security patch. `package.json` retains the Browserslist `4.28.7` override introduced by the October 3 review. Use the frozen installation command above to reproduce the committed Bun lockfile selections. The [dependency security review](docs/security/DEPENDENCY_SECURITY.md) records advisory scope and current audit evidence.

Run `bun run security:dependencies` for an online package-vulnerability audit. This is separate from the credential/history scanner, `bun run security:check`. The October 10 full audit retains two findings without published fixes: development-only `braces` (high) and `sprintf-js` (moderate). The production-only audit retains `sprintf-js`; it does not establish that the exported browser app executes the affected formatter. Keep unresolved findings visible; a nonzero audit exit is not a scanner malfunction or a reason to add an ignore rule. The dependency security review preserves all 113 original Dependabot alerts and subsequent review evidence.

The saved Colab `colab-runtime-snapshot.txt` is a historical package inventory, not a supported installation file. Do not pass it to `pip install -r`; its original versions have unresolved advisories. `bun run verify:training-archive` checks its unchanged bytes against the original training ledgers. A new training session requires a separately reviewed, patched environment and compatibility checks.

## Configure environment variables

Copy the committed template to a local environment file:

```bash
cp .env.example .env.local
```

On PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Configure these values in `.env.local`:

| Variable                               | Required       | Purpose                                |
| -------------------------------------- | -------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | For cloud sync | Supabase project API URL.              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For cloud sync | Supabase browser-safe publishable key. |

Version labels are not environment variables. The footer app version is derived
from the `version` field in `package.json` by `next.config.ts`, and the model
label is the `modelVersion` constant in `src/lib/constants.ts`. See
[PWA versioning](docs/versions/PWA_VERSIONING.md) and [AI model versioning](docs/versions/AI_MODEL_VERSIONING.md).

The committed template uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Older projects may keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the compatible public-key setting. Configure one browser-safe project key; neither name may contain a secret or service-role key.

Do not commit `.env.local`. It is already covered by `.gitignore`.

## Configure Supabase

The synchronization code expects the following resources:

- Anonymous sign-ins enabled under Authentication, **Sign In / Providers**.
- A private Storage bucket named `scans`, with owner-restricted object policies.
- A `scans` table for guest-owned scan metadata, with owner-restricted RLS policies.
- A `guidelines` table for English and Cebuano/Bisaya treatment guidance.
- Public read-only access to `guidelines`; browser clients cannot edit treatment text.
- Realtime enabled for the `guidelines` table if live guidance updates are required.

The cloud client creates and reuses an anonymous guest session in the background. Farmers do not enter an email or password. Local diagnosis and History remain available while that session or a cloud request is pending; public treatment-guideline reads do not depend on guest sign-in.

The scan schema keeps the prediction metadata, browser label, and a separate verified owner. The following is a field overview, not a standalone secure setup script:

```sql
create table public.scans (
  id uuid primary key,
  disease_name text not null,
  confidence float8 not null,
  image_url text, -- retained for legacy rows; new photos use a private object path
  storage_path text,
  owner_id uuid,
  model_version text,
  image_hash text,
  updated_at timestamptz not null default now(),
  device_id uuid not null
);
```

It reads these `guidelines` fields:

```sql
create table public.guidelines (
  id text primary key,
  disease_name text not null,
  guidelines_en text not null,
  guidelines_bis text not null
);
```

An old row may have a null `owner_id` so its data can be retained without inventing ownership. New browser inserts must match the signed guest's `auth.uid()`. `device_id` is not an ownership credential. New photo paths sit under that guest's directory, and downloads require a matching session. See [Supabase security and recovery](./docs/supabase/SECURITY-AND-SYNC.md) for the reviewed policies, legacy records, private backups, rollout order, and verification status. Do not execute the schema overview alone and assume that grants, RLS, and Storage have been secured.

The same public project URL and browser-safe key remain sufficient. Never use a service-role or secret key in browser code. Enabling anonymous sign-ins alone does not replace the previously broad policies. If the database is secured before the matching app is deployed, an older UUID-only client cannot synchronize private scans; its local scans and publicly readable guidance continue to work.

The current project's October 2 owner-security migration and private bucket are applied and verified. The matching client changes remain local until deployment. Follow the [implementation status](./docs/supabase/SECURITY-AND-SYNC.md#implementation-status) for the migration identity, preserved data, and remaining rollout step; do not recreate or replace the existing cloud tables to repeat this setup.

Maintain treatment text in `public.guidelines` only. Use the existing IDs `anthracnose`, `bacterial_black_spot`, `bacterial_canker`, `mango_scab`, `sooty_mold`, and `healthy`; Healthy Leaf and Healthy Fruit both read `healthy`. Populate both language fields with nonblank text. The [dated source review](./docs/treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md) contains proposed replacements for manual review and entry; it has not applied them to Supabase.

Successful synchronization saves these rows in IndexedDB. A device can then display its downloaded advice offline, including during a failed later sync. A device with no matching saved row, or a blank selected-language field, displays a translated unavailable message. There is no bundled treatment fallback. Initial use, cleared browser storage, and new guideline updates require a successful online sync; changing the table does not instantly update an offline device.

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

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs only for pushes to `master`, including merges. Its `security` job installs the same scanner, tests the tooling, and scans the full fetched history. Its independent `check` job installs frozen dependencies, runs typecheck, lint, formatting checks, and webpack build in order, then verifies exported PWA/model files. It also installs Playwright browsers, tests an isolated static export, and saves reports/failure traces for 14 days. Both have read-only repository permission; newer pushes cancel unfinished older runs. No video dependencies or training notebooks are executed.

CI sets `HUSKY=0` because it invokes checks directly. The build uses the existing public-client fallback settings and requires no production credentials; it is not a deployment artifact for cloud synchronization. Production builds still need the public Supabase values described above. App/model version labels remain sourced from code. The workflow does not deploy, change Dependabot settings, or gate an independent hosting deployment. It starts after GitHub receives a push and does not inspect pushes isolated on other branches. Local hooks can be skipped, so keep both layers. The hook deliberately excludes production build and export verification because the build is slower and downloads Google Fonts. CI runs these checks automatically; developers still run the required local build before committing and can run `bun run verify:export` afterward.

Tooling regression tests cover secret/file history checks and export assets. They do not test camera capture, browser inference, offline reloads, or Supabase synchronization.

## Browser tests and reliability

Use Node.js 24 alongside Bun. Install the pinned browser binaries once after `bun install`:

```bash
node node_modules/@playwright/test/cli.js install chromium firefox webkit
bun run test:e2e
bun run test:report
```

On Linux, include `--with-deps` when installing browsers. `test:e2e` prepares a production export in ignored `.test-app/`, compiles only local mock backend settings, and serves it on `127.0.0.1:4173`. It reuses the export only when input hashes match. It never overwrites the normal `out/` build or manually edits `public/sw.js`. Never deploy `.test-app/`; it contains test backend settings and tooling. Keep port 4173 free and run browser suites one at a time.

Run `bun run test:reliability` explicitly for 30 real predictions per supplied photo and a 30-minute mixed-use session. It defaults to one emulated Chromium phone; select another supported project explicitly to repeat measurements. These long checks are not in Husky or per-push CI. Reports are under ignored `playwright-report/` and `test-results/`; preserve formal evidence before rerunning. See [TESTING.md](docs/testing/TESTING.md) for case IDs, report-only rejection diagnostics, fixture labels, limitations, and the manual physical-device checklist.

The core CI suite includes guided-camera and installation-guide cases. R03 now alternates gallery uploads and synthetic guided-camera captures, including photo review, Retake, stream cleanup, and actual inference. Updating this protocol does not execute it; the October 9 alignment task did not run R03. Physical camera/lens behavior, permission recovery, OS background behavior, and cached offline capture still require recorded phone checks. For manual camera use, open HTTPS or localhost; an ordinary HTTP LAN address cannot provide the live camera API.

For why `.test-app/`, `.tools/`, `playwright-report/`, and `test-results/` appear locally, what creates them, and what happens if you remove them, see [local generated folders](docs/testing/TESTING.md#local-generated-folders).

## Staged releases on Vercel

To review each `master` deployment before it serves users, open Vercel **Settings > Environments > Production > Branch Tracking**, keep `master`, and disable **Auto-assign Custom Production Domains**. Confirm the dashboard setting; these repository changes do not configure Vercel. Builds remain Production/Staged until manually promoted. The previous Current deployment keeps serving the production domain.

Wait for CI and the approved release validation, then promote the exact tested deployment. Staged builds still use Production environment variables and do not create an isolated database. Prepared version labels and documentation may be pushed before approval, but must not claim an unpublished version has shipped. Follow the [release procedure](docs/versions/PWA_VERSIONING.md#candidate-testing-and-promotion) and [v0.5.5 prepared release validation](docs/testing/TESTING.md#v055-release-validation-october-10-2026). Earlier dated results remain evidence for their original builds. The [October 7 release-status confirmation](docs/versions/PWA_VERSIONING.md#release-status-confirmation-october-7-2026) preserves its earlier publication and live-version report.

## Threshold-fitting notebook inputs

For threshold-only experiments against the existing Trial 3 model, follow the [v3.1 Colab upload checklist](docs/model-training/experiment/v3.1/THRESHOLD_FITTING_v3_1.md). It requires the original calibrated `.keras` model and `resume_info.json`, the existing `val/` and `test/` class folders, and the OOD image collection. The root Bun dependencies do not execute this Python notebook. It writes candidate results into a separate Drive folder; application deployment remains a separate step.

## Background-replacement training experiment

For the paired retraining experiment, use the [v3.1 preparation and Colab guide](docs/model-training/experiment/v3.1/TRIAL_v3_1.md). Training needs the original `train/`, `val/`, and `test/` split, the reserved OOD collection, and a separate pool of replacement-background photos. Cutouts are generated automatically in Colab and reviewed before training. The companion v3.2 fitting notebook consumes both newly calibrated models and freezes both threshold selections before evaluation. The original threshold-only v3.1 notebook remains for the old Trial 3 weights.

The [v3.2 paired threshold guide](docs/model-training/experiment/v3.2/TRIAL_v3_2.md) documents that workflow separately. Experiment documentation follows notebook versions; these directories do not announce deployed model versions.

For the seven-class experiment with separate background and localized-lighting arms, follow the original [V4.1 Colab guide](docs/model-training/experiment/v4.1/TRIAL_v4_1.md) or the completed, step-by-step [V4.1.1 reproduction guide](docs/model-training/experiment/v4.1.1/TRIAL_v4_1_1.md). Both use the verified V4 split and existing background photos. The 32-photo OOD folder was new for V4.1 but reused in V4.1.1, so it is no longer independent evidence. Review masks and lighting previews before training; finish all four arms before threshold fitting. Colab notebooks saved separate Drive runs; the V4.1.1 Background bundle is preserved in an ignored backup for local rollback, not a deployed model.

For the completed **V4.2.0 two-model experiment**, follow the [leaf/fruit Colab guide and evidence report](docs/model-training/experiment/v4.2.0/TRIAL_v4_2_0.md). It uses the same source folders and preserved split, with Bacterial Canker assigned to the leaf group. If reproducing it, run each training notebook, then its matching threshold notebook, then return to the training notebook's saved-result figure steps. Check the actual Google Drive contents before starting. The local two-model app trial has ended; its files are preserved in ignored `.tools/model-backups/v4.2.0-dual-experiment-20260929/`. **Only leaf had a feasible fitted candidate**; neither model was deployed or released.

## Common setup issues

App `0.5.5` uses the adopted [V4.3.0 Combined model](docs/model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md), with display label `v4.3.0` and saved gates 0.70 / 0 / 0.42. Keep its five fitted files together in root `public/model/`. Adoption changes the configuration's release identity and status; the graph, shards, class order, preprocessing, temperature, and numerical gates remain those of the completed Combined export. The [adoption receipt](docs/model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) records the original and adopted identities/hashes. No retraining is needed to run these files. Restart the development server after a swap and reload the page to replace the in-memory model. For production-preview testing, rebuild and wait for the new worker to activate, then reload. The exact pre-adoption state is preserved in ignored `.tools/release-backups/v0.4.9-model-v4.3.0-20261002/before/`; earlier V3 and V4.1.1 rollback bundles remain. See the [v0.5.5 release record](docs/versions/PWA_VERSIONING.md#v055-guided-camera-and-installation-prepared-release-october-10-2026) for publication and promotion status.

- If a push reports a missing scanner, run `bun run security:install`. If the hook cannot find Bun, make Bun available to the terminal or Git GUI's PATH and restart that application.
- For a shallow clone, run `git fetch --unshallow` before scanning. If hooks were not registered during dependency installation, run `bun run prepare` and confirm `git config --get core.hooksPath` prints `.husky/_`.
- If scans remain local, verify the Supabase URL, key, `scans` table, and Storage bucket.
- If guidelines do not update, verify the `guidelines` table, select policy, and Realtime publication.
- If the model does not load, confirm `public/model/model.json` and all referenced weight shards are present.
- If offline behavior seems stale during development, test a fresh production build because the service worker is intentionally disabled by `next dev`.

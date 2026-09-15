# MangoLeaf AI Setup Guide

This guide covers local development and the external services required by the current application.

## Prerequisites

- [Bun](https://bun.sh/) available on the command line (CI uses 1.4.0)
- Git and Node.js 24 for local tooling; Git for Windows supplies the hook shell
- `tar` for scanner installation (included with current Windows, macOS, and typical Linux installations)
- A modern browser with IndexedDB, Web Workers, Web Crypto, Canvas, and WebGL support
- A Supabase project if cloud synchronization is required

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

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For cloud sync | Supabase project API URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For cloud sync | Supabase browser-safe anonymous key. |

Version labels are not environment variables. The footer app version is derived
from the `version` field in `package.json` by `next.config.ts`, and the model
label is the `modelVersion` constant in `src/lib/constants.ts`. See
`docs/MODEL_VERSIONING.md`.

The client also accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as a fallback key name, but `.env.example` uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the canonical project convention.

Do not commit `.env.local`. It is already covered by `.gitignore`.

## Configure Supabase

The synchronization code expects the following resources:

- A public Storage bucket named `scans`.
- A `scans` table for device-scoped scan metadata.
- A `guidelines` table for English and Cebuano/Bisaya treatment guidance.
- Row Level Security policies appropriate for the deployment.
- Realtime enabled for the `guidelines` table if live guidance updates are required.

The current client reads and writes these `scans` fields:

```sql
create table public.scans (
  id uuid primary key,
  disease_name text not null,
  confidence float8 not null,
  image_url text,
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

Security policies should be reviewed for the actual deployment. The browser uses a public Supabase key, so do not rely on that key to protect privileged data.

## Run locally

```bash
bun run dev
```

Open `http://localhost:3000`.

Serwist is disabled in development to prevent stale service-worker caches. Test production caching and offline behavior from a production build served over HTTPS or localhost.

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

Do not commit until all three commands pass. The build check matters because it verifies the static export and Serwist service-worker generation in addition to TypeScript and ESLint.

## Local security checks and GitHub CI

`bun install` runs the `prepare` script and registers Husky's `.husky/pre-push` hook in this clone. Every coworker must install dependencies after cloning. `bun run security:install` downloads Gitleaks 8.30.1 from its official GitHub release, verifies the archive's pinned SHA-256 checksum, and installs it under ignored `.tools/`. Supported systems are Windows, macOS, and Linux on x64 or arm64. Installation needs internet access; push checks do not. No Gitleaks account or license key is needed for this direct CLI installation.

When you push, the hook runs `bun run security:check --pre-push`, `bun run typecheck`, then `bun run lint`. The security check examines tracked file paths and all fetched Git history, including HEAD and the exact commits supplied by Git for the push. It catches credentials and forbidden files even when a later commit deletes them. A missing scanner, incomplete shallow history, scanner error, security finding, type error, or lint error stops the push. Ref deletions alone do not upload commits and skip the security scan, but still run typecheck and lint.

The file policy blocks `.env*` except `.env.example`, private-key/container extensions (`.pem`, `.key`, `.p12`, `.pfx`, `.keystore`), SSH private-key filenames, `secrets/` and `confidential/` directories, and the two local-only documents `docs/EMAIL_DISPATCH_WORKFLOW.md` and `docs/MANUSCRIPT_MODIFICATIONS.md`. Ignored, uncommitted `.env.local` files stay on your computer and are not scanned or uploaded. The `.env.example` template remains subject to credential scanning once committed. Other confidential documents need an explicit rule in `tools/check-security.mjs`; the scanner cannot infer business sensitivity.

Useful manual checks:

```bash
bun run security:check
bun run test:tooling
bun run verify:export  # Run after bun run build.
```

Findings show filenames, lines, rules, and commit IDs without credential values. Remove an unpushed secret from every affected local commit before retrying. If a real credential already reached GitHub, revoke or rotate it; deleting its latest file does not remove earlier exposure. Review false positives individually instead of broadly excluding files or history.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs only for pushes to `master`, including merges. Its `security` job installs the same scanner, tests the tooling, and scans the full fetched history. Its independent `check` job installs frozen dependencies, runs typecheck, lint, and webpack build in order, then verifies exported PWA/model files. Both have read-only repository permission; newer pushes cancel unfinished older runs. No video dependencies or training notebooks are executed.

CI sets `HUSKY=0` because it invokes checks directly. The build uses the existing public-client fallback settings and requires no production credentials; it is not a deployment artifact for cloud synchronization. Production builds still need the public Supabase values described above. App/model version labels remain sourced from code. The workflow does not deploy, change Dependabot settings, or gate an independent hosting deployment. It starts after GitHub receives a push and does not inspect pushes isolated on other branches. Local hooks can be skipped, so keep both layers. The hook deliberately excludes production build and export verification because the build is slower and downloads Google Fonts; CI owns those checks.

Tooling regression tests cover secret/file history checks and export assets. They do not test camera capture, browser inference, offline reloads, or Supabase synchronization.

## Common setup issues

- If a push reports a missing scanner, run `bun run security:install`. If the hook cannot find Bun, make Bun available to the terminal or Git GUI's PATH and restart that application.
- For a shallow clone, run `git fetch --unshallow` before scanning. If hooks were not registered during dependency installation, run `bun run prepare` and confirm `git config --get core.hooksPath` prints `.husky/_`.
- If scans remain local, verify the Supabase URL, key, `scans` table, and Storage bucket.
- If guidelines do not update, verify the `guidelines` table, select policy, and Realtime publication.
- If the model does not load, confirm `public/model/model.json` and all referenced weight shards are present.
- If offline behavior seems stale during development, test a fresh production build because the service worker is intentionally disabled by `next dev`.

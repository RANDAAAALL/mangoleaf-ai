# MangoLeaf AI Setup Guide

This guide covers local development and the external services required by the current application.

## Prerequisites

- [Bun](https://bun.sh/) installed and available on the command line
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
bun install
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
| `NEXT_PUBLIC_APP_VERSION` | Recommended | Version label displayed in the footer, such as `0.2.2`. |
| `NEXT_PUBLIC_MODEL_VERSION` | Recommended | Model label displayed in the footer, such as `model-v2.0.0`. |

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
  guidelines_bis text not null,
  color text not null default 'yellow'
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

## Common setup issues

- If scans remain local, verify the Supabase URL, key, `scans` table, and Storage bucket.
- If guidelines do not update, verify the `guidelines` table, select policy, and Realtime publication.
- If the model does not load, confirm `public/model/model.json` and all referenced weight shards are present.
- If offline behavior seems stale during development, test a fresh production build because the service worker is intentionally disabled by `next dev`.

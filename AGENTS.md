# MangoLeaf AI Agent Instructions

## Next.js 16 source of truth

This repository uses Next.js 16.3.3. APIs, conventions, and file structure may differ from older Next.js versions. Before changing Next.js code or configuration, read the relevant installed guide under `node_modules/next/dist/docs/` and follow current deprecation notices.

## Project context

- The main application is an offline-first static-export PWA under `src/`.
- Browser-side diagnosis uses TensorFlow.js model assets from `public/model/`.
- Dexie/IndexedDB is the local source of truth; Supabase provides synchronization, Storage, and guideline updates.
- Serwist generates `public/sw.js` from `src/sw.ts` during builds.

## Conventions

- Use lowercase kebab-case filenames for components and ordinary multiword modules, such as `legal-modal.tsx`, `scan-details-modal.tsx`, and `supabase-client.ts`.
- Use camelCase filenames for custom hooks, such as `useSync.ts` and `usePWAInstall.ts`, with matching `useSomething` exports.
- Keep React component exports in PascalCase, and give the inner function of a `memo(...)` wrapper the same name as the export so React DevTools and stack traces show the real component name.
- Group new components into the existing `src/components/` subfolders by screen area. Do not add files directly to `src/components/`. The folders exist for navigation and do not restrict imports; a component used by more than one area may be imported across folders.
- Put a reusable SVG in `src/components/brand/icon.tsx` as a new `IconName` entry instead of defining a local `<svg>` component in the file that first needs it. Let it inherit `currentColor` and take its dimensions from the `size` prop rather than hardcoding a fill or a `w-* h-*` class, so one call site cannot fix a colour or a size for every future caller.
- Keep `src/app/page.tsx` limited to state, handlers, and tab selection. Screen markup belongs in a tab component under the matching folder.
- Use the `@/*` alias for imports from `src/` when practical.
- Prefer `@/components/...` over relative `../` paths for cross-folder component imports so files survive being moved.
- Keep `README.md`, `SETUP.md`, and `AGENTS.md` at the repository root. Put other detailed project documentation in `docs/`.
- Treat `video/` as a separate project that happens to share this repository. It is a HyperFrames composition for the promotional video, with its own `package.json`, its own dependency tree, and its own `AGENTS.md`, which you should read before changing anything inside it. Nothing in it is imported by `src/` or copied into the static export. Run its scripts from inside `video/`, never from the root, and leave its `hyperframes` version pinned so renders reproduce. Commit the composition, its assets, and its lockfile, but never `video/node_modules`. Keep rendered output to one current file rather than adding a new cut alongside the old ones: video files cannot be diffed, so each one is stored whole and a later deletion does not shrink history.
- Update documentation when setup, architecture, environment variables, model versions, or release behavior changes.
- Do not manually edit generated files: `public/sw.js`, `.next/`, `out/`, `next-env.d.ts`, or `*.tsbuildinfo`.
- Do not commit `.env.local` or other secret-bearing environment files.
- Keep shared developer checks in tracked `tools/`; `/scripts/` remains local-only. Husky uses `lint-staged` and Prettier to format staged files before commits, then runs security, typecheck, lint, and formatting checks before pushes. `.github/workflows/ci.yml` repeats the checks alongside the production build only on pushes to `master`. Keep hook files LF-terminated and comments short enough for coworkers to scan.
- Use the pinned project Prettier and `.prettierrc.json`; respect `.prettierignore`. Run `bun run format` before verification when preparing source changes so the generated service worker reflects the formatted source. Keep ESLint's Prettier compatibility config last. Never run whole-project formatting from a Git hook or use formatting writes in CI.
- Install the pinned scanner with `bun run security:install` before security checks. Never print detected credential values or broadly allowlist real findings. Reserve `secrets/` and `confidential/` for local-only files; `.tools/` and Husky's generated `.husky/_/` must remain untracked.
- Do not turn version labels into environment variables. The app version comes from the `version` field in `package.json` via the `env` block in `next.config.ts`, and the model label is the `modelVersion` constant in `src/lib/constants.ts`. Keep both out of `.env.local`, `.env.example`, and hosting dashboard settings so a stale override cannot display the wrong version.
- Keep every user-facing string in `src/lib/translations.ts` with an entry in both the `en` and `bis` objects. Do not hardcode English in a component or helper, and do not rely on `toLocaleDateString` or other `Intl` formatting for Cebuano/Bisaya output, because browsers have no reliable locale data for it. Use `{n}` placeholder templates for counted labels so plural rules stay in the translation file.
- Preserve unrelated user changes and untracked work.
- Reuse a saved duplicate diagnosis only when its `model_version` exactly matches the active model. Keep older and unlabeled legacy reports in History, but run current-model inference when their photo is uploaded again.

## Application tests and release candidates

- Follow `docs/TESTING.md` for functional cases and automated R01–R04 scope. Use `docs/PHYSICAL_RELIABILITY_CHECKLIST.md` as the fillable physical-device evidence record. Add short comments explaining non-obvious test behavior.
- Keep Playwright cases in `tools/e2e/*.pw.ts` so `bun run test:tooling` does not discover them as Bun unit tests. Use pinned Playwright through Node.js; Bun remains the package/build runner.
- `bun run test:e2e` runs the core desktop/mobile browser suite against an isolated production export. Keep it in CI on pushes to `master` only. Do not add the full browser suite or long reliability sessions to Husky pre-push.
- Run `bun run test:reliability` explicitly before release/research evaluation. R01 must invoke actual inference repeatedly; duplicate-report reuse does not measure prediction consistency. R03 is a 30-minute mixed-use session. Physical phones, native camera, airplane mode, OS/browser versions, and background behavior still require recorded manual checks.
- Use fresh browser contexts and the local mock backend for automation. Never direct automated scans at production Supabase. `.test-app/`, `test-results/`, `playwright-report/`, and `.playwright-mcp/` are generated local artifacts. Never deploy the isolated test build.
- Keep prediction diagnostics in developer console output and test reports. Full class-probability tables in the application are development-only; never expose them in the result modal or change model preprocessing/thresholds to make tests pass. Controlled UI scores and real-model observations must be identified separately; consistency and UI correctness do not establish model accuracy.
- Prepare candidate code, version labels, and affected documentation together before the final build. Candidate files may be committed/pushed for testing. Mark documentation as candidate/not released and state pending checks honestly; do not claim deployment or successful evaluation in advance. Record commit IDs and model hashes because multiple candidate attempts can share an intended version.
- Keep app and model versions independent. Testing infrastructure or reorganizing experiment guides does not by itself change the shipped app/model version. A new model also requires accuracy/OOD evaluation before adoption.
- For manual release approval on `master`, Vercel's Production branch tracking must have **Auto-assign Custom Production Domains** disabled. Confirm the dashboard setting; never assume documentation changed it. This creates staged production builds using Production environment variables, not a separate database.
- Require CI and the approved release validation before promotion, including applicable reliability checks. Use the physical-device checklist when physical-device evaluation is part of that scope. Promote the exact tested deployment, verify the live version, and tag/release its tested commit. A GitHub Release does not control Vercel deployment. Rebuild and repeat affected checks if source, version labels, model files, or build settings change after testing.
- Keep model-training documentation under `docs/model-training/experiment/v{n}/` for candidate workflows and `docs/model-training/non-experiment/v{n}/` for historical or adopted trials. Put each version's `TRIAL_v{n}.md` beside its optional `artifacts/` and `figures/` folders; use underscores for decimal versions in report filenames (for example, `TRIAL_v4_1.md`). V3.1 also keeps a separate original-weight threshold guide. Keep candidate notebook workflows and completed experimental evidence under `notebooks/experiment/<notebook-version>/`; on explicit model adoption, move that version's preserved templates and completed notebooks to `notebooks/<notebook-version>/` and its trial/evidence folder to `non-experiment/`. Preserve notebook cell contents, outputs, original artifact identities, and historical results; record the adoption identity and any changed configuration hashes separately. Workflow versions never imply an app or model version. Update relative links and architecture trees when moving either group, and distinguish repository adoption from pending production deployment.

## Documentation maintenance

Every implementation task must include a documentation-impact review before it is considered complete. Update the documents affected by the change in the same task; do not postpone known documentation updates to a later commit.

| Change made                                                                                                         | Documentation or metadata to review and update                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Installation steps, prerequisites, Supabase resources, commands, or environment variables                           | `SETUP.md`, `.env.example`, and the README quick start when relevant                                             |
| Application layers, data flow, storage, synchronization, service worker, deployment model, or important directories | `docs/ARCHITECTURE.md`                                                                                           |
| User-visible feature, workflow, important fix, milestone, or completed project task                                 | `docs/PROGRESS.md`                                                                                               |
| Performance behavior, caching, bundle loading, image processing, inference, memory, or network optimization         | `docs/PERFORMANCE.md`                                                                                            |
| App version, model version, release process, tags, or notebook-version policy                                       | `docs/MODEL_VERSIONING.md`, `package.json`, `src/lib/constants.ts`, and other displayed version references       |
| Model training, dataset, class mapping, evaluation metrics, or exported model files                                 | The applicable file under `docs/model-training/`, `docs/MODEL_VERSIONING.md`, and `docs/PROGRESS.md`             |
| File or directory rename                                                                                            | All imports, scripts, configuration, Markdown links, project trees, and documentation references to the old path |
| New long-lived convention or recurring agent workflow                                                               | `AGENTS.md`                                                                                                      |

Use these rules when maintaining documentation:

- Keep historical entries intact; add a new dated or versioned entry instead of rewriting past results as if they happened differently.
- In `docs/PROGRESS.md`, group updates from the same exact date under one daily heading with topic bullets. Preserve historical content and old heading anchors when consolidating; date ranges remain separate.
- Update only documents affected by the change. Do not create progress noise for formatting-only edits, comment-only clarification, or generated-file changes unless they affect project behavior or maintenance instructions.
- Ensure examples describe the current repository and installed dependency versions rather than generic templates.
- Check local Markdown links and search for stale filenames or version labels after moving or renaming files.
- If no documentation update is needed, explicitly confirm that the documentation-impact review was completed in the final handoff.

## Verification before commit

Run these commands in order and require all three to pass:

```bash
bun run typecheck
bun run lint
bun run build
```

The build uses webpack and creates a static export in `out/`. Treat build failures, service-worker generation failures, type errors, and lint errors as blockers before committing.

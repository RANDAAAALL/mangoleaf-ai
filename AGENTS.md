# MangoLeaf AI Agent Instructions

## Next.js 16 source of truth

This repository uses Next.js 16.2.10. APIs, conventions, and file structure may differ from older Next.js versions. Before changing Next.js code or configuration, read the relevant installed guide under `node_modules/next/dist/docs/` and follow current deprecation notices.

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
- Keep `src/app/page.tsx` limited to state, handlers, and tab selection. Screen markup belongs in a tab component under the matching folder.
- Use the `@/*` alias for imports from `src/` when practical.
- Prefer `@/components/...` over relative `../` paths for cross-folder component imports so files survive being moved.
- Keep `README.md`, `SETUP.md`, and `AGENTS.md` at the repository root. Put other detailed project documentation in `docs/`.
- Update documentation when setup, architecture, environment variables, model versions, or release behavior changes.
- Do not manually edit generated files: `public/sw.js`, `.next/`, `out/`, `next-env.d.ts`, or `*.tsbuildinfo`.
- Do not commit `.env.local` or other secret-bearing environment files.
- Do not turn version labels into environment variables. The app version comes from the `version` field in `package.json` via the `env` block in `next.config.ts`, and the model label is the `modelVersion` constant in `src/lib/constants.ts`. Keep both out of `.env.local`, `.env.example`, and hosting dashboard settings so a stale override cannot display the wrong version.
- Keep every user-facing string in `src/lib/translations.ts` with an entry in both the `en` and `bis` objects. Do not hardcode English in a component or helper, and do not rely on `toLocaleDateString` or other `Intl` formatting for Cebuano/Bisaya output, because browsers have no reliable locale data for it. Use `{n}` placeholder templates for counted labels so plural rules stay in the translation file.
- Preserve unrelated user changes and untracked work.

## Documentation maintenance

Every implementation task must include a documentation-impact review before it is considered complete. Update the documents affected by the change in the same task; do not postpone known documentation updates to a later commit.

| Change made | Documentation or metadata to review and update |
| --- | --- |
| Installation steps, prerequisites, Supabase resources, commands, or environment variables | `SETUP.md`, `.env.example`, and the README quick start when relevant |
| Application layers, data flow, storage, synchronization, service worker, deployment model, or important directories | `docs/ARCHITECTURE.md` |
| User-visible feature, workflow, important fix, milestone, or completed project task | `docs/PROGRESS.md` |
| Performance behavior, caching, bundle loading, image processing, inference, memory, or network optimization | `docs/PERFORMANCE.md` |
| App version, model version, release process, tags, or notebook-version policy | `docs/MODEL_VERSIONING.md`, `package.json`, `src/lib/constants.ts`, and other displayed version references |
| Model training, dataset, class mapping, evaluation metrics, or exported model files | The applicable file under `docs/model-training/`, `docs/MODEL_VERSIONING.md`, and `docs/PROGRESS.md` |
| File or directory rename | All imports, scripts, configuration, Markdown links, project trees, and documentation references to the old path |
| New long-lived convention or recurring agent workflow | `AGENTS.md` |

Use these rules when maintaining documentation:

- Keep historical entries intact; add a new dated or versioned entry instead of rewriting past results as if they happened differently.
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

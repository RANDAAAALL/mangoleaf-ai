# MangoLeaf AI PWA Versioning Guide

This guide explains the PWA version: the application interface, local/offline behavior, release history, build labels, and deployment procedure. The PWA is the app people use. The separate [AI model versioning guide](AI_MODEL_VERSIONING.md) explains the model weights, training workflows, fitted rejection settings, and model evidence.

**Current repository candidate:** App `0.5.1` retains the adopted V4.3.0 Combined model (`v4.3.0`) and prepares the scan-thumbnail stability patch. The treatment-guidelines heading and language controls also stay on one row. This is a candidate, not a publication or deployment record. See the [v0.5.1 record](#v051-scan-thumbnail-stability-candidate-october-5-2026), [model adoption history](AI_MODEL_VERSIONING.md#v049-adoption-of-v430-combined-october-2-2026), and [candidate validation](../testing/TESTING.md#v051-candidate-validation-october-5-2026).

## Reading the release history

**Dependency security, October 3, 2026:** The local `0.5.0` candidate now selects Next.js and its ESLint configuration `16.3.6`, overrides Browserslist to `4.28.7`, and records compatible transitive security patches in `bun.lock`. App/model labels remain `0.5.0` / `v4.3.0`. The [dependency review](../security/DEPENDENCY_SECURITY.md) records a clean production-dependency audit and one unresolved development-only `braces` advisory. Earlier candidate validation remains tied to its original dependency snapshot; new checks and remote release status are recorded separately.

The records below retain earlier app changes and their original status. Historical references to V3 or an earlier candidate describe those entries' dates. An intended version in the list is not proof that it was released or deployed; use the recorded commit, tag, and completed evidence to identify a published build. This documentation split does not change either version label.

## App Releases

Use semantic versioning for the PWA:

```text
v0.1.0  first public pre-field-evaluation milestone
v0.2.0  feature update before final evaluation
v0.2.1  confirmation-modal title clarity patch
v0.2.2  repository documentation and filename-organization patch
v0.2.3  collapsible home-screen scan-flow guide
v0.2.4  version-label sourcing and scan-guide layout patch
v0.2.5  localized scan history and UI reorganization
v0.2.6  Trial 2.1 model and three-gate rejection ship to the app
v0.2.7  organ-label removal and a filter for rejected scans
v0.3.0  Trial 3 model ships to the app
v0.4.0  mobile field-experience redesign and resilient scan synchronization
v0.4.1  bottom-navigation padding patch
v0.4.2  scan-sheet drag performance and motion accessibility
v0.4.3  desktop scan entry points
v0.4.4  shared icon registry and scan-sheet label sizes
v0.4.5  equal-height How it works cards
v0.4.6  unified How it works card styling
v0.4.7  compact history pagination and scan-details badge clipping fix
v0.4.8  scan-photo URL fix, browser reliability testing, and documentation alignment
v0.4.9  adopts V4.3.0 Combined, current scan/guidance regressions, and preserved model evidence
v0.5.0  candidate: guest-owned private cloud synchronization and preserved offline History
v0.5.1  candidate: stable scan thumbnails and a horizontal treatment-guidelines header
v1.0.0  stable field-tested release
v1.0.1  small fix after v1.0.0
```

The project history records `v0.2.0` as a published release and `v0.2.1` as the following title-clarity patch. The repository-organization work is the `v0.2.2` patch. `v0.2.3` adds the collapsible home-screen scan-flow guide. `v0.2.4` moves version-label sourcing into the build configuration and refines the scan-guide list layout. `v0.2.5` localizes scan history and reorganizes UI components. The model stayed at `model-v2.0.0` through all of those because no model assets, class mapping, or training results changed. The Trial 2.1 swap on August 23, 2026 and threshold fitting on August 24, 2026 together moved the model to `model-v2.1.1` without an app release of their own. `v0.2.6` ships them: Trial 2.1 weights, folded temperature `T = 0.754966`, and fitted rejection thresholds. `v0.2.7` removes the organ label from scan cards and adds a rejected-scan filter; its model stays `model-v2.1.1`. `v0.3.0` ships Trial 3 and its model bump to `model-v3.0.0`. `v0.4.0` redesigns the mobile field experience and makes local-first synchronization retry-safe; model assets, class mapping, thresholds, and the 97.46% Trial 3 result remain unchanged. It has an app tag only, not a new model tag. `v0.4.1` is a one-line bottom-navigation padding patch with the same model, and it is worth stating why a change that small still earned a version: two builds must never share a version label. The footer is the only place a phone can be asked what it is running, so shipping changed markup under an unchanged label makes that answer useless. `v0.4.2` rewrites the scan sheet's drag to write `transform` and `opacity` directly instead of calling `setState` on every frame, removes the full-screen backdrop blur on phones, and adds the `prefers-reduced-motion` support the app had never had. Its model is unchanged too. It is a useful counterpart to `v0.4.1` in one respect: patch releases in this project have so far carried visual changes, and this one is mostly a change in how the same pixels are produced, which is exactly the kind of release whose label matters most, because nothing on screen tells a tester which build they are holding. `v0.4.3` gives desktop three scan entry points it never had: a CTA in the empty scan-history state, a Scan item in the header nav, and a sheet that no longer offers a camera card on machines without a camera. Its model is unchanged as well. It is a patch rather than a minor for the reason the list above shows repeatedly: feature additions inside a minor line have always been patches here, as `v0.2.3`, `v0.2.5`, and `v0.2.7` each were, and minor bumps are reserved for model swaps and redesigns. What earns `v0.4.3` a label of its own is that it changes which controls exist on a class of device, so two testers on a desktop and a phone now see genuinely different affordances and need to be able to say which build produced them. `v0.4.4` moves the four local SVG components out of `how-it-works-steps.tsx` into the shared `brand/icon.tsx` registry and raises the two scan-sheet card descriptions from `text-[10px]` to `sm:text-[12px]` at 40rem and above. Its model is unchanged. It is the extreme case of the argument `v0.4.2` opened: the icon half is a pure refactor that emits byte-identical shapes at identical sizes and colours, so there is nothing on screen at all to distinguish it from the build before it, and the label is the only way a tester can report which one is on the device. The two changes ship under one version because `public/sw.js` is tracked and its precache manifest cannot honestly describe one of them without the other. `v0.4.5` changes two Tailwind class names in `how-it-works-steps.tsx` so the three step cards are equal height on a wide row, which makes it the smallest release in the project after `v0.4.1`. Its model is unchanged. It exists as a release of its own rather than as an amendment to `v0.4.4` because that tag had already been pushed, and the rule below on tagging only final commits is worth more than the tidiness of one fewer version number. `v0.4.6` restyles the same three step cards from green, amber, and blue solid fills to one pale green bordered card, and darkens the step descriptions. Its model is unchanged. It is a patch for the same reason the list above shows repeatedly, and it is the plain case for a label rather than a borderline one: the section looks materially different, so a tester describing it is describing a specific build.

**Any source edit obliges a rebuild before the commit, whatever its size.** `public/sw.js` is tracked and its precache manifest embeds the `_next/static` chunk hashes, so a one-character change to a class name invalidates the committed service worker exactly as thoroughly as a rewritten component does. Committing the source without the regenerated `sw.js` leaves a service worker in history describing a bundle that never existed. `v0.4.1` is the smallest change in the project's history and it still required the full `bun run typecheck`, `bun run lint`, and `bun run build` pass.

**Release tag commits.** `v0.2.6` sits on `e493009` and `model-v2.1.1` on `9b31c7b`. `model-v3.0.0` and `v0.3.0` both sit on `f73f0b8`, sharing one commit because the weights, the thresholds, and the version bumps landed together, which is correct: thresholds and weights are one calibrated artifact. `v0.4.0` sits on `af3474d` with no model tag beside it, `v0.4.1` on `b652b4a`, `v0.4.2` on `bcae4a1`, `v0.4.3` on `4792266`, `v0.4.4` on `959d565`, `v0.4.5` on `441ee89`, and `v0.4.6` on `7cba324`, all seven app-tag-only. Record the commit for every future tag here, so a reader can reach the exact bytes a reported metric was measured on without trusting the tag name alone.

The `v0.2.3` tag was originally created on a commit that predated an amend and was missing `src/components/how-it-works-card.tsx`, so a checkout of that tag could not build. The tag was moved to the corrected commit `50514f8` on August 18, 2026. The superseded commit was `175d7ddc4094ea84139b0526bfa1abd6265a40a9`. Create tags only after the release commit is final to avoid repeating this.

The PWA footer reads two version labels, and neither is an environment variable.

| Label         | Source                                                                                                          | Bump when                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| App version   | `version` field in `package.json`, injected as `NEXT_PUBLIC_APP_VERSION` by the `env` block in `next.config.ts` | Any app release                            |
| Model version | `modelVersion` constant in `src/lib/constants.ts`                                                               | The assets in `public/model/` are replaced |

Both values are baked into the bundle as literal strings at build time, so a
version change requires a rebuild. Neither can be overridden by `.env.local`, a
shell variable, or a hosting dashboard variable, which is deliberate: a stale
override would silently display the wrong version. Do not add
`NEXT_PUBLIC_APP_VERSION` or `NEXT_PUBLIC_MODEL_VERSION` to `.env.local` or to
the Vercel project settings. These values are public and safe to expose because
they are version labels, not secrets.

`src/env.d.ts` declares `NEXT_PUBLIC_APP_VERSION` as a required string so usage
sites do not need a non-null assertion. It is a declaration, not a runtime
guarantee; if the `env` block in `next.config.ts` is removed, the footer renders
an empty label with no type error.

### v0.4.7: history pagination and scan details

The history list uses localized previous/next controls around `Page {n} of {total}` and returns to a valid page when records are deleted. The scan-details modal constrains its desktop grid and removes the photo's intrinsic dimensions from layout, keeping disease and confidence badges inside the visible photo. On phones, the modal scrolls as a whole so its close action remains reachable. The model stays at `v3.0.0`; no model files or diagnosis thresholds changed.

### v0.4.8: scan photo fix and reliability testing

This patch prepares app version `0.4.8`. Scan cards track which image blob owns each local URL, avoiding a revoked URL when that blob is replaced. The release also adds isolated browser tests for scan/history flows and offline behavior, explicit repeated-inference and 30-minute reliability commands, and core E2E coverage in the `master` push workflow. Test guides, checklist examples, release instructions, and experimental notebook locations are aligned with the implementation.

The model remains `v3.0.0`; model assets, class mapping, preprocessing, and rejection thresholds are unchanged. The intended app tag is `v0.4.8`. Record its actual commit after the tag is created.

### v0.4.9: adoption of V4.3.0 Combined

On October 2, 2026, app `0.4.9` adopted the single V4.3.0 Combined model for mango leaves and fruit, replacing the former six-class V3 baseline. Its footer identifies PWA `0.4.9` and model `v4.3.0`. This is the app update between v0.4.8 and the subsequent v0.5.0 cloud-synchronization candidate.

The application changes were:

- Use seven output classes, including separate Healthy Leaf and Healthy Fruit results. Both healthy results read the existing `healthy` treatment-guideline row.
- Reuse a saved duplicate diagnosis only when its `model_version` exactly matches the active model. Older and unlabeled reports remain in History; uploading their photo again runs current-model inference.
- Use the adopted model cache `mangoleaf-model-cache-v4-3-0`. Service-worker activation removes superseded model caches, and precache content revisions update the bundled files. Reloading replaces an already loaded model.
- Align photo-review, seven-class result, bilingual-guidance, uncertain-photo reminder, and footer/About regression coverage with the adopted model. Record the supplied Mango Scab and Bacterial Canker fixture replacements by their hashes.

Adoption selected the completed Combined export; it did not retrain weights or refit its rejection settings. The [AI model adoption record](AI_MODEL_VERSIONING.md#v049-adoption-of-v430-combined-october-2-2026) and [preserved trial report](../model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#current-model-adoption-october-2-2026) retain the original export identity, numerical settings, hashes, and notebook/evaluation evidence.

The [October 2 local validation record](../testing/TESTING.md#v049-local-validation-october-2-2026) reports formatting, typecheck, lint, production build, export/security checks, ten tooling tests, all 65 core browser cases, and R01's 240 actual predictions. These results identify their original source snapshot and do not establish new field accuracy or certify later cloud-client changes.

**Verified local tag identity:** `v0.4.9` and `model-v4.3.0` both identify commit `9fd175e40b85a805ab482554e351f9686f1f031a`. Local tag verification does not establish remote Release publication or production deployment. Earlier dated pending-status statements remain part of the original adoption record; adding this summary does not change those historical measurements.

## v0.5.0: private cloud synchronization candidate (October 3, 2026)

**Status: candidate / not released.** App `0.5.0` is a minor feature update for the cloud-ownership transition and local database upgrade. The model remains `v4.3.0`; its five files, seven classes, preprocessing, folded temperature, and fitted gates are unchanged. The footer derives the new app label from `package.json` through the existing build configuration.

### Changes included

- Create and reuse a verified guest session in the background without a login or registration screen. Authorize private scan records and photos by that guest's identity rather than a browser-supplied device UUID.
- Preserve local reports and photo Blobs through the Dexie version 8 upgrade. Keep unowned legacy reports local-only; do not assign old cloud data to a guest automatically.
- Keep diagnosis, local History, and downloaded guidance independent of private cloud sign-in. Fetch public guidelines separately, and retain pending uploads/deletions for retry.
- Bypass service-worker caches for private cloud requests and remove older cached private responses.
- Expand isolated cloud regression tests, organize version/security/testing documentation and preserved notebooks, and extract unchanged storage-photo compression into its reusable helper.

The performance review remains a set of measured findings and recommendations. This release does not establish faster inference, improved accuracy, reduced device temperature, or lower battery use.

### Validation and publication

The approved validation scope is formatting, security, TypeScript, lint, production build, exported assets, tooling tests, the complete core browser suite, and filtered R01 repeated inference. R03 is excluded. Use the [dated candidate evidence](../testing/TESTING.md#v050-candidate-validation-october-3-2026); earlier v0.4.9 reports retain their original fingerprints and do not certify this versioned build.

Local `v0.4.9` and `model-v4.3.0` tags already identify commit `9fd175e40b85a805ab482554e351f9686f1f031a`. This corrects current tag status without changing the original October 2 pending-status records. Local tags do not establish remote release publication or deployment. The new candidate is based on that commit plus the reviewed working-tree changes; its release commit, remote CI result, tested deployment, and `v0.5.0` tag/Release are still pending. No new model tag is needed.

### Prepared commit message

```text
feat: secure cloud sync for PWA v0.5.0

Authorize private scans and photos with verified guest ownership
instead of browser device UUIDs. Keep diagnosis, saved History,
and downloaded guidance independent of cloud sign-in.

Preserve legacy reports locally without assigning cloud ownership.
Organize project guides and notebooks, expand cloud regressions,
and extract unchanged storage-photo compression.

Retain the V4.3.0 model and fitted rejection settings.
```

### Prepared tag and release description

**App tag:** `v0.5.0`  
**Release title:** `MangoLeaf AI v0.5.0 — Private cloud synchronization`

> Adds automatic guest-owned cloud synchronization without a login or registration screen. Scan records and photos use private owner access, while diagnosis, local History, and saved treatment guidance remain available offline.
>
> Public guideline downloads work independently of guest sign-in. Legacy reports remain preserved locally. Cloud regression coverage, project documentation, historical notebook organization, and reusable photo-storage code are updated.
>
> The AI model remains V4.3.0 Combined, with unchanged weights, classes, preprocessing, and fitted rejection settings.
>
> Local validation passed typecheck, lint, production build, formatting/security checks, 14 tooling tests, 10 export checks, all 80 core browser cases, and R01 with 240 actual predictions.

The local candidate results are recorded in the testing guide. Remote CI and production promotion remain pending. Create the tag on the exact approved tested commit using the procedure below; preparing this text does not create or push a tag, publish a Release, or deploy the app.

## v0.5.1: scan-thumbnail stability candidate (October 5, 2026)

**Status: candidate / not released.** App `0.5.1` is a patch for scan-card photo display and the treatment-guidelines header layout. The app label comes from `package.json` through the existing build configuration. Model `v4.3.0`, its five assets, seven classes, preprocessing, temperature, and rejection settings remain unchanged. No new model tag is required.

### Changes included

- Keep Recent and History thumbnails visible when cloud synchronization changes only a scan's metadata. IndexedDB can return a new Blob object with identical photo bytes; the reusable `useScanPhotoUrl` hook compares those bytes before replacing the displayed URL.
- Replace the displayed photo when its bytes change, including different photos of equal size. Cancel stale comparisons and release replaced or unmounted photo URLs. Original-upload duplicate checking keeps its existing SHA-256 behavior.
- Keep the treatment-guidelines heading and English/Bisaya controls side by side on narrow screens.
- Add a browser regression for scan insertion, cloud metadata updates, and offline deletion. Align architecture, performance, testing, setup, and current-version references with this patch.

This patch does not retrain the model or refit its gates. The photo comparison reads saved bytes asynchronously; its storage and processing cost remains described in [PERFORMANCE.md](../PERFORMANCE.md#21-per-card-blob-url-management-scan-cardtsx).

### Validation and publication

The versioned build must pass formatting/security, typecheck, lint, production build, export verification, tooling tests, the complete core browser suite, and filtered R01 repeated inference. The [October 5 validation record](../testing/TESTING.md#v051-candidate-validation-october-5-2026) identifies the tested source fingerprint and actual results. Earlier thumbnail and release checks retain their original source identities.

**Verified local baseline tag:** `v0.5.0` identifies commit `0139bb4c988a1e17301020a5dd1d0cc37a1f1527`. The current candidate starts from `4eaa33dc1575dc80c1840a1bd340dd28444f949f` plus the uncommitted thumbnail, layout, version, and documentation changes. This local tag check does not establish remote Release publication or production deployment and does not rewrite the October 3 candidate record.

Local validation passed formatting/security, typecheck, lint, production build, all 10 export checks, all 14 tooling tests, all 83 core browser cases, and R01's 240 actual predictions. Tested application fingerprint is `defae7e97f5640eaea888dfc7dfc067ec740521b82e8abd7568cec2623805ca3`; the testing record preserves report hashes and model identity. The candidate commit, remote CI, approved production promotion, live-version confirmation, and `v0.5.1` tag/Release remain pending. Preparing this record does not stage, commit, push, tag, publish, or deploy the app.

### Prepared commit message

```text
fix: stabilize scan photos for PWA v0.5.1

IndexedDB returns new Blob wrappers during metadata updates.
Compare saved photo bytes before replacing a card's URL to
prevent thumbnails from disappearing during synchronization.
```

### Prepared tag and release description

**App tag:** `v0.5.1`

**Release title:** `MangoLeaf AI v0.5.1 — Stable scan photos`

> Keeps Recent and History thumbnails visible while scans save and synchronize. Changed photos still update, and unused photo URLs are released.
>
> Keeps the treatment-guidelines heading and language controls side by side on mobile. Adds thumbnail regression coverage and updates the project guides.
>
> The AI model remains V4.3.0 Combined, with unchanged weights, classes, preprocessing, and fitted rejection settings.

Local candidate validation passed formatting/security, typecheck, lint, build, 10 export checks, 14 tooling tests, all 83 core browser cases, and 240 repeated actual predictions. Remote CI and production promotion remain pending.

Create the app tag on the exact approved tested commit after the remaining release steps pass. The prepared notes are a draft until publication is approved.

## Candidate testing and promotion

Added September 20, 2026. Preparing an intended version is separate from publishing it. Commit candidate code, matching version labels, and affected documentation together after local checks. Mark new entries **candidate / not released** until their release decision is made. Do not write that CI, physical-device testing, or deployment passed before it happened. App and model labels remain independent; tooling-only changes do not require a new model label.

1. Finalize candidate source/model files and intended version labels. A model label must identify the files actually included in that candidate. Keep the currently deployed baseline explicitly distinguished in documentation.
2. Run `bun run format`, then `bun run typecheck`, `bun run lint`, and `bun run build` in that order. Run core E2E and applicable reliability checks from [TESTING.md](../testing/TESTING.md). A new model also needs accuracy/OOD evaluation.
3. Commit and push the candidate. Husky handles staged formatting and pre-push checks; repeat affected checks/builds if formatting or another edit changes the tested source.
4. Wait for CI on that `master` commit. For manual approval, configure Vercel **Settings > Environments > Production > Branch Tracking**, keep `master`, and disable **Auto-assign Custom Production Domains**. Documentation does not change this dashboard setting; confirm it before relying on staged deployment behavior.
5. Complete the approved validation scope against the exact candidate. Record commit, deployment URL, app/model versions, model hashes, and actual results. When physical-device evaluation is in scope, use the same checklist and confirm the intended worker/model loaded instead of an older cache. Staged Production uses Production environment variables and is not an isolated database.
6. After required checks and review pass, manually promote that exact deployment, verify its live version, and publish the tag/release for its tested commit. Staged promotion reuses the build. Creating a GitHub Release does not deploy the app or gate Vercel.

Multiple attempts can share an intended unreleased version; distinguish them by commit ID and build/model hashes. If code, model files, labels, or build settings change, rebuild and repeat affected checks. A failed candidate receives fixes and another evaluation; do not move a published release tag to hide it. Add final evidence/release status as a subsequent documentation entry rather than rewriting historical measurements or moving the tested tag to a later docs-only commit.

Reference: [Vercel staged production promotion](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).

## Creating a GitHub Release

Prepare version labels, review and commit the intended files, and finish the candidate testing and promotion procedure above before tagging. Only app tags get a GitHub Release in this project; model tags are provenance markers.

Replace `vX.Y.Z` with the approved app version and `TESTED_COMMIT_SHA` with the full commit ID from the completed evidence record. Do not reuse an existing published tag:

```bash
git tag -a vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf AI vX.Y.Z"
git push origin vX.Y.Z
```

Then open GitHub:

1. Go to the repository.
2. Open **Releases**.
3. Choose **Draft a new release**.
4. Select the pushed tag.
5. Add a short title and release notes.
6. Publish the release.

If the release adopts a new model, also create its provenance tag on the tested commit that contains those exact assets. For a model-only milestone, create only this tag; do not publish a separate GitHub Release. Replace both placeholders before running:

```bash
git tag -a model-vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf model-vX.Y.Z"
git push origin model-vX.Y.Z
```

Do not attach large raw datasets to GitHub Releases unless the dataset license and file size are appropriate. Keep release notes focused on what changed, what was tested, and what should be treated as the current baseline.

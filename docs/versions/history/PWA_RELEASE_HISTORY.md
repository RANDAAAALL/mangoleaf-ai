<a id="mangoleaf-ai-pwa-versioning-guide"></a>

# PWA release history and archived notes

This archive preserves the full earlier version guide as maintained on October 18, 2026, including original records, evidence, and release templates. For current instructions, use the [short version guide](../PWA_VERSIONING.md).

References to a "current" model, pending check, or deployment describe the record's date. They do not verify today's production state. The archived guide was titled **MangoLeaf AI PWA Versioning Guide**.

The PWA version identifies the application people install: screens, camera and upload flows, local History, offline behavior, and release packaging. The [model guide](../AI_MODEL_VERSIONING.md) separately tracks model weights, classes, training, rejection settings, and scientific evidence.

## Current repository snapshot

### v0.9.0 public-readme and security follow-up (October 23, 2026)

- Simplified the public README to product description, walkthrough, features, availability, quick start and documentation/license links. Its complete earlier text remains in [historical README notes](README_CANDIDATE_NOTES.md), with original meanings and compatibility bookmarks preserved.
- Added the maintainer-selected restricted-use license: official APK/website use is permitted; original source reuse, modification and redistribution require written authorization, preserving contributor, platform, statutory and third-party rights. Custom terms do not establish third-party redistribution clearance or legal enforceability.
- Reviewed all 83 current Dependabot alerts. Updated Next.js and matching lint packages from 16.3.8 to 16.4.1. The production npm audit is clean; the full audit still reports the known unpatched development `braces` finding. The 80 archived Python alerts remain in the [new complete inventory](../../security/DEPENDABOT_ALERTS_2026-10-23.csv), with byte-preserving V4.4 archive mappings and ledger checks; renaming a receipt does not patch the historical environment.
- The supplied CI screenshot confirms old candidate `4ff19bc` passed CI #27. Its V4.5 R03 report passed a full 30-minute session, and the maintainer reports initial APK testing without observed issues. Those are evidence for the pre-patch build. The framework refresh requires its own checks, a new approved commit/CI run, refreshed APK/OTA artifacts and matching Vercel deployment; stable publication is not performed by this preparation. The app remains intended 0.9.0, native host 0.1.4/code 5 and model V4.5.0. Keep the existing `v0.9.0-rc.1` tag and assets intact; local V5 runtime files remain excluded.

### v0.9.0 Android and cloud recovery candidate (October 23, 2026)

- **Identity:** shared app/web `0.9.0`, native `0.1.4`/code `5` (Debug `0.1.4-dev`), bridge/schema `1`/`1`, host bounds `5-5`, adopted model `v4.5.0`. Prepared from `c7d1fb06e53fc50c4565a6d379e91ecc396fec72` plus categorized commits; the annotated `v0.9.0-rc.1` tag identifies the final local candidate commit.
- **Scope:** Java Android host with SQLite/private photos; signed compatible OTA; automatic anonymous-owner cloud backup and explicit recovery-code restore; scoped cloud deletion; Android-only installation and installed-app hints; permission/capture fixes, diagnostics and independent installed/web/model labels. Node security floor and exact Bun CI selection are included.
- **Model preservation:** release model files/constants remain byte-identical to the committed V4.5 baseline. Local V5 model/constants/cache overrides and the unrelated V4.5 training notebook edit are excluded. The website worker is generated from isolated V4.5 source, retaining the new uncached release metadata behavior.
- **Status:** local candidate preparation, not a public release. Final-commit CI, approved reliability including R03, physical-device validation, portable protected signing backup, APK/OTA asset publication and exact Vercel promotion remain pending. Earlier web `0.8.0` APK/OTA receipts do not validate web `0.9.0`; rebuild and verify matching assets before uploading.
- **Local validation:** ordered typecheck/lint/build, ten export assets and 169 tooling cases passed. The full browser run had 272 passes/seven platform skips and nine obsolete/browser-specific test assertions; all failures were covered by 12 passing focused rechecks after test-only fixes. A fresh full run remains pending in final-commit CI. Detailed candidate results and their limits are recorded in [October 23 testing evidence](../../testing/TESTING.md#v090-categorized-release-candidate-october-23-2026). Local logs/model hashes are retained under ignored `.tools/release-090/`; no secret-bearing files or experimental weights belong in the commits.

**Prepared release title:** `MangoLeaf AI v0.9.0 - Android and cloud recovery`

**Short description:** Android APK with SQLite, signed OTA, automatic cloud backup and recovery codes. Improves camera capture, installation and diagnostics. Retains Model v4.5.0. Candidate; release approval pending.

**Local candidate tag:** `v0.9.0-rc.1`. Push the candidate branch for CI first. After the approved checks and exact deployment promotion, create the stable `v0.9.0` tag on that tested commit. Attach the signed APK plus `web-update.zip`, `update.json` and `update.sig` under GitHub Release Assets; set the APK's verified native asset label. Git commits and tag pushes do not upload those assets or promote Vercel.

### Installed and available APK labels (October 23, 2026)

APK footers now show the installed host version and active model; About retains the independent web version. Browser footers retain shared app/model labels. The download page distinguishes a GitHub release tag from an optional native version on the verified APK asset label. Native host/schema/bounds remain unchanged because the host already exposes its version name. No app/model adoption, public release or deployment follows automatically. See [native version-display record](ANDROID_APK_HISTORY.md#installed-and-available-version-labels-october-23-2026).

### Implementation audit (October 23, 2026)

History resilience, recovery/session races, foreground transfers and native OTA rollback/restart/cancellation were repaired with focused regressions. Java changes advance the unpublished native candidate to 0.1.4/code 5 and host bounds 5-5; shared web stays the 0.8.0 working candidate, bridge/schema 1/1 and default Android model committed V4.5.0. The native version remains absent from the footer. No PWA tag, Vercel promotion or GitHub publication occurs. See [native audit record](ANDROID_APK_HISTORY.md#implementation-audit-october-23-2026) and [exact evidence](../../testing/ANDROID_TESTING.md#october-23-2026-implementation-audit).

### Website Open or install (October 22, 2026)

Added positive-only installed-native-app detection and a synchronous Open or install action with an explicit APK guide fallback. Confirmed installations show Open app; repeat APK downloads require a deliberate reinstall/update choice. Release-only website association changes the unpublished native candidate to 0.1.3/code 4 and default host bounds 4-4. Shared web 0.8.0, bridge/schema 1/1 and committed V4.5 remain unchanged. The association needs a new matching-signer APK; OTA alone cannot add it. No public tag, release or Vercel promotion is created. See [current native behavior](ANDROID_APK_HISTORY.md#website-open-or-install-october-22-2026) and [candidate evidence](../../testing/ANDROID_TESTING.md#october-22-2026-website-open-or-install).

### Automatic production backup and restart prompt (October 22, 2026)

Automatic production anonymous-owner backup supersedes the prior opt-in candidate. The About update card is replaced by a verified idle-only Restart now/Later offer. The native method changes the unpublished host to 0.1.2/code 3 with default bounds 3-3; bridge/schema stay 1/1, web stays 0.8.0 and committed V4.5 stays selected. Earlier APK/OTA receipts below do not verify this source. See [follow-up validation](../../testing/ANDROID_TESTING.md#october-22-2026-automatic-production-backup-and-update-prompt). No tag/public release is created by implementation.

### Production Android preparation (October 22, 2026)

Prepared permanent external APK/OTA signing with maintainer approval, a checked signed-APK pipeline, signed packaged public trust, strict download availability and compatible OTA preparation. Native Release remains `0.1.1`/code `2`, web `0.8.0`, bridge/schema `1`/`1`; committed V4.5 remains selected while local V5 overrides are preserved. Candidate receipts record APK/input/model/source identity. The reviewed additive Supabase backup setup was deployed after access returned and its server flag was enabled, preserving all historical data/policies. Catalog and safe HTTP checks do not establish a real-device backup/recovery pass. No public APK/OTA asset, tag, commit or Vercel promotion was created. Exact validation and remaining publication gates belong to [Android testing evidence](../../testing/ANDROID_TESTING.md#october-22-2026-production-apk-preparation).

Local signed APK SHA-256: `f4875f120718c4c8d925bf28651fd058e4f2f6468c188767b9ab77176270e501` (14,540,614 bytes); production input fingerprint `3ce903b05e3e5545f9f8f1aa4bf531f76e10750b22baebc06dcb33a8218173bd`. The candidate is based on `c7d1fb06e53fc50c4565a6d379e91ecc396fec72` plus working-tree changes. Locally signed OTA sequence 2 was verified with the same pinned host/model; no public tag or remote sequence history is established by that preparation. Native unit/runtime/physical/reliability and remote-release evidence remain separately identified in the testing record.

### Android host implementation candidate (October 20, 2026)

Prepared a separate Java Android host (`0.1.0-dev`, code `1`) for shared web `0.8.0`, native SQLite/private photos, archive migration, signed GitHub Release OTA, and optional Supabase recovery-code backup without Sign In/Register screens. The committed V4.5 model remains the default APK input; local V5 experimentation is preserved separately. No app tag, GitHub asset, production signing key, Vercel promotion, or live Supabase migration was created by this preparation. The [Android guide](../ANDROID_APK_VERSIONING.md) records build fingerprints, server deployment boundaries, verification, and remaining device/release checks. Earlier v0.8.0 browser results do not certify this Android candidate.

- **Prepared app:** `0.7.0`; **adopted model:** V4.5.0 (`v4.5.0`). The model accepts a diagnosis only when raw confidence is at least 0.70. Margin and entropy rejection are disabled.
- **Current features:** optional local Diagnostics in About and raw confidence in new reports. Badges truncate to at most one decimal percentage and omit `.0`. Older reports retain their saved precision.
- **Branch handoff:** `88a479d` contains the feature preparation; `116e462` contains the scanner follow-up and was pushed to `master`. A local annotated `v0.7.0` candidate tag was prepared. Remote CI, tag publication, and Vercel promotion are not verified by this documentation pass.
- **Release status:** a prepared version, a pushed commit, a successful CI run, a published tag, and a promoted deployment are different events. Check their recorded identities before describing a build as released or deployed.
- **Next model:** V5.0.0 remains untrained and on standby; preparing its notebooks does not change the app model.

## Contents

- [Version labels and release rules](#version-labels-and-release-rules)
- [Release index](#app-releases)
- [Timeline, oldest first](#release-timeline)
- [Latest preparation: v0.7.0](#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026)
- [October 19 candidate: v0.8.0](#v080-square-camera-prepared-release-october-19-2026)
- [Candidate testing and promotion](#candidate-testing-and-promotion)
- [Creating a GitHub Release](#creating-a-github-release)

## Version labels and release rules

- The PWA footer reads two version labels, and neither is an environment variable.

  - Give changed shipped app builds distinct release labels so a tester can identify the build from its footer. Keep model labels independent when the model stays unchanged.

| Label         | Source                                                                                                          | Bump when                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| App version   | `version` field in `package.json`, injected as `NEXT_PUBLIC_APP_VERSION` by the `env` block in `next.config.ts` | Any app release                            |
| Model version | `modelVersion` constant in `src/lib/constants.ts`                                                               | The assets in `public/model/` are replaced |

- Both values are baked into the bundle as literal strings at build time, so a version change requires a rebuild.

  - Neither can be overridden by `.env.local`, a shell variable, or a hosting dashboard variable, which is deliberate: a stale override would silently display the wrong version.
  - Do not add `NEXT_PUBLIC_APP_VERSION` or `NEXT_PUBLIC_MODEL_VERSION` to `.env.local` or to the Vercel project settings.
  - These values are public and safe to expose because they are version labels, not secrets.

- `src/env.d.ts` declares `NEXT_PUBLIC_APP_VERSION` as a required string so usage sites do not need a non-null assertion.

  - It is a declaration, not a runtime guarantee; if the `env` block in `next.config.ts` is removed, the footer renders an empty label with no type error.

- **Any source edit obliges a rebuild before the commit, whatever its size.** `public/sw.js` is tracked and its precache manifest embeds the `_next/static` chunk hashes, so a one-character change to a class name invalidates the committed service worker exactly as thoroughly as a rewritten component does.

  - Committing the source without the regenerated `sw.js` leaves a service worker in history describing a bundle that never existed.
  - `v0.4.1` is the smallest change in the project's history and it still required the full `bun run typecheck`, `bun run lint`, and `bun run build` pass.

## App Releases

- This index describes the historical versions and preparation records below. The v1 examples are future semantic-versioning examples, not completed releases. Status comes from the dated evidence, not from the number alone.

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
v0.5.0  released: guest-owned private cloud synchronization and preserved offline History
v0.5.1  released: stable scan thumbnails and a horizontal treatment-guidelines header
v0.5.2  released: responsive scan History, selection, and confirmed deletion
v0.5.3  released / reported live: protected guideline HTTP/Realtime updates and offline advice
v0.5.4  prepared / awaiting CI and production promotion: skip unchanged HTTP guidance writes while preserving update ordering
v0.5.5  prepared release: guided camera capture, installation guidance, and responsive History refinements
v0.6.0  prepared release: V4.5.0 confidence-only model and local-only History with storage-full recovery
v0.6.1  prepared patch: uncertain result scores and bilingual Terms clarification; same V4.5.0 model
v0.7.0  prepared feature release: optional local diagnostics and raw-confidence display; same V4.5.0 model
v0.8.0  candidate feature release: square guided camera with matching capture and bounded sizing; same V4.5.0 model
v1.0.0  stable field-tested release
v1.0.1  small fix after v1.0.0
```

<a id="reading-the-release-history"></a>

## Release timeline

- The records below retain earlier app changes and their original status at the time of preparation.

  - Historical references to V3 or an earlier candidate describe those entries' dates.
  - Candidate labels do not change automatically when a build is deployed; the dated confirmation below corrects the current overview without rewriting original validation records.
  - Use recorded commits, tags, deployment identities, and completed evidence to identify an exact build.
  - This documentation split does not change either version label.

### Earlier app milestones: v0.1.0–v0.4.6

- Exact dates are retained where the source record provides them; no date is inferred from a version number.

- **v0.2.0–v0.2.5:** Project history records `v0.2.0` as published.

  - `v0.2.1` clarifies confirmation-modal titles; `v0.2.2` organizes repository documentation and filenames.
  - `v0.2.3` adds the collapsible Home scan-flow guide; `v0.2.4` sources labels from build configuration and refines the guide layout.
  - `v0.2.5` localizes History and organizes UI components.
  - The model remains `model-v2.0.0` because assets, class mapping, and training results do not change.

- **v0.2.6:** Ships Trial 2.1 weights, folded temperature `T = 0.754966`, and fitted rejection settings as `model-v2.1.1`. The August 23, 2026 model swap and August 24 threshold fitting preceded this app release without app releases of their own.
- **v0.2.7:** `v0.2.7` removes organ labels from scan cards and adds a rejected-scan filter. The model remains `model-v2.1.1`.
- **v0.3.0:** Ships Trial 3 and `model-v3.0.0`.
- **v0.4.0:** Redesigns the mobile field experience and makes local-first synchronization retry-safe. Model assets, classes, thresholds, and the 97.46% Trial 3 result remain unchanged. This has an app tag only.
- **v0.4.1:** Changes one bottom-navigation padding line. It still needs its own label so testers can identify which markup produced the screen.
- **v0.4.2:** Writes scan-sheet `transform` and `opacity` directly rather than calling `setState` each frame, removes full-screen backdrop blur on phones, and adds `prefers-reduced-motion`. The model stays unchanged. A performance-only change still needs an identifiable build even when its appearance stays similar.
- **v0.4.3:** Adds an empty-History scan CTA and header Scan action for desktop, and removes the camera card on devices without a camera. The model stays unchanged. This follows the existing patch precedent for feature additions within a minor line, including v0.2.3, v0.2.5, and v0.2.7; minor releases had been reserved for model swaps and redesigns. The label identifies which device-specific controls a tester saw.
- **v0.4.4:** Moves four local SVG components from `how-it-works-steps.tsx` into `brand/icon.tsx`. The shapes, sizes, and colours stay identical. Scan-sheet descriptions grow from `text-[10px]` to `sm:text-[12px]` at 40rem and above. The model stays unchanged. Both changes share one release because the tracked generated `public/sw.js` must describe the complete build.
- **v0.4.5:** Changes two Tailwind classes in `how-it-works-steps.tsx` so the three cards have equal height in a wide row. Its model stays unchanged. It follows v0.4.4 as a new patch because that tag was already pushed; a published tag must not be amended for tidiness. This was the smallest release after v0.4.1.
- **v0.4.6:** Replaces the green/amber/blue solid How it works cards with one pale green bordered style and darkens descriptions. Its model stays unchanged. The visible change needs an identifiable patch build.

- **Release tag commits.** `v0.2.6` sits on `e493009` and `model-v2.1.1` on `9b31c7b`.

  - `model-v3.0.0` and `v0.3.0` both sit on `f73f0b8`, sharing one commit because the weights, the thresholds, and the version bumps landed together, which is correct: thresholds and weights are one calibrated artifact.
  - `v0.4.0` sits on `af3474d` with no model tag beside it, `v0.4.1` on `b652b4a`, `v0.4.2` on `bcae4a1`, `v0.4.3` on `4792266`, `v0.4.4` on `959d565`, `v0.4.5` on `441ee89`, and `v0.4.6` on `7cba324`, all seven app-tag-only.
  - Record the commit for every future tag here, so a reader can reach the exact bytes a reported metric was measured on without trusting the tag name alone.

- The `v0.2.3` tag was originally created on a commit that predated an amend and was missing `src/components/how-it-works-card.tsx`, so a checkout of that tag could not build.

  - The tag was moved to the corrected commit `50514f8` on August 18, 2026.
  - The superseded commit was `175d7ddc4094ea84139b0526bfa1abd6265a40a9`.
  - Create tags only after the release commit is final to avoid repeating this.

### v0.4.7: history pagination and scan details

- The history list uses localized previous/next controls around `Page {n} of {total}` and returns to a valid page when records are deleted.

  - The scan-details modal constrains its desktop grid and removes the photo's intrinsic dimensions from layout, keeping disease and confidence badges inside the visible photo.
  - On phones, the modal scrolls as a whole so its close action remains reachable.
  - The model stays at `v3.0.0`; no model files or diagnosis thresholds changed.

### v0.4.8: scan photo fix and reliability testing

- This patch prepares app version `0.4.8`.

  - Scan cards track which image blob owns each local URL, avoiding a revoked URL when that blob is replaced.
  - The release also adds isolated browser tests for scan/history flows and offline behavior, explicit repeated-inference and 30-minute reliability commands, and core E2E coverage in the `master` push workflow.
  - Test guides, checklist examples, release instructions, and experimental notebook locations are aligned with the implementation.

- The model remains `v3.0.0`; model assets, class mapping, preprocessing, and rejection thresholds are unchanged.

  - The intended app tag is `v0.4.8`.
  - Record its actual commit after the tag is created.

### v0.4.9: adoption of V4.3.0 Combined

- On October 2, 2026, app `0.4.9` adopted the single V4.3.0 Combined model for mango leaves and fruit, replacing the former six-class V3 baseline.

  - Its footer identifies PWA `0.4.9` and model `v4.3.0`.
  - This is the app update between v0.4.8 and the subsequent v0.5.0 cloud-synchronization candidate.

- The application changes were:

- Use seven output classes, including separate Healthy Leaf and Healthy Fruit results. Both healthy results read the existing `healthy` treatment-guideline row.
- Reuse a saved duplicate diagnosis only when its `model_version` exactly matches the active model. Older and unlabeled reports remain in History; uploading their photo again runs current-model inference.
- Use the adopted model cache `mangoleaf-model-cache-v4-3-0`. Service-worker activation removes superseded model caches, and precache content revisions update the bundled files. Reloading replaces an already loaded model.
- Align photo-review, seven-class result, bilingual-guidance, uncertain-photo reminder, and footer/About regression coverage with the adopted model. Record the supplied Mango Scab and Bacterial Canker fixture replacements by their hashes.

- Adoption selected the completed Combined export; it did not retrain weights or refit its rejection settings.

  - The [AI model adoption record](AI_MODEL_HISTORY.md#v049-adoption-of-v430-combined-october-2-2026) and [preserved trial report](../../model-training/non-experiment/v4.3.0/TRIAL_v4_3_0.md#current-model-adoption-october-2-2026) retain the original export identity, numerical settings, hashes, and notebook/evaluation evidence.

- The [October 2 local validation record](../../testing/TESTING.md#v049-local-validation-october-2-2026) reports formatting, typecheck, lint, production build, export/security checks, ten tooling tests, all 65 core browser cases, and R01's 240 actual predictions.

  - These results identify their original source snapshot and do not establish new field accuracy or certify later cloud-client changes.

- **Verified local tag identity:** `v0.4.9` and `model-v4.3.0` both identify commit `9fd175e40b85a805ab482554e351f9686f1f031a`.

  - Local tag verification does not establish remote Release publication or production deployment.
  - Earlier dated pending-status statements remain part of the original adoption record; adding this summary does not change those historical measurements.

### October 3, 2026

- **Dependency security, October 3, 2026:** The local `0.5.0` candidate now selects Next.js and its ESLint configuration `16.3.6`, overrides Browserslist to `4.28.7`, and records compatible transitive security patches in `bun.lock`.

  - App/model labels remain `0.5.0` / `v4.3.0`.
  - The [dependency review](../../security/DEPENDENCY_SECURITY.md) records a clean production-dependency audit and one unresolved development-only `braces` advisory.
  - Earlier candidate validation remains tied to its original dependency snapshot; new checks and remote release status are recorded separately.

### v0.5.0: private cloud synchronization candidate (October 3, 2026)

- **Status: candidate / not released.** App `0.5.0` is a minor feature update for the cloud-ownership transition and local database upgrade.

  - The model remains `v4.3.0`; its five files, seven classes, preprocessing, folded temperature, and fitted gates are unchanged.
  - The footer derives the new app label from `package.json` through the existing build configuration.

<a id="changes-included"></a>

#### v0.5.0: changes included

- Create and reuse a verified guest session in the background without a login or registration screen. Authorize private scan records and photos by that guest's identity rather than a browser-supplied device UUID.
- Preserve local reports and photo Blobs through the Dexie version 8 upgrade. Keep unowned legacy reports local-only; do not assign old cloud data to a guest automatically.
- Keep diagnosis, local History, and downloaded guidance independent of private cloud sign-in. Fetch public guidelines separately, and retain pending uploads/deletions for retry.
- Bypass service-worker caches for private cloud requests and remove older cached private responses.
- Expand isolated cloud regression tests, organize version/security/testing documentation and preserved notebooks, and extract unchanged storage-photo compression into its reusable helper.

- The performance review remains a set of measured findings and recommendations.

  - This release does not establish faster inference, improved accuracy, reduced device temperature, or lower battery use.

<a id="validation-and-publication"></a>

#### v0.5.0: validation and publication

- The approved validation scope is formatting, security, TypeScript, lint, production build, exported assets, tooling tests, the complete core browser suite, and filtered R01 repeated inference.

  - R03 is excluded.
  - Use the [dated candidate evidence](../../testing/TESTING.md#v050-candidate-validation-october-3-2026); earlier v0.4.9 reports retain their original fingerprints and do not certify this versioned build.

- Local `v0.4.9` and `model-v4.3.0` tags already identify commit `9fd175e40b85a805ab482554e351f9686f1f031a`.

  - This corrects current tag status without changing the original October 2 pending-status records.
  - Local tags do not establish remote release publication or deployment.
  - The new candidate is based on that commit plus the reviewed working-tree changes; its release commit, remote CI result, tested deployment, and `v0.5.0` tag/Release are still pending.
  - No new model tag is needed.

<a id="prepared-commit-message"></a>

#### v0.5.0: prepared commit message

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

<a id="prepared-tag-and-release-description"></a>

#### v0.5.0: prepared tag and release description

- **App tag:** `v0.5.0` **Release title:** `MangoLeaf AI v0.5.0 — Private cloud synchronization`

> Adds automatic guest-owned cloud synchronization without a login or registration screen. Scan records and photos use private owner access, while diagnosis, local History, and saved treatment guidance remain available offline.
>
> Public guideline downloads work independently of guest sign-in. Legacy reports remain preserved locally. Cloud regression coverage, project documentation, historical notebook organization, and reusable photo-storage code are updated.
>
> The AI model remains V4.3.0 Combined, with unchanged weights, classes, preprocessing, and fitted rejection settings.
>
> Local validation passed typecheck, lint, production build, formatting/security checks, 14 tooling tests, 10 export checks, all 80 core browser cases, and R01 with 240 actual predictions.

- The local candidate results are recorded in the testing guide.

  - Remote CI and production promotion remain pending.
  - Create the tag on the exact approved tested commit using the procedure below; preparing this text does not create or push a tag, publish a Release, or deploy the app.

### v0.5.1: scan-thumbnail stability candidate (October 5, 2026)

- **Status: candidate / not released.** App `0.5.1` is a patch for scan-card photo display and the treatment-guidelines header layout.

  - The app label comes from `package.json` through the existing build configuration.
  - Model `v4.3.0`, its five assets, seven classes, preprocessing, temperature, and rejection settings remain unchanged.
  - No new model tag is required.

<a id="changes-included-1"></a>

#### v0.5.1: changes included

- Keep Recent and History thumbnails visible when cloud synchronization changes only a scan's metadata. IndexedDB can return a new Blob object with identical photo bytes; the reusable `useScanPhotoUrl` hook compares those bytes before replacing the displayed URL.
- Replace the displayed photo when its bytes change, including different photos of equal size. Cancel stale comparisons and release replaced or unmounted photo URLs. Original-upload duplicate checking keeps its existing SHA-256 behavior.
- Keep the treatment-guidelines heading and English/Bisaya controls side by side on narrow screens.
- Add a browser regression for scan insertion, cloud metadata updates, and offline deletion. Align architecture, performance, testing, setup, and current-version references with this patch.

- This patch does not retrain the model or refit its gates.

  - The photo comparison reads saved bytes asynchronously; its storage and processing cost remains described in [PERFORMANCE.md](../../PERFORMANCE.md#21-per-card-blob-url-management-scan-cardtsx).

<a id="validation-and-publication-1"></a>

#### v0.5.1: validation and publication

- The versioned build must pass formatting/security, typecheck, lint, production build, export verification, tooling tests, the complete core browser suite, and filtered R01 repeated inference.

  - The [October 5 validation record](../../testing/TESTING.md#v051-candidate-validation-october-5-2026) identifies the tested source fingerprint and actual results.
  - Earlier thumbnail and release checks retain their original source identities.

- **Verified local baseline tag:** `v0.5.0` identifies commit `0139bb4c988a1e17301020a5dd1d0cc37a1f1527`.

  - The current candidate starts from `4eaa33dc1575dc80c1840a1bd340dd28444f949f` plus the uncommitted thumbnail, layout, version, and documentation changes.
  - This local tag check does not establish remote Release publication or production deployment and does not rewrite the October 3 candidate record.

- Local validation passed formatting/security, typecheck, lint, production build, all 10 export checks, all 14 tooling tests, all 83 core browser cases, and R01's 240 actual predictions.

  - Tested application fingerprint is `defae7e97f5640eaea888dfc7dfc067ec740521b82e8abd7568cec2623805ca3`; the testing record preserves report hashes and model identity.
  - The candidate commit, remote CI, approved production promotion, live-version confirmation, and `v0.5.1` tag/Release remain pending.
  - Preparing this record does not stage, commit, push, tag, publish, or deploy the app.

<a id="prepared-commit-message-1"></a>

#### v0.5.1: prepared commit message

```text
fix: stabilize scan photos for PWA v0.5.1

IndexedDB returns new Blob wrappers during metadata updates.
Compare saved photo bytes before replacing a card's URL to
prevent thumbnails from disappearing during synchronization.
```

<a id="prepared-tag-and-release-description-1"></a>

#### v0.5.1: prepared tag and release description

- **App tag:** `v0.5.1`

- **Release title:** `MangoLeaf AI v0.5.1 — Stable scan photos`

> Keeps Recent and History thumbnails visible while scans save and synchronize. Changed photos still update, and unused photo URLs are released.
>
> Keeps the treatment-guidelines heading and language controls side by side on mobile. Adds thumbnail regression coverage and updates the project guides.
>
> The AI model remains V4.3.0 Combined, with unchanged weights, classes, preprocessing, and fitted rejection settings.

- Local candidate validation passed formatting/security, typecheck, lint, build, 10 export checks, 14 tooling tests, all 83 core browser cases, and 240 repeated actual predictions.

  - Remote CI and production promotion remain pending.

- Create the app tag on the exact approved tested commit after the remaining release steps pass.

  - The prepared notes are a draft until publication is approved.

### v0.5.2: scan History and deletion candidate (October 6, 2026)

- **Status: candidate / not released.** App `0.5.2` is a patch within the existing minor line, following the project's precedent for interface refinements and additions.

  - The app label comes from `package.json` through the existing build configuration.
  - Model `v4.3.0`, its five assets, seven classes, preprocessing, temperature, and rejection settings remain unchanged.
  - No new model tag is required.

<a id="changes-included-2"></a>

#### v0.5.2: changes included

- Show one recent scan on Home below 768px and up to four at larger widths. History uses five compact thumbnail rows per page below 768px and six photo cards per page at larger widths. Resizing preserves the first scan's position as closely as the new page size allows; deletion returns to a valid page.
- Add individual selection and Select all for the current matching History results across every page. Search/filter changes clear selection, and newly arriving scans require another deliberate selection action.
- Use the same English/Bisaya confirmation dialog for a card's trash action and selected-report deletion. Keep the confirmed report IDs fixed, wait for local deletion to finish, and keep the dialog available for retry after a failure. Linked cloud rows/photos use the existing deletion queue, including offline retries.
- Count each condition among the current search matches before category filtering or pagination. Typing or clearing search resets the category to All, closes the phone filter panel, and returns to page one.
- Compact the scan-sheet photo tips, keep Cancel visible while the content scrolls, and constrain the desktop sheet width. Refine History badges, shared search/filter/delete/navigation icons, the scan-step icon, and About timeline numbers.
- Clarify the [treatment-review publication dates and snapshot scope](../../treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md#source-dates-and-review-scope--2026-10-06-clarification). This documentation clarification does not apply the proposed guidance to Supabase.

<a id="validation-and-publication-2"></a>

#### v0.5.2: validation and publication

- The approved local scope is formatting, lint, typecheck, the production build, tooling/security/export checks, the core browser suite, and R01 repeatability.

  - The 30-minute R03 session is excluded from this candidate's scope.
  - Results for this versioned build are recorded in [v0.5.2 candidate validation](../../testing/TESTING.md#v052-candidate-validation-october-6-2026), separately from the earlier v0.5.1 evidence.

- Browser cases now use viewport-specific counts, singular/plural Home headings, accessible per-scan Details names, and explicit deletion confirmation.

  - Coverage preserves thumbnail stability, pending-upload deletion races, offline reports, and private cloud cleanup.
  - The new F17 case checks a report arriving after confirmation, a failed local deletion followed by retry, and offline batch cleanup after reconnection.
  - The [testing guide](../../testing/TESTING.md) records actual outcomes.
  - Husky and the existing master-only CI workflow already run their applicable gates and need no pipeline changes for this interface update.
  - R03 locators were maintained without running its excluded session.

- **Local validation passed:** All 86 core browser cases, R01's 240 actual predictions, 14 tooling cases, 10 export checks, formatting, security, lint, typecheck, and production build passed for this candidate's source fingerprint.

  - The linked validation record preserves scope, report identities, and evidence limits.

- Remaining release gates follow the [candidate testing and promotion procedure](#candidate-testing-and-promotion): CI on the final `master` commit, confirmation of Vercel's manual-promotion setting, promotion of the tested deployment, live-version verification, and the app tag/Release on that tested commit.

  - Remote publication and deployment remain pending.

- **Verified baseline:** Local tag `v0.5.1` identifies commit `df038db8b63d2da101b25ab9358fe35f409ac7c1`.

  - A separate read-only GitHub check on October 6 confirmed that [v0.5.1 is published](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.5.1); this does not verify its production deployment or rewrite the October 5 candidate record.
  - Candidate `0.5.2` starts from `8f8004225e6944182b6f118ffc108c6284d25707` plus the October 6 working-tree changes.
  - Its tested application fingerprint and local outcomes are in the [validation record](../../testing/TESTING.md#v052-candidate-validation-october-6-2026).
  - Record the final candidate commit and deployment URL before promotion.

<a id="prepared-commit-message-2"></a>

#### v0.5.2: prepared commit message

```text
feat: refine History for PWA v0.5.2
```

<a id="prepared-tag-and-release-description-2"></a>

#### v0.5.2: prepared tag and release description

- **App tag:** `v0.5.2`

- **Release title:** `MangoLeaf AI v0.5.2 — Scan History and deletion`

> Shows one recent scan on phones and up to four on larger screens. History uses compact phone rows with five reports per page and larger cards with six per page.
>
> Adds report selection across History pages and a shared confirmation for single or bulk deletion. Filter options show matching counts, and changing search resets the filter. The scan sheet has compact photo tips and keeps Cancel visible while scrolling.
>
> Refines badges and navigation icons. The AI model remains V4.3.0 Combined, with unchanged model files and rejection settings.

- Local validation is complete for the recorded working-tree source; final-commit CI, production verification, and publication remain pending.

  - The prepared text does not create a tag, publish a Release, or deploy the app.

### Unreleased guideline synchronization fix (October 7, 2026)

- The working tree adds protection against an older full HTTP guidance response replacing an overlapping Realtime update.

  - Ordinary Realtime INSERT/UPDATE/DELETE events still save directly without another GET for that event.
  - Changes observed during unfinished HTTP work invalidate its snapshot and share a protected follow-up download; the commit also checks for changes saved by another tab.
  - Guideline REST reads bypass service-worker caches, while IndexedDB keeps offline advice.

- At initial implementation, the working-tree package label remained `0.5.2` and the model remained `v4.3.0`.

  - The existing local `v0.5.2` tag belongs to the earlier source and excludes this fix.
  - The subsequent [v0.5.3 candidate](#v053-guideline-update-ordering-candidate-october-7-2026) gives the change its own app version without moving that tag.
  - The model files, treatment text, and Supabase schema are unchanged.

- The October 6 checks above describe their original fingerprint.

  - The [initial guideline-ordering validation](../../testing/TESTING.md#guideline-update-ordering-october-7-2026) preserves the pre-version-bump fingerprint; the candidate below has separate versioned validation.

### v0.5.3: guideline update ordering candidate (October 7, 2026)

- **Status: candidate / not released.** App `0.5.3` is a patch for guideline synchronization and service-worker HTTP caching.

  - Its displayed version comes from `package.json` through the existing build configuration.
  - Model `v4.3.0`, its five assets, seven classes, preprocessing, folded temperature, and fitted rejection settings remain unchanged.

<a id="changes-included-3"></a>

#### v0.5.3: changes included

- Keep ordinary Realtime INSERT/UPDATE/DELETE changes writing directly to IndexedDB. An event observed during an unfinished guidance download/save prevents that older HTTP snapshot from replacing the received advice and schedules a protected follow-up GET.
- Share active downloads, combine repeated overlap notifications, order local writes, and compare the saved starting snapshot inside the final transaction. Changes saved by another tab can invalidate an older result; a late observed event rolls back the unfinished snapshot save.
- Reconcile after subscription readiness, invalidate stale work during offline/unmount cleanup, and retain saved advice after failed requests while using the existing retries.
- Make guideline REST reads network-only in the worker and remove older cached guideline HTTP responses. IndexedDB remains the offline advice store.
- Add guideline-ordering unit and browser regressions and maintain the loading fixtures. Update release, architecture, synchronization, performance, testing, setup, and plain-English Q&A references.

- This protects changes observed during overlapping client work.

  - It does not establish a live production incident or a universal ordering guarantee for delayed or unseen server events.
  - No treatment wording or Supabase schema/policy is changed.

<a id="validation-and-publication-3"></a>

#### v0.5.3: validation and publication

- The versioned scope is formatting/security, TypeScript, lint, production build, export verification, tooling tests, the complete core browser suite, and R01 actual-inference repeatability.

  - R03 is excluded.
  - Results belong in [v0.5.3 candidate validation](../../testing/TESTING.md#v053-candidate-validation-october-7-2026), separately from the earlier `0.5.2` implementation fingerprint.

- The existing local `v0.5.2` tag identifies baseline commit `ee91cf693fd52acb6f882f2c049a3b2ddd599a1f`.

  - Candidate `0.5.3` starts from that commit plus the working-tree guideline fix and version preparation.
  - Its tested application fingerprint is `b116df9958424036c66d80fb151e8ec44bf4a07838b73022e17f2bb47dd5a661`.
  - Local versioned validation passed formatting/security, typecheck, lint, production build, 10 export checks, 26 tooling cases, 106 core browser cases with one declared Firefox worker skip, and R01's 240 actual predictions.
  - The testing record preserves report and model hashes.
  - Record the final candidate commit and deployment URL before promotion.
  - Final-commit CI, staged-production verification/promotion, and publication remain separate release steps.
  - Husky and master-only CI already run their applicable checks; the expanded core suite is selected through `playwright.config.ts`.

<a id="prepared-commit-message-3"></a>

#### v0.5.3: prepared commit message

```text
fix: preserve guideline updates for PWA v0.5.3

Prevent older HTTP snapshots from replacing advice received through
Realtime. Keep offline advice and protect changes from other tabs.
```

<a id="prepared-tag-and-release-description-3"></a>

#### v0.5.3: prepared tag and release description

- **App tag:** `v0.5.3`

- **Release title:** `MangoLeaf AI v0.5.3 — Reliable guideline updates`

> Prevents an older guideline download from replacing an update already received through Realtime. Normal Realtime updates continue to save directly, while overlapping changes share a protected follow-up download.
>
> Keeps downloaded advice available offline, protects changes made by another open tab, and removes stale guideline HTTP caches.
>
> The AI model remains V4.3.0 Combined, with unchanged model files and diagnosis settings.

- The tag and notes are prepared text.

  - Create the app tag on the exact tested commit after the candidate release procedure passes; no new model tag is needed.
  - Publication and deployment are not established by preparing these files.

### Release status confirmation (October 7, 2026)

- The maintainer confirmed that `v0.5.0`, `v0.5.1`, `v0.5.2`, and `v0.5.3` were published and used, and that users are currently using live `v0.5.3`.

  - The current release list therefore marks those versions as released.
  - Their original candidate sections, anchors, pending-status wording, and measured evidence remain dated preparation history rather than the current production status.

- This is a reported release/deployment confirmation.

  - It does not supply historical deployment timestamps, independently verify remote CI or production behavior, or turn earlier local tests into production evaluation.
  - Local `v0.5.3` and HEAD identify baseline commit `7899fd81e83256c695246dbc733bfcce0155f69f`; that source identity is separate from the reported production state.
  - The prepared `v0.5.4` release awaits CI and production promotion.

### v0.5.4: unchanged guidance check prepared release (October 7, 2026)

- **Status: prepared release / awaiting CI and production promotion.** App `0.5.4` is a patch following the reported live `0.5.3` version.

  - Its displayed version comes from `package.json` through the existing build configuration.
  - Model `v4.3.0`, its five assets, seven classes, preprocessing, folded temperature, and fitted rejection settings remain unchanged.
  - No new model tag is needed.

<a id="changes-included-4"></a>

#### v0.5.4: changes included

- Compare a valid full HTTP guidance response with the current IndexedDB guidance set inside the existing save transaction. Reuse `sameGuidelineSnapshot` to compare every ID, disease name, English field, and Bisaya field. Ignore row order; additions and deletions still count as differences.
- Run the event-counter and starting-snapshot protections before the unchanged-content check. A result affected by a Realtime event, another tab, or invalidated work must still be discarded and follow existing recovery behavior.
- Finish identical downloads successfully without calling `clear()` or `bulkPut()`. Saved advice and its current display remain available; an unchanged response is not an error and does not trigger a retry solely because its content matches.
- Save a different valid complete set through the existing atomic replacement. This retains reconciliation of changes missed offline, including removed rows.
- Keep direct Realtime INSERT/UPDATE/DELETE handling, the guarded follow-up GET, failed-download recovery, and network-only guideline HTTP reads unchanged. HTTP still downloads the complete set before comparing it; this is a local-write optimization, not a server-version protocol or download-elimination change.
- Add regression coverage for identical content, reordered rows, changed fields, additions/deletions, and overlap protection. Update affected guides and the ignored technical Q&A.

- The check does not change the Supabase schema, treatment wording, guest identity, private scan synchronization, or model behavior.

  - Avoided writes are established by the code and applicable checks; no measured phone speed, heat, battery, or memory gain is claimed.

<a id="validation-and-identity"></a>

#### v0.5.4: validation and identity

- The approved scope is formatting/security, TypeScript, lint, production build, export verification, tooling tests, the complete core browser suite, and filtered R01 actual inference.

  - The 30-minute R03 session is excluded.
  - Use [v0.5.4 prepared release validation](../../testing/TESTING.md#v054-release-validation-october-7-2026) for this build's results and application fingerprint.
  - The earlier `v0.5.3` reports retain their original identity and do not certify this changed build.

- **Baseline:** Local HEAD and tag `v0.5.3` identify `7899fd81e83256c695246dbc733bfcce0155f69f`.

  - App `0.5.4` starts from that commit plus the checker, version, test, and documentation changes.
  - Local validation passed formatting/security, TypeScript, lint, production build, 10 export checks, 28 tooling cases with 98 assertions, all 32 focused guideline cases, and 118 core browser cases.
  - Both browser runs include one declared Firefox worker-test skip and zero unexpected failures.
  - Filtered R01 passed 240 actual predictions with stable per-photo results and zero net tensor growth.
  - Tested application fingerprint is `c519472be5cc4335fbcd8e0dfca0e705ca88b6d9a6cb66f33bc657516f0074d7`; the testing record preserves report hashes and unchanged model hashes.
  - Final-commit CI, staged-production verification/promotion, live-version confirmation, and `v0.5.4` publication remain separate release steps.
  - Husky and the existing master-only CI already select the applicable checks; no hook or workflow expansion is required solely for this checker.

<a id="prepared-commit-message-4"></a>

#### v0.5.4: prepared commit message

```text
perf: skip unchanged guidance for PWA v0.5.4

Avoid clearing and rewriting identical HTTP guidance while preserving
Realtime ordering and changes saved by another tab.
```

<a id="prepared-tag-and-release-notes"></a>

#### v0.5.4: prepared tag and release notes

- **App tag:** `v0.5.4`

- **Release title:** `MangoLeaf AI v0.5.4 — Skip unchanged guideline saves`

> Checks a successful guidance download against the advice already saved on the device. Identical records and English/Bisaya text finish successfully without replacing the local copy; changed, added, or removed guidance still updates offline storage.
>
> Preserves HTTP/Realtime overlap protection, direct Realtime updates, and advice after failed downloads. HTTP still retrieves the complete guidance set. The V4.3.0 Combined model and diagnosis settings remain unchanged.

- The tag and notes are prepared text.

  - Create the app tag on the exact tested commit after the release procedure passes.
  - Preparing files does not create a commit, tag, GitHub Release, or production deployment.

### Local development changes, October 9, 2026

- The current working tree adds a full-screen guided camera preview with framing advice, capture, photo review, and retake.

  - It also replaces the Home recent-scan section and desktop History/Scan actions at 768px and wider with an Install prompt and installation guide.
  - Phone scanning and History remain available.
  - The guide chooses iOS/Android instructions from device identity, separately from responsive layout and browser-native install-event support; its desktop QR opens `https://mangoleafai.vercel.app/?install=1`.

- The maintainer tested the V4.4.0 candidate locally and then requested restoration of V4.3.0.

  - The model assets and display label are restored, with cleanup of the temporary candidate cache.
  - See the [model rollback record](AI_MODEL_HISTORY.md#v440-local-test-completed-v430-restored-october-9-2026), [camera architecture](../../ARCHITECTURE.md#guided-camera-capture), and [development progress](../../PROGRESS.md#october-9-2026).

- These are local changes under the existing `0.5.4` label.

  - The October 7 prepared-release checks describe their original source fingerprint and do not validate this later working tree.
  - No new release version, tag, publication, or production promotion is recorded here.
  - A future release must identify and validate its final source/build, including the applicable browser and physical-device checks.

### v0.5.5: guided camera and installation prepared release (October 10, 2026)

- **Status: prepared release / publication and production promotion pending.** The maintainer selected app `0.5.5` as the next PWA release.

  - Its displayed label comes from `package.json` through the existing build configuration.
  - The model remains `v4.3.0`; its five assets, seven-class order, full-photo 224 × 224 preprocessing, folded temperature, and fitted rejection settings remain unchanged.
  - No new model tag is required.
  - This release selection does not establish completed deployment or evaluation.

<a id="changes-included-5"></a>

#### v0.5.5: changes included

- Replace the camera file-picker handoff with an in-app live preview and framing advice. The square guide occupies 75% of the displayed camera image's shorter side; it helps the user frame the whole leaf or fruit and does not crop the captured photo. Capture preserves the complete available frame, then opens photo review. Diagnosis starts only when the user selects Run Diagnosis; Retake reopens the camera or the previously used gallery picker.
- Release camera tracks after capture, close, backgrounding, and unmount. Cancel stale permission and encoding results, require a ready frame before capture, and provide localized recovery for unsupported access, permission denial, unavailable hardware, interrupted streams, and capture errors. Returning from the background requires an explicit restart. The browser decides the actual camera resolution from the requested preferences.
- Add an accessible installation guide with iOS/Android instructions selected from device identity, native installation only after an explicit supported button press, keyboard focus containment, and focus restoration. At 768px and wider, Home and navigation emphasize phone installation instead of scan entry points. The desktop QR opens `https://mangoleafai.vercel.app/?install=1`; this flag opens guidance rather than automatically installing the app.
- Show four History records per page on narrow screens and six at the desktop breakpoint. Put the mobile selected-photo delete action above pagination. Reserve thumbnail space from its width to avoid flex/aspect-ratio sizing problems in older Safari. Existing confirmation, local deletion, synchronization, and model-aware duplicate reuse remain in place.
- Match a newly saved result to the selected photo hash and active model before opening it. Full class probabilities remain technical diagnostics in DevTools and test reports; they are not presented as measured accuracy or exposed in the result modal.
- Extend guided-camera and installation browser coverage. Align the R03 mixed-use protocol with camera/gallery review, retake, track cleanup, and actual inference; keep the core suite in the master-only GitHub workflow and use the pinned Playwright CLI through Node. The 30-minute R03 case was not executed during this preparation.
- Preserve the completed V4.4.0 experimental notebooks, selected scientific figures, result artifacts, and source provenance after local testing and restoration of V4.3.0. Update architecture, performance, setup, testing, release guidance, the V4.3.0 split table, and the local technical Q&A. V4.4.0 remains an experimental model rather than the model shipped by this release.

- The camera guide does not change model input cropping or rejection gates.

  - Diagnosis and saved History remain local-first; the temporary model-size image is not the stored scan photo.
  - These changes do not alter the Supabase schema, cloud ownership rules, treatment advice, or model-training results.

<a id="validation-and-identity-1"></a>

#### v0.5.5: validation and identity

- **Baseline:** Local HEAD and app tag `v0.5.4` both identify `341a065c0288e196578b970a6e5ac402915ed417`.

  - The prepared `0.5.5` build includes subsequent source, test, version, and documentation changes.
  - October 7 and October 9 results retain their original source fingerprints and do not certify the versioned `0.5.5` build.

- The [v0.5.5 validation record](../../testing/TESTING.md#v055-release-validation-october-10-2026) records this release's actual local checks, final application fingerprint, report identities, and unchanged model hashes.

  - Local formatting/security, TypeScript, lint, production build, all 10 export checks, 28 tooling cases, 187 core browser cases with four declared skips, and filtered R01 with 240 actual predictions passed against the final versioned build.
  - Lint retains one existing unused-import warning; no earlier pass is counted as a new result.
  - The approved preparation scope excludes executing R03, including a shortened session.
  - Camera hardware, installed iOS/Android behavior, OS/browser versions, and background behavior require their own recorded evidence in the [physical-device checklist](../../testing/PHYSICAL_RELIABILITY_CHECKLIST.md).

- The release commit, remote CI, staged deployment identity, production-domain setting, applicable device evidence, approved promotion, live-version confirmation, and tag/Release publication remain separately recorded release steps.

  - Preparing these files does not create a commit, tag, GitHub Release, or production deployment.

<a id="prepared-tag-and-release-description-4"></a>

#### v0.5.5: prepared tag and release description

- **App tag:** `v0.5.5`

- **Release title:** `MangoLeaf AI v0.5.5 — Guided camera and installation`

- **Release description:**

> Adds an in-app camera preview with framing guidance, full-frame capture, photo review, and retake. Camera access ends after capture, close, or backgrounding, with clear recovery instructions when access fails. Diagnosis still starts only after the user selects Run Diagnosis.
>
> Adds English/Bisaya installation guidance for Android and iOS, an optional native install action where supported, and a desktop QR that opens the phone guide. Wider layouts emphasize installation while phone layouts retain scanning and History.
>
> Refines History with four photos per mobile page, six at the desktop breakpoint, a selected-photo delete action above mobile pagination, and reserved thumbnail space for older Safari. Newly saved results are matched to their photo and active model. Full class probabilities stay in technical diagnostics.
>
> Updates camera and installation regression coverage, the mixed-use reliability protocol, master-only CI, and project documentation. Preserves the completed V4.4.0 experiment and its evidence after local testing; the application retains V4.3.0 Combined with unchanged weights, classes, preprocessing, temperature, and rejection settings.
>
> Applies the Next.js 16.3.8 security patch, compatible Sharp/source-map-js repairs, and disables the unused development MCP endpoint. Repairs controlled camera tests and modal focus containment, with runtime and camera diagnostics in CI. Remaining dependency findings stay documented.

- Use the exact approved, tested commit when creating the tag through the procedure below.

  - Add the completed validation and deployment identity to the published record; the prepared description does not assert that publication, deployment, or physical-device evaluation has already occurred.

#### Next.js security follow-up (October 10, 2026)

- The maintainer committed the prepared release at `5cad2ff15efa66d045642432c34b8846dcaabcfc`.

  - A later authenticated GitHub MCP review identified six root Next.js alerts, all fixed in `16.3.8`.
  - The subsequent local changes pin both Next.js and its ESLint configuration to that version, repair compatible Sharp and source-map-js dependencies, and disable the unused development MCP endpoint for the public-tunnel workflow.

- App/model labels remain `0.5.5` / `v4.3.0`; no existing tag is moved.

  - The [security review](../../security/DEPENDENCY_SECURITY.md) keeps the two unpatchable braces/sprintf-js findings visible.
  - The earlier release validation above belongs to its original dependency/configuration fingerprint.
  - The [security revalidation record](../../testing/TESTING.md#nextjs-security-revalidation-october-10-2026) identifies this revision's new checks and reports.
  - Camera follow-up also fixes the controlled media capability, restores escaped modal focus to an enabled action, and gives the complete CI job 45 minutes for setup/build/core checks.
  - R03 remains a separate 30-minute protocol and is excluded from CI and this task.
  - Local verification passed 187 core cases with four declared skips, filtered R01's 240 actual predictions, and the formatting/security/type/lint/build/export/tooling/archive checks.
  - The new reports identify application fingerprint `2ccdfaede198d91f39c4aa5ca65eabae85869382edcad9fffef3a0feb2127f7d`; the corrected Linux CI result remains pending.
  - GitHub alert re-evaluation and production deployment require the corresponding reviewed changes to be published through the release procedure.

### v0.6.0: local History and V4.5.0 prepared release (October 16, 2026)

- **Status: prepared / not released or deployed.** The maintainer selected PWA `0.6.0` for the combined update.

  - The original unpublished draft `d532fc8` contained the model adoption and local-only History under the earlier `0.5.5` app label.
  - The version correction changes `package.json` to `0.6.0`; the existing Next.js `env` configuration embeds `v0.6.0` in the rebuilt footer.
  - No environment override or second app-version constant is needed.
  - The maintainer selected amending that unpublished draft to include the corrected version and documentation; amending changes its commit ID.
  - Original validation reports retain their recorded base commit and input hashes.

- During this correction, the local `v0.6.0` tag was observed pointing to `d532fc8`, whose package still says `0.5.5`.

  - The maintainer confirmed that the commit/tag had not been pushed and authorized repointing this unpublished local tag to the amended commit.
  - This local consolidation does not push, publish, or deploy anything.
  - Complete final-commit CI and approved release checks before publishing the tag/release.
  - Published tags must never be moved.

- The release combines the already implemented V4.5.0 confidence-only model, browser-local scan reports/photos, bilingual storage-full recovery, diagnosis recovery, supported WebGL precision selection, guided camera/installation workflows, and selected V2 walkthrough.

  - Supabase supplies public guideline HTTP downloads and Realtime updates only.
  - The version correction itself changes no application source, database schema, prediction rules, model assets, or model-cache identity.
  - The AI model remains `v4.5.0`; V5.0.0 is untrained and on standby.

- The [v0.6.0 validation record](../../testing/TESTING.md#v060-version-correction-october-16-2026) distinguishes checks on the rebuilt version from preserved `0.5.5` core and R01 evidence.

  - The 30-minute R03 protocol is prepared for future use; no full or shortened R03 session is part of this correction.
  - Final-commit CI, approved release validation, physical-device evaluation, production promotion, and publication remain separate steps.

#### Version correction files

- `package.json`
- `public/sw.js` (generated by the build)
- `README.md`
- `SETUP.md`
- `docs/ARCHITECTURE.md`
- `docs/PERFORMANCE.md`
- `docs/PROGRESS.md`
- `docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md`
- `docs/testing/TESTING.md`
- `docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md`
- `docs/versions/PWA_VERSIONING.md`
- `docs/versions/AI_MODEL_VERSIONING.md`
- `notebooks/non-experiment/README.md`

<a id="prepared-tag-and-release-description-5"></a>

#### v0.6.0: prepared tag and release description

- **App tag:** `v0.6.0`

- **Release title:** `MangoLeaf AI v0.6.0 — V4.5.0 and local scan history`

- **Release description draft:**

> Adopts V4.5.0 with a 70% confidence threshold; margin and entropy rejection are disabled. Scan reports and compressed photos stay in this browser's IndexedDB, with bilingual storage-full recovery and save retry that reuses the completed prediction. Public treatment guidelines continue to refresh online and remain available offline.
>
> Uses 32-bit WebGL textures where supported, with 16-bit textures on limited devices. Retains guided camera capture, photo review/retake, diagnosis recovery, and installation guidance. Selects the V2 walkthrough, preserves model rollback/evaluation records, and updates the future 30-minute reliability protocol. V5.0.0 remains untrained and on standby.

- The separate `model-v4.5.0` tag is a model-provenance marker on the approved tested commit, not a second GitHub Release.

  - Do not reuse `v0.5.5` for this build or publish the draft before completing the release procedure below.

#### CI browser follow-up (October 16, 2026)

- The first `b7331a9` CI run failed G07's intentional offline-request console cleanup and R04's native Blob seeding in Linux WebKit; 223 core cases passed and eight were skipped.

  - The [follow-up testing record](../../testing/TESTING.md#v060-ci-browser-follow-up-october-16-2026) records the timing fix, narrowly scoped native-PNG capability guard, successful repeated local checks, and pending Linux rerun.
  - Typecheck, lint, build, and export checks passed.
  - This changes test support, documentation, and the build-generated worker only; app/model versions remain `0.6.0` / `v4.5.0`.
  - The pushed commit and any published tag must retain their identities; the repair requires a new follow-up commit and fresh CI before release approval.

### v0.6.1: uncertain result scores prepared release (October 16, 2026)

- **Status: prepared candidate; final-commit CI, release approval, and production promotion are pending.** App `0.6.1` displays the saved highest mango-class percentage in scan details for Uncertain / Unrecognized reports as well as accepted results.

  - This is a display change, not an extra model class or a change to the acceptance rule.
  - A rejected raw score just below 0.70 can round to a displayed 70%; the rejection label remains Uncertain.

- The English and Bisaya Terms explain that distinction, add an October 16 revision date, describe saved-versus-refreshed treatment advice, and use responsible-use/content-rights wording rather than claiming blanket statutory or research-ethics compliance.

  - Privacy Policy was reviewed against the current local-only flow and already matches it: no account, local report/photo storage, public guideline requests, browser-data-loss limits, and no automatic cloud recovery.
  - Its unchanged content retains the October 15 date.
  - This review does not establish legal certification or verify remote provider settings.

- The PWA retains model `v4.5.0`, the same model/configuration hashes, confidence >=0.70 only, existing model-cache identity, and local-only History.

  - No model retraining or new model tag is part of this patch.
  - The generated worker must come from the final production build.

- Separate commits in the same prepared source also repair V5.0.0 image inventory for the preserved MPO and large OE originals, and refresh the README walkthrough link.

  - These workflow repairs do not train or adopt V5.0.0.
  - Shared progress notes can be committed with the final app preparation so the staging groups need no partial-file selection.

- The [v0.6.1 testing record](../../testing/TESTING.md#v061-uncertain-result-scores-october-16-2026) records checks for the final source.

  - Earlier 0.6.0 passes do not certify this rebuilt patch.
  - The existing master-only CI still runs its core browser suite without executing the separate 30-minute R03 session.

#### Prepared commit and release text

- **App commit:** `fix: show uncertain scores in v0.6.1`

- **App tag:** `v0.6.1`

- **Release title:** `MangoLeaf AI v0.6.1 - Uncertain result scores`

- **Release description draft:**

> Displays the highest mango-class confidence score on Uncertain / Unrecognized scan details as well as accepted diagnoses. Updates English and Bisaya Terms to explain the score, rounding, and responsible use; the reviewed Privacy Policy continues to describe local-only History.
>
> Retains the V4.5.0 model and 70% confidence-only rejection rule. Refreshes the walkthrough link and fixes image compatibility in the separate V5.0.0 preparation workflow; V5.0.0 remains untrained and is not adopted.

- Commit the prepared groups, push the final source, and complete the [release procedure](#candidate-testing-and-promotion).

  - Create this tag/Release only for the exact approved tested commit; do not move `v0.6.0` or tag an intermediate commit.
  - Preparing this description does not publish or promote a deployment.

### v0.7.0: diagnostics and raw confidence prepared release (October 17, 2026)

- **Date scope:** feature preparation and the main local validation record began on October 17. The scanner follow-up and branch handoff completed on [October 18](#october-18-2026-v070-scanner-follow-up-and-branch-handoff); the combined notes below retain both parts of the candidate's evidence.

- **Status: prepared candidate; final-commit CI, approved release validation, tag publication, and manual Vercel promotion are tracked separately.** App `0.7.0` adds the shared, opt-in Diagnostics viewer in About.

  - Recording starts off; enabling it records controlled technical events across startup, photo review, camera, inference, saving/deletion, navigation, and public guideline updates.
  - The viewer supports copy, text download, clear, and English/Bisaya controls without adding log buttons to modals.

- Logs are local and bounded to 200 events and 64 KiB under `mangoleaf-diagnostics-v1`.

  - Persistence is debounced and best effort; memory-only operation remains available when browser storage fails.
  - Logs exclude photos, diagnosis results, report identifiers, credentials, raw messages, and URLs.
  - Previously saved events can be inspected after a reload, but a freeze/crash can prevent recent entries from saving.
  - The recorder helps investigate failures and does not establish that the reported phone stalls are repaired.

- New scan reports retain the raw highest-class probability.

  - Confidence badges round the percentage down to at most one decimal and omit a trailing `.0`, for example `62%`, `62.1%`, `69.8%`, and `70%`.
  - Both accepted and Uncertain results show confidence.
  - The raw 0.70 acceptance comparison remains unchanged, and older rounded reports retain their saved values.
  - The existing forced 16-bit WebGL preference is included and documented accurately; V4.5.0 weights, class order, preprocessing, calibration, and model-cache identity are unchanged.
  - There is no new model label or scientific evaluation result.

- The bilingual Privacy Policy discloses optional local logs and export handling; Terms explain raw/new versus previously rounded History scores.

  - Current architecture, setup, performance, incident collection, and test instructions are aligned.
  - Earlier runs remain historical evidence for their original source fingerprints.
  - The [v0.7.0 testing record](../../testing/TESTING.md#v070-diagnostics-and-raw-confidence-october-17-2026) records actual local results and pending commit-specific CI; R03 remains a separate explicit protocol.

- Final local checks passed: formatting, typecheck, lint, production build, export/security checks, 59 tooling tests after the scanner follow-up, 250 core browser cases with 10 declared platform skips, and filtered R01 with 240 actual predictions.

  - R01 found stable labels/classes, zero confidence variation, and zero net tensor growth in the identified software-rendered browser session.
  - Application fingerprint: `9d57a97c29ccfb15df4d67fc5bf86aa15bed29edfbb889a7d27292461e4b9ce8`.
  - All five model assets match the baseline and production export.
  - Remote CI, device observations, and promotion retain their own evidence requirements.

#### v0.7.0 commit and tag text

- **Regular commit subject:** `feat: prepare v0.7.0 diagnostics and raw scores`

- **Pre-push follow-up subject:** `fix: scope diagnostics scanner exceptions`.

  - The first push was blocked by three reviewed non-secret storage-name findings in `88a479d`.
  - Exact historical fingerprints and a regression preserve secret detection in those files.
  - This follow-up does not change the application fingerprint or model; the unpublished local candidate tag must identify the final checked commit containing both changes.

- **App tag:** `v0.7.0`

- **Release title / annotated-tag subject:** `MangoLeaf AI v0.7.0 - Local diagnostics and raw confidence`

- **Release description draft:**

> Adds optional technical logs in About with local retention, copy/download/clear controls, and English/Bisaya guidance. Recording defaults off and keeps recent diagnostic events separate from scan reports and photos.
>
> Preserves raw confidence for new scan reports. Accepted and Uncertain results display up to one decimal rounded down, hiding unnecessary `.0`, while the 70% confidence-only rejection rule remains unchanged. Existing History keeps its previously saved precision.
>
> Retains the V4.5.0 model and current forced 16-bit WebGL preference. Updates privacy, score explanations, architecture, performance, incident collection, and automated regression coverage. Validation results belong to the exact tested commit and do not establish field accuracy or a repair for every phone/browser stall.

- The maintainer requested a normal `master` push, with agent work ending after that push.

  - The maintainer handles the CI outcome, `git push origin v0.7.0`, and manual Vercel promotion.
  - Push the branch without `--follow-tags`.
  - A local annotated candidate tag can identify the final locally tested commit; it remains unpublished and does not establish CI or release approval.
  - Complete the required checks before publishing it or promoting the staged deployment.
  - On October 17 the maintainer confirmed **Auto-assign Custom Production Domains is disabled**, so the branch push is intended to prepare a staged deployment.
  - Record final commit/run/deployment identities after they exist; do not treat this planned procedure as completed CI, tag publication, or production promotion.

### October 18, 2026: v0.7.0 scanner follow-up and branch handoff

- **Follow-up commit:** `116e462` (`fix: scope diagnostics scanner exceptions`) follows feature commit `88a479d`. It scopes the three reviewed non-secret storage-name exceptions to exact historical scanner fingerprints and adds a credential-detection regression.
- **Local evidence:** the [October 18 follow-up in the final validation record](../../testing/TESTING.md#final-local-v070-validation) records 59 tooling tests with 154 assertions, including seven security cases, plus the full-history scan and typecheck/lint/build checks. Application/model inputs did not change; the existing 250-case core and 240-prediction R01 results keep their original identities.
- **Branch handoff:** `master` was pushed at `116e462`; a local annotated `v0.7.0` candidate tag was prepared for the maintainer. App `0.7.0` and model `v4.5.0` remain unchanged.
- **Status boundary:** remote CI, tag publication, and production deployment are unverified in this documentation pass. The maintainer handles CI review, tag publication, and manual Vercel promotion; a branch push does not establish those outcomes.

### v0.8.0: square camera prepared release (October 19, 2026)

- **Status: candidate / not released or deployed by this preparation.** The maintainer selected app `0.8.0` for the square guided-camera workflow. Final candidate commit and deployment identities remain to be recorded. The earlier `0.7.0` records retain their original evidence and publication limits.

- The live camera preview is a centered square, bounded between 280 and 360 CSS pixels per side. The dialog scrolls when the available height is short. Four green corner guides are 36 CSS pixels long and 4 CSS pixels thick, with 16 CSS pixel rounding matching the preview. Compact spacing removes the former flexible gaps around the preview.

  - Capture draws the matching centered square from the actual video frame directly into the existing canvas, then encodes one JPEG. This is a capture-time crop, not continuous image processing.
  - Review Photo and the ordinary diagnosis flow receive that square image. English and Bisaya guidance explain that the captured area matches the preview.
  - Camera permissions, readiness, background/pause recovery, Retake, cancellation, and stream cleanup remain part of the existing workflow. Gallery upload keeps its existing image handling.

- **Adopted model: V4.5.0, unchanged.** The release retains its five model assets, seven-class mapping, calibration, confidence-only 0.70 gate, classifier preprocessing, WebGL preference, and model-cache identity. The changed camera crop changes the captured image content; it does not establish improved diagnostic accuracy or fix the separately reported phone inference stall.

  - The maintainer's uncommitted V5 runtime trial remains separate. Exclude its model files, model-label override in `src/lib/constants.ts`, and model-cache override in `src/sw.ts` from this app release.
  - Generate `public/sw.js` from the exact candidate source with the adopted V4.5.0 assets. The local V5-generated worker is not release evidence. Verify all five exported model hashes against the committed V4.5.0 baseline before staging the candidate worker.

- **Candidate identity:** the isolated `0.8.0` / V4.5.0 source is based on `7e08ec7ec7c00e1131e5ec877eb4c69c02958296`, with application fingerprint `3cd772b1226b1ea156db81e77cf25c6da21c8170757cb82cc2b020bc535fa3c2`. It is uncommitted preparation, not a new branch handoff. Earlier V5 and camera checks retain their original source/version/model identities.

- **Local validation:** final formatting, typecheck, lint, production build, tracked-file and full-history security checks, 59 tooling tests with 154 assertions, and 10 export checks passed. All five exported model files match the committed V4.5.0 hashes. The [testing guide](../../testing/TESTING.md#v080-square-camera-release-candidate-october-19-2026) records the detailed evidence and remaining checks.

  - The initial full core run took 34.1 minutes and reported 248 passes, 10 declared platform skips, and six failures. C05 needed a narrow subpixel viewport tolerance; I04/I06 needed the existing 90-second startup allowance for their first readiness assertion because recorded Firefox GPU warmup took longer than their former 15-second UI assertion budget. Later interaction assertions retain their normal budget. These repairs changed tests only, not application behavior or model inputs.
  - The focused C05/I04/I06 rerun across four browser projects passed all 16 cases in 2.8 minutes. Together, the initial run and focused repairs cover 254 passing core cases and 10 declared platform skips. This is combined evidence, not a claim that a second full core command passed.
  - R01 passed 240 actual predictions across eight photos, 30 predictions per photo. Classes and acceptance decisions remained stable, with maximum confidence range 0 and maximum tensor growth 0. The recorded runtime was Chromium `153.0.8010.12`, TensorFlow.js `4.22.0`, WebGL with forced 16-bit textures, and ANGLE SwiftShader. This repeatability evidence does not establish physical-phone speed or field accuracy. The separate 30-minute R03 session remains pending at the maintainer's direction.
  - The source handoff selects 16 approved source, test, package, and documentation paths plus the normal build-generated V4.5.0 worker for the exact base commit. It excludes the five local V5 model files and both model-label/cache overrides. Its ignored manifest records replay and hash-verification evidence; this scope description does not claim a replay result. A source patch is not a deployable export.

  - Final-commit CI, current Vercel dashboard confirmation, physical-device evidence, exact-deployment promotion, live-version verification, and public tag/release publication remain pending or unverified in this preparation.
  - Use the [physical-device checklist](../../testing/PHYSICAL_RELIABILITY_CHECKLIST.md) to record the actual camera, orientation, background/resume, offline, and stored-photo behavior. Physical testing remains part of the release validation process.
  - Tag the exact approved tested commit after the [release procedure](#candidate-testing-and-promotion); do not tag a local V5 build or infer deployment from a GitHub Release.

#### v0.8.0 prepared commit, tag, and release text

- **Commit subject:** `feat: prepare v0.8.0 square camera`
- **App tag:** `v0.8.0`
- **Release title / annotated-tag subject:** `MangoLeaf AI v0.8.0 - Square guided camera`
- **Annotated-tag message draft:**

> MangoLeaf AI v0.8.0 - Square guided camera
>
> Adds a bounded square camera preview with matching capture and rounded green corner guides. Retains the adopted V4.5.0 model. This tag must identify the exact commit approved through the recorded release checks.

- **GitHub release description draft:**

> Take Photo uses a square preview with clearer rounded green corner guides and compact spacing. The preview stays between 280 and 360 CSS pixels per side, and short screens can scroll to the controls. Captured photos match the visible square before Review Photo and diagnosis; English and Bisaya guidance explain the framing.
>
> Retains camera recovery, Retake, stream cleanup, gallery upload, local-only History, and offline treatment-guideline access. The adopted V4.5.0 model and 70% confidence-only gate remain unchanged. V5.0.0 stays a separate local experiment and is not included in this app release.
>
> Local candidate checks passed for formatting, types, lint, production build, security, 59 tooling tests, and 10 export checks. All five model assets match the adopted V4.5.0 baseline. Core browser coverage combines 248 initial passes with a successful 16-case focused rerun after narrow test repairs, covering 254 passing cases and 10 declared platform skips; the initial six failures remain recorded. No second full-suite pass is claimed. R01 passed 240 actual predictions with stable classes and acceptance decisions, zero confidence variation, and zero tensor growth in the recorded software-rendered Chromium session. These checks do not establish field accuracy or physical-phone performance.
>
> Release status remains candidate preparation. The separate R03 session, physical-device evidence, final-commit CI, dashboard confirmation, approval, promotion, live-version verification, and tag/release publication remain pending. This draft does not claim they have completed.

- The maintainer selected file and release-text preparation only. No staging, commit, push, local tag, tag publication, GitHub Release, or production promotion is included in this task. The proposed text does not authorize those later actions. Do not move an existing published tag; verify that `v0.8.0` is available before creating it.

## Candidate testing and promotion

- Added September 20, 2026.

  - Preparing an intended version is separate from publishing it.
  - Commit candidate code, matching version labels, and affected documentation together after local checks.
  - Mark new entries **candidate / not released** until their release decision is made.
  - Do not write that CI, physical-device testing, or deployment passed before it happened.
  - App and model labels remain independent; tooling-only changes do not require a new model label.

1. Finalize candidate source/model files and intended version labels. A model label must identify the files actually included in that candidate. Keep the currently deployed baseline explicitly distinguished in documentation.
2. Run `bun run format`, then `bun run typecheck`, `bun run lint`, and `bun run build` in that order. Run core E2E and applicable reliability checks from [TESTING.md](../../testing/TESTING.md). A new model also needs accuracy/OOD evaluation.
3. Commit and push the candidate. Husky handles staged formatting and pre-push checks; repeat affected checks/builds if formatting or another edit changes the tested source.
4. Wait for CI on that `master` commit. For manual approval, configure Vercel **Settings > Environments > Production > Branch Tracking**, keep `master`, and disable **Auto-assign Custom Production Domains**. Documentation does not change this dashboard setting; confirm it before relying on staged deployment behavior.
5. Complete the approved validation scope against the exact candidate. Record commit, deployment URL, app/model versions, model hashes, and actual results. When physical-device evaluation is in scope, use the same checklist and confirm the intended worker/model loaded instead of an older cache. Staged Production uses Production environment variables and is not an isolated database.
6. After required checks and review pass, manually promote that exact deployment, verify its live version, and publish the tag/release for its tested commit. Staged promotion reuses the build. Creating a GitHub Release does not deploy the app or gate Vercel.

- Multiple attempts can share an intended unreleased version; distinguish them by commit ID and build/model hashes.

  - If code, model files, labels, or build settings change, rebuild and repeat affected checks.
  - A failed candidate receives fixes and another evaluation; do not move a published release tag to hide it.
  - Add final evidence/release status as a subsequent documentation entry rather than rewriting historical measurements or moving the tested tag to a later docs-only commit.

- Reference: [Vercel staged production promotion](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).

## Creating a GitHub Release

- Prepare version labels, review and commit the intended files, and finish the candidate testing and promotion procedure above before tagging.

  - Only app tags get a GitHub Release in this project; model tags are provenance markers.

- Replace `vX.Y.Z` with the approved app version and `TESTED_COMMIT_SHA` with the full commit ID from the completed evidence record.

  - Do not reuse an existing published tag:

```bash
git tag -a vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf AI vX.Y.Z"
git push origin vX.Y.Z
```

- Then open GitHub:

1. Go to the repository.
2. Open **Releases**.
3. Choose **Draft a new release**.
4. Select the pushed tag.
5. Add a short title and release notes.
6. Publish the release.

- If the release adopts a new model, also create its provenance tag on the tested commit that contains those exact assets.

  - For a model-only milestone, create only this tag; do not publish a separate GitHub Release.
  - Replace both placeholders before running:

```bash
git tag -a model-vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf model-vX.Y.Z"
git push origin model-vX.Y.Z
```

- Do not attach large raw datasets to GitHub Releases unless the dataset license and file size are appropriate.

  - Keep release notes focused on what changed, what was tested, and what should be treated as the current baseline.

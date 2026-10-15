# MangoLeaf AI PWA Versioning Guide

This guide explains the PWA version: the application interface, local/offline behavior, release history, build labels, and deployment procedure. The PWA is the app people use. The separate [AI model versioning guide](AI_MODEL_VERSIONING.md) explains the model weights, training workflows, fitted rejection settings, and model evidence.

**Current repository preparation:** PWA `0.6.1` is the prepared score-display patch, retaining adopted model V4.5.0 (`v4.5.0`) and confidence >=0.70 only. Margin and entropy gates are disabled. The [v0.6.1 release record](#v061-uncertain-result-scores-prepared-release-october-16-2026) identifies the candidate separately from the preserved [v0.6.0 preparation](#v060-local-history-and-v450-prepared-release-october-16-2026). Final-commit CI and production promotion remain separate; earlier validation and publication records retain their original identities.

## Reading the release history

### Local development changes, October 9, 2026

The current working tree adds a full-screen guided camera preview with framing advice, capture, photo review, and retake. It also replaces the Home recent-scan section and desktop History/Scan actions at 768px and wider with an Install prompt and installation guide. Phone scanning and History remain available. The guide chooses iOS/Android instructions from device identity, separately from responsive layout and browser-native install-event support; its desktop QR opens `https://mangoleafai.vercel.app/?install=1`.

The maintainer tested the V4.4.0 candidate locally and then requested restoration of V4.3.0. The model assets and display label are restored, with cleanup of the temporary candidate cache. See the [model rollback record](AI_MODEL_VERSIONING.md#v440-local-test-completed-v430-restored-october-9-2026), [camera architecture](../ARCHITECTURE.md#guided-camera-capture), and [development progress](../PROGRESS.md#october-9-2026).

These are local changes under the existing `0.5.4` label. The October 7 prepared-release checks describe their original source fingerprint and do not validate this later working tree. No new release version, tag, publication, or production promotion is recorded here. A future release must identify and validate its final source/build, including the applicable browser and physical-device checks.

**Dependency security, October 3, 2026:** The local `0.5.0` candidate now selects Next.js and its ESLint configuration `16.3.6`, overrides Browserslist to `4.28.7`, and records compatible transitive security patches in `bun.lock`. App/model labels remain `0.5.0` / `v4.3.0`. The [dependency review](../security/DEPENDENCY_SECURITY.md) records a clean production-dependency audit and one unresolved development-only `braces` advisory. Earlier candidate validation remains tied to its original dependency snapshot; new checks and remote release status are recorded separately.

The records below retain earlier app changes and their original status at the time of preparation. Historical references to V3 or an earlier candidate describe those entries' dates. Candidate labels do not change automatically when a build is deployed; the dated confirmation below corrects the current overview without rewriting original validation records. Use recorded commits, tags, deployment identities, and completed evidence to identify an exact build. This documentation split does not change either version label.

## Release status confirmation (October 7, 2026)

The maintainer confirmed that `v0.5.0`, `v0.5.1`, `v0.5.2`, and `v0.5.3` were published and used, and that users are currently using live `v0.5.3`. The current release list therefore marks those versions as released. Their original candidate sections, anchors, pending-status wording, and measured evidence remain dated preparation history rather than the current production status.

This is a reported release/deployment confirmation. It does not supply historical deployment timestamps, independently verify remote CI or production behavior, or turn earlier local tests into production evaluation. Local `v0.5.3` and HEAD identify baseline commit `7899fd81e83256c695246dbc733bfcce0155f69f`; that source identity is separate from the reported production state. The prepared `v0.5.4` release awaits CI and production promotion.

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
v0.5.0  released: guest-owned private cloud synchronization and preserved offline History
v0.5.1  released: stable scan thumbnails and a horizontal treatment-guidelines header
v0.5.2  released: responsive scan History, selection, and confirmed deletion
v0.5.3  released / reported live: protected guideline HTTP/Realtime updates and offline advice
v0.5.4  prepared / awaiting CI and production promotion: skip unchanged HTTP guidance writes while preserving update ordering
v0.5.5  prepared release: guided camera capture, installation guidance, and responsive History refinements
v0.6.0  prepared release: V4.5.0 confidence-only model and local-only History with storage-full recovery
v0.6.1  prepared patch: uncertain result scores and bilingual Terms clarification; same V4.5.0 model
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

## v0.5.2: scan History and deletion candidate (October 6, 2026)

**Status: candidate / not released.** App `0.5.2` is a patch within the existing minor line, following the project's precedent for interface refinements and additions. The app label comes from `package.json` through the existing build configuration. Model `v4.3.0`, its five assets, seven classes, preprocessing, temperature, and rejection settings remain unchanged. No new model tag is required.

### Changes included

- Show one recent scan on Home below 768px and up to four at larger widths. History uses five compact thumbnail rows per page below 768px and six photo cards per page at larger widths. Resizing preserves the first scan's position as closely as the new page size allows; deletion returns to a valid page.
- Add individual selection and Select all for the current matching History results across every page. Search/filter changes clear selection, and newly arriving scans require another deliberate selection action.
- Use the same English/Bisaya confirmation dialog for a card's trash action and selected-report deletion. Keep the confirmed report IDs fixed, wait for local deletion to finish, and keep the dialog available for retry after a failure. Linked cloud rows/photos use the existing deletion queue, including offline retries.
- Count each condition among the current search matches before category filtering or pagination. Typing or clearing search resets the category to All, closes the phone filter panel, and returns to page one.
- Compact the scan-sheet photo tips, keep Cancel visible while the content scrolls, and constrain the desktop sheet width. Refine History badges, shared search/filter/delete/navigation icons, the scan-step icon, and About timeline numbers.
- Clarify the [treatment-review publication dates and snapshot scope](../treatment-guidelines/TREATMENT-GUIDELINES-REVIEW-2026-10-02.md#source-dates-and-review-scope--2026-10-06-clarification). This documentation clarification does not apply the proposed guidance to Supabase.

### Validation and publication

The approved local scope is formatting, lint, typecheck, the production build, tooling/security/export checks, the core browser suite, and R01 repeatability. The 30-minute R03 session is excluded from this candidate's scope. Results for this versioned build are recorded in [v0.5.2 candidate validation](../testing/TESTING.md#v052-candidate-validation-october-6-2026), separately from the earlier v0.5.1 evidence.

Browser cases now use viewport-specific counts, singular/plural Home headings, accessible per-scan Details names, and explicit deletion confirmation. Coverage preserves thumbnail stability, pending-upload deletion races, offline reports, and private cloud cleanup. The new F17 case checks a report arriving after confirmation, a failed local deletion followed by retry, and offline batch cleanup after reconnection. The [testing guide](../testing/TESTING.md) records actual outcomes. Husky and the existing master-only CI workflow already run their applicable gates and need no pipeline changes for this interface update. R03 locators were maintained without running its excluded session.

**Local validation passed:** All 86 core browser cases, R01's 240 actual predictions, 14 tooling cases, 10 export checks, formatting, security, lint, typecheck, and production build passed for this candidate's source fingerprint. The linked validation record preserves scope, report identities, and evidence limits.

Remaining release gates follow the [candidate testing and promotion procedure](#candidate-testing-and-promotion): CI on the final `master` commit, confirmation of Vercel's manual-promotion setting, promotion of the tested deployment, live-version verification, and the app tag/Release on that tested commit. Remote publication and deployment remain pending.

**Verified baseline:** Local tag `v0.5.1` identifies commit `df038db8b63d2da101b25ab9358fe35f409ac7c1`. A separate read-only GitHub check on October 6 confirmed that [v0.5.1 is published](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.5.1); this does not verify its production deployment or rewrite the October 5 candidate record. Candidate `0.5.2` starts from `8f8004225e6944182b6f118ffc108c6284d25707` plus the October 6 working-tree changes. Its tested application fingerprint and local outcomes are in the [validation record](../testing/TESTING.md#v052-candidate-validation-october-6-2026). Record the final candidate commit and deployment URL before promotion.

### Prepared commit message

```text
feat: refine History for PWA v0.5.2
```

### Prepared tag and release description

**App tag:** `v0.5.2`

**Release title:** `MangoLeaf AI v0.5.2 — Scan History and deletion`

> Shows one recent scan on phones and up to four on larger screens. History uses compact phone rows with five reports per page and larger cards with six per page.
>
> Adds report selection across History pages and a shared confirmation for single or bulk deletion. Filter options show matching counts, and changing search resets the filter. The scan sheet has compact photo tips and keeps Cancel visible while scrolling.
>
> Refines badges and navigation icons. The AI model remains V4.3.0 Combined, with unchanged model files and rejection settings.

Local validation is complete for the recorded working-tree source; final-commit CI, production verification, and publication remain pending. The prepared text does not create a tag, publish a Release, or deploy the app.

## Unreleased guideline synchronization fix (October 7, 2026)

The working tree adds protection against an older full HTTP guidance response replacing an overlapping Realtime update. Ordinary Realtime INSERT/UPDATE/DELETE events still save directly without another GET for that event. Changes observed during unfinished HTTP work invalidate its snapshot and share a protected follow-up download; the commit also checks for changes saved by another tab. Guideline REST reads bypass service-worker caches, while IndexedDB keeps offline advice.

At initial implementation, the working-tree package label remained `0.5.2` and the model remained `v4.3.0`. The existing local `v0.5.2` tag belongs to the earlier source and excludes this fix. The subsequent [v0.5.3 candidate](#v053-guideline-update-ordering-candidate-october-7-2026) gives the change its own app version without moving that tag. The model files, treatment text, and Supabase schema are unchanged.

The October 6 checks above describe their original fingerprint. The [initial guideline-ordering validation](../testing/TESTING.md#guideline-update-ordering-october-7-2026) preserves the pre-version-bump fingerprint; the candidate below has separate versioned validation.

## v0.5.3: guideline update ordering candidate (October 7, 2026)

**Status: candidate / not released.** App `0.5.3` is a patch for guideline synchronization and service-worker HTTP caching. Its displayed version comes from `package.json` through the existing build configuration. Model `v4.3.0`, its five assets, seven classes, preprocessing, folded temperature, and fitted rejection settings remain unchanged.

### Changes included

- Keep ordinary Realtime INSERT/UPDATE/DELETE changes writing directly to IndexedDB. An event observed during an unfinished guidance download/save prevents that older HTTP snapshot from replacing the received advice and schedules a protected follow-up GET.
- Share active downloads, combine repeated overlap notifications, order local writes, and compare the saved starting snapshot inside the final transaction. Changes saved by another tab can invalidate an older result; a late observed event rolls back the unfinished snapshot save.
- Reconcile after subscription readiness, invalidate stale work during offline/unmount cleanup, and retain saved advice after failed requests while using the existing retries.
- Make guideline REST reads network-only in the worker and remove older cached guideline HTTP responses. IndexedDB remains the offline advice store.
- Add guideline-ordering unit and browser regressions and maintain the loading fixtures. Update release, architecture, synchronization, performance, testing, setup, and plain-English Q&A references.

This protects changes observed during overlapping client work. It does not establish a live production incident or a universal ordering guarantee for delayed or unseen server events. No treatment wording or Supabase schema/policy is changed.

### Validation and publication

The versioned scope is formatting/security, TypeScript, lint, production build, export verification, tooling tests, the complete core browser suite, and R01 actual-inference repeatability. R03 is excluded. Results belong in [v0.5.3 candidate validation](../testing/TESTING.md#v053-candidate-validation-october-7-2026), separately from the earlier `0.5.2` implementation fingerprint.

The existing local `v0.5.2` tag identifies baseline commit `ee91cf693fd52acb6f882f2c049a3b2ddd599a1f`. Candidate `0.5.3` starts from that commit plus the working-tree guideline fix and version preparation. Its tested application fingerprint is `b116df9958424036c66d80fb151e8ec44bf4a07838b73022e17f2bb47dd5a661`. Local versioned validation passed formatting/security, typecheck, lint, production build, 10 export checks, 26 tooling cases, 106 core browser cases with one declared Firefox worker skip, and R01's 240 actual predictions. The testing record preserves report and model hashes. Record the final candidate commit and deployment URL before promotion. Final-commit CI, staged-production verification/promotion, and publication remain separate release steps. Husky and master-only CI already run their applicable checks; the expanded core suite is selected through `playwright.config.ts`.

### Prepared commit message

```text
fix: preserve guideline updates for PWA v0.5.3

Prevent older HTTP snapshots from replacing advice received through
Realtime. Keep offline advice and protect changes from other tabs.
```

### Prepared tag and release description

**App tag:** `v0.5.3`

**Release title:** `MangoLeaf AI v0.5.3 — Reliable guideline updates`

> Prevents an older guideline download from replacing an update already received through Realtime. Normal Realtime updates continue to save directly, while overlapping changes share a protected follow-up download.
>
> Keeps downloaded advice available offline, protects changes made by another open tab, and removes stale guideline HTTP caches.
>
> The AI model remains V4.3.0 Combined, with unchanged model files and diagnosis settings.

The tag and notes are prepared text. Create the app tag on the exact tested commit after the candidate release procedure passes; no new model tag is needed. Publication and deployment are not established by preparing these files.

## v0.5.4: unchanged guidance check prepared release (October 7, 2026)

**Status: prepared release / awaiting CI and production promotion.** App `0.5.4` is a patch following the reported live `0.5.3` version. Its displayed version comes from `package.json` through the existing build configuration. Model `v4.3.0`, its five assets, seven classes, preprocessing, folded temperature, and fitted rejection settings remain unchanged. No new model tag is needed.

### Changes included

- Compare a valid full HTTP guidance response with the current IndexedDB guidance set inside the existing save transaction. Reuse `sameGuidelineSnapshot` to compare every ID, disease name, English field, and Bisaya field. Ignore row order; additions and deletions still count as differences.
- Run the event-counter and starting-snapshot protections before the unchanged-content check. A result affected by a Realtime event, another tab, or invalidated work must still be discarded and follow existing recovery behavior.
- Finish identical downloads successfully without calling `clear()` or `bulkPut()`. Saved advice and its current display remain available; an unchanged response is not an error and does not trigger a retry solely because its content matches.
- Save a different valid complete set through the existing atomic replacement. This retains reconciliation of changes missed offline, including removed rows.
- Keep direct Realtime INSERT/UPDATE/DELETE handling, the guarded follow-up GET, failed-download recovery, and network-only guideline HTTP reads unchanged. HTTP still downloads the complete set before comparing it; this is a local-write optimization, not a server-version protocol or download-elimination change.
- Add regression coverage for identical content, reordered rows, changed fields, additions/deletions, and overlap protection. Update affected guides and the ignored technical Q&A.

The check does not change the Supabase schema, treatment wording, guest identity, private scan synchronization, or model behavior. Avoided writes are established by the code and applicable checks; no measured phone speed, heat, battery, or memory gain is claimed.

### Validation and identity

The approved scope is formatting/security, TypeScript, lint, production build, export verification, tooling tests, the complete core browser suite, and filtered R01 actual inference. The 30-minute R03 session is excluded. Use [v0.5.4 prepared release validation](../testing/TESTING.md#v054-release-validation-october-7-2026) for this build's results and application fingerprint. The earlier `v0.5.3` reports retain their original identity and do not certify this changed build.

**Baseline:** Local HEAD and tag `v0.5.3` identify `7899fd81e83256c695246dbc733bfcce0155f69f`. App `0.5.4` starts from that commit plus the checker, version, test, and documentation changes. Local validation passed formatting/security, TypeScript, lint, production build, 10 export checks, 28 tooling cases with 98 assertions, all 32 focused guideline cases, and 118 core browser cases. Both browser runs include one declared Firefox worker-test skip and zero unexpected failures. Filtered R01 passed 240 actual predictions with stable per-photo results and zero net tensor growth. Tested application fingerprint is `c519472be5cc4335fbcd8e0dfca0e705ca88b6d9a6cb66f33bc657516f0074d7`; the testing record preserves report hashes and unchanged model hashes. Final-commit CI, staged-production verification/promotion, live-version confirmation, and `v0.5.4` publication remain separate release steps. Husky and the existing master-only CI already select the applicable checks; no hook or workflow expansion is required solely for this checker.

### Prepared commit message

```text
perf: skip unchanged guidance for PWA v0.5.4

Avoid clearing and rewriting identical HTTP guidance while preserving
Realtime ordering and changes saved by another tab.
```

### Prepared tag and release notes

**App tag:** `v0.5.4`

**Release title:** `MangoLeaf AI v0.5.4 — Skip unchanged guideline saves`

> Checks a successful guidance download against the advice already saved on the device. Identical records and English/Bisaya text finish successfully without replacing the local copy; changed, added, or removed guidance still updates offline storage.
>
> Preserves HTTP/Realtime overlap protection, direct Realtime updates, and advice after failed downloads. HTTP still retrieves the complete guidance set. The V4.3.0 Combined model and diagnosis settings remain unchanged.

The tag and notes are prepared text. Create the app tag on the exact tested commit after the release procedure passes. Preparing files does not create a commit, tag, GitHub Release, or production deployment.

## v0.5.5: guided camera and installation prepared release (October 10, 2026)

**Status: prepared release / publication and production promotion pending.** The maintainer selected app `0.5.5` as the next PWA release. Its displayed label comes from `package.json` through the existing build configuration. The model remains `v4.3.0`; its five assets, seven-class order, full-photo 224 × 224 preprocessing, folded temperature, and fitted rejection settings remain unchanged. No new model tag is required. This release selection does not establish completed deployment or evaluation.

### Changes included

- Replace the camera file-picker handoff with an in-app live preview and framing advice. The square guide occupies 75% of the displayed camera image's shorter side; it helps the user frame the whole leaf or fruit and does not crop the captured photo. Capture preserves the complete available frame, then opens photo review. Diagnosis starts only when the user selects Run Diagnosis; Retake reopens the camera or the previously used gallery picker.
- Release camera tracks after capture, close, backgrounding, and unmount. Cancel stale permission and encoding results, require a ready frame before capture, and provide localized recovery for unsupported access, permission denial, unavailable hardware, interrupted streams, and capture errors. Returning from the background requires an explicit restart. The browser decides the actual camera resolution from the requested preferences.
- Add an accessible installation guide with iOS/Android instructions selected from device identity, native installation only after an explicit supported button press, keyboard focus containment, and focus restoration. At 768px and wider, Home and navigation emphasize phone installation instead of scan entry points. The desktop QR opens `https://mangoleafai.vercel.app/?install=1`; this flag opens guidance rather than automatically installing the app.
- Show four History records per page on narrow screens and six at the desktop breakpoint. Put the mobile selected-photo delete action above pagination. Reserve thumbnail space from its width to avoid flex/aspect-ratio sizing problems in older Safari. Existing confirmation, local deletion, synchronization, and model-aware duplicate reuse remain in place.
- Match a newly saved result to the selected photo hash and active model before opening it. Full class probabilities remain technical diagnostics in DevTools and test reports; they are not presented as measured accuracy or exposed in the result modal.
- Extend guided-camera and installation browser coverage. Align the R03 mixed-use protocol with camera/gallery review, retake, track cleanup, and actual inference; keep the core suite in the master-only GitHub workflow and use the pinned Playwright CLI through Node. The 30-minute R03 case was not executed during this preparation.
- Preserve the completed V4.4.0 experimental notebooks, selected scientific figures, result artifacts, and source provenance after local testing and restoration of V4.3.0. Update architecture, performance, setup, testing, release guidance, the V4.3.0 split table, and the local technical Q&A. V4.4.0 remains an experimental model rather than the model shipped by this release.

The camera guide does not change model input cropping or rejection gates. Diagnosis and saved History remain local-first; the temporary model-size image is not the stored scan photo. These changes do not alter the Supabase schema, cloud ownership rules, treatment advice, or model-training results.

### Validation and identity

**Baseline:** Local HEAD and app tag `v0.5.4` both identify `341a065c0288e196578b970a6e5ac402915ed417`. The prepared `0.5.5` build includes subsequent source, test, version, and documentation changes. October 7 and October 9 results retain their original source fingerprints and do not certify the versioned `0.5.5` build.

The [v0.5.5 validation record](../testing/TESTING.md#v055-release-validation-october-10-2026) records this release's actual local checks, final application fingerprint, report identities, and unchanged model hashes. Local formatting/security, TypeScript, lint, production build, all 10 export checks, 28 tooling cases, 187 core browser cases with four declared skips, and filtered R01 with 240 actual predictions passed against the final versioned build. Lint retains one existing unused-import warning; no earlier pass is counted as a new result. The approved preparation scope excludes executing R03, including a shortened session. Camera hardware, installed iOS/Android behavior, OS/browser versions, and background behavior require their own recorded evidence in the [physical-device checklist](../testing/PHYSICAL_RELIABILITY_CHECKLIST.md).

The release commit, remote CI, staged deployment identity, production-domain setting, applicable device evidence, approved promotion, live-version confirmation, and tag/Release publication remain separately recorded release steps. Preparing these files does not create a commit, tag, GitHub Release, or production deployment.

### Prepared tag and release description

**App tag:** `v0.5.5`

**Release title:** `MangoLeaf AI v0.5.5 — Guided camera and installation`

**Release description:**

> Adds an in-app camera preview with framing guidance, full-frame capture, photo review, and retake. Camera access ends after capture, close, or backgrounding, with clear recovery instructions when access fails. Diagnosis still starts only after the user selects Run Diagnosis.
>
> Adds English/Bisaya installation guidance for Android and iOS, an optional native install action where supported, and a desktop QR that opens the phone guide. Wider layouts emphasize installation while phone layouts retain scanning and History.
>
> Refines History with four photos per mobile page, six at the desktop breakpoint, a selected-photo delete action above mobile pagination, and reserved thumbnail space for older Safari. Newly saved results are matched to their photo and active model. Full class probabilities stay in technical diagnostics.
>
> Updates camera and installation regression coverage, the mixed-use reliability protocol, master-only CI, and project documentation. Preserves the completed V4.4.0 experiment and its evidence after local testing; the application retains V4.3.0 Combined with unchanged weights, classes, preprocessing, temperature, and rejection settings.
>
> Applies the Next.js 16.3.8 security patch, compatible Sharp/source-map-js repairs, and disables the unused development MCP endpoint. Repairs controlled camera tests and modal focus containment, with runtime and camera diagnostics in CI. Remaining dependency findings stay documented.

Use the exact approved, tested commit when creating the tag through the procedure below. Add the completed validation and deployment identity to the published record; the prepared description does not assert that publication, deployment, or physical-device evaluation has already occurred.

### Next.js security follow-up (October 10, 2026)

The maintainer committed the prepared release at `5cad2ff15efa66d045642432c34b8846dcaabcfc`. A later authenticated GitHub MCP review identified six root Next.js alerts, all fixed in `16.3.8`. The subsequent local changes pin both Next.js and its ESLint configuration to that version, repair compatible Sharp and source-map-js dependencies, and disable the unused development MCP endpoint for the public-tunnel workflow.

App/model labels remain `0.5.5` / `v4.3.0`; no existing tag is moved. The [security review](../security/DEPENDENCY_SECURITY.md) keeps the two unpatchable braces/sprintf-js findings visible. The earlier release validation above belongs to its original dependency/configuration fingerprint. The [security revalidation record](../testing/TESTING.md#nextjs-security-revalidation-october-10-2026) identifies this revision's new checks and reports. Camera follow-up also fixes the controlled media capability, restores escaped modal focus to an enabled action, and gives the complete CI job 45 minutes for setup/build/core checks. R03 remains a separate 30-minute protocol and is excluded from CI and this task. Local verification passed 187 core cases with four declared skips, filtered R01's 240 actual predictions, and the formatting/security/type/lint/build/export/tooling/archive checks. The new reports identify application fingerprint `2ccdfaede198d91f39c4aa5ca65eabae85869382edcad9fffef3a0feb2127f7d`; the corrected Linux CI result remains pending. GitHub alert re-evaluation and production deployment require the corresponding reviewed changes to be published through the release procedure.

## v0.6.0: local History and V4.5.0 prepared release (October 16, 2026)

**Status: prepared / not released or deployed.** The maintainer selected PWA `0.6.0` for the combined update. The original unpublished draft `d532fc8` contained the model adoption and local-only History under the earlier `0.5.5` app label. The version correction changes `package.json` to `0.6.0`; the existing Next.js `env` configuration embeds `v0.6.0` in the rebuilt footer. No environment override or second app-version constant is needed. The maintainer selected amending that unpublished draft to include the corrected version and documentation; amending changes its commit ID. Original validation reports retain their recorded base commit and input hashes.

During this correction, the local `v0.6.0` tag was observed pointing to `d532fc8`, whose package still says `0.5.5`. The maintainer confirmed that the commit/tag had not been pushed and authorized repointing this unpublished local tag to the amended commit. This local consolidation does not push, publish, or deploy anything. Complete final-commit CI and approved release checks before publishing the tag/release. Published tags must never be moved.

The release combines the already implemented V4.5.0 confidence-only model, browser-local scan reports/photos, bilingual storage-full recovery, diagnosis recovery, supported WebGL precision selection, guided camera/installation workflows, and selected V2 walkthrough. Supabase supplies public guideline HTTP downloads and Realtime updates only. The version correction itself changes no application source, database schema, prediction rules, model assets, or model-cache identity. The AI model remains `v4.5.0`; V5.0.0 is untrained and on standby.

The [v0.6.0 validation record](../testing/TESTING.md#v060-version-correction-october-16-2026) distinguishes checks on the rebuilt version from preserved `0.5.5` core and R01 evidence. The 30-minute R03 protocol is prepared for future use; no full or shortened R03 session is part of this correction. Final-commit CI, approved release validation, physical-device evaluation, production promotion, and publication remain separate steps.

### Version correction files

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

### Prepared tag and release description

**App tag:** `v0.6.0`

**Release title:** `MangoLeaf AI v0.6.0 — V4.5.0 and local scan history`

**Release description draft:**

> Adopts V4.5.0 with a 70% confidence threshold; margin and entropy rejection are disabled. Scan reports and compressed photos stay in this browser's IndexedDB, with bilingual storage-full recovery and save retry that reuses the completed prediction. Public treatment guidelines continue to refresh online and remain available offline.
>
> Uses 32-bit WebGL textures where supported, with 16-bit textures on limited devices. Retains guided camera capture, photo review/retake, diagnosis recovery, and installation guidance. Selects the V2 walkthrough, preserves model rollback/evaluation records, and updates the future 30-minute reliability protocol. V5.0.0 remains untrained and on standby.

The separate `model-v4.5.0` tag is a model-provenance marker on the approved tested commit, not a second GitHub Release. Do not reuse `v0.5.5` for this build or publish the draft before completing the release procedure below.

### CI browser follow-up (October 16, 2026)

The first `b7331a9` CI run failed G07's intentional offline-request console cleanup and R04's native Blob seeding in Linux WebKit; 223 core cases passed and eight were skipped. The [follow-up testing record](../testing/TESTING.md#v060-ci-browser-follow-up-october-16-2026) records the timing fix, narrowly scoped native-PNG capability guard, successful repeated local checks, and pending Linux rerun. Typecheck, lint, build, and export checks passed. This changes test support, documentation, and the build-generated worker only; app/model versions remain `0.6.0` / `v4.5.0`. The pushed commit and any published tag must retain their identities; the repair requires a new follow-up commit and fresh CI before release approval.

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

## v0.6.1: uncertain result scores prepared release (October 16, 2026)

**Status: prepared candidate; final-commit CI, release approval, and production promotion are pending.** App `0.6.1` displays the saved highest mango-class percentage in scan details for Uncertain / Unrecognized reports as well as accepted results. This is a display change, not an extra model class or a change to the acceptance rule. A rejected raw score just below 0.70 can round to a displayed 70%; the rejection label remains Uncertain.

The English and Bisaya Terms explain that distinction, add an October 16 revision date, describe saved-versus-refreshed treatment advice, and use responsible-use/content-rights wording rather than claiming blanket statutory or research-ethics compliance. Privacy Policy was reviewed against the current local-only flow and already matches it: no account, local report/photo storage, public guideline requests, browser-data-loss limits, and no automatic cloud recovery. Its unchanged content retains the October 15 date. This review does not establish legal certification or verify remote provider settings.

The PWA retains model `v4.5.0`, the same model/configuration hashes, confidence >=0.70 only, existing model-cache identity, and local-only History. No model retraining or new model tag is part of this patch. The generated worker must come from the final production build.

Separate commits in the same prepared source also repair V5.0.0 image inventory for the preserved MPO and large OE originals, and refresh the README walkthrough link. These workflow repairs do not train or adopt V5.0.0. Shared progress notes can be committed with the final app preparation so the staging groups need no partial-file selection.

The [v0.6.1 testing record](../testing/TESTING.md#v061-uncertain-result-scores-october-16-2026) records checks for the final source. Earlier 0.6.0 passes do not certify this rebuilt patch. The existing master-only CI still runs its core browser suite without executing the separate 30-minute R03 session.

### Prepared commit and release text

**App commit:** `fix: show uncertain scores in v0.6.1`

**App tag:** `v0.6.1`

**Release title:** `MangoLeaf AI v0.6.1 - Uncertain result scores`

**Release description draft:**

> Displays the highest mango-class confidence score on Uncertain / Unrecognized scan details as well as accepted diagnoses. Updates English and Bisaya Terms to explain the score, rounding, and responsible use; the reviewed Privacy Policy continues to describe local-only History.
>
> Retains the V4.5.0 model and 70% confidence-only rejection rule. Refreshes the walkthrough link and fixes image compatibility in the separate V5.0.0 preparation workflow; V5.0.0 remains untrained and is not adopted.

Commit the prepared groups, push the final source, and complete the [release procedure](#candidate-testing-and-promotion). Create this tag/Release only for the exact approved tested commit; do not move `v0.6.0` or tag an intermediate commit. Preparing this description does not publish or promote a deployment.

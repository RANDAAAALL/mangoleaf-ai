# Application and reliability testing

**Current candidate:** PWA `0.7.0`, model `v4.5.0`, confidence-only threshold 0.70. See the [diagnostics and confidence validation record](#v070-diagnostics-and-raw-confidence-october-17-2026) for current scope and evidence limits. Older dated runs below retain their original source versions and results.

## v0.6.0 CI browser follow-up (October 16, 2026)

The maintainer supplied the failed Actions run 18 log for commit `b7331a9c894b4aed43efaab0dcb85d35ad87a617`: 223 core cases passed, eight were skipped, and two failed in 25.3 minutes. The failed cases were Chromium-desktop G07 and WebKit-mobile R04 photo layout. This was the core suite, not R03. GitHub CLI access returned `401`, so the full remote artifact was not downloaded; the supplied error text and local probes are the evidence for this follow-up.

G07 intentionally rejects a network-only guideline request while offline. Its previous cleanup inspected the collected console errors immediately after the fetch rejected, before Chromium necessarily delivered the corresponding resource-error console event. The corrected probe uses a unique query parameter, seeds a cached HTTP response for that exact URL, and waits for that URL's specific network-error console event before consuming exactly one expected error. Unrelated guideline failures, page exceptions, crashes, and other console errors still fail through the unchanged shared fixture. Offline IndexedDB advice and unrelated cache preservation assertions remain enabled.

R04 previously skipped native Blob persistence only on Windows WebKit, but Linux CI reported the same `UnknownError: Error preparing Blob/File data to be stored in object store`. A standalone Windows probe reproduced that exact error for plain, canvas-generated, and reconstructed Blobs using native IndexedDB without MangoLeaf or Dexie. Chromium `153.0.8010.12` and Firefox `155.0` preserved all three Blob forms byte-for-byte; pinned WebKit `26.6` failed all three. R04 now checks the same canvas-generated PNG's native write/read in its own disposable database before opening the app, verifying its type and bytes. Only WebKit's exact confirmed Blob-preparation error skips this photo-layout case; other probe errors and all later application/database errors remain failures. A WebKit runtime that passes the probe runs the complete layout assertions. This host-runtime evidence does not establish Safari/iOS phone behavior.

**Local validation:** the initial combined three-repeat command collected 21 cases: 15 passed and six were scoped skips, with zero failures/flaky results in 107.9 seconds. G07 passed six actual checks across Chromium desktop/mobile; its three Firefox instances retained the existing Chromium-only exclusion. After tightening the native capability probe from a plain Blob to the layout fixture's PNG, final R04 alone passed nine repeated Chromium/Firefox checks and skipped three WebKit instances with the exact native error, with zero failures/flaky results in 97.2 seconds. Every expected-error attachment contains exactly one deliberate probe error; every remaining browser-error attachment is empty. Skips are not counted as passes.

Formatting, typecheck, lint, production build, and all 10 export checks passed. Active/exported model hashes and all application input hashes still match the tested `0.6.0` source: base commit `b7331a9c894b4aed43efaab0dcb85d35ad87a617`, application fingerprint `db8958c94aad37369313d3a6d2d0c2750d7d548ec6ffafc329f831f15cf3185b`. Ignored `.tools/ci-v0.6.0-20261016/` keeps the native probe, both focused JSON reports/attachments, and `validation.json` with test-source/report hashes. Application source, model assets, version labels, the shared browser-error fixture, and the master-only GitHub workflow remain unchanged; the normal build regenerated `public/sw.js`.

This is focused Windows evidence, not a new full-core or Linux CI pass. Corrected Linux CI requires a new follow-up commit to be pushed and rerun. No full or shortened R03 session was run for this repair.

## v0.6.0 version correction (October 16, 2026)

**Prepared source; not a deployment or release announcement.** Original unpublished draft `d532fc8` contains the combined V4.5.0/local-only History update with app `0.5.5`. The correction sets `package.json` to `0.6.0` and aligns current release documentation. The maintainer selected folding these corrections into that unpublished draft with `git commit --amend`; the resulting commit ID changes while original reports keep their recorded base/input identities. The existing Next.js build configuration supplies `v0.6.0` to the footer. Application source, model files, prediction thresholds, IndexedDB schema, and the model-cache identity are unchanged by this correction.

Formatting, typecheck, lint, the production build, and all 10 export checks passed. The production page bundle contains `v0.6.0`; all five active/exported model files match the original adoption hashes, and the service worker was regenerated by the build. Four version-focused R04 browser cases passed with zero skips, failures, or flaky results in 39.6 seconds: Chromium desktop/mobile, Firefox desktop, and WebKit mobile all displayed app `v0.6.0` and model `v4.5.0` in English and Bisaya. The report is ignored `.tools/release-v0.6.0-20261016/footer-results.json`, identifying base commit `d532fc85d7abd28e20f14e6712b2db365d7c1c35` plus uncommitted inputs and application fingerprint `db8958c94aad37369313d3a6d2d0c2750d7d548ec6ffafc329f831f15cf3185b`.

Earlier full-core and R01 results below identify their original `0.5.5` source fingerprints and are not relabeled as new `0.6.0` runs. This correction ran only the four version-focused browser cases; no full-core, R01, or full/shortened R03 session was run. The [release record](../versions/PWA_VERSIONING.md#v060-local-history-and-v450-prepared-release-october-16-2026) contains the draft tag/title/description. Final-commit CI, physical-device evaluation, approved release validation, and production promotion remain pending.

## V4.5.0 repository adoption (October 16, 2026)

The following adoption evidence was collected with app `0.5.5`, before the subsequent PWA `0.6.0` version correction. The repository model identity is `v4.5.0`, with confidence >=0.70 as the sole rejection gate; margin and entropy are disabled. Existing scientific evaluation exports and derived confidence-only figures are preserved; browser integration observations are separate. The [adoption receipt](../model-training/non-experiment/v4.5.0/artifacts/adoption_20261016.json) records hashes, affected paths, validation, rollback support, and the original draft commit/tag wording.

Formatting, typecheck, lint, and the production build pass on the final source. All 46 tooling tests pass with 125 assertions, all 10 export checks pass, and the V4.5.0 notebook verifier passes its local synthetic fixtures after the path move. The active/exported model files, four preserved notebooks, 117 original archive entries, and three derived-figure outputs match recorded hashes. The adopted-model rollback helper passes a dry-run without `-Apply`; no model was restored. All 824 checked local documentation links resolve.

The complete core suite passed **224 cases with nine documented platform skips and zero failures/flaky results** in 20.4 minutes, at fingerprint `33989e8a702cc8ea62d5154c4eecc3fa5a606ec816cf4db528ad3cdbe32f7918`. After that run, only the two `diagnosticScope` sentences in `src/lib/translations.ts` changed: English and Bisaya Terms now describe confidence-only rejection. Input-hash comparison confirms this is the sole changed application input, and direct comparison against the isolated core copy confirms exactly those two sentence replacements. This does not claim a second full core run on the final text.

**Final source fingerprint:** `3e5d43568a05a2bd9442a19be59dd98f4271387946b7c93700bb4601675312b7`. R01 passed on this source: eight photos × 30 actual predictions, stable raw/displayed classes and acceptance, maximum confidence range `0`, and maximum net tensor growth `0`. It used Chromium `153.0.8010.12`, TensorFlow.js `4.22.0`, WebGL with `forcedFloat16=false`, and ANGLE SwiftShader. This measures same-session consistency, not accuracy or phone performance. Both reports identify base commit `63aff1d42e474a61f7938db692a5595266784b5b` plus uncommitted inputs; the receipt records report SHA-256 hashes. Preserved core and R01 evidence, plus the preceding reliability reports, are under ignored `.tools/model-adoption-20261016/`.

R03 was updated for a future 30-minute run and its single Chromium-mobile case was collected with `--list --reporter=line`. **No full or shortened R03 session ran.** Physical-device evaluation, final release approval, remote CI, and production promotion remain pending.

## Local-only History and storage quota (October 15, 2026)

**Local source candidate; not released or deployed.** Scan metadata and compressed photo Blobs stay in IndexedDB online and offline. Supabase supplies public treatment guidelines through full HTTP GET and Realtime. Existing cloud resources/settings are preserved and were not modified. Earlier dated test results below remain evidence for their original builds, including their former cloud behavior.

Current automated scope:

- `L01`/`L02`, `tools/e2e/local-history.pw.ts`: independent browser-local History and photo reload, no guest token/device identity, public guideline downloads, and zero Auth/private scans/Storage requests.
- `S05` and the v8 migration case in the same file: upgrade existing stores without rewriting photo rows, preserve IDs/Blobs/hash/model/status/owner/path metadata, remove unused indexes, keep legacy pending-delete reports hidden, and never load former cloud URLs.
- `L03`–`L05` and `L07`, `tools/e2e/storage-quota.pw.ts`: inject a native scan-write `QuotaExceededError`, display the bilingual recovery dialog, preserve saved reports, retry one stable ID without another model call, open History/delete chosen reports/retry offline, discard the unsaved result safely, and verify keyboard/Escape plus English/Bisaya recovery at 320px. An injected quota failure is controlled test evidence, not a physical full-disk measurement.
- Existing duplicate/current-model, History selection/deletion, thumbnail lifecycle, diagnosis recovery, guideline overlap/rapid-update/reconnect, and service-worker offline cases remain applicable. R02 now checks local persistence after reconnect instead of uploads.

The storage-full dialog never announces a successful save before local commit. Its draft survives tab navigation in the current page, not page reload/browser restart; no saved scan is deleted automatically. Opening History enables explicit space management, while Retry save reuses the completed diagnosis. Physical low-end-phone storage exhaustion and browser eviction remain manual checks.

**Verification completed:** all 46 tooling tests passed with 125 assertions. Formatting, TypeScript, lint, the production build, all 10 export checks, and the tracked-path/full-fetched-history security check passed. Lint retains the pre-existing unused `DiagnosisResult` import warning in `scan-details-modal.tsx`; there are no lint errors. The documentation review checked 403 local links and 168 Markdown anchors without a missing target.

All eight focused Chromium-mobile local-history, migration, and quota cases passed in 26.5 seconds against application fingerprint `5766e334c8645b65ea1b72ed50c07b54d6ab1c801880f5d3479512e111c41eae`. Initial modal probes exposed keyboard wrapping and long Bisaya text hiding actions; the corrected dialog keeps actions visible, makes its help keyboard-scrollable, and retains its draft across Escape and language changes.

The complete core run collected 233 cases: 221 passed, nine were scoped platform skips, and three failed because of two test-fixture issues. `D09` selected both the closing scan sheet's Cancel button and the active analysis dialog's Cancel button on mobile Chromium and Firefox. Its selector now targets the analysis dialog. Firefox `L01` reloaded and immediately navigated again, aborting the first document's model download with `NS_BINDING_ABORTED`; it now waits for that reload instead. Runtime-error assertions remain enabled and the classifier was unchanged.

Each corrected case then passed nine repeated checks across Chromium desktop/mobile and Firefox desktop: `D09` in 30.8 seconds and `L01` in 44.3 seconds, with zero failures or skips. Together with the full run, this validates all 224 applicable core cases at the same application fingerprint, with nine scoped skips and no unresolved failure. This is combined evidence, not a claim that a second full suite ran after the test-only corrections. Windows WebKit's IndexedDB Blob limitation and Chromium-only GPU, worker, and synthetic-video probes remain explicit platform limits.

The full report, attachments, and original failures are preserved in ignored `.tools/local-history-20261015/full-core-results.zip`; its report JSON has SHA-256 `886bb86a15960dad2affbe9b1f440997fd423690b60c71c9e0e8f4478e46ec58`. The focused reports, input/model identities, and combined coverage receipt are beside it in `validation.json`, `cancel-selector-results.json`, and `isolation-navigation-results.json`. All five model assets retain their first-probe hashes, and 606 unrelated baseline files retain their starting bytes, excluding the build-generated worker.

R03's 30-minute session and any shortened substitute were not run. App/model versions and deployment status are unchanged. Physical low-end-phone full-disk behavior, browser eviction, and native-camera observations remain pending in the physical checklist; these automated checks do not establish field accuracy or a measured device speedup.

## Diagnosis recovery (October 13, 2026)

The local candidate addresses QA's intermittent Running AI stalls with per-stage recovery deadlines, Cancel/Escape, translated failure/retry/reload actions, safe late-result handling, asynchronous warmup completion, failed-read cleanup, and cancellable local saves. The [performance record](../PERFORMANCE.md#211-diagnosis-stage-deadlines-and-recovery-october-13-2026) defines scope and limits. This does not establish faster inference or the cause on the teammate's unrecorded phone/browser.

Baseline fault probes passed all three reproductions in 9.2 seconds against application fingerprint `06112c38ddbb36babfdfc39435905b4cc763874cff1593cbf6bc3323d6838aa7`: withheld photo load, real-model GPU fence completion, and WebP callback each kept the old preview locked after five minutes of simulated time. These are deterministic injected failures, not an endurance session or a measured five-minute device run. Original baseline reports are retained under ignored `.tools/analysis-stall-20261013/`.

All 14 focused unit cases passed: 11 classifier lifetime/initialization cases and three stage deadline/cancellation cases. All 11 Chromium-mobile recovery cases passed in 34.5 seconds against final application fingerprint `f74813e353607881329df217579137f3188bb53fd1698f8283a90517654b98f2`, with zero skips, failures, or flaky cases. `tools/e2e/diagnosis-recovery.pw.ts` is part of the existing core suite and uses isolated local services to cover decode/encoding/save/GPU stalls, Cancel/Escape, retry, late completions, two consecutive guided captures online/offline, and native startup warmup timeout/reload. Controlled scores establish workflow behavior; the real-model GPU cases establish recovery without an accuracy claim. Startup's late graph never becomes usable, and Reload initializes a fresh model and saves a real scan. No 30-minute R03 testcase or shortened substitute is included.

The final recovery report is retained at ignored `.tools/analysis-stall-20261013/final-recovery-results.json`, SHA-256 `44795f0141680752cbab06286e47a405a828e4908ce27d875c28ab74fab089ae`; its test source hash is `7704e635e2c464e0355c4f154008227158f8968562abd5753fb0bf031227d2fd`. Earlier baseline and pre-warmup candidate reports remain separate. An initial recovery run had two fixture failures because its unsupported-service-worker fixture first loaded the result chunk while offline. The corrected cases prime that chunk online before the second offline capture or restore connectivity before inspecting the local-save result. Native service-worker offline reload and fresh diagnosis are verified separately by R02; the original failed report is preserved.

All 22 final regression cases passed in 197.3 seconds against the same final fingerprint: 12 normal scan-flow cases, eight real-model UI cases, R02 service-worker offline reload/fresh diagnosis, and R01's 240 actual predictions (30 for each of eight photos). There were zero skips, failures, or flaky cases. The final report is ignored `.tools/analysis-stall-20261013/final-core-results.json`, SHA-256 `ed2133198dd6610f0ae7ba455497ccc4f063ad43cf23f6f7bd0635bf62482c6d`. These focused Chromium-mobile checks are not the full browser/platform suite or physical-device evaluation. The preceding 22-case run remains preserved against pre-warmup fingerprint `a86a3859d85575f523b51bc010e566d5bcc3e380fcd566b5cba84f2d1bcc219c`. Formatting, typecheck, lint, production build, and all 10 exported PWA/model asset checks passed. Lint retains one pre-existing unused-import warning in `scan-details-modal.tsx` and no errors. All five model hashes match the preserved task baseline; the final validation receipt and complete change inventory are in ignored `.tools/analysis-stall-20261013/`.

Record a physical low-end phone's device/OS/browser/PWA identity, progress stage, elapsed time, and console `[Diagnosis]` timings when repeating the reported failure. Check repeated distinct camera captures and uploads online/offline, recovery actions, saved-record counts, and native camera cleanup in the [physical checklist](PHYSICAL_RELIABILITY_CHECKLIST.md#r04-m01-guided-camera-gallery-and-layout). A browser timer cannot preempt a frozen JavaScript/driver thread. Startup warmup has a separate 60-second deadline and translated failure/Reload banner; model/config downloads remain outside these deadlines.

These tests cover the scan workflow and the manuscript's reliability paragraph. R01–R04 are project test IDs, not research-objective numbers from the manuscript. Physical-device results and model accuracy require their own evidence; a green browser suite alone does not establish either.

**October 16 source snapshot:** Prepared app `0.6.1`, model `v4.5.0`, confidence-only threshold 0.70. Margin and entropy gates are disabled. The [v0.6.1 checks](#v061-uncertain-result-scores-october-16-2026) identify that patch separately from the earlier adoption and version-correction evidence. Its production release and physical-device validation were pending in this record. Earlier dated entries retain their original identities and results; the current candidate is identified above.

## Next.js security revalidation (October 10, 2026)

App `0.5.5` retains model `v4.3.0`. The security follow-up patches Next.js and its ESLint configuration from `16.3.6` to `16.3.8`, selects compatible `sharp@0.35.5` and `source-map-js@1.2.2` lockfile repairs, and disables the development-only Next.js MCP endpoint through `experimental.mcpServer: false`. The independent GitHub MCP connector is unaffected. See the [six-alert review and retained findings](../security/DEPENDENCY_SECURITY.md).

**Source identity:** Base commit `5cad2ff15efa66d045642432c34b8846dcaabcfc` contains the previously prepared release. The dependency/configuration and camera-focus changes are subsequent uncommitted inputs. Package, lockfile, and Next configuration participate in the application fingerprint, so the preceding `ee16e498efd838f997372482b8b5770301ae81d541b27707b1235b51dfa80191` report does not certify this revision. Keep its original results and archives below; record this revision separately.

| Check                                                         | Security-follow-up evidence                                                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Six reported Next.js alerts                                   | Exact GitHub MCP alert metadata names `16.3.8` as the patched version for all six; installed framework/lint pins now match it.                                                                  |
| Additional compatible repairs                                 | Bun repaired `sharp` and `source-map-js` within their existing dependency ranges. No unrelated framework/model upgrade or audit ignore was used.                                                |
| Frozen installation                                           | Passed; 452 installs across 525 packages checked without changes.                                                                                                                               |
| Full dependency audit                                         | Two findings remain: `braces` (high) and `sprintf-js` (moderate), with no published fixes. Audit exits 1 and neither finding is suppressed. A clean production dependency graph is not claimed. |
| Formatting, TypeScript, lint, production build, and export    | Passed in the required order; one existing unused-import warning remains, and all 10 export checks passed.                                                                                      |
| Local development MCP endpoint                                | Passed: loopback POST to `/_next/mcp` returns 404 both without Origin and with an allowed tunnel Origin; normal app/manifest GETs return 200.                                                   |
| Tooling/security/archive checks                               | Passed: 28 tooling tests, 98 assertions, tracked-path/full-history secret checks, and 14,117 historical bytes verified against both ledgers.                                                    |
| Complete core browser suite and filtered R01                  | Passed: 187 core cases, four declared skips, no failures/flaky results; R01 ran 240 actual predictions with stable classes/acceptance, zero confidence range and tensor growth.                 |
| R03 30-minute session                                         | Excluded from execution as requested, including a shortened substitute.                                                                                                                         |
| Physical device, final-commit CI, publication, and deployment | Record these outcomes separately; local browser and dependency results do not establish them.                                                                                                   |

### CI camera failures and repair

The supplied [Linux CI run](https://github.com/RANDAAAALL/mangoleaf-ai/actions/runs/37980742698) tested committed baseline `5cad2ff15efa66d045642432c34b8846dcaabcfc`: 183 passes, four failures, four declared skips, and 1,496,590 ms of core-browser execution. The supplied extracted reports identify that failed run and remain unchanged. GitHub's upload log records artifact ZIP SHA-256 `a74adb44775c686492d73cf904f1b55790b1501e67b3dd99ca171a53eb6f81d9`; the original compressed ZIP is not present in the supplied folder at final review, so this is a recorded GitHub identity rather than a newly recomputed local archive checksum. That failed run is preserved as evidence, not relabeled as successful.

C01, C04, and C05 displayed the permission-blocked message during controlled tests configured to allow or defer permission. The fixture previously patched a method on the native `navigator.mediaDevices` object when that API existed; Windows WebKit instead received an owned replacement because its API was absent. The fixture now installs one owned `{ getUserMedia }` object on every controlled platform, and the launcher asserts that its request counter advances. This addresses the observed escape into native permission handling without changing production camera permissions. Source review of [Playwright's pinned WebKit revision](https://github.com/microsoft/playwright/blob/v1.63.0/browser_patches/webkit/UPSTREAM_CONFIG.sh) found [weak JavaScript wrapper storage](https://github.com/WebKit/WebKit/blob/4d05d732e5a84f32675bef4cc135a2e7a9269a87/Source/WebCore/bindings/js/ScriptWrappable.h#L57) and [MediaDevices retention tied to devicechange listeners](https://github.com/WebKit/WebKit/blob/4d05d732e5a84f32675bef4cc135a2e7a9269a87/Source/WebCore/Modules/mediastream/MediaDevices.cpp#L477). The fixture held no stable JavaScript reference or such listener, so collection/recreation can lose its method override. This is a source-supported lifetime explanation; the trace does not record the exact garbage-collection event.

C03 exposed a separate focus requirement. A forced focus escape reproduced a failure on Windows: the modal returned focus to its container while Close was the only enabled action. The camera now returns escaped focus to its first visible enabled button, with the container retained as the fallback when no action exists. The original Tab/Shift+Tab, late-stream cleanup, and launcher-focus checks remain.

All 16 focused C01/C03/C04/C05 checks passed on the installed Windows Chromium, Firefox, and WebKit projects in 41.2 seconds. Camera reports now attach controlled request, stream-assignment, playback, native-error, button, and keyboard/focus observations. Collection is best-effort so a lost page does not obscure the original failure. Controlled mocks do not establish native-camera behavior; C07's actual synthetic-stream playback and C08's unsupported-API check remain separate. No assertion was removed and no skip was added to hide these failures.

An initial complete local attempt also caught S05's global missing-photo locator matching two placeholders before the preserved thumbnail URL resolved. The test now waits for that retained thumbnail before checking the one genuinely missing photo. All migration, owner-isolation, and no-legacy-download assertions remain; the focused check passed in all three applicable browser projects. The interrupted evidence remains preserved and is not counted as a complete pass.

The [CI workflow](../../.github/workflows/ci.yml) retains the core suite on `master` pushes and prints Node/Bun/Playwright/runtime versions. Its application job has a **45-minute maximum budget** for installation, build, browser setup, core tests, and evidence upload. The failed job already took about 29 minutes against the previous 30-minute budget. This budget does not extend or invoke R03: **R03 remains a separate 30-minute session and is excluded from this task and CI**.

This revision's Windows application fingerprint is `2ccdfaede198d91f39c4aa5ca65eabae85869382edcad9fffef3a0feb2127f7d`. It includes the uncommitted changes and differs from the failed Linux run's fingerprint `3c1ffbe6ff501783cf8e0a1ff50f0644bc3efad44706c5117472b3e9f4997566`. Fingerprints identify exact working-file bytes, including platform line endings; do not infer cross-platform byte identity or carry a pass between them. The corrected Linux CI run remains pending publication of the reviewed revision.

The production-only dependency audit exits 1 with one moderate `sprintf-js` advisory; `braces` belongs to the development graph. No formatter signatures were found in the 34 rebuilt browser JavaScript files, consistent with source review, but that narrower observation does not clear the installed dependency finding. All five source/export model assets, 47 notebooks, and 358 scientific artifact/figure files retain the pre-task baseline bytes. The camera focus component is the only changed file under `src/`; classifier preprocessing and fitted settings remain unchanged.

### Completed follow-up evidence

The complete revised core suite passed **187 cases**, with **four declared skips**, **zero unexpected failures**, and **zero flaky results**, in 15.6 minutes. It tested the isolated production export with fresh browser contexts and the local mock backend. These Windows results do not replace the pending corrected Linux CI run.

| Browser project    | Passed | Declared skips | Failed | Flaky |
| ------------------ | ------ | -------------- | ------ | ----- |
| `chromium-desktop` | 60     | 0              | 0      | 0     |
| `chromium-mobile`  | 60     | 0              | 0      | 0     |
| `firefox-desktop`  | 49     | 2              | 0      | 0     |
| `webkit-mobile`    | 18     | 2              | 0      | 0     |

Filtered R01 (`bun run test:reliability --grep "R01:"`) passed 240 actual predictions: 8 photos, 30 predictions each, in Chromium mobile emulation. Raw/displayed classes and acceptance remained stable; maximum confidence range was 0, and maximum net tensor growth was 0. Its report took 51.5 seconds. These are repeatability and lifecycle observations, not a model-accuracy or physical-camera measurement.

Both reports identify base commit `5cad2ff15efa66d045642432c34b8846dcaabcfc` plus the uncommitted follow-up inputs and application fingerprint `2ccdfaede198d91f39c4aa5ca65eabae85869382edcad9fffef3a0feb2127f7d`. Core report SHA-256 is `b0f04b9665f53b07f91bc10dd7721dc44aeeb3c6197e93383a712fece54bf1e9`; R01 report SHA-256 is `41fd5b0204bac6ef56415533717be52a478a0aac80a5871c00ea5e40afc38161`. All report application-input hashes were checked against the final working files. Test/fixture/workflow hashes and decoded observations are recorded separately beside the reports.

The final reports remain under ignored `.tools/dependabot-next-20261010/final/`. Its `reports.zip` contains 101 files verified against their source bytes, with SHA-256 `7bfaf3f373bd412d6be65073901dbc49a9e562018fdd1f03f77e3ec6303426ec`. Original failed CI, reproduced focus failure, focused passes, interrupted S05 attempt, and the initial v0.5.5 archive remain separate. R03 was not run, including a shortened substitute; its protocol remains 30 minutes.

### Initial v0.5.5 evidence remains separate

The following v0.5.5 record describes the completed preparation before this dependency/configuration follow-up. Its measurements and preserved report identities remain unchanged.

## v0.5.5 release validation (October 10, 2026)

**Prepared release.** App `0.5.5` packages the guided live camera with full-frame capture, review and source-specific Retake, stream cleanup, bilingual installation instructions, desktop QR guidance, and phone/desktop scan-layout refinements. Phone History shows four reports per page; desktop History retains six. Phone selection deletion precedes pagination, and full photo cards reserve a 4:3 image area across viewport changes. Per-class probabilities remain developer-console diagnostics; the result modal does not expose the full probability table.

The active model remains V4.3.0 Combined (`v4.3.0`): all five restored assets, seven-class order, 224×224 preprocessing, folded temperature, and confidence/margin/entropy gates `0.70 / 0 / 0.42` retain their adopted values. The declined V4.4.0 trial remains an archive under the experiment folders. This app release does not adopt a different model or change Supabase schema/policies.

**Final local identity:** App `0.5.5`, model `v4.3.0`, application input fingerprint `ee16e498efd838f997372482b8b5770301ae81d541b27707b1235b51dfa80191`. Both final reports identify base commit `341a065c0288e196578b970a6e5ac402915ed417` plus the uncommitted release changes; this is not a new release commit or tag. The October 7 `0.5.4` and October 9 rollback reports below remain evidence for their own inputs; changing the version label does not carry those passes into this release. Browser automation uses fresh contexts, the isolated export, and the local mock backend. It must not send test scans to production Supabase.

| Check                                                                | Current evidence                                                                                                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting, security, and tooling                                    | Passed: pinned Prettier, Gitleaks 8.30.1 tracked-path/history checks, and all 28 tooling cases with 98 assertions.                                  |
| TypeScript, lint, and production build                               | Passed in the required order; the build regenerated `public/sw.js`. Lint retains one existing unused `DiagnosisResult` import warning.              |
| Export assets and model preservation                                 | All 10 export checks passed; the five exported model files match the unchanged source model hashes. Historical runtime-archive verification passed. |
| Core browser suite, including camera and installation                | Passed: 187 cases, four declared skips, zero unexpected failures or flaky results; 18.3 minutes (1,097,848 ms).                                     |
| R01 repeated actual inference                                        | Passed: one Chromium mobile-emulation case; eight photos, 30 actual predictions each, 240 predictions total; 62.3 seconds.                          |
| R03 30-minute session                                                | Not run during this preparation, as requested; no shortened substitute. The aligned protocol remains available.                                     |
| Physical device and installation evidence                            | Open; record actual observations in the physical checklist.                                                                                         |
| Final-commit CI, publication, production promotion, and live version | Separate release steps; not established by local preparation.                                                                                       |

Record report locations, result counts, application fingerprint, model hashes, and any warnings with each completed check. Keep device, OS/browser, installed-PWA mode, camera permissions, actual installation, offline capture, and background behavior attached to their own observations; synthetic browser signals do not establish those physical outcomes.

### Completed browser evidence

| Browser project           |  Passed | Declared skips |
| ------------------------- | ------: | -------------: |
| Chromium desktop          |      60 |              0 |
| Chromium mobile emulation |      60 |              0 |
| Firefox desktop           |      49 |              2 |
| WebKit mobile emulation   |      18 |              2 |
| **Total**                 | **187** |          **4** |

C07's synthetic canvas-stream playback check is scoped to Chromium, so Firefox and WebKit skip it. Firefox also skips G07's worker-cache case; installed Chromium covers that path. Windows WebKit skips C02's controlled camera-to-diagnosis case because it does not complete this TensorFlow.js inference path. Its remaining guided-camera and installation UI cases passed. None of these skips is counted as a pass or as physical-phone evidence.

All 16 M01 observations matched their supplied provisional labels, with the actual classifier's class, confidence, photo hash, and model identity preserved in the saved result and UI. This is smoke evidence, not an accuracy estimate. The test now checks the desktop installation Home and reopens the saved photo from History; phone Home still shows its recent scan. The mobile History expectation matches the current four-report page size.

Filtered R01 used Chromium `153.0.8010.12`, TensorFlow.js `4.22.0`, WebGL with forced Float16, and the ANGLE SwiftShader software renderer. Raw/displayed classes and acceptance stayed stable for every photo. Maximum raw-confidence range and maximum net tensor growth per photo were both `0`. These observations cover same-session regression consistency; they do not measure phone speed, all browser/native memory, or model accuracy.

### Preserved identities and reports

All five source model files still match the pre-preparation baseline and the production export. The 47 notebook files and 358 scientific artifact/figure files also retain their baseline bytes. Historical runtime-archive verification matched 14,117 original bytes against both preserved ledgers.

| Model asset                         | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `public/model/group1-shard1of3.bin` | `04e1e18a28cb414442c66617a0bc0cbdff2e93116d08d0a170f04b30572bf09c` |
| `public/model/group1-shard2of3.bin` | `0432d0dc9a25e4d2d0048aa5c8120076c05466a6363bd2d5a0c5e5ee4fd34954` |
| `public/model/group1-shard3of3.bin` | `a0fab950ece352711e938467d6bf5f6aaed6c48b5ee1e37812b0a7192399292b` |
| `public/model/model.json`           | `f5ebdd96893513f05d78126880e9a56a94c4750f75b02a2ee2fb7d3792c8267b` |
| `public/model/model_config.json`    | `40216b04bf0e3f303e0d23beb7059cfec3d43ac6e01be35a3431600443c37d0c` |

The completed core and R01 JSON/HTML reports are preserved in ignored `.tools/release-v0.5.5-20261010/final/reports.zip`; all 101 archived files were verified against their source bytes. Archive SHA-256: `a431261715db81ea7847d013acac1fd7535eb108e4bb3ffd5af6b0fcca576015`. The same folder keeps the copied JSON reports, decoded model/R01 observations, test/CI input hashes, archive manifest, and `verification.json`.

- Core JSON report SHA-256: `8ac57688f36824098a1d91058e84c9db614497bfa04af561d005da2a96fe3f54`.
- R01 JSON report SHA-256: `1da489002646c4e7c8c083670cde75c9906b61113554035a2c8305ddcadc0081`.

The initial core attempt stopped after obsolete desktop Home thumbnail expectations failed. Prediction, saved-photo identity, and result assertions had passed before those UI expectations. The test-only correction preserves those assertions and checks the saved image in History. Interrupted case traces are retained in `.tools/release-v0.5.5-20261010/initial-core.zip`, SHA-256 `0e7333e52f1632a8d09c8cc3a2179148be7124775cfc32a95a5be22da84ca8c1`; that archive is not a completed initial-run report. The complete rerun above passed against the same application fingerprint.

Local validation is complete. R03 was not executed, including a shortened substitute. Physical-device observations remain open in the [physical checklist](PHYSICAL_RELIABILITY_CHECKLIST.md); final-commit CI, exact deployment/domain-setting confirmation, approved promotion, live-version verification, and tag/Release publication remain separate release steps. Status is **prepared release / awaiting CI and production promotion**.

**Historical V4.1.1 rollback (September 29, 2026):** The app again uses one seven-class V4.1.1 Background model and opens its scan sheet directly, without an organ choice. The completed [V4.2.0 two-model trial](../model-training/experiment/v4.2.0/TRIAL_v4_2_0.md#completed-results-and-comparison-september-29-2026) is retained as evidence and an ignored local backup. Existing single-model browser fixtures and cases were not changed or run for this rollback; prior test results do not certify the restored working tree. This rollback verifies TypeScript, lint, and build. Photo hashes stay unchanged; local rows marked with the V4.2.0 model version remain in history but are not reused as V4.1.1 diagnoses.

**Historical local V4.3.0 retest (October 2, 2026):** Root `public/model/` contained the verified single seven-class Combined candidate, with display label `v4.3.0-candidate` and gates 0.70 / 0 / 0.42. The app kept the direct scan sheet and latest photo guidance/Bisaya text. V4.1.1 Background was preserved for rollback. See the [restoration receipt](../model-training/non-experiment/v4.3.0/artifacts/local_restore_20261002.json). Existing browser cases, fixtures, hooks, and workflows remained unchanged and were not rerun for that local swap. Typecheck, lint, and build passed for that task. Prior model results and automated observations did not certify the restored candidate; browser parity, independent accuracy/OOD evidence, and physical-device checks remained pending.

The [v0.4.9 PWA history entry](../versions/PWA_VERSIONING.md#v049-adoption-of-v430-combined) summarizes the application changes and verified local tags. The following dated validation records retain their original source snapshots and status.

**App v0.4.9 adoption (October 2, 2026):** The current application model is V4.3.0 Combined, with display label `v4.3.0`, configuration identity `model-v4.3.0`, and unchanged `0.70 / 0 / 0.42` gates. The [adoption receipt](../model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) preserves original export provenance and separately records the relabeled configuration hash. The approved release validation uses the core suite and R01 repeated inference against this exact final source/model/fixture state, with `bun run test:reliability --grep "R01:"`; results are recorded below and in the adoption receipt. Final GitHub workflow checks and production promotion remain separate pending steps.

<a id="v049-local-validation-october-2-2026"></a>

**Local v0.4.9 validation (October 2, 2026):** Final formatting, TypeScript, lint, production build, all 10 export-asset checks, security scan, and all 10 tooling tests passed. The complete core suite passed all 65 cases with 0 failures in 5.6 minutes across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile UI. All 16 M01 observations matched the provisional supplied labels; this is smoke evidence, not an accuracy estimate. R01 passed one `chromium-mobile` case in 57.2 seconds: eight photos × 30 actual predictions, with stable raw/displayed classes and acceptance, maximum raw-confidence range `0`, and maximum net tensor growth per photo `0`. Application input fingerprint is `aafefbaaff86b0c86f55ef534afc3e0e416dcb1825c15c5aaf912ed48703100a`. Report base commit `19445fc200b3fd247b4a5e9ae24e560770e9dc68` is existing HEAD, with adoption changes still uncommitted. The first core run's 54 passes/11 failures were resolved by test-only footer, duplicate-selector, and offline-transition timing fixes, with strict error assertions and model gates preserved. The adoption receipt records final reports/hashes and archived initial evidence. Remote CI, exact deployment/domain-setting confirmation, production promotion/live-footer verification, and commit/tag/Release publication remain pending.

**Local cloud-security candidate validation (October 2, 2026):** The updated guest-session/private-photo client passed TypeScript, lint, production build, formatting, Git diff checks, all 14 tooling tests with 41 assertions (including four guest-session tests), all 10 exported-asset checks, and the credential/history security scan. All 80 core cases passed with zero failures in 7.4 minutes across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile coverage; S01–S05 use the isolated local mock backend. This full run preceded the test-only S05 fixture correction to native IndexedDB version 70 for Dexie's version 7 and the added class/confidence/model-label assertions. The tightened S05 then passed three focused Chromium desktop/mobile and Firefox cases in 8.1 seconds; no second full suite is claimed. Final application input fingerprint remains `a316d8017d732e678704809b74289e3100beb4896611e8760f883ec78a923f71`. All 342 protected files retain their hashes, including 43 notebooks, model assets, Git hooks, and GitHub workflows; 418 local links/anchors across 35 documents resolved before the live-migration documentation update; that later check passed with 419 links/anchors. The earlier adoption validation above remains evidence for its original source snapshot.

**Live server-security verification (October 2, 2026):** After the photo bucket was saved as private, migration `secure_guest_owned_cloud_sync`, history version `20261002152830`, applied successfully. Catalog checks verified the private bucket, grants, RLS, index, and three scan/one guideline/four Storage policies. Thirty assertions using temporary copies of the applied policy expressions/grants passed and were rolled back; the earlier proposed-policy proof is separate. All original values remain unchanged across 65 scan rows, six guidelines, and 68 Storage object entries, with no missing entries or invented legacy owners. The advisor returned zero findings. Read-only HTTP probes returned 401 for unsigned scans, 200 for all six public guidelines, and 400 for a cache-busted old public photo URL. These checks created no production test users, scan rows, or Storage files, and performed no remote photo writes/deletes/purge. They do not prove every formerly public cached copy disappeared or establish a real guest signup/upload/download session. The matching updated client has not been committed, pushed, or deployed. See [implementation status](../supabase/SECURITY-AND-SYNC.md#implementation-status).

## Local rollback and camera alignment validation (October 9, 2026)

The maintainer declined the temporary V4.4.0 model trial and requested restoration of V4.3.0. All five restored model files and the exported `out/model/` files match the verified pre-trial V4.3.0 hashes. The display label is `v4.3.0`; the service worker uses its matching cache and removes the temporary V4.4.0 candidate cache on activation. App label remains `0.5.4`; this working tree is separate from the October 7 prepared-release fingerprint and is not a new production release.

Formatting, TypeScript, lint, the production static build, all 10 export checks, and historical runtime-archive verification passed. Lint retains the existing unused `DiagnosisResult` import warning in `scan-details-modal.tsx`. The focused command `bun run test:e2e --project=chromium-mobile --project=webkit-mobile --grep 'C0[1-8]:|I0[1-8]:|M01:'` passed **40 cases with two declared Windows WebKit skips and no failures**. C02's TFJS camera inference and C07's Chromium-only synthetic stream are the skipped cases. These checks cover camera lifecycle, installation layout/platform wording, and eight actual-model scan fixtures; controlled UI conditions and provisional fixture labels do not establish field accuracy or physical iOS/Android behavior.

The tested application fingerprint is `7ffccaf4e1d1106b8664b4728a06a9da03e0d056dc54c87b9423c7ca8373fda1`. The completed focused JSON report SHA-256 is `2e86e03a3513dadb2883aa56605b2143b5cec1927e2eb6c0cdf25ea7dc2f1e36`. Reports and attachments are preserved under ignored `.tools/v440-closeout-20261009/focused-browser/`; current runner output is under `test-results/e2e/`. All 47 existing notebooks and all 66 curated V4.4.0 source copies retain their bytes. The archive manifest separately verifies that all 6,781 original downloaded files remained unchanged.

**R03 was aligned, not executed, including no shortened run.** Type/lint checks and `node node_modules/@playwright/test/cli.js test --project=chromium-mobile --grep 'R03:' --list --reporter=line` with `MANGOLEAF_RELIABILITY=1` verify its definition is collectible. The reporter flag prevents listing from replacing completed JSON/HTML evidence. R03 still requires an explicitly authorized full 30-minute execution; synthetic camera support and physical-device evidence remain separate limits. GitHub CI's core suite includes camera and installation cases, with pinned Playwright browser installation through Node; no R03 command was added. Remote CI was not run by this local task.

## v0.5.4 release validation (October 7, 2026)

**Prepared release / awaiting CI and production promotion.** App `0.5.4` skips unchanged full HTTP guidance writes after the existing event-counter and starting-local-snapshot checks pass. The model remains `v4.3.0`; model assets, class order, preprocessing, temperature, fitted gates, and diagnosis behavior are unchanged. No Supabase schema or policy change is required.

The approved checks are formatting/security, TypeScript, lint, production build, export verification, tooling cases, the complete core browser suite, and `bun run test:reliability --grep "R01:"`. The 30-minute R03 session is excluded. Browser cases use fresh contexts and the isolated local mock backend, not production Supabase.

Local HEAD and tag `v0.5.3` identify baseline `7899fd81e83256c695246dbc733bfcce0155f69f`. App `0.5.4` includes the subsequent checker, version, test, and documentation changes. The prior `0.5.3` results below identify their original input fingerprint and do not certify this changed build.

### Unchanged guidance regression scope

- Accept an identical full guidance response as success without `clear()` or `bulkPut()`. Assert that no local guideline mutation occurs; an unchanged result must not be recorded as a failure or trigger a retry solely because it matches.
- Return the same rows in another order and verify that this also produces no writes. Compare all four saved fields: `id`, `disease_name`, `guidelines_en`, and `guidelines_bis`.
- Change each compared field, add a row, or delete a row. Each different valid snapshot must update the complete local set; a valid empty set must remove stale rows, while an already empty local set remains a no-op.
- Reconnect with unchanged guidance, then with a changed Mango Scab row. Both still perform HTTP retrieval; only the changed full snapshot mutates IndexedDB, and both language fields remain correct.
- Deliver a changed Anthracnose row through Realtime while an older full HTTP response is held. The older result remains invalidated; the protected follow-up must reconcile any other changed rows and skip rewriting only if the current complete set already matches.
- Retain the existing event-during-save, other-tab-conflict, failed-download, offline cleanup, direct Realtime INSERT/UPDATE/DELETE, and worker-cache regressions. Equality must not bypass the ordering checks or accept an invalidated response.

**Versioned local results:** The following checks passed for app `0.5.4` and model `v4.3.0`, with application input fingerprint `c519472be5cc4335fbcd8e0dfca0e705ca88b6d9a6cb66f33bc657516f0074d7`. Report base commit is `7899fd81e83256c695246dbc733bfcce0155f69f` plus the uncommitted release changes; report input hashes identify the tested application and model files.

| Check                                         | Result                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Formatting and security scan                  | Passed. Security covered tracked paths and full fetched Git history.                                       |
| TypeScript, lint, and production static build | Passed in the required order; the build regenerated `public/sw.js`.                                        |
| Export verification                           | All 10 checks passed.                                                                                      |
| Tooling tests                                 | All 28 passed with 98 assertions, including 14 guideline-manager/comparison cases.                         |
| Focused G01–G11 browser checks                | 32 passed, one declared Firefox worker-test skip, zero unexpected failures.                                |
| Complete core browser suite                   | 118 passed in 9.2 minutes, one declared Firefox worker-test skip, zero unexpected failures or flaky cases. |
| Filtered R01 actual inference                 | One case passed in 56.7 seconds: eight photos, 30 predictions each, 240 actual classifier calls.           |
| R03 extended use                              | Excluded by the requested validation scope; not run.                                                       |
| Model preservation                            | All five SHA-256 values match the baseline, as recorded below.                                             |

G08 observed matching and reordered HTTP responses completing without any IndexedDB `clear`, `put`, or `delete` calls. G09 observed changed English/Bisaya text, disease names, added/deleted rows, and a valid empty set updating correctly; repeating the empty set issued no mutations. G10 confirmed that an identical overlap follow-up did not rewrite directly received advice. G11 confirmed that a follow-up still saved a Mango Scab change missed by Realtime while preserving the new Anthracnose row. Completed database transactions were observed separately from write attempts, so a successful unchanged refresh was not inferred solely from a matching final display or a delay. The unchanged path still reads and compares guidance inside a readwrite transaction.

R01 recorded Chromium `153.0.8010.12`, TensorFlow.js `4.22.0`, the WebGL backend with forced Float16, and a SwiftShader software renderer. Raw/displayed classes and acceptance stayed stable for each photo; maximum confidence range and net tensor growth were both zero. These are same-session regression observations, not model-accuracy or target-device performance measurements.

| Model asset                         | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `public/model/model.json`           | `f5ebdd96893513f05d78126880e9a56a94c4750f75b02a2ee2fb7d3792c8267b` |
| `public/model/model_config.json`    | `40216b04bf0e3f303e0d23beb7059cfec3d43ac6e01be35a3431600443c37d0c` |
| `public/model/group1-shard1of3.bin` | `04e1e18a28cb414442c66617a0bc0cbdff2e93116d08d0a170f04b30572bf09c` |
| `public/model/group1-shard2of3.bin` | `0432d0dc9a25e4d2d0048aa5c8120076c05466a6363bd2d5a0c5e5ee4fd34954` |
| `public/model/group1-shard3of3.bin` | `a0fab950ece352711e938467d6bf5f6aaed6c48b5ee1e37812b0a7192399292b` |

Reports are preserved in ignored `.tools/release-validation-v0.5.4-20261007/final/reports.zip`; all 67 archived files were verified against their source bytes. The archive SHA-256 is `3a86a59dfca58133f1b826caeb39e280923a335c222f687845a1b97545143697`. Decoded R01 observations, application/test input hashes, unchanged model hashes, and the validation summary are saved beside it. Core report SHA-256 is `019d931c0a168c379723e019e5a6d18f3ae600907dd17ab6101df8c18e06bbf1`; R01 report SHA-256 is `e0503595140dcf8b5abe8bc84750e1d9b1f2ee5e624777e20e781739a21cf40d`. The focused report is separately preserved under `focused-guidelines/`, and the prior `v0.5.3` archive remains intact. Both final reports identify the same `0.5.4` application fingerprint, which still matches the current application/model files. Process-launch restrictions required builds and security/tooling/browser subprocesses to run outside the sandbox; those restrictions were not application failures.

Local release validation is complete. Final-commit CI, production verification/promotion, live-version confirmation, and publication remain separate release steps. Status remains **prepared release / awaiting CI and production promotion**.

## v0.5.3 candidate validation (October 7, 2026)

**Candidate / not released.** App `0.5.3` packages the guideline-ordering fix and network-only guideline HTTP reads while retaining model `v4.3.0`. The app label is rebuilt from `package.json`; no environment-variable override or model relabel is needed.

The approved versioned checks are formatting/security, TypeScript, lint, production build, export verification, all tooling cases, the complete core browser suite, and `bun run test:reliability --grep "R01:"`. The 30-minute R03 session is excluded. Browser scans use fresh contexts and the isolated local mock backend. R01 executes the actual model rather than reusing duplicate diagnoses.

The initial `0.5.2` guideline implementation passed 106 core cases and 26 tooling cases under fingerprint `17cf8febe8c0b6c5b1e8ac7e669f4f28df687f66f76c13a79a2171a3ef3136ef`. Those results remain in the [initial ordering record](#guideline-update-ordering-october-7-2026) and do not certify this new version label/build. Prior HTML/JSON reports were preserved under ignored `.tools/release-validation-v0.5.3-20261007/before-version-bump/` before the versioned commands replaced their normal report folders.

**Versioned local results:** The following checks passed for app `0.5.3` and model `v4.3.0`, with application input fingerprint `b116df9958424036c66d80fb151e8ec44bf4a07838b73022e17f2bb47dd5a661`. Report base commit is `ee91cf693fd52acb6f882f2c049a3b2ddd599a1f` plus the uncommitted candidate changes; the report input hashes identify the tested files.

| Check                                         | Result                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formatting and security scan                  | Passed. The security scan covered tracked paths and full fetched Git history.                                                                                |
| TypeScript, lint, and production static build | Passed in the required order.                                                                                                                                |
| Export verification                           | All 10 checks passed.                                                                                                                                        |
| Tooling tests                                 | All 26 passed, including 12 guideline-ordering cases; 84 assertions.                                                                                         |
| Complete core browser suite                   | 106 passed, one declared Firefox G07 worker skip, zero unexpected failures or flaky results; 9.6 minutes (576,312 ms). G07 passed in both Chromium projects. |
| R01 repeated actual inference                 | One Chromium mobile-emulation case passed in 53.6 seconds: eight photos, 30 predictions each, 240 predictions total.                                         |

R01 recorded stable raw/displayed classes and acceptance for each photo, maximum raw-confidence range `0`, and maximum net tensor growth per photo `0`. The browser was Chromium `153.0.8010.12`, with TensorFlow.js `4.22.0`, the WebGL backend, forced Float16, and an ANGLE SwiftShader renderer. This is same-session browser consistency evidence, not a model-accuracy estimate, phone-performance measurement, or measurement of all browser/native memory. No R03 session ran.

All five model files match the earlier tested bundle:

| Model file                          | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `public/model/model.json`           | `f5ebdd96893513f05d78126880e9a56a94c4750f75b02a2ee2fb7d3792c8267b` |
| `public/model/model_config.json`    | `40216b04bf0e3f303e0d23beb7059cfec3d43ac6e01be35a3431600443c37d0c` |
| `public/model/group1-shard1of3.bin` | `04e1e18a28cb414442c66617a0bc0cbdff2e93116d08d0a170f04b30572bf09c` |
| `public/model/group1-shard2of3.bin` | `0432d0dc9a25e4d2d0048aa5c8120076c05466a6363bd2d5a0c5e5ee4fd34954` |
| `public/model/group1-shard3of3.bin` | `a0fab950ece352711e938467d6bf5f6aaed6c48b5ee1e37812b0a7192399292b` |

The full versioned reports are preserved in ignored `.tools/release-validation-v0.5.3-20261007/final/reports.zip`; all 67 archived files were verified against their source bytes. A ZIP avoids Windows path-length failures when copying deeply nested photo attachments. Decoded R01 observations, input hashes, model hashes, and a validation summary are saved beside the archive. Core report SHA-256 is `8ede50d1c3b7e45b0a49832e914f622fd834641eb678b2488a058f8de5e92179`; R01 report SHA-256 is `a25e6513657ebec4db9b3a3624dd07ee8c35345c63db6e7fd889b8251724ce57`. Both reports identify the same application fingerprint. Sandbox process-launch restrictions required the build, security/tooling checks, and browser checks to run outside the sandbox; these restrictions were not application failures.

Local candidate validation is complete. Final-commit CI, staged production promotion/live-version verification, and publication remain separate pending outcomes. No deployment is claimed by these local checks.

## v0.5.2 candidate validation (October 6, 2026)

**Candidate / not released.** App `0.5.2` retains model `v4.3.0` and adds responsive Home/History lists, category counts, cross-page selection, shared single/batch deletion confirmation, and compact photo tips with a visible Cancel action. The [release record](../versions/PWA_VERSIONING.md#v052-scan-history-and-deletion-candidate-october-6-2026) records the scope and intended tag.

The approved browser scope is the complete core suite and `bun run test:reliability --grep "R01:"`; the 30-minute R03 session is excluded. Core cases cover desktop/mobile presentation, mocked synchronization, real-worker offline behavior, and the new History/deletion controls. R01 must run actual inference rather than reuse duplicate reports. All automated scans use fresh browser contexts and the isolated local mock backend. Browser emulation does not establish physical-device performance.

The versioned local checks below identify working-tree application fingerprint `a160ae53dff0970dc8651d4c0068a4ae4deb45b3f4ce84b3f4012cfada6867cb`, based on commit `8f8004225e6944182b6f118ffc108c6284d25707` plus the uncommitted candidate changes. All five model assets match that committed baseline. The October 4/5 reports remain evidence for their original builds. A final candidate commit, remote CI, and deployment verification remain separate steps.

| Check                                                          | Current status                                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting/security, TypeScript, lint, production static build | Passed locally. History and the uncommitted diff/new modal were scanned with redacted output.                                                           |
| Export verification and tooling tests                          | Passed: 10 export checks; 14 tooling cases and 41 assertions.                                                                                           |
| Complete core browser suite                                    | Passed: all 86 cases in 6.4 minutes; zero failures or flaky results across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile coverage. |
| R03 extended use                                               | Not run; excluded from the authorized scope.                                                                                                            |
| R01 repeated actual inference                                  | Passed: 240 predictions across eight photos in Chromium mobile emulation; no class/acceptance variation, confidence range 0, and tensor growth 0.       |
| R03 extended use                                               | Excluded from this candidate's approved run.                                                                                                            |

The existing pipeline needs no change for this UI update: pre-commit formats staged files; pre-push runs security, TypeScript, lint, and formatting checks; `master` push CI additionally builds/verifies the static export and runs the core browser suite against its isolated backend. R01 remains an explicit command. Local checks, remote CI, GitHub publication, and production promotion/version confirmation are separate outcomes.

R01 completed in 53.0 seconds. Its report is under ignored `playwright-report/reliability/` with JSON results in `test-results/reliability/results.json`; the latter records input hashes and the repeatability attachment. Stable scores and tensors establish same-session consistency, not diagnosis accuracy or total browser memory. Core reports use the separate `e2e/` folders.

The complete core run also passed the updated Home/History counts, cross-page selection, search/filter resets, Cancel/X/Escape preservation, short-screen Cancel visibility, and resize focus fallback. F17 verified a late arrival remained outside the confirmed deletion, one local transaction failure retained the dialog for retry, and reconnect removed only the two queued cloud rows/photos. Earlier incomplete runs exposed stale test wording and a failure simulation installed too late; those test setup issues were corrected before the final 86-case pass. These local results do not establish remote CI or deployment.

## v0.5.1 candidate validation (October 5, 2026)

**Candidate / not released.** App `0.5.1` retains model `v4.3.0` and packages the scan-thumbnail fix plus the horizontal treatment-guidelines header. The [release record](../versions/PWA_VERSIONING.md#v051-scan-thumbnail-stability-candidate-october-5-2026) records scope and intended tag. Validation uses fresh browser contexts and the isolated local mock backend.

The approved checks are formatting/security, typecheck, lint, production build, export verification, tooling tests, the complete core browser suite, and `bun run test:reliability --grep "R01:"`. R03 is excluded. The versioned local checks passed; earlier October 3/4 reports retain their original fingerprints.

The tested application fingerprint is `defae7e97f5640eaea888dfc7dfc067ec740521b82e8abd7568cec2623805ca3`. Report base commit is `4eaa33dc1575dc80c1840a1bd340dd28444f949f` with uncommitted thumbnail, layout, version, and documentation changes. Both browser reports match the final app input hashes and version `0.5.1`; this identifies the tested working tree separately from its future release commit.

| Check                                                          | Final result                                                                                                                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run format`, `format:check`, `typecheck`, `lint`, `build` | Passed; production static export and service worker generated successfully.                                                                                          |
| `bun run security:check`                                       | Passed tracked-path and full fetched-history checks.                                                                                                                 |
| `bun run verify:export`                                        | All 10 exported PWA/model asset checks passed.                                                                                                                       |
| `bun run test:tooling`                                         | All 14 tests passed, with 41 assertions.                                                                                                                             |
| `bun run test:e2e`                                             | All 83 cases passed with zero failures, skips, or flaky cases in 6.3 minutes across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile UI.           |
| `bun run test:reliability --grep "R01:"`                       | One Chromium mobile emulation case passed in 48.4 seconds: eight photos × 30 actual predictions; maximum raw-confidence range `0`, maximum net tensor growth `0`.    |
| Preservation                                                   | All 439 protected source/model/notebook/fixture/hook/workflow/configuration files retain their preparation hashes. The adopted trial's Markdown app pointer changed. |

The new F10 thumbnail regression passed in Chromium desktop/mobile and Firefox. It covered new-scan insertion, cloud metadata updates, and offline deletion. R02 passed in Chromium desktop/mobile using the actual service worker and model. About/footer checks passed in both languages across all four browser projects. The seven October 4 photo-lifecycle checks retain their original record; the hook source is unchanged from that verified fix.

All five model hashes match the values recorded in the October 3 table below. Package metadata changed only its app version; the dependency lockfile and model settings remain unchanged. The first sandboxed build, tooling, security, and browser attempts could not launch required child processes (`EPERM`); authorized reruns passed without code changes. R01 used WebGL through desktop SwiftShader and recorded stable raw/displayed classes. This same-session consistency check does not establish a new accuracy or device-performance result.

Exact reports, R01 observations, input/model hashes, and pre-edit copies are preserved under ignored `.tools/release-preparation-v0.5.1-20261005/`. Core report SHA-256 is `e45d5c0d7db3ba9d9d8c190cf1e0cb71c6f28e09b610656bb90dc89bb7829cba`; R01 report SHA-256 is `91d73df8e80df5abba7eae3ccfa0bca68938142bf1145aa8476fdbed636b234a`.

Remote CI, production promotion, live-version confirmation, and tag/Release publication remain pending.

## v0.5.0 candidate validation (October 3, 2026)

**Candidate / not released.** App `0.5.0` retains model `v4.3.0` and includes the guest-owned private-cloud client, preserved legacy history, independent public guidelines, documentation moves, and unchanged photo-compression extraction. The [release record](../versions/PWA_VERSIONING.md#v050-private-cloud-synchronization-candidate-october-3-2026) records scope and tag status.

The approved checks are formatting/security, typecheck, lint, production build, export verification, tooling tests, the complete core browser suite, and `bun run test:reliability --grep R01`. R03 is excluded. All automated scans use fresh browser contexts and the isolated local mock backend. This checklist does not schedule a later physical-device testing session.

Local verification passed for application input fingerprint `9e8064ccfebdc7b18d35feb9049a6506c5092ff2b76017207b270203aa013b91`, covering all 56 build inputs. Report base commit is `9fd175e40b85a805ab482554e351f9686f1f031a`; the release changes are still uncommitted, so the fingerprint identifies the tested working tree rather than a new release commit. Prior October 2 and helper-extraction results certify their own source snapshots only.

| Check                                                          | Final result                                                                                                                                                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run format`, `format:check`, `typecheck`, `lint`, `build` | Passed; production static export and service worker generated successfully.                                                                                                                                                 |
| `bun run security:check`                                       | Passed tracked-path and full fetched-history checks.                                                                                                                                                                        |
| `bun run verify:export`                                        | All 10 exported PWA/model asset checks passed.                                                                                                                                                                              |
| `bun run test:tooling`                                         | All 14 tests passed, with 41 assertions.                                                                                                                                                                                    |
| `bun run test:e2e`                                             | All 80 cases passed with zero failures, skips, or flaky cases in 9.7 minutes across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile UI.                                                                  |
| `bun run test:reliability --grep R01`                          | One Chromium mobile emulation case passed in 1.6 minutes: eight photos × 30 actual predictions, stable raw/displayed classes and acceptance, maximum raw-confidence range `0`, maximum net tensor growth per photo `0`.     |
| Documentation and preservation                                 | All 469 local links/anchors across 36 documents resolved. All 91 protected source/model/notebook/hook/workflow/configuration files retain their preparation-baseline hashes. Package metadata changed only its app version. |

The first sandboxed build/tooling/browser/security attempts could not launch required subprocesses (`EPERM`); authorized reruns completed successfully. No application or model changes were made to satisfy check outcomes. The R01 backend was WebGL using desktop SwiftShader; this same-session consistency result does not establish field accuracy, temperature, or battery behavior.

The five model file hashes remain:

| File under `public/model/` | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `model.json`               | `f5ebdd96893513f05d78126880e9a56a94c4750f75b02a2ee2fb7d3792c8267b` |
| `model_config.json`        | `40216b04bf0e3f303e0d23beb7059cfec3d43ac6e01be35a3431600443c37d0c` |
| `group1-shard1of3.bin`     | `04e1e18a28cb414442c66617a0bc0cbdff2e93116d08d0a170f04b30572bf09c` |
| `group1-shard2of3.bin`     | `0432d0dc9a25e4d2d0048aa5c8120076c05466a6363bd2d5a0c5e5ee4fd34954` |
| `group1-shard3of3.bin`     | `a0fab950ece352711e938467d6bf5f6aaed6c48b5ee1e37812b0a7192399292b` |

Exact reports, R01 observations, input/model hashes, and pre-edit copies are preserved under ignored `.tools/release-preparation-v0.5.0-20261003/`. Core report SHA-256 is `9b3653f760a3d4d5aa26fc55d75cff936c573a203b5860512420341687155214`; R01 report SHA-256 is `0304b1db6d0d3a3a760bdc0c0c7067cc7cd987b153ae92a5d8246a5231dec6b7`. Remote CI, production promotion, live-version confirmation, and tag/Release publication remain pending. No production guest signup or cloud scan/upload/download was performed by this local verification.

### Dependency security patch validation (October 3, 2026)

Next.js and the matching ESLint configuration are patched to `16.3.6`, with the Browserslist override and compatible lockfile updates recorded in the [dependency review](../security/DEPENDENCY_SECURITY.md). The app remains `0.5.0`, model `v4.3.0`. Frozen installation and the historical-runtime verifier pass. The production-dependency audit reports no findings; the full audit retains one development-only `braces` advisory with no published patch. This residual is not suppressed.

Formatting, TypeScript, lint, production static build, all 10 export checks, all 14 tooling tests with 41 assertions, credential/history checks, and the separate scan of new security records passed. The complete core suite passed all 80 cases with zero failures in 7.9 minutes against the isolated export/local mock backend. Application fingerprint: `6118e228f8b97b6418f5d3c88cd2f755c5c11a3e75a01ff4ba6590bf42699734`. Model assets and all 46 notebooks retain their bytes. Corruption checks prove that the archive verifier rejects changed snapshot or ledger bytes. Reports and preservation receipts are saved under ignored `.tools/dependabot-remediation-20261003/`. The previous candidate report remains evidence for its own fingerprint. R03 was not run. No commit, push, deployment, or remote alert closure is claimed.

## Install and run

Use the project's pinned Bun dependencies and Node.js 24 (Playwright runs through Node):

```bash
bun install --frozen-lockfile
node node_modules/@playwright/test/cli.js install chromium firefox webkit
bun run test:e2e
bun run test:report
```

On Linux, install browser system dependencies with `node node_modules/@playwright/test/cli.js install --with-deps chromium firefox webkit`. CI uses this pinned Node entry point and runs the core camera/install/diagnostics suite through `bun run test:e2e`; it does not invoke the 30-minute R03 testcase. The existing master-only workflow already includes `diagnostics.pw.ts` through Playwright's core `testMatch`, and runs the new tooling tests through `bun run test:tooling`; no separate workflow or Husky browser-test command is required.

`test:e2e` builds an isolated production static export under ignored `.test-app/`, starts its local server, runs tests, and stops the server. It reuses that build only when application/configuration/dependency/model input hashes match. It does not use `next dev` or `next start`, and does not overwrite `out/` or the production service worker. The local test backend is compiled into this private copy. Never deploy `.test-app/`.

```bash
# Focus on one browser or case while developing.
bun run test:e2e --project=chromium-mobile --grep F07

# Full reliability: 30 predictions per image and a 30-minute session.
bun run test:reliability
bun run test:report:reliability

# Run either reliability case independently.
bun run test:reliability --grep R01
bun run test:reliability --grep R03
```

Reliability defaults to `chromium-mobile`, a desktop browser with a phone viewport/touch emulation. Use `--project=chromium-desktop` to repeat it there. Headless rendering can use a software GPU: the report records the actual backend/renderer. Do not describe either project as a physical phone.

## Local generated folders

These folders are expected after running the commands below. They hold generated files or downloaded tools, are ignored by Git, and are not application source code. Stop any command using a folder first: press `Ctrl+C` in a running test, report-server, security-check, or interactive Playwright MCP terminal. Then check whether it contains evidence or a model backup you still need before deleting it. Keep the tracked `tools/` directory: it contains the scripts and tests that create or use these generated folders.

| Folder               | Why it appears and what it contains                                                                                                                                                            | Safe to delete?                               | Reappears or required action                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.test-app/`         | `bun run test:build`, `test:e2e`, or `test:reliability` creates an isolated app copy and static export. Input hashes select a reusable build; changed app inputs can create another subfolder. | Yes, after active tests stop.                 | Next `test:build`, `test:e2e`, or `test:reliability` rebuilds it. Never deploy it: local mock backend only. |
| `.tools/`            | Security checks download Gitleaks here. Local model trials keep exact V3, V4.0, V4.1.1, and V4.2.0 copies in `.tools/model-backups/`. It is separate from tracked `tools/`.                    | Keep the backups until model choice is final. | Gitleaks can be reinstalled, but ignored model backups do not recreate automatically.                       |
| `playwright-report/` | Browser tests write readable HTML reports under `e2e/` or `reliability/`. Open them with `bun run test:report` or `bun run test:report:reliability`.                                           | Yes, after report server stops.               | Next browser-test run creates a new report. Report command only opens existing report.                      |
| `test-results/`      | Browser tests write JSON results, attached evidence, failure screenshots/traces, and R03's `endurance-progress.json`. Suites use separate `e2e/` and `reliability/` subfolders.                | Yes, after active tests stop.                 | Future test run generates new evidence. Partial R03 progress does not resume or count as a pass.            |
| `.playwright-mcp/`   | Interactive Playwright MCP sessions save browser console and page diagnostics here. It is separate from CLI browser-test reports.                                                              | Yes, after interactive MCP session ends.      | Next interactive MCP session that records diagnostics recreates it.                                         |

A new run replaces the previous results for that suite, including when using `--grep`. Running R01 and then R03 separately leaves the latest reliability report showing R03 only. Run `bun run test:reliability` to include both in one report. Before rerunning or cleaning folders, preserve both the HTML report and corresponding test results if they are formal evaluation evidence; they can contain input photos and predictions. None of these folders replaces the physical-device checklist.

## What runs where

| Location                             | Checks                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Husky pre-commit                     | Existing staged-file formatting                                           |
| Husky pre-push                       | Existing security, TypeScript, lint, and formatting checks                |
| GitHub CI, push to `master` only     | Existing checks/build/export verification plus core E2E suite and reports |
| Explicit reliability command         | R01 repeated actual inference and R03 extended use                        |
| Development team on physical devices | R01–R04 manual checklist below                                            |

Long reliability sessions do not run on every push. `bun run test:tooling` still runs tooling unit tests; `.pw.ts` files are selected by Playwright and are not Bun unit tests. The Python notebook verifiers remain separate commands.

## Functional cases

| ID      | Action and expected result                                                                                                                                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F01     | Empty phone Recent and History show the empty-state message; desktop Home omits the Recent heading.                                                                                                                                                                                              |
| F02     | Phone Scan opens its sheet; Cancel closes it without creating a record. At 768px and above, Install opens its guide and scan/upload entry controls are hidden.                                                                                                                                   |
| F03     | Upload Photo opens its file input and previews the chosen bytes.                                                                                                                                                                                                                                 |
| F04     | Below 768px, Take Photo opens the guided live camera; Capture passes a full-frame photo to review. The Take Photo control is hidden on wider screens. Physical camera behavior remains manual.                                                                                                   |
| F05     | Empty file selection stores nothing; Retake reopens the live camera or same upload picker used for the photo. X or Escape closes review and clears the selected photo without saving a record.                                                                                                   |
| F06     | Each of seven controlled accepted predictions shows the photo, class, and confidence.                                                                                                                                                                                                            |
| F07     | Accepted and uncertain reports show stored confidence rounded down to at most one decimal, with no trailing `.0`; new reports preserve raw classifier confidence through save/reload. The optional fresh-result probability table is preserved; its rows are not saved in History or About logs. |
| F08–F09 | Saved result appears in Recent and History; the mobile History row and desktop Details action show matching data.                                                                                                                                                                                |
| F10     | Below 768px, Home shows the newest one card and History shows four rows per page. At or above 768px, Home shows Install without Recent/View All History labels; History retains six cards per page.                                                                                              |
| F11     | Search/category counts and previous/next navigation work; typing search resets All and closes mobile filters. Confirmed deletion of the last page returns to a valid page.                                                                                                                       |
| F12     | Reload preserves records and photos.                                                                                                                                                                                                                                                             |
| F13     | Re-uploading identical bytes shows "Photo already scanned" in the preview. Retake, Cancel, X, and View saved result work; no new record or inference is created.                                                                                                                                 |
| F14     | Long result badges stay inside the photo and Close stays reachable at narrow, landscape, and desktop sizes.                                                                                                                                                                                      |
| F15     | A Healthy Fruit result moves from loading to unavailable advice, then uses the downloaded mock `healthy` row and remains readable offline in English/Bisaya.                                                                                                                                     |
| F16     | Uncertain-result photo reminders and headings work in English/Bisaya with pending, empty, downloaded, and offline guideline states.                                                                                                                                                              |
| F17     | Select reports across History pages or Select all matching results; shared single/batch confirmation supports cancellation, fixed IDs, busy locking, retry, and focus return.                                                                                                                    |
| F18     | Compact bilingual photo tips appear before camera/gallery actions; Cancel remains visible while short-screen content scrolls and desktop keeps the bounded centered sheet.                                                                                                                       |
| A01     | About-only diagnostics default off; enabling preserves events across tabs/reloads, exports text, and clears only diagnostic history. Disabling stops new recording and retains previous entries.                                                                                                 |
| A02     | Denied diagnostic persistence leaves memory-only logs usable; failed clipboard access offers manual selection; English/Bisaya controls remain usable.                                                                                                                                            |
| A03     | Photo-check, inference/save, and confirmed-deletion events remain readable from About after their modals close; clearing logs preserves a real saved report/photo.                                                                                                                               |
| M01     | All eight supplied photos run through the real model and app; record predicted/expected labels and score diagnostics separately from UI assertions.                                                                                                                                              |

### v0.5.2 History, deletion, and photo-tips scope (October 6, 2026)

Use both languages, narrow/desktop viewports, fresh contexts, and the local mock backend. Seed enough mixed-category records to cover multiple pages, including earlier model labels and an unlabeled legacy report. Controlled scores establish UI behavior, not model accuracy.

- Check Home's one/four mounted-card limit and History's five/six page size on either side of 768px. Mobile History uses thumbnail rows with a tappable photo/text area; desktop retains photo cards and Details/trash controls. Resizing keeps the previous first record on its recalculated page, and losing the last page leaves a valid page.
- Count each category over all disease-name search matches before the category filter and pagination. Both healthy classes count as Healthy. Typing or clearing search resets All, page one, selection, and the mobile filter bar; changing category resets page one and selection. A search with no matches shows the translated empty-results message.
- Select reports on multiple pages, return between pages, and confirm the selected count stays correct. Select all includes every current matching report across pages. A new arriving report must remain unselected until another selection action; records removed from the results must lose their selection. Changing search or category clears the selection.
- Open confirmation from a Home trash action, desktop History trash action, and History selected-delete action. Check singular/plural wording and the snapshotted count. Cancel, X, and Escape must close without changing records. Focus starts on Cancel, stays inside the native modal, and returns to the initiating enabled control or the list heading if that control disappeared.
- While the local deletion save is held open, Delete, Cancel, and X remain disabled; Escape must not dismiss it, and background controls stay blocked. Repeated Delete must not start another local save. Introduce a local save failure, check the translated error, and retry the same confirmed IDs. A new scan arriving while confirmation is open must not join the deletion.
- Check offline single/batch deletion of local-only, unowned, and owned scans. Local-only/unowned rows are removed; owned rows disappear from visible History but retain their pending-deletion marker until cloud cleanup succeeds. Reconnect through the local mock and check photo/row cleanup, retry, and no restored deleted records. Existing owner authorization and upload-race cases remain relevant.
- Open the photo-tips sheet in both languages at narrow, short/landscape, and desktop sizes. Tips appear once before the picker actions; the drag handle and Cancel remain visible while the middle content scrolls. Desktop keeps the centered panel within 520px. Cancel creates no scan. The advice works offline and does not start a camera stream, alter pixels, or invoke inference.

The History, deletion, and photo-tip conditions remain in use for the current release, with four phone History reports per page and six on desktop. The October 8 responsive Install flow replaces the desktop Home preview and desktop scan entry described in this historical scope; current F01–F05/F10 expectations above and `tools/e2e/install-guide.pw.ts` cover that change. Passing results must identify the final versioned source; the original `0.5.2`, F10/F11, and cloud-race reports retain their dated evidence limits.

### v0.4.9 regression scope (October 2, 2026)

The current supplied fixture set contains eight photos. The Mango Scab PNG and Bacterial Canker JPG replace earlier byte copies; six other photos are unchanged. `tools/e2e/fixtures/manifest.json` records the current filenames, SHA-256 hashes, and provisional filename-derived labels. Real-model observations must use this current set, without rewriting supplied labels to match predictions.

F05 checks review dismissal through X/Escape and retained Retake behavior. F13 checks duplicate Cancel/X/Retake/View saved result while retaining photo review until the explicit result action, with no extra inference or saved record. Eligibility requires the exact active `model_version`; another model label and an unlabeled legacy record must trigger fresh inference while keeping their original reports in History. Controlled F06 outputs cover all seven class positions, including separate Healthy Fruit and Healthy Leaf; M01 and R01 use the actual V4.3.0 export. F15 checks accepted guideline loading/unavailable/downloaded/offline states; F16 checks the uncertain photo reminder across pending/empty/downloaded/offline caches in English and Bisaya. Browser UI cases verify dynamic About/footer versions in both languages. No numerical preprocessing or rejection settings change to satisfy tests.

All automated runs use the isolated export, fresh contexts, and local mock backend. Husky and CI need no model-specific changes: the core suite remains in `master` push CI, and R01/R03 remain explicit local reliability runs. The dated notes below preserve what was checked at the time; the adoption receipt records final v0.4.9 evidence.

**Photo-review update (September 30, 2026):** F05 and F13 above describe the new intended behavior. The existing automated browser cases were left unchanged for the September 30 update; cases that expect automatic duplicate-report opening need a separate update before they can certify this flow. Existing passing reports do not validate the new interaction.

A separate local check passed 20 scenario groups in Chromium desktop/mobile emulation, in English and Bisaya. It used an isolated production export and the local mock backend. Seeded history rows exercised duplicate handling; one new photo exercised actual model inference, compression, and save under a rapid double click. It also covered hash reuse, stale completions, forced lookup failures, model/pending-delete exclusions, deleted-result rechecks, focus, small layouts, and discarded preview URL cleanup. The local script and evidence are in ignored `.tools/photo-review-smoke.mjs` and `.tools/photo-review-verification/`; they are not part of the unchanged CI suite. Native camera operation and physical-device performance were not measured.

Check the new review behavior in English and Bisaya on desktop and a phone:

- Select a new photo. The preview appears while the local duplicate check runs; diagnosis remains disabled until it succeeds. Verify X and Escape close review without opening a picker or creating a scan, and that selecting the same file afterward works.
- Select identical bytes from an eligible saved scan. Verify the duplicate title and description, retained photo, Retake/Cancel/X controls, and View saved result. Cancel leaves History unchanged; View saved result opens the original record without another classifier call. Repeat offline with an already-cached app.
- Retake from camera and gallery separately. Verify the same picker opens and cancelling that picker leaves no stale preview. Confirm keyboard focus stays usable and the background cannot scroll while the review dialog is open.
- Close or replace a photo while its hash or lookup is pending. Its late completion must not reopen the dialog or overwrite the newer photo's review state. Simulate a lookup failure and verify retry works while diagnosis remains disabled.
- Exclude pending-deletion records and records bearing a different model label from duplicate reuse. Legacy unversioned records retain their prior behavior. Delete an eligible saved record while its duplicate preview is open, then use View saved result: the app must recheck rather than reopen a stale record.
- Rapidly activate Run AI Diagnosis twice. Only one inference and one new record should run. X and Escape must not dismiss active diagnosis. If another eligible record appears after preview checking, the final lookup should show the duplicate state instead of running inference.

### Capture-guidance review (October 2, 2026)

The Scan Sheet now displays two shared framing/lighting tips above its camera and gallery actions. Normal photo review uses a revised inspection reminder; duplicate review keeps its existing wording. Existing automated cases and fixtures were not changed for this text/layout update.

- In English and Bisaya, verify both tips appear once beneath the sheet title and before either action. Camera and gallery descriptions should explain their actions without repeating the tips.
- At narrow phone and landscape sizes, scroll the sheet content and reach Upload Photo and Cancel. The drag handle must remain available; sheet dragging and dismissal must still work.
- Select a new photo and check the updated review reminder. Select an eligible duplicate and check that its duplicate message and controls remain unchanged. X, Escape, Retake, and diagnosis keep their existing behavior.
- Repeat with an already-cached app offline. The tips should require no network request, camera stream, image analysis, or extra model loading. They are advice, not confirmation that a photo is suitable.

The camera and comprehension checks above are retained from the October 2 guidance review; the [v0.5.5 prepared release section](#v055-release-validation-october-10-2026) preserves the later guided-camera scope, and the [v0.7.0 record](#v070-diagnostics-and-raw-confidence-october-17-2026) identifies the current candidate. The local backup for this reversible change is `.tools/ui-backups/photo-guidance-20261001T212013Z/`; restore only this change and rebuild the service worker, preserving newer unrelated work.

Controlled tests replace only the model response with fixed scores. They exercise the real classifier gates, UI, local storage, and client sync against a mock service. Real-model and offline cases use the actual exported model assets. No test changes the classifier's resizing, normalization, precision, or rejection rules.

## Guided live camera (October 8, 2026)

**Documentation completed October 9, 2026.** Below 768px, Take Photo opens the browser's live camera dialog instead of a native-camera file picker. The square is a positioning guide; Capture preserves the entire video frame and opens ordinary photo review. Run AI Diagnosis remains a separate action. Camera Retake opens a new stream, and upload Retake reopens the gallery input. The flow uses secure-context and camera-API capability checks on both iOS and Android; viewport width does not establish the operating system or camera support.

Run the focused cases with `bun run test:e2e --grep "C0[1-8]:"`. They use the isolated export and local mock backend. `tools/e2e/guided-camera.pw.ts` includes:

- **C01:** a full-frame 1280×720 capture, correctly sized and centered guide in portrait/landscape, no prediction or saved scan before Run, stream release, camera Retake, and Escape dismissal.
- **C02:** one captured photo passes through existing review to one controlled diagnosis and one saved record.
- **C03:** closing a pending permission request stops its late stream, contains keyboard focus, restores launcher focus, and handles permission completion after backgrounding.
- **C04:** backgrounding releases the camera and ignores a delayed JPEG encoding result without creating review or a scan.
- **C05:** missing video data keeps Capture disabled; a later frame enables it; ended tracks and `pagehide` release hardware; retry opens a new stream.
- **C06:** denied permission displays the Bisaya message, closes cleanly, and permits a gallery upload with unchanged source bytes.
- **C07:** Chromium plays and captures a real browser video element using a synthetic canvas stream, preserving 1280×720 dimensions and releasing its track.
- **C08:** a missing camera API displays the unsupported state without an ineffective retry button; Close returns to the usable Upload Photo option.

The preserved October 8 local run recorded **27 passed, two declared skips, zero unexpected failures, and zero flaky cases** in 59.3 seconds. Its application fingerprint is `310dde190e5bd9a9efbb79c66259d27525f35fccc7c4852df0715064917c7be5`; the ignored `.tools/guided-camera-review/verification.json` identifies the snapshot and preservation check. The later camera-style check recorded 18 passed and one declared skip in 49.1 seconds, with preserved-file hashes unchanged, under `.tools/guided-camera-style-review/verification.json`. These are earlier focused runs, not certification of subsequent working-tree changes or a completed release.

Controlled camera tests replace media acquisition/playback and class scores while retaining real JPEG encoding and photo decoding. C07 exercises actual video playback from a synthetic source, not a phone camera. Windows WebKit skips C02's TFJS inference, and C07 is scoped to Chromium. No camera quality, disease accuracy, heat, battery, lens choice, physical iOS/Android compatibility, or 30-minute R03 result is established by these checks.

Use the [physical camera checklist](PHYSICAL_RELIABILITY_CHECKLIST.md#r04-m01-guided-camera-gallery-and-layout) on each recorded iOS/Android browser and installed-PWA combination. Check HTTPS, permission denial/recovery, portrait/landscape and safe areas, full-frame capture, camera and gallery Retake, Close before permission completes, background/resume, and OS camera-indicator cleanup. A secure localhost test does not prove that a phone's plain-HTTP LAN URL supports live camera. After the app/model are cached, test offline capture and diagnosis separately from cloud synchronization. There is no automatic native-camera fallback; close live capture and choose Upload Photo when it is unsupported.

## Responsive installation guide (v0.5.5)

`tools/e2e/install-guide.pw.ts` covers the installation guide through controlled browser signals. At 768px and above, Home and the header direct users to installation, with Android/iOS instructions and a QR link. Below 768px, detected platform identity chooses phone instructions; an actual `beforeinstallprompt` event separately controls native install availability. Both languages, Close/Continue in Browser, keyboard focus, prompt dismissal/failure, late prompt availability, and standalone/appinstalled signals belong to the core CI scope.

The QR points to `https://mangoleafai.vercel.app/?install=1`, including when opened from localhost. Test that the flag opens the guide once, is removed without losing other query values/hash/history state, and does not invoke a native prompt automatically. Installed standalone mode consumes the arrival flag without reopening the guide. A single-use native prompt requires an explicit user tap; accepting its choice alone is not the app's installed-state confirmation.

Actual Safari Share/Add to Home Screen, Android browser-menu installation, QR scanning, OS/browser support, installed-PWA launch, rotation, and safe-area control reachability require recorded observations in [R04-M03](PHYSICAL_RELIABILITY_CHECKLIST.md#r04-m03-installation-guide-and-installed-launch). Browser emulation and user-agent strings establish wording and layout coverage, not physical installation results.

## Scan-thumbnail stability: October 4, 2026

**Historical snapshot:** This section preserves the October 4 test design and measurements. The October 6 scope above adds responsive counts and shared deletion confirmation to the current cases; their results must identify the final candidate separately.

`tools/e2e/history.pw.ts` includes a focused F10 regression for thumbnail blinking. It holds the mock photo upload and row insertion separately, then checks that adding a scan and changing owner/path/status metadata keep both cards' photo URLs unchanged. It also records image removal and URL revocation so a photo that disappears and returns cannot pass solely because it is eventually visible. Offline deletion must release the deleted card's URL exactly once while the remaining thumbnail stays unchanged.

The isolated pre-fix probe found different Blob objects containing identical bytes on repeated IndexedDB reads. Three metadata-only writes reloaded four thumbnails on each pass. Follow-up checks must also cover same-size/different-byte replacement photos, pending comparison cancellation, empty photos, unmount cleanup, and hash failure recovery. Review/probe records remain ignored under `.tools/recent-scans-review-20261004/`; they are local diagnostic evidence, not deployed files or model-accuracy results.

**Validation:** `bun run format`, `bun run typecheck`, `bun run lint`, `bun run build`, and all 10 export checks pass. The focused F10/F11, R02, S03, and S04 run passes all **10 cases** across Chromium desktop and mobile emulation. The new F10 case records no thumbnail removals or URL changes during scan insertion and cloud metadata updates. Seven additional local lifecycle checks pass for equal-byte wrapper reuse under React StrictMode, offline comparison, same-size/different-byte replacement, empty photos, superseded comparisons, unmount cancellation, and hashing failure recovery. All seven allocated URLs in that lifecycle check are released exactly once, with no page errors.

The tested working-tree application fingerprint is `7efd73560bed1bb715f16a03036478b659448f92a8505d53f76716a2064c6355`, based on commit `4eaa33dc1575dc80c1840a1bd340dd28444f949f` with the thumbnail fix uncommitted. This record identifies this local source snapshot; earlier reports retain their original identities. No new diagnosis-accuracy or device-performance claim follows from these checks. App remains `0.5.0`, model remains `v4.3.0`, and all five model assets retain their previous hashes.

## Treatment-guideline availability checks

Use an isolated browser/profile and mock backend for these checks. A successfully downloaded guideline is required for offline treatment advice; the application no longer bundles treatment text.

- Open an accepted scan's details while its saved-guideline query is pending. A loading message should appear rather than a premature missing-data message.
- Open an `Uncertain / Unrecognized` result with the guideline query pending, with an empty cache, and with downloaded advice. In every case, including offline use, verify the exact approved photo reminder and “Try another photo” / “Sulayi og laing litrato” heading. Toggle English/Bisaya; it must not show the guideline-loading or internet/sync message. Reopen an accepted class result and verify its ordinary guideline heading and content still work.
- With no matching cached guideline, verify the meaningful unavailable message in English and Bisaya, including offline use. No generic treatment instructions should appear.
- Download guidance successfully, go offline, and reopen details. The saved guidance should remain readable even if later synchronization fails.
- Supply whitespace-only English text and valid Bisaya text, then reverse the fields. Only the blank language should show the unavailable message.
- Verify Healthy Leaf and Healthy Fruit both use the `healthy` row. Update a mock guideline, reconnect and sync, then confirm the displayed copy updates without changing application code.

## Guideline update ordering: October 7, 2026

Use the isolated local mock backend and fresh browser contexts. This is a client ordering regression, not evidence that a live farmer received outdated advice. The October 6 candidate results identify their original application fingerprint and do not verify this later source change.

The [guideline manager cases](../../tools/guidelines-sync.test.mjs) cover direct changes, both arrival orders, repeated events, download/local-write failures, offline cleanup, subscription readiness, and conflicting local snapshots. They use controlled values rather than live Supabase data.

The focused browser cases are [G01–G07 in guideline-sync.pw.ts](../../tools/e2e/guideline-sync.pw.ts). G01–G06 exercise the real SDK subscription callback in Chromium desktop/mobile and Firefox; G07 allows the actual worker in Chromium. The mock controls table changes, WebSocket delivery, held HTTP responses, and failed follow-ups. It does not reproduce Supabase server authorization or establish production event-delivery guarantees.

- Hold an HTTP response containing guidance B. Deliver a Realtime INSERT/UPDATE containing C before releasing that response. C must reach IndexedDB and the UI directly; the held result must not replace it. One protected follow-up GET must reconcile the complete set after the attempt finishes or fails.
- Save the HTTP result first, then deliver C through Realtime. C must replace the local row directly without an extra GET solely for that event. No millisecond threshold or special reconnect state should control this distinction.
- Repeat the overlap with DELETE and INSERT, multiple rapid notifications, and a failed follow-up. Deleted rows must not return, new values must remain available, repeated notifications must share the follow-up, and a failed request must preserve saved advice for retry.
- Delay the local HTTP commit as well as the network response. A received event during that save must abort and roll back the older full-set transaction rather than expose a partial replacement. An unrelated database failure must remain a failed attempt, not be mistaken for an intentional discard. Write a changed guideline through another tab while a GET is pending; the final snapshot comparison must reject the conflicting result.
- Go offline or unmount the synchronization hook during pending work. The old task must not install stale guidance afterward. Reconnect and establish the subscription, including changes made before listening became ready; a full refresh must reconcile missed edits/deletions. This cleanup scope is separate from a temporary socket interruption while the browser remains online.
- Activate the real service worker after seeding an old guideline HTTP response. Confirm cleanup removes that response, later guideline REST requests use the network, and a failed request preserves IndexedDB advice instead of accepting the old HTTP response as fresh. Application/model asset caching and private-cloud bypass rules remain intact.
- Keep public guidance available when guest sign-in fails. Use both languages and verify accepted guidance, missing/blank language fields, and uncertain-photo reminders retain their established behavior.

**Local validation, October 7, 2026:** These checks identify application input fingerprint `17cf8febe8c0b6c5b1e8ac7e669f4f28df687f66f76c13a79a2171a3ef3136ef`, based on commit `ee91cf693fd52acb6f882f2c049a3b2ddd599a1f` plus the uncommitted working tree. App/model labels remain `0.5.2` / `v4.3.0`.

The existing local `v0.5.2` tag identifies that baseline commit and excludes this fix. These results concern later, unreleased working-tree code, not an amendment or recertification of that tag. A future release must receive a new app version/tag and identify its final tested commit.

| Check                                                           | Result                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guideline manager cases and existing tooling                    | All 26 cases passed, including 12 guideline-ordering cases.                                                                                                                     |
| Focused G01–G07 browser suite                                   | 20 passed; the one Firefox worker case was skipped by its declared Chromium scope. G01–G06 passed in Chromium desktop/mobile and Firefox; G07 passed in both Chromium projects. |
| Formatting, security, TypeScript, lint, production static build | Passed locally.                                                                                                                                                                 |
| Export verification                                             | All 10 checks passed.                                                                                                                                                           |
| Complete core browser suite                                     | 106 passed and one declared Firefox G07 worker skip in 9.9 minutes (593,726 ms), with zero unexpected failures or flaky results.                                                |

The focused and complete browser results exercise actual SDK callbacks and, in G07, worker activation/cache cleanup and network-only requests. They do not establish a production incident, remote Supabase event guarantees, physical-device performance, or deployment. Final complete-suite reports are in ignored `playwright-report/e2e/` and `test-results/e2e/results.json`; that run replaced the focused reports. No reliability command was run for this fix, so earlier R01 measurements remain tied to their original source. No release or production deployment is established by this section.

An initial complete-suite attempt was stopped at the existing F15/F16 loading fixture: its artificial hold on guideline reads also blocked the new before-fetch baseline read. The test setup now releases those held reads before waiting for queued synchronization. Loading, unavailable-language, uncertain-reminder, and offline assertions remain intact and passed in the final complete run. This correction changed test ordering, not the application fingerprint or inference behavior. No runtime source changed after the verified production build.

## Cloud ownership and offline checks

The cloud ownership implementation and its dated evidence are retained in the [Supabase preservation guide](../supabase/SECURITY-AND-SYNC.md). The October 15 local-only candidate does not call these private endpoints and does not modify those server resources. Current browser acceptance is defined in [local History and quota validation](#local-only-history-and-storage-quota-october-15-2026).

Earlier S01–S04 browser cases exercised guest isolation and private upload/deletion behavior. Their preserved reports remain historical; current `local-history.pw.ts` and `storage-quota.pw.ts` cover the replacement workflow. The mock server retains its old protected endpoints so new tests can detect any accidental request. No browser automation may target production Supabase scans or photos.

For separately authorized server maintenance, inspect actual schema/grants/policies with the [catalog checks](../../supabase/sql/verify-cloud-security.sql) and [rolled-back policy fixtures](../../supabase/sql/test-cloud-policy-fixtures.sql). The local-only client change does not weaken RLS or prove current live server configuration. Preserve private backups before any future cleanup; neither cloud data deletion nor Auth changes belong to this task.

## Fixture and report interpretation

`tools/e2e/fixtures/photos/` contains byte-verified copies of the eight supplied photos. Original Downloads files are never changed. `manifest.json` records hashes and provisional labels from the supplied filenames; expert label verification is pending. Do not edit expected labels to make predictions look correct. These few examples are smoke coverage, not a representative accuracy dataset or new independent test set.

HTML reports live under ignored `playwright-report/e2e/` or `playwright-report/reliability/`. JSON, screenshots, and failure traces are under ignored `test-results/`. Save formal evaluation evidence outside these replaceable run folders before another run. Reports may contain input photos and scan output.

M01 attaches the original photo, screenshot, supplied label, prediction, raw top class, confidence, margin, normalized entropy, failed gates, timing, backend, browser, model version, configuration asset identity (`modelAssetVersion`), and application-input fingerprint. The separate test-only harness imports the production classifier and observes its actual output; it is never bundled into the app. Rejection console messages contain four-decimal rounded values. The harness records full JavaScript numeric values.

A correctly displayed wrong diagnosis passes UI assertions but is marked as a model-label mismatch in its report. Review all such observations before adopting a model. Consistency can also pass for consistently wrong predictions. Formal accuracy/OOD evaluation and confidence intervals need suitable expert-reviewed, independent data.

For debugging or technical-defense review, open the browser's developer console in the development app (`bun run dev`) or an updated production build, then submit a new photo through the scan sheet. Expand `Class probabilities (accepted)` or `Class probabilities (rejected)` to see all seven classes ranked by score, displayed as percentages with two decimals. These are scores for one image, not per-class accuracy; rounding can make their displayed total differ slightly from 100%. Sorting and formatting do not change the original scores or rejection rules. The preserved optional fresh-result table uses formatted copies of the same scores. Its rows are not persisted in History or included in About diagnostic logs; an eligible duplicate notice and its View saved result action do not run inference or print a new table. Automated model reports record the full probability vector. An older deployed build retains its previous logging behavior until the updated build is deployed and loaded.

## Reliability protocol

| ID  | Automated scope                                                                                                                                                                     | Pass condition / limitation                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R01 | 30 sequential actual classifier calls per photo in one browser session; duplicate lookup is not involved.                                                                           | Stable raw top class and displayed class/acceptance; confidence range no greater than 0.001; no net tensor growth. This is a predeclared regression tolerance, not proof across devices or cold starts.                                                                                                            |
| R02 | Activate the real worker, confirm cached page/config/model shards, save a scan online, disconnect, reload history, diagnose a different unscanned file, reload again, reconnect.    | History/photos survive; new inference and storage succeed offline; report IDs, local photo bytes, and local-only status remain intact after reconnect; no private cloud requests occur. Initial caching is required. Automated SW instrumentation runs on Chromium.                                                |
| R03 | 30-minute loop alternating original gallery uploads and guided-camera captures from synthetic live video, actual model inference, Details, History, deletion, and periodic reloads. | Capture/Retake performs no inference or save; streams stop before review; each diagnosed cycle runs one actual prediction. Accepted/uncertain UI matches the saved row. Deleted records cannot bypass later inference. Durations and available heap values are observations, not validated performance thresholds. |
| R04 | Chromium desktop/mobile and Firefox run scan workflows; WebKit runs navigation and mobile-control checks only because its Windows runner cannot exercise this WebGL TFJS path.      | Viewport/browser coverage only. Actual device models, OS/browser versions, inference, camera permissions, heat, and background behavior need manual checks.                                                                                                                                                        |

Test inputs, repetitions, and pass conditions should be fixed before formal evaluation. Do not loosen them after failure merely to obtain a pass. Record investigated failures and any revised protocol as a new evaluation run.

The manuscript calls for extended use but does not specify a duration. The development team selected 30 minutes as this project's R03 protocol; it is not a duration required by the manuscript.

R03 writes `endurance-progress.json` at startup, before each cycle, after each completed cycle, and when the session completes or throws. It preserves completed cycles and the active photo/source if the session stops early; partial evidence never resumes a run or counts as a pass. A completed report requires at least 30 minutes and both capture sources.

### R03 guided-camera alignment (October 9, 2026)

**Updated protocol; not executed.** The user requested alignment with the new guided camera and explicitly excluded running R03. No full or shortened R03 session was run for this update. Static checks and test discovery do not establish an endurance pass; the earlier dated reports above retain their original scope.

`tools/e2e/endurance.pw.ts` retains its 30-minute duration and explicit reliability-only scope. Each supplied fixture is exercised through gallery upload and then guided capture before the next fixture is selected. Camera cycles use the same small canvas-stream approach as C07: local fixture pixels feed a real 1280×720 browser video stream; the actual camera component performs its full-frame JPEG encoding, ordinary photo review, and Retake. The first capture is discarded, Retake opens a new stream in the landscape viewport, and the second capture is diagnosed only after an explicit Run AI Diagnosis action. Both acquired tracks must stop and the live-track count must return to zero before diagnosis.

The test never replaces model scores. It counts the production classifier's probability-report event to require exactly one actual prediction per diagnosed cycle, verifies the active model label and selected-photo hash, checks the displayed accepted/uncertain result and confidence against the saved row, confirms a nonempty saved photo, reopens History Details, and deletes the record before the next cycle. Gallery hashes identify original fixture bytes; camera hashes identify the generated JPEG, which is a transformed image and must not be claimed as the original-byte prediction. Progress records include source/capture hashes, source type, result/acceptance, prediction count, camera starts/stops, Retake count, photo bytes, cycle duration, and available JavaScript heap size.

This automated protocol uses Chromium desktop/mobile emulation, a synthetic camera, and the local mock backend. It does not establish physical camera permissions, actual lens selection, OS camera-indicator cleanup, autofocus or image quality, installed-PWA background behavior, airplane-mode capture, heat, battery, or model accuracy. The [physical R03 checklist](PHYSICAL_RELIABILITY_CHECKLIST.md#r03-m01-30-minute-mixed-use-session) requires a future session mixing real live capture, Retake, gallery, permission recovery, rotation, camera background/reopen, and cached offline diagnosis. Core C01–C08 camera and install-guide cases remain separate CI coverage; R03 is not added to GitHub CI or Husky.

### R03 local-only and V4.5.0 alignment (October 16, 2026)

**Updated for a future run; not executed.** The 30-minute duration remains fixed. Before its timed session, R03 verifies the served model-configuration hash against the isolated build, checks the active model label and confidence-only gates (`0.70`, margin/entropy `null`), and records the app/model versions, browser, model hashes, and application fingerprint. Progress and final attachments include the actual WebGL precision messages across initialization/reloads; absence of a message is not proof of a particular precision.

Every completed diagnosis must save a local-only IndexedDB report and a photo, with zero Auth, private scans, or Storage requests. Public treatment-guideline requests remain allowed. Existing fresh-inference counting, capture/Retake cleanup, selected-photo hashing, accepted/uncertain UI checks, History reopening, deletion, and partial-progress records remain required. Test discovery and type checks do not establish a completed session.

When ready to perform the full session, use `bun run test:reliability --grep "R03:"`. Preserve existing reliability reports first; a new run replaces that suite's report. R03 remains separate from core CI and Husky.

## Physical-device checklist

Use [PHYSICAL_RELIABILITY_CHECKLIST.md](PHYSICAL_RELIABILITY_CHECKLIST.md) as the fillable result sheet for every release build, device, browser, and test date. Fill all expected/actual results; do not pre-mark passes. Record commit ID, deployment URL, input fingerprint/model hashes, app/model versions, test date, tester, device model, OS, browser/version, installed-PWA or browser mode, network condition, photo hash, evidence location, and pass/fail/blocker reason. [PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md) shows answer style only; it is not evidence.

Run core E2E and the full automated reliability suite (R01 and R03) for the release build before recording physical-device results. If R01 and R03 run separately, preserve each report before the next run replaces it. For checklist statuses, an observed application crash or incorrect behavior is `Fail`; an observation prevented by missing access, inputs, or evidence is `Blocked`. A recorded failure takes precedence over a block when summarizing a case.

The supplied inference harness is served on this computer's loopback address only. Physical testers can use the checklist's delete-and-reupload procedure; running the harness on a phone would require a separately configured device-capable runner. The manual procedure records displayed label/acceptance and visible confidence, not automated R01's raw-score tolerance.

| Case    | Steps                                                                                                                                                                                  | Expected result                                                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01-M01 | Run repeatability on real-device hardware using a device-capable runner/harness; alternatively use a dedicated test browser/profile and clear only its test history between reuploads. | Each trial really invokes inference; record class/acceptance and score variation. Reopening a duplicate report is not evidence. Re-cache before any later offline case.                  |
| R02-M01 | Load and scan online; wait for caching. Enable airplane mode and ensure Wi-Fi is also off. Close/reopen installed PWA, inspect history, then scan a different photo.                   | App opens, photos/history remain, new diagnosis saves offline. Record app/model version to rule out stale caches.                                                                        |
| R02-M02 | Reconnect after saving and deleting local test reports; change guideline advice on the designated test backend while offline, then send a later live update.                           | History/photos persist without duplicate or resurrected reports. The current guidance downloads after reconnect, and the later live update appears; no scan upload or guest is expected. |
| R03-M01 | Use app for at least 30 minutes: scan, navigate, rotate, background/resume, switch network, and reopen.                                                                                | No crashes, lost records, persistent freeze, or stuck scanner. Record heat/slowdown and timing observations.                                                                             |
| R04-M01 | Open guided camera, grant/deny permission, capture/close, background/resume, upload from gallery, Retake, rotate, and view each result.                                                | Full-frame capture and usable controls; camera releases on Close/background. Denial/cancellation creates no scan. Camera Retake reopens live preview; upload Retake reopens gallery.     |
| R04-M02 | Repeat checklist on each available target phone/OS/browser combination.                                                                                                                | Report exactly what was tested; one emulated browser is not coverage of all phones.                                                                                                      |
| R04-M03 | Follow iOS/Android installation instructions, scan the QR, dismiss/reopen the guide, rotate, and launch the installed PWA on each recorded browser/device.                             | Actual installation and launch are recorded separately from guide layout; controls stay reachable, and unsupported native installation retains browser-menu guidance.                    |

Manual result template:

```text
Release build / commit / deployment URL:
App version / model version / model hashes:
Device / OS / browser / mode / network:
Tester / date / photo hashes:
Case ID:
Steps performed:
Expected:
Actual:
Pass / Fail / Blocked:
Evidence and issue link:
```

## Isolation and limits

The test server listens only on `127.0.0.1:4173`. Fresh browser contexts isolate IndexedDB/localStorage; test builds point to a local mock Supabase-compatible HTTP/WebSocket service. A restrictive connection policy blocks unexpected external requests. This proves client workflows only, not actual Supabase permissions, RLS, Storage reliability, or remote synchronization. No production credentials are needed or printed.

Controlled UI tests disable service-worker support to keep model interception deterministic. R02 explicitly allows and verifies the generated service worker. Manual staged deployments use Production environment variables: staging traffic does not create an isolated database. Use approved test identities/data for live integration checks.

## Experimental notebook checks

The [V4.5.0 guide](../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#local-developer-verification) describes the ordinary-cell OE workflow and `python tools/verify-v4-5-notebooks.py`. Its local fixtures check grouped membership, leakage rejection, training/evaluation boundaries, calibration/gates, and chart calculations without installing a training runtime or running model fitting. Setup fixtures also check installer/receipt failures, early restart guards, enabled dependency extras and version bounds, and blocking audit diagnostics. Inventory fixtures check the early 200/500 OOD stop, preserved image identities, progress/error evidence, completed-inventory review gates, and the documented live-session recovery. Drive fixtures check that shared photo shortcuts require explicit selection, inaccessible or unrelated inputs stop, and shared output/training-run paths remain rejected. Successful checks do not establish Colab GPU compatibility, browser numerical parity, timing, or diagnostic accuracy. These checks are separate from the app CI suite; V4.5.0 preparation excludes the requested 30-minute R03 session and shortened substitutes.

Converter fixtures also cover the V4.5.0 wheel/packaging installation retry: failed log bytes and hashes survive, completed image inventories stay unchanged, frozen evidence and other failures cannot reset, and exact unused-operation reviews keep all findings visible while unfamiliar aliases/versions remain blocking. A separate Linux plan-resolution and exact-version metadata audit does not establish successful converter installation or conversion in Colab; see the [Step 9 recovery evidence](../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#if-step-9-reports-a-wheel-and-packaging-conflict).

The seven-class v4 workflow has a separate [verification and upload guide](../model-training/experiment/v4/TRIAL_v4.md#local-developer-verification). `tools/verify-v4-notebooks.py` checks notebook contracts using temporary fixtures and optionally audits the original dataset read-only. These Python checks do not run through Husky or the app's E2E suite, and passing them does not measure model accuracy. Full training and candidate evaluation run in Colab.

The [v4.1 background and lighting guide](../model-training/experiment/v4.1/TRIAL_v4_1.md) describes the four-arm workflow and its Python environment. Run `tools/verify-v4-1-notebooks.py` with that environment to check notebook structure and synthetic data boundaries locally. That check cannot establish mask quality, successful Colab training, or field accuracy; inspect the saved mask and lighting previews and preserve the actual Colab reports.

## Release decision

See [PWA versioning](../versions/PWA_VERSIONING.md#candidate-testing-and-promotion) for version labels, evidence, Vercel staging, and exact-commit promotion. Updating a version or pushing prepared-release documentation is not evidence that testing passed. CI, reliability, physical-device checks, and model evaluation each cover different release requirements.

References: [Playwright CI](https://playwright.dev/docs/ci), [emulation](https://playwright.dev/docs/emulation), [service workers](https://playwright.dev/docs/service-workers), and [Vercel staged promotion](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).

## V4.5.0 local candidate validation (October 12, 2026)

This is a reversible local test of `v4.5.0-candidate` in app `0.5.5`, not model adoption or deployment. The [results/rollback guide](../model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md#v450-completed-results-and-local-test-october-12-2026) records original source identities and the independent V4.3.0 backup. Preserved experiment receipts keep browser/Keras probability parity unmeasured.

Formatting, typecheck, lint, webpack static build, export checks, security checks, selected-evidence/model/backup hashes, rollback preflight, and an isolated restore passed. Lint retains two pre-existing unused-variable warnings. Typecheck/lint needed permission to read installed dependencies outside the sandbox. Base commit `63aff1d42e474a61f7938db692a5595266784b5b` identifies the starting repository; model/source hashes identify the uncommitted tested working tree.

The focused M01/R02 UI runner was stopped after its first M01 case timed out waiting for a file chooser in the existing temporary testing state. The full M01 suite did not pass, and R02 offline page-reload/History flow was not completed. No production behavior was changed to satisfy these tests. A separate direct production-classifier check passed **32 predictions** across desktop and emulated mobile Chromium 153.0.8010.12: eight fixture photos online and again offline in each profile. Seven-score vectors, class order, labels, and raw rejection gates were checked. Offline inputs were original fixture bytes supplied as data URLs to an already-loaded model; this does not verify an offline page reload, service-worker startup, History, or saved-result UI. All eight fixture decisions matched their provisional labels in both profiles; this small developer collection is not an independent accuracy study.

[Machine-readable validation](../model-training/non-experiment/v4.5.0/artifacts/local_test_validation.json) and [browser observations](../model-training/non-experiment/v4.5.0/artifacts/local_browser_model_smoke.json) record the fingerprint `f9513153d710f85b1eede17302d389486167174b8dc02ab03e94157c5b228efc`, source/asset hashes, browser/backend, and explicit limits. WebGL uses forced float16 textures in these observations. Browser/Keras probability parity remains unmeasured.

The maintainer explicitly excludes the 30-minute R03 testcase and any shortened substitute; the reliability runner is not used. Physical-device/native-camera tests are not implied. The intentional scan-sheet/translation testing edits remain unchanged and are not documented as a feature release.

## v0.6.1 uncertain result scores (October 16, 2026)

Prepared app `0.6.1` retains model `v4.5.0` and confidence >=0.70 only. Scan details now show the stored highest class percentage for rejected as well as accepted reports. The shared browser assertion expects that badge for either outcome; it still verifies the diagnosis label and visible photo. A controlled 0.6999 raw-score case verifies that a displayed 70% remains Uncertain and is saved that way. This is UI/rejection-boundary evidence, not a disease-accuracy measurement.

The existing bilingual About/footer browser case also opens Privacy Policy and Terms in each language. It verifies current local-storage/privacy wording, the Terms revision date and confidence explanation, closes each dialog, and rejects the earlier blanket compliance wording. The Privacy Policy content already matches the application and retains its October 15 date; Terms changed on October 16.

Formatting, typecheck, lint, the production build, and all 10 export checks passed. The focused command `bun run test:e2e --grep "F06|F07|F16|About and footer"` passed **34 cases with zero skips, failures, or flaky results** in 113.4 seconds. Chromium desktop/mobile and Firefox covered accepted results, History/reload, uncertain display/reuse, the rounding boundary, and offline photo guidance; those three profiles plus WebKit mobile opened both legal dialogs in English and Bisaya and displayed app `v0.6.1` / model `v4.5.0`. Scan inference cases are outside the existing Windows WebKit scope; its four-profile inclusion here is UI coverage.

Base commit `b0118c1d154c083c5745da673ef9be2a8e421746` identifies the starting source; uncommitted application fingerprint `97c1a8f6c76b5e482e9699591b8128b6ca8ce44e6e28cdb66d235566db4c33b6` identifies the tested inputs. All five active and exported model/configuration files match their hashes and sizes in the [adoption receipt](../model-training/non-experiment/v4.5.0/artifacts/adoption_20261016.json). All 437 local Markdown links in changed documents passed path/anchor checks. Ignored `.tools/release-v0.6.1-20261016/` preserves the focused JSON report, input hashes, model hashes, and `validation.json`; `public/sw.js` was regenerated by the build. Typecheck, lint, and focused browser execution needed access to installed dependencies outside the sandbox.

The full core suite and final-commit remote CI were not run in this task. Remote CI, approved deployment promotion, live-version confirmation, and physical-device evidence remain separate. Record the later device results in [the physical checklist](PHYSICAL_RELIABILITY_CHECKLIST.md). R03 and shortened substitutes were not run for this task.

## v0.7.0 diagnostics and raw confidence (October 17, 2026)

**Prepared candidate; not a deployment or release announcement.** PWA `0.7.0` adds opt-in local diagnostics in About and preserves the raw classifier confidence in new scan records. The displayed percentage is rounded down to at most one decimal, with no trailing `.0`: `0.62` displays `62%`, `0.621` displays `62.1%`, `0.698` displays `69.8%`, and `0.69999` displays `69.9%`. Acceptance still compares the unrounded classifier value with `0.70`; formatting cannot turn a rejected score into an accepted diagnosis. Tensor output precision matters: a Float32 value slightly below a neat decimal is kept as received and may display one tenth lower. Existing stored scores, including rounded historical records and exact-photo/current-model reuse, are not rewritten or reconstructed.

The model remains `v4.5.0`; confidence 0.70 is the only configured rejection threshold. Margin and entropy remain disabled. The selected source forces 16-bit WebGL textures, while diagnostic events report the actual backend and enabled texture precision when available. This records the maintainer-selected precision setting; these changes do not establish its cause in the reported phone stalls or a model-accuracy improvement. The formatter performs fixed arithmetic only and does not add inference calls, image conversions, or database queries.

### Automated scope

- `tools/diagnostics.test.mjs` checks off-by-default and SSR behavior, stable immutable snapshots, 200-event/64-KiB bounds, opt-in restoration, debounce/background flush, malformed saved data, denied/quota storage, controlled fields, safe error names, export, subscriber safety, and truthful pending/failed database-operation events. It also checks actual precision recording when diagnostics are enabled after model startup.
- `tools/e2e/diagnostics.pw.ts` adds A01-A03 to the core suite. About is the only viewer; modals do not get extra log controls. A03 needs controlled WebGL inference and retains the existing WebKit exclusion; A01/A02 still exercise its UI and storage-failure behavior.
- `tools/format-confidence.test.mjs`, classifier-lifecycle tests, and local-scan tests check truncated display, omitted zeros, threshold boundaries, and unchanged raw confidence through local preparation and save. Controlled F07 cases verify raw Float32 values, accepted/uncertain labels, visible badges, and persisted values after reload. Controlled values test workflow, not disease accuracy.
- Shared E2E expectations use the same stated display rule while asserting the label and photo. Existing scan, guided-camera, recovery, quota, History, migration, guideline, service-worker, and real-model cases remain in the core suite. Strict unexpected browser-error/crash assertions remain enabled. Reliability tests remain separate; no full or shortened R03 session is included in this work.

Focused development checks were completed before the version bump, with app `0.6.1`: **58 tooling tests passed; 32 focused browser cases passed with one existing Windows WebKit C02 skip** at application fingerprint `f039cb1b20cf0fecb64735684c270839e2813624da9d5805a5097f743adca05c`. Formatting, typecheck, lint, build, and export verification also passed for those inputs. These are earlier local checks, not a new `0.7.0` or remote-CI pass. The final versioned source, legal-text changes, full core suite, commit, model hashes, and CI outcome require their own evidence before promotion; record them without relabeling the earlier run.

### Final local v0.7.0 validation

Recorded October 17, 2026, on Windows against app `0.7.0`, starting from commit `b67927637105d71afb5410b0e6a9e29b43ededa6` with the release changes present. The final isolated application fingerprint is `9d57a97c29ccfb15df4d67fc5bf86aa15bed29edfbb889a7d27292461e4b9ce8`. Local test metadata names the baseline HEAD; the fingerprint and input hashes identify the tested application/model bytes before the release commit is created.

- Formatting, TypeScript, lint, production build, all 10 export checks, and the tracked-file/full-history secret scan passed. All **58 tooling tests passed with 149 assertions**.
- The complete core suite passed **250 cases with 10 declared platform skips, zero unexpected failures, and zero flaky cases** in 18.7 minutes. Chromium desktop/mobile each passed 82 cases; Firefox passed 67 with six skips; Windows WebKit passed 19 with four skips. Existing exclusions cover unavailable GPU/media/worker paths and the Windows WebKit Blob-storage case; they do not certify equivalent behavior on physical phones. The bilingual About/legal assertions and new diagnostics/raw-confidence cases are included. Reports are in ignored `test-results/e2e/results.json` and `playwright-report/e2e/`.
- Filtered R01 (`bun run test:reliability --grep "R01:" --project=chromium-mobile`) passed **240 actual predictions: 30 repeats for each of eight photos**. Every photo retained one label/raw class, confidence range was exactly zero, and net tensor growth was zero. The run took 53.7 seconds overall on Chromium `153.0.8010.12`, TensorFlow.js `4.22.0`, forced-F16 WebGL via ANGLE/SwiftShader, with Node `24.6.0`, Bun `1.4.0`, and Playwright `1.63.0`. These are same-session repeatability observations on software-rendered desktop automation, not phone performance or accuracy measurements. Its application fingerprint matches the core run; evidence is in `test-results/reliability/results.json` and the attached `repeatability.json`. An initial anchored grep selected no tests; the corrected filter ran only R01.

All five model assets match the baseline and the production export byte for byte:

| Asset                  | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `model.json`           | `0fd24e1f0f6bd5595566b8f4aec130808fbd510208ed82abbdc4d319fd2aa2a1` |
| `model_config.json`    | `cf6f3089071b75f99cd4e828440ea54bbfba87d292f9faa8432a08b370084a1f` |
| `group1-shard1of3.bin` | `3afb04fb4e127cdbe19f71e396966ddab8eb136522ebd1bc4c9eabfd68032692` |
| `group1-shard2of3.bin` | `72671218e2f2370306f99e28df46873e3063cab258463a1c9a4aec7e2b6dd619` |
| `group1-shard3of3.bin` | `075e1eabdb172384f5c5df496b211d5463eee12bc54cec6ca1d40ab0a73225d2` |

The local candidate tag identifies the final commit after local checks. The maintainer handles the remote CI outcome, tag publication, staged-deployment approval, and manual Vercel promotion after the branch push; none is established by these local results. R03 and shortened substitutes were not run. Later physical-device observations belong to their tested commit, deployment, and device record.

**October 18 pre-push follow-up:** The first push of `88a479d` was stopped by Gitleaks after the new diagnostics additions entered Git history. Three public localStorage-name references were classified as generic API keys; the earlier successful history scan did not yet include those newly committed additions. The audited root `.gitleaksignore` exempts only their exact historical commit/file/rule/line fingerprints. It does not exclude their files, other lines, later commits, or scanner rules. The new regression reproduces the storage-name finding, proves its fingerprint exception works, and verifies that a later synthetic credential at the same path and line still fails without printing the value. All **59 tooling tests passed with 154 assertions**, including all seven security cases. Full-history scanning, typecheck, lint, and the rebuilt static export passed with hooks enabled. Application/model inputs remain unchanged, so the 250-case core and 240-prediction R01 records above retain their applicability. Remote CI remains the maintainer's follow-up after a successful branch push.

### Phone log collection and interpretation

Enable **About > Diagnostics > Record diagnostic events** before reproducing a problem. The recorder is shared across tabs/modals, retains old events when disabled, and cannot recover actions performed while recording was off. View, copy, download, and clear are in About; clipboard failure leaves selectable text. Clearing diagnostic history does not delete scan reports/photos or an already downloaded text file.

The recorder keeps at most **200 events and 64 KiB of serialized UTF-8 JSON** in memory and, best effort, this browser origin's localStorage key `mangoleaf-diagnostics-v1`. The preference is saved immediately; events use a 250-ms debounce and flush on page hide/backgrounding. Oldest events rotate out. Denied/full browser storage leaves memory-only logs with a warning. A freeze, crash, forced close, browser-data removal, or storage denial can prevent the newest entries from surviving. If storage prevents every modification, Clear cannot promise removal of an older persistent copy. Logs are not sent automatically to a server. They contain controlled step/status/count/timing information, app/model versions, coarse browser/OS family, and actual backend/precision where available; they exclude photos, hashes, report/device/guest IDs, diagnosis labels/scores, raw error messages/stacks, full user-agent strings, URLs, credentials, and class-probability tables. Technical event codes remain the same in both interface languages.

For a phone incident, record app/model version, deployment URL, phone model, exact OS/browser version, tab versus installed-PWA mode, network state, elapsed time, visible stage, and any screenshot/video. Export logs promptly so new activity does not rotate out the incident. An absent completion event establishes neither an exact root cause nor failure of IndexedDB itself.

1. **Run does not advance:** note whether it is disabled/faded or enabled and whether photo checking is pending. Disabled native-button taps do not fire a click handler; readiness/startup/photo-check events are the evidence. Close review if responsive, then export from About. If controls remain unusable, reload or fully close and reopen the same browser/app context before exporting preserved logs.
2. **Analyzing does not finish:** record the 15/45/75/90% milestone, stage text, and elapsed time. These are workflow markers, not measured inference percentages. Check Cancel and the offered recovery action. Analyze has a 60-second caller deadline, but a blocked browser/driver thread can delay it. Reload/reopen only when recovery controls remain unresponsive, then export any preserved events before retrying. An unsaved result may be lost.
3. **Deleting stays busy:** note the selected report count and confirmation time. The delete path has no automatic deadline, and its dialog stays locked while the operation is pending. If it remains stuck, reload/reopen and export preserved logs. Inspect History before retrying: the database operation may have committed even if the screen did not update. `database.delete.started` without a settled completion/failure is incomplete evidence, not proof of a database-engine defect.

Do not clear site data or uninstall as a troubleshooting step: this can erase local scans/photos and diagnostics. Reopening is a recovery attempt, not a guaranteed fix. These log checks do not replace the [physical-device evidence record](PHYSICAL_RELIABILITY_CHECKLIST.md#diagnostics-and-stall-evidence-v070); real Safari/Android behavior, background freezes, native camera access, and full-disk conditions must be observed on the identified devices. Later physical results belong to their tested commit and deployment.

# Application and reliability testing

These tests cover the scan workflow and the manuscript's reliability paragraph. R01–R04 are project test IDs, not research-objective numbers from the manuscript. Physical-device results and model accuracy require their own evidence; a green browser suite alone does not establish either.

**Current prepared release:** App `0.5.4`, model `v4.3.0`, is prepared and awaits CI and production promotion. The [release record](../versions/PWA_VERSIONING.md#v054-unchanged-guidance-check-prepared-release-october-7-2026) and versioned validation below identify its scope. The [October 7 release-status confirmation](../versions/PWA_VERSIONING.md#release-status-confirmation-october-7-2026) records published `v0.5.0`–`v0.5.3` and reported live `v0.5.3`. Earlier dated candidate entries preserve preparation status and evidence for their original source snapshots rather than current deployment status.

**Historical V4.1.1 rollback (September 29, 2026):** The app again uses one seven-class V4.1.1 Background model and opens its scan sheet directly, without an organ choice. The completed [V4.2.0 two-model trial](../model-training/experiment/v4.2.0/TRIAL_v4_2_0.md#completed-results-and-comparison-september-29-2026) is retained as evidence and an ignored local backup. Existing single-model browser fixtures and cases were not changed or run for this rollback; prior test results do not certify the restored working tree. This rollback verifies TypeScript, lint, and build. Photo hashes stay unchanged; local rows marked with the V4.2.0 model version remain in history but are not reused as V4.1.1 diagnoses.

**Historical local V4.3.0 retest (October 2, 2026):** Root `public/model/` contained the verified single seven-class Combined candidate, with display label `v4.3.0-candidate` and gates 0.70 / 0 / 0.42. The app kept the direct scan sheet and latest photo guidance/Bisaya text. V4.1.1 Background was preserved for rollback. See the [restoration receipt](../model-training/non-experiment/v4.3.0/artifacts/local_restore_20261002.json). Existing browser cases, fixtures, hooks, and workflows remained unchanged and were not rerun for that local swap. Typecheck, lint, and build passed for that task. Prior model results and automated observations did not certify the restored candidate; browser parity, independent accuracy/OOD evidence, and physical-device checks remained pending.

The [v0.4.9 PWA history entry](../versions/PWA_VERSIONING.md#v049-adoption-of-v430-combined) summarizes the application changes and verified local tags. The following dated validation records retain their original source snapshots and status.

**App v0.4.9 adoption (October 2, 2026):** The current application model is V4.3.0 Combined, with display label `v4.3.0`, configuration identity `model-v4.3.0`, and unchanged `0.70 / 0 / 0.42` gates. The [adoption receipt](../model-training/non-experiment/v4.3.0/artifacts/adoption_20261002.json) preserves original export provenance and separately records the relabeled configuration hash. The approved release validation uses the core suite and R01 repeated inference against this exact final source/model/fixture state, with `bun run test:reliability --grep "R01:"`; results are recorded below and in the adoption receipt. Final GitHub workflow checks and production promotion remain separate pending steps.

<a id="v049-local-validation-october-2-2026"></a>

**Local v0.4.9 validation (October 2, 2026):** Final formatting, TypeScript, lint, production build, all 10 export-asset checks, security scan, and all 10 tooling tests passed. The complete core suite passed all 65 cases with 0 failures in 5.6 minutes across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile UI. All 16 M01 observations matched the provisional supplied labels; this is smoke evidence, not an accuracy estimate. R01 passed one `chromium-mobile` case in 57.2 seconds: eight photos × 30 actual predictions, with stable raw/displayed classes and acceptance, maximum raw-confidence range `0`, and maximum net tensor growth per photo `0`. Application input fingerprint is `aafefbaaff86b0c86f55ef534afc3e0e416dcb1825c15c5aaf912ed48703100a`. Report base commit `19445fc200b3fd247b4a5e9ae24e560770e9dc68` is existing HEAD, with adoption changes still uncommitted. The first core run's 54 passes/11 failures were resolved by test-only footer, duplicate-selector, and offline-transition timing fixes, with strict error assertions and model gates preserved. The adoption receipt records final reports/hashes and archived initial evidence. Remote CI, exact deployment/domain-setting confirmation, production promotion/live-footer verification, and commit/tag/Release publication remain pending.

**Local cloud-security candidate validation (October 2, 2026):** The updated guest-session/private-photo client passed TypeScript, lint, production build, formatting, Git diff checks, all 14 tooling tests with 41 assertions (including four guest-session tests), all 10 exported-asset checks, and the credential/history security scan. All 80 core cases passed with zero failures in 7.4 minutes across Chromium desktop/mobile, Firefox desktop, and scoped WebKit mobile coverage; S01–S05 use the isolated local mock backend. This full run preceded the test-only S05 fixture correction to native IndexedDB version 70 for Dexie's version 7 and the added class/confidence/model-label assertions. The tightened S05 then passed three focused Chromium desktop/mobile and Firefox cases in 8.1 seconds; no second full suite is claimed. Final application input fingerprint remains `a316d8017d732e678704809b74289e3100beb4896611e8760f883ec78a923f71`. All 342 protected files retain their hashes, including 43 notebooks, model assets, Git hooks, and GitHub workflows; 418 local links/anchors across 35 documents resolved before the live-migration documentation update; that later check passed with 419 links/anchors. The earlier adoption validation above remains evidence for its original source snapshot.

**Live server-security verification (October 2, 2026):** After the photo bucket was saved as private, migration `secure_guest_owned_cloud_sync`, history version `20261002152830`, applied successfully. Catalog checks verified the private bucket, grants, RLS, index, and three scan/one guideline/four Storage policies. Thirty assertions using temporary copies of the applied policy expressions/grants passed and were rolled back; the earlier proposed-policy proof is separate. All original values remain unchanged across 65 scan rows, six guidelines, and 68 Storage object entries, with no missing entries or invented legacy owners. The advisor returned zero findings. Read-only HTTP probes returned 401 for unsigned scans, 200 for all six public guidelines, and 400 for a cache-busted old public photo URL. These checks created no production test users, scan rows, or Storage files, and performed no remote photo writes/deletes/purge. They do not prove every formerly public cached copy disappeared or establish a real guest signup/upload/download session. The matching updated client has not been committed, pushed, or deployed. See [implementation status](../supabase/SECURITY-AND-SYNC.md#implementation-status).

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
bunx --no-install playwright install chromium firefox webkit
bun run test:e2e
bun run test:report
```

On Linux, install browser system dependencies with `bunx --no-install playwright install --with-deps chromium firefox webkit`.

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

| ID      | Action and expected result                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01     | Empty Recent and History show the empty-state message.                                                                                                                        |
| F02     | Scan opens its sheet; Cancel closes it without creating a record.                                                                                                             |
| F03     | Upload Photo opens its file input and previews the chosen bytes.                                                                                                              |
| F04     | Mobile Take Photo selects the camera input with `capture="environment"`; desktop hides that control. Native camera behavior remains manual.                                   |
| F05     | Empty file selection stores nothing; Retake reopens the same picker. X or Escape closes review and clears the selected photo without opening a picker or saving a record.     |
| F06     | Each of seven controlled accepted predictions shows the photo, class, and confidence.                                                                                         |
| F07     | Rejected result shows its photo and uncertain label; raw class/confidence/margin/entropy are report-only.                                                                     |
| F08–F09 | Saved result appears in Recent and History; the mobile History row and desktop Details action show matching data.                                                             |
| F10     | Below 768px, Home shows the newest one card and History shows five rows per page. At or above 768px, Home shows up to four cards and History six cards per page.              |
| F11     | Search/category counts and previous/next navigation work; typing search resets All and closes mobile filters. Confirmed deletion of the last page returns to a valid page.    |
| F12     | Reload preserves records and photos.                                                                                                                                          |
| F13     | Re-uploading identical bytes shows "Photo already scanned" in the preview. Retake, Cancel, X, and View saved result work; no new record or inference is created.              |
| F14     | Long result badges stay inside the photo and Close stays reachable at narrow, landscape, and desktop sizes.                                                                   |
| F15     | A Healthy Fruit result moves from loading to unavailable advice, then uses the downloaded mock `healthy` row and remains readable offline in English/Bisaya.                  |
| F16     | Uncertain-result photo reminders and headings work in English/Bisaya with pending, empty, downloaded, and offline guideline states.                                           |
| F17     | Select reports across History pages or Select all matching results; shared single/batch confirmation supports cancellation, fixed IDs, busy locking, retry, and focus return. |
| F18     | Compact bilingual photo tips appear before camera/gallery actions; Cancel remains visible while short-screen content scrolls and desktop keeps the bounded centered sheet.    |
| M01     | All eight supplied photos run through the real model and app; record predicted/expected labels and score diagnostics separately from UI assertions.                           |

### v0.5.2 History, deletion, and photo-tips scope (October 6, 2026)

Use both languages, narrow/desktop viewports, fresh contexts, and the local mock backend. Seed enough mixed-category records to cover multiple pages, including earlier model labels and an unlabeled legacy report. Controlled scores establish UI behavior, not model accuracy.

- Check Home's one/four mounted-card limit and History's five/six page size on either side of 768px. Mobile History uses thumbnail rows with a tappable photo/text area; desktop retains photo cards and Details/trash controls. Resizing keeps the previous first record on its recalculated page, and losing the last page leaves a valid page.
- Count each category over all disease-name search matches before the category filter and pagination. Both healthy classes count as Healthy. Typing or clearing search resets All, page one, selection, and the mobile filter bar; changing category resets page one and selection. A search with no matches shows the translated empty-results message.
- Select reports on multiple pages, return between pages, and confirm the selected count stays correct. Select all includes every current matching report across pages. A new arriving report must remain unselected until another selection action; records removed from the results must lose their selection. Changing search or category clears the selection.
- Open confirmation from a Home trash action, desktop History trash action, and History selected-delete action. Check singular/plural wording and the snapshotted count. Cancel, X, and Escape must close without changing records. Focus starts on Cancel, stays inside the native modal, and returns to the initiating enabled control or the list heading if that control disappeared.
- While the local deletion save is held open, Delete, Cancel, and X remain disabled; Escape must not dismiss it, and background controls stay blocked. Repeated Delete must not start another local save. Introduce a local save failure, check the translated error, and retry the same confirmed IDs. A new scan arriving while confirmation is open must not join the deletion.
- Check offline single/batch deletion of local-only, unowned, and owned scans. Local-only/unowned rows are removed; owned rows disappear from visible History but retain their pending-deletion marker until cloud cleanup succeeds. Reconnect through the local mock and check photo/row cleanup, retry, and no restored deleted records. Existing owner authorization and upload-race cases remain relevant.
- Open the photo-tips sheet in both languages at narrow, short/landscape, and desktop sizes. Tips appear once before the picker actions; the drag handle and Cancel remain visible while the middle content scrolls. Desktop keeps the centered panel within 520px. Cancel creates no scan. The advice works offline and does not start a camera stream, alter pixels, or invoke inference.

These acceptance conditions remain in use for the current candidate. Passing results must be recorded for its final versioned source; the original `0.5.2`, F10/F11, and cloud-race reports retain their dated evidence limits.

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

The camera and comprehension checks above are retained from the October 2 guidance review; the [v0.5.4 prepared release section](#v054-release-validation-october-7-2026) defines the current release scope. The local backup for this reversible change is `.tools/ui-backups/photo-guidance-20261001T212013Z/`; restore only this change and rebuild the service worker, preserving newer unrelated work.

Controlled tests replace only the model response with fixed scores. They exercise the real classifier gates, UI, local storage, and client sync against a mock service. Real-model and offline cases use the actual exported model assets. No test changes the classifier's resizing, normalization, precision, or rejection rules.

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

The [Supabase security guide](../supabase/SECURITY-AND-SYNC.md) separates the client workflow from server authorization. Existing October 2 model-adoption reports describe their original source snapshot; they do not certify the later guest-session/private-storage changes. Record the final source fingerprint and results for this candidate.

Use fresh contexts and the isolated local backend for automated application scans. The focused cases use the local mock backend, not production users or photos:

- `S01`/`S02`, `tools/e2e/cloud-security.pw.ts`: separate guest histories/private photos with reuse after reload, and local diagnosis/public guidelines during failed guest sign-in.
- `S03`/`S04`, `tools/e2e/cloud-mutations.pw.ts`: deletion while an upload is in flight does not restore the scan or leave its photo behind; failed photo cleanup retains the hidden local deletion marker until retry succeeds.
- `S05`, `tools/e2e/cloud-security.pw.ts`: a Dexie version 7 history, seeded as native IndexedDB version 70, upgrades with its report IDs, class/confidence/model labels, and saved photo bytes intact, marks legacy records local-only without assigning a guest owner, and does not claim unowned old cloud photos. A local-only row without photo bytes shows the missing-local-photo message in History and never requests the old public URL.
- `R02`: uploaded owner paths and exact photo bytes, cached offline scanning, and reconnection.

Check the following behavior as well:

- The app creates and reuses a guest session in the background with no email/password screen. Reconnect does not create a new guest when the saved session is still usable.
- A slow or failed guest request does not delay on-device diagnosis, local saving, or History. Pending cloud changes survive reload and synchronize after recovery.
- Public guidelines download and cached treatment advice remain available even when guest sign-in fails. A live mock update reaches the cached row independently of private scan synchronization.
- A successful full guideline fetch removes a locally cached row deleted on the mock server, even if the Realtime event was missed. A failed request preserves the prior snapshot.
- Uploads and deletions use owner-scoped private paths. A retry after metadata failure preserves the uploaded path rather than relying on a public URL.
- A restored private photo is downloaded with the session and persisted as a local Blob. After disconnect and reload, that photo remains readable. No session token, signed URL, or private response is written into a shared public service-worker cache.
- Local legacy reports and photo Blobs remain visible. The client does not silently assign an old remote row to a guest using its `device_id`; a remote-only unowned photo shows “Photo not saved on this device” / “Walay litrato nga natipigan niini nga device” instead of loading its previous public URL.
- Clearing an isolated test context gives a different guest identity; that new identity cannot obtain the former guest's cloud records by presenting its old browser UUID.

Separately inspect the real schema, grants, and policies using unsigned `anon` and two distinct signed user identities. Verify owner operations, rejection of cross-owner reads/inserts/overwrites/deletes, rejection of claiming unowned rows, and public read-only guidance. The [catalog checks](../../supabase/sql/verify-cloud-security.sql) and [rolled-back temporary policy fixtures](../../supabase/sql/test-cloud-policy-fixtures.sql) inspect and evaluate the configured rules without adding production application records, Auth users, or Storage metadata. Do not direct browser scans or routine automated uploads at the production Supabase project.

Mock tests prove client behavior; database-role tests prove the evaluated RLS rules. Neither alone proves live guest signup, production Storage HTTP behavior, deployment, or physical-device speed. Record pending checks explicitly. No long R03 session is required merely to inspect policies; release reliability scope remains the separately approved plan.

These are acceptance checks, not recorded passes. Preserve browser/device evidence before marking them complete.

## Fixture and report interpretation

`tools/e2e/fixtures/photos/` contains byte-verified copies of the eight supplied photos. Original Downloads files are never changed. `manifest.json` records hashes and provisional labels from the supplied filenames; expert label verification is pending. Do not edit expected labels to make predictions look correct. These few examples are smoke coverage, not a representative accuracy dataset or new independent test set.

HTML reports live under ignored `playwright-report/e2e/` or `playwright-report/reliability/`. JSON, screenshots, and failure traces are under ignored `test-results/`. Save formal evaluation evidence outside these replaceable run folders before another run. Reports may contain input photos and scan output.

M01 attaches the original photo, screenshot, supplied label, prediction, raw top class, confidence, margin, normalized entropy, failed gates, timing, backend, browser, model version, configuration asset identity (`modelAssetVersion`), and application-input fingerprint. The separate test-only harness imports the production classifier and observes its actual output; it is never bundled into the app. Rejection console messages contain four-decimal rounded values. The harness records full JavaScript numeric values.

A correctly displayed wrong diagnosis passes UI assertions but is marked as a model-label mismatch in its report. Review all such observations before adopting a model. Consistency can also pass for consistently wrong predictions. Formal accuracy/OOD evaluation and confidence intervals need suitable expert-reviewed, independent data.

For debugging or technical-defense review, open the browser's developer console in the development app (`bun run dev`) or an updated production build, then submit a new photo through the scan sheet. Expand `Class probabilities (accepted)` or `Class probabilities (rejected)` to see all seven classes ranked by score, displayed as percentages with two decimals. These are scores for one image, not per-class accuracy; rounding can make their displayed total differ slightly from 100%. Sorting and formatting do not change the original scores or rejection rules. An eligible duplicate notice and its View saved result action do not run inference or print a new table. The table appears only in DevTools; automated model reports still record the full probability vector. An older deployed build retains its previous logging behavior until the updated build is deployed and loaded.

## Reliability protocol

| ID  | Automated scope                                                                                                                                                                  | Pass condition / limitation                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | 30 sequential actual classifier calls per photo in one browser session; duplicate lookup is not involved.                                                                        | Stable raw top class and displayed class/acceptance; confidence range no greater than 0.001; no net tensor growth. This is a predeclared regression tolerance, not proof across devices or cold starts.                                                                                             |
| R02 | Activate the real worker, confirm cached page/config/model shards, save a scan online, disconnect, reload history, diagnose a different unscanned file, reload again, reconnect. | History/photos survive; new inference and storage succeed offline; queued rows and exact uploaded photo bytes are verified on the local mock after reconnect. Initial caching is required. Automated SW instrumentation runs on Chromium.                                                           |
| R03 | 30-minute loop of real inference, Details, History, deletion, and periodic reloads.                                                                                              | No unexpected errors/crashes, stuck scans, or incorrect record counts. Records are deliberately deleted after checks so later uploads cannot use duplicate shortcuts. Durations and available heap measurements are recorded for review, not presented as a validated memory/performance threshold. |
| R04 | Chromium desktop/mobile and Firefox run scan workflows; WebKit runs navigation and mobile-control checks only because its Windows runner cannot exercise this WebGL TFJS path.   | Viewport/browser coverage only. Actual device models, OS/browser versions, inference, camera permissions, heat, and background behavior need manual checks.                                                                                                                                         |

Test inputs, repetitions, and pass conditions should be fixed before formal evaluation. Do not loosen them after failure merely to obtain a pass. Record investigated failures and any revised protocol as a new evaluation run.

The manuscript calls for extended use but does not specify a duration. The development team selected 30 minutes as this project's R03 protocol; it is not a duration required by the manuscript.

R03 writes `endurance-progress.json` after each completed cycle inside its ignored test output. It preserves partial evidence if a laptop, browser, or runner stops early; only a completed 30-minute report is an R03 pass.

## Physical-device checklist

Use [PHYSICAL_RELIABILITY_CHECKLIST.md](PHYSICAL_RELIABILITY_CHECKLIST.md) as the fillable result sheet for every candidate, device, browser, and test date. Fill all expected/actual results; do not pre-mark passes. Record commit ID, deployment URL, input fingerprint/model hashes, app/model versions, test date, tester, device model, OS, browser/version, installed-PWA or browser mode, network condition, photo hash, evidence location, and pass/fail/blocker reason. [PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md) shows answer style only; it is not evidence.

Run core E2E and the full automated reliability suite (R01 and R03) for the candidate before recording physical-device results. If R01 and R03 run separately, preserve each report before the next run replaces it. For checklist statuses, an observed application crash or incorrect behavior is `Fail`; an observation prevented by missing access, inputs, or evidence is `Blocked`. A recorded failure takes precedence over a block when summarizing a case.

The supplied inference harness is served on this computer's loopback address only. Physical testers can use the checklist's delete-and-reupload procedure; running the harness on a phone would require a separately configured device-capable runner. The manual procedure records displayed label/acceptance and visible confidence, not automated R01's raw-score tolerance.

| Case    | Steps                                                                                                                                                                                  | Expected result                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01-M01 | Run repeatability on real-device hardware using a device-capable runner/harness; alternatively use a dedicated test browser/profile and clear only its test history between reuploads. | Each trial really invokes inference; record class/acceptance and score variation. Reopening a duplicate report is not evidence. Re-cache before any later offline case. |
| R02-M01 | Load and scan online; wait for caching. Enable airplane mode and ensure Wi-Fi is also off. Close/reopen installed PWA, inspect history, then scan a different photo.                   | App opens, photos/history remain, new diagnosis saves offline. Record app/model version to rule out stale caches.                                                       |
| R02-M02 | Reconnect and observe pending test scans and any test deletions.                                                                                                                       | Changes eventually synchronize without duplicate or resurrected records. Use a designated test backend/device identity and verify server state.                         |
| R03-M01 | Use app for at least 30 minutes: scan, navigate, rotate, background/resume, switch network, and reopen.                                                                                | No crashes, lost records, persistent freeze, or stuck scanner. Record heat/slowdown and timing observations.                                                            |
| R04-M01 | Take Photo, grant/deny permission, cancel picker, upload from gallery, Retake, rotate, and view each result.                                                                           | Correct picker and photo; controls/badges remain usable. Denial/cancellation does not create a scan or leave it stuck.                                                  |
| R04-M02 | Repeat checklist on each available target phone/OS/browser combination.                                                                                                                | Report exactly what was tested; one emulated browser is not coverage of all phones.                                                                                     |

Manual result template:

```text
Candidate / commit / deployment URL:
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

The seven-class v4 workflow has a separate [verification and upload guide](../model-training/experiment/v4/TRIAL_v4.md#local-developer-verification). `tools/verify-v4-notebooks.py` checks notebook contracts using temporary fixtures and optionally audits the original dataset read-only. These Python checks do not run through Husky or the app's E2E suite, and passing them does not measure model accuracy. Full training and candidate evaluation run in Colab.

The [v4.1 background and lighting guide](../model-training/experiment/v4.1/TRIAL_v4_1.md) describes the four-arm workflow and its Python environment. Run `tools/verify-v4-1-notebooks.py` with that environment to check notebook structure and synthetic data boundaries locally. That check cannot establish mask quality, successful Colab training, or field accuracy; inspect the saved mask and lighting previews and preserve the actual Colab reports.

## Release decision

See [PWA versioning](../versions/PWA_VERSIONING.md#candidate-testing-and-promotion) for candidate labels, evidence, Vercel staging, and exact-commit promotion. Updating a version or pushing candidate documentation is not evidence that testing passed. CI, reliability, physical-device checks, and model evaluation each cover different release requirements.

References: [Playwright CI](https://playwright.dev/docs/ci), [emulation](https://playwright.dev/docs/emulation), [service workers](https://playwright.dev/docs/service-workers), and [Vercel staged promotion](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).

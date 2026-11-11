# Functional checklist answer example

> **FICTIONAL EXAMPLE ONLY - NOT TEST EVIDENCE.** All observations, people, dates, versions, outcomes and evidence paths below are invented. The example failure is not a reported product defect. Start actual testing from the [blank checklist](FUNCTIONAL_CHECKLIST.md).

## How to use the example

Match the current PAFC, PWFC and DFC rows. Describe the result in plain English, then give status and original video name/timestamps. Record later filming dates and separate environments. A tester-reported outcome is attributed to the tester; it is not presented as independently verified by sampled video review.

## Fictional build and tester record

- Tester: Example Tester; date/time: Example Day 1, 09:00, Asia/Manila.
- Reviewer: Example Reviewer; review date: Example Day 3.
- Phone: Example Phone / Android EXAMPLE / System WebView EXAMPLE.
- APK: `example-release.apk`, version/code EXAMPLE; Production example.
- Active web bundle / model: EXAMPLE / EXAMPLE; receipt: `evidence/fictional/receipt.json`.
- Phone browser: Example Mobile Browser; desktop: Example Desktop OS / Browser.
- Website: the official URL in the real checklist; no live requests were made for this sample.
- Conditions: English/Bisaya, standard text size; network/backup states recorded per case.
- Photos: approved example mango A and unsupported B; all report deletions use disposable fixtures.
- Backup fixtures: Example Source, Established Receiver and Fresh Emulator, in a designated testing project. No Production backup was changed.
- Video location: `evidence/fictional/` - nonexistent. Later PWFC04-B and PWFC07 were filmed on Example Day 2; they are separate dated checks.

## Fictional actual-results examples

Every current functional row appears below. Unless otherwise stated, evidence is an invented tester observation and video on Example Day 1. Times are illustrative offsets within separate clips, not a single continuous session. There are no real videos at these paths.

| Case     | Actual observation                                                                                                                                                                                    | Result                 | Evidence / basis                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| PAFC01   | Opened all five tabs. App Back and Phone Back returned the Settings subpage to Settings. Closing/reopening left navigation usable.                                                                    | Pass                   | `PAFC01.mp4`, 00:00-01:10; fictional direct tester/video observation                                                             |
| PAFC02   | English and Bisaya labels appeared. Bisaya remained selected after reopening.                                                                                                                         | Pass                   | `PAFC02.mp4`, 00:00-00:50                                                                                                        |
| PAFC03   | Denial showed feedback; allowing permission opened the camera. A screen photograph matched Review. Retake worked, cancellation saved nothing, and live camera use stopped after Phone Home and Close. | Pass                   | `PAFC03.mp4`, 00:00-02:00; screen photograph, not a field specimen                                                               |
| PAFC04   | Gallery selection opened the matching Review. Retake reopened selection; Phone Back and Review Close saved no reports.                                                                                | Pass                   | `PAFC04.mp4`, 00:00-00:45                                                                                                        |
| PAFC05   | Two fresh diagnoses displayed their photos, labels/confidence and Details. Production showed no Debug probability table. Outputs were logged separately for model evaluation.                         | Pass                   | `PAFC05.mp4`, 00:00-01:20; no accuracy claim                                                                                     |
| PAFC06   | Both saved reports and their photos/Details remained after closing and reopening.                                                                                                                     | Pass                   | `PAFC06.mp4`, 00:00-00:45                                                                                                        |
| PAFC07   | Matching search, no-match search, clearing and filters worked. Page 2 and return to page 1 worked; selected Details matched its report.                                                               | Pass                   | `PAFC07.mp4`, 00:00-01:30                                                                                                        |
| PAFC08   | Selected the same unchanged current-model original. The duplicate notice opened its saved result; no new processing or History entry appeared.                                                        | Pass                   | `PAFC08.mp4`, 00:00-00:35; original fixture identity in fictional notes; visible workflow only                                   |
| PAFC09   | Cancel preserved single/multiple selections. Confirm removed only approved selected reports; unselected reports and valid pages remained.                                                             | Pass                   | `PAFC09.mp4`, 00:00-01:30                                                                                                        |
| PAFC10   | Available English/Bisaya healthy guidance stayed readable with airplane mode on and Wi-Fi off.                                                                                                        | Pass                   | `PAFC10.mp4`, 00:00-00:50; only the stated guidance checked                                                                      |
| PAFC11   | Tester reported explicit setup, masked default, Show/Hide, matching Copy/Paste, On/Pause and code concealment. Own code/Pause survived reopening. Private code checks were not recorded.              | Pass (tester reported) | `PAFC11.mp4`, 00:00-01:15; fictional tester clarification on Example Day 3; code values omitted                                  |
| PAFC12   | Empty/malformed/rejected inputs and a separate offline attempt gave suitable feedback. Tester checked that receiver code, Pause and reports stayed unchanged.                                         | Pass (tester reported) | `PAFC12.mp4`, 00:00-02:00; fictional private comparison and tester report                                                        |
| PAFC13   | Established testing receiver added two approved reports; repeat added zero and preserved receiver state. Separate fresh testing emulator added two and received its own distinct code.                | Pass                   | `PAFC13-phone.mp4`, 00:00-01:20; `PAFC13-emulator.mp4`, 00:00-01:10; fictional controlled fixture notes; not Production evidence |
| PWFC01   | Phone website Home/About opened and scrolled.                                                                                                                                                         | Pass                   | `PWFC01.mp4`, 00:00-00:30                                                                                                        |
| PWFC02   | Both language choices worked; Bisaya remained after browser reload.                                                                                                                                   | Pass                   | `PWFC02.mp4`, 00:00-00:35                                                                                                        |
| PWFC03   | Android guide opened, scrolled, closed and reopened.                                                                                                                                                  | Pass                   | `PWFC03.mp4`, 00:00-00:30                                                                                                        |
| PWFC04-A | Main website action downloaded the official APK; Downloads showed completion.                                                                                                                         | Pass                   | `PWFC04-A.mp4`, 00:00-00:50; exact invented filename in fixture notes                                                            |
| PWFC04-B | Official GitHub release opened and its APK asset finished downloading.                                                                                                                                | Pass                   | `PWFC04-B.mp4`, 00:00-01:00; Example Day 2, separately recorded                                                                  |
| PWFC05   | Android reported App installed and the app opened. Recorded EXAMPLE native/bundle/model identities; this was an update over a same-signer test installation.                                          | Pass                   | `PWFC05.mp4`, 00:00-01:00; fictional update path, not a fresh-install claim                                                      |
| PWFC06   | Website's offered Open app button opened the installed APK.                                                                                                                                           | Pass                   | `PWFC06.mp4`, 00:00-00:25                                                                                                        |
| PWFC07   | Privacy Policy and Terms of Service opened, scrolled and closed in English and Bisaya.                                                                                                                | Pass                   | `PWFC07.mp4`, 00:00-01:00; Example Day 2                                                                                         |
| DFC01    | Desktop Home/About content opened and scrolled.                                                                                                                                                       | Pass                   | `DFC01.mp4`, 00:00-00:30                                                                                                         |
| DFC02    | English/Bisaya selection worked and persisted after reload.                                                                                                                                           | Pass                   | `DFC02.mp4`, 00:00-00:35                                                                                                         |
| DFC03    | X closed the guide. Keyboard Esc left it open, although Esc should close it.                                                                                                                          | Fail                   | `DFC03.mp4`, 00:00-00:30; invented defect EXAMPLE-01                                                                             |
| DFC04    | Desktop showed Android instructions and QR. No approved phone was available to check its destination, although that step was required in this example.                                                | Blocked                | `DFC04.mp4`, 00:00-00:20; QR destination untested                                                                                |
| DFC05    | Both legal dialogs opened, scrolled and closed in English and Bisaya.                                                                                                                                 | Pass                   | `DFC05.mp4`, 00:00-00:50                                                                                                         |
| DFC06    | At the recorded example widths, Home/About and dialogs had readable controls with no observed clipping or overlap. Responsive emulation was recorded separately.                                      | Pass                   | `DFC06.mp4`, 00:00-01:00; fictional width notes                                                                                  |

## Fictional supporting technical evidence

- Backup entries describe designated testing fixtures, not a Production backend or independent ownership audit.
- A visible duplicate notice supports the user flow; exact file hashes and internal inference instrumentation require separate technical records if claimed.
- Private code values and raw credentials are absent. No cloud rows or photographs were accessed for this sample.

## Fictional retest or clarification

| Date          | Case / original issue                    | Changed inputs               | New observation / status                  | Evidence / basis                                       |
| ------------- | ---------------------------------------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Example Day 3 | PAFC11 / private steps outside recording | No new build or test claimed | Tester reported successful private checks | Tester statement; preserve initial sampled-review note |
| Not performed | DFC03 / EXAMPLE-01                       | None                         | Original Fail remains                     | Future retest needed                                   |

## Fictional summary

- Required case rows: 27; illustrative results: 25 Pass (including two tester-reported), one Fail and one Blocked.
- DFC03 needs a correction/retest; DFC04 still needs its required QR-destination observation.
- Later dates and testing/Production/emulator environments stay distinct.
- No actual test result, classification accuracy, SUS finding, certification or release approval is established.

## November 6, 2026

Created this fictional answer guide with the blank functional sheet. It contains no measured outcome, real photograph, recovery code or test credential.

Later the same day, shortened the example to match FC01–FC14 and added an explicit Upload Photo duplicate example. App-update checks were removed from this functional form only. No device, automated application, model or cloud test occurred.

Later the same day, expanded the answer table to show every FC01–FC14 row, with ten invented passes, one invented failure and three blocked backup/restore cases. The blank checklist remains unchanged. No device, automated application, model or cloud test occurred.

## November 12, 2026

Updated the current fictional example to the current manual cases. All example outcomes remain invented; no completed evidence was changed.

<details>
<summary>Earlier fictional front sheet, retained for historical comparison</summary>

# Functional checklist answer example

For the unreleased November 10 source, use the current blank sheet's variant-specific instructions: Diagnostics is Debug/testing-only; Production updates use Settings/browser guidance. The fictional earlier-version examples below remain unchanged and are not new test results.

The fictional example below retains its illustrative 0.13.0 / 0.1.9 identities. The [published reference observed November 7, 2026](TESTING.md#november-7-2026-published-production-fresh-qa) is web 0.13.1 / APK 0.1.10/code 11 / Model V5.1.0. Enter the actual tested artifact without transferring these invented outcomes; this sample remains fictional.

> **FICTIONAL EXAMPLE ONLY — NOT TEST EVIDENCE.** All people, devices, observations, outcomes and evidence paths below are invented. The example failure is not a reported app defect. Start real work from the [blank checklist](FUNCTIONAL_CHECKLIST.md); never submit this sample as research findings.

## How to fill the real sheet

Record build/device details once, perform a row's actions, then write the actual result, status and evidence location. Pass requires all required actions in that row. An observed problem is Fail; missing required steps/evidence are Blocked. Keep exclusions separate and preserve the original result when retesting.

A screenshot can show a visible result; it cannot by itself prove no new inference, no private enrollment or a completed cloud deletion. Link the relevant technical evidence. App updates are outside this functional form; separate release/physical checks remain in their own guide.

## Fictional build and tester record

- Tester/date: Example Tester; 2026-11-06, Asia/Manila — fictional.
- Device: Example Phone / Android EXAMPLE / System WebView EXAMPLE.
- APK: `example-release.apk`, `0.1.9/code 10` — illustrative, not an observed installation.
- About web bundle / model: `0.13.0 / V5.1.0` — reference labels, not tested values.
- Artifact/model receipt: `evidence/fictional/artifact-receipt.json` — nonexistent placeholder; real records need the exact receipt/hashes.
- Target: Production APK example; no live production backend was contacted.
- Conditions: English/Bisaya, default/enlarged text, portrait, online; backup not set up.
- Photos/evidence: Example Photo A, original gallery bytes; `evidence/fictional/` — nonexistent.

## Fictional test plan

This example includes **all fourteen rows, FC01–FC14**. The main record describes an invented Production APK session. The controlled testing-target backup evidence needed for FC11–FC13 is unavailable, so those rows remain Blocked; a testing result would not automatically become a Production-backend pass. App updates remain outside this functional form.

All observations and evidence paths are fictional. In a real record, each Pass requires evidence for every required action, not just the first successful substep. The invented clipping failure shows how to record Fail; it is not a reported MangoLeaf AI defect.

## Fictional actual-results examples

| Case / feature                           | Expected result                                                                                                                                               | Actual result                                                                                                                                                                                                                                                       | Pass / Fail / Blocked | Evidence / issue                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| FC01 — Open and navigate                 | APK opens; Home/About/Scan/History/Settings and page/Android Back work without stale screens or extra whole-app splash.                                       | Opened the fictional APK and visited all five destinations and available Settings subpages. Page Back and Android Back returned correctly; no stale page or extra splash appeared.                                                                                  | Pass                  | `evidence/fictional/fc01-navigation.mp4`                                |
| FC02 — Language                          | English/Bisaya labels stay readable, controls work and language choice persists.                                                                              | Switching and reopening retained Bisaya, but the Copy button label was clipped with enlarged text. This invented failure demonstrates reporting style.                                                                                                              | Fail                  | `evidence/fictional/fc02-language.png`; fictional issue EXAMPLE-01      |
| FC03 — Camera                            | Permission grant/denial, capture, Retake and Cancel work; square review matches preview; real close/background stops camera.                                  | Denial showed usable feedback. After permission grant, capture matched the centered square and Retake reopened the preview. Cancel saved nothing; Close and actual backgrounding stopped camera use.                                                                | Pass                  | `evidence/fictional/fc03-camera.mp4` and camera continuation notes      |
| FC04 — Upload Photo                      | Gallery selection previews the chosen file; canceling selection/review saves nothing; Retake reopens selection.                                               | Selected Example Photo A and saw its matching preview. Canceled both selection and review without a report. Upload Retake reopened the gallery picker.                                                                                                              | Pass                  | `evidence/fictional/fc04-gallery.mp4`                                   |
| FC05 — Diagnosis and result              | Fresh accepted/uncertain results show matching photo, class/confidence and Details; Production omits Debug probability rows.                                  | Fresh Photo A showed Healthy Leaf, 94.2%, matching photo and Details. Photo B showed Uncertain / Unrecognized, 68.7%, with appropriate Details. Neither Production result showed the Debug table. These invented outputs are not biological accuracy evidence.      | Pass                  | `evidence/fictional/fc05-results.mp4` and controlled presentation notes |
| FC06 — Save and reopen                   | Saved report/photo remain accessible in History/Details after restarting the APK.                                                                             | Both fictional reports/photos appeared in History. After restart, their Details still opened with the same photos and displayed results.                                                                                                                            | Pass                  | `evidence/fictional/fc06-history.mp4`                                   |
| FC07 — Search and filter                 | Search/category filters return matching reports/counts; pagination and selected Details work.                                                                 | Used controlled fictional reports across two pages. Search/filter counts matched the fixture inventory; Previous/Next and selected Details showed the expected reports.                                                                                             | Pass                  | `evidence/fictional/fc07-history-search.mp4` and fixture inventory      |
| FC08 — Upload the same saved photo again | Re-select the unchanged gallery file already saved under the active model; show the duplicate notice and reuse its report without inference or another entry. | Chose unchanged Example Photo A through Upload Photo after its successful current-model save. Photo already scanned appeared; View saved result opened that report. Fictional controlled call-count/storage evidence recorded no new inference or History entry.    | Pass                  | `evidence/fictional/fc08-duplicate.mp4` and duplicate technical notes   |
| FC09 — Delete reports                    | Cancel preserves selections; confirmed single/multiple deletion removes only the chosen test reports.                                                         | Cancel preserved all fixture reports. Confirmed single deletion and a later multi-selection removed only the chosen test reports; unrelated reports/photos remained accessible. No private cloud backup was connected.                                              | Pass                  | `evidence/fictional/fc09-delete.mp4` and fixture counts                 |
| FC10 — Treatment guidance                | Available English/Bisaya advice displays online/offline; unavailable/uncertain advice has appropriate feedback.                                               | Opened both language versions online, then in airplane mode with Wi-Fi off. Existing local advice remained readable. Unavailable and uncertain-result states showed the appropriate messages. No production guideline text was changed.                             | Pass                  | `evidence/fictional/fc10-guidance.mp4`                                  |
| FC11 — Backup controls                   | On designated testing fixtures, verify code creation, masked default, Show/Hide, Copy, On/Pause, concealment and preservation.                                | Production example showed no backup set up. A designated testing installation/fixture was unavailable, so Create/Show/Copy/Pause were not exercised. No production code was created and no private upload was triggered.                                            | Blocked               | `evidence/fictional/fc11-fixture-block.md`                              |
| FC12 — Restore feedback                  | Empty/malformed input, confirmed rejected credentials and connection failure get appropriate feedback; receiver state remains intact.                         | Empty and spaces-only input showed the paste reminder; malformed input showed local validation, without a restore. Confirmed rejection and connection-error fixtures were unavailable on the required testing target. Successful substeps do not complete this row. | Blocked               | `evidence/fictional/fc12-restore-input.mp4`; fictional issue EXAMPLE-02 |
| FC13 — Restore saved scans               | Controlled source reports merge into established/fresh receivers; existing receiver settings persist and counts reflect newly added reports.                  | Controlled source and receiving testing backups were unavailable. No merge, fresh-receiver setup, repeat count or ownership preservation was observed. No restore or Production-backend pass claimed.                                                               | Blocked               | `evidence/fictional/fc13-restore-block.md`                              |
| FC14 — Diagnostic logs                   | Settings recording/view/copy/export/disable/clear work; disabling retains logs and clearing preserves scan History.                                           | Recording began off. Enabled it, performed harmless navigation and viewed/copied/exported safe events. Disabling retained entries. Clearing logs left saved test reports/photos intact; no export error occurred in this example.                                   | Pass                  | `evidence/fictional/fc14-diagnostics.mp4` and export inspection notes   |

Every `evidence/fictional/...` location is a nonexistent placeholder. Real answers must link actual approved evidence from the exact artifact/device. A visible result cannot establish a technical claim such as raw threshold correctness, zero inference or completed cloud deletion by itself.

## Fictional supporting evidence

- FC01/FC03/FC06–FC10/FC14: invented video and continuation records describe the required visible actions for the recorded fictional phone. No actual recording exists.
- FC05: a separate invented controlled report covers seven-class mapping, raw threshold/formatting and absent saved probability rows. Controlled coverage is distinguished from phone observations and does not establish model accuracy.
- FC08: invented source-file identity, active-model saved report, inference call count and unchanged History count support the duplicate claim. A similar-looking camera photo would not complete this same-file test.
- FC11–FC13: no receiving-ownership/restore fixtures or technical evidence; those required observations remain Blocked. Local validation observed in FC12 does not prove wrong-code/network handling or successful restoration.
- Other technical areas: not evaluated by these fourteen visible examples; no full technical or release acceptance is claimed.

No code, password, personal report, real photo or genuine backend response is included here. Replace fictional evidence with existing approved records when performing actual testing.

## Fictional retest

| Date          | Case / original issue | Changed build/inputs         | New result / status    | Evidence                           |
| ------------- | --------------------- | ---------------------------- | ---------------------- | ---------------------------------- |
| Not performed | FC02 / EXAMPLE-01     | No later artifact identified | No retest pass claimed | Future exact-build record required |

## Fictional summary

- Required rows: **14**. Results: **10 Pass, 1 Fail, 3 Blocked**, all invented.
- All FC01–FC14 rows are illustrated; complete technical/Production-backend coverage is not established.
- Remaining issues: invented clipping failure and missing backup/restore/technical evidence.
- Conclusion: functional acceptance is not established; no release approval.
- Reliability, model/expert evaluation and SUS: not performed by this example.

</details>

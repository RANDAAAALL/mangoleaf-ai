# MangoLeaf AI functional checklist

**Blank recording sheet. Fill a copy after testing; no results are prefilled.** See the [short fictional sample](FUNCTIONAL_CHECKLIST_SAMPLE.md).

## Purpose and current scope

Use this researcher-prepared sheet to record whether the app's required features work as expected. It supports the study's selected functional-suitability assessment; SUS, model accuracy and physical reliability use separate records. This is not an official ISO questionnaire or certification.

Published reference observed on **November 7, 2026**: web **0.13.1**, APK **0.1.10/code 11** (Debug **0.1.10-dev**), unchanged model **V5.1.0**. See the [dated artifact and QA record](TESTING.md#november-7-2026-published-production-fresh-qa). Earlier candidate and Production observations retain their own evidence. Record actual installed/active values below; these reference labels do not prefill or complete a new test.

The main research record should identify the exact Production APK. Use a separate testing-target copy for controlled backup changes. Website checks are separate because the website provides Home/About/language/Android installation, without scanning or private backup.

**App-update checks are outside this functional sheet.** Existing [physical/native release checks](PHYSICAL_RELIABILITY_CHECKLIST.md#separate-backup-restore-and-apk-notice-candidate) remain separate. If the manuscript still includes “supported update actions,” account for them in that separate evidence or revise the manuscript's stated scope; removing this row does not establish an update pass.

## Build and tester record

Fill once for each exact build/device/session. Put long hashes and technical details in the linked artifact receipt instead of repeating them in every row.

- Tester and date/time/time zone:
- Phone / Android / System WebView version:
- Installed APK filename, version and code:
- Active web-bundle version shown in About:
- Active model version:
- Exact APK/active-bundle/model receipt or evidence location:
- Test target: Production APK / testing APK; cloud target:
- Language/text size, network and backup state:
- Approved test-photo aliases and evidence folder:

APK footer shows native host/model; About shows the separate web bundle. Never put recovery codes, credentials, personal reports or photographs into the tracked template.

## Before testing

1. Copy this blank sheet into an approved evidence folder, such as ignored `.tools/manual-testing/<date>/<build>/<device>/`. Keep existing personal History and credentials intact.
2. Identify the required rows and justified exclusions below before testing. Use only designated testing-project fixtures for backup creation, restoration and cloud deletion. Testing-target results do not count as Production-backend passes.
3. Perform the actions in each row and write what actually happened. Give the evidence location. A screenshot or short note can document visible behavior; technical claims need the supporting record listed below.

Required rows for this session:

Rows outside this session's scope, with reason/follow-up; existing issues or fixture limitations (write None if there are none):

## Actual results

Use **Pass** when all required actions in the row work, **Fail** when observed behavior is wrong, or **Blocked** when a required action/evidence is unavailable. If both failure and blockage occur, record Fail and explain both. Untested required rows are Blocked, never automatic passes. Predeclared exclusions stay separate from the pass count.

The IDs `FC01–FC14` identify this simplified form. Older records using `FS01–FS30` keep their original IDs and form scope; do not relabel their results.

| Case / feature                           | What to check / expected result                                                                                                                                                                                                                                | Actual result | Pass / Fail / Blocked | Evidence / issue |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------- | ---------------- |
| FC01 — Open and navigate                 | Open the APK; visit Home, About, Scan, History and Settings. Page Back/Android Back return correctly, without a stale screen or extra whole-app splash.                                                                                                        |               |                       |                  |
| FC02 — Language                          | Switch English/Bisaya. Labels/messages remain readable, controls work and the chosen language remains after reopening.                                                                                                                                         |               |                       |                  |
| FC03 — Camera                            | Allow/deny camera permission, capture, Retake and Cancel. Review matches the centered square; cancellation creates no report. Actual close/backgrounding stops camera use.                                                                                     |               |                       |                  |
| FC04 — Upload Photo                      | Select a gallery photo and check its preview. Cancel selection/review and use Retake. Cancellation saves nothing; gallery Retake reopens selection.                                                                                                            |               |                       |                  |
| FC05 — Diagnosis and result              | Run fresh inference. Matching photo, class, confidence and Details appear; uncertain results display appropriately. Production omits Debug probability rows. Record prediction correctness separately.                                                         |               |                       |                  |
| FC06 — Save and reopen                   | View a successfully saved report/photo in History, open Details and restart the APK. The saved report/photo remain available.                                                                                                                                  |               |                       |                  |
| FC07 — Search and filter                 | Search/filter History and move between pages. Matching reports/counts and valid pages appear; Details opens the selected report.                                                                                                                               |               |                       |                  |
| FC08 — Upload the same saved photo again | First save a scan from a gallery file using the active model. Choose that exact unchanged file again through Upload Photo. “Photo already scanned” appears; View saved result opens the existing report without another prediction or extra History entry.     |               |                       |                  |
| FC09 — Delete reports                    | Cancel, then confirm deletion of selected test reports, including multiple selections where available. Cancel preserves them; confirmation removes only the selected reports.                                                                                  |               |                       |                  |
| FC10 — Treatment guidance                | Open English/Bisaya guidance online and offline. Available local guidance remains readable; unavailable/uncertain advice has appropriate feedback.                                                                                                             |               |                       |                  |
| FC11 — Backup controls                   | On designated testing fixtures, check Create code, masked default, Show/Hide, Copy and On/Pause. Leaving/backgrounding conceals the code. Pause preserves local saving and existing cloud copies.                                                              |               |                       |                  |
| FC12 — Restore feedback                  | Exercise empty/malformed input, a confirmed rejected code and a separate connection failure on testing. Expected: appropriate reminders/retry feedback, preserved receiver settings and no restore for empty input.                                            |               |                       |                  |
| FC13 — Restore saved scans               | Using controlled testing fixtures, restore completed source reports into an established and a fresh receiver. Preserve existing reports/receiver settings; counts describe newly added reports, including zero on valid repeats. See ownership evidence below. |               |                       |                  |
| FC14 — Diagnostic logs                   | In Settings > Diagnostic logs, enable recording, view/copy/export, disable and clear. Disabling retains logs; clearing logs preserves scan History. Record export failures without claiming success.                                                           |               |                       |                  |

### What “Upload the same saved photo again” means

FC08 tests **Upload Photo/gallery selection**. Reuse the same original file after its first scan was successfully saved with the active model. A visually similar image, an edited/resized/recompressed copy, or a new camera capture is not guaranteed to be the same file. An older-model or unlabeled saved report must remain in History but must not suppress current-model inference.

Camera and gallery inputs share the app's duplicate-checking path. The gallery procedure makes the same-file check repeatable; it does not mean the implementation only checks gallery input. Do not delete the saved test report before this duplicate test.

## Supporting technical evidence

Record links and exact scope once. These details support the visible checks; they are not additional opinion-survey questions. Missing required technical evidence remains Blocked, and a testing-target or simulated result must not be presented as a physical Production observation.

| Supporting checks                                                                                                                                       | Evidence / target / remaining gap |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Native startup/bridge failure, raw local storage and missing-photo handling                                                                             |                                   |
| Seven-class display mapping, exact confidence rule/formatting, current-model duplicate matching and absent saved probability rows                       |                                   |
| Before-code local-only behavior, failed setup, own-code/Pause preservation, temporary source access, interrupted restore and queued own-backup deletion |                                   |
| Diagnostic privacy/export failures and interrupted copy/visibility actions                                                                              |                                   |
| Website Home/About/language/Android installation boundary, if included in the study's scope                                                             |                                   |

Use [existing functional/controlled cases](TESTING.md#functional-cases), [current Android cases](ANDROID_TESTING.md#qa-remediation-candidate-november-6-2026) and [backup preservation rules](../security/SECURITY-AND-SYNC.md). The separate [physical reliability sheet](PHYSICAL_RELIABILITY_CHECKLIST.md) covers repeated use, offline operation and interruptions.

## Retest record

Fill only when repeating a failed or blocked check. Preserve its original result. If no retest occurred, write Not performed; do not invent a passing result.

| Date | Case / original issue | Changed build/inputs, if any | New result / status | Evidence |
| ---- | --------------------- | ---------------------------- | ------------------- | -------- |
|      |                       |                              |                     |          |

## Summary and limits

- Required rows / Passed / Failed / Blocked:
- Excluded rows and remaining technical coverage:
- Issues needing correction or follow-up:
- Conclusion for this exact build/device/target:
- Separate reliability, model/expert or SUS evidence location, if applicable:

Do not turn this pass count into a SUS score, model accuracy or ISO certification. A completed feature check does not establish long-session reliability or authorize release.

## Related procedures and history

### November 6, 2026

- The source reference at preparation was unpublished web **0.13.1 / APK 0.1.10/code 11**, with Debug **0.1.10-dev** and model **V5.1.0**. The later published observation in the current instructions does not relabel those earlier candidate tests.
- Added a separate blank functional recording sheet and fictional sample using the existing application requirements/test guides. No physical test, model evaluation, cloud mutation, release approval or version change is implied.
- Later the same day, simplified the manual front sheet to FC01–FC14, linked supporting technical evidence, removed App updates from this functional scope and made the same-file Upload Photo duplicate procedure explicit. Earlier FS01–FS30 records retain their original meaning. Release/physical update procedures remain separate. No application/model/version or completed-test result changed.

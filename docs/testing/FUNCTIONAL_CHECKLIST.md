# MangoLeaf AI functional checklist

**Blank recording sheet.** Copy this file before filling it in. Use the [fictional sample](FUNCTIONAL_CHECKLIST_SAMPLE.md) for writing examples and the [evidence overview](MANUAL_EVIDENCE_REVIEW_CHECKLIST.md) for recording guidance.

## Purpose and current scope

Record whether the required functions work on the tested phone app, phone website and desktop website. These are researcher-prepared functional-suitability checks. Model classification performance, perceived usability through SUS, expert assessment and [physical reliability](PHYSICAL_RELIABILITY_CHECKLIST.md) have separate records.

The current manual IDs are **PAFC01-PAFC13**, **PWFC01-PWFC07** (including separate PWFC04-A and PWFC04-B), and **DFC01-DFC06**. Keep older FC, FS, F/A/M and completed test records under their original IDs. Diagnostic logs and app-update behavior are outside this manual form; Diagnostics is Debug/testing-only, while Production has Settings > App updates. Separate [Android verification](../versions/ANDROID_APK_VERSIONING.md#verification-and-remaining-evidence) still applies where required for release.

## Build and tester record

Fill once per exact build, environment and test session. Use separate dates/records for later recordings or changed builds; do not assume all videos show the same version.

- Tester, date/time and time zone:
- Reviewer and review date, if applicable:
- Phone model / Android / System WebView version:
- Installed APK filename, version/code and variant:
- Active web-bundle version in About / active model version:
- Artifact receipt, hashes or exact source reference, where available:
- Phone website URL / browser/version:
- Desktop website URL / operating system/browser/version:
- Language, display/text size, network and backup state:
- Approved photo aliases, disposable test reports and source/receiver aliases:
- Evidence location on the phone or other approved storage:
- Required cases / cases outside scope with reasons:

APK footer identifies the installed host/model; About identifies the separate web bundle. Browser labels do not prove which APK was installed. Never include recovery codes, credentials or personal photographs in the tracked template. Keep Production and testing targets distinct; do not copy Production reports into testing or use automated scans against Production.

## Plain-English button guide

- **App Back:** the back arrow inside MangoLeaf AI, usually near a screen title.
- **Phone Back:** Android's Back button at the bottom of the phone, or its Back swipe gesture. It is outside the app's own controls.
- **Phone Home:** Android's Home button/gesture. It puts the app in the background; the app is no longer the visible screen. This is different from MangoLeaf AI's Home tab.
- **Reopen after backgrounding:** press Phone Home, wait briefly, then tap the MangoLeaf AI icon. Do not clear its data.
- **Close and reopen:** open Android's recent-apps view, swipe away only MangoLeaf AI, then open it again. This does not mean uninstalling or clearing storage.
- **Desktop Esc:** press the computer keyboard's Esc key. It is not Phone Back.

## Before testing and recording

1. Use approved photos and test reports. Confirm the target and intended changes before backup setup, restoration or deletion. Deleting a connected report can also delete its copy in this phone's backup; Gallery originals are separate. Use approved testing fixtures for controlled faults.
2. Start a screen recording for each case if that is the chosen evidence method. Show the starting screen, actions and final outcome. Screenshots are optional. Keep full videos on the phone when that is the agreed location.
3. Pause recording before exposing or entering private recovery codes. Resume after the code is hidden; privately check Show/Hide or Copy/Paste and record what you observed without writing the code. Identify these as tester-reported observations.
4. Write what happened, not simply "buttons pressed." Use **Pass** when required actions produced the expected results, **Fail** for observed incorrect behavior, or **Blocked** when a required test or outcome cannot be established. Record partial coverage and retain failures even if other steps were blocked.
5. State the evidence basis: direct tester observation, video review with timestamps, or both. A tester-confirmed outcome may be recorded as **Pass (tester reported)**; do not describe it as independently video-verified. Untested work does not become a pass. A reviewer should document sampled sections and gaps.

## Phone app functional cases

### PAFC01 - Open, navigate and go back

1. Open the installed APK. Visit Home, About, Scan, History and Settings. Close the Scan choice sheet without running a scan.
2. In Settings, open an available subpage and return with **App Back**. Open it again and return with **Phone Back**. Record what each button did.
3. Close and reopen the app. Check that navigation works and no old subpage remains stuck.

Expected: all five destinations work; both Back controls return to the appropriate screen; reopening is usable.

### PAFC02 - English and Bisaya

1. Open Settings and the language screen. Select English and inspect visible labels.
2. Select Bisaya and check the same screens. Return using **App Back**.
3. Close and reopen the app. Check that the selected language remains.

Expected: both language choices work, text is readable and the chosen language persists.

### PAFC03 - Camera

1. Open Scan > camera. If permission has not been granted, deny it and check the feedback. Allow camera access through the prompt or Android app-permission settings, then reopen the camera. Record any already-granted or unavailable permission branch.
2. Aim at an approved subject and capture it. Check that Review matches the centered square. If photographing a laptop-displayed mango image, identify it as a screen photograph.
3. Tap Retake and capture again. Close Review; check that no report was saved without running diagnosis.
4. Open the live camera again. Use **Phone Home** to put the app in the background and check that camera use stops. Return to the app; explicitly reopen the camera if needed. Close it using its own Close control and check that it stops.

Expected: permission feedback is appropriate; capture/Review/Retake work; cancellation saves nothing; real backgrounding and Close stop camera use. A permission dialog alone is not proof of backgrounding.

### PAFC04 - Upload Photo from Gallery

1. Open Scan > Upload Photo. Choose an approved photo from Mango Photos or Unrecognized Photos and inspect Review.
2. Tap Retake and check that photo selection reopens. Leave the picker with **Phone Back** without selecting a photo.
3. Choose a photo again, then close Review with its Close control. Check History.

Expected: the selected photograph is previewed; Retake reopens selection; cancellation creates no saved report.

### PAFC05 - Fresh diagnosis and result

1. Choose an approved photo without an existing current-model report and run diagnosis. Wait for processing to finish.
2. Check the photo, displayed label, confidence, Details and saved entry. Repeat with an approved unsupported photo; record its actual output, even if it receives an accepted mango label.
3. In Production, check that the Debug class-probability table is absent. Close Details using its own Close control.

Expected: processing produces a readable result for the selected photo, with appropriate accepted/uncertain presentation. Classifying an unsupported photo as mango is recorded separately as a model false acceptance; this function check does not establish classification accuracy.

### PAFC06 - Saved scans after reopening

1. Save designated test scans and open their photographs and Details in History.
2. Close and reopen the app, then open the same reports again.

Expected: committed reports, photographs and Details remain available.

### PAFC07 - History search, filters and pages

1. Search for a displayed report name, then search for text that matches nothing. Clear the search.
2. Select available filters and check the displayed reports and counts. Open a report's Details and close it.
3. Use enough approved reports to display more than one page. Move forward and backward with the History page controls, including after a filter or approved deletion changes the list.

Expected: search/filter results match the selection, Details matches its report and pages remain valid. Record a one-page-only limitation rather than assuming pagination passed.

### PAFC08 - Upload the same saved photo again

1. Successfully scan and save an approved original Gallery file using the active model.
2. Select that exact unchanged original through Upload Photo again. Do not delete the first report before this check.
3. Check the duplicate notice, open the saved result and compare the History count.

Expected: the saved current-model result opens without another prediction or extra report. A similar image, edited copy or new camera capture does not establish identical-file reuse. Older-model reports remain in History but do not replace a fresh current-model diagnosis. Record the visible behavior separately from any technical inference/file-identity evidence.

### PAFC09 - Delete designated test reports

1. Select one approved disposable report and request deletion. Tap Cancel; check that it remains. Repeat cancellation with multiple reports selected.
2. Confirm deletion of one approved report and check that only it disappears. Repeat for multiple approved reports.
3. Check that unselected reports remain and the current History page is valid.

Expected: Cancel preserves reports; confirmation removes only the selected reports. Do not delete Gallery originals or unrelated History. Record any connected-backup effect separately.

### PAFC10 - Guidance online and offline

1. Open available guidance and read it in English and Bisaya.
2. Turn airplane mode on and explicitly turn Wi-Fi off; airplane mode alone can leave Wi-Fi connected. Open the same locally available guidance in both languages.
3. Record the advice/condition actually checked and restore the original connectivity settings afterward.

Expected: available local guidance remains readable offline; unavailable or uncertain advice has suitable feedback. No Production guideline edits are needed.

### PAFC11 - Backup setup and controls

1. On an approved receiver/target, open Settings > backup. If no own code exists, explicitly set up backup. Do not reset an established personal installation to create this branch.
2. Privately check the masked default, Show/Hide and that Copy/Paste matches. Keep code values outside recordings/shared records.
3. Check On/Pause. Leave with **App Back**, then background using **Phone Home**; check that the code is concealed when returning.
4. Close and reopen the app; privately check that its own code and Pause choice remain as expected.

Expected: setup is explicit; controls work; private code display is concealed; settings persist. On means backup is enabled, not that every photograph finished uploading. Pausing preserves local saving and existing copies; already queued own deletions may still retry online.

### PAFC12 - Restore input and error feedback

1. Submit an empty restore field and check the inline reminder. Test malformed input, then an approved well-formed but rejected test credential.
2. With a valid approved source, disable connectivity before submitting and check the connection/retry feedback. Restore connectivity afterward.
3. Check that failed attempts left the receiver's existing reports, own code and Pause choice unchanged. Compare codes privately without recording their values.

Expected: appropriate input/credential/connection feedback; no empty-input restore or replacement of receiver settings. A connection error must not be reported as proof that a code is wrong.

### PAFC13 - Restore saved scans

1. Use an approved completed source backup and a receiver with an existing own code. Record expected source count and the receiver's report count/code/Pause privately.
2. Restore and inspect added reports/photos. Check that existing reports, receiver code and Pause choice remain; repeat the same restore and check that it adds no duplicates.
3. Separately use an approved receiver without an own code, such as a designated emulator. Restore and privately check that it gets its own separate code/backup. Repeat and inspect the count.

Expected: completed scans are copied without replacing receiver state or changing the source. A valid repeat adds zero when all source reports are already present. Record actual added counts and identify the physical and emulator branches separately. Screens alone do not verify backend ownership; link separate technical proof if that claim is required.

## Phone website functional cases

Use the phone's browser. It provides Home, About and Android installation; scanning and private backup belong to the APK.

### PWFC01 - Home and About

1. Open the official website, `https://mangoleafai.vercel.app`, in the recorded phone browser.
2. Open Home and About with the website controls and scroll through them.

Expected: both sections open and their content is readable.

### PWFC02 - Website language

1. Select English and Bisaya on the website. Inspect Home/About text for each choice.
2. Reload the browser page and check that the selected language remains.

Expected: language controls work and the choice persists after reload.

### PWFC03 - Android installation guide

1. Open the installation guide using the available website action and read/scroll its instructions.
2. Close it using its Close control, then reopen it.

Expected: Android guidance appears and closing/reopening returns to the correct website screen.

### PWFC04-A - Main APK download

1. In the phone guide, use the main APK download action. If the website recognizes the installed app, use its explicit reinstall/update route to reach the download.
2. Follow the browser's download confirmation. Open the browser's Downloads list and verify completion, not merely a started transfer.

Expected: the official APK finishes downloading. Record the exact filename; downloads can receive numbered names when older copies exist. If unavailable feedback appears, record it and use the offered Retry under its normal cooldown.

### PWFC04-B - GitHub fallback download

1. Select Download from GitHub instead and check that it opens the official MangoLeaf AI release.
2. Select the APK asset and confirm the browser download. Verify the completed file in Downloads.

Expected: the fallback reaches the official release and completes an APK download. Opening GitHub alone does not complete this case. A later recording is valid; record its actual date and build separately.

### PWFC05 - Install and open the APK

1. Open the completed session download. Confirm the exact filename, then follow Android's ordinary installer prompts; handle protected prompts directly if required.
2. Open MangoLeaf AI after installation. Record the installed native version/code where available, About web-bundle/model and whether this was a fresh install or an update.

Expected: Android reports installation success and the app opens. Normal updates install over an existing same-signer APK; do not uninstall or clear data merely to test an update. A fresh-install check requires an approved disposable setup.

### PWFC06 - Open app handoff

1. Return to the website with the APK installed. Tap Open app when the website offers that action.
2. Record whether it opens the app or presents guidance. Return to the browser using Android's recent-apps view if needed.

Expected: an offered confirmed-installation handoff opens the APK. If installation is unconfirmed, the website may show installation guidance; record that branch without claiming a direct handoff occurred. No automatic launch should occur without a tap.

### PWFC07 - Privacy Policy and Terms of Service

1. Select English. Open Privacy Policy, scroll and close it; repeat for Terms of Service.
2. Select Bisaya outside the dialogs and repeat both checks. Record the displayed language.

Expected: both dialogs open, scroll and close with the appropriate language. Record the actual date if this was filmed later than other website cases.

## Desktop website functional cases

Use an actual computer browser. Phone Desktop site mode does not replace these observations.

### DFC01 - Home and About

1. Open the official website in the recorded desktop browser.
2. Open Home and About and scroll through their content.

Expected: navigation works and content is readable.

### DFC02 - Language and reload

1. Switch English/Bisaya and inspect Home/About.
2. Reload and check the chosen language.

Expected: language selection works and persists after reload.

### DFC03 - Guide Close and Esc

1. Open the Android installation guide, then close it with X/Close.
2. Reopen it and press the keyboard's **Esc** key. Record which closing method was used.

Expected: both methods close the guide and return to the website.

### DFC04 - Android guidance and QR

1. Open the desktop Android guide and inspect its instructions and QR code.
2. Where QR scanning is included in the session, scan it with an approved phone and check the destination. Name the separate phone recording if used.

Expected: Android instructions are readable; the QR opens the official phone installation guide. Record when only the desktop display, rather than an actual QR destination, was checked.

### DFC05 - Legal dialogs

1. Open, read/scroll and close Privacy Policy and Terms of Service.
2. Repeat for the other language selection and record the displayed text language.

Expected: both dialogs remain readable and close correctly.

### DFC06 - Layout and scrolling

1. Resize the computer browser to the widths included in the session. Scroll Home/About and open installation/legal dialogs.
2. Check that text and controls remain visible without overlap or unintended horizontal scrolling. Record tested window sizes.

Expected: the inspected layouts remain usable. Identify browser responsive emulation separately from physical-phone evidence.

## Actual results

Fill each required row after testing. In Evidence / basis, include the original video filename, relevant timestamps, actual recording date, and whether the outcome was directly observed, tester reported or video reviewed. Use a continuation for long observations.

| Case     | Actual observation | Pass / Fail / Blocked | Evidence / basis |
| -------- | ------------------ | --------------------- | ---------------- |
| PAFC01   |                    |                       |                  |
| PAFC02   |                    |                       |                  |
| PAFC03   |                    |                       |                  |
| PAFC04   |                    |                       |                  |
| PAFC05   |                    |                       |                  |
| PAFC06   |                    |                       |                  |
| PAFC07   |                    |                       |                  |
| PAFC08   |                    |                       |                  |
| PAFC09   |                    |                       |                  |
| PAFC10   |                    |                       |                  |
| PAFC11   |                    |                       |                  |
| PAFC12   |                    |                       |                  |
| PAFC13   |                    |                       |                  |
| PWFC01   |                    |                       |                  |
| PWFC02   |                    |                       |                  |
| PWFC03   |                    |                       |                  |
| PWFC04-A |                    |                       |                  |
| PWFC04-B |                    |                       |                  |
| PWFC05   |                    |                       |                  |
| PWFC06   |                    |                       |                  |
| PWFC07   |                    |                       |                  |
| DFC01    |                    |                       |                  |
| DFC02    |                    |                       |                  |
| DFC03    |                    |                       |                  |
| DFC04    |                    |                       |                  |
| DFC05    |                    |                       |                  |
| DFC06    |                    |                       |                  |

## Supporting technical evidence

Link exact-scope evidence when needed for internal inference execution, native storage, file hashes, backend ownership or completed cloud transfers. A readable result or an On status alone does not establish those internal outcomes. Use the [testing guide](TESTING.md#functional-cases), [Android verification](ANDROID_TESTING.md) and [backup preservation rules](../security/SECURITY-AND-SYNC.md). Keep testing-target, simulated and Production observations distinct.

Technical claim / target / evidence / remaining limit:

## Retest record

Preserve the original observation. Record a later test or tester clarification with its actual date and basis; a clarification is not a newly performed retest.

| Date | Case / original issue | Changed build/inputs, if any | New observation / status | Evidence / basis |
| ---- | --------------------- | ---------------------------- | ------------------------ | ---------------- |
|      |                       |                              |                          |                  |

## Summary and limits

- Required cases / Passed / Failed / Blocked:
- Cases outside scope, with reasons:
- Later recording dates / separate builds or environments:
- Issues and follow-up:
- Conclusion limited to these functions, conditions and evidence:
- Separate reliability / model / expert / SUS records:

Do not convert a checklist pass count into classification accuracy, a SUS score, all-device reliability, ISO certification or release approval.

## Related procedures and history

### November 6, 2026

- The source reference at preparation was unpublished web **0.13.1 / APK 0.1.10/code 11**, with Debug **0.1.10-dev** and model **V5.1.0**. The later published observation in the current instructions does not relabel those earlier candidate tests.
- Added a separate blank functional recording sheet and fictional sample using the existing application requirements/test guides. No physical test, model evaluation, cloud mutation, release approval or version change is implied.
- Later the same day, simplified the manual front sheet to FC01–FC14, linked supporting technical evidence, removed App updates from this functional scope and made the same-file Upload Photo duplicate procedure explicit. Earlier FS01–FS30 records retain their original meaning. Release/physical update procedures remain separate. No application/model/version or completed-test result changed.

### November 12, 2026

Updated the current manual forms to PAFC/PWFC/DFC and RC scopes, with separate evidence basis and fictional samples. Historical records and automated case IDs are unchanged; this documentation update performs no tests.

<details>
<summary>Earlier front sheet, retained as historical instructions</summary>

The following is the previous form, not the current protocol. Its version references and excluded/supplemental cases retain their original scope.

# MangoLeaf AI functional checklist

For the November 2026 researcher-recorded session, use the [manual evidence review checklist](MANUAL_EVIDENCE_REVIEW_CHECKLIST.md) for PAFC, PWFC and DFC scopes. The FC rows and historical records below retain their original IDs and meanings.

## Unreleased source note (November 10, 2026)

For the changed source, Diagnostic logs are Debug/testing-only and absent from Production. Production App updates uses inline Settings guidance and a fixed official browser link, with signed web-restart controls on the same screen; no automatic update dialog is expected. Verify Android installs a new same-signer APK over the existing app and preserves local scans/code/Pause. Do not uninstall or clear data for an update check. Keep these cases separate from the original November 7 artifact/evidence and record a new exact build before retesting. Earlier dated popup/native-downloader procedures describe older bundles.

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
| FC14 — Diagnostic logs                   | On Debug/testing only, in Settings > Diagnostic logs, enable recording, view/copy/export, disable and clear. Disabling retains logs; clearing logs preserves scan History. Record export failures without claiming success.                                    |               |                       |                  |

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

</details>

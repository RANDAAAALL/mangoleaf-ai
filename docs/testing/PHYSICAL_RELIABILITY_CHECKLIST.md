# MangoLeaf AI physical reliability checklist

Use one completed copy for each release build, device, operating system, browser, and test date. This sheet records physical-device reliability evidence. It does not measure model accuracy or replace expert-reviewed evaluation data. The current candidate is app `0.8.0`, model `v4.5.0`, confidence-only threshold 0.70. Fill results only after observing the exact recorded release build; do not transfer a previous build's observations to this candidate.

For published browser compatibility builds, reports/photos stay in IndexedDB and Supabase supplies public treatment guidance only. The unpublished Android candidate uses SQLite/private photos and automatic private cloud backup with separately saved recovery credentials. Record the target, APK/bundle hashes, native host/bridge/schema versions, and backup pause state and recovery-code availability when testing Android; do not apply the browser-only network expectation to an enabled native backup. Use the exact tested build identity below; dated changes are in [Protocol history](#protocol-history). See [Android verification](../versions/ANDROID_APK_VERSIONING.md#verification-and-remaining-evidence) for additional native cases.

Do not mark a case as passed before every required observation is recorded. Use `Pass`, `Fail`, or `Blocked`; explain every failure or block.

A checked field or result box means its value was recorded. It does not always mean the test passed: `[x] R01 result: Blocked: <reason>` means the block was recorded honestly. Check an observation such as “App opens offline” only when it is true; otherwise leave it unchecked and explain the failure or block in the result line.

Use `Pass` when all required observations meet their expected behavior, `Fail` when observed application behavior is wrong (including a crash), and `Blocked` when missing access, inputs, or evidence prevents a required observation. If a failure and a block both occur, record `Fail` and list the remaining blocked observations. Type the status in the table cells and section result lines, replacing `Pass / Fail / Blocked` with one value.

Need an answer-format example? See [PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md). Its values are fictional and must never be submitted as physical-test evidence.

<a id="candidate-and-tester-record"></a>

## Release and tester record

- [ ] Release commit ID:
- [ ] Deployment URL tested (HTTPS):
- [ ] Application version shown in footer:
- [ ] Model version shown in footer:
- [ ] Model asset hashes / evidence location:
- [ ] Tester:
- [ ] Date and local time zone:
- [ ] Device model:
- [ ] Operating system and version:
- [ ] Browser and version:
- [ ] Mode: Android APK / development-browser tab:
- [ ] Diagnostics enabled before this session: Yes / No; memory-only warning: Yes / No:
- [ ] Actual inference backend / texture precision, if available in diagnostics:
- [ ] Network used before offline checks:
- [ ] Local test profile / device alias (no guest sign-in required):
- [ ] Photo IDs and SHA-256 hashes:
- [ ] Screenshot, video, notes, and issue-link location:

## Before testing

- [ ] Tested deployment is exact commit recorded above.
- [ ] Deployment uses HTTPS. Do not use a LAN `http://` URL for service-worker testing.
- [ ] Footer shows recorded application and model versions.
- [ ] Device has enough storage and battery for 30-minute session.
- [ ] Use a designated test browser profile or device. Do not mix research evidence with personal scan history.
- [ ] Core automated result for this build: Pass / Fail / Blocked; report or reason:
- [ ] Automated R01 result for this build: Pass / Fail / Blocked; report or reason:
- [ ] Automated R03 result for this build: Pass / Fail / Blocked; report or reason:
- [ ] Record automated report location:

Record physical observations even when an automated check is still pending; mark the missing evidence as blocked and explain why. Release approval still requires the approved automated and physical scope for the exact build. `bun run test:e2e` collects core results; `bun run test:reliability` runs both R01 and the full 30-minute R03 session when authorized. Preserve each report before a later run replaces it. Do not run a shortened substitute or mark a missing session as passed.

The `0.7.0` preparation does not itself complete any physical observation below; **no full or shortened R03 session was run for that preparation**. Record a later session's own dates, commit, deployment, and observations.

## Diagnostics and stall evidence (v0.7.0)

Enable **About > Diagnostics > Record diagnostic events** before reproducing a failure. Recording is off by default; enabling it afterward cannot recover earlier actions. About is the only viewer, and no log button is added to a blocking modal. The shared recorder retains recent events after modal/tab changes. Disabling stops new recording without clearing existing history.

- [ ] In a clean test profile, recording starts unchecked; normal camera/scan/save/delete actions still work while it is off.
- [ ] Enable recording; navigate between Home, History, and About, then open View logs. Earlier step events remain visible.
- [ ] Reload/reopen the same app/browser context; verify the preference and already persisted events restore when storage is available. Record any browser-specific loss rather than assuming it survives every close.
- [ ] Copy and Download work on this device. If clipboard permission fails, the log remains selectable; record the fallback outcome.
- [ ] Clear diagnostics while a designated scan/photo is saved; verify that report/photo remains in History. Downloaded files are separate and are not removed by Clear.
- [ ] With a controlled storage failure, if applicable, the memory-only warning appears and scanning/saving/deleting do not fail because diagnostic persistence failed. Record whether the failure was injected or naturally observed.
- [ ] Export contains only technical events/status/counts/timings, app/model version, coarse browser/OS information, and actual backend/precision where available. It contains no photos, diagnosis scores/labels, image hashes, private URLs, credentials, or report/device/guest identities. Operation IDs are temporary diagnostic correlation labels.
- [ ] Diagnostics result: Pass / Fail / Blocked - reason and evidence location:

Logs rotate at 200 events and 64 KiB of serialized UTF-8 JSON. They stay in memory and, best effort, localStorage under `mangoleaf-diagnostics-v1`; no automatic server upload occurs. Normal event writes are debounced by 250 ms and flushed on page hide/backgrounding. Browser storage denial/quota, crashes, and a frozen browser/driver thread can lose the latest events. If browser storage denies every change, Clear cannot guarantee removal of an older saved copy. A start without a completion event helps locate unfinished work but does not prove a specific root cause or that IndexedDB is defective.

### Record each reproduced stall

- [ ] Incident time/time zone and elapsed time:
- [ ] Action: disabled Run / enabled Run did not advance / analyzing / confirmed deletion / other:
- [ ] Button appearance, photo-check text, visible stage, and 15/45/75/90% milestone, if present:
- [ ] Phone model, exact OS/browser version, APK or dev tab, network, and background/lock-screen activity:
- [ ] Cancel/Close/retry/reload action attempted and observed response:
- [ ] Log export location, persistence warning, screenshot/video, and issue link:
- [ ] History rows/photos checked after recovery; save/delete already completed, not completed, or unknown:
- [ ] Incident result: Pass / Fail / Blocked - reason and remaining evidence gaps:

For **Run that does not advance**, distinguish faded/disabled from enabled/tappable. Disabled native-button taps do not emit click-handler events; startup/readiness/photo-check events explain the recorded state. If review closes normally, open About and export. For **analyzing**, allow the existing 60-second analyze deadline to offer recovery; browser/driver blocking can delay timers. For **confirmed deletion**, there is no automatic deadline and Cancel/Close remain disabled while deletion is pending.

If recovery controls remain unusable, reload or fully close and reopen the same app/browser, then export preserved logs promptly before another attempt rotates the incident out. Check History before retrying because a save/delete may have committed without its screen updating. An unsaved diagnosis can be lost. Do not clear browser data or uninstall during troubleshooting: both can erase local reports/photos and logs. Reopening is a recovery attempt, not a guaranteed fix; document repeated failures for investigation.

## R01-M01: repeated prediction consistency

Use same image bytes for every repetition. Duplicate reopening is not new inference.

### Input plan

- [ ] Photo ID / hash:
- [ ] Expected number of repetitions:
- [ ] Number completed:
- [ ] Result label on run 1:
- [ ] Accepted or uncertain on run 1:
- [ ] Confidence on run 1, if displayed:

### Each repetition

For each run, scan the photo, record result, then delete that test record and wait until it disappears from History before scanning same bytes again. This forces another inference instead of duplicate-report reuse.

| Run   | Result label                                | Accepted / uncertain | Visible confidence | Record deleted before next run | Pass / Fail / Blocked | Notes |
| ----- | ------------------------------------------- | -------------------- | ------------------ | ------------------------------ | --------------------- | ----- |
| 1     |                                             |                      |                    |                                |                       |       |
| 2     |                                             |                      |                    |                                |                       |       |
| 3     |                                             |                      |                    |                                |                       |       |
| 4     |                                             |                      |                    |                                |                       |       |
| 5     |                                             |                      |                    |                                |                       |       |
| 6     |                                             |                      |                    |                                |                       |       |
| 7     |                                             |                      |                    |                                |                       |       |
| 8     |                                             |                      |                    |                                |                       |       |
| 9     |                                             |                      |                    |                                |                       |       |
| 10    |                                             |                      |                    |                                |                       |       |
| 11-30 | Attach continuation table or evidence file. |                      |                    |                                |                       |       |

- [ ] Displayed result label and accepted/uncertain status stayed stable across planned runs.
- [ ] Confidence variation recorded where confidence was displayed.
- [ ] No duplicate reopening was counted as a prediction.
- [ ] R01 result: Pass / Fail / Blocked — reason and evidence location:

This manual path checks displayed label/acceptance stability and records visible confidence variation. Display uses the stored score rounded down to at most one decimal and omits a trailing `.0`; it is not the full raw numeric value. It does not verify the automated R01 tolerance of 0.001 on raw confidence. The preserved optional fresh-result table displays formatted probability copies, not full raw numeric values; those rows are not saved in History. About's optional event recorder does not capture scores or probability tables. If full raw class, numerical confidence, margin, or entropy evidence is required on a phone, a separately configured device-capable runner is needed. The repository's current harness runs only on the local loopback test server; it is not reachable from a phone or included in the deployment.

## R02-M01: offline availability after initial load

Use two different photos. Photo B must not have been scanned on this device before.

### Online preparation

- [ ] Open recorded release build while online.
- [ ] Wait for app and model to finish initial loading.
- [ ] Scan Photo A:
- [ ] Photo A result appears in Recent Scans and History, including its image.
- [ ] Open treatment guidance online once and confirm the downloaded advice is visible before disconnecting.
- [ ] Close and reopen app once while still online.

### Airplane-mode check

- [ ] Enable airplane mode and turn Wi-Fi off.
- [ ] Fully close then reopen the Android APK or development-browser tab.
- [ ] App opens offline.
- [ ] History and Photo A remain visible.
- [ ] Scan new Photo B offline.
- [ ] Photo B receives a result and appears in local History.
- [ ] Close and reopen offline again; Photo B still appears.
- [ ] No crash, permanent loading state, or missing-photo placeholder occurred.

### R02-M02: reconnection check

- [ ] Restore network.
- [ ] Confirm saved History/photos remain local after reconnection; no guest sign-in or scan upload is expected.
- [ ] No duplicate records appear.
- [ ] No deleted test record returns unexpectedly.
- [ ] Change guidance on the designated test backend while offline; reconnect and confirm its current English/Bisaya advice downloads, then confirm a later live update appears. Do not write production treatment text for a test.
- [ ] R02-M02 result: Pass / Fail / Blocked — reason and evidence location:
- [ ] R02 result: Pass / Fail / Blocked — reason and evidence location:

## Local storage-full recovery

- [ ] Record device free space, browser/version, and whether quota failure was natural or injected.
- [ ] A failed new scan save shows Device storage is full; existing History/photos remain intact.
- [ ] Open History retains the unsaved result and lets the user explicitly delete selected reports.
- [ ] Retry save stores that same result once without another AI prediction.
- [ ] Repeated failure keeps the recovery actions available; no permanent analyzing overlay remains.
- [ ] Discard releases the unsaved result and allows a new scan; it does not remove other reports.
- [ ] Reloading loses an unsaved result as explained, while previously committed reports remain.
- [ ] Repeat History view/delete and saving offline, then reconnect without duplicate/resurrected rows.
- [ ] Storage-full result: Pass / Fail / Blocked — reason and evidence location:

## R03-M01: 30-minute mixed-use session

Start time:

End time:

Use real scans. To avoid duplicate shortcuts, choose different photos or delete each completed test record before its next use. Include Details, History, navigation, rotation, background/resume, and network changes.

Mix actual guided-camera capture and gallery uploads. Record the tested app/model versions, asset hashes, and observed backend/precision where available. Synthetic-camera automation does not satisfy these physical observations. After reconnecting, local History/photos remain local while public guidelines refresh. Use the [protocol history](#protocol-history) to identify earlier instruction changes; it is not a completed session record.

| Time   | Action completed                                              | Result / observation | Crash, freeze, lost record, or stuck scan? | Heat / battery / slowdown notes | Pass / Fail / Blocked |
| ------ | ------------------------------------------------------------- | -------------------- | ------------------------------------------ | ------------------------------- | --------------------- |
| 0 min  | Open app; guided capture; review/Retake; Run; Details/History |                      |                                            |                                 |                       |
| 10 min | Gallery scan; delete test record; rotate; reopen app          |                      |                                            |                                 |                       |
| 20 min | Camera background/reopen; capture; cached offline diagnosis   |                      |                                            |                                 |                       |
| 30 min | Capture/gallery scan; verify History; reconnect/reopen        |                      |                                            |                                 |                       |

- [ ] Session lasted at least 30 minutes.
- [ ] No crash or browser-tab reload occurred unexpectedly.
- [ ] No scan stayed permanently in progress.
- [ ] No confirmed local record or photo was lost.
- [ ] No navigation control became unusable.
- [ ] Both actual guided-camera capture and gallery upload occurred; every counted diagnosis required an explicit Run action and fresh inference.
- [ ] Camera Retake discarded review and reopened live preview without saving or predicting; gallery Retake reopened its picker.
- [ ] Camera streams stopped after Capture, Close, and backgrounding; record OS camera-indicator behavior and observed delays.
- [ ] Permission denial left the app usable; permission recovery and retry were observed, with no invented pass if browser settings prevented the check.
- [ ] After app/model caching, capture and diagnosis worked offline; reconnection preserved local History/photos and allowed public guideline refresh without private scan/photo requests.
- [ ] Camera-start/capture delays, device rotation, heat, battery, and interruptions were recorded as observations rather than inferred from desktop tests.
- [ ] R03 result: Pass / Fail / Blocked — reason and evidence location:

<a id="r04-m01-native-camera-gallery-and-layout"></a>

## R04-M01: guided camera, gallery, and layout

Take Photo opens live camera preview below 768px. Complete these checks on the recorded Android devices in APK mode, and in development-browser mode when applicable. The supported mobile product is Android only; former iOS observations remain historical evidence. Desktop emulation and synthetic camera streams do not satisfy physical observations.

### Camera and picker

- [ ] Use HTTPS; below 768px, tap Take Photo and grant browser permission. Live preview appears and Capture becomes available only after a frame is ready.
- [ ] Record camera/lens selected and delivered frame dimensions; the rear-camera preference does not guarantee a specific lens or 1280×720 output.
- [ ] Verify the camera preview is square in portrait and landscape, with both sides between 280 and 360 CSS pixels. Record viewport and observed size; these are display pixels, not captured-image resolution.
- [ ] All four green corner brackets remain visible, with 4px borders, 36px arms, and 16px rounding matching the clipped preview. Check bright/dark subjects and device rotation.
- [ ] Capture matches the centered square visible in the preview at the moment of capture, including after rotation; excluded outer camera areas are not included in review. CSS corner rounding and guide marks are not burned into the photo. Record delivered frame dimensions and captured square dimensions separately.
- [ ] Captured photo opens review; no scan is saved and no diagnosis starts until Run AI Diagnosis is pressed.
- [ ] Deny camera permission; meaningful message appears, Close works, Upload Photo remains available, and no scan is created.
- [ ] Allow camera permission again through browser settings and retry; capture can recover without duplicate streams.
- [ ] Close before permission completes; any late camera stream stops without opening review or creating a scan.
- [ ] Close an active preview; the OS camera-use indicator clears. Record the observed delay.
- [ ] Background the app while preview is open; camera stops. Return to the paused message, then explicitly reopen; no automatic stream restart occurs.
- [ ] If interruption can be reproduced, disconnect or end camera access; Capture disables and retry recovers. Otherwise record this observation as blocked.
- [ ] If live capture is unsupported, the translated message and Close work; choose Upload Photo from the scan sheet. No native-camera fallback is promised.
- [ ] Close camera or cancel the upload picker; no scan is created and the initiating control regains usable focus.
- [ ] Upload from gallery; selected photo preview matches source.
- [ ] Camera Retake discards review and opens a fresh live preview; upload Retake reopens the gallery picker. No stale preview or saved record appears after cancellation.
- [ ] After initial caching, repeat camera capture and diagnosis in airplane mode; local result and photo remain available. Check local History preservation and public guideline refresh after reconnection in R02-M02; no scan/photo upload is expected.

### Result and layout

- [ ] Run at least two distinct camera captures and gallery uploads online and after offline caching; record device/OS/browser, each progress stage, and total elapsed time.
- [ ] If analysis stalls, record the 15/45/75/90% workflow marker, elapsed time, and `[Diagnosis]` console timings when accessible. Use the [diagnostics/stall record](#diagnostics-and-stall-evidence-v070) for phone export and recovery; check Cancel/Escape and offered retry/reload actions without repeated tapping.
- [ ] If GPU warmup times out after model assets load, confirm the startup failure banner and Reload action. Record device/browser logs; model/config download stalls remain a separate check.
- [ ] After recovery, check History for missing or duplicate rows; a result committed before cancellation remains valid and should be reused by the exact-photo/current-model check.
- [ ] Test accepted result: photo, class, confidence, and Details appear. Confidence uses at most one decimal, such as `95.1%`, and no redundant `.0`, such as `95%`.
- [ ] Test uncertain result if available: photo, uncertain label, and confidence appear. The badge rounds down (`69.8%` remains below `70%`). If the optional fresh-result probability table is present, its formatted rows do not change the Uncertain label or raw rejection decision; margin and entropy are not shown. Reopening saved History does not restore those unsaved table rows.
- [ ] New scan retains its raw score through History/reload and displays the same formatted confidence. Check exact stored values separately if needed; display alone cannot prove storage precision.
- [ ] Previously saved reports retain their stored precision and diagnosis. Reopening an exact-photo/current-model duplicate reuses that record; missing historical decimal places are not reconstructed. An old Uncertain report whose original below-threshold score was saved as `0.70` may still show `70%`; this does not establish a new inference with a passing raw score.
- [ ] Recent Scans displays latest record and image.
- [ ] History search, filter, pagination, Details, and delete work.
- [ ] Portrait layout works.
- [ ] Landscape layout works.
- [ ] Camera Close and Capture remain reachable around Android safe areas, APK controls, and the development browser's viewport where applicable.
- [ ] Instructions, preview, and controls stay together without tall flex-distributed gaps. On short/landscape screens, scroll to reach Close and Capture; the preview keeps its 280px minimum instead of shrinking. Record any horizontal clipping or scrolling on very narrow viewports.
- [ ] English/Bisaya framing, permission/error, paused, Capture, and retry text display correctly.
- [ ] With available assistive technology or keyboard, dialog title/status can be read, focus stays inside camera, and Escape closes it. Record unavailable access as blocked.
- [ ] Long disease badge stays inside image.
- [ ] Details close control remains reachable.
- [ ] R04-M01 result: Pass / Fail / Blocked — reason and evidence location:

## R04-M02: device and browser coverage

Complete one row for every physical environment tested. Do not claim untested combinations.

| Device | OS / version | Browser / version | APK or dev tab | R01 | R02 | R03 | R04 | Evidence location | Notes |
| ------ | ------------ | ----------------- | -------------- | --- | --- | --- | --- | ----------------- | ----- |
|        |              |                   |                |     |     |     |     |                   |       |
|        |              |                   |                |     |     |     |     |                   |       |
|        |              |                   |                |     |     |     |     |                   |       |

## R04-M03: installation guide and installed launch

Record actual Android APK installation outcomes for the exact candidate. A phone user-agent, browser shortcut or controlled install event is not APK installation evidence. Keep the original section bookmark for earlier records.

- [ ] Open the website installation action in English and Bisaya at phone and desktop widths; only Android APK instructions are offered.
- [ ] With updated Release host 0.1.4/code 5 and its associated HTTPS website, supporting Android Chrome confirms the package and shows Open app. A direct tap opens the existing Activity without another download; another APK remains an explicit reinstall/update choice.
- [ ] With no APK, an older APK, unsupported API/browser or unassociated origin, Open or install and the download guide remain usable. An empty/failed check never claims the app is absent. Check visible-page return refresh, fixed package/fallback and Debug/production separation.
- [ ] Record Android version, System WebView version, APK hash, application ID, native host version and selected cloud environment. Distinguish debug from production artifacts.
- [ ] Install the prepared APK on Android through the system installer. Record any source permission, cancellation, failure or success without treating a browser shortcut as an APK install.
- [ ] If a public APK is not available, record that distribution step as pending/blocked; a local debug artifact does not establish public production distribution.
- [ ] Confirm the website never launches a browser PWA install prompt or claims that an APK is installed from standalone display mode.
- [ ] On a wide display, Android instructions and the QR are visible. Scan with an Android phone; the public `?install=1` link opens the guide without starting an installer automatically.
- [ ] Close, Escape where available, and Back to website dismiss the guide; background controls and scrolling work afterward.
- [ ] In portrait and landscape, Close remains reachable around Android browser controls and safe areas.
- [ ] Launch the installed APK and verify app/model labels and native host version. Check local reports, offline launch and deliberate browser-export migration separately.
- [ ] R04-M03 result: Pass / Fail / Blocked — reason and evidence location:

## Android audit follow-up

- [ ] Compare the installed APK version in the footer with Android app/package information on Debug and Release. Check EN/BIS, narrow screens, offline reopening and an OTA whose web version differs from the installed native version. Android About must retain the separate web-bundle version. Browser footers must show app/model only; a website download version describes the labeled published asset, not this phone's installation.

- [ ] Record exact APK, signer, native/bundle/model identities and System WebView version. Install the matching-signer update with data retained.
- [ ] Before an OTA health acknowledgment, reproduce a renderer-only failure while the host survives. Reopen and verify the previous trusted bundle is selected. Healthy bundles and ordinary Activity recreation must not roll back or activate pending updates.
- [ ] While explicit restart is verifying, background the app or open a picker/camera flow. Verify activation waits until safe and the UI stays responsive. Retry only the exact still-pending candidate.
- [ ] Cancel an OTA download and immediately check/restart again. Verify another task cannot begin until the old worker's staging cleanup exits.
- [ ] With a missing private photo, verify other History reports remain visible, affected metadata remains readable and backup does not upload a fabricated/remote fallback photo. Delete during a held History refresh and verify the deleted item does not reappear.
- [ ] On testing only, delete while first anonymous enrollment or recovery verification is settling. Verify no deleted report is uploaded or old-scope job stranded. Try wrong recovery input and Clear; verify the existing owner remains connected. Check foreground resume after interrupted batches.
- [ ] Audit follow-up result: Pass / Fail / Blocked — reason and evidence location:

## Final decision

- [ ] All required cases have a recorded result.
- [ ] All failures and blocks have issue links or written reasons.
- [ ] Automated reports, physical evidence, commit ID, deployment URL, and versions match same release build.
- [ ] Final decision: Release may proceed to publication / Release blocked from publication — reason and evidence location:

See [TESTING.md](TESTING.md) for automated scope and limitations. See [PWA versioning](../versions/PWA_VERSIONING.md#candidate-testing-and-promotion) for promotion and tagging order.

## Protocol history

These notes record checklist changes, oldest first. They do not supply completed physical-test results.

### October 9, 2026

- **Guided-camera session protocol**
  - Mix actual guided-camera capture and gallery uploads. Synthetic-camera automation does not satisfy these observations. The protocol was aligned with the new camera; no full or shortened R03 session was run for that update. Record results only after this physical session occurs.

### October 15, 2026

- **Local-only storage protocol**
  - Reports/photos stay in this browser's IndexedDB; Supabase updates public treatment guidance only. Use the actual tested build identity below. Completed evidence from older builds retains its original cloud scope; the fictional sample describes the current local-only workflow.

### October 16, 2026

- **V4.5.0 and local-only session alignment**
  - Record the tested app/model versions, model hashes, and actual WebGL precision when available in DevTools. Current repository source uses V4.5.0 and confidence-only rejection at 0.70. Reports and photo Blobs stay local; reconnection refreshes public guidelines and must not upload private scan/photo data. This checklist remains blank until physical observations are recorded.

### October 19, 2026

- **v0.8.0 square-camera protocol**
  - Added bounded 280–360 CSS-pixel square preview, visible rounded bracket, capture/preview crop alignment, rotation, and short-screen scrolling checks. The earlier full-frame capture expectation is replaced for this candidate; the October 8 historical results remain in [TESTING.md](TESTING.md#guided-live-camera-october-8-2026). Physical-device testing is planned; screenshots and synthetic-stream browser checks do not pre-fill these results. Record the final V4.5 release build identity and actual observations before approval.

### October 22, 2026

- **Installed-app website guidance**
  - Added positive-only related-app detection, user-tapped fixed-package launch, explicit repeat-download choice and unknown/unsupported fallback checks. Test the updated Release APK against its matching HTTPS website; controlled responses do not complete these physical observations.

### October 23, 2026

- **Installed/downloadable version labels**
  - Added installed-host versus web-bundle versus available-download comparisons. These remain manual observations; browser/native-port mocks do not prove installed package information or publication.

- **Native/cloud audit protocol**
  - Added renderer-only rollback, restart verification interruption, canceled-worker cleanup, missing-photo History and enrollment/recovery deletion races. These remain blank physical observations until completed on the exact candidate; compiled instrumentation and mocked fixtures do not fill them.

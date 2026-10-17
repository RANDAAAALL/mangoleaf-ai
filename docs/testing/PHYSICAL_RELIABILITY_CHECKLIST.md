# MangoLeaf AI physical reliability checklist

Use one completed copy for each release build, device, operating system, browser, and test date. This sheet records physical-device reliability evidence. It does not measure model accuracy or replace expert-reviewed evaluation data. The current candidate is app `0.7.0`, model `v4.5.0`, confidence-only threshold 0.70. Fill results only after observing the exact recorded release build; do not transfer a previous build's observations to this candidate.

**Storage protocol introduced October 15:** Reports/photos stay in this browser's IndexedDB; Supabase updates public treatment guidance only. Use the actual tested build identity below. Earlier completed examples retain their historical cloud scope.

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
- [ ] Mode: installed PWA / browser tab:
- [ ] Diagnostics enabled before this session: Yes / No; memory-only warning: Yes / No:
- [ ] Actual inference backend / texture precision, if available in diagnostics:
- [ ] Network used before offline checks:
- [ ] Test account or device identity:
- [ ] Photo IDs and SHA-256 hashes:
- [ ] Screenshot, video, notes, and issue-link location:

## Before testing

- [ ] Tested deployment is exact commit recorded above.
- [ ] Deployment uses HTTPS. Do not use a LAN `http://` URL for service-worker testing.
- [ ] Footer shows recorded application and model versions.
- [ ] Device has enough storage and battery for 30-minute session.
- [ ] Use a designated test browser profile or device. Do not mix research evidence with personal scan history.
- [ ] Run core automated checks for same release build: `bun run test:e2e`.
- [ ] Run R01 and R03 automated checks for same release build: `bun run test:reliability`.
- [ ] Record automated report location:

The `0.7.0` preparation does not itself complete any physical observation below. The existing instruction to run R01/R03 describes release evidence to collect when authorized; **no full or shortened R03 session was run for this preparation**. Record a later session's own dates, commit, deployment, and observations.

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
- [ ] Phone model, exact OS/browser version, PWA or tab, network, and background/lock-screen activity:
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
- [ ] Fully close then reopen installed PWA or browser tab.
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

**October 9, 2026 protocol update:** Mix actual guided-camera capture and gallery uploads. Synthetic-camera automation does not satisfy these observations. The protocol was aligned with the new camera; no full or shortened R03 session was run for that update. Record results only after this physical session occurs.

**October 16, 2026 alignment:** Record the tested app/model versions, model hashes, and actual WebGL precision when available in DevTools. Current repository source uses V4.5.0 and confidence-only rejection at 0.70. Reports and photo Blobs stay local; reconnection refreshes public guidelines and must not upload private scan/photo data. This checklist remains blank until physical observations are recorded.

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

Take Photo now opens a live browser camera below 768px; it does not launch the old native-camera picker. Complete these checks on both the recorded iOS and Android environments, including browser-tab and installed-PWA modes where required. Desktop browser emulation and synthetic camera streams do not satisfy physical observations.

### Camera and picker

- [ ] Use HTTPS; below 768px, tap Take Photo and grant browser permission. Live preview appears and Capture becomes available only after a frame is ready.
- [ ] Record camera/lens selected and delivered frame dimensions; the rear-camera preference does not guarantee a specific lens or 1280×720 output.
- [ ] Verify the centered guide stays inside the displayed image in portrait and landscape; letterboxing does not place the guide outside the image.
- [ ] Capture includes the full camera frame, including areas outside the guide; the guide itself is not burned into the photo.
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
- [ ] After initial caching, repeat camera capture and diagnosis in airplane mode; local result and photo remain available. Cloud synchronization is checked separately in R02-M02.

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
- [ ] Camera Close and Capture remain reachable around iOS/Android safe areas, browser controls, and the installed PWA's viewport.
- [ ] English/Bisaya framing, permission/error, paused, Capture, and retry text display correctly.
- [ ] With available assistive technology or keyboard, dialog title/status can be read, focus stays inside camera, and Escape closes it. Record unavailable access as blocked.
- [ ] Long disease badge stays inside image.
- [ ] Details close control remains reachable.
- [ ] R04-M01 result: Pass / Fail / Blocked — reason and evidence location:

## R04-M02: device and browser coverage

Complete one row for every physical environment tested. Do not claim untested combinations.

| Device | OS / version | Browser / version | PWA or tab | R01 | R02 | R03 | R04 | Evidence location | Notes |
| ------ | ------------ | ----------------- | ---------- | --- | --- | --- | --- | ----------------- | ----- |
|        |              |                   |            |     |     |     |     |                   |       |
|        |              |                   |            |     |     |     |     |                   |       |
|        |              |                   |            |     |     |     |     |                   |       |

## R04-M03: installation guide and installed launch

Record actual installation outcomes for the same release build and browser. An emulated phone user-agent or controlled `appinstalled` event is not physical installation evidence.

- [ ] Below 768px, open Install in English and Bisaya; the detected platform's instructions are appropriate for the recorded browser/device.
- [ ] On iOS Safari, follow Share, Add to Home Screen, and Add; record actual menu wording and whether launch opens in installed-PWA mode.
- [ ] On Android, use the offered native install action or documented browser-menu fallback; record the browser's available controls and installation outcome.
- [ ] If native installation is unavailable, browser-menu instructions and Continue in Browser remain usable; record the limitation without claiming an installation pass.
- [ ] Where a native install prompt is available, dismiss it and verify the app does not immediately repeat it. A further prompt requires a newly offered browser event.
- [ ] On a wide display, both Android/iOS instructions and the QR are visible; scan the QR with a physical phone and record that the public `?install=1` page opens its guide without an automatic native prompt.
- [ ] Close, Escape where available, and Continue in Browser dismiss the guide; background controls and scrolling work afterward.
- [ ] In portrait, landscape, and installed-PWA mode, Close remains reachable around browser controls and safe areas; guide contents can scroll without losing that control.
- [ ] Launch the installed app, verify the footer's app/model versions, and record whether installed status is recognized in that launch context.
- [ ] R04-M03 result: Pass / Fail / Blocked — reason and evidence location:

## Final decision

- [ ] All required cases have a recorded result.
- [ ] All failures and blocks have issue links or written reasons.
- [ ] Automated reports, physical evidence, commit ID, deployment URL, and versions match same release build.
- [ ] Final decision: Release may proceed to publication / Release blocked from publication — reason and evidence location:

See [TESTING.md](TESTING.md) for automated scope and limitations. See [PWA versioning](../versions/PWA_VERSIONING.md#candidate-testing-and-promotion) for promotion and tagging order.

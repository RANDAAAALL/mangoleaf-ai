# MangoLeaf AI physical reliability checklist

**Blank recording sheet. Fill a copy after testing; no observations are prefilled.** See the [fictional sample](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md) and separate [functional checklist](FUNCTIONAL_CHECKLIST.md).

## Purpose and current scope

Record how the APK behaves during repeated use, offline use and interruptions. This researcher-prepared form supports the study's selected reliability assessment. SUS, model accuracy and agricultural expert judgments use separate records; this form is not an ISO certification or release approval.

Published reference observed on **November 7, 2026**: web **0.13.1**, APK **0.1.10/code 11** (Debug **0.1.10-dev**), unchanged model **V5.1.0**. See the [dated artifact and QA record](TESTING.md#november-7-2026-published-production-fresh-qa). Earlier candidate and Production observations retain their own evidence. Record actual installed/active identities below; these reference labels do not complete a new phone test.

Use the exact Production APK for the main research record and a separate testing-target copy for controlled backup/storage exercises. Production/development websites have no scanner, History or private backup; their installation/boundary checks are separate. A browser R03 report is supporting automated evidence, not a physical APK session.

## How to complete this record

1. Copy this blank sheet into an approved evidence folder, such as ignored `.tools/manual-testing/<date>/<build>/<device>/`. Preserve existing personal History/credentials; keep real photos, identifiers and recovery codes out of Git.
2. Record the build/device and required cases before testing. List justified exclusions and missing fixtures. Testing-target or simulated results do not become Production-backend or physical-phone passes.
3. Perform the required actions, write actual observations and link the evidence. Use Pass only when all required actions meet expectations, Fail for observed incorrect behavior, or Blocked for missing required actions/evidence. If failure and blockage coexist, record Fail and explain both.
4. Preserve the first failure and each later retest. Editing the form, opening a saved duplicate or completing a browser test does not complete these physical trials.

<a id="candidate-and-tester-record"></a>
<a id="release-and-tester-record"></a>

## Build and tester record

Fill once per exact build/device/session. Put full hashes, signer, source/input identity and technical version fields in the linked artifact receipt instead of repeating them in every row.

- Tester and date/time/time zone:
- Phone / Android / System WebView version:
- Installed APK filename, version and code:
- Active web-bundle version shown in About:
- Active model version:
- Exact APK/active-bundle/model receipt and evidence folder:
- Test target: Production APK / testing APK; cloud target:
- Language/text size, network, starting backup state and own-code availability without writing the code:
- Approved test-photo aliases/hashes:

APK footer identifies installed native host/model; About identifies the independent web bundle. Use another copy when the artifact, active bundle/model, device or test date changes.

## Before testing

- [ ] Recorded APK/active bundle/model match the actual test artifact and device.
- [ ] Dedicated test reports/photos and sufficient battery/storage are available; personal data is preserved.
- [ ] Required cases/exclusions and safe testing fixtures are declared below.

Required cases for this session:

Cases outside this session's scope, with reason/follow-up; existing issues or fixture limitations (write None if there are none):

## Actual results

All required actions in a row need observations, either here or in its linked continuation. Required untested cases are Blocked, never automatic passes. Predeclared exclusions stay separate from pass counts. `ST01`, `BK01` and `UI01` are additional manual case IDs, not automated test names or manuscript-objective numbers; existing R01–R04 IDs keep their meanings.

| Case / test                          | What to do / expected result                                                                                                                                                                                                                                                                        | Actual result | Pass / Fail / Blocked | Evidence / issue |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------- | ---------------- |
| R01-M01 — Repeated predictions       | Complete 30 fresh inferences per planned unchanged gallery photo. Avoid saved-duplicate reuse; record each displayed label/acceptance and visible confidence. Labels/acceptance stay stable; record score variation.                                                                                |               |                       |                  |
| R02-M01 — Offline use                | Initialize the packaged APK, save Photo A, enable airplane mode with Wi-Fi off and reopen. History/photo remain; a different previously unscanned Photo B receives a result, saves locally and survives another offline reopen.                                                                     |               |                       |                  |
| R02-M02 — Reconnection               | Restore connectivity. Local reports/photos stay intact without duplicates or resurrected deleted reports; public guidance refreshes. Private upload/deletion expectations follow the declared own-code/Pause state below.                                                                           |               |                       |                  |
| R03-M01 — 30-minute session          | Use the physical APK for at least 30 minutes with fresh camera/gallery scans, Details/History/Settings, background/reopen and network changes. No crash, lost committed report, permanent freeze or stuck scan. Record heat/battery/slowdown observations.                                          |               |                       |                  |
| R04-M01 — Camera and interruption    | Exercise permission grant/denial, pending-permission cancellation, capture/Retake, Close and actual backgrounding. Camera/encoding stop after cancellation/backgrounding; no late preview appears. Square crop, requested phone portrait, keyboard/safe areas and bilingual controls remain usable. |               |                       |                  |
| ST01 — Storage-full recovery         | Use a natural or approved testing-only storage-failure fixture. Existing reports/photos remain intact. Retry saves the completed result once without new inference; Discard releases only unsaved work. Record an unavailable fixture as Blocked.                                                   |               |                       |                  |
| BK01 — Interrupted backup/restore    | With controlled testing backups, interrupt transfers by backgrounding or losing connectivity, then reopen/reconnect/retry. Preserve local reports and receiving own code/Pause; retry incomplete work without duplicate restored reports or writing the source backup.                              |               |                       |                  |
| UI01 — Settings during interruptions | Switch Settings subpages/tabs and use Back while status/Copy/export work is settling, then reopen. No stale page/feedback or whole-panel flash; scanner remains usable. Hide/background conceals an available recovery code; no delayed reveal/copy after invalidation.                             |               |                       |                  |

## Required detail records

These short records supply counts, duration and conditions that a single Pass checkbox cannot show. Use an attached continuation where needed.

## R01-M01: repeated prediction consistency

<a id="input-plan"></a>
<a id="each-repetition"></a>

- Planned photo(s), unchanged original bytes/hash and starting model:
- Planned repetitions per photo: **30**.
- Completed fresh inferences per photo:
- Displayed label/acceptance and visible confidence range:
- Full per-run record / evidence location:

For each run, use a designated test report. Delete it and confirm it disappears from History before the next upload of the same original file; otherwise the app may reuse its current-model saved result. Prefer a dedicated no-code test profile, since deleting a cloud-backed report can queue cloud deletion. Do not delete personal reports to force inference.

Record **every** run in a continuation with run number, displayed result/acceptance, visible confidence, duplicate-avoidance action, status and evidence. Two successful runs do not complete thirty. This manual method measures displayed label/acceptance stability; it does not prove the automated raw-confidence tolerance of 0.001. Debug probability rows and Settings diagnostics are not full raw-score evidence.

## R02-M01: offline availability after initial load

<a id="online-preparation"></a>
<a id="airplane-mode-check"></a>

Record Photo A/B aliases, airplane-mode/Wi-Fi state, both offline restarts and new local save. APK/model assets are packaged/verified; no website service-worker cache is required. Check local starter/refreshed guidance offline and use designated testing data for any guideline change; do not edit production treatment text.

### R02-M02: reconnection check

Record the branch actually tested:

- **Before own-code setup:** ordinary startup/scanning/reconnection creates no private enrollment/upload. Support network/ownership claims with scoped testing evidence, not a screenshot alone.
- **Own code and uploads enabled:** eligible reports may upload while foreground/online; local reports remain intact.
- **Uploads paused:** new scans stay local; already queued own-backup deletions may retry online. Existing cloud copies remain unless an explicit scoped deletion completes.

Branch, actual transfer/refresh outcome and evidence:

## R03-M01: 30-minute mixed-use session

- Start/end time and time zone:
- Actual elapsed duration, at least **30 minutes**:
- Fresh inference count or supporting run/action log:
- Heat/battery/slowdown observations and remaining issues:

| Time                | Actual actions / outcome | Crash, freeze, stuck scan or lost committed report? | Evidence |
| ------------------- | ------------------------ | --------------------------------------------------- | -------- |
| Start               |                          |                                                     |          |
| Around 10 minutes   |                          |                                                     |          |
| Around 20 minutes   |                          |                                                     |          |
| At/after 30 minutes |                          |                                                     |          |

Keep a continuation/video covering the intervening activity; four time entries alone do not prove a complete session. Mix real camera and gallery input, Retake, fresh inference, History/Details/Settings, orientation attempts, background/reopen, offline operation and reconnection. Use only designated reports when deleting to avoid duplicate reuse. An unexpected crash or lost committed report is Fail even if a later reopen works. Phone APKs request portrait; record the observed orientation rather than assuming a landscape pass.

<a id="r04-m01-native-camera-gallery-and-layout"></a>

## R04-M01: guided camera, gallery, and layout

<a id="startup-and-settings"></a>
<a id="camera-and-picker"></a>
<a id="result-and-layout"></a>

Record permission handoff separately from real backgrounding: granting permission must retain its originating request; real closure/backgrounding stops the camera/encoder and does not deliver a late preview. Denial leaves usable feedback/gallery selection. Retake/cancel creates no unintended report. Check centered-square preview/capture, short-screen scrolling, portrait request, English/Bisaya, text size and reachable controls.

Also record cold/offline splash handoff without a smaller duplicate leaf/white gap, first-result Details/Settings entry without a whole-app splash, and repeated real capture timing. Distinguish OEM launcher/archive masking from an app defect. A synthetic camera or browser emulation does not complete phone observations. Production/reopened History omits Debug probability rows; prediction correctness remains separate from these UI checks.

## Local storage-full recovery

`ST01`: record natural versus injected failure, free-space/context, preserved History, retry/discard and whether the result was already committed. Do not fill a personal phone, clear application storage or uninstall to manufacture a failure. Required unavailable injection/access is Blocked. Caller timeout does not prove that an underlying operation stopped; verify settlement before claiming completion.

## Diagnostics and stall evidence

<a id="diagnostics-and-stall-evidence-v070"></a>

Settings > Diagnostic logs is opt-in. Enable it before reproduction; disable retains entries, Clear preserves reports, and export failure must not interrupt scanning/deletion. Logs contain bounded technical fields, not photos, diagnosis scores, credentials, report identities, raw messages or URLs. Save prediction evidence separately when approved. Storage failure/crash can lose recent logs; missing completion does not prove an exact cause.

### Record each reproduced stall

```text
Case / incident time and elapsed time:
APK/active bundle/model, phone/WebView, network and background state:
Steps and expected behavior:
Actual visible stage, disabled/enabled controls and observed failure:
Cancel/Close/retry/reopen attempted and result:
History/photo state after recovery; pending or committed work:
Pass / Fail / Blocked, evidence and retest reference:
```

Do not clear app storage/uninstall to recover personal data. Reopening is a recovery attempt, not a guaranteed fix. Use [existing phone-log guidance](TESTING.md#phone-log-collection-and-interpretation) for safe interpretation.

## Supporting coverage and separate release checks

Link exact-scope evidence once. Keep these requirements visible; the simpler front table does not mark them passed or remove release gates.

| Supporting area                                                                                                          | Evidence / target / remaining gap |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Automated core/R01/R03 input-matching reports; raw-score/tensor checks separate from phone observations                  |                                   |
| Native bridge/SQLite/private-photo preservation and missing-file/race/failure checks                                     |                                   |
| No-code/own-code/Pause, temporary source restore, fresh receiver setup, interrupted transfers and scoped queued deletion |                                   |
| Settings late reads/copy/export, diagnostic failure/privacy and real keyboard/background observations                    |                                   |
| Website boundary, actual APK installation, native updater and signed web-OTA/rollback scope below                        |                                   |

## R04-M02: device and browser coverage

Use a completed copy for each exact APK/device/Android/System WebView/test date. Record separate website/browser observations and linked result copies here. A single device or emulation does not establish all-device coverage.

Tested environments / result copies / remaining coverage:

## R04-M03: installation guide and installed launch

Keep actual Android installation, retained-data launch and website guidance separate from scanner tests. Record verified APK/receipt/signer, installed native versus About web-bundle/model identities, actual Android installer outcome and same-signer data preservation. Website Home/About/language/Android guide, QR, validated download metadata and positive-only installed-app hints need their own observations. No browser PWA installation or manual report import/export is part of the current product.

## Separate-backup restore and APK notice candidate

`BK01` and release follow-up use [current Android cases](ANDROID_TESTING.md#qa-remediation-candidate-november-6-2026), [backup rules](../security/SECURITY-AND-SYNC.md) and [native verification](../versions/ANDROID_APK_VERSIONING.md#verification-and-remaining-evidence). All cloud-changing exercises use controlled testing fixtures, never copied production data. Restore must preserve receiving ownership/code/Pause and never upload/delete through the temporary source. Wrong credentials preserve settings; transport errors must not be mislabeled as wrong codes. Queued own deletions can retry while uploads are paused; this is not distributed deletion of other devices.

Production APK updater observations remain separate: popup and Settings > App updates share the verified internal transfer, cancellation and Android approval flow; Debug/websites omit Production offers. Validate fixed repository, newer package/code, complete bytes and signer; expected permission/installer handoff is not ordinary background cancellation. Preserve data after cancellation/failure and do not claim success from download or approval. Record missing required Production evidence as Blocked, not a Debug-derived pass.

<a id="recovery-code-first-backup-candidate"></a>

## Earlier v0.11.0 recovery-code-first checks

Original preparation instructions remain in [Protocol history](#protocol-history). They do not establish a pass for this build. Use the current receiving-code/Pause rules above.

## Android audit follow-up

Record compatible signed web-OTA activation/rollback, restart interruption, ordinary Activity recreation, canceled-worker cleanup, missing-photo History and deletion during status/ownership work under the native verification plan. Keep SQLite/photos/credentials intact. Web-OTA and APK installation are distinct; simplification does not remove their release requirements or authorize live cloud changes.

## Retest record

| Date | Case / original issue | Changed build/inputs, if any | New observation / status | Evidence |
| ---- | --------------------- | ---------------------------- | ------------------------ | -------- |
|      |                       |                              |                          |          |

## Final decision

- Required cases / Passed / Failed / Blocked:
- Excluded cases, technical/release evidence and remaining device coverage:
- Issues needing correction and retest references:
- Conclusion for this exact build/device/target and tested conditions:
- Separate functional / model/expert / SUS records, if applicable:
- Release decision under the separately approved gates; unresolved required failures/blocks:

Do not convert these results into model accuracy, all-device/field reliability or an ISO certification. Physical and automated records remain distinct. No release is approved by editing this template.

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

### October 25, 2026

- Added recovery-code-first candidate observations for pre-setup local-only saves, explicit setup, preserved identity/pauses, interrupted uploads and existing-code restore. These are blank acceptance checks, not completed device evidence.

### November 6, 2026

- The source reference at preparation was unpublished web **0.13.1 / APK 0.1.10/code 11**, with Debug **0.1.10-dev** and model **V5.1.0**. The later published observation in the current instructions does not relabel those earlier candidate tests.
- Refreshed current instructions for APK-only scanning, native versus active web-bundle identity, Settings diagnostics/Production updates, Android permissions/portrait behavior and own-code/Pause-aware backup expectations. Added links to the functional sheet and current fictional sample. Original dated notes above remain unchanged. This is a protocol/documentation change; no phone test, cloud operation, model evaluation or release approval occurred.
- Earlier v0.7.0 preparation did not include a full or shortened R03 run. Later browser R03 records keep their own input hashes/limits; they do not complete this physical record.

<details>
<summary>Previous checklist instructions, archived November 6, 2026 — historical scope only</summary>

The following is the original pre-refresh recording sheet before its Protocol history section. Old versions, About tools, browser scanning/cache steps and no-upload expectations describe that earlier protocol; do not execute them as current instructions. Retained preparation limitations are not rewritten as new results.

```text
# MangoLeaf AI physical reliability checklist

**November 2 startup/backup follow-up:** record the new 0.1.9/code 10 installer hash and selected model (the authorized local Debug comparison may use V5.1.0-candidate). Check cold/offline launch without a smaller duplicate leaf or white gap, then Settings/backup entry without a setup flash. Verify Bisaya button layout, Copy without whole-panel dimming and empty recovery input showing an inline reminder without a restore. Paste a valid code for every restore, including this phone's own backup. See [current Android cases](ANDROID_TESTING.md#startup-and-backup-follow-up-november-2-2026). Earlier device observations do not establish this build.

**October 26 History follow-up:** on the freshly rebuilt APK, open Home and multiple History pages with existing reports, search/filter, view Details, and delete a chosen local report. Repeat photo/details navigation after an airplane-mode restart. Confirm History metadata remains readable when a local photo is unavailable, without requesting historical cloud URLs. Record the exact new APK/bundle hashes; the controlled 500-row test is not physical timing or whole-process memory evidence. Keep existing reports and credentials; do not clear app data for this check.

**Current candidate:** app 0.13.0 / APK 0.1.9/code 10, bounds 10-10, model V5.1.0, bridge/schema 1/1; unpublished. Published v0.12.0 and earlier candidates have separate evidence. Repeat real capture several times on both reported phones and keep encode-stage diagnostics. Confirm preview arrives without a prolonged Capturing photo state; closing/backgrounding must stop encoding and never deliver a late preview. Open the first completed result after a cold start and confirm no whole-app loading flash. Keep model accuracy separate from UI/timing checks.

Install over the existing same-signer app, preserve History/photos/credentials, and test offline restart. Inspect a freshly downloaded, distinctly named APK in Samsung My Files as well as the launcher and system splash. Application/archive and launcher icons share the white-backed adaptive leaf; the startup leaf remains transparent. The earlier bare Package Installer leaf was an application-resource regression. The maintainer still sees a framed My Files thumbnail on One UI 8.5; OEM styling is plausible but the exact phone loader is uninspected. Confirm the new installer white backing separately, and do not treat My Files border removal as passed. Production and development phone websites must show only the current EN or BIS code; desktop/APK controls retain their existing behavior.

**Current runtime scope:** scanning, History, Diagnostics, recovery and backup belong in the APK. Production/development websites at every size provide Home/About/Android installation only; verify desktop QR arrival and phone download guidance without clearing legacy browser storage.

Check the first About visit after a cold APK launch for a repeated full-screen splash. Phone websites must center the brand above Home/About/open-install/language bottom controls, without Scan or History; verify English/Bisaya and desktop QR navigation separately.

Use one completed copy for each release build, device, operating system, browser, and test date. This sheet records physical-device reliability evidence. It does not measure model accuracy or replace expert-reviewed evaluation data. The current candidate is shared app `0.13.0`, native APK `0.1.9`, model `v5.1.0`, confidence-only threshold 0.70. Fill results only after observing the exact recorded release build; do not transfer a previous build's observations to this candidate.

Historical browser compatibility reports/photos remain preserved in IndexedDB; the current website does not open that database. The Android APK uses SQLite/private photos and keeps scans local until recovery-code setup; enabled private cloud backup then runs while foreground and online. Record the target, APK/bundle hashes, native host/bridge/schema versions, and backup pause state and recovery-code availability when testing Android; do not apply the browser-only network expectation to an enabled native backup. Use the exact tested build identity below; dated changes are in [Protocol history](#protocol-history). See [Android verification](../versions/ANDROID_APK_VERSIONING.md#verification-and-remaining-evidence) for additional native cases.

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

## Separate-backup restore and APK notice candidate

- [ ] For a Production updater-capable host, verify both popup and About start the same internal transfer without opening a browser. Record measured byte progress and expected APK/package/version/signer; Debug must refuse Production installation.
- [ ] During downloading/verifying, use X/Escape, lose connectivity, time out, background or kill the app. Confirm no delayed install, no temporary/session residue outside the scoped updater area and unchanged installed version/History/photos/code/Pause settings.
- [ ] Verify first-time Allow from this source, permission denial, Android Update approval and Android Cancel/Back. Expected system UI must not cancel its own handoff. Returning from Cancel must not immediately show another notice; About allows retry.
- [ ] Successful same-signer replacement may close the process. Open through Android or the launcher; verify new installed host/version, normal splash and preserved data. No app-controlled Update Complete/Re-Open popup or silent install is expected. Recheck ordinary Activity recreation and the independent signed web-OTA flow.

- [ ] On testing, use distinct codes A and B with two and five completed scans. Restore A on phone B: History becomes seven, status says Restored 2 scans, saved B and its Pause choice remain. B reaches seven cloud copies only after its uploads complete. A stays at two.
- [ ] Delete one copied scan on B while uploads are paused. Confirm its B cloud copy is removed when online; A’s cloud/local copy remains. Repeat restore and verify deletion intent prevents resurrection.
- [ ] On a fresh receiving phone, restore A and verify its different own code is displayed and saved. Future scans use the receiving backup. Wrong A or failed own-code setup must preserve local History and must not enable unsafe uploads.
- [ ] Interrupt a photo restore by backgrounding, then retry. Previously committed scans remain; duplicates count zero; a newly inserted scan counts one. Record partial failures honestly.
- [ ] On a production-target controlled build, verify New Android APK vX.Y.Z Update, shared native Update Now from popup/About, Update Later, upper-right close and Escape. Notices wait during camera/save/restore/backup, stay dismissed for this foreground visit and return on a later online/idle opening while the APK remains older. About keeps a disabled action/reminder offline. Verify internal byte progress, pre-install cancellation, verified Android confirmation and explicit approval; no browser or custom completion/reopen modal. Debug must not offer or install production APKs.
- [ ] Install the new same-signer candidate over the existing APK without clearing data. Verify installed 0.1.8 (Debug 0.1.8-dev), web 0.12.0, V4.5.0, preserved History/photos/code/Pause/deletion jobs and offline restart.

<a id="recovery-code-first-backup-candidate"></a>

## Earlier v0.11.0 recovery-code-first checks

These older workflow checks retain their preparation scope. Use the separate-backup candidate cases above for v0.12.0 Restore ownership; do not expect a foreign source code to replace the receiving code.

Run synthetic cloud cases on testing; record production artifact configuration/preservation separately. Do not infer a completed backup from an enabled label.

- [ ] On a fresh Debug APK, create scans online/offline before setup. Verify local History/photos survive restart, no private identity/upload starts, and public guidelines can still refresh. No Pause/Resume control appears before a valid code.
- [ ] Tap Create recovery code and enable backup online. Verify the code is displayed with an outside-phone reminder, no extra confirmation is required and eligible saved History begins uploading. Repeat successful creation on an older no-code installation with uploads paused; this explicit enable action must start backup. Creation failure leaves uploads off and local reports safe.
- [ ] Update an existing anonymous-owner installation without clearing data; create a code and verify the same owned backup remains accessible. Existing code users retain enabled state or deliberate pause, including an older paused installation.
- [ ] Close/background during an incomplete batch, then reopen online. Verify completed copies are skipped and incomplete reports retry without duplicate History; note whether the interrupted photo restarts.
- [ ] Pause backup, save another scan and reopen. Verify the scan stays local until Resume. Pending confirmed deletions still retry while open/online even with uploads paused.
- [ ] Enter the valid existing code on another testing APK; completed reports/photos merge with existing History. Verify wrong codes/Clear preserve the session, and deliberately deleted local IDs are not restored. Preserve an existing pause during reconnection.
- [ ] Recovery-code-first result: Pass / Fail / Blocked - exact build, target, reason and evidence location:

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
```

</details>

- Later the same day, simplified the current physical recording front to eight manual rows, retained the 30-fresh-inference and 30-minute requirements with continuation records, and linked specialist/install/update coverage separately. Earlier R01–R04 meanings and bookmarks remain. No test result, app/model/version, hosted resource or release approval changed.

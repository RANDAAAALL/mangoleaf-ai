# Physical reliability checklist answer example

> **FICTIONAL EXAMPLE ONLY - NOT TEST EVIDENCE.** All testers, devices, times, outcomes, versions and paths below are invented. No actual thirty-run or thirty-minute session was performed for this example. Use the [blank checklist](PHYSICAL_RELIABILITY_CHECKLIST.md) for real work.

## Fictional build and tester record

- Tester: Example Tester; review: Example Reviewer, Example Day 2.
- Phone / Android / System WebView: Example Phone / EXAMPLE / EXAMPLE.
- APK / active bundle / model: EXAMPLE / EXAMPLE / EXAMPLE; artifact receipt: `evidence/fictional/receipt.json`.
- Input aliases: Mango A and Unsupported B; exact unchanged originals in invented fixture manifest.
- Starting conditions: Wi-Fi on, no own recovery code, designated local-only disposable reports.
- Evidence: `evidence/fictional/` - nonexistent. Original filenames and offsets below are illustrative.
- All RC01-RC04 required; phone/desktop website observations recorded separately. No thermal assessment.

## Fictional actual-results examples

| Case | Actual observation                                                                                                                                                                                                                                                                  | Result                 | Evidence / basis                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| RC01 | Tester reported 30 fresh predictions for each of two unchanged originals, with approved local report cleanup between runs. Mango A remained Healthy Leaf/Accepted at displayed 94.2%; Unsupported B remained Uncertain at displayed 52.3%. The reviewer sampled selected runs only. | Pass (tester reported) | `RC01.mp4`; fictional tester's full-run continuation and declaration; no claim that sampled review counted all 60 |
| RC02 | Saved Photo A online, then enabled airplane mode with Wi-Fi off. After offline reopening, its photo/Details opened. A different unscanned Photo B was diagnosed/saved offline; both remained after a second offline reopening.                                                      | Pass                   | `RC02.mp4`, 00:00-01:40; fictional direct tester/video record                                                     |
| RC03 | A separate clip continued RC02. After reconnection, both local reports remained without duplicates, and local guidance was readable. No-code branch stayed Not set up; invented scoped testing request notes showed no private enrollment/upload.                                   | Pass                   | `RC03.mp4`, 00:00-00:50; no enabled-backup or completed-upload claim                                              |
| RC04 | Invented physical session ran 09:00-09:31, 31 minutes, with varied camera/Gallery scans, History/Settings, background/return, offline use and reconnection. Tester reported no crash, stuck processing or lost committed report throughout; reviewer sampled checkpoints.           | Pass (tester reported) | `RC04.mp4`, 00:00-31:00; fictional tester action log; continuous independent video review not claimed             |

These invented confidence values describe displayed stability, not classification accuracy or automated R01 raw-score tolerance. No full raw scores or tensor measurements are supplied.

## Fictional RC01 continuation format

| Photo / run          | Label / acceptance      | Visible confidence | Fresh processing / cleanup                                           | Video offset / basis                   |
| -------------------- | ----------------------- | ------------------ | -------------------------------------------------------------------- | -------------------------------------- |
| Mango A / 1          | Healthy Leaf / Accepted | 94.2%              | Processing observed; only designated local test report removed       | 00:20; fictional tester/video          |
| Mango A / 2-30       | Healthy Leaf / Accepted | 94.2%              | Each remaining run is described in the invented per-run continuation | `fictional-rc01-runs.csv`; nonexistent |
| Unsupported B / 1    | Uncertain               | 52.3%              | Fresh processing; no duplicate dialog                                | 08:00; fictional tester/video          |
| Unsupported B / 2-30 | Uncertain               | 52.3%              | Each remaining run is described in the invented continuation         | `fictional-rc01-runs.csv`; nonexistent |

In a real record, supply every run or accurately attribute the complete-run observation to the tester. These grouped example rows alone do not establish sixty predictions. Do not count a saved duplicate as a prediction or invent per-run measurements.

## Fictional RC04 timing record

Start 09:00; end 09:31; elapsed 31 minutes, Asia/Manila. All entries and the purported action log are invented. Warmth/discomfort: **Not assessed**.

| Checkpoint | Actual actions / outcome                                             | Crash / freeze / lost report          | Video offset / basis |
| ---------- | -------------------------------------------------------------------- | ------------------------------------- | -------------------- |
| 09:00      | Open app; camera capture/Retake; fresh result and Details            | None reported in invented observation | 00:00; tester log    |
| 09:10      | New Gallery predictions, History/filter/pages, Settings              | None reported                         | 10:00; tester log    |
| 09:20      | Phone Home, return, airplane mode with Wi-Fi off, fresh offline scan | None reported                         | 20:00; tester log    |
| 09:31      | Reconnect; inspect saved reports; finish                             | None reported                         | 31:00; tester log    |

Four checkpoints illustrate wording; the tester's statement and full action record describe the intervening period. Sampled video review is identified separately. No real timed session follows from this sample.

## Fictional website observations

| Environment                       | Online preparation              | Offline behavior                                                                  | After reconnecting                          | Result / evidence                                                                             |
| --------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Phone website / Example Browser   | Home/About/Android guide loaded | Previously loaded content stayed readable; download unavailable feedback appeared | Guide and online download metadata returned | Pass for recorded branch; `phone-web-offline.mp4`, fictional                                  |
| Desktop website / Example Browser | Home and About loaded           | Reload showed browser connection error                                            | Website loaded again and navigation worked  | Recorded behavior; offline availability not established; `desktop-web-offline.mp4`, fictional |

Website observations do not demonstrate APK inference, private backup or all-browser coverage. If declared offline requirements are not met, report the actual failure instead of redefining success afterward.

## Fictional retest or clarification

| Date          | Case / original issue                   | Changed inputs              | New observation / status                                          | Evidence / basis                                     |
| ------------- | --------------------------------------- | --------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| Example Day 2 | RC01 / reviewer did not count every run | No new build or run claimed | Tester reported completing required fresh runs and their outcomes | Tester declaration; original sampled review retained |

## Fictional summary and alternate wording

- Four illustrative RC passes, including two tester-reported; no actual tests performed.
- No claim about overheating, full raw-score tolerance, enabled-backup transfer completion or unseen devices.
- Additional native/release checks remain separate; this is not release approval.

Examples for other real outcomes, if actually observed:

- **Fail:** "The app closed unexpectedly at minute 18. Reopening restored History, but the interruption remains recorded as a failure."
- **Blocked:** "Only 12 minutes were completed because the phone became unavailable. No complete RC04 run is established."

Do not reuse these invented incidents or outcomes as real findings.

## November 6, 2026

Updated the fictional example to match the current blank APK checklist, independent version fields, Settings tools and state-dependent private backup. No new phone, browser, model or cloud test occurred. The original earlier sample is retained below for historical comparison.

<a id="previous-fictional-sample"></a>

<details>
<summary>Previous v0.7.0 fictional sample — historical, superseded instructions; never evidence</summary>

Old browser/PWA capture, About tools and version labels below belong to the earlier example. They are preserved verbatim, not current directions or previously measured findings.

````text
# Physical reliability checklist answer example

> **EXAMPLE ONLY. NOT PHYSICAL-TEST EVIDENCE.** Every value below is fictional. Do not submit, copy, or mark this file as completed evidence. Copy [`PHYSICAL_RELIABILITY_CHECKLIST.md`](PHYSICAL_RELIABILITY_CHECKLIST.md) for each real candidate, device, operating system, browser, and test date, then replace every value with an observation from that exact test.

This example follows app `0.7.0`, model `v4.5.0`, local-only History, guided browser capture, and About diagnostics. The version labels do not establish deployment or physical-test results. The example deliberately leaves storage-full recovery and R03 blocked so it cannot be mistaken for release approval.

## How to answer each field

- In a real checklist, leave a field or result `[ ]` until its value is recorded, then use `[x]`. A checked `Fail` or `Blocked` means the result was recorded; it does **not** mean the test passed. Check an observation such as “App opens offline” only when it is true; otherwise explain it in the result line.
- Record the full tested commit ID, the exact HTTPS deployment URL, and versions shown on the device footer. Do not use intended versions or a later commit.
- Write actual device, OS, browser, network, photo hash, report, screenshot, video, and issue locations. A report path must point to evidence that exists.
- Use only `Pass`, `Fail`, or `Blocked` as a test status. `Pass` means all required observations met their expected behavior. `Fail` means observed application behavior was wrong. `Blocked` means a required observation could not be completed; name why and link the issue or note. If both occur, record `Fail` and list the blocked observations too.
- A result label records what the app displayed. It does not claim that diagnosis is biologically correct.
- For R01, delete each test record and confirm it disappears from History before scanning the same bytes again. Reopening a duplicate record is not another prediction.
- Never invent a passing result to complete a table. An observed crash is `Fail`. An unavailable test photo or missing required evidence is `Blocked`. Denying camera permission is itself a planned test: pass that observation if the app handles denial correctly; use `Blocked` if device policy prevents exercising it.
- Record phone observations even while automated checks are pending; record the missing reports as blocked. Release approval still requires the approved automated and physical scope for that exact build.
- Keep photos, diagnosis results, and report identities in separate approved test evidence. About's technical diagnostics log does not contain them.

## Where tester types `Pass`, `Fail`, or `Blocked`

| Test area                   | Type status here                                                                                 | What it means                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Automated prerequisites     | Core, R01, and R03 result fields under Before testing.                                           | Preserve each report; explain checks not performed.                 |
| Diagnostics and stalls      | Diagnostics result and each Incident result.                                                     | Record scope, visible state, timings, and log/evidence location.    |
| R01 repeated scans          | Last column of each repetition row, then `R01 result` summary line.                              | A failed/blocked run makes overall R01 `Fail` or `Blocked`.         |
| R02 offline test            | `R02-M02 result` for reconnection, then `R02 result` for the complete offline/reconnection case. | Verify local History/photos and public advice; no scan upload.      |
| Storage-full recovery       | Storage-full result.                                                                             | Verify retry/discard without losing committed reports.              |
| R03 mixed-use session       | Last column of each 0/10/20/30-minute row, then `R03 result` summary line.                       | A crash, stuck scan, or lost record makes overall R03 `Fail`.       |
| R04 camera/layout/install   | `R04-M01 result` and `R04-M03 result` after their required observations.                         | Record actual guided capture and installation for that environment. |
| R04 device/browser coverage | R01–R04 cells in the coverage table for that physical environment.                               | Copy final status from each completed section.                      |
| Final decision              | `Final decision` line at document end.                                                           | Only write “may proceed” when all required cases pass.              |

Fictional examples of wording to replace with actual observations:

```md
- [x] R01 result: Pass — 30 fresh scans stable. Evidence: Drive/MangoLeaf/R01-<commit>/
- [x] R02 result: Blocked — airplane mode unavailable on test device. Evidence: issue #42
- [x] Final decision: Candidate blocked from release — R02 still blocked. Evidence: issue #42
```

## Where tester gets each value

| Checklist field                   | Get it from                                                                                                                                                                                            | What to record                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Candidate commit ID               | In the candidate repository, run `git rev-parse HEAD`. Confirm Vercel's deployment source shows the same commit.                                                                                       | Full 40-character output. Do not use a newer local commit.                                           |
| Deployment URL tested             | Vercel **Deployments** page; open the candidate deployment and copy its HTTPS staging URL.                                                                                                             | Exact URL opened on phone, not a LAN `http://` address.                                              |
| Application/model version         | Candidate deployment footer on the physical device.                                                                                                                                                    | Actual footer values, such as `v0.7.0` and `v4.5.0`; do not infer deployment from repository labels. |
| Model asset hashes                | On your PC, open PowerShell in MangoLeaf AI project folder at the exact candidate commit. Run the model-hash command below; it reads `public/model` and prints one SHA-256 fingerprint per model file. | Save command output with candidate evidence; do not manually type hashes. It does not change files.  |
| Tester, date, device, OS, browser | Tester and physical device Settings/about screen; browser menu **About** page.                                                                                                                         | Actual person, local time zone, device model, OS/browser versions.                                   |
| PWA/tab and network               | Observe how app was opened; record Wi-Fi/mobile data before airplane mode.                                                                                                                             | `installed PWA` or `browser tab`; do not record Wi-Fi password.                                      |
| Diagnostics/backend/precision     | Enable About > Diagnostics before reproduction; use actual reported backend/precision if available.                                                                                                    | Actual values or unavailable. Forced 16-bit preference does not prove every browser used WebGL.      |
| Local profile / device alias      | Designated test browser profile or device.                                                                                                                                                             | A local alias; no guest sign-in is required.                                                         |
| R01/R02 photo IDs and hashes      | Use unchanged gallery files. Run `Get-FileHash ./path/to/photo.jpg -Algorithm SHA256`; supplied fixtures are listed in the [fixture manifest](../../tools/e2e/fixtures/manifest.json).                 | File name/ID plus SHA-256. Use same gallery bytes for R01; use distinct A/B photos for R02.          |
| Automated reports                 | Run required commands for same candidate, then preserve `playwright-report/` and matching `test-results/` before another run replaces them.                                                            | Saved report/evidence location.                                                                      |
| Screenshots, video, notes, issues | Save device evidence in a candidate-specific folder or approved Drive location.                                                                                                                        | Actual path/link and issue number for every failure/block.                                           |

### Minimal pre-test commands

Open PowerShell in the project at the tested commit. These commands identify local source/model files; compare them with the deployment's source and build evidence:

```powershell
git rev-parse HEAD
git status --short
Get-ChildItem public/model -File | Get-FileHash -Algorithm SHA256 | Format-List Path, Hash
```

Run the following only when the corresponding automated checks are authorized and planned:

```powershell
bun run test:e2e
bun run test:reliability --grep "R01:"
# Full 30-minute session; preserve earlier reliability reports first.
bun run test:reliability --grep "R03:"
```

`git status --short` identifies uncommitted inputs; a commit alone does not identify them. `Format-List` prints complete model hashes without narrowing them to table columns. These instructions do not execute tests. The unfiltered `bun run test:reliability` command includes R01 and the full 30-minute R03 session. Copy generated reports to a dated evidence location before another run replaces them; see [TESTING.md](TESTING.md#install-and-run).

## Fictional abbreviated example

The examples below demonstrate wording and evidence detail only. They do not report MangoLeaf AI results.

### Candidate and tester record

- [x] Candidate commit ID: `0123456789abcdef0123456789abcdef01234567` _(fictional)_
- [x] Deployment URL tested (HTTPS): `https://candidate.example.test` _(fictional)_
- [x] Application version shown in footer: `v0.7.0` (illustrative, not a tested-build claim).
- [x] Model version shown in footer: `v4.5.0` (illustrative, not a tested-build claim).
- [x] Model asset hashes / evidence location: `evidence/example/model-hashes.txt` _(fictional path)_
- [x] Tester: `Example Tester`
- [x] Date and local time zone: `YYYY-MM-DD, Asia/Manila`
- [x] Device model: `Example Phone 1`
- [x] Operating system and version: `ExampleOS 1.0`
- [x] Browser and version: `Example Browser 1.0`
- [x] Mode: `installed PWA`
- [x] Diagnostics enabled before session: `Yes; memory-only warning: No` (fictional).
- [x] Actual backend / precision: `WebGL / 16-bit` (fictional; do not infer this when the event is missing).
- [x] Network used before offline checks: `Wi-Fi: ExampleTestNetwork`
- [x] Local test profile / device alias: `dedicated test profile; no sign-in; no personal scans`
- [x] Photo IDs and SHA-256 hashes: `Photo A: <actual SHA-256>; Photo B: <actual SHA-256>`
- [x] Screenshot, video, notes, and issue-link location: `evidence/example/physical-device/`

### Before testing

- [x] Candidate deployment is exact commit recorded above.
- [x] Deployment uses HTTPS.
- [x] Footer shows recorded application and model versions.
- [x] Device has enough storage and battery for 30-minute session.
- [x] Dedicated test profile used.
- [x] Core automated result: `Pass; evidence/example/e2e-report/` (fictional).
- [x] Automated R01 result: `Pass; evidence/example/r01-automated-report/` (fictional).
- [x] Automated R03 result: `Blocked; full session not performed in this example`.

### Diagnostics and stall evidence

- [x] Recording initially off; normal scan/save/delete actions still work. Enabling preserves recent events across tabs/modals and reopen in the same browser context.
- [x] Copy, Download, and Clear work; clearing logs leaves a saved report/photo intact.
- [x] Export contains technical fields only, without photos, diagnosis labels/scores, report identities, private URLs, or credentials.
- [x] Controlled persistence-failure injection: `Not performed; outside this fictional example's diagnostics scope. Normal storage was available.`
- [x] Diagnostics result: `Pass for recorded scope; evidence/example/diagnostics-notes.md` (fictional).

For a real stall, record the [incident fields](PHYSICAL_RELIABILITY_CHECKLIST.md#record-each-reproduced-stall), including disabled versus enabled Run, workflow marker, elapsed time, and recovery outcome. If the modal prevents About access and offered recovery remains unusable, reopen the same app/browser, export preserved logs promptly, and check History before retrying. Unsaved work can be lost. Do not clear site data or uninstall to troubleshoot. Reopening is not a guaranteed fix, and missing completion events do not establish a root cause.

### R01-M01: repeated prediction consistency

**Input plan**

- [x] Photo ID / hash: `Example healthy leaf / <actual SHA-256>`
- [x] Expected number of repetitions: `30`
- [x] Number completed: `30`
- [x] Result label on run 1: `Healthy Leaf` (fictional displayed label).
- [x] Accepted or uncertain on run 1: `Accepted`
- [x] Confidence on run 1, if displayed: `94.2%`

| Run  | Result label                                | Accepted / uncertain | Visible confidence | Record deleted before next run | Pass / Fail / Blocked | Notes                                        |
| ---- | ------------------------------------------- | -------------------- | ------------------ | ------------------------------ | --------------------- | -------------------------------------------- |
| 1    | Healthy Leaf                                | Accepted             | 94.2%              | Yes                            | Pass                  | Fresh scan; record disappeared from History. |
| 2    | Healthy Leaf                                | Accepted             | 93.9%              | Yes                            | Pass                  | Fresh scan; same source bytes.               |
| 3-30 | See `evidence/example/r01-continuation.md`. | Accepted             | 93.7%-94.2%        | Yes                            | Pass                  | Continuation records every run and deletion. |

- [x] Displayed result label and accepted/uncertain status stayed stable across 30 runs.
- [x] Confidence variation recorded: `93.7%-94.2%`.
- [x] No duplicate reopening counted as a prediction.
- [x] R01 result: `Pass — 30 fresh inferences completed; displayed label/status stayed stable. Evidence: evidence/example/r01-continuation.md.`

The fictional 93.7%–94.2% range illustrates manual label/acceptance observations and visible score variation. It does not establish automated R01's separate raw-confidence tolerance of 0.001. Badges truncate to at most one decimal and omit `.0`; they do not display full raw values. About logs exclude scores and probability tables.

### R02-M01: offline availability after initial load

- [x] Online preparation completed with distinct Photo A and unscanned Photo B.
- [x] Initial app/model load completed while online; Photo A appeared with image in Recent Scans and History.
- [x] Airplane mode enabled; Wi-Fi off; app fully closed and reopened.
- [x] App, History, and Photo A opened offline.
- [x] New Photo B was scanned offline and remained after a second offline reopen.
- [x] Network restored; local History/photos remained intact without duplicate or returning deleted reports. No guest sign-in or private scan/photo upload occurred in the fictional network evidence.
- [x] Downloaded English/Bisaya advice remained readable offline. Reconnection downloaded changed advice from a designated test backend, and a later live update appeared; production treatment text was not edited.
- [x] R02-M02 result: `Pass — local reports/photos preserved and public guideline refresh observed. Evidence: evidence/example/r02-local-history-and-guidelines.md.`
- [x] R02 result: `Pass — offline reopen and new offline scan worked; reconnection completed. Evidence: evidence/example/r02-screen-recording.mp4.`

### Local storage-full recovery

- [x] Storage-full result: `Blocked — no natural quota error occurred and controlled injection was unavailable. No recovery pass is claimed. Follow-up: example issue #42.`

In a real run, record whether quota failure was natural or injected. Check retry saves the same completed prediction without new inference, discard releases only the unsaved result, and committed History/photos remain intact. Do not fill device storage merely to complete this example.

### R03-M01: 30-minute mixed-use session

No timed session is performed in this fictional example. Actual action, observation, and elapsed-time cells remain blank until observed.

| Time   | Action completed | Result / observation | Crash, freeze, lost record, or stuck scan? | Heat / battery / slowdown notes | Pass / Fail / Blocked |
| ------ | ---------------- | -------------------- | ------------------------------------------ | ------------------------------- | --------------------- |
| 0 min  |                  |                      |                                            |                                 | Blocked               |
| 10 min |                  |                      |                                            |                                 | Blocked               |
| 20 min |                  |                      |                                            |                                 | Blocked               |
| 30 min |                  |                      |                                            |                                 | Blocked               |

- [x] R03 result: `Blocked — full 30-minute physical session not performed in this example. No shortened session or pass is claimed.`

A later completed record must cover real guided capture, Retake, gallery, fresh inference, rotation, background/reopen, cached offline use, reconnection, and heat/battery observations.

<a id="r04-m01-native-camera-gallery-and-layout"></a>

### R04-M01: guided camera, gallery, and layout

- [x] On HTTPS below 768px, live browser preview opened. Capture waited for a frame and preserved the full image, not a crop of the guide.
- [x] Permission grant/denial/recovery, Close during permission, interruption/retry, and backgrounding preserved usable controls and stopped camera streams; return required explicit reopening.
- [x] Capture opened review without inference/save until Run. Camera Retake opened live preview; gallery Retake reopened its picker. Cancellation created no report.
- [x] Cached offline capture/diagnosis saved locally; reconnection did not upload reports/photos.
- [x] Accepted and uncertain results showed confidence, such as `94.2%`, `94%`, and `Uncertain / Unrecognized, 69.8%` (fictional). History Details showed the same formatted value; optional fresh-result probability rows were not restored there.
- [x] Older reports retained their saved values. UI inspection alone was not treated as proof of exact raw storage precision.
- [x] Recent, History, search, filter, pagination, Details, and delete worked in portrait and landscape.
- [x] Long badge stayed inside image; Details close control remained reachable.
- [x] Required capture/upload counts, progress/timings, English/Bisaya controls, safe areas, and accessibility observations are covered in the fictional notes. A real abbreviated summary still needs every required observation in its attached evidence.
- [x] R04-M01 result: `Pass — camera, gallery, and layout observations completed. Evidence: evidence/example/r04-video.mp4.`

### R04-M02: device and browser coverage

| Device          | OS / version  | Browser / version   | PWA or tab    | R01  | R02  | R03     | R04  | Evidence location   | Notes                                                                                         |
| --------------- | ------------- | ------------------- | ------------- | ---- | ---- | ------- | ---- | ------------------- | --------------------------------------------------------------------------------------------- |
| Example Phone 1 | ExampleOS 1.0 | Example Browser 1.0 | Installed PWA | Pass | Pass | Blocked | Pass | `evidence/example/` | Fictional; R04 includes required camera/layout/install observations for this one environment. |

### R04-M03: installation guide and installed launch

- [x] Browser-specific installation, actual installed launch, footer versions, safe-area controls, and portrait/landscape behavior were recorded for the fictional phone.
- [x] QR opened the public `?install=1` guide; Close and Continue in Browser worked. No automatic native prompt occurred, and prompt dismissal was checked where supported.
- [x] R04-M03 result: `Pass — evidence/example/r04-install-notes.md` (fictional).

### Final decision

- [x] Available observations and remaining gaps recorded for this fictional example.
- [x] Final decision: `Release blocked from publication — storage-full recovery and R03 remain blocked. Evidence: evidence/example/.`

A real candidate may proceed only when every required case passes for that candidate and exact tested deployment.

## Fictional blocked-answer example

Use this form when an observation cannot be completed. Do not convert it to `Pass` later without running and recording the missing test.

```text
R04-M01 result: Blocked — permission grant/denial could not be exercised.
Reason: Browser-level camera permission was disabled by device policy.
Observed: Guided-camera permission message appeared; Close and Upload Photo remained usable.
Evidence: evidence/example/r04-camera-blocked.mp4
Follow-up: issue #123; repeat on a device/browser where permission can be granted or denied.
Final decision: Candidate blocked from release until required camera observation is completed.
```
````

</details>

Later the same day, simplified the current sample to match all eight main reliability rows, with five invented passes, one invented failure and two blocked cases. Added explicit thirty-run and thirty-minute example records without performing a test. Earlier dated examples remain historical.

## November 12, 2026

Updated the current fictional example to the current manual cases. All example outcomes remain invented; no completed evidence was changed.

<details>
<summary>Earlier fictional front sheet, retained for historical comparison</summary>

# Physical reliability checklist answer example

For the unreleased November 10 source, use the current blank sheet's variant-specific instructions: Diagnostics is Debug/testing-only; Production updates use Settings/browser guidance. The fictional earlier-version examples below remain unchanged and are not new test results.

The fictional example below retains its illustrative 0.13.0 / 0.1.9 identities. The [published reference observed November 7, 2026](TESTING.md#november-7-2026-published-production-fresh-qa) is web 0.13.1 / APK 0.1.10/code 11 / Model V5.1.0. Enter the actual tested artifact without transferring these invented outcomes; this sample remains fictional.

> **FICTIONAL EXAMPLE ONLY — NOT PHYSICAL-TEST EVIDENCE.** All devices, times, paths and outcomes below are invented. No phone session was run to write this file. The invented storage failure is not a reported app defect. Use the [blank reliability sheet](PHYSICAL_RELIABILITY_CHECKLIST.md) for real work.

## How to answer each field

Record the exact APK/active bundle/model, device and date once. Perform each required case, then record the actual outcome, status and evidence. Pass requires all required actions for the declared scope; Fail means observed wrong behavior; Blocked means a required action/evidence is unavailable. A checkmark or partial successful step is not a whole-case pass. Preserve failures when retesting.

All `evidence/fictional/...` paths below are nonexistent placeholders. Real evidence links must exist. A browser R03 pass does not complete a physical session; two same-file scans do not complete thirty. No private production backend was contacted by this example.

## Where tester gets each value

- Native version/code: APK footer and Android app information; exact existing APK/verified receipt for full hashes and signer.
- Active web bundle/model: About and the active packaged/verified OTA receipt; repository labels alone are insufficient.
- Phone/Android/System WebView, network and backup state: the actual device and Settings. Never record a real recovery code or session token in the form.
- Counts/duration: the completed per-run/action records and start/end times, not intended values.
- Evidence: approved screenshots/video, safe diagnostics and technical reports for the same artifact/conditions. Logs exclude photos, diagnoses/scores and credentials; a screenshot cannot prove a raw score, no private Auth request or completed cloud deletion.

### Minimal pre-test commands

These read existing local inputs, not the installed device or a completed test:

```powershell
git rev-parse HEAD
git status --short
Get-ChildItem -LiteralPath public/model -File | Get-FileHash -Algorithm SHA256 | Format-List Path, Hash
$testedApkPath = Read-Host 'Full path to the exact existing APK'
Get-FileHash -LiteralPath $testedApkPath -Algorithm SHA256 | Format-List Path, Hash
```

Compare those values with actual artifact/active-bundle evidence. Automated commands and report preservation are in [TESTING.md](TESTING.md#install-and-run); no automated or physical test is executed by reading this sample.

## Fictional abbreviated example

### Candidate and tester record

- Tester/date: Example Tester; 2026-11-06, Asia/Manila — fictional.
- Device: Example Phone / Android EXAMPLE / System WebView EXAMPLE.
- APK: `example-release.apk`, `0.1.9/code 10`; About web bundle/model `0.13.0 / V5.1.0` — illustrative, not observed installation.
- Artifact/evidence: `evidence/fictional/artifact-receipt.json` and `evidence/fictional/physical-session/` — nonexistent.
- Target: invented Production APK phone session; no live backend operations performed.
- Starting state: English/Bisaya, portrait, Wi-Fi then airplane mode, backup not set up.
- Scope: all eight main rows illustrated. No-code branches are declared for reconnection/Settings; own-code privacy/backup, detailed release/OTA and other environments need separate evidence. Required missing fixtures remain blocked.
- Photos: unchanged Example Photo A for R01, distinct Photo B for offline testing and varied camera/gallery inputs for R03. Actual hashes/permissions would be required in real evidence.

### Before testing

Everything below is an invented answer example. There is no actual installer receipt, phone, test video or automated report behind it. A real record must complete artifact/precondition checks and provide the evidence described.

## Fictional actual-results examples

| Case / test                          | Expected result                                                                                                                                                           | Actual result                                                                                                                                                                                                                                                                                                     | Pass / Fail / Blocked | Evidence / issue                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| R01-M01 — Repeated predictions       | Thirty fresh inferences per planned unchanged photo; stable displayed label/acceptance, recorded confidence variation and no duplicate reuse.                             | Only two of thirty same-file runs were illustrated. Both showed Healthy Leaf/Accepted, 94.2%, after designated record deletion. Runs 3–30 and their evidence are missing.                                                                                                                                         | Blocked               | `evidence/fictional/r01-partial.csv`                                   |
| R02-M01 — Offline use                | Packaged APK, History/private photos and a different new scan work after airplane-mode reopening and a second restart.                                                    | With Wi-Fi off in airplane mode, reopened the fictional APK and Photo A's History/photo. New Photo B received a result, saved locally and remained after another offline restart; local advice stayed readable.                                                                                                   | Pass                  | `evidence/fictional/r02-offline.mp4`                                   |
| R02-M02 — Reconnection               | Preserved local reports/photos, correct guidance refresh and backup behavior for the declared state.                                                                      | No-code branch: local reports remained without duplicates/resurrection; guidance refreshed. Invented scoped testing notes recorded no private enrollment/upload. No enabled/paused-backup conclusion is claimed.                                                                                                  | Pass                  | `evidence/fictional/r02-reconnect.mp4` and scoped request notes        |
| R03-M01 — 30-minute session          | At least thirty physical minutes with fresh mixed-use actions, no crash/lost committed report/permanent stall, and timing/device observations.                            | Invented session ran 09:00–09:31, thirty-one minutes, with thirty-four fresh varied-image predictions. Camera/gallery, History/Details/Settings, background/reopen and network changes remained usable. No crash/lost report/stuck scan; phone felt warmer and battery moved from 80% to 76%.                     | Pass                  | `evidence/fictional/r03-video.mp4` and full action/inference log       |
| R04-M01 — Camera and interruption    | Permission handoff, cancellation/background cleanup, square capture, portrait/safe areas, bilingual controls and startup/details behavior meet the recorded expectations. | Invented continuation records grant/denial/retry and pending-prompt cancellation, matching square crop, Retake, camera/encoding stop on real background/Close, and no late preview. Cold/offline launch and first-result/Settings entry had no duplicate splash; portrait/keyboard/EN/BIS controls stayed usable. | Pass                  | `evidence/fictional/r04-camera.mp4` and full continuation/timing notes |
| ST01 — Storage-full recovery         | A storage failure preserves committed History; retry saves the completed result once, or discard releases only unsaved work.                                              | A fictional natural storage-full save preserved existing History. After space became available, Retry remained disabled and the completed result could not be saved. This invented incorrect behavior is Fail; discard completion was not observed.                                                               | Fail                  | `evidence/fictional/st01-storage-notes.md`; fictional issue EXAMPLE-01 |
| BK01 — Interrupted backup/restore    | Controlled testing transfers retry incomplete work without duplicate reports or replacing receiving code/Pause/source ownership.                                          | No designated testing source/receiver backups were available. No interrupted upload/restore, receiver preservation or retry outcome was observed; no Production-backend pass claimed.                                                                                                                             | Blocked               | `evidence/fictional/bk01-fixture-block.md`                             |
| UI01 — Settings during interruptions | Back/tab changes while pending work settles keep the correct screen/feedback and usable scanner; available codes remain protected.                                        | Predeclared no-code branch: rapidly left/reopened Settings while status and diagnostic Copy/export settled. No stale page/feedback/flash appeared; returning to Scan worked. Own-code privacy was not exercised and remains a separate gap.                                                                       | Pass                  | `evidence/fictional/ui01-settings.mp4` and no-code continuation        |

A real abbreviated answer needs the full linked continuation for every required substep. Do not assume a recording exists or mark a whole case passed from these summaries.

## Where tester types `Pass`, `Fail`, or `Blocked`

Use the main row's status cell, then carry its result into the final summary. A failure takes precedence over a block. For example, ST01 remains Fail even though its discard observation is missing. A missing required Production artifact, safe fixture, report or complete run record is Blocked, not an inferred pass.

### Diagnostics and stall evidence

Settings > Diagnostic logs is enabled before reproduction and exported promptly where storage allows. Record app/driver errors safely and keep any approved prediction evidence separately. An absent completion narrows unfinished work but does not prove an exact root cause. Do not clear app data or uninstall personal History to troubleshoot; reopening is only a recovery attempt.

### R01-M01: repeated prediction consistency

| Run  | Displayed label / acceptance | Visible confidence | Duplicate avoided?                                  | Status / notes                |
| ---- | ---------------------------- | ------------------ | --------------------------------------------------- | ----------------------------- |
| 1    | Healthy Leaf / Accepted      | 94.2%              | Yes; designated test report removed before next run | Pass — fictional substep only |
| 2    | Healthy Leaf / Accepted      | 94.2%              | Yes; unchanged original gallery bytes               | Pass — fictional substep only |
| 3–30 | Not performed                |                    |                                                     | Blocked                       |

Overall R01 is **Blocked**. This partial record does not establish thirty-run repeatability or the automated raw-confidence tolerance. The varied R03 inputs do not replace the missing same-file R01 repetitions.

### R02-M01: offline availability after initial load

The fictional continuation covers both offline reopens, Photo A/B, local saving and public guidance. APK assets are packaged, not dependent on a website service worker. R02-M02 is scoped to **no own code**: ordinary use creates no private enrollment/upload. A phone with its own enabled backup may upload eligible reports online; a paused phone can still retry queued own-backup deletions. Those branches need their own actual evidence.

### Local storage-full recovery

The invented ST01 failure is deliberately not a product claim. A real tester must identify natural versus approved injected failure, actual free-space/context, committed versus unsaved work, retry/discard and follow-up. Never fill a personal phone or delete real reports merely to force this scenario.

### R03-M01: 30-minute mixed-use session

**All times and observations below are fictional.** Start 09:00; end 09:31; elapsed 31 minutes, Asia/Manila. Full intervening activity would be in the actual continuation/video, not proven by four rows alone.

| Time  | Actual actions / outcome                                                                      | Failure/loss/stall      | Evidence                 |
| ----- | --------------------------------------------------------------------------------------------- | ----------------------- | ------------------------ |
| 09:00 | Open APK; camera capture, Retake, fresh diagnosis, Details/History                            | None in invented record | Fictional full video/log |
| 09:10 | Gallery scans, designated-report deletion to avoid reuse, Settings/language, portrait attempt | None in invented record | Fictional full video/log |
| 09:20 | Background/reopen; airplane mode with Wi-Fi off; new offline scans and History                | None in invented record | Fictional full video/log |
| 09:31 | Reconnect, inspect preserved reports, record warmth/battery and end time                      | None in invented record | Fictional full video/log |

The thirty-four varied-image predictions are an invented observed count, not a required R03 target. Duration must still be at least thirty minutes. No real session is established by this example.

<a id="r04-m01-native-camera-gallery-and-layout"></a>

### R04-M01: guided camera, gallery, and layout

The invented passing row assumes its complete fictional continuation covers every required camera/startup/layout substep. A real record must distinguish the Android permission handoff from actual backgrounding and inspect cancellation/late-preview behavior. If a permission or encoding case cannot be exercised, record that required gap as Blocked. Phone APKs request portrait; browser emulation or landscape screenshots alone do not complete these phone observations.

### R04-M02: device and browser coverage

Only the invented Example Phone is represented. No real APK, other phone/OS/WebView, website browser or all-device coverage is established.

### R04-M03: installation guide and installed launch

No actual website metadata/download, APK installation or same-signer update took place. Required installation/release scope remains Blocked until separately recorded. Website information/Android guidance and an installed APK's native-versus-web-bundle labels are distinct checks.

### Separate backup and update follow-up

BK01 is Blocked. Own-code privacy, receiving-owner/Pause preservation, fresh receiver setup and scoped queued deletion need controlled testing-target records. Production updater/Android approval/cancellation and signed web-OTA/rollback evidence remain separate and unverified; no Debug or browser pass is substituted. Do not include real codes or modify private production resources to complete this example.

## Fictional retest

| Date          | Case / original issue | Changed build/inputs         | New observation / status | Evidence                           |
| ------------- | --------------------- | ---------------------------- | ------------------------ | ---------------------------------- |
| Not performed | ST01 / EXAMPLE-01     | No later artifact identified | No retest pass claimed   | Future exact-build record required |

### Final decision

- Main rows: **8**; invented results: **5 Pass, 1 Fail, 2 Blocked**.
- R01 still lacks the full thirty-run record; ST01 has an invented failure; BK01 lacks fixtures/evidence.
- Separate technical, with-code privacy, Production-backend, install/OTA and other-device coverage remains unverified.
- Conclusion: no real reliability result established; no release approval. For an actual equivalent outcome, unresolved required failures/blocks prevent acceptance.
- Functional, SUS, agricultural expert and model-accuracy findings remain separate.

## Fictional blocked-answer example

```text
Case: BK01
Status: Blocked
Observed: Local History remained readable.
Not observed: Interrupted testing upload/restore and receiving-code/Pause preservation.
Reason: Controlled source/receiver fixtures unavailable.
Evidence: evidence/fictional/bk01-fixture-block.md (nonexistent sample path)
Follow-up: Arrange approved testing fixtures; record the actual target and repeat the case.
```

</details>

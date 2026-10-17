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

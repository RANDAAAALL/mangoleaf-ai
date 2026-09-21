# Physical reliability checklist answer example

> **EXAMPLE ONLY. NOT PHYSICAL-TEST EVIDENCE.** Every value below is fictional. Do not submit, copy, or mark this file as completed evidence. Copy [`PHYSICAL_RELIABILITY_CHECKLIST.md`](PHYSICAL_RELIABILITY_CHECKLIST.md) for each real candidate, device, operating system, browser, and test date, then replace every value with an observation from that exact test.

## How to answer each field

- In a real checklist, leave a field or result `[ ]` until its value is recorded, then use `[x]`. A checked `Fail` or `Blocked` means the result was recorded; it does **not** mean the test passed. Check an observation such as “App opens offline” only when it is true; otherwise explain it in the result line.
- Record the full tested commit ID, the exact HTTPS deployment URL, and versions shown on the device footer. Do not use intended versions or a later commit.
- Write actual device, OS, browser, network, photo hash, report, screenshot, video, and issue locations. A report path must point to evidence that exists.
- Use only `Pass`, `Fail`, or `Blocked` as a test status. `Pass` means all required observations met their expected behavior. `Fail` means observed application behavior was wrong. `Blocked` means a required observation could not be completed; name why and link the issue or note. If both occur, record `Fail` and list the blocked observations too.
- A result label records what the app displayed. It does not claim that diagnosis is biologically correct.
- For R01, delete each test record and confirm it disappears from History before scanning the same bytes again. Reopening a duplicate record is not another prediction.
- Never invent a passing result to complete a table. An observed crash is `Fail`. An unavailable test photo or missing required evidence is `Blocked`. Denying camera permission is itself a planned test: pass that observation if the app handles denial correctly; use `Blocked` if device policy prevents exercising it.

## Where tester types `Pass`, `Fail`, or `Blocked`

| Test area                   | Type status here                                                                                 | What it means                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| R01 repeated scans          | Last column of each repetition row, then `R01 result` summary line.                              | A failed/blocked run makes overall R01 `Fail` or `Blocked`.            |
| R02 offline test            | `R02-M02 result` for reconnection, then `R02 result` for the complete offline/reconnection case. | Verify backend state; include reason and evidence path.                |
| R03 mixed-use session       | Last column of each 0/10/20/30-minute row, then `R03 result` summary line.                       | A crash, stuck scan, or lost record makes overall R03 `Fail`.          |
| R04 camera/layout           | `R04-M01 result` summary line after all camera, gallery, and layout observations.                | If camera permission cannot be tested, mark `Blocked` and explain why. |
| R04 device/browser coverage | R01–R04 cells in the coverage table for that physical environment.                               | Copy final status from each completed section.                         |
| Final decision              | `Final decision` line at document end.                                                           | Only write “may proceed” when all required cases pass.                 |

Fictional examples of wording to replace with actual observations:

```md
- [x] R01 result: Pass — 30 fresh scans stable. Evidence: Drive/MangoLeaf/R01-<commit>/
- [x] R02 result: Blocked — airplane mode unavailable on test device. Evidence: issue #42
- [x] Final decision: Candidate blocked from release — R02 still blocked. Evidence: issue #42
```

## Where tester gets each value

| Checklist field                   | Get it from                                                                                                                                                                                            | What to record                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Candidate commit ID               | In the candidate repository, run `git rev-parse HEAD`. Confirm Vercel's deployment source shows the same commit.                                                                                       | Full 40-character output. Do not use a newer local commit.                                          |
| Deployment URL tested             | Vercel **Deployments** page; open the candidate deployment and copy its HTTPS staging URL.                                                                                                             | Exact URL opened on phone, not a LAN `http://` address.                                             |
| Application/model version         | Candidate deployment footer on the physical device.                                                                                                                                                    | Text visibly shown in footer, for example `v0.4.8` and `v3.0.0`.                                    |
| Model asset hashes                | On your PC, open PowerShell in MangoLeaf AI project folder at the exact candidate commit. Run the model-hash command below; it reads `public/model` and prints one SHA-256 fingerprint per model file. | Save command output with candidate evidence; do not manually type hashes. It does not change files. |
| Tester, date, device, OS, browser | Tester and physical device Settings/about screen; browser menu **About** page.                                                                                                                         | Actual person, local time zone, device model, OS/browser versions.                                  |
| PWA/tab and network               | Observe how app was opened; record Wi-Fi/mobile data before airplane mode.                                                                                                                             | `installed PWA` or `browser tab`; do not record Wi-Fi password.                                     |
| R01/R02 photo IDs and hashes      | Use gallery photos copied unchanged to phone. On computer, run `Get-FileHash ./path/to/photo.jpg -Algorithm SHA256`; supplied fixtures also have hashes in `tools/e2e/fixtures/photos/manifest.json`.  | File name/ID plus SHA-256. Use same gallery bytes for R01; use distinct A/B photos for R02.         |
| Automated reports                 | Run required commands for same candidate, then preserve `playwright-report/` and matching `test-results/` before another run replaces them.                                                            | Saved report/evidence location.                                                                     |
| Screenshots, video, notes, issues | Save device evidence in a candidate-specific folder or approved Drive location.                                                                                                                        | Actual path/link and issue number for every failure/block.                                          |

### Minimal pre-test commands

Open PowerShell in MangoLeaf AI project folder at the exact candidate commit. Run these before physical testing:

```powershell
git rev-parse HEAD
git status --short
Get-ChildItem public/model -File | Get-FileHash -Algorithm SHA256 | Format-List Path, Hash
bun run test:e2e
bun run test:reliability
```

`git status --short` should show no uncommitted candidate change before relying on `git rev-parse HEAD`. `Format-List` prints complete model hashes without narrowing them to table columns. The full reliability command includes R01 and the 30-minute R03 session. Copy generated browser reports to a dated evidence location before another test run replaces them; see [TESTING.md](TESTING.md#install-and-run) for running either case separately.

## Fictional abbreviated example

The examples below demonstrate wording and evidence detail only. They do not report MangoLeaf AI results.

### Candidate and tester record

- [x] Candidate commit ID: `0123456789abcdef0123456789abcdef01234567` _(fictional)_
- [x] Deployment URL tested (HTTPS): `https://candidate.example.test` _(fictional)_
- [x] Application version shown in footer: `v0.0.0-candidate` _(fictional)_
- [x] Model version shown in footer: `v0.0.0-candidate` _(fictional)_
- [x] Model asset hashes / evidence location: `evidence/example/model-hashes.txt` _(fictional path)_
- [x] Tester: `Example Tester`
- [x] Date and local time zone: `YYYY-MM-DD, Asia/Manila`
- [x] Device model: `Example Phone 1`
- [x] Operating system and version: `ExampleOS 1.0`
- [x] Browser and version: `Example Browser 1.0`
- [x] Mode: `installed PWA`
- [x] Network used before offline checks: `Wi-Fi: ExampleTestNetwork`
- [x] Test account or device identity: `dedicated test profile; no personal scans`
- [x] Photo IDs and SHA-256 hashes: `Photo A: <actual SHA-256>; Photo B: <actual SHA-256>`
- [x] Screenshot, video, notes, and issue-link location: `evidence/example/physical-device/`

### Before testing

- [x] Candidate deployment is exact commit recorded above.
- [x] Deployment uses HTTPS.
- [x] Footer shows recorded application and model versions.
- [x] Device has enough storage and battery for 30-minute session.
- [x] Dedicated test profile used.
- [x] `bun run test:e2e` report: `evidence/example/e2e-report/`
- [x] `bun run test:reliability` report (R01 and R03): `evidence/example/reliability-report/`

### R01-M01: repeated prediction consistency

**Input plan**

- [x] Photo ID / hash: `Example healthy leaf / <actual SHA-256>`
- [x] Expected number of repetitions: `30`
- [x] Number completed: `30`
- [x] Result label on run 1: `Healthy` _(fictional displayed label)_
- [x] Accepted or uncertain on run 1: `Accepted`
- [x] Confidence on run 1, if displayed: `94%`

| Run  | Result label                                | Accepted / uncertain | Visible confidence | Record deleted before next run | Pass / Fail / Blocked | Notes                                        |
| ---- | ------------------------------------------- | -------------------- | ------------------ | ------------------------------ | --------------------- | -------------------------------------------- |
| 1    | Healthy                                     | Accepted             | 94%                | Yes                            | Pass                  | Fresh scan; record disappeared from History. |
| 2    | Healthy                                     | Accepted             | 93%                | Yes                            | Pass                  | Fresh scan; same source bytes.               |
| 3-30 | See `evidence/example/r01-continuation.md`. | Accepted             | 92%-94%            | Yes                            | Pass                  | Continuation records every run and deletion. |

- [x] Displayed result label and accepted/uncertain status stayed stable across 30 runs.
- [x] Confidence variation recorded: `92%-94%`.
- [x] No duplicate reopening counted as a prediction.
- [x] R01 result: `Pass — 30 fresh inferences completed; displayed label/status stayed stable. Evidence: evidence/example/r01-continuation.md.`

The fictional 92%–94% range illustrates recording visible scores in the manual checklist. It would not establish a pass for automated R01's separate raw-confidence tolerance of 0.001.

### R02-M01: offline availability after initial load

- [x] Online preparation completed with distinct Photo A and unscanned Photo B.
- [x] Initial app/model load completed while online; Photo A appeared with image in Recent Scans and History.
- [x] Airplane mode enabled; Wi-Fi off; app fully closed and reopened.
- [x] App, History, and Photo A opened offline.
- [x] New Photo B was scanned offline and remained after a second offline reopen.
- [x] Network restored; pending records synchronized with no duplicate or returning deleted record.
- [x] R02-M02 result: `Pass — expected test rows, uploaded photos, and deletions verified on the designated backend. Evidence: evidence/example/r02-backend-check.md.`
- [x] R02 result: `Pass — offline reopen and new offline scan worked; reconnection completed. Evidence: evidence/example/r02-screen-recording.mp4.`

### R03-M01: 30-minute mixed-use session

| Time   | Action completed                                    | Result / observation                          | Crash, freeze, lost record, or stuck scan? | Heat / battery / slowdown notes        | Pass / Fail / Blocked |
| ------ | --------------------------------------------------- | --------------------------------------------- | ------------------------------------------ | -------------------------------------- | --------------------- |
| 0 min  | Open app; scan; open Details and History            | Scan saved; Details and History opened.       | No.                                        | Normal temperature and responsiveness. | Pass                  |
| 10 min | Scan; delete test record; rotate device; reopen app | Layout rotated; deleted record stayed absent. | No.                                        | No observed slowdown.                  | Pass                  |
| 20 min | Scan; background then resume; change network state  | Scan/history remained available after resume. | No.                                        | Battery change recorded in notes.      | Pass                  |
| 30 min | Scan; verify History; reopen app                    | History/photo remained after reopen.          | No.                                        | Final device notes attached.           | Pass                  |

- [x] R03 result: `Pass — session lasted 30 minutes; no crash, reload, stuck scan, lost confirmed record, or unusable control. Evidence: evidence/example/r03-notes.md.`

### R04-M01: native camera, gallery, and layout

- [x] Native camera opened, permission grant/deny/cancel kept app usable, gallery preview matched source, and Retake reopened source.
- [x] Accepted result showed photo, displayed class, confidence, and Details.
- [x] Recent, History, search, filter, pagination, Details, and delete worked in portrait and landscape.
- [x] Long badge stayed inside image; Details close control remained reachable.
- [x] R04-M01 result: `Pass — camera, gallery, and layout observations completed. Evidence: evidence/example/r04-video.mp4.`

### R04-M02: device and browser coverage

| Device          | OS / version  | Browser / version   | PWA or tab    | R01  | R02  | R03  | R04  | Evidence location   | Notes               |
| --------------- | ------------- | ------------------- | ------------- | ---- | ---- | ---- | ---- | ------------------- | ------------------- |
| Example Phone 1 | ExampleOS 1.0 | Example Browser 1.0 | Installed PWA | Pass | Pass | Pass | Pass | `evidence/example/` | Fictional row only. |

### Final decision

- [x] All required observations recorded for this fictional example.
- [x] All evidence paths listed.
- [x] Final decision: `Candidate may proceed to release decision — all required cases passed in this fictional example. Evidence: evidence/example/.`

A real candidate may proceed only when every required case passes for that candidate and exact tested deployment.

## Fictional blocked-answer example

Use this form when an observation cannot be completed. Do not convert it to `Pass` later without running and recording the missing test.

```text
R04-M01 result: Blocked — native camera permission prompt did not appear on Example Browser 1.0.
Reason: Browser-level camera permission was disabled by device policy.
Evidence: evidence/example/r04-camera-blocked.mp4
Follow-up: issue #123; repeat on a device/browser where permission can be granted or denied.
Final decision: Candidate blocked from release until required camera observation is completed.
```

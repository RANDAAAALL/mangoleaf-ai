# MangoLeaf AI physical reliability checklist

Use one completed copy for each candidate, device, operating system, browser, and test date. This sheet records physical-device reliability evidence. It does not measure model accuracy or replace expert-reviewed evaluation data.

Do not mark a case as passed before every required observation is recorded. Use `Pass`, `Fail`, or `Blocked`; explain every failure or block.

A checked field or result box means its value was recorded. It does not always mean the test passed: `[x] R01 result: Blocked: <reason>` means the block was recorded honestly. Check an observation such as “App opens offline” only when it is true; otherwise leave it unchecked and explain the failure or block in the result line.

Use `Pass` when all required observations meet their expected behavior, `Fail` when observed application behavior is wrong (including a crash), and `Blocked` when missing access, inputs, or evidence prevents a required observation. If a failure and a block both occur, record `Fail` and list the remaining blocked observations. Type the status in the table cells and section result lines, replacing `Pass / Fail / Blocked` with one value.

Need an answer-format example? See [PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md). Its values are fictional and must never be submitted as physical-test evidence.

## Candidate and tester record

- [ ] Candidate commit ID:
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
- [ ] Network used before offline checks:
- [ ] Test account or device identity:
- [ ] Photo IDs and SHA-256 hashes:
- [ ] Screenshot, video, notes, and issue-link location:

## Before testing

- [ ] Candidate deployment is exact commit recorded above.
- [ ] Deployment uses HTTPS. Do not use a LAN `http://` URL for service-worker testing.
- [ ] Footer shows recorded application and model versions.
- [ ] Device has enough storage and battery for 30-minute session.
- [ ] Use a designated test browser profile or device. Do not mix research evidence with personal scan history.
- [ ] Run core automated checks for same candidate: `bun run test:e2e`.
- [ ] Run R01 and R03 automated checks for same candidate: `bun run test:reliability`.
- [ ] Record automated report location:

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

This manual path checks displayed label/acceptance stability and records visible confidence variation. It does not verify the automated R01 tolerance of 0.001 on raw confidence. If raw class, numerical confidence, margin, or entropy evidence is required on a phone, a separately configured device-capable runner is needed. The repository's current harness runs only on the local loopback test server; it is not reachable from a phone or included in the deployment. Do not add these diagnostics to the farmer-facing modal.

## R02-M01: offline availability after initial load

Use two different photos. Photo B must not have been scanned on this device before.

### Online preparation

- [ ] Open candidate while online.
- [ ] Wait for app and model to finish initial loading.
- [ ] Scan Photo A:
- [ ] Photo A result appears in Recent Scans and History, including its image.
- [ ] Wait for visible synchronization to settle before disconnecting.
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
- [ ] Wait for pending records to synchronize.
- [ ] No duplicate records appear.
- [ ] No deleted test record returns unexpectedly.
- [ ] Verify the expected test rows, uploaded photos, and deletions on the designated backend; local History alone does not prove remote synchronization.
- [ ] R02-M02 result: Pass / Fail / Blocked — reason and evidence location:
- [ ] R02 result: Pass / Fail / Blocked — reason and evidence location:

## R03-M01: 30-minute mixed-use session

Start time:

End time:

Use real scans. To avoid duplicate shortcuts, choose different photos or delete each completed test record before its next use. Include Details, History, navigation, rotation, background/resume, and network changes.

| Time   | Action completed                                    | Result / observation | Crash, freeze, lost record, or stuck scan? | Heat / battery / slowdown notes | Pass / Fail / Blocked |
| ------ | --------------------------------------------------- | -------------------- | ------------------------------------------ | ------------------------------- | --------------------- |
| 0 min  | Open app; scan; open Details and History            |                      |                                            |                                 |                       |
| 10 min | Scan; delete test record; rotate device; reopen app |                      |                                            |                                 |                       |
| 20 min | Scan; background then resume; change network state  |                      |                                            |                                 |                       |
| 30 min | Scan; verify History; reopen app                    |                      |                                            |                                 |                       |

- [ ] Session lasted at least 30 minutes.
- [ ] No crash or browser-tab reload occurred unexpectedly.
- [ ] No scan stayed permanently in progress.
- [ ] No confirmed local record or photo was lost.
- [ ] No navigation control became unusable.
- [ ] R03 result: Pass / Fail / Blocked — reason and evidence location:

## R04-M01: native camera, gallery, and layout

### Camera and picker

- [ ] Tap Take Photo; native camera opens.
- [ ] Grant camera permission; capture photo; correct preview appears.
- [ ] Deny camera permission; app remains usable and does not create a scan.
- [ ] Cancel native camera or picker; app does not create a scan.
- [ ] Upload from gallery; selected photo preview matches source.
- [ ] Tap Retake; same camera or gallery source opens again.

### Result and layout

- [ ] Test accepted result: photo, class, confidence, and Details appear.
- [ ] Test uncertain result if available: photo and uncertain label appear; no raw diagnostics appear in modal.
- [ ] Recent Scans displays latest record and image.
- [ ] History search, filter, pagination, Details, and delete work.
- [ ] Portrait layout works.
- [ ] Landscape layout works.
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

## Final decision

- [ ] All required cases have a recorded result.
- [ ] All failures and blocks have issue links or written reasons.
- [ ] Automated reports, physical evidence, commit ID, deployment URL, and versions match same candidate.
- [ ] Final decision: Candidate may proceed to release decision / Candidate blocked from release — reason and evidence location:

See [TESTING.md](TESTING.md) for automated scope and limitations. See [MODEL_VERSIONING.md](MODEL_VERSIONING.md#candidate-testing-and-promotion) for candidate promotion and tagging order.

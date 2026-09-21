# Application and reliability testing

These tests cover the scan workflow and the manuscript's reliability paragraph. R01–R04 are project test IDs, not research-objective numbers from the manuscript. Physical-device results and model accuracy require their own evidence; a green browser suite alone does not establish either.

## Install and run

Use the project's pinned Bun dependencies and Node.js 24 (Playwright runs through Node):

```bash
bun install --frozen-lockfile
bunx --no-install playwright install chromium firefox webkit
bun run test:e2e
bun run test:report
```

On Linux, install browser system dependencies with `bunx --no-install playwright install --with-deps chromium firefox webkit`.

`test:e2e` builds an isolated production static export under ignored `.test-app/`, starts its local server, runs tests, and stops the server. It reuses that build only when application/configuration/dependency/model input hashes match. It does not use `next dev` or `next start`, and does not overwrite `out/` or the production service worker. The local test backend is compiled into this private copy. Never deploy `.test-app/`.

```bash
# Focus on one browser or case while developing.
bun run test:e2e --project=chromium-mobile --grep F07

# Full reliability: 30 predictions per image and a 30-minute session.
bun run test:reliability
bun run test:report:reliability

# Run either reliability case independently.
bun run test:reliability --grep R01
bun run test:reliability --grep R03
```

Reliability defaults to `chromium-mobile`, a desktop browser with a phone viewport/touch emulation. Use `--project=chromium-desktop` to repeat it there. Headless rendering can use a software GPU: the report records the actual backend/renderer. Do not describe either project as a physical phone.

## Local generated folders

These folders are expected after running the commands below. They hold generated files or downloaded tools, are ignored by Git, and are not application source code. Stop any command using a folder first: press `Ctrl+C` in a running test, report-server, security-check, or interactive Playwright MCP terminal. Then every folder below is safe to delete. Keep the tracked `tools/` directory: it contains the scripts and tests that create or use these generated folders.

| Folder               | Why it appears and what it contains                                                                                                                                                            | Safe to delete?                          | Reappears or required action                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `.test-app/`         | `bun run test:build`, `test:e2e`, or `test:reliability` creates an isolated app copy and static export. Input hashes select a reusable build; changed app inputs can create another subfolder. | Yes, after active tests stop.            | Next `test:build`, `test:e2e`, or `test:reliability` rebuilds it. Never deploy it: local mock backend only.           |
| `.tools/`            | `bun run security:install` downloads the pinned, checksum-verified Gitleaks scanner used by security checks and Husky pre-push. It is separate from tracked `tools/`.                          | Yes, after security checks or Git push.  | Run `bun run security:install` again before security checks or pushing. Internet required; it does not auto-recreate. |
| `playwright-report/` | Browser tests write readable HTML reports under `e2e/` or `reliability/`. Open them with `bun run test:report` or `bun run test:report:reliability`.                                           | Yes, after report server stops.          | Next browser-test run creates a new report. Report command only opens existing report.                                |
| `test-results/`      | Browser tests write JSON results, attached evidence, failure screenshots/traces, and R03's `endurance-progress.json`. Suites use separate `e2e/` and `reliability/` subfolders.                | Yes, after active tests stop.            | Future test run generates new evidence. Partial R03 progress does not resume or count as a pass.                      |
| `.playwright-mcp/`   | Interactive Playwright MCP sessions save browser console and page diagnostics here. It is separate from CLI browser-test reports.                                                              | Yes, after interactive MCP session ends. | Next interactive MCP session that records diagnostics recreates it.                                                   |

A new run replaces the previous results for that suite, including when using `--grep`. Running R01 and then R03 separately leaves the latest reliability report showing R03 only. Run `bun run test:reliability` to include both in one report. Before rerunning or cleaning folders, preserve both the HTML report and corresponding test results if they are formal evaluation evidence; they can contain input photos and predictions. None of these folders replaces the physical-device checklist.

## What runs where

| Location                             | Checks                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Husky pre-commit                     | Existing staged-file formatting                                           |
| Husky pre-push                       | Existing security, TypeScript, lint, and formatting checks                |
| GitHub CI, push to `master` only     | Existing checks/build/export verification plus core E2E suite and reports |
| Explicit reliability command         | R01 repeated actual inference and R03 extended use                        |
| Development team on physical devices | R01–R04 manual checklist below                                            |

Long reliability sessions do not run on every push. `bun run test:tooling` still runs tooling unit tests; `.pw.ts` files are selected by Playwright and are not Bun unit tests. The Python notebook verifiers remain separate commands.

## Functional cases

| ID      | Action and expected result                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01     | Empty Recent and History show the empty-state message.                                                                                              |
| F02     | Scan opens its sheet; Cancel closes it without creating a record.                                                                                   |
| F03     | Upload Photo opens its file input and previews the chosen bytes.                                                                                    |
| F04     | Mobile Take Photo selects the camera input with `capture="environment"`; desktop hides that control. Native camera behavior remains manual.         |
| F05     | Empty file selection stores nothing; Retake reopens the same picker. Photo review currently has Retake, not a separate Cancel button.               |
| F06     | Each of six controlled accepted predictions shows the photo, class, and confidence.                                                                 |
| F07     | Rejected result shows its photo and uncertain label; raw class/confidence/margin/entropy are report-only.                                           |
| F08–F09 | Saved result appears in Recent and History; Details shows matching data.                                                                            |
| F10     | Recent shows the latest four records; History shows six per page.                                                                                   |
| F11     | Search/filter and previous/next navigation work; deleting the last item on a page recovers to a valid page.                                         |
| F12     | Reload preserves records and photos.                                                                                                                |
| F13     | Re-uploading identical bytes opens the original record; there is no extra record or repeated rejection/inference log.                               |
| F14     | Long result badges stay inside the photo and Close stays reachable at narrow, landscape, and desktop sizes.                                         |
| M01     | All eight supplied photos run through the real model and app; record predicted/expected labels and score diagnostics separately from UI assertions. |

Controlled tests replace only the model response with fixed scores. They exercise the real classifier gates, UI, local storage, and client sync against a mock service. Real-model and offline cases use the actual exported model assets. No test changes the classifier's resizing, normalization, precision, or rejection rules.

## Fixture and report interpretation

`tools/e2e/fixtures/photos/` contains byte-verified copies of the eight supplied photos. Original Downloads files are never changed. `manifest.json` records hashes and provisional labels from the user's filenames; expert label verification is pending. Do not edit expected labels to make predictions look correct. These few examples are smoke coverage, not a representative accuracy dataset or new independent test set.

HTML reports live under ignored `playwright-report/e2e/` or `playwright-report/reliability/`. JSON, screenshots, and failure traces are under ignored `test-results/`. Save formal evaluation evidence outside these replaceable run folders before another run. Reports may contain input photos and scan output.

M01 attaches the original photo, screenshot, supplied label, prediction, raw top class, confidence, margin, normalized entropy, failed gates, timing, backend, browser, model version, and application-input fingerprint. The separate test-only harness imports the production classifier and observes its actual output; it is never bundled into the app. Rejection console messages contain four-decimal rounded values. The harness records full JavaScript numeric values.

A correctly displayed wrong diagnosis passes UI assertions but is marked as a model-label mismatch in its report. Review all such observations before adopting a model. Consistency can also pass for consistently wrong predictions. Formal accuracy/OOD evaluation and confidence intervals need suitable expert-reviewed, independent data.

## Reliability protocol

| ID  | Automated scope                                                                                                                                                                  | Pass condition / limitation                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | 30 sequential actual classifier calls per photo in one browser session; duplicate lookup is not involved.                                                                        | Stable raw top class and displayed class/acceptance; confidence range no greater than 0.001; no net tensor growth. This is a predeclared regression tolerance, not proof across devices or cold starts.                                                                                             |
| R02 | Activate the real worker, confirm cached page/config/model shards, save a scan online, disconnect, reload history, diagnose a different unscanned file, reload again, reconnect. | History/photos survive; new inference and storage succeed offline; queued rows and exact uploaded photo bytes are verified on the local mock after reconnect. Initial caching is required. Automated SW instrumentation runs on Chromium.                                                           |
| R03 | 30-minute loop of real inference, Details, History, deletion, and periodic reloads.                                                                                              | No unexpected errors/crashes, stuck scans, or incorrect record counts. Records are deliberately deleted after checks so later uploads cannot use duplicate shortcuts. Durations and available heap measurements are recorded for review, not presented as a validated memory/performance threshold. |
| R04 | Chromium desktop/mobile and Firefox run scan workflows; WebKit runs navigation and mobile-control checks only because its Windows runner cannot exercise this WebGL TFJS path.   | Viewport/browser coverage only. Actual device models, OS/browser versions, inference, camera permissions, heat, and background behavior need manual checks.                                                                                                                                         |

Test inputs, repetitions, and pass conditions should be fixed before formal evaluation. Do not loosen them after failure merely to obtain a pass. Record investigated failures and any revised protocol as a new evaluation run.

The manuscript calls for extended use but does not specify a duration. The development team selected 30 minutes as this project's R03 protocol; it is not a duration required by the manuscript.

R03 writes `endurance-progress.json` after each completed cycle inside its ignored test output. It preserves partial evidence if a laptop, browser, or runner stops early; only a completed 30-minute report is an R03 pass.

## Physical-device checklist

Use [PHYSICAL_RELIABILITY_CHECKLIST.md](PHYSICAL_RELIABILITY_CHECKLIST.md) as the fillable result sheet for every candidate, device, browser, and test date. Fill all expected/actual results; do not pre-mark passes. Record commit ID, deployment URL, input fingerprint/model hashes, app/model versions, test date, tester, device model, OS, browser/version, installed-PWA or browser mode, network condition, photo hash, evidence location, and pass/fail/blocker reason. [PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md) shows answer style only; it is not evidence.

Run core E2E and the full automated reliability suite (R01 and R03) for the candidate before recording physical-device results. If R01 and R03 run separately, preserve each report before the next run replaces it. For checklist statuses, an observed application crash or incorrect behavior is `Fail`; an observation prevented by missing access, inputs, or evidence is `Blocked`. A recorded failure takes precedence over a block when summarizing a case.

The supplied inference harness is served on this computer's loopback address only. Physical testers can use the checklist's delete-and-reupload procedure; running the harness on a phone would require a separately configured device-capable runner. The manual procedure records displayed label/acceptance and visible confidence, not automated R01's raw-score tolerance.

| Case    | Steps                                                                                                                                                                                  | Expected result                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01-M01 | Run repeatability on real-device hardware using a device-capable runner/harness; alternatively use a dedicated test browser/profile and clear only its test history between reuploads. | Each trial really invokes inference; record class/acceptance and score variation. Reopening a duplicate report is not evidence. Re-cache before any later offline case. |
| R02-M01 | Load and scan online; wait for caching. Enable airplane mode and ensure Wi-Fi is also off. Close/reopen installed PWA, inspect history, then scan a different photo.                   | App opens, photos/history remain, new diagnosis saves offline. Record app/model version to rule out stale caches.                                                       |
| R02-M02 | Reconnect and observe pending test scans and any test deletions.                                                                                                                       | Changes eventually synchronize without duplicate or resurrected records. Use a designated test backend/device identity and verify server state.                         |
| R03-M01 | Use app for at least 30 minutes: scan, navigate, rotate, background/resume, switch network, and reopen.                                                                                | No crashes, lost records, persistent freeze, or stuck scanner. Record heat/slowdown and timing observations.                                                            |
| R04-M01 | Take Photo, grant/deny permission, cancel picker, upload from gallery, Retake, rotate, and view each result.                                                                           | Correct picker and photo; controls/badges remain usable. Denial/cancellation does not create a scan or leave it stuck.                                                  |
| R04-M02 | Repeat checklist on each available target phone/OS/browser combination.                                                                                                                | Report exactly what was tested; one emulated browser is not coverage of all phones.                                                                                     |

Manual result template:

```text
Candidate / commit / deployment URL:
App version / model version / model hashes:
Device / OS / browser / mode / network:
Tester / date / photo hashes:
Case ID:
Steps performed:
Expected:
Actual:
Pass / Fail / Blocked:
Evidence and issue link:
```

## Isolation and limits

The test server listens only on `127.0.0.1:4173`. Fresh browser contexts isolate IndexedDB/localStorage; test builds point to a local mock Supabase-compatible HTTP/WebSocket service. A restrictive connection policy blocks unexpected external requests. This proves client workflows only, not actual Supabase permissions, RLS, Storage reliability, or remote synchronization. No production credentials are needed or printed.

Controlled UI tests disable service-worker support to keep model interception deterministic. R02 explicitly allows and verifies the generated service worker. Manual staged deployments use Production environment variables: staging traffic does not create an isolated database. Use approved test identities/data for live integration checks.

## Release decision

See [MODEL_VERSIONING.md](MODEL_VERSIONING.md#candidate-testing-and-promotion) for candidate labels, evidence, Vercel staging, and exact-commit promotion. Updating a version or pushing candidate documentation is not evidence that testing passed. CI, reliability, physical-device checks, and model evaluation each cover different release requirements.

References: [Playwright CI](https://playwright.dev/docs/ci), [emulation](https://playwright.dev/docs/emulation), [service workers](https://playwright.dev/docs/service-workers), and [Vercel staged promotion](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).

# MANGOLEAF AI: CODEBASE REVIEW GUIDE

## Purpose

After cloning and setting up the repository, reference `@docs/CODEBASE_REVIEW.md` in the AI agent and write your own initial request. Attaching the file also works where the agent does not support `@` references. The agent reads the instructions in this guide and reviews the actual codebase; no separate prompt template needs to be copied.

The first task is **read-only analysis of the application**. Its result should explain how the application works, identify supported findings, and prepare recommendations for discussion. It does not authorize repairs, refactoring, database changes, or deployment. The agent must ask how to deliver the report and whether a separate technical Q&A file is wanted. Selecting a file export allows only the output-related writes described below.

Prepared on **October 5, 2026**. The agent must read the versions and behavior from the coworker's actual checkout instead of assuming that this document describes the latest release.

This guide lives outside `docs/local-ignored-files/` and is not covered by that folder's `.gitignore` rule. Once committed and included in the cloned revision, the guide is available to coworkers through Git. Generated review and Q&A files saved in `docs/local-ignored-files/` remain local-only.

## 1. How to use this file

1. Clone the repository and follow [SETUP.md](../SETUP.md). That guide contains the installation and local configuration instructions.
2. Open the cloned repository as the AI agent's working folder. Use your local path, not another developer's Windows path.
3. Reference `@docs/CODEBASE_REVIEW.md` or attach this file, then write your own initial prompt describing the review you want. The guide supplies the detailed instructions below.
4. Answer the agent's output question: choose CLI text only, Markdown, a text file, PDF, or another supported format. For a file, choose your Desktop or the repository's `docs/local-ignored-files/` folder. The agent creates that local folder if needed and adds its `.gitignore` rule if it is missing.
5. Answer the separate Q&A question. If you want that file, choose its format and location independently; they do not have to match the review report. Its filename must be `TECHNICAL_Q_AND_A` with the chosen extension, such as `.md`, `.txt`, or `.pdf`.
6. Read the resulting report and any requested Q&A before assigning a separate implementation task. When both outputs are saved, they must be two separate files: the review analysis and the technical Q&A. Keep the review and the decision to change the application separate.

## 2. Review instructions for the AI agent

### Context and language

Read this guide and the repository's `AGENTS.md`, then use the coworker's accompanying request to determine the review's scope and emphasis. For a complete codebase review, follow all eight phases below. If a narrower review is requested, state its scope and which areas were inspected. This guide does not authorize application changes.

The purpose is to understand the current application before making changes. Its intended users include mango farmers with limited technical knowledge and low-end devices.

Explain the entire review in plain English or layman's terms. Assume the reader may be unfamiliar with programming, databases, and machine learning. Define a necessary technical term when first using it, give a simple everyday example where helpful, and explain what it means for the person using the app. For example, explain a "pending upload" as a saved report waiting to be copied online. Keep the facts accurate; put file references after the explanation instead of replacing the explanation with code or technical labels.

### Scope and boundaries

- Application analysis is read-only. Read files and inspect repository metadata, but do not change application code, existing documents, assets, configuration, or generated output. The only writing exception is the selected review and/or Q&A output, its required local folder, and the narrowly scoped .gitignore addition described below. Replacing an existing output requires explicit authorization. Do not stage files.
- Do not commit, push, tag, publish, deploy, or change remote services. Do not execute SQL, modify Supabase settings, or send messages to other people.
- Do not automatically install packages, start servers, run builds/tests, run notebooks, or execute training workflows during this review. Inspect existing test definitions and recorded results; propose applicable verification separately.
- Follow the root AGENTS.md and any instructions belonging to a directory you inspect. Treat video/ as a separate project and read its own AGENTS.md before reviewing it.
- Do not read or print secret-bearing environment files, saved session tokens, real private scan records, or private backups. Use .env.example for configuration names and tracked schema/security documents for the recorded cloud contract.
- Distinguish repository evidence from live-service evidence. A SQL file or dated verification receipt does not establish today's Supabase configuration. A version label does not prove that version is deployed.
- Do not change model inputs, class order, thresholds, or saved assets to resolve a suspected issue. Identify the issue and explain what evidence would be needed.
- Use repository source as evidence for current behavior. Treat documentation and comments as claims to check, not automatic proof. If evidence is missing or contradictory, state that clearly.
- Do not stop after reading README.md or a few large files. Complete the phases below and record coverage. If context becomes limited, continue from the remaining phases without repeating completed work.

### Output choice and limited file export

Ask this question once before the review, unless the user has already clearly chosen the output format and destination:

"How would you like the review delivered: text here in the CLI only, a Markdown (.md) file, a plain text (.txt) file, a PDF (.pdf), or another format? If you want a file, should I save it on your Desktop or in this repository's docs/local-ignored-files/ folder?"

Also ask the following separate question, unless the user has already answered it:

"Would you also like a separate technical questions-and-answers file based on this review? If yes, which format should it use: Markdown (.md), plain text (.txt), PDF (.pdf), or another format? Should I save TECHNICAL_Q_AND_A with that extension on your Desktop or in this repository's docs/local-ignored-files/ folder?"

Keep the two choices independent. Selecting a review export does not automatically request a Q&A file, and selecting Q&A does not change the review's chosen format or destination. The questions can be presented together, with each output clearly labeled.

You can continue the read-only analysis while waiting for the user's answers. If no review preference arrives, return the review in the CLI only. If the user declines Q&A or does not answer its question, do not generate a Q&A file. Do not treat silence as permission to create files or edit .gitignore.

Follow the selected option:

1. CLI text only for the review: return the complete review here and create no review file. If Q&A was separately requested, handle only that file according to its own choice. If neither output requires a file, create no output folder and make no .gitignore change.
2. Desktop file: resolve the current coworker's actual Desktop location, including a redirected Desktop if applicable. Do not reuse another developer's path. If the destination cannot be identified, ask for the exact path before writing. Follow the environment's permission requirements for writes outside the workspace.
3. Repository file for either output: create or reuse docs/local-ignored-files/ underneath the current repository root. Check the repository's existing .gitignore first. If that folder is not already ignored, append /docs/local-ignored-files/ to the root .gitignore while preserving existing rules and unrelated changes. Do not add a duplicate rule. Verify that Git ignores each selected output, for example using git check-ignore on its path. Do not force-add outputs, stage .gitignore, or untrack existing files. Preserve any existing tracked file; resolve output-name conflicts using the rules below.
4. Missing preference: if a file was requested but its format or destination is unclear, ask only for the missing information. Continue analysis, but wait for that answer before saving a file.

Choosing a repository export for either file also authorizes the required local folder and missing ignore rule; do not ask for the same approval again. If both files use that folder, reuse it and verify the ignore rule once. If all selected outputs are Desktop files or CLI text, no .gitignore edit is authorized. Output export never authorizes application fixes, model changes, or remote writes.

Use separate uppercase filenames with the correct extensions:

- Review analysis: MANGOLEAF_AI_CODEBASE_REVIEW.md, .txt, .pdf, or the selected extension. Preserve an existing review by choosing a new name with a date or sequence number.
- Technical Q&A: TECHNICAL_Q_AND_A.md, TECHNICAL_Q_AND_A.txt, TECHNICAL_Q_AND_A.pdf, or TECHNICAL_Q_AND_A with another selected extension. Use this exact base name; ".filetype" is a placeholder, not a literal extension. If the selected destination already contains that filename, ask whether to use the other allowed location or explicitly replace the existing Q&A. Do not silently overwrite or rename it, append answers to it, or discard existing questions.

When both outputs are exported, create two separate files even if they use the same format and folder. Never combine the review and Q&A into one file. Honor different formats or destinations if selected. If the review is CLI-only and Q&A is exported, provide the review here and save only the requested Q&A file.

Complete the analysis before preparing the final outputs. A review export must contain the full plain-English analysis and supporting references, not just a short summary. A Q&A export must contain its own complete questions and answers. For PDF or another conversion format, use available tools and verify that each output is a genuine, readable file in that format; do not rename a Markdown/text file to pretend it is a PDF. If an export is unavailable, explain the limitation, provide its content in the CLI, and ask whether a supported format would be useful. Do not install export tools without authorization.

After saving, identify each output separately: its purpose, format, actual destination, and clickable file path where supported. Report any .gitignore addition once. Keep the application review findings and the small list of output-related writes separate so the user can see exactly what changed.

### Optional technical Q&A content

Generate this only when the user requests it. Base it on the completed review of this checkout, not on assumed behavior or a copied older Q&A.

- Use a clear title, numbered questions, and topic headings. Avoid repeated questions and explain every answer in plain English or layman's terms.
- Cover the application's purpose and technology stack; browser versus backend responsibilities; local/cloud databases and photo storage; UUIDs and guest ownership; diagnosis timing; duplicate checks; offline use, reconnection, guidance updates, and deletion; the active model's classes and rejection rules; recorded training/evaluation evidence; performance limits; and version/release behavior.
- Include training methods, dataset counts, augmentation, class weighting, epochs, temperature calibration, and threshold fitting only to the extent supported by the inspected records. Label missing evidence instead of inventing numbers or outcomes.
- Give simple examples where helpful. Keep user-action and data-flow answers free of source code. Put supporting file references in a separate reference section so readers can understand an answer without opening the code.
- State the reviewed date, commit, and source versions, and distinguish them from the live deployment. Preserve the review's uncertainty and evidence limits in the Q&A.
- Explain model confidence versus accuracy, raw versus accepted results, and unsupported-photo limitations accurately. Do not turn an identified issue into a claim that a fix has already been implemented.
- Make the Q&A understandable as a standalone document; do not replace an answer with "see the review report." Ensure both outputs agree on the facts.

### Phase 1: Establish the checkout and repository map

1. Read AGENTS.md, README.md, SETUP.md, package.json, and the relevant configuration files.
2. Identify the working folder, branch, commit, and whether the working tree has existing changes. Preserve those changes. Report metadata without dumping sensitive file contents.
3. Read the current application version from package.json and the model label/class mapping from the application constants. Check the exported model configuration and manifests against that mapping.
4. Map application source, components, hooks, shared helpers, assets, model files, cloud SQL, tests, documentation, notebooks, and the separate video project. Explain the purpose of each important directory.
5. Separate first-party source, historical evidence, generated output, third-party dependencies, and local-only files. Do not treat a missing ignored folder or dataset after cloning as an application defect.
6. Read the relevant installed Next.js documentation when assessing framework behavior. Use the installed version, not conventions remembered from older releases. If those guides are unavailable, state the gap instead of silently assuming behavior.

### Phase 2: Follow the application's user actions

Trace each action through its actual handlers, state changes, helpers, database operations, and display updates:

- Startup: app loading, model/config loading, warmup, failure handling, and the transition into the usable interface.
- Home, About, and History: tab selection, recent records, pagination, search, filtering, counts, and details.
- Photo selection: camera/gallery choice, review preview, original-file fingerprint, duplicate lookup, retake, cancel, close, and Escape behavior.
- Diagnosis: the exact action that starts classification, readiness checks, rapid-click guards, image preparation, prediction, acceptance rules, compression, local saving, and result display.
- Duplicate results: eligible current-model reports, older/unlabeled reports, reports pending deletion, and rechecks before inference or opening a saved result.
- Guidance: English/Bisaya selection, healthy-class mapping, downloaded advice, missing-guidance messages, and the separate uncertain-result reminder.
- Deletion: local removal or a hidden pending-deletion record, including deletion during upload or download.

Explain what happens if any of these steps fails. Distinguish startup's dummy warmup from diagnosis of the selected photo. Do not describe the app as continuously classifying camera frames unless the code actually does that.

### Phase 3: Explain storage and data flow

Inspect the local schema and cloud synchronization logic. Explain:

- IndexedDB and Dexie: which records and photo bytes are local, their fields/indexes, schema upgrades, and how the UI observes changes.
- Cache Storage and the service worker: which application/model responses are saved, production versus development behavior, updates, and private-request cache exclusions.
- localStorage: small preferences, the browser label, and persisted guest-session information, without exposing actual values.
- Supabase PostgreSQL versus Storage: structured report/guideline rows versus private photo files.
- Scan UUIDs, cloud IDs, browser/device IDs, verified owner IDs, and image fingerprints. Identify which values label records and which verified session controls access.

Provide numbered, plain-English flows for:

1. A new diagnosis while staying offline.
2. A new diagnosis while staying online.
3. Offline use followed by reconnection.
4. Deleting a report while offline or during cloud work.
5. Receiving updated guidance while online and after reconnecting.

For each flow, identify where data is read, where it is saved, what happens immediately, what waits for a connection, and what is retried. Explain the prior-download requirement for offline use. Do not imply that installation guarantees all offline files remain available forever.

### Phase 4: Review cloud ownership and synchronization

Read the cloud client, guest-session manager, sync hook/helpers, service-worker rules, recorded SQL, and security documentation.

- Identify every synchronization trigger, retry delay, timeout, lock, and follow-up pass.
- Explain how public guideline downloads remain separate from private scan authentication.
- Trace photo upload, cloud-row creation, local success marking, owned-record restoration, and cloud/local deletion cleanup.
- Check that private access relies on the verified guest owner rather than the caller-controlled device label.
- Check private owner folders, stored photo paths, authorized downloads, and handling of legacy unowned records.
- Check how failed or stale sessions affect pending work, and whether changing identity could wrongly transfer ownership.
- Inspect deletion/upload races, partial failures, repeated requests, and whether a deleted report could reappear.
- Explain HTTPS/API requests and guidance WebSocket notifications in plain English.
- Describe recorded tables, columns, grants, RLS policies, and Storage rules. Clearly mark anything that requires a separate live-service check.

Do not claim that anonymous sign-in verifies a farmer's real identity, that a UUID is a password, or that knowing an old device ID recovers another guest's scans.

### Phase 5: Review the active model and preserved training evidence

- Identify the active model bundle, its file roles, class order, input preparation, output interpretation, fitted configuration, and saved number formats.
- Explain confidence, margin, entropy, temperature calibration, and the uncertain/unrecognized outcome. Verify actual values and fallback behavior from the current files.
- Check whether preview resizing, model resizing, and storage compression are different operations. Confirm when each occurs.
- Inspect the adopted version's training and threshold-fitting notebooks as saved documents, without executing them. Review relevant plans, ledgers, manifests, audits, figures, and evaluation artifacts.
- Explain dataset split counts, duplicate checks, augmentation recipes, background replacement, class weights, training stages, completed epochs, checkpoint selection, and calibration/fitting order where recorded.
- Distinguish the current adopted model from older and experimental models. Do not treat notebook version numbers as application versions.
- Separate raw classification metrics, accepted/rejected outcomes, and out-of-scope false accepts. Explain the evaluation data and limitations behind reported accuracy, precision, recall, and F1 scores.
- Do not call confidence an accuracy measurement or treat browser repeatability as proof of agricultural accuracy. Do not install a historical Colab package snapshot as a current training environment.

### Phase 6: Review performance and maintainability

Inspect current code paths and compare them with the recorded performance review. Consider:

- Model loading/reuse, startup deadlines, retry recovery, failed loads, and tensor cleanup on success and failure.
- Original-photo reading, hashing, decoding, resizing, compression, working memory, and temporary image URLs.
- Recent/History queries, full-collection reads, sorting, pagination, image loading, and URL stability after metadata changes.
- React state, effects, subscriptions, repeated renders, cleanup, modal scroll behavior, and accessibility.
- Cloud refresh frequency, unchanged guidance writes, authentication events, reconnect events, hidden-page work, and overlapping tasks.
- Dynamic imports, saved asset downloads, service-worker updates, and cache behavior.
- Shared-helper boundaries, component organization, reusable icons, translated strings, and comments explaining non-obvious behavior.

For every performance concern, identify the exact work performed and why it might matter. Distinguish a source finding from a measurement. Do not invent a speed improvement, CPU/GPU percentage, memory total, heat reduction, or battery result. Avoid recommending a new abstraction merely because a file is long; explain what repeated responsibility it would separate.

### Phase 7: Review tests, security checks, and release records

- Read the actual developer scripts, test files, Playwright setup, fixture manifest, mock backend, Git hooks, and GitHub workflows.
- Map tests to important behaviors, including duplicate handling, offline use, private ownership, deletion races, image stability, and model diagnostics.
- Separate controlled UI scores, actual saved-model observations, repeatability checks, and model accuracy/OOD evaluation.
- Verify which commands build isolated test output and which checks run in hooks versus CI. Do not direct automated scans at production Supabase.
- Read the dependency-security review and preserved alert inventory. Distinguish active application dependencies from historical training-package evidence. Do not assume a recorded remediation closed every current remote alert.
- Read the separate PWA/model version guides. Distinguish candidate preparation, local verification, remote CI, production promotion, and tag/release publication.
- Report only recorded checks and their source snapshots. Do not claim a fresh test pass, deployment, or completed evaluation during this read-only review.

### Phase 8: Deliver the report

Use the following structure:

1. Summary in plain English: what the application does, where diagnosis runs, which services it uses, and its important limits.
2. Checkout identity and coverage: branch/commit, source versions, areas inspected, missing material, and anything intentionally outside scope.
3. Repository map: important folders/files and their responsibilities.
4. User-action and data-flow explanations: the numbered flows requested above, including failures and retries. Keep these explanations free of code; put source references beside or after them.
5. Verified findings: explain current behavior with repository-relative file and line references. Identify saved-document claims separately from code evidence and live-service unknowns.
6. Issues, if found: use a table with priority, concrete trigger, observed behavior, user impact, evidence, and the smallest reasonable proposed correction. Distinguish confirmed defects, possible issues needing reproduction, and optional improvements. Do not invent issues to fill the table.
7. Model evidence and limits: identify the active bundle, recorded training/evaluation results, and what those results do and do not establish.
8. Verification recommendations: list the applicable existing checks and what each would prove. Label every check not run during this review as not run. Do not schedule unrequested long sessions.
9. Suggested next steps: prioritize supported recommendations and explain which would affect code, configuration, documentation, or cloud resources. Do not apply them.

Use clear headings and short paragraphs. Explain necessary technical terms the first time you use them. Avoid buzzwords and unexplained abbreviations. Keep evidence close to each claim. State uncertainty when access or evidence is missing instead of guessing.

Deliver the complete review using its chosen output option. If technical Q&A was requested, prepare it from the verified review and deliver it separately using its independently chosen format and destination. For CLI-only review output, return the review here without creating a review file. For each selected export, provide its saved path and a short completion summary here. Finish by confirming that application analysis was read-only, listing any access limitations, and identifying every output-related file or folder created or changed, including a .gitignore addition if required. Do not claim the entire repository was unchanged if you added that rule or replaced an explicitly authorized existing output.

## 3. How to assess the resulting review

A useful review should:

- Explain the actual photo-to-result workflow and where each kind of data is stored.
- Cover the source, tests, configuration, and relevant model evidence, rather than repeating the README.
- Cite files and lines for implementation findings while keeping the main explanation readable.
- Separate confirmed behavior, recorded measurements, suspected defects, and optional improvements.
- Identify missing access or evidence without treating assumptions as facts.
- Preserve the distinction between local diagnosis, public guidance downloads, and guest-owned private synchronization.
- Keep any requested Q&A separate from the review, use `TECHNICAL_Q_AND_A` with the chosen extension, and retain the independently selected format and destination.
- Leave the application and remote services unchanged. If file exports were selected, create only the requested outputs and required local folder, add the folder's ignore rule only when missing, and list those changes clearly. Preserve existing outputs unless replacement was explicitly authorized.

If an answer is unclear, ask the agent to explain that finding in simpler language, identify the triggering user action, and show the supporting file references. If part of the repository was skipped, ask it to continue from the missing areas without repeating completed work or implementing changes.

## 4. Reference documents included in a normal clone

These documents help the agent navigate the repository. It must still check implementation claims against the source.

- [Repository instructions](../AGENTS.md)
- [Application overview](../README.md)
- [Setup instructions](../SETUP.md)
- [Architecture and data flow](ARCHITECTURE.md)
- [Performance mechanisms and dated review](PERFORMANCE.md)
- [Functional and browser-test guide](testing/TESTING.md)
- [Supabase ownership, security, and synchronization](security/SECURITY-AND-SYNC.md)
- [Dependency-security review](security/DEPENDENCY_SECURITY.md)
- [App version rules and release steps](versions/PWA_VERSIONING.md)
- [Full app release history](versions/history/PWA_RELEASE_HISTORY.md#release-timeline)
- [Active model, version rules, and adoption steps](versions/AI_MODEL_VERSIONING.md)
- [Full model history and training records](versions/history/AI_MODEL_HISTORY.md#model-timeline)
- [Notebook organization](../notebooks/README.md)

Files in `docs/local-ignored-files/`, including generated technical Q&A and review reports, may help if separately shared. They are optional local references, not files guaranteed to exist after cloning.

# MangoLeaf AI PWA Versioning Guide

Use this guide to choose an app version and prepare its release. For earlier releases, measurements, and original commit templates, use the [release history](history/PWA_RELEASE_HISTORY.md#release-timeline).

## Current repository snapshot

| Item                  | Last recorded state                                                               |
| --------------------- | --------------------------------------------------------------------------------- |
| App version           | `0.8.0` candidate, from `package.json`                                            |
| Adopted AI model      | `v4.5.0`                                                                          |
| Candidate preparation | Square guided camera, October 19, 2026; candidate commit not yet recorded         |
| Local validation      | Build, security, tooling, export, recorded core cases, and R01 pass               |
| Production status     | Candidate; final-commit CI, device validation, publication, and promotion pending |

Version `0.8.0` prepares a square camera preview with matching capture, bounded sizing, and rounded green corner guides. It retains the adopted V4.5.0 model. See its [candidate release record](history/PWA_RELEASE_HISTORY.md#v080-square-camera-prepared-release-october-19-2026) for the release text and validation status. The [v0.7.0 record](history/PWA_RELEASE_HISTORY.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026) preserves the preceding diagnostics and confidence changes.

The maintainer's local V5 model override is separate from this app candidate. Exclude its `public/model/`, `src/lib/constants.ts`, and `src/sw.ts` changes from the release. Generate the candidate's `public/sw.js` from the exact V4.5.0 release source and assets; do not commit the worker produced by the local V5 build.

The current preparation changes files and supplies release text only; it does not stage, commit, push, create a tag, publish a release, or promote a deployment. The [candidate validation record](../testing/TESTING.md#v080-square-camera-release-candidate-october-19-2026) distinguishes the isolated V4.5.0 candidate from the maintainer's V5 working tree, records the initial browser failures and focused repairs, and keeps R03 and physical-device evidence pending.

## Version labels and release rules

The app and AI model have separate version numbers:

- **App version:** identifies the interface and application behavior. Edit `version` in `package.json`; the build supplies the footer label through `next.config.ts`.
- **Model version:** identifies the adopted model bundle. Its label comes from `src/lib/constants.ts`; follow the [model guide](AI_MODEL_VERSIONING.md) when replacing it.
- Keep these labels out of environment files and hosting settings. Both are included at build time, so changing either requires a rebuild.

For app releases before `1.0.0`, use these project examples:

| Change                                      | Example            |
| ------------------------------------------- | ------------------ |
| Small fix to an existing release            | `0.6.0` to `0.6.1` |
| Substantial feature or workflow update      | `0.6.1` to `0.7.0` |
| First approved stable, field-tested release | `1.0.0`            |

Give changed shipped builds distinct labels. Older patch releases sometimes included features; their original decisions remain in the history. Documentation-only changes do not require an app or model version bump.

## Candidate testing and promotion

A **candidate** is a proposed release. A pushed commit, published GitHub tag, and live production deployment are separate events.

1. **Prepare the candidate.** Finalize source, version labels, and affected documentation together. Preserve existing user data and any model rollback files.
2. **Check the final source.** Run the commands below. Complete the approved browser and reliability scope in [TESTING.md](../testing/TESTING.md); record physical-device results in the [device checklist](../testing/PHYSICAL_RELIABILITY_CHECKLIST.md) when they are part of that scope. R03 is an explicit 30-minute session, not part of the core suite.
3. **Commit and push the candidate.** Keep Git hooks enabled. If formatting or another edit changes application inputs, rebuild and repeat affected checks.
4. **Check the staged deployment.** For manual promotion, confirm Vercel's **Auto-assign Custom Production Domains** is disabled for the Production branch. A staged Production build still uses Production environment variables.
5. **Wait for CI and required approval.** Match the commit, deployment URL, app/model labels, asset hashes, and recorded results. A version number alone does not prove a build was tested or deployed.
6. **Promote and verify.** Promote that exact tested deployment, then confirm the live app/model labels and intended cached assets. Publish the tag and release for the tested commit.

Run formatting first, then keep the required check order:

```bash
bun run format
bun run typecheck
bun run lint
bun run build
```

Also run the applicable security, export, tooling, browser, and reliability checks from [the testing guide](../testing/TESTING.md). First-time tooling installation is covered in [SETUP.md](../../SETUP.md#local-security-checks-and-github-ci).

**If a check fails:** fix the candidate and repeat affected checks. Identify attempts by commit and asset hashes. Never move a published tag to conceal a failed attempt, and never describe pending checks as passed.

## Creating a GitHub Release

- Use the exact approved commit. Replace `vX.Y.Z` and `TESTED_COMMIT_SHA` below; do not reuse a published tag.
- If the approved local tag already exists, verify its target and push it rather than recreating it.
- In GitHub, open **Releases**, choose **Draft a new release**, and select the pushed tag. Describe the change, validation, and material limitations.
- A GitHub Release does not deploy the PWA. Only app tags receive GitHub Releases; model tags are separate provenance records.

```bash
git tag -a vX.Y.Z TESTED_COMMIT_SHA -m "MangoLeaf AI vX.Y.Z"
git push origin vX.Y.Z
```

When adopting a different model, follow the [model adoption checklist](AI_MODEL_VERSIONING.md#model-replacement-checklist) and create its provenance tag on the commit containing the reviewed assets.

## App Releases

- [Full release index and historical status](history/PWA_RELEASE_HISTORY.md#app-releases)
- [Chronological release records](history/PWA_RELEASE_HISTORY.md#release-timeline)
- [Current candidate: v0.8.0 square guided camera](history/PWA_RELEASE_HISTORY.md#v080-square-camera-prepared-release-october-19-2026)
- [Latest recorded handoff: October 18, 2026](history/PWA_RELEASE_HISTORY.md#october-18-2026-v070-scanner-follow-up-and-branch-handoff)

Historical records retain their original dates, measurements, and status. Use them as evidence for those builds, not as confirmation of today's production state.

<details>
<summary>Links from older documents</summary>

Older section bookmarks still resolve here. Each link opens the complete archived record.

- <a id="contents"></a> [Contents](history/PWA_RELEASE_HISTORY.md#contents)
- <a id="release-timeline"></a><a id="reading-the-release-history"></a> [Release timeline](history/PWA_RELEASE_HISTORY.md#release-timeline)
- <a id="earlier-app-milestones-v010v046"></a> [Earlier app milestones: v0.1.0–v0.4.6](history/PWA_RELEASE_HISTORY.md#earlier-app-milestones-v010v046)
- <a id="v047-history-pagination-and-scan-details"></a> [v0.4.7: history pagination and scan details](history/PWA_RELEASE_HISTORY.md#v047-history-pagination-and-scan-details)
- <a id="v048-scan-photo-fix-and-reliability-testing"></a> [v0.4.8: scan photo fix and reliability testing](history/PWA_RELEASE_HISTORY.md#v048-scan-photo-fix-and-reliability-testing)
- <a id="v049-adoption-of-v430-combined"></a> [v0.4.9: adoption of V4.3.0 Combined](history/PWA_RELEASE_HISTORY.md#v049-adoption-of-v430-combined)
- <a id="october-3-2026"></a> [October 3, 2026](history/PWA_RELEASE_HISTORY.md#october-3-2026)
- <a id="v050-private-cloud-synchronization-candidate-october-3-2026"></a><a id="v050-changes-included"></a><a id="changes-included"></a><a id="v050-validation-and-publication"></a><a id="validation-and-publication"></a><a id="v050-prepared-commit-message"></a><a id="prepared-commit-message"></a><a id="v050-prepared-tag-and-release-description"></a><a id="prepared-tag-and-release-description"></a> [v0.5.0: private cloud synchronization candidate (October 3, 2026)](history/PWA_RELEASE_HISTORY.md#v050-private-cloud-synchronization-candidate-october-3-2026)
- <a id="v051-scan-thumbnail-stability-candidate-october-5-2026"></a><a id="v051-changes-included"></a><a id="changes-included-1"></a><a id="v051-validation-and-publication"></a><a id="validation-and-publication-1"></a><a id="v051-prepared-commit-message"></a><a id="prepared-commit-message-1"></a><a id="v051-prepared-tag-and-release-description"></a><a id="prepared-tag-and-release-description-1"></a> [v0.5.1: scan-thumbnail stability candidate (October 5, 2026)](history/PWA_RELEASE_HISTORY.md#v051-scan-thumbnail-stability-candidate-october-5-2026)
- <a id="v052-scan-history-and-deletion-candidate-october-6-2026"></a><a id="v052-changes-included"></a><a id="changes-included-2"></a><a id="v052-validation-and-publication"></a><a id="validation-and-publication-2"></a><a id="v052-prepared-commit-message"></a><a id="prepared-commit-message-2"></a><a id="v052-prepared-tag-and-release-description"></a><a id="prepared-tag-and-release-description-2"></a> [v0.5.2: scan History and deletion candidate (October 6, 2026)](history/PWA_RELEASE_HISTORY.md#v052-scan-history-and-deletion-candidate-october-6-2026)
- <a id="unreleased-guideline-synchronization-fix-october-7-2026"></a> [Unreleased guideline synchronization fix (October 7, 2026)](history/PWA_RELEASE_HISTORY.md#unreleased-guideline-synchronization-fix-october-7-2026)
- <a id="v053-guideline-update-ordering-candidate-october-7-2026"></a><a id="v053-changes-included"></a><a id="changes-included-3"></a><a id="v053-validation-and-publication"></a><a id="validation-and-publication-3"></a><a id="v053-prepared-commit-message"></a><a id="prepared-commit-message-3"></a><a id="v053-prepared-tag-and-release-description"></a><a id="prepared-tag-and-release-description-3"></a> [v0.5.3: guideline update ordering candidate (October 7, 2026)](history/PWA_RELEASE_HISTORY.md#v053-guideline-update-ordering-candidate-october-7-2026)
- <a id="release-status-confirmation-october-7-2026"></a> [Release status confirmation (October 7, 2026)](history/PWA_RELEASE_HISTORY.md#release-status-confirmation-october-7-2026)
- <a id="v054-unchanged-guidance-check-prepared-release-october-7-2026"></a><a id="v054-changes-included"></a><a id="changes-included-4"></a><a id="v054-validation-and-identity"></a><a id="validation-and-identity"></a><a id="v054-prepared-commit-message"></a><a id="prepared-commit-message-4"></a><a id="v054-prepared-tag-and-release-notes"></a><a id="prepared-tag-and-release-notes"></a> [v0.5.4: unchanged guidance check prepared release (October 7, 2026)](history/PWA_RELEASE_HISTORY.md#v054-unchanged-guidance-check-prepared-release-october-7-2026)
- <a id="local-development-changes-october-9-2026"></a> [Local development changes, October 9, 2026](history/PWA_RELEASE_HISTORY.md#local-development-changes-october-9-2026)
- <a id="v055-guided-camera-and-installation-prepared-release-october-10-2026"></a><a id="v055-changes-included"></a><a id="changes-included-5"></a><a id="v055-validation-and-identity"></a><a id="validation-and-identity-1"></a><a id="v055-prepared-tag-and-release-description"></a><a id="prepared-tag-and-release-description-4"></a><a id="nextjs-security-follow-up-october-10-2026"></a> [v0.5.5: guided camera and installation prepared release (October 10, 2026)](history/PWA_RELEASE_HISTORY.md#v055-guided-camera-and-installation-prepared-release-october-10-2026)
- <a id="v060-local-history-and-v450-prepared-release-october-16-2026"></a><a id="version-correction-files"></a><a id="v060-prepared-tag-and-release-description"></a><a id="prepared-tag-and-release-description-5"></a><a id="ci-browser-follow-up-october-16-2026"></a> [v0.6.0: local History and V4.5.0 prepared release (October 16, 2026)](history/PWA_RELEASE_HISTORY.md#v060-local-history-and-v450-prepared-release-october-16-2026)
- <a id="v061-uncertain-result-scores-prepared-release-october-16-2026"></a><a id="prepared-commit-and-release-text"></a> [v0.6.1: uncertain result scores prepared release (October 16, 2026)](history/PWA_RELEASE_HISTORY.md#v061-uncertain-result-scores-prepared-release-october-16-2026)
- <a id="v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026"></a><a id="v070-commit-and-tag-text"></a> [v0.7.0: diagnostics and raw confidence prepared release (October 17, 2026)](history/PWA_RELEASE_HISTORY.md#v070-diagnostics-and-raw-confidence-prepared-release-october-17-2026)
- <a id="october-18-2026-v070-scanner-follow-up-and-branch-handoff"></a> [October 18, 2026: v0.7.0 scanner follow-up and branch handoff](history/PWA_RELEASE_HISTORY.md#october-18-2026-v070-scanner-follow-up-and-branch-handoff)

</details>

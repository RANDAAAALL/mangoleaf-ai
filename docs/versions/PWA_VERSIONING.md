# MangoLeaf AI PWA Versioning Guide

**Current release, October 25:** shared app **v0.11.0**, Android APK **v0.1.7/code 8**, host bounds **8-8**, sequence **6**, and adopted Model **V4.5.0**. GitHub confirms [v0.11.0](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.11.0) is published as Latest at `f6e04842c13b1e3f5e86e5bf468be8abcbc18601`. All four uploaded asset SHA-256 digests match the retained local candidate. The maintainer reports completing production-phone checks; recorded browser R03 and artifact checks have separate evidence scopes. Bridge/SQLite schema remain 1/1. Preserve published tags/assets/receipts. Later helper/docs commits do not move the tag or alter those assets, and this check does not establish Vercel promotion/live website identity.

Use this guide to prepare the shared web application and website release. Native APK and model versions are independent; full dated evidence belongs in the [release history](history/PWA_RELEASE_HISTORY.md#release-timeline).

**Earlier October 25 tag/artifact check, before publication:** GitHub confirmed annotated tag `v0.11.0` at `f6e04842c13b1e3f5e86e5bf468be8abcbc18601`; no published v0.11.0 Release was found then. The maintainer prepared a local production APK 0.1.7/code 8 and matching sequence-6 OTA from recorded working-tree inputs. Tag push alone does not publish the release, promote Vercel or include later uncommitted helper/documentation edits. Keep the tag fixed and retain artifact hashes and physical/release evidence. The release helper's default local output names use Philippine time with `-PHT`; this does not change the signed payloads.

## Current repository snapshot

| Item                    | Source state                                                 |
| ----------------------- | ------------------------------------------------------------ |
| Shared app / web bundle | `0.11.0`, from `package.json`                                |
| Adopted model           | `v4.5.0`; local runtime restored to the adopted baseline     |
| Android host            | `0.1.7` / code `8`; Debug `0.1.7-dev`                        |
| Compatibility           | Bridge/schema `1`/`1`, host bounds `8-8`                     |
| Published release       | GitHub Latest `v0.11.0`; APK `0.1.7` / code `8`              |
| Publication             | Published; Vercel promotion/live identity checked separately |

This release keeps scans/photos local until successful recovery-code creation or valid existing-code connection. Code creation enables automatic foreground/online backup without another checkbox; completed cloud copies are reused and unfinished reports retry. Preserve connected-code pauses, existing identities/data and scoped deletion retries. Debug uses testing and Production APK uses production; no hosted schema/configuration change is required. Scanning remains APK-only. Default OTA bounds deliberately target host 8; older hosts need the new same-signer APK for this release. Sequence 6 is published; future preparations must check every published sequence and choose a higher unused value.

APK footers show the installed native version and active model. Android About shows the shared web version; browser footers retain app/model labels. Available APK labels come only from validated published asset labels. See [Android version and publication rules](ANDROID_APK_VERSIONING.md#installed-and-available-apk-versions).

Model weights/configuration/constants remain adopted V4.5.0; builds regenerate `public/sw.js` from that source. Preserved V5 research and the unrelated training notebook edit remain separate. Validate the newly versioned source/model hashes rather than carrying earlier-build results forward. See the [candidate record](history/PWA_RELEASE_HISTORY.md#v0110-recovery-code-first-backup-candidate).

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

The optional `bun run release:tag --tag vX.Y.Z --commit FULL_APPROVED_COMMIT_SHA` helper replaces only the manual annotated-tag command below. It requires an explicit full commit and checks that commit's app version; `--message` supplies a custom annotation. Add `--push` only to intentionally push that tag after approval. The helper preserves an existing matching annotated local tag, refuses different/lightweight or existing remote tags, and never forces or publishes. The caller still supplies CI, exact-artifact and physical/reliability approval; these are not inferred from a tag or a version. See [complete shortcut instructions](../../SETUP.md#release-workflow-shortcuts).

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
- [Historical v0.9.0 Android and cloud recovery preparation](history/PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026)
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

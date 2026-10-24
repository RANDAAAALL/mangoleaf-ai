<a id="android-host-updates-and-recovery-candidate-october-20-2026"></a>

## October 24, 2026 navigation and branding candidate

Prepared shared app 0.10.0/native 0.1.5/code 6, default bounds 6-6, bridge/schema 1/1 and adopted model V4.5.0. Transparent native artwork and the APK-delivery follow-up are separate from the first-About fix: private About panels now load with the APK application instead of triggering its global loading fallback on first navigation. Local verification passed 21 JVM tests, Debug lint/assembly/asset checks and two controlled compiled-Android cases. Physical phone appearance/lifecycle and release approval remain pending; no new production signing or publication occurred. Earlier 0.1.4/code 5 and v0.9.0 records below retain their original identities.

## Shared web v0.9.0 candidate (October 23, 2026)

Preparing shared web `0.9.0` and local candidate tag `v0.9.0-rc.1` leaves native `0.1.4`/code `5`, Debug `0.1.4-dev`, bridge/schema `1`/`1`, host bounds `5-5` and adopted model `v4.5.0` unchanged. Local V5 overrides remain excluded. Finalize the categorized commits before rebuilding publication APK/OTA receipts; web-0.8.0 artifacts below remain historical. CI, reliability/device approval, portable key backup and public release/promotion remain pending. See the [shared release record](PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026).

# Android APK history

## Native 0.1.5 branding and APK transfer candidate (October 24, 2026)

Prepared versionName 0.1.5 (Debug 0.1.5-dev), versionCode 6 and default host bounds 6-6; bridge/schema remain 1/1, web candidate 0.10.0 and model V4.5.0. Replaced opaque PNG launcher artwork with transparent vector/adaptive resources, and supplied dedicated system-splash styling for Android 12+ plus a plain legacy starting window. Native resources require a new same-signer APK; old code-5 APKs cannot apply them through web OTA. SQLite, private files, credentials, signing keys and deployed resources remain unchanged.

The same follow-up prepares a fixed-repository Vercel download rewrite, validated production-origin href, NetworkOnly APK requests and an exact-release fallback for the reported Brave download that reached full size without producing a usable file. Browser handoff is a working hypothesis. Fifteen focused tests, resource compile/link and syntax checks passed; full release gates and physical/hosted verification remain pending. No installer, tag or release was published.

## Browser companion change (October 24, 2026)

App v0.10.0 is an unpublished shared-web candidate; native APK v0.1.4/code 5, bridge/schema 1/1, bounds 5-5 and V4.5.0 model are unchanged. All website browsers, including development, become landing/download-only. APK scanning, diagnostics, SQLite/private photos, automatic backup and explicit recovery remain. Existing browser records/outboxes are preserved without UI or private worker startup; Debug APK replaces supported development-browser scanning. This needs a new tested web candidate before OTA or website promotion and does not alter published v0.9.0 artifacts.

This archive preserves the combined Android implementation notes through October 23, 2026. Use the [Android APK versioning guide](../ANDROID_APK_VERSIONING.md) for current versions, commands and release rules; exact APK hashes and completed checks remain in [Android testing](../../testing/ANDROID_TESTING.md).

References below to a current version, opt-in backup, pending deployment or host range describe that record's stage. Later records and the current guide supersede earlier behavior. Reorganization does not establish a release, deployment, successful device evaluation or model adoption. Original section bookmarks are preserved; local link destinations are rebased for this location.

## Candidate timeline

These are native candidate identities, not published releases. Shared web and model versions are separate.

| Date             | Native version / code | Recorded change                                                                             | Evidence                                                                                                                                                           |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| October 20, 2026 | `0.1.0-dev` / `1`     | Initial Java host, SQLite/private photos and signed OTA candidate                           | [Initial Android verification](../../testing/ANDROID_TESTING.md#october-20-2026-evidence-and-limits)                                                               |
| October 21, 2026 | `0.1.1-dev` / `2`     | Atomic deletion queue and subsequent testing/recovery/native follow-ups                     | [History deletion](#history-deletion-and-recovery-october-21-2026), [testing recovery](#automatic-testing-backup-and-recovery-october-21-2026)                     |
| October 22, 2026 | `0.1.1` / `2`         | Earlier production signing and server preparation candidate                                 | [Production preparation](#production-apk-preparation-october-22-2026)                                                                                              |
| October 22, 2026 | `0.1.2` / `3`         | Automatic production backup and guarded explicit update restart                             | [Backup/update follow-up](#automatic-production-backup-and-update-prompt-october-22-2026)                                                                          |
| October 22, 2026 | `0.1.3` / `4`         | Release website association and positive-only installed-app hints                           | [Website follow-up](#website-open-or-install-october-22-2026), [exact artifact evidence](../../testing/ANDROID_TESTING.md#october-22-2026-website-open-or-install) |
| October 23, 2026 | `0.1.4` / `5`         | Renderer rollback, guarded restart, cancellation ownership, History and recovery race fixes | [Implementation audit](#implementation-audit-october-23-2026), [candidate evidence](../../testing/ANDROID_TESTING.md#october-23-2026-implementation-audit)         |

## Implementation audit (October 23, 2026)

Two focused reviews found reproducible native OTA lifecycle and cloud/local storage races. Renderer-only failure before an OTA health acknowledgment now clears the in-memory launch choice so the next launch can roll back. Explicit restart verifies outside manager/state locks, then rechecks the exact pending candidate and foreground/camera/picker/busy state on the UI thread. Canceled downloads retain worker ownership until cleanup finishes. Launch selection reuses a just-verified pending manifest only within that launch.

History tolerates an unreadable photo without hiding other reports, coalesces refreshes and reuses a bounded set of immutable photo Blobs. Recovery credentials are server-verified in a staged client before local-only promotion; deletion cannot straddle an owner switch, and retired refreshes cannot overwrite the promoted session. Transfers yield between reports when backgrounded, paused or busy. The recovery input form is extracted with its existing EN/BIS behavior.

Native candidate is **0.1.4/code 5**, Debug **0.1.4-dev**, default compatible host range **5-5**. Bridge/schema remain 1/1, shared web remains the 0.8.0 working candidate, and default Android bundles retain committed V4.5.0. No footer version, schema, cloud deployment or publication changes accompany this audit. See [checks and pending observations](../../testing/ANDROID_TESTING.md#october-23-2026-implementation-audit) and [performance limits](../../PERFORMANCE.md#implementation-audit-october-23-2026).

## Installed and available version labels (October 23, 2026)

The maintainer requested native version display after the earlier audit. APK footers now show the installed `hostVersionName` and active model; Debug retains its suffix. The independent web-bundle version moves to Android About, while browser footers retain shared app/model labels. Missing/invalid names never produce an invented installed version. This uses an existing host field, so native candidate 0.1.4/code 5, bridge/schema 1/1 and host bounds 5-5 remain unchanged.

Download availability still validates the exact uploaded APK on the fixed stable GitHub release. Its optional native version comes from the publisher's `Android APK v<version>` asset label, printed by the verified Release/OTA tools. A web tag is never used as a native version. No label is trusted as Auth, bridge authorization or browser proof of APK certificate/manifest contents. Unlabeled older APKs remain downloadable; four distribution assets are unchanged. See [publication instructions](../ANDROID_APK_VERSIONING.md#installed-and-available-apk-versions) and [exact check scope](../../testing/ANDROID_TESTING.md#october-23-2026-version-display). Earlier no-footer instructions below describe their earlier stage.

## Documentation organization (October 22, 2026)

Split current Android guidance and the preserved implementation archive into the same guide/history structure used by the PWA and model documentation. Removed the former documentation-only Android folder and updated references. The native `android/` project remains in place. No version bump, APK rebuild, footer label, signing key or release behavior changes as part of this reorganization. Keep the native version out of the footer until the maintainer requests it.

## Preserved implementation notes

**Original title:** Android host, updates, and recovery (candidate, October 20, 2026).

<!-- Preserved implementation snapshot -->

## Website Open or install (October 22, 2026)

Android website actions now say **Open or install**. A direct user tap launches the fixed package through `intent:`; Chrome's same-origin `/download` fallback and an immediately available guide cover an unavailable handler. No timer starts a download. A positive `navigator.getInstalledRelatedApps()` result for the exact native package changes the action to **Open app**. Empty, rejected, timed-out and unsupported results remain unknown. A browser shortcut never confirms the APK. Confirmed installations hide installation steps and put another APK download behind **Reinstall or update Android app**. Downloads remain available deliberately; a website cannot prevent someone downloading an installer again.

The website manifest declares the production package with `platform: play` and `prefer_related_applications: false`. This API identifier does not require Play Store distribution or introduce a Play Store link. The Release APK's `asset_statements` reciprocally names only `https://mangoleafai.vercel.app`. Debug has an empty association so testing does not advertise a production installation. The development intent still targets `.debug`; published website builds target `com.mangoleaf.ai`. Desktop retains the QR guide. Production website/build promotion remains separate from GitHub asset publication.

This native metadata requires a rebuilt APK: Release **0.1.3/code 4**, Debug **0.1.3-dev/code 4**, default APK/OTA host bounds **4-4**. Bridge/schema remain 1/1, web candidate remains 0.8.0 and Android bundles keep committed V4.5.0. Existing code-3 APKs still open through the intent but cannot gain the new association through web OTA. Update with the same signing key and `adb install -r`; preserve app data. Query hints are coalesced, kept only in memory for five seconds and refreshed when the visible page returns. They never grant bridge access, identify cloud ownership, or load launch URI data into WebView.

Detection needs a supporting Android browser, HTTPS, the updated APK and its matching website manifest/origin. Other origins and older APKs keep the safe unknown state. Chrome supports directly installed APKs; see [related-app detection](https://developer.chrome.com/docs/capabilities/get-installed-related-apps) and [intent fallback](https://developer.chrome.com/docs/android/intents). If the public website origin changes, update the Release association, rebuild the APK and repeat device checks. Physical installed/absent/older-APK browser cases and final release approval remain pending; see [focused validation](../../testing/ANDROID_TESTING.md#october-22-2026-website-open-or-install).

## Automatic production backup and update prompt (October 22, 2026)

The maintainer changed production backup from opt-in to automatic. The first eligible saved JPEG/WebP report starts anonymous Auth and server-verified quota-limited enrollment while foreground and connected. Browser development and Debug stay on testing; only the verified production native host uses production. Empty History and hidden deletions create no identity automatically. Existing recovery sessions are reused. Creating a recovery code attaches credentials to the same UUID. No initial Enable backup step or Sign In/Register screen is needed. Pause/Resume stays available; explicit `paused` survives restarts while earlier `false` defaults now become automatic. Public guidelines and offline diagnosis/saving remain independent.

Recovery is separate from uploading: create/save the code outside the phone before losing it. **Restore cloud reports** downloads completed backups for the connected code, checks photo integrity and merges missing reports into SQLite with original scan dates. Existing History and local deletion records are preserved. Wrong codes preserve the active session. Browser testing has no recovery controls. History deletion retains project/owner-scoped retries and does not propagate to other devices.

Production `android-backup-vault` version **3**, bundle hash `280de1ce42aa876a7cca6106c957edc12d997aaebdf652849a57d9076a603221`, now permits verified anonymous enrollment behind the existing `ANDROID_BACKUP_PROVISIONING_ENABLED=true` gate. Production keeps native-only CORS; development origins stay testing-only. SQL, RLS, Storage rules and provider settings are unchanged. Before/after full-row digests preserved all 75 scans, six guidelines, 85 Auth users and 80 photo-object metadata rows. No automated production user/report/photo was created. Earlier October 22 sections below describe the preceding opt-in candidate.

The About update card is removed. Automatic native checks download and verify files; only `staged` status permits an **Update ready** modal with **Restart now** / **Later**. Camera, review, scanning, unsaved results, recovery, other dialogs and text input defer the offer. No status polling occurs while hidden. Later defers the offer for that page lifetime. Debug disables production OTA, so it cannot display a genuine production update offer. Older hosts without the restart capability receive close/reopen instructions.

**Restart now** refuses busy/background/picker/document states. Queued SQLite writes settle before selection is released. The staged bundle is verified again, then the trusted local Activity is recreated; the next view selects the update before loading code and retains health-based rollback. Ordinary Activity recreation keeps its bundle. Reports, private files, sessions, deletion jobs and signing identity remain outside the update. No external URI or extras are loaded.

New native method requires a rebuilt APK: Release **0.1.2/code 3**, Debug **0.1.2-dev/code 3**, default bundle host bounds **3-3**. Bridge/schema stay 1/1, web candidate stays 0.8.0 and committed model stays V4.5.0. Earlier code-2 APK/OTA receipts do not verify this changed source. Rebuild/reinstall the matching signed package with `adb install -r`; keep app data and signing keys.

### Website, APK and OTA in plain English

1. Edit code, check it and prepare a candidate commit. Pushing source to GitHub alone does not update installed APKs.
2. For compatible web UI changes, build/sign/verify an OTA bundle with a sequence higher than every published sequence. After approved release checks, put `web-update.zip`, `update.json` and `update.sig` on the latest stable GitHub Release, alongside the approved `mangoleaf-ai.apk`.
3. The production APK checks while foreground, connected and idle, downloads/verifies compatible files, then offers Restart now/Later. A check acknowledgment is not an applied update.
4. Java, Android permissions, native dependencies or incompatible bridge/storage changes need a higher-version signed APK. Web OTA cannot replace native code; host 2 cannot load the new default host-3 bundle.
5. Vercel separately builds/promotes the website. It does not replace installed APK files. Promote the exact tested deployment under the release guide; a GitHub Release does not perform Vercel promotion.

Device restart/interruption/rollback, backup/recovery, full R03, portable key/password backup, final tested commit/CI and public publication remain pending release gates. Controlled mocks and artifact proof are separate from phone/runtime validation.

This is an unpublished implementation candidate. The browser app remains available to preserve existing History. Manual report import/export controls are retired in the October 21 recovery follow-up below. `/download` offers a direct APK only when the public release API confirms the expected published asset. Building does not publish a release or deploy Supabase. Permanent external signing keys were created with maintainer approval on October 22; keep them outside this repository.

## Production APK preparation (October 22, 2026)

The earlier prepared native Release was `0.1.1`/code `2`, package `com.mangoleaf.ai`; its Debug build was `0.1.1-dev` and `com.mangoleaf.ai.debug`. Shared web version stays `0.8.0`. Default APK/OTA preparation selects committed V4.5 assets, preserving uncommitted V5 files. This first native release is not yet public. Record the exact APK hash, certificate, input fingerprint, source commit and working-tree status; a version label alone is insufficient.

On this Windows account, the approved permanent keys are under `C:\Users\My Pc\.mangoleaf-ai\signing`, outside Git. `release.p12` holds alias `mangoleaf-release`; `ota-private.pem` is separately encrypted. `signing-config.json` contains public pins/paths, and `credentials.dpapi.json` holds CurrentUser DPAPI-protected passwords. Nothing prints passwords or passes them as command arguments. Restrictive user/SYSTEM ACLs protect this folder. **Copying the folder alone is not a portable password backup:** DPAPI normally requires the original Windows account. Before publication, retain an independently recoverable, protected backup of both keys and their passwords outside this laptop. Never regenerate keys to work around lost access; existing APKs require their original signing identity.

From the repository root:

```powershell
# Validate the existing keys and production OTA settings without building.
bun run android:release:windows -Action check

# Build, sign, lint, inspect, and retain a fresh unpublished candidate.
bun run android:release:windows -Action build
```

The wrapper loads credentials only for child processes and restores its environment afterward. Web/SDK children receive no signing passwords or private OTA key. Missing/inaccessible credentials fail closed; no replacement keys are created. The wrapper uses project-local ignored Gradle/Android caches when none are configured. On other systems, provide external Gradle properties/environment values and use `bun run android:release check` / `bun run android:release build`; never commit passwords or add them to public environment variables.

Each successful build creates a fresh ignored `.tools/android-release/apk-<timestamp>/` containing **`mangoleaf-ai.apk`** and **`release-receipt.json`**. `verifyReleaseConfiguration` checks the external keystore/private alias, certificate pin and RSA OTA trust before building. `verifyReleaseBundle` checks the actual APK inventory, model, backend, compatibility, source/input identity and APK hash. Independent SDK verification checks the signer, non-debuggable production package, SDK requirements and alignment. The signed public `assets/production-trust.json` binds the receipt's certificate/OTA settings to that APK; receipts are compared with signed assets rather than trusted alone. Release refuses incomplete signing/OTA settings. Debug explicitly excludes production OTA trust.

Only after the exact candidate passes the approved release scope and commit-specific CI should it be uploaded as `mangoleaf-ai.apk` to a stable GitHub Release. `/download` makes one bounded request to the fixed public GitHub latest-release endpoint and accepts only that asset's reviewed repository/tag URL. Missing, draft, prerelease, malformed or unreachable metadata retains an unavailable message and release-page link. This availability request does not detect installation; the separate positive-only related-app hint selects **Open app**, with **Open or install** retained for unknown results. Keep the APK and OTA assets on each release selected by GitHub's `latest` channel. Website deployment and GitHub publication are separate actions.

The current source is a working-tree candidate. Final commit, CI, intended-device/reliability evidence, portable key backup, real device backup/recovery and publication remain release gates. Production server setup is now installed as recorded below. See [Android evidence](../../testing/ANDROID_TESTING.md#october-22-2026-production-apk-preparation) and the local plain-English production guide under ignored `docs/local-ignored-files/`.

When preparing a commit, preserve the local V5 boundary. `src/sw.ts` now also contains the GitHub release-metadata NetworkOnly/eviction change: stage only those reviewed feature hunks with `git add -p src/sw.ts`, leaving the V5 model-cache label unselected. Keep experimental `public/model/` and `src/lib/constants.ts` overrides out of the release. Validate the final clean V4.5 release snapshot/commit rather than treating the ordinary local V5 website export as its inference evidence.

### Production cloud deployment status (October 22, 2026)

Supabase access returned during this task. Production project `uuvvvoznajjqknedxpdg` now has the reviewed additive backup table/RPCs and `android-backup-vault` function. Current function version is **2**, bundle hash `9e2aa86522176a6adb6b9fda3c296ec43941c83f871c4f8b1dc16522b757d76f`; JWT gateway verification is disabled only for this endpoint because its handler owns authentication and quota-limited bootstrap. The maintainer set `ANDROID_BACKUP_PROVISIONING_ENABLED=true` in Edge secrets, and live invalid-request checks confirmed enablement. Email/password login is enabled. Existing public-signup and anonymous-provider settings were read and preserved; production APK does not automatically sign in anonymously, and production anonymous enrollment/development CORS remain disabled in this function.

All nine catalog checks passed. Native-origin preflight returned 200; localhost/untrusted origins returned 403; malformed payloads, anonymous enrollment and caller-supplied owner fields returned 400; unsigned private scans/manifests returned 401. Verification consumed zero provisioning slots and created zero users, reports or photos. No real-token production backup/recovery/delete was exercised; use intended-device checks for that workflow and testing for synthetic automation.

Before/after comparison retained every original field in **75 scans, 6 guidelines, 85 Auth users and 80 photo-object metadata records**, plus unchanged bucket settings, original policies/grants/columns/indexes/constraints/publications/functions. No production reports/photos/users were copied into testing, claimed by a new UUID or deleted. Private DB/schema/policy/config snapshots and receipts are under ignored `.tools/supabase-backups/20261022-production-android/`.

Historical media backup is partial: 68 prior local photo copies were hash-verified against unchanged metadata; the remaining 12 existing server objects were not downloaded. This is not a complete media export. That does not require changing those objects for the additive setup, which leaves them untouched; any later destructive/reassignment work needs separate authorization and appropriate complete backups. Browser scan restrictions, intended-phone checks, reliability, key/password backup, final-commit CI and public APK/OTA publication remain separate work/gates. Earlier dated pending-server descriptions below precede this deployment.

**Platform decision, October 21, 2026:** the supported mobile product is Android APK only. Installation guidance on every device uses the Android APK path; iPhone/iPad instructions, browser install prompts and Apple web-app metadata are removed. Other devices can read the website and Android requirements; browser development scanning and existing browser History remain available. No user-agent check is proof of APK installation. Historical iOS observations remain dated evidence without establishing current support.

## Build in VS Code on Windows

Use JDK 21, Android SDK platform 36, and a current Android System WebView. The project wrapper supplies Gradle 8.13; AGP is 8.13.2. Java source compatibility is 17. Android Studio is useful for installing SDKs/emulators; VS Code and PowerShell can run all commands. `JAVA_HOME` and `ANDROID_HOME` must be visible in that terminal. No global Gradle installation is required.

```powershell
bun install --frozen-lockfile
bun run android:guidelines
bun run android:bundle
Set-Location android
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug verifyDebugBundle --no-daemon --max-workers=2
```

Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. This is a development build, signed with the SDK debug key. Do not publish it as a production APK. Native host version is currently `0.1.3-dev`/code `4`; the web application remains `0.8.0`. Native host, web bundle, bridge, schema, and model identities are separate. A native permission/dependency/schema change requires a newly signed APK and appropriate compatibility review.

Keep production public settings in `.env.local` and testing public settings under the same variable names in ignored `.env.testing.local`. Default `android:bundle` selects testing; `bun run android:bundle --release` selects production. Gradle rejects a bundle with the wrong target for its variant, and private cloud sessions verify the host's `app.info` environment before construction. Debug application ID is now `com.mangoleaf.ai.debug`; release keeps `com.mangoleaf.ai`. This separates private SQLite/photos/credentials. Preserve earlier shared-ID installations rather than uninstalling them; current recovery requires that installation's saved code and completed cloud uploads, and does not automatically transfer another package's local data.

`build-inputs.json` records the cloud environment/project and fingerprints the selected public backend configuration alongside source/model bytes. A target change requires a rebuild. Private credentials remain outside the replaceable web bundle, scoped by project; old unscoped secrets are preserved, not silently reassigned. Reconnect a saved recovery code explicitly after this change if needed.

`android:guidelines` explicitly downloads only the four public guideline columns. The tracked six-row snapshot and provenance hash seed an empty native database so first-launch offline advice is available. It does not overwrite a populated native guideline table or establish new medical approval. Later HTTP/Realtime refreshes remain independent of private backup.

`android:bundle` copies current application source into ignored `.android-web/`, disables service workers, and stages generated assets under `android/app/build/generated/web-assets/web/`. By default it reads model files and `constants.ts` from committed `HEAD`, preserving local V5 experimentation. `--working-model` is an explicit research override, not model adoption. `build-inputs.json` identifies the source commit, exact input fingerprint, model source, and uncommitted candidate status. Rebuild after source changes; this debug build is not evidence that the named commit alone contains the working tree.

## Runtime and data preservation

### Camera permission, capture and installed-app opening (October 21, 2026)

The physical-phone log showed that opening Android's camera permission dialog hid the WebView and cancelled `getUserMedia`, leaving the camera paused after approval. The same sequence was reproduced on the old APK in the isolated API 36 emulator. `MainActivity.onPause` now avoids pausing WebView only while its trusted camera permission request is pending. A real `onStop` still pauses web content and denies pending requests. The Android permission prompt remains required; allowing either foreground or one-time permission should lead directly to preview. Denial remains an error/retry path. Returning after a real background interruption still requires reopening the camera.

Capture copies the existing centered square frame into an opaque canvas, then releases the video stream before JPEG encoding. The source size/crop and JPEG quality `0.92` are unchanged. The canvas backing surface is cleared after encoding settles, including cancellation. Optional diagnostics now separate capture start, frame-copy completion, encoding completion and final handoff, with technical dimensions/timings only. No photos or report identifiers are logged. This removes avoidable live-camera work during encoding; the old log alone cannot establish which substep caused its delay or a measured phone speedup.

Android website visitors now have an explicit **Open MangoLeaf AI** link in the installation guide and download page. A Chrome Android intent targets `com.mangoleaf.ai` on published websites and `com.mangoleaf.ai.debug` during `bun run dev`; if unavailable it falls back to the same website's `/download` information page. No APK download or app launch happens automatically. Unsupported browsers retain ordinary installation information. This is an opening action, not a claim that the website has detected an installed package. Older APK hosts without the new intent filter require rebuilding/reinstalling first.

The manifest handles only the `mangoleaf://open` launch scheme/host. `singleTask` brings the existing activity forward, and `onNewIntent` never loads supplied URLs or extras into the trusted WebView. The link does not carry credentials, report data or a requested web route. Reinstalling the same application ID with the same signing identity updates that installed app; downloaded APK files can still be duplicated in Downloads. Debug and release application IDs deliberately remain separate installations with separate storage. No verified HTTPS App Links/signing association or silent installed-app detection is configured by this change. See [Chrome Android intent behavior](https://developer.chrome.com/docs/android/intents), [Android deep-link handling](https://developer.android.com/training/app-links/create-deeplinks) and [Android update identity rules](https://developer.android.com/google/play/app-updates).

These native lifecycle/manifest changes require a newly built APK; an OTA web bundle alone cannot fix an older host. Native/web/model versions remain unpublished candidate identities, with the exact APK and checks recorded in [camera follow-up evidence](../../testing/ANDROID_TESTING.md#october-21-2026-camera-permission-and-capture-follow-up).

### Automatic testing backup and recovery (October 21, 2026)

Development browser and Debug APK uploads are automatic on the exact pinned testing project. Both use real `signInAnonymously()` for the first eligible saved JPEG/WebP photo report when foreground and connected. Empty History and hidden deleted rows do not create an account automatically. Explicit APK code creation is allowed even with empty History. Public guidelines and local diagnosis/saving remain independent. Production APK backup remains opt-in; production provider settings and server rollout are unchanged.

On testing, Authentication must allow both **anonymous sign-ins** and **new-user signups**. The maintainer enabled both, and real signup was verified. Testing provisioning function **version 2** verifies the bearer, enrolls the same Auth UUID under the existing quota and sets its protected ownership claim. The client refreshes that claim before owner-scoped transfers. Code creation attaches synthetic recovery credentials to this same UUID; it does not create a separate backup owner. The live check observed that user become non-anonymous after credential attachment, with earlier uploads still accessible. No registration screen is shown.

In APK About, **Create recovery code** is shown when none is connected. Existing codes offer **Show/Hide** and **Copy**. **Enter recovery code** opens and focuses a password field; **Clear input** empties only that field. It does not disconnect the current session or delete reports. Restore validates a candidate code before replacing credentials, then merges verified reports by ID while preserving original scan dates. One local report plus five distinct restored reports gives six; repeated restore does not duplicate them. Confirmed old-owner deletion jobs must finish before switching owners. Keep the code outside the phone: creating an unrelated code cannot recover a forgotten vault. A still-connected device can show its saved code.

Manual report Import/Export controls, browser archive modules and their UI strings are removed by maintainer request. Existing browser/native History, metadata, hidden tombstones and deletion records remain intact. Bounded legacy native archive/import methods remain for compatible older bundles and cloud recovery's internal import; they are not exposed as a current report-file workflow. Diagnostic log download is unchanged.

The APK requests **portrait orientation on phones**. This requires rebuilding/reinstalling the native host; an OTA bundle cannot change its manifest. Android may override orientation requests on large displays or under OS/device policies; browser rotation is unaffected. Cross-device deletion propagation is intentionally absent. History deletion removes its connected cloud copy through the existing retry queue, but another device retaining a stale local copy can upload it again.

Authorized testing cleanup was verified at **0 scans, 0 backup manifests, 0 photos and 6 unchanged guidelines**. The private bucket, Auth users and policies remain. Earlier dated evidence below records earlier candidates; see [latest verification and APK identity](../../testing/ANDROID_TESTING.md#october-21-2026-automatic-testing-recovery-follow-up) for this follow-up.

### System bars and web viewport (October 21, 2026)

The native window uses AndroidX edge-to-edge configuration with dark system icons on the app's light background. A parent `FrameLayout` handles system-bar, display-cutout and keyboard insets, resizing the WebView's actual viewport. Padding the WebView itself did not protect the sticky header or fixed bottom navigation from Android's status/navigation bars. The parent consumes the handled insets so WebView/CSS cannot apply them a second time. Insets replace earlier padding after rotation or keyboard dismissal; the same container protects native startup-error text. See the [Android window-inset guidance](https://developer.android.com/develop/ui/views/layout/edge-to-edge). The light-navigation theme attribute is confined to `values-v27/`; AndroidX handles system icons on the API 26 minimum.

This is a native layout fix and needs a rebuilt APK; replacing an OTA web bundle alone cannot repair the installed host. No web/model/bridge/schema version or storage/auth behavior changes. Reinstall the matching debug package with `adb install -r` to retain its reports and credentials. Verify portrait/landscape, gesture/three-button navigation, cutouts and keyboard input on the intended physical phone. Automated evidence and the exact rebuilt APK are recorded in [Android testing](../../testing/ANDROID_TESTING.md#october-21-2026-system-bar-layout-follow-up).

### History deletion and recovery (October 21, 2026)

Development-browser History deletion now removes its local report/photo and atomically writes a cloud-delete job to Dexie v10's `cloudDeletes` store. Debug and production APKs do the same in SQLite: the job is committed in the existing settings table alongside report removal and the permanent local deletion record. The job contains only the project/vault label and original record ID. It contains no photo, diagnosis result, password, session or recovery code. SQLite schema/bridge versions remain 1; native host `0.1.1-dev`/code `2` supplies the added queue methods. Current bundle tooling defaults to host range 2–2 so host 1 cannot activate a bundle requiring those methods. Rebuild/reinstall the debug APK to test this native change.

The shared worker validates the current Auth user against the connected recovery credential, looks up only that owner's manifest, removes its private Storage object through the Storage API, then invokes the existing owner-checked `delete_android_backup_report` transaction. Only successful completion acknowledges the local job. Offline requests, lost responses and partial failures retry while the app is open, visible and connected, including when uploads are paused. Keep the same recovery code connected until deletion finishes. Switching codes leaves the old vault's jobs intact for reconnection; it never reassigns them. Deletion never creates a new cloud identity. Production server rollout remains pending; testing already has the required existing RPC and owner policies.

Only deletions explicitly made through the updated History path are queued. Previously removed local reports, old hidden tombstones, archived cloud rows/photos and other vaults are not inferred to be cleanup targets. Another device or browser tab with a stale copy can upload it again; pause other writers before deletion. Storage and SQL are separate services, so this is retryable cleanup, not distributed deletion across devices. Do not claim every offline device has forgotten a report.

Backup itself needs no Sign In/Register screen. Production requires creating/saving a private recovery code and enabling uploads; testing uploads start automatically as described above. Only completed cloud reports/photos can restore. On a replacement APK, enter the same code and explicitly restore; verified bytes and metadata are copied to SQLite/private files. Testing codes and production codes belong to separate projects. Intentional deletion removes those reports from the recoverable cloud backup after cleanup completes.

Rollback must preserve pending jobs and credentials. Keep Dexie v10's schema declaration in a browser rollback build; do not clear the database or force a v9 downgrade. Keep native SQLite/settings/deletion records intact and disable uploads while resolving a failed client rollout. Earlier APK/web bundles predate synchronized History deletion and must not be treated as an equivalent rollback of its cloud semantics. No authentication provider, server schema or production data is changed by installing this client update.

“Private photos” means image files inside Android's app-private directory. SQLite stores report fields and references to these files; photos are not database rows or automatic Gallery copies. They remain available offline and outside replaceable OTA bundles. App removal/data clearing can remove local data; recovery requires a saved recovery code and completed cloud uploads.

Diagnostics is included in both debug and production APK builds, remains opt-in and contains bounded technical fields. Native log download uses Android's document picker for a text file; cancellation does not change reports. Browser development shows its panel only below 768px. Android-only installation guidance uses APK instructions and `/download`; the current local debug build is not published as a production download. Existing browser reports remain in that origin's IndexedDB.

- Java `MainActivity` loads the packaged or verified staged web files through AndroidX `WebViewAssetLoader` at `https://appassets.androidplatform.net/`. Only that main frame may call the message bridge. External navigation opens outside the trusted view; file access and mixed content are disabled.
- SQLite owns reports, guidelines, settings, and deletion records. Compressed photos live in private app files and are served only by the dedicated local photo handler. No historical `image_url` is fetched. Prepared save IDs are immutable and retryable. Cancellation releases the caller; it cannot promise cancellation of an already committed native write.
- Browser reports remain in their original IndexedDB. The current About screen has no report archive controls; retained bounded native compatibility methods do not imply a current browser migration UI.
- Native cloud import commits each report independently, skips identical retries and refuses conflicting IDs. Deleted IDs and hidden legacy tombstones stay hidden. Recovery requires the saved code and completed online uploads.
- Native deletion records survive ordinary History deletion and block later restore of the same local ID on that device. A replacement device has its own deletion history; an explicitly requested cloud restore can recover retained cloud copies there. History deletion queues cleanup of connected backup copies.
- Language and bounded diagnostics still use localStorage; reports and photos never use IndexedDB in the Android target. Browser Dexie dependencies remain for compatibility and migration, rather than erasing existing browser data.
- Native `ConnectivityManager` reports active-network `NET_CAPABILITY_VALIDATED`; browser compatibility keeps its browser hint. Neither guarantees that Supabase or GitHub is reachable. Each request still validates its own result.

## Cloud recovery without Sign In/Register screens

Production users explicitly create a private recovery code, save it outside the phone, acknowledge that step, then enable backup. Testing uploads are automatic and code creation attaches recovery credentials to the same anonymous owner as described above. The code is a credential for a server-verified Supabase Auth identity; there are no email/password registration screens. Anyone holding the code can recover its backup. Losing both the device and code prevents recovery; an unrelated new device UUID never proves ownership.

The implementation reuses the existing **`public.scans` table and private `scans` image bucket**. New owner-scoped manifest rows in `android_backup_reports` preserve original local IDs, raw confidence, model labels, timestamps, metadata, and photo hashes. Separate deterministic cloud IDs prevent collisions with historical scan IDs. Existing cloud users, rows, photos, and policies are not reassigned or deleted. Restore verifies authenticated ownership, exact owner paths, byte size, and SHA-256 before importing a local Blob. It is deliberate, never an automatic legacy-URL fallback.

Both APK variants start uploads automatically; code creation remains explicit and Pause/Resume is available. Transfers run sequentially while connected, yield between photos during diagnosis, and retry on foreground/connectivity/storage events. Local saving never waits for cloud work. Native Keystore AES-GCM protects the saved recovery code and Auth session. Clearing app data or uninstalling removes these local secrets; keep the recovery code elsewhere.

### Separate testing project

The maintainer created `mangoleafai-testing` (`ajwlojaclehxupntnsve`) separately from the preserved production project. On October 20, 2026, authenticated Supabase MCP applied `20261020143538_initialize_android_testing` and `20261020143744_harden_android_testing` there. It has a private `scans` bucket limited to JPEG/WebP and 8 MiB, `scans`, `guidelines`, and `android_backup_reports` tables with RLS, owner-only access, backup RPCs, and the private provisioning budget. Only guidelines are published to Realtime.

**Initial October 20 setup was empty.** No production scans, photo files, or Auth users were copied. Six initial public offline-guideline seed rows were removed at the maintainer's request; scans, guidelines, backup manifests, Storage objects, and Auth users were then verified at zero. On October 21 the maintainer separately authorized copying the six production public guideline rows; all four columns now match exactly. Reports, photo objects and Auth users remain unpopulated by this setup. Use synthetic test data for later tests. The private provisioning-budget row is server configuration, not copied application data.

For a different, verified-empty testing project, prepare a reviewable setup locally:

```powershell
node tools/prepare-supabase-test.mjs --project-ref <testing-project-ref>
node tools/test-supabase-test-setup.mjs
```

The preparation command never connects to Supabase. It writes a hashed plan and combined transaction under ignored `.tools/supabase-testing/<testing-project-ref>/`. Verify the remote project identity before applying that SQL through MCP. The destination comment is a review aid, not a database identity check. Initialization refuses existing application tables, users, buckets, or objects; do not rerun it on this initialized project or on production. The bucket initializer creates an empty bucket definition only; photo bytes and object metadata must go through Storage APIs.

The hardening step revokes application access to the platform's automatic-RLS event-trigger helper without disabling its DDL trigger. It indexes backup parent lookups and caches JWT subqueries in backup policies. The advisor still identifies the intentionally owner-guarded completion function's `SECURITY DEFINER` capability and the default-deny private budget table; these are reviewed design choices, not suppressed findings. See the [security record](../../security/SECURITY-AND-SYNC.md#separate-empty-testing-project-october-20-2026).

### Development and production routing (October 21, 2026)

| Runtime                            | Local reports/photos       | Supabase                                           | Upload/recovery                                                    |
| ---------------------------------- | -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `bun run dev` phone browser/tunnel | Dexie/IndexedDB Blobs      | Testing scans, private scans bucket, guidelines    | Automatic test uploads/retries; no browser recovery controls       |
| Debug APK                          | SQLite/private photo files | Testing scans, private scans bucket, guidelines    | Automatic anonymous-owner uploads; code required only for recovery |
| Release APK                        | SQLite/private photo files | Production scans, private scans bucket, guidelines | Automatic anonymous-owner backup; production only                  |
| Published browser build            | Existing Dexie History     | Existing production public guidelines              | No development test-sync or native recovery controls               |

Testing provisioning function `android-backup-vault` version 2 is deployed. It permits the trusted native origin, localhost and HTTPS single-subdomain `trycloudflare.com` development tunnels only on the pinned testing project; production development CORS stays disabled. Origin is not ownership evidence: verified Auth, quota-limited enrollment and RLS protect private rows/photos. Browser development and Debug APK lazily establish anonymous ownership for their first eligible saved photo. The browser session lives in origin-local localStorage and exposes no recovery controls. Clearing browser data or changing tunnel origin loses that browser session; no browser recovery is offered. APK credentials are protected by Keystore-backed settings.

Browser development and Debug APK uploads are automatic; production APK uploads use the same automatic worker on production. Local saves/reconnection/foreground events schedule sequential uploads, with 10/30/60/300-second retry backoff and a five-minute foreground check. A closed or suspended app does not promise background delivery. History deletion queues cleanup of connected backup copies; recovery-code controls and restore remain deliberate native controls. Public guideline refresh is independent. Production resources and `.env.local` are unchanged. Production server rollout, browser scanning restrictions, physical checks and APK publication remain separate pending work.

### Server preparation and review

Production was initialized and enabled on October 22 after authenticated inspection, snapshots and exact preservation checks; testing was initialized earlier. **Do not rerun the initializer on either project.** The procedure below records how this setup was reviewed and applies to another separately authorized, uninitialized project. Keep private database/schema/Auth-policy/config snapshots under ignored `.tools/supabase-backups/`; aggregate fingerprints alone are not backups. Inventory/hash-check actual media backups separately and never call a metadata snapshot a complete photo backup.

1. Confirm production project `uuvvvoznajjqknedxpdg`, save private backups, then run [inspect-android-backup-production.sql](../../../supabase/sql/inspect-android-backup-production.sql). Review and apply [android-backup-vault.sql](../../../supabase/sql/android-backup-vault.sql) once only when its new resources are absent. The preflight compares exact owner/path policy roles, commands, permissiveness and expressions using empty temporary tables; name/substring matches are insufficient. It rejects weakened `OR true` and Storage-update checks without replacing existing policies. Existing/partial backup schemas deliberately stop for review; do not rerun the initialized testing project or historical cloud migration. Afterward run [verify-android-backup.sql](../../../supabase/sql/verify-android-backup.sql), require all nine booleans, and compare preserved counts/fingerprints. Never copy production reports/photos/users into testing.
2. Deploy `supabase/functions/android-backup-vault/index.ts` as `android-backup-vault` with JWT verification disabled **only for this provisioning endpoint**; use the scoped example config. The handler creates a server-confirmed recovery identity and needs the server's standard Supabase URL/service-role secret. Never put that secret in a `NEXT_PUBLIC_*` variable or APK.
3. For production, set server-only `ANDROID_BACKUP_PROVISIONING_ENABLED=true` only after review. Production otherwise fails closed; the pinned separate testing deployment is enabled explicitly in source. Its service-role-only atomic budget limits new identities to 10/hour, 100/day, and 1,000 total; failed creations also consume a slot. Reaching a cap requires operator review. This is bounded provisioning, not proof against public-endpoint denial of service.
4. Verify production Email/password provider availability for recovery-code login. This server-admin provisioning flow does not require public signups or automatic anonymous signup; preserve existing provider settings unless separately required. Testing alone needs anonymous sign-ins and new-user signups. Before enablement, verify native-origin preflight, rejection of localhost/untrusted origins, and disabled creation returning 503. After enablement, malformed requests and anonymous enrollment must be refused without creating users. Keep synthetic real-token upload, recovery and cross-owner exercises on testing, never automated production scans. Verify preserved production data again after deployment.

Deploy all three function source files (`index.ts`, `handler.ts`, `deployment.ts`). Production pins the exact project and explicit enable flag; development/tunnel CORS and anonymous enrollment remain testing-only. For rollback, disable new provisioning first and pause client uploads. Retain added tables/RPCs/manifests, users, private bytes, credentials and deletion outboxes; existing-session transfers and queued deletion are independent of the provisioning flag. Do not drop resources or reassign historical owners.

No ordinary diagnosis request creates an identity or uploads a photo. Turning backup off does not delete its remote copies. The explicit cloud-delete control affects only this recovery vault's new manifest-paired rows/photos, preserving local reports and historical resources. Preserve keys and data during any rollback; reverting the app does not require dropping tables or deleting users.

Before photo upload, an owner-scoped SQL transaction creates the new scans row and pending manifest together. Retry recognizes the same immutable content. Completion requires an owned private Storage object; restore includes completed manifests only. Pending transfers remain tracked for cleanup. Pause backup on every other connected device before clearing a cloud vault: another active writer can create new copies, and Storage/SQL do not provide one cross-service transaction. Turning backup off retains the local recovery code for later resume. Missing-photo or non-JPEG/WebP legacy reports cannot use this backup protocol; keep their manual archive instead. No old cloud URL is fetched to fill a missing local photo.

After SQL review, the explicit deployment command is `supabase functions deploy android-backup-vault --project-ref <reviewed-project-ref> --no-verify-jwt`. The October 21 testing deployment used authenticated MCP; production deployment was not performed. Run [verify-android-backup.sql](../../../supabase/sql/verify-android-backup.sql) read-only against the selected project after applying the forward SQL. The isolated PostgreSQL fixture can be rerun with `node tools/test-android-backup-sql.mjs`; it uses PGlite 0.5.10 installed under ignored `.tools/sql-validation/`, never a production connection.

To recreate the optional isolated SQL test dependency, run `npm install --prefix .tools/sql-validation --no-audit --no-fund --save-exact @electric-sql/pglite@0.5.10`. It is not part of the APK or root app dependency tree. VS Code may discover a temporary `android-wrapper-bootstrap` Gradle helper under `.tools/`; select **Use Java 21 as Gradle JVM** if it reports Java 25 incompatibility. Keep the project's pinned Gradle version.

## Custom OTA through GitHub Releases

Native Java/OkHttp checks an allowlisted GitHub Release metadata asset, verifies a detached RSA SHA-256 signature, then verifies the archive hash, complete file inventory, model identity, and compatibility versions. Keys are RSA 3072 bits or stronger. TLS and signatures are required; there is no unsigned fallback. ZIP traversal, duplicate paths, symlinks, oversized content, and private storage paths are rejected.

An update downloads to staging. It becomes selectable on the next cold process launch, never during diagnosis or an Activity rotation. SQLite, photos, and credentials stay outside bundle directories. The app sends its health acknowledgment after the model and SQLite readers work; failure before acknowledgment causes fallback to the previous healthy bundle or packaged APK on the next cold launch. A monotonic sequence blocks replay of accepted old updates. To deliberately restore older web behavior, publish that approved content with a **new higher sequence**. This protocol pins model, bridge, and schema identity; incompatible changes need a separately reviewed APK/model adoption.

Configure these non-secret Gradle properties when building a release host: `otaRepository`, `otaMetadataUrl`, `otaSignatureUrl`, `otaPublicKeyBase64` (Base64 X.509 RSA public key). The production wrapper loads their reviewed values from the external signing configuration. Release builds now refuse missing configuration; Debug always disables remote OTA. Private signing keys stay outside this repository and all public artifacts.

On a clean, tested source checkout, prepare a separate output directory:

```powershell
node tools/android-bundle.mjs prepare --export .android-web/<fingerprint>/out --output .tools/android-release/<unique-sequence> --version 0.8.0 --sequence <next-integer> --source-commit <full-tested-sha> --archive-url https://github.com/RANDAAAALL/mangoleaf-ai/releases/download/<approved-tag>/web-update.zip
node tools/android-bundle.mjs sign --metadata .tools/android-release/<unique-sequence>/update.json --key <external-private-key-path>
node tools/android-bundle.mjs verify --metadata .tools/android-release/<unique-sequence>/update.json --signature .tools/android-release/<unique-sequence>/update.sig --public-key <external-public-key-path> --archive .tools/android-release/<unique-sequence>/web-update.zip --repository RANDAAAALL/mangoleaf-ai
```

For this Windows signing setup, prefer the checked preparation wrapper over the low-level commands above:

```powershell
bun run android:release:windows -Action ota -Apk ".tools/android-release/apk-<timestamp>/mangoleaf-ai.apk" -Receipt ".tools/android-release/apk-<timestamp>/release-receipt.json" -Sequence 2 -Tag "<new-approved-tag>"
```

Replace all placeholders. Choose a sequence higher than **every published sequence**, not merely the APK's packaged sequence. The helper verifies the signed host/receipt/public trust, rebuilds the production Android export with committed model assets, rejects incompatible model/bridge/schema/host inputs, signs using the encrypted external key and verifies the finished archive. It retains an unpublished candidate in fresh `.tools/android-release/ota-<timestamp>/`. The helper cannot infer the highest remote sequence while offline. A rollback also needs a new higher sequence.

Publish only the verified `web-update.zip`, exact `update.json`, and `update.sig` as OTA assets after release validation. The public key and candidate receipts are maintenance evidence, not extra updater inputs. GitHub's automatic Source code ZIP is not the update bundle. Keep these three assets and the current production APK on every stable release chosen by the host's `releases/latest/download/` URLs; a latest release without assets cannot serve updates. Builds never upload assets, install an APK, move a tag or promote Vercel. Intended-device checks, controlled server verification, OTA interruption/rollback tests, exact-source CI and release approval remain gates.

## Verification and remaining evidence

Follow the [Android verification instructions and evidence limits](../../testing/ANDROID_TESTING.md) and [physical checklist](../../testing/PHYSICAL_RELIABILITY_CHECKLIST.md). Existing R01–R04 scope still applies. Compilation and emulator recovery do not establish successful native inference, physical-device reliability, or field accuracy; live cloud checks and production signing/distribution remain separate gates.

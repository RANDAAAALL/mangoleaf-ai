# MangoLeaf AI Android APK Versioning Guide

**Precommit validation, October 26:** the maintainer reports completing latest Debug APK and testing-website checks. The retained browser R03 report passed on current source/model inputs; it does not establish native or production-signed APK reliability. APK **0.1.8/code 9**, bundle **0.12.0**, Model **V4.5.0** remain candidate labels. CI, exact production artifact/staged acceptance and approval are still required before the prepared v0.12.0 tag is created or pushed. See [evidence scope](../testing/TESTING.md#october-26-2026).

**History performance follow-up, October 26:** rebuild the unpublished 0.1.8/code 9 candidate to include metadata-only History, on-demand private photos and scoped refreshes. Model V4.5.0 and SQLite/bridge versions remain unchanged. Confirm Home/History pagination, details, offline photos and deletion on the exact new APK; earlier same-version installer receipts do not cover these source changes. See [performance evidence](../PERFORMANCE.md#history-photo-loading-and-scoped-refreshes-october-26-2026).

**October 26 native updater candidate:** Production APK updates download inside MangoLeaf AI with progress/cancellation, then open Android's installation confirmation. No browser or custom completion/reopen popup is used. About retains Update Now; offline it is disabled. Debug excludes production installers. Existing phones first need an APK containing this capability. App 0.12.0 / APK 0.1.8/code 9 / Model V4.5.0 remain unpublished candidates.

**Current source candidate, October 25:** app **v0.12.0**, Production APK **v0.1.8/code 9**, Debug **v0.1.8-dev**, default OTA host bounds **9-9**, adopted Model **V4.5.0**, bridge/SQLite schema **1/1**. This is an unpublished working-tree candidate. Published v0.11.0 / APK 0.1.7/code 8 / sequence 6 and its tag, signed assets and receipts remain unchanged. No new OTA sequence is allocated. Exact-source CI, current-build reliability, physical-device checks, production signing and publication/promotion require separate evidence. Earlier dated entries retain their original scope.

The candidate’s **Restore backup data** action copies completed scans into the receiving phone’s History while keeping its own code and Pause setting; a phone without a code creates and displays its own separate code after source verification. Uploads and deletion stay scoped to that receiving backup. Production APK adds a dismissible newer-native-version notice with verified internal download and explicit Android installation; Debug excludes production offers. See the [dated candidate record](history/PWA_RELEASE_HISTORY.md#v0120-separate-backup-restore-and-apk-notice-candidate) and [acceptance checks](../testing/TESTING.md#october-25-2026).

**Published follow-up, October 25:** GitHub Latest is now [v0.11.0](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.11.0), tag target `f6e04842c13b1e3f5e86e5bf468be8abcbc18601`, with production APK 0.1.7/code 8, sequence-6 OTA bounds 8-8 and Model V4.5.0. All four remote asset digests match the retained local files. The maintainer reports completing the exact production-phone checks; no new device logs/timing measurements were supplied. Vercel promotion/live identity is separate and was not verified here. Preserve the published tag/assets; later helper/docs commits do not change them. The dated preparation statements below retain their earlier scope.

**Earlier candidate preparation, October 25:** shared app **v0.11.0**, Release APK **v0.1.7/code 8**, Debug **v0.1.7-dev**, default bundle bounds **8-8**, Model **V4.5.0**, bridge/schema **1/1**. This labels the recovery-code-first backup workflow; no native API or SQLite migration is introduced. GitHub [v0.10.1](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.10.1) was the published release at preparation; its installer, OTA assets and receipts remain unchanged. Older hosts must install the new same-signer APK to use host-8-only bundles. No OTA sequence or production-signed artifacts were allocated by that metadata change. Earlier preparation and test records below describe their original versions.

**Later production candidate/tag check:** the maintainer built APK 0.1.7/code 8 and matching sequence-6 OTA and pushed `v0.11.0` at `f6e04842c13b1e3f5e86e5bf468be8abcbc18601`. Read-only inspection found no published v0.11.0 Release. Current local folders are `apk-2026-10-25T07-50-02-394-PHT` and `ota-2026-10-25T07-56-08-511-PHT` under `.tools/android-release/`; their renamed files retain exact original hashes/signatures. See [candidate identities and remaining evidence](../testing/TESTING.md#october-25-2026). Later uncommitted helper/docs edits are not retroactively included in the pushed tag; do not move it. No new production-phone pass or Vercel promotion is inferred.

**Maintainer acceptance before commit:** after checking the latest provided Debug APK, the maintainer reported that the APK and icon are okay and requested categorized commits. Record this as reported device/appearance acceptance of the prepared 0.1.6-dev / V4.5.0 candidate. No new timing measurements, both-phone diagnostic exports or phone-side hash were supplied; current-build R03, production-signed validation and release approval remain separate. The earlier My Files border observation does not establish that every One UI surface now suppresses OEM styling.

**Branding-r2 local verification:** Android web bundling used committed V4.5.0. Debug lint, assembly and packaged-asset checks passed with 21 JVM cases and three API-36 branding instrumentation cases. Installed application/launcher and archive metadata resolve the white-backed adaptive resource; every pixel of the supplied background layer is white, and system-startup foreground transparency remains. The APK signature matches the maintainer's earlier Debug signer and all five packaged model files match adopted Git bytes. These resource checks do not validate Samsung My Files styling. The r2 APK and receipt are under ignored `.tools/android-debug-candidates/0.1.6-branding-r2/`; the candidate remains unpublished.

## Icon and APK download follow-up (October 24, 2026)

**Current status, October 24:** the maintainer published shared app [v0.10.0](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.10.0) from `e624441e75896964e996be0e56a88c172b5c2bdb`, with APK v0.1.5/code 6, model V4.5.0 and OTA sequence 4, and reported production promotion. Current-build R03 and the reported APK/download checks passed before publication. Later phone evidence revealed intermittent capture delays and a first-result splash. Source now prepares **unpublished v0.10.1 / APK v0.1.6/code 7**, bounds 7-7; model/bridge/schema remain V4.5.0/1/1. Preserve published assets and tags. New candidate validation, CI, signing and release approval remain separate.

**Local patch checks:** ordered type/lint/static-build and export checks, 188 tooling tests/711 assertions, 41 selected browser cases (one intentional skip), 21 JVM cases, Debug lint/assembly/assets, two API-36 branding assertions, and the controlled actual-Android export smoke passed. The latter confirms first-result presentation and the packaged camera worker, not phone timing or native inference. Fresh physical capture/My Files checks and current-build R03 remain pending. See the [dated verification record](../testing/TESTING.md#october-24-2026).

**Maintainer Debug follow-up, October 24:** the maintainer rebuilt and installed APK 0.1.6-dev using the standard Debug commands and reported no problems so far. All five packaged model files match adopted V4.5.0 Git bytes. This is a basic reported device check, not new timing measurements or complete two-phone/R03 evidence. `adb install -r` does not put an APK in My Files; copy the built file with `adb push` to inspect a fresh Downloads thumbnail. That visual check remains pending.

**Current branding correction:** application, round/package and launcher icons now reference the same adaptive leaf on solid white. This restores the requested white-backed Package Installer appearance after the plain application-icon experiment exposed only the green leaf. The launcher foreground/background and separate Android system-startup leaf are unchanged. No gray border, stroke or shadow is supplied in those icon layers.

The maintainer's fresh-file screenshot still shows a border in Samsung My Files and identifies One UI 8.5. Samsung icon rendering can add night/shadow styling, and an [independent renderer implementation](https://github.com/Palmoe/OneUI-Icon-Extractor) identifies its tray-specific API path on 8.5. This is evidence for an OEM effect, not direct inspection of this phone's My Files loader or a verified app-side suppression switch. Android also documents [OEM masks and visual effects](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive). Do not claim a border-free My Files thumbnail from passing resource tests. Use a distinctly named `0.1.6-debug-branding-r2` APK and record installer, launcher, startup and My Files appearances separately; candidate receipts distinguish attempts sharing version 0.1.6/code 7.

Capture encoding now uses a dedicated worker and the unchanged centered square/JPEG quality. Worker failure or a five-second timer falls back to immediate same-quality JPEG encoding. Cancel/background terminates the worker and suppresses late publication. First result details load with the APK entry so opening them cannot trigger the root loading fallback. Exact phone latency and thumbnail appearance remain pending new-build observations.

Rebuild/sign and install the same-package, same-signer APK over the existing app; do not uninstall. OTA cannot replace native resources. Code-7-only OTA assets do not update code-6 APKs. The existing production attachment route and exact-release fallback remain unchanged; the maintainer reported successful phone downloads for v0.10.0. Source, native, physical-device and release checks have separate scope; see [October 24 evidence](../testing/TESTING.md#october-24-2026).

Use this guide for current APK versions, builds, signing and updates. The [Android APK history](history/ANDROID_APK_HISTORY.md#candidate-timeline) preserves dated implementation records and earlier behavior. Exact artifact hashes and test outcomes remain in [Android testing](../testing/ANDROID_TESTING.md).

## Current native identity

| Identity                      | Current source candidate | Source                                      |
| ----------------------------- | ------------------------ | ------------------------------------------- |
| Production APK                | `0.1.8`                  | `versionName` in `android/app/build.gradle` |
| Debug APK                     | `0.1.8-dev`              | Native version plus Debug suffix            |
| Android update number         | `9`                      | `versionCode` in `android/app/build.gradle` |
| Default compatible host range | `9-9`                    | `tools/android-bundle.mjs`                  |
| Native bridge / SQLite schema | `1` / `1`                | Existing compatibility checks               |
| Shared website / web bundle   | `0.12.0`                 | Root `package.json`                         |
| Adopted bundled model         | `v4.5.0`                 | Committed model assets and constants        |

Published v0.11.0 remains APK 0.1.7/code 8 with sequence-6 OTA bounds 8-8. The table identifies unpublished source, not a published installer or passed physical test. New default host-9-only assets require the new same-signer installer; old tags and signed metadata are not rewritten. APK footers read the installed host; About separately shows the web-bundle version. Repeat affected source, browser, Android and physical checks for the new candidate.

## Version rules

- `versionName` is the human-readable APK version. `versionCode` is Android's integer update number; increase it for a newer distributed APK. Debug adds `-dev` and uses the separate `com.mangoleaf.ai.debug` package; Release uses `com.mangoleaf.ai`.
- A changed Java host, manifest, permission, native dependency or compatibility requirement needs a rebuilt, signed APK. Review its native version/code and bundle host bounds together. Web OTA cannot add native metadata or methods to an installed APK.
- Compatible web-only OTA changes need a sequence higher than every published sequence. Do not confuse that sequence with the APK's version code or the shared web version.
- Give changed shipped web builds their reviewed distinct app label under [PWA versioning](PWA_VERSIONING.md). Follow [model versioning](AI_MODEL_VERSIONING.md) before adopting another model; an APK version bump does not adopt V5.
- Record the tested commit, input fingerprint, APK hash, signing certificate, model identity and cloud target. A version label alone cannot distinguish multiple uncommitted candidate attempts. Documentation-only moves do not require a version bump.

### Installing a newer APK versus reopening an old installer

The APK in a phone's Downloads folder is a fixed installer file. Opening it does not fetch a newer release. Android's **Update** prompt indicates an installation over an existing package; it does not establish that the selected file is newer than the installed version. For a native update, download the current approved APK from the official website or its exact GitHub Release, install it over the existing same-signer app, then check the installed APK version. Do not uninstall or clear app data to update.

Opening the app can check for signed, compatible web-bundle updates; it does not silently install a new native APK. OTA cannot change the native version shown in the footer. Published v0.11.0 uses APK 0.1.7/code 8 and sequence-6 OTA bounds 8-8, so older native hosts need that installer before they can use those assets. A previously downloaded APK does not change when a newer GitHub Release is published. See [Android's versioning rules](https://developer.android.com/studio/publish/versioning).

## Build in VS Code on Windows

Use JDK 21, Android SDK platform 36, a current Android System WebView and the checked-in Gradle Wrapper. Gradle is pinned to 8.13 and AGP to 8.13.2; Java source compatibility is 17. Android Studio can supply SDK/emulator tools while VS Code and PowerShell run builds. See [SETUP.md](../../SETUP.md) for prerequisites and environment configuration.

After changing code, build the web files, then the APK, then install the newly built APK. `adb install -r` alone installs the existing file; it does not compile source changes.

For the routine Windows USB workflow, use `bun run android:devices` to list devices, `bun run android:debug:install` to install the existing Debug file, or `bun run android:debug` to check the runtime, stage testing app files, build/verify and install. These commands use `tools/android-debug.ps1`, require one authorized USB phone for installation, retain the same Debug signer/data, and stop before installation on any failed prerequisite/build check. See [shortcut prerequisites and SDK discovery](../../SETUP.md#debug-apk-shortcuts-on-windows). The full shortcut verifies packaged assets; the additional unit/lint/instrumentation/reliability checks below remain separate release evidence.

```powershell
bun run security:runtime
bun run android:bundle
Push-Location android
try {
    .\gradlew.bat testDebugUnitTest lintDebug assembleDebug verifyDebugBundle --no-daemon --max-workers=2
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
} finally {
    Pop-Location
}
```

Debug output is `android/app/build/outputs/apk/debug/app-debug.apk`. List devices with `adb devices -l`; select one with `adb -s <device-serial> install -r <apk-path>` when several are connected. Keep the matching signing key and package ID. Do not uninstall or clear app data to update an existing installation.

`android:bundle` stages an isolated static export with Serwist disabled. It normally reads model assets/constants from committed `HEAD`, preserving local V5 experiments. `--working-model` is an explicit research override, not adoption. `build-inputs.json` records the selected source/model/backend identity. Refresh the public offline guideline snapshot only when intended with `bun run android:guidelines`.

## Production signing and candidate preparation

From the repository root, using the approved external signing setup:

```powershell
bun run android:release:windows -Action check
bun run android:release:windows -Action build
```

The build checks configuration, prepares the production Android export, signs/lints the APK, verifies packaged assets and independently checks the SDK signer/package/alignment. It writes a fresh unpublished `mangoleaf-ai.apk` and `release-receipt.json` under ignored `.tools/android-release/apk-<timestamp>/`. Debug stays testing-only and cannot substitute for a signed production artifact. On other systems use the equivalent `bun run android:release check` / `build` with external Gradle properties/environment values.

Default APK and OTA folder timestamps now use `Asia/Manila` with a `-PHT` suffix, for example `apk-2026-10-25T07-50-02-394-PHT`. This is a developer output-label change; receipt UTC timestamps, signed metadata, hashes, native/web/model versions and explicit `--output`/`-OutputDirectory` choices remain unchanged. Renaming an existing local candidate requires a preserved path mapping and matching before/after file hashes, rather than editing or re-signing its contents.

Permanent keys live outside Git under `%USERPROFILE%\.mangoleaf-ai\signing`: APK key `release.p12` (alias `mangoleaf-release`) and separate encrypted OTA key `ota-private.pem`. Windows credentials are CurrentUser DPAPI-protected; the wrapper restores its environment and withholds private signing values from web/SDK children. Missing credentials fail closed. Never regenerate keys to bypass missing access. **Back up both keys and their passwords portably before publication**; copying DPAPI credentials alone is insufficient on a replacement Windows account.

For local production-artifact testing before upload, use `bun run android:release:install -Apk "<verified-apk-path>" -Receipt "<matching-release-receipt-path>"` with one authorized USB phone. This invokes the Windows wrapper's `-Action install`, loads only the public signer configuration, verifies the exact production artifact with the existing SDK/receipt checks, then uses `adb -d install -r`. It updates a matching installed production package without uninstalling or clearing data; it neither builds nor publishes anything and does not require the three OTA assets. Select paths from the new build, not a previous version's manifest. See [release shortcuts](../../SETUP.md#release-workflow-shortcuts) for arguments and evidence limits. R03-only execution is available as `bun run test:reliability:r03` from the intended source copy.

## Runtime and data preservation

| Runtime                                    | Local reports/photos                               | Cloud target                 | Upload/recovery                             |
| ------------------------------------------ | -------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| Development browser/tunnel, every viewport | Legacy IndexedDB data retained, no scan/History UI | Testing public settings only | No private uploads, diagnostics or recovery |
| Debug APK                                  | SQLite / private photo files                       | Pinned testing project       | Automatic uploads; explicit code/restore    |
| Production APK                             | SQLite / private photo files                       | Pinned production project    | Automatic backup; explicit code/restore     |
| Published website, every viewport          | Legacy IndexedDB data retained, no scan/History UI | No private backend work      | Landing/download only                       |

### Separate testing project

`bun run dev` and default Android bundles select `mangoleafai-testing` through ignored `.env.testing.local`; `android:bundle --release` selects production settings. Variant/host/project checks must agree. Testing and production credentials remain separate. Never send automated scans to production or copy its reports/photos/users into testing. The initialized projects must not be recreated or initialized again. See [cloud configuration and preservation](../security/SECURITY-AND-SYNC.md).

### Cloud recovery without Sign In/Register screens

Both APK variants save locally by default. Ordinary startup, saving and reconnection do not initialize private ownership or uploads before own-code setup, except preserved own deletion retries. Explicit **Create recovery code and enable backup** attaches verified credentials to an existing eligible anonymous owner or establishes a new owner. Persisting verified own credentials enables foreground/online uploads without another saved-code checkbox. Save this phone’s code outside the phone; creation does not mean uploads have finished.

**Restore backup data** verifies the typed code in an isolated temporary source reader and copies completed scans into History. An existing receiving Code B, owner and Pause setting stay unchanged. With no own code, Restore creates and displays a separate receiving code after source verification, preserving an eligible legacy receiving identity. It never rotates the source owner into a new credential. Wrong source credentials or failed setup must preserve prior settings and leave unsafe uploads off. A partial photo failure retains committed local copies and leaves a newly created receiving code available. Save that new code: the source code cannot recover scans saved only in the receiving backup. Existing deliberately shared-code installations are not silently split.

After copying A’s two scans into B’s five, B has seven local scans and the message says **Restored 2 scans**. B’s cloud backup reaches seven only after its own enabled uploads finish. Source A stays unchanged. Repeating a restore adds zero for existing IDs; native metadata checks count actual visible insertions rather than optional acknowledgments. Preserve local deletion records and hidden pending-delete rows. A timeout/rejection remains a failure even if a native write later settles. Interrupted uploads retry after reopening/reconnection; an interrupted source copy can be retried explicitly.

SQLite/private photos, credentials and deletion jobs remain outside replaceable bundles. History deletion targets the receiving phone’s own manifest-paired cloud copy, independently of upload Pause. It does not delete a separate source backup or another phone’s local copy. Deliberately shared-code devices still share that cloud namespace and must pause stale uploads before deletion. Internal saved-own-code reconnection can recover an expired own session and finish its scoped jobs; temporary foreign readers never consume them. No Sign In/Register, manual file import/export, browser backup or cross-device deletion propagation is added. Public guidelines stay independent.

### Server preparation and review

Existing production/testing resources are deployed; this guide does not authorize rerunning initializers, changing providers or deleting historical resources. Production enrollment uses the server-only `ANDROID_BACKUP_PROVISIONING_ENABLED=true` gate, verified Auth, existing quotas and unchanged owner/path RLS. Disabling that flag stops new enrollment, not existing-session transfers or queued deletions. Keep schema/users/files/credentials/outboxes during rollback. Authoritative setup, preservation limits and rollback instructions are in [SECURITY-AND-SYNC.md](../security/SECURITY-AND-SYNC.md); dated deployment evidence is in the [Android history](history/ANDROID_APK_HISTORY.md#production-cloud-deployment-status-october-22-2026).

## Website Open or install

### Installed and available APK versions

Production APK footers use `Android APK v0.1.4 / Model v4.5.0`; Debug uses `Android APK v0.1.4-dev / Model v4.5.0` for those installed hosts with the default committed model. The actual bundled model label remains authoritative; no label adopts a research model. Missing/malformed host version names retain the browser-style app/model fallback. The host already supplies `hostVersionName`, so this display change does not add a native API or change host/schema bounds.

The website's download page distinguishes the GitHub release tag from the available native APK version. After validating the stable release and exact uploaded `mangoleaf-ai.apk` asset, it accepts an asset **label** such as `Android APK v0.1.4`. The release builder and OTA helper print the label from the verified APK receipt; copy it when publishing. An unlabeled older release remains downloadable without a guessed native version. This is publisher-supplied display metadata, not browser verification of the APK's certificate/manifest and not an installed-version check.

When using GitHub CLI after release approval, its supported `file#label` syntax sets the label without renaming the asset. For example, replacing the tag/path and using the actual version printed by the build:

```powershell
gh release upload <approved-tag> ".tools/android-release/apk-<timestamp>/mangoleaf-ai.apk#Android APK v0.1.4"
```

The required four release assets remain `mangoleaf-ai.apk`, `web-update.zip`, `update.json` and `update.sig`. On a web-only release, keep the reused APK's native label even when the GitHub/web version changes. Never label a Debug APK as production. See [GitHub's upload-label syntax](https://cli.github.com/manual/gh_release_upload).

Android website actions attempt a fixed-package user-tapped intent with a same-origin `/download` guide fallback. A supported browser's positive exact-package result shows **Open app**; empty, failed, timed-out or unsupported results remain unknown. Confirmed installations make another APK download a deliberate reinstall/update choice. This hint is never Auth/bridge authorization or proof from a browser shortcut.

Release `asset_statements` associates only `https://mangoleafai.vercel.app`; Debug has no production association. Development intents target Debug, published builds target Release. Detection needs the updated APK and matching HTTPS website manifest/origin; a web OTA alone cannot add this native association. Preserve fixed navigation and ignore incoming URI data/extras. Changing the associated public origin requires a rebuilt APK and repeat checks. The supported mobile product is Android only; desktop retains its website/QR guide.

## Custom OTA through GitHub Releases

After finalizing and testing source, prepare signed compatible web files with a new sequence:

```powershell
bun run android:release:windows -Action ota -Apk ".tools/android-release/apk-<timestamp>/mangoleaf-ai.apk" -Receipt ".tools/android-release/apk-<timestamp>/release-receipt.json" -Sequence <next-higher-integer> -Tag "<approved-tag>"
```

Replace placeholders and choose a sequence higher than **every published sequence**, including rollbacks. The wrapper checks the signed APK/receipt/public trust, committed model, host/bridge/schema compatibility and finished signed archive. Its local output remains unpublished. The detailed earlier low-level commands are preserved in [OTA history](history/ANDROID_APK_HISTORY.md#custom-ota-through-github-releases).

The native updater uses Java/OkHttp, TLS, a pinned GitHub repository and RSA signature verification, then checks hashes, complete inventory and compatibility. There is no unsigned fallback. Downloads stage separately from SQLite/photos/credentials. A verified staged update offers **Restart now** / **Later** only while idle; camera/review/diagnosis/dialogs defer it. Explicit restart waits for native writes and rechecks the bundle before recreating the trusted Activity. Ordinary recreation does not activate it. Cold-start selection retains health acknowledgment and rollback. Debug disables production OTA.

### Website, APK and OTA in plain English

1. Edit, build and test the exact candidate. Pushing source alone does not update installed APKs.
2. After CI, required release validation and approval, publish the tested `mangoleaf-ai.apk`, `web-update.zip`, `update.json` and `update.sig` together on the stable GitHub Release selected by `latest`. GitHub's automatic source ZIP is not the OTA bundle.
3. Existing compatible production APKs check/download/verify the OTA, then offer restart. A new native host or incompatible model/bridge/schema needs an appropriate signed APK/model release instead.
4. Vercel separately builds/promotes the website under the [PWA release process](PWA_VERSIONING.md#candidate-testing-and-promotion). Promote the exact tested deployment. A GitHub tag/release does not control Vercel promotion.

## Verification and remaining evidence

Follow [Android testing](../testing/ANDROID_TESTING.md), [TESTING.md](../testing/TESTING.md) and the [physical-device checklist](../testing/PHYSICAL_RELIABILITY_CHECKLIST.md). Before publication, require the applicable automated/native checks, recorded physical-device and backup/recovery/OTA interruption/rollback observations, full R03, portable signing-key/password backup, exact-source CI and release approval. Local compilation, mocks and artifact signatures do not establish physical reliability or model accuracy. Preserve pending checks honestly; rebuilding after changed inputs requires affected checks again.

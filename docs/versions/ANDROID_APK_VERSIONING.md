# MangoLeaf AI Android APK Versioning Guide

**Current candidate, October 25:** shared app **v0.11.0**, Release APK **v0.1.7/code 8**, Debug **v0.1.7-dev**, default bundle bounds **8-8**, Model **V4.5.0**, bridge/schema **1/1**. This labels the recovery-code-first backup workflow; no native API or SQLite migration is introduced. GitHub [v0.10.1](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.10.1) is published; its installer, OTA assets and receipts remain unchanged. Older hosts must install the new same-signer APK to use host-8-only bundles. No OTA sequence or production-signed artifacts are allocated by this metadata change. Earlier preparation and test records below describe their original versions.

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

| Identity                      | Current value | Source                                      |
| ----------------------------- | ------------- | ------------------------------------------- |
| Candidate production APK      | `0.1.7`       | `versionName` in `android/app/build.gradle` |
| Candidate Debug APK           | `0.1.7-dev`   | Native version plus Debug suffix            |
| Android update number         | `8`           | `versionCode` in `android/app/build.gradle` |
| Default compatible host range | `8-8`         | `tools/android-bundle.mjs`                  |
| Native bridge / SQLite schema | `1` / `1`     | Existing compatibility checks               |
| Shared website / web bundle   | `0.11.0`      | Root `package.json`                         |
| Adopted bundled model         | `v4.5.0`      | Committed model assets and constants        |

GitHub v0.10.1 is published; its separately prepared installer is APK 0.1.6/code 7. The table describes the new unpublished backup-workflow candidate. No model adoption, native API or SQLite migration accompanies it. APK footers use the installed native version/model; the separately replaceable web version stays visible in About. Available APK labels come only from verified published assets, never the web tag or an installation hint. New source/export/tooling/browser checks and the matching testing Debug build passed; see the [versioned evidence and remaining device/release checks](../testing/TESTING.md#october-25-2026). Previous candidate results do not approve the new installer.

## Version rules

- `versionName` is the human-readable APK version. `versionCode` is Android's integer update number; increase it for a newer distributed APK. Debug adds `-dev` and uses the separate `com.mangoleaf.ai.debug` package; Release uses `com.mangoleaf.ai`.
- A changed Java host, manifest, permission, native dependency or compatibility requirement needs a rebuilt, signed APK. Review its native version/code and bundle host bounds together. Web OTA cannot add native metadata or methods to an installed APK.
- Compatible web-only OTA changes need a sequence higher than every published sequence. Do not confuse that sequence with the APK's version code or the shared web version.
- Give changed shipped web builds their reviewed distinct app label under [PWA versioning](PWA_VERSIONING.md). Follow [model versioning](AI_MODEL_VERSIONING.md) before adopting another model; an APK version bump does not adopt V5.
- Record the tested commit, input fingerprint, APK hash, signing certificate, model identity and cloud target. A version label alone cannot distinguish multiple uncommitted candidate attempts. Documentation-only moves do not require a version bump.

## Build in VS Code on Windows

Use JDK 21, Android SDK platform 36, a current Android System WebView and the checked-in Gradle Wrapper. Gradle is pinned to 8.13 and AGP to 8.13.2; Java source compatibility is 17. Android Studio can supply SDK/emulator tools while VS Code and PowerShell run builds. See [SETUP.md](../../SETUP.md) for prerequisites and environment configuration.

After changing code, build the web files, then the APK, then install the newly built APK. `adb install -r` alone installs the existing file; it does not compile source changes.

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

Permanent keys live outside Git under `%USERPROFILE%\.mangoleaf-ai\signing`: APK key `release.p12` (alias `mangoleaf-release`) and separate encrypted OTA key `ota-private.pem`. Windows credentials are CurrentUser DPAPI-protected; the wrapper restores its environment and withholds private signing values from web/SDK children. Missing credentials fail closed. Never regenerate keys to bypass missing access. **Back up both keys and their passwords portably before publication**; copying DPAPI credentials alone is insufficient on a replacement Windows account.

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

Both APK variants save locally by default. Ordinary startup, saved photos and reconnection do not establish private ownership or upload before recovery-code setup. While online, tap **Create recovery code and enable backup**: successful verified session/code storage enables automatic foreground uploads without an additional save-code confirmation. This new-code action explicitly enables uploads even if that older no-code installation had paused them. Save the code outside the phone. Existing anonymous owners retain their UUID/session and earlier backups when recovery credentials are attached. Existing code users retain enablement and deliberate `paused` or legacy `false` choices; a fresh existing-code connection enables backup without overriding a pause. Failed new-code creation preserves prior state and leaves uploads off; a failed existing-code connection preserves the prior verified session and upload choice.

Creating a code does not finish uploads. Existing eligible History and future scans back up while open/online; reopening or reconnection retries unfinished reports and skips completed copies. An interrupted photo may restart. On another APK, enter the existing code and explicitly restore completed backups. Restore verifies ownership/photo integrity, merges reports by ID, preserves original dates and honors local deletion records. Wrong codes preserve the current session. A verified same-vault reconnect can recover an unavailable saved session and finish that vault's pending deletions before promotion; a different vault cannot consume them. Creating an unrelated code cannot recover a forgotten vault. The October 25, 2026 client candidate is unpublished and needs its own affected validation; older installed bundles retain earlier backup behavior.

SQLite, private photos, credentials and deletion jobs stay outside replaceable OTA bundles. Android must fail closed if its trusted bridge is unavailable, never fall back to IndexedDB. Manual report import/export UI remains retired. Pause/Resume preserves deliberate pauses; queued History deletion retries remain active while connected even if uploads are paused. Deletion only targets the connected manifest-paired copies and does not propagate to other devices. Other devices holding stale copies must pause uploads before cleanup. Native launches ignore external URI payloads and retain the trusted local WebView.

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

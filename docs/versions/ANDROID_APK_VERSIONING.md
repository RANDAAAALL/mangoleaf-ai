# MangoLeaf AI Android APK Versioning Guide

**Shared web release candidate, October 23:** shared web advances to `0.9.0`; native stays `0.1.4`/code `5`, Debug `0.1.4-dev`, bridge/schema `1`/`1`, bounds `5-5`, adopted model `v4.5.0`. The local `v0.9.0-rc.1` tag is a candidate only. Rebuild signed APK/OTA assets for these finalized web inputs; preceding web-0.8.0 receipts remain dated evidence. See the [shared release record](history/PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026).

Use this guide for current APK versions, builds, signing and updates. The [Android APK history](history/ANDROID_APK_HISTORY.md#candidate-timeline) preserves dated implementation records and earlier behavior. Exact artifact hashes and test outcomes remain in [Android testing](../testing/ANDROID_TESTING.md).

## Current candidate

| Identity                      | Current value | Source                                       |
| ----------------------------- | ------------- | -------------------------------------------- |
| Production APK                | `0.1.4`       | `versionName` in `android/app/build.gradle`  |
| Debug APK                     | `0.1.4-dev`   | Native version plus Debug suffix             |
| Android update number         | `5`           | `versionCode` in `android/app/build.gradle`  |
| Default compatible host range | `5-5`         | `tools/android-bundle.mjs`                   |
| Native bridge / SQLite schema | `1` / `1`     | Android host and bundle compatibility checks |
| Shared website / web bundle   | `0.9.0`       | Root `package.json`                          |
| Adopted bundled model         | `v4.5.0`      | Committed model assets and constants         |

This is an unpublished working-tree candidate, not a public Android release. The [October 23 version-display evidence and pending device checks](../testing/ANDROID_TESTING.md#october-23-2026-version-display) identify this iteration. Native renderer rollback and restart/cancellation fixes require installing the rebuilt APK with its existing signer; OTA cannot update Java in an older host. Older receipts remain historical evidence.

APK, web bundle, OTA sequence and model versions are separate identities. **APK footers now show installed APK/model versions**; the web-bundle version remains separately visible in About. Browser footers keep shared app/model labels. Native names come from the trusted host, not a hardcoded React version. The shared web candidate is 0.9.0; public distribution still needs the reviewed shared-version and release gates below. See [version-display evidence](../testing/ANDROID_TESTING.md#october-23-2026-version-display).

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

| Runtime                          | Local reports/photos         | Cloud target                 | Upload/recovery                                      |
| -------------------------------- | ---------------------------- | ---------------------------- | ---------------------------------------------------- |
| Development phone browser/tunnel | Dexie / IndexedDB Blobs      | Pinned testing project       | Automatic test sync; no recovery controls            |
| Debug APK                        | SQLite / private photo files | Pinned testing project       | Automatic uploads; deliberate code/restore controls  |
| Production APK                   | SQLite / private photo files | Pinned production project    | Automatic backup; deliberate code/restore controls   |
| Published website                | Preserved browser History    | Public production guidelines | No development test sync or native recovery controls |

### Separate testing project

`bun run dev` and default Android bundles select `mangoleafai-testing` through ignored `.env.testing.local`; `android:bundle --release` selects production settings. Variant/host/project checks must agree. Testing and production credentials remain separate. Never send automated scans to production or copy its reports/photos/users into testing. The initialized projects must not be recreated or initialized again. See [cloud configuration and preservation](../security/SECURITY-AND-SYNC.md).

### Cloud recovery without Sign In/Register screens

The first eligible saved photo lazily establishes verified anonymous ownership and automatic uploads while foreground and connected. Empty History does not create an identity automatically. APK users explicitly create/save a private recovery code outside the phone for future recovery; creating it attaches credentials to the same Auth UUID. On another APK, enter that code and restore completed backups. Restore verifies ownership/photo integrity, merges reports by ID and preserves original scan dates. Wrong codes preserve the current session. Creating an unrelated code cannot recover a forgotten vault.

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

# MangoLeaf AI Android APK Versioning Guide

**November 3 candidate:** app/web **0.13.0**, Production host **0.1.9/code 10**, Debug **0.1.9-dev**, host bounds **10-10**, bridge/schema **1/1**, adopted **Model V5.1.0**. The existing unpublished host-10 bump covers the native startup changes; it is newer than the published host-9 APK. No additional native bump is needed for this candidate.

Settings owns language, private backup, diagnostics and Production App updates. Its Production update entry stays visible without claiming an unconfirmed latest version. Fresh class scores appear only in Android/testing Debug builds. Website scanning/private workers stay absent. Both APK variants keep existing SQLite/photos/credentials, receiving-backup ownership and deliberate pauses.

Model V5.1.0 is adopted in source; publication, signed Production testing and field accuracy are separate. Default Android bundles read the committed adopted model. Before its adoption commit exists, only explicit `--working-model` staging includes the uncommitted adoption; after commit, ordinary bundles include it. Preserve V4.5.0 as historical rollback evidence, not the default runtime. See [adoption](AI_MODEL_VERSIONING.md#current-adopted-model-v510-november-3-2026), [dated candidate](history/ANDROID_APK_HISTORY.md#apk-v019code-10-and-model-v510-candidate-november-3-2026), and [current testing](../testing/TESTING.md#november-3-2026).

GitHub [v0.12.0](https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.12.0), published October 26, is the verified published baseline. No new OTA sequence, signature, tag, upload or Vercel promotion is allocated by preparing these files. Recheck all published OTA sequences before selecting a higher unused sequence.

**R03 verified November 3:** app 0.13.0 / Model V5.1.0 passed the local browser 30-minute mixed-use check with 554 actual predictions and matching input hashes. This completes browser R03 for the candidate, not physical/native/Production acceptance. See [the exact report](../testing/TESTING.md#november-3-2026). Candidate version numbers and the prepared Debug APK stay unchanged.

## Current native identity

| Identity                      | Current source candidate | Source                                      |
| ----------------------------- | ------------------------ | ------------------------------------------- |
| Production APK                | `0.1.9`                  | `versionName` in `android/app/build.gradle` |
| Debug APK                     | `0.1.9-dev`              | Native version plus Debug suffix            |
| Android update number         | `10`                     | `versionCode` in `android/app/build.gradle` |
| Default compatible host range | `10-10`                  | `tools/android-bundle.mjs`                  |
| Native bridge / SQLite schema | `1` / `1`                | Existing compatibility checks               |
| Shared website / web bundle   | `0.13.0`                 | Root `package.json`                         |
| Adopted bundled model         | `v5.1.0`                 | Committed model assets and constants        |

Published v0.12.0 remains APK 0.1.8/code 9 with Model V4.5.0; its exact tag and signed assets remain unchanged. The table identifies unpublished source, not a published installer or passed physical test. New default host-10-only assets require the new same-signer installer; old tags and signed metadata are not rewritten. APK footers read the installed host; About separately shows the web-bundle version. Repeat affected source, browser, Android and physical checks for the new candidate.

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

### V5.1.0 research Debug model, November 1, 2026

**Historical November 1 comparison; superseded by November 3 adoption.** The maintainer authorized a temporary working-tree `v5.1.0-candidate` model for Debug testing; adopted V4.5.0 and all release gates remain unchanged. Default `android:debug` restages the committed model and must not be used to package this override. Instead run `bun run security:runtime`, `bun run android:bundle --working-model`, then from `android/` run `gradlew.bat testDebugUnitTest lintDebug assembleDebug verifyDebugBundle --no-daemon --max-workers=2`. Confirm the build-input receipt and packaged graph/shard hashes identify the candidate and testing backend before installing. Source/packaging checks do not establish final model accuracy, Keras/browser parity, physical reliability or field performance.

The original V5.1.0 export remains unchanged; the local runtime configuration explicitly sets confidence >=0.70 only, disabled margin/entropy gates and the already-folded temperature. The [trial and exact rollback instructions](../model-training/non-experiment/v5.1.0/TRIAL_v5_1_0.md#local-debug-model-and-rollback) preserve V4.5.0 model/configuration/constants/cache together. Rebuild/reinstall Debug after rollback; changing source files alone cannot change an installed APK. Historical data and production resources stay preserved.

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

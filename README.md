<h1 align="center">

<img src="public/images/icons/svg/favicon.svg" alt="MangoLeaf AI logo" width="80"><br/>
MangoLeaf AI
</h1>

MangoLeaf AI helps identify possible conditions affecting mango leaves and fruit from photos. Built for Android phones, it runs diagnosis on the device and keeps scan History available offline. Treatment guidance is available in English and Cebuano/Bisaya. The companion website remains accessible on desktop.

## Walkthrough

https://github.com/user-attachments/assets/71f91a97-ebe4-4ed2-86fe-6a4aeee69536

## Features

- Guided camera capture and photo upload, with review before diagnosis.
- On-device classification with confidence scores.
- English and Cebuano/Bisaya treatment guidance, saved for offline reading.
- Searchable local History with photos and confirmed report deletion.
- Automatic private cloud backup when connected, with recovery codes for restoration.

## Download and status

**Release candidate; production APK publication is pending.** The prepared candidate uses shared app **v0.9.0**, Android **v0.1.4**, and adopted model **v4.5.0**. These version labels do not indicate a published release.

The [official download page](https://mangoleafai.vercel.app/download) offers the installer when a stable GitHub Release includes the expected APK file. See the [Android release guide](docs/versions/ANDROID_APK_VERSIONING.md) and [candidate release record](docs/versions/history/PWA_RELEASE_HISTORY.md#v090-android-and-cloud-recovery-candidate-october-23-2026) for availability, validation, and approval status.

## Quick start

For development, follow [SETUP.md](SETUP.md) for the pinned Bun/Node runtimes and local environment files, then run:

```bash
bun run security:runtime
bun install --frozen-lockfile
bun run security:install
bun run dev
```

Open `http://localhost:3000` on the same computer. Development uses the separate testing backend. Android build instructions and verification commands are in the [setup guide](SETUP.md).

## Documentation

- [Setup](SETUP.md) · [Architecture](docs/ARCHITECTURE.md)
- [App releases](docs/versions/PWA_VERSIONING.md) · [Android releases](docs/versions/ANDROID_APK_VERSIONING.md) · [Model and training](docs/versions/AI_MODEL_VERSIONING.md)
- [Testing](docs/testing/TESTING.md) · [Physical-device checklist](docs/testing/PHYSICAL_RELIABILITY_CHECKLIST.md)
- [Privacy, backup, and recovery](docs/security/SECURITY-AND-SYNC.md) · [Dependency security](docs/security/DEPENDENCY_SECURITY.md)
- [Progress](docs/PROGRESS.md) · [Performance](docs/PERFORMANCE.md) · [Historical README notes](docs/versions/history/README_CANDIDATE_NOTES.md)

<details>
<summary>Moved README sections and historical bookmarks</summary>

<a id="android-implementation-candidate-october-20-2026"></a>
<a id="square-guided-camera-candidate-v080"></a>
<a id="local-diagnostics-and-confidence-display-prepared-v070"></a>
<a id="local-only-history-candidate-october-15-2026"></a>

The earlier [Android](docs/versions/history/README_CANDIDATE_NOTES.md#android-implementation-candidate-october-20-2026), [camera](docs/versions/history/README_CANDIDATE_NOTES.md#square-guided-camera-candidate-v080), [diagnostics](docs/versions/history/README_CANDIDATE_NOTES.md#local-diagnostics-and-confidence-display-prepared-v070), and [local-only History](docs/versions/history/README_CANDIDATE_NOTES.md#local-only-history-candidate-october-15-2026) candidate notes are archived with their original dates and evidence limits.

<a id="technology"></a>
<a id="optional-test-the-local-app-on-a-phone-or-another-computer"></a>
<a id="commands"></a>

Former [technology](docs/versions/history/README_CANDIDATE_NOTES.md#technology), [temporary device-testing link](docs/versions/history/README_CANDIDATE_NOTES.md#optional-test-the-local-app-on-a-phone-or-another-computer), and [command](docs/versions/history/README_CANDIDATE_NOTES.md#commands) sections are preserved in the archive. Use SETUP.md for current instructions.

<a id="current-model-in-the-repository"></a>
<a id="experimental-models"></a>
<a id="older-models"></a>
<a id="project-guides"></a>

The original [adopted-model](docs/versions/history/README_CANDIDATE_NOTES.md#current-model-in-the-repository), [experimental-model](docs/versions/history/README_CANDIDATE_NOTES.md#experimental-models), [older-model](docs/versions/history/README_CANDIDATE_NOTES.md#older-models), and [project-guide](docs/versions/history/README_CANDIDATE_NOTES.md#project-guides) links remain available there.

</details>

## Important note

MangoLeaf AI provides AI-assisted classifications and treatment guidance. It is a field-support tool, not a substitute for expert diagnosis, laboratory testing, or locally appropriate agricultural advice.

## License and data use

Original project material is covered by the [MangoLeaf AI Restricted Use License](LICENSE.md), attributed to MangoLeaf AI contributors. Anyone may use the official APK and website; source reuse, modification, and redistribution require written permission from the relevant copyright holders, subject to GitHub's platform permissions, applicable law, and third-party licenses. Each contributor retains rights to their own original work.

The application is developed for use in the Philippine agricultural context. Deployment operators are responsible for privacy notices, data handling, treatment guidance, and compliance with applicable requirements, including the Data Privacy Act of 2012.

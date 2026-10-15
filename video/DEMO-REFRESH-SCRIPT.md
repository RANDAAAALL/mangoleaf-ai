# MangoLeaf AI Demo Refresh

## Current output selection (2026-10-16)

The selected walkthrough is [MangoLeafAI-walkthrough-v2.mp4](MangoLeafAI-walkthrough-v2.mp4), linked from the root README. This selection keeps the existing 1920x1080, 60fps, 167.300-second render unchanged: 22,499,497 bytes, SHA-256 `26939c10100ffd86d7a1e1e3b99ad9ef35aa1794eab513f9e494fca9ecd2a33e`. No render was run for this selection.

The unused `MangoLeafAI-walkthrough-v3.mp4` output was removed at the maintainer's request. References below to preserving that MP4 describe earlier work; the original narration WAVs, source recordings, and request/timing ledgers remain available. The pinned `npm run render` command now writes to `MangoLeafAI-walkthrough-v2.mp4` so future renders reuse the selected output filename.

## Direction

Refresh the 1920x1080 HyperFrames walkthrough with the supplied current mobile UI. Keep the existing four-second leaf loading opener, ambient agrarian background, phone frame, brand outro, and background music. Use stills for stable app states and the supplied recordings for the scan sheet, camera, and diagnosis progress. Keep each screen in the phone viewport. The recordings are muted and center-cropped to the portrait viewport to remove black side bars.

Use a calm, confident, helpful agricultural-guide voice at about 125-135 words per minute, without sales emphasis. Generate each line with the existing HeyGen voice. A scene stays on screen through the end of its narration. After narration, show the arrow, tap once with the existing click sound, and hide the arrow immediately. Start the following scene after the tap sound. Keep the existing BGM under narration.

## Scene order and narration

| Scene | Source | Narration | Pointer action (phone-screen x,y) |
| --- | --- | --- | --- |
| 0 | Existing animated leaf loader | None | None |
| 1 | `assets/demo-refresh/source/01-landing.jpg` | MangoLeaf A-I checks mango health right on your phone, even offline. | Center of Scan nav: (198, 764). |
| 2 | `02-scan-option.mp4`, then held last frame | Tap Take Photo to capture one clear mango leaf or fruit. | Center of Take Photo card: (198, 495). |
| 3 | `03-camera-preview.mp4`, then held last frame | Center one whole mango in the guide, then capture your photo. | Capture Photo, over the `ure` letters: (204, 764). |
| 4 | `04-review-photo.jpg` | Review your photo, then run the AI diagnosis. | Run AI Diagnosis, over `Dia`: (215, 580). |
| 5 | `05-diagnosis-progress.mp4`, then held last frame | Your photo is checked on-device. Please wait a moment. | No pointer. |
| 6 | `06-result-english.jpg` | See the predicted condition, confidence, and care guidance. | Center of Bisaya control: (252, 465). |
| 7 | `08-result-bisaya.jpg` | Switch to Bisaya to share these treatment steps. | Close details, over `ang`: (198, 731). |
| 8 | `01-landing.jpg` (same still as supplied scene 7) | Saved scans stay in History for a quick return. | History label, upper part of `t`: (281, 785). |
| 9 | `07-history-list.jpg` | Open a saved scan to review the photo and result. | Scan-row chevron, vertically centered: (350, 286). |
| 10 | `06-result-english.jpg` (same still as supplied scene 9) | Switch guidance to Bisaya when it helps. | Center of Bisaya control: (252, 465). |
| 11 | `08-result-bisaya.jpg` | Clear Bisaya guidance helps growers choose next steps. | No pointer; hold through narration. |
| 12 | Existing brand outro | None | Hold for 1-2 seconds, then end. |

## Timing and media notes

The intro holds for four seconds. Use each generated HeyGen WAV duration for that voice clip, then place the arrow tap and next scene after the narration; do not use estimated narration timing in the final cut. The scan-option and camera recordings play, then their extracted last frames hold while narration finishes. The short diagnosis recording plays once and its last frame holds during the wait line. The arrow tip lands on the listed coordinate. The cursor disappears at the click; the small green ripple can fade afterward. Existing `assets/audio/click.wav` supplies every tap. Existing `assets/audio/bgm.wav` is looped into `assets/audio/bgm-demo-refresh.wav` (62.2 seconds) for this longer cut. Mute all source recordings.

## Media provenance

Inputs were copied from `C:\Users\My Pc\Downloads\mangoleafai-demo-video` into `assets/demo-refresh/source/`. The supplied landing images 1 and 7 are byte-identical, as are English result images 6 and 9, so each pair reuses one local copy. The hold images were extracted from their corresponding MP4 last frames. Rendering uses only assets inside `/video`.

## Final render

HeyGen generated 11 narration WAVs (51.88 seconds total). Final composition duration is 62.140 seconds. The pinned HyperFrames check passes with zero runtime, layout, motion, and contrast errors; three pointer-events findings remain informational. `MangoLeafAI-walkthrough.mp4` was replaced with the rendered 1920x1080 H.264/AAC cut (62.166667 seconds, 30 fps, 14,190,189 bytes). Spot checks cover loader, scan option, camera preview, Bisaya result, History, and outro frames.

## V2 update (2026-10-13)

The new cut keeps the supplied mobile recordings and stills inside the `/video` project, then adds four phone-free information cards before the walkthrough. The card sequence is:

1. **What is MangoLeaf AI?** Offline-first, on-device mango health support for mango farmers.
2. **Detectable conditions.** Anthracnose, Bacterial Canker, Sooty Mold, Bacterial Black Spot, Mango Scab, Healthy Leaf, and Healthy Fruit.
3. **Built for the field.** Names only: Next.js, React, Bun, TypeScript, Tailwind CSS, TensorFlow.js, Dexie, IndexedDB, Supabase, Serwist, and MobileNetV3-Large.
4. **Simple walkthrough.** Scan → Take a photo → View the diagnosed result → Scan History → Scan details.

The opener is now an opaque splash that shows only the original green leaf loader. The header, guide line, phone, benefits, and footer are hidden until the information cards begin, so no later-scene marks appear behind the loader. The green eyebrow dots and numbered step circles are removed. The source icon is the transparent `assets/images/mangoleaf-icon.svg`, derived from the app icon at `public/images/icons/svg/icon.svg` without its background rectangle.

### V2 narration and interaction

HeyGen generated 15 clips from voice `05f19352e8f74b0392a8f411eba40de1` at speed `1.08`. This keeps the requested calm delivery while reducing the overly slow feel. The source text is in `assets/demo-refresh/narration/v2-*.txt`; WAV and word-timing files are in `assets/voice/v2-*`. The request and duration ledgers are `assets/demo-refresh/audio_request-v2.json` and `assets/demo-refresh/audio_meta-v2.json`. The narration explicitly says **Mango Green Fruit**, **Green Box Guidance**, **Confidence Score**, **After that**, **Photo Tips**, **Take Photo**, **Mango Farmers**, and **MobileNetV3-Large**.

The pointer now travels for `0.56s` so viewers can recognize it, lands on the requested control, plays the existing click sound, and disappears immediately. Click cues are aligned as follows:

| Action | Composition time |
| --- | ---: |
| Scan bottom navigation | 58.161s |
| Take Photo | 68.870s |
| Capture Photo | 75.477s |
| Run AI Diagnosis | 84.199s |
| Bisaya result control | 97.717s |
| Isara ang detalye | 102.574s |
| History bottom navigation | 103.414s |
| Saved-scan chevron | 109.315s |
| Bisaya language control | 115.321s |

After closing the Bisaya result, the left copy is cleared while the landing page appears, then History is clicked and its left copy enters with the History scene. The final Bisaya scene holds through narration, followed by the brand outro for approximately three seconds.

### V2 media and render

The variable-frame-rate scan-option recording is normalized at `assets/demo-refresh/source/02-scan-option-cfr.mp4` (30 fps, full frame coverage) before it is placed in the phone. The composition is `126.711s` at `60fps`; HyperFrames reports no VFR preflight issue. BGM is `assets/audio/bgm-demo-v2.wav`. The new output is `MangoLeafAI-walkthrough-v2.mp4` (1920x1080 H.264/AAC, 60 fps, 126.716667s, 26,725,317 bytes). The prior render is preserved as `MangoLeafAI-walkthrough-v3.mp4` (1920x1080, 30 fps, 62.166667s, 14,190,189 bytes).

`npm run check` passes with zero runtime, layout, motion, and contrast errors. The remaining duplicate-media warning and three pointer-events notes are informational. Snapshot spot checks cover the loader, all four information cards, the phone flow, the History transition, Bisaya guidance, and the extended outro. The repository README was reviewed for the card content; it was not modified as part of this video-only update.

## V2 revision (2026-10-13)

The v2 composition now opens with six centered, phone-free information scenes after the leaf loader:

1. **What is MangoLeaf AI?** Title-only hold.
2. **Field-Ready Mango Health Diagnostic** with the requested offline classification description.
3. Five pale-green feature badges: No Login/Register, Offline Functional, On-device-AI-Diagnosis, English + Bisaya treatment guidance, and Scan History.
4. **Support 7 classes** with all three groups visible together: Leaf Diseases (Anthracnose, Sooty Mold, Bacterial Canker), Fruit Diseases (Mango Scab, Bacterial Black Spot), and Healthy (Healthy Leaf, Healthy Fruit).
5. **MangoLeaf AI Offline-First Tech Stack** with 11 pale-green badges in a centered 7-plus-4 layout, including MobileNetV3-Large.
6. **Simple Walkthrough** with the centered Scan → Take a photo → View result → Scan History → Scan details path.

The recurring brand header/guide line, eyebrow dots, and numbered step circles are removed from the rendered scenes. The loader leaf is 78px and the finale leaf is 90px. Demo labels now use Mango Leaf, Mango Green Fruit, Green Box Guidance, Confidence Score, treatment guidance, Mango Farmers, and the five shared feature badges. After the close-details tap, the landing screen appears briefly, History is selected, and only then does the History copy enter.

### V2 revision narration and timing

The revised narration scripts are in `assets/demo-refresh/narration/v2r-*.txt`; the ledger is `assets/demo-refresh/audio_request-v2r.json` and measured durations are in `assets/demo-refresh/audio_meta-v2r.json`. HeyGen was unavailable after its free voice-generation allowance reached zero, so this revision uses the installed Edge TTS `en-US-JennyNeural` voice at `+8%` rate for a clear, normal-calm delivery. WAV clips are in `assets/voice/v2r-*.wav`. The revised narration includes the requested Photo Tips, Take Photo, After that, Green Box Guidance, Confidence Score, Mango Farmers, and treatment wording.

The pointer keeps a `0.56s` travel so controls remain recognizable, then disappears at each click. The recalculated click cues are:

| Action | Composition time |
| --- | ---: |
| Scan bottom navigation | 74.082s |
| Take Photo | 82.910s |
| Capture Photo | 88.978s |
| Run AI Diagnosis | 96.126s |
| Bisaya result control | 108.742s |
| Isara ang detalye | 114.978s |
| History bottom navigation | 115.818s |
| Saved-scan chevron | 120.326s |
| Bisaya language control | 125.794s |

The composition is `138.284s` at `60fps`. The final brand scene holds for about `4.5s`. `assets/audio/bgm-demo-v2r.wav` is a looped extension of the v2 bed to cover the longer cut. The rendered output is `MangoLeafAI-walkthrough-v2.mp4` (1920x1080 H.264/AAC, 60fps, 138.300s, 19,951,471 bytes). `MangoLeafAI-walkthrough-v3.mp4` remains the preserved prior 30fps cut.

`npm run check` passes with zero runtime, layout, motion, and contrast errors. The duplicate-logo warning, pointer-events notes, and pointer-ring overflow remain informational. Visual spot checks cover the loader, title/description/badges, seven-class list, 7-plus-4 stack, walkthrough, phone result, History transition, and extended finale.

## V2 revision 2 (2026-10-13)

The latest V2 cut keeps the four-second leaf loader, then shows five centered information scenes before the phone walkthrough:

1. **What is MangoLeaf AI?** Title-only scene. Narration says only “What is MangoLeaf AI?”.
2. **Field-Ready Mango Health Diagnostic.** Exact requested Progressive Web Application description, followed by five pale-green badges: No Login/Register, Offline Functional, On-device-AI-Diagnosis, English + Bisaya treatment guidance, and Scan History.
3. **Support 7 classes.** Leaf Diseases, Fruit Diseases, and Healthy groups remain visible together.
4. **MangoLeaf AI Offline-First Tech Stack.** Five badges on row one, five on row two, and `Model: MobileNetV3-Large` alone on row three.
5. **Simple Walkthrough.** Centered Scan, Take a photo, View result, Scan History, and Scan details path.

Recurring demo-scene benefit badges and both footer lines were removed. Information headings use a matched 72px scale; descriptions and supporting labels are reduced to keep each scene readable at fullscreen size. The original 60fps composition remains, and the pointer keeps a `0.56s` travel with immediate disappearance at each click.

### V2 revision 2 narration and timing

The 11 phone-demo clips now reuse `assets/voice/refresh-*.wav`, the calm narration stems used for the preserved `MangoLeafAI-walkthrough-v3.mp4` cut. The V3 MP4 contains one mixed AAC track, so these preserved WAV stems are the editable voice source. New information-scene lines are `assets/demo-refresh/narration/v3voice-info-01-title.txt` and `v3voice-info-02-overview.txt`; their exact WAVs use the installed Edge TTS `en-US-JennyNeural` voice at `+8%` because the archival V3 mix has no standalone audio stem for those new words. Request and measured timing ledgers are `assets/demo-refresh/audio_request-v2-v3voice.json` and `assets/demo-refresh/audio_meta-v2-v3voice.json`.

Measured information starts are `4.000s`, `6.486s`, `26.036s`, `36.490s`, and `50.976s`. The phone demo starts at `61.820s`. Click cues are:

| Action | Composition time |
| --- | ---: |
| Scan bottom navigation | 68.221s |
| Take Photo | 74.723s |
| Capture Photo | 81.095s |
| Run AI Diagnosis | 86.135s |
| Bisaya result control | 97.014s |
| Isara ang detalye | 102.080s |
| History bottom navigation | 102.920s |
| Saved-scan chevron | 108.194s |
| Bisaya language control | 113.521s |

The composition target is `127.029221s` at `60fps`; the rendered file is `MangoLeafAI-walkthrough-v2.mp4` (1920x1080 H.264/AAC, `127.033333s`, `60fps`, `28,017,174` bytes). `npm run check -- --snapshots` passes with zero runtime, layout, motion, and contrast errors; one duplicate-media warning and the three existing pointer-events notes remain informational. Custom snapshots cover the title-only, combined overview/badges, seven-class, tech-stack, walkthrough, phone, and finale scenes. The previous V3 render remains preserved at `MangoLeafAI-walkthrough-v3.mp4`.

## V2 revision 3 (2026-10-13)

The V2 narrator is now one consistent voice from loader cards through phone demo: Edge TTS `en-US-JennyNeural` at `+14%` rate for a clear semi-calm delivery. The previous HeyGen `refresh-*.wav` stems are no longer referenced by `index.html`, so the speaker does not change mid-video and no narration clips overlap. The regenerated WAV/MP3 assets are `assets/voice/v2single-*.{wav,mp3}`; request text and measured durations are recorded in `assets/demo-refresh/audio_request-v2-single-voice.json` and `assets/demo-refresh/audio_meta-v2-single-voice.json`.

Every line was rewritten against the current V2 copy. Information scenes say the title and visible feature content for the overview, all seven condition classes, the complete offline-first stack and model, and the five-step walkthrough. Phone-demo lines now match the current Mango Leaf, Mango Green Fruit, Photo Tips, Take Photo, Green Box Guidance, Confidence Score, treatment guidance, Scan History, and Bisaya copy. The five information scenes start at `4.000s`, `6.366s`, `27.500s`, `41.218s`, and `57.336s`; the phone demo starts at `67.652s`.

The recalculated tap cues are:

| Action | Composition time |
| --- | ---: |
| Scan bottom navigation | 73.804s |
| Take Photo | 82.200s |
| Capture Photo | 90.788s |
| Run AI Diagnosis | 101.296s |
| Bisaya result control | 113.144s |
| Isara ang detalye | 119.092s |
| History bottom navigation | 119.932s |
| Saved-scan chevron | 124.848s |
| Bisaya language control | 130.940s |

The composition target is `145.950000s` at `60fps`; `assets/audio/bgm-demo-v2single.wav` loops the existing bed to the same duration. `npm run check` passes with zero runtime, motion, and contrast errors; the existing duplicate-logo warning, three pointer-events notes, and pointer-ring overflow remain non-blocking diagnostics. The final `MangoLeafAI-walkthrough-v2.mp4` is `1920x1080` H.264/AAC, `60fps`, `145.950000s`, and `30,749,386` bytes. `ffmpeg -v error -i MangoLeafAI-walkthrough-v2.mp4 -f null -` completes without errors. Visual spot checks cover the title, overview badges, seven-class list, tech stack, walkthrough, phone flow, and finale; all remain centered and readable.

## V2 revision 4 — Marcia voice and opening sync (2026-10-13)

The v2 narration now uses the same HeyGen Starfish voice ID as the preserved v3 source: `05f19352e8f74b0392a8f411eba40de1` (Marcia). The existing HeyGen V2 WAVs were generated at speed `1.08`, which keeps the voice recognizable while making the delivery less slow. The Edge TTS `v2single-*` clips are no longer referenced by `index.html`, so the rendered cut has one speaker identity from the opening card through the final Bisaya line.

The opening audio bug was corrected by matching each information-card entrance to its narration start. The first voice clip now begins at `4.000s`, when the loader has finished its transition, instead of beginning before the card reveal. The short title sting is a trimmed `MangoLeaf AI` phrase from the preserved Marcia source; the HeyGen allowance is currently empty, so the exact newly worded “What is MangoLeaf AI?” sentence is recorded as a pending regeneration rather than mixed in from another speaker. `assets/demo-refresh/narration/v2-marcia-single-voice.md` documents the actual spoken copy and this source decision.

The request and duration ledgers are `assets/demo-refresh/audio_request-v2-marcia.json` and `assets/demo-refresh/audio_meta-v2-marcia.json`. The information starts are `4.000s`, `5.750s`, `14.485s`, `26.773s`, and `42.692s`; the phone demo starts at `52.622s`. Click cues are:

| Action | Composition time |
| --- | ---: |
| Scan bottom navigation | 59.911s |
| Take Photo | 70.620s |
| Capture Photo | 77.227s |
| Run AI Diagnosis | 85.949s |
| Bisaya result control | 99.467s |
| Isara ang detalye | 104.324s |
| History bottom navigation | 105.164s |
| Saved-scan chevron | 111.065s |
| Bisaya language control | 117.071s |

The composition is `128.261429s` at `60fps`; video swaps now finish at the declared recording end. The current `MangoLeafAI-walkthrough-v2.mp4` is `1920x1080` H.264/AAC, `60fps`, `128.266667s`, and `18,590,888` bytes. `npm run check` passes with zero runtime, layout, motion, and contrast errors; the duplicate-media warning and pointer-events notes remain informational. `ffmpeg -v error -i MangoLeafAI-walkthrough-v2.mp4 -f null -` completes without errors.

## V2 revision 5 — local KittenTTS voice clone (2026-10-13)

HeyGen's free allowance stopped the current-script batch after eight clips, so the final V2 narration was regenerated locally with KittenTTS 2. The isolated Python environment is `video/.venv` and is ignored by Git; it does not install KittenTTS globally. The model uses the local `emb4` checkpoint and a single existing Marcia/HeyGen WAV (`assets/voice/v2-01-overview.wav`) as its reference, with the matching reference transcript. This is a local voice clone, not an exact HeyGen synthesis, so the clone should be reviewed by ear before public release.

To recreate the environment from `video/`, run `python -m venv .venv`, `.\.venv\Scripts\python.exe -m pip install --upgrade pip`, and `.\.venv\Scripts\python.exe -m pip install kittenml`. Set `PYTHONUTF8=1` for the Windows voice-config reader. Python packages stay under `video/.venv`; Hugging Face keeps the downloaded model cache in its normal per-user cache unless `HF_HOME` is pointed at a project-local cache.

The 16 current-script clips are `assets/voice/v2kitten-current-*.wav`. The exact text and measured durations are in `assets/demo-refresh/audio_request-v2-marcia-current.json` and `assets/demo-refresh/audio_meta-v2kitten-current.json`. The timing ledger records information starts at `4.000s`, `6.850s`, `29.620s`, `43.790s`, and `63.520s`; the phone walkthrough starts at `78.400s`. The resulting tap cues are:

| Action | Composition time |
| --- | ---: |
| Scan bottom navigation | 85.900s |
| Take Photo | 95.460s |
| Capture Photo | 105.980s |
| Run AI Diagnosis | 119.340s |
| Bisaya result control | 133.220s |
| Isara ang detalye | 139.980s |
| History bottom navigation | 140.820s |
| Saved-scan chevron | 146.820s |
| Bisaya language control | 153.420s |

The composition target is `167.290s` at 60fps. `assets/audio/bgm-demo-v2kitten.wav` extends the BGM bed to the full target length. The rendered `MangoLeafAI-walkthrough-v2.mp4` is 1920x1080 H.264/AAC, 60fps, `167.300s`, and `22,499,497` bytes. `npm run check` passes with zero runtime, layout, motion, and contrast errors; the existing duplicate-media warning, pointer-events notes, and pointer-ring overflow remain informational. `ffmpeg -v error -i MangoLeafAI-walkthrough-v2.mp4 -f null -` completes without errors.

KittenTTS 2's model license is separate from the Python package. Review the model's Stellon Labs Community License and required attribution/registration limits before commercial distribution: <https://huggingface.co/KittenML/kitten-tts-2/blob/main/LICENSE.md>. The project and hosted-service references are <https://github.com/KittenML/KittenTTS> and <https://kittenml.com/>.

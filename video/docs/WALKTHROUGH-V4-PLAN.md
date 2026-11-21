# MangoLeaf AI walkthrough V4

V4 revises V3 while retaining both earlier MP4 files and the V3 composition. The main implementation is `scripts/build-v4.py`, which reuses V3's scene media, KittenTTS voice clips, background music and click sound.

## Changes

- The phone remains fully visible while the left text fades between walkthrough scenes. Bilingual screens switch directly. The phone and text columns sit closer together, and the short home transition retains the same phone position for continuity.
- The loader mark and title share a horizontal center. The overview and finale each arrange the six feature badges in two rows of three.
- The technology scene retains its technology cards, labels the model `MobileNetV3-Large`, and narrates the heading and every card. The walkthrough heading is narrated before its sequence of cards. Newly generated narration uses the same local KittenTTS reference as V3. The original generated technology clip repeated one phrase; the retained `stack.wav` removes that repetition with a short audio crossfade, while `stack-original.wav` preserves the raw generation.
- The camera, History navigation and saved-scan pointers are positioned on their requested controls.
- At the user's explicit request, the backup and restore recordings are shown without the V3 masks or hidden-code caption.

## Recovery-code handling

The supplied recordings show recovery codes. The unmasked derivatives are created only under ignored `.work/v4-private/`; the V4 MP4 and the local review staging directory are also ignored by `video/.gitignore`. Do not commit those files. Anyone receiving the V4 MP4 can see the codes. The previous V3 output keeps its masked footage.

## Build and review

From `video/`, run `scripts/prepare-v4-backup.py`, then `scripts/generate-v4-narration.py` with `PYTHONUTF8=1` and `HF_HUB_OFFLINE=1`, then `scripts/build-v4.py`. `scripts/stage-v4-review.py` stages the result locally for the pinned HyperFrames check. The preparation script requires the supplied recordings in the capstone demo-videos/v2 folder. `v4-timing.json` records measured narration and click timing. The composition uses `.work/v4-private/` as a local source, so those files must remain available for future renders.

The local speech-recognition review recognized the technology heading and card list and the walkthrough heading. Automated transcription and sampled frames are review aids; a full human listening pass is still needed to judge pacing and pronunciation.

## Completed export review — November 20, 2026

The V4 export is `MangoLeafAI-walkthrough-v4.mp4`: H.264, 1920×1080, 60 fps, stereo AAC, 260.066667 seconds and 21,464,322 bytes. Its SHA-256 is `411A4761455210BAF8CE96EE0DAB2307A421D3C8BA454E0536FCDEF4BC81C706`. The V3 SHA-256 remains `741C885AC9BB52D8474F3E1DABDD0681BEB9F185215CDA1EC836AC86BA256D13`.

The pinned HyperFrames check passed 18 layout samples and 20 contrast checks with no runtime, layout, motion or contrast errors. One duplicate-image discovery warning remains. Narration timings have no overlaps; local transcription of the final mixed audio recognized the technology list and walkthrough heading. FFmpeg decoded the export without errors, and exported frames were inspected at the three corrected pointer positions. A human listening pass remains useful for voice quality and pacing.

## V4 revision 2 — November 21, 2026

The requested revision keeps the same V4 filename and V3 source assets. The loading ring eases from a faster initial rotation to a slower finish. The technology row is Android WebView, Bun, Java, SQLite and Next.js; the remaining technology cards stay as in V4. New local KittenTTS clips cover the revised overview, technology list, Android download button, restoration confirmation and restored-history review. The overview's TTS input uses pronunciation cues for “leaves” and “Bisaya”; the displayed copy remains unchanged.

Pointer travel and the post-click hold are slightly longer. An additional pointer click closes the Bisaya result before returning to Home. New restore narration is scheduled against the recorded confirmation and History/detail actions, and the final scene waits for the narration to finish. The supplied unmasked backup recordings remain local-only and the revised V4 MP4 remains ignored by Git because recovery codes are visible.

Generate the revision-specific clips with `scripts/generate-v4-revision2-narration.py`, then use `scripts/build-v4.py` and `scripts/stage-v4-review.py` as above. Preserve the previous V4 file until the revised render has passed its checks; write the candidate under `.work/v4-private/` before replacing the V4 output.


### Revision 2 export review ? November 21, 2026

The replacement V4 export is H.264 at 1920?1080 and 60 fps with stereo AAC, 260.683333 seconds and 21,485,459 bytes. Its SHA-256 is `7DC4938E3B59A68692255ED1D6B7B5A2414651FCAE55D2EF3DBB019F95B672B1`. V3 remains unchanged with SHA-256 `741C885AC9BB52D8474F3E1DABDD0681BEB9F185215CDA1EC836AC86BA256D13`.

The pinned HyperFrames check passed 18 layout samples and 20/20 contrast checks; the existing duplicate-image discovery warning remains. Timed narration clips did not overlap. FFmpeg decoded the complete export without errors, and a rendered frame confirmed the new close-button pointer. Automated transcription of the mixed export recognized the revised overview, technology list, restore confirmation and restored-history narration. Automated transcription is not proof of the requested Bisaya stress; human listening remains necessary. The video visibly includes recovery codes and stays ignored.

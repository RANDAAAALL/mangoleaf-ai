# MangoLeaf AI walkthrough V4

V4 revises V3 while retaining both earlier MP4 files and the V3 composition. The main implementation is `build-v4.py`, which reuses V3's scene media, KittenTTS voice clips, background music and click sound.

## Changes

- The phone remains fully visible while the left text fades between walkthrough scenes. Bilingual screens switch directly. The phone and text columns sit closer together, and the short home transition retains the same phone position for continuity.
- The loader mark and title share a horizontal center. The overview and finale each arrange the six feature badges in two rows of three.
- The technology scene retains its technology cards, labels the model `MobileNetV3-Large`, and narrates the heading and every card. The walkthrough heading is narrated before its sequence of cards. Newly generated narration uses the same local KittenTTS reference as V3. The original generated technology clip repeated one phrase; the retained `stack.wav` removes that repetition with a short audio crossfade, while `stack-original.wav` preserves the raw generation.
- The camera, History navigation and saved-scan pointers are positioned on their requested controls.
- At the user's explicit request, the backup and restore recordings are shown without the V3 masks or hidden-code caption.

## Recovery-code handling

The supplied recordings show recovery codes. The unmasked derivatives are created only under ignored `.work/v4-private/`; the V4 MP4 and the local review staging directory are also ignored by `video/.gitignore`. Do not commit those files. Anyone receiving the V4 MP4 can see the codes. The previous V3 output keeps its masked footage.

## Build and review

From `video/`, run `prepare-v4-backup.py`, then `generate-v4-narration.py` with `PYTHONUTF8=1` and `HF_HUB_OFFLINE=1`, then `build-v4.py`. `stage-v4-review.py` stages the result locally for the pinned HyperFrames check. The preparation script requires the supplied recordings in the capstone demo-videos/v2 folder. `v4-timing.json` records measured narration and click timing. The composition uses `.work/v4-private/` as a local source, so those files must remain available for future renders.

The local speech-recognition review recognized the technology heading and card list and the walkthrough heading. Automated transcription and sampled frames are review aids; a full human listening pass is still needed to judge pacing and pronunciation.

## Completed export review — November 20, 2026

The V4 export is `MangoLeafAI-walkthrough-v4.mp4`: H.264, 1920×1080, 60 fps, stereo AAC, 260.066667 seconds and 21,464,322 bytes. Its SHA-256 is `411A4761455210BAF8CE96EE0DAB2307A421D3C8BA454E0536FCDEF4BC81C706`. The V3 SHA-256 remains `741C885AC9BB52D8474F3E1DABDD0681BEB9F185215CDA1EC836AC86BA256D13`.

The pinned HyperFrames check passed 18 layout samples and 20 contrast checks with no runtime, layout, motion or contrast errors. One duplicate-image discovery warning remains. Narration timings have no overlaps; local transcription of the final mixed audio recognized the technology list and walkthrough heading. FFmpeg decoded the export without errors, and exported frames were inspected at the three corrected pointer positions. A human listening pass remains useful for voice quality and pacing.

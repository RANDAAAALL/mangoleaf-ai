# MangoLeaf AI walkthrough V3 production plan

Prepared November 19, 2026. This plan updates the historical V2 walkthrough while preserving the existing V2 render and its composition.

## Direction and narration draft

The video retains V2's pale green and warm background, leaf loader, phone bezel, music, click sound, fades, and KittenTTS voice reference. The video presents the Android app and the separate informational website. The new script will be recorded in individually timed clips, with pauses for each reveal and action.

1. **Loading:** MangoLeaf AI logo and loader.
2. **Introduction:** “What is MangoLeaf AI?”
3. **Overview:** “Built on a PWA foundation, MangoLeaf AI helps smallholder mango farmers classify photos of mango leaves and green fruits offline through an Android WebView app, with pre-treatment guidelines in English and Bisaya. Its companion website provides project information and Android installation guidance.” Then reveal and explain one badge at a time: no login or registration; offline functionality; on-device AI diagnosis; English and Bisaya treatment guidelines; Scan History; optional backup and restoration using a recovery code and an internet connection.
4. **Seven classes:** Preserve the V2 class list and its narration.
5. **Technology:** Update the stack to reflect the current Android app and companion website. Android WebView, Java, SQLite, private photo storage, Next.js, React, TypeScript, Tailwind CSS, TensorFlow.js, Supabase and model V5.1.0 are the intended topics. Check repository implementation before finalizing exact wording; retired browser storage must not be portrayed as current Android storage.
6. **Straightforward Walkthrough:** Reveal Download App, Scan, View Result, Scan History, Scan Details and Backup/Restoration in sequence. Reveal each connecting arrow after its preceding narration finishes.
7. **Android installation:** Two phones show the supplied QR and manual installation recordings. Narrate that both lead to Android installation guidance.
8. **Home:** Show the supplied current home image, then tap Scan. The request mentioned History at this point, but the following scene is the Scan options sheet, so Scan is the coherent control.
9. **Scan options:** Show photo tips and tap Take Photo.
10. **Camera:** Show the supplied leaf camera recording; tap Capture Photo.
11. **Review:** Show the supplied review image; tap Run AI Diagnosis.
12. **Classification:** Show the supplied processing recording without a click.
13. **Result:** Show the English result, tap Bisaya, then show the Bisaya result with matching narration.
14. **Transition:** Return to the supplied home image; tap History.
15. **History:** Show the supplied history image and tap the saved scan.
16. **Scan details:** Show English, tap Bisaya, then show the Bisaya details.
17. **Backup and restore:** Start with the first phone centered. Show recovery-code setup; move it left and reveal the second phone to show restoration. Backup is optional and requires an internet connection. A recovery code is private: obscure any visible actual code or entered credential throughout both recordings.
18. **Finale:** Retain the logo and tagline; display all six feature badges.

## Source and delivery notes

- Source recordings and screenshots are under the user-supplied capstone demo-videos/v2 folder; copy or derive project-local assets before rendering.
- Some source recordings are landscape with a portrait screen surrounded by black bars. Crop the actual screen before placing it in the phone bezel.
- Narration must follow actual scene states and never overlap. Preserve enough time for the screen recordings and fade cues.
- Keep `MangoLeafAI-walkthrough-v2.mp4`. Deliver the new render as `MangoLeafAI-walkthrough-v3.mp4` inside `video/`.
- Validate visual crops, private-code masking, narration timing, and output media before delivery. Do not treat test or example screens as proof of model accuracy.

## Implementation notes

- `v3-narration.json` records the spoken text for newly generated and reused narration; the title and class narration are preserved V2 clips. `generate-v3-narration.py` uses the V2 KittenTTS 2 `emb4` model and reference voice, entirely locally. On Windows start it with `PYTHONUTF8=1`. The hosted KittenML credit balance is separate and is not needed for this workflow.
- `prepare-v3-media.py` reads the supplied source directory, crops landscape recordings to their portrait content, removes source audio and masks recovery-code areas before saving the project assets. The original recordings may contain usable recovery credentials and should not be shared unedited. The generated masked recordings are not a substitute for reviewing every changed source if the recordings are replaced.
- `build-v3.py` derives clip and scene starts from actual WAV lengths and writes `v3.html` and `v3-timing.json`. It extends the V2 music with an ending fade, adds the V2 click sound, and places the staged reveals. `stage-v3-review.py` creates a disposable copy under `.work/v3-review` for the pinned HyperFrames check.
- `review-v3-narration.py` compares the spoken clips with their script using a locally cached faster-whisper small English model. The optional reviewer was installed as faster-whisper 1.2.1 inside `video/.venv`; it reads WAV data with SoundFile and SciPy. Recognition provides a review signal, not a substitute for listening.
- V2's composition and MP4 remain separate. The project's existing `npm run render` still targets V2; render V3 explicitly with `npx --yes hyperframes@0.7.103 render --composition v3.html --output MangoLeafAI-walkthrough-v3.mp4` from this folder.
- V3 uses the current app architecture: Android WebView, SQLite and private files. The model card identifies MobileNetV3-Large V5.1.0. Captured APK screens illustrate the candidate shown in the supplied footage; the video does not establish a production release or model field accuracy.

## V3 output and review

The final `MangoLeafAI-walkthrough-v3.mp4` is 1920×1080 H.264, 60 fps, with stereo AAC audio, duration 256.200 seconds. Its SHA-256 is `741C885AC9BB52D8474F3E1DABDD0681BEB9F185215CDA1EC836AC86BA256D13`. V2 remains 22,499,497 bytes and its original SHA-256 remains `26939C10100FFD86D7A1E1E3B99AD9EF35AA1794EAB513F9E494FCA9ECD2A33E`.

The final composition check passed 18 layout samples and 20 contrast checks with zero runtime, layout, motion or contrast errors; a duplicate-image discovery warning remains. All 30 narration entries were checked for timing overlap, and the saved transcription review records the speech-recognition results. Frames from the exported MP4 were visually inspected, and FFmpeg decoded the output without errors.

Speech recognition flagged the original technology line as potentially unclear. `correct-v3-stack.py` generated a clearer line with the same voice reference. `apply-v3-stack-correction.py` padded it to the original slot and replaced only that portion of the audio mix while copying the encoded video stream. The final mixed segment was transcribed again and the project WAV and narration text were updated to match. Automated transcription can miss pronunciation problems, so listening remains useful before presentation.

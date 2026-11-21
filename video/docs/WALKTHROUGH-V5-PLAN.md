# MangoLeaf AI walkthrough V5

V5 reuses the completed V4 composition, footage, narration, music, sound effects,
and timing. It preserves the V3 and V4 video files.

- The splash ring makes three full turns over 3.7 seconds. Its first 2.5 turns
  use a faster steady rotation, followed by a final half-turn that slows down.
- The review-screen pointer lands 20 composition pixels lower, between the
  letters D and i in “Run AI Diagnosis.”

Run `scripts/build-v5.py`, then `scripts/stage-v5-review.py`, and validate with the project's
pinned HyperFrames CLI. Render `v5.html` using the same 1920×1080, 60 fps
settings as V4. For the delivered export, the rendered video stream was remuxed
with the original V4 audio stream using FFmpeg stream copy; this preserves the
audio exactly without re-encoding it. The source recordings, review stage, and
rendered V5 contain visible recovery codes and remain ignored by Git.

## Export review — November 21, 2026

The V5 export is H.264 at 1920×1080 and 60 fps with stereo AAC, 260.683333
seconds and 21,477,015 bytes. Its SHA-256 is
`C5AE05D7FC1D576942CE6B13848DB563109A9781174AA49E097C06DA38553ADC`.
The preserved V4 SHA-256 is
`7DC4938E3B59A68692255ED1D6B7B5A2414651FCAE55D2EF3DBB019F95B672B1`.

HyperFrames validation passed 18 layout samples and 20/20 contrast checks; the
existing duplicate-image warning remains. The complete exported file decoded
without errors, its audio stream matched V4 byte-for-byte, and an exported frame
confirmed the requested review-button pointer placement.

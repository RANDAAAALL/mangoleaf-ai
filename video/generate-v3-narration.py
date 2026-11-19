"""Generate V3 narration locally with the same reference used in V2."""
import json
import os
from pathlib import Path

import soundfile as sf
from kittenml import KittenTTS

os.environ.setdefault("HF_HUB_OFFLINE", "1")
base = Path(__file__).resolve().parent
snapshot = Path.home() / ".cache/huggingface/hub/models--KittenML--kitten-tts-2/snapshots/f2eee74f4467855ad58fe16f1fb7b7df473263fd"
model = KittenTTS(str(snapshot), weights="emb4")
reference = str(base / "assets/voice/v2-01-overview.wav")
reference_text = "MangoLeaf AI helps mango farmers check mango leaves and Mango Green Fruit with on-device AI, even offline."
out = base / "assets/voice/v3"
out.mkdir(parents=True, exist_ok=True)
lines = json.loads((base / "v3-narration.json").read_text(encoding="utf-8"))
for line in lines:
    path = out / (line["id"] + ".wav")
    if path.exists():
        continue
    print("Generating", line["id"], flush=True)
    audio = model.generate(line["text"], reference=reference, reference_text=reference_text)
    sf.write(path, audio, model.sample_rate)
    print("Saved", line["id"], len(audio) / model.sample_rate, flush=True)

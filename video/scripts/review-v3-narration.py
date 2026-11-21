"""Transcribe local narration for review; similarity flags are not proof of accuracy."""
import difflib
import json
import re
from pathlib import Path

from faster_whisper import WhisperModel
import soundfile as sf
from scipy.signal import resample_poly
from math import gcd

base = Path(__file__).resolve().parent.parent
model_path = Path.home() / '.cache/huggingface/hub/models--Systran--faster-whisper-small.en/snapshots/d1d751a5f8271d482d14ca55d9e2deeebbae577f'
model = WhisperModel(str(model_path), device='cpu', compute_type='int8', cpu_threads=2, local_files_only=True)
lines = json.loads((base / 'v3-narration.json').read_text(encoding='utf-8'))
lines += [
    {'id': 'title', 'text': 'What is MangoLeaf AI?', 'source': 'assets/voice/v2kitten-current-info-01-title.wav'},
    {'id': 'classes', 'text': 'Support 7 classes. Leaf Diseases include Anthracnose, Sooty Mold, and Bacterial Canker. Fruit Diseases include Mango Scab and Bacterial Black Spot. Healthy results are Healthy Leaf and Healthy Fruit.', 'source': 'assets/voice/v2kitten-current-info-03-classes.wav'},
]
results = []
normalize = lambda text: re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()
for line in lines:
    source = base / line.get('source', 'assets/voice/v3/' + line['id'] + '.wav')
    samples, sample_rate = sf.read(str(source), dtype='float32')
    if samples.ndim > 1:
        samples = samples.mean(axis=1)
    divisor = gcd(sample_rate, 16000)
    samples = resample_poly(samples, 16000 // divisor, sample_rate // divisor)
    segments, _ = model.transcribe(samples, language='en', beam_size=1, condition_on_previous_text=False)
    actual = ' '.join(segment.text.strip() for segment in segments)
    ratio = difflib.SequenceMatcher(None, normalize(line['text']), normalize(actual)).ratio()
    results.append({'id': line['id'], 'expected': line['text'], 'recognized': actual, 'similarity': round(ratio, 3)})
    print(line['id'], round(ratio, 3), flush=True)
(base / 'v3-transcription-review.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')

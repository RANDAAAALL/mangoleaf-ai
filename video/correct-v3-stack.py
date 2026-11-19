"""Generate a clearer replacement for the V3 technology narration."""
from pathlib import Path
import soundfile as sf
from kittenml import KittenTTS

base = Path(__file__).resolve().parent
model_path = Path.home() / '.cache/huggingface/hub/models--KittenML--kitten-tts-2/snapshots/f2eee74f4467855ad58fe16f1fb7b7df473263fd'
model = KittenTTS(str(model_path), weights='emb4')
text = ('Android Web View, Java, sequel lite, and private photo storage. '
        'The website uses Next J S and React. '
        'Tensor Flow J S runs the model. Supabase supports backup. '
        'The model is version five point one point zero.')
audio = model.generate(text, reference=str(base/'assets/voice/v2-01-overview.wav'), reference_text='MangoLeaf AI helps mango farmers check mango leaves and Mango Green Fruit with on-device AI, even offline.')
sf.write(base/'assets/voice/v3/stack-corrected-raw.wav', audio, model.sample_rate)
print('Generated replacement seconds:', len(audio)/model.sample_rate, flush=True)

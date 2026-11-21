"""Generate new V4 titles and technology list with the V3 voice reference."""
from pathlib import Path
import json
import soundfile as sf
from kittenml import KittenTTS

base = Path(__file__).resolve().parent.parent
repo = Path.home()/'.cache/huggingface/hub/models--KittenML--kitten-tts-2/snapshots/f2eee74f4467855ad58fe16f1fb7b7df473263fd'
out = base/'assets/voice/v4'
out.mkdir(parents=True, exist_ok=True)
lines = {
    'stack': 'MangoLeaf AI offline first tech stack. Android Web View, Java, sequel lite, private photo storage, Next J S, React, TypeScript, Tailwind C S S, Tensor Flow J S, Supabase, and model MobileNet V three large.',
    'flow-title': 'Straightforward walkthrough.',
}
(base/'v4-new-narration.json').write_text(json.dumps(lines,indent=2)+'\n',encoding='utf-8')
model = KittenTTS(str(repo), weights='emb4')
for name, text in lines.items():
    path = out/(name+'.wav')
    if path.exists():
        continue
    print('Generating',name,flush=True)
    audio = model.generate(text, reference=str(base/'assets/voice/v2-01-overview.wav'), reference_text='MangoLeaf AI helps mango farmers check mango leaves and Mango Green Fruit with on-device AI, even offline.')
    sf.write(path,audio,model.sample_rate)
    print('Saved',name,len(audio)/model.sample_rate,flush=True)

"""Generate only the revised V4 lines with the existing local voice reference."""
import json
from pathlib import Path
import soundfile as sf
from kittenml import KittenTTS

base = Path(__file__).resolve().parent.parent
repo = Path.home()/'.cache/huggingface/hub/models--KittenML--kitten-tts-2/snapshots/f2eee74f4467855ad58fe16f1fb7b7df473263fd'
out = base/'assets/voice/v4/revision2'
out.mkdir(parents=True, exist_ok=True)
lines = {
    'overview': 'Field ready mango health diagnostic. Built on a progressive web app foundation, MangoLeaf AI helps smallholder mango farmers classify photos of mango leeves and green fruits offline through an Android app. It provides treatment guidance in English and beesaya. Its companion website offers project information and Android installation guidance.',
    'feature-language': 'Treatment guidance is available in English and beesaya.',
    'details-bis': 'English and beesaya treatment guidance are available from the scan details.',
    'stack': 'MangoLeaf AI offline first tech stack. Android Web View, Bun, Java, sequel lite, Next J S, React, TypeScript, Tailwind C S S, Tensor Flow J S, Supabase, and model MobileNet V three large.',
    'install-download': 'Then tap Download Android A P K.',
    'restore-success': 'The app confirms one scan was restored successfully.',
    'restore-history': 'The restored scan appears in Scan History. Review its details to confirm the recovery.',
}
(base/'v4-revision2-narration.json').write_text(json.dumps(lines,indent=2)+'\n',encoding='utf-8')
model = KittenTTS(str(repo), weights='emb4')
for name,text in lines.items():
    path=out/(name+'.wav')
    if path.exists():
        continue
    print('Generating',name,flush=True)
    data=model.generate(text,reference=str(base/'assets/voice/v2-01-overview.wav'),reference_text='MangoLeaf AI helps mango farmers check mango leaves and Mango Green Fruit with on-device AI, even offline.')
    sf.write(path,data,model.sample_rate)
    print('Saved',name,len(data)/model.sample_rate,flush=True)

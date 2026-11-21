"""Replace the technology narration while preserving the rendered video frames."""
import json
import os
import shutil
import subprocess
import wave
from pathlib import Path

base = Path(__file__).resolve().parent.parent
manifest_path = base / 'v3-narration.json'
timing = json.loads((base/'v3-timing.json').read_text(encoding='utf-8'))
entry = next(item for item in timing['voice'] if item['id'] == 'stack')
start, duration = entry['start'], entry['duration']
old = base/'assets/voice/v3/stack.wav'
new = base/'assets/voice/v3/stack-corrected-raw.wav'
padded = base/'.work/v3-stack-padded.wav'
target = base/'MangoLeafAI-walkthrough-v3.mp4'
output = base/'.work/v3-audio-corrected.mp4'
with wave.open(str(old),'rb') as wav:
    params, frames = wav.getparams(), wav.getnframes()
with wave.open(str(new),'rb') as wav:
    if (wav.getnchannels(),wav.getsampwidth(),wav.getframerate()) != (params.nchannels,params.sampwidth,params.framerate):
        raise ValueError('Replacement audio format differs')
    data, length = wav.readframes(wav.getnframes()), wav.getnframes()
if length > frames:
    raise ValueError('Replacement does not fit the existing timing slot')
with wave.open(str(padded),'wb') as wav:
    wav.setparams(params)
    wav.writeframes(data + bytes((frames-length)*params.nchannels*params.sampwidth))
delay = round(start*1000)
end = start + duration
graph = (f"[0:a]volume=0:enable='between(t,{start},{end})'[base];"
         f"[1:a]aresample=48000,adelay={delay}:all=1[voice];"
         f"[2:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,volume=0.22,adelay={delay}:all=1[bed];"
         '[base][voice][bed]amix=inputs=3:duration=first:normalize=0[a]')
subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(target),'-i',str(padded),'-i',str(base/'assets/audio/bgm-demo-v3.wav'),'-filter_complex',graph,'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-y',str(output)],check=True)
subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(output),'-f','null','-'],check=True)
shutil.copy2(old,base/'.work/v3-stack-original.wav')
shutil.copy2(padded,old)
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
next(item for item in manifest if item['id']=='stack')['text']=('Android Web View, Java, sequel lite, and private photo storage. The website uses Next J S and React. Tensor Flow J S runs the model. Supabase supports backup. The model is version five point one point zero.')
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
os.replace(output,target)
print('Corrected narration:',start,'to',end,'seconds')

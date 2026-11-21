"""Build the V3 composition from measured narration and prepared media."""
import html
import json
import os
import subprocess
import wave
from pathlib import Path

base = Path(__file__).resolve().parent.parent
manifest = json.loads((base / "v3-narration.json").read_text(encoding="utf-8"))
audio = {x["id"]: f"assets/voice/v3/{x['id']}.wav" for x in manifest}
audio["title"] = "assets/voice/v2kitten-current-info-01-title.wav"
audio["classes"] = "assets/voice/v2kitten-current-info-03-classes.wav"
draft = os.environ.get("V3_PREVIEW_SILENCE") == "1"
if draft:
    silent = base / ".work/v3-silence.wav"
    silent.parent.mkdir(exist_ok=True)
    if not silent.exists():
        with wave.open(str(silent), "wb") as wav:
            wav.setparams((1, 2, 24000, 48000, "NONE", "not compressed"))
            wav.writeframes(b"\0" * 96000)
for path in audio.values():
    if not (base / path).exists() and not draft:
        raise SystemExit(f"Narration not generated: {path}")
if draft:
    audio = {key: path if (base / path).exists() else ".work/v3-silence.wav" for key, path in audio.items()}

def duration(path):
    with wave.open(str(base / path), "rb") as f:
        return f.getnframes() / f.getframerate()

parts, audio_tags, animation, clicks, scene_timing, voice_timing = [], [], [], [], [], []
clock = 4.0
track = 20

def voice(name, start):
    global track
    path = audio[name]
    length = duration(path)
    track += 1
    audio_tags.append(f'<audio id="voice-{track}" class="clip" src="{path}" data-start="{start:.3f}" data-duration="{length:.3f}" data-track-index="{track}" data-volume="1"></audio>')
    voice_timing.append({'id':name,'source':path,'start':round(start,3),'duration':round(length,3)})
    return start + length

def scene_open(markup, start, end):
    n = len(parts)
    scene_timing.append({'scene':n+2,'start':round(start,3),'end':round(end,3)})
    parts.append(f'<section id="s{n}" class="scene">{markup}</section>')
    animation.append(f'tl.fromTo("#s{n}",{{opacity:0}},{{opacity:1,duration:.3}},{start:.3f});tl.to("#s{n}",{{opacity:0,duration:.25}},{end-.25:.3f});tl.set("#s{n}",{{opacity:0}},{end:.3f});')
    return n

def tap(at, x, y):
    clicks.append(at)
    animation.append(f'tap({at:.3f},{x},{y});')

def centered(title, extra=""):
    return f'<div class="center"><h2>{html.escape(title)}</h2>{extra}</div>'

def image_phone(name):
    return f'<div class="phone"><div class="bezel"><div class="screen"><img src="assets/demo-v3/{name}" /></div></div></div>'

def clip_phone(name, start, length, cls="phone"):
    global track
    track += 1
    frame = name.replace('.mp4', '-hold.jpg')
    if not (base/'assets/demo-v3'/frame).exists():
        subprocess.run(['ffmpeg','-nostdin','-loglevel','error','-sseof','-0.08','-i',str(base/'assets/demo-v3'/name),'-frames:v','1','-y',str(base/'assets/demo-v3'/frame)],check=True)
    note = '<div class="privacy-box">Recovery code hidden</div>' if 'backup-' in cls else ''
    return f'<div class="{cls}"><div class="bezel"><div class="screen"><img src="assets/demo-v3/{frame}"><video id="v{track}" class="clip" src="assets/demo-v3/{name}" muted playsinline data-start="{start:.3f}" data-duration="{length:.3f}" data-track-index="{track}"></video>{note}</div></div></div>'

def copy(title, desc):
    return f'<div class="copy"><h2>{html.escape(title)}</h2><p>{html.escape(desc)}</p></div>'

start=clock; end=voice("title",start)+.45; scene_open(centered("What is MangoLeaf AI?"),start,end); clock=end
start=clock; t=voice("overview",start+.35)+.4
features=[("No Login/Register","feature-login"),("Offline Functional","feature-offline"),("On-Device-AI-Diagnosis","feature-device"),("English + Bisaya treatment guidelines","feature-language"),("Scan History","feature-history"),("Backup/Restoration","feature-backup")]
tags=''.join(f'<span class="tag feature" id="feature-{i}">✓ {html.escape(label)}</span>' for i,(label,_) in enumerate(features))
for i,(_,name) in enumerate(features):
    animation.append(f'tl.to("#feature-{i}",{{opacity:1,duration:.35}},{t:.3f});')
    t=voice(name,t+.15)+.35
end=t+.2
description="Built on a PWA foundation, MangoLeaf AI helps smallholder mango farmers classify photos of mango leaves and green fruits offline through an Android WebView app, with pre-treatment guidelines in English and Bisaya. Its companion website provides project information and Android installation guidance."
scene_open(centered("Field-Ready Mango Health Diagnostic.",f'<p>{html.escape(description)}</p><div class="tags">{tags}</div>'),start,end); clock=end
start=clock; end=voice("classes",start+.25)+.4
groups='<div class="classes"><div><b>Leaf Diseases</b><p>Anthracnose<br>Sooty Mold<br>Bacterial Canker</p></div><div><b>Fruit Diseases</b><p>Mango Scab<br>Bacterial Black Spot</p></div><div><b>Healthy</b><p>Healthy Leaf<br>Healthy Fruit</p></div></div>'
scene_open(centered("Support 7 classes",groups),start,end);clock=end
start=clock;end=voice("stack",start+.25)+.4
stack=['Android WebView','Java','SQLite','Private photo storage','Next.js','React','TypeScript','Tailwind CSS','TensorFlow.js','Supabase']
scene_open(centered("MangoLeaf AI Offline-First Tech Stack",'<div class="tags stack-tags">'+''.join(f'<span class="tag">{x}</span>' for x in stack)+'</div><div class="tags"><span class="tag">Model: MobileNetV3-Large V5.1.0</span></div>'),start,end);clock=end
start=clock;t=start+.4
flow=[("Download App","flow-download"),("Scan","flow-scan"),("View Result","flow-result"),("Scan History","flow-history"),("Scan Details","flow-details"),("Backup/Restoration","flow-backup")]
flowhtml=''
for i,(label,name) in enumerate(flow):
    flowhtml+=f'<span class="tag step" id="step-{i}">{html.escape(label)}</span>'
    animation.append(f'tl.to("#step-{i}",{{opacity:1,duration:.3}},{t:.3f});')
    t=voice(name,t+.15)+.3
    if i<5:
        flowhtml+=f'<span class="arrow" id="arrow-{i}">→</span>'
        animation.append(f'tl.to("#arrow-{i}",{{opacity:1,duration:.25}},{t:.3f});')
        t+=.35
end=t+.3;scene_open(centered("Straightforward Walkthrough",f'<div class="tags">{flowhtml}</div>'),start,end);clock=end
start=clock;end=max(voice("install",start+.35)+.6,start+14)
phones=clip_phone("install-qr.mp4",start,12.633,"phone pair left")+clip_phone("install-manual.mp4",start,13.467,"phone pair right")
scene_open('<h2 class="pair-title">Install MangoLeaf AI for Android</h2>'+phones,start,end);clock=end

def demo(name,title,desc,media,click=None,minimum=0):
    global clock
    start=clock; end=voice(name,start+.35)+.6; end=max(end,start+minimum)
    if click:
        tap(end-.35,*click);end+=.25
    if media.endswith('.mp4'):
        # Once the short source ends, the final source frame is held separately.
        vlen=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(base/'assets/demo-v3'/media)],text=True).strip())
        phone=clip_phone(media,start,min(vlen,end-start))
    else: phone=image_phone(media)
    scene_open(copy(title,desc)+phone,start,end);clock=end

demo('home','A clear view of mango health.','Open the Android app and tap Scan to begin.','home.jpg',(198,801))
demo('options','Choose a photo.','Read the photo tips, then tap Take Photo.','options.jpg',(198,550))
demo('camera','Frame the mango leaf.','Keep the whole subject visible in even light, then capture the photo.','camera.mp4',(198,794),5.3)
demo('review','Check the photo before diagnosis.','Review your photo, then tap Run AI Diagnosis.','review.jpg',(198,580))
demo('processing','Your photo is being checked.','The on-device model checks the photo.','processing.mp4',None,2)

def bilingual(first,second,title,desc,img1,img2):
    global clock
    start=clock; t=voice(first,start+.35)+.45
    t=voice(second,t)+.45; tap(t,242,493); switch=t+.22
    end=switch+1.4
    markup=copy(title,desc)+image_phone(img1).replace('class="phone"','class="phone english"')+image_phone(img2).replace('class="phone"','class="phone bisaya"')
    n=scene_open(markup,start,end)
    animation.append(f'tl.set("#s{n} .bisaya",{{opacity:0}},{start:.3f});tl.to("#s{n} .english",{{opacity:0,duration:.15}},{switch:.3f});tl.to("#s{n} .bisaya",{{opacity:1,duration:.15}},{switch:.3f});')
    clock=end

bilingual('result-en','result-bis','Understand the predicted condition.','Read treatment guidance in English or Bisaya.','result-en.jpg','result-bis.jpg')
start=clock;end=start+1.7;tap(start+1.2,302,800);scene_open(image_phone('home-return.jpg'),start,end);clock=end
demo('history','Return to a saved scan.','Open Scan History and select a saved result.','history.jpg',(365,313))
bilingual('details-en','details-bis','Open the photo and its result.','Review the saved scan and choose your language.','details-en.jpg','details-bis.jpg')
start=clock;t=voice('backup',start+.35);second=max(start+11.2,t+.4);end=max(voice('restore',second+.35)+.6,second+27.2)
markup='<h2 class="pair-title">Back up and restore saved scans</h2>'+clip_phone('backup-private.mp4',start,11.133,'phone pair backup-first')+clip_phone('restore-private.mp4',second,27.067,'phone pair right backup-second')+'<div class="private-note">Recovery codes are hidden.</div>'
n=scene_open(markup,start,end)
animation.append(f'tl.fromTo("#s{n} .backup-first",{{x:245}},{{x:0,duration:.7,ease:"power2.inOut"}},{second-.7:.3f});tl.fromTo("#s{n} .backup-second",{{opacity:0}},{{opacity:1,duration:.5}},{second:.3f});')
animation.append(f'tl.set("#s{n} .backup-first .privacy-box",{{opacity:1}},{start+8.5:.3f});tl.set("#s{n} .backup-second .privacy-box",{{opacity:1}},{second+2:.3f});tl.set("#s{n} .backup-second .privacy-box",{{opacity:0}},{second+21:.3f});')
clock=end;start=clock;end=voice('finale',start+.35)+1.3
finaltags=''.join(f'<span class="tag">✓ {html.escape(label)}</span>' for label,_ in features)
scene_open(centered('MangoLeaf AI','<p>Technology that works where the mango farmer works.</p><div class="tags">'+finaltags+'</div>').replace('<h2>','<img class="final-mark" src="assets/images/mangoleaf-icon.svg"><h2>',1),start,end)
total=end+.2
bgm=base/('.work/v3-draft-bgm.wav' if draft else 'assets/audio/bgm-demo-v3.wav')
subprocess.run(['ffmpeg','-nostdin','-loglevel','error','-stream_loop','-1','-i',str(base/'assets/audio/bgm-demo-v2kitten.wav'),'-t',str(total),'-af',f'afade=t=in:st=0:d=1,afade=t=out:st={max(0,total-2):.3f}:d=2','-y',str(bgm)],check=True)
bgm_src='.work/v3-draft-bgm.wav' if draft else 'assets/audio/bgm-demo-v3.wav'
audio_tags.append(f'<audio id="bgm-v3" class="clip" src="{bgm_src}" data-start="0" data-duration="{total:.3f}" data-track-index="1" data-volume=".22"></audio>')
for i,t in enumerate(clicks):
    audio_tags.append(f'<audio id="click-{i}" class="clip" src="assets/audio/click.wav" data-start="{t:.3f}" data-duration=".18" data-track-index="90" data-volume=".8"></audio>')

css='''*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#143519}.canvas{position:relative;width:1920px;height:1080px;overflow:hidden;background:linear-gradient(118deg,#f7faf2,#f3f8ee 56%,#fbf5e9)}.grid{position:absolute;inset:0;opacity:.22;background-image:linear-gradient(#dfead8 1px,transparent 1px),linear-gradient(90deg,#dfead8 1px,transparent 1px);background-size:88px 88px}.scene{position:absolute;inset:0;opacity:0}.center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:110px 130px}.center h2,.pair-title{font-size:72px;line-height:1.06;letter-spacing:-2px;margin:0 0 28px;font-weight:850}.center p{font-size:27px;line-height:1.45;max-width:1480px;color:#425c47;margin:0}.tags{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:14px;margin:30px auto 0;max-width:1650px}.tag{background:#eaf5e6;border:1px solid #c9dfc3;border-radius:14px;padding:15px 18px;font-size:20px;font-weight:750;color:#315438}.feature,.step,.arrow{opacity:0}.arrow{font-size:30px;color:#277839}.classes{display:grid;grid-template-columns:repeat(3,1fr);width:1400px;margin-top:30px;font-size:25px;line-height:1.8}.classes b{color:#216c32}.classes p{font-size:23px}.copy{position:absolute;left:150px;top:245px;width:760px}.copy h2{font-size:60px;line-height:1.08;letter-spacing:-2px;margin:0 0 24px}.copy p{font-size:27px;line-height:1.5;color:#425c47}.phone{position:absolute;right:150px;top:88px;width:420px;height:882px}.bezel{width:100%;height:100%;padding:12px;border-radius:52px;background:#17221a;box-shadow:0 34px 85px -18px #11261670}.screen{width:396px;height:858px;overflow:hidden;border-radius:41px;background:#fff}.screen img,.screen video{width:100%;height:100%;object-fit:fill}.screen video{position:absolute;top:12px;left:12px;width:396px;height:858px;border-radius:41px}.pair-title{position:absolute;top:60px;left:0;width:100%;text-align:center;font-size:56px}.phone.pair{top:185px;width:350px;height:735px}.pair .screen,.pair .screen video{width:326px;height:711px}.pair.left,.backup-first{left:540px;right:auto}.pair.right{right:540px}.private-note{position:absolute;bottom:100px;width:100%;text-align:center;color:#425c47;font-size:22px}.pointer{position:absolute;z-index:100;font-size:42px;color:#143519;text-shadow:1px 1px white;opacity:0}.splash{position:absolute;inset:0;display:grid;place-content:center;text-align:center;background:#f4f8ee;z-index:110}.splash img{width:96px;height:96px;margin:auto}.splash h1{font-size:54px}'''
css+=' .loader{width:140px;height:140px;position:relative;display:grid;place-items:center}.loader-ring{position:absolute;inset:0;border-radius:50%;border:6px solid #e2ebd9;border-top-color:#277839}.loader img{width:78px;height:78px}.final-mark{width:90px;height:90px;margin-bottom:25px}.pointer svg{display:block;width:34px;height:38px}.stack-tags{display:grid;grid-template-columns:repeat(5,max-content)}.privacy-box{position:absolute;top:350px;left:32px;width:286px;text-align:center;font-size:18px;color:#425c47;font-weight:700;opacity:0} '
script='''window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});function tap(at,x,y){const px=1920-150-420+12+x,py=88+12+y;tl.fromTo('#pointer',{x:px+50,y:py+50,opacity:0},{x:px,y:py,opacity:1,duration:.55},at-.55);tl.set('#pointer',{opacity:0},at+.12)};tl.to('#loader',{rotation:720,duration:3.7,ease:'none'},0);tl.to('#splash',{opacity:0,duration:.35},3.65);tl.set('#splash',{opacity:0},4);'''+''.join(animation)+'''window.__timelines['main']=tl;'''
document='<!doctype html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>'+css+'</style></head><body><div class="canvas" data-composition-id="main" data-start="0" data-duration="'+f'{total:.3f}'+'" data-width="1920" data-height="1080" data-fps="60"><div class="grid"></div><div id="splash" class="splash"><div class="loader"><div id="loader" class="loader-ring"></div><img src="assets/images/mangoleaf-icon.svg"></div><h1>MangoLeaf AI</h1></div>'+''.join(parts)+'<div id="pointer" class="pointer"><svg viewBox="0 0 24 28"><path d="M2 1.5 2.4 22l5.2-5.1 3.4 8.4 3.5-1.5-3.6-8.4 7.3-.1L2 1.5Z" fill="#17351d" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div>'+''.join(audio_tags)+'</div><script>'+script+'</script></body></html>'
(base/('v3-draft.html' if draft else 'v3.html')).write_text(document,encoding='utf-8')
(base/('v3-draft-timing.json' if draft else 'v3-timing.json')).write_text(json.dumps({'duration':total,'scenes':scene_timing,'voice':voice_timing,'clicks':clicks},indent=2),encoding='utf-8')
print('Composition duration:',round(total,2),'seconds')

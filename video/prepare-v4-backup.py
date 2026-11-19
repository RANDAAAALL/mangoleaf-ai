"""Create local-only unmasked backup footage, as requested for V4."""
from pathlib import Path
import subprocess

source = Path(r'C:\Users\My Pc\Desktop\workspace\capstone\cap-102\demo-videos\v2')
target = Path(__file__).resolve().parent/'.work/v4-private'
target.mkdir(parents=True,exist_ok=True)
for name, original in [
    ('backup.mp4','mangoleafai-create-recovery-code-first-phone.mp4'),
    ('restore.mp4','mangoleafai-restore-scanned-data-using-emulator.mp4'),
]:
    dest=target/name
    if dest.exists():
        continue
    subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-i',str(source/original),'-vf','crop=500:1080:710:0','-an','-c:v','libx264','-r','30','-g','30','-keyint_min','30','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(dest)],check=True)
    print('Prepared',name,flush=True)

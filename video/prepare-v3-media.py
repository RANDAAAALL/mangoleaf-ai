"""Copy the supplied walkthrough media and crop portrait recordings for phone frames."""
from pathlib import Path
import shutil
import subprocess

source = Path(r"C:\Users\My Pc\Desktop\workspace\capstone\cap-102\demo-videos\v2")
target = Path(__file__).resolve().parent / "assets/demo-v3"
target.mkdir(parents=True, exist_ok=True)
stills = {
    "home.jpg": "1 - mangoleafai-landing-page-mobile-ui.jpg",
    "options.jpg": "2 - mangoleafai-opened-scan-option-mobile-ui.jpg",
    "review.jpg": "4 - mangoleafai-opening-reviewphoto-modal-mobile-ui.jpg",
    "result-en.jpg": "6 - mangoleafai-display-diganosed-eng-result-modal-mobile-ui.jpg",
    "result-bis.jpg": "7 - mangoleafai-display-diganosed-bis-result-modal-mobile-ui.jpg",
    "home-return.jpg": "8 - mangoleafai-goback-landing-page-mobile-ui.jpg",
    "history.jpg": "9 - mangoleafai-navigate-history-page-mobile-ui.jpg",
    "details-en.jpg": "10 - mangoleafai-show-scan-eng-details-on-scan-history-mobile-ui.jpg",
    "details-bis.jpg": "11 - mangoleafai-show-scan-bis-details-on-scan-history-mobile-ui.jpg",
}
for name, original in stills.items():
    shutil.copy2(source / original, target / name)

videos = {
    "install-qr.mp4": ("mangoleafai-qrcode-installation-scanning.mp4", "crop=500:1080:710:0"),
    "install-manual.mp4": ("mangoleafai-manual-installation.mp4", "crop=500:1080:710:0"),
    "camera.mp4": ("3 - mangoleafai-opening-takephoto-mobile-ui.mp4", "scale=500:1080"),
    "processing.mp4": ("5 - mangoleafai-run-ai-diagnosis-mobile-ui.mp4", "crop=500:1080:710:0"),
    # These conservative masks cover code display, input, and keyboard suggestions.
    "backup-private.mp4": ("mangoleafai-create-recovery-code-first-phone.mp4", "crop=500:1080:710:0,drawbox=x=0:y=330:w=500:h=590:color=0xf0f5e9:t=fill:enable='gte(t,8.5)'"),
    "restore-private.mp4": ("mangoleafai-restore-scanned-data-using-emulator.mp4", "crop=500:1080:710:0,drawbox=x=0:y=200:w=500:h=750:color=0xf0f5e9:t=fill:enable='between(t,2,21)'"),
}
for name, (original, filters) in videos.items():
    destination = target / name
    if destination.exists():
        continue
    print("Preparing", name, flush=True)
    subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-i", str(source / original), "-vf", filters, "-an", "-c:v", "libx264", "-r", "30", "-g", "30", "-keyint_min", "30", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", str(destination)], check=True)

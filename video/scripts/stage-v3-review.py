"""Stage a self-contained, disposable project for HyperFrames validation."""
import os
import re
import shutil
import sys
from pathlib import Path

base = Path(__file__).resolve().parent.parent
source = base / ("v3-draft.html" if "--draft" in sys.argv else "v3.html")
staging = base / ".work/v3-review"
staging.mkdir(parents=True, exist_ok=True)
document = source.read_text(encoding="utf-8")
(staging / "index.html").write_text(document, encoding="utf-8")
for name in set(re.findall(r'src="((?:assets|\.work)/[^\"]+)"', document)):
    original = base / name
    destination = staging / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        destination.unlink()
    try:
        os.link(original, destination)
    except OSError:
        shutil.copy2(original, destination)
print("Review project:", staging)

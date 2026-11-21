"""Stage the V5 composition locally; source video contains recovery codes."""
import os
import re
import shutil
from pathlib import Path

base = Path(__file__).resolve().parent.parent
stage = base / ".work/v5-review"
stage.mkdir(parents=True, exist_ok=True)
document = (base / "v5.html").read_text(encoding="utf-8")
(stage / "index.html").write_text(document, encoding="utf-8")
for name in set(re.findall(r'src="((?:assets|\.work)/[^"]+)"', document)):
    original, target = base / name, stage / name
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        target.unlink()
    try:
        os.link(original, target)
    except OSError:
        shutil.copy2(original, target)
print("Prepared local V5 review project.")

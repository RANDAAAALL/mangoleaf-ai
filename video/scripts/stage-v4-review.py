"""Stage V4 locally for validation; the result contains recovery credentials."""
import os
import re
import shutil
import sys
from pathlib import Path

base=Path(__file__).resolve().parent.parent
source=base/('v4-draft.html' if '--draft' in sys.argv else 'v4.html')
stage=base/'.work/v4-review'
stage.mkdir(parents=True,exist_ok=True)
document=source.read_text(encoding='utf-8')
(stage/'index.html').write_text(document,encoding='utf-8')
for name in set(re.findall(r'src="((?:assets|\.work)/[^\"]+)"',document)):
    original=base/name
    target=stage/name
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        target.unlink()
    try:
        os.link(original,target)
    except OSError:
        shutil.copy2(original,target)
print('Prepared local V4 review project.')

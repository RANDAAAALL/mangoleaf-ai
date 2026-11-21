"""Create V5 from the verified V4 composition without changing V4."""
import json
from pathlib import Path

base = Path(__file__).resolve().parent.parent
document = (base / "v4.html").read_text(encoding="utf-8")
timing = json.loads((base / "v4-timing.json").read_text(encoding="utf-8"))

old_loader = "tl.to('#loader',{rotation:460,duration:3.7,ease:'power1.out'},0);"
new_loader = (
    "tl.to('#loader',{rotation:900,duration:2.5,ease:'none'},0);"
    "tl.to('#loader',{rotation:1080,duration:1.2,ease:'power1.out'},2.5);"
)
old_tap = f"tap({timing['clicks'][3]:.3f},198,580);"
new_tap = f"tap({timing['clicks'][3]:.3f},198,600);"
for old in (old_loader, old_tap):
    if document.count(old) != 1:
        raise SystemExit(f"Expected exactly one V4 animation: {old}")
document = document.replace(old_loader, new_loader).replace(old_tap, new_tap)
(base / "v5.html").write_text(document, encoding="utf-8")
print("Built V5 from V4; duration and audio timing are unchanged.")

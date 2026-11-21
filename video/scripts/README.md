# Walkthrough scripts

Run commands from the `video/` directory. Scripts locate the project root from their own path, so they can also be invoked from another working directory.

For the current composition:

```powershell
.\.venv\Scripts\python.exe scripts\build-v5.py
.\.venv\Scripts\python.exe scripts\stage-v5-review.py
npx --offline --yes hyperframes@0.7.103 check .work/v5-review --samples 18
```

`build-v5.py` derives V5 from `v4.html` and `v4-timing.json`. Staging creates a disposable review directory; it does not create a video export. For the render and audio details, see the [V5 plan](../docs/WALKTHROUGH-V5-PLAN.md).

Scripts named `build-v3`, `build-v4`, `prepare-*`, `generate-*`, `review-*`, `stage-v3`, and `stage-v4` support earlier versions and their media. `apply-v3-stack-correction.py` modifies the V3 export when run; it is retained for the historical workflow.

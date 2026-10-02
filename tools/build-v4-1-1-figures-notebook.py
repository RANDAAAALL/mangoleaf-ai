"""Build the guided V4.1.1 figures notebook from the frozen V4.1 figure recipe."""

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "notebooks/experiment/v4.1/MangoLeaf_AI_Post_Training_Figures_v4_1.ipynb"
TARGET = ROOT / "notebooks/experiment/v4.1.1/MangoLeaf_AI_Post_Training_Figures_v4_1_1.ipynb"


def markdown(body):
    return {"cell_type": "markdown", "metadata": {}, "source": body.splitlines(keepends=True)}


def code(body):
    return {"cell_type": "code", "metadata": {}, "execution_count": None,
            "outputs": [], "source": body.splitlines(keepends=True)}


original_bytes = SOURCE.read_bytes()
original = json.loads(original_bytes)
helpers = ["".join(original["cells"][i]["source"]).replace("V4.1", "V4.1.1")
           for i in (4, 5, 6)]

# The historical drawing recipe stays intact. These guards bind the two runs
# together and prevent a second execution from replacing saved evidence.
helpers[2] = helpers[2].replace(
    '    evaluation = read_json(threshold / "evaluation.json")\n',
    '    evaluation = read_json(threshold / "evaluation.json")\n'
    '    if selected["trainingCompleteSha256"] != sha256_file(training / "training_complete.json"):\n'
    '        raise ValueError("Threshold selection belongs to a different training run")\n'
    '    if evaluation["selectionSha256"] != sha256_file(threshold / "selected_thresholds.json"):\n'
    '        raise ValueError("Evaluation belongs to a different threshold selection")\n',
    1,
)
helpers[2] = helpers[2].replace(
    '    output.mkdir(parents=True, exist_ok=True)\n'
    '    artifacts.mkdir(parents=True, exist_ok=True)\n',
    '    if output.exists() or artifacts.exists():\n'
    '        raise FileExistsError("Figure output already exists; choose a fresh OUTPUT_DIR to preserve evidence")\n'
    '    output.mkdir(parents=True, exist_ok=False)\n'
    '    if artifacts != output:\n'
    '        artifacts.mkdir(parents=True, exist_ok=False)\n',
    1,
)

notebook = {
    "cells": [
        markdown("""# V4.1.1 guided reproduction: figures

**Experimental candidate only. This notebook does not train or fit thresholds.** Run it after the matching V4.1.1 training and threshold notebooks finish. It reads their saved files, verifies important hashes, and writes figures to a new Drive folder. It does not change either saved model.

V4.1.1 uses the V4.1 figure recipe. Figures describe this new run; they cannot prove that it reproduced V4.1's exact predictions or that field diagnoses are correct.
"""),
        markdown("""## Step 1: Choose three inputs

Set `TRAINING_RUN` to the **completed** V4.1.1 training run folder. It must contain `training_complete.json`, `dataset_split.zip`, `arms/`, and `masks/`. Set `THRESHOLD_RUN` to the matching completed threshold run, containing `selected_thresholds.json`, `evaluation.json`, and `arms/`. `SCENE_PHOTOS` points to the same reviewed background-photo folder used during training. Do not point either run setting at the parent `training/` or `threshold_fitting/` folder.

**Expected:** four printed paths. Stop if any path is wrong; these figures must describe the exact saved run.
"""),
        code("""from google.colab import drive
from datetime import datetime, timezone
from pathlib import Path

drive.mount('/content/drive')
ROOT = Path('/content/drive/MyDrive/mangoleaf_experiments/v4.1.1')
TRAINING_RUN = ROOT / 'training' / 'PASTE_COMPLETED_TRAINING_RUN_FOLDER'
THRESHOLD_RUN = ROOT / 'threshold_fitting' / 'PASTE_COMPLETED_THRESHOLD_RUN_FOLDER'
SCENE_PHOTOS = Path('/content/drive/MyDrive/mangoleaf_background_photos')
if 'PASTE_' in str(TRAINING_RUN) or 'PASTE_' in str(THRESHOLD_RUN):
    raise ValueError('Set both completed run folder names before generating figures.')
OUTPUT_DIR = ROOT / 'post_training_figures' / ('v4-1-1-figures-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
print('Training run:', TRAINING_RUN)
print('Threshold run:', THRESHOLD_RUN)
print('Background scenes:', SCENE_PHOTOS)
print('New figure folder:', OUTPUT_DIR)
"""),
        markdown("""## Step 2: Load shared helpers and check provenance

These functions read JSON/CSV, verify SHA-256 file hashes, and decode the frozen input images. Hash mismatch means the saved evidence or background photos changed; stop and inspect instead of drawing a misleading chart. Run this code cell before the next two helper cells.
"""),
        code(helpers[0]),
        markdown("""## Step 3: Define charts from saved numbers

Training curves come from each arm's saved epoch history. Confusion matrices and per-class charts come from frozen evaluation results. Threshold-search curves come from saved grid-search CSVs. Drawing these charts performs **no new prediction**.
"""),
        code(helpers[1]),
        markdown("""## Step 4: Define image diagnostics

Augmentation preview uses recorded training photo, mask, scene, and epoch choices. Its later Keras flip/rotation/zoom/shear/brightness row is a **new random draw**, not the exact pixels seen in the old run. Grad-CAM runs the saved background-arm model on selected validation photos to show model attention; it does not prove a correct diagnosis.
"""),
        code(helpers[2]),
        markdown("""## Step 5: Generate figures and inspect the list

This cell checks source identities, then writes six figures, per-class CSV, and `figure_provenance.json` under a new output folder. The provenance file links each figure to the run and model hashes. Rerunning with the same `OUTPUT_DIR` stops instead of overwriting evidence; rerun the first cell to choose a fresh folder. No `model.fit` call happens here.
"""),
        code("""provenance = generate_figures(TRAINING_RUN, THRESHOLD_RUN, SCENE_PHOTOS, OUTPUT_DIR, OUTPUT_DIR)
print('Background model SHA-256:', provenance['modelSha256'])
print('Preview source:', provenance['augmentationPreview']['trainingImage'])
print('Figures:', ', '.join(provenance['figures']))
"""),
        markdown("""## Step 6: Look at each figure

- `training_curves.png`: training and validation accuracy/loss across both stages for all four arms.
- `confusion_matrix.png`: raw class mistakes on saved mango test predictions.
- `per_class_metrics.png` and `.csv`: precision, recall, and F1 by class.
- `threshold_search.png`: how candidate rejection gates performed on tuning data.
- `augmentation_preview.png`: representative source and augmentation; read the exact-versus-new-draw note above.
- `grad_cam.png`: attention for selected validation photos, not accuracy evidence.

Inspect captions and surprising images before copying a **small reviewed selection** into repository `docs/model-training/experiment/v4.1.1/figures/`. Keep full outputs with their run in Drive.
"""),
        code("""from IPython.display import display

for name in ('training_curves.png', 'confusion_matrix.png', 'per_class_metrics.png',
             'threshold_search.png', 'augmentation_preview.png', 'grad_cam.png'):
    print(name)
    display(Image.open(OUTPUT_DIR / name))
"""),
    ],
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python"},
        "v411FigureRecipeSourceSha256": hashlib.sha256(original_bytes).hexdigest(),
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

for index, cell in enumerate(notebook["cells"]):
    text = "".join(cell["source"])
    cell["id"] = "v411-" + hashlib.sha256(f"{index}:{text}".encode()).hexdigest()[:12]

TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps(notebook, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(TARGET)

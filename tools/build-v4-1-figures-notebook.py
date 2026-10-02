"""Keep the uploadable V4.1 figures notebook in sync with the local generator."""

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "generate-v4-1-figures.py"
NOTEBOOK = ROOT / "notebooks" / "experiment" / "v4.1" / "MangoLeaf_AI_Post_Training_Figures_v4_1.ipynb"


def markdown(body):
    return {"cell_type": "markdown", "metadata": {}, "source": body.splitlines(keepends=True)}


def code(body):
    return {"cell_type": "code", "metadata": {}, "execution_count": None,
            "outputs": [], "source": body.splitlines(keepends=True)}


source = SCRIPT.read_text(encoding="utf-8")
source = source.split('if __name__ == "__main__":')[0]
part_a, rest = source.split("def save_training_curves(", 1)
part_b, part_c = ("def save_training_curves(" + rest).split("def save_augmentation_preview(", 1)
part_c = "def save_augmentation_preview(" + part_c

notebook = {
    "cells": [
        markdown("""# MangoLeaf AI V4.1: post-training figures

**Experimental candidate only. No model retraining or threshold fitting happens here.**

This notebook reads the completed V4.1 training and threshold runs. It draws four charts from saved numbers, makes one representative four-arm augmentation preview, and creates new Grad-CAM maps from the saved **background-arm** Keras model and seven validation photos.

Run it in Colab after copying both complete run folders and the original `mangoleaf_background_photos` folder into Drive. The notebook checks important source hashes before drawing. Every run gets a new output folder; copy selected figures and `figure_provenance.json` into the repository only after reviewing them.

**Interpretation:** top-row background and lighting samples reconstruct saved choices before Keras augmentation. The second-row flip/rotation/zoom/shear/brightness samples are new draws using the original recipe; the exact random tensors from the old training session were not saved. Grad-CAM is a new diagnostic of the saved model, not proof of accuracy. The historical mango test and old OOD tune images were used during earlier development.
"""),
        markdown("""## 1. Mount Drive and choose the completed runs

Check all three input paths. `TRAINING_RUN` must contain `training_complete.json`, `dataset_split.zip`, `arms/`, and `masks/`. `THRESHOLD_RUN` must contain `selected_thresholds.json`, `evaluation.json`, and `arms/`. `SCENE_PHOTOS` is the original 62-photo background folder, not OOD photos. Run the remaining cells from top to bottom.
"""),
        code("""from google.colab import drive
from datetime import datetime, timezone
from pathlib import Path

drive.mount('/content/drive')
ROOT = Path('/content/drive/MyDrive/mangoleaf_experiments/v4.1')
TRAINING_RUN = ROOT / 'training' / 'v4-1-training-20260924T182154Z-2dcd4023'
THRESHOLD_RUN = ROOT / 'threshold_fitting' / 'v4.1-thresholds-20260924T202255Z-62a52fc0'
SCENE_PHOTOS = Path('/content/drive/MyDrive/mangoleaf_background_photos')
OUTPUT_DIR = ROOT / 'post_training_figures' / ('v4-1-figures-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
print('Training:', TRAINING_RUN)
print('Thresholds:', THRESHOLD_RUN)
print('Background photos:', SCENE_PHOTOS)
print('New figure folder:', OUTPUT_DIR)
"""),
        markdown("## 2. Figure helpers\n\nThese functions reproduce the saved data and the V4.1 image recipe. Keep them unchanged when comparing the four arms.\n"),
        code(part_a),
        code(part_b),
        code(part_c),
        markdown("## 3. Generate and inspect\n\nThe next cell verifies source hashes and creates the figures. It never calls `model.fit`.\n"),
        code("""provenance = generate_figures(TRAINING_RUN, THRESHOLD_RUN, SCENE_PHOTOS, OUTPUT_DIR, OUTPUT_DIR)
print('Background model SHA-256:', provenance['modelSha256'])
print('Preview source:', provenance['augmentationPreview']['trainingImage'])
print('Figures:', ', '.join(provenance['figures']))
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
        "v41FigureSourceSha256": hashlib.sha256(source.encode()).hexdigest(),
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}
NOTEBOOK.write_text(json.dumps(notebook, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(NOTEBOOK)

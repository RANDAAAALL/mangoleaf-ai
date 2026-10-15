"""Check V4.5.0 notebook contracts using local synthetic fixtures.

Requires Python 3.11+, nbformat, NumPy, Pillow, Matplotlib, and packaging. Does not install
packages, mount Drive, download weights, fit a model, or run reliability cases.
Fixtures establish implementation boundaries, not measured model accuracy.
"""

import ast
import copy
import csv
import hashlib
import io
import json
import math
import random
import re
import shutil
import sys
import tempfile
import time
import uuid
import zipfile
from collections import Counter, defaultdict
from contextlib import redirect_stdout
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from types import ModuleType, SimpleNamespace
from unittest.mock import patch

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import nbformat
import numpy as np
from packaging.requirements import Requirement
from packaging.utils import canonicalize_name
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_DIR = ROOT / "notebooks/non-experiment/v4.5.0"
CLASS_NAMES = [
    "anthracnose", "bacterial_black_spot", "bacterial_canker",
    "healthy_fruit", "healthy_leaf", "mango_scab", "sooty_mold",
]


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def expect_error(action, error=ValueError):
    try:
        action()
    except error:
        return
    raise AssertionError("An invalid fixture was unexpectedly accepted.")


def read_notebook(filename):
    path = NOTEBOOK_DIR / filename
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    ids = [cell.id for cell in notebook.cells]
    check(len(ids) == len(set(ids)), "Notebook cell IDs repeat.")
    code, markdown = [], []
    for cell in notebook.cells:
        if cell.cell_type == "code":
            check(cell.execution_count is None and not cell.outputs,
                  "A clean template contains execution evidence.")
            check(not re.search(r"^\s*(?:%|!)", cell.source, re.M),
                  "A code cell requires a notebook execution magic.")
            compile(cell.source, str(path), "exec")
            code.append(cell.source)
        elif cell.cell_type == "markdown":
            markdown.append(cell.source)
    steps = [cell for cell in markdown if re.search(r"^## Step \d+:", cell, re.M)]
    numbers = [int(re.search(r"^## Step (\d+):", cell, re.M).group(1)) for cell in steps]
    check(numbers == list(range(1, len(numbers) + 1)), "Steps are missing or out of order.")
    for cell in steps:
        for label in ("What", "Why", "How", "Expected result"):
            check("**" + label + ":**" in cell, "A step lacks its explanation: " + label)
    check("V4.5.0" in "\n".join(markdown), "The experiment label is missing.")
    return {"path": path, "code": code, "markdown": markdown, "steps": len(steps)}


def functions(notebook, names, namespace=None):
    namespace = dict(namespace or {})
    found = set()
    for source in notebook["code"]:
        nodes = [node for node in ast.parse(source).body
                 if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names]
        found.update(node.name for node in nodes)
        if nodes:
            exec(compile(ast.Module(body=nodes, type_ignores=[]), str(notebook["path"]), "exec"), namespace)
    check(found == set(names), "Missing helpers: " + str(set(names) - found))
    return namespace


def literal(notebook, name):
    for source in notebook["code"]:
        for node in ast.parse(source).body:
            if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
                return ast.literal_eval(node.value)
    raise AssertionError("Missing literal setting: " + name)


def source_with(notebook, text):
    matches = [source for source in notebook["code"] if text in source]
    check(len(matches) == 1, "Expected one owning cell for: " + text)
    return matches[0]


def check_threshold_math(notebook):
    names = {"assign_whole_groups", "probability_stats", "accepted", "select_thresholds",
             "scored_records", "classification_metrics", "summarize_mango", "summarize_ood"}
    namespace = functions(notebook, names, {"math": math, "random": random, "CLASS_NAMES": CLASS_NAMES})
    stats = namespace["probability_stats"]([[1, 0, 0, 0, 0, 0, 0], [1 / 7] * 7,
                                           [0.8, 0.1, 0.02, 0.02, 0.02, 0.02, 0.02]])
    check(stats[0]["entropy"] == 0 and stats[0]["margin"] == 1, "A certain prediction changed.")
    check(math.isclose(stats[1]["entropy"], 1) and stats[1]["margin"] == 0,
          "Uniform seven-class probabilities need maximum normalized entropy.")
    check(math.isclose(stats[2]["margin"], 0.7), "Margin is not the top-two difference.")
    for invalid in ([[0.5] * 7], [[1, 2, 3]], [[float("nan")] + [0] * 6], [[-0.1, 1.1] + [0] * 5]):
        expect_error(lambda invalid=invalid: namespace["probability_stats"](invalid))
    gates = {"confidenceThreshold": 0.7, "marginThreshold": 0.2, "entropyThreshold": 0.4}
    boundary = {"confidence": 0.7, "margin": 0.2, "entropy": 0.4}
    check(namespace["accepted"](boundary, gates), "An inclusive gate boundary was rejected.")
    for key, value in (("confidence", 0.699), ("margin", 0.199), ("entropy", 0.401)):
        check(not namespace["accepted"]({**boundary, key: value}, gates), "A failed gate accepted a photo.")

    mango = [{"confidence": 0.8, "margin": 0.3, "entropy": 0.2}] * 20
    ood = [{"confidence": 0.9, "margin": 0.3, "entropy": 0.6}] * 250
    chosen, search = namespace["select_thresholds"](mango, ood, [0, 0.2, 0.4, 0.6, 1], 0.7, 0.95)
    check(chosen == {"confidenceThreshold": 0.7, "marginThreshold": 0, "entropyThreshold": 0.4},
          "The best feasible permissive threshold changed.")
    check(len(search) == 25, "The margin/entropy search omitted candidates.")
    chosen, _ = namespace["select_thresholds"](
        [{"confidence": 0.6, "margin": 0.3, "entropy": 0.2}] * 20, ood, [0, 1], 0.7, 0.95)
    check(chosen is None, "An infeasible retention target produced fitted settings.")
    expect_error(lambda: namespace["select_thresholds"](mango, ood, [], 0.7, 0.95))

    groups = {"a": list(range(150)), "b": list(range(100)), "c": list(range(120)), "d": list(range(130))}
    picked = namespace["assign_whole_groups"](groups, 250, 42)
    check(sum(len(groups[key]) for key in picked) == 250, "The tuning count is not exact.")
    check(picked == namespace["assign_whole_groups"](groups, 250, 42), "Assignment is not deterministic.")
    expect_error(lambda: namespace["assign_whole_groups"]({"inseparable": list(range(500))}, 250, 42))

    scored = [
        {"actualClass": "anthracnose", "rawPredictedClass": "anthracnose", "displayedClass": "anthracnose", "accepted": True},
        {"actualClass": "anthracnose", "rawPredictedClass": "anthracnose", "displayedClass": "rejected", "accepted": False},
        {"actualClass": "mango_scab", "rawPredictedClass": "anthracnose", "displayedClass": "anthracnose", "accepted": True},
    ]
    report = namespace["summarize_mango"](scored)
    check(report["total"] == 3 and report["rejected"] == 1, "A rejected mango photo disappeared.")
    check(math.isclose(report["rawAccuracy"], 2 / 3), "Gates changed raw accuracy.")
    check(math.isclose(report["correctAcceptedFractionOfAllPhotos"], 1 / 3), "Full-set correctness lost rejects.")
    check(math.isclose(report["acceptedOnlyAccuracy"], 1 / 2), "Accepted-only accuracy denominator changed.")
    anthracnose = report["rejectionAwarePerClassMetrics"][0]
    check(anthracnose["support"] == 2 and anthracnose["recall"] == 0.5,
          "Rejected true-class photos disappeared from recall.")
    check(np.asarray(report["rawConfusionMatrix"]).sum() == 3, "Raw matrix lost a test photo.")
    check(np.asarray(report["rejectionAwareConfusionMatrix"]).shape == (7, 8), "Reject column is absent.")
    check(namespace["summarize_ood"]([{"accepted": True}, {"accepted": False}])["falseAcceptRate"] == 0.5,
          "False acceptance denominator changed.")
    expect_error(lambda: namespace["summarize_ood"]([]))
    return namespace, report


def check_file_boundaries(notebook):
    namespace = functions(notebook, {"inside", "sha256_file", "read_json", "write_json_once", "verify_artifacts", "read_selection_lock"},
                          {"Path": Path, "PurePosixPath": PurePosixPath, "hashlib": hashlib, "json": json})
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-locks-") as directory:
        root = Path(directory).resolve()
        for name in ("../escape.json", "/absolute.json", "C:/outside.json", "..\\outside.json", "."):
            expect_error(lambda name=name: namespace["inside"](root, name))
        check(namespace["inside"](root, "tfjs_model/model.json").parent == root / "tfjs_model", "Safe child path changed.")
        model = root / "model_calibrated.keras"
        model.write_bytes(b"synthetic model identity; not Keras weights")
        complete_path = root / "training_complete.json"
        complete = {"artifacts": {model.name: {"sha256": namespace["sha256_file"](model), "bytes": model.stat().st_size}}}
        complete_path.write_text(json.dumps(complete), encoding="utf-8")
        namespace.update(TRAINING_RUN=root, COMPLETE_PATH=complete_path,
                         COMPLETE_HASH=namespace["sha256_file"](complete_path), complete=complete)
        namespace["verify_artifacts"]()
        original = model.read_bytes()
        model.write_bytes(original + b"tampered")
        expect_error(namespace["verify_artifacts"], RuntimeError)
        model.write_bytes(original)
        selection_path = root / "selected_thresholds.json"
        selection = {"status": "feasible", "evaluationInputsSha256": "inputs",
                     "trainingCompleteSha256": namespace["COMPLETE_HASH"], "modelSha256": namespace["sha256_file"](model)}
        namespace["write_json_once"](selection_path, selection)
        digest = namespace["sha256_file"](selection_path)
        namespace["write_json_once"](root / "selection_lock.json", {"selectionSha256": digest})
        namespace.update(SELECTION_PATH=selection_path, SELECTION_HASH=digest, INPUT_HASH="inputs", RUN_DIR=root)
        check(namespace["read_selection_lock"]() == selection, "A valid gate lock was rejected.")
        selection_path.write_text(json.dumps({**selection, "status": "infeasible"}), encoding="utf-8")
        expect_error(namespace["read_selection_lock"], RuntimeError)
        expect_error(lambda: namespace["write_json_once"](selection_path, selection), FileExistsError)


def check_charts(notebook, report):
    namespace = functions(notebook, {"plot_matrix_pair", "plot_class_metrics"},
                          {"np": np, "plt": plt, "labels": CLASS_NAMES})
    figures = []

    def finish(figure, filename, caption):
        check(caption.strip(), "A chart lacks a description.")
        figures.append((figure, filename))

    namespace["finish_figure"] = finish
    namespace["plot_matrix_pair"](report["rawConfusionMatrix"], CLASS_NAMES, "V4.5.0 fixture, n=3",
                                  "confusion_matrix.png", "Synthetic raw counts and row percentages.")
    figure = figures[0][0]
    matrices = [axis.images[0].get_array() for axis in figure.axes if axis.images]
    check(len(matrices) == 2, "The matrix is missing its counts/percentages pair.")
    check(np.array_equal(matrices[0], report["rawConfusionMatrix"]), "Count panel changed inputs.")
    check(matrices[1][0, 0] == 100 and matrices[1][5, 0] == 100,
          "The percentage panel is not normalized by actual-class row.")
    check(np.all(np.isfinite(matrices[1])), "Zero-support rows produced nonfinite percentages.")
    namespace["plot_class_metrics"](report["rawPerClassMetrics"], report["rawAccuracy"], "Overall raw accuracy",
                                    "V4.5.0 fixture", "per_class_metrics.png", "Synthetic scores and original supports.")
    axis = figures[1][0].axes[0]
    check(len(axis.patches) == 21, "Seven classes need three metric bars each.")
    check(any("n=2" in text.get_text() for text in axis.get_xticklabels()), "Class support is missing.")
    check(math.isclose(float(axis.lines[0].get_ydata()[0]), 2 / 3), "Overall-accuracy reference changed.")
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-charts-") as directory:
        for figure, filename in figures:
            output = Path(directory) / filename
            figure.savefig(output, dpi=60, bbox_inches="tight")
            check(output.stat().st_size > 1000, "The chart image was not rendered.")
            plt.close(figure)


def check_training_boundaries(notebook):
    check(literal(notebook, "CLASS_NAMES") == CLASS_NAMES, "Training class order differs.")
    check(literal(notebook, "EXPECTED_OOD_IMAGE_COUNT") == 500, "Training did not reserve the intended OOD pool.")
    check(literal(notebook, "STAGE1_EPOCHS") == 5 and literal(notebook, "STAGE2_EPOCHS") == 10,
          "The agreed 5 + 10 epoch schedule changed.")
    check(literal(notebook, "STAGE1_LEARNING_RATE") == 0.001
          and literal(notebook, "STAGE2_LEARNING_RATE") == 0.00001, "The agreed learning rates changed.")
    check(literal(notebook, "CONTRAST_FACTOR") == 0.1, "Contrast factor changed.")
    reviewed = literal(notebook, "REVIEWED_IMAGES")
    check(len(reviewed) == 62 and len({row["sha256"] for row in reviewed}) == 62,
          "The 62 distinct reviewed identities were not retained.")
    historical = json.loads((ROOT / "notebooks/experiment/v4.4.0/MangoLeaf_AI_Training_v4_4_0_Post_Training.ipynb").read_text(encoding="utf-8"))
    historical_code = ["".join(cell["source"]).removeprefix("%%mangoleaf\n")
                       for cell in historical["cells"] if cell["cell_type"] == "code"]
    check(reviewed == literal({"code": historical_code}, "REVIEWED_IMAGES"),
          "Embedded reviewed identities differ from the instructed Step 5 source.")
    filenames = literal(notebook, "GRADCAM_NAMES")
    check(filenames == {
        "anthracnose": "DSC_0488.JPG", "sooty_mold": "IMG_20260219_134935.jpg",
        "healthy_leaf": "HealthyLeaf_1.jpg", "mango_scab": "verified mango disease 67.jpg",
        "healthy_fruit": "723624552_976005712089787_680463173797746853_n.jpg",
    }, "A requested original preview filename changed.")

    namespace = functions(notebook, {"exact_representatives", "connected_groups", "assign_mango_groups", "portable_rows"},
                          {"Path": Path, "defaultdict": defaultdict, "np": np, "random": random})
    rows = [
        {"id": "copy", "label": "healthy_fruit", "sourceRelativePath": "fruit/copy.jpg", "sha256": "copy-hash", "decodedRgbSha256": "same"},
        {"id": "protected", "label": "healthy_fruit", "sourceRelativePath": "fruit/protected.jpg", "sha256": "reviewed-hash", "decodedRgbSha256": "same"},
        {"id": "distinct", "label": "healthy_fruit", "sourceRelativePath": "fruit/distinct.jpg", "sha256": "distinct-hash", "decodedRgbSha256": "other"},
    ]
    kept, audit = namespace["exact_representatives"](rows, {"reviewed-hash"})
    check({row["id"] for row in kept} == {"protected", "distinct"} and len(audit) == 1,
          "Exact-copy reduction did not favor the protected identity.")
    expect_error(lambda: namespace["exact_representatives"](rows, {"reviewed-hash", "copy-hash"}), RuntimeError)
    conflict = copy.deepcopy(rows)
    conflict[0]["label"] = "healthy_leaf"
    expect_error(lambda: namespace["exact_representatives"](conflict), RuntimeError)
    pairs = [{"firstId": "protected", "secondId": "distinct", "distance": 2}]
    groups = namespace["connected_groups"](kept, pairs, [], [])
    check(groups["protected"] == groups["distinct"], "A near pair was split by default.")
    independent = namespace["connected_groups"](kept, pairs, [["protected", "distinct"]], [])
    check(independent["protected"] != independent["distinct"], "An explicit distinct review was ignored.")
    expect_error(lambda: namespace["connected_groups"](kept, pairs, [["missing", "distinct"]], []))

    collection = {f"{label}-{index}": [{"id": f"{label}-{index}", "label": label}]
                  for label in CLASS_NAMES for index in range(20)}
    reserved = {f"{label}-0" for label in CLASS_NAMES}
    assignments, counts = namespace["assign_mango_groups"](collection, CLASS_NAMES, reserved, 42)
    check(all(assignments[key] == "val" for key in reserved), "Preview groups escaped validation.")
    check(np.all(counts.sum(axis=0) == 20) and np.all(counts > 0), "The split lost a class or image.")
    check(set(assignments) == set(collection), "Whole-group assignments lost identities.")
    check(assignments == namespace["assign_mango_groups"](collection, CLASS_NAMES, reserved, 42)[0],
          "Fresh split membership is not reproducible.")
    expect_error(lambda: namespace["assign_mango_groups"](collection, CLASS_NAMES, {"missing"}, 42))

    # Exercise the notebook's actual OE formula on a NumPy adapter. TensorFlow's
    # autodiff and GPU execution are checked by the separate in-Colab probe.
    def log_softmax(values, axis=-1):
        shifted = np.asarray(values) - np.max(values, axis=axis, keepdims=True)
        return shifted - np.log(np.exp(shifted).sum(axis=axis, keepdims=True))

    adapter = SimpleNamespace(reduce_mean=np.mean, nn=SimpleNamespace(log_softmax=log_softmax))
    objective = functions(notebook, {"uniform_exposure_loss", "validation_nll"}, {"tf": adapter, "np": np})
    logits = np.array([[0.0] * 7, [5.0, 0, 0, 0, 0, 0, 0]])
    losses = objective["uniform_exposure_loss"](logits)
    check(math.isclose(losses[0], math.log(7)) and losses[1] > losses[0],
          "OE must penalize concentrated predictions more than uniform predictions.")
    objective.update(validation_logits=logits, validation_labels=np.array([0, 0]))
    expected_nll = -(log_softmax(logits)[0, 0] + log_softmax(logits)[1, 0]) / 2
    check(math.isclose(objective["validation_nll"](1.0), expected_nll), "Validation NLL changed.")
    source = "\n".join(notebook["code"])
    trainer = next(node for text in notebook["code"] for node in ast.parse(text).body
                   if isinstance(node, ast.ClassDef) and node.name == "OETrainer")
    train_step = ast.unparse(next(node for node in trainer.body if isinstance(node, ast.FunctionDef) and node.name == "train_step"))
    test_step = ast.unparse(next(node for node in trainer.body if isinstance(node, ast.FunctionDef) and node.name == "test_step"))
    check("uniform_exposure_loss(outlier_logits)" in train_step and "self.optimizer.apply_gradients" in train_step,
          "OE is disconnected from the actual training gradient update.")
    check("self.accuracy_tracker.update_state(labels, tf.nn.softmax(mango_logits))" in train_step,
          "Training accuracy mixes unsupported photos into mango labels.")
    check("uniform_exposure_loss" not in test_step and "balanced_weights" not in test_step,
          "Clean validation uses the OE objective or training class weights.")
    check("compute_class_weight('balanced'" in source or 'compute_class_weight("balanced"' in source,
          "Fresh balanced class weighting is missing.")
    check("head_weights / temperature" in source and "head_bias / temperature" in source,
          "Temperature is not folded into weights and bias once.")
    for old_run in ("/v4.3.0/", "/v4.4.0/", "BACKGROUND_ROOT", "APPROVED_TRAIN_MASK_IDS", "LOCAL_LIGHT_PROBABILITY"):
        check(old_run not in source, "A previous-run/background input remains in executable cells: " + old_run)


def check_ood_review_cell(notebook):
    source = source_with(notebook, "photo_review = read_csv(RUN_DIR / 'ood_review.csv')")
    pool = [{"id": f"{index:03}", "relativePath": f"photo_{index}.jpg", "sha256": f"fixture-{index}",
             "bytes": 1, "groupIdBeforeThreshold": f"group-{index // 2}",
             "captureGroup": "", "sourceGroup": ""} for index in range(500)]
    reviews = [{"id": row["id"], "relativePath": row["relativePath"], "keep": "yes", "unsupported": "yes",
                "captureGroup": "", "sourceGroup": "", "sourceNotes": "Synthetic verification fixture",
                "priorUse": "previously_evaluated" if index < 200 else "new_for_v4_5_0",
                "notes": "Synthetic fixture, not a real collection."} for index, row in enumerate(pool)]
    captured = {}
    namespace = {
        "Counter": Counter, "defaultdict": defaultdict, "random": random,
        "ood_records": pool, "pair_flags": [], "external_records": [],
        "EXPECTED_OOD_IMAGES": 500, "TARGET_TUNING_IMAGES": 250, "TARGET_REPORTING_IMAGES": 250,
        "SEED": 42, "RUN_DIR": Path("synthetic"), "TRAINING_RUN": Path("synthetic-training"),
        "OOD_ROOT": Path("synthetic-ood"), "EXPERIMENT_VERSION": "v4.5.0", "COMPLETE_HASH": "sealed-training",
        "complete": {"inputManifestSha256": "sealed-manifest"},
        "read_csv": lambda path: reviews if path.name == "ood_review.csv" else [],
        "write_json_once": lambda path, value: captured.update({path.name: value}),
        "write_csv_once": lambda path, rows: None,
        "sha256_file": lambda path: "fixture-sha", "utc_now": lambda: "fixture-time",
        "verify_photo": lambda row, path: None, "verify_artifacts": lambda: None,
        "print": lambda *args: None,
    }
    # File hashing/immutability is exercised separately on real temporary files.
    # This fixture runs the full review/grouping decision cell without image I/O.
    exec(source, namespace)
    check(namespace["assignment_counts"] == {"ood_tune": 250, "ood_report": 250}, "Full review lost a photo.")
    subsets = defaultdict(set)
    for row in namespace["assigned_records"]:
        subsets[row["groupIdBeforeThreshold"]].add(row["subset"])
    check(all(len(value) == 1 for value in subsets.values()), "A pretraining OOD group was split.")
    check(captured["evaluation_inputs.json"]["priorUseCounts"] == {
        "previously_evaluated": 200, "new_for_v4_5_0": 300,
    }, "Previous-use evidence disappeared.")
    reviews[0]["keep"] = "REVIEW"
    expect_error(lambda: exec(source, namespace))
    reviews[0]["keep"] = "yes"
    reviews[0]["sourceNotes"] = ""
    expect_error(lambda: exec(source, namespace))
    reviews[0]["sourceNotes"] = "Synthetic verification fixture"
    namespace["external_records"] = [{"kind": "oe", "captureGroup": "shared-session"}]
    reviews[0]["captureGroup"] = "shared-session"
    expect_error(lambda: exec(source, namespace))
    reviews[0]["captureGroup"] = ""
    namespace["external_records"] = []
    for row in pool:
        row["groupIdBeforeThreshold"] = "inseparable-pool"
    expect_error(lambda: exec(source, namespace))


def check_live_training_identity(notebook):
    namespace = functions(notebook, {"verify_initial_training_state", "read_json"},
                          {"hashlib": hashlib, "np": np, "json": json, "Path": Path, "CLASS_NAMES": CLASS_NAMES})
    counts = [40, 20, 10, 2, 60, 10, 10]
    rows = [{"label": label} for label, count in zip(CLASS_NAMES, counts) for _ in range(count)]
    weights = len(rows) / (7 * np.asarray(counts, dtype=float))
    arrays = [np.arange(14, dtype=np.float32).reshape(2, 7), np.zeros(7, dtype=np.float32)]
    classifier = SimpleNamespace(get_weights=lambda: arrays)
    digest = hashlib.sha256()
    for array in arrays:
        digest.update(str(array.shape).encode())
        digest.update(array.tobytes())
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-initial-") as directory:
        root = Path(directory)
        (root / "initial_weights.json").write_text(json.dumps({"sha256": digest.hexdigest()}), encoding="utf-8")
        (root / "class_weights.json").write_text(json.dumps(dict(zip(CLASS_NAMES, weights.tolist()))), encoding="utf-8")
        namespace.update(RUN_DIR=root, train_rows=rows)
        by_index = dict(enumerate(weights))
        namespace["verify_initial_training_state"](classifier, weights, by_index)
        arrays[0][0, 0] += 1
        expect_error(lambda: namespace["verify_initial_training_state"](classifier, weights, by_index), RuntimeError)
        arrays[0][0, 0] -= 1
        expect_error(lambda: namespace["verify_initial_training_state"](classifier, weights * 2, by_index), RuntimeError)
        expect_error(lambda: namespace["verify_initial_training_state"](classifier, weights, {**by_index, 3: 1}), RuntimeError)


def check_training_chart(notebook):
    source = source_with(notebook, "history = read_json(RUN_DIR / 'training_history.json')")
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-history-") as directory:
        root = Path(directory)
        figures = root / "figures"
        figures.mkdir()
        history = [{"epoch": epoch, "accuracy": 0.6 + epoch / 50, "val_accuracy": 0.7 + epoch / 60,
                    "mango_loss": 1 / epoch, "val_loss": 0.8 / epoch} for epoch in range(1, 16)]
        (root / "training_history.json").write_text(json.dumps(history), encoding="utf-8")
        for name in ("augmentation_preview.png", "grad_cam.png"):
            (figures / name).write_bytes(b"synthetic identity only")
        namespace = functions(notebook, {"read_json", "file_sha256", "save_json_once"},
                              {"Path": Path, "json": json, "hashlib": hashlib})
        namespace.update(RUN_DIR=root, FIGURE_DIR=figures, STAGE1_EPOCHS=5, STAGE2_EPOCHS=10,
                         plt=plt, figure_manifest={})
        with patch.object(plt, "show", lambda: None):
            exec(source, namespace)
        axes = namespace["axes"]
        check(len(axes) == 2, "Training history needs paired accuracy/loss panels.")
        check(np.allclose(axes[0].lines[0].get_ydata(), [row["accuracy"] for row in history]),
              "Training accuracy was replaced with historical/example data.")
        check(np.allclose(axes[1].lines[0].get_ydata(), [row["mango_loss"] for row in history]),
              "The mango-loss panel plotted a different loss component.")
        check(list(axes[0].lines[2].get_xdata()) == [5.5, 5.5], "The stage boundary moved.")
        check((figures / "training_curves.png").stat().st_size > 1000, "The training chart did not render.")


def check_training_handoff(notebook):
    source = source_with(notebook, "COMPLETE_PATH = TRAINING_RUN / 'training_complete.json'")
    helpers = {"inside", "sha256_file", "read_json", "write_json_once", "verify_artifacts", "verify_photo"}
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-handoff-") as directory:
        root = Path(directory).resolve()
        training_root = root / "training"
        training_root.mkdir()
        setup = root / "setup"
        setup.mkdir()
        (setup / "fixture.log").write_text("Synthetic setup, no packages installed.", encoding="utf-8")
        records, payloads = [], {}
        for subset in ("train", "val", "test"):
            for index, label in enumerate(CLASS_NAMES):
                relative = f"{subset}/{label}/{subset}-{index}.jpg"
                payload = f"synthetic bytes: {relative}".encode()
                payloads[relative] = payload
                records.append({"id": f"{subset}-{index}", "subset": subset, "label": label,
                                "relativePath": relative, "groupId": f"{subset}-{index}",
                                "sha256": hashlib.sha256(payload).hexdigest(), "bytes": len(payload)})
        manifest = {"images": records}
        temperature = {"temperature": 1.2, "temperatureFoldedIntoWeights": True, "foldCount": 1,
                       "fitSubset": "val", "fitIncludesOE": False, "fitIncludesOOD": False}
        documents = {
            "input_manifest.json": manifest, "class_names.json": CLASS_NAMES,
            "temperature.json": temperature, "runtime.json": {"packages": {"tensorflow": "fixture-tf", "keras": "fixture-keras"}},
            "plan.json": {}, "frozen_inputs.json": {}, "mango_inventory.json": {"images": records},
            "oe_inventory.json": {"images": []}, "oe_training_manifest.json": {"images": []},
            "oe_dataset_manifest.json": {"images": []}, "held_out_ood_inventory.json": {"images": []},
            "tfjs_model/model.json": {"format": "graph-model"}, "tfjs_model/model_config.json": {},
        }
        for relative, value in documents.items():
            target = training_root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(value), encoding="utf-8")
        for relative in ("model_calibrated.keras", "validation_probabilities.npy", "validation_logits.npy"):
            (training_root / relative).write_bytes(b"synthetic artifact, not a trained model")
        archive_path = training_root / "dataset_split.zip"
        with zipfile.ZipFile(archive_path, "w") as archive:
            for relative, payload in payloads.items():
                archive.writestr(relative, payload)

        def seal_fixture():
            artifacts = {path.relative_to(training_root).as_posix(): {
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "bytes": path.stat().st_size,
            } for path in training_root.rglob("*") if path.is_file() and path.name != "training_complete.json"}
            receipt = {"experimentVersion": "v4.5.0", "completedEpochs": 15, "classNames": CLASS_NAMES,
                       "foldedTemperature": True, "testPredictionsRun": False, "heldOutOodCount": 500,
                       "calibratedTemperature": 1.2, "configurationHash": "fixture-configuration",
                       "inputManifestSha256": artifacts["input_manifest.json"]["sha256"], "artifacts": artifacts}
            (training_root / "training_complete.json").write_text(json.dumps(receipt), encoding="utf-8")

        def run_fixture():
            # Redirect only the notebook's /content scratch path into the local
            # temporary fixture root. All manifest and artifact checks run intact.
            def fixture_path(*values):
                return root / "content" if values == ("/content",) else Path(*values)

            namespace = functions(notebook, helpers, {
                "Path": fixture_path, "PurePosixPath": PurePosixPath, "json": json, "hashlib": hashlib,
            })
            namespace.update(TRAINING_RUN=training_root, EXPERIMENT_ROOT=root, EXPECTED_OOD_IMAGES=500,
                             EXPERIMENT_VERSION="v4.5.0", CLASS_NAMES=CLASS_NAMES,
                             package_versions=lambda: {"tensorflow": "fixture-tf", "keras": "fixture-keras"},
                             math=math, datetime=datetime, timezone=timezone, uuid=uuid, Counter=Counter,
                             defaultdict=defaultdict, zipfile=zipfile, shutil=shutil,
                             setup_directory=setup, PINNED_PACKAGES=[], utc_now=lambda: "fixture-time",
                             print=lambda *args: None)
            exec(source, namespace)
            check(len(namespace["validation_records"]) == 7 and len(namespace["test_records"]) == 7,
                  "Handoff changed validation/test membership or order.")

        seal_fixture()
        run_fixture()
        temperature["foldCount"] = 2
        (training_root / "temperature.json").write_text(json.dumps(temperature), encoding="utf-8")
        seal_fixture()
        expect_error(run_fixture)
        temperature["foldCount"] = 1
        (training_root / "temperature.json").write_text(json.dumps(temperature), encoding="utf-8")
        with zipfile.ZipFile(archive_path, "a") as archive:
            archive.writestr("../escaped.jpg", b"unsafe")
        seal_fixture()
        expect_error(run_fixture)


def check_live_prediction_lists(notebook):
    namespace = functions(notebook, {"verify_live_prediction_inputs", "read_json", "sha256_file"},
                          {"Path": Path, "json": json, "hashlib": hashlib, "CLASS_NAMES": CLASS_NAMES})
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-live-lists-") as directory:
        root = Path(directory)
        training_root = root / "training"
        training_root.mkdir()
        rows = [{"id": str(index), "subset": subset, "label": CLASS_NAMES[0]}
                for index, subset in enumerate(("train", "val", "val", "test"))]
        ood = [{"id": str(index + 10), "subset": subset, "priorUse": "unknown"}
               for index, subset in enumerate(("ood_tune", "ood_tune", "ood_report", "ood_report"))]
        manifest = {"classNames": CLASS_NAMES, "images": rows}
        inputs = {"oodImages": ood}
        (training_root / "input_manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        (root / "evaluation_inputs.json").write_text(json.dumps(inputs), encoding="utf-8")
        (root / "ood_inventory.json").write_text(json.dumps({"images": ood}), encoding="utf-8")
        namespace.update(
            TRAINING_RUN=training_root, RUN_DIR=root,
            complete={"inputManifestSha256": namespace["sha256_file"](training_root / "input_manifest.json")},
            INPUT_HASH=namespace["sha256_file"](root / "evaluation_inputs.json"),
            manifest=copy.deepcopy(manifest), mango_records=copy.deepcopy(rows),
            evaluation_inputs=copy.deepcopy(inputs), assigned_records=copy.deepcopy(ood), ood_records=copy.deepcopy(ood),
            validation_records=copy.deepcopy([row for row in rows if row["subset"] == "val"]),
            test_records=copy.deepcopy([row for row in rows if row["subset"] == "test"]),
            tuning_records=copy.deepcopy([row for row in ood if row["subset"] == "ood_tune"]),
            reporting_records=copy.deepcopy([row for row in ood if row["subset"] == "ood_report"]),
        )
        namespace["verify_live_prediction_inputs"]()
        namespace["validation_records"].reverse()
        expect_error(namespace["verify_live_prediction_inputs"], RuntimeError)
        namespace["validation_records"].reverse()
        original_test = namespace["test_records"]
        namespace["test_records"] = namespace["validation_records"]
        expect_error(namespace["verify_live_prediction_inputs"], RuntimeError)
        namespace["test_records"] = original_test
        namespace["reporting_records"][0]["priorUse"] = "new_for_v4_5_0"
        expect_error(namespace["verify_live_prediction_inputs"], RuntimeError)


def check_restart_boundary(notebook):
    scientific_names = {"imagehash", "matplotlib", "numpy", "packaging", "PIL", "scipy", "sklearn", "tensorflow"}
    cells = [source for source in notebook["code"] if "import imagehash" in source]
    check(bool(cells), "The scientific import cell is missing.")
    for source in cells:
        nodes = ast.parse(source).body
        import_positions = [index for index, node in enumerate(nodes)
                            if (isinstance(node, ast.Import)
                                and any(alias.name.split(".")[0] in scientific_names for alias in node.names))
                            or (isinstance(node, ast.ImportFrom)
                                and node.module.split(".")[0] in scientific_names)]
        guards = [(index, node) for index, node in enumerate(nodes)
                  if isinstance(node, ast.If) and any(
                      isinstance(child, ast.Raise) and child.exc is not None
                      and "Restart the Colab session after installation" in ast.unparse(child.exc)
                      for child in ast.walk(node))]
        check(bool(import_positions) and len(guards) == 1, "The early restart guard is missing or repeated.")
        guard_position, guard = guards[0]
        check(guard_position < min(import_positions), "Scientific imports execute before the restart guard.")
        probe = ast.Expr(value=ast.Call(func=ast.Name(id="import_scientific_module", ctx=ast.Load()), args=[], keywords=[]))
        code = compile(ast.fix_missing_locations(ast.Module(body=[guard, probe], type_ignores=[])),
                       str(notebook["path"]), "exec")
        for installation_pid in (321, 320):
            imports = []
            receipt = {"installationPid": installation_pid}
            namespace = {
                "installed": receipt, "json": json,
                "setup_receipt": SimpleNamespace(read_text=lambda: json.dumps(receipt)),
                "os": SimpleNamespace(getpid=lambda: 321),
                "import_scientific_module": lambda: imports.append("scientific"),
            }
            if installation_pid == 321:
                expect_error(lambda: exec(code, namespace), RuntimeError)
                check(not imports, "A session imported scientific modules without restarting.")
            else:
                exec(code, namespace)
                check(imports == ["scientific"], "A restarted session remained blocked.")


def check_runtime_preflight(notebook):
    # Execute the real setup prefix with synthetic interpreter versions and a fake Drive.
    # An unsupported session must stop before Drive access or any package installation.
    setup_cells = [source for source in notebook["code"] if "'Unsupported Python '" in source]
    check(bool(setup_cells), "The actionable Python runtime check is missing.")
    for source in setup_cells:
        prefix = []
        for node in ast.parse(source).body:
            prefix.append(node)
            if (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
                    and isinstance(node.value.func, ast.Attribute)
                    and isinstance(node.value.func.value, ast.Name)
                    and node.value.func.value.id == "drive" and node.value.func.attr == "mount"):
                break
        else:
            raise AssertionError("The runtime check lacks its Drive mount boundary.")
        code = compile(ast.Module(body=prefix, type_ignores=[]), str(notebook["path"]), "exec")
        for version in ((3, 11), (3, 12), (3, 10), (3, 13), (3, 14)):
            mounts = []
            google = ModuleType("google")
            google.__path__ = []
            colab = ModuleType("google.colab")
            colab.drive = SimpleNamespace(mount=lambda path: mounts.append(path))
            exact_version = str(version[0]) + "." + str(version[1]) + ".0"
            with patch.object(sys, "version_info", (*version, 0, "final", 0)), \
                    patch.object(sys, "version", exact_version), \
                    patch.dict(sys.modules, {"google": google, "google.colab": colab}), \
                    redirect_stdout(io.StringIO()) as output:
                if version in {(3, 11), (3, 12)}:
                    exec(code, {})
                    check(mounts == ["/content/drive"], "A supported interpreter never reached Drive.")
                else:
                    try:
                        exec(code, {})
                    except RuntimeError as error:
                        check(exact_version in str(error) and "Runtime > Change runtime type" in str(error)
                              and "2026.04" in str(error), "The runtime error lacks version and recovery steps.")
                    else:
                        raise AssertionError("An unsupported interpreter bypassed the Python guard.")
                    check(not mounts, "An unsupported interpreter mounted Drive before failing.")
                check("Notebook Python: " + exact_version in output.getvalue(),
                      "Setup did not print the actual Python version.")
    check("tensorflow==2.19.0" in literal(notebook, "TRAINING_PACKAGES"),
          "The runtime fix changed the TensorFlow package contract.")


def check_security_installation(training, threshold):
    patched = {
        "pip==26.2.1", "setuptools==83.0.0", "idna==3.15", "msgpack==1.2.1",
        "requests==2.33.0", "urllib3==2.8.0", "werkzeug==3.1.9",
    }
    scientific = {
        "tensorflow==2.19.0", "keras==3.15.1", "numpy==2.1.3", "Pillow==12.3.0",
        "ImageHash==4.3.2", "scipy==1.16.3", "matplotlib==3.11.2", "scikit-learn==1.9.1",
        "pip-audit==2.10.1", "packaging==25.0", "uv==0.12.23",
    }
    check(literal(training, "TRAINING_PACKAGES") == literal(threshold, "TRAINING_PACKAGES"),
          "Training and threshold runtime selections differ.")
    converter_pins = set(literal(training, "CONVERTER_PACKAGES"))
    check(patched - {"setuptools==83.0.0"} <= converter_pins and "setuptools==81.0.0" in converter_pins,
          "Converter helper fixes or its legacy Hub compatibility boundary changed.")
    for notebook in (training, threshold):
        check(set(literal(notebook, "TRAINING_PACKAGES")) == scientific | patched,
              "The package repair changed the scientific recipe or missed a reported helper.")
        nodes = ast.parse(source_with(notebook, "TRAINING_PACKAGES = [")).body
        start = next(index for index, node in enumerate(nodes)
                     if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "TRAINING_PACKAGES")
        end = next(index for index, node in enumerate(nodes)
                   if isinstance(node, ast.If) and ast.unparse(node.test) == "installed is None")
        code = compile(ast.Module(body=nodes[start:end + 1], type_ignores=[]), str(notebook["path"]), "exec")
        # Run the real installation branch with fake subprocesses. Failures must not
        # produce a success receipt, and reruns must not reinstall imported packages.
        for exits in ([1], [0, 1], [0, 0]):
            with tempfile.TemporaryDirectory() as directory:
                setup = Path(directory)
                commands = []

                def run(command, **options):
                    commands.append(command)
                    return SimpleNamespace(returncode=exits[len(commands) - 1], stdout="fixture", stderr="")

                namespace = {
                    "Path": lambda path: setup, "json": json,
                    "os": SimpleNamespace(getpid=lambda: 321),
                    "sys": SimpleNamespace(executable="fixture-python", version="3.12.13"),
                    "subprocess": SimpleNamespace(run=run),
                }
                with redirect_stdout(io.StringIO()):
                    if exits[-1]:
                        expect_error(lambda: exec(code, namespace), RuntimeError)
                        check(not (setup / "installation.json").exists(), "A failed install wrote a success receipt.")
                    else:
                        exec(code, namespace)
                        receipt = json.loads((setup / "installation.json").read_text())
                        check(set(receipt["packages"]) == scientific | patched and receipt["restartRequired"],
                              "The installed helper versions or restart requirement were not recorded.")
                        exec(code, namespace)
                        check(len(commands) == 2, "Setup reinstalled packages while reusing a receipt.")
                        receipt["packages"] = ["outdated-plan"]
                        (setup / "installation.json").write_text(json.dumps(receipt))
                        expect_error(lambda: exec(code, namespace), RuntimeError)
                        check(len(commands) == 2, "A mismatched receipt triggered a mixed installation.")
                check(commands[0][-1] == "pip==26.2.1" and "--no-deps" in commands[0]
                      and "--only-binary=:all:" in commands[0], "The installer was not patched first from a wheel.")
                if len(commands) == 2:
                    check(set(commands[1][-len(scientific | patched):]) == scientific | patched,
                          "The main installation can retain an older vulnerable helper.")
                check((setup / "pip-bootstrap.log").is_file(), "Installer diagnostics were lost.")


def check_converter_recovery(training):
    pins = literal(training, "CONVERTER_PACKAGES")
    check("wheel==0.45.1" in pins and "packaging==23.2" in pins,
          "The TensorFlow.js-compatible wheel/packaging pair changed.")
    check("wheel==0.46.3" not in pins, "The demonstrated converter conflict remains pinned.")
    source = source_with(training, "CONVERTER_PACKAGES = [")
    check("run_id + '-' + uuid.uuid4().hex[:8]" in source,
          "Converter retries can reuse the failed subprocess environment.")
    namespace = functions(training, {"prepare_converter_evidence", "save_json_once", "read_json", "file_sha256"}, {
        "Path": Path, "json": json, "hashlib": hashlib, "datetime": datetime,
        "timezone": timezone, "uuid": uuid, "shutil": shutil, "CONVERTER_PACKAGES": pins,
    })
    prepare = namespace["prepare_converter_evidence"]
    failed_install = (
        "error: No solution found when resolving dependencies\n"
        "wheel==0.46.3 depends on packaging>=24.0; you require packaging==23.2.\n"
    )
    original = {"environment-setup.log": b"created isolated Python 3.11 environment\n",
                "package-installation.log": failed_install.encode("utf-8")}

    def failed_attempt(root):
        evidence = root / "converter_preflight"
        evidence.mkdir()
        for name, content in original.items():
            (evidence / name).write_bytes(content)
        return evidence

    with tempfile.TemporaryDirectory(prefix="mangoleaf-v450-converter-retry-") as directory:
        root = Path(directory)
        mango = root / "mango_inventory.json"
        mango.write_bytes(b"completed image inventory fixture\n")
        failed_attempt(root)
        with redirect_stdout(io.StringIO()):
            fresh = prepare(root)
        archives = list(root.glob("converter_preflight.failed-*"))
        check(len(archives) == 1, "The failed converter attempt was not preserved once.")
        check(mango.read_bytes() == b"completed image inventory fixture\n", "Retry changed a mango inventory.")
        receipt = json.loads((fresh / "retry-provenance.json").read_text())
        check(receipt["previousAttempt"] == archives[0].name and receipt["retryPackages"] == pins,
              "Retry provenance lost the previous attempt or corrected package identity.")
        check(len(receipt["preservedLogs"]) == len(original), "Retry omitted a failed setup log.")
        for name, content in original.items():
            check((archives[0] / name).read_bytes() == content, "Retry changed a failed log.")
            relative = "converter_preflight/prior_failed_attempt/" + name
            check((root / relative).read_bytes() == content, "Frozen converter evidence lost the prior failure.")
            check(receipt["preservedLogs"][relative] == {
                "sha256": hashlib.sha256(content).hexdigest(), "bytes": len(content),
            }, "The preserved failure log hash is wrong.")
        expect_error(lambda: prepare(root), RuntimeError)
        check(len(list(root.glob("converter_preflight.failed-*"))) == 1,
              "An unfinished retry was silently archived again.")

    for marker in ("converter_preflight.json", "plan.json", "frozen_inputs.json",
                   "training_started.json", "training_complete.json"):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            failed_attempt(root)
            (root / marker).write_text("{}")
            expect_error(lambda: prepare(root), RuntimeError)
            check((root / "converter_preflight/package-installation.log").read_bytes()
                  == original["package-installation.log"], "Retry moved frozen run evidence.")
            check(not list(root.glob("converter_preflight.failed-*")), "A frozen run was retried.")
    for unexpected in ("different failure", "extra evidence"):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            evidence = failed_attempt(root)
            if unexpected == "different failure":
                (evidence / "package-installation.log").write_text("network connection failed")
            else:
                (evidence / "audit.json").write_text("{}")
            expect_error(lambda: prepare(root), RuntimeError)
            check(not list(root.glob("converter_preflight.failed-*")),
                  "An unreviewed converter failure was silently archived.")
    with tempfile.TemporaryDirectory() as directory:
        check(prepare(Path(directory)).is_dir(), "A first converter attempt cannot start.")


def check_converter_operation_reviews(training):
    source = source_with(training, "known_wheel_unpack_aliases = ")
    nodes = ast.parse(source).body
    start = next(i for i, node in enumerate(nodes)
                 if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "dependencies")
    end = next(i for i, node in enumerate(nodes)
               if isinstance(node, ast.If) and ast.unparse(node.test) == "operation_reviews")
    code = compile(ast.Module(body=nodes[start:end + 1], type_ignores=[]), str(training["path"]), "exec")
    helpers = functions(training, {"save_json_once", "read_json"}, {"Path": Path, "json": json})
    wheel = {"name": "wheel", "version": "0.45.1", "vulns": [{
        "id": "CVE-2026-24049", "aliases": ["GHSA-8rrh-rw8j-w5fx"],
    }]}
    setuptools = {"name": "setuptools", "version": "81.0.0", "vulns": [{
        "id": "PYSEC-2026-3447", "aliases": ["GHSA-h35f-9h28-mq5c", "CVE-2026-59890", "BIT-setuptools-2026-59890"],
    }]}
    clean = {"name": "packaging", "version": "23.2", "vulns": []}
    unfamiliar = copy.deepcopy(wheel)
    unfamiliar["vulns"][0]["aliases"].append("unreviewed-advisory")
    other_version = {**wheel, "version": "0.44.0"}
    other_package = {**wheel, "name": "different-package"}
    cases = [
        ([clean], 0, False, 0), ([wheel], 1, False, 1), ([setuptools], 1, False, 1),
        ([wheel, setuptools], 1, False, 2), ([unfamiliar], 1, True, 0),
        ([other_version], 1, True, 0), ([other_package], 1, True, 0),
        ([clean, {"name": "missing", "skip_reason": "not collected"}], 0, True, 0),
        ([wheel], 2, True, 1), ([], 0, True, 0),
    ]
    for dependencies, returncode, blocked, reviews in cases:
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory)
            report = {"dependencies": copy.deepcopy(dependencies)}
            namespace = {**helpers, "report": report, "canonicalize_name": canonicalize_name,
                         "audit": SimpleNamespace(returncode=returncode),
                         "converter_evidence": evidence, "audit_path": evidence / "audit.json"}
            with redirect_stdout(io.StringIO()):
                if blocked:
                    expect_error(lambda: exec(code, namespace), RuntimeError)
                else:
                    exec(code, namespace)
            summary = json.loads((evidence / "audit-summary.json").read_text())
            check(summary["executionAllowed"] == (not blocked), "Converter operation boundary changed.")
            check(len(summary["operationReviews"]) == reviews, "A package/advisory review was broadened or lost.")
            check(summary["findings"] == [row for row in dependencies if row.get("vulns")],
                  "The converter removed a vulnerability from its evidence.")
            if any(row.get("vulns") for row in dependencies):
                check(summary["status"] == "unresolved", "An operation review falsely cleared a vulnerability.")


def check_dependency_audit_failures(notebook):
    source = source_with(notebook, "audit_report = json.loads(audit_path.read_text())")
    nodes = ast.parse(source).body
    start = next(index for index, node in enumerate(nodes)
                 if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "audit_report")
    end = next(index for index, node in enumerate(nodes)
               if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "provider_check")
    code = compile(ast.Module(body=nodes[start:end], type_ignores=[]), str(notebook["path"]), "exec")
    clean = [{"name": name, "version": "fixture", "vulns": []} for name in ("pip", "requests", "urllib3")]
    finding = {"id": "fixture-advisory", "fix_versions": ["patched-version"]}
    vulnerable = copy.deepcopy(clean)
    vulnerable[1]["vulns"] = [finding, finding]
    skipped = copy.deepcopy(clean)
    skipped[1]["skip_reason"] = "fixture collection failure"
    cases = [
        (clean, 0, False, None),
        (vulnerable, 1, True, "fixture-advisory (fix versions: patched-version)"),
        (vulnerable, 0, True, "Unresolved package: requests"),
        (skipped, 0, True, "Skipped package: requests"),
        (clean[:-1], 0, True, "Missing packages: ['urllib3']"),
        (clean + [{"name": "unexpected", "vulns": []}], 0, True, "Unexpected packages: ['unexpected']"),
        (clean, 2, True, "Dependency audit exit: 2"),
        ([], 0, True, "Missing packages:"),
    ]
    with tempfile.TemporaryDirectory() as directory:
        setup = Path(directory)
        audit_path = setup / "audit.json"
        for dependencies, returncode, blocked, diagnostic in cases:
            audit_path.write_text(json.dumps({"dependencies": dependencies}))
            namespace = {
                "json": json, "audit_path": audit_path, "setup_directory": setup,
                "audit": SimpleNamespace(returncode=returncode),
                "research_names": {"pip", "requests", "urllib3"},
                "canonicalize_name": lambda name: name.lower().replace("_", "-"),
            }
            with redirect_stdout(io.StringIO()) as output:
                if blocked:
                    expect_error(lambda: exec(code, namespace), RuntimeError)
                else:
                    exec(code, namespace)
            if diagnostic:
                check(diagnostic in output.getvalue(), "An audit stopped without identifying its cause.")
            if dependencies is vulnerable and returncode == 1:
                check(output.getvalue().count("fixture-advisory") == 1,
                      "Repeated advisory entries obscured the actionable audit diagnostic.")


def check_dependency_closure(notebook):
    # The provider may satisfy ordinary package bounds while missing an enabled
    # extra or retaining a conflicting dependency. Inspect the actual helper.
    distributions = {
        "research": SimpleNamespace(version="1.0", requires=[
            "cachecontrol[filecache]>=0.13", "cachecontrol[other]>=0.13",
            "cachecontrol>=0.13", "platform-only; sys_platform == 'never'",
        ]),
        "cachecontrol": SimpleNamespace(version="0.14.3", requires=[
            "requests>=2.31,<3", "filelock>=3.8; extra == 'filecache'",
            "extra-helper; extra == 'other'", "unused; extra == 'dev'",
        ]),
        "requests": SimpleNamespace(version="2.33.0", requires=["idna>=2.5,<4"]),
        "idna": SimpleNamespace(version="3.15", requires=[]),
        "filelock": SimpleNamespace(version="3.19.0", requires=[]),
        "extra-helper": SimpleNamespace(version="1.0", requires=["research>=1"]),
    }
    namespace = functions(notebook, {"installed_research_dependencies"}, {
        "importlib": SimpleNamespace(metadata=SimpleNamespace(distribution=lambda name: distributions[name])),
        "Requirement": Requirement, "canonicalize_name": canonicalize_name,
    })
    closure = namespace["installed_research_dependencies"]
    check(closure(["research==1.0"]) == set(distributions),
          "The closure missed an enabled extra, repeated context, or cycle boundary.")
    distributions["requests"].version = "3.0.0"
    expect_error(lambda: closure(["research==1.0"]), RuntimeError)
    distributions["requests"].version = "2.33.0"
    distributions.pop("filelock")
    expect_error(lambda: closure(["research==1.0"]), KeyError)


def check_inventory_preflight(notebook):
    namespace = functions(notebook, {"image_paths", "checked_inventory_paths"}, {
        "Path": Path, "IMAGE_EXTENSIONS": literal(notebook, "IMAGE_EXTENSIONS"),
        "EXPECTED_RAW_IMAGE_COUNT": 2, "EXPECTED_OOD_IMAGE_COUNT": 500,
    })
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        (root / "nested").mkdir()
        for relative in ("one.jpg", "nested/two.PNG", "nested/three.webp", "archive.zip", "notes.csv"):
            (root / relative).touch()
        (root / "directory.jpg").mkdir()
        check([path.relative_to(root).as_posix() for path in namespace["image_paths"](root)]
              == ["nested/three.webp", "nested/two.PNG", "one.jpg"],
              "Inventory candidates missed subfolders/extensions or included archives/directories.")
    calls = []
    paths = {"mango": [Path("mango") / str(i) for i in range(2)],
             "oe": [Path("oe") / str(i) for i in range(3)],
             "ood": [Path("ood") / str(i) for i in range(200)]}

    def list_paths(folder):
        calls.append(folder)
        return paths[folder]

    namespace["image_paths"] = list_paths
    source = source_with(notebook, "mango_paths, oe_paths, ood_paths = checked_inventory_paths")
    nodes = ast.parse(source).body
    start = next(index for index, node in enumerate(nodes)
                 if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call)
                 and ast.unparse(node.value.func) == "checked_inventory_paths")
    # Execute the actual Step 4 entry. The supplied 200-photo failure must stop
    # before any mango/OE listing or image decoding, rather than after an hour.
    entry = compile(ast.Module(body=nodes[start:], type_ignores=[]), str(notebook["path"]), "exec")
    namespace.update(RAW_MANGO_INPUT="mango", OE_INPUT="oe", OOD_INPUT="ood")
    namespace["image_inventory"] = lambda *args, **kwargs: check(False, "Decoding started before the OOD count gate.")
    with redirect_stdout(io.StringIO()) as output:
        expect_error(lambda: exec(entry, namespace))
    check(calls == ["ood"] and "Counting OOD image files:" in output.getvalue(),
          "An incomplete OOD pool triggered other expensive input work.")
    paths["ood"] = [Path("ood") / str(i) for i in range(500)]
    calls.clear()
    with redirect_stdout(io.StringIO()):
        result = namespace["checked_inventory_paths"]("mango", "oe", "ood")
    check(calls == ["ood", "mango", "oe"] and tuple(map(len, result)) == (2, 3, 500),
          "A complete input set lost its membership or count.")
    paths["ood"].append(Path("ood/extra"))
    with redirect_stdout(io.StringIO()):
        expect_error(lambda: namespace["checked_inventory_paths"]("mango", "oe", "ood"))
    paths["ood"].pop()
    paths["mango"].pop()
    with redirect_stdout(io.StringIO()):
        expect_error(lambda: namespace["checked_inventory_paths"]("mango", "oe", "ood"))
    paths["mango"].append(Path("mango/1"))
    paths["oe"] = []
    with redirect_stdout(io.StringIO()):
        expect_error(lambda: namespace["checked_inventory_paths"]("mango", "oe", "ood"))


def check_inventory_identity_and_progress(notebook):
    namespace = functions(notebook, {"image_paths", "file_sha256", "raw_rgb", "image_inventory", "save_json_once", "read_json"}, {
        "Path": Path, "PurePosixPath": PurePosixPath, "hashlib": hashlib, "json": json,
        "defaultdict": defaultdict, "np": np, "Image": Image, "ImageOps": ImageOps,
        "IMAGE_EXTENSIONS": literal(notebook, "IMAGE_EXTENSIONS"), "CLASS_NAMES": CLASS_NAMES,
        "time": time,
        # The fixture checks real file/decoded identities and routing, not TF resizing or pHash numerics.
        "load_pixels": lambda path: SimpleNamespace(numpy=lambda: np.zeros((224, 224, 3))),
        "imagehash": SimpleNamespace(phash=lambda image, hash_size: "fixture-phash"),
    })
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        photo = root / "one.png"
        Image.new("RGB", (2, 3), (12, 34, 56)).save(photo)
        namespace["RUN_DIR"] = root
        with redirect_stdout(io.StringIO()) as output:
            implicit = namespace["image_inventory"](root, "oe")
            explicit = namespace["image_inventory"](root, "oe", paths=[photo])
        check(implicit == explicit and len(explicit) == 1, "Preflight-listed files changed inventory identities.")
        row = explicit[0]
        check(row["sha256"] == hashlib.sha256(photo.read_bytes()).hexdigest()
              and row["id"] == row["sha256"][:20] and row["dimensions"] == [2, 3],
              "Inventory progress changed the file hash, ID, or dimensions.")
        check("images processed: 1 / 1" in output.getvalue(), "The final image progress was not printed.")
        photo.write_bytes(b"unreadable")
        with redirect_stdout(io.StringIO()):
            expect_error(lambda: namespace["image_inventory"](root, "oe"), RuntimeError)
        check((root / "oe_inventory_failures.json").is_file(), "Unreadable-image diagnostics were lost.")


def check_inventory_completion_gate(notebook):
    namespace = functions(notebook, {"require_completed_inventories", "portable_rows", "read_json"}, {"Path": Path, "json": json})
    check(source_with(notebook, "GRADCAM_NAMES = {").lstrip().startswith(
        "# A failed Step 4 must not be bypassed by clicking the next cell.\nrequire_completed_inventories()"),
        "Step 5 can bypass the failed inventory.")
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        namespace.update(RUN_DIR=root, EXPECTED_RAW_IMAGE_COUNT=2, EXPECTED_OOD_IMAGE_COUNT=500,
                         raw_rows=[{"id": "m1"}, {"id": "m2"}], oe_raw_rows=[{"id": "oe1"}],
                         held_out_ood_rows=[{"id": str(i)} for i in range(200)])
        gate = namespace["require_completed_inventories"]
        expect_error(gate, RuntimeError)
        namespace["held_out_ood_rows"] = [{"id": str(i)} for i in range(500)]
        expect_error(gate, RuntimeError)
        for filename, variable in (("mango_inventory.json", "raw_rows"), ("oe_raw_inventory.json", "oe_raw_rows"),
                                   ("held_out_ood_raw_inventory.json", "held_out_ood_rows")):
            (root / filename).write_text(json.dumps({"images": namespace[variable]}))
        gate()
        namespace["held_out_ood_rows"][0]["id"] = "changed"
        expect_error(gate, RuntimeError)


def check_documented_inventory_recovery(notebook):
    guide = (ROOT / "docs/model-training/non-experiment/v4.5.0/TRIAL_v4_5_0.md").read_text(encoding="utf-8")
    section = guide.split("### If Step 4 counted 200 OOD photos after a long scan", 1)[1].split("## Local developer verification", 1)[0]
    blocks = re.findall(r"```python\n(.*?)\n```", section, re.S)
    check(len(blocks) == 2, "The inventory recovery instructions lost their executable cell.")
    code = compile(blocks[1], "documented-inventory-recovery", "exec")
    expect_error(lambda: exec(code, {}), RuntimeError)
    namespace = functions(notebook, {"save_json_once", "read_json", "portable_rows"}, {"Path": Path, "json": json})
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        ood = root / "ood"
        ood.mkdir()
        for index in range(200):
            (ood / f"{index:03d}.jpg").touch()
        mango, oe = [{"id": "m1"}, {"id": "m2"}], [{"id": "oe1"}]
        expected_ood = [{"sha256": f"bytes-{index}", "decodedRgbSha256": f"pixels-{index}"} for index in range(500)]
        rows_to_return = copy.deepcopy(expected_ood)
        calls, previews = [], []

        def inventory(folder, pool):
            check(folder == ood and pool == "ood", "Recovery restarted the mango/OE inventory.")
            calls.append(pool)
            return copy.deepcopy(rows_to_return)

        namespace.update(
            RUN_DIR=root, OOD_INPUT=ood, raw_rows=mango, oe_raw_rows=oe,
            held_out_ood_rows=[{"id": str(index)} for index in range(200)],
            EXPECTED_RAW_IMAGE_COUNT=2, EXPECTED_OOD_IMAGE_COUNT=500,
            IMAGE_EXTENSIONS=literal(notebook, "IMAGE_EXTENSIONS"), image_inventory=inventory,
            save_contact_sheets=lambda rows, destination, title: previews.append((rows, destination)),
        )
        with redirect_stdout(io.StringIO()):
            expect_error(lambda: exec(code, namespace))
        check(not calls, "Recovery decoded OOD before its required files were uploaded.")
        for index in range(200, 500):
            (ood / f"{index:03d}.jpg").touch()
        (root / "training_started.json").write_text("{}")
        with redirect_stdout(io.StringIO()):
            expect_error(lambda: exec(code, namespace), RuntimeError)
        check(not calls, "Recovery changed inputs after training evidence existed.")
        (root / "training_started.json").unlink()
        rows_to_return[0] = rows_to_return[1]
        with redirect_stdout(io.StringIO()):
            expect_error(lambda: exec(code, namespace))
        check(not (root / "held_out_ood_raw_inventory.json").exists(), "Recovery saved exact-copy OOD evidence.")
        rows_to_return = copy.deepcopy(expected_ood)
        with redirect_stdout(io.StringIO()) as output:
            exec(code, namespace)
        check(calls == ["ood", "ood"] and namespace["raw_rows"] is mango and namespace["oe_raw_rows"] is oe,
              "The documented recovery did not preserve the completed mango/OE inventories.")
        check(json.loads((root / "held_out_ood_raw_inventory.json").read_text())["images"] == expected_ood
              and len(previews) == 1 and previews[0][0] is oe and "OOD images: 500" in output.getvalue(),
              "Recovery lost complete OOD evidence, pending previews, or its completion output.")


def check_drive_shortcuts(notebook):
    namespace = functions(notebook, {"drive_input_path", "owned_my_drive_path"}, {"Path": Path})
    check(literal(notebook, "ALLOW_SHARED_INPUT_SHORTCUTS") is False,
          "Shared input shortcuts must require an explicit selection.")
    with tempfile.TemporaryDirectory() as directory:
        mount = Path(directory).resolve()
        my_drive = mount / "MyDrive"
        owned_input = my_drive / "mango"
        owned_input.mkdir(parents=True)
        shortcut_root = mount / ".shortcut-targets-by-id"
        shared_input = shortcut_root / "shared-photo-id" / "oe"
        shared_input.mkdir(parents=True)
        foreign_input = mount / "unrelated"
        foreign_input.mkdir()
        shortcut = my_drive / "oe"
        foreign_shortcut = my_drive / "foreign"
        broken_shortcut = my_drive / "broken"
        backend_shortcut = my_drive / "backend"
        output_shortcut = my_drive / "shared-results"
        targets = {
            shortcut: shared_input,
            foreign_shortcut: foreign_input,
            broken_shortcut: shortcut_root / "missing-id" / "missing-folder",
            backend_shortcut: shortcut_root / "shared-photo-id",
            output_shortcut: shared_input,
        }
        original_resolve = Path.resolve

        def resolve(path, *args, **kwargs):
            # Model Colab's shortcut resolution without privileged Windows symlinks.
            return targets[path] if path in targets else original_resolve(path, *args, **kwargs)

        input_path = namespace["drive_input_path"]
        output_path = namespace["owned_my_drive_path"]
        with patch.object(Path, "resolve", resolve), redirect_stdout(io.StringIO()) as printed:
            check(input_path(owned_input, my_drive=my_drive) == owned_input,
                  "An ordinary My Drive input stopped working.")
            expect_error(lambda: input_path(shortcut, my_drive=my_drive))
            check(input_path(shortcut, allow_shared=True, my_drive=my_drive) == shortcut,
                  "An explicitly selected shared photo shortcut is rejected.")
            expect_error(lambda: input_path(foreign_shortcut, allow_shared=True, my_drive=my_drive))
            expect_error(lambda: input_path(foreign_input, allow_shared=True, my_drive=my_drive))
            expect_error(lambda: input_path(backend_shortcut, allow_shared=True, my_drive=my_drive))
            expect_error(lambda: input_path(broken_shortcut, allow_shared=True, my_drive=my_drive),
                         FileNotFoundError)
            expect_error(lambda: input_path(my_drive / "missing", my_drive=my_drive), FileNotFoundError)
            expect_error(lambda: input_path(my_drive, allow_shared=True, my_drive=my_drive))
            expect_error(lambda: input_path(Path("oe"), allow_shared=True, my_drive=my_drive))
            expect_error(lambda: input_path(my_drive / ".." / "unrelated", allow_shared=True, my_drive=my_drive))
            new_output = my_drive / "mangoleaf_experiments" / "v4.5.0" / "training"
            check(output_path(new_output, my_drive=my_drive) == new_output,
                  "A new output folder needs to exist before run creation.")
            expect_error(lambda: output_path(output_shortcut, my_drive=my_drive))
            expect_error(lambda: output_path(foreign_input, my_drive=my_drive))
            expect_error(lambda: output_path(my_drive, my_drive=my_drive))
        check(str(shortcut) in printed.getvalue() and str(shared_input) in printed.getvalue(),
              "The selected and resolved shared input locations are not visible.")

    if "Training_v4_5_0" in notebook["path"].name:
        source = source_with(notebook, "DRIVE_ROOT = ")
        check("drive_input_path(input_path, allow_shared=ALLOW_SHARED_INPUT_SHORTCUTS)" in source
              and "OUTPUT_ROOT = owned_my_drive_path(OUTPUT_ROOT)" in source
              and "Each input and output location must be separate." in source,
              "Training no longer checks shared inputs, owned outputs, and resolved separation together.")
    else:
        source = source_with(notebook, "TRAINING_RUN_NAME = ")
        check("OOD_ROOT = drive_input_path(OOD_ROOT, allow_shared=ALLOW_SHARED_INPUT_SHORTCUTS)" in source
              and "EXPERIMENT_ROOT = owned_my_drive_path(EXPERIMENT_ROOT)" in source
              and "TRAINING_RUN = owned_my_drive_path(" in source,
              "Threshold fitting changed the output/completed-run boundary with shared OOD support.")


def main():
    training = read_notebook("MangoLeaf_AI_Training_v4_5_0.ipynb")
    threshold = read_notebook("MangoLeaf_AI_Threshold_Fitting_v4_5_0.ipynb")
    check_runtime_preflight(training)
    check_runtime_preflight(threshold)
    check_restart_boundary(training)
    check_restart_boundary(threshold)
    check_security_installation(training, threshold)
    check_converter_recovery(training)
    check_converter_operation_reviews(training)
    check_dependency_closure(training)
    check_dependency_closure(threshold)
    check_dependency_audit_failures(training)
    check_dependency_audit_failures(threshold)
    check_inventory_preflight(training)
    check_inventory_identity_and_progress(training)
    check_inventory_completion_gate(training)
    check_documented_inventory_recovery(training)
    check_drive_shortcuts(training)
    check_drive_shortcuts(threshold)
    check(literal(threshold, "CLASS_NAMES") == CLASS_NAMES, "Threshold class order differs.")
    check(literal(threshold, "EXPECTED_OOD_IMAGES") == 500, "First-run OOD count must be 500.")
    check(literal(threshold, "TARGET_TUNING_IMAGES") == 250 and literal(threshold, "TARGET_REPORTING_IMAGES") == 250,
          "The intended OOD assignment must be 250/250.")
    check_training_boundaries(training)
    check_live_training_identity(training)
    _, report = check_threshold_math(threshold)
    check_file_boundaries(threshold)
    check_ood_review_cell(threshold)
    check_training_handoff(threshold)
    check_live_prediction_lists(threshold)
    check_charts(threshold, report)
    check_training_chart(training)
    print(f"PASS: ordinary-cell templates ({training['steps']} training / {threshold['steps']} threshold steps).")
    print("PASS: patched installer/helpers, restart boundary, and blocking audit diagnostics with failure fixtures.")
    print("PASS: converter retry preserves failed logs and frozen runs; exact unused-operation reviews retain all findings.")
    print("PASS: OOD count fails before other inventory work; image identities, progress, and decoding failures remain checked.")
    print("PASS: shared inputs require explicit permission; missing/external inputs and shared outputs remain blocked.")
    print("PASS: 62 reviewed identities, mango/OOD groups, OE accounting, training handoff, calibration/gates, artifact/selection locks, and charts.")
    print("No Colab package installation, model training, browser parity, or reliability session ran.")


if __name__ == "__main__":
    main()

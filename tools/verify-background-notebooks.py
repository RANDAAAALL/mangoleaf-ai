"""Verify Colab experiment contracts without TensorFlow or the user's datasets."""

import ast
import contextlib
import csv
import hashlib
import io
import json
import math
import os
import random
import subprocess
import sys
import tempfile
import types
import unittest
import venv
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from PIL import Image, ImageOps, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
PATHS = [
    ROOT / "notebooks/experiment/v3.1/MangoLeaf_AI_Training_v3_1.ipynb",
    ROOT / "notebooks/experiment/v3.2/MangoLeaf_AI_Threshold_Fitting_v3_2.ipynb",
]
DOCUMENTS = [json.loads(p.read_text(encoding="utf-8")) for p in PATHS]
CELLS = [{c["id"]: "".join(c["source"]) for c in d["cells"]} for d in DOCUMENTS]
CLASSES = ["anthracnose", "bacterial_black_spot", "bacterial_canker", "healthy", "mango_scab", "sooty_mold"]


def helpers():
    scope = dict(Path=Path, hashlib=hashlib, json=json, csv=csv, math=math,
                 random=random, SEED=42, CLASS_NAMES=CLASSES, Image=Image, ImageOps=ImageOps)
    for index, name in [(1, "file-helpers"), (0, "experiment-helpers"), (1, "scoring-helpers")]:
        exec(compile(CELLS[index][name], name, "exec"), scope)
    return scope


class BackgroundNotebookChecks(unittest.TestCase):
    def test_clean_notebooks_and_embedded_worker_syntax(self):
        for document in DOCUMENTS:
            self.assertEqual(document["nbformat"], 4)
            self.assertEqual(len({c["id"] for c in document["cells"]}), len(document["cells"]))
            for cell in document["cells"]:
                self.assertRegex(cell["id"], r"^[A-Za-z0-9_-]{1,64}$")
                if cell["cell_type"] == "code":
                    self.assertEqual(cell["outputs"], [])
                    self.assertIsNone(cell["execution_count"])
                    ast.parse("".join(cell["source"]), filename=cell["id"])
        worker_tree = ast.parse(CELLS[0]["generate-masks"])
        worker = next(ast.literal_eval(n.value) for n in worker_tree.body if isinstance(n, ast.Assign)
                      and any(isinstance(t, ast.Name) and t.id == "worker" for t in n.targets))
        ast.parse(worker, filename="isolated-mask-worker")

    def test_fitting_notebook_cannot_train_or_change_weights(self):
        for c in DOCUMENTS[1]["cells"]:
            if c["cell_type"] != "code":
                continue
            for node in ast.walk(ast.parse("".join(c["source"]))):
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                    self.assertNotIn(node.func.attr, {"fit", "set_weights", "train_on_batch"})

    def test_mask_bootstrap_works_without_ensurepip_and_repairs_partial_environment(self):
        # Execute the notebook's bootstrap against a real temporary environment.
        tree = ast.parse(CELLS[0]["generate-masks"].split("mask_dir = RUN_DIR")[0])
        tree.body = [node for node in tree.body if not (
            isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and
                t.id in {"MASK_ENV", "MASK_PYTHON"} for t in node.targets))]
        with tempfile.TemporaryDirectory(prefix="mangoleaf-mask-test-") as temporary:
            root = Path(temporary).resolve() / "mask-env"
            target = root / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
            scope = dict(Path=Path, MASK_ENV=root, MASK_PYTHON=target, sys=sys, subprocess=subprocess)
            failure = subprocess.CalledProcessError(1, [str(target), "-m", "ensurepip"])
            with patch.object(venv.EnvBuilder, "_setup_pip", side_effect=failure) as ensure_pip:
                for attempt in range(2):
                    with patch.object(subprocess, "run") as install:
                        exec(compile(tree, "mask-bootstrap", "exec"), scope)
                    self.assertTrue(target.is_file())
                    self.assertIn("include-system-site-packages = false", (root / "pyvenv.cfg").read_text())
                    probe = subprocess.run(
                        [str(target), "-c", "import importlib.util; print(importlib.util.find_spec('pip'))"],
                        check=True, capture_output=True, text=True)
                    self.assertEqual(probe.stdout.strip(), "None")
                    install.assert_called_once_with(
                        [sys.executable, "-m", "pip", "--python", str(target), "install", "--quiet",
                         "pip==25.2", "rembg[cpu]==2.0.67"], check=True)
                    marker = root / "existing-file.txt"
                    if attempt == 0:
                        marker.write_text("preserve existing files")
                    else:
                        self.assertEqual(marker.read_text(), "preserve existing files")
                ensure_pip.assert_not_called()

    def test_shared_method_matches_existing_threshold_workflow(self):
        original = json.loads((ROOT / "notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb").read_text(encoding="utf-8"))
        original = {c["id"]: "".join(c["source"]).strip() for c in original["cells"]}
        for name in ["file-helpers", "scoring-helpers"]:
            self.assertEqual(CELLS[1][name].strip(), original[name])
        training_helpers = {n.name: ast.dump(n) for n in ast.parse(CELLS[0]["experiment-helpers"]).body}
        for node in ast.parse(CELLS[1]["experiment-helpers"]).body:
            self.assertEqual(ast.dump(node), training_helpers[node.name])

    def make_gradcam_bundle(self, root):
        runtime = dict(tensorflow="fixture-tf", keras="fixture-keras", numpy="fixture-numpy", pillow=pillow_version)
        rows = []
        for label in reversed(CLASSES):
            path = root / (label + ".png")
            Image.new("RGB", (2, 2), (20, 60, 10)).save(path)
            rows.append(dict(subset="val", label=label, relativePath=f"{label}/image.png",
                             path=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
        manifest = root / "input_manifest.json"
        manifest.write_text(json.dumps(dict(classes=CLASSES, images=rows)), encoding="utf-8")
        digest = hashlib.sha256(manifest.read_bytes()).hexdigest()
        arms = {}
        for arm in ["control", "background"]:
            directory = root / arm
            directory.mkdir()
            model = directory / "model_calibrated.keras"
            model.write_bytes(b"Synthetic model hash fixture; not a Keras model.")
            arms[arm] = dict(trial="3.1", classes=CLASSES, inputManifestSha256=digest, runtime=runtime,
                             modelSha256=hashlib.sha256(model.read_bytes()).hexdigest(), baseLayerName="base")
            (directory / "resume_info.json").write_text(json.dumps(arms[arm]), encoding="utf-8")
        (root / "training_complete.json").write_text(
            json.dumps(dict(inputManifestSha256=digest, arms=arms)), encoding="utf-8")
        return runtime, rows

    def test_gradcam_restores_fresh_session_from_completed_bundle_without_writes(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            runtime, rows = self.make_gradcam_bundle(root)
            before = {p.relative_to(root): p.read_bytes() for p in root.rglob("*") if p.is_file()}
            google, colab = types.ModuleType("google"), types.ModuleType("google.colab")
            mounts, policies = [], []
            colab.drive = types.SimpleNamespace(mount=mounts.append)
            google.colab = colab
            numpy, tensorflow = types.ModuleType("numpy"), types.ModuleType("tensorflow")
            numpy.__version__ = runtime["numpy"]
            tensorflow.__version__ = runtime["tensorflow"]
            tensorflow.keras = types.SimpleNamespace(__version__=runtime["keras"],
                mixed_precision=types.SimpleNamespace(set_global_policy=policies.append))
            modules = {"google": google, "google.colab": colab, "numpy": numpy, "tensorflow": tensorflow}
            source = CELLS[0]["gradcam-restore"].replace("GRADCAM_RUN = ''", f"GRADCAM_RUN = {str(root)!r}")
            scope = {}
            with patch.dict(sys.modules, modules), contextlib.redirect_stdout(io.StringIO()):
                exec(compile(source, "gradcam-restore", "exec"), scope)
                # Repeat restoration in the same runtime without changing saved evidence.
                exec(compile(CELLS[0]["gradcam-restore"], "gradcam-restore", "exec"), scope)
            self.assertEqual(scope["CLASS_NAMES"], CLASSES)
            self.assertEqual(scope["IMAGE_SIZE"], (224, 224))
            self.assertEqual(scope["RUN_DIR"], root)
            self.assertEqual(scope["groups"]["val"], sorted(rows, key=lambda r: r["relativePath"]))
            self.assertEqual(set(scope["arm_results"]), {"control", "background"})
            self.assertTrue(callable(scope["load_pixels"]))
            self.assertEqual(policies, ["float32", "float32"])
            self.assertEqual(mounts, ["/content/drive", "/content/drive"])
            self.assertEqual(before, {p.relative_to(root): p.read_bytes() for p in root.rglob("*") if p.is_file()})

    def test_gradcam_rejects_incomplete_changed_and_incompatible_bundles(self):
        function = next(n for n in ast.parse(CELLS[0]["gradcam-restore"]).body
                        if isinstance(n, ast.FunctionDef) and n.name == "restore_gradcam_inputs")
        scope = dict(Path=Path, hashlib=hashlib, json=json)
        exec(compile(ast.Module(body=[function], type_ignores=[]), "restore-gradcam", "exec"), scope)
        restore = scope["restore_gradcam_inputs"]
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            runtime, rows = self.make_gradcam_bundle(root)
            with self.assertRaisesRegex(FileNotFoundError, "No completed training bundle"):
                restore(root / "unfinished", runtime)
            with self.assertRaisesRegex(RuntimeError, "use training version"):
                restore(root, {**runtime, "tensorflow": "changed"})
            for relative, message in [
                ("input_manifest.json", "manifest changed"),
                ("control/model_calibrated.keras", "model changed"),
                (Path(rows[0]["path"]).relative_to(root), "Validation image changed"),
            ]:
                path = root / relative
                original = path.read_bytes()
                path.write_bytes(b"changed fixture")
                with self.assertRaisesRegex(RuntimeError, message):
                    restore(root, runtime)
                path.write_bytes(original)
            info_path = root / "background/resume_info.json"
            info = json.loads(info_path.read_text())
            info["classes"] = list(reversed(CLASSES))
            info_path.write_text(json.dumps(info), encoding="utf-8")
            with self.assertRaisesRegex(RuntimeError, "metadata does not match"):
                restore(root, runtime)

    def test_gradcam_preserves_training_preprocessing_and_explains_missing_state(self):
        def pixel_loader(cell):
            return next(ast.dump(n) for n in ast.parse(CELLS[0][cell]).body
                        if isinstance(n, ast.FunctionDef) and n.name == "load_pixels")
        self.assertEqual(pixel_loader("training-helpers"), pixel_loader("gradcam-restore"))
        # Run the plotting preflight in an empty runtime without importing Matplotlib.
        preflight = CELLS[0]["gradcam"].split("picked =")[0].replace("import matplotlib.pyplot as plt\n", "")
        with self.assertRaisesRegex(RuntimeError, "Run the Grad-CAM restoration cell"):
            exec(compile(preflight, "gradcam-preflight", "exec"), {})
        for cell in ["gradcam-restore", "gradcam"]:
            for node in ast.walk(ast.parse(CELLS[0][cell])):
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                    self.assertNotIn(node.func.attr, {"fit", "set_weights", "train_on_batch"})

    def test_output_must_not_overlap_inputs(self):
        check = helpers()["disjoint_output"]
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for output in [root / "data", root / "data/results", root]:
                with self.assertRaises(ValueError):
                    check(output, [root / "data"])
            check(root / "results", [root / "data"])

    def test_composite_preserves_foreground_and_original_objects(self):
        foreground = Image.new("RGB", (2, 1), (10, 100, 20))
        background = Image.new("RGB", (2, 1), (120, 40, 200))
        mask = Image.new("L", (2, 1))
        mask.putdata([255, 0])
        before = (foreground.tobytes(), background.tobytes(), mask.tobytes())
        result = helpers()["preview_composite"](foreground, mask, background)
        self.assertEqual(result.getpixel((0, 0)), (10, 100, 20))
        self.assertEqual(result.getpixel((1, 0)), (120, 40, 200))
        self.assertEqual(before, (foreground.tobytes(), background.tobytes(), mask.tobytes()))

    def test_mask_review_requires_review_and_detects_changes(self):
        scope = helpers()
        with tempfile.TemporaryDirectory() as temporary:
            mask = Path(temporary) / "mask.png"
            Image.new("L", (2, 2), 255).save(mask)
            rows = [{"id": "keep", "maskPath": str(mask), "maskSha256": scope["sha256_file"](mask), "areaUsable": True},
                    {"id": "bad", "maskPath": str(mask), "maskSha256": scope["sha256_file"](mask), "areaUsable": False}]
            with self.assertRaisesRegex(ValueError, "Review every"):
                scope["review_masks"](rows, [], False)
            with self.assertRaisesRegex(ValueError, "Unknown"):
                scope["review_masks"](rows, ["typo"], True)
            result = scope["review_masks"](rows, [], True)
            self.assertEqual([r["useForBlend"] for r in result], [True, False])
            with self.assertRaisesRegex(ValueError, "No approved"):
                scope["review_masks"](rows, ["keep"], True)
            mask.write_bytes(b"changed mask")
            with self.assertRaisesRegex(ValueError, "changed after previews"):
                scope["review_masks"](rows, [], True)

    def test_background_sampling_repeats_without_changing_global_random_state(self):
        choose = helpers()["choose_background"]
        before = random.getstate()
        first = [choose("leaf", epoch, ["soil", "wall", "grass"], 0.5) for epoch in range(40)]
        second = [choose("leaf", epoch, ["soil", "wall", "grass"], 0.5) for epoch in range(40)]
        self.assertEqual(first, second)
        self.assertEqual(before, random.getstate())
        self.assertIn(None, first)
        self.assertGreater(len(set(first)), 2)
        self.assertIsNone(choose("leaf", 1, ["soil"], 0))
        self.assertEqual(choose("leaf", 1, ["soil"], 1), "soil")

    def test_training_snapshot_rejects_changed_images_labels_and_membership(self):
        check = helpers()["verify_bundle_inputs"]
        rows = [{"subset": "val", "relativePath": "healthy/a.png", "label": "healthy", "sha256": "original"}]
        check({"images": rows}, rows)
        for key in ["sha256", "label", "relativePath", "subset"]:
            changed = [{**rows[0], key: "changed"}]
            with self.assertRaises(ValueError):
                check({"images": rows}, changed)
        with self.assertRaises(ValueError):
            check({"images": rows}, [])

    def test_raw_classification_counts_errors_even_if_thresholds_reject_them(self):
        metrics = helpers()["classification_metrics"]([
            {"label": "healthy", "predictedIndex": 3, "accepted": True},
            {"label": "healthy", "predictedIndex": 4, "accepted": False},
            {"label": "mango_scab", "predictedIndex": 4, "accepted": True},
        ])
        self.assertAlmostEqual(metrics["accuracy"], 2 / 3)
        self.assertEqual(metrics["perClass"]["healthy"]["recall"], 0.5)
        self.assertEqual(metrics["perClass"]["mango_scab"]["precision"], 0.5)
        self.assertEqual(metrics["confusion"]["counts"][3][4], 1)

    def run_pipeline(self, root, report_confident, infeasible=False):
        scope = helpers()
        root.mkdir()
        output = root / "output"
        output.mkdir()
        groups = {}
        for subset, labels in {"val": ["anthracnose"] * 3, "ood_tune": ["OOD"] * 2,
                               "test": ["anthracnose", "healthy"], "ood_report": ["OOD"]}.items():
            groups[subset] = []
            for index, label in enumerate(labels):
                path = root / f"{subset}-{index}.fixture"
                path.write_text(path.name)
                groups[subset].append(dict(subset=subset, label=label, path=str(path),
                    relativePath=f"{subset}-{index}", sha256=scope["sha256_file"](path)))
        all_records = sum(groups.values(), [])
        manifest = output / "input_manifest.json"
        scope["write_json_once"](manifest, {"images": all_records})
        high = [0.92, 0.016, 0.016, 0.016, 0.016, 0.016]
        uniform = [1 / 6] * 6
        calls = []

        def predict(arm, rows):
            subset = rows[0]["subset"]
            calls.append((arm, subset))
            if subset in {"test", "ood_report"}:
                saved = json.loads((output / "selected_thresholds.json").read_text())
                self.assertEqual(set(saved["arms"]), {"control", "background"})
            if subset == "val":
                return [uniform if infeasible and arm == "background" else high] * len(rows)
            if subset == "ood_tune":
                return [uniform] * len(rows)
            if subset == "test":
                return [high] * len(rows)
            return [high if report_confident else uniform] * len(rows)

        infos = {arm: {"modelSha256": arm, "infoSha256": arm + "-info", "modelVersion": "model-v3.1.0",
                       "temperature": 1.0} for arm in ["control", "background"]}
        scope.update(RUN_DIR=output, TRAINING_RUN=root, ARMS=["control", "background"], model_infos=infos,
            val_records=groups["val"], tune_records=groups["ood_tune"], test_records=groups["test"],
            report_records=groups["ood_report"], all_records=all_records, MANIFEST_PATH=manifest,
            MANIFEST_SHA256=scope["sha256_file"](manifest), GRID=[0, 0.4, 1.0], CONFIDENCE_THRESHOLD=0.7,
            MIN_ID_RETENTION=0.95, CONFIDENCE_ONLY=dict(confidenceThreshold=0.7, marginThreshold=0, entropyThreshold=1),
            load_arm=lambda arm: arm, predict_records=predict, RUNTIME={}, datetime=datetime, timezone=timezone,
            EVALUATION_STATUS="previously_used", EVALUATION_NOTES="Synthetic test only.", zipfile=zipfile)
        google, colab = types.ModuleType("google"), types.ModuleType("google.colab")
        downloads = []
        colab.files = types.SimpleNamespace(download=downloads.append)
        google.colab = colab
        with contextlib.redirect_stdout(io.StringIO()), patch.dict(sys.modules, {"google": google, "google.colab": colab}):
            exec(compile(CELLS[1]["fit-and-freeze"], "fit-and-freeze", "exec"), scope)
            self.assertEqual(calls, [(a, s) for a in ["control", "background"] for s in ["val", "ood_tune"]])
            selection = scope["SELECTION_PATH"].read_bytes()
            exec(compile(CELLS[1]["evaluate"], "evaluate", "exec"), scope)
            self.assertEqual(selection, scope["SELECTION_PATH"].read_bytes())
            exec(compile(CELLS[1]["export"], "export", "exec"), scope)
        with zipfile.ZipFile(downloads[0]) as archive:
            self.assertIn("REPORT.md", archive.namelist())
            self.assertIn("control/model_config.json", archive.namelist())
            self.assertEqual("background/model_config.json" in archive.namelist(), not infeasible)
            self.assertFalse(any(n.endswith(".fixture") for n in archive.namelist()))
        self.assertIn("\n| Arm |", (output / "REPORT.md").read_text(encoding="utf-8"))
        return json.loads(selection)["arms"], json.loads((output / "evaluation.json").read_text())

    def test_both_selections_freeze_before_evaluation_and_results_cannot_retune(self):
        with tempfile.TemporaryDirectory() as temporary:
            first, first_report = self.run_pipeline(Path(temporary) / "first", True)
            second, second_report = self.run_pipeline(Path(temporary) / "second", False)
            self.assertEqual(first, second)
            self.assertEqual(first_report["arms"]["background"]["candidate"]["oodReport"]["falseAcceptRate"], 1)
            self.assertEqual(second_report["arms"]["background"]["candidate"]["oodReport"]["falseAcceptRate"], 0)

    def test_infeasible_arm_records_failure_without_exporting_candidate(self):
        with tempfile.TemporaryDirectory() as temporary:
            selected, report = self.run_pipeline(Path(temporary) / "infeasible", True, infeasible=True)
            self.assertEqual(selected["background"]["status"], "infeasible")
            self.assertIsNone(selected["background"]["thresholds"])
            self.assertNotIn("candidate", report["arms"]["background"])
            self.assertIn("confidenceOnly", report["arms"]["background"])


if __name__ == "__main__":
    unittest.main(verbosity=2)

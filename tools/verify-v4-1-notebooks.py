"""Check V4.1 notebook contracts with small local fixtures; no model training."""

import ast
import hashlib
import json
import math
import random
import sys
import tempfile
import unittest
import uuid
import warnings
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import nbformat
import numpy as np
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "notebooks/experiment/v4.1"
TRAIN_PATH = FOLDER / "MangoLeaf_AI_Training_v4_1.ipynb"
FIT_PATH = FOLDER / "MangoLeaf_AI_Threshold_Fitting_v4_1.ipynb"
V4_PATH = ROOT / "notebooks/experiment/v4/MangoLeaf_AI_Training_v4.ipynb"
CLASSES = ["anthracnose", "bacterial_black_spot", "bacterial_canker", "healthy_fruit",
           "healthy_leaf", "mango_scab", "sooty_mold"]


def source(document, index):
    return "".join(document["cells"][index]["source"])


def functions(text, names, scope):
    """Load selected pure notebook helpers without running their Colab setup cells."""
    nodes = [node for node in ast.parse(text).body
             if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names]
    if {node.name for node in nodes} != set(names):
        raise AssertionError("Notebook helper missing: " + repr(set(names) - {n.name for n in nodes}))
    exec(compile(ast.Module(body=nodes, type_ignores=[]), "notebook-functions", "exec"), scope)
    return scope


def constants(text):
    result = {}
    for node in ast.parse(text).body:
        if not isinstance(node, ast.Assign):
            continue
        try:
            value = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            continue
        for target in node.targets:
            if isinstance(target, ast.Name):
                result[target.id] = value
            elif isinstance(target, ast.Tuple):
                result.update((part.id, item) for part, item in zip(target.elts, value))
    return result


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class V41NotebookChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw_train = json.loads(TRAIN_PATH.read_text(encoding="utf-8"))
        cls.raw_fit = json.loads(FIT_PATH.read_text(encoding="utf-8"))
        cls.raw_v4 = json.loads(V4_PATH.read_text(encoding="utf-8"))

    def test_clean_notebooks_and_python_syntax(self):
        for path, raw in ((TRAIN_PATH, self.raw_train), (FIT_PATH, self.raw_fit)):
            ids = [cell.get("id") for cell in raw["cells"]]
            self.assertTrue(all(ids), f"Missing stable cell ID in {path}")
            self.assertEqual(len(ids), len(set(ids)), f"Repeated cell ID in {path}")
            with warnings.catch_warnings():
                warnings.simplefilter("error")
                notebook = nbformat.read(path, as_version=4)
                nbformat.validate(notebook)
            for cell in notebook.cells:
                if cell.cell_type == "code":
                    compile(cell.source, cell.id, "exec")
                    self.assertIsNone(cell.execution_count)
                    self.assertEqual(cell.outputs, [])

    def test_same_seven_class_split_and_base_recipe(self):
        train = constants(source(self.raw_train, 2))
        old_setup = next("".join(cell["source"]) for cell in self.raw_v4["cells"]
                         if cell["cell_type"] == "code" and "SEED = 42" in "".join(cell["source"]))
        old = constants(old_setup)
        for key in ("CLASS_NAMES", "SEED", "IMAGE_SIZE", "BATCH_SIZE", "STAGE1_EPOCHS",
                    "STAGE1_LR", "STAGE2_EPOCHS", "STAGE2_LR", "PHASH_DISTANCE"):
            self.assertEqual(train[key], old[key], key)
        self.assertEqual(train["CLASS_NAMES"], CLASSES)
        self.assertEqual(tuple(train["ARMS"]), ("control", "background", "lighting", "combined"))
        self.assertEqual(source(self.raw_train, 4), source(self.raw_v4, 5))
        self.assertEqual(source(self.raw_train, 5), source(self.raw_v4, 6))
        self.assertIn("EXPECTED_RAW_IDENTITY", source(self.raw_train, 8))
        self.assertIn("EXPECTED_BASELINE_IDENTITY", source(self.raw_train, 8))
        self.assertIn("'train': 1819, 'val': 391, 'test': 393", source(self.raw_train, 8))
        all_training = "\n".join("".join(cell["source"]) for cell in self.raw_train["cells"]
                                 if cell["cell_type"] == "code")
        self.assertIn("initial_digest != digest", all_training)

    def test_training_and_fitting_decode_images_the_same_way(self):
        train_helper = source(self.raw_train, 3)
        fit_helper = source(self.raw_fit, 3)
        self.assertEqual(ast.dump(ast.parse(train_helper)), ast.dump(ast.parse(fit_helper)))
        self.assertEqual(constants(source(self.raw_train, 2))["PREPROCESSING"],
                         constants(source(self.raw_fit, 2))["PREPROCESSING"])

    def test_white_background_review_uses_all_training_photos(self):
        training = source(self.raw_train, 10) + source(self.raw_train, 11)
        self.assertIn("for offset, row in enumerate(train_records[start:start + 36])", training)
        self.assertIn("WHITE_REVIEW_COMPLETE = False", training)
        self.assertIn("eligibleRelativePaths", training)
        scope = {"hashlib": hashlib, "np": np, "Image": Image}
        functions(source(self.raw_train, 10), ["white_border_score"], scope)
        with tempfile.TemporaryDirectory() as directory:
            pale = Path(directory) / "pale.png"
            field = Path(directory) / "field.png"
            Image.new("RGB", (64, 64), (250, 250, 250)).save(pale)
            Image.new("RGB", (64, 64), (20, 120, 30)).save(field)
            self.assertGreater(scope["white_border_score"](pale), 0.95)
            self.assertLess(scope["white_border_score"](field), 0.05)

    def test_local_light_is_repeatable_bounded_and_local(self):
        setup = constants(source(self.raw_train, 2))
        scope = {"random": random, "np": np, "SEED": setup["SEED"],
                 "IMAGE_SIZE": tuple(setup["IMAGE_SIZE"]), "stable_seed":
                 lambda *items: int.from_bytes(hashlib.sha256("|".join(map(str, items)).encode()).digest()[:8], "big"),
                 "LOCAL_LIGHT_PROBABILITY": 0.3, "LIGHT_AMPLITUDE": (18.0, 40.0),
                 "LIGHT_RADIUS": (0.18, 0.35)}
        functions(source(self.raw_train, 17), ["add_local_light"], scope)
        original = np.full((224, 224, 3), 120, dtype=np.float32)
        bright = scope["add_local_light"](original, "same-photo", 1, force=1)
        shadow = scope["add_local_light"](original, "same-photo", 1, force=-1)
        np.testing.assert_array_equal(bright, scope["add_local_light"](original, "same-photo", 1, force=1))
        self.assertGreater(float(bright.max()), 130)
        self.assertLess(float(shadow.min()), 110)
        self.assertGreater(float(bright.max() - bright.min()), 10)
        self.assertTrue(np.all((bright >= 0) & (bright <= 255)))
        self.assertTrue(np.all(original == 120))

    def test_mask_fallback_and_four_training_arms(self):
        scope = {"np": np, "Image": Image, "ImageOps": ImageOps, "IMAGE_SIZE": (224, 224),
                 "CLASS_NAMES": CLASSES, "sha256_file": digest,
                 "load_pixels": lambda path: type("Array", (), {"numpy": lambda self: np.full(
                     (224, 224, 3), (100, 0, 0), dtype=np.float32)})(),
                 "add_local_light": lambda pixels, key, epoch: pixels + 5}
        functions(source(self.raw_train, 21), ["load_training_sample"], scope)
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            scene = directory / "scene.png"
            mask = directory / "mask.png"
            Image.new("RGB", (224, 224), (0, 0, 100)).save(scene)
            alpha = np.zeros((224, 224), dtype=np.uint8)
            alpha[:, :112] = 255
            Image.fromarray(alpha, "L").save(mask)
            key = "train/healthy_leaf/leaf.png"
            row = {"path": str(directory / "unused.png"), "relativePath": key,
                   "label": "healthy_leaf"}
            scope["approved_masks"] = {key: {"maskPath": str(mask), "maskSha256": digest(mask), "id": "mask-1"}}
            scope["choose_background"] = lambda key, epoch: {"path": str(scene), "sha256": digest(scene)}
            scope["background_schedule_lookup"] = {(0, key): digest(scene)}
            results = {arm: scope["load_training_sample"](row, arm, 0)[0]
                       for arm in ("control", "background", "lighting", "combined")}
            self.assertEqual(float(results["control"][0, 0, 0]), 100)
            self.assertEqual(float(results["control"][0, -1, 2]), 0)
            self.assertEqual(float(results["background"][0, 0, 0]), 100)
            self.assertEqual(float(results["background"][0, -1, 2]), 100)
            self.assertEqual(float(results["lighting"][0, -1, 0]), 105)
            self.assertEqual(float(results["combined"][0, -1, 2]), 105)
            scope["approved_masks"] = {}
            fallback = scope["load_training_sample"](row, "background", 0)[0]
            np.testing.assert_array_equal(fallback, results["control"])

    def test_training_does_not_predict_on_test_or_ood(self):
        train_code = "\n".join(source(self.raw_train, i) for i, c in enumerate(self.raw_train["cells"])
                               if c["cell_type"] == "code")
        self.assertIn("predict_records(model, val_rows)", train_code)
        self.assertNotIn("predict_records(model, test_rows)", train_code)
        self.assertNotIn("predict_records(model, old_report_rows)", train_code)
        self.assertNotIn("predict_records(model, new_report_rows)", train_code)
        self.assertIn("if arm is None:", source(self.raw_train, 21))
        self.assertIn("yield load_pixels(row['path'])", source(self.raw_train, 21))

    def test_export_helper_reaches_converter_without_local_import_error(self):
        # Stop before pip or TensorFlow.js runs. This catches a local import that shadows
        # subprocess or sys after the helper has already tried to use them.
        class StopBeforeInstall(Exception):
            pass

        calls = []
        fake_model = SimpleNamespace(export=lambda path, verbose=False: calls.append(("export", path)))

        def stop_before_install(command, check):
            calls.append(("pip", command))
            raise StopBeforeInstall

        scope = {
            "Path": Path, "datetime": datetime, "timezone": timezone, "uuid": uuid,
            "tf": SimpleNamespace(keras=SimpleNamespace(models=SimpleNamespace(
                load_model=lambda *args, **kwargs: fake_model))),
            "subprocess": SimpleNamespace(run=stop_before_install), "sys": sys,
        }
        functions(source(self.raw_train, 29), ["convert_one_arm"], scope)
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(StopBeforeInstall):
                scope["convert_one_arm"](Path(directory))
        self.assertEqual([kind for kind, _ in calls], ["export", "pip"])

    def test_old_ood_tunes_and_new_ood_reports_only(self):
        fit = constants(source(self.raw_fit, 2))
        self.assertEqual(fit["ARMS"], ["control", "background", "lighting", "combined"])
        self.assertEqual(fit["CLASS_NAMES"], CLASSES)
        scope = {"Path": Path, "np": np, "SEED": 42,
                 "reviewed_paths": lambda root: sorted(Path(root).rglob("*.png")),
                 "image_record": lambda root, path, subset: {
                     "subset": subset, "relativePath": path.relative_to(root).as_posix(), "path": str(path)}}
        functions(source(self.raw_fit, 6), ["prepare_old_ood", "prepare_new_ood"], scope)
        with tempfile.TemporaryDirectory() as directory:
            old = Path(directory) / "old"
            new = Path(directory) / "new"
            old.mkdir()
            new.mkdir()
            for i in range(6):
                Image.new("RGB", (8, 8), (i * 20, 0, 0)).save(old / f"old-{i}.png")
            for i in range(3):
                Image.new("RGB", (8, 8), (0, i * 20, 0)).save(new / f"new-{i}.png")
            old_rows, method = scope["prepare_old_ood"](old, [])
            self.assertEqual(len([r for r in old_rows if r["subset"] == "ood_tune"]), 3)
            self.assertEqual(len([r for r in old_rows if r["subset"] == "ood_report"]), 3)
            self.assertEqual(old_rows, scope["prepare_old_ood"](old, [])[0])
            self.assertIn("historical V4", method)
            new_rows, all_paths = scope["prepare_new_ood"](new, [])
            self.assertEqual(len(new_rows), len(all_paths))
            self.assertEqual({r["subset"] for r in new_rows}, {"ood_new_report"})

    def test_threshold_math_and_infeasible_retention(self):
        scope = {"math": math, "CLASS_NAMES": CLASSES}
        functions(source(self.raw_fit, 5),
                  ["probability_stats", "accepted", "select_thresholds", "scored_rows", "summarize"], scope)
        uniform = scope["probability_stats"]([[1 / 7] * 7])[0]
        self.assertAlmostEqual(uniform["entropy"], 1)
        val = [{"confidence": 0.9, "margin": 0.6, "entropy": 0.2},
               {"confidence": 0.75, "margin": 0.3, "entropy": 0.5}]
        ood = [{"confidence": 0.75, "margin": 0.1, "entropy": 0.8}]
        chosen, _ = scope["select_thresholds"](val, ood, [0, 0.2, 0.5, 0.8, 1], 0.7, 1)
        self.assertIsNotNone(chosen)
        self.assertTrue(all(scope["accepted"](row, chosen) for row in val))
        self.assertFalse(scope["accepted"](ood[0], chosen))
        impossible, _ = scope["select_thresholds"](
            val + [{"confidence": 0.6, "margin": 0.5, "entropy": 0.2}], ood,
            [0, 0.5, 1], 0.7, 1)
        self.assertIsNone(impossible)
        wrong = scope["probability_stats"]([[0.8, 0.2, 0, 0, 0, 0, 0]])[0]
        rows = scope["scored_rows"]([{"label": "mango_scab"}], [wrong],
                                    {"confidenceThreshold": 0.7, "marginThreshold": 0,
                                     "entropyThreshold": 1})
        report = scope["summarize"](rows)
        self.assertEqual(report["acceptedWrong"], 1)
        self.assertEqual(report["acceptedCorrect"], 0)

    def test_all_four_selections_freeze_before_any_report_prediction(self):
        fit_code = [source(self.raw_fit, i) for i, c in enumerate(self.raw_fit["cells"])
                    if c["cell_type"] == "code"]
        selection_cell = next(i for i, code in enumerate(fit_code)
                              if "write_json_once(SELECTION_PATH, selection)" in code)
        evaluation_cell = next(i for i, code in enumerate(fit_code)
                               if "predict_records(model, test_records)" in code)
        self.assertLess(selection_cell, evaluation_cell)
        for code in fit_code[:evaluation_cell]:
            self.assertNotIn("predict_records(model, test_records)", code)
            self.assertNotIn("predict_records(model, old_report_records)", code)
            self.assertNotIn("predict_records(model, new_report_records)", code)
        self.assertIn("for arm in ARMS:", fit_code[selection_cell])
        self.assertIn("tune_probabilities = predict_records(model, tune_records)", fit_code[selection_cell])
        self.assertIn("read_frozen_selection(SELECTION_PATH, SELECTION_SHA256)", fit_code[evaluation_cell])
        self.assertIn("evaluation_started.json", fit_code[evaluation_cell])
        self.assertIn("newOodUsedForFitting", fit_code[selection_cell])
        self.assertNotIn("model.fit(", "\n".join(fit_code))


if __name__ == "__main__":
    unittest.main(verbosity=2)

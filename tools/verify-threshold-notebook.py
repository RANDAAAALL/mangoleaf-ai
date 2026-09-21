"""Check notebook logic without TensorFlow, Drive, or the real model/images."""

import ast
import contextlib
import csv
import hashlib
import io
import json
import math
import sys
import tempfile
import types
import unittest
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK = ROOT / "notebooks/experiment/v3.1/MangoLeaf_AI_Threshold_Fitting_v3_1.ipynb"
DOCUMENT = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
CELLS = {cell["id"]: "".join(cell["source"]) for cell in DOCUMENT["cells"]}
SETUP = ast.parse(CELLS["setup"])
CLASSES = next(
    ast.literal_eval(node.value)
    for node in SETUP.body
    if isinstance(node, ast.Assign)
    and any(isinstance(target, ast.Name) and target.id == "CLASS_NAMES" for target in node.targets)
)


def helpers():
    namespace = dict(math=math, csv=csv, hashlib=hashlib, json=json, Path=Path, CLASS_NAMES=CLASSES)
    exec(compile(CELLS["file-helpers"], "file-helpers", "exec"), namespace)
    exec(compile(CELLS["scoring-helpers"], "scoring-helpers", "exec"), namespace)
    return namespace


class NotebookChecks(unittest.TestCase):
    def test_clean_notebook_and_python_syntax(self):
        self.assertEqual(DOCUMENT["nbformat"], 4)
        self.assertEqual(len(CELLS), len(DOCUMENT["cells"]))
        for cell in DOCUMENT["cells"]:
            self.assertRegex(cell["id"], r"^[A-Za-z0-9_-]{1,64}$")
            if cell["cell_type"] == "code":
                self.assertIsNone(cell["execution_count"])
                self.assertEqual(cell["outputs"], [])
                tree = ast.parse("".join(cell["source"]))
                for node in ast.walk(tree):
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                        self.assertNotIn(node.func.attr, {"fit", "set_weights", "train_on_batch"})

    def test_probabilities_and_confidence_boundaries(self):
        scope = helpers()
        stats = scope["probability_stats"]([[0.7, 0.2, 0.1, 0, 0, 0], [1 / 6] * 6])
        thresholds = dict(confidenceThreshold=0.7, marginThreshold=0.4, entropyThreshold=1.0)
        self.assertTrue(scope["accepted"](stats[0], thresholds))
        self.assertFalse(scope["accepted"](stats[1], thresholds))
        self.assertAlmostEqual(stats[1]["entropy"], 1.0)
        below = scope["probability_stats"]([[0.699, 0.201, 0.1, 0, 0, 0]])[0]
        self.assertFalse(scope["accepted"](below, thresholds))
        for invalid in [[float("nan")] * 6, [0.2] * 6, [1, 0], [-0.1, 1.1, 0, 0, 0, 0]]:
            with self.assertRaises(ValueError):
                scope["probability_stats"]([invalid])

    def test_selection_objective_ties_and_infeasible_floor(self):
        scope = helpers()
        score = scope["probability_stats"]
        val = score([[0.92, 0.016, 0.016, 0.016, 0.016, 0.016]] * 20)
        ood = score([[1 / 6] * 6, [0.8, 0.04, 0.04, 0.04, 0.04, 0.04]])
        grid = [i / 100 for i in range(101)]
        selected, rows = scope["select_thresholds"](val, ood, grid, 0.7, 0.95)
        self.assertEqual(sum(scope["accepted"](s, selected) for s in val), 20)
        self.assertEqual(sum(scope["accepted"](s, selected) for s in ood), 0)
        self.assertEqual(selected["marginThreshold"], 0.0)
        reversed_selection, _ = scope["select_thresholds"](val, ood, grid[::-1], 0.7, 0.95)
        self.assertEqual(selected, reversed_selection)
        self.assertEqual(len(rows), 10201)
        with self.assertRaisesRegex(ValueError, "No grid pair"):
            scope["select_thresholds"](score([[1 / 6] * 6]), ood, grid, 0.7, 0.95)

    def test_rejections_are_separate_from_wrong_diagnoses(self):
        scope = helpers()
        records = [{"label": "anthracnose"}, {"label": "healthy"}, {"label": "healthy"}]
        stats = scope["probability_stats"]([[0.9, 0.02, 0.02, 0.02, 0.02, 0.02]] * 2 + [[1 / 6] * 6])
        thresholds = dict(confidenceThreshold=0.7, marginThreshold=0.4, entropyThreshold=0.4)
        report = scope["summarize"](scope["scored_rows"](records, stats, thresholds))
        self.assertEqual((report["acceptedCorrect"], report["acceptedWrong"], report["rejected"]), (1, 1, 1))
        self.assertEqual(report["acceptedAccuracy"], 0.5)
        self.assertEqual(report["confusion"]["counts"][3][6], 1)
        rejected = scope["scored_rows"]([records[0]], [stats[2]], thresholds)
        self.assertIsNone(scope["summarize"](rejected)["acceptedAccuracy"])

    def test_saved_selection_and_images_detect_changes(self):
        scope = helpers()
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "selection.json"
            scope["write_json_once"](target, {"thresholds": {"margin": 0.4}})
            digest = scope["sha256_file"](target)
            self.assertIn("thresholds", scope["read_frozen_selection"](target, digest))
            with self.assertRaises(FileExistsError):
                scope["write_json_once"](target, {})
            target.write_text("{}", encoding="utf-8")
            with self.assertRaises(RuntimeError):
                scope["read_frozen_selection"](target, digest)
            with self.assertRaises(RuntimeError):
                scope["verify_records_unchanged"]([{"path": str(target), "sha256": digest}])

    def run_synthetic_pipeline(self, directory, final_ood_confident):
        scope = helpers()
        run = Path(directory)
        run.mkdir()
        groups = {}
        for subset, labels in {"val": ["anthracnose"] * 3, "ood_tune": ["OOD"] * 2,
                               "test": ["anthracnose", "healthy", "healthy"], "ood_report": ["OOD"]}.items():
            groups[subset] = []
            for index, label in enumerate(labels):
                source = run / f"{subset}-{index}.fixture"
                source.write_text(source.name, encoding="utf-8")
                groups[subset].append(dict(subset=subset, label=label, path=str(source),
                                          relativePath=source.name, sha256=scope["sha256_file"](source)))
        # The notebook output folder contains only output files, never source fixtures.
        output = run / "results"
        output.mkdir()
        manifest = output / "input_manifest.json"
        scope["write_json_once"](manifest, {"images": sum(groups.values(), [])})
        model = run / "model.fixture"
        model.write_bytes(b"synthetic model identity")
        info = run / "info.json"
        info.write_text("{}", encoding="utf-8")
        high = [0.92, 0.016, 0.016, 0.016, 0.016, 0.016]
        uniform = [1 / 6] * 6
        predictions = {"val": [high] * 3, "ood_tune": [uniform, [0.8, 0.04, 0.04, 0.04, 0.04, 0.04]],
                       "test": [high, high, uniform],
                       "ood_report": [[0.98, 0.004, 0.004, 0.004, 0.004, 0.004]] if final_ood_confident else [uniform]}
        calls = []

        def predict(records):
            subset = records[0]["subset"]
            calls.append(subset)
            if subset in {"test", "ood_report"}:
                self.assertTrue((output / "selected_thresholds.json").is_file())
            return predictions[subset]

        scope.update(RUN_DIR=output, val_records=groups["val"], tune_records=groups["ood_tune"],
                     predict_records=predict, GRID=[i / 100 for i in range(101)], CONFIDENCE_THRESHOLD=0.7,
                     MIN_ID_RETENTION=0.95, CANDIDATE_VERSION="model-v3.0.1", TEMPERATURE=1.188751,
                     BASELINE_THRESHOLDS=dict(confidenceThreshold=0.7, marginThreshold=0.4, entropyThreshold=0.4),
                     MODEL_PATH=model, INFO_PATH=info, MODEL_SHA256=scope["sha256_file"](model),
                     INFO_SHA256=scope["sha256_file"](info), WEIGHTS_SHA256="synthetic weights",
                     weight_digest=lambda: "synthetic weights", MANIFEST_PATH=manifest,
                     MANIFEST_SHA256=scope["sha256_file"](manifest), RUNTIME={}, LAYER_POLICIES={},
                     EVALUATION_STATUS="previously_used", EVALUATION_NOTES="Synthetic verification only.",
                     datetime=datetime, timezone=timezone, zipfile=zipfile)
        downloaded = []
        google = types.ModuleType("google")
        colab = types.ModuleType("google.colab")
        colab.files = types.SimpleNamespace(download=downloaded.append)
        google.colab = colab
        with contextlib.redirect_stdout(io.StringIO()), patch.dict(sys.modules, {"google": google, "google.colab": colab}):
            exec(compile(CELLS["tune-and-freeze"], "tune-and-freeze", "exec"), scope)
            self.assertEqual(calls, ["val", "ood_tune"])
            selection_bytes = scope["SELECTION_PATH"].read_bytes()
            exec(compile(CELLS["evaluate"], "evaluate", "exec"), scope)
            self.assertEqual(calls, ["val", "ood_tune", "test", "ood_report"])
            self.assertEqual(scope["SELECTION_PATH"].read_bytes(), selection_bytes)
            exec(compile(CELLS["export"], "export", "exec"), scope)
        config = json.loads((output / "model_config.json").read_text(encoding="utf-8"))
        evaluation = json.loads((output / "evaluation.json").read_text(encoding="utf-8"))
        self.assertEqual(config["thresholds"], evaluation["candidate"]["thresholds"])
        self.assertFalse(config["provenance"]["browserParityMeasured"])
        self.assertEqual(evaluation["candidate"]["mangoTest"]["acceptedWrong"], 1)
        self.assertEqual(len(downloaded), 1)
        with zipfile.ZipFile(downloaded[0]) as archive:
            self.assertEqual(len(archive.namelist()), 9)
            self.assertIn("model_config.json", archive.namelist())
            self.assertFalse(any(name.endswith(".fixture") for name in archive.namelist()))
        return config["thresholds"], evaluation["candidate"]["oodReport"]["falseAcceptRate"]

    def test_full_reporting_flow_and_evaluation_cannot_select_thresholds(self):
        with tempfile.TemporaryDirectory() as directory:
            first, first_rate = self.run_synthetic_pipeline(Path(directory) / "first", True)
            second, second_rate = self.run_synthetic_pipeline(Path(directory) / "second", False)
            self.assertEqual(first, second)
            self.assertEqual((first_rate, second_rate), (1.0, 0.0))


if __name__ == "__main__":
    unittest.main(verbosity=2)

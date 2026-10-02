"""Check the v4 notebook contracts without training a research model."""

import argparse
import ast
import csv
import hashlib
import json
import math
import os
import shutil
import tempfile
import sys
import unittest
import zipfile
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath

import imagehash
import nbformat
import numpy as np
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "notebooks/experiment/v4"
TRAINING = nbformat.read(FOLDER / "MangoLeaf_AI_Training_v4.ipynb", as_version=4)
FITTING = nbformat.read(FOLDER / "MangoLeaf_AI_Threshold_Fitting_v4.ipynb", as_version=4)
TRAIN = {cell.id: cell.source for cell in TRAINING.cells}
FIT = {cell.id: cell.source for cell in FITTING.cells}
CLASSES = ["anthracnose", "bacterial_black_spot", "bacterial_canker", "healthy_fruit", "healthy_leaf", "mango_scab", "sooty_mold"]


def helpers():
    scope = dict(csv=csv, hashlib=hashlib, json=json, math=math, shutil=shutil, zipfile=zipfile,
                 Counter=Counter, defaultdict=defaultdict, Path=Path, PurePosixPath=PurePosixPath,
                 np=np, Image=Image, ImageOps=ImageOps, imagehash=imagehash, CLASS_NAMES=CLASSES,
                 SEED=42, IMAGE_EXTENSIONS={".jpg", ".jpeg", ".png", ".bmp", ".gif"})
    for text in [TRAIN["file-helpers"], TRAIN["data-helpers"], TRAIN["reviewed-images"],
                 FIT["scoring-helpers"], FIT["ood-helpers"], FIT["export-helpers"]]:
        exec(compile(text, "notebook-helpers", "exec"), scope)
    return scope


class NotebookChecks(unittest.TestCase):
    def setUp(self):
        self.scope = helpers()
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)

    def image(self, relative, color):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (13, 17), color).save(path)
        return path

    def test_clean_notebooks_and_identical_preprocessing_helpers(self):
        for document in [TRAINING, FITTING]:
            nbformat.validate(document)
            self.assertEqual(len({c.id for c in document.cells}), len(document.cells))
            for cell in document.cells:
                if cell.cell_type == "code":
                    compile(cell.source, cell.id, "exec")
                    self.assertIsNone(cell.execution_count)
                    self.assertEqual(cell.outputs, [])
        self.assertEqual(TRAIN["file-helpers"], FIT["file-helpers"])
        self.assertEqual(TRAIN["export-helpers"], FIT["export-helpers"])

    def test_preserved_v3_augmentation_and_training_settings(self):
        old = json.loads((ROOT / "notebooks/v3/MangoLeaf_AI_Training_v3.ipynb").read_text(encoding="utf-8"))
        self.assertEqual(TRAIN["augmentation"].strip(), "".join(old["cells"][16]["source"]).strip())
        tree = ast.parse(TRAIN["setup"])
        constants = {}
        for node in tree.body:
            if isinstance(node, ast.Assign):
                try:
                    value = ast.literal_eval(node.value)
                except (ValueError, TypeError):
                    continue
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        constants[target.id] = value
                    elif isinstance(target, ast.Tuple):
                        constants.update((t.id, v) for t, v in zip(target.elts, value))
        self.assertEqual(constants["CLASS_NAMES"], CLASSES)
        for name, value in {"SEED": 42, "BATCH_SIZE": 32, "STAGE1_EPOCHS": 5, "STAGE2_EPOCHS": 10,
                            "STAGE1_LR": 1e-3, "STAGE2_LR": 1e-5, "PHASH_DISTANCE": 5}.items():
            self.assertEqual(constants[name], value)
        self.assertIn('weights="imagenet"', TRAIN["model"])
        self.assertIn("base_model(inputs, training=False)", TRAIN["model"])
        self.assertIn("BatchNormalization", TRAIN["training"])
        self.assertFalse(constants["QUANTIZE_FLOAT16"])

    def test_no_test_predictions_during_training_or_training_during_fitting(self):
        for cell in TRAINING.cells:
            if cell.cell_type != "code":
                continue
            for node in ast.walk(ast.parse(cell.source)):
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "predict":
                    self.assertEqual(ast.unparse(node.args[0]), "val_ds")
        for cell in FITTING.cells:
            if cell.cell_type == "code":
                for node in ast.walk(ast.parse(cell.source)):
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                        self.assertNotIn(node.func.attr, {"fit", "set_weights", "train_on_batch"})
        self.assertNotIn("test_records", FIT["select-thresholds"])
        self.assertNotIn("report_records", FIT["select-thresholds"])
        self.assertLess(FIT["evaluate"].index("read_frozen_selection"), FIT["evaluate"].index("predict_records"))

    def test_reviewed_identity_list(self):
        rows = self.scope["REVIEWED_IMAGES"]
        self.assertEqual(len(rows), 62)
        self.assertEqual(len({(r["label"], r["sha256"]) for r in rows}), 62)
        self.assertEqual(sum(r["currentName"] != r["historicalName"] for r in rows), 13)
        self.assertEqual(sum(r["currentName"] == "DSC_0205.JPG" for r in rows), 1)

    def fixture_rows(self):
        path = self.image("raw/healthy_fruit/renamed.png", "red")
        raw = {"label": "healthy_fruit", "path": str(path), "sha256": self.scope["sha256_file"](path),
               "sourceRelativePath": "healthy_fruit/renamed.png", "bytes": path.stat().st_size}
        old = {"label": "healthy_fruit", "sha256": raw["sha256"], "subset": "test",
               "baselineName": "healthy_fruit__original.png", "baselineRelativePath": "test/healthy/healthy_fruit__original.png"}
        reviewed = {"label": raw["label"], "sha256": raw["sha256"], "currentName": "renamed.png"}
        return raw, old, reviewed

    def test_rename_preserves_membership_and_separates_healthy_folder(self):
        raw, old, reviewed = self.fixture_rows()
        matched = self.scope["match_baseline"]([raw], [old], [reviewed])
        self.assertEqual(matched[0]["subset"], "test")
        self.assertEqual(matched[0]["relativePath"], "test/healthy_fruit/healthy_fruit__original.png")
        self.assertEqual(matched[0]["path"], raw["path"])

    def test_missing_changed_or_cross_label_images_stop_matching(self):
        raw, old, reviewed = self.fixture_rows()
        for sources, baseline, reviews in [([], [old], []), ([raw], [old, old], []),
            ([raw, {**raw, "label": "healthy_leaf"}], [old], []),
            ([raw], [old], [{**reviewed, "sha256": "changed"}])]:
            with self.assertRaises(ValueError):
                self.scope["match_baseline"](sources, baseline, reviews)

    def test_identical_raw_copies_do_not_duplicate_a_baseline_record(self):
        raw, old, reviewed = self.fixture_rows()
        copy = {**raw, "sourceRelativePath": "healthy_fruit/copy.png"}
        self.assertEqual(len(self.scope["match_baseline"]([raw, copy], [old], [reviewed])), 1)

    def test_dataset_zip_roundtrip_and_changed_content(self):
        raw, _, _ = self.fixture_rows()
        row = {**raw, "relativePath": "test/healthy_fruit/a.png"}
        archive = self.root / "dataset.zip"
        with zipfile.ZipFile(archive, "x") as bundle:
            bundle.write(raw["path"], row["relativePath"])
        extracted = self.scope["extract_dataset"](archive, [row], self.root / "output")
        self.assertEqual(self.scope["sha256_file"](extracted[0]["path"]), row["sha256"])
        with self.assertRaisesRegex(ValueError, "contents changed"):
            self.scope["extract_dataset"](archive, [{**row, "sha256": "bad"}], self.root / "changed")

    def test_archive_extra_entries_and_unsafe_paths_are_rejected(self):
        raw, _, _ = self.fixture_rows()
        archive = self.root / "unsafe.zip"
        row = {**raw, "relativePath": "../escape.png"}
        with zipfile.ZipFile(archive, "x") as bundle:
            bundle.write(raw["path"], row["relativePath"])
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            self.scope["extract_dataset"](archive, [row], self.root / "unsafe")
        with self.assertRaisesRegex(ValueError, "entries differ"):
            self.scope["extract_dataset"](archive, [], self.root / "extra")
        for bad in ["../outside", "/absolute", "a\\..\\b", "."]:
            with self.assertRaises(ValueError):
                self.scope["inside"](self.root, bad)

    def test_seven_class_entropy_and_probability_validation(self):
        stats = self.scope["probability_stats"]([[1 / 7] * 7, [0, 0, 0, 0.8, 0.2, 0, 0]])
        self.assertAlmostEqual(stats[0]["entropy"], 1.0)
        self.assertEqual(stats[1]["predictedIndex"], 3)
        for invalid in [[0.2] * 7, [1 / 6] * 6, [float("nan")] * 7, [-0.1, 1.1, 0, 0, 0, 0, 0]]:
            with self.assertRaises(ValueError):
                self.scope["probability_stats"]([invalid])

    def test_threshold_selection_ties_and_infeasible_floor(self):
        score = self.scope["probability_stats"]
        val = score([[0.94] + [0.01] * 6] * 20)
        ood = score([[1 / 7] * 7, [0.7] + [0.05] * 6])
        grid = [i / 100 for i in range(101)]
        selected, rows = self.scope["select_thresholds"](val, ood, grid, 0.7, 0.95)
        reverse, _ = self.scope["select_thresholds"](val, ood, grid[::-1], 0.7, 0.95)
        self.assertEqual(selected, reverse)
        self.assertEqual(len(rows), 10201)
        self.assertEqual(sum(self.scope["accepted"](r, selected) for r in val), 20)
        self.assertEqual(sum(self.scope["accepted"](r, selected) for r in ood), 0)
        impossible, _ = self.scope["select_thresholds"](score([[1 / 7] * 7]), ood, grid, 0.7, 0.95)
        self.assertIsNone(impossible)

    def test_both_healthy_classes_and_rejections_have_separate_counts(self):
        score = self.scope["probability_stats"]
        records = [{"label": "healthy_fruit"}, {"label": "healthy_leaf"}, {"label": "healthy_leaf"}]
        stats = score([[0, 0, 0, 0.95, 0.05, 0, 0], [0, 0, 0, 0.9, 0.1, 0, 0], [1 / 7] * 7])
        thresholds = dict(confidenceThreshold=0.7, marginThreshold=0, entropyThreshold=1)
        report = self.scope["summarize"](self.scope["scored_rows"](records, stats, thresholds))
        self.assertEqual((report["acceptedCorrect"], report["acceptedWrong"], report["rejected"]), (1, 1, 1))
        self.assertEqual(report["perClass"]["healthy_leaf"]["rejected"], 1)
        self.assertEqual(report["confusion"]["counts"][4][3], 1)
        self.assertEqual(report["confusion"]["counts"][4][7], 1)

    def test_selection_cannot_be_overwritten_or_silently_changed(self):
        path = self.root / "selection.json"
        self.scope["write_json_once"](path, {"threshold": 0.4})
        digest = self.scope["sha256_file"](path)
        self.assertEqual(self.scope["read_frozen_selection"](path, digest)["threshold"], 0.4)
        with self.assertRaises(FileExistsError):
            self.scope["write_json_once"](path, {})
        path.write_text("{}")
        with self.assertRaises(RuntimeError):
            self.scope["read_frozen_selection"](path, digest)

    def test_ood_split_repeatability_exclusions_and_content_overlap(self):
        folder = self.root / "ood"
        for i in range(8):
            self.image(f"ood/{i}.png", (i, i + 1, i + 2))
        first = self.scope["prepare_ood"](folder, ["0.png"])
        second = self.scope["prepare_ood"](folder, ["0.png"])
        self.assertEqual(first, second)
        self.assertEqual(Counter(r["subset"] for r in first), {"ood_tune": 3, "ood_report": 4})
        self.scope["check_unique_contents"](first)
        with self.assertRaises(ValueError):
            self.scope["check_unique_contents"](first + [first[0]])
        with self.assertRaises(ValueError):
            self.scope["prepare_ood"](folder, ["missing.png"])

    def test_tfjs_export_checks_each_group_and_finite_unquantized_weights(self):
        folder = self.root / "model"
        folder.mkdir()
        graph = {"format": "graph-model", "signature": {
            "inputs": {"input": {"tensorShape": {"dim": [{"size": n} for n in [-1, 224, 224, 3]]}}},
            "outputs": {"output": {"tensorShape": {"dim": [{"size": -1}, {"size": 7}]}}}},
            "weightsManifest": []}
        for i in range(2):
            name = f"group{i}.bin"
            (folder / name).write_bytes(np.asarray([i + 0.5], dtype="<f4").tobytes())
            graph["weightsManifest"].append({"paths": [name], "weights": [{"name": str(i), "shape": [1], "dtype": "float32"}]})
        (folder / "model.json").write_text(json.dumps(graph))
        self.assertEqual(len(self.scope["verify_tfjs_export"](folder)), 3)
        (folder / "group1.bin").write_bytes(np.asarray([float("inf")], dtype="<f4").tobytes())
        with self.assertRaisesRegex(ValueError, "Non-finite"):
            self.scope["verify_tfjs_export"](folder)
        graph["signature"]["outputs"]["output"]["tensorShape"]["dim"][-1]["size"] = 6
        (folder / "model.json").write_text(json.dumps(graph))
        with self.assertRaisesRegex(ValueError, "seven"):
            self.scope["verify_tfjs_export"](folder)


def audit_real_inputs(raw, baseline):
    """Read images and hashes only. Never change the provided dataset folders."""
    scope = helpers()
    sources = scope["scan_raw"](Path(raw))
    original = scope["scan_baseline"](Path(baseline))
    assert scope["object_hash"](sorted((r["label"], r["sha256"]) for r in sources)) == scope["EXPECTED_RAW_IDENTITY"]
    assert scope["object_hash"](sorted((r["subset"], r["label"], r["sha256"]) for r in original)) == scope["EXPECTED_BASELINE_IDENTITY"]
    matched = scope["match_baseline"](sources, original, scope["REVIEWED_IMAGES"])
    report = scope["audit_duplicates"](sources, matched, 5)
    print(json.dumps({"rawFiles": len(sources), "selected": len(matched),
                      "subsets": dict(Counter(r["subset"] for r in matched)),
                      "identicalCopiesExcluded": report["identicalCopiesExcluded"],
                      "nearMatchesExcluded": len(report["nearMatchesExcluded"]),
                      "retainedSimilarityFlags": len(report["retainedSimilarityFlags"]),
                      "crossSubsetFlags": sum(r["crossSubset"] for r in report["retainedSimilarityFlags"])}, indent=2))


def smoke_test(resume=None):
    """Exercise real TensorFlow cells on synthetic images; this is not accuracy evidence."""
    import matplotlib
    matplotlib.use("Agg")
    os.environ["TF_NUM_INTRAOP_THREADS"] = "2"
    os.environ["TF_NUM_INTEROP_THREADS"] = "2"
    import tensorflow as tf

    # A short temp path also avoids Windows' TensorFlow header path-length limit.
    destination = Path(resume) if resume else Path(tempfile.mkdtemp(prefix="mlv4-smoke-"))
    print("Synthetic smoke artifacts:", destination, flush=True)
    scope = {}
    setup = TRAIN["setup"]
    setup = setup[setup.index("import csv,"):setup.index("# Install hashing support")]
    exec(compile(setup, "smoke-setup", "exec"), scope)
    scope.update(RAW_DIR=destination / "raw", BASELINE_SPLIT_DIR=destination / "baseline",
                 OUTPUT_ROOT=destination / "runs", STAGE1_EPOCHS=1, STAGE2_EPOCHS=1,
                 BATCH_SIZE=7, REVIEWED_IMAGES=[], imagehash=imagehash, ImageOps=ImageOps)
    generator = np.random.default_rng(2026)
    for label in ([] if resume else CLASSES):
        for subset, count in [("train", 2), ("val", 1), ("test", 1)]:
            for index in range(count):
                name = f"{subset}-{index}.png"
                image = Image.fromarray(generator.integers(0, 256, size=(57, 63, 3), dtype=np.uint8))
                raw = scope["RAW_DIR"] / label / name
                raw.parent.mkdir(parents=True, exist_ok=True)
                image.save(raw)
                old = scope["BASELINE_SPLIT_DIR"] / subset / ("healthy" if label.startswith("healthy_") else label) / (label + "__" + name)
                old.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(raw, old)
    for ident in ["file-helpers", "data-helpers"]:
        exec(compile(TRAIN[ident], ident, "exec"), scope)
    raw = scope["scan_raw"](scope["RAW_DIR"])
    original = scope["scan_baseline"](scope["BASELINE_SPLIT_DIR"])
    scope["EXPECTED_RAW_IDENTITY"] = scope["object_hash"](sorted((r["label"], r["sha256"]) for r in raw))
    scope["EXPECTED_BASELINE_IDENTITY"] = scope["object_hash"](sorted((r["subset"], r["label"], r["sha256"]) for r in original))
    steps = ["prepare-data", "load-data", "augmentation", "augmentation-preview", "model",
             "training", "calibration", "gradcam", "export-helpers", "export-setup", "converter", "finish-export"]
    if resume:
        scope["RUN_DIR"] = sorted((destination / "runs").iterdir())[-1]
        steps = ["export-helpers", "export-setup", "converter", "finish-export"]
    for ident in steps:
        text = TRAIN[ident]
        # Only the smoke run uses CPU, random initial weights, and a tiny fixture schedule.
        text = text.replace("if not tf.config.list_physical_devices('GPU'):", "if False:")
        text = text.replace("Path('/content/mangoleaf-v4')", repr(destination / "local"))
        text = text.replace('weights="imagenet"', 'weights=None')
        if ident == "augmentation-preview":
            text = text.replace("import matplotlib.pyplot as plt", "import matplotlib.pyplot as plt\nplt.show = lambda: plt.close('all')")
        print("SMOKE TRAIN:", ident, flush=True)
        # pathlib's repr is WindowsPath on Windows; expose it only in this harness.
        scope[type(destination).__name__] = type(destination)
        exec(compile(text, ident, "exec"), scope)

    fitting = {}
    text = FIT["setup"]
    exec(compile(text[text.index("import csv,"):], "fit-setup", "exec"), fitting)
    fitting.update(TRAINING_RUN=scope["RUN_DIR"], OOD_DIR=destination / "ood", OUTPUT_ROOT=destination / "fitting")
    fitting[type(destination).__name__] = type(destination)
    fitting["OOD_DIR"].mkdir()
    for i in range(4):
        Image.fromarray(generator.integers(0, 256, size=(59, 61, 3), dtype=np.uint8)).save(fitting["OOD_DIR"] / f"ood-{i}.png")
    for ident in ["file-helpers", "export-helpers", "scoring-helpers", "ood-helpers", "audit",
                  "select-thresholds", "evaluate", "report-figures", "package"]:
        text = FIT[ident].replace("Path('/content/mangoleaf-threshold-v4')", repr(destination / "fit-local"))
        print("SMOKE FIT:", ident, flush=True)
        exec(compile(text, ident, "exec"), fitting)
    assert (fitting["RUN_DIR"] / f'{fitting["RUN_DIR"].name}-evidence.zip').is_file()
    assert fitting["info"]["testPredictionsRun"] is False
    assert fitting["evaluation"]["classes"] == CLASSES
    print("SYNTHETIC CPU SMOKE PASSED. Artifacts:", destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw", type=Path, help="Optional read-only audit of the original raw dataset.")
    parser.add_argument("--baseline", type=Path, help="Original v3 train/val/test folder for the read-only audit.")
    parser.add_argument("--smoke", action="store_true", help="Run real TensorFlow cells on tiny synthetic data. Requires TensorFlow/matplotlib/scikit-learn; export may install converter dependencies.")
    parser.add_argument("--smoke-resume", type=Path, help="Resume export from a previous synthetic smoke folder without training again.")
    args = parser.parse_args()
    if bool(args.raw) != bool(args.baseline):
        parser.error("Provide both --raw and --baseline.")
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NotebookChecks))
    if not result.wasSuccessful():
        raise SystemExit(1)
    if args.raw:
        audit_real_inputs(args.raw, args.baseline)
    if args.smoke or args.smoke_resume:
        smoke_test(args.smoke_resume)

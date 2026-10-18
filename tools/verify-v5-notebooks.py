"""Verify V5.0.0 workflow safeguards with local synthetic fixtures.

Run with Python 3.11+ and the scientific verification dependencies documented in
the V5 trial guide. This never installs Colab packages, mounts Drive, trains a
model, or runs browser reliability sessions. Fixture scores are not accuracy
measurements for MangoLeaf AI.
"""

import ast
import copy
import hashlib
import importlib.util
import inspect
import io
import json
import pathlib
import random
import re
import subprocess
import sys
import tempfile
import unittest
from contextlib import contextmanager, redirect_stdout
from types import SimpleNamespace
from unittest.mock import Mock, patch
from urllib.parse import unquote


sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[1]
WORKFLOW_DIR = ROOT / "notebooks/experiment/v5.0.0"
NOTEBOOK = WORKFLOW_DIR / "MangoLeaf_AI_OE_Fine_Tuning_v5_0_0.ipynb"
EVALUATION_NOTEBOOK = WORKFLOW_DIR / "MangoLeaf_AI_Evaluate_v5_0_0.ipynb"
HELPER = WORKFLOW_DIR / "v5_workflow.py"


def load_workflow():
    spec = importlib.util.spec_from_file_location("mangoleaf_v5_verification", HELPER)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class NotebookContractTests(unittest.TestCase):
    def test_template_contains_only_unexecuted_compilable_cells(self):
        import nbformat
        for path in [NOTEBOOK, EVALUATION_NOTEBOOK]:
            with self.subTest(notebook=path.name):
                notebook = json.loads(path.read_text(encoding="utf-8"))
                nbformat.validate(nbformat.from_dict(notebook))
                self.assertEqual(notebook["nbformat"], 4)
                ids = []
                executable = []
                for cell in notebook["cells"]:
                    ids.append(cell["id"])
                    if cell["cell_type"] != "code":
                        continue
                    self.assertIsNone(cell["execution_count"])
                    self.assertEqual(cell["outputs"], [])
                    source = "".join(cell["source"])
                    ast.parse(source, filename=f"{path.name}:{cell['id']}")
                    executable.append(source)
                self.assertEqual(len(ids), len(set(ids)))
                self.assertGreaterEqual(len(executable), 5)

    def test_each_notebook_checks_the_matching_helper_bytes(self):
        expected = hashlib.sha256(HELPER.read_bytes()).hexdigest()
        for path in [NOTEBOOK, EVALUATION_NOTEBOOK]:
            notebook = json.loads(path.read_text(encoding="utf-8"))
            assigned = []
            for cell in notebook["cells"]:
                if cell["cell_type"] != "code":
                    continue
                for node in ast.parse("".join(cell["source"])).body:
                    if isinstance(node, ast.Assign) and any(
                            isinstance(target, ast.Name) and target.id == "EXPECTED_HELPER_SHA256"
                            for target in node.targets):
                        assigned.append(ast.literal_eval(node.value))
            self.assertEqual(assigned, [expected], path.name)

    def test_git_checkout_preserves_the_hash_locked_helper_bytes(self):
        relative = HELPER.relative_to(ROOT).as_posix()
        original = subprocess.run(["git", "show", "HEAD:" + relative], cwd=ROOT,
                                  capture_output=True, check=True).stdout
        checkout = subprocess.run(["git", "-c", "core.autocrlf=true", "cat-file", "--filters",
                                   "--path=" + relative, "HEAD:" + relative], cwd=ROOT,
                                  capture_output=True, check=True).stdout
        self.assertEqual(checkout, original)
        self.assertNotIn(b"\r\n", HELPER.read_bytes())

    def test_helper_import_does_not_start_scientific_runtime(self):
        before = set(sys.modules)
        load_workflow()
        newly_loaded = set(sys.modules) - before
        self.assertFalse(any(name == "tensorflow" or name.startswith("tensorflow.")
                             for name in newly_loaded))

    def test_missing_review_bundle_stops_before_creating_a_new_run(self):
        notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
        source = next("".join(cell["source"]) for cell in notebook["cells"]
                      if cell["cell_type"] == "code" and "experiment = wf.Experiment({" in "".join(cell["source"]))
        tree = ast.parse(source)
        for node in tree.body:
            if isinstance(node, ast.Assign) and any(
                    isinstance(target, ast.Name) and target.id == "PARENT_THRESHOLD_RUN" for target in node.targets):
                node.value = ast.Name(id="fixture_review", ctx=ast.Load())
        code = compile(ast.fix_missing_locations(tree), str(NOTEBOOK), "exec")
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            factory = Mock(return_value=SimpleNamespace(run=root / "new-attempt"))
            scope = {"Path": pathlib.Path, "fixture_review": root,
                     "wf": SimpleNamespace(Experiment=factory)}
            with self.assertRaisesRegex(FileNotFoundError, "Review bundle is incomplete"):
                exec(code, scope)
            factory.assert_not_called()
            for filename in scope["REQUIRED_REVIEW_FILES"]:
                (root / filename).write_bytes(b"controlled fixture")
            with redirect_stdout(io.StringIO()):
                exec(code, scope)
            factory.assert_called_once()

    def test_trial_links_resolve_to_existing_local_inputs(self):
        guide = ROOT / "docs/model-training/experiment/v5.0.0/TRIAL_v5_0_0.md"
        links = re.findall(r"\]\(([^)]+)\)", guide.read_text(encoding="utf-8"))
        checked = 0
        for link in links:
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", link):
                continue
            target = unquote(link.split("#", 1)[0])
            if target:
                self.assertTrue((guide.parent / target).resolve().exists(), link)
                checked += 1
        self.assertGreater(checked, 3)


class SafeguardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_workflow()

    def test_paths_cannot_escape_their_source_root(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            self.assertEqual(self.workflow.safe_child(root, "dataset/val/photo.jpg"),
                             root.resolve() / "dataset/val/photo.jpg")
            for relative in ["../outside", "/outside", "a/../../outside", "C:/outside",
                             "a\\outside", "", ".", "\x00"]:
                with self.subTest(relative=relative), self.assertRaises(ValueError):
                    self.workflow.safe_child(root, relative)

    def test_output_cannot_overlap_any_input(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            self.workflow.assert_disjoint_paths([root / "v4", root / "v5"])
            for second in [root, root / "input", root / "input/nested"]:
                with self.subTest(second=second), self.assertRaises(ValueError):
                    self.workflow.assert_disjoint_paths([root / "input", second])

    def test_drive_inputs_require_real_folders_below_mounted_my_drive(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory) / "MyDrive"
            source = root / "input"
            source.mkdir(parents=True)
            self.assertEqual(self.workflow.drive_path(source, my_drive=root), source.resolve())
            self.assertEqual(self.workflow.drive_path(root / "new-output", output=True, my_drive=root),
                             (root / "new-output").resolve())
            for target in [root, root.parent / "outside", root / "input/../other"]:
                with self.subTest(target=target), self.assertRaises(ValueError):
                    self.workflow.drive_path(target, my_drive=root)
            with self.assertRaises(FileNotFoundError):
                self.workflow.drive_path(root / "missing", my_drive=root)

    def test_sealed_evidence_cannot_be_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "sealed.json"
            self.workflow.save_json_once(path, {"identity": "original"})
            self.workflow.save_json_once(path, {"identity": "original"})
            before = path.read_bytes()
            with self.assertRaises(RuntimeError):
                self.workflow.save_json_once(path, {"identity": "changed"})
            self.assertEqual(path.read_bytes(), before)

    def test_receipt_rejects_same_size_artifact_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            checkpoint = root / "stage2.weights.h5"
            checkpoint.write_bytes(b"trusted")
            receipt = self.workflow.receipt_for(root, [checkpoint.name])
            self.workflow.verify_manifest_files(root, receipt)
            checkpoint.write_bytes(b"changed")
            with self.assertRaises(RuntimeError):
                self.workflow.verify_manifest_files(root, receipt)
            with self.assertRaises(RuntimeError):
                self.workflow.verify_manifest_files(root, {}, [checkpoint.name])

    def test_configuration_cannot_silently_change_experiment_scope(self):
        base = {"parent_run": "/parent", "old_ood": "/old", "output_root": "/new"}
        self.workflow.validate_config(base)
        for updates in [{"epochs": True}, {"learning_rate": float("nan")},
                        {"expected_oe_count": 2510}, {"marginThreshold": 0.2}]:
            with self.subTest(updates=updates), self.assertRaises(ValueError):
                self.workflow.validate_config({**base, **updates})

    def parent_metadata(self):
        module = self.workflow
        plan = {"classNames": module.CLASS_NAMES, "preprocessing": module.PREPROCESSING,
                "imageSize": [224, 224]}
        receipt = {"experimentVersion": "v4.5.0", "completedEpochs": 15,
                   "classNames": module.CLASS_NAMES, "oeTrainingCount": 2011,
                   "heldOutOodCount": 500, "configurationHash": module.canonical_hash(plan)}
        return receipt, {"classNames": module.CLASS_NAMES}, plan

    def test_parent_identity_class_order_and_plan_are_bound(self):
        receipt, manifest, plan = self.parent_metadata()
        module = self.workflow
        module.validate_parent_metadata(receipt, manifest, plan, module.CLASS_NAMES,
                                        module.PARENT_CHECKPOINT_SHA256)
        for changed in ["checkpoint", "classes", "plan", "epoch_count"]:
            current_receipt, current_manifest, current_plan = copy.deepcopy((receipt, manifest, plan))
            checkpoint = module.PARENT_CHECKPOINT_SHA256
            if changed == "checkpoint":
                checkpoint = "0" * 64
            elif changed == "classes":
                current_manifest["classNames"] = list(reversed(module.CLASS_NAMES))
            elif changed == "plan":
                current_plan["batchSize"] = 99
            else:
                current_receipt["completedEpochs"] = 14
            with self.subTest(changed=changed), self.assertRaises(RuntimeError):
                module.validate_parent_metadata(current_receipt, current_manifest, current_plan,
                                                module.CLASS_NAMES, checkpoint)

    def mango_rows(self):
        rows = []
        for subset, count in self.workflow.EXPECTED_SPLITS.items():
            for index in range(count):
                identifier = f"{subset}-{index}"
                rows.append({"id": identifier, "subset": subset,
                             "label": self.workflow.CLASS_NAMES[index % 7],
                             "groupId": identifier, "decodedRgbSha256": identifier})
        return rows

    def test_preserved_split_counts_and_related_group_boundaries(self):
        rows = self.mango_rows()
        self.workflow.validate_split_membership(rows)
        with self.assertRaises(RuntimeError):
            self.workflow.validate_split_membership(rows[:-1])
        for key in ["groupId", "decodedRgbSha256", "id"]:
            changed = copy.deepcopy(rows)
            changed[-1][key] = changed[0][key]
            with self.subTest(key=key), self.assertRaises(RuntimeError):
                self.workflow.validate_split_membership(changed)

    def legacy_rows(self):
        actual, inventory, reviews = [], [], []
        for index in range(500):
            relative = f"old/{index}.jpg"
            identity = {"sha256": f"{index:064x}", "decodedRgbSha256": f"pixels-{index}", "bytes": 42}
            actual.append({"id": f"current-{index}", "sourceRelativePath": relative, **identity})
            inventory.append({"id": f"legacy-{index}", "relativePath": relative, **identity})
            reviews.append({"id": f"legacy-{index}", "relativePath": relative,
                            "keep": "yes", "unsupported": "yes", "captureGroup": "",
                            "sourceGroup": "", "sourceNotes": "Unknown individual capture; public collection.",
                            "priorUse": "previously_evaluated", "notes": "Saved researcher declaration."})
        return actual, inventory, reviews

    def test_legacy_review_is_reused_only_for_unchanged_photos(self):
        actual, inventory, reviews = self.legacy_rows()
        merged = self.workflow.match_legacy_review(actual, inventory, reviews)
        self.assertEqual(len(merged), 500)
        self.assertEqual(merged[0]["priorUse"], "previously_evaluated")
        self.assertEqual(merged[0]["originalPriorUse"], "previously_evaluated")
        self.assertIn("training", merged[0]["newTrainingUse"])
        for field, replacement in [("sha256", "changed"), ("decodedRgbSha256", "changed"),
                                   ("bytes", 99), ("sourceRelativePath", "other.jpg")]:
            changed = copy.deepcopy(actual)
            changed[0][field] = replacement
            with self.subTest(field=field), self.assertRaises(RuntimeError):
                self.workflow.match_legacy_review(changed, inventory, reviews)
        for field in ["keep", "unsupported"]:
            changed = copy.deepcopy(reviews)
            changed[0][field] = "no"
            with self.subTest(field=field), self.assertRaises(RuntimeError):
                self.workflow.match_legacy_review(actual, inventory, changed)

    def test_legacy_review_cannot_cover_the_same_photo_twice(self):
        actual, inventory, reviews = self.legacy_rows()
        actual[-1] = copy.deepcopy(actual[0])
        with self.assertRaises(RuntimeError):
            self.workflow.match_legacy_review(actual, inventory, reviews)

    def test_combined_pool_rejects_reencoded_exact_duplicates(self):
        rows = [{"sha256": "file-one", "decodedRgbSha256": "same-pixels"},
                {"sha256": "file-two", "decodedRgbSha256": "same-pixels"}]
        with self.assertRaises(RuntimeError):
            self.workflow.unique_records(rows)

    def test_old_training_photos_cannot_claim_fresh_reporting_status(self):
        records = [{"id": "one", "sourceRelativePath": "one.jpg"}]
        reviews = [{"id": "one", "relativePath": "one.jpg", "keep": "yes",
                    "unsupported": "yes", "sourceNotes": "Recorded source.",
                    "priorUse": "previously_evaluated"}]
        self.workflow.validate_review_rows(records, reviews)
        with self.assertRaises(RuntimeError):
            self.workflow.validate_review_rows(records, reviews, fresh=True)
        reviews[0]["priorUse"] = "never_used_for_training_or_tuning"
        self.assertEqual(len(self.workflow.validate_review_rows(records, reviews, fresh=True)), 1)
        reviews[0]["relativePath"] = "other.jpg"
        with self.assertRaises(RuntimeError):
            self.workflow.validate_review_rows(records, reviews, fresh=True)


class TrainingExecutionTests(unittest.TestCase):
    """Controlled loop fixtures; these do not execute TensorFlow or measure accuracy."""

    @classmethod
    def setUpClass(cls):
        import numpy as np
        cls.np = np
        cls.workflow = load_workflow()

    def run_fixture(self, root, validation_losses=None, fail_step=None):
        np, module = self.np, self.workflow
        events, seen = [], []
        losses = validation_losses or [1.0, 0.9, 0.8, 0.7, 0.6, 0.5]

        class Scalar:
            def __init__(self, value, fail=False):
                self.value, self.fail = value, fail

            def numpy(self):
                if self.fail:
                    raise RuntimeError("fixture readback failure")
                return np.float32(self.value)

        class Model:
            def __init__(self):
                self.weights = np.array([1.0], dtype=np.float32)

            def get_weights(self):
                return [self.weights.copy()]

            def save_weights(self, path):
                pathlib.Path(path).write_bytes(self.weights.tobytes())

            def load_weights(self, path):
                self.weights = np.frombuffer(pathlib.Path(path).read_bytes(), dtype=np.float32).copy()

            def save(self, path):
                pathlib.Path(path).write_bytes(self.weights.tobytes())

        class Trainer:
            def __init__(self, model, weights, oe_weight):
                self.model, self.phase, self.mode, self.updates = model, -1, None, 0
                self.metrics = [SimpleNamespace(name=name)
                                for name in ("loss", "mango_loss", "oe_loss", "accuracy")]
                self.reset_metrics()

            def compile(self, **kwargs):
                self.compile_options = kwargs

            def reset_metrics(self):
                self.mango_seen, self.oe_seen = [], []

            def train_step(self, data):
                features, labels = data
                mango, oe = list(features["mango"]), list(features["oe"])
                if len(mango) != len(labels):
                    raise AssertionError("Mango labels lost their batch alignment")
                self.mode = "training"
                self.updates += 1
                self.model.weights += 1
                seen.append((mango, oe))
                events.append(("update", len(mango), len(oe)))
                self.mango_seen.extend(mango)
                self.oe_seen.extend(oe)
                return {
                    "loss": Scalar(len(self.mango_seen) / 1000, self.updates == fail_step),
                    "mango_loss": Scalar(np.mean(self.mango_seen)),
                    "oe_loss": Scalar(np.mean(self.oe_seen)),
                    "accuracy": Scalar(np.mean(np.asarray(self.mango_seen) % 2 == 0)),
                }

            def test_step(self, data):
                pixels, labels = data
                if self.mode != "validation":
                    self.phase += 1
                self.mode = "validation"
                self.mango_seen.extend(pixels)
                return {"loss": Scalar(losses[self.phase]), "mango_loss": Scalar(losses[self.phase]),
                        "oe_loss": Scalar(0), "accuracy": Scalar(1)}

        class Progress:
            def __init__(self, *args, **kwargs):
                pass

            def update(self, *args, **kwargs):
                pass

        experiment = object.__new__(module.Experiment)
        experiment.run = root
        experiment.config = {"epochs": 5, "batch_size": 16, "seed": 42,
                             "learning_rate": 1e-5, "oe_loss_weight": 0.5}
        experiment.frozen = {"configurationHash": "fixture-plan"}
        experiment.verify_frozen = lambda: None
        experiment.model = experiment.logits_model = Model()
        experiment.initial_weight_hash = module.canonical_hash([
            hashlib.sha256(value.tobytes()).hexdigest() for value in experiment.model.get_weights()
        ])
        experiment.class_weights = np.ones(7, dtype=np.float32)
        experiment.train_rows = [{"id": index, "label": module.CLASS_NAMES[index % 7]}
                                 for index in range(1854)]
        experiment.val_rows = [{"id": 100000 + index, "label": module.CLASS_NAMES[index % 7]}
                               for index in range(398)]
        experiment.oe = [{"id": 10000 + index, "sha256": str(index)} for index in range(2511)]

        def host_batch(rows, *, labelled=False, layers=None):
            events.append(("host", len(rows)))
            values = np.asarray([row["id"] for row in rows], dtype=np.float32)
            return (values, np.asarray([module.CLASS_NAMES.index(row["label"]) for row in rows],
                                       dtype=np.int32)) if labelled else values

        fake_tf = SimpleNamespace(
            float32="float32", int32="int32", TensorSpec=lambda *args: args,
            function=lambda function, **kwargs: function,
            keras=SimpleNamespace(optimizers=SimpleNamespace(Adam=lambda rate: rate),
                                  utils=SimpleNamespace(Progbar=Progress)),
        )
        patches = dict(tf=fake_tf, np=np, OETrainer=Trainer, load_host_batch=host_batch,
                       augmentation_layers=lambda seed: (seed,))
        try:
            with patch.multiple(module, create=True, **patches), redirect_stdout(io.StringIO()), patch.object(
                    module, "dataset", side_effect=AssertionError("Training reentered a Dataset generator")):
                experiment.train()
        except RuntimeError:
            if fail_step is None:
                raise
        return experiment, seen, events

    def test_all_five_epochs_preserve_membership_oe_cycle_and_short_tails(self):
        with tempfile.TemporaryDirectory() as directory:
            experiment, seen, events = self.run_fixture(pathlib.Path(directory))
            self.assertEqual(len(seen), 580)
            for epoch in range(5):
                actual = [item for mango, _ in seen[epoch * 116:(epoch + 1) * 116] for item in mango]
                order = list(range(1854))
                random.Random(42 + epoch).shuffle(order)
                self.assertEqual(actual, order)
                self.assertEqual(len(seen[(epoch + 1) * 116 - 1][0]), 14)
                self.assertAlmostEqual(experiment.history[epoch]["loss"], 1.854, places=6)
                self.assertAlmostEqual(experiment.history[epoch]["mango_loss"], 926.5)
            oe = list(range(10000, 12511))
            random.Random(1042).shuffle(oe)
            batches = [oe[start:start + 16] for start in range(0, len(oe), 16)]
            self.assertEqual([actual for _, actual in seen], [batches[index % 157] for index in range(580)])
            self.assertEqual(experiment.oe_samples_consumed, 9277)
            self.assertEqual(sum(len(batch) == 15 for _, batch in seen), 3)
            receipt = self.workflow.read_json(experiment.run / "training_state.json")
            self.assertEqual(receipt["completedEpochs"], 5)
            selection = self.workflow.read_json(experiment.run / "checkpoint_selection.json")
            self.assertEqual(selection["selectedEpoch"], 5)
            self.assertAlmostEqual(float(experiment.model.get_weights()[0][0]), 581)
            self.assertTrue(events)

    def test_parent_baseline_can_remain_selected_with_zero_new_checkpoint_exposure(self):
        with tempfile.TemporaryDirectory() as directory:
            experiment, _, _ = self.run_fixture(pathlib.Path(directory), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
            selection = self.workflow.read_json(experiment.run / "checkpoint_selection.json")
            exposure = self.workflow.read_json(experiment.run / "oe_exposure.json")
            self.assertEqual(selection["selectedEpoch"], 0)
            self.assertEqual(exposure["samplesProcessed"], 9277)
            self.assertEqual(exposure["selectedCheckpointSamplesProcessed"], 0)
            self.assertEqual(float(experiment.model.get_weights()[0][0]), 1)

    def test_failed_readback_is_not_counted_or_sealed_and_cannot_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            experiment, _, _ = self.run_fixture(pathlib.Path(directory), fail_step=3)
            self.assertEqual(experiment.oe_samples_consumed, 32)
            self.assertFalse((experiment.run / "epoch_01.json").exists())
            self.assertFalse((experiment.run / "training_state.json").exists())
            self.assertFalse((experiment.run / "model_selected.keras").exists())
            marker = (experiment.run / "training_started.json").read_bytes()
            with self.assertRaisesRegex(RuntimeError, "already started"):
                experiment.train()
            self.assertEqual((experiment.run / "training_started.json").read_bytes(), marker)

    def test_host_batch_completes_cpu_reads_before_returning_numpy_arrays(self):
        np, module = self.np, self.workflow
        active, reads = [], []

        @contextmanager
        def device(name):
            active.append(name)
            try:
                yield
            finally:
                active.pop()

        class Pixels:
            device = "/device:CPU:0"

            def numpy(self):
                self_test.assertEqual(active, ["/CPU:0"])
                reads.append("complete")
                return np.full((224, 224, 3), 127, dtype=np.float32)

        class Augmented(Pixels):
            def numpy(self):
                return np.stack([super(Augmented, self).numpy()] * 2)

        self_test = self
        rows = [{"path": "fixture", "label": module.CLASS_NAMES[0]}] * 2
        with patch.multiple(module, create=True, np=np, tf=SimpleNamespace(device=device)), patch.object(
                module, "load_pixels", return_value=Pixels()), patch.object(
                module, "augment_batch", return_value=Augmented(), create=True):
            images, labels = module.load_host_batch(rows, labelled=True, layers=["fixture-layer"])
        self.assertEqual(active, [])
        self.assertEqual(images.shape, (2, 224, 224, 3))
        self.assertEqual(images.dtype, np.float32)
        self.assertEqual(labels.tolist(), [0, 0])
        self.assertEqual(len(reads), 3)

    def test_prediction_source_closes_cpu_scope_before_each_generator_yield(self):
        np, module = self.np, self.workflow
        active = []

        @contextmanager
        def device(name):
            active.append(name)
            try:
                yield
            finally:
                active.pop()

        class Pixels:
            def numpy(self):
                self_test.assertEqual(active, ["/CPU:0"])
                return np.zeros((224, 224, 3), dtype=np.float32)

        class Source:
            def __init__(self, generator, **kwargs):
                self.generator = generator

            def apply(self, operation):
                return self

            def batch(self, size):
                return self

            def prefetch(self, size):
                return self

        self_test = self
        fake_tf = SimpleNamespace(
            device=device, float32="float32", TensorSpec=lambda *args: args,
            data=SimpleNamespace(Dataset=SimpleNamespace(from_generator=Source),
                                 experimental=SimpleNamespace(assert_cardinality=lambda count: None)),
        )
        with patch.multiple(module, create=True, np=np, tf=fake_tf), patch.object(
                module, "load_pixels", return_value=Pixels()):
            stream = module.dataset([{"path": "one"}, {"path": "two"}])
            iterator = stream.generator()
            next(iterator)
            self.assertEqual(active, [])
            next(iterator)
            self.assertEqual(active, [])

    def test_nonfinite_step_readback_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "Non-finite"):
            self.workflow.synchronized_metrics({"loss": SimpleNamespace(numpy=lambda: float("nan"))})


class MetricTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_workflow()

    def test_acceptance_boundary_uses_unrounded_confidence(self):
        self.assertEqual(self.workflow.confidence_decision([0.70, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05]), 0)
        self.assertEqual(self.workflow.confidence_decision([0.699999, 0.050001, 0.05, 0.05, 0.05, 0.05, 0.05]), 7)
        self.assertEqual(self.workflow.confidence_decision([0.05, 0.05, 0.70, 0.05, 0.05, 0.05, 0.05]), 2)

    def test_invalid_probabilities_fail_instead_of_becoming_results(self):
        for values in [[float("nan")] * 7, [float("inf")] * 7, [0.2] * 7,
                       [-0.1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1], [1.0]]:
            with self.subTest(values=values), self.assertRaises(ValueError):
                self.workflow.confidence_decision(values)

    def test_rejected_mango_stays_in_recall_denominator(self):
        report = self.workflow.classification_metrics([0, 0, 1, 1], [0, 7, 0, 1], with_rejection=True)
        self.assertEqual(report["count"], 4)
        self.assertEqual(report["correct"], 2)
        self.assertEqual(report["accepted"], 3)
        self.assertEqual(report["rejected"], 1)
        self.assertEqual(report["correctOverAll"], 0.5)
        self.assertAlmostEqual(report["acceptedOnlyAccuracy"], 2 / 3)
        self.assertEqual(report["perClass"][0]["recall"], 0.5)
        self.assertEqual(report["perClass"][0]["precision"], 0.5)
        self.assertEqual(report["confusionMatrix"][0][7], 1)

    def test_all_rejected_mango_has_no_accepted_only_accuracy(self):
        report = self.workflow.classification_metrics([0, 1], [7, 7], with_rejection=True)
        self.assertIsNone(report["acceptedOnlyAccuracy"])
        self.assertEqual(report["correctOverAll"], 0.0)

    def test_ood_reports_false_acceptances_and_requires_nonempty_pool(self):
        accepted = [0.70, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05]
        rejected = [0.40, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10]
        report = self.workflow.rejection_metrics([accepted, rejected, rejected])
        self.assertEqual(report["count"], 3)
        self.assertEqual(report["rejected"], 2)
        self.assertEqual(report["falseAccepted"], 1)
        self.assertAlmostEqual(report["rejectionRate"], 2 / 3)
        with self.assertRaises(ValueError):
            self.workflow.rejection_metrics([])


class ImageSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_workflow()

    def test_reencoded_photos_have_the_same_decoded_identity(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            image = Image.new("RGB", (4, 3), "red")
            image.save(root / "one.png")
            image.save(root / "two.bmp")
            rows = [self.workflow.inventory_image(root / filename, pool="fixture", relative=filename)
                    for filename in ["one.png", "two.bmp"]]
            self.assertNotEqual(rows[0]["sha256"], rows[1]["sha256"])
            self.assertEqual(rows[0]["decodedRgbSha256"], rows[1]["decodedRgbSha256"])
            with self.assertRaises(RuntimeError):
                self.workflow.unique_records(rows)

    def test_decoder_limits_cover_the_frozen_parent_photo_sizes(self):
        parent = ROOT / "docs/model-training/non-experiment/v4.5.0/artifacts/training"
        # A new workflow must accept the unchanged, already reviewed parent inputs.
        for filename in ["input_manifest.json", "oe_dataset_manifest.json", "held_out_ood_inventory.json"]:
            rows = json.loads((parent / filename).read_text(encoding="utf-8"))["images"]
            with self.subTest(manifest=filename):
                self.assertLessEqual(max(row["dimensions"][0] * row["dimensions"][1] for row in rows),
                                     self.workflow.MAX_IMAGE_PIXELS)
                self.assertLessEqual(max(row["bytes"] for row in rows), self.workflow.MAX_IMAGE_BYTES)

    def test_mpo_keeps_the_primary_photo_and_original_file_bytes(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "camera-photo.jpg"
            # Camera JPEGs can contain additional MPO pictures, not animation.
            Image.new("RGB", (4, 3), "red").save(
                path, format="MPO", save_all=True,
                append_images=[Image.new("RGB", (2, 2), "blue")])
            original_bytes = path.read_bytes()
            with Image.open(path) as opened:
                self.assertEqual(opened.format, "MPO")
                self.assertEqual(opened.n_frames, 2)
            primary = self.workflow.raw_rgb(path)
            self.assertEqual(primary.size, (4, 3))
            self.assertEqual(primary.mode, "RGB")
            red, _, blue = primary.getpixel((0, 0))
            self.assertGreater(red, 240)
            self.assertLess(blue, 10)
            self.assertEqual(path.read_bytes(), original_bytes)
            with patch.object(self.workflow, "MAX_IMAGE_PIXELS", 1), self.assertRaises(ValueError):
                self.workflow.raw_rgb(path)

    def test_decoder_checks_real_encoding_animation_and_resource_limits(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            image = Image.new("RGB", (4, 3), "red")
            image.save(root / "valid.png")
            image.save(root / "disguised.jpg", format="TIFF")
            image.save(root / "animated.gif", save_all=True,
                       append_images=[Image.new("RGB", (4, 3), "blue")])
            self.assertEqual(self.workflow.raw_rgb(root / "valid.png").size, (4, 3))
            for filename in ["disguised.jpg", "animated.gif"]:
                with self.subTest(filename=filename), self.assertRaisesRegex(ValueError, re.escape(filename)):
                    self.workflow.raw_rgb(root / filename)
            with patch.object(self.workflow, "MAX_IMAGE_BYTES", 1), self.assertRaises(ValueError):
                self.workflow.raw_rgb(root / "valid.png")
            with patch.object(self.workflow, "MAX_IMAGE_PIXELS", 1), self.assertRaises(ValueError):
                self.workflow.raw_rgb(root / "valid.png")


class HandoffTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_workflow()

    def prepared_handoff(self, root):
        module = self.workflow
        experiment = object.__new__(module.Experiment)
        experiment.run = root
        experiment.frozen = {"configurationHash": "fixture-configuration"}
        experiment.plan = {"thresholds": {"confidenceThreshold": 0.70,
                                         "marginThreshold": None, "entropyThreshold": None}}
        experiment.verify_frozen = lambda: None
        for filename, contents in [("weights.bin", b"weights"), ("model_calibrated.keras", b"model"),
                                   ("figure.png", b"figure")]:
            (root / filename).write_bytes(contents)
        for receipt, artifact in [("training_state.json", "weights.bin"),
                                  ("calibration_complete.json", "model_calibrated.keras"),
                                  ("figure_manifest.json", "figure.png")]:
            module.save_json_once(root / receipt, {"artifacts": module.receipt_for(root, [artifact])})
        return experiment

    def test_no_ood_data_produces_pending_handoff(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            experiment = self.prepared_handoff(root)
            with redirect_stdout(io.StringIO()):
                experiment.seal()
            receipt = self.workflow.read_json(root / "experiment_complete.json")
            self.assertFalse(receipt["freshOodEvaluationComplete"])
            self.assertFalse(receipt["adopted"])
            self.assertFalse(receipt["browserParityPassed"])

    def test_changed_checkpoint_cannot_be_resealed_as_completed_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            experiment = self.prepared_handoff(root)
            (root / "weights.bin").write_bytes(b"changed")
            with self.assertRaises(RuntimeError):
                experiment.seal()
            self.assertFalse((root / "experiment_complete.json").exists())

    def test_interrupted_evaluation_cannot_claim_completed_ood(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            experiment = self.prepared_handoff(root)
            self.workflow.save_json_once(root / "evaluation.json", {"freshOod": {"count": 1}})
            with self.assertRaises((RuntimeError, FileNotFoundError)):
                experiment.seal()
            self.assertFalse((root / "experiment_complete.json").exists())

    def test_changed_live_reporting_pool_fails_before_inference(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            report = object.__new__(self.workflow.ReportingExperiment)
            report.run = root
            report.lock = {"images": [{"id": "approved"}]}
            report.reporting_rows = [{"id": "unreviewed"}]
            self.workflow.save_json_once(root / "reporting_lock.json", report.lock)
            with self.assertRaisesRegex(RuntimeError, "membership differs"):
                report.evaluate()
            self.assertFalse((root / "evaluation_started.json").exists())


class AuditGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_workflow()

    def run_converter_gate(self, dependencies, returncode):
        # Exercise the real decision block without creating a converter or
        # installing packages. Full reports remain available on rejection.
        nodes = ast.parse(inspect.getsource(self.workflow.prepare_converter)).body[0].body
        start = next(index for index, node in enumerate(nodes)
                     if isinstance(node, ast.Assign)
                     and any(isinstance(target, ast.Name) and target.id == "report" for target in node.targets))
        end = next(index for index, node in enumerate(nodes)
                   if isinstance(node, ast.FunctionDef) and node.name == "convert_saved_model")
        code = compile(ast.Module(body=nodes[start:end], type_ignores=[]), str(HELPER), "exec")
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            audit_path = root / "audit.json"
            audit_path.write_text(json.dumps({"dependencies": dependencies}), encoding="utf-8")
            namespace = {**vars(self.workflow), "audit_path": audit_path,
                         "converter_evidence": root, "audit": SimpleNamespace(returncode=returncode),
                         "canonicalize_name": lambda name: re.sub(r"[-_.]+", "-", name).lower()}
            failure = None
            with redirect_stdout(io.StringIO()):
                try:
                    exec(code, namespace)
                except RuntimeError as error:
                    failure = error
            summary = json.loads((root / "audit-summary.json").read_text(encoding="utf-8"))
            self.assertEqual(json.loads(audit_path.read_text(encoding="utf-8"))["dependencies"], dependencies)
            return summary, failure

    def known_findings(self):
        return [{"name": "setuptools", "version": "81.0.0", "vulns": [
                    {"id": "GHSA-h35f-9h28-mq5c", "aliases": ["CVE-2026-59890"]}]},
                {"name": "wheel", "version": "0.45.1", "vulns": [
                    {"id": "GHSA-8rrh-rw8j-w5fx", "aliases": ["CVE-2026-24049"]}]}]

    def test_known_operation_reviews_remain_unresolved(self):
        findings = self.known_findings()
        summary, failure = self.run_converter_gate(findings, 1)
        self.assertIsNone(failure)
        self.assertTrue(summary["executionAllowed"])
        self.assertEqual(summary["status"], "unresolved")
        self.assertEqual(summary["findings"], findings)
        self.assertEqual(len(summary["operationReviews"]), 2)

    def test_new_alias_version_skip_and_collection_failure_block(self):
        variants = []
        unknown = self.known_findings()
        unknown[0]["vulns"][0]["aliases"].append("UNREVIEWED-ADVISORY")
        variants.append((unknown, 1))
        changed_version = self.known_findings()
        changed_version[0]["version"] = "80.0.0"
        variants.append((changed_version, 1))
        variants.append((self.known_findings() + [{"name": "unknown", "skip_reason": "unavailable metadata"}], 1))
        variants.append((self.known_findings(), 2))
        variants.append(([], 0))
        for dependencies, returncode in variants:
            with self.subTest(dependencies=dependencies, returncode=returncode):
                summary, failure = self.run_converter_gate(dependencies, returncode)
                self.assertIsNotNone(failure)
                self.assertFalse(summary["executionAllowed"])

    def test_clean_collected_report_has_no_operation_exception(self):
        summary, failure = self.run_converter_gate([{"name": "example", "version": "1.0", "vulns": []}], 0)
        self.assertIsNone(failure)
        self.assertEqual(summary["status"], "passed")
        self.assertEqual(summary["operationReviews"], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)

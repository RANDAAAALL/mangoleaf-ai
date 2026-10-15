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
import re
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from types import SimpleNamespace
from unittest.mock import patch
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

    def test_helper_import_does_not_start_scientific_runtime(self):
        before = set(sys.modules)
        load_workflow()
        newly_loaded = set(sys.modules) - before
        self.assertFalse(any(name == "tensorflow" or name.startswith("tensorflow.")
                             for name in newly_loaded))

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

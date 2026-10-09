"""Check fresh experimental notebook contracts without Colab or model training.

Run with a Python environment containing nbformat, NumPy, Pillow, IPython,
ipykernel, jupyter-client, and Matplotlib. Selected helpers and a real local CPU
kernel are exercised, alongside local pip-less setup with a tiny fixture wheel.
Downloads, Colab setup, scientific package installation, and fitting never
execute. These checks test decisions and process isolation, not model accuracy.
"""

import ast
import contextlib
import hashlib
import io
import json
import math
import os
import random
import re
import subprocess
import sys
import tempfile
import uuid
import zipfile
from collections import deque
from pathlib import Path, PurePosixPath
from types import SimpleNamespace

import nbformat
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_DIR = ROOT / "notebooks" / "experiment" / "v4.4.0"
CLASS_NAMES = [
    "anthracnose",
    "bacterial_black_spot",
    "bacterial_canker",
    "healthy_fruit",
    "healthy_leaf",
    "mango_scab",
    "sooty_mold",
]


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def expect_error(action, error=ValueError):
    try:
        action()
    except error:
        return
    raise AssertionError("The invalid fixture was unexpectedly accepted.")


def read_notebook(filename):
    path = NOTEBOOK_DIR / filename
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    identities = [cell.id for cell in notebook.cells]
    check(len(identities) == len(set(identities)), "Notebook cell IDs repeat.")
    code = []
    markdown = []
    for cell in notebook.cells:
        if cell.cell_type == "code":
            check(cell.execution_count is None and not cell.outputs, "A clean template contains execution evidence.")
            # Only the explicit isolated-execution marker is removed for AST
            # checks. The visible cell remains executable through Colab/IPython.
            source = cell.source
            if len(code) >= 2:
                check(source.startswith("%%mangoleaf\n"), "A scientific cell bypasses the isolated kernel.")
                source = source.split("\n", 1)[1]
            else:
                check(not source.startswith("%%"), "The setup cell must execute in Colab.")
            compile(source, str(path), "exec")
            code.append(source)
        elif cell.cell_type == "markdown":
            markdown.append(cell.source)
    steps = [cell for cell in markdown if re.search(r"^## Step \d+:", cell, re.M)]
    numbers = [int(re.search(r"^## Step (\d+):", cell, re.M).group(1)) for cell in steps]
    check(numbers == list(range(1, len(numbers) + 1)), "Steps are missing, repeated, or out of order.")
    for cell in steps:
        for label in ("What", "Why", "How", "Expected result"):
            check(re.search(r"\*\*" + label + r"(?: [^:*\n]+)?:\*\*", cell),
                  "A numbered step lacks its explanation: " + label)
    prose = "\n".join(markdown)
    check(not re.search(r"\b(?:you|your|assistant|subagent)\b", prose, re.I), "Persisted prose addresses a person or agent.")
    check("V4.4.0 Seven Class" in prose, "The new experimental title is missing.")
    return {"path": path, "code": code, "markdown": markdown, "stepCount": len(steps)}


def extract_functions(notebook, names, namespace=None):
    namespace = dict(namespace or {})
    found = set()
    for source in notebook["code"]:
        body = [
            node
            for node in ast.parse(source).body
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names
        ]
        found.update(node.name for node in body)
        if body:
            exec(compile(ast.Module(body=body, type_ignores=[]), str(notebook["path"]), "exec"), namespace)
    check(found == set(names), "Missing helper contracts: " + str(set(names) - found))
    return namespace


def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def check_thresholds(notebook):
    names = {
        "assign_whole_groups", "probability_stats", "accepted", "select_thresholds",
        "scored_records", "classification_metrics", "summarize_mango", "summarize_ood",
    }
    functions = extract_functions(notebook, names, {
        "math": math, "random": random, "CLASS_NAMES": CLASS_NAMES,
    })
    stats = functions["probability_stats"]([
        [1, 0, 0, 0, 0, 0, 0],
        [1 / 7] * 7,
        [0.8, 0.1, 0.02, 0.02, 0.02, 0.02, 0.02],
    ])
    check(stats[0]["confidence"] == 1 and stats[0]["margin"] == 1 and stats[0]["entropy"] == 0,
          "A certain prediction has incorrect rejection statistics.")
    check(math.isclose(stats[1]["entropy"], 1) and stats[1]["margin"] == 0,
          "Uniform probabilities must have maximum normalized entropy.")
    check(math.isclose(stats[2]["margin"], 0.7), "Margin is not the difference between the top two classes.")
    for invalid in ([[0.5] * 7], [[1, 2, 3]], [[float("nan")] + [0] * 6]):
        expect_error(lambda invalid=invalid: functions["probability_stats"](invalid))

    gates = {"confidenceThreshold": 0.7, "marginThreshold": 0.2, "entropyThreshold": 0.4}
    boundary = {"confidence": 0.7, "margin": 0.2, "entropy": 0.4}
    check(functions["accepted"](boundary, gates), "Inclusive gate boundaries were rejected.")
    for key, value in (("confidence", 0.699), ("margin", 0.199), ("entropy", 0.401)):
        check(not functions["accepted"]({**boundary, key: value}, gates), "One failed gate must reject the photo.")

    # The fixture makes the best feasible setting independently predictable.
    mango = [{"confidence": 0.8, "margin": 0.3, "entropy": 0.2}] * 20
    ood = [{"confidence": 0.9, "margin": 0.3, "entropy": 0.6}] * 100
    chosen, search = functions["select_thresholds"](mango, ood, [0, 0.2, 0.4, 0.6, 1], 0.7, 0.95)
    check(chosen == {"confidenceThreshold": 0.7, "marginThreshold": 0, "entropyThreshold": 0.4},
          "The search did not choose the best feasible permissive gate.")
    check(len(search) == 25, "The two-dimensional search omitted candidates.")
    infeasible, _ = functions["select_thresholds"](
        [{"confidence": 0.6, "margin": 0.3, "entropy": 0.2}] * 20, ood, [0, 1], 0.7, 0.95,
    )
    check(infeasible is None, "An infeasible retention target created a candidate.")
    expect_error(lambda: functions["select_thresholds"](mango, ood, [], 0.7, 0.95))

    groups = {"a": list(range(70)), "b": list(range(30)), "c": list(range(50)), "d": list(range(50))}
    picked = functions["assign_whole_groups"](groups, 100, 42)
    check(sum(len(groups[key]) for key in picked) == 100, "The OOD tuning target is not exact.")
    check(picked == functions["assign_whole_groups"](groups, 100, 42), "A fixed seed changed OOD membership.")
    check(sum(len(groups[key]) for key in set(groups) - picked) == 100, "The reporting target is not exact.")
    expect_error(lambda: functions["assign_whole_groups"]({"inseparable": list(range(200))}, 100, 42))

    # Rejection lowers recall using the full true-class count, not only accepted photos.
    scored = [
        {"actualClass": "anthracnose", "rawPredictedClass": "anthracnose", "displayedClass": "anthracnose", "accepted": True},
        {"actualClass": "anthracnose", "rawPredictedClass": "anthracnose", "displayedClass": "rejected", "accepted": False},
        {"actualClass": "mango_scab", "rawPredictedClass": "anthracnose", "displayedClass": "anthracnose", "accepted": True},
    ]
    report = functions["summarize_mango"](scored)
    check(report["total"] == 3 and report["accepted"] == 2 and report["rejected"] == 1, "Mango denominator lost a photo.")
    check(math.isclose(report["rawAccuracy"], 2 / 3), "Raw accuracy changed after rejection.")
    check(math.isclose(report["correctAcceptedFractionOfAllPhotos"], 1 / 3), "Full-set correctness excluded rejections.")
    check(report["acceptedOnlyAccuracy"] == 0.5, "Accepted-only accuracy uses the wrong denominator.")
    anthracnose = report["rejectionAwarePerClassMetrics"][0]
    check(anthracnose["support"] == 2 and anthracnose["recall"] == 0.5 and anthracnose["precision"] == 0.5,
          "Rejection-aware per-class metrics conceal a rejected mango.")
    check(sum(map(sum, report["rejectionAwareConfusionMatrix"])) == 3, "The rejection matrix lost a photo.")
    check(functions["summarize_ood"]([{"accepted": True}, {"accepted": False}])["falseAcceptRate"] == 0.5,
          "OOD false accepts use the wrong denominator.")


def check_evidence(notebook):
    functions = extract_functions(notebook, {"inside", "verify_artifacts", "read_selection_lock"}, {
        "Path": Path, "PurePosixPath": PurePosixPath, "sha256_file": file_hash,
        "read_json": lambda path: json.loads(Path(path).read_text(encoding="utf-8")),
    })
    with tempfile.TemporaryDirectory(prefix="mangoleaf-v440-") as directory:
        root = Path(directory)
        run = root / "training"
        run.mkdir()
        model = run / "model_calibrated.keras"
        model.write_bytes(b"synthetic model contract, never deserialized")
        for unsafe in ("../outside", "/absolute", "C:/outside", "folder\\outside", "."):
            expect_error(lambda unsafe=unsafe: functions["inside"](run, unsafe))
        check(functions["inside"](run, "ordinary/file.json") == (run / "ordinary" / "file.json").resolve(),
              "An ordinary manifest path was rejected.")
        complete = {"artifacts": {model.name: {"bytes": model.stat().st_size, "sha256": file_hash(model)}}}
        complete_path = run / "training_complete.json"
        complete_path.write_text(json.dumps(complete), encoding="utf-8")
        functions.update(TRAINING_RUN=run, COMPLETE_PATH=complete_path, COMPLETE_HASH=file_hash(complete_path), complete=complete)
        functions["verify_artifacts"]()
        model.write_bytes(b"altered model")
        expect_error(functions["verify_artifacts"], RuntimeError)
        model.write_bytes(b"synthetic model contract, never deserialized")
        complete_path.write_text("{}", encoding="utf-8")
        expect_error(functions["verify_artifacts"], RuntimeError)

        fitting = root / "fitting"
        fitting.mkdir()
        selected = {
            "status": "feasible", "evaluationInputsSha256": "frozen-inputs",
            "trainingCompleteSha256": "frozen-training", "modelSha256": file_hash(model),
        }
        selection_path = fitting / "selection.json"
        selection_path.write_text(json.dumps(selected), encoding="utf-8")
        selected_hash = file_hash(selection_path)
        lock_path = fitting / "selection_lock.json"
        lock_path.write_text(json.dumps({"selectionSha256": selected_hash}), encoding="utf-8")
        functions.update(RUN_DIR=fitting, SELECTION_PATH=selection_path, SELECTION_HASH=selected_hash,
                         INPUT_HASH="frozen-inputs", COMPLETE_HASH="frozen-training")
        check(functions["read_selection_lock"]() == selected, "The valid selection lock was rejected.")
        selection_path.write_text(json.dumps({**selected, "status": "infeasible"}), encoding="utf-8")
        expect_error(functions["read_selection_lock"], RuntimeError)


def check_runtime_audit(notebook):
    functions = extract_functions(notebook, {"runtime_audit", "runtime_write_json_once"}, {"Path": Path, "json": json})
    fixtures = [
        (0, {"dependencies": [{"name": "clean", "vulns": []}]}, True),
        (0, {"dependencies": [{"name": "affected", "version": "1.0", "vulns": [{"id": "synthetic-advisory"}]}]}, False),
        (0, {"dependencies": [{"name": "skipped", "skip_reason": "unresolved", "vulns": []}]}, False),
        (0, {"dependencies": []}, False),
        (2, {"dependencies": [{"name": "clean", "vulns": []}]}, False),
        (2, None, False),
        (0, {"dependencies": ["malformed"]}, False),
        (0, [], False),
    ]
    for return_code, report, should_pass in fixtures:
        with tempfile.TemporaryDirectory(prefix="mangoleaf-audit-") as directory:
            def fake_run(command, **_kwargs):
                if report is not None:
                    Path(command[command.index("--output") + 1]).write_text(json.dumps(report), encoding="utf-8")
                return SimpleNamespace(returncode=return_code, stdout="fixture", stderr="")
            functions["subprocess"] = SimpleNamespace(run=fake_run)
            action = lambda: functions["runtime_audit"]("unused-python", Path(directory), "fixture")
            if should_pass:
                with contextlib.redirect_stdout(io.StringIO()):
                    action()
            else:
                with contextlib.redirect_stdout(io.StringIO()):
                    expect_error(action, RuntimeError)
        # Provider findings are still recorded when they are outside the worker
        # gate. Changing scope must not turn an incomplete report into a pass.
        with tempfile.TemporaryDirectory(prefix="mangoleaf-host-audit-") as directory:
            functions["subprocess"] = SimpleNamespace(run=fake_run)
            with contextlib.redirect_stdout(io.StringIO()):
                summary = functions["runtime_audit"]("unused-python", Path(directory), "host", paths=["provider-site"], enforce=False)
            check(summary["status"] == ("passed" if should_pass else "unresolved"),
                  "The provider audit lost its unresolved status.")
            if report and isinstance(report, dict) and any(row.get("vulns") for row in report.get("dependencies", []) if isinstance(row, dict)):
                check(summary["findings"], "Host advisories were hidden.")

    reviewed_finding = {"name": "setuptools", "version": "81.0.0", "vulns": [{"id": "GHSA-h35f-9h28-mq5c", "aliases": ["CVE-2026-59890", "PYSEC-2026-3447", "BIT-setuptools-2026-59890"]}]}
    unpack_finding = {"name": "wheel", "version": "0.45.1", "vulns": [{"id": "GHSA-8rrh-rw8j-w5fx", "aliases": ["CVE-2026-24049"]}]}
    review_fixtures = [
        ("converter", 1, [reviewed_finding], True),
        ("training", 1, [reviewed_finding], False),
        ("converter", 2, [reviewed_finding], False),
        ("converter", 1, [reviewed_finding, {"name": "missing", "skip_reason": "unresolved"}], False),
        ("converter", 1, [reviewed_finding, {"name": "other", "version": "1", "vulns": [{"id": "unreviewed"}]}], False),
        ("converter", 1, [{**reviewed_finding, "version": "80.0.0"}], False),
        ("converter", 1, [{**reviewed_finding, "vulns": [{"id": "unreviewed", "aliases": ["CVE-2026-59890"]}]}], False),
        ("converter", 1, [reviewed_finding, unpack_finding], True),
        ("training", 1, [unpack_finding], False),
        ("converter", 1, [{**unpack_finding, "version": "0.46.1"}], False),
    ]
    for name, return_code, dependencies, should_pass in review_fixtures:
        with tempfile.TemporaryDirectory(prefix="mangoleaf-operation-review-") as directory:
            def fake_review_run(command, **_kwargs):
                Path(command[command.index("--output") + 1]).write_text(json.dumps({"dependencies": dependencies}), encoding="utf-8")
                return SimpleNamespace(returncode=return_code, stdout="fixture", stderr="")
            functions["subprocess"] = SimpleNamespace(run=fake_review_run)
            action = lambda: functions["runtime_audit"]("unused-python", Path(directory), name, converter_build_review=True)
            with contextlib.redirect_stdout(io.StringIO()):
                if should_pass:
                    summary = action()
                    check(summary["status"] == "unresolved" and summary["findings"] and summary["operationReviews"],
                          "A reviewed build-only finding was incorrectly cleared.")
                    check(summary["executionAllowed"], "The documented converter operation was blocked.")
                else:
                    expect_error(action, RuntimeError)


def check_nested_runtime_logs(notebook):
    """Point a subprocess failure at its actual child log, with safe fallback."""
    functions = extract_functions(notebook, {"runtime_run_checked"}, {
        "Path": Path, "subprocess": subprocess,
    })
    prefix = "RuntimeError: Runtime preparation stopped. Inspect the saved diagnostic log: "
    with tempfile.TemporaryDirectory(prefix="mangoleaf-nested-log-") as directory:
        root = Path(directory)
        evidence = root / "evidence"
        evidence.mkdir()
        child = evidence / "converter.log"
        child.write_text("specific converter failure\n", encoding="utf-8")
        outside = root / "unrelated.log"
        outside.write_text("unrelated diagnostic\n", encoding="utf-8")
        cases = [
            (prefix + str(child), child),
            (prefix + str(evidence / "missing.log"), None),
            (prefix + str(outside), None),
            ("RuntimeError: GPU operation failed after conversion", None),
        ]
        for index, (failure, expected) in enumerate(cases):
            outer = evidence / ("outer-" + str(index) + ".log")
            command = [sys.executable, "-c", "import sys\nprint('Runtime check: converter.log')\nsys.stderr.write(" + repr(failure + "\n") + ")\nsys.exit(1)"]
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    functions["runtime_run_checked"](command, outer)
            except RuntimeError as error:
                check(str(error).endswith(str(expected or outer)),
                      "A nested failure selected the wrong diagnostic log.")
            else:
                raise AssertionError("A failed subprocess unexpectedly continued.")
            check(failure in outer.read_text(), "The original failure log was lost.")


def check_tools_bootstrap(notebook):
    """Exercise pip-less setup with real local venv and pip, without downloads."""
    import importlib.metadata
    import importlib.util

    # Simulate the provider's failing pip seed inside a real venv subprocess.
    # Its ordinary environment creation and the subsequent pip install are real.
    provider_venv = (
        "import sys, venv\n"
        "def unavailable(*args, **kwargs):\n"
        "    raise RuntimeError('ensurepip is unavailable in the provider fixture')\n"
        "venv.EnvBuilder._setup_pip = unavailable\n"
        "venv.main(sys.argv[1:])\n"
    )

    def provider_run(command, **options):
        if command[:3] == [sys.executable, "-m", "venv"]:
            command = [sys.executable, "-c", provider_venv, *command[3:]]
        return subprocess.run(command, **options)

    functions = extract_functions(notebook, {
        "runtime_prepare_tools", "runtime_run_checked", "runtime_clean_environment",
    }, {"Path": Path, "sys": sys, "os": os,
        "subprocess": SimpleNamespace(run=provider_run)})
    inventory_before = sorted((dist.metadata.get("Name"), dist.version)
                              for dist in importlib.metadata.distributions())
    paths_before = list(sys.path)
    environment = functions["runtime_clean_environment"]()
    # Never reach a registry or use a cached package to satisfy this fixture.
    environment.update(PIP_NO_INDEX="1", PIP_NO_CACHE_DIR="1", PIP_DISABLE_PIP_VERSION_CHECK="1")

    with tempfile.TemporaryDirectory(prefix="mangoleaf-bootstrap-") as directory:
        root = Path(directory)
        failed = provider_run([sys.executable, "-m", "venv", str(root / "old-setup")],
                              capture_output=True, text=True, env=environment)
        check(failed.returncode != 0 and "ensurepip is unavailable" in failed.stderr,
              "The provider fixture did not reproduce the old startup failure.")

        # A tiny synthetic wheel proves installation reaches the empty target
        # interpreter. It supplies no experiment library or model prediction.
        package = "mangoleaf_bootstrap_fixture"
        wheel = root / (package + "-1.0-py3-none-any.whl")
        metadata = package + "-1.0.dist-info/"
        files = {
            package + ".py": "VALUE = 'isolated install'\n",
            metadata + "METADATA": "Metadata-Version: 2.1\nName: mangoleaf-bootstrap-fixture\nVersion: 1.0\n",
            metadata + "WHEEL": "Wheel-Version: 1.0\nGenerator: regression-fixture\nRoot-Is-Purelib: true\nTag: py3-none-any\n",
        }
        files[metadata + "RECORD"] = "".join(name + ",,\n" for name in [*files, metadata + "RECORD"])
        with zipfile.ZipFile(wheel, "w") as archive:
            for name, content in files.items():
                archive.writestr(name, content)
        functions["TOOL_PACKAGES"] = (str(wheel),)
        evidence = root / "evidence"
        evidence.mkdir()
        with contextlib.redirect_stdout(io.StringIO()):
            interpreter = functions["runtime_prepare_tools"](root / "repaired", evidence, environment)
        probe = subprocess.run([str(interpreter), "-I", "-c",
                                "import sys, importlib.util, mangoleaf_bootstrap_fixture as fixture; "
                                "assert sys.prefix != sys.base_prefix; "
                                "assert fixture.VALUE == 'isolated install'; "
                                "assert importlib.util.find_spec('pip') is None; print(sys.prefix)"],
                               capture_output=True, text=True, env=environment)
        check(probe.returncode == 0, "Targeted installation into the pip-less environment failed: " + probe.stderr)
        check(Path(probe.stdout.strip()).samefile(root / "repaired" / "tools"),
              "The fixture used the provider interpreter instead of its target.")
        check(importlib.util.find_spec(package) is None, "The fixture package leaked into the host.")
        check("Successfully installed" in (evidence / "tools-package-setup.log").read_text(),
              "Successful installation diagnostics were not preserved.")

        # Installation failures must still stop setup and retain their log.
        functions["TOOL_PACKAGES"] = (str(root / "missing-1.0-py3-none-any.whl"),)
        failed_evidence = root / "failed-evidence"
        failed_evidence.mkdir()
        with contextlib.redirect_stdout(io.StringIO()):
            expect_error(lambda: functions["runtime_prepare_tools"](
                root / "failed-install", failed_evidence, environment), RuntimeError)
        check("ERROR" in (failed_evidence / "tools-package-setup.log").read_text(),
              "The failed installation lost its diagnostic output.")

    inventory_after = sorted((dist.metadata.get("Name"), dist.version)
                             for dist in importlib.metadata.distributions())
    check(inventory_after == inventory_before and sys.path == paths_before,
          "Bootstrap modified provider package versions or import paths.")


def check_isolated_kernel(notebook):
    """Exercise a real local kernel, using tiny CPU cells rather than training."""
    from queue import Empty

    from IPython.display import clear_output, display
    from jupyter_client import KernelManager
    from jupyter_client.kernelspec import KernelSpecManager

    functions = extract_functions(notebook, {
        "NotebookKernel", "notebook_kernel_launcher", "runtime_clean_environment",
    }, {
        "Path": Path, "json": json, "os": os, "sys": sys, "Empty": Empty, "uuid": uuid,
        "KernelManager": KernelManager, "KernelSpecManager": KernelSpecManager,
        "display": display, "clear_output": clear_output,
    })
    before_paths = list(sys.path)
    with tempfile.TemporaryDirectory(prefix="mangoleaf-kernel-") as directory:
        folder = Path(directory)
        # The worker receives a malicious host import path; -I must ignore it.
        (folder / "host_only_marker.py").write_text("SHOULD_NOT_IMPORT = True\n", encoding="utf-8")
        environment = functions["runtime_clean_environment"]()
        environment["PYTHONPATH"] = str(folder)
        # Colab profiles select a provider-only kernel class. Python -I alone
        # does not prevent IPython from loading those configuration files.
        provider = folder / "provider-ipython"
        profile = provider / "profile_default"
        startup = profile / "startup"
        startup.mkdir(parents=True)
        marker = folder / "provider-started.txt"
        configuration = profile / "ipython_kernel_config.py"
        configuration.write_text(
            "from pathlib import Path\n"
            "Path(" + repr(str(marker)) + ").write_text('provider config loaded')\n"
            "c.IPKernelApp.kernel_class = 'google.colab._kernel.Kernel'\n"
            "c.IPKernelApp.extensions = ['google.colab']\n", encoding="utf-8")
        (startup / "00-provider.py").write_text(
            "from pathlib import Path\n"
            "Path(" + repr(str(marker)) + ").write_text('provider startup loaded')\n",
            encoding="utf-8")
        environment["IPYTHONDIR"] = str(provider)
        environment_before = dict(environment)
        configuration_before = configuration.read_bytes()

        # System configuration/startup directories are searched separately
        # from IPYTHONDIR. Give the real child those paths without changing
        # any installed library or the machine's real system configuration.
        system = folder / "provider-system"
        (system / "startup").mkdir(parents=True)
        (system / configuration.name).write_bytes(configuration_before)
        (system / "startup" / "00-provider.py").write_bytes((startup / "00-provider.py").read_bytes())

        class ProviderConfiguredKernelManager(KernelManager):
            def format_kernel_cmd(self, extra_arguments=None):
                command = super().format_kernel_cmd(extra_arguments)
                setup = (
                    "import sys, runpy\n"
                    "import IPython.core.application as application\n"
                    "import IPython.core.shellapp as shellapp\n"
                    "application.ENV_CONFIG_DIRS = shellapp.ENV_CONFIG_DIRS = ["
                    + repr(str(system)) + "]\n"
                    "application.SYSTEM_CONFIG_DIRS = shellapp.SYSTEM_CONFIG_DIRS = []\n"
                    "sys.argv = sys.argv[1:]\n"
                    "runpy.run_path(sys.argv[0], run_name='__main__')\n"
                )
                return [*command[:2], "-c", setup, *command[2:]]

        functions["KernelManager"] = ProviderConfiguredKernelManager
        worker = functions["NotebookKernel"](sys.executable, folder, environment)
        captured = io.StringIO()
        rendered = []
        functions["display"] = lambda data, **kwargs: rendered.append((data, kwargs))
        try:
            with contextlib.redirect_stdout(captured), contextlib.redirect_stderr(captured):
                worker.execute("import os, sys, importlib.util\nassert sys.prefix != sys.base_prefix\nassert sys.flags.isolated\nassert importlib.util.find_spec('host_only_marker') is None\nstate = 41\nprint('first', state)")
                worker.execute("state += 1\nprint('second', state)")
                worker.execute("from ipykernel.ipkernel import IPythonKernel\nassert type(get_ipython().kernel) is IPythonKernel\nassert 'google.colab' not in sys.modules")
                expect_error(lambda: worker.execute("raise ValueError('review gate fixture')\nstate = -1"), RuntimeError)
                # An intentional review stop must preserve earlier variables.
                worker.execute("assert state == 42\nprint('retained', state)\nget_ipython().run_line_magic('matplotlib', 'inline')\nimport matplotlib.pyplot as plt\nplt.plot([0, 1], [0, 1])\nplt.show()")
            output = captured.getvalue()
            check("first 41" in output and "second 42" in output and "retained 42" in output,
                  "The isolated process lost state or stdout between cells.")
            check("review gate fixture" in output, "The worker traceback was hidden.")
            check(any("image/png" in data for data, _kwargs in rendered), "Figure output did not reach the notebook.")
            check(before_paths == sys.path, "Isolated execution modified host import paths.")
            check(not marker.exists(), "The worker executed provider configuration or startup code.")
            check(environment == environment_before and configuration.read_bytes() == configuration_before,
                  "Kernel startup altered provider settings instead of isolating them.")
        finally:
            worker.close()
        check(not worker.manager.is_alive(), "A worker remained alive after cleanup.")
        expect_error(lambda: worker.execute("print('unavailable')"), RuntimeError)

        # A genuinely failing child must leave readable startup diagnostics
        # and stop its channels, rather than only reporting kernel_info death.
        failed_managers = []

        class FailingKernelManager(KernelManager):
            def format_kernel_cmd(self, extra_arguments=None):
                return [sys.executable, "-I", "-c",
                        "import sys; sys.stderr.write('startup failure fixture\\n'); sys.exit(1)"]

            def blocking_client(self):
                self.fixture_client = super().blocking_client()
                return self.fixture_client

        def failing_manager(**kwargs):
            manager = FailingKernelManager(**kwargs)
            failed_managers.append(manager)
            return manager

        functions["KernelManager"] = failing_manager
        try:
            functions["NotebookKernel"](sys.executable, folder, environment)
        except RuntimeError as error:
            prefix = "The isolated kernel could not start. Inspect its local startup log: "
            check(str(error).startswith(prefix), "Startup failure did not identify its diagnostic log.")
            log = Path(str(error)[len(prefix):])
            check(log.is_relative_to(folder) and "startup failure fixture" in log.read_text(),
                  "The original startup error was lost or saved outside local runtime storage.")
        else:
            raise AssertionError("The failing kernel unexpectedly started.")
        check(not failed_managers[0].is_alive() and not failed_managers[0].fixture_client.channels_running,
              "A failed startup left its process or communication channels running.")


def check_probe_source(notebook):
    """Check source extraction used to write the real isolated export probe."""
    import inspect
    from IPython.core.interactiveshell import InteractiveShell

    shell = InteractiveShell.instance()
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        result = shell.run_cell(notebook["code"][0], store_history=True)
    check(result.success, "The helper definition cell failed in IPython.")
    names = ("runtime_write_json_once", "runtime_package_versions", "runtime_clean_environment", "runtime_run_checked", "runtime_conversion_probe")
    probe = "import hashlib, importlib.metadata, json, os, subprocess, sys\nfrom pathlib import Path\n"
    for name in names:
        probe += "\n" + inspect.getsource(shell.user_ns[name])
    compile(probe, "isolated-export-probe.py", "exec")
    tree = ast.parse(probe)
    check(any(isinstance(node, ast.FunctionDef) and node.name == "runtime_conversion_probe" for node in tree.body),
          "The isolated probe lost its conversion check.")


def check_illustrations_and_light(notebook):
    functions = extract_functions(notebook, {"illustration_mask", "stable_seed", "add_local_light"}, {
        "np": np, "deque": deque, "hashlib": hashlib, "random": random,
        "SEED": 42, "LOCAL_LIGHT_PROBABILITY": 0.3,
        "IMAGE_SIZE": (224, 224),
        "LIGHT_RADIUS": (0.18, 0.35), "LIGHT_AMPLITUDE": (18, 40),
    })
    pixels = np.full((224, 224, 3), 255, dtype=np.float32)
    pixels[40:184, 40:184] = (60, 120, 40)
    pixels[95:105, 95:105] = 255
    original = pixels.copy()
    mask = functions["illustration_mask"](pixels)
    check(mask.shape == (224, 224) and set(np.unique(mask)) <= {0, 1}, "The illustration mask is not binary.")
    check(mask[0, 0] == 0 and mask[50, 50] == 1 and mask[100, 100] == 1,
          "Border flood-fill removed specimen pixels or an enclosed light area.")
    check(np.array_equal(original, pixels), "Mask proposals changed original pixels.")

    sample = np.full((224, 224, 3), 120, dtype=np.float32)
    highlight = functions["add_local_light"](sample, "synthetic", 1, force=1)
    shadow = functions["add_local_light"](sample, "synthetic", 1, force=-1)
    check(np.all(highlight >= sample) and np.all(shadow <= sample), "Highlight/shadow directions are reversed.")
    check(18 <= float((highlight - sample).max()) <= 40.001, "Localized light amplitude escaped its range.")
    check(np.allclose(highlight - sample, sample - shadow), "The two signs changed the sampled light geometry.")
    check(np.array_equal(highlight, functions["add_local_light"](sample, "synthetic", 1, force=1)),
          "A stable example key/epoch produced a different light patch.")
    check(np.all(sample == 120), "A light transformation mutated original pixels.")
    for extreme, sign in ((255, 1), (0, -1)):
        result = functions["add_local_light"](np.full_like(sample, extreme), "synthetic", 1, force=sign)
        check(np.isfinite(result).all() and result.min() >= 0 and result.max() <= 255, "Light clipping failed.")

    reviewed = None
    for source in notebook["code"]:
        for node in ast.parse(source).body:
            if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "REVIEWED_IMAGES" for target in node.targets):
                reviewed = ast.literal_eval(node.value)
    check(reviewed is not None and len(reviewed) == len({row["sha256"] for row in reviewed}) == 62,
          "Known nonduplicate identities are missing or repeated.")
    check(sum(row["currentName"] == "DSC_0205.JPG" for row in reviewed) == 1,
          "The reviewed DSC_0205.JPG identity is not unique.")


def check_mango_groups(notebook):
    assign = extract_functions(notebook, {"assign_mango_groups"}, {"np": np})["assign_mango_groups"]
    groups = {
        label + "-" + str(group_index): [
            {"label": label, "id": label + "-" + str(group_index) + "-" + str(photo_index)}
            for photo_index in range(5)
        ]
        for label in CLASS_NAMES
        for group_index in range(20)
    }
    reserved = {label + "-0" for label in CLASS_NAMES}
    assignments, counts = assign(groups, CLASS_NAMES, reserved, 42)
    check(set(assignments) == set(groups), "Fresh mango assignment lost a related-photo group.")
    check(set(assignments.values()) == {"train", "val", "test"}, "The split lacks a subset.")
    check(all(assignments[key] == "val" for key in reserved), "An illustration group escaped validation.")
    check(np.array_equal(counts, np.array([[70] * 7, [15] * 7, [15] * 7])),
          "A feasible grouped fixture did not reach 70/15/15 per class.")
    repeated, repeated_counts = assign(dict(reversed(list(groups.items()))), CLASS_NAMES, reserved, 42)
    check(assignments == repeated and np.array_equal(counts, repeated_counts),
          "Membership depends on inventory order rather than the recorded seed.")
    photo_subsets = {subset: set() for subset in ("train", "val", "test")}
    for group, subset in assignments.items():
        photo_subsets[subset].update(row["id"] for row in groups[group])
    check(not (photo_subsets["train"] & photo_subsets["val"] or photo_subsets["train"] & photo_subsets["test"]
               or photo_subsets["val"] & photo_subsets["test"]), "Photo membership overlaps.")
    expect_error(lambda: assign(groups, CLASS_NAMES, {"missing-group"}, 42))
    inseparable = {label: [{"label": label, "id": label + str(index)} for index in range(10)] for label in CLASS_NAMES}
    expect_error(lambda: assign(inseparable, CLASS_NAMES, set(), 42), RuntimeError)


def check_export_recovery(notebook):
    # Run only the recovery branch with a fake model loader and tiny saved files.
    # This proves fresh-session state restoration without deserializing a model.
    functions = extract_functions(notebook, {"file_sha256", "read_json", "safe_child", "verify_image_rows", "predict_records"}, {
        "Path": Path, "PurePosixPath": PurePosixPath, "hashlib": hashlib, "json": json,
    })
    recovery = None
    for source in notebook["code"]:
        for node in ast.walk(ast.parse(source)):
            if isinstance(node, ast.If) and "export_only" in ast.unparse(node.test):
                recovery = compile(ast.Module(body=node.body, type_ignores=[]), str(notebook["path"]), "exec")
    check(recovery is not None, "The explicit export recovery branch is missing.")

    with tempfile.TemporaryDirectory(prefix="mangoleaf-recovery-") as directory:
        root = Path(directory)
        output = root / "training"
        run = output / "fresh-run"
        scenes = root / "scenes"
        scenes.mkdir(parents=True)
        dataset = run / "dataset"
        dataset.mkdir(parents=True)

        def save(relative, value):
            path = run / relative
            path.write_text(json.dumps(value), encoding="utf-8")

        images = []
        for subset in ("train", "val", "test"):
            for label in CLASS_NAMES:
                relative = subset + "-" + label + ".jpg"
                path = dataset / relative
                path.write_bytes(relative.encode())
                images.append({"id": relative, "subset": subset, "label": label,
                               "relativePath": relative, "sha256": file_hash(path)})
        scene = scenes / "scene.jpg"
        scene.write_bytes(b"reviewed scene fixture")
        model = run / "model_selected.keras"
        model.write_bytes(b"model placeholder, never deserialized")
        runtime = {"distributions": {"tensorflow": "fixture", "keras": "fixture"}}
        save("runtime.json", runtime)
        save("input_manifest.json", {"images": images})
        save("plan.json", {"classNames": CLASS_NAMES, "experimentVersion": "v4.4.0"})
        selected = [row for row in images if row["subset"] == "val"]
        save("example_selection.json", {"images": [{"id": row["id"]} for row in selected]})
        save("training_history.json", [{"epoch": index} for index in range(1, 16)])
        save("scene_review.json", {"approvedIds": ["scene-id"]})
        save("scene_inventory.json", {"images": [{"id": "scene-id", "sourceRelativePath": "scene.jpg", "sha256": file_hash(scene)}]})
        save("training_state.json", {"artifacts": {model.name: {"sha256": file_hash(model)}}})

        loads = []
        def fake_load(path, **options):
            loads.append((Path(path), options))
            return "synthetic loaded model"

        functions.update(
            RECOVER_TRAINING_RUN=str(run), OUTPUT_ROOT=output, BACKGROUND_INPUT=scenes,
            RUNTIME=runtime, EXPERIMENT_VERSION="v4.4.0", CLASS_NAMES=CLASS_NAMES,
            tf=SimpleNamespace(keras=SimpleNamespace(models=SimpleNamespace(load_model=fake_load))),
        )
        exec(recovery, functions)
        check(len(functions["val_rows"]) == 7 and len(functions["example_rows"]) == 7,
              "Recovery did not restore unaugmented validation/example rows.")
        check(len(functions["training_history"]) == 15 and len(functions["approved_scenes"]) == 1,
              "Recovery lost training history or approved figure scenes.")
        check(loads[0][1] == {"compile": False, "safe_mode": True}, "Recovery loosened trusted model loading.")
        scene.write_bytes(b"changed scene fixture")
        expect_error(lambda: exec(recovery, functions), RuntimeError)
        scene.write_bytes(b"reviewed scene fixture")
        model.write_bytes(b"changed model fixture")
        expect_error(lambda: exec(recovery, functions), RuntimeError)


def check_image_loading(notebook):
    """Decode real fixtures with Pillow and check TensorFlow backend selection.

    The tiny TensorFlow adapter records routing and resize arguments. It does
    not claim to run TensorFlow's decoder, interpolation, or model inference.
    """
    from PIL import Image, ImageOps, UnidentifiedImageError

    native_calls = []

    class Tensor(np.ndarray):
        def numpy(self):
            return np.asarray(self)

        def set_shape(self, shape):
            check(shape == (None, None, 3), "The native decoder's channel shape changed.")

    def as_tensor(value, dtype=None):
        return np.asarray(value, dtype=dtype).view(Tensor)

    def native_decode(content, channels, expand_animations):
        native_calls.append(content)
        check(channels == 3 and expand_animations is False, "Native decoding options changed.")
        with Image.open(io.BytesIO(content)) as picture:
            if picture.format == "WEBP":
                raise RuntimeError("The native-decoder fixture does not support WebP.")
            return as_tensor(picture.convert("RGB"), np.uint8)

    def resize(pixels, size, method, antialias):
        check(size == (224, 224) and method == "bilinear" and antialias is False,
              "The existing resize contract changed.")
        check(np.asarray(pixels).shape == (224, 224, 3), "Unexpected fixture dimensions.")
        return as_tensor(pixels, np.float32)

    backend = SimpleNamespace(
        uint8=np.uint8, float32=np.float32, convert_to_tensor=as_tensor, cast=as_tensor,
        io=SimpleNamespace(read_file=lambda path: Path(path).read_bytes(), decode_image=native_decode),
        image=SimpleNamespace(resize=resize),
    )
    available = {node.name for source in notebook["code"] for node in ast.parse(source).body
                 if isinstance(node, ast.FunctionDef)}
    names = {"load_pixels"} | ({"raw_rgb", "has_webp_content"} & available)
    functions = extract_functions(notebook, names, {
        "Path": Path, "Image": Image, "ImageOps": ImageOps, "np": np,
        "tf": backend, "IMAGE_SIZE": (224, 224),
    })
    with tempfile.TemporaryDirectory(prefix="mangoleaf-image-format-") as directory:
        root = Path(directory)
        original = np.zeros((224, 224, 3), dtype=np.uint8)
        original[:100, :, :] = (25, 140, 65)
        original[100:, :, :] = (190, 70, 35)
        webp = root / "misnamed.jpg"
        Image.fromarray(original).save(webp, format="WEBP", lossless=True)
        before = webp.read_bytes()
        for name in ("misnamed.jpg", "ordinary.webp", "misnamed.PNG"):
            path = root / name
            path.write_bytes(before)
            native_calls.clear()
            pixels = functions["load_pixels"](path).numpy()
            check(not native_calls and np.array_equal(pixels, original.astype(np.float32)),
                  "A real WebP fixture was routed to the native decoder or its RGB values changed.")
            check(path.read_bytes() == before, "Image loading changed the source file.")

        # Genuine native formats stay on the existing decoder, regardless of
        # extension; no broad Pillow fallback hides unsupported input errors.
        for kind in ("JPEG", "PNG", "BMP", "GIF"):
            path = root / (kind.lower() + ".webp")
            Image.fromarray(original).save(path, format=kind)
            native_calls.clear()
            pixels = functions["load_pixels"](path).numpy()
            check(len(native_calls) == 1 and pixels.dtype == np.float32,
                  "A native format changed decoder or output dtype.")
            check(np.isfinite(pixels).all() and pixels.min() >= 0 and pixels.max() <= 255,
                  "Native image pixels escaped the model input range.")

        for index, content in enumerate((b"not an image", b"RIFF\x00\x00\x00\x00WEBP")):
            path = root / ("corrupt-" + str(index) + ".jpg")
            path.write_bytes(content)
            expect_error(lambda: functions["load_pixels"](path), UnidentifiedImageError)
        expect_error(lambda: functions["load_pixels"](root / "missing.jpg"), FileNotFoundError)


def check_mask_photo_selection(notebook):
    functions = extract_functions(notebook, {
        "numbered_mask_review_rows", "mask_ids_from_photo_numbers",
    })
    number_rows = functions["numbered_mask_review_rows"]
    select_ids = functions["mask_ids_from_photo_numbers"]
    training = [{"id": "training-" + str(index)} for index in range(1, 26)]
    display = [{"id": "display-" + str(index)} for index in range(1, 8)]
    before = json.dumps(training)
    captions = number_rows(training)

    # Numbers continue across pages, while the display pool starts at 1.
    check(captions[20]["id"] == "Photo 21 | training-21",
          "The second page restarts photo numbering.")
    check(select_ids([1, 21, 25], training, "Training") ==
          ["training-1", "training-21", "training-25"],
          "Selected photo numbers do not resolve to the exact training IDs.")
    check(number_rows(display)[0]["id"] == "Photo 1 | display-1" and
          select_ids([1], display, "Display") == ["display-1"],
          "The training and display selections were mixed.")
    check(select_ids([], training, "Training") == [],
          "An empty list unexpectedly selects photos.")
    check(json.dumps(training) == before, "Preview captions changed real photo IDs.")

    for invalid in ([0], [-1], [26], [1, 1], [True], ["2"], [1.5], "1"):
        expect_error(lambda invalid=invalid: select_ids(invalid, training, "Training"))
    expect_error(lambda: select_ids([21], display, "Display"))


def main():
    training = read_notebook("MangoLeaf_AI_Training_v4_4_0.ipynb")
    threshold = read_notebook("MangoLeaf_AI_Threshold_Fitting_v4_4_0.ipynb")
    check_mask_photo_selection(training)
    check_thresholds(threshold)
    check_evidence(threshold)
    check_image_loading(training)
    check_image_loading(threshold)
    check_runtime_audit(threshold)
    check_runtime_audit(training)
    check_nested_runtime_logs(training)
    check_nested_runtime_logs(threshold)
    check_tools_bootstrap(training)
    check_tools_bootstrap(threshold)
    check_probe_source(training)
    check_isolated_kernel(training)
    check_isolated_kernel(threshold)
    check_illustrations_and_light(training)
    check_mango_groups(training)
    check_export_recovery(training)
    print(f"Notebook structure: {training['stepCount']} training steps and {threshold['stepCount']} fitting steps passed.")
    print("Synthetic gates, groups, metrics, artifact tampering, paths, audit failures, masks, light, and reviewed identities passed.")
    print("Both local kernels passed state, import/configuration isolation, provider startup exclusion, logs, figures, errors, and shutdown.")
    print("Real startup failures retained their local diagnostic logs and stopped processes/channels.")
    print("Pip-less bootstrap passed with failing ensurepip, real local wheel installation, unchanged host packages, and saved failure logs.")
    print("Nested failure logs forwarded correctly; missing, unrelated, and later GPU errors retained their outer diagnostics.")
    print("Real Pillow WebP decoding and content-based backend routing passed for both templates; native resize arguments and corrupt-input failures were preserved.")
    print("Numbered mask review passed exact ID lookup, page boundaries, separate pools, unchanged IDs, empty selections, and invalid-number rejection.")
    print("No downloads, scientific package setup, training, Colab access, or model inference ran. These checks do not measure model accuracy.")


if __name__ == "__main__":
    main()

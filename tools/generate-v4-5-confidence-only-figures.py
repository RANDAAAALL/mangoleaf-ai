"""Plot the saved V4.5.0 confidence-only reference without training or inference.

Original run exports are read-only. New figures and their provenance are kept
outside the archived threshold-fitting figure folder.
"""

import csv
import hashlib
import json
import math
import platform
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
VERSION = ROOT / "docs/model-training/non-experiment/v4.5.0"
ARTIFACTS = VERSION / "artifacts/threshold_fitting"
OUTPUT = VERSION / "figures/confidence_only"
CONFIDENCE = 0.70


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def derive_results(evaluation, rows, original_rows):
    classes = evaluation["classNames"]
    require(len(classes) == 7 and len(set(classes)) == 7, "Expected seven classes.")
    original = {row["id"]: row for row in original_rows}
    require(len(original) == len(original_rows), "Duplicate original IDs.")
    require(len({row["id"] for row in rows}) == len(rows), "Duplicate reference IDs.")
    require({row["id"] for row in rows} == set(original), "Test membership changed.")
    matrix = np.zeros((len(classes), len(classes) + 1), dtype=int)
    raw_matrix = np.zeros((len(classes), len(classes)), dtype=int)
    for row in rows:
        saved = original[row["id"]]
        # Decisions differ between policies; image identity, labels, and scores do not.
        for field in [
            "sha256", "relativePath", "actualClass", "rawPredictedClass",
            "subset", "predictedIndex", "confidence", "margin", "entropy",
            *["probability_" + label for label in classes],
        ]:
            require(row[field] == saved[field], f"Source prediction changed: {row['id']} {field}")
        require(row["subset"] == "test", "Only mango test rows belong in these figures.")
        probabilities = [float(row["probability_" + label]) for label in classes]
        require(all(math.isfinite(value) and 0 <= value <= 1 for value in probabilities), "Invalid probability.")
        require(math.isclose(sum(probabilities), 1, abs_tol=1e-5), "Probabilities do not sum to one.")
        predicted = max(range(len(classes)), key=probabilities.__getitem__)
        confidence = float(row["confidence"])
        require(int(row["predictedIndex"]) == predicted, "Predicted index differs from scores.")
        require(classes[predicted] == row["rawPredictedClass"], "Predicted label differs from scores.")
        require(math.isclose(confidence, probabilities[predicted], abs_tol=1e-7), "Confidence differs from scores.")
        accepted = confidence >= CONFIDENCE
        require(row["accepted"].lower() == str(accepted).lower(), "Saved confidence-only decision differs.")
        require(row["displayedClass"] == (classes[predicted] if accepted else "rejected"), "Displayed class differs.")
        require(row["rejectionReasons"] == ("" if accepted else "confidence"), "Unexpected rejection rule.")
        actual = classes.index(row["actualClass"])
        raw_matrix[actual, predicted] += 1
        matrix[actual, predicted if accepted else len(classes)] += 1

    reference = evaluation["confidenceOnlyReference"]["mangoTest"]
    require(matrix.tolist() == reference["rejectionAwareConfusionMatrix"], "Matrix differs from saved reference.")
    require(raw_matrix.tolist() == reference["rawConfusionMatrix"], "Raw matrix differs from saved reference.")
    metrics = []
    for index, label in enumerate(classes):
        correct = int(matrix[index, index])
        predicted_count = int(matrix[:, index].sum())
        support = int(matrix[index].sum())
        precision = correct / predicted_count if predicted_count else 0.0
        recall = correct / support if support else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        metric = {"className": label, "precision": precision, "recall": recall, "f1Score": f1, "support": support}
        recorded = reference["rejectionAwarePerClassMetrics"][index]
        require(recorded["className"] == label and recorded["support"] == support, "Class order/support differs.")
        for key in ["precision", "recall", "f1Score"]:
            require(math.isclose(metric[key], recorded[key], abs_tol=1e-12), "Metric differs from reference: " + key)
        metrics.append(metric)
    total = int(matrix.sum())
    rejected = int(matrix[:, -1].sum())
    accepted = total - rejected
    correct = int(np.trace(matrix[:, :-1]))
    summary = {
        "total": total, "accepted": accepted, "rejected": rejected,
        "correctAccepted": correct, "wrongAccepted": accepted - correct,
        "correctAcceptedFractionOfAllPhotos": correct / total,
        "acceptedOnlyAccuracy": correct / accepted,
        "rawAccuracy": int(np.trace(raw_matrix)) / total,
    }
    for key in ["total", "accepted", "rejected", "correctAcceptedFractionOfAllPhotos", "acceptedOnlyAccuracy", "rawAccuracy"]:
        require(math.isclose(summary[key], reference[key], abs_tol=1e-12), "Summary differs from reference: " + key)
    return classes, matrix, metrics, summary


def finish(figure, filename, caption, captions):
    figure.tight_layout(rect=(0, 0.075, 1, 0.94))
    figure.text(0.5, 0.012, caption, ha="center", va="bottom", fontsize=10)
    figure.savefig(OUTPUT / filename, dpi=180, bbox_inches="tight", metadata={"Software": "V4.5.0 saved confidence-only reference plotter"})
    plt.close(figure)
    captions[filename] = caption.replace("\n", " ")


def plot_figures(classes, matrix, metrics, summary):
    labels = [label.replace("_", " ").title() for label in classes]
    captions = {}
    percentages = matrix * 100.0 / matrix.sum(axis=1, keepdims=True)
    figure, axes = plt.subplots(1, 2, figsize=(22, 9))
    for axis, panel, panel_title, percent in [
        (axes[0], matrix, "Counts", False),
        (axes[1], percentages, "Row percentages (recall on diagonal)", True),
    ]:
        image = axis.imshow(panel, cmap="Blues", vmin=0, vmax=100 if percent else None)
        figure.colorbar(image, ax=axis, fraction=0.046, pad=0.04)
        contrast = 50 if percent else max(1, float(panel.max()) / 2)
        for row in range(panel.shape[0]):
            for column in range(panel.shape[1]):
                value = panel[row, column]
                axis.text(column, row, f"{value:.1f}%" if percent else str(int(value)),
                          ha="center", va="center", fontsize=9,
                          color="white" if value > contrast else "black")
        axis.set_xticks(range(len(classes) + 1), labels + ["Rejected"], rotation=45, ha="right")
        axis.set_yticks(range(len(classes)), labels)
        axis.set_xlabel("Predicted result")
        axis.set_ylabel("Actual class")
        axis.set_title(panel_title)
    figure.suptitle(f"V4.5.0 mango test confusion matrix: 70% confidence only (n = {summary['total']})", fontsize=16)
    finish(figure, "confusion_matrix_with_rejection.png",
           "All mango test photos remain in the denominator; rejected photos count as missed diagnoses.\n"
           "Saved evaluation reference; same trained weights and predictions. No retraining or new inference.", captions)

    figure, axis = plt.subplots(figsize=(17, 8))
    locations = np.arange(len(classes))
    for offset, field, color, label in [
        (-0.26, "precision", "#1f77b4", "Precision"),
        (0, "recall", "#ff7f0e", "Recall"),
        (0.26, "f1Score", "#2ca02c", "F1-score"),
    ]:
        values = [row[field] for row in metrics]
        bars = axis.bar(locations + offset, values, width=0.25, color=color, label=label)
        axis.bar_label(bars, labels=[f"{value:.2f}" for value in values], padding=3, fontsize=9)
    score = summary["correctAcceptedFractionOfAllPhotos"]
    axis.axhline(score, color="gray", linestyle="--", label=f"Correct accepted / all mango photos: {score * 100:.2f}%")
    axis.set_xticks(locations, [label + f"\n(n={row['support']})" for label, row in zip(labels, metrics)], rotation=15, ha="right")
    axis.set_ylim(0, 1.12)
    axis.set_ylabel("Score (1.0 = 100%)")
    axis.set_title("V4.5.0 per-class metrics: 70% confidence only")
    axis.grid(axis="y", alpha=0.2)
    axis.legend(loc="lower right")
    finish(figure, "per_class_metrics_with_rejection.png",
           "All mango test photos remain in class support; rejected photos reduce recall.\n"
           "Dashed line is correct accepted / all mango test photos, not accepted-only accuracy. Saved reference, not a new field test.", captions)
    return captions


def main():
    sources = {
        "evaluation": ARTIFACTS / "evaluation.json",
        "confidenceOnlyPredictions": ARTIFACTS / "confidence_only_mango_test_predictions.csv",
        "originalPredictions": ARTIFACTS / "mango_test_predictions.csv",
    }
    source_hashes = {key: file_hash(path) for key, path in sources.items()}
    evaluation = json.loads(sources["evaluation"].read_text(encoding="utf-8"))
    classes, matrix, metrics, summary = derive_results(
        evaluation, read_csv(sources["confidenceOnlyPredictions"]), read_csv(sources["originalPredictions"]),
    )
    # Re-running this tool replaces only its own derived output files.
    OUTPUT.mkdir(parents=True, exist_ok=True)
    captions = plot_figures(classes, matrix, metrics, summary)
    (OUTPUT / "figure_captions.json").write_text(json.dumps(captions, indent=2) + "\n", encoding="utf-8")
    for key, path in sources.items():
        require(file_hash(path) == source_hashes[key], "Source changed while plotting.")
    provenance = {
        "schemaVersion": 1, "date": "2026-10-14",
        "purpose": "Locally regenerated figures from the preserved V4.5.0 confidence-only reference",
        "thresholds": {"confidenceThreshold": CONFIDENCE, "marginThreshold": None, "entropyThreshold": None},
        "classNames": classes, "mangoTest": summary,
        "rejectionAwareConfusionMatrix": matrix.tolist(), "rejectionAwarePerClassMetrics": metrics,
        "sources": {key: {"path": path.relative_to(ROOT).as_posix(), "sha256": source_hashes[key]} for key, path in sources.items()},
        "generator": {"path": Path(__file__).relative_to(ROOT).as_posix(), "sha256": file_hash(Path(__file__))},
        "runtime": {"python": platform.python_version(), "matplotlib": matplotlib.__version__, "numpy": np.__version__},
        "outputs": {name: {"sha256": file_hash(OUTPUT / name), "bytes": (OUTPUT / name).stat().st_size} for name in [*captions, "figure_captions.json"]},
        "trainingRun": evaluation["trainingRun"], "trainingCompleteSha256": evaluation["trainingCompleteSha256"],
        "modelWeightsChanged": False, "inferenceRerun": False,
        "browserPredictionParityMeasured": evaluation["browserPredictionParityMeasured"],
        "evidenceLimit": "Derived saved-study charts; no new independent evaluation, browser parity measurement, app threshold change, or deployment.",
    }
    (OUTPUT / "generation_provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": OUTPUT.relative_to(ROOT).as_posix(), "mangoTest": summary, "validatedAgainstSavedReference": True}, indent=2))


if __name__ == "__main__":
    main()

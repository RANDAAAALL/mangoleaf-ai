"""Draw V4.1 post-training figures from a completed, hash-checked run.

This script is also embedded in the standalone Colab figures notebook. It never
trains a model or changes the frozen threshold choices.
"""

import argparse
import csv
import hashlib
import io
import json
import random
import tempfile
import zipfile
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from PIL import Image, ImageOps


ARMS = ("control", "background", "lighting", "combined")
SEED = 42
IMAGE_SIZE = (224, 224)


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    with Path(path).open("rb") as handle:
        digest = hashlib.sha256()
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def checked_zip_image(bundle, row):
    name = row["relativePath"]
    if name.startswith("/") or ".." in Path(name).parts or "\\" in name:
        raise ValueError("Unsafe image path in manifest: " + name)
    data = bundle.read(name)
    if len(data) != row["bytes"] or sha256_bytes(data) != row["sha256"]:
        raise ValueError("Dataset image differs from manifest: " + name)
    return data


def load_pixels(data, suffix):
    # Match training's RGB decode and 224x224 bilinear resize, not Pillow resize.
    if suffix.lower() == ".webp":
        with Image.open(io.BytesIO(data)) as picture:
            pixels = np.asarray(ImageOps.exif_transpose(picture).convert("RGB"), dtype=np.float32)
    else:
        pixels = tf.io.decode_image(data, channels=3, expand_animations=False)
        pixels.set_shape((None, None, 3))
    return tf.image.resize(pixels, IMAGE_SIZE, method="bilinear", antialias=False).numpy()


def stable_seed(*parts):
    return int.from_bytes(hashlib.sha256("|".join(map(str, parts)).encode()).digest()[:8], "big")


def light_is_applied(key, epoch, probability):
    return random.Random(stable_seed(SEED, key, epoch, "local-light")).random() < probability


def add_local_light(pixels, key, epoch, plan):
    # Same order of random draws as the V4.1 training loader.
    rng = random.Random(stable_seed(SEED, key, epoch, "local-light"))
    if rng.random() >= plan["localLightProbability"]:
        return pixels
    sign = rng.choice((-1, 1))
    amplitude = rng.uniform(*plan["lightAmplitude"])
    radius = rng.uniform(*plan["lightRadius"]) * min(IMAGE_SIZE)
    cx, cy = rng.uniform(0, IMAGE_SIZE[1] - 1), rng.uniform(0, IMAGE_SIZE[0] - 1)
    yy, xx = np.mgrid[: IMAGE_SIZE[0], : IMAGE_SIZE[1]]
    field = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * radius**2))[..., None]
    return np.clip(pixels + sign * amplitude * field, 0, 255).astype(np.float32)


class RandomShear(tf.keras.layers.Layer):
    # Copy the custom V4.1 layer so the preview uses the same transform recipe.
    def __init__(self, factor=0.2, fill_mode="NEAREST", **kwargs):
        super().__init__(**kwargs)
        self.factor = factor
        self.fill_mode = fill_mode

    def call(self, inputs, training=False):
        if not training:
            return inputs
        shape = tf.shape(inputs)
        n = shape[0]
        h = tf.cast(shape[1], tf.float32)
        w = tf.cast(shape[2], tf.float32)
        cx, cy = w / 2.0, h / 2.0
        sx = tf.random.uniform([n], -self.factor, self.factor)
        sy = tf.random.uniform([n], -self.factor, self.factor)
        one = tf.ones_like(sx)
        zero = tf.zeros_like(sx)
        transforms = tf.stack([one, sx, -sx * cy, sy, one, -sy * cx, zero, zero], axis=1)
        return tf.raw_ops.ImageProjectiveTransformV3(
            images=inputs, transforms=transforms, output_shape=shape[1:3],
            fill_value=0.0, interpolation="BILINEAR", fill_mode=self.fill_mode)


def make_augmentation(plan):
    flip, rotation, zoom, shear, brightness = plan["augmentation"]
    return tf.keras.Sequential([
        tf.keras.layers.RandomFlip(flip, seed=SEED),
        tf.keras.layers.RandomRotation(rotation / 360.0, fill_mode="nearest", seed=SEED),
        tf.keras.layers.RandomZoom(zoom, fill_mode="nearest", seed=SEED),
        RandomShear(shear),
        tf.keras.layers.RandomBrightness(brightness, value_range=(0.0, 255.0), seed=SEED),
    ])


def save_training_curves(training, output, classes):
    fig, axes = plt.subplots(4, 2, figsize=(13, 16), sharex=True)
    for index, arm in enumerate(ARMS):
        rows = read_json(training / "arms" / arm / "training_history.json")
        if len(rows) != 15 or [r["stage"] for r in rows] != [1] * 5 + [2] * 10:
            raise ValueError("Unexpected training history for " + arm)
        x = np.arange(1, 16)
        for col, metric in enumerate(("loss", "accuracy")):
            ax = axes[index, col]
            ax.plot(x, [r[metric] for r in rows], label="train")
            ax.plot(x, [r["val_" + metric] for r in rows], label="validation")
            ax.axvline(5.5, color="gray", linestyle="--", linewidth=1)
            ax.set(title=f"{arm.title()} — {metric}", ylabel=metric, xlim=(1, 15))
            ax.grid(alpha=0.2)
            if index == 0:
                ax.legend()
        axes[index, 0].set_xlabel("Epoch (5 head + 10 fine-tune)")
        axes[index, 1].set_xlabel("Epoch (5 head + 10 fine-tune)")
    fig.suptitle("V4.1 saved training histories; validation determines checkpoints")
    fig.tight_layout()
    fig.savefig(output / "training_curves.png", dpi=160)
    plt.close(fig)


def save_confusion_matrices(threshold, output, classes):
    evaluation = read_json(threshold / "evaluation.json")
    fig, axes = plt.subplots(2, 2, figsize=(16, 14), constrained_layout=True)
    short = [name.replace("bacterial_", "b.").replace("healthy_", "h.").replace("_", " ") for name in classes]
    for ax, arm in zip(axes.flat, ARMS):
        matrix = np.asarray(evaluation["arms"][arm]["rawConfusionMatrix"], dtype=int)
        if matrix.shape != (7, 7) or matrix.sum() != 393:
            raise ValueError("Unexpected raw test matrix for " + arm)
        ax.imshow(matrix, cmap="Blues", vmin=0, vmax=max(1, matrix.max()))
        ax.set(title=f"{arm.title()} — raw, no rejection (n=393)", xlabel="Predicted", ylabel="Actual")
        ax.set_xticks(range(7), short, rotation=45, ha="right", fontsize=8)
        ax.set_yticks(range(7), short, fontsize=8)
        for row in range(7):
            for col in range(7):
                value = matrix[row, col]
                ax.text(col, row, str(value), ha="center", va="center",
                        color="white" if value > matrix.max() / 2 else "black", fontsize=8)
    fig.suptitle("V4.1 historical mango test set (reused during development)")
    fig.savefig(output / "confusion_matrix.png", dpi=160)
    plt.close(fig)


def save_per_class_metrics(threshold, output, classes):
    combined = []
    fig, axes = plt.subplots(4, 1, figsize=(13, 16), sharex=True)
    for ax, arm in zip(axes, ARMS):
        with (threshold / "arms" / arm / "raw_per_class_metrics.csv").open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
        if [r["class"] for r in rows] != classes:
            raise ValueError("Per-class CSV order differs from frozen classes: " + arm)
        for row in rows:
            combined.append({"arm": arm, **row})
        y = np.arange(7)
        for offset, (metric, color) in enumerate((("precision", "#2b8cbe"), ("recall", "#a6bddb"), ("f1-score", "#045a8d"))):
            ax.barh(y + (offset - 1) * 0.24, [float(r[metric]) for r in rows],
                    height=0.23, label=metric, color=color)
        ax.set(title=arm.title(), yticks=y, yticklabels=[c.replace("_", " ") for c in classes], xlim=(0, 1.02))
        ax.invert_yaxis()
        ax.grid(axis="x", alpha=0.2)
    axes[0].legend(loc="lower right", ncol=3)
    axes[-1].set_xlabel("Raw test score, before rejection")
    fig.suptitle("V4.1 class precision, recall, and F1; historical reused test set")
    fig.tight_layout()
    fig.savefig(output / "per_class_metrics.png", dpi=160)
    plt.close(fig)
    with (output / "per_class_metrics.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["arm", "class", "precision", "recall", "f1-score", "support"])
        writer.writeheader()
        writer.writerows(combined)


def save_threshold_search(threshold, output):
    selected = read_json(threshold / "selected_thresholds.json")["arms"]
    fig, axes = plt.subplots(2, 2, figsize=(14, 10), constrained_layout=True)
    for ax, arm in zip(axes.flat, ARMS):
        with (threshold / "arms" / arm / "threshold_search.csv").open(newline="", encoding="utf-8") as handle:
            rows = [r for r in csv.DictReader(handle) if float(r["margin"]) == 0.0]
        if len(rows) != 101:
            raise ValueError("Missing zero-margin search rows for " + arm)
        x = [float(r["entropy"]) for r in rows]
        val = [int(r["valAccepted"]) / int(r["valTotal"]) for r in rows]
        ood = [int(r["oodRejected"]) / int(r["oodTotal"]) for r in rows]
        ax.plot(x, val, label="validation mango retained")
        ax.plot(x, ood, label="old OOD tune rejected")
        ax.axhline(0.95, color="gray", linestyle="--", label="95% retention target")
        if selected[arm]["status"] == "feasible":
            gate = selected[arm]["thresholds"]
            if gate["marginThreshold"] != 0.0:
                raise ValueError("Selected margin changed; redraw the full 2D search")
            ax.axvline(gate["entropyThreshold"], color="crimson", linestyle=":", label="selected gate")
        else:
            ax.text(0.52, 0.1, "No feasible selected gate", transform=ax.transAxes, ha="center")
        ax.set(title=arm.title(), xlabel="Entropy maximum (margin = 0)", ylabel="Fraction", ylim=(-0.02, 1.02))
        ax.grid(alpha=0.2)
    axes[0, 0].legend(fontsize=8, loc="lower right")
    fig.suptitle("V4.1 frozen threshold search; old OOD tune is not final evaluation")
    fig.savefig(output / "threshold_search.png", dpi=160)
    plt.close(fig)


def save_augmentation_preview(training, scenes, output, plan, manifest, bundle):
    schedule = read_json(training / "background_schedule.json")["presentations"]
    mask_rows = {r["relativePath"]: r for r in read_json(training / "mask_review.json")["masks"] if r["useForBlend"]}
    rows = {r["relativePath"]: r for r in manifest["images"]}
    scene_rows = {r["relativePath"]: r for r in manifest["backgroundImages"]}
    # Choose a reviewed orchard scene; the first scheduled scene was an airplane.
    # Both effects fired for this real training presentation.
    picked = next((r for r in schedule if r["label"] == "healthy_leaf" and
                   r["sceneRelativePath"] == "fgyrtyrtytryrty.jpg" and
                   light_is_applied(r["trainRelativePath"], r["epoch"], plan["localLightProbability"])), None)
    if picked is None:
        raise ValueError("No scheduled healthy-leaf scene with local light")
    key, epoch = picked["trainRelativePath"], picked["epoch"]
    image_row, mask_row, scene_row = rows[key], mask_rows[key], scene_rows[picked["sceneRelativePath"]]
    scene_path = Path(scenes) / scene_row["relativePath"]
    mask_path = training / "masks" / (mask_row["id"] + ".png")
    if (sha256_file(scene_path) != picked["sceneSha256"] or
            sha256_file(scene_path) != scene_row["sha256"] or
            sha256_file(mask_path) != mask_row["maskSha256"] or
            image_row["sha256"] != mask_row["sha256"]):
        raise ValueError("Preview scene, image, or mask hash differs from frozen run")
    # Also verify that the saved schedule agrees with the original random choice.
    rng = random.Random(stable_seed(SEED, key, epoch, "background"))
    if rng.random() >= plan["blendProbability"] or rng.choice(manifest["backgroundImages"])["sha256"] != scene_row["sha256"]:
        raise ValueError("Saved scene does not match V4.1 selection recipe")
    original = load_pixels(checked_zip_image(bundle, image_row), Path(key).suffix)
    with Image.open(mask_path) as picture:
        alpha = np.asarray(picture.convert("L").resize(IMAGE_SIZE, Image.Resampling.BILINEAR), dtype=np.float32)[..., None] / 255
    with Image.open(scene_path) as picture:
        background = np.asarray(ImageOps.fit(picture.convert("RGB"), IMAGE_SIZE, method=Image.Resampling.BILINEAR), dtype=np.float32)
    replaced = original * alpha + background * (1 - alpha)
    pre = [original, replaced, add_local_light(original, key, epoch, plan), add_local_light(replaced, key, epoch, plan)]
    # New stochastic draws demonstrate the recipe; original per-epoch draws were not saved.
    tf.keras.utils.set_random_seed(SEED)
    samples = [make_augmentation(plan)(tf.convert_to_tensor(x[None], dtype=tf.float32), training=True).numpy()[0] for x in pre]
    fig, axes = plt.subplots(2, 4, figsize=(14, 8), constrained_layout=True)
    for column, arm in enumerate(ARMS):
        for row_index, pixels in enumerate((pre[column], samples[column])):
            axes[row_index, column].imshow(np.uint8(np.clip(pixels, 0, 255)))
            axes[row_index, column].axis("off")
            axes[row_index, column].set_title(f"{arm.title()} — {'before Keras aug' if row_index == 0 else 'new Keras aug draw'}")
    fig.suptitle("V4.1 representative train image: frozen scene/light reconstructed; stochastic draws are new")
    fig.savefig(output / "augmentation_preview.png", dpi=160)
    plt.close(fig)
    return {"trainingImage": key, "trainingImageSha256": image_row["sha256"], "epoch": epoch,
            "scene": scene_row["relativePath"], "sceneSha256": scene_row["sha256"],
            "mask": mask_path.name, "maskSha256": mask_row["maskSha256"],
            "interpretation": "Top row reconstructs the frozen pre-Keras inputs; bottom row is a new representative draw, not the original fit tensor."}


def save_grad_cam(training, output, classes, manifest, bundle, expected_model_hash):
    model_path = training / "arms" / "background" / "model_calibrated.keras"
    if sha256_file(model_path) != expected_model_hash:
        raise ValueError("Calibrated background model differs from frozen record")
    model = tf.keras.models.load_model(model_path, compile=False)
    if model.input_shape != (None, 224, 224, 3) or model.output_shape != (None, 7):
        raise ValueError("Unexpected V4.1 model shape")
    base = model.get_layer("MobileNetV3Large")
    picked = [next(r for r in manifest["images"] if r["subset"] == "val" and r["label"] == label) for label in classes]
    fig, axes = plt.subplots(2, 7, figsize=(21, 6), constrained_layout=True)
    rows = []
    for column, row in enumerate(picked):
        pixels = load_pixels(checked_zip_image(bundle, row), Path(row["relativePath"]).suffix)
        batch = tf.convert_to_tensor(pixels[None], dtype=tf.float32)
        with tf.GradientTape() as tape:
            features = base(batch, training=False)
            tape.watch(features)
            hidden = model.get_layer("gap")(features)
            hidden = model.get_layer("dropout")(hidden, training=False)
            logits = model.get_layer("logits")(hidden)
            predicted = int(tf.argmax(logits[0]).numpy())
            score = logits[:, predicted]
        gradients = tape.gradient(score, features)
        if gradients is None:
            raise RuntimeError("Grad-CAM cannot connect the feature map to logits")
        heat = tf.nn.relu(tf.reduce_sum(features[0] * tf.reduce_mean(gradients, axis=(0, 1, 2)), axis=-1))
        heat = heat / (tf.reduce_max(heat) + 1e-9)
        heat = tf.image.resize(heat[..., None], IMAGE_SIZE).numpy()[..., 0]
        probabilities = model(batch, training=False).numpy()[0]
        rows.append({"image": row["relativePath"], "imageSha256": row["sha256"], "actual": row["label"],
                     "rawPrediction": classes[predicted], "rawConfidence": float(probabilities[predicted])})
        for axis in axes[:, column]:
            axis.imshow(np.uint8(np.clip(pixels, 0, 255)))
            axis.axis("off")
        axes[0, column].set_title(row["label"].replace("_", " "), fontsize=9)
        axes[1, column].imshow(heat, cmap="jet", alpha=0.45, vmin=0, vmax=1)
        axes[1, column].set_title(f"{classes[predicted].replace('_', ' ')} {probabilities[predicted]:.2f}", fontsize=9)
    fig.suptitle("V4.1 background arm: fresh Grad-CAM on validation examples; raw scores, no rejection gates")
    fig.savefig(output / "grad_cam.png", dpi=160)
    plt.close(fig)
    return rows


def generate_figures(training_run, threshold_run, scene_photos, output_dir, artifacts_dir):
    training, threshold, scenes = map(Path, (training_run, threshold_run, scene_photos))
    output, artifacts = Path(output_dir), Path(artifacts_dir)
    plan = read_json(training / "plan.json")
    complete = read_json(training / "training_complete.json")
    manifest = read_json(training / "input_manifest.json")
    selected = read_json(threshold / "selected_thresholds.json")
    classes = plan["classes"]
    if (classes != complete["classes"] or classes != manifest["classes"] or
            classes != selected["classes"] or complete["armOrder"] != list(ARMS)):
        raise ValueError("Frozen class order or arm order differs across records")
    evaluation = read_json(threshold / "evaluation.json")
    for arm in ARMS:
        recorded = complete["arms"][arm]["modelSha256"]
        if (recorded != selected["arms"][arm]["modelSha256"] or
                recorded != evaluation["arms"][arm]["modelSha256"]):
            raise ValueError("Model hashes disagree between training and fitting: " + arm)
    for name, expected in (("input_manifest.json", plan["inputManifestSha256"]),
                           ("dataset_split.zip", plan["datasetSplitSha256"]),
                           ("mask_review.json", plan["maskReviewSha256"]),
                           ("background_schedule.json", plan["backgroundScheduleSha256"])):
        if sha256_file(training / name) != expected:
            raise ValueError("Frozen training input hash differs: " + name)
    # Local repository copies are optional; Colab can read the complete Drive runs alone.
    for name in ("evaluation.json", "selected_thresholds.json"):
        if (artifacts / name).exists() and sha256_file(threshold / name) != sha256_file(artifacts / name):
            raise ValueError("Curated record differs from completed threshold run: " + name)
    for arm in ARMS:
        for name, source in (("training_history.json", training),
                             ("raw_per_class_metrics.csv", threshold),
                             ("threshold_search.csv", threshold)):
            curated = artifacts / "arms" / arm / name
            if curated.exists() and sha256_file(source / "arms" / arm / name) != sha256_file(curated):
                raise ValueError("Curated arm record differs: " + arm + "/" + name)
    output.mkdir(parents=True, exist_ok=True)
    artifacts.mkdir(parents=True, exist_ok=True)
    save_training_curves(training, output, classes)
    save_confusion_matrices(threshold, output, classes)
    save_per_class_metrics(threshold, output, classes)
    save_threshold_search(threshold, output)
    with zipfile.ZipFile(training / "dataset_split.zip") as bundle:
        preview = save_augmentation_preview(training, scenes, output, plan, manifest, bundle)
        grad_cam = save_grad_cam(training, output, classes, manifest, bundle,
                                complete["arms"]["background"]["modelSha256"])
    provenance = {
        "status": "post-training diagnostic figures, not new model evaluation",
        "trainingRun": training.name,
        "thresholdRun": threshold.name,
        "modelArm": "background",
        "modelSha256": complete["arms"]["background"]["modelSha256"],
        "trainingCompleteSha256": sha256_file(training / "training_complete.json"),
        "evaluationSha256": sha256_file(threshold / "evaluation.json"),
        "selectedThresholdsSha256": sha256_file(threshold / "selected_thresholds.json"),
        "planSha256": sha256_file(training / "plan.json"),
        "augmentationPreview": preview,
        "gradCamValidationImages": grad_cam,
        "figures": {path.name: sha256_file(path) for path in sorted(output.glob("*.png"))},
        "limits": ["Historical test and old OOD data were used in earlier development.",
                   "Grad-CAM is a diagnostic explanation, not proof of diagnosis accuracy.",
                   "Original stochastic Keras augmentation draws were not saved; preview draws are new."],
    }
    (artifacts / "figure_provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    print("Saved six V4.1 figures and per_class_metrics.csv to", output)
    print("Saved provenance to", artifacts / "figure_provenance.json")
    return provenance


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--training-run", required=True)
    parser.add_argument("--threshold-run", required=True)
    parser.add_argument("--scene-photos", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--artifacts-dir", required=True)
    args = parser.parse_args()
    generate_figures(args.training_run, args.threshold_run, args.scene_photos,
                     args.output_dir, args.artifacts_dir)

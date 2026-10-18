"""V5.0.0 experimental OE fine-tuning helpers. Import has no scientific side effects.

This module is uploaded beside the notebook. It never writes into a V4.5.0 input.
Run methods in notebook order; each fitting/evaluation attempt has a fresh identity.
"""

import csv
import hashlib
import json
import math
import os
import random
import shutil
import subprocess
import sys
import uuid
import warnings
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

VERSION = 'v5.0.0'
MODEL_VERSION = 'model-v5.0.0-candidate'
PARENT_RUN_NAME = 'v4-5-0-training-20261011T063913Z-40b7b0fe'
PARENT_CHECKPOINT_SHA256 = 'ac7337a69ceed1ac1279072a4605fb47717949cc6a7ede8c725bb214ddb663ad'
CLASS_NAMES = ['anthracnose', 'bacterial_black_spot', 'bacterial_canker',
               'healthy_fruit', 'healthy_leaf', 'mango_scab', 'sooty_mold']
EXPECTED_SPLITS = {'train': 1854, 'val': 398, 'test': 397}
PREPROCESSING = 'RGB decode; bilinear 224x224 without antialias; float32 0-255; MobileNetV3 internal rescaling'
TRAINING_EXECUTION = {
    'policy': 'serial-host-batches-v1',
    'decodeResizeDevice': 'CPU:0', 'augmentationDevice': 'CPU:0',
    'modelSteps': 'compiled train_step/test_step; synchronize metrics before next host batch',
    'trainingInput': 'explicit batches; no tf.data generator or prefetch',
    'oeExposure': 'count only after successful synchronized training steps',
}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
MAX_IMAGE_BYTES = 32 * 1024 * 1024
# The frozen approved OE pool includes 63,700,992-pixel camera photos.
MAX_IMAGE_PIXELS = 64_000_000
REVIEW_FIELDS = ['id', 'relativePath', 'keep', 'unsupported', 'captureGroup',
                 'sourceGroup', 'sourceNotes', 'priorUse', 'notes']


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'),
                                     allow_nan=False).encode('utf-8')).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save_json_once(path, value):
    path = Path(path)
    if path.exists():
        if read_json(path) != value:
            raise RuntimeError('Refusing to replace changed evidence: ' + str(path))
        return
    with path.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write('\n')


def safe_child(root, relative):
    if (not isinstance(relative, str) or not relative or '\\' in relative
            or ':' in relative or '\x00' in relative):
        raise ValueError('Unsafe relative path: ' + str(relative))
    parts = PurePosixPath(relative)
    if parts.is_absolute() or '..' in parts.parts or parts == PurePosixPath('.'):
        raise ValueError('Unsafe relative path: ' + relative)
    target = Path(root).joinpath(*parts.parts).resolve()
    target.relative_to(Path(root).resolve())
    return target


def assert_disjoint_paths(paths):
    resolved = [Path(path).resolve() for path in paths]
    for index, first in enumerate(resolved):
        for second in resolved[index + 1:]:
            if first == second or first.is_relative_to(second) or second.is_relative_to(first):
                raise ValueError('Inputs and output roots must not overlap: ' + str(first) + ', ' + str(second))


def drive_path(path, *, output=False, allow_shared=False, my_drive=Path('/content/drive/MyDrive')):
    selected, root = Path(path), Path(my_drive)
    if not selected.is_absolute() or '..' in selected.parts or selected == root or not selected.is_relative_to(root):
        raise ValueError('Choose a folder below mounted My Drive: ' + str(selected))
    resolved, owned = selected.resolve(), root.resolve()
    shared = (root.parent / '.shortcut-targets-by-id').resolve()
    owned_ok = resolved != owned and resolved.is_relative_to(owned)
    shared_ok = resolved.is_relative_to(shared) and len(resolved.relative_to(shared).parts) >= 2
    if not owned_ok and not (not output and allow_shared and shared_ok):
        raise ValueError('Path resolves outside permitted Drive location: ' + str(resolved))
    if not output and not resolved.is_dir():
        raise FileNotFoundError(selected)
    return resolved


def validate_config(config):
    allowed = {'parent_run', 'old_ood', 'parent_threshold_run', 'fresh_ood', 'output_root',
               'allow_shared_inputs', 'epochs', 'learning_rate', 'batch_size', 'oe_loss_weight',
               'seed', 'expected_oe_count'}
    if set(config) - allowed:
        raise ValueError('Unknown configuration keys: ' + str(sorted(set(config) - allowed)))
    result = {'parent_threshold_run': None, 'fresh_ood': None, 'allow_shared_inputs': False,
              'epochs': 5, 'learning_rate': 1e-5, 'batch_size': 16, 'oe_loss_weight': 0.5,
              'seed': 42, 'expected_oe_count': 2511, **config}
    for key in ('parent_run', 'old_ood', 'output_root'):
        if not result.get(key):
            raise ValueError('Missing setting: ' + key)
    for key in ('epochs', 'batch_size', 'seed', 'expected_oe_count'):
        if type(result[key]) is not int or result[key] < (0 if key == 'seed' else 1):
            raise ValueError('Invalid integer setting: ' + key)
    for key in ('learning_rate', 'oe_loss_weight'):
        if isinstance(result[key], bool) or not math.isfinite(result[key]) or result[key] <= 0:
            raise ValueError('Invalid positive setting: ' + key)
    if result['expected_oe_count'] != 2511:
        raise ValueError('This workflow expects 2011 + 500 unique OE photos. Resolve duplicates before changing the design.')
    return result


def verify_manifest_files(root, artifacts, required=None):
    names = list(artifacts) if required is None else list(required)
    for relative in names:
        record = artifacts.get(relative)
        if not isinstance(record, dict) or not isinstance(record.get('sha256'), str):
            raise RuntimeError('Missing artifact identity: ' + relative)
        path = safe_child(root, relative)
        if not path.is_file() or path.stat().st_size != record['bytes'] or sha256_file(path) != record['sha256']:
            raise RuntimeError('Artifact differs from sealed receipt: ' + relative)


def validate_parent_metadata(receipt, manifest, plan, class_names, checkpoint_hash):
    if receipt.get('experimentVersion') != 'v4.5.0' or receipt.get('completedEpochs') != 15:
        raise RuntimeError('This is not the expected completed V4.5.0 parent run.')
    if checkpoint_hash != PARENT_CHECKPOINT_SHA256:
        raise RuntimeError('Parent stage2 checkpoint identity differs from approved source.')
    if any(value != CLASS_NAMES for value in (class_names, manifest.get('classNames'),
                                              plan.get('classNames'), receipt.get('classNames'))):
        raise RuntimeError('Parent class order differs.')
    if plan.get('preprocessing') != PREPROCESSING or plan.get('imageSize') != [224, 224]:
        raise RuntimeError('Parent input contract differs.')
    if receipt.get('oeTrainingCount') != 2011 or receipt.get('heldOutOodCount') != 500:
        raise RuntimeError('Parent pool counts differ.')
    if receipt.get('configurationHash') != canonical_hash(plan):
        raise RuntimeError('Parent plan differs from its completion receipt.')


def validate_split_membership(rows):
    if Counter(row.get('subset') for row in rows) != Counter(EXPECTED_SPLITS):
        raise RuntimeError('Preserved mango counts must remain train1854/val398/test397.')
    ids, groups, decoded = set(), defaultdict(set), defaultdict(set)
    for row in rows:
        if row.get('label') not in CLASS_NAMES or not row.get('id') or row['id'] in ids:
            raise RuntimeError('Invalid or repeated mango identity/class.')
        ids.add(row['id'])
        if not row.get('groupId'):
            raise RuntimeError('Preserved mango group missing.')
        groups[row['groupId']].add(row['subset'])
        decoded[row['decodedRgbSha256']].add(row['subset'])
    if any(len(values) != 1 for values in [*groups.values(), *decoded.values()]):
        raise RuntimeError('Related or exact mango images cross preserved splits.')
    for subset in EXPECTED_SPLITS:
        if {row['label'] for row in rows if row['subset'] == subset} != set(CLASS_NAMES):
            raise RuntimeError('Every preserved split must contain all seven classes.')


def match_legacy_review(actual_rows, inventory_rows, reviews):
    """Reuse declarations only when byte, decoded-pixel, path and review IDs match."""
    if len(actual_rows) != 500 or len(inventory_rows) != 500 or len(reviews) != 500:
        raise RuntimeError('Legacy review must cover exactly the original 500 photos.')
    inventory = {row['relativePath']: row for row in inventory_rows}
    by_id = {row['id']: row for row in reviews}
    if (len(inventory) != 500 or len(by_id) != 500
            or len({row['sourceRelativePath'] for row in actual_rows}) != 500
            or len({row['sha256'] for row in actual_rows}) != 500
            or len({row['decodedRgbSha256'] for row in actual_rows}) != 500
            or {row['sourceRelativePath'] for row in actual_rows} != set(inventory)
            or {row['id'] for row in inventory_rows} != set(by_id)):
        raise RuntimeError('Repeated legacy review identities.')
    merged = []
    for actual in actual_rows:
        historical = inventory.get(actual['sourceRelativePath'])
        if historical is None or any(actual[key] != historical[key]
                                     for key in ('sha256', 'decodedRgbSha256', 'bytes')):
            raise RuntimeError('Legacy photo differs from reviewed identity: ' + actual['sourceRelativePath'])
        review = by_id.get(historical['id'])
        if (review is None or review['relativePath'] != historical['relativePath']
                or review['keep'].strip().lower() != 'yes'
                or review['unsupported'].strip().lower() != 'yes'):
            raise RuntimeError('Legacy scope approval absent: ' + actual['sourceRelativePath'])
        merged.append({**actual, **{key: review.get(key, '') for key in REVIEW_FIELDS[4:]},
                       'reviewSource': 'sealed V4.5.0 researcher declarations',
                       'newTrainingUse': 'transferred_to_v5.0.0_OE_training',
                       'originalPriorUse': review.get('priorUse', '')})
    return merged


def read_csv(path):
    with Path(path).open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream))


def write_csv_once(path, rows, fields):
    with Path(path).open('x', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)


def validate_review_rows(records, reviews, *, fresh=False):
    by_id = {row['id']: row for row in reviews}
    if len(by_id) != len(reviews) or set(by_id) != {row['id'] for row in records}:
        raise RuntimeError('Photo review does not match current inventory.')
    accepted = []
    for record in records:
        row = by_id[record['id']]
        if row.get('relativePath') != record['sourceRelativePath']:
            raise RuntimeError('Photo review path differs.')
        if row.get('keep', '').strip().lower() not in ('yes', 'no'):
            raise RuntimeError('Every photo needs keep=yes or no.')
        if row['keep'].strip().lower() == 'no':
            if not row.get('notes', '').strip():
                raise RuntimeError('Excluded photos need a reason.')
            continue
        if row.get('unsupported', '').strip().lower() != 'yes':
            raise RuntimeError('Retained OE/OOD photos must be outside the seven supported classes.')
        if not row.get('sourceNotes', '').strip() or not row.get('priorUse', '').strip():
            raise RuntimeError('Record source limitations and prior use; do not invent provenance.')
        if fresh and row['priorUse'].strip().lower() != 'never_used_for_training_or_tuning':
            raise RuntimeError('Fresh OOD reporting requires never_used_for_training_or_tuning.')
        accepted.append({**record, **{key: row.get(key, '') for key in REVIEW_FIELDS[4:]}})
    return accepted


def unique_records(rows):
    seen = set()
    result = []
    for row in rows:
        if row['decodedRgbSha256'] in seen:
            raise RuntimeError('Expanded OE contains an exact decoded duplicate. Targeted review and revised design needed.')
        seen.add(row['decodedRgbSha256'])
        result.append(row)
    return result


def confidence_decision(probabilities, threshold=0.70):
    values = [float(value) for value in probabilities]
    if (len(values) != 7 or any(not math.isfinite(value) or value < 0 or value > 1 for value in values)
            or not math.isclose(sum(values), 1.0, abs_tol=1e-5)):
        raise ValueError('Expected seven finite probabilities summing to one.')
    best = max(range(7), key=values.__getitem__)
    return best if values[best] >= threshold else 7


def classification_metrics(actual, predicted, *, with_rejection=False):
    if len(actual) != len(predicted) or not actual:
        raise ValueError('Expected matching nonempty labels and predictions.')
    columns = 8 if with_rejection else 7
    matrix = [[0] * columns for _ in range(7)]
    for truth, guess in zip(actual, predicted):
        if not (type(truth) is int and 0 <= truth < 7 and type(guess) is int and 0 <= guess < columns):
            raise ValueError('Class index outside expected range.')
        matrix[truth][guess] += 1
    per_class = []
    for index, label in enumerate(CLASS_NAMES):
        true_positive = matrix[index][index]
        support = sum(matrix[index])
        predicted_count = sum(row[index] for row in matrix)
        precision = true_positive / predicted_count if predicted_count else 0.0
        recall = true_positive / support if support else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class.append({'class': label, 'support': support, 'precision': precision, 'recall': recall, 'f1': f1})
    correct = sum(matrix[i][i] for i in range(7))
    rejected = sum(row[7] for row in matrix) if with_rejection else 0
    accepted = len(actual) - rejected
    return {'count': len(actual), 'correct': correct, 'correctOverAll': correct / len(actual),
            'accepted': accepted, 'rejected': rejected,
            'acceptedOnlyAccuracy': correct / accepted if accepted else None,
            'confusionMatrix': matrix, 'perClass': per_class}


def rejection_metrics(probabilities):
    decisions = [confidence_decision(row) for row in probabilities]
    if not decisions:
        raise ValueError('OOD reporting pool is empty.')
    rejected = decisions.count(7)
    return {'count': len(decisions), 'rejected': rejected, 'falseAccepted': len(decisions) - rejected,
            'rejectionRate': rejected / len(decisions),
            'falseAcceptanceRate': (len(decisions) - rejected) / len(decisions)}


def receipt_for(root, relatives):
    return {relative: {'sha256': sha256_file(safe_child(root, relative)),
                       'bytes': safe_child(root, relative).stat().st_size} for relative in relatives}


def raw_rgb(path):
    from PIL import Image, ImageOps
    path = Path(path)
    if not 0 < path.stat().st_size <= MAX_IMAGE_BYTES:
        raise ValueError('Image exceeds byte bounds: ' + str(path))
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(path) as opened:
            if opened.format not in {'JPEG', 'MPO', 'PNG', 'BMP', 'GIF', 'WEBP'}:
                raise ValueError(f'Unsupported image encoding {opened.format!r}: {path}')
            pixels = opened.width * opened.height
            if pixels > MAX_IMAGE_PIXELS:
                raise ValueError(f'Image exceeds pixel bound ({opened.width}x{opened.height} = '
                                 f'{pixels} pixels; limit={MAX_IMAGE_PIXELS}): {path}')
            if opened.format != 'MPO' and getattr(opened, 'n_frames', 1) != 1:
                raise ValueError('Animated image is unsupported: ' + str(path))
            # Preserved camera JPEGs can contain auxiliary MPO pictures. Read
            # only their primary photo, matching the parent's frozen RGB hashes.
            if opened.format == 'MPO':
                opened.seek(0)
            return ImageOps.exif_transpose(opened).convert('RGB')


def inventory_image(path, *, pool, relative):
    import imagehash
    image = raw_rgb(path)
    digest = sha256_file(path)
    return {'id': digest, 'pool': pool, 'path': str(Path(path).resolve()),
            'sourceRelativePath': relative, 'sha256': digest,
            'decodedRgbSha256': hashlib.sha256(str(image.size).encode('utf-8') + image.tobytes()).hexdigest(),
            'bytes': Path(path).stat().st_size, 'dimensions': list(image.size),
            'phash': str(imagehash.phash(image, hash_size=8)), 'captureGroup': '', 'sourceGroup': ''}


def verify_images(rows):
    for row in rows:
        if Path(row['path']).stat().st_size != row['bytes'] or sha256_file(row['path']) != row['sha256']:
            raise RuntimeError('Image bytes changed since inventory: ' + row['path'])


def portable(rows):
    return [{key: value for key, value in row.items() if key != 'path'} for row in rows]


def load_pixels(path):
    # Preserve the parent's model-input path, including TensorFlow decoding and
    # bilinear resize. WebP content can have a misleading JPEG suffix.
    with Path(path).open('rb') as stream:
        signature = stream.read(12)
    if signature[:4] == b'RIFF' and signature[8:12] == b'WEBP':
        image = tf.convert_to_tensor(np.asarray(raw_rgb(path)), dtype=tf.uint8)
    else:
        image = tf.io.decode_image(tf.io.read_file(str(path)), channels=3, expand_animations=False)
    image = tf.image.resize(tf.cast(image, tf.float32), (224, 224), method='bilinear', antialias=False)
    if image.shape != (224, 224, 3) or not bool(tf.reduce_all(tf.math.is_finite(image))):
        raise RuntimeError('Invalid model input.')
    return image


def make_model():
    base = tf.keras.applications.MobileNetV3Large(input_shape=(224, 224, 3), include_top=False,
                                                weights=None, include_preprocessing=True)
    inputs = tf.keras.Input((224, 224, 3), dtype=tf.float32, name='image')
    features = base(inputs, training=False)
    pooled = tf.keras.layers.GlobalAveragePooling2D(name='global_average_pool')(features)
    pooled = tf.keras.layers.Dropout(0.2, name='head_dropout')(pooled)
    logits = tf.keras.layers.Dense(7, name='class_logits')(pooled)
    outputs = tf.keras.layers.Activation('softmax', name='class_probabilities')(logits)
    model = tf.keras.Model(inputs, outputs, name='mangoleaf_v4_5_0_seven_class')
    return model, tf.keras.Model(inputs, logits, name='mangoleaf_v5_0_0_logits'), base


def dataset(rows, *, labelled=False, batch_size=16):
    def examples():
        for row in rows:
            with tf.device('/CPU:0'):
                pixels = load_pixels(row['path']).numpy().astype(np.float32)
            yield (pixels, np.int32(CLASS_NAMES.index(row['label']))) if labelled else pixels
    signature = tf.TensorSpec((224, 224, 3), tf.float32)
    if labelled:
        signature = (signature, tf.TensorSpec((), tf.int32))
    return tf.data.Dataset.from_generator(examples, output_signature=signature).apply(
        tf.data.experimental.assert_cardinality(len(rows))).batch(batch_size).prefetch(1)


def load_host_batch(rows, *, labelled=False, layers=None):
    # Complete CPU work before any model step; never suspend a device scope at yield.
    with tf.device('/CPU:0'):
        pixels = np.stack([load_pixels(row['path']).numpy() for row in rows]).astype(np.float32, copy=False)
        if layers is not None:
            output = augment_batch(pixels, layers)
            if 'CPU:' not in output.device:
                raise RuntimeError('Training augmentation did not execute on CPU.')
            pixels = output.numpy()
    if pixels.shape != (len(rows), 224, 224, 3) or not np.isfinite(pixels).all():
        raise RuntimeError('Invalid completed host batch.')
    return (pixels, np.asarray([CLASS_NAMES.index(row['label']) for row in rows], dtype=np.int32)) if labelled else pixels


def compiled_training_steps(trainer):
    pixels = tf.TensorSpec((None, 224, 224, 3), tf.float32)
    labels = tf.TensorSpec((None,), tf.int32)
    train = tf.function(trainer.train_step,
                        input_signature=[({'mango': pixels, 'oe': pixels}, labels)], jit_compile=False)
    validate = tf.function(trainer.test_step, input_signature=[(pixels, labels)], jit_compile=False)
    return train, validate


def synchronized_metrics(values):
    # Reading all results also waits for the compiled model step to finish.
    result = {key: float(value.numpy()) for key, value in values.items()}
    if not result or not all(math.isfinite(value) for value in result.values()):
        raise RuntimeError('Non-finite training/validation step metrics.')
    return result


def validate_host_batches(trainer, step, rows, batch_size):
    trainer.reset_metrics()
    if not rows:
        raise RuntimeError('Validation requires the preserved mango validation photos.')
    for start in range(0, len(rows), batch_size):
        metrics = synchronized_metrics(step(load_host_batch(rows[start:start + batch_size], labelled=True)))
    return metrics


def verify_serial_training_runtime(device):
    # Exercise real compiled updates before the expensive Drive inventory.
    # These synthetic inputs and tiny classifier provide no model accuracy evidence.
    from PIL import Image
    fixture = setup_directory / 'serial-batch-fixture.png'
    Image.new('RGB', (224, 224), (71, 127, 193)).save(fixture)
    row = {'path': str(fixture), 'label': CLASS_NAMES[0]}
    with tf.device(device):
        inputs = tf.keras.Input((224, 224, 3))
        pooled = tf.keras.layers.GlobalAveragePooling2D()(inputs)
        outputs = tf.keras.layers.Dense(7)(pooled / 255.0)
        classifier = tf.keras.Model(inputs, outputs)
    trainer = OETrainer(classifier, np.ones(7, dtype=np.float32), 0.5)
    trainer.compile(optimizer=tf.keras.optimizers.Adam(1e-5), jit_compile=False)
    train, validate = compiled_training_steps(trainer)
    mango_layers, oe_layers = augmentation_layers(10042), augmentation_layers(20042)
    trainer.reset_metrics()
    sizes = [(16, 16), (14, 16), (16, 15)]
    for mango_count, oe_count in sizes:
        images, labels = load_host_batch([row] * mango_count, labelled=True, layers=mango_layers)
        outliers = load_host_batch([row] * oe_count, layers=oe_layers)
        synchronized_metrics(train(({'mango': images, 'oe': outliers}, labels)))
    counts = (int(trainer.optimizer.iterations.numpy()),
              int(trainer.accuracy_tracker.count.numpy()), int(trainer.oe_tracker.count.numpy()))
    if counts != (3, 46, 47):
        raise RuntimeError('Compiled training steps lost optimizer updates or accumulated metric counts.')
    validate_host_batches(trainer, validate, [row] * 17, 16)
    if int(trainer.accuracy_tracker.count.numpy()) != 17:
        raise RuntimeError('Compiled validation did not retain its short final batch.')
    probe = classifier(tf.zeros((1, 224, 224, 3)), training=False)
    if device == '/GPU:0' and 'GPU:' not in probe.device:
        raise RuntimeError('Serial training classifier probe did not execute on GPU.')
    result = {'passed': True, 'syntheticOnly': True, 'modelAccuracyEvidence': False,
              'trainingBatches': 3, 'mangoSamples': 46, 'oeSamples': 47,
              'validationSamples': 17, 'modelProbeDevice': probe.device,
              'executionPolicy': TRAINING_EXECUTION}
    (setup_directory / 'serial-training-probe.json').write_text(json.dumps(result, indent=2) + '\n')
    print('Serial training execution probe passed: 3 controlled batches; not an accuracy evaluation.')
    return result


class Experiment:
    def __init__(self, config):
        self.config = validate_config(config)
        shared = self.config['allow_shared_inputs']
        self.parent = drive_path(self.config['parent_run'], allow_shared=shared)
        self.old_ood_root = drive_path(self.config['old_ood'], allow_shared=shared)
        self.threshold_parent = (drive_path(self.config['parent_threshold_run'], allow_shared=shared)
                                 if self.config['parent_threshold_run'] else None)
        self.fresh_root = (drive_path(self.config['fresh_ood'], allow_shared=shared)
                           if self.config['fresh_ood'] else None)
        output = drive_path(self.config['output_root'], output=True)
        assert_disjoint_paths([self.parent, self.old_ood_root, output,
                               *([self.fresh_root] if self.fresh_root else []),
                               *([self.threshold_parent] if self.threshold_parent else [])])
        if 'v5.0.0' not in output.parts or 'v4.5.0' in output.parts:
            raise ValueError('Output root must be a separate v5.0.0 location.')
        name = 'v5-0-0-oe-finetune-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8]
        self.run = output / name
        self.run.mkdir(parents=True, exist_ok=False)
        (self.run / 'figures').mkdir()
        save_json_once(self.run / 'workflow_config.json', self.config)
        shutil.copy2(__file__, self.run / 'v5_workflow.py')
        shutil.copytree(setup_directory, self.run / 'runtime_preflight')
        save_json_once(self.run / 'runtime.json', RUNTIME)
        self.parent_receipt = read_json(self.parent / 'training_complete.json')
        required = ['stage2_best.weights.h5', 'class_names.json', 'input_manifest.json', 'plan.json',
                    'oe_dataset_manifest.json', 'oe_training_manifest.json', 'example_selection.json',
                    'held_out_ood_inventory.json']
        verify_manifest_files(self.parent, self.parent_receipt['artifacts'], required)
        self.parent_manifest = read_json(self.parent / 'input_manifest.json')
        self.parent_plan = read_json(self.parent / 'plan.json')
        validate_parent_metadata(self.parent_receipt, self.parent_manifest, self.parent_plan,
                                 read_json(self.parent / 'class_names.json'),
                                 sha256_file(self.parent / 'stage2_best.weights.h5'))
        if sha256_file(self.parent / 'input_manifest.json') != self.parent_receipt['inputManifestSha256']:
            raise RuntimeError('Parent input manifest identity differs.')
        self.parent_sources = receipt_for(self.parent, ['training_complete.json', *required])
        save_json_once(self.run / 'source_provenance.json', {
            'parentRun': str(self.parent), 'parentArtifacts': self.parent_sources,
            'oldOodRoot': str(self.old_ood_root),
            'selectedInputPaths': {key: self.config[key] for key in
                                   ('parent_run', 'old_ood', 'parent_threshold_run', 'fresh_ood')},
            'resolvedInputPaths': {'parentRun': str(self.parent), 'oldOodRoot': str(self.old_ood_root),
                                   'parentThresholdRun': str(self.threshold_parent) if self.threshold_parent else None,
                                   'freshOod': str(self.fresh_root) if self.fresh_root else None},
            'checkpointKind': 'uncalibrated weights only; fresh optimizer, not exact resume',
            'parentCheckpointSha256': PARENT_CHECKPOINT_SHA256,
            'sourceWritesPermitted': False,
        })
        print('New experimental run:', self.run)

    def inventory(self):
        self.mango = []
        for original in self.parent_manifest['images']:
            path = safe_child(self.parent / 'dataset', original['relativePath'])
            current = inventory_image(path, pool='mango', relative=original['sourceRelativePath'])
            for key in ('sha256', 'decodedRgbSha256', 'bytes', 'dimensions', 'phash'):
                if current[key] != original[key]:
                    raise RuntimeError('Parent mango photo differs: ' + original['relativePath'])
            self.mango.append({**original, 'path': str(path)})
        validate_split_membership(self.mango)
        self.train_rows = [row for row in self.mango if row['subset'] == 'train']
        self.val_rows = [row for row in self.mango if row['subset'] == 'val']
        self.test_rows = [row for row in self.mango if row['subset'] == 'test']
        self.original_oe = []
        oe_manifest = read_json(self.parent / 'oe_dataset_manifest.json')['images']
        if len(oe_manifest) != 2011:
            raise RuntimeError('Expected 2011 previously approved OE photos.')
        approved = read_json(self.parent / 'oe_training_manifest.json')['images']
        if {row['sha256'] for row in approved} != {row['sha256'] for row in oe_manifest}:
            raise RuntimeError('Parent approved OE membership differs from dataset manifest.')
        for original in oe_manifest:
            path = safe_child(self.parent, original['relativePath'])
            current = inventory_image(path, pool='original_oe', relative=original['sourceRelativePath'])
            if any(current[key] != original[key] for key in ('sha256', 'decodedRgbSha256', 'bytes')):
                raise RuntimeError('Approved parent OE photo differs.')
            self.original_oe.append({**original, 'path': str(path), 'pool': 'original_oe'})
        self.old_ood = []
        original_ood = read_json(self.parent / 'held_out_ood_inventory.json')['images']
        if len(original_ood) != 500:
            raise RuntimeError('Expected original 500 OOD photos.')
        for original in original_ood:
            path = safe_child(self.old_ood_root, original['sourceRelativePath'])
            current = inventory_image(path, pool='transferred_ood', relative=original['sourceRelativePath'])
            if any(current[key] != original[key] for key in ('sha256', 'decodedRgbSha256', 'bytes')):
                raise RuntimeError('Old OOD file differs from frozen training exclusion: ' + original['sourceRelativePath'])
            self.old_ood.append(current)
        self.fresh_ood = []
        if self.fresh_root:
            paths = sorted(path for path in self.fresh_root.rglob('*') if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)
            if not paths:
                raise RuntimeError('Selected fresh OOD folder contains no supported images.')
            self.fresh_ood = [inventory_image(safe_child(self.fresh_root, path.relative_to(self.fresh_root).as_posix()),
                                             pool='fresh_ood', relative=path.relative_to(self.fresh_root).as_posix())
                              for path in paths]
            unique_records(self.fresh_ood)
        self.example_selection = read_json(self.parent / 'example_selection.json')
        ids = {row['id']: row for row in self.val_rows}
        self.examples = []
        if len(self.example_selection['images']) != 7:
            raise RuntimeError('Expected same seven validation Grad-CAM examples.')
        for example in self.example_selection['images']:
            row = ids.get(example['id'])
            if row is None or row['sha256'] != example['sha256'] or row['relativePath'] != example['relativePath']:
                raise RuntimeError('Grad-CAM example is not the same preserved validation photo.')
            self.examples.append(row)
        if {row['label'] for row in self.examples} != set(CLASS_NAMES):
            raise RuntimeError('Grad-CAM examples must cover seven classes.')
        save_json_once(self.run / 'inventory.json', {'mango': portable(self.mango),
                       'originalOe': portable(self.original_oe), 'transferredOod': portable(self.old_ood),
                       'freshOod': portable(self.fresh_ood)})
        print('Verified mango:', dict(Counter(row['subset'] for row in self.mango)),
              'original OE:', len(self.original_oe), 'old OOD:', len(self.old_ood),
              'fresh reporting OOD:', len(self.fresh_ood))

    def import_legacy_review(self):
        if not self.threshold_parent:
            raise RuntimeError('Set parent_threshold_run to the preserved V4.5.0 threshold review folder. '
                               'Share its folder into this account or copy only its sealed review bundle. '
                               'The original 500-photo review is reused; no full manual re-review is needed.')
        root = self.threshold_parent
        receipt = read_json(root / 'threshold_fitting_complete.json')
        required = ['ood_inventory.json', 'ood_review.csv', 'similarity_review.csv', 'evaluation_inputs.json']
        verify_manifest_files(root, receipt['artifacts'], required)
        parent_sha = sha256_file(self.parent / 'training_complete.json')
        if receipt['trainingCompleteSha256'] != parent_sha or receipt['classNames'] != CLASS_NAMES:
            raise RuntimeError('Threshold review belongs to another training run.')
        inputs = read_json(root / 'evaluation_inputs.json')
        if (inputs['trainingCompleteSha256'] != parent_sha
                or inputs['photoReviewSha256'] != sha256_file(root / 'ood_review.csv')
                or inputs['oodInventorySha256'] != sha256_file(root / 'ood_inventory.json')
                or inputs['similarityReviewSha256'] != sha256_file(root / 'similarity_review.csv')):
            raise RuntimeError('Historical review lock differs.')
        self.transferred = match_legacy_review(self.old_ood, read_json(root / 'ood_inventory.json')['images'],
                                               read_csv(root / 'ood_review.csv'))
        provenance = self.run / 'legacy_review'
        provenance.mkdir(exist_ok=False)
        for name in ['threshold_fitting_complete.json', *required]:
            shutil.copy2(root / name, provenance / name)
        self.legacy_review_paths = receipt_for(root, ['threshold_fitting_complete.json', *required])
        save_json_once(self.run / 'legacy_review_provenance.json', {
            'sourceRun': str(root), 'artifacts': self.legacy_review_paths,
            'interpretation': 'Preserved researcher declarations, not independent inspection or new evaluation evidence.',
            'reusedPhotos': len(self.transferred), 'newTrainingUse': True,
        })
        print('Reused sealed scope review for 500 matching photos. No full re-review required.')

    def prepare_reviews(self):
        self.import_legacy_review()
        if self.fresh_ood:
            path = self.run / 'fresh_ood_review.csv'
            if not path.exists():
                write_csv_once(path, [{'id': row['id'], 'relativePath': row['sourceRelativePath']}
                                      for row in self.fresh_ood], REVIEW_FIELDS)
        candidates = [*self.original_oe, *self.old_ood]
        unique_records(candidates)
        if len(candidates) != 2511:
            raise RuntimeError('Unique expanded OE pool is not 2511.')
        self.similarity_flags = []
        comparisons = [(self.mango, candidates, 'mango_vs_oe'),
                       ([*self.mango, *candidates], self.fresh_ood, 'used_vs_fresh_ood')]
        for left_rows, right_rows, category in comparisons:
            for left in left_rows:
                for right in right_rows:
                    exact = left['decodedRgbSha256'] == right['decodedRgbSha256']
                    distance = (int(left['phash'], 16) ^ int(right['phash'], 16)).bit_count()
                    if exact:
                        raise RuntimeError('Exact cross-pool overlap: ' + left['sourceRelativePath'] + ' / ' + right['sourceRelativePath'])
                    if distance <= 5:
                        pair_id = canonical_hash([category, left['sha256'], right['sha256']])
                        self.similarity_flags.append({'pairId': pair_id, 'category': category,
                            'leftId': left['sha256'], 'rightId': right['sha256'],
                            'leftPath': left['path'], 'rightPath': right['path'], 'distance': distance,
                            'decision': '', 'notes': ''})
        path = self.run / 'cross_pool_similarity_review.csv'
        if not path.exists():
            write_csv_once(path, self.similarity_flags,
                           ['pairId', 'category', 'leftId', 'rightId', 'leftPath', 'rightPath', 'distance', 'decision', 'notes'])
        self.contact_sheets(self.old_ood if not hasattr(self, 'transferred') else [], 'transferred_ood_review')
        self.contact_sheets(self.fresh_ood, 'fresh_ood_review')
        self.similarity_contact_sheets()
        print('New cross-pool similarity candidates:', len(self.similarity_flags))
        print('Review files:', self.run)

    def contact_sheets(self, rows, name):
        from PIL import Image, ImageDraw
        directory = self.run / name
        directory.mkdir(exist_ok=False)
        for start in range(0, len(rows), 25):
            canvas = Image.new('RGB', (1000, 1100), 'white')
            draw = ImageDraw.Draw(canvas)
            for index, row in enumerate(rows[start:start + 25]):
                image = raw_rgb(row['path'])
                image.thumbnail((190, 180))
                x, y = index % 5 * 200, index // 5 * 220
                canvas.paste(image, (x, y))
                draw.text((x, y + 182), row['id'][:16], fill='black')
                draw.text((x, y + 198), row['sourceRelativePath'][:25], fill='black')
            canvas.save(directory / f'page_{start // 25 + 1:03d}.jpg')

    def similarity_contact_sheets(self):
        from PIL import Image, ImageDraw
        directory = self.run / 'similarity_previews'
        directory.mkdir(exist_ok=False)
        for index, pair in enumerate(self.similarity_flags):
            canvas = Image.new('RGB', (640, 370), 'white')
            for column, key in enumerate(('leftPath', 'rightPath')):
                image = raw_rgb(pair[key]); image.thumbnail((310, 310))
                canvas.paste(image, (column * 320, 0))
            ImageDraw.Draw(canvas).text((5, 320), pair['pairId'] + '\n' + pair['category'], fill='black')
            canvas.save(directory / f'{index:04d}_{pair["pairId"][:16]}.jpg')

    def approve(self, *, review_complete, review_notes):
        if not review_complete or not review_notes.strip():
            raise RuntimeError('Complete targeted reviews and record limitations before freezing.')
        if not hasattr(self, 'transferred'):
            self.transferred = validate_review_rows(self.old_ood, read_csv(self.run / 'transferred_ood_review.csv'))
        self.oe = unique_records([*self.original_oe, *self.transferred])
        if len(self.oe) != 2511:
            raise RuntimeError('This planned run requires all 2511 reviewed unique OE photos.')
        self.reporting_ood = (validate_review_rows(self.fresh_ood, read_csv(self.run / 'fresh_ood_review.csv'), fresh=True)
                              if self.fresh_ood else [])
        reviews = read_csv(self.run / 'cross_pool_similarity_review.csv')
        by_id = {row['pairId']: row for row in reviews}
        if len(by_id) != len(reviews) or set(by_id) != {row['pairId'] for row in self.similarity_flags}:
            raise RuntimeError('Similarity review differs from generated candidates.')
        for pair in self.similarity_flags:
            review = by_id[pair['pairId']]
            retained_fresh = {row['sha256'] for row in self.reporting_ood}
            if pair['category'] == 'used_vs_fresh_ood' and pair['rightId'] not in retained_fresh:
                continue
            if (any(str(review[key]) != str(pair[key]) for key in ('category', 'leftId', 'rightId', 'distance'))
                    or review['decision'].strip().lower() != 'distinct'
                    or not review['notes'].strip()):
                raise RuntimeError('Cross-pool related/uncertain images must be excluded in a newly prepared run; only documented distinct pairs may remain.')
        # Explicit capture/source groups supplement perceptual similarity, whose
        # threshold does not establish source independence.
        used = [*self.mango, *self.oe]
        for key in ('captureGroup', 'sourceGroup'):
            known_used = {row.get(key, '').strip() for row in used} - {''}
            if known_used & ({row.get(key, '').strip() for row in self.reporting_ood} - {''}):
                raise RuntimeError('Fresh OOD shares a known capture/source group with used photos.')
            mango_groups = {row.get(key, '').strip() for row in self.mango} - {''}
            if mango_groups & ({row.get(key, '').strip() for row in self.oe} - {''}):
                raise RuntimeError('OE shares a known capture/source group with mango photos.')
        save_json_once(self.run / 'review_approval.json', {'complete': True, 'notes': review_notes,
            'oldOodReviewReused': hasattr(self, 'legacy_review_paths'),
            'oldOodNowTraining': True, 'freshOodCount': len(self.reporting_ood),
            'unknownProvenanceRemainsUnknown': True,
            'scopeReviewIsResearcherDeclaration': True})

    def freeze(self, *, augmentation_review_complete, augmentation_review_notes):
        if not augmentation_review_complete or not augmentation_review_notes.strip():
            raise RuntimeError('Inspect augmentation preview before freezing.')
        if not hasattr(self, 'oe'):
            raise RuntimeError('Approve reviews first.')
        self.plan = {'schemaVersion': 1, 'experimentVersion': VERSION, 'modelVersion': MODEL_VERSION,
            'classNames': CLASS_NAMES, 'imageSize': [224, 224], 'preprocessing': PREPROCESSING,
            'parentCheckpointSha256': PARENT_CHECKPOINT_SHA256, 'parentArtifacts': self.parent_sources,
            'initialWeights': 'uncalibrated V4.5.0 stage2 weights; fresh optimizer state',
            'splitPolicy': 'preserve exact V4.5.0 membership; old mango test is an exploratory paired reference',
            'splitCounts': EXPECTED_SPLITS, 'oeCount': len(self.oe), 'freshOodCount': len(self.reporting_ood),
            'fineTuning': {key: self.config[key] for key in ('epochs', 'learning_rate', 'batch_size', 'oe_loss_weight', 'seed')},
            'batchNormalizationFrozen': True, 'modelSelection': 'minimum clean mango validation loss, including epoch0 baseline',
            'temperatureRule': 'fit validation-only after weight selection; fold into logits once',
            'thresholds': {'confidenceThreshold': 0.70, 'marginThreshold': None, 'entropyThreshold': None},
            'augmentation': {'flip': 'horizontal_and_vertical', 'rotationDegrees': 30, 'zoom': 0.2,
                             'shear': 0.2, 'brightness': 0.2, 'contrast': 0.1},
            'trainingExecution': TRAINING_EXECUTION,
            'augmentationReviewNotes': augmentation_review_notes,
            'trainingSamplesPerEpoch': len(self.train_rows),
            'oeSampling': 'shuffled iterator cycles across epoch boundaries; actual and selected-checkpoint coverage are recorded',
            'freshOodRole': 'report only; never fitting, calibration or model selection',
            'browserParityPassed': False}
        self.manifests = {'mango': portable(self.mango), 'oe': portable(self.oe),
                          'freshOod': portable(self.reporting_ood), 'examples': portable(self.examples)}
        save_json_once(self.run / 'input_manifest.json', self.manifests)
        save_json_once(self.run / 'plan.json', self.plan)
        review_files = [path.relative_to(self.run).as_posix() for path in self.run.rglob('*') if path.is_file()]
        self.frozen = {'configurationHash': canonical_hash(self.plan),
                       'inputManifestHash': canonical_hash(self.manifests),
                       'artifacts': receipt_for(self.run, sorted(review_files)),
                       'helperSha256': sha256_file(__file__)}
        save_json_once(self.run / 'frozen_inputs.json', self.frozen)
        self.verify_frozen()
        print('Frozen plan:', self.frozen['configurationHash'])

    def verify_frozen(self):
        if (canonical_hash(self.plan) != self.frozen['configurationHash']
                or read_json(self.run / 'plan.json') != self.plan
                or canonical_hash(self.manifests) != self.frozen['inputManifestHash']
                or read_json(self.run / 'input_manifest.json') != self.manifests
                or sha256_file(__file__) != self.frozen['helperSha256']):
            raise RuntimeError('Live/frozen configuration, manifests or helper changed. Create a new run.')
        expected = {key: self.config[key] for key in self.plan['fineTuning']}
        if expected != self.plan['fineTuning']:
            raise RuntimeError('Fine-tuning settings changed after freeze.')
        if {'mango': portable(self.mango), 'oe': portable(self.oe),
            'freshOod': portable(self.reporting_ood), 'examples': portable(self.examples)} != self.manifests:
            raise RuntimeError('Live photo membership differs from frozen manifest.')
        verify_manifest_files(self.run, self.frozen['artifacts'])
        verify_manifest_files(self.parent, self.parent_sources)
        verify_images([*self.mango, *self.oe, *self.reporting_ood])

    def build(self):
        tf.keras.utils.set_random_seed(self.config['seed'])
        self.model, self.logits_model, self.base = make_model()
        self.model.load_weights(self.parent / 'stage2_best.weights.h5')
        if any(not np.isfinite(weight).all() for weight in self.model.get_weights()):
            raise RuntimeError('Parent checkpoint contains non-finite weights.')
        self.base.trainable = True
        for layer in self.base.layers:
            if isinstance(layer, tf.keras.layers.BatchNormalization):
                layer.trainable = False
        labels = [CLASS_NAMES.index(row['label']) for row in self.train_rows]
        counts = np.bincount(labels, minlength=7)
        self.class_weights = len(labels) / (7 * counts.astype(np.float32))
        save_json_once(self.run / 'class_weights.json', dict(zip(CLASS_NAMES, map(float, self.class_weights))))
        self.initial_weight_hash = canonical_hash([hashlib.sha256(array.tobytes()).hexdigest()
                                                   for array in self.model.get_weights()])
        print('Loaded exact parent weights. New Adam optimizer will start during fitting.')

    def augmentation_preview(self):
        fig, axes = plt.subplots(7, 8, figsize=(24, 23))
        for index, row in enumerate(self.examples):
            with tf.device('/CPU:0'):
                pixels = load_pixels(row['path'])[None]
                layers = augmentation_layers(self.config['seed'] + 30000 + index * 10)
                views = [pixels] + [tf.clip_by_value(layer(pixels, training=True), 0, 255) for layer in layers]
                views.append(augment_batch(pixels, augmentation_layers(self.config['seed'] + 40000 + index * 10)))
            for axis, heading, view in zip(axes[index], ['Original', 'Flip', 'Rotation', 'Zoom', 'Shear', 'Brightness', 'Contrast 0.1', 'Combined'], views):
                axis.imshow(np.uint8(view.numpy()[0])); axis.set_title(heading); axis.axis('off')
            axes[index, 0].set_ylabel(row['label'])
        fig.suptitle('V5.0.0 training augmentation preview; same validation originals')
        fig.tight_layout(); fig.savefig(self.run / 'figures/augmentation_preview.png', dpi=150)
        plt.show(); plt.close(fig)

    def train(self):
        self.verify_frozen()
        if (self.run / 'training_started.json').exists():
            raise RuntimeError('This attempt already started. Preserve it; create a new run after interruption.')
        if canonical_hash([hashlib.sha256(array.tobytes()).hexdigest() for array in self.model.get_weights()]) != self.initial_weight_hash:
            raise RuntimeError('Initial weights changed before fitting.')
        save_json_once(self.run / 'training_started.json', {'startedAt': utc_now(), 'configurationHash': self.frozen['configurationHash']})
        trainer = OETrainer(self.logits_model, self.class_weights, self.config['oe_loss_weight'])
        trainer.compile(optimizer=tf.keras.optimizers.Adam(self.config['learning_rate']), jit_compile=False)
        train_step, validation_step = compiled_training_steps(trainer)
        batch_size = self.config['batch_size']
        baseline = validate_host_batches(trainer, validation_step, self.val_rows, batch_size)
        if not all(math.isfinite(float(value)) for value in baseline.values()):
            raise RuntimeError('Non-finite epoch0 validation metrics.')
        best_loss = float(baseline['loss']); best_epoch = 0; best_oe_samples = 0
        checkpoint = self.run / 'fine_tuned_best.weights.h5'
        self.model.save_weights(checkpoint)
        self.history = []
        # Carry the OE cursor across epochs, including the short final OE batch.
        oe_order = list(self.oe); random.Random(self.config['seed'] + 1000).shuffle(oe_order)
        oe_cursor = 0
        self.oe_samples_consumed = 0
        print('Training uses completed CPU batches and synchronized compiled model steps.')
        for epoch in range(self.config['epochs']):
            order = list(self.train_rows); random.Random(self.config['seed'] + epoch).shuffle(order)
            mango_layers = augmentation_layers(self.config['seed'] + 10000 + epoch * 10)
            oe_layers = augmentation_layers(self.config['seed'] + 20000 + epoch * 10)
            trainer.reset_metrics()
            print('Epoch', epoch + 1, '/', self.config['epochs'])
            progress = tf.keras.utils.Progbar(math.ceil(len(order) / batch_size),
                                            stateful_metrics=[metric.name for metric in trainer.metrics])
            for start in range(0, len(order), batch_size):
                if oe_cursor == len(oe_order):
                    oe_cursor = 0
                oe_rows = oe_order[oe_cursor:oe_cursor + batch_size]
                images, labels = load_host_batch(order[start:start + batch_size], labelled=True, layers=mango_layers)
                outliers = load_host_batch(oe_rows, layers=oe_layers)
                metrics = synchronized_metrics(train_step(({'mango': images, 'oe': outliers}, labels)))
                oe_cursor += len(oe_rows)
                self.oe_samples_consumed += len(oe_rows)
                progress.update(start // batch_size + 1, values=list(metrics.items()))
            validation = validate_host_batches(trainer, validation_step, self.val_rows, batch_size)
            row = {'epoch': epoch + 1, **metrics, **{'val_' + key: value for key, value in validation.items()}}
            if not all(math.isfinite(value) for value in row.values()):
                raise RuntimeError('Non-finite training metrics; this run cannot be exported.')
            self.history.append(row)
            save_json_once(self.run / f'epoch_{epoch + 1:02d}.json', row)
            print('Validation loss:', row['val_loss'], 'accuracy:', row['val_accuracy'])
            if row['val_loss'] < best_loss:
                best_loss, best_epoch = row['val_loss'], epoch + 1
                best_oe_samples = self.oe_samples_consumed
                self.model.save_weights(checkpoint)
        self.model.load_weights(checkpoint)
        self.model.save(self.run / 'model_selected.keras')
        save_json_once(self.run / 'training_history.json', self.history)
        save_json_once(self.run / 'checkpoint_selection.json', {'selectedEpoch': best_epoch, 'validationLoss': best_loss,
            'epoch0ValidationLoss': float(baseline['loss']), 'parentRetainedIfNoImprovement': best_epoch == 0,
            'criterion': 'minimum clean unweighted mango validation cross-entropy'})
        save_json_once(self.run / 'oe_exposure.json', {
            'availableUniquePhotos': len(oe_order), 'samplesProcessed': self.oe_samples_consumed,
            'uniquePhotosExposed': min(self.oe_samples_consumed, len(oe_order)),
            'allPhotosExposed': self.oe_samples_consumed >= len(oe_order),
            'selectedCheckpointSamplesProcessed': best_oe_samples,
            'selectedCheckpointUniqueOePhotosExposed': min(best_oe_samples, len(oe_order)),
            'shuffledOrderSha256': canonical_hash([row['sha256'] for row in oe_order]),
            'sampling': 'continuous shuffled cursor; short tails retained across epochs',
            'counting': TRAINING_EXECUTION['oeExposure']})
        self.verify_frozen()
        save_json_once(self.run / 'training_state.json', {'completedEpochs': len(self.history),
            'configurationHash': self.frozen['configurationHash'], 'artifacts': receipt_for(self.run,
            ['fine_tuned_best.weights.h5', 'model_selected.keras', 'training_history.json', 'checkpoint_selection.json', 'oe_exposure.json'])})
        print('Selected epoch:', best_epoch, '(0 means parent retained; improvement is not assumed).')

    def predict(self, model, rows):
        values = model.predict(dataset(rows, batch_size=self.config['batch_size']), verbose=0)
        if values.shape != (len(rows), 7) or not np.isfinite(values).all():
            raise RuntimeError('Invalid prediction output.')
        return values

    def calibrate(self):
        from scipy.optimize import minimize_scalar
        self.verify_frozen()
        verify_manifest_files(self.run, read_json(self.run / 'training_state.json')['artifacts'])
        if (self.run / 'calibration_started.json').exists():
            raise RuntimeError('Calibration already attempted. Preserve this run; do not fold twice.')
        save_json_once(self.run / 'calibration_started.json', {'startedAt': utc_now()})
        selected = tf.keras.models.load_model(self.run / 'model_selected.keras', compile=False, safe_mode=True)
        logits_model = tf.keras.Model(selected.inputs, selected.get_layer('class_logits').output)
        logits = self.predict(logits_model, self.val_rows).astype(np.float64)
        labels = np.array([CLASS_NAMES.index(row['label']) for row in self.val_rows])
        def nll(temperature):
            scaled = logits / temperature; scaled -= scaled.max(axis=1, keepdims=True)
            return float(-np.mean((scaled - np.log(np.exp(scaled).sum(axis=1, keepdims=True)))[np.arange(len(labels)), labels]))
        fitted = minimize_scalar(nll, bounds=(0.25, 20.0), method='bounded')
        if not fitted.success or not math.isfinite(fitted.fun):
            raise RuntimeError('Temperature fit failed.')
        temperature = float(fitted.x) if fitted.fun < nll(1.0) else 1.0
        calibrated = tf.keras.models.clone_model(selected); calibrated.set_weights(selected.get_weights())
        head = calibrated.get_layer('class_logits'); weights, bias = head.get_weights()
        head.set_weights([weights / temperature, bias / temperature])
        before, after = self.predict(selected, self.val_rows), self.predict(calibrated, self.val_rows)
        if not np.array_equal(before.argmax(1), after.argmax(1)):
            raise RuntimeError('Positive-temperature folding changed top classes.')
        calibrated.save(self.run / 'model_calibrated.keras')
        reloaded = tf.keras.models.load_model(self.run / 'model_calibrated.keras', compile=False, safe_mode=True)
        np.testing.assert_allclose(after, self.predict(reloaded, self.val_rows), rtol=1e-4, atol=1e-5)
        np.save(self.run / 'validation_logits.npy', logits, allow_pickle=False)
        np.save(self.run / 'validation_probabilities.npy', after, allow_pickle=False)
        save_json_once(self.run / 'temperature.json', {'temperature': temperature, 'foldCount': 1,
            'temperatureFoldedIntoWeights': True, 'fitSubset': 'val', 'validationCount': len(labels),
            'fitIncludesOE': False, 'fitIncludesOOD': False, 'beforeNll': nll(1), 'afterNll': nll(temperature)})
        save_json_once(self.run / 'calibration_complete.json', {'configurationHash': self.frozen['configurationHash'],
            'artifacts': receipt_for(self.run, ['model_calibrated.keras', 'temperature.json', 'validation_logits.npy', 'validation_probabilities.npy'])})
        self.selected_model, self.calibrated_model = selected, calibrated
        print('Validation-only temperature:', temperature)

    def evaluate(self):
        self.verify_frozen()
        verify_manifest_files(self.run, read_json(self.run / 'calibration_complete.json')['artifacts'])
        if (self.run / 'evaluation_started.json').exists():
            raise RuntimeError('Reporting already attempted. Preserve output; do not repeatedly tune against reporting results.')
        save_json_once(self.run / 'evaluation_started.json', {'startedAt': utc_now(),
            'rule': 'confidence >= 0.70 only; fixed before predictions', 'oodRole': 'report only'})
        self.calibrated_model = tf.keras.models.load_model(self.run / 'model_calibrated.keras', compile=False, safe_mode=True)
        mango_probabilities = self.predict(self.calibrated_model, self.test_rows)
        ood_probabilities = self.predict(self.calibrated_model, self.reporting_ood) if self.reporting_ood else None
        actual = [CLASS_NAMES.index(row['label']) for row in self.test_rows]
        predicted = list(map(int, mango_probabilities.argmax(1)))
        decisions = [confidence_decision(row) for row in mango_probabilities]
        self.evaluation = {'experimentVersion': VERSION, 'configurationHash': self.frozen['configurationHash'],
            'thresholds': self.plan['thresholds'], 'mangoTestRole': 'same historical397 photos; exploratory paired reference',
            'rawMango': classification_metrics(actual, predicted),
            'confidenceOnlyMango': classification_metrics(actual, decisions, with_rejection=True),
            'freshOod': rejection_metrics(ood_probabilities) if ood_probabilities is not None else None,
            'freshOodStatus': 'reported on locked unseen pool' if ood_probabilities is not None else 'pending; no unseen pool supplied',
            'calibratedModelSha256': sha256_file(self.run / 'model_calibrated.keras'),
            'browserParityPassed': False,
            'old500OodExcludedFromEvaluation': True,
            'sourceIndependenceLimit': 'Unknown capture/source provenance remains unknown. Counts do not establish independent sampling.'}
        for name, rows, probabilities in [('mango_test_predictions.csv', self.test_rows, mango_probabilities),
                                          ('ood_report_predictions.csv', self.reporting_ood, ood_probabilities)]:
            if probabilities is None:
                continue
            records = []
            for row, values in zip(rows, probabilities):
                decision = confidence_decision(values)
                records.append({'id': row['id'], 'sha256': row['sha256'], 'actual': row.get('label', 'unsupported'),
                    'predicted': CLASS_NAMES[int(values.argmax())], 'confidence': float(values.max()),
                    'accepted': decision != 7, 'decision': CLASS_NAMES[decision] if decision != 7 else 'rejected',
                    **{label: float(value) for label, value in zip(CLASS_NAMES, values)}})
            write_csv_once(self.run / name, records, list(records[0]))
        save_json_once(self.run / 'evaluation.json', self.evaluation)
        prediction_paths = ['evaluation.json', 'mango_test_predictions.csv']
        if self.reporting_ood:
            prediction_paths.append('ood_report_predictions.csv')
        save_json_once(self.run / 'evaluation_complete.json', {
            'configurationHash': self.frozen['configurationHash'], 'thresholds': self.plan['thresholds'],
            'calibratedModelSha256': sha256_file(self.run / 'model_calibrated.keras'),
            'freshOodComplete': bool(self.reporting_ood), 'artifacts': receipt_for(self.run, prediction_paths)})
        print(json.dumps(self.evaluation, indent=2))

    def export(self):
        import zipfile
        self.verify_frozen()
        verify_manifest_files(self.run, read_json(self.run / 'calibration_complete.json')['artifacts'])
        destination = self.run / 'tfjs_model'
        if destination.exists() or (self.run / 'export_complete.json').exists():
            raise RuntimeError('Export already attempted. Preserve this output; create a separate attempt.')
        self.calibrated_model = tf.keras.models.load_model(self.run / 'model_calibrated.keras', compile=False, safe_mode=True)
        saved_model = self.run / 'saved_model'
        self.calibrated_model.export(saved_model, verbose=False)
        convert_saved_model(saved_model, destination, self.run / 'conversion.log')
        temperature = read_json(self.run / 'temperature.json')
        evaluation = read_json(self.run / 'evaluation.json') if (self.run / 'evaluation.json').exists() else None
        configuration = {'modelVersion': MODEL_VERSION, 'experimentVersion': VERSION,
            'status': 'experimental candidate; not adopted or deployed', 'classNames': CLASS_NAMES, 'classes': CLASS_NAMES,
            'inputSize': [224, 224], 'inputRange': [0, 255], 'inputDtype': 'float32',
            'preprocessing': PREPROCESSING, 'temperature': temperature['temperature'],
            'temperatureFoldedIntoWeights': True, 'quantized': False, 'thresholds': self.plan['thresholds'],
            'configurationHash': self.frozen['configurationHash'],
            'freshOodEvaluationComplete': bool(evaluation and evaluation.get('freshOod')),
            'browserParityStatus': 'pending actual browser comparison before adoption',
            'browserPredictionParityMeasured': False,
            'trainingObjective': 'mango supervision plus uniform-target Outlier Exposure',
            'parentCheckpointSha256': PARENT_CHECKPOINT_SHA256}
        save_json_once(destination / 'model_config.json', configuration)
        export_paths = [path.relative_to(self.run).as_posix() for path in destination.iterdir() if path.is_file()]
        save_json_once(self.run / 'export_complete.json', {'format': 'graph-model', 'quantized': False,
            'configurationHash': self.frozen['configurationHash'],
            'calibratedModelSha256': sha256_file(self.run / 'model_calibrated.keras'),
            'artifacts': receipt_for(self.run, export_paths), 'browserProbabilityParity': 'pending'})
        with zipfile.ZipFile(self.run / 'candidate_model.zip', 'x', compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(destination.iterdir()):
                if path.is_file():
                    archive.write(path, path.name)
        print('Experimental export:', destination, '(do not replace application assets before evaluation/adoption).')

    def figures(self):
        self.verify_frozen()
        verify_manifest_files(self.run, read_json(self.run / 'training_state.json')['artifacts'])
        verify_manifest_files(self.run, read_json(self.run / 'calibration_complete.json')['artifacts'])
        if (self.run / 'evaluation_complete.json').exists():
            verify_manifest_files(self.run, read_json(self.run / 'evaluation_complete.json')['artifacts'])
        self.selected_model = tf.keras.models.load_model(self.run / 'model_selected.keras', compile=False, safe_mode=True)
        self.calibrated_model = tf.keras.models.load_model(self.run / 'model_calibrated.keras', compile=False, safe_mode=True)
        if (self.run / 'figure_manifest.json').exists():
            raise RuntimeError('Figures already sealed.')
        history = read_json(self.run / 'training_history.json')
        epochs = [row['epoch'] for row in history]
        fig, axes = plt.subplots(1, 2, figsize=(16, 5))
        for axis, left, right, title in [(axes[0], 'accuracy', 'val_accuracy', 'Mango accuracy'),
                                        (axes[1], 'mango_loss', 'val_loss', 'Mango cross-entropy loss')]:
            axis.plot(epochs, [row[left] for row in history], 'o-',
                      label='Training mango (weighted)' if left == 'mango_loss' else 'Training mango')
            axis.plot(epochs, [row[right] for row in history], 's-',
                      label='Validation mango (clean, unweighted)' if left == 'mango_loss' else 'Validation mango')
            axis.set_title(title); axis.set_xlabel('New fine-tuning epoch'); axis.grid(alpha=0.3); axis.legend()
        fig.suptitle('V5.0.0 warm-start fine-tuning history; original V4.5.0 epochs excluded')
        fig.text(0.5, 0.01, 'Accuracy excludes OE. Training mango loss is weighted; validation is clean and unweighted. '
                 'OE and total loss are recorded separately in training_history.json.', ha='center', fontsize=9)
        fig.tight_layout(rect=(0, 0.06, 1, 1))
        fig.savefig(self.run / 'figures/training_curves.png', dpi=150); plt.show(); plt.close(fig)
        manifest = {'experimentVersion': VERSION, 'originalExamplesSha256': self.parent_sources['example_selection.json']['sha256'],
                    'gradCamTarget': 'same true class for both versions', 'examples': [],
                    'interpretation': 'Validation illustrations do not establish accuracy or independent field evidence.'}
        fig, axes = plt.subplots(7, 3, figsize=(13, 25))
        for index, row in enumerate(self.examples):
            pixels = load_pixels(row['path']).numpy(); batch = tf.convert_to_tensor(pixels[None])
            probabilities = self.calibrated_model(batch, training=False).numpy()[0]
            heatmap, signal, backbone, dense = connected_grad_cam(self.selected_model, batch, CLASS_NAMES.index(row['label']))
            overlay = np.clip(0.65 * pixels / 255 + 0.35 * plt.colormaps['jet'](heatmap)[..., :3], 0, 1) if signal else pixels / 255
            for axis, view, title in zip(axes[index], [pixels / 255, heatmap, overlay],
                ['True: ' + row['label'], 'True-class Grad-CAM' if signal else 'No positive signal',
                 'Predicted: ' + CLASS_NAMES[int(probabilities.argmax())] + f'\nConfidence: {probabilities.max():.1%}']):
                axis.imshow(view, cmap='jet' if view.ndim == 2 else None, vmin=0, vmax=1); axis.set_title(title); axis.axis('off')
            manifest['examples'].append({'id': row['id'], 'sha256': row['sha256'], 'subset': 'val',
                'targetClass': row['label'], 'predictedClass': CLASS_NAMES[int(probabilities.argmax())],
                'hasPositiveHeatmap': signal, 'backboneLayer': backbone, 'logitsLayer': dense})
        fig.suptitle('V5.0.0 Grad-CAM; same seven V4.5.0 validation originals')
        fig.tight_layout(); fig.savefig(self.run / 'figures/grad_cam.png', dpi=150); plt.show(); plt.close(fig)
        if (self.run / 'evaluation.json').exists():
            evaluation = read_json(self.run / 'evaluation.json')
            for metric, suffix in [('rawMango', ''), ('confidenceOnlyMango', '_with_rejection')]:
                record = evaluation[metric]; matrix = np.array(record['confusionMatrix'])
                fig, axes = plt.subplots(1, 2, figsize=(18, 7))
                normalized = matrix / matrix.sum(1, keepdims=True) * 100
                labels = [name.replace('_', ' ').title() for name in CLASS_NAMES] + (['Rejected'] if suffix else [])
                for axis, values, title in zip(axes, [matrix, normalized], ['Counts', 'Row percentages (recall on diagonal)']):
                    image = axis.imshow(values, cmap='Blues', vmin=0, vmax=100 if title.startswith('Row') else None)
                    for y in range(7):
                        for x in range(values.shape[1]):
                            text = f'{values[y,x]:.1f}%' if title.startswith('Row') else str(int(values[y,x]))
                            axis.text(x, y, text, ha='center', va='center', fontsize=8,
                                      color='white' if values[y, x] > values.max() * 0.55 else 'black')
                    axis.set_xticks(range(len(labels)), labels, rotation=45, ha='right')
                    axis.set_yticks(range(7), labels[:7]); axis.set_title(title)
                    axis.set_xlabel('Predicted result'); axis.set_ylabel('Actual class'); fig.colorbar(image, ax=axis)
                rule = '70% confidence only' if suffix else 'raw top-class predictions'
                fig.suptitle('V5.0.0 mango test confusion matrix: ' + rule + ' (n=397; historical paired reference)')
                fig.tight_layout(); fig.savefig(self.run / f'figures/confusion_matrix{suffix}.png', dpi=150); plt.show(); plt.close(fig)
                fig, axis = plt.subplots(figsize=(16, 6)); positions = np.arange(7)
                for offset, key, label in [(-0.25, 'precision', 'Precision'), (0, 'recall', 'Recall'), (0.25, 'f1', 'F1-score')]:
                    bars = axis.bar(positions + offset, [row[key] for row in record['perClass']], width=0.25, label=label)
                    axis.bar_label(bars, fmt='%.2f', fontsize=9)
                axis.set_xticks(positions, [name.replace('_', ' ').title() + '\n(n=' + str(row['support']) + ')'
                                          for name, row in zip(CLASS_NAMES, record['perClass'])], rotation=15)
                axis.set_ylim(0, 1.15); axis.set_ylabel('Score (1.0 = 100%)'); axis.legend()
                axis.set_title('V5.0.0 per-class metrics: ' + rule)
                fig.text(0.5, 0.01, 'All 397 mango photos remain in support; rejected photos reduce recall. Historical paired reference.', ha='center')
                fig.tight_layout(rect=(0, 0.06, 1, 1)); fig.savefig(self.run / f'figures/per_class_metrics{suffix}.png', dpi=150)
                plt.show(); plt.close(fig)
        paths = [path.relative_to(self.run).as_posix() for path in (self.run / 'figures').glob('*.png')]
        manifest['artifacts'] = receipt_for(self.run, paths)
        save_json_once(self.run / 'figure_manifest.json', manifest)

    def seal(self):
        self.verify_frozen()
        for name in ('training_state.json', 'calibration_complete.json', 'figure_manifest.json'):
            verify_manifest_files(self.run, read_json(self.run / name)['artifacts'])
        calibrated_sha = sha256_file(self.run / 'model_calibrated.keras')
        if (self.run / 'evaluation_complete.json').exists():
            evaluation_receipt = read_json(self.run / 'evaluation_complete.json')
            verify_manifest_files(self.run, evaluation_receipt['artifacts'])
            if (evaluation_receipt['calibratedModelSha256'] != calibrated_sha
                    or evaluation_receipt['configurationHash'] != self.frozen['configurationHash']
                    or evaluation_receipt['thresholds'] != self.plan['thresholds']):
                raise RuntimeError('Evaluation receipt differs from selected model/configuration.')
        elif (self.run / 'evaluation.json').exists():
            raise RuntimeError('Evaluation JSON exists without its sealed completion receipt; preserve the interrupted attempt.')
        if (self.run / 'export_complete.json').exists():
            export_receipt = read_json(self.run / 'export_complete.json')
            verify_manifest_files(self.run, export_receipt['artifacts'])
            if export_receipt['calibratedModelSha256'] != calibrated_sha:
                raise RuntimeError('Browser export uses a different calibrated model.')
        paths = [path.relative_to(self.run).as_posix() for path in sorted(self.run.rglob('*')) if path.is_file()]
        evaluated = (self.run / 'evaluation.json').exists() and bool(read_json(self.run / 'evaluation.json').get('freshOod'))
        complete = evaluated and (self.run / 'export_complete.json').exists()
        save_json_once(self.run / 'experiment_complete.json', {
            'schemaVersion': 1, 'experimentVersion': VERSION, 'modelVersion': MODEL_VERSION,
            'status': 'local experiment complete; adoption/browser evaluation pending' if complete
                      else 'training handoff only; OOD evaluation or browser export pending',
            'configurationHash': self.frozen['configurationHash'], 'completedAt': utc_now(),
            'browserParityPassed': False, 'adopted': False, 'deployed': False,
            'freshOodEvaluationComplete': bool(evaluated),
            'artifacts': receipt_for(self.run, paths)})
        print('Sealed evidence:', self.run / 'experiment_complete.json')


CONTRAST_FACTOR = 0.1
IMAGE_SIZE = (224, 224)
file_sha256 = sha256_file


class ReportingExperiment:
    """Attach genuinely unseen OOD later without changing or retraining the model."""

    def __init__(self, training_run, fresh_ood, output_root, *, allow_shared_inputs=False,
                 source_parent_run=None, source_old_ood=None):
        self.training_run = drive_path(training_run, allow_shared=allow_shared_inputs)
        self.fresh_root = drive_path(fresh_ood, allow_shared=allow_shared_inputs)
        output = drive_path(output_root, output=True)
        assert_disjoint_paths([self.training_run, self.fresh_root, output])
        if 'v5.0.0' not in output.parts or 'v4.5.0' in output.parts:
            raise ValueError('Reporting outputs need a separate V5.0.0 location.')
        receipt_path = self.training_run / 'experiment_complete.json'
        self.source_receipt_sha = sha256_file(receipt_path)
        receipt = read_json(receipt_path)
        if receipt.get('experimentVersion') != VERSION or receipt.get('adopted'):
            raise RuntimeError('Choose the preserved V5.0.0 experimental training handoff.')
        verify_manifest_files(self.training_run, receipt['artifacts'],
                              ['model_calibrated.keras', 'temperature.json', 'input_manifest.json',
                               'plan.json', 'source_provenance.json', 'frozen_inputs.json'])
        self.model_sha = sha256_file(self.training_run / 'model_calibrated.keras')
        provenance = read_json(self.training_run / 'source_provenance.json')
        parent_photos = (drive_path(source_parent_run, allow_shared=allow_shared_inputs)
                         if source_parent_run else Path(provenance['parentRun']))
        old_ood_photos = (drive_path(source_old_ood, allow_shared=allow_shared_inputs)
                          if source_old_ood else Path(provenance['oldOodRoot']))
        assert_disjoint_paths([self.training_run, self.fresh_root, output,
                               parent_photos, old_ood_photos])
        self.plan = read_json(self.training_run / 'plan.json')
        self.manifest = read_json(self.training_run / 'input_manifest.json')
        frozen = read_json(self.training_run / 'frozen_inputs.json')
        if canonical_hash(self.plan) != frozen['configurationHash'] or canonical_hash(self.manifest) != frozen['inputManifestHash']:
            raise RuntimeError('Training manifest/configuration differs from sealed handoff.')
        if self.plan['thresholds'] != {'confidenceThreshold': 0.70, 'marginThreshold': None, 'entropyThreshold': None}:
            raise RuntimeError('Reporting rule differs from fixed confidence-only design.')
        name = 'v5-0-0-report-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8]
        self.run = output / name; self.run.mkdir(parents=True, exist_ok=False)
        shutil.copy2(__file__, self.run / 'v5_workflow.py')
        shutil.copytree(setup_directory, self.run / 'runtime_preflight')
        save_json_once(self.run / 'runtime.json', RUNTIME)
        paths = sorted(path for path in self.fresh_root.rglob('*') if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)
        self.rows = unique_records([inventory_image(safe_child(self.fresh_root, path.relative_to(self.fresh_root).as_posix()),
                                                    pool='fresh_ood', relative=path.relative_to(self.fresh_root).as_posix())
                                    for path in paths])
        if not self.rows:
            raise RuntimeError('Fresh reporting folder is empty.')
        self.similarity_flags = []
        for used in [*self.manifest['mango'], *self.manifest['oe']]:
            for fresh in self.rows:
                if used['decodedRgbSha256'] == fresh['decodedRgbSha256']:
                    raise RuntimeError('Fresh OOD exactly overlaps a previously used photo.')
                distance = (int(used['phash'], 16) ^ int(fresh['phash'], 16)).bit_count()
                if distance <= 5:
                    if used.get('pool') == 'mango':
                        used_path = safe_child(parent_photos / 'dataset', used['relativePath'])
                    elif used.get('pool') == 'original_oe':
                        used_path = safe_child(parent_photos, used['relativePath'])
                    else:
                        used_path = safe_child(old_ood_photos, used['sourceRelativePath'])
                    if not used_path.is_file() or sha256_file(used_path) != used['sha256']:
                        raise RuntimeError('Historical source photo unavailable for a flagged pair. '
                                           'Share the original source folder into this account and set source_parent_run '
                                           'or source_old_ood to that My Drive input shortcut; preserve its bytes.')
                    self.similarity_flags.append({'pairId': canonical_hash([used['sha256'], fresh['sha256']]),
                        'usedId': used['sha256'], 'freshId': fresh['id'], 'distance': distance,
                        'leftPath': str(used_path), 'rightPath': fresh['path'], 'category': 'used_vs_fresh_ood',
                        'usedRelativePath': used.get('relativePath', used['sourceRelativePath']),
                        'freshRelativePath': fresh['sourceRelativePath'], 'decision': '', 'notes': ''})
        write_csv_once(self.run / 'fresh_ood_review.csv',
                       [{'id': row['id'], 'relativePath': row['sourceRelativePath']} for row in self.rows], REVIEW_FIELDS)
        write_csv_once(self.run / 'cross_pool_similarity_review.csv', self.similarity_flags,
                       ['pairId', 'usedId', 'freshId', 'distance', 'usedRelativePath', 'freshRelativePath', 'decision', 'notes'])
        Experiment.contact_sheets(self, self.rows, 'fresh_ood_review')
        Experiment.similarity_contact_sheets(self)
        save_json_once(self.run / 'inventory.json', {'images': portable(self.rows), 'freshRoot': str(self.fresh_root),
            'trainingRun': str(self.training_run), 'trainingReceiptSha256': self.source_receipt_sha})
        print('New reporting attempt:', self.run, '\nSimilarity candidates:', len(self.similarity_flags))

    def approve(self, *, review_complete, review_notes):
        if not review_complete or not review_notes.strip():
            raise RuntimeError('Review fresh OOD scope/provenance and targeted similarities first.')
        self.reporting_rows = validate_review_rows(self.rows, read_csv(self.run / 'fresh_ood_review.csv'), fresh=True)
        if not self.reporting_rows:
            raise RuntimeError('No approved reporting photos.')
        reviews = read_csv(self.run / 'cross_pool_similarity_review.csv')
        by_id = {row['pairId']: row for row in reviews}
        if len(by_id) != len(reviews) or set(by_id) != {row['pairId'] for row in self.similarity_flags}:
            raise RuntimeError('Reporting similarity review differs from generated inventory.')
        for pair in self.similarity_flags:
            row = by_id[pair['pairId']]
            if pair['freshId'] not in {record['id'] for record in self.reporting_rows}:
                continue
            if any(str(row[key]) != str(pair[key]) for key in ('usedId', 'freshId', 'distance')):
                raise RuntimeError('Similarity evidence was edited.')
            if row['decision'].strip().lower() != 'distinct' or not row['notes'].strip():
                raise RuntimeError('Remove related/uncertain fresh images and create a new reporting attempt.')
        for key in ('captureGroup', 'sourceGroup'):
            used = {row.get(key, '').strip() for row in [*self.manifest['mango'], *self.manifest['oe']]} - {''}
            fresh = {row.get(key, '').strip() for row in self.reporting_rows} - {''}
            if used & fresh:
                raise RuntimeError('Reporting photos share a known source/capture group with used photos.')
        self.lock = {'trainingRun': str(self.training_run), 'trainingReceiptSha256': self.source_receipt_sha,
            'calibratedModelSha256': self.model_sha, 'thresholds': self.plan['thresholds'],
            'images': portable(self.reporting_rows), 'reviewNotes': review_notes,
            'helperSha256': sha256_file(__file__), 'role': 'report only; no refitting or threshold tuning',
            'artifacts': receipt_for(self.run, ['fresh_ood_review.csv', 'cross_pool_similarity_review.csv', 'inventory.json'])}
        save_json_once(self.run / 'reporting_lock.json', self.lock)
        print('Reporting pool locked:', len(self.reporting_rows))

    def evaluate(self):
        if read_json(self.run / 'reporting_lock.json') != self.lock:
            raise RuntimeError('Reporting lock changed.')
        if portable(self.reporting_rows) != self.lock['images']:
            raise RuntimeError('Live reporting membership differs from locked pool.')
        if (sha256_file(self.training_run / 'experiment_complete.json') != self.source_receipt_sha
                or sha256_file(self.training_run / 'model_calibrated.keras') != self.model_sha
                or sha256_file(__file__) != self.lock['helperSha256']):
            raise RuntimeError('Training handoff/model/helper changed after reporting lock.')
        verify_manifest_files(self.run, self.lock['artifacts']); verify_images(self.reporting_rows)
        if (self.run / 'evaluation_started.json').exists():
            raise RuntimeError('Reporting already attempted. Preserve results; do not tune against them.')
        save_json_once(self.run / 'evaluation_started.json', {'startedAt': utc_now(), 'reportingLockSha256': sha256_file(self.run / 'reporting_lock.json')})
        model = tf.keras.models.load_model(self.training_run / 'model_calibrated.keras', compile=False, safe_mode=True)
        probabilities = model.predict(dataset(self.reporting_rows, batch_size=16), verbose=0)
        if probabilities.shape != (len(self.reporting_rows), 7) or not np.isfinite(probabilities).all():
            raise RuntimeError('Prediction shape or finite-value check failed.')
        metrics = rejection_metrics(probabilities)
        rows = [{'id': row['id'], 'sha256': row['sha256'], 'predicted': CLASS_NAMES[int(values.argmax())],
                 'confidence': float(values.max()), 'rejected': confidence_decision(values) == 7,
                 **{label: float(value) for label, value in zip(CLASS_NAMES, values)}}
                for row, values in zip(self.reporting_rows, probabilities)]
        write_csv_once(self.run / 'ood_report_predictions.csv', rows, list(rows[0]))
        save_json_once(self.run / 'evaluation.json', {'experimentVersion': VERSION, 'freshOod': metrics,
            'trainingRun': str(self.training_run), 'calibratedModelSha256': self.model_sha,
            'thresholds': self.plan['thresholds'], 'modelWeightsChanged': False,
            'browserParityPassed': False, 'adopted': False,
            'independenceLimit': 'Researcher-declared fresh scope; unknown source/capture provenance remains unknown.'})
        paths = [path.relative_to(self.run).as_posix() for path in self.run.rglob('*') if path.is_file()]
        save_json_once(self.run / 'reporting_complete.json', {'status': 'new OOD reporting complete; adoption/browser checks pending',
            'trainingRun': str(self.training_run), 'trainingReceiptSha256': self.source_receipt_sha,
            'calibratedModelSha256': self.model_sha, 'modelWeightsChanged': False,
            'artifacts': receipt_for(self.run, paths), 'completedAt': utc_now()})
        print(json.dumps(metrics, indent=2))


def install_runtime():
    global setup_directory, setup_receipt, TRAINING_PACKAGES
    import json
    import os
    from pathlib import Path
    import subprocess
    import sys

    # Check Python before mounting Drive or installing scientific packages.
    print('Notebook Python:', sys.version.split()[0])
    if sys.version_info[:2] not in {(3, 11), (3, 12)}:
        raise RuntimeError(
            'Unsupported Python ' + sys.version.split()[0] + '. '
            'Open Runtime > Change runtime type, keep a GPU such as T4, and select '
            'Runtime Version 2026.04 (Python 3.12.13), then rerun Step 1. '
            'If unavailable, use a listed Python 3.11/3.12 runtime: '
            'https://research.google.com/colaboratory/runtime-version-faq.html. '
            'These TensorFlow 2.19.0 pins must not run on an unsupported Python version.'
        )

    from google.colab import drive

    drive.mount('/content/drive')

    TRAINING_PACKAGES = [
        'tensorflow==2.19.0',
        'keras==3.15.1',
        'numpy==2.1.3',
        'Pillow==12.3.0',
        'ImageHash==4.3.2',
        'scipy==1.16.3',
        'matplotlib==3.11.2',
        'scikit-learn==1.9.1',
        'pip-audit==2.10.1',
        'packaging==25.0',
        'uv==0.12.23',
        # Explicit security pins prevent pip from retaining vulnerable provider helpers.
        'pip==26.2.1',
        'setuptools==83.0.0',
        'idna==3.15',
        'msgpack==1.2.1',
        'requests==2.33.0',
        'urllib3==2.8.0',
        'werkzeug==3.1.9',
    ]
    setup_directory = Path('/content/mangoleaf-v500-setup')
    setup_directory.mkdir(exist_ok=True)
    setup_receipt = setup_directory / 'installation.json'
    installed = json.loads(setup_receipt.read_text()) if setup_receipt.is_file() else None

    if installed is None:
        # Upgrade the installer first; this subprocess does not import scientific modules.
        pip_pin = next(pin for pin in TRAINING_PACKAGES if pin.startswith('pip=='))
        bootstrap = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check',
             '--only-binary=:all:', '--no-deps', pip_pin],
            capture_output=True, text=True, check=False,
        )
        (setup_directory / 'pip-bootstrap.log').write_text(bootstrap.stdout + '\n' + bootstrap.stderr)
        if bootstrap.returncode != 0:
            raise RuntimeError('Installer update failed. Read: ' + str(setup_directory / 'pip-bootstrap.log'))
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check',
             '--only-binary=:all:', *TRAINING_PACKAGES],
            capture_output=True, text=True, check=False,
        )
        (setup_directory / 'installation.log').write_text(result.stdout + '\n' + result.stderr)
        if result.returncode != 0:
            raise RuntimeError('Package installation failed. Read: ' + str(setup_directory / 'installation.log'))
        setup_receipt.write_text(json.dumps({
            'packages': TRAINING_PACKAGES, 'installationPid': os.getpid(),
            'python': sys.version, 'restartRequired': True,
        }, indent=2) + '\n')
        print('Installation complete. Restart session, then rerun Step 1 and continue.')
    else:
        if installed['packages'] != TRAINING_PACKAGES:
            raise RuntimeError('Setup pins changed. Use a fresh runtime rather than mixing installation attempts.')
        print('Packages already installed. Restart completed:', installed['installationPid'] != os.getpid())



def verify_runtime(*, require_gpu=True):
    global np, tf, plt, imagehash, RUNTIME, research_names, canonicalize_name
    import csv
    import hashlib
    import importlib.metadata
    import math
    import random
    import shutil
    import uuid
    import zipfile
    from collections import Counter, defaultdict
    from datetime import datetime, timezone
    from pathlib import PurePosixPath

    # Stop before scientific imports can mix pre-install modules with new files.
    installed = json.loads(setup_receipt.read_text())
    if installed['installationPid'] == os.getpid():
        raise RuntimeError('Restart the Colab session after installation, rerun Step 1, then rerun this cell.')

    import imagehash
    import matplotlib.pyplot as plt
    import numpy as np
    from packaging.requirements import Requirement
    from packaging.utils import canonicalize_name
    from PIL import Image, ImageDraw, ImageOps
    from scipy.optimize import minimize_scalar
    from sklearn.utils.class_weight import compute_class_weight
    import tensorflow as tf

    for pin in TRAINING_PACKAGES:
        name, expected = pin.split('==')
        if importlib.metadata.version(name) != expected:
            raise RuntimeError('Runtime version differs from chosen pin: ' + pin)
    if tf.__version__ != '2.19.0' or tf.keras.__version__ != '3.15.1':
        raise RuntimeError('Imported TensorFlow/Keras versions differ from installed pins; restart a clean session.')

    # Audit only the transitive research runtime, rather than treating every
    # unrelated preinstalled Colab provider package as an executed experiment dependency.
    def installed_research_dependencies(pins):
        names = set()
        examined_contexts = set()
        pending_requirements = [Requirement(pin) for pin in pins]
        while pending_requirements:
            requirement = pending_requirements.pop()
            name = canonicalize_name(requirement.name)
            distribution = importlib.metadata.distribution(name)
            if not requirement.specifier.contains(distribution.version, prereleases=True):
                raise RuntimeError(
                    'Research dependency conflict: ' + str(requirement)
                    + '; installed ' + distribution.version
                )
            names.add(name)
            # Extras such as CacheControl[filecache] add dependencies that must be audited.
            # Revisit a package when a later requirement enables a different extra.
            for extra in {''} | requirement.extras:
                context = (name, extra)
                if context in examined_contexts:
                    continue
                examined_contexts.add(context)
                for dependency in distribution.requires or []:
                    child = Requirement(dependency)
                    if child.marker is None or child.marker.evaluate({'extra': extra}):
                        pending_requirements.append(child)
        return names


    research_names = installed_research_dependencies(TRAINING_PACKAGES)

    runtime_lock = setup_directory / 'training-runtime-lock.txt'
    runtime_lock.write_text(''.join(
        name + '==' + importlib.metadata.version(name) + '\n'
        for name in sorted(research_names)
    ), encoding='utf-8')
    audit_path = setup_directory / 'training-audit.json'
    audit = subprocess.run([
        sys.executable, '-m', 'pip_audit', '-r', str(runtime_lock),
        '--no-deps', '--disable-pip', '--format=json', '--output', str(audit_path),
        '--progress-spinner=off',
    ], capture_output=True, text=True, check=False)
    (setup_directory / 'training-audit.log').write_text(audit.stdout + '\n' + audit.stderr)
    audit_report = json.loads(audit_path.read_text()) if audit_path.is_file() else {}
    dependencies = audit_report.get('dependencies', [])
    findings = [row for row in dependencies if row.get('vulns')]
    skipped = [row for row in dependencies if row.get('skip_reason')]
    audited_names = {canonicalize_name(row['name']) for row in dependencies if row.get('name')}
    if audit.returncode != 0 or findings or skipped or audited_names != research_names:
        print('Dependency audit exit:', audit.returncode)
        for row in findings:
            print('Unresolved package:', row['name'], row.get('version', 'unknown'))
            details = sorted({
                vulnerability.get('id', 'unknown') + ' (fix versions: '
                + ', '.join(vulnerability.get('fix_versions', [])) + ')'
                for vulnerability in row['vulns']
            })
            for detail in details:
                print('  ', detail)
        for row in skipped:
            print('Skipped package:', row.get('name', 'unknown'), row['skip_reason'])
        print('Missing packages:', sorted(research_names - audited_names))
        print('Unexpected packages:', sorted(audited_names - research_names))
        print('Full audit and log:', audit_path, setup_directory / 'training-audit.log')
        raise RuntimeError('Training dependency audit incomplete or unresolved. Read ' + str(audit_path))

    provider_check = subprocess.run(
        [sys.executable, '-m', 'pip', 'check'], capture_output=True, text=True, check=False,
    )
    (setup_directory / 'provider-pip-check.log').write_text(provider_check.stdout + '\n' + provider_check.stderr)
    if provider_check.returncode:
        print('Colab provider compatibility findings remain visible:', setup_directory / 'provider-pip-check.log')

    gpus = tf.config.list_physical_devices('GPU')
    if not gpus and require_gpu:
        raise RuntimeError('Select a Colab GPU runtime before training.')
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    with tf.device('/GPU:0' if gpus else '/CPU:0'):
        gpu_probe = tf.linalg.matmul(tf.ones((16, 16)), tf.ones((16, 16)))
    if (gpus and 'GPU' not in gpu_probe.device) or not np.isfinite(gpu_probe.numpy()).all():
        raise RuntimeError('The GPU execution probe failed.')
    RUNTIME = {
        'python': sys.version, 'tensorflow': tf.__version__,
        'packages': {name: importlib.metadata.version(name) for name in sorted(research_names)},
        'trainingDependencyAuditPassed': True, 'providerPipCheckReturnCode': provider_check.returncode,
        'gpuCount': len(gpus), 'gpuProbeDevice': gpu_probe.device,
        'execution': 'ordinary Colab Python cells; no custom cell magic',
        'browserParityPassed': False,
    }
    print('TensorFlow:', tf.__version__, 'Keras:', tf.keras.__version__, 'GPU count:', len(gpus))

    define_training_components()
    if require_gpu:
        RUNTIME['serialTrainingProbe'] = verify_serial_training_runtime('/GPU:0')
    return RUNTIME


def define_training_components():
    global RandomShear, augmentation_layers, augment_batch, uniform_exposure_loss, OETrainer, connected_grad_cam
    class RandomShear(tf.keras.layers.Layer):
        def __init__(self, factor=0.2, **kwargs):
            super().__init__(**kwargs)
            self.factor = factor

        def call(self, inputs, training=False):
            if not training:
                return inputs
            shape = tf.shape(inputs)
            count = shape[0]
            center_x = tf.cast(shape[2], tf.float32) / 2.0
            center_y = tf.cast(shape[1], tf.float32) / 2.0
            shear_x = tf.random.uniform([count], -self.factor, self.factor)
            shear_y = tf.random.uniform([count], -self.factor, self.factor)
            one, zero = tf.ones_like(shear_x), tf.zeros_like(shear_x)
            transforms = tf.stack((one, shear_x, -shear_x * center_y, shear_y, one, -shear_y * center_x, zero, zero), axis=1)
            return tf.raw_ops.ImageProjectiveTransformV3(
                images=inputs, transforms=transforms, output_shape=shape[1:3],
                interpolation='BILINEAR', fill_mode='NEAREST', fill_value=0.0,
            )


    def augmentation_layers(seed):
        with tf.device('/CPU:0'):
            return [
                tf.keras.layers.RandomFlip('horizontal_and_vertical', seed=seed),
                tf.keras.layers.RandomRotation(30 / 360, fill_mode='nearest', seed=seed + 1),
                tf.keras.layers.RandomZoom(0.2, fill_mode='nearest', seed=seed + 2),
                RandomShear(0.2),
                tf.keras.layers.RandomBrightness(0.2, value_range=(0, 255), seed=seed + 3),
                tf.keras.layers.RandomContrast(CONTRAST_FACTOR, value_range=(0, 255), seed=seed + 4),
            ]


    def augment_batch(pixels, layers):
        with tf.device('/CPU:0'):
            output = tf.convert_to_tensor(pixels, dtype=tf.float32)
            for layer in layers:
                output = layer(output, training=True)
            return tf.clip_by_value(output, 0.0, 255.0)



    def uniform_exposure_loss(logits):
        return -tf.reduce_mean(tf.nn.log_softmax(logits, axis=-1), axis=-1)



    class OETrainer(tf.keras.Model):
        def __init__(self, classifier_logits, balanced_weights, oe_weight):
            super().__init__(name='mangoleaf_oe_training_wrapper')
            self.classifier_logits = classifier_logits
            self.balanced_weights = tf.constant(balanced_weights, dtype=tf.float32)
            self.oe_weight = tf.constant(oe_weight, dtype=tf.float32)
            self.total_tracker = tf.keras.metrics.Mean(name='loss')
            self.mango_tracker = tf.keras.metrics.Mean(name='mango_loss')
            self.oe_tracker = tf.keras.metrics.Mean(name='oe_loss')
            self.accuracy_tracker = tf.keras.metrics.SparseCategoricalAccuracy(name='accuracy')

        def call(self, inputs, training=False):
            # Keras uses call() for symbolic shape/build checks before fit. The
            # custom train_step still computes both mango and OE objectives.
            pixels = inputs['mango'] if isinstance(inputs, dict) else inputs
            return self.classifier_logits(pixels, training=training)

        @property
        def metrics(self):
            return [self.total_tracker, self.mango_tracker, self.oe_tracker, self.accuracy_tracker]

        def train_step(self, data):
            inputs, labels, _ = tf.keras.utils.unpack_x_y_sample_weight(data)
            with tf.GradientTape() as tape:
                mango_logits = self.classifier_logits(inputs['mango'], training=True)
                outlier_logits = self.classifier_logits(inputs['oe'], training=True)
                original_losses = tf.keras.losses.sparse_categorical_crossentropy(labels, mango_logits, from_logits=True)
                per_photo_weighted = original_losses * tf.gather(self.balanced_weights, labels)
                supervised_loss = tf.reduce_mean(per_photo_weighted)
                # A uniform target uses every output class equally. OE has no
                # fabricated Healthy Leaf label and no additional output class.
                per_outlier_loss = uniform_exposure_loss(outlier_logits)
                oe_loss = tf.reduce_mean(per_outlier_loss)
                total_loss = supervised_loss + self.oe_weight * oe_loss
            variables = self.classifier_logits.trainable_variables
            gradients = tape.gradient(total_loss, variables)
            pairs = [(gradient, variable) for gradient, variable in zip(gradients, variables) if gradient is not None]
            if len(pairs) != len(variables):
                raise RuntimeError('A trainable classifier variable has no gradient.')
            self.optimizer.apply_gradients(pairs)
            self.total_tracker.update_state(total_loss, sample_weight=tf.cast(tf.shape(labels)[0], tf.float32))
            self.mango_tracker.update_state(per_photo_weighted)
            self.oe_tracker.update_state(per_outlier_loss)
            self.accuracy_tracker.update_state(labels, tf.nn.softmax(mango_logits))
            return {metric.name: metric.result() for metric in self.metrics}

        def test_step(self, data):
            pixels, labels, _ = tf.keras.utils.unpack_x_y_sample_weight(data)
            logits = self.classifier_logits(pixels, training=False)
            # Validation loss is clean, unweighted mango cross-entropy. It never
            # includes OE uncertainty loss or balanced training class weights.
            clean_losses = tf.keras.losses.sparse_categorical_crossentropy(labels, logits, from_logits=True)
            self.total_tracker.update_state(clean_losses)
            self.mango_tracker.update_state(clean_losses)
            self.oe_tracker.update_state(0.0)
            self.accuracy_tracker.update_state(labels, tf.nn.softmax(logits))
            return {metric.name: metric.result() for metric in self.metrics}



    def connected_grad_cam(classifier, batch, target_index):
        backbone = next((layer for layer in classifier.layers if isinstance(layer, tf.keras.Model)), None)
        if backbone is None:
            raise ValueError('A connected MobileNet backbone is required for Grad-CAM.')
        head_layers = classifier.layers[classifier.layers.index(backbone) + 1:]
        dense = next((layer for layer in head_layers if isinstance(layer, tf.keras.layers.Dense)), None)
        if dense is None or dense.get_config()['activation'] != 'linear':
            raise ValueError('Grad-CAM requires the real linear classifier logits.')
        features = backbone(batch, training=False)
        if features.shape.rank != 4:
            raise ValueError('Backbone output must be a spatial feature map.')
        with tf.GradientTape() as tape:
            tape.watch(features)
            output = features
            for layer in head_layers:
                output = layer(output, training=False)
                if layer is dense:
                    logits = output
                    break
            score = logits[:, target_index]
        gradients = tape.gradient(score, features)
        if gradients is None or not np.isfinite(gradients.numpy()).all():
            raise RuntimeError('Grad-CAM gradients are missing or non-finite.')
        weights = tf.reduce_mean(gradients, axis=(1, 2))
        heatmap = tf.maximum(tf.reduce_sum(features[0] * weights[0], axis=-1), 0)
        maximum = float(tf.reduce_max(heatmap))
        if maximum > 0:
            heatmap = heatmap / maximum
        resized = tf.image.resize(heatmap[..., None], batch.shape[1:3], method='bilinear')[..., 0]
        return resized.numpy(), maximum > 0, backbone.name, dense.name





def prepare_converter(run_dir):
    global CONVERTER_COMMAND, CONVERTER_ENVIRONMENT, convert_saved_model
    RUN_DIR = Path(run_dir)
    run_id = RUN_DIR.name
    SEED = 42
    CONVERTER_PACKAGES = [
        'pip==26.2.1', 'pip-audit==2.10.1', 'setuptools==81.0.0', 'wheel==0.45.1',
        'tensorflow==2.19.0', 'tf-keras==2.19.0',
        'tensorflow-decision-forests==1.12.0', 'tensorflow-hub==0.16.1',
        'ydf==0.11.0', 'protobuf==5.29.6', 'tensorflowjs==4.22.0',
        'keras==3.15.1', 'numpy==2.1.3', 'Pillow==12.3.0',
        'jax==0.4.35', 'jaxlib==0.4.35', 'flax==0.10.2', 'packaging==23.2',
        'idna==3.15', 'msgpack==1.2.1', 'requests==2.33.0',
        'urllib3==2.8.0', 'werkzeug==3.1.9',
    ]
    # TensorFlow.js requires packaging 23.x. TFDF also requires wheel, whose
    # compatible 0.45.1 release has a known unused unpack-operation advisory.
    def prepare_converter_evidence(run_dir):
        evidence = Path(run_dir) / 'converter_preflight'
        evidence.mkdir(exist_ok=False)
        return evidence


    converter_evidence = prepare_converter_evidence(RUN_DIR)
    # A new subprocess environment keeps the failed environment and active kernel intact.
    converter_environment_root = Path('/content/mangoleaf-v500-converter') / (run_id + '-' + uuid.uuid4().hex[:8])
    converter_environment_root.parent.mkdir(parents=True, exist_ok=True)
    CONVERTER_ENVIRONMENT = dict(os.environ)
    for key in ('PYTHONPATH', 'PYTHONHOME', 'VIRTUAL_ENV', 'TF_USE_LEGACY_KERAS'):
        CONVERTER_ENVIRONMENT.pop(key, None)
    CONVERTER_ENVIRONMENT.update({'PYTHONNOUSERSITE': '1', 'CUDA_VISIBLE_DEVICES': '-1', 'TF_CPP_MIN_LOG_LEVEL': '2'})


    def converter_run(command, log_name):
        result = subprocess.run(command, env=CONVERTER_ENVIRONMENT, capture_output=True, text=True, check=False)
        with (converter_evidence / log_name).open('x', encoding='utf-8') as handle:
            handle.write(result.stdout + '\n' + result.stderr)
        if result.returncode != 0:
            print((result.stdout + '\n' + result.stderr)[-4000:])
            raise RuntimeError('Converter preparation failed. Inspect: ' + str(converter_evidence / log_name))
        return result


    converter_run([sys.executable, '-m', 'uv', 'venv', '--python', '3.11', str(converter_environment_root)], 'environment-setup.log')
    CONVERTER_PYTHON = converter_environment_root / 'bin/python'
    CONVERTER_COMMAND = converter_environment_root / 'bin/tensorflowjs_converter'
    converter_run([
        sys.executable, '-m', 'uv', 'pip', 'install', '--python', str(CONVERTER_PYTHON),
        '--only-binary=:all:', *CONVERTER_PACKAGES,
    ], 'package-installation.log')
    converter_run([str(CONVERTER_PYTHON), '-m', 'pip', 'check'], 'pip-check.log')
    freeze_result = converter_run([str(CONVERTER_PYTHON), '-m', 'pip', 'freeze', '--all'], 'freeze.log')
    (converter_evidence / 'converter-runtime-lock.txt').write_text(freeze_result.stdout, encoding='utf-8')
    audit_path = converter_evidence / 'audit.json'
    audit = subprocess.run([
        str(CONVERTER_PYTHON), '-m', 'pip_audit', '--format=json',
        '--output', str(audit_path), '--progress-spinner=off',
    ], env=CONVERTER_ENVIRONMENT, capture_output=True, text=True, check=False)
    (converter_evidence / 'audit.log').write_text(audit.stdout + '\n' + audit.stderr)
    report = read_json(audit_path) if audit_path.is_file() else {}
    dependencies = report.get('dependencies', [])
    findings = [row for row in dependencies if row.get('vulns')]
    skipped = [row for row in dependencies if row.get('skip_reason')]
    known_sdist_aliases = {'GHSA-h35f-9h28-mq5c', 'CVE-2026-59890', 'PYSEC-2026-3447', 'BIT-setuptools-2026-59890'}
    known_wheel_unpack_aliases = {'GHSA-8rrh-rw8j-w5fx', 'CVE-2026-24049'}
    operation_reviews = []
    blocking = []
    for finding in findings:
        identities = [{vulnerability.get('id'), *vulnerability.get('aliases', [])} for vulnerability in finding['vulns']]
        reviewed_sdist = (
            canonicalize_name(finding['name']) == 'setuptools' and finding['version'] == '81.0.0'
            and identities and all(identity and identity <= known_sdist_aliases for identity in identities)
        )
        reviewed_wheel_unpack = (
            canonicalize_name(finding['name']) == 'wheel' and finding['version'] == '0.45.1'
            and identities and all(identity and identity <= known_wheel_unpack_aliases for identity in identities)
        )
        if reviewed_sdist:
            operation_reviews.append({
                'package': 'setuptools', 'version': '81.0.0', 'advisory': 'GHSA-h35f-9h28-mq5c',
                'status': 'unresolved advisory; affected source-distribution build/publish operation absent',
                'reason': 'TensorFlow Hub imports pkg_resources. Installation is wheels-only through uv; this environment only converts SavedModels and never builds or publishes source distributions.',
                'source': 'https://github.com/advisories/GHSA-h35f-9h28-mq5c',
            })
        elif reviewed_wheel_unpack:
            operation_reviews.append({
                'package': 'wheel', 'version': '0.45.1', 'advisory': 'GHSA-8rrh-rw8j-w5fx',
                'status': 'unresolved advisory; affected wheel unpack/RECORD permission operation absent',
                'reason': 'TFDF requires wheel and TensorFlow.js requires packaging 23.x. uv installs published binary wheels independently; this converter never calls wheel.cli.unpack or WheelFile permission extraction.',
                'source': 'https://github.com/advisories/GHSA-8rrh-rw8j-w5fx',
            })
        else:
            blocking.append(finding)
    audit_allowed = bool(dependencies) and not skipped and not blocking and (
        audit.returncode == 0 and not findings or audit.returncode == 1 and bool(operation_reviews)
    )
    save_json_once(converter_evidence / 'audit-summary.json', {
        'findings': findings, 'skipped': skipped, 'returnCode': audit.returncode,
        'operationReviews': operation_reviews, 'executionAllowed': bool(audit_allowed),
        'status': 'passed' if not findings and audit_allowed else 'unresolved',
    })
    if not audit_allowed:
        raise RuntimeError('Converter audit contains unresolved execution findings or incomplete collection. Read ' + str(audit_path))
    if operation_reviews:
        print('Known unused packaging-operation advisories remain visible:', audit_path)


    def convert_saved_model(saved_model_path, export_path, log_path):
        result = subprocess.run([
            str(CONVERTER_COMMAND), '--input_format=tf_saved_model',
            '--output_format=tfjs_graph_model', '--signature_name=serving_default',
            '--saved_model_tags=serve', str(saved_model_path), str(export_path),
        ], env=CONVERTER_ENVIRONMENT, capture_output=True, text=True, check=False)
        Path(log_path).write_text(result.stdout + '\n' + result.stderr, encoding='utf-8')
        if result.returncode != 0:
            raise RuntimeError('Converter failed. Inspect ' + str(log_path))
        graph = read_json(export_path / 'model.json')
        if graph.get('format') != 'graph-model' or not graph.get('weightsManifest'):
            raise RuntimeError('Converter did not produce a TensorFlow.js graph model.')
        for group in graph['weightsManifest']:
            for relative in group['paths']:
                safe_child(export_path, relative).stat()
            if any(weight.get('quantization') is not None for weight in group['weights']):
                raise RuntimeError('This experiment requires unquantized float32 export.')


    probe_backbone = tf.keras.applications.MobileNetV3Large(
        input_shape=(224, 224, 3), include_top=False, weights=None, include_preprocessing=True,
    )
    probe_inputs = tf.keras.Input((224, 224, 3), dtype=tf.float32, name='image')
    probe_features = probe_backbone(probe_inputs, training=False)
    probe_pooled = tf.keras.layers.GlobalAveragePooling2D()(probe_features)
    probe_outputs = tf.keras.layers.Dense(7, activation='softmax')(probe_pooled)
    probe_model = tf.keras.Model(probe_inputs, probe_outputs)
    probe_model.export(converter_evidence / 'probe_saved_model', verbose=False)
    convert_saved_model(converter_evidence / 'probe_saved_model', converter_evidence / 'probe_tfjs', converter_evidence / 'conversion.log')
    save_json_once(RUN_DIR / 'converter_preflight.json', {
        'passed': True, 'trainingEpochs': 0, 'weights': 'random architecture probe',
        'tfjsFormat': 'graph-model', 'quantized': False,
        'browserProbabilityParity': 'pending actual browser comparison',
        'pins': CONVERTER_PACKAGES,
    })
    del probe_model, probe_backbone
    tf.keras.utils.set_random_seed(SEED)
    print('Fresh architecture conversion completed; no accuracy measured.')

    return read_json(RUN_DIR / 'converter_preflight.json')

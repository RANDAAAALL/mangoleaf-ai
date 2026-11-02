"""Check V5.1.0 notebook contracts with standard-library synthetic fixtures.

Does not mount Drive, install packages, download weights, train, or claim model
accuracy. TensorFlow/GPU/Colab execution remains a separate required check.
"""

import ast
import copy
import hashlib
import json
import math
import os
import random
import re
import shutil
import tempfile
import unittest
import sys
import uuid
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath
from types import SimpleNamespace
from contextlib import contextmanager
from datetime import datetime, timezone
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'notebooks/non-experiment/v5.1.0'
CLASSES = ['anthracnose', 'bacterial_black_spot', 'bacterial_canker',
           'healthy_fruit', 'healthy_leaf', 'mango_scab', 'sooty_mold']


def read_notebook(name):
    """Load clean template JSON and compile every ordinary Python cell."""
    path = DIRECTORY / name
    notebook = json.loads(path.read_text(encoding='utf-8'))
    if notebook['nbformat'] != 4 or notebook['nbformat_minor'] != 5:
        raise AssertionError('Unexpected notebook format.')
    for cell in notebook['cells']:
        if cell['cell_type'] == 'code':
            if cell['outputs'] or cell['execution_count'] is not None:
                raise AssertionError('Template contains claimed execution evidence.')
            source = ''.join(cell['source'])
            if re.search(r'^\s*[!%]', source, re.M):
                raise AssertionError('Custom notebook execution magic found.')
            compile(source, str(path), 'exec')
    return notebook


TRAIN = read_notebook('MangoLeaf_AI_Training_v5_1_0.ipynb')
EVAL = read_notebook('MangoLeaf_AI_Evaluate_v5_1_0.ipynb')


def code(notebook):
    return '\n\n'.join(''.join(cell['source']) for cell in notebook['cells'] if cell['cell_type'] == 'code')


def functions(notebook, names, namespace=None):
    """Execute selected pure helpers without executing notebook side effects."""
    namespace = dict(namespace or {})
    tree = ast.parse(code(notebook))
    nodes = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names]
    if {node.name for node in nodes} != set(names):
        raise AssertionError('Missing helper definition.')
    exec(compile(ast.Module(body=nodes, type_ignores=[]), '<notebook-helpers>', 'exec'), namespace)
    return namespace


def literal(notebook, name):
    for node in ast.parse(code(notebook)).body:
        if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == name for target in node.targets):
            return ast.literal_eval(node.value)
    raise AssertionError('Missing literal ' + name)


def clean_node(node):
    """Ignore explanatory docstrings when comparing historical algorithm bodies."""
    node = copy.deepcopy(node)
    for child in ast.walk(node):
        if isinstance(child, (ast.FunctionDef, ast.ClassDef)) and ast.get_docstring(child):
            child.body.pop(0)
    return ast.dump(node, include_attributes=False)


def find_definition(source, name):
    return next(node for node in ast.parse(source).body if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name == name)


class NotebookContracts(unittest.TestCase):
    def test_explanations_and_clean_templates(self):
        for notebook, expected_steps in ((TRAIN, 18), (EVAL, 9)):
            cells = notebook['cells']
            self.assertEqual(len({cell['id'] for cell in cells}), len(cells))
            steps = [''.join(cell['source']) for cell in cells
                     if cell['cell_type'] == 'markdown' and ''.join(cell['source']).startswith('## Step ')]
            self.assertEqual([int(re.search(r'Step (\d+):', step).group(1)) for step in steps], list(range(1, expected_steps + 1)))
            for step in steps:
                for label in ('What', 'Why', 'How', 'Expected result'):
                    self.assertIn('**' + label + ':**', step)
            for node in ast.walk(ast.parse(code(notebook))):
                if isinstance(node, ast.FunctionDef):
                    self.assertIsNotNone(ast.get_docstring(node), node.name + ' needs a concise description')

    def test_recipe_and_no_old_model_initialization(self):
        settings = {'STAGE1_EPOCHS': 5, 'STAGE2_EPOCHS': 10,
                    'STAGE1_LEARNING_RATE': 0.001, 'STAGE2_LEARNING_RATE': 0.00001,
                    'BATCH_SIZE': 32, 'OE_LOSS_WEIGHT': 0.5, 'CONTRAST_FACTOR': 0.1,
                    'CONFIDENCE_THRESHOLD': 0.70, 'CLASS_NAMES': CLASSES}
        for name, expected in settings.items():
            self.assertEqual(literal(TRAIN, name), expected)
        self.assertIn("weights='imagenet'", code(TRAIN))
        self.assertIn('base_model.trainable = False', code(TRAIN))
        self.assertIn('isinstance(layer, tf.keras.layers.BatchNormalization)', code(TRAIN))
        for source in (code(TRAIN), code(EVAL)):
            self.assertNotIn('marginThreshold', source)
            self.assertNotIn('entropyThreshold', source)
            self.assertNotIn('select_thresholds', source)
        self.assertNotIn('PARENT_RUN', code(TRAIN))
        self.assertNotIn('v5_workflow', code(TRAIN))

    def test_v450_augmentation_and_gradcam_are_preserved(self):
        path = ROOT / 'notebooks/non-experiment/v4.5.0/MangoLeaf_AI_Training_v4_5_0.ipynb'
        parent = json.loads(path.read_text(encoding='utf-8'))
        for name in ('RandomShear', 'augmentation_layers', 'augment_batch', 'uniform_exposure_loss', 'connected_grad_cam'):
            self.assertEqual(clean_node(find_definition(code(TRAIN), name)), clean_node(find_definition(code(parent), name)), name)
        self.assertEqual(literal(TRAIN, 'REVIEWED_IMAGES'), literal(parent, 'REVIEWED_IMAGES'))

    def test_reference_records_and_hash_pins(self):
        pins = literal(TRAIN, 'REFERENCE_SHA256')
        self.assertEqual(len(pins), 3)
        for name, expected in pins.items():
            self.assertEqual(hashlib.sha256((DIRECTORY / 'reference-inputs' / name).read_bytes()).hexdigest(), expected)
        old = json.loads((DIRECTORY / 'reference-inputs/v5-training-input-manifest.json').read_text(encoding='utf-8'))
        original = json.loads((ROOT / 'docs/model-training/experiment/v5.0.0/artifacts/training/input_manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(old, original)
        self.assertEqual((len(old['mango']), len(old['oe']), len(old['examples'])), (2649, 2511, 7))
        parent_previews = json.loads((ROOT / 'docs/model-training/non-experiment/v4.5.0/artifacts/training/example_selection.json').read_text(encoding='utf-8'))
        self.assertEqual([row['sha256'] for row in old['examples']], [row['sha256'] for row in parent_previews['images']])
        self.assertEqual(Counter(row['subset'] for row in old['mango']), {'train': 1854, 'val': 398, 'test': 397})
        self.assertEqual(Counter(row['pool'] for row in old['oe']), {'original_oe': 2011, 'transferred_ood': 500})
        reporting = json.loads((DIRECTORY / 'reference-inputs/v5-evaluation-reporting-lock.json').read_text(encoding='utf-8'))
        self.assertEqual(len(reporting['images']), 995)
        for field in ('sha256', 'decodedRgbSha256'):
            self.assertEqual(len({row[field] for row in old['oe']}), 2511)
            self.assertFalse({row[field] for row in old['oe']} & {row[field] for row in reporting['images']})
        new = json.loads((DIRECTORY / 'reference-inputs/new-dataset-identities.json').read_text(encoding='utf-8'))
        self.assertEqual(len(new['images']), 71)
        self.assertEqual(Counter(row['label'] for row in new['images']), {
            'healthy_fruit': 45, 'healthy_leaf': 15, 'mango_scab': 9, 'sooty_mold': 1, 'bacterial_black_spot': 1})
        self.assertFalse({row['sha256'] for row in new['images']} & {row['sha256'] for row in old['mango']})

    def test_group_preservation_and_conflict(self):
        namespace = functions(TRAIN, {'assign_preserving_groups'}, {'defaultdict': defaultdict, 'Counter': Counter, 'random': random})
        assign = namespace['assign_preserving_groups']
        rows, fixed = [], {}
        for label in CLASSES:
            for subset in ('train', 'val', 'test'):
                key = label + subset
                rows.append({'id': key, 'sha256': key, 'label': label, 'groupId': key})
                fixed[key] = subset
        rows += [{'id': 'new1', 'sha256': 'new1', 'label': 'healthy_fruit', 'groupId': 'healthy_fruittest'},
                 {'id': 'new2', 'sha256': 'new2', 'label': 'healthy_leaf', 'groupId': 'new_group'},
                 {'id': 'new3', 'sha256': 'new3', 'label': 'healthy_leaf', 'groupId': 'new_group'}]
        assignments, counts = assign(rows, fixed, 42, CLASSES)
        for row in rows:
            if row['sha256'] in fixed:
                self.assertEqual(assignments[row['groupId']], fixed[row['sha256']])
        self.assertEqual(assignments['healthy_fruittest'], 'test')
        self.assertEqual(sum(sum(values.values()) for values in counts.values()), len(rows))
        self.assertEqual(assign(rows, fixed, 42, CLASSES), (assignments, counts))
        conflict = copy.deepcopy(rows)
        conflict[0]['groupId'] = conflict[1]['groupId']
        with self.assertRaises(RuntimeError):
            assign(conflict, fixed, 42, CLASSES)

    def test_related_group_connections(self):
        namespace = functions(TRAIN, {'connected_groups'})
        connect = namespace['connected_groups']
        rows = [{'id': 'a'}, {'id': 'b'}, {'id': 'c'}]
        pair = [{'firstId': 'b', 'secondId': 'c'}]
        groups = connect(rows, pair, [], [['a', 'b']])
        self.assertEqual(len(set(groups.values())), 1)
        groups = connect(rows, pair, [['b', 'c']], [['a', 'b']])
        self.assertEqual(groups['a'], groups['b'])
        self.assertNotEqual(groups['a'], groups['c'])
        with self.assertRaises(ValueError):
            connect(rows, pair, [['a', 'c']], [])

    def test_exact_cross_pool_leakage_blocks(self):
        check = functions(TRAIN, {'assert_disjoint_pools'})['assert_disjoint_pools']
        first = [{'sha256': 'a', 'decodedRgbSha256': 'x'}]
        second = [{'sha256': 'b', 'decodedRgbSha256': 'y'}]
        check([('training', first), ('reporting', second)])
        for other in ([{'sha256': 'a', 'decodedRgbSha256': 'y'}], [{'sha256': 'b', 'decodedRgbSha256': 'x'}]):
            with self.assertRaises(RuntimeError):
                check([('training', first), ('reporting', other)])
        with self.assertRaises(RuntimeError):
            check([('training', first + first)])

    def test_safe_paths_and_evidence_preservation(self):
        namespace = functions(TRAIN, {'safe_child', 'save_json_once', 'read_json', 'file_sha256'}, {
            'Path': Path, 'PurePosixPath': PurePosixPath, 'hashlib': hashlib, 'json': json})
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ('../escape', '/absolute', 'C:/absolute', '..\\escape', '.'):
                with self.assertRaises(ValueError):
                    namespace['safe_child'](root, name)
            self.assertEqual(namespace['safe_child'](root, 'dataset/test/image.jpg'), (root / 'dataset/test/image.jpg').resolve())
            destination = root / 'evidence.json'
            namespace['save_json_once'](destination, {'value': 1})
            before = destination.read_bytes()
            namespace['save_json_once'](destination, {'value': 1})
            with self.assertRaises(RuntimeError):
                namespace['save_json_once'](destination, {'value': 2})
            self.assertEqual(destination.read_bytes(), before)

    def test_recorded_selection_ignores_extra_raw_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name, data in [('healthy_leaf/a.jpg', b'recorded'), ('healthy_leaf/b.jpg', b'excluded')]:
                destination = root / name
                destination.parent.mkdir(exist_ok=True)
                destination.write_bytes(data)
            expected = [{'sha256': hashlib.sha256(b'recorded').hexdigest(), 'label': 'healthy_leaf',
                         'sourceRelativePath': 'healthy_leaf/a.jpg', 'decodedRgbSha256': 'pixels', 'phash': '0000000000000000',
                         'bytes': 8, 'dimensions': [2, 3]}]

            def inventory(folder, pool, labelled, paths):
                return [{'id': expected[0]['sha256'][:20], 'pool': pool, 'path': str(path), 'label': path.parent.name,
                         'sourceRelativePath': path.relative_to(folder).as_posix(), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'decodedRgbSha256': 'pixels', 'phash': '0000000000000000', 'bytes': path.stat().st_size, 'dimensions': [2, 3]}
                        for path in paths]

            namespace = functions(TRAIN, {'select_recorded_images', 'reconcile_recorded_images', 'safe_child', 'file_sha256', 'portable_rows'}, {
                'Path': Path, 'PurePosixPath': PurePosixPath, 'hashlib': hashlib, 'defaultdict': defaultdict,
                'image_paths': lambda folder: sorted(folder.rglob('*.jpg')), 'image_inventory': inventory,
                'read_inventory_checkpoint': lambda *args: None, 'write_inventory_checkpoint': lambda *args: None,
                'save_json_once': lambda *args: None, 'RUN_DIR': root})
            result = namespace['select_recorded_images'](root, expected, 'fixture', True)
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0]['sha256'], expected[0]['sha256'])
            changed = copy.deepcopy(expected)
            changed[0]['decodedRgbSha256'] = 'wrong-decode'
            with self.assertRaises(RuntimeError):
                namespace['select_recorded_images'](root, changed, 'fixture', True)
            (root / 'healthy_leaf/a.jpg').write_bytes(b'changed')
            with self.assertRaises(RuntimeError):
                namespace['select_recorded_images'](root, expected, 'fixture', True)

    def test_shared_evaluation_inputs_require_permission_and_outputs_stay_owned(self):
        helpers = functions(EVAL, {'drive_input_path', 'owned_my_drive_path'}, {'Path': Path})
        with tempfile.TemporaryDirectory() as directory:
            drive = Path(directory).resolve() / 'drive'
            owned = drive / 'MyDrive'
            owned_run = owned / 'local-run'
            shared = drive / '.shortcut-targets-by-id/source-owner/v5.1.0'
            owned_run.mkdir(parents=True)
            shared.mkdir(parents=True)
            shortcut = owned / 'v5.1.0'
            original_resolve = type(owned).resolve

            def resolve(path, *args, **kwargs):
                # Model Colab's shortcut target without requiring Windows symlink privileges.
                if path == shortcut or path.is_relative_to(shortcut):
                    path = shared / path.relative_to(shortcut)
                return original_resolve(path, *args, **kwargs)

            with patch.object(type(owned), 'resolve', resolve):
                self.assertEqual(helpers['drive_input_path'](owned_run, my_drive=owned), owned_run)
                with self.assertRaises(ValueError):
                    helpers['drive_input_path'](shortcut, my_drive=owned)
                selected = helpers['drive_input_path'](shortcut, allow_shared=True, my_drive=owned)
                self.assertEqual(selected.resolve(), shared.resolve())
                with self.assertRaises(ValueError):
                    helpers['owned_my_drive_path'](shortcut / 'evaluation', my_drive=owned)
                output = owned / 'mangoleaf_v5_1_0_evaluations'
                self.assertEqual(helpers['owned_my_drive_path'](output, my_drive=owned), output.resolve())
                for invalid in (drive / 'elsewhere', owned, owned / '..' / 'escape', shared):
                    with self.assertRaises(ValueError):
                        helpers['drive_input_path'](invalid, allow_shared=True, my_drive=owned)
                with self.assertRaises(FileNotFoundError):
                    helpers['drive_input_path'](owned / 'missing', allow_shared=True, my_drive=owned)

    def test_shared_training_handoff_is_read_only_and_detects_changed_model(self):
        source = next(''.join(item['source']) for item in EVAL['cells']
                      if item['cell_type'] == 'code' and 'TRAINING_RUN =' in ''.join(item['source']))
        self.assertFalse(literal(EVAL, 'ALLOW_SHARED_INPUT_SHORTCUTS'))
        with tempfile.TemporaryDirectory() as directory:
            drive = Path(directory).resolve() / 'drive'
            owned = drive / 'MyDrive'
            shared = drive / '.shortcut-targets-by-id/source-owner/v5.1.0'
            run = shared / 'training/fixture-run'
            shortcut = owned / 'v5.1.0'
            owned.mkdir(parents=True)
            (run / 'reference-inputs').mkdir(parents=True)
            setup = Path(directory) / 'setup'
            setup.mkdir()
            (setup / 'receipt.json').write_text('{}', encoding='utf-8')
            reporting = [{'relativePath': f'ood/{i}.jpg', 'sha256': str(i)} for i in range(995)]
            fixtures = {
                'plan.json': {'confidenceThreshold': 0.70},
                'input_manifest.json': {'classNames': CLASSES, 'experimentVersion': 'v5.1.0',
                                        'images': [{'relativePath': 'test/mango.jpg', 'subset': 'test'}]},
                'oe_dataset_manifest.json': {'images': [{'relativePath': f'oe/{i}.jpg'} for i in range(2511)]},
                'reporting_ood_manifest.json': {'images': reporting},
                'reference-inputs/v5-evaluation-reporting-lock.json': {'images': reporting},
            }
            for relative, value in fixtures.items():
                (run / relative).write_text(json.dumps(value), encoding='utf-8')
            (run / 'model_calibrated.keras').write_bytes(b'synthetic-model-not-for-inference')
            receipt = {'experimentVersion': 'v5.1.0', 'completedEpochs': 15, 'classNames': CLASSES,
                       'temperatureFoldedIntoWeights': True, 'artifacts': {
                           path.relative_to(run).as_posix(): {'bytes': path.stat().st_size,
                               'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                           for path in run.rglob('*') if path.is_file()}}
            (run / 'training_complete.json').write_text(json.dumps(receipt), encoding='utf-8')
            before = {path: path.read_bytes() for path in run.rglob('*') if path.is_file()}
            namespace = functions(EVAL, {'drive_input_path', 'owned_my_drive_path', 'file_sha256',
                                        'read_json', 'save_json_once', 'safe_child'},
                                  {'Path': Path, 'PurePosixPath': PurePosixPath, 'hashlib': hashlib, 'json': json})
            input_helper, output_helper = namespace['drive_input_path'], namespace['owned_my_drive_path']
            namespace.update({'drive_input_path': lambda path, allow_shared=False: input_helper(path, allow_shared, owned),
                              'owned_my_drive_path': lambda path: output_helper(path, owned),
                              'datetime': datetime, 'timezone': timezone, 'uuid': uuid, 'shutil': shutil,
                              'setup_directory': setup, 'RUNTIME': {'evaluationDevice': '/CPU:0'}})
            tree = ast.parse(source)
            tree.body = [node for node in tree.body if not isinstance(node, (ast.FunctionDef, ast.ClassDef))]
            overrides = {'DRIVE_ROOT': f'Path({str(owned)!r})',
                         'TRAINING_RUN': "DRIVE_ROOT / 'v5.1.0/training/fixture-run'",
                         'ALLOW_SHARED_INPUT_SHORTCUTS': 'True'}
            for node in tree.body:
                if isinstance(node, ast.Assign):
                    name = node.targets[0].id if isinstance(node.targets[0], ast.Name) else None
                    if name in overrides:
                        node.value = ast.parse(overrides.pop(name), mode='eval').body
            executable = compile(ast.fix_missing_locations(tree), '<shared-evaluation-config>', 'exec')
            original_resolve = type(owned).resolve

            def resolve(path, *args, **kwargs):
                if path == shortcut or path.is_relative_to(shortcut):
                    path = shared / path.relative_to(shortcut)
                return original_resolve(path, *args, **kwargs)

            with patch.object(type(owned), 'resolve', resolve):
                exec(executable, namespace)
                output = namespace['RUN_DIR']
                self.assertTrue(output.is_relative_to(owned))
                self.assertEqual(namespace['TRAINING_RUN'], run.resolve())
                self.assertTrue(Path(namespace['test_rows'][0]['path']).is_relative_to(run))
                self.assertEqual({path: path.read_bytes() for path in run.rglob('*') if path.is_file()}, before)
                reference = json.loads((output / 'training_reference.json').read_text())
                self.assertEqual(reference['trainingInputMode'], 'read-only')
                self.assertEqual(reference['selectedTrainingRun'], str(shortcut / 'training/fixture-run'))
                (run / 'model_calibrated.keras').write_bytes(b'changed-model')
                with self.assertRaisesRegex(RuntimeError, 'Completed training artifact changed'):
                    exec(executable, namespace)
                self.assertEqual(list(output.parent.iterdir()), [output])

    def test_phash_drift_preserves_exact_identity_and_current_comparisons(self):
        namespace = functions(TRAIN, {'reconcile_recorded_images', 'safe_child'}, {'Path': Path, 'PurePosixPath': PurePosixPath})
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            expected = {'id': 'full-historical-id', 'sha256': 'same-file', 'decodedRgbSha256': 'same-pixels',
                        'bytes': 78, 'dimensions': [376, 815], 'phash': 'c6b3d42d526e06d9'}
            observed = {**expected, 'id': 'current-short-id', 'path': str(root / 'photo.jpg'),
                        'sourceRelativePath': 'photo.jpg', 'phash': 'c6b3d42d526e06d8'}
            result, drift = namespace['reconcile_recorded_images'](root, [expected], [observed], 'transferred_ood', False)
            self.assertEqual(result[0]['id'], 'full-historical-id')
            self.assertEqual(result[0]['phash'], observed['phash'])
            self.assertEqual(result[0]['referencePhash'], expected['phash'])
            self.assertEqual(drift[0]['distance'], 1)
            self.assertEqual(expected['phash'], 'c6b3d42d526e06d9')
            for field, invalid in [('sha256', 'different-file'), ('decodedRgbSha256', 'different-pixels'),
                                   ('dimensions', [1, 2]), ('bytes', 79), ('phash', 'malformed')]:
                with self.assertRaises(RuntimeError):
                    namespace['reconcile_recorded_images'](root, [expected], [{**observed, field: invalid}], 'fixture', False)

    def test_inventory_checkpoint_reuses_decode_and_rejects_changed_inputs(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            picture = root / 'healthy_leaf/photo.jpg'
            picture.parent.mkdir()
            picture.write_bytes(b'original')
            digest = hashlib.sha256(picture.read_bytes()).hexdigest()
            expected = [{'id': digest, 'sha256': digest, 'decodedRgbSha256': 'pixels', 'bytes': 8,
                         'dimensions': [2, 3], 'phash': '0000000000000000', 'label': 'healthy_leaf'}]
            calls = []

            def inventory(folder, pool, labelled, paths):
                calls.append('decode')
                return [{**expected[0], 'path': str(picture), 'sourceRelativePath': 'healthy_leaf/photo.jpg',
                         'phash': '0000000000000001'}]

            names = {'select_recorded_images', 'reconcile_recorded_images', 'safe_child', 'file_sha256', 'portable_rows',
                     'read_inventory_checkpoint', 'write_inventory_checkpoint', 'inventory_checkpoint_identity',
                     'read_json', 'save_json_once', 'object_sha256', 'verify_image_rows'}
            namespace = functions(TRAIN, names, {'Path': Path, 'PurePosixPath': PurePosixPath, 'hashlib': hashlib,
                'defaultdict': defaultdict, 'json': json, 'RUNTIME': {'fixture': True}, 'RUN_DIR': root,
                'image_paths': lambda folder: [picture], 'image_inventory': inventory})
            select = namespace['select_recorded_images']
            first = select(root, expected, 'fixture', True)
            second = select(root, expected, 'fixture', True)
            self.assertEqual(first, second)
            self.assertEqual(calls, ['decode'])
            self.assertEqual(len(json.loads((root / 'fixture_input_selection_v2.json').read_text())['derivedPhashDrift']), 1)
            self.assertNotIn('checkpointMtimeNs', second[0])
            # Metadata is only a cache hint. The mandatory pre-snapshot byte
            # verification still catches a same-size edit with restored mtime.
            old_stat = picture.stat()
            picture.write_bytes(b'altered!')
            os.utime(picture, ns=(old_stat.st_atime_ns, old_stat.st_mtime_ns))
            cached = select(root, expected, 'fixture', True)
            with self.assertRaises(RuntimeError):
                namespace['verify_image_rows'](cached)
            picture.write_bytes(b'changed-file')
            with self.assertRaises(RuntimeError):
                select(root, expected, 'fixture', True)

    def test_live_step4_repair_recovers_failed_decoding_without_new_run(self):
        repair = (DIRECTORY / 'repair-v5-1-step4.py').read_text(encoding='utf-8').split('\nimport time\n', 1)[0]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            observed = [{'id': 'a', 'sha256': 'same-file', 'decodedRgbSha256': 'pixels', 'bytes': 8,
                         'dimensions': [2, 3], 'path': str(root / 'old/photo.jpg'),
                         'sourceRelativePath': 'photo.jpg', 'phash': '0000000000000001'}]
            expected = [{**observed[0], 'pool': 'transferred_ood', 'phash': '0000000000000000'}]
            namespace = functions(TRAIN, {'object_sha256', 'read_json', 'save_json_once'},
                                  {'json': json, 'hashlib': hashlib, 'Path': Path, 'RUN_DIR': root})
            namespace.update(RUNTIME={'fixture': True}, parent_manifest={'mango': [], 'oe': expected},
                             additional_reference=[], ood_reference=[], RAW_MANGO_INPUT=root / 'mango',
                             NEW_MANGO_INPUT=root / 'new', OE_INPUT=root / 'oe', OLD_OOD_INPUT=root / 'old',
                             OOD_INPUT=root / 'ood', raw_rows=[], new_rows=[], original_oe_rows=[])
            exec('def select_recorded_images(root, expected_rows, pool):\n    current = OBSERVED\n    paths = ["photo.jpg"]\n    raise RuntimeError("old phash mismatch")\n', namespace)
            namespace['OBSERVED'] = observed
            try:
                namespace['select_recorded_images'](root / 'old', expected, 'transferred_ood')
            except RuntimeError as error:
                trace = error.__traceback__
            with patch.object(sys, 'last_traceback', trace, create=True):
                exec(compile(repair, 'repair-cell', 'exec'), namespace)
            self.assertEqual(namespace['_V510_STEP4_RECOVERED']['transferred_ood']['rows'], observed)
            self.assertEqual(namespace['RUN_DIR'], root)
            self.assertTrue((root / 'step4_repair_20261101.json').is_file())

    def test_repair_cells_match_the_updated_notebook(self):
        for number in (5, 12):
            repair = (DIRECTORY / f'repair-v5-1-step{number}.py').read_text(encoding='utf-8')
            compile(repair, 'repair-cell', 'exec')
            index = next(index for index, item in enumerate(TRAIN['cells']) if item['cell_type'] == 'markdown'
                         and ''.join(item['source']).startswith(f'## Step {number}:'))
            expected = ast.parse(''.join(TRAIN['cells'][index + 1]['source']))
            actual = ast.parse(repair)
            actual.body.pop(0)
            self.assertEqual(ast.dump(expected), ast.dump(actual))
        self.assertIn("'phash_drift_audit.json'", code(TRAIN))
        self.assertIn("'inventory_cache_v2'", code(TRAIN))
        self.assertIn('new_similarity_pairs(drifted_oe, raw_rows + new_rows + held_out_ood_rows)', code(TRAIN))

    def test_reporting_math_and_rejected_support(self):
        namespace = functions(EVAL, {'classification_metrics', 'summarize_mango', 'summarize_ood'}, {'CLASS_NAMES': CLASSES})
        values = [
            {'actualClass': 'anthracnose', 'rawPredictedClass': 'anthracnose', 'displayedClass': 'anthracnose', 'accepted': True},
            {'actualClass': 'anthracnose', 'rawPredictedClass': 'anthracnose', 'displayedClass': 'rejected', 'accepted': False},
            {'actualClass': 'mango_scab', 'rawPredictedClass': 'anthracnose', 'displayedClass': 'anthracnose', 'accepted': True},
        ]
        result = namespace['summarize_mango'](values)
        self.assertAlmostEqual(result['rawAccuracy'], 2 / 3)
        self.assertAlmostEqual(result['correctAcceptedFractionOfAllPhotos'], 1 / 3)
        self.assertAlmostEqual(result['acceptedOnlyAccuracy'], 1 / 2)
        self.assertEqual((result['correctAccepted'], result['incorrectAccepted'], result['rejected']), (1, 1, 1))
        self.assertEqual(result['rejectionAwarePerClassMetrics'][0]['support'], 2)
        self.assertEqual(result['rejectionAwarePerClassMetrics'][0]['recall'], 0.5)
        self.assertEqual(sum(map(sum, result['rawConfusionMatrix'])), 3)
        self.assertEqual(len(result['rejectionAwareConfusionMatrix'][0]), 8)
        self.assertEqual(sum(map(sum, result['rejectionAwareConfusionMatrix'])), 3)
        self.assertEqual(namespace['summarize_ood']([{'accepted': True}, {'accepted': False}])['falseAcceptRate'], 0.5)
        for row in values:
            row.update(accepted=False, displayedClass='rejected')
        self.assertIsNone(namespace['summarize_mango'](values)['acceptedOnlyAccuracy'])

    def test_exact_confidence_boundary_without_other_gates(self):
        namespace = functions(EVAL, {'score_predictions'}, {
            'validate_probabilities': lambda values, expected: values,
            'np': SimpleNamespace(argmax=lambda values: max(range(len(values)), key=values.__getitem__)),
            'CLASS_NAMES': CLASSES, 'CONFIDENCE_THRESHOLD': 0.70})
        records = [{'id': 'a', 'sha256': 'a', 'pool': 'mango', 'label': CLASSES[0]}] * 3
        vectors = [[0.70, 0.30, 0, 0, 0, 0, 0], [0.699, 0.301, 0, 0, 0, 0, 0], [0.8, 0.2, 0, 0, 0, 0, 0]]
        result = namespace['score_predictions'](records, vectors, True)
        self.assertEqual([row['accepted'] for row in result], [True, False, True])
        self.assertEqual(result[1]['displayedClass'], 'rejected')
        self.assertEqual(len({row['rawPredictedClass'] for row in result}), 1)

    def test_probability_validation_rejects_invalid_vectors(self):
        validate = functions(EVAL, {'validate_probabilities'}, {'math': math})['validate_probabilities']
        valid = [[0.7, 0.3, 0, 0, 0, 0, 0], [1 / 7] * 7]
        self.assertIs(validate(valid, 2), valid)
        for invalid, count in [([[0.8, 0.2]], 1), ([[0.5] * 7], 1), (valid, 1),
                               ([[float('nan'), 1, 0, 0, 0, 0, 0]], 1),
                               ([[-0.1, 1.1, 0, 0, 0, 0, 0]], 1)]:
            with self.assertRaises(ValueError):
                validate(invalid, count)

    def test_reporting_plan_model_and_membership_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ('training_complete.json', 'evaluation_inputs.json', 'reporting_plan.json', 'model_calibrated.keras', 'runtime.json'):
                (root / name).write_text(name, encoding='utf-8')
            digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
            plan = {'classNames': list(CLASSES), 'confidenceThreshold': 0.70,
                    'modelSha256': digest(root / 'model_calibrated.keras'),
                    'evaluationDevice': '/CPU:0', 'runtimeSha256': digest(root / 'runtime.json')}
            inputs = {'mangoTest': [{'id': 'test'}], 'reportingOod': [{'id': 'ood'}]}
            namespace = functions(EVAL, {'verify_reporting_inputs', 'portable_rows'}, {
                'COMPLETE_PATH': root / 'training_complete.json', 'COMPLETE_HASH': digest(root / 'training_complete.json'),
                'RUN_DIR': root, 'TRAINING_RUN': root, 'file_sha256': digest,
                'INPUT_HASH': digest(root / 'evaluation_inputs.json'), 'REPORTING_PLAN_HASH': digest(root / 'reporting_plan.json'),
                'reporting_plan': plan, 'evaluation_inputs': inputs, 'CONFIDENCE_THRESHOLD': 0.70,
                'EVALUATION_DEVICE': '/CPU:0',
                'CLASS_NAMES': list(CLASSES), 'test_rows': copy.deepcopy(inputs['mangoTest']),
                'ood_rows': copy.deepcopy(inputs['reportingOod'])})
            verify = namespace['verify_reporting_inputs']
            verify()
            namespace['EVALUATION_DEVICE'] = '/GPU:0'
            with self.assertRaises(RuntimeError):
                verify()
            namespace['EVALUATION_DEVICE'] = '/CPU:0'
            namespace['CONFIDENCE_THRESHOLD'] = 0.69
            with self.assertRaises(RuntimeError):
                verify()
            namespace['CONFIDENCE_THRESHOLD'] = 0.70
            namespace['test_rows'] = [{'id': 'different'}]
            with self.assertRaises(RuntimeError):
                verify()
            namespace['test_rows'] = copy.deepcopy(inputs['mangoTest'])
            (root / 'model_calibrated.keras').write_text('changed', encoding='utf-8')
            with self.assertRaises(RuntimeError):
                verify()

    def test_artifact_coverage_and_actual_exposure_order(self):
        source = code(TRAIN)
        self.assertLess(source.index('self.optimizer.apply_gradients(pairs)'), source.index('self.exposure_counts.scatter_add'))
        for relative in ('reporting_ood_manifest.json', 'reference-inputs', 'oe_exposure.json', 'initial_weights.json'):
            self.assertIn(relative, source)
        self.assertIn('selected_exposure = cumulative_exposure + trainer.exposure_counts.numpy()', source)
        self.assertIn('all_successful_exposure += trainer.exposure_counts.numpy()', source)
        self.assertIn('cumulative_exposure = selected_exposure.copy()', source)
        self.assertIn("(RUN_DIR / 'training_started.json').exists()", source)
        self.assertIn("(RUN_DIR / 'evaluation_started.json').exists()", code(EVAL))
        for name in ('raw_confusion_matrix.png', 'confidence_70_confusion_matrix.png', 'raw_per_class_metrics.png',
                     'confidence_70_per_class_metrics.png', 'mango_overall_comparison.png', 'unsupported_confidence_70.png'):
            self.assertIn(name, code(EVAL))

    def test_updated_security_pins_and_separate_receipt(self):
        training = literal(TRAIN, 'TRAINING_PACKAGES')
        self.assertEqual(training, literal(EVAL, 'TRAINING_PACKAGES'))
        for pin in ('Pillow==13.0.0', 'uv==0.13.4', 'setuptools==84.1.0',
                    'msgpack==1.2.3', 'certifi==2026.10.18', 'filelock==4.2.1'):
            self.assertIn(pin, training)
        converter = literal(TRAIN, 'CONVERTER_PACKAGES')
        for pin in ('Pillow==13.0.0', 'msgpack==1.2.3', 'certifi==2026.10.18', 'filelock==4.2.1'):
            self.assertIn(pin, converter)
        self.assertIn("Path('/content/mangoleaf-v510-setup-20261101')", code(TRAIN))
        self.assertIn('if audit.returncode != 0 or findings or skipped or audited_names != research_names:', code(TRAIN))
        self.assertNotIn('--ignore-vuln', code(TRAIN))

    def test_converter_reviews_are_exact_and_linux_only(self):
        review = functions(TRAIN, {'reviewed_converter_operations'},
                           {'canonicalize_name': lambda name: name.lower().replace('_', '-')})['reviewed_converter_operations']
        finding = {'name': 'setuptools', 'version': '81.0.0', 'vulns': [
            {'id': 'GHSA-h35f-9h28-mq5c', 'aliases': ['CVE-2026-59890']},
            {'id': 'GHSA-xmj3-9gf7-h52w', 'aliases': []}]}
        self.assertEqual(len(review(finding, 'linux', 'posix')), 2)
        self.assertIsNone(review(finding, 'win32', 'nt'))
        self.assertIsNone(review(finding, 'darwin', 'posix'))
        self.assertIsNone(review({**finding, 'version': '83.0.0'}, 'linux', 'posix'))
        self.assertIsNone(review({**finding, 'vulns': finding['vulns'] + [{'id': 'NEW-UNKNOWN'}]}, 'linux', 'posix'))
        self.assertIsNone(review({'name': 'Pillow', 'version': '12.3.0', 'vulns': [{'id': 'GHSA-78g4-xqwv-q3g8'}]}, 'linux', 'posix'))
        wheel = {'name': 'wheel', 'version': '0.45.1', 'vulns': [{'id': 'CVE-2026-24049', 'aliases': ['GHSA-8rrh-rw8j-w5fx']}]}
        self.assertEqual(len(review(wheel, 'linux', 'posix')), 1)

    def test_cpu_and_gpu_evaluation_device_probe(self):
        source = next(''.join(cell['source']) for cell in EVAL['cells']
                      if cell['cell_type'] == 'code' and "gpus = tf.config.list_physical_devices('GPU')" in ''.join(cell['source']))
        source = source[source.index("gpus = tf.config.list_physical_devices('GPU')"):]
        for available, wrong_device in ((False, False), (True, False), (True, True)):
            selected = {'device': None}

            @contextmanager
            def device(name):
                selected['device'] = name
                yield

            def matmul(left, right):
                actual = '/CPU:0' if wrong_device else selected['device']
                return SimpleNamespace(device='/job:localhost/replica:0/task:0/device:' + actual.lstrip('/'),
                                       numpy=lambda: [[16.0]])

            namespace = {
                'tf': SimpleNamespace(config=SimpleNamespace(list_physical_devices=lambda kind: ['GPU'] if available else [],
                    experimental=SimpleNamespace(set_memory_growth=lambda *args: None)), device=device,
                    linalg=SimpleNamespace(matmul=matmul), ones=lambda shape: shape, __version__='2.19.0',
                    keras=SimpleNamespace(__version__='3.15.1')),
                'np': SimpleNamespace(isfinite=lambda value: SimpleNamespace(all=lambda: True)),
                'sys': SimpleNamespace(version='fixture-python'), 'research_names': [],
                'importlib': SimpleNamespace(metadata=SimpleNamespace(version=lambda name: 'fixture')),
                'provider_check': SimpleNamespace(returncode=0),
            }
            if wrong_device:
                with self.assertRaises(RuntimeError):
                    exec(source, namespace)
            else:
                exec(source, namespace)
                expected = '/GPU:0' if available else '/CPU:0'
                self.assertEqual(namespace['EVALUATION_DEVICE'], expected)
                self.assertEqual(namespace['RUNTIME']['evaluationDevice'], expected)
                if not available:
                    self.assertIsNone(namespace['RUNTIME']['gpuProbeDevice'])

    def test_cpu_evaluation_does_not_relax_training_or_scoring(self):
        self.assertIn("if not gpus:\n    raise RuntimeError('Select a Colab GPU runtime before training.')", code(TRAIN))
        self.assertNotIn("raise RuntimeError('Select a Colab GPU runtime before training.')", code(EVAL))
        self.assertNotIn('accelerator', EVAL['metadata'])
        self.assertEqual(TRAIN['metadata']['accelerator'], 'GPU')
        self.assertIn('with tf.device(EVALUATION_DEVICE):', code(EVAL))
        self.assertNotIn('model.fit(', code(EVAL))
        self.assertNotIn('trainer.fit(', code(EVAL))
        self.assertIn("'model_calibrated.keras', compile=False, safe_mode=True", code(EVAL))
        self.assertEqual(literal(EVAL, 'CONFIDENCE_THRESHOLD'), 0.70)


if __name__ == '__main__':
    unittest.main(verbosity=2)

"""Paste this whole cell into the existing Colab session after Step 4's pHash error.

Do not restart the session or rerun Step 3 first. This preserves the same
pre-training attempt, completed inventory rows, and any live failed-batch rows.
"""
import sys
from pathlib import Path

required_names = ('RUN_DIR', 'RUNTIME', 'parent_manifest', 'additional_reference', 'ood_reference',
                  'RAW_MANGO_INPUT', 'NEW_MANGO_INPUT', 'OE_INPUT', 'OLD_OOD_INPUT', 'OOD_INPUT', 'object_sha256')
if any(name not in globals() for name in required_names):
    raise RuntimeError('The original live Step 4 session is required. Do not run this repair in a new notebook runtime.')
if any((RUN_DIR / name).exists() for name in ('mango_inventory.json', 'duplicate_audit.json', 'frozen_inputs.json', 'training_started.json', 'training_complete.json')):
    raise RuntimeError('This repair is only for the reported incomplete Step 4 before grouping, freezing, or training.')

_V510_STEP4_RECOVERED = {}
_repair_sources = [
    ('original_mango', RAW_MANGO_INPUT, parent_manifest['mango'], 'raw_rows'),
    ('new_mango', NEW_MANGO_INPUT, additional_reference, 'new_rows'),
    ('original_oe', OE_INPUT, [r for r in parent_manifest['oe'] if r['pool'] == 'original_oe'], 'original_oe_rows'),
    ('transferred_ood', OLD_OOD_INPUT, [r for r in parent_manifest['oe'] if r['pool'] == 'transferred_ood'], 'transferred_rows'),
]
for pool, root, expected, variable in _repair_sources:
    rows = globals().get(variable)
    if isinstance(rows, list) and len(rows) == len(expected) and [r.get('sha256') for r in rows] == [r['sha256'] for r in expected]:
        old_selection = RUN_DIR / (pool + '_input_selection.json')
        discovered = read_json(old_selection)['discoveredFileCount'] if old_selection.is_file() else len(rows)
        _V510_STEP4_RECOVERED[pool] = {'root': str(Path(root).resolve()), 'expectedRowsSha256': object_sha256(expected),
                                     'rows': [dict(row) for row in rows], 'discoveredFileCount': discovered}

# IPython may retain the failed function's completed decode pass in its traceback.
# If unavailable, only that 500-photo pool is recomputed; finished pools are reused.
_trace = getattr(sys, 'last_traceback', None)
if _trace is None:
    _last_error = getattr(sys, 'last_exc', None) or getattr(sys, 'last_value', None)
    _trace = getattr(_last_error, '__traceback__', None)
while _trace is not None:
    frame = _trace.tb_frame
    values = frame.f_locals
    if frame.f_code.co_name == 'select_recorded_images' and frame.f_globals.get('RUN_DIR') == RUN_DIR:
        pool = values.get('pool')
        matching = next((entry for entry in _repair_sources if entry[0] == pool), None)
        rows = values.get('current')
        if matching is not None and isinstance(rows, list):
            _, root, expected, _ = matching
            if (str(Path(values['root']).resolve()) == str(Path(root).resolve())
                    and values.get('expected_rows') == expected and len(rows) == len(expected)
                    and [r.get('sha256') for r in rows] == [r['sha256'] for r in expected]):
                _V510_STEP4_RECOVERED[pool] = {'root': str(Path(root).resolve()),
                    'expectedRowsSha256': object_sha256(expected), 'rows': [dict(row) for row in rows],
                    'discoveredFileCount': len(values.get('paths', rows))}
    _trace = _trace.tb_next
del _trace
print('Recoverable completed pools:', {pool: len(value['rows']) for pool, value in _V510_STEP4_RECOVERED.items()})
if 'transferred_ood' not in _V510_STEP4_RECOVERED:
    print('The failed 500-photo batch was not retained by IPython; only that pool needs decoding again.')
save_json_once(RUN_DIR / 'step4_repair_20261101.json', {
    'reason': 'Treat pHash as a derived similarity descriptor; exact file and decoded-pixel checks remain required.',
    'recoveredPools': {pool: len(value['rows']) for pool, value in _V510_STEP4_RECOVERED.items()},
    'trainingStarted': False, 'oldReferencesModified': False,
})

import time
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
PREPROCESSING = 'RGB decode; bilinear 224x224 without antialias; float32 0-255; MobileNetV3 internal rescaling'

def file_sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def object_sha256(value):
    serialized = json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save_json_once(path, value):
    path = Path(path)
    if path.exists():
        if read_json(path) != value:
            raise RuntimeError('Refusing to overwrite changed evidence: ' + str(path))
        return
    with path.open('x', encoding='utf-8', newline='\n') as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False, allow_nan=False)
        handle.write('\n')


def safe_child(root, relative):
    if not isinstance(relative, str) or not relative or '\\' in relative or ':' in relative or '\x00' in relative:
        raise ValueError('Unsafe relative path: ' + str(relative))
    child = PurePosixPath(relative)
    if child.is_absolute() or '..' in child.parts or child == PurePosixPath('.'):
        raise ValueError('Unsafe relative path: ' + relative)
    destination = Path(root).joinpath(*child.parts).resolve()
    destination.relative_to(Path(root).resolve())
    return destination


def raw_rgb(path):
    with Image.open(path) as opened:
        return ImageOps.exif_transpose(opened).convert('RGB')


def load_pixels(path):
    # TensorFlow matches the app's bilinear float32 input. Pillow handles WebP
    # content, including WebP files whose suffix claims JPEG.
    with Path(path).open('rb') as handle:
        signature = handle.read(12)
    if signature[:4] == b'RIFF' and signature[8:12] == b'WEBP':
        image = tf.convert_to_tensor(np.asarray(raw_rgb(path)), dtype=tf.uint8)
    else:
        image = tf.io.decode_image(tf.io.read_file(str(path)), channels=3, expand_animations=False)
    return tf.image.resize(tf.cast(image, tf.float32), IMAGE_SIZE, method='bilinear', antialias=False)


def portable_rows(rows):
    return [{key: value for key, value in row.items() if key != 'path'} for row in rows]


def verify_image_rows(rows):
    for row in rows:
        if file_sha256(row['path']) != row['sha256']:
            raise RuntimeError('Input image changed after inventory: ' + row['path'])


def image_paths(folder):
    return sorted(
        path for path in Path(folder).rglob('*')
        if path.suffix.lower() in IMAGE_EXTENSIONS and path.is_file()
    )


def image_inventory(folder, pool, labelled=False, paths=None):
    rows = []
    failures = []
    paths = image_paths(folder) if paths is None else paths
    started = time.monotonic()
    print(pool, 'inventory started:', len(paths), 'images', flush=True)
    for index, path in enumerate(paths, start=1):
        relative = path.relative_to(folder).as_posix()
        try:
            pixels = raw_rgb(path)
            loaded = load_pixels(path).numpy()
            if loaded.shape != (224, 224, 3) or not np.isfinite(loaded).all():
                raise ValueError('Invalid decoded model input')
            sha = file_sha256(path)
            decoded = hashlib.sha256(str(pixels.size).encode('utf-8') + pixels.tobytes()).hexdigest()
            row = {
                'id': sha[:20], 'pool': pool, 'path': str(path),
                'sourceRelativePath': relative, 'sha256': sha,
                'decodedRgbSha256': decoded, 'bytes': path.stat().st_size,
                'phash': str(imagehash.phash(pixels, hash_size=8)),
                'dimensions': list(pixels.size),
            }
            if labelled:
                row['label'] = PurePosixPath(relative).parts[0]
                if row['label'] not in CLASS_NAMES:
                    raise ValueError('Unexpected class folder: ' + row['label'])
            rows.append(row)
        except Exception as error:
            failures.append({'relativePath': relative, 'error': str(error)})
        if index % 100 == 0 or index == len(paths):
            print(pool, 'images processed:', index, '/', len(paths),
                  'elapsed seconds:', round(time.monotonic() - started, 1), flush=True)
    if failures:
        save_json_once(RUN_DIR / (pool + '_inventory_failures.json'), failures)
        raise RuntimeError('Correct unreadable or mislabeled files. First failures: ' + json.dumps(failures[:10]))
    identities = defaultdict(set)
    for row in rows:
        identities[row['id']].add(row['sha256'])
    if any(len(values) != 1 for values in identities.values()):
        raise RuntimeError('Truncated image ID collision. Use full SHA-256 IDs for a new run.')
    return rows


def save_contact_sheets(rows, destination, title, columns=4):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    page_count = math.ceil(len(rows) / 20)
    print(destination.name, 'preview sheets started:', page_count, 'pages', flush=True)
    for page, start in enumerate(range(0, len(rows), 20), start=1):
        chosen = rows[start:start + 20]
        sheet = Image.new('RGB', (columns * 280, math.ceil(len(chosen) / columns) * 295 + 40), 'white')
        drawing = ImageDraw.Draw(sheet)
        drawing.text((8, 8), title, fill='black')
        for index, row in enumerate(chosen):
            picture = raw_rgb(row['path'])
            picture.thumbnail((268, 240))
            left = (index % columns) * 280 + 6
            top = (index // columns) * 295 + 40
            sheet.paste(picture, (left, top))
            drawing.text((left, top + 242), f"Photo {start + index + 1}: {row['id']}\n{row['sourceRelativePath'][:38]}", fill='black')
        sheet.save(destination / f'page_{page:03d}.png')
        if page % 10 == 0 or page == page_count:
            print(destination.name, 'preview pages saved:', page, '/', page_count, flush=True)



def reconcile_recorded_images(root, expected_rows, observed_rows, pool, labelled):
    """Require exact identities while auditing, rather than equating, derived pHash."""
    if len(expected_rows) != len(observed_rows):
        raise RuntimeError('Incomplete decoded inventory: ' + pool)
    result, drift = [], []
    for expected, observed in zip(expected_rows, observed_rows):
        relative = observed.get('currentSourceRelativePath', observed['sourceRelativePath'])
        path = safe_child(root, relative)
        if str(path) != str(Path(observed['path']).resolve()):
            raise RuntimeError('Cached image path differs from its input root.')
        for key in ('sha256', 'decodedRgbSha256', 'bytes', 'dimensions'):
            if key not in observed or key in expected and observed[key] != expected[key]:
                raise RuntimeError('Recorded photo content or decode differs: ' + relative + ' / ' + key)
        if labelled and (observed.get('label') != expected['label'] or PurePosixPath(relative).parts[0] != expected['label']):
            raise RuntimeError('Recorded photo is outside its expected class: ' + relative)
        current_phash = observed.get('phash', '')
        if not isinstance(current_phash, str) or len(current_phash) != 16 or any(c not in '0123456789abcdef' for c in current_phash):
            raise RuntimeError('Malformed current 64-bit perceptual hash: ' + relative)
        merged = dict(expected)
        for key, value in observed.items():
            if key not in merged:
                merged[key] = value
        merged.update(path=str(path), pool=pool, currentSourceRelativePath=relative, phash=current_phash)
        if 'phash' in expected:
            historical = expected['phash']
            merged['referencePhash'] = historical
            if historical != current_phash:
                drift.append({'id': expected.get('id', observed['id']), 'sha256': observed['sha256'],
                    'sourceRelativePath': relative, 'referencePhash': historical, 'currentPhash': current_phash,
                    'distance': (int(historical, 16) ^ int(current_phash, 16)).bit_count(),
                    'exactFileAndDecodedPixelsMatch': True,
                    'cause': 'Derived fingerprint differs; the specific library/platform cause is not established.'})
        result.append(merged)
    return result, drift


def inventory_checkpoint_identity(root, expected_rows, pool, labelled):
    """Bind cached decoding to this pool, reference list, runtime, and root."""
    return {'schemaVersion': 2, 'root': str(Path(root).resolve()), 'pool': pool, 'labelled': labelled,
            'expectedRowsSha256': object_sha256(expected_rows), 'runtimeSha256': object_sha256(RUNTIME),
            'phashAlgorithm': 'ImageHash phash RGB input; hash_size=8; current runtime'}


def write_inventory_checkpoint(root, expected_rows, pool, labelled, rows, discovered_count):
    """Save a completed decoding pass without overwriting older evidence."""
    reconcile_recorded_images(root, expected_rows, rows, pool, labelled)
    identity = inventory_checkpoint_identity(root, expected_rows, pool, labelled)
    directory = RUN_DIR / 'inventory_cache_v2'
    directory.mkdir(exist_ok=True)
    entries = []
    for row in rows:
        path = Path(row['path'])
        stat = path.stat()
        entries.append({**row, 'checkpointFileSize': stat.st_size, 'checkpointMtimeNs': stat.st_mtime_ns})
    save_json_once(directory / (object_sha256(identity) + '.json'), {
        'identity': identity, 'rows': entries, 'discoveredFileCount': discovered_count,
        'rowsSha256': object_sha256(entries),
        'reuseLimit': 'Only decoded inventory work is reused. Exact bytes are verified before snapshots and training.',
    })


def read_inventory_checkpoint(root, expected_rows, pool, labelled):
    """Reuse unchanged decoding records; changed input files still fail closed."""
    identity = inventory_checkpoint_identity(root, expected_rows, pool, labelled)
    checkpoint = RUN_DIR / 'inventory_cache_v2' / (object_sha256(identity) + '.json')
    recovered = globals().get('_V510_STEP4_RECOVERED', {}).get(pool)
    if not checkpoint.exists() and recovered is not None:
        if recovered['root'] != str(Path(root).resolve()) or recovered['expectedRowsSha256'] != object_sha256(expected_rows):
            raise RuntimeError('Recovered inventory belongs to different inputs: ' + pool)
        write_inventory_checkpoint(root, expected_rows, pool, labelled, recovered['rows'], recovered['discoveredFileCount'])
    if not checkpoint.exists():
        return None
    saved = read_json(checkpoint)
    if saved['identity'] != identity or object_sha256(saved['rows']) != saved['rowsSha256']:
        raise RuntimeError('Inventory checkpoint differs from its recorded identity: ' + pool)
    reconcile_recorded_images(root, expected_rows, saved['rows'], pool, labelled)
    for row in saved['rows']:
        stat = Path(row['path']).stat()
        if stat.st_size != row['checkpointFileSize'] or stat.st_mtime_ns != row['checkpointMtimeNs']:
            raise RuntimeError('A checkpointed input changed. Preserve this attempt and inspect: ' + row['path'])
    # Cache bookkeeping must not enter scientific image manifests.
    return {**saved, 'rows': [{key: value for key, value in row.items()
                             if key not in ('checkpointFileSize', 'checkpointMtimeNs')} for row in saved['rows']]}


def select_recorded_images(root, expected_rows, pool, labelled=False):
    """Locate only recorded identities; extra raw-folder files never enter training."""
    root = Path(root)
    if len({row['sha256'] for row in expected_rows}) != len(expected_rows):
        raise ValueError('Recorded membership contains repeated file identities: ' + pool)
    cached = read_inventory_checkpoint(root, expected_rows, pool, labelled)
    if cached is not None:
        current = cached['rows']
        discovered_count = cached['discoveredFileCount']
        print(pool, 'reusing completed inventory:', len(current), 'photos; bytes checked again before snapshot/training.', flush=True)
    else:
        paths = image_paths(root)
        by_hash = defaultdict(list)
        for index, path in enumerate(paths, 1):
            safe_child(root, path.relative_to(root).as_posix())
            by_hash[file_sha256(path)].append(path)
            if index % 500 == 0:
                print(pool, 'file hashes checked:', index, '/', len(paths), flush=True)
        selected = []
        for expected in expected_rows:
            matches = by_hash.get(expected['sha256'], [])
            if labelled:
                matches = [path for path in matches if path.relative_to(root).parts[0] == expected['label']]
            if not matches:
                raise RuntimeError('Recorded photo missing, changed, or outside its class folder: ' + str(expected.get('sourceRelativePath', expected.get('relativePath'))))
            relative = expected.get('sourceRelativePath', expected.get('relativePath', ''))
            chosen = min(matches, key=lambda path: (path.relative_to(root).as_posix() != relative, path.as_posix()))
            selected.append(chosen)
        current = image_inventory(root, pool, labelled=labelled, paths=selected)
        discovered_count = len(paths)
        # Checkpoint decoding before comparing derived fingerprints, so a later
        # issue does not discard a completed expensive inventory.
        write_inventory_checkpoint(root, expected_rows, pool, labelled, current, discovered_count)
    result, drift = reconcile_recorded_images(root, expected_rows, current, pool, labelled)
    save_json_once(RUN_DIR / (pool + '_input_selection_v2.json'), {
        'selectedCount': len(result), 'discoveredFileCount': discovered_count,
        'rows': portable_rows(result), 'selection': 'recorded SHA-256 and decoded-pixel identities',
        'derivedPhashDrift': drift,
        'phashPolicy': 'Use current-runtime phash consistently; preserve historical values separately.',
    })
    if drift:
        print(pool, 'unchanged photos with different similarity fingerprints:', len(drift), flush=True)
    return result


raw_rows = select_recorded_images(RAW_MANGO_INPUT, parent_manifest['mango'], 'original_mango', labelled=True)
new_paths = image_paths(NEW_MANGO_INPUT)
if len(new_paths) != 71:
    raise RuntimeError('Expected exactly 71 additional image files, not folders; found ' + str(len(new_paths)))
new_rows = select_recorded_images(NEW_MANGO_INPUT, additional_reference, 'new_mango', labelled=True)
original_oe_rows = select_recorded_images(OE_INPUT, [r for r in parent_manifest['oe'] if r['pool'] == 'original_oe'], 'original_oe')
transferred_rows = select_recorded_images(OLD_OOD_INPUT, [r for r in parent_manifest['oe'] if r['pool'] == 'transferred_ood'], 'transferred_ood')
approved_oe_rows = original_oe_rows + transferred_rows
held_out_ood_rows = select_recorded_images(OOD_INPUT, ood_reference, 'reporting_ood')
save_json_once(RUN_DIR / 'phash_drift_audit.json', {
    'pools': {pool: read_json(RUN_DIR / (pool + '_input_selection_v2.json'))['derivedPhashDrift']
              for pool in ('original_mango', 'new_mango', 'original_oe', 'transferred_ood', 'reporting_ood')},
    'runtime': RUNTIME, 'policy': 'All comparisons use current-runtime phash; historical values remain unchanged in references.',
})
for name, rows in [('mango_inventory.json', raw_rows), ('new_mango_inventory.json', new_rows),
                   ('oe_inventory.json', approved_oe_rows), ('held_out_ood_inventory.json', held_out_ood_rows)]:
    save_json_once(RUN_DIR / name, {'images': portable_rows(rows)})
save_contact_sheets(new_rows, RUN_DIR / 'new_image_previews', 'V5.1.0 additional mango photos: inspect labels and related captures')
print('Selected original mango:', len(raw_rows), 'additional:', len(new_rows),
      'OE:', len(approved_oe_rows), 'reporting OOD:', len(held_out_ood_rows))
print('The five previously excluded OOD candidates stay excluded; no model predictions ran.')

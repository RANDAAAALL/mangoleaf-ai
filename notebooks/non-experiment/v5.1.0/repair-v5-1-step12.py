"""Replace only Step 12's code cell in the existing Colab notebook.

Keep the live session and RUN_DIR; do not restart or recreate the attempt.
"""

plan = {
    'schemaVersion': 1, 'experimentVersion': EXPERIMENT_VERSION, 'modelVersion': MODEL_VERSION,
    'classNames': CLASS_NAMES, 'seed': SEED, 'imageSize': list(IMAGE_SIZE), 'batchSize': BATCH_SIZE,
    'initialWeights': 'ImageNet MobileNetV3Large; no prior MangoLeaf model',
    'splitPolicy': manifest['splitPolicy'], 'splitFractionsTarget': [0.70, 0.15, 0.15],
    'stage1': {'epochs': STAGE1_EPOCHS, 'learningRate': STAGE1_LEARNING_RATE, 'backboneFrozen': True},
    'stage2': {'epochs': STAGE2_EPOCHS, 'learningRate': STAGE2_LEARNING_RATE, 'batchNormalizationFrozen': True},
    'modelSelection': 'Lowest clean unweighted mango validation loss in each stage; final checkpoint from stage 2',
    'augmentation': {'flip': 'horizontal_and_vertical', 'rotationDegrees': 30, 'zoom': 0.2, 'shear': 0.2, 'brightness': 0.2, 'contrast': CONTRAST_FACTOR},
    'oe': {
        'lossWeight': OE_LOSS_WEIGHT, 'target': 'uniform over seven mango classes',
        'loss': 'negative mean log-softmax over classes; expectation on approved OE training photos',
        'objective': 'mean(class_weight * mango cross-entropy) + lossWeight * mean(OE uniform cross-entropy)',
        'weightRationale': '0.5 is a starting research hyperparameter, not inferred from photo count or a proven MangoLeaf optimum',
        'sampling': 'One independently shuffled OE batch per mango batch, cycling as needed; reshuffle every epoch',
        'approvedCount': len(approved_oe_rows), 'accuracyIncludesOE': False,
        'classWeightsIncludeOE': False, 'temperatureIncludesOE': False,
    },
    'classWeightRule': 'Balanced weights from mango training labels only',
    'phashDistance': PHASH_DISTANCE, 'preprocessing': PREPROCESSING,
    'temperatureRule': 'Validation mango negative log likelihood only; divide classifier logits once',
    'heldOutOodCount': len(held_out_ood_rows), 'expectedOodCount': EXPECTED_OOD_IMAGE_COUNT,
    'validationExamples': [row['id'] for row in example_rows],
    'testPredictionsRun': False, 'confidenceThreshold': CONFIDENCE_THRESHOLD,
    'rejectionRule': 'maximum calibrated probability >= 0.70 only',
    'referenceFiles': REFERENCE_SHA256,
    'evaluationLimits': 'Old test and OOD reporting photos have prior evaluation use; not independent field evidence',
}
save_json_once(RUN_DIR / 'plan.json', plan)

frozen_paths = [
    'plan.json', 'input_manifest.json', 'dataset_split.zip', 'class_names.json',
    'mango_inventory.json', 'new_mango_inventory.json', 'oe_inventory.json',
    'oe_dataset_manifest.json', 'held_out_ood_inventory.json', 'reporting_ood_manifest.json',
    'reviewed_images.json', 'duplicate_audit.json', 'duplicate_review.json', 'phash_drift_audit.json',
    'split_review.json', 'example_selection.json', 'augmentation_review.json',
    'figures/augmentation_preview.png', 'runtime.json', 'converter_preflight.json',
    'class_weights.json', 'initial_weights.json',
]
frozen_paths += [row['relativePath'] for row in approved_oe_rows + held_out_ood_rows]
frozen_paths += ['dataset/' + row['relativePath'] for row in records]
frozen_paths += [path.relative_to(RUN_DIR).as_posix() for directory in ('runtime_preflight', 'converter_preflight', 'reference-inputs', 'inventory_cache_v2')
                 for path in sorted((RUN_DIR / directory).rglob('*')) if path.is_file()]
frozen_paths += [path.relative_to(RUN_DIR).as_posix() for path in sorted(RUN_DIR.glob('*_input_selection_v2.json'))]
frozen_paths += [path.relative_to(RUN_DIR).as_posix() for path in sorted(RUN_DIR.glob('step4_repair_*.json'))]
frozen_paths = sorted(set(frozen_paths))
frozen = {
    'configurationHash': object_sha256(plan),
    'artifacts': {relative: {'sha256': file_sha256(safe_child(RUN_DIR, relative)), 'bytes': safe_child(RUN_DIR, relative).stat().st_size}
                  for relative in frozen_paths},
}
save_json_once(RUN_DIR / 'frozen_inputs.json', frozen)


def verify_receipt_artifacts(receipt):
    """Check every sealed artifact before consuming its evidence."""
    for relative, expected in receipt['artifacts'].items():
        artifact = safe_child(RUN_DIR, relative)
        if artifact.stat().st_size != expected['bytes'] or file_sha256(artifact) != expected['sha256']:
            raise RuntimeError('Sealed artifact changed: ' + relative)


print('Frozen configuration:', frozen['configurationHash'])
print('Frozen artifacts:', len(frozen['artifacts']))

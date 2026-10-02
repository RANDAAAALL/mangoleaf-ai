# MangoLeaf AI V4.3.0: combined seven-class threshold experiment

Experimental candidate evidence. No adoption, deployment, browser parity, or field accuracy is claimed.
Training run: `/content/drive/MyDrive/mangoleaf_experiments/v4.3.0/training/v4-3-0-training-20261001T112311Z-961e5eb7`
Threshold run: `/content/drive/MyDrive/mangoleaf_experiments/v4.3.0/threshold_fitting/v4-3-0-thresholds-20261001T120051Z-e1c5cdb0`
Training completion SHA-256: `b59585c2f574318997a507331fe36a003674c18e6efd6064c8d65755e627297e`
Selection SHA-256: `fd213d6ed4fc37e10738f391d989dc32e7ad3555d048e02ac7ba9921f5bb26b3`
Evaluation SHA-256: `46da4aa3d2fd2532bc45256447302f58938e53ee16b6fe58d7794b73bc035de1`

Gate fitting keeps calibrated neural-network weights fixed; it is not model training.
Confidence stayed at 0.70. Margin/entropy were fitted only on validation + historical old OOD fitting photos, requiring at least 95% validation retention.
The gate and its hash were frozen before mango test or OOD report inference.
Mango test and old OOD report reuse is exploratory. The historically named new OOD folder is reused V4.1/V4.1.1 report evidence, not a pristine external test.
Training background sources and both OOD collections were audited separately; OOD photos are not training augmentation inputs.

Counts: validation 391, mango test 393, old OOD fitting 84, old OOD report 84, reused new OOD uploaded 32, retained 32.
Scope review: Done checked all the both collections
Collection history: Original V4.1/V4.1.1 OOD report photos reused; no pristine new OOD evidence in this run.
Audited exclusions: {}

| Model | Gate | Test correct accepted | Test wrong accepted | Mango rejected | Old OOD accepted | Reused new OOD accepted |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| combined | confidence_only | 373/393 | 4 | 16 | 33/84 | 8/32 |
| combined | selected | 373/393 | 3 | 17 | 24/84 | 5/32 |

Fitted gate status: **feasible**.
An infeasible gate is not exported as a valid candidate. Confidence-only figures remain reference evidence.
Validation retention counts accepted photos, including accepted wrong diagnoses; it does not measure accuracy.
Full precision probabilities, rejection reasons, seven-class metrics, raw/gated confusion, and healthy/disease/organ errors are saved in evaluation.json and arms/combined CSVs.
Continue in the matching training notebook for curves, confusion matrices, per-class metrics, threshold search, and Grad-CAM from this same frozen run.
Any decisions informed by reused OOD reports need another untouched OOD collection for final independent evaluation. Expert-labeled field mango photos and real browser checks are still needed.

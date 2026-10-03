import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = resolve(
  root,
  "docs/model-training/non-experiment/v4.3.0/artifacts",
);
const provenance = JSON.parse(
  readFileSync(resolve(artifacts, "runtime-snapshot-provenance.json"), "utf8"),
);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const completeBytes = readFileSync(
  resolve(artifacts, "training/training_complete.json"),
);
const manifestBytes = readFileSync(
  resolve(artifacts, "evidence_copy_manifest.json"),
);

// These original ledgers still name the Drive file requirements.txt. A separate
// mapping describes the repository archive name without rewriting run evidence.
if (
  sha256(completeBytes) !== provenance.trainingCompleteSha256 ||
  sha256(manifestBytes) !== provenance.evidenceCopyManifestSha256
) {
  throw new Error("Original training evidence ledger changed.");
}
const complete = JSON.parse(completeBytes);
const manifest = JSON.parse(manifestBytes);
const original = manifest.files.find(
  (entry) => entry.sourceRelative === provenance.originalSourceRelative,
);
if (
  !original ||
  original.repositoryPath !== provenance.originalRepositoryPath ||
  complete.artifacts[provenance.originalFilename] !== provenance.sha256 ||
  original.sha256 !== provenance.sha256 ||
  original.sourceSha256 !== provenance.sha256 ||
  original.copiedSha256 !== provenance.sha256 ||
  original.bytes !== provenance.bytes
) {
  throw new Error("Runtime snapshot mapping differs from original evidence.");
}
const archive = resolve(root, provenance.repositoryPath);
if (!archive.startsWith(artifacts + sep)) {
  throw new Error("Runtime snapshot path leaves the artifact directory.");
}
const bytes = readFileSync(archive);
if (
  bytes.length !== provenance.bytes ||
  sha256(bytes) !== provenance.sha256 ||
  provenance.installable !== false
) {
  throw new Error(
    "Archived runtime bytes or evidence-only designation changed.",
  );
}
console.log(
  `Verified ${bytes.length} archived runtime bytes against both original ledgers.`,
);

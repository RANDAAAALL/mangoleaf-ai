import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assertSupportedNode } from "./check-node-runtime.mjs";

assertSupportedNode();

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = resolve(
  root,
  "docs/model-training/non-experiment/v4.3.0/artifacts",
);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const completeBytes = readFileSync(
  resolve(artifacts, "training/training_complete.json"),
);
const manifestBytes = readFileSync(
  resolve(artifacts, "evidence_copy_manifest.json"),
);

const complete = JSON.parse(completeBytes);
const manifest = JSON.parse(manifestBytes);

// Repository archive names are mapped separately; original run ledgers retain
// their Drive filenames and hashes, including the prose-only mask reuse note.
for (const filename of [
  "runtime-snapshot-provenance.json",
  "mask-reuse-note-provenance.json",
]) {
  const provenance = JSON.parse(
    readFileSync(resolve(artifacts, filename), "utf8"),
  );
  if (
    sha256(completeBytes) !== provenance.trainingCompleteSha256 ||
    sha256(manifestBytes) !== provenance.evidenceCopyManifestSha256
  ) {
    throw new Error("Original training evidence ledger changed.");
  }
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
    throw new Error(`${filename}: mapping differs from original evidence.`);
  }
  const archive = resolve(root, provenance.repositoryPath);
  if (!archive.startsWith(artifacts + sep)) {
    throw new Error(`${filename}: archive path leaves the artifact directory.`);
  }
  const bytes = readFileSync(archive);
  if (
    bytes.length !== provenance.bytes ||
    sha256(bytes) !== provenance.sha256 ||
    provenance.installable !== false
  ) {
    throw new Error(
      `${filename}: archived bytes or evidence designation changed.`,
    );
  }
  console.log(
    `Verified ${provenance.originalFilename}: ${bytes.length} unchanged archived bytes against both original ledgers.`,
  );
}

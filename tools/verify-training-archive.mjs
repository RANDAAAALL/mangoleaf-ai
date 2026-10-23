import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertSupportedNode } from "./check-node-runtime.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Repository archive names are mapped separately; original run ledgers retain
// their Drive filenames and hashes. This verifies evidence, never installs it.
export function verifyArchiveMapping(
  rootDirectory,
  artifactDirectory,
  filename,
) {
  const artifacts = realpathSync(resolve(rootDirectory, artifactDirectory));
  const completeBytes = readFileSync(
    resolve(artifacts, "training/training_complete.json"),
  );
  const manifestBytes = readFileSync(
    resolve(artifacts, "evidence_copy_manifest.json"),
  );
  const complete = JSON.parse(completeBytes);
  const manifest = JSON.parse(manifestBytes);
  const provenance = JSON.parse(
    readFileSync(resolve(artifacts, filename), "utf8"),
  );
  // New mappings declare canonical LF ledger hashes; normalize in memory only.
  // Snapshot bytes below remain strict, and older mappings retain raw hashing.
  if (
    provenance.ledgerHashEncoding !== undefined &&
    provenance.ledgerHashEncoding !== "utf8-lf"
  )
    throw new Error("Unsupported ledger hash encoding.");
  const ledgerHash = (bytes) =>
    sha256(
      provenance.ledgerHashEncoding === "utf8-lf"
        ? Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"))
        : bytes,
    );
  if (
    ledgerHash(completeBytes) !== provenance.trainingCompleteSha256 ||
    ledgerHash(manifestBytes) !== provenance.evidenceCopyManifestSha256
  ) {
    throw new Error("Original training evidence ledger changed.");
  }
  const original = manifest.files.find(
    (entry) =>
      (entry.sourceRelative ?? entry.sourceRelativePath) ===
      provenance.originalSourceRelative,
  );
  // V4.3 records plain hashes; V4.4 records both hashes and byte lengths.
  const completed = complete.artifacts[provenance.originalFilename];
  const completedHash =
    typeof completed === "string" ? completed : completed?.sha256;
  if (
    !original ||
    original.repositoryPath !== provenance.originalRepositoryPath ||
    completedHash !== provenance.sha256 ||
    (typeof completed !== "string" && completed?.bytes !== provenance.bytes) ||
    (typeof completed === "string" &&
      (original.sourceSha256 !== provenance.sha256 ||
        original.copiedSha256 !== provenance.sha256)) ||
    original.sha256 !== provenance.sha256 ||
    ("sourceSha256" in original &&
      original.sourceSha256 !== provenance.sha256) ||
    ("copiedSha256" in original &&
      original.copiedSha256 !== provenance.sha256) ||
    original.bytes !== provenance.bytes
  ) {
    throw new Error(`${filename}: mapping differs from original evidence.`);
  }
  const archive = resolve(rootDirectory, provenance.repositoryPath);
  if (
    !archive.startsWith(artifacts + sep) ||
    lstatSync(archive).isSymbolicLink() ||
    !realpathSync(archive).startsWith(artifacts + sep)
  ) {
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
  return { originalFilename: provenance.originalFilename, bytes: bytes.length };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  assertSupportedNode();
  const archives = [
    [
      "docs/model-training/non-experiment/v4.3.0/artifacts",
      ["runtime-snapshot-provenance.json", "mask-reuse-note-provenance.json"],
    ],
    [
      "docs/model-training/experiment/v4.4.0/artifacts",
      [
        "training-runtime-snapshot-provenance.json",
        "converter-runtime-snapshot-provenance.json",
      ],
    ],
  ];
  for (const [directory, mappings] of archives) {
    for (const filename of mappings) {
      const result = verifyArchiveMapping(root, directory, filename);
      console.log(
        `Verified ${result.originalFilename}: ${result.bytes} unchanged archived bytes against both original ledgers.`,
      );
    }
  }
}

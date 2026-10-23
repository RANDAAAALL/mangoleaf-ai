import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { verifyArchiveMapping } from "./verify-training-archive.mjs";

const directories = [];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Synthetic ledgers exercise preservation failures without touching frozen runs.
function archiveFixture(legacy = false) {
  const root = mkdtempSync(join(tmpdir(), "mangoleaf-archive-test-"));
  directories.push(root);
  const artifacts = join(root, "artifacts");
  mkdirSync(join(artifacts, "training"), { recursive: true });
  const bytes = Buffer.from("example-package==1.0.0\n");
  const hash = sha256(bytes);
  const original = "requirements_snapshot.txt";
  const source = `training/frozen-run/${original}`;
  const complete =
    JSON.stringify(
      {
        artifacts: {
          [original]: legacy ? hash : { sha256: hash, bytes: bytes.length },
        },
      },
      null,
      2,
    ) + "\n";
  const manifest =
    JSON.stringify(
      {
        files: [
          {
            [legacy ? "sourceRelative" : "sourceRelativePath"]: source,
            repositoryPath: `artifacts/training/${original}`,
            sha256: hash,
            bytes: bytes.length,
            ...(legacy ? { sourceSha256: hash, copiedSha256: hash } : {}),
          },
        ],
      },
      null,
      2,
    ) + "\n";
  const mapping = {
    originalFilename: original,
    originalSourceRelative: source,
    originalRepositoryPath: `artifacts/training/${original}`,
    repositoryPath: "artifacts/training/runtime-snapshot.txt",
    sha256: hash,
    bytes: bytes.length,
    installable: false,
    trainingCompleteSha256: sha256(complete),
    evidenceCopyManifestSha256: sha256(manifest),
  };
  writeFileSync(join(artifacts, "training/training_complete.json"), complete);
  writeFileSync(join(artifacts, "evidence_copy_manifest.json"), manifest);
  writeFileSync(join(artifacts, "training/runtime-snapshot.txt"), bytes);
  const mappingPath = join(artifacts, "mapping.json");
  writeFileSync(mappingPath, JSON.stringify(mapping));
  return { root, artifacts, mapping, mappingPath };
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    if (
      !resolve(directory).startsWith(
        resolve(tmpdir()) + sep + "mangoleaf-archive-test-",
      )
    )
      throw new Error(
        "Refusing cleanup outside the disposable test directory.",
      );
    rmSync(directory, { recursive: true, force: true });
  }
});

test.each([false, true])(
  "verifies original ledger shape; legacy=%s",
  (legacy) => {
    const fixture = archiveFixture(legacy);
    expect(
      verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
    ).toEqual({
      originalFilename: "requirements_snapshot.txt",
      bytes: 23,
    });
  },
);

test("changed archive bytes cannot masquerade as the old run", () => {
  const fixture = archiveFixture();
  writeFileSync(
    join(fixture.artifacts, "training/runtime-snapshot.txt"),
    "example-package==2.0.0\n",
  );
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).toThrow("archived bytes");
});

test("editing either original ledger fails preservation checks", () => {
  for (const name of [
    "training/training_complete.json",
    "evidence_copy_manifest.json",
  ]) {
    const fixture = archiveFixture();
    const path = join(fixture.artifacts, name);
    writeFileSync(path, readFileSync(path, "utf8") + "\n");
    expect(() =>
      verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
    ).toThrow("Original training evidence ledger changed");
  }
});

test("archive mapping cannot escape its artifact directory", () => {
  const fixture = archiveFixture();
  fixture.mapping.repositoryPath = "outside.txt";
  writeFileSync(fixture.mappingPath, JSON.stringify(fixture.mapping));
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).toThrow("leaves the artifact directory");
});

test("a historical receipt cannot become an installation manifest", () => {
  const fixture = archiveFixture();
  fixture.mapping.installable = true;
  writeFileSync(fixture.mappingPath, JSON.stringify(fixture.mapping));
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).toThrow("evidence designation changed");
});

test("declared LF ledger hashes accept CRLF checkouts without rewriting files", () => {
  const fixture = archiveFixture();
  fixture.mapping.ledgerHashEncoding = "utf8-lf";
  writeFileSync(fixture.mappingPath, JSON.stringify(fixture.mapping));
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).not.toThrow();
  const paths = [
    join(fixture.artifacts, "training/training_complete.json"),
    join(fixture.artifacts, "evidence_copy_manifest.json"),
  ];
  for (const path of paths)
    writeFileSync(path, readFileSync(path, "utf8").replaceAll("\n", "\r\n"));
  const before = paths.map((path) => readFileSync(path));
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).not.toThrow();
  paths.forEach((path, index) =>
    expect(readFileSync(path)).toEqual(before[index]),
  );
  delete fixture.mapping.ledgerHashEncoding;
  writeFileSync(fixture.mappingPath, JSON.stringify(fixture.mapping));
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).toThrow("Original training evidence ledger changed");
});

test("canonical ledger hashing still rejects changed contents", () => {
  const fixture = archiveFixture();
  fixture.mapping.ledgerHashEncoding = "utf8-lf";
  writeFileSync(fixture.mappingPath, JSON.stringify(fixture.mapping));
  const path = join(fixture.artifacts, "evidence_copy_manifest.json");
  writeFileSync(
    path,
    readFileSync(path, "utf8").replace("frozen-run", "other-run"),
  );
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).toThrow("Original training evidence ledger changed");
});

test("unknown ledger encodings fail closed", () => {
  const fixture = archiveFixture();
  fixture.mapping.ledgerHashEncoding = "ignore-content";
  writeFileSync(fixture.mappingPath, JSON.stringify(fixture.mapping));
  expect(() =>
    verifyArchiveMapping(fixture.root, "artifacts", "mapping.json"),
  ).toThrow("Unsupported ledger hash encoding");
});

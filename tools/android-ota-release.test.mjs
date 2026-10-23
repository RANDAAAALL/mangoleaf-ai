import { expect, test } from "bun:test";
import { createPublicKey, generateKeyPairSync } from "node:crypto";
import {
  otaArguments,
  validateOtaInputs,
  validateOtaTrust,
} from "./android-ota-release.mjs";
import { sha256 } from "./android-bundle.mjs";

const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 3072 });
const der = publicKey.export({ type: "spki", format: "der" });
const repository = "RANDAAAALL/mangoleaf-ai";
const receipt = {
  nativeVersionCode: 2,
  bundledSequence: 1,
  bridgeVersion: 1,
  schemaVersion: 1,
  modelIdentity: "a".repeat(64),
  ota: {
    repository,
    publicKeySha256: sha256(der),
    metadataUrl: `https://github.com/${repository}/releases/latest/download/update.json`,
    signatureUrl: `https://github.com/${repository}/releases/latest/download/update.sig`,
  },
};
const inputs = {
  cloudEnvironment: "production",
  cloudProject: "uuvvvoznajjqknedxpdg",
  modelSource: "committed-HEAD",
  fingerprint: "c".repeat(64),
  sourceCommit: "b".repeat(40),
  bundleVersion: "0.8.0",
  workingTreeCandidate: true,
};
const descriptor = {
  sourceCommit: inputs.sourceCommit,
  bundleVersion: inputs.bundleVersion,
  modelIdentity: receipt.modelIdentity,
  bridgeVersion: 1,
  schemaVersion: 1,
  nativeHostMin: 2,
  nativeHostMax: 2,
};

test("OTA CLI requires explicit artifact identity, immutable tag, and integer sequence", () => {
  const args = [
    "prepare",
    "--apk",
    "candidate.apk",
    "--receipt",
    "receipt.json",
    "--sequence",
    "2",
    "--tag",
    "android-0.1.1",
  ];
  expect(otaArguments(args)["--sequence"]).toBe("2");
  for (const value of ["0", "-2", "2.5", "1e3", "9007199254740992"])
    expect(() =>
      otaArguments(args.map((arg) => (arg === "2" ? value : arg))),
    ).toThrow();
  for (const value of ["latest", "../tag", "tag/path", "v1%2fother", "x?y"])
    expect(() =>
      otaArguments(args.map((arg) => (arg === "android-0.1.1" ? value : arg))),
    ).toThrow();
  expect(() => otaArguments([...args, "--tag", "other"])).toThrow();
  expect(() => otaArguments(args.slice(0, -2))).toThrow();
  expect(() => otaArguments([...args, "--password", "forbidden"])).toThrow();
});

test("OTA trust binds private signer, allowed repository, channel, and increasing sequence", () => {
  expect(
    validateOtaTrust(receipt, der.toString("base64"), 2, "android-0.1.1"),
  ).toBe(
    `https://github.com/${repository}/releases/download/android-0.1.1/web-update.zip`,
  );
  expect(() =>
    validateOtaTrust(receipt, der.toString("base64"), 1, "v1"),
  ).toThrow();
  expect(() =>
    validateOtaTrust(
      { ...receipt, ota: { ...receipt.ota, repository: "other/repo" } },
      der.toString("base64"),
      2,
      "v1",
    ),
  ).toThrow();
  expect(() =>
    validateOtaTrust(
      {
        ...receipt,
        ota: { ...receipt.ota, metadataUrl: "https://example.com/update.json" },
      },
      der.toString("base64"),
      2,
      "v1",
    ),
  ).toThrow();
  // A valid but different key must not sign an update the installed APK cannot trust.
  const another = generateKeyPairSync("rsa", {
    modulusLength: 3072,
  }).publicKey.export({ type: "spki", format: "der" });
  expect(() =>
    validateOtaTrust(receipt, another.toString("base64"), 2, "v1"),
  ).toThrow();
  expect(
    createPublicKey({ key: der, type: "spki", format: "der" })
      .asymmetricKeyType,
  ).toBe("rsa");
});

test("OTA refuses testing assets, V5 overrides, or incompatible installed native/model identity", () => {
  expect(validateOtaInputs(inputs, descriptor, receipt)).toBe(inputs);
  for (const change of [
    { cloudEnvironment: "testing" },
    { cloudProject: "ajwlojaclehxupntnsve" },
    { modelSource: "working-tree-explicit" },
    { sourceCommit: "f".repeat(40) },
    { fingerprint: "invalid" },
    { bundleVersion: "0.9.0" },
    { workingTreeCandidate: false },
  ])
    expect(() =>
      validateOtaInputs({ ...inputs, ...change }, descriptor, receipt),
    ).toThrow();
  for (const change of [
    { modelIdentity: "f".repeat(64) },
    { bridgeVersion: 2 },
    { schemaVersion: 2 },
    { nativeHostMin: 3, nativeHostMax: 3 },
    { nativeHostMax: 1 },
  ])
    expect(() =>
      validateOtaInputs(inputs, { ...descriptor, ...change }, receipt),
    ).toThrow();
});

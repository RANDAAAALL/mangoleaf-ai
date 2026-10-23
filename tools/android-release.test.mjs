import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import {
  certificatePin,
  findAndroidTools,
  freshOutputDirectory,
  publicToolEnvironment,
  packagedWebAssets,
  releaseArguments,
  validatePackageOutput,
  validatePackagedIdentity,
  validateReleaseReceipt,
  validateSignerOutput,
} from "./android-release.mjs";
import { LIMITS, makeZip, modelIdentity } from "./android-bundle.mjs";

const temporary = [];
const certificate = "ab".repeat(32);
const apk = Buffer.from("fixture APK bytes; not an installable application");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function folder() {
  const path = mkdtempSync(join(tmpdir(), "mangoleaf-android-release-"));
  temporary.push(path);
  return path;
}

function write(path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "fixture");
}

function receipt() {
  return {
    format: 1,
    status: "local-unpublished-candidate",
    variant: "release",
    applicationId: "com.mangoleaf.ai",
    cloudEnvironment: "production",
    cloudProject: "uuvvvoznajjqknedxpdg",
    modelSource: "committed-HEAD",
    sourceCommit: "a".repeat(40),
    inputFingerprint: "b".repeat(64),
    modelIdentity: "c".repeat(64),
    descriptorSha256: "d".repeat(64),
    certificateSha256: certificate,
    nativeVersionCode: 2,
    nativeVersionName: "0.1.1",
    bundleVersion: "0.8.0",
    bridgeVersion: 1,
    schemaVersion: 1,
    bundledSequence: 1,
    packagedWebFiles: 5,
    modelVersion: "v4.5.0",
    workingTreeCandidate: true,
    apkBytes: apk.length,
    apkSha256: hash(apk),
    ota: {
      publicKeySha256: "e".repeat(64),
      repository: "example/mangoleaf",
      metadataUrl:
        "https://github.com/example/mangoleaf/releases/latest/download/update.json",
      signatureUrl:
        "https://github.com/example/mangoleaf/releases/latest/download/update.sig",
    },
  };
}

const signatureOutput = (pin = certificate) =>
  `Verifies\nVerified using v1 scheme (JAR signing): false\nVerified using v2 scheme (APK Signature Scheme v2): true\nVerified using v3 scheme (APK Signature Scheme v3): true\nSigner #1 certificate DN: CN=MangoLeaf AI\nSigner #1 certificate SHA-256 digest: ${pin}\n`;

const packageOutput = (value = receipt()) =>
  `package: name='${value.applicationId}' versionCode='${value.nativeVersionCode}' versionName='${value.nativeVersionName}' platformBuildVersionName='16'\nsdkVersion:'26'\ntargetSdkVersion:'36'\n`;

function packagedFixture() {
  const value = receipt();
  const entries = [
    { path: "_next/app.js", content: Buffer.from("fixture script") },
    { path: "index.html", content: Buffer.from("<html>fixture</html>") },
    {
      path: "model/model.json",
      content: Buffer.from(
        JSON.stringify({ weightsManifest: [{ paths: ["weights.bin"] }] }),
      ),
    },
    {
      path: "model/model_config.json",
      content: Buffer.from(
        JSON.stringify({ modelVersion: value.modelVersion }),
      ),
    },
    { path: "model/weights.bin", content: Buffer.from("fixture model") },
  ];
  const files = entries.map(({ path, content }) => ({
    path,
    bytes: content.length,
    sha256: hash(content),
  }));
  const descriptor = {
    protocol: 1,
    sequence: value.bundledSequence,
    bundleVersion: value.bundleVersion,
    sourceCommit: value.sourceCommit,
    bridgeVersion: value.bridgeVersion,
    schemaVersion: value.schemaVersion,
    nativeHostMin: value.nativeVersionCode,
    nativeHostMax: value.nativeVersionCode,
    modelIdentity: modelIdentity(files),
    files,
  };
  const descriptorBytes = Buffer.from(JSON.stringify(descriptor));
  const inputs = {
    sourceCommit: value.sourceCommit,
    fingerprint: value.inputFingerprint,
    workingTreeCandidate: value.workingTreeCandidate,
    modelSource: value.modelSource,
    bundleVersion: value.bundleVersion,
    cloudEnvironment: value.cloudEnvironment,
    cloudProject: value.cloudProject,
  };
  const archiveEntries = [
    ...entries.map(({ path, content }) => ({
      path: `assets/web/${path}`,
      content,
    })),
    { path: "assets/web/android-bundle.json", content: descriptorBytes },
    { path: "assets/build-inputs.json", content: JSON.stringify(inputs) },
    {
      path: "assets/production-trust.json",
      content: JSON.stringify({
        format: 1,
        certificateSha256: value.certificateSha256,
        ota: value.ota,
      }),
    },
  ];
  const bytes = makeZip(archiveEntries);
  Object.assign(value, {
    descriptorSha256: hash(descriptorBytes),
    modelIdentity: descriptor.modelIdentity,
    apkSha256: hash(bytes),
    apkBytes: bytes.length,
  });
  return { bytes, receipt: value, entries: archiveEntries };
}

afterEach(() => {
  for (const path of temporary.splice(0)) {
    const absolute = resolve(path);
    if (
      !absolute.startsWith(
        resolve(tmpdir()) + sep + "mangoleaf-android-release-",
      )
    )
      throw new Error("Unexpected test directory.");
    rmSync(absolute, { recursive: true, force: true });
  }
});

test("certificate pins accept canonical SHA-256 and colon-delimited SDK fingerprints", () => {
  expect(certificatePin(certificate.toUpperCase().match(/../g).join(":"))).toBe(
    certificate,
  );
  for (const value of ["", "a".repeat(63), "gg".repeat(32), certificate + "\n"])
    expect(() => certificatePin(value)).toThrow("certificate SHA-256");
});

test("production receipt matches exact APK bytes without claiming publication", () => {
  const value = receipt();
  expect(validateReleaseReceipt(value, apk, certificate)).toBe(value);
  expect(() =>
    validateReleaseReceipt(
      value,
      Buffer.concat([apk, Buffer.from("tampered")]),
      certificate,
    ),
  ).toThrow("differs");
  const changed = Buffer.from(apk);
  changed[0] ^= 1;
  expect(() => validateReleaseReceipt(value, changed, certificate)).toThrow(
    "differs",
  );
  expect(() => validateReleaseReceipt(value, apk, "12".repeat(32))).toThrow(
    "differs",
  );
});

test("receipt refuses testing targets, experimental models, and incomplete compatibility identity", () => {
  const changes = [
    { status: "published" },
    { variant: "debug" },
    { applicationId: "com.mangoleaf.ai.debug" },
    { cloudEnvironment: "testing" },
    { cloudProject: "ajwlojaclehxupntnsve" },
    { modelSource: "working-tree-explicit" },
    { sourceCommit: "a".repeat(7) },
    { inputFingerprint: "missing" },
    { descriptorSha256: "missing" },
    { modelIdentity: "missing" },
    { nativeVersionName: "0.1.1-dev" },
    { nativeVersionCode: 0 },
    { nativeVersionCode: 2.5 },
    { bridgeVersion: 2 },
    { schemaVersion: 2 },
    { bundledSequence: 0 },
    { packagedWebFiles: 3 },
    { workingTreeCandidate: "true" },
    { modelVersion: "" },
    { apkBytes: apk.length + 1 },
  ];
  for (const changeset of changes)
    expect(() =>
      validateReleaseReceipt({ ...receipt(), ...changeset }, apk, certificate),
    ).toThrow("differs");
  for (const value of [null, {}, [], "not a receipt"])
    expect(() => validateReleaseReceipt(value, apk, certificate)).toThrow(
      "differs",
    );
});

test("receipt refuses OTA trust crossing repositories or reusing one asset", () => {
  for (const changes of [
    { repository: "another/mangoleaf" },
    { publicKeySha256: "not a public key hash" },
    {
      metadataUrl:
        "http://github.com/example/mangoleaf/releases/download/x/update.json",
    },
    {
      metadataUrl:
        "https://github.com/example/mangoleaf/releases/download/x/update.json?other=1",
    },
    { signatureUrl: receipt().ota.metadataUrl },
  ]) {
    const value = receipt();
    Object.assign(value.ota, changes);
    expect(() => validateReleaseReceipt(value, apk, certificate)).toThrow();
  }
});

test("signature verifier accepts only the pinned production signer with modern signing", () => {
  expect(() =>
    validateSignerOutput(signatureOutput(), certificate),
  ).not.toThrow();
  // apksigner on Windows emits CRLF; matching must not depend on Unix output.
  expect(() =>
    validateSignerOutput(
      signatureOutput().replaceAll("\n", "\r\n"),
      certificate,
    ),
  ).not.toThrow();
  for (const output of [
    signatureOutput("12".repeat(32)),
    signatureOutput().replace(
      "CN=MangoLeaf AI",
      "CN=Android Debug,O=Android,C=US",
    ),
    signatureOutput().replaceAll(": true", ": false"),
    signatureOutput() +
      `Signer #2 certificate SHA-256 digest: ${certificate}\n`,
    "Verifies\n",
  ])
    expect(() => validateSignerOutput(output, certificate)).toThrow(
      "permanent production certificate",
    );
});

test("package verifier rejects Debug, mismatched native versions, and wrong minimum SDK", () => {
  const value = receipt();
  expect(() => validatePackageOutput(packageOutput(), value)).not.toThrow();
  for (const output of [
    packageOutput({ ...value, applicationId: "com.mangoleaf.ai.debug" }),
    packageOutput({ ...value, nativeVersionCode: 1 }),
    packageOutput({ ...value, nativeVersionName: "0.1.1-dev" }),
    packageOutput() + "application-debuggable\n",
    packageOutput().replace("sdkVersion:'26'", "sdkVersion:'23'"),
    packageOutput().replace("targetSdkVersion:'36'", "targetSdkVersion:'35'"),
    "not a package",
  ])
    expect(() => validatePackageOutput(output, value)).toThrow(
      "package, version, SDK",
    );
});

test("packaged verification binds receipt source/model/backend/OTA identity to exact APK assets", () => {
  const { bytes, receipt: value } = packagedFixture();
  expect(validateReleaseReceipt(value, bytes, certificate)).toBe(value);
  expect(validatePackagedIdentity(bytes, value).bundleVersion).toBe("0.8.0");
  for (const changes of [
    { inputFingerprint: "f".repeat(64) },
    { sourceCommit: "f".repeat(40) },
    { modelVersion: "v5.0.0" },
    { modelIdentity: "f".repeat(64) },
    { cloudProject: "another" },
    { workingTreeCandidate: false },
    { descriptorSha256: "f".repeat(64) },
    { nativeVersionCode: 3 },
    { ota: { ...value.ota, publicKeySha256: "f".repeat(64) } },
  ])
    expect(() =>
      validatePackagedIdentity(bytes, { ...value, ...changes }),
    ).toThrow("differs");
});

test("packaged verification hashes actual asset bytes and rejects absent or extra assets", () => {
  const { entries, receipt: value } = packagedFixture();
  const tampered = entries.map((entry) =>
    entry.path === "assets/web/_next/app.js"
      ? { ...entry, content: Buffer.from("modified script") }
      : entry,
  );
  expect(() => validatePackagedIdentity(makeZip(tampered), value)).toThrow(
    "Bundle file differs",
  );
  expect(() =>
    validatePackagedIdentity(
      makeZip(
        entries.filter(
          (entry) => entry.path !== "assets/web/model/weights.bin",
        ),
      ),
      value,
    ),
  ).toThrow();
  expect(() =>
    validatePackagedIdentity(
      makeZip([...entries, { path: "assets/web/extra.js", content: "extra" }]),
      value,
    ),
  ).toThrow();
  expect(() =>
    validatePackagedIdentity(
      makeZip(
        entries.filter(
          (entry) => entry.path !== "assets/production-trust.json",
        ),
      ),
      value,
    ),
  ).toThrow("trust identity");
});

test("APK reader permits the signing block gap before its central directory", () => {
  const { bytes, receipt: value } = packagedFixture();
  const central = bytes.readUInt32LE(bytes.length - 22 + 16);
  const signingBlock = Buffer.from("fixture APK signing block gap");
  const signedShape = Buffer.concat([
    bytes.subarray(0, central),
    signingBlock,
    bytes.subarray(central),
  ]);
  signedShape.writeUInt32LE(
    central + signingBlock.length,
    signedShape.length - 22 + 16,
  );
  expect(validatePackagedIdentity(signedShape, value).modelIdentity).toBe(
    value.modelIdentity,
  );
});

test("APK reader rejects truncated, duplicate, encrypted, and oversized assets without extraction", () => {
  const { bytes, entries } = packagedFixture();
  expect(() =>
    packagedWebAssets(bytes.subarray(0, bytes.length - 1)),
  ).toThrow();
  expect(() => packagedWebAssets(Buffer.from("short"))).toThrow();
  expect(() =>
    packagedWebAssets(
      makeZip([
        ...entries,
        { path: "ASSETS/WEB/INDEX.HTML", content: "duplicate" },
      ]),
    ),
  ).toThrow("Duplicate");
  const central = bytes.readUInt32LE(bytes.length - 22 + 16);
  const encrypted = Buffer.from(bytes);
  encrypted.writeUInt16LE(encrypted.readUInt16LE(central + 8) | 1, central + 8);
  expect(() => packagedWebAssets(encrypted)).toThrow("Unsupported");
  const oversized = Buffer.from(bytes);
  oversized.writeUInt32LE(LIMITS.fileBytes + 1, central + 24);
  expect(() => packagedWebAssets(oversized)).toThrow("oversized");
  const invalidOffset = Buffer.from(bytes);
  invalidOffset.writeUInt32LE(central, central + 42);
  expect(() => packagedWebAssets(invalidOffset)).toThrow("Unsupported");
});

test("non-signing subprocesses cannot inherit private release or OTA inputs", () => {
  const environment = {
    PATH: "fixture path",
    JAVA_HOME: "fixture JDK",
    MANGOLEAF_ANDROID_KEYSTORE: "fixture private path",
    MANGOLEAF_ANDROID_STORE_PASSWORD: "fixture private password",
    MANGOLEAF_ANDROID_KEY_ALIAS: "fixture alias",
    MANGOLEAF_ANDROID_KEY_PASSWORD: "fixture private password",
    MANGOLEAF_OTA_KEY_PASSPHRASE: "fixture private password",
    MANGOLEAF_OTA_PRIVATE_KEY: "fixture private path",
    MANGOLEAF_OTA_PRIVATE_KEY_FILE: "fixture private path",
    ORG_GRADLE_PROJECT_releaseStoreFile: "fixture private path",
    ORG_GRADLE_PROJECT_releaseStorePassword: "fixture private password",
    ORG_GRADLE_PROJECT_releaseKeyAlias: "fixture alias",
    ORG_GRADLE_PROJECT_releaseKeyPassword: "fixture private password",
    MANGOLEAF_ANDROID_CERTIFICATE_SHA256: certificate,
    MANGOLEAF_OTA_REPOSITORY: "example/mangoleaf",
    mangoleaf_android_store_password: "fixture case-insensitive password",
  };
  expect(publicToolEnvironment(environment)).toEqual({
    PATH: environment.PATH,
    JAVA_HOME: environment.JAVA_HOME,
    MANGOLEAF_ANDROID_CERTIFICATE_SHA256: certificate,
    MANGOLEAF_OTA_REPOSITORY: "example/mangoleaf",
  });
  expect(environment.MANGOLEAF_ANDROID_STORE_PASSWORD).toBe(
    "fixture private password",
  );
});

test("SDK selection uses the newest complete stable Build Tools installation", () => {
  const sdk = folder();
  const executable = process.platform === "win32" ? ".exe" : "";
  for (const version of ["35.0.0", "36.1.0", "37.0.0-rc1"])
    for (const name of [
      "lib/apksigner.jar",
      `aapt${executable}`,
      `zipalign${executable}`,
    ])
      write(join(sdk, "build-tools", version, name));
  write(join(sdk, "build-tools", "99.0.0", "lib/apksigner.jar"));
  const tools = findAndroidTools({
    ANDROID_HOME: sdk,
    JAVA_HOME: join(sdk, "JDK"),
  });
  expect(tools.version).toBe("36.1.0");
  expect(tools.java).toBe(join(sdk, "JDK", "bin", `java${executable}`));
  expect(findAndroidTools({ ANDROID_SDK_ROOT: sdk }).version).toBe("36.1.0");
  expect(() => findAndroidTools({ ANDROID_HOME: join(sdk, "absent") })).toThrow(
    "ANDROID_HOME",
  );
});

test("SDK selection fails closed when required Android signing tools are incomplete", () => {
  const sdk = folder();
  write(join(sdk, "build-tools", "36.1.0", "lib/apksigner.jar"));
  expect(() => findAndroidTools({ ANDROID_HOME: sdk })).toThrow(
    "Install stable Android SDK Build Tools",
  );
});

test("release output stays below private artifacts and never overwrites an existing candidate", () => {
  const repository = folder();
  const candidate = join(
    repository,
    ".tools",
    "android-release",
    "candidate",
    "first",
  );
  expect(freshOutputDirectory(candidate, repository)).toBe(candidate);
  expect(existsSync(candidate)).toBe(false);
  mkdirSync(candidate);
  expect(() => freshOutputDirectory(candidate, repository)).toThrow(
    "already exists",
  );
  for (const path of [
    join(repository, ".tools", "android-release"),
    join(repository, ".tools", "android-release-other", "candidate"),
    join(repository, "public", "candidate"),
  ])
    expect(() => freshOutputDirectory(path, repository)).toThrow("fresh child");
});

test("release output rejects junctions before creating directories through them", () => {
  const repository = folder();
  const outside = folder();
  const privateRoot = join(repository, ".tools", "android-release");
  mkdirSync(privateRoot, { recursive: true });
  const redirect = join(privateRoot, "redirect");
  symlinkSync(
    outside,
    redirect,
    process.platform === "win32" ? "junction" : "dir",
  );
  expect(() =>
    freshOutputDirectory(join(redirect, "new-parent", "candidate"), repository),
  ).toThrow("escapes");
  expect(existsSync(join(outside, "new-parent"))).toBe(false);
});

test("release output also rejects a redirected artifact root", () => {
  const repository = folder();
  const outside = folder();
  mkdirSync(join(repository, ".tools"));
  const privateRoot = join(repository, ".tools", "android-release");
  symlinkSync(
    outside,
    privateRoot,
    process.platform === "win32" ? "junction" : "dir",
  );
  expect(() =>
    freshOutputDirectory(
      join(privateRoot, "new-parent", "candidate"),
      repository,
    ),
  ).toThrow("escapes");
  expect(existsSync(join(outside, "new-parent"))).toBe(false);
});

test("release CLI accepts only bounded build/check/verify options, never secret arguments", () => {
  expect(releaseArguments([])).toEqual({ command: "build", options: {} });
  expect(releaseArguments(["check"])).toEqual({
    command: "check",
    options: {},
  });
  expect(releaseArguments(["build", "--output", "fixture"])).toEqual({
    command: "build",
    options: { "--output": "fixture" },
  });
  expect(
    releaseArguments([
      "verify",
      "--apk",
      "candidate.apk",
      "--receipt",
      "receipt.json",
      "--certificate-sha256",
      certificate,
    ]).command,
  ).toBe("verify");
  for (const arguments_ of [
    ["publish"],
    ["check", "--output", "fixture"],
    ["build", "--output"],
    ["build", "--output", "one", "--output", "two"],
    ["build", "--password", "fixture-password"],
    ["verify", "--apk", "candidate.apk"],
  ])
    expect(() => releaseArguments(arguments_)).toThrow();
});

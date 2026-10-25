import { spawnSync } from "node:child_process";
import { androidApkAssetLabel } from "../src/lib/android-version.mjs";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertSupportedNode } from "./check-node-runtime.mjs";
import {
  prepareBundle,
  releaseUrl,
  sha256,
  signMetadata,
  verifyBundle,
} from "./android-bundle.mjs";
import {
  freshOutputDirectory,
  publicToolEnvironment,
  releaseFolderTimestamp,
  verifyReleaseArtifact,
} from "./android-release.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = "RANDAAAALL/mangoleaf-ai";
const productionProject = "uuvvvoznajjqknedxpdg";
const HASH = /^[a-f0-9]{64}$/;

export function otaArguments(args) {
  const [command, ...rest] = args;
  if (command !== "prepare")
    throw new Error("Use android-ota-release.mjs prepare.");
  const allowed = ["--apk", "--receipt", "--sequence", "--tag", "--output"];
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (
      !allowed.includes(flag) ||
      !value ||
      value.startsWith("--") ||
      Object.hasOwn(options, flag)
    )
      throw new Error(
        "Invalid or repeated OTA option. Keep signing credentials off the command line.",
      );
    options[flag] = value;
  }
  if (
    ["--apk", "--receipt", "--sequence", "--tag"].some((flag) => !options[flag])
  )
    throw new Error(
      "OTA preparation requires --apk, --receipt, --sequence, and --tag.",
    );
  if (
    !/^[1-9]\d*$/.test(options["--sequence"]) ||
    !Number.isSafeInteger(Number(options["--sequence"]))
  )
    throw new Error("OTA sequence must be a positive safe integer.");
  // Release tags are one path segment, never a mutable latest alias or encoded URL.
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(options["--tag"]) ||
    ["latest", ".", ".."].includes(options["--tag"])
  )
    throw new Error("Use an explicit immutable release tag.");
  return options;
}

export function validateOtaTrust(receipt, publicKeyBase64, sequence, tag) {
  if (
    receipt.ota.repository !== repository ||
    sequence <= receipt.bundledSequence
  )
    throw new Error(
      "OTA must target the approved repository and exceed the installed APK sequence.",
    );
  const key = createPublicKey({
    key: Buffer.from(publicKeyBase64 || "", "base64"),
    type: "spki",
    format: "der",
  });
  if (
    key.asymmetricKeyType !== "rsa" ||
    key.asymmetricKeyDetails.modulusLength < 3072 ||
    sha256(key.export({ type: "spki", format: "der" })) !==
      receipt.ota.publicKeySha256
  )
    throw new Error("OTA signing key differs from the installed APK trust.");
  const base = `https://github.com/${repository}/releases`;
  if (
    receipt.ota.metadataUrl !== `${base}/latest/download/update.json` ||
    receipt.ota.signatureUrl !== `${base}/latest/download/update.sig`
  )
    throw new Error(
      "The installed APK does not use the reviewed production update channel.",
    );
  return releaseUrl(`${base}/download/${tag}/web-update.zip`, repository);
}

export function validateOtaInputs(inputs, descriptor, receipt) {
  if (
    inputs.cloudEnvironment !== "production" ||
    inputs.cloudProject !== productionProject ||
    inputs.modelSource !== "committed-HEAD" ||
    !HASH.test(inputs.fingerprint) ||
    inputs.sourceCommit !== descriptor.sourceCommit ||
    inputs.bundleVersion !== descriptor.bundleVersion ||
    inputs.workingTreeCandidate !== true ||
    descriptor.modelIdentity !== receipt.modelIdentity ||
    descriptor.bridgeVersion !== receipt.bridgeVersion ||
    descriptor.schemaVersion !== receipt.schemaVersion ||
    descriptor.nativeHostMin > receipt.nativeVersionCode ||
    descriptor.nativeHostMax < receipt.nativeVersionCode
  )
    throw new Error(
      "OTA inputs differ from the production target or installed host/model compatibility.",
    );
  return inputs;
}

function buildProductionWeb() {
  // Private signing credentials never enter the web build, package hooks, or its output.
  const child = spawnSync(
    process.platform === "win32" ? "bun.exe" : "bun",
    ["tools/build-android.mjs", "--release"],
    {
      cwd: root,
      env: publicToolEnvironment(),
      stdio: "inherit",
      windowsHide: true,
    },
  );
  if (child.error || child.status !== 0)
    throw new Error(
      "Production Android web build failed; no OTA candidate was signed.",
    );
}

function main(args) {
  assertSupportedNode();
  const options = otaArguments(args);
  const sequence = Number(options["--sequence"]);
  const receipt = verifyReleaseArtifact(
    options["--apk"],
    options["--receipt"],
    process.env.MANGOLEAF_ANDROID_CERTIFICATE_SHA256,
  );
  let publicDer;
  try {
    const privateKey = createPrivateKey({
      key: readFileSync(process.env.MANGOLEAF_OTA_PRIVATE_KEY_FILE),
      passphrase: process.env.MANGOLEAF_OTA_KEY_PASSPHRASE,
    });
    publicDer = createPublicKey(privateKey).export({
      type: "spki",
      format: "der",
    });
  } catch {
    throw new Error(
      "Cannot open the external OTA signing key. No keys were replaced.",
    );
  }
  const archiveUrl = validateOtaTrust(
    receipt,
    publicDer.toString("base64"),
    sequence,
    options["--tag"],
  );
  const output = freshOutputDirectory(
    options["--output"] ||
      join(
        root,
        ".tools",
        "android-release",
        `ota-${releaseFolderTimestamp()}`,
      ),
  );
  buildProductionWeb();
  const generated = join(root, "android/app/build/generated/web-assets");
  const inputs = JSON.parse(
    readFileSync(join(generated, "build-inputs.json"), "utf8"),
  );
  const staged = JSON.parse(
    readFileSync(join(generated, "web/android-bundle.json"), "utf8"),
  );
  validateOtaInputs(inputs, staged, receipt);
  const result = prepareBundle(
    join(root, ".android-web", inputs.fingerprint, "out"),
    output,
    {
      sequence,
      version: inputs.bundleVersion,
      sourceCommit: inputs.sourceCommit,
      hostMin: receipt.nativeVersionCode,
      hostMax: receipt.nativeVersionCode,
      repository,
      archiveUrl,
    },
  );
  // Check the archive actually assembled, rather than trusting the staged sidecar.
  validateOtaInputs(inputs, result.descriptor, receipt);
  const publicPath = join(output, "ota-public.pem");
  writeFileSync(
    publicPath,
    createPublicKey({ key: publicDer, type: "spki", format: "der" }).export({
      type: "spki",
      format: "pem",
    }),
    { flag: "wx" },
  );
  signMetadata(
    join(output, "update.json"),
    process.env.MANGOLEAF_OTA_PRIVATE_KEY_FILE,
    join(output, "update.sig"),
    process.env.MANGOLEAF_OTA_KEY_PASSPHRASE,
  );
  verifyBundle(
    join(output, "update.json"),
    join(output, "update.sig"),
    publicPath,
    join(output, "web-update.zip"),
    repository,
  );
  writeFileSync(
    join(output, "ota-receipt.json"),
    JSON.stringify(
      {
        format: 1,
        status: "local-unpublished-candidate",
        tag: options["--tag"],
        sequence,
        sourceCommit: inputs.sourceCommit,
        workingTreeCandidate: inputs.workingTreeCandidate,
        inputFingerprint: inputs.fingerprint,
        modelIdentity: result.descriptor.modelIdentity,
        nativeHostMin: receipt.nativeVersionCode,
        nativeHostMax: receipt.nativeVersionCode,
        hostApkSha256: receipt.apkSha256,
        certificateSha256: receipt.certificateSha256,
        otaPublicKeySha256: receipt.ota.publicKeySha256,
        archiveSha256: result.metadata.archiveSha256,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  console.log(`Verified signed OTA candidate: ${output}`);
  console.log(
    `GitHub APK asset label: ${androidApkAssetLabel(receipt.nativeVersionName)}`,
  );
  console.log(
    "Nothing published. Check the highest published sequence and test this exact candidate. Upload web-update.zip, update.json, and update.sig from this folder; also attach the approved mangoleaf-ai.apk separately so the latest release serves all four assets.",
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "OTA preparation failed.",
    );
    process.exitCode = 1;
  }
}

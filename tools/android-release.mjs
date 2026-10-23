import { spawnSync } from "node:child_process";
import { androidApkAssetLabel } from "../src/lib/android-version.mjs";
import {
  constants,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import { assertSupportedNode } from "./check-node-runtime.mjs";
import { LIMITS, releaseUrl, validateDescriptor } from "./android-bundle.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const productionProject = "uuvvvoznajjqknedxpdg";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function certificatePin(value) {
  const pin = (value || "").replaceAll(":", "").toLowerCase();
  if (!HASH.test(pin))
    throw new Error("A public certificate SHA-256 pin is required.");
  return pin;
}

export function validateReleaseReceipt(receipt, apkBytes, expectedCertificate) {
  const pin = certificatePin(expectedCertificate);
  if (
    !receipt ||
    typeof receipt !== "object" ||
    receipt.format !== 1 ||
    receipt.status !== "local-unpublished-candidate" ||
    receipt.variant !== "release" ||
    receipt.applicationId !== "com.mangoleaf.ai" ||
    receipt.cloudEnvironment !== "production" ||
    receipt.cloudProject !== productionProject ||
    receipt.modelSource !== "committed-HEAD" ||
    !COMMIT.test(receipt.sourceCommit) ||
    !HASH.test(receipt.inputFingerprint) ||
    !HASH.test(receipt.modelIdentity) ||
    !HASH.test(receipt.descriptorSha256) ||
    receipt.certificateSha256 !== pin ||
    !Number.isSafeInteger(receipt.nativeVersionCode) ||
    receipt.nativeVersionCode < 1 ||
    !/^\d+\.\d+\.\d+$/.test(receipt.nativeVersionName) ||
    !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(receipt.bundleVersion) ||
    receipt.bridgeVersion !== 1 ||
    receipt.schemaVersion !== 1 ||
    !Number.isSafeInteger(receipt.bundledSequence) ||
    receipt.bundledSequence < 1 ||
    !Number.isSafeInteger(receipt.packagedWebFiles) ||
    receipt.packagedWebFiles < 4 ||
    typeof receipt.modelVersion !== "string" ||
    !receipt.modelVersion ||
    typeof receipt.workingTreeCandidate !== "boolean" ||
    receipt.apkBytes !== apkBytes.length ||
    receipt.apkSha256 !== sha256(apkBytes) ||
    !HASH.test(receipt.ota?.publicKeySha256)
  ) {
    throw new Error(
      "The APK differs from the verified production release receipt.",
    );
  }
  releaseUrl(receipt.ota.metadataUrl, receipt.ota.repository, true);
  releaseUrl(receipt.ota.signatureUrl, receipt.ota.repository, true);
  if (receipt.ota.metadataUrl === receipt.ota.signatureUrl)
    throw new Error("OTA metadata and signature must be separate assets.");
  return receipt;
}

export function validateSignerOutput(output, expectedCertificate) {
  const digests = [
    ...output.matchAll(
      /^Signer #\d+ certificate SHA-256 digest:\s*([a-fA-F0-9:]+)\s*$/gm,
    ),
  ];
  if (
    digests.length !== 1 ||
    certificatePin(digests[0][1]) !== certificatePin(expectedCertificate) ||
    /certificate DN:.*\bCN=Android Debug\b/i.test(output) ||
    !/^Verified using v[23](?:\.\d+)? scheme[^\r\n]*:\s*true\s*$/m.test(output)
  ) {
    throw new Error(
      "The APK signature does not match the permanent production certificate.",
    );
  }
}

export function validatePackageOutput(output, receipt) {
  const identity =
    /^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m.exec(
      output,
    );
  if (
    !identity ||
    identity[1] !== receipt.applicationId ||
    Number(identity[2]) !== receipt.nativeVersionCode ||
    identity[3] !== receipt.nativeVersionName ||
    /^application-debuggable\s*$/m.test(output) ||
    !/^sdkVersion:'26'\s*$/m.test(output) ||
    !/^targetSdkVersion:'36'\s*$/m.test(output)
  ) {
    throw new Error(
      "The signed APK package, version, SDK, or debuggable flag is invalid.",
    );
  }
}

// APKs include alignment extras and a signing block, unlike our canonical OTA ZIP.
// Read only bounded assets in memory; never extract paths from an APK to disk.
export function packagedWebAssets(bytes) {
  if (bytes.length < 22 || bytes.length > LIMITS.archiveBytes)
    throw new Error("Invalid or oversized APK archive.");
  let end = -1;
  for (
    let offset = bytes.length - 22;
    offset >= Math.max(0, bytes.length - 65557);
    offset -= 1
  ) {
    if (
      bytes.readUInt32LE(offset) === 0x06054b50 &&
      offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length
    ) {
      end = offset;
      break;
    }
  }
  if (
    end < 0 ||
    bytes.readUInt16LE(end + 4) !== 0 ||
    bytes.readUInt16LE(end + 6) !== 0 ||
    bytes.readUInt16LE(end + 8) !== bytes.readUInt16LE(end + 10)
  )
    throw new Error("Unsupported APK ZIP directory.");
  const count = bytes.readUInt16LE(end + 10);
  const centralStart = bytes.readUInt32LE(end + 16);
  const centralBytes = bytes.readUInt32LE(end + 12);
  if (!count || count === 65535 || centralStart + centralBytes !== end)
    throw new Error("Unsupported APK ZIP directory.");
  const names = new Set();
  const web = [];
  let inputs;
  let trust;
  let expanded = 0;
  let cursor = centralStart;
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > end || bytes.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error("Invalid APK central entry.");
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const compressed = bytes.readUInt32LE(cursor + 20);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameBytes = bytes.readUInt16LE(cursor + 28);
    const extraBytes = bytes.readUInt16LE(cursor + 30);
    const commentBytes = bytes.readUInt16LE(cursor + 32);
    const local = bytes.readUInt32LE(cursor + 42);
    const next = cursor + 46 + nameBytes + extraBytes + commentBytes;
    if (!nameBytes || next > end || bytes.readUInt16LE(cursor + 34) !== 0)
      throw new Error("Invalid APK central entry.");
    const name = bytes
      .subarray(cursor + 46, cursor + 46 + nameBytes)
      .toString("utf8");
    if (names.has(name.toLowerCase())) throw new Error("Duplicate APK entry.");
    names.add(name.toLowerCase());
    if (
      ["assets/build-inputs.json", "assets/production-trust.json"].includes(
        name,
      ) ||
      (name.startsWith("assets/web/") && !name.endsWith("/"))
    ) {
      const limit = [
        "assets/build-inputs.json",
        "assets/production-trust.json",
      ].includes(name)
        ? LIMITS.metadataBytes
        : name === "assets/web/android-bundle.json"
          ? LIMITS.descriptorBytes
          : LIMITS.fileBytes;
      if (
        flags & 1 ||
        ![0, 8].includes(method) ||
        size > limit ||
        local + 30 > centralStart ||
        bytes.readUInt32LE(local) !== 0x04034b50 ||
        bytes.readUInt16LE(local + 6) !== flags ||
        bytes.readUInt16LE(local + 8) !== method ||
        bytes.readUInt16LE(local + 26) !== nameBytes
      )
        throw new Error("Unsupported or oversized APK web entry.");
      const start = local + 30 + nameBytes + bytes.readUInt16LE(local + 28);
      if (
        start + compressed > centralStart ||
        bytes.subarray(local + 30, local + 30 + nameBytes).toString("utf8") !==
          name ||
        (method === 0 && compressed !== size)
      )
        throw new Error("APK entry headers differ.");
      const content =
        method === 0
          ? bytes.subarray(start, start + compressed)
          : inflateRawSync(bytes.subarray(start, start + compressed), {
              maxOutputLength: Math.max(size, 1),
            });
      expanded += content.length;
      if (
        content.length !== size ||
        expanded > LIMITS.expandedBytes ||
        web.length >= LIMITS.fileCount
      )
        throw new Error("APK web assets exceed their declared limits.");
      if (name === "assets/build-inputs.json") inputs = content;
      else if (name === "assets/production-trust.json") trust = content;
      else web.push({ path: name.substring("assets/web/".length), content });
    }
    cursor = next;
  }
  if (cursor !== end || !inputs || !trust)
    throw new Error("The APK has no complete build-input/trust identity.");
  return { web, inputs, trust };
}

export function validatePackagedIdentity(apkBytes, receipt) {
  const {
    web,
    inputs: inputBytes,
    trust: trustBytes,
  } = packagedWebAssets(apkBytes);
  const descriptorBytes = web.find(
    (entry) => entry.path === "android-bundle.json",
  )?.content;
  const modelBytes = web.find(
    (entry) => entry.path === "model/model_config.json",
  )?.content;
  if (!descriptorBytes || !modelBytes)
    throw new Error("The signed APK has no complete web/model identity.");
  const descriptor = validateDescriptor(
    JSON.parse(descriptorBytes.toString("utf8")),
    web,
  );
  const inputs = JSON.parse(inputBytes.toString("utf8"));
  const model = JSON.parse(modelBytes.toString("utf8"));
  const trust = JSON.parse(trustBytes.toString("utf8"));
  if (
    sha256(descriptorBytes) !== receipt.descriptorSha256 ||
    descriptor.bundleVersion !== receipt.bundleVersion ||
    descriptor.sequence !== receipt.bundledSequence ||
    descriptor.sourceCommit !== receipt.sourceCommit ||
    descriptor.bridgeVersion !== receipt.bridgeVersion ||
    descriptor.schemaVersion !== receipt.schemaVersion ||
    descriptor.modelIdentity !== receipt.modelIdentity ||
    descriptor.files.length !== receipt.packagedWebFiles ||
    descriptor.nativeHostMin > receipt.nativeVersionCode ||
    descriptor.nativeHostMax < receipt.nativeVersionCode ||
    model.modelVersion !== receipt.modelVersion ||
    inputs.sourceCommit !== receipt.sourceCommit ||
    inputs.fingerprint !== receipt.inputFingerprint ||
    inputs.workingTreeCandidate !== receipt.workingTreeCandidate ||
    inputs.modelSource !== receipt.modelSource ||
    inputs.bundleVersion !== receipt.bundleVersion ||
    inputs.cloudEnvironment !== receipt.cloudEnvironment ||
    inputs.cloudProject !== receipt.cloudProject ||
    trust.format !== 1 ||
    trust.certificateSha256 !== receipt.certificateSha256 ||
    trust.ota?.repository !== receipt.ota.repository ||
    trust.ota?.metadataUrl !== receipt.ota.metadataUrl ||
    trust.ota?.signatureUrl !== receipt.ota.signatureUrl ||
    trust.ota?.publicKeySha256 !== receipt.ota.publicKeySha256
  )
    throw new Error(
      "The release receipt identity differs from the signed APK contents.",
    );
  return descriptor;
}

export function findAndroidTools(environment = process.env) {
  const sdk =
    environment.ANDROID_HOME ||
    environment.ANDROID_SDK_ROOT ||
    (environment.LOCALAPPDATA &&
      join(environment.LOCALAPPDATA, "Android", "Sdk"));
  if (!sdk || !existsSync(join(sdk, "build-tools")))
    throw new Error("Set ANDROID_HOME to the installed Android SDK.");
  const versions = readdirSync(join(sdk, "build-tools"))
    .filter((version) => /^\d+\.\d+\.\d+$/.test(version))
    .sort((left, right) => {
      const a = left.split(".").map(Number);
      const b = right.split(".").map(Number);
      return b[0] - a[0] || b[1] - a[1] || b[2] - a[2];
    });
  const executable = process.platform === "win32" ? ".exe" : "";
  for (const version of versions) {
    const directory = join(sdk, "build-tools", version);
    const tools = {
      version,
      sdk,
      apksigner: join(directory, "lib", "apksigner.jar"),
      aapt: join(directory, `aapt${executable}`),
      zipalign: join(directory, `zipalign${executable}`),
      java: environment.JAVA_HOME
        ? join(environment.JAVA_HOME, "bin", `java${executable}`)
        : "java",
    };
    if ([tools.apksigner, tools.aapt, tools.zipalign].every(existsSync))
      return tools;
  }
  throw new Error(
    "Install stable Android SDK Build Tools with apksigner, aapt, and zipalign.",
  );
}

export function publicToolEnvironment(environment = process.env) {
  const safe = { ...environment };
  for (const name of Object.keys(safe)) {
    if (
      /^(?:MANGOLEAF_ANDROID_(?:KEYSTORE|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)|MANGOLEAF_OTA_(?:KEY_PASSPHRASE|PRIVATE_KEY(?:_FILE)?)|ORG_GRADLE_PROJECT_release(?:StoreFile|StorePassword|KeyAlias|KeyPassword))$/i.test(
        name,
      )
    )
      delete safe[name];
  }
  return safe;
}

function run(
  command,
  args,
  {
    cwd = root,
    capture = false,
    environment = publicToolEnvironment(),
    shell = false,
  } = {},
) {
  const result = spawnSync(command, args, {
    cwd,
    env: environment,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    shell,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  // Do not echo subprocess arguments or private environment values on failure.
  if (result.error || result.status !== 0)
    throw new Error(
      "Android release command failed. Resolve the preceding bounded build error before retrying.",
    );
  return result.stdout || "";
}

function gradle(tasks, tools) {
  const common = ["--console=plain", "--no-daemon", "--max-workers=2"];
  const environment = { ...process.env, ANDROID_HOME: tools.sdk };
  delete environment.MANGOLEAF_OTA_KEY_PASSPHRASE;
  delete environment.MANGOLEAF_OTA_PRIVATE_KEY_FILE;
  delete environment.MANGOLEAF_OTA_PRIVATE_KEY;
  if (process.platform === "win32") {
    // All task names are fixed in this module; no passwords enter a shell command.
    return run("gradlew.bat", [...tasks, ...common], {
      cwd: join(root, "android"),
      environment,
      shell: true,
    });
  }
  return run("./gradlew", [...tasks, ...common], {
    cwd: join(root, "android"),
    environment,
  });
}

export function verifyReleaseArtifact(
  apkPath,
  receiptPath,
  expectedCertificate,
  tools = findAndroidTools(),
) {
  const apkBytes = readFileSync(apkPath);
  const receipt = validateReleaseReceipt(
    JSON.parse(readFileSync(receiptPath, "utf8")),
    apkBytes,
    expectedCertificate,
  );
  const signer = run(
    tools.java,
    [
      "-jar",
      tools.apksigner,
      "verify",
      "--verbose",
      "--print-certs",
      resolve(apkPath),
    ],
    { capture: true },
  );
  validateSignerOutput(signer, expectedCertificate);
  validatePackagedIdentity(apkBytes, receipt);
  validatePackageOutput(
    run(tools.aapt, ["dump", "badging", resolve(apkPath)], { capture: true }),
    receipt,
  );
  run(tools.zipalign, ["-c", "-P", "16", "4", resolve(apkPath)], {
    capture: true,
  });
  return receipt;
}

export function freshOutputDirectory(value, repositoryRoot = root) {
  const destination = resolve(value);
  const privateRoot = resolve(repositoryRoot, ".tools", "android-release");
  const inside = relative(privateRoot, destination);
  if (
    !inside ||
    inside.startsWith(`..${sep}`) ||
    inside === ".." ||
    isAbsolute(inside)
  )
    throw new Error(
      "Release output must be a fresh child of .tools/android-release/.",
    );
  if (existsSync(destination))
    throw new Error(
      "Release output already exists. Choose a fresh output directory.",
    );
  // Reject redirected ancestors before creating any directories outside the workspace.
  const realRepository = realpathSync(repositoryRoot);
  let ancestor = dirname(destination);
  while (!existsSync(ancestor) && ancestor !== repositoryRoot)
    ancestor = dirname(ancestor);
  if (
    lstatSync(ancestor).isSymbolicLink() ||
    relative(
      resolve(realRepository, relative(repositoryRoot, ancestor)),
      realpathSync(ancestor),
    )
  )
    throw new Error("Release output escapes its private artifact directory.");
  mkdirSync(dirname(destination), { recursive: true });
  const realParent = realpathSync(dirname(destination));
  const realRoot = realpathSync(privateRoot);
  const relation = relative(realRoot, realParent);
  if (
    relation === ".." ||
    relation.startsWith(`..${sep}`) ||
    isAbsolute(relation)
  )
    throw new Error("Release output escapes its private artifact directory.");
  return destination;
}

export function releaseArguments(args) {
  const [command = "build", ...rest] = args;
  if (!["build", "check", "verify"].includes(command))
    throw new Error("Use android-release.mjs build, check, or verify.");
  const allowed =
    command === "build"
      ? ["--output"]
      : command === "verify"
        ? ["--apk", "--receipt", "--certificate-sha256"]
        : [];
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
        "Invalid or repeated release option. Do not put signing secrets on the command line.",
      );
    options[flag] = value;
  }
  if (command === "verify" && allowed.some((flag) => !options[flag]))
    throw new Error(
      "Verification requires --apk, --receipt, and --certificate-sha256.",
    );
  return { command, options };
}

function main(args) {
  assertSupportedNode();
  const { command, options } = releaseArguments(args);
  const tools = findAndroidTools();
  if (command === "verify") {
    verifyReleaseArtifact(
      options["--apk"],
      options["--receipt"],
      options["--certificate-sha256"],
      tools,
    );
    console.log(
      "Signed production APK, package identity, alignment, and artifact receipt passed verification.",
    );
    return;
  }
  gradle([":app:verifyReleaseConfiguration"], tools);
  if (command === "check") return;
  const output = freshOutputDirectory(
    options["--output"] ||
      join(
        root,
        ".tools",
        "android-release",
        `apk-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`,
      ),
  );
  run(process.platform === "win32" ? "bun.exe" : "bun", [
    "tools/build-android.mjs",
    "--release",
  ]);
  gradle(
    [":app:lintRelease", ":app:assembleRelease", ":app:verifyReleaseBundle"],
    tools,
  );
  const built = join(
    root,
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "release",
  );
  const receiptPath = join(built, "packaged-bundle-receipt.json");
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  verifyReleaseArtifact(
    join(built, "app-release.apk"),
    receiptPath,
    receipt.certificateSha256,
    tools,
  );
  mkdirSync(output);
  copyFileSync(
    join(built, "app-release.apk"),
    join(output, "mangoleaf-ai.apk"),
    constants.COPYFILE_EXCL,
  );
  writeFileSync(
    join(output, "release-receipt.json"),
    JSON.stringify(
      {
        ...receipt,
        verifiedAt: new Date().toISOString(),
        buildToolsVersion: tools.version,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  console.log(
    `Verified local production candidate: ${relative(root, output).split(sep).join("/")}`,
  );
  // The label belongs to the native APK, even when a later release reuses it for a newer web bundle.
  console.log(
    `GitHub APK asset label: ${androidApkAssetLabel(receipt.nativeVersionName)}`,
  );
  console.log(
    "Not installed, published, tagged, or deployed. Complete release validation before distribution.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

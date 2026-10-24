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
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { assertSupportedNode } from "./check-node-runtime.mjs";

export const LIMITS = Object.freeze({
  archiveBytes: 150 * 1024 * 1024,
  expandedBytes: 300 * 1024 * 1024,
  fileBytes: 64 * 1024 * 1024,
  fileCount: 5000,
  metadataBytes: 64 * 1024,
  descriptorBytes: 2 * 1024 * 1024,
});
const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const DESCRIPTOR = "android-bundle.json";
const OMITTED =
  /^(?:sw\.js(?:\.map)?|swe-worker-[^/]+\.js(?:\.map)?|manifest\.webmanifest)$/;
const PRIVATE_PATH =
  /(?:^|\/)(?:\.env(?:\.[^/]*)?|secrets|confidential|\.tools|\.git|photos|scans|reports|backups)(?:\/|$)|\.(?:sqlite3?|db|pem|key|jks|keystore|p12|pfx)$/i;

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function safeEntryName(name) {
  if (
    typeof name !== "string" ||
    name.length === 0 ||
    name.length > 240 ||
    !/^[a-zA-Z0-9_./@()+\[\] -]+$/.test(name) ||
    name.includes("\\") ||
    name.startsWith("/") ||
    name.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Invalid bundle entry path.");
  }
  return name;
}

export function releaseUrl(value, repository, allowLatest = false) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? "")) {
    throw new Error("Expected GitHub owner/repository.");
  }
  const url = new URL(value);
  const prefix = `/${repository}/releases/`;
  const suffix = url.pathname.slice(prefix.length);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    url.search ||
    !url.pathname.startsWith(prefix) ||
    !(
      /^(?:download\/[^/]+\/[^/]+)$/.test(suffix) ||
      (allowLatest && /^latest\/download\/[^/]+$/.test(suffix))
    ) ||
    /%(?:2f|5c|2e)/i.test(url.pathname)
  ) {
    throw new Error(
      "Expected HTTPS GitHub Release asset URL for the allowed repository.",
    );
  }
  return url.href;
}

export function modelIdentity(files) {
  const model = files.filter((file) => file.path.startsWith("model/"));
  if (
    !model.some((file) => file.path === "model/model.json") ||
    !model.some((file) => file.path === "model/model_config.json")
  ) {
    throw new Error("Missing complete model identity files.");
  }
  return sha256(
    model
      .map((file) => `${file.path}\t${file.bytes}\t${file.sha256}\n`)
      .join(""),
  );
}

function exportFiles(directory) {
  const root = realpathSync(directory);
  const files = [];
  const visit = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const full = join(folder, entry.name);
      const stat = lstatSync(full);
      if (stat.isSymbolicLink())
        throw new Error("Symbolic links are not bundle files.");
      if (entry.isDirectory()) visit(full);
      else if (stat.isFile()) {
        const path = safeEntryName(relative(root, full).split(sep).join("/"));
        if (OMITTED.test(path)) continue;
        if (
          path === DESCRIPTOR ||
          path.endsWith(".map") ||
          PRIVATE_PATH.test(path)
        ) {
          throw new Error("Export contains a reserved or private file.");
        }
        if (stat.size > LIMITS.fileBytes)
          throw new Error("Bundle file exceeds size limit.");
        files.push({
          path,
          bytes: stat.size,
          sha256: sha256(readFileSync(full)),
          source: full,
        });
      } else throw new Error("Only ordinary files are allowed in a bundle.");
    }
  };
  visit(root);
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (files.length === 0 || files.length + 1 > LIMITS.fileCount)
    throw new Error("Invalid bundle file count.");
  if (
    new Set(files.map((file) => file.path.toLowerCase())).size !== files.length
  ) {
    throw new Error("Case-colliding bundle paths.");
  }
  if (!files.some((file) => file.path === "index.html"))
    throw new Error("Missing index.html.");
  const model = JSON.parse(
    readFileSync(join(root, "model/model.json"), "utf8"),
  );
  const expected = model.weightsManifest?.flatMap((group) => group.paths ?? []);
  if (!expected?.length) throw new Error("Model weight manifest is empty.");
  for (const path of expected) {
    if (!files.some((file) => file.path === `model/${safeEntryName(path)}`))
      throw new Error("Missing model shard.");
  }
  return files;
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++)
    value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value >>> 0;
});
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

// Fixed timestamps/order/modes make identical exports produce identical ZIP bytes.
export function makeZip(files) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { path, content } of files) {
    const name = Buffer.from(safeEntryName(path), "utf8");
    const data = Buffer.from(content);
    const compressed = deflateRawSync(data, { level: 9 });
    const checksum = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(33, 12);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(name.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(0x314, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x800, 8);
    directory.writeUInt16LE(8, 10);
    directory.writeUInt16LE(33, 14);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    directory.writeUInt32LE(offset, 42);
    local.push(header, name, compressed);
    central.push(directory, name);
    offset += header.length + name.length + compressed.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(
    central.reduce((sum, part) => sum + part.length, 0),
    12,
  );
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

export function readZip(bytes) {
  if (bytes.length > LIMITS.archiveBytes)
    throw new Error("Archive exceeds size limit.");
  const entries = [];
  const seen = new Set();
  const end = bytes.length - 22;
  if (
    end < 0 ||
    bytes.readUInt32LE(end) !== 0x06054b50 ||
    bytes.readUInt16LE(end + 20) !== 0 ||
    bytes.readUInt16LE(end + 4) !== 0 ||
    bytes.readUInt16LE(end + 6) !== 0
  )
    throw new Error("Unsupported ZIP ending.");
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  const centralStart = cursor;
  let total = 0;
  let nextLocalOffset = 0;
  if (
    count === 0 ||
    count > LIMITS.fileCount ||
    bytes.readUInt16LE(end + 8) !== count
  )
    throw new Error("Invalid ZIP count.");
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || bytes.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error("Invalid ZIP directory.");
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const compressed = bytes.readUInt32LE(cursor + 20);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameBytes = bytes.readUInt16LE(cursor + 28);
    const extra = bytes.readUInt16LE(cursor + 30);
    const comment = bytes.readUInt16LE(cursor + 32);
    const mode = bytes.readUInt32LE(cursor + 38) >>> 16;
    const offset = bytes.readUInt32LE(cursor + 42);
    if (
      cursor + 46 + nameBytes + extra + comment > end ||
      extra ||
      comment ||
      flags !== 0x800 ||
      method !== 8 ||
      (mode & 0o170000) !== 0o100000 ||
      size > LIMITS.fileBytes ||
      compressed === 0 ||
      size / compressed > 1000 ||
      offset !== nextLocalOffset
    ) {
      throw new Error("Unsupported or oversized ZIP entry.");
    }
    const name = safeEntryName(
      bytes.subarray(cursor + 46, cursor + 46 + nameBytes).toString("utf8"),
    );
    if (seen.has(name.toLowerCase())) throw new Error("Duplicate ZIP entry.");
    seen.add(name.toLowerCase());
    if (
      offset + 30 + nameBytes + compressed > centralStart ||
      bytes.readUInt32LE(offset) !== 0x04034b50 ||
      bytes.readUInt16LE(offset + 6) !== flags ||
      bytes.readUInt16LE(offset + 8) !== method ||
      bytes.readUInt16LE(offset + 26) !== nameBytes ||
      bytes.readUInt16LE(offset + 28) !== 0 ||
      bytes.readUInt32LE(offset + 14) !== bytes.readUInt32LE(cursor + 16) ||
      bytes.readUInt32LE(offset + 18) !== compressed ||
      bytes.readUInt32LE(offset + 22) !== size ||
      bytes.subarray(offset + 30, offset + 30 + nameBytes).toString("utf8") !==
        name
    )
      throw new Error("ZIP local header differs.");
    const content = inflateRawSync(
      bytes.subarray(
        offset + 30 + nameBytes,
        offset + 30 + nameBytes + compressed,
      ),
      {
        maxOutputLength: Math.max(size, 1),
      },
    );
    if (
      content.length !== size ||
      crc32(content) !== bytes.readUInt32LE(cursor + 16)
    )
      throw new Error("ZIP content corrupt.");
    total += content.length;
    if (total > LIMITS.expandedBytes)
      throw new Error("Expanded ZIP too large.");
    entries.push({ path: name, content });
    nextLocalOffset = offset + 30 + nameBytes + compressed;
    cursor += 46 + nameBytes;
  }
  if (
    nextLocalOffset !== centralStart ||
    cursor !== end ||
    cursor - centralStart !== bytes.readUInt32LE(end + 12)
  ) {
    throw new Error("Unexpected ZIP data.");
  }
  return entries;
}

export function validateDescriptor(descriptor, entries) {
  if (
    descriptor.protocol !== 1 ||
    !Number.isSafeInteger(descriptor.sequence) ||
    descriptor.sequence < 1 ||
    !COMMIT.test(descriptor.sourceCommit) ||
    !HASH.test(descriptor.modelIdentity) ||
    !Array.isArray(descriptor.files) ||
    descriptor.files.length + 1 !== entries.length ||
    !Number.isSafeInteger(descriptor.nativeHostMin) ||
    descriptor.nativeHostMin < 1 ||
    !Number.isSafeInteger(descriptor.nativeHostMax) ||
    descriptor.nativeHostMax < descriptor.nativeHostMin ||
    descriptor.bridgeVersion !== 1 ||
    descriptor.schemaVersion !== 1 ||
    !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(descriptor.bundleVersion)
  )
    throw new Error("Invalid bundle descriptor.");
  const expected = new Map();
  for (const file of descriptor.files) {
    safeEntryName(file.path);
    if (
      PRIVATE_PATH.test(file.path) ||
      expected.has(file.path) ||
      file.path === DESCRIPTOR ||
      !HASH.test(file.sha256) ||
      !Number.isSafeInteger(file.bytes) ||
      file.bytes < 0 ||
      file.bytes > LIMITS.fileBytes
    )
      throw new Error("Invalid descriptor file.");
    expected.set(file.path, file);
  }
  if (
    !expected.has("index.html") ||
    modelIdentity(descriptor.files) !== descriptor.modelIdentity
  )
    throw new Error("Model identity differs.");
  for (const entry of entries) {
    if (entry.path === DESCRIPTOR) continue;
    const file = expected.get(entry.path);
    if (
      !file ||
      entry.content.length !== file.bytes ||
      sha256(entry.content) !== file.sha256
    )
      throw new Error("Bundle file differs.");
  }
  return descriptor;
}

export function prepareBundle(exportDirectory, outputDirectory, options) {
  const source = resolve(exportDirectory);
  const output = resolve(outputDirectory);
  if (
    output === source ||
    output.startsWith(source + sep) ||
    source.startsWith(output + sep)
  )
    throw new Error("Input and output must be separate directories.");
  const files = exportFiles(source);
  const descriptor = {
    protocol: 1,
    sequence: Number(options.sequence),
    bundleVersion: options.version,
    nativeHostMin: Number(options.hostMin ?? 6),
    nativeHostMax: Number(options.hostMax ?? 6),
    bridgeVersion: 1,
    schemaVersion: 1,
    modelIdentity: modelIdentity(files),
    sourceCommit: options.sourceCommit,
    files: files.map(({ path, bytes, sha256: hash }) => ({
      path,
      bytes,
      sha256: hash,
    })),
  };
  const descriptorBytes = Buffer.from(
    JSON.stringify(descriptor, null, 2) + "\n",
  );
  const entries = files.map(({ path, source: file }) => ({
    path,
    content: readFileSync(file),
  }));
  entries.push({ path: DESCRIPTOR, content: descriptorBytes });
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  validateDescriptor(descriptor, entries);
  if (
    descriptorBytes.length > LIMITS.descriptorBytes ||
    entries.reduce((sum, entry) => sum + entry.content.length, 0) >
      LIMITS.expandedBytes
  )
    throw new Error("Bundle too large.");
  // Never merge into an old web directory: stale files would weaken bundle identity.
  if (existsSync(join(output, "web")))
    throw new Error(
      "Output web directory already exists; use a fresh staging directory.",
    );
  mkdirSync(join(output, "web"), { recursive: true });
  for (const file of files) {
    const target = join(output, "web", file.path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(file.source, target, constants.COPYFILE_EXCL);
  }
  writeFileSync(join(output, "web", DESCRIPTOR), descriptorBytes, {
    flag: "wx",
  });
  if (options.stageOnly) return { descriptor };
  const repository =
    options.repository ??
    new URL(options.archiveUrl).pathname.split("/").slice(1, 3).join("/");
  const archiveUrl = releaseUrl(options.archiveUrl, repository);
  const archive = makeZip(entries);
  if (archive.length > LIMITS.archiveBytes)
    throw new Error("Archive too large.");
  const metadata = {
    ...Object.fromEntries(
      Object.entries(descriptor).filter(([key]) => key !== "files"),
    ),
    archiveUrl,
    archiveSha256: sha256(archive),
    archiveBytes: archive.length,
    expandedBytes: entries.reduce(
      (sum, entry) => sum + entry.content.length,
      0,
    ),
    fileCount: entries.length,
    descriptorSha256: sha256(descriptorBytes),
  };
  writeFileSync(join(output, "web-update.zip"), archive, { flag: "wx" });
  writeFileSync(
    join(output, "update.json"),
    JSON.stringify(metadata, null, 2) + "\n",
    { flag: "wx" },
  );
  return { descriptor, metadata };
}

export function signMetadata(
  metadataPath,
  keyPath,
  signaturePath = join(dirname(metadataPath), "update.sig"),
  passphrase,
) {
  const metadata = readFileSync(metadataPath);
  if (metadata.length > LIMITS.metadataBytes)
    throw new Error("Metadata too large.");
  // Passwords stay in process memory and are never written into update metadata.
  const key = createPrivateKey({ key: readFileSync(keyPath), passphrase });
  if (
    key.asymmetricKeyType !== "rsa" ||
    key.asymmetricKeyDetails.modulusLength < 3072
  )
    throw new Error("Signing key must be RSA 3072 bits or stronger.");
  writeFileSync(
    signaturePath,
    sign("RSA-SHA256", metadata, key).toString("base64") + "\n",
    { flag: "wx" },
  );
  return createPublicKey(key)
    .export({ type: "spki", format: "der" })
    .toString("base64");
}

export function verifyBundle(
  metadataPath,
  signaturePath,
  publicKeyPath,
  archivePath,
  repository,
) {
  const metadataBytes = readFileSync(metadataPath);
  if (metadataBytes.length > LIMITS.metadataBytes)
    throw new Error("Metadata too large.");
  const keyBytes = readFileSync(publicKeyPath, "utf8").trim();
  const key = keyBytes.startsWith("-----")
    ? createPublicKey(keyBytes)
    : createPublicKey({
        key: Buffer.from(keyBytes, "base64"),
        type: "spki",
        format: "der",
      });
  if (
    key.asymmetricKeyType !== "rsa" ||
    key.asymmetricKeyDetails.modulusLength < 3072 ||
    !verify(
      "RSA-SHA256",
      metadataBytes,
      key,
      Buffer.from(readFileSync(signaturePath, "utf8").trim(), "base64"),
    )
  )
    throw new Error("Metadata signature is invalid.");
  const metadata = JSON.parse(metadataBytes);
  releaseUrl(metadata.archiveUrl, repository);
  for (const [field, maximum] of [
    ["archiveBytes", LIMITS.archiveBytes],
    ["expandedBytes", LIMITS.expandedBytes],
    ["fileCount", LIMITS.fileCount],
  ]) {
    if (
      !Number.isSafeInteger(metadata[field]) ||
      metadata[field] < 1 ||
      metadata[field] > maximum
    )
      throw new Error("Invalid metadata limits.");
  }
  const archiveStat = lstatSync(archivePath);
  if (!archiveStat.isFile() || archiveStat.size > LIMITS.archiveBytes)
    throw new Error("Archive exceeds size limit or is not an ordinary file.");
  const archive = readFileSync(archivePath);
  if (
    archive.length > LIMITS.archiveBytes ||
    archive.length !== metadata.archiveBytes ||
    sha256(archive) !== metadata.archiveSha256
  )
    throw new Error("Archive identity differs.");
  const entries = readZip(archive);
  const descriptorFile = entries.find((file) => file.path === DESCRIPTOR);
  if (
    !descriptorFile ||
    descriptorFile.content.length > LIMITS.descriptorBytes ||
    sha256(descriptorFile.content) !== metadata.descriptorSha256 ||
    entries.length !== metadata.fileCount ||
    entries.reduce((sum, entry) => sum + entry.content.length, 0) !==
      metadata.expandedBytes
  )
    throw new Error("Bundle totals differ.");
  const descriptor = validateDescriptor(
    JSON.parse(descriptorFile.content),
    entries,
  );
  for (const field of [
    "protocol",
    "sequence",
    "bundleVersion",
    "nativeHostMin",
    "nativeHostMax",
    "bridgeVersion",
    "schemaVersion",
    "modelIdentity",
    "sourceCommit",
  ]) {
    if (descriptor[field] !== metadata[field])
      throw new Error("Descriptor differs from signed metadata.");
  }
  return { descriptor, metadata };
}

function argumentsMap(args) {
  const result = {};
  for (let index = 0; index < args.length; index++) {
    if (!args[index].startsWith("--"))
      throw new Error("Expected named arguments.");
    const key = args[index]
      .slice(2)
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = key === "stageOnly" ? true : args[++index];
    if (result[key] === undefined) throw new Error("Missing argument value.");
  }
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    // CLI execution uses Node; Bun library imports for staging remain supported.
    assertSupportedNode();
    const command = process.argv[2];
    const options = argumentsMap(process.argv.slice(3));
    if (command === "prepare") {
      const result = prepareBundle(options.export, options.output, options);
      console.log(
        `Prepared ${result.descriptor.files.length} web files; model ${result.descriptor.modelIdentity}.`,
      );
    } else if (command === "sign") {
      signMetadata(
        options.metadata,
        options.key,
        options.signature,
        process.env.MANGOLEAF_OTA_KEY_PASSPHRASE,
      );
      console.log(
        "Signed exact metadata bytes. Keep the private key outside the repository.",
      );
    } else if (command === "verify") {
      verifyBundle(
        options.metadata,
        options.signature,
        options.publicKey,
        options.archive,
        options.repository,
      );
      console.log(
        "Signature, archive, descriptor, model identity, and all files verified.",
      );
    } else
      throw new Error("Use prepare, sign, or verify with named arguments.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

import { afterEach, expect, test } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import {
  makeZip,
  prepareBundle,
  readZip,
  releaseUrl,
  safeEntryName,
  signMetadata,
  verifyBundle,
} from "./android-bundle.mjs";

const temporary = [];
function folder() {
  const path = mkdtempSync(join(tmpdir(), "mangoleaf-android-bundle-"));
  temporary.push(path);
  return path;
}
function write(root, name, content) {
  mkdirSync(dirname(join(root, name)), { recursive: true });
  writeFileSync(join(root, name), content);
}
function exported() {
  const root = folder();
  write(
    root,
    "index.html",
    "<html><script src='/_next/app.js'></script></html>",
  );
  write(root, "_next/app.js", "console.log('fixture')");
  write(
    root,
    "model/model.json",
    JSON.stringify({ weightsManifest: [{ paths: ["weights.bin"] }] }),
  );
  write(
    root,
    "model/model_config.json",
    JSON.stringify({ modelVersion: "fixture" }),
  );
  write(root, "model/weights.bin", "fixture model");
  write(root, "sw.js", "old worker must not replace native bundle assets");
  return root;
}
function options() {
  return {
    sequence: 2,
    version: "0.8.0",
    sourceCommit: "a".repeat(40),
    archiveUrl:
      "https://github.com/example/mangoleaf/releases/download/web-2/web-update.zip",
  };
}

afterEach(() => {
  for (const path of temporary.splice(0)) {
    const absolute = resolve(path);
    if (
      !absolute.startsWith(
        resolve(tmpdir()) + sep + "mangoleaf-android-bundle-",
      )
    )
      throw new Error("Unexpected test directory.");
    rmSync(absolute, { recursive: true, force: true });
  }
});

test("same export produces identical archives with complete matching inventory", () => {
  const input = exported();
  const first = folder();
  const second = folder();
  prepareBundle(input, first, options());
  prepareBundle(input, second, options());
  expect(readFileSync(join(first, "web-update.zip"))).toEqual(
    readFileSync(join(second, "web-update.zip")),
  );
  const entries = readZip(readFileSync(join(first, "web-update.zip")));
  // Default bundles require the host with guarded restart and renderer-failure recovery fixes.
  const descriptor = JSON.parse(
    readFileSync(join(first, "web/android-bundle.json"), "utf8"),
  );
  expect(descriptor.nativeHostMin).toBe(6);
  expect(descriptor.nativeHostMax).toBe(6);
  expect(entries.some((file) => file.path === "sw.js")).toBe(false);
  expect(entries.some((file) => file.path === "android-bundle.json")).toBe(
    true,
  );
});

test("signatures authenticate exact metadata and archive bytes", () => {
  const directory = folder();
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 3072,
  });
  write(
    directory,
    "private.pem",
    privateKey.export({ type: "pkcs8", format: "pem" }),
  );
  write(
    directory,
    "public.pem",
    publicKey.export({ type: "spki", format: "pem" }),
  );
  prepareBundle(exported(), directory, options());
  signMetadata(join(directory, "update.json"), join(directory, "private.pem"));
  const verify = () =>
    verifyBundle(
      join(directory, "update.json"),
      join(directory, "update.sig"),
      join(directory, "public.pem"),
      join(directory, "web-update.zip"),
      "example/mangoleaf",
    );
  expect(verify().metadata.sequence).toBe(2);
  const metadata = readFileSync(join(directory, "update.json"));
  write(directory, "update.json", Buffer.concat([metadata, Buffer.from(" ")]));
  expect(verify).toThrow("signature");
  write(directory, "update.json", metadata);
  const archive = readFileSync(join(directory, "web-update.zip"));
  archive[50] ^= 1;
  write(directory, "web-update.zip", archive);
  expect(verify).toThrow("Archive identity");
});

test("encrypted OTA keys need the matching passphrase before signing metadata", () => {
  const directory = folder();
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 3072,
  });
  write(
    directory,
    "encrypted.pem",
    privateKey.export({
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: "synthetic-key-fixture",
    }),
  );
  write(
    directory,
    "public.pem",
    publicKey.export({ type: "spki", format: "pem" }),
  );
  prepareBundle(exported(), directory, options());
  const metadata = join(directory, "update.json");
  const key = join(directory, "encrypted.pem");
  expect(() =>
    signMetadata(metadata, key, undefined, "wrong-fixture"),
  ).toThrow();
  signMetadata(metadata, key, undefined, "synthetic-key-fixture");
  expect(
    verifyBundle(
      metadata,
      join(directory, "update.sig"),
      join(directory, "public.pem"),
      join(directory, "web-update.zip"),
      "example/mangoleaf",
    ).metadata.sequence,
  ).toBe(2);
});

test("paths cannot escape staging and URLs cannot cross repository trust", () => {
  for (const path of [
    "../scan.db",
    "/absolute",
    "C:/private",
    "images/../scan",
    "x\\y",
    "x//y",
  ]) {
    expect(() => safeEntryName(path)).toThrow();
  }
  for (const url of [
    "http://github.com/example/mangoleaf/releases/download/x/a.zip",
    "https://github.com/other/mangoleaf/releases/download/x/a.zip",
    "https://github.com.example.com/example/mangoleaf/releases/download/x/a.zip",
    "https://github.com/example/mangoleaf/releases/download/x/a.zip?redirect=outside",
    "https://github.com/example/mangoleaf/releases/download/x/a%2fprivate",
  ])
    expect(() => releaseUrl(url, "example/mangoleaf")).toThrow();
  expect(() =>
    releaseUrl(
      "https://github.com/example/mangoleaf/releases/latest/download/update.json",
      "example/mangoleaf",
      true,
    ),
  ).not.toThrow();
});

test("ZIP rejects duplicate names, symlinks, truncation and conflicting local headers", () => {
  const duplicate = makeZip([
    { path: "index.html", content: "one" },
    { path: "INDEX.html", content: "two" },
  ]);
  expect(() => readZip(duplicate)).toThrow("Duplicate");
  const ordinary = makeZip([{ path: "index.html", content: "content" }]);
  expect(() => readZip(ordinary.subarray(0, ordinary.length - 1))).toThrow();
  const symlink = Buffer.from(ordinary);
  const central = symlink.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  symlink.writeUInt32LE((0o120777 << 16) >>> 0, central + 38);
  expect(() => readZip(symlink)).toThrow("Unsupported");
  const wrongHeader = Buffer.from(ordinary);
  wrongHeader[14] ^= 1;
  expect(() => readZip(wrongHeader)).toThrow("local header");
});

test("staging rejects stale output, missing model files and private export files", () => {
  const input = exported();
  const output = folder();
  prepareBundle(input, output, { ...options(), stageOnly: true });
  expect(() =>
    prepareBundle(input, output, { ...options(), stageOnly: true }),
  ).toThrow("already exists");
  const privateExport = exported();
  write(privateExport, ".env.local", "fixture only");
  expect(() => prepareBundle(privateExport, folder(), options())).toThrow(
    "private",
  );
  for (const name of ["release.p12", "release.pfx"]) {
    const keyExport = exported();
    write(keyExport, name, "synthetic private-key container");
    expect(() => prepareBundle(keyExport, folder(), options())).toThrow(
      "private",
    );
  }
  const missing = exported();
  rmSync(join(missing, "model/weights.bin"));
  expect(() => prepareBundle(missing, folder(), options())).toThrow("shard");
});

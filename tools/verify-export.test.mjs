import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { verifyExport } from "./verify-export.mjs";

const directories = [];
function exportedApp() {
  const directory = mkdtempSync(join(tmpdir(), "mangoleaf-export-test-"));
  directories.push(directory);
  const files = {
    "index.html": "<html></html>",
    "sw.js": "/* fixture */",
    "manifest.webmanifest": "{}",
    "model/model_config.json": "{}",
    "model/model.json": JSON.stringify({ weightsManifest: [{ paths: ["weights.bin"] }] }),
    "model/weights.bin": "fixture bytes",
    "images/icons/png/icon-192x192.png": "fixture bytes",
    "images/icons/png/icon-512x512.png": "fixture bytes",
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(directory, path)), { recursive: true });
    writeFileSync(join(directory, path), content);
  }
  return directory;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    const target = resolve(directory);
    if (!target.startsWith(resolve(tmpdir()) + sep + "mangoleaf-export-test-")) {
      throw new Error("Refusing to remove a directory outside the test workspace.");
    }
    rmSync(target, { recursive: true, force: true });
  }
});

test("complete export passes", () => {
  expect(() => verifyExport(exportedApp())).not.toThrow();
});

test("missing model shard or PWA icon fails", () => {
  for (const path of ["model/weights.bin", "images/icons/png/icon-192x192.png"]) {
    const directory = exportedApp();
    unlinkSync(join(directory, path));
    expect(() => verifyExport(directory)).toThrow();
  }
});

test("empty service worker and malformed model configuration fail", () => {
  const emptyWorker = exportedApp();
  writeFileSync(join(emptyWorker, "sw.js"), "");
  expect(() => verifyExport(emptyWorker)).toThrow();
  const badConfig = exportedApp();
  writeFileSync(join(badConfig, "model/model_config.json"), "not JSON");
  expect(() => verifyExport(badConfig)).toThrow();
});

test("empty weight manifests and escaping shard paths fail", () => {
  for (const paths of [[], ["../../outside.bin"]]) {
    const directory = exportedApp();
    writeFileSync(join(directory, "model/model.json"), JSON.stringify({ weightsManifest: [{ paths }] }));
    expect(() => verifyExport(directory)).toThrow();
  }
});

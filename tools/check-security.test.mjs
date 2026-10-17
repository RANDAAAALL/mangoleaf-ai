import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isForbiddenFile, pushedRevisions } from "./check-security.mjs";

const temporaryRepositories = [];
const scanner = fileURLToPath(new URL("./check-security.mjs", import.meta.url));

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0)
    throw new Error(result.error?.message || result.stderr);
  return result.stdout.trim();
}

function repository() {
  const cwd = mkdtempSync(join(tmpdir(), "mangoleaf-security-test-"));
  temporaryRepositories.push(cwd);
  git(cwd, "init", "-b", "master");
  git(cwd, "config", "user.name", "Security test");
  git(cwd, "config", "user.email", "test@example.invalid");
  // Fixtures must not run a developer's global hooks or signing configuration.
  git(cwd, "config", "core.hooksPath", join(cwd, "empty-hooks"));
  git(cwd, "config", "commit.gpgSign", "false");
  writeFileSync(join(cwd, "README.md"), "Security regression fixture.\n");
  commit(cwd);
  return cwd;
}

function commit(cwd) {
  git(cwd, "add", ".");
  git(cwd, "commit", "-m", "Fixture");
}

function scan(cwd) {
  return spawnSync(process.execPath, [scanner], { cwd, encoding: "utf8" });
}

afterEach(() => {
  for (const cwd of temporaryRepositories.splice(0)) {
    const target = resolve(cwd);
    if (
      !target.startsWith(resolve(tmpdir()) + sep + "mangoleaf-security-test-")
    ) {
      throw new Error(
        "Refusing to remove a directory outside the test workspace.",
      );
    }
    rmSync(target, { recursive: true, force: true });
  }
});

test("private paths are rejected while templates and public keys remain allowed", () => {
  for (const path of [
    ".env",
    ".env.local",
    "nested/.ENV.production",
    "keys/id_ed25519",
    "keys/server.pem",
    "secrets/export.json",
    "confidential/report.pdf",
    "docs/EMAIL_DISPATCH_WORKFLOW.md",
  ]) {
    expect(isForbiddenFile(path)).toBe(true);
  }
  for (const path of [
    ".env.example",
    "nested/.env.example",
    "keys/id_ed25519.pub",
    "src/lib/supabase-client.ts",
  ]) {
    expect(isForbiddenFile(path)).toBe(false);
  }
});

test("pre-push input handles multiple refs, deletions, and invalid input", () => {
  const sha = "a".repeat(40);
  const zeros = "0".repeat(40);
  expect(
    pushedRevisions(
      `refs/heads/master ${sha} refs/heads/master ${zeros}\n(delete) ${zeros} refs/tags/old ${sha}\n`,
    ),
  ).toEqual([sha]);
  expect(pushedRevisions("")).toEqual([]);
  expect(() => pushedRevisions("invalid hook input")).toThrow();
});

test("clean history passes without scanning ignored local environment contents", () => {
  const cwd = repository();
  writeFileSync(join(cwd, ".gitignore"), ".env.local\n");
  writeFileSync(join(cwd, ".env.example"), "PUBLIC_SETTING=example\n");
  writeFileSync(join(cwd, ".env.local"), "LOCAL_ONLY=example\n");
  commit(cwd);
  expect(scan(cwd).status).toBe(0);
});

test("a private filename still fails after deletion in a later commit", () => {
  const cwd = repository();
  mkdirSync(join(cwd, "nested"));
  writeFileSync(join(cwd, "nested/.env.local"), "SETTING=example\n");
  commit(cwd);
  git(cwd, "rm", "nested/.env.local");
  commit(cwd);
  const result = scan(cwd);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("nested/.env.local");
});

test("a deleted credential is found in history without printing its value", () => {
  const cwd = repository();
  // Generated dummy credential; this is not a usable token.
  const dummyToken =
    "ghp_" +
    createHash("sha256")
      .update("synthetic regression credential")
      .digest("hex")
      .slice(0, 36);
  writeFileSync(join(cwd, "config.txt"), `token=${dummyToken}\n`);
  commit(cwd);
  git(cwd, "rm", "config.txt");
  commit(cwd);
  const result = scan(cwd);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("config.txt");
  expect(result.stderr + result.stdout).not.toContain(dummyToken);
});

test("a finding exception does not hide changed credentials in the same file", () => {
  const cwd = repository();
  const file = "diagnostics.ts";
  // Reproduce the public storage-name false positive in an isolated Git history.
  const storageName = ["mangoleaf", "diagnostics", "v1"].join("-");
  writeFileSync(
    join(cwd, file),
    `const STORAGE_KEY = ${JSON.stringify(storageName)};\n`,
  );
  commit(cwd);
  const auditedCommit = git(cwd, "rev-parse", "HEAD");
  expect(scan(cwd).status).toBe(1);
  writeFileSync(
    join(cwd, ".gitleaksignore"),
    `${auditedCommit}:${file}:generic-api-key:1\n`,
  );
  commit(cwd);
  expect(scan(cwd).status).toBe(0);

  // A later credential at the same path/line must still fail and stay redacted.
  const dummyToken =
    "ghp_" +
    createHash("sha256")
      .update("synthetic credential after audited storage name")
      .digest("hex")
      .slice(0, 36);
  writeFileSync(join(cwd, file), `const API_KEY = "${dummyToken}";\n`);
  commit(cwd);
  const result = scan(cwd);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(file);
  expect(result.stderr + result.stdout).not.toContain(dummyToken);
});

test("incomplete history fails instead of reporting a clean scan", () => {
  const cwd = repository();
  const shallow = mkdtempSync(join(tmpdir(), "mangoleaf-security-test-"));
  temporaryRepositories.push(shallow);
  git(cwd, "clone", "--depth=1", pathToFileURL(cwd).href, shallow);
  const result = scan(shallow);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("full history");
});

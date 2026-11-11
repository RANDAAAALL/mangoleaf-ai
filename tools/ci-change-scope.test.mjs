import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPush } from "./ci-change-scope.mjs";

const repositories = [];
function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}
function commit(cwd) {
  git(cwd, "add", ".");
  git(cwd, "commit", "-m", "Fixture");
  return git(cwd, "rev-parse", "HEAD");
}
function repository() {
  const cwd = mkdtempSync(join(tmpdir(), "mangoleaf-ci-scope-"));
  repositories.push(cwd);
  git(cwd, "init", "-b", "master");
  git(cwd, "config", "user.name", "CI scope test");
  git(cwd, "config", "user.email", "test@example.invalid");
  git(cwd, "config", "commit.gpgSign", "false");
  git(cwd, "config", "core.hooksPath", join(cwd, "empty-hooks"));
  writeFileSync(join(cwd, "README.md"), "Fixture\n");
  return { cwd, before: commit(cwd) };
}
function scope(cwd, before, after = git(cwd, "rev-parse", "HEAD")) {
  return classifyPush({ cwd, before, after, eventName: "push" });
}
afterEach(() => {
  for (const cwd of repositories.splice(0)) {
    const target = resolve(cwd);
    if (!target.startsWith(resolve(tmpdir()) + sep + "mangoleaf-ci-scope-")) {
      throw new Error("Refusing cleanup outside the test directory.");
    }
    rmSync(target, { recursive: true, force: true });
  }
});

test("root and nested Markdown changes across several commits use the short path", () => {
  const { cwd, before } = repository();
  writeFileSync(join(cwd, "README.md"), "Updated\n");
  commit(cwd);
  mkdirSync(join(cwd, "docs"));
  writeFileSync(join(cwd, "docs", "space name.MD"), "Notes\n");
  commit(cwd);
  expect(scope(cwd, before).markdownOnly).toBe(true);
  git(cwd, "rm", "README.md");
  commit(cwd);
  expect(scope(cwd, before).markdownOnly).toBe(true);
});

test("an earlier code change still requires full CI after a Markdown-only final commit", () => {
  const { cwd, before } = repository();
  writeFileSync(join(cwd, "app.js"), "export default 1;\n");
  commit(cwd);
  writeFileSync(join(cwd, "README.md"), "Updated\n");
  commit(cwd);
  expect(scope(cwd, before).markdownOnly).toBe(false);
  // Even reverting the code change cannot disguise a mixed push as Markdown-only.
  git(cwd, "rm", "app.js");
  commit(cwd);
  expect(scope(cwd, before).markdownOnly).toBe(false);
});

test("renaming between code and Markdown inspects both original and new paths", () => {
  const { cwd, before } = repository();
  git(cwd, "mv", "README.md", "README.js");
  const renamed = commit(cwd);
  expect(scope(cwd, before).markdownOnly).toBe(false);
  git(cwd, "mv", "README.js", "README.md");
  commit(cwd);
  expect(scope(cwd, renamed).markdownOnly).toBe(false);
});

test("a merge containing code requires full CI", () => {
  const { cwd, before } = repository();
  git(cwd, "checkout", "-b", "feature");
  writeFileSync(join(cwd, "feature.ts"), "export {};\n");
  commit(cwd);
  git(cwd, "checkout", "master");
  writeFileSync(join(cwd, "README.md"), "Main branch notes\n");
  commit(cwd);
  git(cwd, "merge", "--no-ff", "feature", "-m", "Merge fixture");
  expect(scope(cwd, before).markdownOnly).toBe(false);
});

test("missing, initial, empty, mismatched and rewritten ranges require full CI", () => {
  const { cwd, before } = repository();
  expect(scope(cwd, before).markdownOnly).toBe(false);
  expect(scope(cwd, "0".repeat(40)).markdownOnly).toBe(false);
  expect(scope(cwd, "invalid").markdownOnly).toBe(false);
  expect(scope(cwd, "a".repeat(40)).markdownOnly).toBe(false);
  writeFileSync(join(cwd, "README.md"), "Later notes\n");
  const later = commit(cwd);
  expect(scope(cwd, before, before).markdownOnly).toBe(false);
  expect(
    classifyPush({ cwd, before, after: later, eventName: "workflow_dispatch" })
      .markdownOnly,
  ).toBe(false);
  git(cwd, "checkout", "-b", "replacement", before);
  writeFileSync(join(cwd, "README.md"), "Replacement notes\n");
  commit(cwd);
  expect(scope(cwd, later).markdownOnly).toBe(false);
});

test("the CLI writes the job output and defaults to full CI for an unreadable event", () => {
  const { cwd, before } = repository();
  writeFileSync(join(cwd, "README.md"), "Updated\n");
  const after = commit(cwd);
  const eventPath = join(cwd, "event.json");
  const output = join(cwd, "job-output.txt");
  const cli = fileURLToPath(new URL("./ci-change-scope.mjs", import.meta.url));
  const env = {
    ...process.env,
    GITHUB_EVENT_NAME: "push",
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_OUTPUT: output,
  };
  writeFileSync(eventPath, JSON.stringify({ before, after }));
  expect(spawnSync(process.execPath, [cli], { cwd, env }).status).toBe(0);
  expect(readFileSync(output, "utf8")).toBe("markdown_only=true\n");
  writeFileSync(eventPath, "bad event");
  expect(spawnSync(process.execPath, [cli], { cwd, env }).status).toBe(0);
  expect(readFileSync(output, "utf8")).toBe(
    "markdown_only=true\nmarkdown_only=false\n",
  );
});

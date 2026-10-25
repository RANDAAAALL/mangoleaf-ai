import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep, basename } from "node:path";
import { releaseTagArguments, tagRelease } from "./tag-release.mjs";

const temporary = [];
function git(cwd, ...args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error || result.status !== 0)
    throw new Error(result.stderr || "Fixture Git failed");
  return result.stdout.trim();
}
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "mangoleaf-release-tag-"));
  temporary.push(directory);
  git(directory, "init", "-b", "master");
  git(directory, "config", "user.name", "Release fixture");
  git(directory, "config", "user.email", "release-fixture@example.invalid");
  git(directory, "config", "commit.gpgSign", "false");
  git(directory, "config", "tag.gpgSign", "false");
  git(directory, "config", "core.hooksPath", join(directory, "no-hooks"));
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({ name: "mangoleaf-ai", version: "0.11.0" }),
  );
  git(directory, "add", "package.json");
  git(directory, "commit", "-m", "Fixture candidate");
  const commit = git(directory, "rev-parse", "HEAD");
  const options = releaseTagArguments(["--tag", "v0.11.0", "--commit", commit]);
  return { directory, commit, options };
}
afterEach(() => {
  for (const directory of temporary.splice(0)) {
    const absolute = resolve(directory);
    if (
      !absolute.startsWith(resolve(tmpdir()) + sep) ||
      !basename(absolute).startsWith("mangoleaf-release-tag-")
    )
      throw new Error("Unsafe fixture cleanup path");
    rmSync(absolute, { recursive: true, force: true });
  }
});

test("release tagging requires an explicit full commit and bounded version/options", () => {
  for (const args of [
    [],
    ["--tag", "v0.11.0", "--commit", "HEAD"],
    ["--tag", "v0.11.0", "--commit", "f6e0484"],
    ["--tag", "../bad", "--commit", "a".repeat(40)],
    ["--tag", "v0.11.0", "--commit", "a".repeat(40), "--push", "--push"],
    ["--tag", "v0.11.0", "--commit", "a".repeat(40), "--force"],
  ])
    expect(() => releaseTagArguments(args)).toThrow();
});

test("local annotated tags keep the explicit target and remain unchanged on reuse", () => {
  const { directory, commit, options } = fixture();
  expect(tagRelease(options, directory)).toEqual({
    tag: "v0.11.0",
    commit,
    pushed: false,
    reused: false,
  });
  expect(git(directory, "cat-file", "-t", "refs/tags/v0.11.0")).toBe("tag");
  expect(git(directory, "rev-parse", "v0.11.0^{commit}")).toBe(commit);
  const original = git(directory, "rev-parse", "refs/tags/v0.11.0");
  expect(tagRelease(options, directory).reused).toBe(true);
  expect(git(directory, "rev-parse", "refs/tags/v0.11.0")).toBe(original);
});

test("version mismatch, unknown commit, lightweight tags and changed targets are refused", () => {
  const { directory, options } = fixture();
  expect(() =>
    tagRelease({ ...options, "--tag": "v0.10.1" }, directory),
  ).toThrow("tag must match");
  expect(() =>
    tagRelease({ ...options, "--commit": "0".repeat(40) }, directory),
  ).toThrow();
  git(directory, "tag", "v0.11.0");
  const lightweight = git(directory, "rev-parse", "refs/tags/v0.11.0");
  expect(() => tagRelease(options, directory)).toThrow("not annotated");
  expect(git(directory, "rev-parse", "refs/tags/v0.11.0")).toBe(lightweight);
  // A separate fixture proves that even an annotated tag may not move to another commit.
  const other = fixture();
  tagRelease(other.options, other.directory);
  git(other.directory, "commit", "--allow-empty", "-m", "Another candidate");
  expect(() =>
    tagRelease(
      {
        ...other.options,
        "--commit": git(other.directory, "rev-parse", "HEAD"),
      },
      other.directory,
    ),
  ).toThrow("different target");
});

test("explicit push affects only the chosen tag and refuses an existing remote tag", () => {
  const { directory, commit, options } = fixture();
  const remote = join(directory, "origin.git");
  mkdirSync(remote);
  git(remote, "init", "--bare");
  git(directory, "remote", "add", "origin", remote);
  git(directory, "config", "push.followTags", "true");
  git(directory, "tag", "-a", "unselected-fixture", "-m", "Must stay local");
  expect(tagRelease({ ...options, push: true }, directory).pushed).toBe(true);
  expect(git(remote, "rev-parse", "v0.11.0^{commit}")).toBe(commit);
  expect(git(remote, "for-each-ref", "--format=%(refname)", "refs/heads")).toBe(
    "",
  );
  const original = git(remote, "rev-parse", "refs/tags/v0.11.0");
  expect(git(remote, "tag", "--list")).toBe("v0.11.0");
  expect(() => tagRelease({ ...options, push: true }, directory)).toThrow(
    "remote tag already exists",
  );
  expect(git(remote, "rev-parse", "refs/tags/v0.11.0")).toBe(original);
});

test("unavailable origin stops before creating a local tag", () => {
  const { directory, options } = fixture();
  git(
    directory,
    "remote",
    "add",
    "origin",
    join(directory, "missing-origin.git"),
  );
  expect(() => tagRelease({ ...options, push: true }, directory)).toThrow(
    "Git command failed",
  );
  expect(git(directory, "tag", "--list")).toBe("");
});

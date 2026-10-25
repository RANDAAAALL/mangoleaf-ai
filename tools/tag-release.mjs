import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertSupportedNode } from "./check-node-runtime.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function releaseTagArguments(args) {
  const options = { push: false };
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === "--push" && !options.push) {
      options.push = true;
      continue;
    }
    if (
      !["--tag", "--commit", "--message"].includes(flag) ||
      options[flag] !== undefined
    )
      throw new Error(
        "Use --tag, --commit, optional --message and optional --push once each.",
      );
    const value = args[++index];
    if (!value || value.startsWith("--") || value.includes("\0"))
      throw new Error("Each release option needs a value.");
    options[flag] = value;
  }
  if (
    !/^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(options["--tag"] || "") ||
    !/^[a-f0-9]{40}$/.test(options["--commit"] || "")
  )
    throw new Error(
      "Supply --tag vX.Y.Z and --commit with the full 40-character approved commit SHA; HEAD is not accepted.",
    );
  return options;
}

export function tagRelease(options, cwd = root) {
  const tag = options["--tag"];
  const commit = options["--commit"];
  // Revalidate public callers as well as CLI arguments before passing values to Git.
  releaseTagArguments(["--tag", tag, "--commit", commit]);
  function git(args, allowed = [0]) {
    const result = spawnSync("git", args, {
      cwd,
      encoding: "utf8",
      windowsHide: true,
    });
    if (result.error || !allowed.includes(result.status))
      throw new Error(
        "Git command failed. Check the repository/origin; no existing tag was moved or deleted.",
      );
    return result;
  }
  if (
    git(["rev-parse", "--verify", `${commit}^{commit}`]).stdout.trim() !==
    commit
  )
    throw new Error(
      "The supplied SHA must identify the approved commit itself.",
    );
  const info = JSON.parse(git(["show", `${commit}:package.json`]).stdout);
  if (info.name !== "mangoleaf-ai" || tag !== `v${info.version}`)
    throw new Error("The tag must match the app version in that exact commit.");
  const ref = `refs/tags/${tag}`;
  const exists =
    git(["show-ref", "--verify", "--quiet", ref], [0, 1]).status === 0;
  if (
    exists &&
    (git(["cat-file", "-t", ref]).stdout.trim() !== "tag" ||
      git(["rev-parse", `${ref}^{commit}`]).stdout.trim() !== commit)
  )
    throw new Error(
      "An existing local tag has a different target or is not annotated. It was not replaced.",
    );
  if (options.push) {
    // Check the exact remote ref before creating a new local tag; a network error also stops here.
    if (
      git(["ls-remote", "--exit-code", "--tags", "origin", ref], [0, 2])
        .status === 0
    )
      throw new Error("The remote tag already exists. It was not overwritten.");
  }
  if (!exists)
    git([
      "tag",
      "-a",
      tag,
      commit,
      "-m",
      options["--message"] || `MangoLeaf AI ${tag}`,
    ]);
  // A user's push.followTags setting must not publish additional local tags.
  if (options.push)
    git(["-c", "push.followTags=false", "push", "origin", `${ref}:${ref}`]);
  return { tag, commit, pushed: options.push, reused: exists };
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    assertSupportedNode();
    const result = tagRelease(releaseTagArguments(process.argv.slice(2)));
    console.log(
      `${result.reused ? "Kept existing" : "Created annotated"} ${result.tag} at ${result.commit}.`,
    );
    console.log(
      result.pushed
        ? "Only this tag was pushed to origin. Nothing published or promoted."
        : "Local tag only. Nothing pushed or published. Add --push explicitly when approved.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const fullChecks = (reason) => ({ markdownOnly: false, reason });

export function classifyPush({
  cwd = process.cwd(),
  eventName,
  before,
  after,
}) {
  const sha = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
  if (
    eventName !== "push" ||
    !sha.test(before ?? "") ||
    !sha.test(after ?? "") ||
    /^0+$/.test(before) ||
    /^0+$/.test(after)
  ) {
    return fullChecks("No complete existing-branch push range.");
  }

  function git(args) {
    const result = spawnSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    if (result.error || result.status !== 0)
      throw new Error("Git range unavailable.");
    return result.stdout;
  }

  try {
    if (git(["rev-parse", "HEAD"]).trim() !== after) {
      return fullChecks("Checkout does not match the pushed commit.");
    }
    // Rewritten/unavailable history must not accidentally skip application checks.
    git(["merge-base", "--is-ancestor", before, after]);
    const paths = git([
      "log",
      "--format=",
      "--name-only",
      "-z",
      "--no-renames",
      "--full-history",
      "--diff-merges=first-parent",
      `${before}..${after}`,
    ])
      .split("\0")
      .filter(Boolean);
    // Inspect every pushed commit, including reverted changes and both rename paths.
    if (!paths.length || paths.some((path) => !/\.md$/i.test(path))) {
      return fullChecks("Push is empty or contains non-Markdown changes.");
    }
    return {
      markdownOnly: true,
      reason: "Only .md files changed across the pushed commits.",
    };
  } catch {
    return fullChecks("Push range could not be verified.");
  }
}

if (import.meta.main) {
  let result;
  try {
    const event = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
    );
    result = classifyPush({
      eventName: process.env.GITHUB_EVENT_NAME,
      before: event.before,
      after: event.after,
    });
  } catch {
    result = fullChecks("Push event unavailable; full checks required.");
  }
  // A missing output is treated as full checks by the workflow, never a skip.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `markdown_only=${result.markdownOnly}\n`,
    );
  }
  console.log(
    `${result.markdownOnly ? "Markdown-only" : "Full CI"}: ${result.reason}`,
  );
}

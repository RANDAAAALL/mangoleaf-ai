import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { gitleaksPath } from "./install-gitleaks.mjs";

export function isForbiddenFile(path) {
  const name = basename(path).toLowerCase();
  return (
    (name.startsWith(".env") && name !== ".env.example") ||
    /\.(pem|key|p12|pfx|keystore)$/i.test(name) ||
    /^id_(rsa|dsa|ecdsa|ed25519)$/i.test(name) ||
    /(^|\/)(confidential|secrets)\//i.test(path) ||
    /^docs\/(EMAIL_DISPATCH_WORKFLOW|MANUSCRIPT_MODIFICATIONS)\.md$/i.test(path)
  );
}

export function pushedRevisions(input) {
  return input.trim().split(/\r?\n/).filter(Boolean).flatMap((line) => {
    const fields = line.split(/\s+/);
    const sha = fields[1];
    if (fields.length !== 4 || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(sha)) {
      throw new Error("Cannot read pre-push refs; security check stopped.");
    }
    // Ref deletions upload no commits. Explicit SHAs also cover detached/tag pushes.
    return /^0+$/.test(sha) ? [] : [sha];
  });
}

export function checkSecurity(cwd = process.cwd(), revisions = []) {
  function git(args) {
    const result = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    if (result.error || result.status !== 0) {
      throw new Error(result.error?.message || result.stderr.trim() || "Git security check failed.");
    }
    return result.stdout;
  }

  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
    throw new Error("Security scanning needs full history. Run git fetch --unshallow, then retry.");
  }
  if (!existsSync(gitleaksPath)) {
    throw new Error("Scanner missing. Run bun run security:install, then retry.");
  }

  // Scan every fetched branch and HEAD, including files removed in later commits.
  const history = ["--all", "--full-history", "--diff-merges=first-parent", "HEAD", ...revisions];
  const names = git(["ls-files", "-z"]) +
    git(["log", ...history, "--format=", "--name-only", "-z"]);
  const forbidden = [...new Set(names.split("\0").filter(Boolean).filter(isForbiddenFile))];
  for (const path of forbidden) console.error(`Forbidden tracked/history file: ${JSON.stringify(path)}`);

  const reportDirectory = mkdtempSync(join(tmpdir(), "mangoleaf-security-"));
  const reportPath = join(reportDirectory, "findings.json");
  try {
    const result = spawnSync(gitleaksPath, [
      "git", ".", "--redact=100", "--no-banner", "--no-color",
      `--log-opts=${history.join(" ")}`,
      "--report-format=json", `--report-path=${reportPath}`,
    ], { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(result.stderr.trim() || "Gitleaks could not complete the scan.");
    }
    if (result.status === 1) {
      if (!existsSync(reportPath)) throw new Error(result.stderr.trim() || "Gitleaks failed without a report.");
      const findings = JSON.parse(readFileSync(reportPath, "utf8"));
      if (!findings.length) throw new Error(result.stderr.trim() || "Gitleaks failed without findings.");
      // Print locations only; never copy credential values into terminal or CI logs.
      for (const finding of findings) {
        console.error(`Secret detected: ${JSON.stringify(finding.File)}:${finding.StartLine} (${finding.RuleID}, commit ${finding.Commit.slice(0, 12)})`);
      }
    }
    if (forbidden.length || result.status !== 0) return false;
    console.log("Security checks passed: tracked paths and full fetched Git history.");
    return true;
  } finally {
    if (existsSync(reportPath)) unlinkSync(reportPath);
    rmdirSync(reportDirectory);
  }
}

if (import.meta.main) {
  try {
    const prePush = process.argv.includes("--pre-push");
    const revisions = prePush ? pushedRevisions(readFileSync(0, "utf8")) : [];
    if (prePush && revisions.length === 0) {
      console.log("No commits to upload; security scan skipped for ref deletion.");
    } else {
      process.exitCode = checkSecurity(process.cwd(), revisions) ? 0 : 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

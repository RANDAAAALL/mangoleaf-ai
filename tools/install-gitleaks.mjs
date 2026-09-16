import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const gitleaksVersion = "8.30.1";
const root = fileURLToPath(new URL("../", import.meta.url));
const binaryName = process.platform === "win32" ? "gitleaks.exe" : "gitleaks";
export const gitleaksPath = join(
  root,
  ".tools",
  `gitleaks-${gitleaksVersion}`,
  binaryName,
);

// Published release checksums keep local hooks and CI on the same verified scanner.
const releases = {
  "win32-x64": [
    "windows_x64.zip",
    "d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e",
  ],
  "win32-arm64": [
    "windows_arm64.zip",
    "b95f5e4f5c425cedca7ee203d9afd29597e692c4924a12ed42f970537c72cc0f",
  ],
  "linux-x64": [
    "linux_x64.tar.gz",
    "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
  ],
  "linux-arm64": [
    "linux_arm64.tar.gz",
    "e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080",
  ],
  "darwin-x64": [
    "darwin_x64.tar.gz",
    "dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
  ],
  "darwin-arm64": [
    "darwin_arm64.tar.gz",
    "b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
  ],
};

async function install() {
  if (!existsSync(gitleaksPath)) {
    const release = releases[`${process.platform}-${process.arch}`];
    if (!release)
      throw new Error(
        "Gitleaks setup supports Windows, Linux, and macOS on x64/arm64.",
      );
    const [suffix, expectedHash] = release;
    const archiveName = `gitleaks_${gitleaksVersion}_${suffix}`;
    const response = await fetch(
      `https://github.com/gitleaks/gitleaks/releases/download/v${gitleaksVersion}/${archiveName}`,
      { signal: AbortSignal.timeout(120_000) },
    );
    if (!response.ok)
      throw new Error(`Gitleaks download failed: HTTP ${response.status}`);
    const archive = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(archive).digest("hex") !== expectedHash) {
      throw new Error("Gitleaks checksum mismatch; refusing to install.");
    }
    const installDirectory = dirname(gitleaksPath);
    mkdirSync(installDirectory, { recursive: true });
    const archivePath = join(installDirectory, archiveName);
    writeFileSync(archivePath, archive);
    try {
      const result = spawnSync(
        "tar",
        ["-xf", archivePath, "-C", installDirectory, binaryName],
        { stdio: "inherit" },
      );
      if (result.error || result.status !== 0)
        throw new Error("Cannot extract Gitleaks. Install tar and retry.");
      if (process.platform !== "win32") chmodSync(gitleaksPath, 0o755);
    } finally {
      unlinkSync(archivePath);
    }
  }
  const result = spawnSync(gitleaksPath, ["version"], { encoding: "utf8" });
  if (
    result.error ||
    result.status !== 0 ||
    result.stdout.trim() !== gitleaksVersion
  ) {
    throw new Error(
      "Gitleaks version check failed; reinstall the scanner in .tools/.",
    );
  }
  console.log(
    `Gitleaks ${gitleaksVersion} ready. Push checks run locally without network access.`,
  );
}

if (import.meta.main) {
  await install().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { parseEnv } from "node:util";
import { validateCloudTarget } from "../src/lib/cloud-target.ts";
import { prepareBundle } from "./android-bundle.mjs";

const root = process.cwd();
const useWorkingModel = process.argv.includes("--working-model");
const cloudEnvironment = process.argv.includes("--release")
  ? "production"
  : "testing";
loadEnvConfig(root, false, { info() {}, error() {} });
const cloudSettings =
  cloudEnvironment === "testing"
    ? parseEnv(readFileSync(join(root, ".env.testing.local"), "utf8"))
    : process.env;
const cloudUrl = cloudSettings.NEXT_PUBLIC_SUPABASE_URL;
const cloudKey =
  cloudSettings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  cloudSettings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
validateCloudTarget(cloudEnvironment, cloudUrl);
if (!cloudKey)
  throw new Error(
    "Missing public Supabase key for the selected Android environment.",
  );
function git(args, binary = false) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: binary ? undefined : "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0 || result.error)
    throw new Error("Cannot read committed Android build inputs.");
  return result.stdout;
}
const commit = git(["rev-parse", "HEAD"]).trim();
const source = [];
function collect(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (!/(?:^|[/\\])sw\.js(?:\.map)?$/.test(path))
      source.push(path.replaceAll("\\", "/"));
  }
}
collect("src");
collect("public");
source.push(
  "package.json",
  "bun.lock",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
);
const inputs = new Map();
for (const file of source.sort()) {
  // Preserve local V5 experimentation; the default APK uses the adopted committed model.
  const committedModel =
    !useWorkingModel &&
    (file.startsWith("public/model/") || file === "src/lib/constants.ts");
  inputs.set(
    file,
    committedModel
      ? git(["show", `${commit}:${file}`], true)
      : readFileSync(file),
  );
}
const seed = "android/starter-guidelines.json";
if (!existsSync(seed))
  throw new Error(
    "Run bun run android:guidelines first to prepare the public offline snapshot.",
  );
inputs.set("public/starter-guidelines.json", readFileSync(seed));
const hash = createHash("sha256");
// Backend selection changes the output even when every source/model byte is identical.
hash.update(JSON.stringify({ cloudEnvironment, cloudUrl, cloudKey }));
for (const [file, bytes] of inputs) hash.update(file).update(bytes);
const fingerprint = hash.digest("hex");
const directory = resolve(".android-web", fingerprint);
mkdirSync(directory, { recursive: true });
for (const [file, bytes] of inputs) {
  const destination = join(directory, file);
  mkdirSync(resolve(destination, ".."), { recursive: true });
  writeFileSync(destination, bytes);
}
// Load public settings without copying secret-bearing .env files into the export.
const result = spawnSync(
  process.execPath,
  ["--bun", resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
  {
    cwd: directory,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_TARGET: "android",
      MANGOLEAF_CLOUD_ENVIRONMENT: cloudEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: cloudUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: cloudKey,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: cloudKey,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const staged = join(directory, `staged-${Date.now()}`);
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
prepareBundle(join(directory, "out"), staged, {
  bundleVersion: version,
  version,
  sequence: 1,
  sourceCommit: commit,
  stageOnly: true,
});
const generated = resolve("android/app/build/generated/web-assets");
const target = join(generated, "web");
// Delete only this known generated asset directory, never the source or user's model.
if (
  relative(root, target).startsWith("..") ||
  !target.startsWith(generated + sep)
)
  throw new Error("Unsafe generated path.");
if (existsSync(target)) rmSync(target, { recursive: true });
mkdirSync(generated, { recursive: true });
cpSync(join(staged, "web"), target, { recursive: true });
writeFileSync(
  join(generated, "build-inputs.json"),
  JSON.stringify(
    {
      sourceCommit: commit,
      workingTreeCandidate: true,
      fingerprint,
      modelSource: useWorkingModel ? "working-tree-explicit" : "committed-HEAD",
      bundleVersion: version,
      cloudEnvironment,
      cloudProject: new URL(cloudUrl).hostname.split(".")[0],
    },
    null,
    2,
  ),
);
console.log(
  `Android web assets staged (${useWorkingModel ? "explicit working model" : "committed model"}). This is an unpublished working-tree candidate.`,
);

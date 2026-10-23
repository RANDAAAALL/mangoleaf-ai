import { spawnSync } from "node:child_process";
const [suite = "e2e", ...args] = process.argv.slice(2);
if (!["e2e", "reliability"].includes(suite))
  throw new Error("Use e2e or reliability");
// Reliability defaults to one emulated phone; repeat explicitly on other environments.
if (suite === "reliability" && !args.some((arg) => arg.startsWith("--project")))
  args.push("--project=chromium-mobile");
function run(arguments_, env = process.env, executable = process.execPath) {
  const result = spawnSync(executable, arguments_, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
// Check the actual child runtime before spending time on the isolated build.
run(["tools/check-node-runtime.mjs"], process.env, "node");
run(["tools/build-test-app.mjs"]);
run(
  ["node_modules/@playwright/test/cli.js", "test", ...args],
  {
    ...process.env,
    MANGOLEAF_RELIABILITY: suite === "reliability" ? "1" : "0",
  },
  "node",
);

import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import packageInfo from "./package.json";

const reliability = process.env.MANGOLEAF_RELIABILITY === "1";
const build = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
const commit =
  process.env.GITHUB_SHA ||
  execFileSync(
    "git",
    [
      "-c",
      `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
      "rev-parse",
      "HEAD",
    ],
    { encoding: "utf8" },
  ).trim();
export default defineConfig({
  metadata: {
    appVersion: packageInfo.version,
    commit,
    applicationFingerprint: build.fingerprint,
    inputHashes: build.inputs,
    provenanceNote:
      "Local inputs may be uncommitted; hashes identify the tested application/model files.",
  },
  testDir: "./tools/e2e",
  // .pw.ts keeps browser tests separate from bun test ./tools.
  testMatch: reliability
    ? /(?:repeatability|endurance)\.pw\.ts/
    : /(?:browser-ui|scan-flow|history|model-results|offline|cloud-security|cloud-mutations|guideline-sync)\.pw\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 120_000,
  expect: { timeout: 15_000 },
  outputDir: `test-results/${reliability ? "reliability" : "e2e"}`,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: `playwright-report/${reliability ? "reliability" : "e2e"}`,
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: `test-results/${reliability ? "reliability" : "e2e"}/results.json`,
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "en-US",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /(?:offline|model-results|repeatability|endurance)\.pw\.ts/,
    },
    // Windows WebKit cannot complete this WebGL TFJS path; it still catches iPhone-size UI regressions.
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 13"] },
      testIgnore:
        /(?:history|scan-flow|model-results|offline|cloud-security|cloud-mutations|guideline-sync|repeatability|endurance)\.pw\.ts/,
    },
  ],
  webServer: {
    command: "bun tools/serve-test-app.mjs",
    url: "http://127.0.0.1:4173/__test__/ready",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});

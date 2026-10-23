import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  assertSupportedNode,
  minimumNodeVersion,
} from "./check-node-runtime.mjs";

test.each(["24.6.0", "24.22.0", "24.21.99"])(
  "rejects Node %s before the October security floor",
  (node) => {
    expect(() => assertSupportedNode({ node })).toThrow(minimumNodeVersion);
  },
);

test.each(["24.22.1", "24.22.2", "24.23.0"])(
  "accepts patched stable Node %s",
  (node) => {
    expect(() => assertSupportedNode({ node })).not.toThrow();
  },
);

test.each(["20.19.0", "22.23.4", "26.12.1", "24.22.1-rc.1", "24", ""])(
  "rejects unreviewed major, prerelease, or invalid version %s",
  (node) => {
    // Patched other majors are outside this project's supported Node 24 line.
    expect(() => assertSupportedNode({ node })).toThrow("unsupported");
  },
);

test("does not mistake Bun's compatibility version for the installed Node", () => {
  expect(() => assertSupportedNode({ node: "24.22.1", bun: "1.4.0" })).toThrow(
    "not Bun",
  );
});

test("package policy and runtime floor agree", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  expect(packageJson.engines.node).toBe(`>=${minimumNodeVersion} <25`);
});

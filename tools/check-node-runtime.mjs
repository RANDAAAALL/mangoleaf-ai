import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const minimumNodeVersion = readFileSync(
  new URL("../.node-version", import.meta.url),
  "utf8",
).trim();
const minimum = minimumNodeVersion.split(".").map(Number);

export function assertSupportedNode(versions = process.versions) {
  // Bun reports a Node compatibility version, not the separate node executable.
  if (versions.bun)
    throw new Error("Run the runtime check with Node.js, not Bun.");
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(versions.node || "");
  const actual = match?.slice(1).map(Number);
  if (
    !actual ||
    actual[0] !== minimum[0] ||
    actual[1] < minimum[1] ||
    (actual[1] === minimum[1] && actual[2] < minimum[2])
  ) {
    throw new Error(
      `Node.js ${versions.node || "unknown"} is unsupported. Use Node.js ${minimumNodeVersion} or a newer stable ${minimum[0]}.x patch for the October 2026 security fixes. See SETUP.md.`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    assertSupportedNode();
    console.log(
      `Node.js ${process.versions.node}: runtime security floor passed.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

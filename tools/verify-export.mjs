import { readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";

export function verifyExport(directory = "out") {
  const root = resolve(directory);
  const model = JSON.parse(
    readFileSync(join(root, "model/model.json"), "utf8"),
  );
  JSON.parse(readFileSync(join(root, "model/model_config.json"), "utf8"));
  JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
  if (
    !Array.isArray(model.weightsManifest) ||
    model.weightsManifest.length === 0
  ) {
    throw new Error("Exported model has no weights manifest.");
  }
  const shards = model.weightsManifest.flatMap((group) => {
    if (!Array.isArray(group.paths) || group.paths.length === 0) {
      throw new Error("Exported model has an empty weight group.");
    }
    return group.paths.map((path) => {
      if (typeof path !== "string" || !path)
        throw new Error("Invalid model shard path.");
      const shard = resolve(root, "model", path);
      if (!shard.startsWith(join(root, "model") + sep))
        throw new Error("Model shard path leaves out/model/.");
      return shard;
    });
  });
  // A successful compile alone cannot prove required PWA/model assets were exported.
  const files = [
    "index.html",
    "sw.js",
    "manifest.webmanifest",
    "model/model.json",
    "model/model_config.json",
    "images/icons/png/icon-192x192.png",
    "images/icons/png/icon-512x512.png",
  ].map((path) => join(root, path));
  for (const file of [...files, ...shards]) {
    const stat = statSync(file);
    if (!stat.isFile() || stat.size === 0)
      throw new Error(`Missing or empty exported asset: ${file}`);
  }
  console.log(
    `Verified ${files.length + shards.length} exported PWA/model assets.`,
  );
}

if (import.meta.main) {
  try {
    verifyExport();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

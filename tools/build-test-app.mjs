import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, relative, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const files = [];
function collect(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (!/[/\\]sw\.js(?:\.map)?$/.test(path))
      files.push(relative(root, path).replaceAll("\\", "/"));
  }
}
collect("src");
collect("public");
files.push(
  "package.json",
  "bun.lock",
  "next.config.ts",
  "vercel.json",
  "tsconfig.json",
  "postcss.config.mjs",
  // The generated scanner route is part of this isolated test artifact only.
  "tools/build-test-app.mjs",
);
const inputs = Object.fromEntries(
  files
    .sort()
    .map((file) => [
      file,
      createHash("sha256").update(readFileSync(file)).digest("hex"),
    ]),
);
const fingerprint = createHash("sha256")
  .update(JSON.stringify(inputs))
  .digest("hex");
const directory = resolve(".test-app", fingerprint);
const marker = join(directory, "verified-inputs.json");
mkdirSync(directory, { recursive: true });

// Build a private copy: never overwrite out/ or the tracked production worker.
if (!existsSync(marker) || !existsSync(join(directory, "out/index.html"))) {
  for (const file of files) {
    const destination = join(directory, file);
    mkdirSync(resolve(destination, ".."), { recursive: true });
    cpSync(file, destination);
  }
  const scannerRoute = join(directory, "src/app/%5F%5Fscan-harness/page.tsx");
  mkdirSync(resolve(scannerRoute, ".."), { recursive: true });
  writeFileSync(
    scannerRoute,
    'export { Application as default } from "@/components/layout/application";\n',
  );
  const result = spawnSync(
    process.execPath,
    ["--bun", resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
    {
      cwd: directory,
      stdio: "inherit",
      env: {
        ...process.env,
        HUSKY: "0",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_APP_TARGET: "browser",
        // Test uploads can only reach the local mock server, even with .env.local present.
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:4173/__mock__",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-only-public-placeholder",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-only-public-placeholder",
      },
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
  writeFileSync(marker, JSON.stringify({ fingerprint, inputs }, null, 2));
} else {
  console.log("Reusing test build: all application/model input hashes match.");
}
writeFileSync(
  resolve(".test-app/current.json"),
  JSON.stringify({ directory, fingerprint, inputs }, null, 2),
);
console.log("Isolated test build ready; do not deploy .test-app/.");

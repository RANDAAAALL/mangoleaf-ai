import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  "supabase/sql/initialize-android-test-project.sql",
  "supabase/sql/secure-cloud-sync.sql",
  "supabase/sql/android-backup-vault.sql",
  "supabase/sql/harden-android-test-project.sql",
];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Compose one transaction from the original reviewed scripts, so failure in any
// section rolls back the fresh project initialization instead of leaving half.
function transactionBody(sql) {
  const normalized = sql.replaceAll("\r\n", "\n").trim();
  if (
    (normalized.match(/^begin;$/gm) || []).length !== 1 ||
    !normalized.endsWith("commit;")
  ) {
    throw new Error(
      "Setup source transaction boundaries changed; review first.",
    );
  }
  return normalized.replace(/^begin;\n/m, "").slice(0, -"commit;".length);
}

export function prepareTestSetup(projectRef) {
  if (!/^[a-z]{20}$/.test(projectRef))
    throw new Error(
      "An explicit 20-letter testing project reference is required.",
    );
  const inputs = sources.map((path) => ({
    path,
    bytes: readFileSync(join(root, path)),
  }));
  const sql = [
    `-- TESTING ONLY. Verified destination must be ${projectRef}.`,
    "-- This comment is not a database identity check; verify the MCP project ID.",
    "begin;",
    ...inputs.map(({ bytes }) => transactionBody(bytes.toString("utf8"))),
    "-- Application tables and photo storage remain empty; no data is copied.",
    "notify pgrst, 'reload schema';",
    "commit;",
    "",
  ].join("\n");
  return {
    sql,
    plan: {
      projectRef,
      status: "prepared-not-applied",
      sqlSha256: digest(sql),
      applicationRowsSeeded: 0,
      sources: inputs.map(({ path, bytes }) => ({
        path,
        sha256: digest(bytes),
      })),
    },
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.length !== 4 || process.argv[2] !== "--project-ref")
    throw new Error(
      "Usage: node tools/prepare-supabase-test.mjs --project-ref <testing-ref>",
    );
  const { sql, plan } = prepareTestSetup(process.argv[3]);
  const output = join(root, ".tools", "supabase-testing", plan.projectRef);
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, "setup.sql"), sql);
  writeFileSync(
    join(output, "plan.json"),
    JSON.stringify(plan, null, 2) + "\n",
  );
  console.log(JSON.stringify({ output, ...plan }, null, 2));
}

import { loadEnvConfig } from "@next/env";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Fetch only the already-public advice columns; never export private cloud resources.
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!endpoint || !key)
  throw new Error("Public guideline settings are missing.");
const response = await fetch(
  new URL(
    "/rest/v1/guidelines?select=id,disease_name,guidelines_en,guidelines_bis&order=id",
    endpoint,
  ),
  {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15_000),
  },
);
if (!response.ok)
  throw new Error(`Public guideline request failed (${response.status}).`);
const rows = await response.json();
if (
  !Array.isArray(rows) ||
  rows.length === 0 ||
  rows.length > 1000 ||
  rows.some((row) =>
    ["id", "disease_name", "guidelines_en", "guidelines_bis"].some(
      (field) => typeof row[field] !== "string" || !row[field].trim(),
    ),
  )
) {
  throw new Error("Public guideline snapshot is invalid.");
}
const bytes = JSON.stringify(rows, null, 2) + "\n";
writeFileSync("android/starter-guidelines.json", bytes);
writeFileSync(
  "android/starter-guidelines.provenance.json",
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      source: "Public guidelines REST endpoint; four public columns only",
      count: rows.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Saved ${rows.length} public starter guidelines. No scan or photo requests were made.`,
);

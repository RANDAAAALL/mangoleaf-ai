import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { validateCloudTarget } from "../src/lib/cloud-target.ts";

// Read-only hosted checks: no identities, reports, photo objects or provisioning slots are created.
const settings = parseEnv(readFileSync(".env.testing.local", "utf8"));
const url = settings.NEXT_PUBLIC_SUPABASE_URL;
validateCloudTarget("testing", url);
const key =
  settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  settings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.ok(key, "Testing public key is required.");
async function request(path, init = {}) {
  return fetch(url + path, {
    ...init,
    headers: { apikey: key, ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
}
const guidelines = await request(
  "/rest/v1/guidelines?select=id,disease_name,guidelines_en,guidelines_bis&order=id",
);
assert.equal(guidelines.status, 200);
const rows = await guidelines.json();
assert.equal(rows.length, 6);
const endpoint = "/functions/v1/android-backup-vault";
const preflight = await request(endpoint, {
  method: "OPTIONS",
  headers: {
    Origin: "http://localhost:3000",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "apikey,content-type",
  },
});
assert.equal(preflight.status, 200);
assert.equal(
  preflight.headers.get("access-control-allow-origin"),
  "http://localhost:3000",
);
const invalid = await request(endpoint, {
  method: "POST",
  headers: {
    Origin: "http://localhost:3000",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ action: "invalid" }),
});
assert.equal(invalid.status, 400);
const denied = await request(endpoint, {
  method: "OPTIONS",
  headers: { Origin: "https://untrusted.invalid" },
});
assert.equal(denied.status, 403);
console.log(
  JSON.stringify({
    environment: "testing",
    guidelineRows: rows.length,
    cors: "passed",
    invalidProvisioningRefused: true,
    applicationDataCreated: false,
  }),
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Optional local PostgreSQL engine lives outside the app's dependencies. This
// fixture never connects to a Supabase project or creates real Auth accounts.
const modulePath =
  process.argv[2] ||
  ".tools/sql-validation/node_modules/@electric-sql/pglite/dist/index.js";
const { PGlite } = await import(pathToFileURL(resolve(modulePath)).href);
const database = new PGlite();
const confidenceType = process.argv[3] || "double precision";
assert.ok(["real", "double precision"].includes(confidenceType));
const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";
const record = "33333333-3333-4333-8333-333333333333";
const cloudA = "44444444-4444-4444-8444-444444444444";
const cloudB = "55555555-5555-4555-8555-555555555555";
const legacy = "66666666-6666-4666-8666-666666666666";
const pendingRecord = "77777777-7777-4777-8777-777777777777";
const pendingCloud = "88888888-8888-4888-8888-888888888888";
const invalidCloud = "99999999-9999-4999-8999-999999999999";
let checks = 0;
async function check(name, action) {
  await action();
  checks++;
  console.log(`PASS ${name}`);
}
async function role(name, owner, backup = true) {
  await database.exec("reset role");
  await database.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({
      role: name,
      ...(owner ? { sub: owner } : {}),
      app_metadata: { android_backup_vault: backup },
    }),
  ]);
  await database.exec(`set role ${name}`);
}
const manifest = (
  owner,
  cloud,
  recordId = record,
  metadata = {
    id: recordId,
    disease_name: "Healthy Leaf",
    confidence: 0.974321987,
    updated_at: "2026-10-20T00:00:00.000Z",
    _status: "local-only",
  },
) => [
  owner,
  recordId,
  cloud,
  `${owner}/${cloud}.jpg`,
  "a".repeat(64),
  4,
  "image/jpeg",
  JSON.stringify(metadata),
];
const insertManifest = (values) =>
  database.query(
    "insert into public.android_backup_reports(owner_id,record_id,cloud_id,storage_path,photo_sha256,photo_bytes,photo_mime,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
    values,
  );
function manifestObject(cloud, recordId = pendingRecord) {
  const values = manifest(a, cloud, recordId);
  return {
    owner_id: values[0],
    record_id: values[1],
    cloud_id: values[2],
    storage_path: values[3],
    photo_sha256: values[4],
    photo_bytes: values[5],
    photo_mime: values[6],
    metadata: JSON.parse(values[7]),
  };
}

try {
  await database.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('${a}'),('${b}');
    create table storage.buckets(id text primary key, public boolean not null);
    insert into storage.buckets values ('scans', false);
    create table storage.objects(id uuid, bucket_id text, name text, owner_id text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable
      as $$select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1]$$;
    create table public.scans(id uuid primary key, owner_id uuid, storage_path text, disease_name text not null default 'Fixture', confidence ${confidenceType} not null default 0, device_id uuid not null default '${a}', image_url text, model_version text, updated_at timestamptz not null default now());
    create table public.guidelines(id text primary key, disease_name text, guidelines_en text, guidelines_bis text);
    alter table public.scans enable row level security;
    insert into public.scans(id,owner_id,storage_path) values
      ('${cloudA}','${a}','${a}/${cloudA}.jpg'),
      ('${cloudB}','${b}','${b}/${cloudB}.jpg'),
      ('${legacy}',null,null);
  `);
  // Compile the real reviewed owner/path policies instead of weaker lookalikes.
  await database.exec(
    readFileSync("supabase/sql/secure-cloud-sync.sql", "utf8"),
  );
  const before = await database.query(
    "select * from public.scans where id=$1",
    [legacy],
  );
  const inspectionSql = readFileSync(
    "supabase/sql/inspect-android-backup-production.sql",
    "utf8",
  );
  const preservationSnapshot = (await database.exec(inspectionSql))[0].rows;
  const forwardSql = readFileSync(
    "supabase/sql/android-backup-vault.sql",
    "utf8",
  );
  await check(
    "initialization refuses disabled RLS, public storage and unexpected policies",
    async () => {
      const reviewedPolicies = (
        await database.query(`
      select 'alter policy ' || quote_ident(policyname) || ' on '
        || quote_ident(schemaname) || '.' || quote_ident(tablename)
        || case when qual is not null then ' using (' || qual || ')' else '' end
        || case when with_check is not null then ' with check (' || with_check || ')' else '' end
        as restore_sql
      from pg_policies where (schemaname, tablename, policyname) in (
        ('public', 'scans', 'scans_owner_select'),
        ('storage', 'objects', 'scan_photos_owner_update')
      ) order by schemaname
    `)
      ).rows.map((row) => row.restore_sql);
      const rejectedStates = [
        [
          "alter table public.scans disable row level security",
          /row-level security/,
          "alter table public.scans enable row level security",
        ],
        [
          "update storage.buckets set public=true",
          /must be private/,
          "update storage.buckets set public=false",
        ],
        [
          "create policy unsafe_fixture on public.scans using (true)",
          /Review existing scans\/Storage policies/,
          "drop policy unsafe_fixture on public.scans",
        ],
        [
          "alter policy scans_owner_select on public.scans using (owner_id = (select auth.uid()) or true)",
          /Review existing scans\/Storage policies/,
          reviewedPolicies[0],
        ],
        [
          "alter policy scan_photos_owner_update on storage.objects with check (true)",
          /Review existing scans\/Storage policies/,
          reviewedPolicies[1],
        ],
        [
          "create schema backup_private",
          /additive upgrade review/,
          "drop schema backup_private",
        ],
      ];
      for (const [setup, error, cleanup] of rejectedStates) {
        await database.exec(setup);
        await assert.rejects(database.exec(forwardSql), error);
        await database.exec("rollback");
        await database.exec(cleanup);
        assert.equal(
          (
            await database.query(
              "select to_regclass('public.android_backup_reports') is null as absent",
            )
          ).rows[0].absent,
          true,
        );
      }
      assert.deepEqual(
        (await database.exec(inspectionSql))[0].rows,
        preservationSnapshot,
      );
    },
  );
  await database.exec(forwardSql);
  await check("forward SQL applies without rewriting legacy data", async () => {
    assert.deepEqual(
      (await database.query("select * from public.scans where id=$1", [legacy]))
        .rows,
      before.rows,
    );
    assert.deepEqual(
      (await database.exec(inspectionSql))[0].rows,
      preservationSnapshot,
    );
  });
  await check(
    "initialization refuses a repeat without replacing existing backups",
    async () => {
      await assert.rejects(
        database.exec(
          readFileSync("supabase/sql/android-backup-vault.sql", "utf8"),
        ),
        /Backup table already exists/,
      );
      // The rejected initialization opened a transaction; reset it before later fixtures.
      await database.exec("rollback");
      assert.equal(
        (
          await database.query(
            "select count(*)::integer as total from backup_private.provision_budget",
          )
        ).rows[0].total,
        1,
      );
    },
  );
  await check("anonymous clients cannot read backup manifests", async () => {
    await role("anon");
    await assert.rejects(
      database.query("select * from public.android_backup_reports"),
      /permission denied/,
    );
  });
  await check(
    "authenticated backup owner can insert and read own manifest",
    async () => {
      await role("authenticated", a);
      await insertManifest(manifest(a, cloudA));
      assert.equal(
        (await database.query("select * from public.android_backup_reports"))
          .rows.length,
        1,
      );
    },
  );
  await check(
    "another owner cannot read, insert, delete or recover owner's rows",
    async () => {
      await role("authenticated", b);
      assert.equal(
        (await database.query("select * from public.android_backup_reports"))
          .rows.length,
        0,
      );
      await assert.rejects(
        insertManifest(manifest(a, cloudA)),
        /row-level security/,
      );
      assert.equal(
        (
          await database.query(
            "delete from public.android_backup_reports returning *",
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await database.query(
            "select public.delete_android_backup_report($1) as removed",
            [record],
          )
        ).rows[0].removed,
        false,
      );
    },
  );
  await check(
    "a valid owner cannot link a different owner's parent scan",
    async () => {
      await role("authenticated", a);
      await assert.rejects(
        insertManifest(manifest(a, cloudB, b)),
        /row-level security/,
      );
    },
  );
  await check(
    "historical authenticated session lacks backup-vault privileges",
    async () => {
      await role("authenticated", a, false);
      assert.equal(
        (await database.query("select * from public.android_backup_reports"))
          .rows.length,
        0,
      );
      await assert.rejects(
        database.query("select public.delete_android_backup_report($1)", [
          record,
        ]),
        /Backup owner required/,
      );
    },
  );
  await check(
    "missing metadata IDs and mutable updates are rejected",
    async () => {
      await role("authenticated", a);
      await assert.rejects(
        insertManifest(manifest(a, cloudA, b, { id: null })),
        /check constraint/,
      );
      await assert.rejects(
        database.query(
          "update public.android_backup_reports set photo_bytes=1",
        ),
        /permission denied/,
      );
    },
  );
  await check(
    "provisioning RPC cannot be called with an ordinary session",
    async () => {
      await assert.rejects(
        database.query("select public.claim_android_backup_provision_slot()"),
        /permission denied/,
      );
    },
  );
  await check(
    "begin RPC records an immutable pending intent before photo upload",
    async () => {
      await role("authenticated", a);
      const payload = manifestObject(pendingCloud);
      const first = (
        await database.query(
          "select public.begin_android_backup_report($1::jsonb) as report",
          [JSON.stringify(payload)],
        )
      ).rows[0].report;
      const retried = (
        await database.query(
          "select public.begin_android_backup_report($1::jsonb) as report",
          [JSON.stringify(payload)],
        )
      ).rows[0].report;
      assert.equal(first.completed, false);
      assert.deepEqual(retried, first);
      assert.equal(first.metadata.confidence, payload.metadata.confidence);
      assert.equal(
        (
          await database.query("select * from public.scans where id=$1", [
            pendingCloud,
          ])
        ).rows.length,
        1,
      );
      await assert.rejects(
        database.query("select public.begin_android_backup_report($1::jsonb)", [
          JSON.stringify({
            ...payload,
            metadata: { ...payload.metadata, confidence: 0.1 },
          }),
        ]),
        /conflicts/,
      );
      await assert.rejects(
        database.query("select public.begin_android_backup_report($1::jsonb)", [
          JSON.stringify({
            ...payload,
            metadata: {
              ...payload.metadata,
              confidence: payload.metadata.confidence + 1e-10,
            },
          }),
        ]),
        /manifest conflicts/,
      );
    },
  );
  await check(
    "invalid manifests roll back the newly inserted parent atomically",
    async () => {
      const payload = {
        ...manifestObject(invalidCloud, invalidCloud),
        photo_sha256: "invalid",
      };
      await assert.rejects(
        database.query("select public.begin_android_backup_report($1::jsonb)", [
          JSON.stringify(payload),
        ]),
        /check constraint/,
      );
      assert.equal(
        (
          await database.query("select * from public.scans where id=$1", [
            invalidCloud,
          ])
        ).rows.length,
        0,
      );
      const foreign = {
        ...manifestObject(invalidCloud, invalidCloud),
        owner_id: b,
      };
      await assert.rejects(
        database.query("select public.begin_android_backup_report($1::jsonb)", [
          JSON.stringify(foreign),
        ]),
        /Backup owner/,
      );
    },
  );
  await check(
    "only the owning vault can complete an intent whose private photo exists",
    async () => {
      assert.equal(
        (
          await database.query(
            "select public.complete_android_backup_report($1) as ready",
            [pendingRecord],
          )
        ).rows[0].ready,
        false,
      );
      await database.exec(
        `reset role; insert into storage.objects(id,bucket_id,name,owner_id) values ('${pendingRecord}','scans','${a}/${pendingCloud}.jpg','${a}')`,
      );
      await role("authenticated", b);
      assert.equal(
        (
          await database.query(
            "select public.complete_android_backup_report($1) as ready",
            [pendingRecord],
          )
        ).rows[0].ready,
        false,
      );
      await role("authenticated", a);
      assert.equal(
        (
          await database.query(
            "select public.complete_android_backup_report($1) as ready",
            [pendingRecord],
          )
        ).rows[0].ready,
        true,
      );
      assert.equal(
        (
          await database.query(
            "select completed from public.android_backup_reports where record_id=$1",
            [pendingRecord],
          )
        ).rows[0].completed,
        true,
      );
      assert.equal(
        (
          await database.query(
            "select public.begin_android_backup_report($1::jsonb) as report",
            [JSON.stringify(manifestObject(pendingCloud))],
          )
        ).rows[0].report.completed,
        true,
      );
      await assert.rejects(
        database.query(
          "update public.android_backup_reports set completed=false",
        ),
        /permission denied/,
      );
    },
  );
  await check(
    "interrupted pending upload remains deletable and late completion fails closed",
    async () => {
      const payload = manifestObject(invalidCloud, invalidCloud);
      await database.query(
        "select public.begin_android_backup_report($1::jsonb)",
        [JSON.stringify(payload)],
      );
      assert.equal(
        (
          await database.query(
            "select public.delete_android_backup_report($1) as removed",
            [invalidCloud],
          )
        ).rows[0].removed,
        true,
      );
      assert.equal(
        (
          await database.query("select * from public.scans where id=$1", [
            invalidCloud,
          ])
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await database.query(
            "select public.complete_android_backup_report($1) as ready",
            [invalidCloud],
          )
        ).rows[0].ready,
        false,
      );
    },
  );
  await check(
    "service quota accepts ten slots and rejects the eleventh",
    async () => {
      await role("service_role");
      for (let index = 0; index < 10; index++)
        assert.equal(
          (
            await database.query(
              "select public.claim_android_backup_provision_slot() as allowed",
            )
          ).rows[0].allowed,
          true,
        );
      assert.equal(
        (
          await database.query(
            "select public.claim_android_backup_provision_slot() as allowed",
          )
        ).rows[0].allowed,
        false,
      );
    },
  );
  await check(
    "daily and lifetime provisioning limits fail closed",
    async () => {
      await database.exec(
        "reset role; update backup_private.provision_budget set hour_count=0,day_count=100",
      );
      await role("service_role");
      assert.equal(
        (
          await database.query(
            "select public.claim_android_backup_provision_slot() as allowed",
          )
        ).rows[0].allowed,
        false,
      );
      await database.exec(
        "reset role; update backup_private.provision_budget set day_count=0,total_count=1000",
      );
      await role("service_role");
      assert.equal(
        (
          await database.query(
            "select public.claim_android_backup_provision_slot() as allowed",
          )
        ).rows[0].allowed,
        false,
      );
    },
  );
  await check(
    "owner deletion removes only the paired new scan and is idempotent",
    async () => {
      await role("authenticated", a);
      assert.equal(
        (
          await database.query(
            "select public.delete_android_backup_report($1) as removed",
            [record],
          )
        ).rows[0].removed,
        true,
      );
      assert.equal(
        (
          await database.query(
            "select public.delete_android_backup_report($1) as removed",
            [record],
          )
        ).rows[0].removed,
        false,
      );
      await database.exec("reset role");
      assert.deepEqual(
        (
          await database.query("select * from public.scans where id=$1", [
            legacy,
          ])
        ).rows,
        before.rows,
      );
      assert.equal(
        (
          await database.query("select * from public.scans where id=$1", [
            cloudB,
          ])
        ).rows.length,
        1,
      );
    },
  );
  await check(
    "read-only installation checks report all conditions passing",
    async () => {
      const results = await database.exec(
        readFileSync("supabase/sql/verify-android-backup.sql", "utf8"),
      );
      const checks = results
        .flatMap((result) => result.rows)
        .filter((row) => "passed" in row);
      assert.equal(checks.length, 9);
      for (const row of checks) assert.equal(row.passed, true, row.check_name);
    },
  );
  console.log(
    `Completed ${checks} isolated PostgreSQL/RLS fixture checks. No external service contacted.`,
  );
} finally {
  await database.close();
}

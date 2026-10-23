import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareTestSetup } from "./prepare-supabase-test.mjs";

// Run the complete fresh-project setup against real, isolated PostgreSQL rules.
// This does not connect to Supabase or create real users, scans, or photo files.
const { PGlite } = await import(
  pathToFileURL(
    resolve(
      ".tools/sql-validation/node_modules/@electric-sql/pglite/dist/index.js",
    ),
  ).href
);
const database = new PGlite();
const { sql } = prepareTestSetup("abcdefghijklmnopqrst");
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const record = "33333333-3333-4333-8333-333333333333";
const cloud = "44444444-4444-4444-8444-444444444444";
let checks = 0;
async function check(name, action) {
  await action();
  checks++;
  console.log(`PASS ${name}`);
}
async function asRole(name, id, action) {
  await database.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({
      role: name,
      ...(id ? { sub: id } : {}),
      app_metadata: { android_backup_vault: true },
    }),
  ]);
  await database.exec(`set role ${name}`);
  try {
    return await action();
  } finally {
    await database.exec("reset role");
  }
}

try {
  await database.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    create table auth.users(id uuid primary key);
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid,bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create publication supabase_realtime;
    create function public.rls_auto_enable() returns event_trigger language plpgsql security definer set search_path='pg_catalog' as $$
    declare command record;
    begin
      for command in select * from pg_event_trigger_ddl_commands() where command_tag='CREATE TABLE' and schema_name='public' loop
        execute format('alter table %s enable row level security',command.object_identity);
      end loop;
    end;
    $$;
    create event trigger ensure_rls on ddl_command_end when tag in ('CREATE TABLE') execute function public.rls_auto_enable();
  `);
  await check("complete setup applies with opt-in client grants", async () => {
    await database.exec(sql);
    assert.equal(
      (await database.query("select count(*)::int as n from public.scans"))
        .rows[0].n,
      0,
    );
    assert.equal(
      (await database.query("select count(*)::int as n from auth.users"))
        .rows[0].n,
      0,
    );
  });
  await check(
    "bucket is private and limited to bounded JPEG/WebP uploads",
    async () => {
      const bucket = (await database.query("select * from storage.buckets"))
        .rows[0];
      assert.equal(bucket.public, false);
      assert.equal(Number(bucket.file_size_limit), 8388608);
      assert.deepEqual(bucket.allowed_mime_types, ["image/jpeg", "image/webp"]);
    },
  );
  await check(
    "all application tables and photo storage start empty",
    async () => {
      for (const table of [
        "public.scans",
        "public.guidelines",
        "public.android_backup_reports",
        "storage.objects",
      ])
        assert.equal(
          (await database.query(`select count(*)::int as n from ${table}`))
            .rows[0].n,
          0,
          table,
        );
    },
  );
  await check(
    "anonymous clients can read advice but cannot write it or read scans",
    async () => {
      await asRole("anon", null, async () => {
        assert.equal(
          (await database.query("select * from public.guidelines")).rows.length,
          0,
        );
        await assert.rejects(
          database.query("delete from public.guidelines"),
          /permission denied/,
        );
        await assert.rejects(
          database.query("select * from public.scans"),
          /permission denied/,
        );
      });
    },
  );
  await check("only public guidelines are published to Realtime", async () => {
    assert.deepEqual(
      (
        await database.query(
          "select tablename from pg_publication_tables where pubname='supabase_realtime'",
        )
      ).rows,
      [{ tablename: "guidelines" }],
    );
  });
  await check(
    "automatic RLS remains active while client helper execution is denied",
    async () => {
      assert.equal(
        (
          await database.query(
            "select has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') as allowed",
          )
        ).rows[0].allowed,
        false,
      );
      assert.equal(
        (
          await database.query(
            "select has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE') as allowed",
          )
        ).rows[0].allowed,
        false,
      );
      await database.exec("create table public.auto_rls_probe(value integer)");
      assert.equal(
        (
          await database.query(
            "select relrowsecurity from pg_class where oid='public.auto_rls_probe'::regclass",
          )
        ).rows[0].relrowsecurity,
        true,
      );
      await database.exec("drop table public.auto_rls_probe");
    },
  );
  await check("both existing catalog verification scripts pass", async () => {
    await database.exec(
      readFileSync("supabase/sql/verify-cloud-security.sql", "utf8"),
    );
    const results = await database.exec(
      readFileSync("supabase/sql/verify-android-backup.sql", "utf8"),
    );
    const rows = results
      .flatMap((result) => result.rows)
      .filter((row) => "passed" in row);
    assert.equal(rows.length, 9);
    for (const row of rows) assert.equal(row.passed, true, row.check_name);
  });
  await database.query("insert into auth.users values($1),($2)", [
    owner,
    other,
  ]);
  await check(
    "owner can create backup intent and upload only to the owned path",
    async () => {
      await asRole("authenticated", owner, async () => {
        const manifest = {
          owner_id: owner,
          record_id: record,
          cloud_id: cloud,
          storage_path: `${owner}/${cloud}.jpg`,
          photo_sha256: "a".repeat(64),
          photo_bytes: 4,
          photo_mime: "image/jpeg",
          metadata: {
            id: record,
            disease_name: "fixture",
            confidence: 0.91,
            updated_at: "2026-10-20T00:00:00.000Z",
          },
        };
        await database.query(
          "select public.begin_android_backup_report($1::jsonb)",
          [JSON.stringify(manifest)],
        );
        assert.equal(
          (
            await database.query(
              "select public.complete_android_backup_report($1) as ready",
              [record],
            )
          ).rows[0].ready,
          false,
        );
        await assert.rejects(
          database.query(
            "insert into storage.objects(bucket_id,name,owner_id) values('scans',$1,$2)",
            [`${other}/${cloud}.jpg`, owner],
          ),
          /row-level security/,
        );
        await database.query(
          "insert into storage.objects(bucket_id,name,owner_id) values('scans',$1,$2)",
          [`${owner}/${cloud}.jpg`, owner],
        );
        assert.equal(
          (
            await database.query(
              "select public.complete_android_backup_report($1) as ready",
              [record],
            )
          ).rows[0].ready,
          true,
        );
      });
    },
  );
  await check(
    "another owner cannot read reports, manifests, or private photo metadata",
    async () => {
      await asRole("authenticated", other, async () => {
        for (const table of [
          "public.scans",
          "public.android_backup_reports",
          "storage.objects",
        ])
          assert.equal(
            (await database.query(`select * from ${table}`)).rows.length,
            0,
            table,
          );
      });
    },
  );
  await check(
    "reinitialization refuses existing data without changing it",
    async () => {
      await assert.rejects(database.exec(sql), /absent application tables/);
      await database.exec("rollback");
      assert.equal(
        (await database.query("select count(*)::int as n from public.scans"))
          .rows[0].n,
        1,
      );
      assert.equal(
        (await database.query("select count(*)::int as n from storage.objects"))
          .rows[0].n,
        1,
      );
      assert.equal(
        (
          await database.query(
            "select count(*)::int as n from public.guidelines",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  console.log(
    `Completed ${checks} isolated fresh-project PostgreSQL checks. No external service contacted.`,
  );
} finally {
  await database.close();
}

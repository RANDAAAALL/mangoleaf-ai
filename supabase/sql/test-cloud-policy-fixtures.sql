-- Transaction-only proof of the installed policies and effective client grants.
-- Run AFTER secure-cloud-sync.sql using a privileged connection.
-- Copies catalog policy expressions onto temporary tables; no Auth users, scans,
-- guideline content, or Storage metadata/files are created on the live service.
-- The final ROLLBACK destroys every fixture. This is SQL policy proof, not an
-- end-to-end test of real Auth tokens or Storage HTTP/CDN behavior.

begin;
set local statement_timeout = '30s';

create temporary table cloud_scan_fixture
  (like public.scans including defaults including constraints including indexes);
create temporary table cloud_guideline_fixture
  (like public.guidelines including defaults including constraints including indexes);
create temporary table cloud_object_fixture (
  id uuid primary key,
  bucket_id text not null,
  name text not null,
  owner_id text,
  metadata jsonb
);
create temporary table cloud_policy_results (case_name text primary key, passed boolean not null);

alter table pg_temp.cloud_scan_fixture enable row level security;
alter table pg_temp.cloud_guideline_fixture enable row level security;
alter table pg_temp.cloud_object_fixture enable row level security;

do $copy_live_rules$
declare
  source_table text;
  fixture_table text;
  client_role text;
  privilege text;
  policy_row record;
  policy_roles text;
begin
  -- Names, roles, command, mode, USING and WITH CHECK come from live catalogs.
  foreach source_table in array array['public.scans', 'public.guidelines', 'storage.objects'] loop
    fixture_table := case source_table
      when 'public.scans' then 'cloud_scan_fixture'
      when 'public.guidelines' then 'cloud_guideline_fixture'
      else 'cloud_object_fixture' end;
    foreach client_role in array array['anon', 'authenticated'] loop
      foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
        if has_table_privilege(client_role, source_table, privilege) then
          execute format('grant %s on pg_temp.%I to %I', privilege, fixture_table, client_role);
        end if;
      end loop;
    end loop;
    for policy_row in select * from pg_policies
      where schemaname || '.' || tablename = source_table loop
      select string_agg(quote_ident(role_name), ', ') into policy_roles
        from unnest(policy_row.roles) as role_name;
      execute format('create policy %I on pg_temp.%I as %s for %s to %s%s%s',
        policy_row.policyname, fixture_table, policy_row.permissive, policy_row.cmd, policy_roles,
        case when policy_row.qual is null then '' else ' using (' || policy_row.qual || ')' end,
        case when policy_row.with_check is null then '' else ' with check (' || policy_row.with_check || ')' end);
    end loop;
  end loop;
  execute format('grant usage on schema %I to anon, authenticated',
    (select nspname from pg_namespace where oid = pg_my_temp_schema()));
end;
$copy_live_rules$;
grant insert, select on pg_temp.cloud_policy_results to anon, authenticated;

-- Every visitor deliberately has the same device_id. Ownership must ignore it.
insert into pg_temp.cloud_scan_fixture
  (id, disease_name, confidence, device_id, owner_id, storage_path, model_version)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'fixture-leaf', 0.9,
   'dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4111-8111-111111111111',
   'aaaaaaaa-1111-4111-8111-111111111111/aaaaaaaa-0000-4000-8000-000000000001.jpg', 'security-fixture'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'fixture-fruit', 0.9,
   'dddddddd-0000-4000-8000-000000000001', 'bbbbbbbb-2222-4222-8222-222222222222',
   'bbbbbbbb-2222-4222-8222-222222222222/bbbbbbbb-0000-4000-8000-000000000001.webp', 'security-fixture'),
  ('cccccccc-0000-4000-8000-000000000001', 'fixture-legacy', 0.9,
   'dddddddd-0000-4000-8000-000000000001', null, null, null);
insert into pg_temp.cloud_guideline_fixture
  (id, disease_name, guidelines_en, guidelines_bis)
values ('fixture', 'fixture', 'Public fixture text', 'Public fixture text');
insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id, metadata)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'scans',
   'aaaaaaaa-1111-4111-8111-111111111111/aaaaaaaa-0000-4000-8000-000000000001.jpg',
   'aaaaaaaa-1111-4111-8111-111111111111', '{}'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'scans',
   'bbbbbbbb-2222-4222-8222-222222222222/bbbbbbbb-0000-4000-8000-000000000001.webp',
   'bbbbbbbb-2222-4222-8222-222222222222', '{}'),
  ('cccccccc-0000-4000-8000-000000000001', 'scans',
   'cccccccc-0000-4000-8000-000000000001.jpg', null, '{}'),
  -- Even an owned object is denied when its path is legacy or another folder.
  ('cccccccc-0000-4000-8000-000000000002', 'scans',
   'cccccccc-0000-4000-8000-000000000002.jpg',
   'aaaaaaaa-1111-4111-8111-111111111111', '{}'),
  ('cccccccc-0000-4000-8000-000000000003', 'scans',
   'bbbbbbbb-2222-4222-8222-222222222222/cccccccc-0000-4000-8000-000000000003.jpg',
   'aaaaaaaa-1111-4111-8111-111111111111', '{}'),
  ('cccccccc-0000-4000-8000-000000000004', 'scans',
   'aaaaaaaa-1111-4111-8111-111111111111/nested/cccccccc-0000-4000-8000-000000000004.jpg',
   'aaaaaaaa-1111-4111-8111-111111111111', '{}'),
  ('cccccccc-0000-4000-8000-000000000005', 'another-bucket',
   'aaaaaaaa-1111-4111-8111-111111111111/cccccccc-0000-4000-8000-000000000005.jpg',
   'aaaaaaaa-1111-4111-8111-111111111111', '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":true}', true);

do $visitor_a$
declare
  affected integer;
begin
  if (select count(*) from pg_temp.cloud_scan_fixture) <> 1
     or exists (select 1 from pg_temp.cloud_scan_fixture where owner_id <> auth.uid() or owner_id is null) then
    raise exception 'Visitor A can read another visitor or legacy scan.';
  end if;
  insert into pg_temp.cloud_policy_results values ('A reads only own scans despite forged device_id', true);
  delete from pg_temp.cloud_scan_fixture where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Visitor A deleted B scan.'; end if;
  insert into pg_temp.cloud_policy_results values ('A cannot delete B scans', true);
  delete from pg_temp.cloud_scan_fixture where id = 'cccccccc-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Visitor A deleted legacy scan.'; end if;
  insert into pg_temp.cloud_policy_results values ('A cannot delete legacy scans', true);

  insert into pg_temp.cloud_scan_fixture
    (id, disease_name, confidence, device_id, owner_id, storage_path)
  values ('aaaaaaaa-0000-4000-8000-000000000002', 'fixture', 0.9,
    'dddddddd-0000-4000-8000-000000000001', auth.uid(),
    auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000002.webp');
  insert into pg_temp.cloud_policy_results values ('A can insert own scan', true);
  begin
    insert into pg_temp.cloud_scan_fixture
      (id, disease_name, confidence, device_id, owner_id, storage_path)
    values ('aaaaaaaa-0000-4000-8000-000000000003', 'fixture', 0.9,
      'dddddddd-0000-4000-8000-000000000001', 'bbbbbbbb-2222-4222-8222-222222222222',
      'bbbbbbbb-2222-4222-8222-222222222222/aaaaaaaa-0000-4000-8000-000000000003.jpg');
    raise exception 'Visitor A inserted B-owned scan.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('A cannot forge B scan ownership', true);
  begin
    insert into pg_temp.cloud_scan_fixture (id, disease_name, confidence, device_id)
    values ('aaaaaaaa-0000-4000-8000-000000000004', 'fixture', 0.9,
      'dddddddd-0000-4000-8000-000000000001');
    raise exception 'Visitor A inserted scan without ownership.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('A cannot insert ownerless scan', true);
  begin
    insert into pg_temp.cloud_scan_fixture
      (id, disease_name, confidence, device_id, owner_id, storage_path, image_url)
    values ('aaaaaaaa-0000-4000-8000-000000000005', 'fixture', 0.9,
      'dddddddd-0000-4000-8000-000000000001', auth.uid(),
      auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000005.jpg', 'https://example.invalid/photo.jpg');
    raise exception 'Visitor A inserted public image URL.';
  exception when insufficient_privilege or check_violation then null;
  end;
  insert into pg_temp.cloud_policy_results values ('New scan cannot store public image URL', true);
  begin
    insert into pg_temp.cloud_scan_fixture
      (id, disease_name, confidence, device_id, owner_id, storage_path)
    values ('aaaaaaaa-0000-4000-8000-000000000006', 'fixture', 0.9,
      'dddddddd-0000-4000-8000-000000000001', auth.uid(),
      'bbbbbbbb-2222-4222-8222-222222222222/aaaaaaaa-0000-4000-8000-000000000006.jpg');
    raise exception 'Visitor A inserted mismatched folder path.';
  exception when insufficient_privilege or check_violation then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Scan folder must match owner and scan UUID', true);
  begin
    update pg_temp.cloud_scan_fixture set owner_id = 'bbbbbbbb-2222-4222-8222-222222222222'
    where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'Visitor A has scan UPDATE grant.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Browser cannot update immutable scan', true);
  delete from pg_temp.cloud_scan_fixture where id = 'aaaaaaaa-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Visitor A cannot delete own scan.'; end if;
  insert into pg_temp.cloud_policy_results values ('A can delete own scan', true);

  if (select count(*) from pg_temp.cloud_object_fixture) <> 1 then
    raise exception 'Visitor A can read B or legacy photo metadata.';
  end if;
  insert into pg_temp.cloud_policy_results values ('A reads only own private photo metadata', true);
  insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
  values ('aaaaaaaa-0000-4000-8000-000000000002', 'scans',
    auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000002.webp', auth.uid()::text);
  insert into pg_temp.cloud_policy_results values ('A can insert own photo metadata fixture', true);
  update pg_temp.cloud_object_fixture set metadata = '{"overwrite":true}'
    where id = 'aaaaaaaa-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Visitor A cannot overwrite own photo.'; end if;
  insert into pg_temp.cloud_policy_results values ('A can overwrite own photo metadata', true);
  update pg_temp.cloud_object_fixture set metadata = '{"overwrite":true}'
    where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Visitor A overwrote B photo.'; end if;
  insert into pg_temp.cloud_policy_results values ('A cannot overwrite B photo', true);
  begin
    update pg_temp.cloud_object_fixture set owner_id = 'bbbbbbbb-2222-4222-8222-222222222222'
    where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'Visitor A reassigned photo owner.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Storage WITH CHECK blocks owner reassignment', true);
  begin
    update pg_temp.cloud_object_fixture
    set name = 'bbbbbbbb-2222-4222-8222-222222222222/aaaaaaaa-0000-4000-8000-000000000001.jpg'
    where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'Visitor A moved photo to B folder.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Storage WITH CHECK blocks other folder', true);
  begin
    insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
    values ('aaaaaaaa-0000-4000-8000-000000000003', 'scans',
      'bbbbbbbb-2222-4222-8222-222222222222/aaaaaaaa-0000-4000-8000-000000000003.jpg', auth.uid()::text);
    raise exception 'Visitor A uploaded to B folder.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('A cannot upload into B folder', true);
  begin
    insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
    values ('aaaaaaaa-0000-4000-8000-000000000004', 'scans',
      auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000004.jpg', 'bbbbbbbb-2222-4222-8222-222222222222');
    raise exception 'Visitor A forged uploader owner.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('A cannot forge photo uploader owner', true);
  begin
    insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
    values ('aaaaaaaa-0000-4000-8000-000000000005', 'scans',
      auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000005.jpg', null);
    raise exception 'Visitor A uploaded ownerless photo.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('A cannot upload ownerless photo', true);
  begin
    insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
    values ('aaaaaaaa-0000-4000-8000-000000000006', 'scans',
      auth.uid()::text || '/nested/aaaaaaaa-0000-4000-8000-000000000006.jpg', auth.uid()::text);
    raise exception 'Visitor A uploaded unexpected nested path.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Storage rejects unexpected nested paths', true);
  begin
    insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
    values ('aaaaaaaa-0000-4000-8000-000000000007', 'another-bucket',
      auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000007.jpg', auth.uid()::text);
    raise exception 'Visitor A uploaded to another bucket.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Storage rejects another bucket', true);
  begin
    insert into pg_temp.cloud_object_fixture (id, bucket_id, name, owner_id)
    values ('aaaaaaaa-0000-4000-8000-000000000008', 'scans',
      auth.uid()::text || '/aaaaaaaa-0000-4000-8000-000000000008.png', auth.uid()::text);
    raise exception 'Visitor A uploaded unsupported filename extension.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Storage rejects unsupported filename extension', true);
  delete from pg_temp.cloud_object_fixture where id in (
    'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001');
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Visitor A deleted B/legacy photo.'; end if;
  insert into pg_temp.cloud_policy_results values ('A cannot delete B or legacy photos', true);
  delete from pg_temp.cloud_object_fixture where id = 'aaaaaaaa-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Visitor A cannot delete own photo.'; end if;
  insert into pg_temp.cloud_policy_results values ('A can delete own photo', true);
  if (select count(*) from pg_temp.cloud_guideline_fixture) <> 1 then
    raise exception 'Authenticated guest cannot read public guidance.';
  end if;
  begin
    update pg_temp.cloud_guideline_fixture set guidelines_en = 'Changed';
    raise exception 'Authenticated guest can edit public guidance.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Guest reads guidance but cannot edit it', true);
end;
$visitor_a$;

select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-2222-4222-8222-222222222222","role":"authenticated","is_anonymous":true}', true);
do $visitor_b$
begin
  if (select count(*) from pg_temp.cloud_scan_fixture) <> 1
     or exists (select 1 from pg_temp.cloud_scan_fixture where owner_id <> auth.uid() or owner_id is null)
     or (select count(*) from pg_temp.cloud_object_fixture) <> 1 then
    raise exception 'Visitor B can read A or legacy fixtures.';
  end if;
  insert into pg_temp.cloud_policy_results values ('B reads only B scans and photos', true);
end;
$visitor_b$;

select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
do $missing_uid$
begin
  if (select count(*) from pg_temp.cloud_scan_fixture) <> 0
     or (select count(*) from pg_temp.cloud_object_fixture) <> 0 then
    raise exception 'Authenticated role without verified UID can read private data.';
  end if;
  begin
    insert into pg_temp.cloud_scan_fixture
      (id, disease_name, confidence, device_id, owner_id, storage_path)
    values ('aaaaaaaa-0000-4000-8000-000000000009', 'fixture', 0.9,
      'dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4111-8111-111111111111',
      'aaaaaaaa-1111-4111-8111-111111111111/aaaaaaaa-0000-4000-8000-000000000009.jpg');
    raise exception 'Authenticated role without verified UID can insert private data.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Authenticated role alone cannot read or insert private data', true);
end;
$missing_uid$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $no_session$
begin
  begin
    perform count(*) from pg_temp.cloud_scan_fixture;
    raise exception 'Unsigned anon can read scans.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Unsigned anon cannot read scans', true);
  if (select count(*) from pg_temp.cloud_object_fixture) <> 0 then
    raise exception 'Unsigned anon can read photo metadata.';
  end if;
  insert into pg_temp.cloud_policy_results values ('Unsigned anon cannot read photos', true);
  if (select count(*) from pg_temp.cloud_guideline_fixture) <> 1 then
    raise exception 'Unsigned anon cannot read public guidance.';
  end if;
  begin
    delete from pg_temp.cloud_guideline_fixture;
    raise exception 'Unsigned anon can delete public guidance.';
  exception when insufficient_privilege then null;
  end;
  insert into pg_temp.cloud_policy_results values ('Unsigned anon reads guidance but cannot delete it', true);
end;
$no_session$;

reset role;
select jsonb_build_object('passed_cases', count(*), 'all_passed', bool_and(passed),
  'cases', jsonb_agg(case_name order by case_name)) as policy_fixture_verification
from pg_temp.cloud_policy_results;

rollback;

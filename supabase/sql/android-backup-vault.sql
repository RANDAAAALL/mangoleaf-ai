-- Reviewed forward change only. Do not run automatically or alter historical scan rows/policies.
-- Requires the existing private scans bucket and reviewed owner-path Storage policies.
-- Provisioning stays disabled until this SQL and the Edge Function are reviewed and deployed.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Parse the reviewed expressions on this PostgreSQL version, then compare their
-- complete catalog forms. Checking only policy names or an ownership substring
-- would miss an added OR condition or a weakened UPDATE WITH CHECK expression.
-- These empty temporary tables cannot expose or rewrite application resources.
create temporary table backup_review_scans (
  id uuid, owner_id uuid, storage_path text, image_url text
) on commit drop;
create policy scans_owner_select on backup_review_scans for select to authenticated
  using (owner_id = (select auth.uid()));
create policy scans_owner_insert on backup_review_scans for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and image_url is null
    and storage_path in (owner_id::text || '/' || id::text || '.jpg',
                        owner_id::text || '/' || id::text || '.webp')
  );
create policy scans_owner_delete on backup_review_scans for delete to authenticated
  using (owner_id = (select auth.uid()));

create temporary table backup_review_objects (
  bucket_id text, owner_id text, name text
) on commit drop;
do $reviewed_storage$
declare
  operation text;
  predicate text := $predicate$
    bucket_id = 'scans'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
  $predicate$;
begin
  foreach operation in array array['select', 'insert', 'update', 'delete'] loop
    execute format('create policy %I on backup_review_objects for %s to authenticated %s %s',
      'scan_photos_owner_' || operation, operation,
      case when operation <> 'insert' then 'using (' || predicate || ')' else '' end,
      case when operation in ('insert', 'update') then 'with check (' || predicate || ')' else '' end);
  end loop;
end;
$reviewed_storage$;

do $preflight$
begin
  if to_regclass('public.scans') is null then
    raise exception 'The existing scans table is required.';
  end if;
  if exists (
    select 1 from (values
      ('id', 'uuid'), ('owner_id', 'uuid'), ('device_id', 'uuid'),
      ('storage_path', 'text'), ('image_url', 'text'), ('disease_name', 'text'),
      ('model_version', 'text'), ('updated_at', 'timestamp with time zone')
    ) as required(column_name, data_type)
    where not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = 'scans'
        and c.column_name = required.column_name and c.data_type = required.data_type
    )
  ) or not exists (
    select 1 from information_schema.columns where table_schema = 'public'
      and table_name = 'scans' and column_name = 'confidence'
      and data_type in ('real', 'double precision')
  ) then
    raise exception 'Review the existing scans column contract before adding backup.';
  end if;
  if exists (select 1 from pg_class
      where oid in ('public.scans'::regclass, 'storage.objects'::regclass)
        and not relrowsecurity) then
    raise exception 'Existing scans and Storage tables require row-level security.';
  end if;
  if not exists (select 1 from storage.buckets where id = 'scans' and public = false) then
    raise exception 'The existing scans bucket must be private.';
  end if;
  if (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('scan_photos_owner_select', 'scan_photos_owner_insert', 'scan_photos_owner_delete')) <> 3 then
    raise exception 'Review and install the owner-scoped scans Storage policies first.';
  end if;
  -- Existing permissive policies are ORed together. Refuse unexpected rules
  -- rather than changing historical access policies as part of this addition.
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'scans') <> 3
      or (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects') <> 4
      or exists (
        select 1
        from (values
          ('public.scans'::regclass, 'pg_temp.backup_review_scans'::regclass),
          ('storage.objects'::regclass, 'pg_temp.backup_review_objects'::regclass)
        ) as targets(actual_table, reviewed_table)
        join pg_policy reviewed on reviewed.polrelid = targets.reviewed_table
        where not exists (
          select 1 from pg_policy actual
          where actual.polrelid = targets.actual_table
            and actual.polname = reviewed.polname
            and actual.polcmd = reviewed.polcmd
            and actual.polpermissive = reviewed.polpermissive
            and actual.polroles = reviewed.polroles
            and pg_get_expr(actual.polqual, actual.polrelid)
              is not distinct from pg_get_expr(reviewed.polqual, reviewed.polrelid)
            and pg_get_expr(actual.polwithcheck, actual.polrelid)
              is not distinct from pg_get_expr(reviewed.polwithcheck, reviewed.polrelid)
        )
      ) then
    raise exception 'Review existing scans/Storage policies; initialization never replaces them.';
  end if;
  if has_table_privilege('anon', 'public.scans', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
      or has_table_privilege('authenticated', 'public.scans', 'UPDATE,TRUNCATE')
      or not has_table_privilege('authenticated', 'public.scans', 'SELECT')
      or not has_table_privilege('authenticated', 'public.scans', 'INSERT')
      or not has_table_privilege('authenticated', 'public.scans', 'DELETE') then
    raise exception 'Existing scans grants differ from the reviewed immutable-owner contract.';
  end if;
  if to_regclass('public.android_backup_reports') is not null then
    raise exception 'Backup table already exists; inspect its schema instead of replacing it.';
  end if;
  if exists (select 1 from pg_namespace where nspname = 'backup_private')
      or to_regprocedure('public.begin_android_backup_report(jsonb)') is not null
      or to_regprocedure('public.complete_android_backup_report(uuid)') is not null
      or to_regprocedure('public.delete_android_backup_report(uuid)') is not null
      or to_regprocedure('public.claim_android_backup_provision_slot()') is not null then
    raise exception 'Existing backup resources require an additive upgrade review, not initialization.';
  end if;
end;
$preflight$;

create table public.android_backup_reports (
  owner_id uuid not null references auth.users(id),
  record_id uuid not null,
  cloud_id uuid not null references public.scans(id),
  storage_path text not null,
  photo_sha256 text not null check (photo_sha256 ~ '^[a-f0-9]{64}$'),
  photo_bytes integer not null check (photo_bytes between 1 and 8388608),
  photo_mime text not null check (photo_mime in ('image/jpeg', 'image/webp')),
  metadata jsonb not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (owner_id, record_id),
  check (storage_path = owner_id::text || '/' || cloud_id::text ||
    case photo_mime when 'image/webp' then '.webp' else '.jpg' end),
  check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768),
  check (coalesce(jsonb_typeof(metadata->'id') = 'string' and metadata->>'id' = record_id::text, false)),
  check (coalesce(jsonb_typeof(metadata->'disease_name') = 'string'
    and length(metadata->>'disease_name') between 1 and 200, false)),
  check (case when jsonb_typeof(metadata->'confidence') = 'number'
    then (metadata->>'confidence')::numeric between 0 and 1 else false end),
  check (coalesce(jsonb_typeof(metadata->'updated_at') = 'string'
    and length(metadata->>'updated_at') between 20 and 40, false)),
  check (metadata->>'_status' is distinct from 'pending-delete'),
  check (not (metadata ? 'image_blob') and not (metadata ? 'photoUri'))
);

alter table public.android_backup_reports enable row level security;
-- PostgreSQL does not index a referencing foreign key automatically.
create index android_backup_reports_cloud_idx on public.android_backup_reports(cloud_id);
revoke all on public.android_backup_reports from public, anon, authenticated;
grant select, insert, delete on public.android_backup_reports to authenticated;
create policy android_backup_owner_select on public.android_backup_reports for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt())->'app_metadata'->>'android_backup_vault' = 'true');
create policy android_backup_owner_insert on public.android_backup_reports for insert to authenticated
  with check (owner_id = (select auth.uid())
    and completed = false
    and (select auth.jwt())->'app_metadata'->>'android_backup_vault' = 'true'
    and exists (select 1 from public.scans s where s.id = android_backup_reports.cloud_id and s.owner_id = (select auth.uid()) and s.storage_path = android_backup_reports.storage_path));
create policy android_backup_owner_delete on public.android_backup_reports for delete to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt())->'app_metadata'->>'android_backup_vault' = 'true');
-- No UPDATE grant/policy: application retries compare an existing immutable row instead.

-- Persist the owner-scoped upload intent before sending photo bytes. Both SQL
-- rows commit together, so any interrupted upload remains discoverable/deletable.
create function public.begin_android_backup_report(p_manifest jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_owner uuid := (select auth.uid());
  v_record uuid := (p_manifest->>'record_id')::uuid;
  v_cloud uuid := (p_manifest->>'cloud_id')::uuid;
  m jsonb := p_manifest->'metadata';
  saved public.android_backup_reports;
begin
  if v_owner is null or (p_manifest->>'owner_id')::uuid is distinct from v_owner
      or (select auth.jwt()->'app_metadata'->>'android_backup_vault') is distinct from 'true'
      or octet_length(p_manifest::text) > 65536 then
    raise exception 'Backup owner and bounded manifest required.' using errcode = '42501';
  end if;
  insert into public.scans(id,owner_id,storage_path,image_url,disease_name,confidence,model_version,updated_at,device_id)
    values(v_cloud,v_owner,p_manifest->>'storage_path',null,m->>'disease_name',
      (m->>'confidence')::double precision,m->>'model_version',(m->>'updated_at')::timestamptz,v_owner)
    on conflict(id) do nothing;
  if not exists (select 1 from public.scans s where s.id = v_cloud and s.owner_id = v_owner
      and s.storage_path = p_manifest->>'storage_path' and s.image_url is null
      and s.disease_name = m->>'disease_name'
      and s.confidence::real = ((m->>'confidence')::double precision)::real
      and s.model_version is not distinct from m->>'model_version'
      and s.updated_at = (m->>'updated_at')::timestamptz) then
    raise exception 'Backup parent conflicts with existing data.' using errcode = '23505';
  end if;
  insert into public.android_backup_reports(owner_id,record_id,cloud_id,storage_path,photo_sha256,photo_bytes,photo_mime,metadata)
    values(v_owner,v_record,v_cloud,p_manifest->>'storage_path',p_manifest->>'photo_sha256',
      (p_manifest->>'photo_bytes')::integer,p_manifest->>'photo_mime',m)
    on conflict(owner_id,record_id) do nothing;
  select * into saved from public.android_backup_reports where owner_id = v_owner and record_id = v_record;
  if not found or saved.cloud_id is distinct from v_cloud
      or saved.storage_path is distinct from p_manifest->>'storage_path'
      or saved.photo_sha256 is distinct from p_manifest->>'photo_sha256'
      or saved.photo_bytes is distinct from (p_manifest->>'photo_bytes')::integer
      or saved.photo_mime is distinct from p_manifest->>'photo_mime'
      or saved.metadata is distinct from m then
    raise exception 'Backup manifest conflicts with existing data.' using errcode = '23505';
  end if;
  return to_jsonb(saved) - 'created_at';
end;
$function$;
revoke all on function public.begin_android_backup_report(jsonb) from public, anon;
grant execute on function public.begin_android_backup_report(jsonb) to authenticated;

-- Narrow completion capability: the only mutable field is readiness, and only
-- the verified owner can acknowledge a photo already present in private Storage.
create function public.complete_android_backup_report(p_record_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $function$
declare
  v_owner uuid := (select auth.uid());
  saved public.android_backup_reports;
begin
  if v_owner is null or (select auth.jwt()->'app_metadata'->>'android_backup_vault') is distinct from 'true' then
    raise exception 'Backup owner required.' using errcode = '42501';
  end if;
  select * into saved from public.android_backup_reports where owner_id = v_owner and record_id = p_record_id for update;
  if not found then return false; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'scans'
      and o.name = saved.storage_path and o.owner_id = v_owner::text) then return false; end if;
  update public.android_backup_reports set completed = true where owner_id = v_owner and record_id = p_record_id;
  return true;
end;
$function$;
revoke all on function public.complete_android_backup_report(uuid) from public, anon;
grant execute on function public.complete_android_backup_report(uuid) to authenticated;

-- Photo bytes are removed through Storage first. Delete the paired new manifest
-- and scan row in one transaction so a lost response is safe to retry by record ID.
create function public.delete_android_backup_report(p_record_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $function$
declare
  backup_cloud_id uuid;
begin
  if (select auth.uid()) is null
      or (select auth.jwt()->'app_metadata'->>'android_backup_vault') is distinct from 'true' then
    raise exception 'Backup owner required.' using errcode = '42501';
  end if;
  delete from public.android_backup_reports
    where owner_id = (select auth.uid()) and record_id = p_record_id
    returning cloud_id into backup_cloud_id;
  if backup_cloud_id is null then return false; end if;
  delete from public.scans where owner_id = (select auth.uid()) and id = backup_cloud_id;
  return true;
end;
$function$;
revoke all on function public.delete_android_backup_report(uuid) from public, anon;
grant execute on function public.delete_android_backup_report(uuid) to authenticated;

create schema if not exists backup_private;
revoke all on schema backup_private from public, anon, authenticated;
create table backup_private.provision_budget (
  singleton boolean primary key default true check (singleton),
  hour_start timestamptz not null,
  hour_count integer not null default 0,
  day_start timestamptz not null,
  day_count integer not null default 0,
  total_count integer not null default 0
);
alter table backup_private.provision_budget enable row level security;
revoke all on backup_private.provision_budget from public, anon, authenticated;
insert into backup_private.provision_budget(singleton, hour_start, day_start)
values (true, date_trunc('hour', now()), date_trunc('day', now()));

-- Publicly callable provisioning must not create unlimited Auth identities. This
-- service-role-only RPC consumes a slot atomically before every admin.createUser.
create function public.claim_android_backup_provision_slot()
returns boolean language plpgsql security definer set search_path = '' as $function$
declare
  accepted boolean;
begin
  if (select auth.jwt()->>'role') is distinct from 'service_role' then
    raise exception 'Service role required.' using errcode = '42501';
  end if;
  update backup_private.provision_budget
  set hour_count = case when hour_start = date_trunc('hour', now()) then hour_count + 1 else 1 end,
      day_count = case when day_start = date_trunc('day', now()) then day_count + 1 else 1 end,
      hour_start = date_trunc('hour', now()), day_start = date_trunc('day', now()),
      total_count = total_count + 1
  where singleton = true
    and (hour_start <> date_trunc('hour', now()) or hour_count < 10)
    and (day_start <> date_trunc('day', now()) or day_count < 100)
    and total_count < 1000
  returning true into accepted;
  return coalesce(accepted, false);
end;
$function$;
revoke all on function public.claim_android_backup_provision_slot() from public, anon, authenticated;
grant execute on function public.claim_android_backup_provision_slot() to service_role;

notify pgrst, 'reload schema';
commit;

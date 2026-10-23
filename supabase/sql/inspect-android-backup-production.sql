-- Read-only preflight and preservation evidence for the verified production project.
-- Verify the project reference through the authenticated connection first. SQL comments
-- are not project authentication. Save before/after output privately; this is not a backup.
-- No report fields, object names, Auth identities, passwords or tokens are returned.
begin transaction read only;

select jsonb_build_object(
  'scans_count', (select count(*) from public.scans),
  'scans_fingerprint', (select md5(coalesce(string_agg(md5(to_jsonb(s)::text), '' order by s.id), '')) from public.scans s),
  'guidelines_count', (select count(*) from public.guidelines),
  'guidelines_fingerprint', (select md5(coalesce(string_agg(md5(to_jsonb(g)::text), '' order by g.id), '')) from public.guidelines g),
  'auth_user_count', (select count(*) from auth.users),
  'scan_photo_count', (select count(*) from storage.objects where bucket_id = 'scans'),
  'scan_photo_metadata_fingerprint', (select md5(coalesce(string_agg(md5(to_jsonb(o)::text), '' order by o.name, o.id), '')) from storage.objects o where o.bucket_id = 'scans'),
  'scan_bucket_fingerprint', (select md5(to_jsonb(b)::text) from storage.buckets b where b.id = 'scans'),
  'preserved_policy_fingerprint', (
    select md5(coalesce(string_agg(md5(to_jsonb(p)::text), '' order by p.schemaname, p.tablename, p.policyname), ''))
    from pg_policies p where (p.schemaname = 'public' and p.tablename in ('scans', 'guidelines'))
      or (p.schemaname = 'storage' and p.tablename = 'objects')
  ),
  'preserved_table_access_fingerprint', (
    select md5(string_agg(c.oid::regclass::text || ':' || coalesce(c.relacl::text, '') || ':' || c.relrowsecurity::text, '' order by c.oid::regclass::text))
    from pg_class c where c.oid in ('public.scans'::regclass, 'public.guidelines'::regclass, 'storage.objects'::regclass)
  )
) as preserved_resources;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'scans'
order by ordinal_position;

select 'backup_table_exists' as check_name,
  to_regclass('public.android_backup_reports') is not null as present
union all select 'backup_private_schema_exists',
  exists (select 1 from pg_namespace where nspname = 'backup_private')
union all select 'begin_backup_rpc_exists',
  to_regprocedure('public.begin_android_backup_report(jsonb)') is not null
union all select 'complete_backup_rpc_exists',
  to_regprocedure('public.complete_android_backup_report(uuid)') is not null
union all select 'delete_backup_rpc_exists',
  to_regprocedure('public.delete_android_backup_report(uuid)') is not null
union all select 'provision_budget_rpc_exists',
  to_regprocedure('public.claim_android_backup_provision_slot()') is not null;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('scans', 'guidelines', 'android_backup_reports'))
  or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- Catalogs cannot prove real-token Storage access, provider settings, or possession
-- of the photo bytes. Those remain separate controlled verification steps.
rollback;

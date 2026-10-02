-- Read-only catalog proof. Run after secure-cloud-sync.sql commits.
-- The separate fixture script proves owner isolation without production records.

begin transaction read only;

do $verify$
declare
  scan_privilege text;
begin
  if not exists (select 1 from storage.buckets where id = 'scans' and public = false) then
    raise exception 'The scans bucket is not private.';
  end if;
  if exists (
    select 1 from pg_class where oid in ('public.scans'::regclass, 'public.guidelines'::regclass,
                                      'storage.objects'::regclass) and not relrowsecurity
  ) then
    raise exception 'An application table has row-level security disabled.';
  end if;
  foreach scan_privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
    if has_table_privilege('anon', 'public.scans', scan_privilege) then
      raise exception 'Unexpected anon scans grant: %', scan_privilege;
    end if;
    if has_table_privilege('authenticated', 'public.scans', scan_privilege)
       <> (scan_privilege = any(array['SELECT', 'INSERT', 'DELETE'])) then
      raise exception 'Unexpected authenticated scans grant: %', scan_privilege;
    end if;
    if has_table_privilege('anon', 'public.guidelines', scan_privilege) <> (scan_privilege = 'SELECT')
       or has_table_privilege('authenticated', 'public.guidelines', scan_privilege) <> (scan_privilege = 'SELECT') then
      raise exception 'Unexpected guidelines client grant: %', scan_privilege;
    end if;
  end loop;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'scans') <> 3
     or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'guidelines') <> 1
     or (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects') <> 4 then
    raise exception 'Unexpected application policy count; review every permissive rule.';
  end if;
  if exists (
    select 1 from pg_policies where
      (schemaname = 'public' and tablename = 'scans' and (
        roles <> array['authenticated']::name[]
        or policyname not in ('scans_owner_select', 'scans_owner_insert', 'scans_owner_delete')
        or coalesce(qual, with_check) not like '%owner_id%auth.uid()%'
      )) or (schemaname = 'storage' and tablename = 'objects' and (
        roles <> array['authenticated']::name[]
        or policyname not in ('scan_photos_owner_select', 'scan_photos_owner_insert',
                             'scan_photos_owner_update', 'scan_photos_owner_delete')
        or coalesce(qual, with_check) not like '%owner_id%auth.uid()%'
      ))
  ) then
    raise exception 'An ownership policy differs from the reviewed role/predicate contract.';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'scan_photos_owner_update' and qual is not null and with_check is not null
  ) then
    raise exception 'Storage UPDATE requires both USING and WITH CHECK.';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'guidelines'
      and policyname = 'guidelines_public_select' and cmd = 'SELECT'
      and qual = 'true' and with_check is null
      and roles @> array['anon', 'authenticated']::name[]
      and cardinality(roles) = 2
  ) then
    raise exception 'Published guidance must allow only public client reads.';
  end if;
  if not exists (select 1 from pg_indexes where schemaname = 'public'
    and tablename = 'scans' and indexname = 'scans_owner_updated_idx') then
    raise exception 'Ownership lookup index is missing.';
  end if;
end;
$verify$;

select jsonb_build_object(
  'scans_total', (select count(*) from public.scans),
  'scans_legacy_without_owner', (select count(*) from public.scans where owner_id is null),
  'guidelines_total', (select count(*) from public.guidelines),
  'photos_total', (select count(*) from storage.objects where bucket_id = 'scans'),
  'photos_legacy_without_owner', (select count(*) from storage.objects where bucket_id = 'scans' and owner_id is null),
  'scans_bucket_private', (select not public from storage.buckets where id = 'scans'),
  'table_policy_counts', (select jsonb_object_agg(table_name, policy_count)
    from (select schemaname || '.' || tablename as table_name, count(*) as policy_count
      from pg_policies where (schemaname = 'public' and tablename in ('scans', 'guidelines'))
        or (schemaname = 'storage' and tablename = 'objects') group by schemaname, tablename) counts)
) as security_verification;

rollback;

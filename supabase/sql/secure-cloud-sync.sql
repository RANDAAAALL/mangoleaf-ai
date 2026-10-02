-- Reviewed forward change for the existing MangoLeaf AI cloud schema.
-- This is not a full project baseline or a CLI-generated migration.
-- Back up records, policies, grants, settings, and actual photo bytes first.
-- Make the scans bucket PRIVATE through the Storage API/dashboard before running.
-- Apply once through a privileged database connection/MCP migration; never in a browser.
-- The transaction preserves every existing row/object and never assigns legacy owners.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $preflight$
declare
  unexpected_policy text;
begin
  if to_regclass('public.scans') is null or to_regclass('public.guidelines') is null then
    raise exception 'Expected existing public.scans and public.guidelines tables.';
  end if;
  if not exists (select 1 from storage.buckets where id = 'scans' and public = false) then
    raise exception 'Set the existing scans bucket to private using the Storage API/dashboard first.';
  end if;
  if not exists (
    select 1 from pg_class where oid = 'storage.objects'::regclass and relrowsecurity
  ) then
    raise exception 'Storage objects must have row-level security enabled.';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scans'
      and column_name in ('owner_id', 'storage_path', 'model_version')
      and (data_type <> case when column_name = 'owner_id' then 'uuid' else 'text' end
        or is_nullable <> 'YES' or column_default is not null)
  ) then
    raise exception 'Existing ownership columns differ from the reviewed nullable, no-default contract.';
  end if;
  select schemaname || '.' || tablename || ': ' || policyname into unexpected_policy
  from pg_policies
  where (schemaname = 'public' and tablename = 'scans' and policyname not in (
    'Allow read scans', 'Allow insert scans', 'Allow delete scans',
    'scans_owner_select', 'scans_owner_insert', 'scans_owner_delete'
  )) or (schemaname = 'public' and tablename = 'guidelines' and policyname not in (
    'Allow read guidelines', 'guidelines_public_select'
  )) or (schemaname = 'storage' and tablename = 'objects' and policyname not in (
    'Allow public reads from scans', 'Allow public uploads to scans',
    'Allow public deletes from scans', 'scan_photos_owner_select',
    'scan_photos_owner_insert', 'scan_photos_owner_update', 'scan_photos_owner_delete'
  ))
  limit 1;
  if unexpected_policy is not null then
    raise exception 'Review unexpected policy before replacing access rules: %', unexpected_policy;
  end if;
end;
$preflight$;

alter table public.scans
  add column if not exists owner_id uuid,
  add column if not exists storage_path text,
  add column if not exists model_version text;

-- NULL ownership is deliberately retained for legacy records. Only an administrator
-- with independent ownership evidence can migrate them; device_id is not that evidence.
alter table public.scans drop constraint if exists scans_owner_storage_path_check;
alter table public.scans add constraint scans_owner_storage_path_check check (
  (owner_id is null and storage_path is null)
  or (
    owner_id is not null
    and storage_path is not null
    and storage_path in (owner_id::text || '/' || id::text || '.jpg',
                        owner_id::text || '/' || id::text || '.webp')
    and image_url is null
  )
);

create index if not exists scans_owner_updated_idx
  on public.scans (owner_id, updated_at desc) where owner_id is not null;

alter table public.scans enable row level security;
alter table public.guidelines enable row level security;

-- Permissive policies are ORed together. Remove every reviewed permissive rule
-- instead of adding ownership rules alongside the old always-true policies.
drop policy if exists "Allow read scans" on public.scans;
drop policy if exists "Allow insert scans" on public.scans;
drop policy if exists "Allow delete scans" on public.scans;
drop policy if exists scans_owner_select on public.scans;
drop policy if exists scans_owner_insert on public.scans;
drop policy if exists scans_owner_delete on public.scans;

revoke all privileges on public.scans from public, anon, authenticated;
grant select, insert, delete on public.scans to authenticated;

create policy scans_owner_select on public.scans for select to authenticated
  using (owner_id = (select auth.uid()));
create policy scans_owner_insert on public.scans for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and image_url is null
    and storage_path in (owner_id::text || '/' || id::text || '.jpg',
                        owner_id::text || '/' || id::text || '.webp')
  );
create policy scans_owner_delete on public.scans for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Scan rows are immutable to browser clients. Upload retries use owner-scoped
-- SELECT to recognize an earlier successful INSERT, not a broader UPDATE grant.
drop policy if exists "Allow read guidelines" on public.guidelines;
drop policy if exists guidelines_public_select on public.guidelines;
revoke all privileges on public.guidelines from public, anon, authenticated;
grant select on public.guidelines to anon, authenticated;
create policy guidelines_public_select on public.guidelines for select to anon, authenticated
  using (true);

drop policy if exists "Allow public reads from scans" on storage.objects;
drop policy if exists "Allow public uploads to scans" on storage.objects;
drop policy if exists "Allow public deletes from scans" on storage.objects;
drop policy if exists scan_photos_owner_select on storage.objects;
drop policy if exists scan_photos_owner_insert on storage.objects;
drop policy if exists scan_photos_owner_update on storage.objects;
drop policy if exists scan_photos_owner_delete on storage.objects;

-- Storage service manages its own table grants and object metadata. Change only
-- custom RLS policies here; never insert/update/delete storage metadata with SQL.
-- Require both the trusted uploader identity and that uploader's folder.
create policy scan_photos_owner_select on storage.objects for select to authenticated
  using (
    bucket_id = 'scans'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
  );
create policy scan_photos_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'scans'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
  );
create policy scan_photos_owner_update on storage.objects for update to authenticated
  using (
    bucket_id = 'scans'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
  )
  with check (
    bucket_id = 'scans'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
  );
create policy scan_photos_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'scans'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
  );

notify pgrst, 'reload schema';
commit;

-- Follow-up for the newly initialized TEST project only. No report/photo writes.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $preflight$
begin
  if to_regclass('public.android_backup_reports') is null then
    raise exception 'Initialize the reviewed testing backup schema first.';
  end if;
  -- Automatic RLS uses this as an event trigger, not an application RPC.
  -- Removing client EXECUTE leaves the administrator-owned DDL trigger working.
  if exists (select 1 from pg_proc
      where oid = to_regprocedure('public.rls_auto_enable()')
        and prorettype = 'event_trigger'::regtype) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$preflight$;

create index if not exists android_backup_reports_cloud_idx
  on public.android_backup_reports(cloud_id);

-- Cache the JWT subquery itself before extracting metadata. Owner predicates
-- and the trusted app_metadata flag retain exactly the existing permissions.
alter policy android_backup_owner_select on public.android_backup_reports
  using (owner_id = (select auth.uid())
    and (select auth.jwt())->'app_metadata'->>'android_backup_vault' = 'true');
alter policy android_backup_owner_insert on public.android_backup_reports
  with check (owner_id = (select auth.uid()) and completed = false
    and (select auth.jwt())->'app_metadata'->>'android_backup_vault' = 'true'
    and exists (select 1 from public.scans s
      where s.id = android_backup_reports.cloud_id and s.owner_id = (select auth.uid())
        and s.storage_path = android_backup_reports.storage_path));
alter policy android_backup_owner_delete on public.android_backup_reports
  using (owner_id = (select auth.uid())
    and (select auth.jwt())->'app_metadata'->>'android_backup_vault' = 'true');

notify pgrst, 'reload schema';
commit;

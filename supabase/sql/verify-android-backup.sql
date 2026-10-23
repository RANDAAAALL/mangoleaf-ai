-- Read-only installation review; run after separately approved deployment.
-- No Auth users, reports, Storage objects or policies are modified.
select 'backup_manifest_rls_enabled' as check_name,
  coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.android_backup_reports')), false) as passed;

select 'backup_manifest_owner_policy_count' as check_name,
  count(*) = 3 and bool_and('authenticated' = any(roles))
    and bool_and(coalesce(qual, with_check) like '%auth.uid()%')
    and bool_and(coalesce(qual, with_check) like '%android_backup_vault%') as passed
from pg_policies where schemaname = 'public' and tablename = 'android_backup_reports';

select 'backup_manifest_client_grants' as check_name,
  has_table_privilege('authenticated', 'public.android_backup_reports', 'SELECT')
    and has_table_privilege('authenticated', 'public.android_backup_reports', 'INSERT')
    and has_table_privilege('authenticated', 'public.android_backup_reports', 'DELETE')
    and not has_table_privilege('authenticated', 'public.android_backup_reports', 'UPDATE')
    and not has_table_privilege('anon', 'public.android_backup_reports', 'SELECT,INSERT,UPDATE,DELETE') as passed;

select 'provision_rpc_service_only' as check_name,
  has_function_privilege('service_role', 'public.claim_android_backup_provision_slot()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.claim_android_backup_provision_slot()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.claim_android_backup_provision_slot()', 'EXECUTE') as passed;

select 'delete_rpc_invoker_and_owned' as check_name,
  not prosecdef
    and has_function_privilege('authenticated', 'public.delete_android_backup_report(uuid)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.delete_android_backup_report(uuid)', 'EXECUTE') as passed
from pg_proc where oid = 'public.delete_android_backup_report(uuid)'::regprocedure;

select 'begin_rpc_invoker_and_authenticated' as check_name,
  not prosecdef
    and has_function_privilege('authenticated', 'public.begin_android_backup_report(jsonb)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.begin_android_backup_report(jsonb)', 'EXECUTE') as passed
from pg_proc where oid = 'public.begin_android_backup_report(jsonb)'::regprocedure;

select 'complete_rpc_owner_guarded_capability' as check_name,
  prosecdef
    and has_function_privilege('authenticated', 'public.complete_android_backup_report(uuid)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.complete_android_backup_report(uuid)', 'EXECUTE') as passed
from pg_proc where oid = 'public.complete_android_backup_report(uuid)'::regprocedure;

select 'backup_bucket_private' as check_name, count(*) = 1 as passed
from storage.buckets where id = 'scans' and public = false;

select 'backup_parent_lookup_index' as check_name,
  exists (select 1 from pg_indexes where schemaname = 'public'
    and tablename = 'android_backup_reports' and indexname = 'android_backup_reports_cloud_idx'
    and indexdef like '%(cloud_id)%') as passed;

-- Inspect complete definitions as well as the booleans above. These checks do
-- not establish successful real-token isolation or actual Storage HTTP access.
select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'android_backup_reports';
select pg_get_functiondef('public.claim_android_backup_provision_slot()'::regprocedure);
select pg_get_functiondef('public.delete_android_backup_report(uuid)'::regprocedure);
select pg_get_functiondef('public.begin_android_backup_report(jsonb)'::regprocedure);
select pg_get_functiondef('public.complete_android_backup_report(uuid)'::regprocedure);

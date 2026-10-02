-- SAFE OPERATIONAL ROLLBACK: pause cloud writes while retaining owner-only reads.
-- Pair with reverting application code if needed. Local diagnosis/History stay local.
-- This deliberately does not restore the previous public read/delete vulnerability.
-- It preserves columns, data, objects, and private bucket configuration.
-- To resume, reapply secure-cloud-sync.sql after its preflight/backup checks.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

revoke insert, update, delete, truncate, references, trigger
  on public.scans from public, anon, authenticated;
drop policy if exists scans_owner_insert on public.scans;
drop policy if exists scans_owner_delete on public.scans;
drop policy if exists scan_photos_owner_insert on storage.objects;
drop policy if exists scan_photos_owner_update on storage.objects;
drop policy if exists scan_photos_owner_delete on storage.objects;

-- Do not change storage.buckets/objects rows with SQL. Keep scans PRIVATE.
notify pgrst, 'reload schema';
commit;

-- New, empty TEST project only. Refuse existing application data or schemas.
-- Apply through the explicitly verified testing project, never production.
-- The preparation tool adds reviewed security/backup SQL without copying data.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $preflight$
begin
  if to_regclass('public.scans') is not null
      or to_regclass('public.guidelines') is not null
      or to_regclass('public.android_backup_reports') is not null
      or exists (select 1 from pg_namespace where nspname = 'backup_private') then
    raise exception 'Testing initialization requires absent application tables and backup schema.';
  end if;
  if exists (select 1 from auth.users) or exists (select 1 from storage.objects)
      or exists (select 1 from storage.buckets) then
    raise exception 'Testing initialization requires an empty Auth and Storage project.';
  end if;
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'The standard Supabase Realtime publication is required.';
  end if;
end;
$preflight$;

-- Create only an empty bucket definition, as in Supabase's SQL setup examples.
-- Never write storage.objects metadata or actual image bytes through SQL.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('scans', 'scans', false, 8388608, array['image/jpeg', 'image/webp']);

-- Match the preserved production column contract without copying private rows.
create table public.scans (
  id uuid primary key,
  disease_name text not null,
  confidence double precision not null,
  image_url text,
  updated_at timestamptz not null default now(),
  device_id uuid not null,
  image_hash text,
  owner_id uuid,
  storage_path text,
  model_version text
);
create table public.guidelines (
  id text primary key,
  disease_name text not null,
  guidelines_en text not null,
  guidelines_bis text not null
);

-- Safe even with automatic grants disabled: access stays denied until the
-- reviewed security script explicitly grants the required client privileges.
alter table public.scans enable row level security;
alter table public.guidelines enable row level security;
revoke all on public.scans, public.guidelines from public, anon, authenticated;

-- Only public advice participates in Realtime; private backup rows do not.
alter publication supabase_realtime add table public.guidelines;
commit;

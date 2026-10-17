-- A stand-in for the part of Supabase Storage that the Studio migrations touch. Production has the real thing; this lets the
-- migrations and their policy run on a plain PostgreSQL database in CI.
create schema if not exists storage;
create table if not exists storage.buckets(id text primary key,name text not null,public boolean default false,file_size_limit bigint,allowed_mime_types text[],created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,metadata jsonb,created_at timestamptz default now());
alter table storage.objects enable row level security;
-- Supabase ships a permissive policy that would otherwise expose a bucket to every signed-in member
drop policy if exists "broad read for signed-in members" on storage.objects;
create policy "broad read for signed-in members" on storage.objects for select to authenticated using (true);
grant usage on schema storage to anon,authenticated,service_role;
grant select,insert,update,delete on storage.objects to authenticated,service_role;
grant select on storage.buckets to anon,authenticated,service_role;

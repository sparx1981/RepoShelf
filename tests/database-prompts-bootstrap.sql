-- The ss_* tables pre-date this repository's migrations (they came from SiteShelf), so CI recreates minimal stand-ins before migration 30.
create table if not exists public.ss_prompts(id text primary key,category text,created_at timestamptz not null default now());
create table if not exists public.ss_previews(id uuid primary key default gen_random_uuid(),prompt_id text,created_at timestamptz not null default now());
create table if not exists public.ss_thumbs(id uuid primary key default gen_random_uuid());
create table if not exists public.ss_prompt_versions(id uuid primary key default gen_random_uuid());
create table if not exists public.ss_sections(id uuid primary key default gen_random_uuid());
create table if not exists public.ss_settings(key text primary key);
create table if not exists public.ss_sync_runs(id uuid primary key default gen_random_uuid());
create table if not exists public.ss_discoveries(id uuid primary key default gen_random_uuid());
alter table public.ss_prompts enable row level security;alter table public.ss_previews enable row level security;alter table public.ss_thumbs enable row level security;
alter table public.ss_prompt_versions enable row level security;alter table public.ss_sections enable row level security;alter table public.ss_settings enable row level security;
alter table public.ss_sync_runs enable row level security;alter table public.ss_discoveries enable row level security;
grant select,insert,update,delete on public.ss_prompts,public.ss_previews,public.ss_thumbs,public.ss_prompt_versions,public.ss_sections,public.ss_settings,public.ss_sync_runs,public.ss_discoveries to anon,authenticated;

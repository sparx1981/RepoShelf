-- The ss_* tables pre-date this repository's migrations (they came from SiteShelf), so CI recreates stand-ins before migration 30 (ss_prompts with the columns production has, which migration 36 inserts into).
create table if not exists public.ss_prompts(id text primary key default gen_random_uuid()::text,source text not null default 'sceneai',source_id text,title text not null default '',category text,description text,type text not null default 'free',thumbnail text,animated_thumbnail text,original_prompt text not null default '',prompt text not null default '',is_new boolean not null default false,source_updated_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(source,source_id));
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

-- Prompt library (formerly SiteShelf) now lives inside RepoShelf.
-- Additive only: the ss_* tables already exist in this project. They stay reachable only through the server
-- (service key) so the prompt text can be withheld from visitors who are not signed in.
alter table public.ss_prompts add column if not exists published boolean not null default true;
alter table public.ss_prompts add column if not exists source_url text check (source_url is null or source_url ~ '^https://');
create index if not exists ss_prompts_list_idx on public.ss_prompts (published, category, created_at desc);
create index if not exists ss_previews_prompt_idx on public.ss_previews (prompt_id, created_at desc);
-- Row-level security is already on with no policies, so the browser keys read nothing. Remove the table grants too.
revoke all on table public.ss_prompts, public.ss_previews, public.ss_thumbs, public.ss_prompt_versions, public.ss_sections,
  public.ss_settings, public.ss_sync_runs, public.ss_discoveries from anon, authenticated;

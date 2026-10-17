-- Prompt library: remember what an administrator edited and what an administrator deleted, so imports respect both.
--   ss_prompts.edited_fields   the listing fields (title, category, description) changed in the admin area. The weekly SceneAI
--                              import leaves those fields alone instead of writing SceneAI's values over them.
--   ss_prompt_tombstones       prompts deleted in the admin area. The SceneAI and MotionSites imports skip them instead of
--                              adding them back.
-- Run it in the Supabase SQL editor at any time: the site works before and after (until it runs, edits are not remembered and
-- deleted prompts can come back at the next import). Safe to run more than once.
begin;
alter table public.ss_prompts add column if not exists edited_fields text[] not null default '{}';

create table if not exists public.ss_prompt_tombstones (
  source text not null check (source in ('siteshelf','sceneai')),
  source_id text not null check (source_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  deleted_at timestamptz not null default now(),
  primary key (source, source_id)
);
-- Server-only, like the other ss_* tables: row-level security on with no policies, and no browser grants.
alter table public.ss_prompt_tombstones enable row level security;
revoke all on table public.ss_prompt_tombstones from anon, authenticated;
commit;

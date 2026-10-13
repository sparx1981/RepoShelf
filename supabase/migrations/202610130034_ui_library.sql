-- UI library: copy-ready interface components with a live preview, the code and a prompt to recreate each one.
-- Browsing (the list, thumbnails and the live preview) is static and open to everyone. The prompt and the code are
-- served by the server (service key) to signed-in members only, so these tables take no browser access at all.
begin;
create table if not exists public.ui_items(
 id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
 title text not null check (length(title) between 1 and 200),
 category text not null check (length(category) between 1 and 80),
 family text not null check (length(family) between 1 and 80),
 description text not null default '' check (length(description) <= 1000),
 position integer not null default 0,
 prompt text not null,
 code text not null,
 files text[] not null default '{}',
 shadcn text[] not null default '{}',
 npm text[] not null default '{}',
 published boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.ui_files(
 path text primary key check (path ~ '^[a-zA-Z0-9_./-]{1,200}$'),
 content text not null,
 updated_at timestamptz not null default now()
);
create index if not exists ui_items_list_idx on public.ui_items (published, family, category, position);
alter table public.ui_items enable row level security;
alter table public.ui_files enable row level security;
revoke all on table public.ui_items, public.ui_files from anon, authenticated;
-- Saved UI components share the My collection store, namespaced like saved prompts.
alter table public.user_likes drop constraint if exists user_likes_project_id_check;
alter table public.user_likes add constraint user_likes_project_id_check check(
 length(project_id)<=220 and (
  project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'
  or project_id ~ '^ss:(siteshelf|sceneai|ui)/[a-z0-9-]{1,80}$'));
-- Prompt-library analytics accept the new section's keys too.
alter table public.prompt_events drop constraint if exists prompt_events_prompt_key_check;
alter table public.prompt_events add constraint prompt_events_prompt_key_check check(prompt_key ~ '^(siteshelf|sceneai|ui)/[a-z0-9-]{1,80}$');
commit;

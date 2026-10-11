-- Saved prompts share the My collection store. Prompt ids are namespaced `ss:<source>/<id>` so they can
-- never collide with a real GitHub repository. Everything else about likes (row-level security, account
-- export, merge and deletion) applies to them unchanged.
begin;
alter table public.user_likes drop constraint if exists user_likes_project_id_check;
alter table public.user_likes add constraint user_likes_project_id_check check(
 length(project_id)<=220 and (
  project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'
  or project_id ~ '^ss:(siteshelf|sceneai)/[a-z0-9-]{1,80}$'));
commit;

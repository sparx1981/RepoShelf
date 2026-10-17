-- Supabase performance advisor fixes for RepoShelf's own tables (the other application's shelf_extensions table is left alone).
--   1. Row-level-security policies that call auth.uid() / reposhelf_is_admin() now call them once per query, not once per row:
--      (select auth.uid()). Behaviour is identical.
--   2. editorial_ribbons and editorial_settings had two permissive SELECT policies for signed-in members (one from the
--      public-read policy, one from the administrators' "for all" policy). The administrators' policy now covers only
--      insert, update and delete; reading is one policy per role. Who can read and who can write does not change.
--   3. Indexes for foreign keys that had none (they speed up deleting a user and the cascades behind it).
-- Safe to run more than once. Run it in the Supabase SQL editor at any time; the site does not depend on it.
begin;

drop policy if exists likes_owner on public.user_likes;
create policy likes_owner on public.user_likes for all to authenticated
  using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists promotion_owner_read on public.promotions;
create policy promotion_owner_read on public.promotions for select to authenticated
  using(user_id=(select auth.uid()) or (select public.reposhelf_is_admin()));

drop policy if exists promotion_event_read on public.promotion_events;
create policy promotion_event_read on public.promotion_events for select to authenticated
  using((select public.reposhelf_is_admin()) or exists(select 1 from public.promotions p where p.id=promotion_id and p.user_id=(select auth.uid())));

drop policy if exists submission_read on public.repository_submissions;
create policy submission_read on public.repository_submissions for select to authenticated
  using(user_id=(select auth.uid()) or (select public.reposhelf_is_admin()));

-- editorial_settings: everyone reads (one policy); administrators write.
drop policy if exists settings_admin on public.editorial_settings;
drop policy if exists settings_admin_insert on public.editorial_settings;
drop policy if exists settings_admin_update on public.editorial_settings;
drop policy if exists settings_admin_delete on public.editorial_settings;
create policy settings_admin_insert on public.editorial_settings for insert to authenticated with check((select public.reposhelf_is_admin()));
create policy settings_admin_update on public.editorial_settings for update to authenticated using((select public.reposhelf_is_admin())) with check((select public.reposhelf_is_admin()));
create policy settings_admin_delete on public.editorial_settings for delete to authenticated using((select public.reposhelf_is_admin()));

-- editorial_ribbons: visitors read enabled shelves; signed-in members read enabled shelves, and administrators read all of them.
drop policy if exists ribbons_admin on public.editorial_ribbons;
drop policy if exists ribbons_public on public.editorial_ribbons;
drop policy if exists ribbons_public_anon on public.editorial_ribbons;
drop policy if exists ribbons_read_members on public.editorial_ribbons;
drop policy if exists ribbons_admin_insert on public.editorial_ribbons;
drop policy if exists ribbons_admin_update on public.editorial_ribbons;
drop policy if exists ribbons_admin_delete on public.editorial_ribbons;
create policy ribbons_public_anon on public.editorial_ribbons for select to anon using(enabled);
create policy ribbons_read_members on public.editorial_ribbons for select to authenticated using(enabled or (select public.reposhelf_is_admin()));
create policy ribbons_admin_insert on public.editorial_ribbons for insert to authenticated with check((select public.reposhelf_is_admin()));
create policy ribbons_admin_update on public.editorial_ribbons for update to authenticated using((select public.reposhelf_is_admin())) with check((select public.reposhelf_is_admin()));
create policy ribbons_admin_delete on public.editorial_ribbons for delete to authenticated using((select public.reposhelf_is_admin()));

create index if not exists admin_role_changes_actor on public.admin_role_changes(actor_id);
create index if not exists admin_role_changes_target on public.admin_role_changes(target_id);
create index if not exists board_items_board_user on public.board_items(board_id,user_id);
create index if not exists listing_moderation_audit_actor on public.listing_moderation_audit(actor);
create index if not exists listing_reports_reporter on public.listing_reports(reporter);
create index if not exists promotion_events_promotion on public.promotion_events(promotion_id);
create index if not exists promotions_reviewed_by on public.promotions(reviewed_by);
create index if not exists viewer_site_prefs_updated_by on public.viewer_site_prefs(updated_by);
commit;

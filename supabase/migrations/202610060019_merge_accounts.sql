-- Guided account merge: move everything owned by one RepoShelf account (the source) into another (the target).
-- Called only by the server (service role) after the person has proved both accounts: they are signed in as the
-- target and have just completed a sign-in as the source. The application then deletes the emptied source account
-- through the Auth admin API and re-attaches the source's sign-in method to the target.
-- Safe to run more than once.
begin;

create or replace function public.reposhelf_merge_check(p_target uuid,p_source uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t_providers text[];s_providers text[];
begin
 if p_target is null or p_source is null or p_target=p_source then return jsonb_build_object('ok',false,'reason','same_account');end if;
 if not exists(select 1 from auth.users where id=p_target) or not exists(select 1 from auth.users where id=p_source) then return jsonb_build_object('ok',false,'reason','account_missing');end if;
 select coalesce(array_agg(distinct provider),'{}') into t_providers from auth.identities where user_id=p_target;
 select coalesce(array_agg(distinct provider),'{}') into s_providers from auth.identities where user_id=p_source;
 -- Two accounts that share a sign-in provider (for example two different GitHub accounts) are not merged: fork
 -- verification is tied to one GitHub identity.
 if t_providers && s_providers then return jsonb_build_object('ok',false,'reason','same_provider');end if;
 if exists(select 1 from public.reposhelf_admins where user_id=p_source) and not exists(select 1 from public.reposhelf_admins where user_id=p_target) then return jsonb_build_object('ok',false,'reason','source_is_admin');end if;
 if exists(select 1 from public.promotions where user_id in(p_target,p_source) and status in('checkout','paid_waiting','active','paused')) then return jsonb_build_object('ok',false,'reason','promotions_active');end if;
 if exists(select 1 from public.fork_sync_state where user_id in(p_target,p_source) and lease_until>now()) or exists(select 1 from public.repository_submissions where user_id in(p_target,p_source) and lease_until>now()) then return jsonb_build_object('ok',false,'reason','busy');end if;
 return jsonb_build_object('ok',true,'providers',to_jsonb(s_providers),'counts',jsonb_build_object(
  'likes',(select count(*) from public.user_likes where user_id=p_source),
  'history',(select count(*) from public.user_project_history where user_id=p_source),
  'forks',(select count(*) from public.user_forks where user_id=p_source),
  'submissions',(select count(*) from public.repository_submissions where user_id=p_source),
  'promotions',(select count(*) from public.promotions where user_id=p_source)));
end$$;

create or replace function public.reposhelf_merge_accounts(p_target uuid,p_source uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare verdict jsonb;moved jsonb;
begin
 -- Serialise merges touching either account, in a fixed order so two merges cannot deadlock.
 perform pg_advisory_xact_lock(hashtextextended(least(p_target::text,p_source::text),0));
 perform pg_advisory_xact_lock(hashtextextended(greatest(p_target::text,p_source::text),0));
 verdict:=public.reposhelf_merge_check(p_target,p_source);
 if (verdict->>'ok')::boolean is not true then return verdict;end if;
 moved:=verdict->'counts';

 insert into public.user_likes(user_id,project_id,created_at,project_snapshot) select p_target,project_id,created_at,project_snapshot from public.user_likes where user_id=p_source on conflict(user_id,project_id) do nothing;
 delete from public.user_likes where user_id=p_source;

 insert into public.user_project_history(user_id,project_id,project_snapshot,viewed_at) select p_target,project_id,project_snapshot,viewed_at from public.user_project_history where user_id=p_source
  on conflict(user_id,project_id) do update set project_snapshot=case when excluded.viewed_at>public.user_project_history.viewed_at then excluded.project_snapshot else public.user_project_history.project_snapshot end,viewed_at=greatest(excluded.viewed_at,public.user_project_history.viewed_at);
 delete from public.user_project_history where user_id=p_source;

 insert into public.user_discovery_settings(user_id,remember_views,hide_seen,updated_at) select p_target,remember_views,hide_seen,updated_at from public.user_discovery_settings where user_id=p_source
  on conflict(user_id) do update set remember_views=excluded.remember_views or public.user_discovery_settings.remember_views,hide_seen=excluded.hide_seen or public.user_discovery_settings.hide_seen,updated_at=now();
 delete from public.user_discovery_settings where user_id=p_source;

 insert into public.user_forks(user_id,github_fork_id,github_owner_id,project_id,fork_full,parent_data,available,verified_at,last_attempt_at) select p_target,github_fork_id,github_owner_id,project_id,fork_full,parent_data,available,verified_at,last_attempt_at from public.user_forks where user_id=p_source on conflict(user_id,github_fork_id) do nothing;
 delete from public.user_forks where user_id=p_source;
 -- Fork verification progress moves only when the target has none of its own; otherwise it is simply re-run.
 update public.fork_sync_state set user_id=p_target where user_id=p_source and not exists(select 1 from public.fork_sync_state where user_id=p_target);
 delete from public.fork_sync_state where user_id=p_source;

 update public.repository_submissions s set user_id=p_target where s.user_id=p_source and not exists(select 1 from public.repository_submissions t where t.user_id=p_target and t.repo_id=s.repo_id);
 update public.promotions set user_id=p_target where user_id=p_source;
 update public.promotions set reviewed_by=p_target where reviewed_by=p_source;
 update public.listing_reports set reporter=p_target where reporter=p_source;
 update public.listing_moderation_audit set actor=p_target where actor=p_source;
 update public.admin_role_changes set actor_id=p_target where actor_id=p_source;
 update public.admin_role_changes set target_id=p_target where target_id=p_source;

 insert into public.legal_acceptances(user_id,terms_version,privacy_version,accepted_at) select p_target,terms_version,privacy_version,accepted_at from public.legal_acceptances where user_id=p_source on conflict do nothing;
 delete from public.legal_acceptances where user_id=p_source;
 delete from public.reposhelf_admins where user_id=p_source;

 return jsonb_build_object('ok',true,'moved',moved,'providers',verdict->'providers');
end$$;

revoke all on function public.reposhelf_merge_check(uuid,uuid) from public,anon,authenticated;
revoke all on function public.reposhelf_merge_accounts(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reposhelf_merge_check(uuid,uuid) to service_role;
grant execute on function public.reposhelf_merge_accounts(uuid,uuid) to service_role;
commit;

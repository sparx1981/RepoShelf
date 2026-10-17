-- Account export and merge preview now cover everything an account holds.
--   The export adds the sign-in methods (Google as well as GitHub) and the connector keys (name, prefix and dates; never the key itself).
--   The merge preview counts boards and connector keys, which already move with the account.
-- Both functions are replaced with their previous bodies plus the additions. Run it in the Supabase SQL editor at any time; the site
-- works before and after. Safe to run more than once.
begin;
create or replace function public.reposhelf_export_account() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare export_user_id uuid:=auth.uid();result jsonb;
begin
 if export_user_id is null then raise insufficient_privilege;end if;
 select jsonb_build_object('formatVersion',1,'exportedAt',now(),
  'account',(select jsonb_build_object('id',u.id,'createdAt',u.created_at,'lastSignInAt',u.last_sign_in_at,'administrator',exists(select 1 from public.reposhelf_admins a where a.user_id=u.id),'github',coalesce((select jsonb_build_object('id',i.provider_id,'username',coalesce(i.identity_data->>'user_name',i.identity_data->>'preferred_username')) from auth.identities i where i.user_id=u.id and i.provider='github' limit 1),'{}'::jsonb)) from auth.users u where u.id=export_user_id),
  'signInMethods',coalesce((select jsonb_agg(jsonb_build_object('provider',i.provider,'email',i.identity_data->>'email') order by i.provider) from auth.identities i where i.user_id=export_user_id),'[]'::jsonb),
  'connectorKeys',coalesce((select jsonb_agg(jsonb_build_object('label',k.label,'prefix',k.key_prefix,'createdAt',k.created_at,'lastUsedAt',k.last_used_at,'revokedAt',k.revoked_at) order by k.created_at) from public.mcp_keys k where k.user_id=export_user_id),'[]'::jsonb),
  'likes',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.project_id) from public.user_likes r where r.user_id=export_user_id),'[]'::jsonb),
  'boards',coalesce((select jsonb_agg(jsonb_build_object('name',b.name,'description',b.description,'createdAt',b.created_at,'items',coalesce((select jsonb_agg(i.project_id order by i.added_at) from public.board_items i where i.board_id=b.id),'[]'::jsonb)) order by b.created_at) from public.boards b where b.user_id=export_user_id),'[]'::jsonb),
  'publicForks',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.github_fork_id) from public.user_forks r where r.user_id=export_user_id),'[]'::jsonb),
  'viewingSettings',coalesce((select to_jsonb(r)-'user_id' from public.user_discovery_settings r where r.user_id=export_user_id),'{}'::jsonb),
  'viewingHistory',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.viewed_at desc) from public.user_project_history r where r.user_id=export_user_id),'[]'::jsonb),
  'agreements',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.accepted_at) from public.legal_acceptances r where r.user_id=export_user_id),'[]'::jsonb),
  'submissions',coalesce((select jsonb_agg(to_jsonb(r)-'user_id'-'lease'-'lease_until' order by r.created_at) from public.repository_submissions r where r.user_id=export_user_id),'[]'::jsonb),
  'reports',coalesce((select jsonb_agg(to_jsonb(r)-'reporter' order by r.created_at) from public.listing_reports r where r.reporter=export_user_id),'[]'::jsonb),
  'promotions',coalesce((select jsonb_agg(to_jsonb(r)-'user_id'-'reviewed_by'-'checkout_attempt' order by r.created_at) from public.promotions r where r.user_id=export_user_id),'[]'::jsonb)
 ) into result;
 return result;
end$$;

create or replace function public.reposhelf_merge_check(p_target uuid,p_source uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t_providers text[];s_providers text[];n_boards bigint:=0;n_keys bigint:=0;
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
 -- boards and connector keys move with the account too (each table is read only if its migration has run)
 if to_regclass('public.boards') is not null then execute 'select count(*) from public.boards where user_id=$1' into n_boards using p_source;end if;
 if to_regclass('public.mcp_keys') is not null then execute 'select count(*) from public.mcp_keys where user_id=$1 and revoked_at is null' into n_keys using p_source;end if;
 return jsonb_build_object('ok',true,'providers',to_jsonb(s_providers),'counts',jsonb_build_object(
  'likes',(select count(*) from public.user_likes where user_id=p_source),
  'history',(select count(*) from public.user_project_history where user_id=p_source),
  'forks',(select count(*) from public.user_forks where user_id=p_source),
  'submissions',(select count(*) from public.repository_submissions where user_id=p_source),
  'promotions',(select count(*) from public.promotions where user_id=p_source),
  'boards',n_boards,
  'keys',n_keys));
end$$;
commit;

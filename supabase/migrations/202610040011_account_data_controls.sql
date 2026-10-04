begin;
-- Preserve payment history after removal of an account; no public access changes.
alter table public.promotions alter column user_id drop not null;
alter table public.promotions drop constraint promotions_user_id_fkey;
alter table public.promotions add constraint promotions_user_id_fkey foreign key(user_id) references auth.users(id) on delete set null;
create function public.reposhelf_account_data_ready() returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 return true;
end$$;
create function public.reposhelf_account_deletion_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 if exists(select 1 from public.reposhelf_admins where user_id=auth.uid()) and (select count(*) from public.reposhelf_admins)<=1 then return jsonb_build_object('allowed',false,'reason','Assign another administrator before deleting the last administrator account.');end if;
 if exists(select 1 from public.promotions where user_id=auth.uid() and status in('checkout','paid_waiting','active','paused')) then return jsonb_build_object('allowed',false,'reason','Resolve reserved or running promotions before deleting your account.');end if;
 return jsonb_build_object('allowed',true);
end$$;
create function public.reposhelf_export_account() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=auth.uid();result jsonb;
begin
 if owner_id is null then raise insufficient_privilege;end if;
 select jsonb_build_object('formatVersion',1,'exportedAt',now(),
  'account',(select jsonb_build_object('id',u.id,'createdAt',u.created_at,'lastSignInAt',u.last_sign_in_at,'administrator',exists(select 1 from public.reposhelf_admins a where a.user_id=u.id),'github',coalesce((select jsonb_build_object('id',i.provider_id,'username',coalesce(i.identity_data->>'user_name',i.identity_data->>'preferred_username')) from auth.identities i where i.user_id=u.id and i.provider='github' limit 1),'{}'::jsonb)) from auth.users u where u.id=owner_id),
  'likes',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.project_id) from public.user_likes r where r.user_id=owner_id),'[]'::jsonb),
  'publicForks',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.github_fork_id) from public.user_forks r where r.user_id=owner_id),'[]'::jsonb),
  'viewingSettings',coalesce((select to_jsonb(r)-'user_id' from public.user_discovery_settings r where r.user_id=owner_id),'{}'::jsonb),
  'viewingHistory',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.viewed_at desc) from public.user_project_history r where r.user_id=owner_id),'[]'::jsonb),
  'agreements',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.accepted_at) from public.legal_acceptances r where r.user_id=owner_id),'[]'::jsonb),
  'submissions',coalesce((select jsonb_agg(to_jsonb(r)-'user_id'-'lease'-'lease_until' order by r.created_at) from public.repository_submissions r where r.user_id=owner_id),'[]'::jsonb),
  'reports',coalesce((select jsonb_agg(to_jsonb(r)-'reporter' order by r.created_at) from public.listing_reports r where r.reporter=owner_id),'[]'::jsonb),
  'promotions',coalesce((select jsonb_agg(to_jsonb(r)-'user_id'-'reviewed_by'-'checkout_attempt' order by r.created_at) from public.promotions r where r.user_id=owner_id),'[]'::jsonb)
 ) into result;
 return result;
end$$;
revoke all on function public.reposhelf_account_data_ready(),public.reposhelf_account_deletion_status(),public.reposhelf_export_account() from public,anon;
grant execute on function public.reposhelf_account_data_ready(),public.reposhelf_account_deletion_status(),public.reposhelf_export_account() to authenticated;
create function public.reposhelf_guard_account_deletion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 -- Same locks and order as role management / promotion writes.
 perform pg_advisory_xact_lock(71883003);
 perform pg_advisory_xact_lock(724903006);
 if exists(select 1 from public.reposhelf_admins where user_id=old.id) and (select count(*) from public.reposhelf_admins)<=1 then
  raise exception 'Assign another administrator before deleting the last administrator account' using errcode='PT409';
 end if;
 if exists(select 1 from public.promotions where user_id=old.id and status in('checkout','paid_waiting','active','paused')) then
  raise exception 'Resolve reserved or paid promotions before deleting this account' using errcode='PT409';
 end if;
 delete from public.promotions where user_id=old.id and payment_intent is null;
 -- Reports and audit decisions remain private, with user references removed by FK.
 -- Clear reporter-provided prose to avoid retaining personal details in that field.
 update public.listing_reports set explanation='' where reporter=old.id;
 return old;
end$$;
revoke all on function public.reposhelf_guard_account_deletion() from public,anon,authenticated;
create trigger reposhelf_guard_account_deletion before delete on auth.users for each row execute function public.reposhelf_guard_account_deletion();
notify pgrst,'reload schema';
commit;

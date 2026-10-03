begin;
create table if not exists public.admin_role_changes(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,target_id uuid references auth.users(id) on delete set null,enabled boolean not null,created_at timestamptz not null default now());
alter table public.admin_role_changes enable row level security;
revoke all on public.admin_role_changes from anon,authenticated;
create policy role_audit_admin on public.admin_role_changes for select to authenticated using(public.reposhelf_is_admin());
grant select on public.admin_role_changes to authenticated;

-- Only established GitHub identities are eligible. Names come from provider
-- identity data, never user-editable metadata or client-supplied role claims.
create or replace function public.reposhelf_list_users(search_text text default '',after_id uuid default null,page_size integer default 20) returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
if search_text is null or page_size is null or length(search_text)>100 or page_size not between 1 and 50 then raise check_violation;end if;
with eligible as (
select u.id,u.created_at,u.last_sign_in_at,coalesce(i.identity_data->>'user_name',i.identity_data->>'preferred_username','GitHub user') as username,i.provider_id as github_id,exists(select 1 from public.reposhelf_admins a where a.user_id=u.id) as admin
from auth.users u join lateral(select identity_data,provider_id from auth.identities where user_id=u.id and provider='github' order by id limit 1) i on true
where u.last_sign_in_at is not null
),filtered as (select * from eligible where search_text='' or strpos(lower(username),lower(search_text))>0 or strpos(id::text,lower(search_text))>0 or strpos(github_id,search_text)>0),page as (
select * from filtered where after_id is null or id>after_id order by id limit page_size+1
),visible as(select * from page order by id limit page_size)
select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(v) order by id) from visible v),'[]'::jsonb),'total',(select count(*) from filtered),'nextCursor',case when (select count(*) from page)>page_size then (select id::text from visible order by id desc limit 1) else null end) into result;
return result;end$$;

create or replace function public.reposhelf_set_admin(target_user uuid,enabled boolean,expected_admin boolean) returns jsonb language plpgsql security definer set search_path='' as $$declare was_admin boolean;changed boolean;begin
-- Recheck membership after the lock: a revoked administrator must not finish
-- an operation that was waiting for another role change to commit.
if target_user is null or enabled is null or expected_admin is null then raise check_violation;end if;
perform pg_advisory_xact_lock(71883003);
if not exists(select 1 from public.reposhelf_admins where user_id=auth.uid()) then raise insufficient_privilege;end if;
if not exists(select 1 from auth.users u join auth.identities i on i.user_id=u.id and i.provider='github' where u.id=target_user and u.last_sign_in_at is not null) then raise exception using errcode='PT404',message='User is not eligible';end if;
select exists(select 1 from public.reposhelf_admins where user_id=target_user) into was_admin;
if was_admin is distinct from expected_admin then raise exception using errcode='40001',message='Role changed';end if;
if not enabled and was_admin and (target_user=auth.uid() or (select count(*) from public.reposhelf_admins)<=1) then raise exception using errcode='PT409',message='Protected administrator';end if;
if enabled then insert into public.reposhelf_admins(user_id) values(target_user) on conflict do nothing;else delete from public.reposhelf_admins where user_id=target_user;end if;
changed:=found;
if changed then insert into public.admin_role_changes(actor_id,target_id,enabled) values(auth.uid(),target_user,enabled);end if;
return jsonb_build_object('id',target_user,'admin',enabled,'changed',changed);end$$;
revoke all on function public.reposhelf_list_users(text,uuid,integer),public.reposhelf_set_admin(uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_list_users(text,uuid,integer),public.reposhelf_set_admin(uuid,boolean,boolean) to authenticated;
commit;

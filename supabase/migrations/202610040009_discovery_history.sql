begin;
create table public.user_discovery_settings(user_id uuid primary key references auth.users(id) on delete cascade,remember_views boolean not null default false,hide_seen boolean not null default false,updated_at timestamptz not null default now(),check(not hide_seen or remember_views));
create table public.user_project_history(user_id uuid not null references auth.users(id) on delete cascade,project_id text not null check(project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' and length(project_id)<=220),project_snapshot jsonb not null check(jsonb_typeof(project_snapshot)='object' and octet_length(project_snapshot::text)<=16384),viewed_at timestamptz not null default now(),primary key(user_id,project_id));
create index user_project_history_recent on public.user_project_history(user_id,viewed_at desc);
alter table public.user_discovery_settings enable row level security;
alter table public.user_project_history enable row level security;
revoke all on public.user_discovery_settings,public.user_project_history from public,anon,authenticated;
grant select on public.user_discovery_settings,public.user_project_history to authenticated;
create policy discovery_settings_owner_read on public.user_discovery_settings for select to authenticated using(user_id=(select auth.uid()));
create policy project_history_owner_read on public.user_project_history for select to authenticated using(user_id=(select auth.uid()));
create function public.reposhelf_discovery_settings(remember boolean,hide boolean) returns void language plpgsql security definer set search_path='' as $$begin
if auth.uid() is null then raise insufficient_privilege;end if;if remember is null or hide is null or hide and not remember then raise check_violation;end if;
insert into public.user_discovery_settings(user_id,remember_views,hide_seen) values(auth.uid(),remember,hide) on conflict(user_id) do update set remember_views=excluded.remember_views,hide_seen=excluded.hide_seen,updated_at=now();
end$$;
create function public.reposhelf_remember_project(project text,snapshot jsonb) returns boolean language plpgsql security definer set search_path='' as $$begin
if auth.uid() is null then raise insufficient_privilege;end if;
if not exists(select 1 from public.user_discovery_settings where user_id=auth.uid() and remember_views=true) then return false;end if;
insert into public.user_project_history(user_id,project_id,project_snapshot) values(auth.uid(),project,snapshot) on conflict(user_id,project_id) do update set viewed_at=now(),project_snapshot=excluded.project_snapshot;
delete from public.user_project_history where user_id=auth.uid() and viewed_at<now()-interval '90 days';return true;
end$$;
create function public.reposhelf_clear_project_history() returns void language plpgsql security definer set search_path='' as $$begin
if auth.uid() is null then raise insufficient_privilege;end if;delete from public.user_project_history where user_id=auth.uid();end$$;
revoke all on function public.reposhelf_discovery_settings(boolean,boolean),public.reposhelf_remember_project(text,jsonb),public.reposhelf_clear_project_history() from public,anon,authenticated;
grant execute on function public.reposhelf_discovery_settings(boolean,boolean),public.reposhelf_remember_project(text,jsonb),public.reposhelf_clear_project_history() to authenticated;
notify pgrst,'reload schema';
commit;

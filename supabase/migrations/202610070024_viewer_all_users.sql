-- Site-wide switch for the demo viewer: when on, "Try demo" on the storefront opens the demo inside the viewer as an
-- unqualified preview for every visitor, exactly as it does for an administrator with their own switch on. Off by default.
-- One row, server-only access. Safe to run twice.
begin;
create table if not exists public.viewer_site_prefs(
 id boolean primary key default true check(id),
 all_users boolean not null default false,
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now());
alter table public.viewer_site_prefs enable row level security;
revoke all on public.viewer_site_prefs from public,anon,authenticated;
insert into public.viewer_site_prefs(id,all_users) values(true,false) on conflict(id) do nothing;

create or replace function public.reposhelf_viewer_site_get() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select all_users from public.viewer_site_prefs where id),false)
$$;

create or replace function public.reposhelf_viewer_site_set(p_actor uuid,p_all boolean) returns boolean language plpgsql security definer set search_path='' as $$
begin
 insert into public.viewer_site_prefs(id,all_users,updated_by,updated_at) values(true,coalesce(p_all,false),p_actor,now())
 on conflict(id) do update set all_users=excluded.all_users,updated_by=excluded.updated_by,updated_at=now();
 return coalesce(p_all,false);
end$$;

revoke all on function public.reposhelf_viewer_site_get(),public.reposhelf_viewer_site_set(uuid,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_viewer_site_get(),public.reposhelf_viewer_site_set(uuid,boolean) to service_role;
commit;

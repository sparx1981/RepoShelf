-- Administrator preference for the demo viewer: when on, "Try demo" on the storefront opens the demo inside the
-- viewer as an unqualified preview for that administrator only; everyone else (and the administrator with the
-- preference off) still gets the demo in a new tab. One row per account, server-only access. Safe to run twice.
begin;
create table if not exists public.viewer_admin_prefs(
 user_id uuid primary key references auth.users(id) on delete cascade,
 preview boolean not null default false,
 updated_at timestamptz not null default now());
revoke all on public.viewer_admin_prefs from public,anon,authenticated;

create or replace function public.reposhelf_viewer_pref_get(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select preview from public.viewer_admin_prefs where user_id=p_user),false)
$$;

create or replace function public.reposhelf_viewer_pref_set(p_user uuid,p_preview boolean) returns boolean language plpgsql security definer set search_path='' as $$
begin
 insert into public.viewer_admin_prefs(user_id,preview,updated_at) values(p_user,coalesce(p_preview,false),now())
 on conflict(user_id) do update set preview=excluded.preview,updated_at=now();
 return coalesce(p_preview,false);
end$$;

revoke all on function public.reposhelf_viewer_pref_get(uuid),public.reposhelf_viewer_pref_set(uuid,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_viewer_pref_get(uuid),public.reposhelf_viewer_pref_set(uuid,boolean) to service_role;
commit;

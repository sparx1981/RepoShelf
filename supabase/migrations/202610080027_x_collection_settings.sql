begin;
create table public.x_collection_settings(
  id boolean primary key default true check(id),
  enabled boolean not null default false,
  revision integer not null default 1 check(revision>0),
  updated_at timestamptz not null default now()
);
insert into public.x_collection_settings(id) values(true);
alter table public.x_collection_settings enable row level security;
revoke all on public.x_collection_settings from public,anon,authenticated;
grant select on public.x_collection_settings to authenticated;
grant all on public.x_collection_settings to service_role;
create policy x_collection_settings_admin on public.x_collection_settings for select to authenticated using(public.reposhelf_is_admin());
create function public.reposhelf_x_collection_settings(expected_revision integer,scanning_enabled boolean)
returns public.x_collection_settings language plpgsql security definer set search_path='' as $$
declare saved public.x_collection_settings;
begin
  if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
  if scanning_enabled is null or expected_revision is null or expected_revision<1 then raise check_violation;end if;
  update public.x_collection_settings set enabled=scanning_enabled,revision=revision+1,updated_at=now()
    where id and revision=expected_revision returning * into saved;
  if not found then raise exception using errcode='40001',message='X.com scanning settings changed';end if;
  return saved;
end$$;
revoke all on function public.reposhelf_x_collection_settings(integer,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_x_collection_settings(integer,boolean) to authenticated;
notify pgrst,'reload schema';
commit;

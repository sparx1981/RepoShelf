begin;
alter table public.editorial_ribbons drop constraint if exists editorial_ribbons_mode_check;
alter table public.editorial_ribbons add constraint editorial_ribbons_mode_check check(mode in ('manual','popular','trending','newest','random','daily','community','releases','reposhelf'));
insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values ('e0000000-0000-4000-8000-000000000014','reposhelf','Popular on RepoShelf','Most opened listings on RepoShelf in the last 30 days.','','reposhelf',true,-96,'[]') on conflict do nothing;
create index if not exists analytics_listing_popularity on public.analytics_events(created_at,project_id) where kind='listing_view' and project_id is not null;
create or replace function public.reposhelf_listing_popularity() returns table(project_id text,clicks bigint) language sql stable security definer set search_path='' as $$
 select lower(e.project_id),count(*) from public.analytics_events e where e.kind='listing_view' and e.project_id is not null and e.created_at>=now()-interval '30 days' group by lower(e.project_id) order by count(*) desc,lower(e.project_id);
$$;
revoke all on function public.reposhelf_listing_popularity() from public,anon,authenticated;
grant execute on function public.reposhelf_listing_popularity() to service_role;
notify pgrst,'reload schema';
commit;

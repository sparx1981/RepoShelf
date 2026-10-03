begin;
create table if not exists public.reposhelf_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.reposhelf_admins enable row level security;
revoke all on public.reposhelf_admins from anon,authenticated;
create or replace function public.reposhelf_is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.reposhelf_admins where user_id=auth.uid())$$;
revoke all on function public.reposhelf_is_admin() from public,anon,authenticated;
grant execute on function public.reposhelf_is_admin() to authenticated;

create table if not exists public.user_likes(user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,project_id text not null check(project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' and length(project_id)<=220),created_at timestamptz not null default now(),primary key(user_id,project_id));
alter table public.user_likes enable row level security;
revoke all on public.user_likes from anon,authenticated;
create policy likes_owner on public.user_likes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,delete on public.user_likes to authenticated;
grant insert(user_id,project_id) on public.user_likes to authenticated;
create or replace function public.reposhelf_set_like(project text,liked boolean) returns void language plpgsql security invoker set search_path='' as $$begin
if auth.uid() is null then raise insufficient_privilege; end if;
if liked then insert into public.user_likes(user_id,project_id) values(auth.uid(),project) on conflict do nothing;else delete from public.user_likes where user_id=auth.uid() and project_id=project;end if;end$$;
revoke all on function public.reposhelf_set_like(text,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_set_like(text,boolean) to authenticated;

create table if not exists public.editorial_settings(id boolean primary key default true check(id),custom_rows boolean not null default false);
insert into public.editorial_settings values(true,false) on conflict do nothing;
alter table public.editorial_settings enable row level security;
revoke all on public.editorial_settings from anon,authenticated;
create policy settings_read on public.editorial_settings for select to anon,authenticated using(true);
create policy settings_admin on public.editorial_settings for all to authenticated using(public.reposhelf_is_admin()) with check(public.reposhelf_is_admin());
grant select on public.editorial_settings to anon;grant select,update on public.editorial_settings to authenticated;
create table if not exists public.editorial_ribbons(id uuid primary key default gen_random_uuid(),title text not null check(length(trim(title)) between 1 and 100),description text not null default '' check(length(description)<=400),category text not null default '' check(length(category)<=100),mode text not null default 'manual' check(mode in ('manual','popular','trending','newest')),enabled boolean not null default false,position integer not null default 0,items jsonb not null default '[]' check(jsonb_typeof(items)='array' and jsonb_array_length(items)<=120),revision integer not null default 1,updated_at timestamptz not null default now());
alter table public.editorial_ribbons enable row level security;
revoke all on public.editorial_ribbons from anon,authenticated;
create policy ribbons_public on public.editorial_ribbons for select to anon,authenticated using(enabled);
create policy ribbons_admin on public.editorial_ribbons for all to authenticated using(public.reposhelf_is_admin()) with check(public.reposhelf_is_admin());
grant select on public.editorial_ribbons to anon;grant select,insert,update,delete on public.editorial_ribbons to authenticated;
create or replace function public.reposhelf_set_editorial(custom boolean) returns void language plpgsql security definer set search_path='' as $$begin if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;update public.editorial_settings set custom_rows=custom where id=true;end$$;
create or replace function public.reposhelf_save_ribbon(row_id uuid,expected_revision integer,row_title text,row_description text,row_category text,row_mode text,row_enabled boolean,row_items jsonb) returns public.editorial_ribbons language plpgsql security definer set search_path='' as $$declare saved public.editorial_ribbons;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
perform pg_advisory_xact_lock(71883001);
if jsonb_typeof(row_items)<>'array' or exists(select 1 from jsonb_array_elements_text(row_items) p where p!~'^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' or length(p)>220) or (select count(*)<>count(distinct p) from jsonb_array_elements_text(row_items) p) then raise check_violation;end if;
if row_id is null then insert into public.editorial_ribbons(title,description,category,mode,enabled,items,position) values(row_title,row_description,row_category,row_mode,row_enabled,row_items,(select coalesce(max(position),0)+1 from public.editorial_ribbons)) returning * into saved;
else update public.editorial_ribbons set title=row_title,description=row_description,category=row_category,mode=row_mode,enabled=row_enabled,items=row_items,revision=revision+1,updated_at=now() where id=row_id and revision=expected_revision returning * into saved;if not found then raise exception using errcode='40001',message='Ribbon changed';end if;end if;
if row_enabled then update public.editorial_settings set custom_rows=true where id=true;end if;return saved;end$$;
create or replace function public.reposhelf_delete_ribbon(row_id uuid,expected_revision integer) returns void language plpgsql security definer set search_path='' as $$begin if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;perform pg_advisory_xact_lock(71883001);delete from public.editorial_ribbons where id=row_id and revision=expected_revision;if not found then raise exception using errcode='40001',message='Ribbon changed';end if;end$$;
create or replace function public.reposhelf_reorder_ribbons(ordered_ids uuid[]) returns void language plpgsql security definer set search_path='' as $$begin if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;perform pg_advisory_xact_lock(71883001);if cardinality(ordered_ids)<>(select count(*) from public.editorial_ribbons) or cardinality(ordered_ids)<>(select count(distinct x) from unnest(ordered_ids) x) or exists(select 1 from unnest(ordered_ids) x where not exists(select 1 from public.editorial_ribbons where id=x)) then raise exception using errcode='40001',message='Ribbon order changed';end if;update public.editorial_ribbons r set position=ids.pos,revision=revision+1,updated_at=now() from unnest(ordered_ids) with ordinality ids(id,pos) where r.id=ids.id;end$$;
revoke all on function public.reposhelf_set_editorial(boolean),public.reposhelf_save_ribbon(uuid,integer,text,text,text,text,boolean,jsonb),public.reposhelf_delete_ribbon(uuid,integer),public.reposhelf_reorder_ribbons(uuid[]) from public,anon,authenticated;
grant execute on function public.reposhelf_set_editorial(boolean),public.reposhelf_save_ribbon(uuid,integer,text,text,text,text,boolean,jsonb),public.reposhelf_delete_ribbon(uuid,integer),public.reposhelf_reorder_ribbons(uuid[]) to authenticated;

create table if not exists public.analytics_events(event_id uuid primary key,kind text not null check(kind in('page_view','listing_view','demo_click','fork_click','search')),session_hash text not null,visitor_hash text not null,project_id text,created_at timestamptz not null default now());
create index if not exists analytics_time on public.analytics_events(created_at);
create table if not exists public.analytics_limits(session_hash text not null,bucket_at timestamptz not null,count integer not null default 0,primary key(session_hash,bucket_at));
create table if not exists public.analytics_daily(day date primary key,visits bigint not null default 0,visitors bigint not null default 0,page_views bigint not null default 0,listing_views bigint not null default 0,demo_clicks bigint not null default 0,fork_clicks bigint not null default 0,searches bigint not null default 0);
create table if not exists public.analytics_sessions(day date not null,session_hash text not null,primary key(day,session_hash));
create table if not exists public.analytics_visitors(day date not null,visitor_hash text not null,primary key(day,visitor_hash));
alter table public.analytics_events enable row level security;alter table public.analytics_limits enable row level security;alter table public.analytics_daily enable row level security;alter table public.analytics_sessions enable row level security;alter table public.analytics_visitors enable row level security;
revoke all on public.analytics_events,public.analytics_limits,public.analytics_daily,public.analytics_sessions,public.analytics_visitors from anon,authenticated;
create policy analytics_admin on public.analytics_daily for select to authenticated using(public.reposhelf_is_admin());
create policy analytics_events_admin on public.analytics_events for select to authenticated using(public.reposhelf_is_admin());
grant select on public.analytics_daily,public.analytics_events to authenticated;
grant all on public.analytics_events,public.analytics_limits,public.analytics_daily,public.analytics_sessions,public.analytics_visitors to service_role;
create or replace function public.reposhelf_ingest_events(events jsonb) returns integer language plpgsql security definer set search_path='' as $$declare e jsonb; saved integer:=0; n integer; utcday date:=(now() at time zone 'UTC')::date; win timestamptz:=date_trunc('minute',now());begin
if jsonb_typeof(events)<>'array' or jsonb_array_length(events)>10 then raise check_violation;end if;
for e in select * from jsonb_array_elements(events) loop
if e->>'session_hash'!~'^[a-f0-9]{64}$' or e->>'visitor_hash'!~'^[a-f0-9]{64}$' then raise check_violation;end if;
insert into public.analytics_limits(session_hash,bucket_at,count) values(e->>'session_hash',win,1) on conflict(session_hash,bucket_at) do update set count=analytics_limits.count+1 returning count into n;
if n>120 then continue;end if;
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,project_id) values((e->>'event_id')::uuid,e->>'kind',e->>'session_hash',e->>'visitor_hash',e->>'project_id') on conflict do nothing;
if not found then continue;end if;saved:=saved+1;
insert into public.analytics_daily(day) values(utcday) on conflict do nothing;
insert into public.analytics_sessions values(utcday,e->>'session_hash') on conflict do nothing;
if found then update public.analytics_daily set visits=visits+1 where day=utcday;end if;
insert into public.analytics_visitors values(utcday,e->>'visitor_hash') on conflict do nothing;
if found then update public.analytics_daily set visitors=visitors+1 where day=utcday;end if;
update public.analytics_daily set page_views=page_views+(case when e->>'kind'='page_view' then 1 else 0 end),listing_views=listing_views+(case when e->>'kind'='listing_view' then 1 else 0 end),demo_clicks=demo_clicks+(case when e->>'kind'='demo_click' then 1 else 0 end),fork_clicks=fork_clicks+(case when e->>'kind'='fork_click' then 1 else 0 end),searches=searches+(case when e->>'kind'='search' then 1 else 0 end) where day=utcday;
end loop;
-- Deduplicated daily totals remain; detailed events have a 90-day retention bucket_at.
if pg_try_advisory_xact_lock(71883002) then delete from public.analytics_limits where bucket_at<now()-interval '1 hour';delete from public.analytics_events where created_at<now()-interval '90 days';delete from public.analytics_sessions where day<utcday-90;delete from public.analytics_visitors where day<utcday-90;end if;
return saved;end$$;
revoke all on function public.reposhelf_ingest_events(jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_ingest_events(jsonb) to service_role;
create or replace function public.reposhelf_analytics(days integer default 30) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;if days not between 1 and 90 then raise check_violation;end if;
select jsonb_build_object('daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from public.analytics_daily d where day>=(now() at time zone 'UTC')::date-days+1),'[]'::jsonb),'totalLikes',(select count(*) from public.user_likes),'likesAdded',(select count(*) from public.user_likes where created_at>=now()-make_interval(days=>days)),'topListings',coalesce((select jsonb_agg(t) from (select project_id,count(*) as views from public.analytics_events where kind='listing_view' and project_id is not null and created_at>=now()-make_interval(days=>days) group by project_id order by count(*) desc limit 10) t),'[]'::jsonb)) into result;return result;end$$;
revoke all on function public.reposhelf_analytics(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_analytics(integer) to authenticated;
commit;

begin;
-- Historical daily hashes cannot identify returning browsers across days.
alter table public.analytics_events add column if not exists period_visitor_hash text check(period_visitor_hash ~ '^[a-f0-9]{64}$');
create index if not exists analytics_period_visitors on public.analytics_events(created_at,period_visitor_hash) where period_visitor_hash is not null;
create table if not exists public.analytics_unique_tracking(id boolean primary key check(id),started_at timestamptz not null default now());
alter table public.analytics_unique_tracking enable row level security;
revoke all on public.analytics_unique_tracking from public,anon,authenticated;
insert into public.analytics_unique_tracking(id) values(true) on conflict do nothing;
create or replace function public.reposhelf_ingest_events(events jsonb) returns integer language plpgsql security definer set search_path='' as $$declare e jsonb; saved integer:=0; n integer; utcday date:=(now() at time zone 'UTC')::date; win timestamptz:=date_trunc('minute',now());begin
if jsonb_typeof(events)<>'array' or jsonb_array_length(events)>10 then raise check_violation;end if;
for e in select * from jsonb_array_elements(events) loop
if e->>'session_hash'!~'^[a-f0-9]{64}$' or e->>'visitor_hash'!~'^[a-f0-9]{64}$' then raise check_violation;end if;
insert into public.analytics_limits(session_hash,bucket_at,count) values(e->>'session_hash',win,1) on conflict(session_hash,bucket_at) do update set count=analytics_limits.count+1 returning count into n;
if n>120 then continue;end if;
if e->>'period_visitor_hash' is not null and e->>'period_visitor_hash'!~'^[a-f0-9]{64}$' then raise check_violation;end if;
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,project_id,period_visitor_hash) values((e->>'event_id')::uuid,e->>'kind',e->>'session_hash',e->>'visitor_hash',e->>'project_id',e->>'period_visitor_hash') on conflict do nothing;
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
select jsonb_build_object('uniqueVisitors',(select count(distinct period_visitor_hash) from public.analytics_events where created_at>=(((now() at time zone 'UTC')::date-days+1)::timestamp at time zone 'UTC') and period_visitor_hash is not null),'uniqueVisitorsSince',(select started_at from public.analytics_unique_tracking where id=true),'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from public.analytics_daily d where day>=(now() at time zone 'UTC')::date-days+1),'[]'::jsonb),'totalLikes',(select count(*) from public.user_likes),'likesAdded',(select count(*) from public.user_likes where created_at>=now()-make_interval(days=>days)),'topListings',coalesce((select jsonb_agg(t) from (select project_id,count(*) as views from public.analytics_events where kind='listing_view' and project_id is not null and created_at>=now()-make_interval(days=>days) group by project_id order by count(*) desc limit 10) t),'[]'::jsonb)) into result;return result;end$$;
revoke all on function public.reposhelf_analytics(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_analytics(integer) to authenticated;
commit;

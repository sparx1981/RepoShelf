begin;
-- Aggregates have no account, browser, session, IP or prompt fields.
create table if not exists public.analytics_search_daily(day date not null,source text not null check(source in('website','mcp')),term text not null check(length(term) between 2 and 80),searches bigint not null default 0,primary key(day,source,term));
create table if not exists public.analytics_country_daily(day date not null,country text not null check(country ~ '^[A-Z]{2}$'),page_views bigint not null default 0,primary key(day,country));
-- Two-day minute buckets support the rolling 24-hour view without individual history.
create table if not exists public.analytics_search_recent(bucket_at timestamptz not null,source text not null check(source in('website','mcp')),term text not null check(length(term) between 2 and 80),searches bigint not null default 0,primary key(bucket_at,source,term));
create table if not exists public.analytics_country_recent(bucket_at timestamptz not null,country text not null check(country ~ '^[A-Z]{2}$'),page_views bigint not null default 0,primary key(bucket_at,country));
-- A boolean on an existing event makes aggregate enrichment retry-safe; no query is stored here.
alter table public.analytics_events add column if not exists aggregate_recorded boolean not null default false;
alter table public.analytics_search_daily enable row level security;
alter table public.analytics_country_daily enable row level security;
alter table public.analytics_search_recent enable row level security;
alter table public.analytics_country_recent enable row level security;
revoke all on public.analytics_search_daily,public.analytics_country_daily from public,anon,authenticated;
grant all on public.analytics_search_daily,public.analytics_country_daily to service_role;
revoke all on public.analytics_search_recent,public.analytics_country_recent from public,anon,authenticated;
grant all on public.analytics_search_recent,public.analytics_country_recent to service_role;

create or replace function public.reposhelf_safe_search(term text) returns boolean language sql immutable set search_path='' as $$
 select term is not null and length(term) between 2 and 80 and term ~ '^[[:alpha:] +#.-]+$' and term !~* '(password|secret|token|api[ -]?key|bearer)' and array_length(string_to_array(term,' '),1)<=8
$$;
revoke all on function public.reposhelf_safe_search(text) from public,anon,authenticated;

create or replace function public.reposhelf_enrich_analytics(events jsonb,country text default null) returns void language plpgsql security definer set search_path='' as $$
declare e jsonb; row_event public.analytics_events; term text; d date;
begin
 if jsonb_typeof(events)<>'array' or jsonb_array_length(events)>10 then raise check_violation;end if;
 for e in select * from jsonb_array_elements(events) loop
  update public.analytics_events set aggregate_recorded=true where event_id=(e->>'id')::uuid and aggregate_recorded=false and created_at>=now()-interval '10 minutes' returning * into row_event;
  if not found then continue;end if;
  d:=(row_event.created_at at time zone 'UTC')::date;
  term:=lower(trim(e->>'term'));
  if row_event.kind='search' and public.reposhelf_safe_search(term) then
   insert into public.analytics_search_daily values(d,'website',term,1) on conflict on constraint analytics_search_daily_pkey do update set searches=analytics_search_daily.searches+1;
   insert into public.analytics_search_recent values(date_trunc('minute',row_event.created_at),'website',term,1) on conflict on constraint analytics_search_recent_pkey do update set searches=analytics_search_recent.searches+1;
  end if;
  if row_event.kind='page_view' and country ~ '^[A-Z]{2}$' and country not in('XX','ZZ') then
   insert into public.analytics_country_daily values(d,country,1) on conflict on constraint analytics_country_daily_pkey do update set page_views=analytics_country_daily.page_views+1;
   insert into public.analytics_country_recent values(date_trunc('minute',row_event.created_at),country,1) on conflict on constraint analytics_country_recent_pkey do update set page_views=analytics_country_recent.page_views+1;
  end if;
 end loop;
 delete from public.analytics_search_daily where day<(now() at time zone 'UTC')::date-730;
 delete from public.analytics_country_daily where day<(now() at time zone 'UTC')::date-730;
 delete from public.analytics_search_recent where bucket_at<now()-interval '48 hours';
 delete from public.analytics_country_recent where bucket_at<now()-interval '48 hours';
end$$;
create or replace function public.reposhelf_record_mcp_search(term text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.reposhelf_safe_search(term) then return;end if;
 insert into public.analytics_search_daily values((now() at time zone 'UTC')::date,'mcp',term,1) on conflict on constraint analytics_search_daily_pkey do update set searches=analytics_search_daily.searches+1;
 insert into public.analytics_search_recent values(date_trunc('minute',now()),'mcp',term,1) on conflict on constraint analytics_search_recent_pkey do update set searches=analytics_search_recent.searches+1;
 delete from public.analytics_search_daily where day<(now() at time zone 'UTC')::date-730;
 delete from public.analytics_search_recent where bucket_at<now()-interval '48 hours';
end$$;
revoke all on function public.reposhelf_enrich_analytics(jsonb,text),public.reposhelf_record_mcp_search(text) from public,anon,authenticated;
grant execute on function public.reposhelf_enrich_analytics(jsonb,text),public.reposhelf_record_mcp_search(text) to service_role;

-- Store counters and aggregates atomically. Retries keep the original event IDs.
create or replace function public.reposhelf_ingest_analytics_v2(events jsonb,details jsonb,country text default null) returns integer language plpgsql security definer set search_path='' as $$
declare saved integer;
begin
 saved:=public.reposhelf_ingest_events(events);
 perform public.reposhelf_enrich_analytics(details,country);
 return saved;
end$$;
revoke all on function public.reposhelf_ingest_analytics_v2(jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.reposhelf_ingest_analytics_v2(jsonb,jsonb,text) to service_role;

-- Daily aggregates survive the 90-day event retention. Missing history is explicit.
-- 24 hours uses exact rolling timestamps; longer ranges include today's partial UTC day.
create or replace function public.reposhelf_traffic_period(p_days integer,p_previous boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare finish_at timestamptz:=now(); start_at timestamptz; first_day date; last_day date; result jsonb; available_since timestamptz;
begin
 if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
 if p_days not in(1,7,30,90,180,365) then raise check_violation;end if;
 if p_previous then finish_at:=finish_at-make_interval(days=>p_days);end if;
 start_at:=finish_at-make_interval(days=>p_days);
 first_day:=(finish_at at time zone 'UTC')::date-p_days+1;
 last_day:=(finish_at at time zone 'UTC')::date;
 select min(day)::timestamp at time zone 'UTC' into available_since from public.analytics_daily;
 if p_days=1 then
  select jsonb_build_object('visits',count(distinct session_hash),'visitors',count(distinct ((created_at at time zone 'UTC')::date,visitor_hash)),'uniqueVisitors',count(distinct period_visitor_hash),'page_views',count(*) filter(where kind='page_view'),'listing_views',count(*) filter(where kind='listing_view'),'demo_clicks',count(*) filter(where kind='demo_click'),'fork_clicks',count(*) filter(where kind='fork_click'),'searches',count(*) filter(where kind='search')) into result from public.analytics_events where created_at>=start_at and created_at<finish_at;
 else
  select jsonb_build_object('visits',coalesce(sum(visits),0),'visitors',coalesce(sum(visitors),0),'page_views',coalesce(sum(page_views),0),'listing_views',coalesce(sum(listing_views),0),'demo_clicks',coalesce(sum(demo_clicks),0),'fork_clicks',coalesce(sum(fork_clicks),0),'searches',coalesce(sum(searches),0)) into result from public.analytics_daily where day between first_day and last_day;
  -- Do not imply that expired event identifiers can count cross-day unique browsers.
  if (case when p_previous then p_days*2 else p_days end)<=90 then
   result:=result||jsonb_build_object('uniqueVisitors',(select count(distinct period_visitor_hash) from public.analytics_events where created_at>=(first_day::timestamp at time zone 'UTC') and created_at<(case when p_previous then (last_day+1)::timestamp at time zone 'UTC' else finish_at end)));
  else result:=result||jsonb_build_object('uniqueVisitors',null);end if;
 end if;
 return result||jsonb_build_object('availableSince',available_since,'complete',available_since is not null and available_since<=case when p_days=1 then start_at else first_day::timestamp at time zone 'UTC' end,'from',case when p_days=1 then start_at else first_day::timestamp at time zone 'UTC' end,'to',finish_at);
end$$;
revoke all on function public.reposhelf_traffic_period(integer,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_traffic_period(integer,boolean) to authenticated;

create or replace function public.reposhelf_admin_traffic(p_days integer default 30) returns jsonb language plpgsql security definer set search_path='' as $$
declare first_day date:=(now() at time zone 'UTC')::date-p_days+1;
begin
 if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
 if p_days not in(1,7,30,90,180,365) then raise check_violation;end if;
 return jsonb_build_object('current',public.reposhelf_traffic_period(p_days,false),'previous',public.reposhelf_traffic_period(p_days,true),
 'daily',coalesce((select jsonb_agg(to_jsonb(d) order by day) from public.analytics_daily d where day>=first_day),'[]'::jsonb),
 'searchTerms',coalesce((select jsonb_agg(to_jsonb(t)) from (select source,term,sum(searches) as searches from (select source,term,searches from public.analytics_search_daily where p_days<>1 and day>=first_day union all select source,term,searches from public.analytics_search_recent where p_days=1 and bucket_at>=date_trunc('minute',now()-interval '24 hours')) q group by source,term having sum(searches)>=3 order by sum(searches) desc,term limit 30)t),'[]'::jsonb),
 'countries',coalesce((select jsonb_agg(to_jsonb(t)) from (select country,sum(page_views) as page_views from (select country,page_views from public.analytics_country_daily where p_days<>1 and day>=first_day union all select country,page_views from public.analytics_country_recent where p_days=1 and bucket_at>=date_trunc('minute',now()-interval '24 hours')) q group by country having sum(page_views)>=3 order by sum(page_views) desc,country limit 60)t),'[]'::jsonb),
 'aggregateWindow','Rolling 24 hours in minute buckets; longer periods use UTC dates',
 'checkedAt',clock_timestamp());
end$$;
revoke all on function public.reposhelf_admin_traffic(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_admin_traffic(integer) to authenticated;

create or replace function public.reposhelf_admin_overview() returns jsonb language plpgsql security definer set search_path='' as $$
declare periods jsonb:='[]'; d integer; cutoff timestamptz;
begin
 if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
 foreach d in array array[1,7,30,180,365] loop
  cutoff:=now()-make_interval(days=>d);
  periods:=periods||jsonb_build_array(jsonb_build_object('days',d,'current',public.reposhelf_traffic_period(d,false),'previous',public.reposhelf_traffic_period(d,true),'signups',(select count(*) from auth.users where created_at>=cutoff),'previousSignups',(select count(*) from auth.users where created_at>=cutoff-make_interval(days=>d) and created_at<cutoff)));
 end loop;
 return jsonb_build_object('users',(select count(*) from auth.users),'periods',periods,'checkedAt',clock_timestamp());
end$$;
revoke all on function public.reposhelf_admin_overview() from public,anon,authenticated;
grant execute on function public.reposhelf_admin_overview() to authenticated;
commit;

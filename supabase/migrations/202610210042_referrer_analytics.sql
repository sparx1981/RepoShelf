begin;
-- Only the referring website name is kept, as a daily total. No path, query string, session, browser or account is stored with it.
create table if not exists public.analytics_referrer_daily(day date not null,host text not null check(host ~ '^[a-z0-9.-]{3,80}$'),page_views bigint not null default 0,primary key(day,host));
alter table public.analytics_referrer_daily enable row level security;
revoke all on public.analytics_referrer_daily from public,anon,authenticated;
grant all on public.analytics_referrer_daily to service_role;

create or replace function public.reposhelf_enrich_analytics(events jsonb,country text default null) returns void language plpgsql security definer set search_path='' as $$
declare e jsonb; row_event public.analytics_events; term text; d date; ref text;
begin
 if jsonb_typeof(events)<>'array' or jsonb_array_length(events)>10 then raise check_violation;end if;
 for e in select * from jsonb_array_elements(events) loop
  update public.analytics_events set aggregate_recorded=true where event_id=(e->>'id')::uuid and aggregate_recorded=false and created_at>=now()-interval '10 minutes' returning * into row_event;
  if not found then continue;end if;
  d:=(row_event.created_at at time zone 'UTC')::date;
  term:=lower(trim(e->>'term'));
  ref:=lower(trim(e->>'ref'));
  if row_event.kind='search' and public.reposhelf_safe_search(term) then
   insert into public.analytics_search_daily values(d,'website',term,1) on conflict on constraint analytics_search_daily_pkey do update set searches=analytics_search_daily.searches+1;
   insert into public.analytics_search_recent values(date_trunc('minute',row_event.created_at),'website',term,1) on conflict on constraint analytics_search_recent_pkey do update set searches=analytics_search_recent.searches+1;
  end if;
  if row_event.kind='page_view' and country ~ '^[A-Z]{2}$' and country not in('XX','ZZ') then
   insert into public.analytics_country_daily values(d,country,1) on conflict on constraint analytics_country_daily_pkey do update set page_views=analytics_country_daily.page_views+1;
   insert into public.analytics_country_recent values(date_trunc('minute',row_event.created_at),country,1) on conflict on constraint analytics_country_recent_pkey do update set page_views=analytics_country_recent.page_views+1;
  end if;
  if row_event.kind='page_view' and ref ~ '^[a-z0-9.-]{3,80}$' then
   insert into public.analytics_referrer_daily values(d,ref,1) on conflict on constraint analytics_referrer_daily_pkey do update set page_views=analytics_referrer_daily.page_views+1;
  end if;
 end loop;
 delete from public.analytics_search_daily where day<(now() at time zone 'UTC')::date-730;
 delete from public.analytics_country_daily where day<(now() at time zone 'UTC')::date-730;
 delete from public.analytics_referrer_daily where day<(now() at time zone 'UTC')::date-730;
 delete from public.analytics_search_recent where bucket_at<now()-interval '48 hours';
 delete from public.analytics_country_recent where bucket_at<now()-interval '48 hours';
end$$;
revoke all on function public.reposhelf_enrich_analytics(jsonb,text) from public,anon,authenticated;
grant execute on function public.reposhelf_enrich_analytics(jsonb,text) to service_role;

-- Same report as before plus "referrers": websites that sent at least three page views in the period (UTC dates; the 24-hour view covers today and yesterday).
create or replace function public.reposhelf_admin_traffic(p_days integer default 30) returns jsonb language plpgsql security definer set search_path='' as $$
declare first_day date:=(now() at time zone 'UTC')::date-p_days+1;
begin
 if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
 if p_days not in(1,7,30,90,180,365) then raise check_violation;end if;
 return jsonb_build_object('current',public.reposhelf_traffic_period(p_days,false),'previous',public.reposhelf_traffic_period(p_days,true),
 'daily',coalesce((select jsonb_agg(to_jsonb(d) order by day) from public.analytics_daily d where day>=first_day),'[]'::jsonb),
 'searchTerms',coalesce((select jsonb_agg(to_jsonb(t)) from (select source,term,sum(searches) as searches from (select source,term,searches from public.analytics_search_daily where p_days<>1 and day>=first_day union all select source,term,searches from public.analytics_search_recent where p_days=1 and bucket_at>=date_trunc('minute',now()-interval '24 hours')) q group by source,term having sum(searches)>=3 order by sum(searches) desc,term limit 30)t),'[]'::jsonb),
 'countries',coalesce((select jsonb_agg(to_jsonb(t)) from (select country,sum(page_views) as page_views from (select country,page_views from public.analytics_country_daily where p_days<>1 and day>=first_day union all select country,page_views from public.analytics_country_recent where p_days=1 and bucket_at>=date_trunc('minute',now()-interval '24 hours')) q group by country having sum(page_views)>=3 order by sum(page_views) desc,country limit 60)t),'[]'::jsonb),
 'referrers',coalesce((select jsonb_agg(to_jsonb(t)) from (select host,sum(page_views) as page_views from public.analytics_referrer_daily where day>=case when p_days=1 then first_day-1 else first_day end group by host having sum(page_views)>=3 order by sum(page_views) desc,host limit 30)t),'[]'::jsonb),
 'aggregateWindow','Rolling 24 hours in minute buckets; longer periods use UTC dates',
 'checkedAt',clock_timestamp());
end$$;
revoke all on function public.reposhelf_admin_traffic(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_admin_traffic(integer) to authenticated;
notify pgrst,'reload schema';
commit;

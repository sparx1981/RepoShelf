begin;
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001') on conflict do nothing;
delete from public.reposhelf_admins where user_id='00000000-0000-0000-0000-000000000002';
-- Isolate boundary tests from the preceding migration fixtures.
truncate public.analytics_events,public.analytics_daily,public.analytics_search_daily,public.analytics_country_daily;
insert into public.analytics_daily(day,page_views,visitors,demo_clicks) values
 ((now() at time zone 'UTC')::date,10,2,5),
 ((now() at time zone 'UTC')::date-7,4,1,2),
 ((now() at time zone 'UTC')::date-400,3,1,1);
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,period_visitor_hash,created_at) values
 ('28000000-0000-0000-0000-000000000001','search',repeat('a',64),repeat('b',64),repeat('c',64),now()-interval '2 hours'),
 ('28000000-0000-0000-0000-000000000002','search',repeat('a',64),repeat('b',64),repeat('c',64),now()-interval '25 hours'),
 ('28000000-0000-0000-0000-000000000003','page_view',repeat('a',64),repeat('b',64),repeat('c',64),now());
set role service_role;
select public.reposhelf_enrich_analytics('[{"id":"28000000-0000-0000-0000-000000000003"}]','GB');
select public.reposhelf_enrich_analytics('[{"id":"28000000-0000-0000-0000-000000000003"}]','GB');
select public.reposhelf_record_mcp_search('react');
select public.reposhelf_record_mcp_search('react');
select public.reposhelf_record_mcp_search('me@example.org');
reset role;
do $$begin
 if (select sum(page_views) from public.analytics_country_daily)<>1 then raise exception 'Country enrichment not idempotent';end if;
 if exists(select 1 from public.analytics_search_daily where term like '%@%') then raise exception 'Personal-looking term stored';end if;
end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$declare r jsonb;begin
 r:=public.reposhelf_admin_traffic(1);
 if (r->'current'->>'searches')::int<>1 or (r->'previous'->>'searches')::int<>1 then raise exception 'Rolling 24-hour cutoff failed';end if;
 if jsonb_array_length(r->'searchTerms')<>0 then raise exception 'Rare terms shown';end if;
 r:=public.reposhelf_admin_traffic(7);
 if (r->'current'->>'page_views')::int<>10 or (r->'previous'->>'page_views')::int<>4 then raise exception 'Previous equal period incorrect';end if;
 r:=public.reposhelf_admin_traffic(365);
 if r->'current'->>'uniqueVisitors' is not null then raise exception 'Expired unique hashes represented as complete';end if;
 if (r->'previous'->>'complete')::boolean then raise exception 'Missing older history represented as complete';end if;
 if jsonb_array_length(public.reposhelf_admin_overview()->'periods')<>5 then raise exception 'Overview periods missing';end if;
 begin perform public.reposhelf_record_mcp_search('react');raise exception 'Member can insert search aggregates';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.analytics_search_daily;raise exception 'Aggregate table directly readable';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$begin
 begin perform public.reposhelf_admin_overview();raise exception 'Member overview allowed';exception when insufficient_privilege then null;end;
 begin perform public.reposhelf_admin_traffic(30);raise exception 'Member traffic allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
set role service_role;
select public.reposhelf_record_mcp_search('react');
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$begin if jsonb_array_length(public.reposhelf_admin_traffic(30)->'searchTerms')<>1 then raise exception 'Popular term not reported at threshold';end if;end$$;
reset role;
set role service_role;
do $$declare event jsonb;details jsonb;begin
 event:=jsonb_build_array(jsonb_build_object('event_id','28000000-0000-0000-0000-000000000010','kind','search','session_hash',repeat('a',64),'visitor_hash',repeat('b',64),'period_visitor_hash',repeat('c',64)));
 details:='[{"id":"28000000-0000-0000-0000-000000000010","term":"dashboard"}]';
 perform public.reposhelf_ingest_analytics_v2(event,details,null);
 perform public.reposhelf_ingest_analytics_v2(event,details,null);
 if (select sum(searches) from public.analytics_search_daily where source='website' and term='dashboard')<>1 then raise exception 'Atomic ingestion duplicated term';end if;
 begin
  event:=jsonb_build_array(jsonb_build_object('event_id','28000000-0000-0000-0000-000000000011','kind','search','session_hash',repeat('a',64),'visitor_hash',repeat('b',64)));
  perform public.reposhelf_ingest_analytics_v2(event,'[{"id":"invalid"}]',null);
  raise exception 'Invalid details accepted';
 exception when invalid_text_representation then null;end;
 if exists(select 1 from public.analytics_events where event_id='28000000-0000-0000-0000-000000000011') then raise exception 'Failed aggregate left partial event';end if;
end$$;
reset role;
rollback;
select 'PASS: 24-hour boundaries, previous periods, long-range retention, aggregate threshold, idempotency and admin/service permissions.' as result;

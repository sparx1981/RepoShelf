-- Referring websites are daily totals only: idempotent per event, garbage rejected, small counts hidden from the admin report.
truncate public.analytics_events,public.analytics_daily,public.analytics_referrer_daily;
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,period_visitor_hash,created_at)
select ('42000000-0000-0000-0000-00000000000'||n)::uuid,'page_view',repeat('a',64),repeat('b',64),repeat('c',64),now() from generate_series(1,5) n;
set role service_role;
select public.reposhelf_enrich_analytics('[{"id":"42000000-0000-0000-0000-000000000001","ref":"Reddit.com"},{"id":"42000000-0000-0000-0000-000000000002","ref":"reddit.com"},{"id":"42000000-0000-0000-0000-000000000003","ref":"reddit.com"},{"id":"42000000-0000-0000-0000-000000000004","ref":"https://bad.example/x?token=1"},{"id":"42000000-0000-0000-0000-000000000005","ref":"rare.example"}]','GB');
select public.reposhelf_enrich_analytics('[{"id":"42000000-0000-0000-0000-000000000001","ref":"reddit.com"},{"id":"42000000-0000-0000-0000-000000000002","ref":"reddit.com"}]','GB');
reset role;
do $$begin
 if (select page_views from public.analytics_referrer_daily where host='reddit.com')<>3 then raise exception 'Referrer counted twice or missed';end if;
 if exists(select 1 from public.analytics_referrer_daily where host like '%/%' or host like '%?%') then raise exception 'Referrer path stored';end if;
 if (select count(*) from public.analytics_referrer_daily)<>2 then raise exception 'Unexpected referrer rows';end if;
end$$;

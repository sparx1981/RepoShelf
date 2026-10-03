-- Same browser across sessions and dates counts once for the range.
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,period_visitor_hash,created_at) values
('20000000-0000-0000-0000-000000000001','page_view',repeat('a',64),repeat('b',64),repeat('c',64),now()),
('20000000-0000-0000-0000-000000000002','page_view',repeat('d',64),repeat('e',64),repeat('c',64),(now() at time zone 'UTC')::date-1+time '12:00'),
('20000000-0000-0000-0000-000000000003','page_view',repeat('f',64),repeat('a',64),repeat('d',64),(now() at time zone 'UTC')::date-1+time '12:00'),
('20000000-0000-0000-0000-000000000004','page_view',repeat('a',64),repeat('b',64),repeat('e',64),now()-interval '40 days');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$begin
if (public.reposhelf_analytics(30)->>'uniqueVisitors')::int<>2 then raise exception 'Returning visitor counted twice or legacy hashes included';end if;
if (public.reposhelf_analytics(1)->>'uniqueVisitors')::int<>1 then raise exception 'One-day boundary incorrect';end if;
if (public.reposhelf_analytics(90)->>'uniqueVisitors')::int<>3 then raise exception 'Longer range incorrect';end if;
if public.reposhelf_analytics(30)->>'uniqueVisitorsSince' is null then raise exception 'Missing coverage start';end if;
begin perform count(*) from public.analytics_unique_tracking;raise exception 'Tracking settings directly readable';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin begin perform public.reposhelf_analytics(30);raise exception 'Member analytics allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
delete from public.analytics_events where event_id::text like '20000000-%';
select 'PASS: unique browsers deduplicate across days and sessions, respect date ranges, exclude legacy hashes and remain admin-only.' as result;

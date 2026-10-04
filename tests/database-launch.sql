begin;
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001') on conflict do nothing;
set role anon;
do $$begin
begin perform public.reposhelf_report_listing('team/app','broken_demo','Issue');raise exception 'Anonymous report allowed';exception when insufficient_privilege then null;end;
begin perform count(*) from public.listing_reports;raise exception 'Anonymous reports leaked';exception when insufficient_privilege then null;end;
end$$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$declare receipt jsonb;begin
receipt:=public.reposhelf_report_listing('team/app','broken_demo','Private explanation');if receipt->>'status'<>'open' then raise exception 'Report receipt missing';end if;
if (public.reposhelf_report_listing('team/app','broken_demo','Duplicate')->>'duplicate')::boolean is not true then raise exception 'Duplicate report accepted';end if;
for i in 1..9 loop perform public.reposhelf_report_listing('team/item'||i,'other','Issue');end loop;begin perform public.reposhelf_report_listing('team/overflow','other','Issue');raise exception 'Report rate limit not enforced';exception when sqlstate 'PT429' then null;end;
if exists(select 1 from public.listing_reports) then raise exception 'Private reports exposed to member';end if;
begin perform public.reposhelf_moderate_listing('team/app',0,'{"visibility":"excluded"}','Member attempt');raise exception 'Member moderation allowed';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_launch_analytics(30);raise exception 'Member funnel access allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare receipt public.listing_reports;c public.listing_controls;begin
select * into receipt from public.listing_reports where project_id='team/app';if receipt.explanation<>'Private explanation' then raise exception 'Report changed';end if;
c:=public.reposhelf_moderate_listing('team/app',0,'{"visibility":"excluded","description":"Editorial description","refresh":true}','Private admin note');if c.revision<>1 or c.refresh_requested_at is null then raise exception 'Control not saved';end if;
begin perform public.reposhelf_moderate_listing('team/app',0,'{"visibility":"visible"}','Stale');raise exception 'Stale moderation accepted';exception when serialization_failure then null;end;
perform public.reposhelf_review_report(receipt.id,receipt.revision,'reviewed','Investigated');
if (select count(*) from public.listing_moderation_audit where project_id='team/app')<>2 then raise exception 'Missing audit';end if;
end$$;
reset role;
set role anon;
do $$declare controls text;begin
controls:=public.reposhelf_public_listing_controls()::text;if controls not like '%excluded%' then raise exception 'Public controls missing';end if;if controls like '%Private%' or controls like '%reporter%' or controls like '%actor%' then raise exception 'Private report/audit leaked';end if;
end$$;
reset role;
update public.analytics_launch_tracking set started_at=now()-interval '3 days';
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,period_visitor_hash,project_id,shelf,created_at) values
('a0000000-0000-0000-0000-000000000001','listing_view',repeat('a',64),repeat('b',64),repeat('c',64),'team/app','hero',now()-interval '6 minutes'),
('a0000000-0000-0000-0000-000000000002','demo_click',repeat('a',64),repeat('b',64),repeat('c',64),'team/app','hero',now()-interval '5 minutes'),
('a0000000-0000-0000-0000-000000000003','like',repeat('a',64),repeat('b',64),repeat('c',64),'team/app','hero',now()-interval '4 minutes'),
('a0000000-0000-0000-0000-000000000004','like',repeat('d',64),repeat('e',64),repeat('f',64),'team/other','all',now()-interval '6 minutes'),
('a0000000-0000-0000-0000-000000000005','demo_click',repeat('d',64),repeat('e',64),repeat('f',64),'team/other','all',now()-interval '5 minutes'),
('a0000000-0000-0000-0000-000000000006','sign_in_start',repeat('a',64),repeat('b',64),repeat('c',64),null,null,now()-interval '4 minutes'),
('a0000000-0000-0000-0000-000000000007','sign_in_complete',repeat('a',64),repeat('b',64),repeat('c',64),null,null,now()-interval '3 minutes'),
('a0000000-0000-0000-0000-000000000008','page_view',repeat('x',64),repeat('y',64),repeat('c',64),null,null,now()-interval '1 day');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare stats jsonb;begin
stats:=public.reposhelf_launch_analytics(30);if (stats->>'viewToDemo')::int<>1 or (stats->>'demoToLike')::int<>1 or (stats->>'signInCompletions')::int<>1 or (stats->>'returningVisitors')::int<>1 then raise exception 'Incorrect conversion sequence: %',stats;end if;
if jsonb_array_length(stats->'rows')<>2 then raise exception 'Row attribution missing';end if;
end$$;
reset role;
rollback;
select 'PASS: private reporting, GitHub identity, admin-only revisions/audit, public exclusion controls and consented conversion sequences.' as result;

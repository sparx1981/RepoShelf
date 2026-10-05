begin;
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,project_id,created_at) values
('30000000-0000-0000-0000-000000000001','listing_view',repeat('a',64),repeat('b',64),'qa/Popular',now()),
('30000000-0000-0000-0000-000000000002','listing_view',repeat('a',64),repeat('b',64),'qa/popular',now()),
('30000000-0000-0000-0000-000000000003','listing_view',repeat('a',64),repeat('b',64),'qa/old',now()-interval '31 days'),
('30000000-0000-0000-0000-000000000004','demo_click',repeat('a',64),repeat('b',64),'qa/demo',now());
set role service_role;
do $$begin
if (select clicks from public.reposhelf_listing_popularity() where project_id='qa/popular')<>2 then raise exception 'Listing clicks not combined';end if;
if exists(select 1 from public.reposhelf_listing_popularity() where project_id in('qa/old','qa/demo')) then raise exception 'Outside window or wrong event included';end if;
end$$;
reset role;
set role anon;
do $$begin begin perform * from public.reposhelf_listing_popularity();raise exception 'Anonymous aggregate RPC allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
set role authenticated;
do $$begin begin perform * from public.reposhelf_listing_popularity();raise exception 'Direct member aggregate RPC allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;

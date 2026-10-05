begin;
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare r public.editorial_ribbons;begin
if (select count(*) from public.editorial_ribbons where builtin_key is not null)<>14 then raise exception 'Built-in rows missing';end if;
select * into r from public.editorial_ribbons where builtin_key='hero';
perform public.reposhelf_save_ribbon(r.id,r.revision,'Our spotlight','','','daily',true,'[]');
if (select custom_rows from public.editorial_settings where id=true) then raise exception 'Built-in edit replaced category rows';end if;
if not exists(select 1 from public.editorial_ribbons where builtin_key='hero' and mode='daily' and title='Our spotlight') then raise exception 'Built-in edit lost metadata';end if;
begin perform public.reposhelf_save_ribbon(r.id,r.revision,'Stale','','','random',true,'[]');raise exception 'Stale default edit allowed';exception when serialization_failure then null;end;
select * into r from public.editorial_ribbons where builtin_key='picks';
perform public.reposhelf_save_ribbon(r.id,r.revision,r.title,'','','random',false,'[]');
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
if exists(select 1 from public.editorial_ribbons where builtin_key='picks') then raise exception 'Unpublished built-in leaked';end if;
begin perform public.reposhelf_save_ribbon('e0000000-0000-4000-8000-000000000001',2,'Member edit','','','daily',true,'[]');raise exception 'Member edited built-in';exception when insufficient_privilege then null;end;
end$$;
reset role;
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,period_visitor_hash,project_id,created_at) values('90000000-0000-0000-0000-000000000001','listing_view',repeat('a',64),repeat('b',64),repeat('c',64),'qa/today',((now() at time zone 'UTC')::date)::timestamp at time zone 'UTC'),('90000000-0000-0000-0000-000000000002','listing_view',repeat('d',64),repeat('e',64),repeat('f',64),'qa/yesterday',(((now() at time zone 'UTC')::date)::timestamp at time zone 'UTC')-interval '1 second');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare result jsonb;begin
result:=public.reposhelf_analytics(1);
if (result->>'uniqueVisitors')::integer<>1 then raise exception 'Visitor UTC boundary mismatch';end if;
if result->'topListings'->0->>'project_id'<>'qa/today' or jsonb_array_length(result->'topListings')<>1 then raise exception 'Listing UTC boundary mismatch';end if;
end$$;
reset role;
rollback;
select 'PASS: seeded defaults edit/hide without replacing categories, revisions and roles enforced, UTC analytics boundaries align.' as result;

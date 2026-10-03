begin;
set role service_role;
do $$declare p jsonb; q jsonb; ids uuid[]:='{}'; paid uuid; rem numeric; i integer;begin
begin perform public.reposhelf_promotion_write('request','{"user_id":"00000000-0000-0000-0000-000000000002","repo_name":"owner/spoof","repo_id":"spoof","owner_id":"1","snapshot":{}}');raise exception 'Owner identity spoofed';exception when insufficient_privilege then null;end;
for i in 1..6 loop
 p:=public.reposhelf_promotion_write('request',jsonb_build_object('user_id','00000000-0000-0000-0000-000000000001','repo_name','owner/project-'||i,'repo_id',i::text,'owner_id','1','snapshot',jsonb_build_object('name','Project '||i)));
 ids:=array_append(ids,(p->>'id')::uuid);
 p:=public.reposhelf_promotion_write('review',jsonb_build_object('id',ids[i],'reviewer','00000000-0000-0000-0000-000000000001','decision','approved','note','Reviewed'));
 if i<=5 then p:=public.reposhelf_promotion_write('reserve',jsonb_build_object('id',ids[i],'user_id','00000000-0000-0000-0000-000000000001'));end if;
end loop;
begin perform public.reposhelf_promotion_write('reserve',jsonb_build_object('id',ids[6],'user_id','00000000-0000-0000-0000-000000000001'));raise exception 'Sixth slot allowed';exception when sqlstate 'PT429' then null;end;
p:=public.reposhelf_promotion_write('reserve',jsonb_build_object('id',ids[1],'user_id','00000000-0000-0000-0000-000000000001'));q:=public.reposhelf_promotion_write('reserve',jsonb_build_object('id',ids[1],'user_id','00000000-0000-0000-0000-000000000001'));if p->>'checkout_attempt'<>q->>'checkout_attempt' then raise exception 'Retry created another checkout';end if;
p:=public.reposhelf_promotion_write('session',jsonb_build_object('id',ids[1],'attempt',p->>'checkout_attempt','session','cs_test_one'));
begin perform public.reposhelf_promotion_write('paid',jsonb_build_object('id',ids[1],'attempt',p->>'checkout_attempt','session','cs_test_one','payment','pi_one','amount',1,'currency','gbp'));raise exception 'Wrong payment amount';exception when check_violation then null;end;
p:=public.reposhelf_promotion_write('paid',jsonb_build_object('id',ids[1],'attempt',p->>'checkout_attempt','session','cs_test_one','payment','pi_one','amount',1500,'currency','gbp'));
-- Payment converts its own reservation into an active place, without counting itself twice.
p:=public.reposhelf_promotion_write('health',jsonb_build_object('id',ids[1],'health','available'));if p->>'status'<>'active' then raise exception 'Paid listing not activated';end if;
update public.promotions set active_since=now()-interval '2 days' where id=ids[1];
p:=public.reposhelf_promotion_write('health',jsonb_build_object('id',ids[1],'health','unavailable','reason','Demo not found'));rem:=(p->>'remaining_seconds')::numeric;if p->>'status'<>'paused' or rem<>28*86400 then raise exception 'Paused time incorrect';end if;
p:=public.reposhelf_promotion_write('health',jsonb_build_object('id',ids[1],'health','temporary'));if p->>'status'<>'paused' or (p->>'remaining_seconds')::numeric<>rem then raise exception 'Temporary check consumed paused time';end if;
begin perform public.reposhelf_promotion_write('reserve',jsonb_build_object('id',ids[6],'user_id','00000000-0000-0000-0000-000000000001'));raise exception 'Paused reservation did not retain slot';exception when sqlstate 'PT429' then null;end;
p:=public.reposhelf_promotion_write('health',jsonb_build_object('id',ids[1],'health','available'));if p->>'status'<>'active' or (p->>'remaining_seconds')::numeric<>rem then raise exception 'Recovery lost time';end if;
update public.promotions set active_since=now()-interval '29 days' where id=ids[1];p:=public.reposhelf_promotion_write('health',jsonb_build_object('id',ids[1],'health','available'));if p->>'status'<>'expired' or (p->>'remaining_seconds')::numeric<>0 then raise exception 'Thirty-day expiry incorrect';end if;
perform public.reposhelf_promotion_write('reserve',jsonb_build_object('id',ids[6],'user_id','00000000-0000-0000-0000-000000000001'));
-- Replayed payment cannot replenish days or resurrect an expired campaign.
p:=public.reposhelf_promotion_write('paid',jsonb_build_object('id',ids[1],'attempt',q->>'checkout_attempt','session','cs_test_one','payment','pi_one','amount',1500,'currency','gbp'));if p->>'status'<>'expired' then raise exception 'Replay revived promotion';end if;
end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
if exists(select 1 from public.promotions) or exists(select 1 from public.promotion_events) then raise exception 'Another owner promotion readable';end if;
begin insert into public.promotions(user_id,repo_name,repo_id,owner_id,snapshot) values(auth.uid(),'owner/fake','100','1','{}');raise exception 'Direct promotion write';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_promotion_write('paid','{}');raise exception 'Member marks paid';exception when insufficient_privilege then null;end;
end$$;
set role anon;
do $$begin begin perform public.reposhelf_promotion_write('request','{}');raise exception 'Anonymous promotion write';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;
select 'PASS: owner identity isolation, service-only writes, five-slot atomic reservations, checkout/payment replay safety, pause/resume time preservation and expiry.' as result;

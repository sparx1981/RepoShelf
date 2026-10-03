set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.reposhelf_save_bookmark('live/unindexed','{"full":"live/unindexed","name":"Live discovery","demo":"https://example.org"}');
do $$declare first_at timestamptz;second_at timestamptz;begin
if (select project_snapshot->>'name' from public.user_likes where project_id='live/unindexed')<>'Live discovery' then raise exception 'Unindexed bookmark snapshot lost';end if;
first_at:=public.reposhelf_accept_legal('2026-10-03-v1','2026-10-03-v1');second_at:=public.reposhelf_accept_legal('2026-10-03-v1','2026-10-03-v1');if first_at<>second_at then raise exception 'Duplicate acceptance changed timestamp';end if;
if (select count(*) from public.legal_acceptances)<>1 then raise exception 'Duplicate agreement';end if;
begin perform public.reposhelf_accept_legal('old','2026-10-03-v1');raise exception 'Old version accepted';exception when check_violation then null;end;
begin insert into public.legal_acceptances(user_id,terms_version,privacy_version,accepted_at) values(auth.uid(),'fake','fake','2000-01-01');raise exception 'Acceptance timestamp spoofed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
if (select count(*) from public.legal_acceptances)<>0 then raise exception 'Other agreement readable';end if;
if exists(select 1 from public.user_likes where project_id='live/unindexed') then raise exception 'Other bookmark snapshot visible';end if;
end$$;
set role anon;
select set_config('request.jwt.claim.sub','',false);
do $$begin begin perform public.reposhelf_accept_legal('2026-10-03-v1','2026-10-03-v1');raise exception 'Anonymous acceptance';exception when insufficient_privilege then null;end;end$$;
reset role;
delete from public.user_likes where project_id='live/unindexed';delete from public.legal_acceptances;
select 'PASS: unindexed bookmark snapshots persist with owner isolation; legal acceptance is authenticated, private, version-checked, timestamped by the server and idempotent.' as result;

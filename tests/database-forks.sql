set role service_role;
select public.reposhelf_begin_fork_sync('00000000-0000-0000-0000-000000000001','1','30000000-0000-0000-0000-000000000001');
do $$begin
if public.reposhelf_begin_fork_sync('00000000-0000-0000-0000-000000000001','1','30000000-0000-0000-0000-000000000002') is not null then raise exception 'Concurrent sync lease allowed';end if;
begin perform public.reposhelf_begin_fork_sync('00000000-0000-0000-0000-000000000001','2','30000000-0000-0000-0000-000000000002');raise exception 'GitHub identity mismatch allowed';exception when insufficient_privilege then null;end;
end$$;
select public.reposhelf_save_verified_fork('{"user_id":"00000000-0000-0000-0000-000000000001","github_fork_id":100,"github_owner_id":"1","project_id":"team/canvas","fork_full":"owner/canvas","parent_data":{"name":"Canvas"}}');
select public.reposhelf_save_verified_fork('{"user_id":"00000000-0000-0000-0000-000000000001","github_fork_id":100,"github_owner_id":"1","project_id":"team/canvas","fork_full":"owner/renamed","parent_data":{"name":"Canvas"}}');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$begin
if (select count(*) from public.user_forks)<>1 or (select fork_full from public.user_forks)<>'owner/renamed' then raise exception 'Fork upsert lost';end if;
begin insert into public.user_forks(user_id,github_fork_id,github_owner_id,project_id,fork_full) values(auth.uid(),101,'1','team/fake','owner/fake');raise exception 'User can claim verified fork';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_save_verified_fork('{}');raise exception 'User can call verification RPC';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_begin_fork_sync(auth.uid(),'1',gen_random_uuid());raise exception 'User can claim sync lease';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin if (select count(*) from public.user_forks)<>0 or (select count(*) from public.fork_sync_state)<>0 then raise exception 'Other account fork data visible';end if;end$$;
set role anon;
do $$begin begin perform count(*) from public.user_forks;raise exception 'Anonymous fork read';exception when insufficient_privilege then null;end;end$$;
reset role;
delete from public.user_forks;delete from public.fork_sync_state;
select 'PASS: forks isolate users, service-only verification cannot be spoofed, trusted GitHub identity binds sync and leases prevent concurrent scans.' as result;

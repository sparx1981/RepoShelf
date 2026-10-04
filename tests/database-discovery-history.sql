begin;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$begin
if public.reposhelf_remember_project('team/first','{"name":"First"}') then raise exception 'History recorded without opt-in';end if;
perform public.reposhelf_discovery_settings(true,true);
perform public.reposhelf_remember_project('team/first','{"name":"First"}');
perform public.reposhelf_remember_project('team/first','{"name":"Updated"}');
if (select count(*) from public.user_project_history)<>1 then raise exception 'Duplicate history records';end if;
if (select project_snapshot->>'name' from public.user_project_history)<>'Updated' then raise exception 'History snapshot not updated';end if;
begin perform public.reposhelf_discovery_settings(false,true);raise exception 'Hide enabled without history';exception when check_violation then null;end;
begin insert into public.user_project_history(user_id,project_id,project_snapshot) values(auth.uid(),'team/spoof','{}');raise exception 'Direct timestamp spoofing allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
if (select count(*) from public.user_project_history)<>0 or (select count(*) from public.user_discovery_settings)<>0 then raise exception 'Other user history leaked';end if;
perform public.reposhelf_discovery_settings(true,false);
perform public.reposhelf_remember_project('team/second','{}');
perform public.reposhelf_clear_project_history();
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$begin
if (select count(*) from public.user_project_history)<>1 then raise exception 'Clearing another user removed owner history';end if;
perform public.reposhelf_discovery_settings(false,false);
if public.reposhelf_remember_project('team/new','{}') then raise exception 'History kept recording after opt-out';end if;
perform public.reposhelf_clear_project_history();
if (select count(*) from public.user_project_history)<>0 then raise exception 'History clear failed';end if;
end$$;
set role anon;
select set_config('request.jwt.claim.sub','',false);
do $$begin
begin perform count(*) from public.user_project_history;raise exception 'Anonymous history read allowed';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_clear_project_history();raise exception 'Anonymous history clear allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: optional history, server timestamps, deduplication, opt-out, private settings and records, isolated clearing and anonymous denial.' as result;

-- per-row shuffle: off by default, three valid values, old callers keep working, members cannot change it
begin;
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001') on conflict do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$declare saved public.editorial_ribbons;begin
 saved:=public.reposhelf_save_ribbon(null,0,'Shuffle default','','','popular',false,'[]');
 if saved.shuffle<>'off' then raise exception 'shuffle must default to off';end if;
 saved:=public.reposhelf_save_ribbon(saved.id,saved.revision,'Shuffle load','','','popular',false,'[]','load');
 if saved.shuffle<>'load' then raise exception 'load not saved';end if;
 saved:=public.reposhelf_save_ribbon(saved.id,saved.revision,'Shuffle daily','','','popular',false,'[]','daily');
 if saved.shuffle<>'daily' then raise exception 'daily not saved';end if;
 saved:=public.reposhelf_save_ribbon(saved.id,saved.revision,'Shuffle reset','','','popular',false,'[]');
 if saved.shuffle<>'off' then raise exception 'saving without a shuffle must reset it to off';end if;
 begin perform public.reposhelf_save_ribbon(saved.id,saved.revision,'Bad shuffle','','','popular',false,'[]','sometimes');raise exception 'an invalid shuffle was accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_save_ribbon(saved.id,saved.revision,'Null shuffle','','','popular',false,'[]',null);raise exception 'a null shuffle was accepted';exception when check_violation then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$begin
 begin perform public.reposhelf_save_ribbon(null,0,'Member shuffle','','','popular',false,'[]','load');raise exception 'a member changed a row';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
 if (select count(*) from pg_proc where proname='reposhelf_save_ribbon' and pronamespace='public'::regnamespace)<>1 then raise exception 'there must be exactly one save function';end if;
 if has_function_privilege('anon','public.reposhelf_save_ribbon(uuid,integer,text,text,text,text,boolean,jsonb,text)','execute') then raise exception 'visitors must not reach the save function';end if;
end$$;
rollback;

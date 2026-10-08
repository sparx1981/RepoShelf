begin;
set role anon;
do $$begin
  begin perform * from public.x_collection_settings;raise exception 'Anonymous settings read allowed';exception when insufficient_privilege then null;end;
  begin perform public.reposhelf_x_collection_settings(1,true);raise exception 'Anonymous write allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
set role authenticated;
do $$begin
  if exists(select 1 from public.x_collection_settings) then raise exception 'Member settings visible';end if;
  begin perform public.reposhelf_x_collection_settings(1,true);raise exception 'Member write allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
  if (select enabled from public.x_collection_settings where id) then raise exception 'Scanning enabled by default';end if;
end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$declare saved public.x_collection_settings;begin
  saved:=public.reposhelf_x_collection_settings(1,true);
  if not saved.enabled or saved.revision<>2 then raise exception 'Admin enable failed';end if;
  begin perform public.reposhelf_x_collection_settings(1,false);raise exception 'Stale write allowed';exception when serialization_failure then null;end;
  saved:=public.reposhelf_x_collection_settings(2,false);
  if saved.enabled or saved.revision<>3 then raise exception 'Admin disable failed';end if;
end$$;
reset role;
rollback;

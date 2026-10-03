set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
begin perform public.reposhelf_list_users();raise exception 'Member listed users';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_set_admin(auth.uid(),true,false);raise exception 'Member self-promoted';exception when insufficient_privilege then null;end;
if (select count(*) from public.admin_role_changes)<>0 then raise exception 'Role audit leaked';end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare users jsonb;begin
users:=public.reposhelf_list_users();if (users->>'total')::integer<>3 then raise exception 'Unexpected eligible user count';end if;
if (users->'items'->2->>'username')<>'third' or (users->'items'->2->>'admin')::boolean then raise exception 'User metadata granted identity/role';end if;
users:=public.reposhelf_list_users('',null,1);if jsonb_array_length(users->'items')<>1 or users->>'nextCursor' is null then raise exception 'Pagination failed';end if;
users:=public.reposhelf_list_users('third');if (users->>'total')::integer<>1 then raise exception 'User search failed';end if;
begin perform public.reposhelf_set_admin(auth.uid(),false,true);raise exception 'Own/last admin removed';exception when sqlstate 'PT409' then null;end;
begin perform public.reposhelf_set_admin(auth.uid(),null,true);raise exception 'Null enabled bypassed protection';exception when check_violation then null;end;
begin perform public.reposhelf_set_admin('00000000-0000-0000-0000-000000000004',true,false);raise exception 'Unestablished GitHub identity granted';exception when sqlstate 'PT404' then null;end;
end$$;
select public.reposhelf_set_admin('00000000-0000-0000-0000-000000000002',true,false);
select public.reposhelf_set_admin('00000000-0000-0000-0000-000000000002',true,true);
do $$begin
if (select count(*) from public.admin_role_changes)<>1 then raise exception 'Repeated grant created audit duplicates';end if;
begin perform public.reposhelf_set_admin('00000000-0000-0000-0000-000000000002',false,false);raise exception 'Stale role overwritten';exception when serialization_failure then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin if not public.reposhelf_is_admin() then raise exception 'New role not applied';end if;perform public.reposhelf_list_users();end$$;
select public.reposhelf_set_admin('00000000-0000-0000-0000-000000000003',true,false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.reposhelf_set_admin('00000000-0000-0000-0000-000000000002',false,true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
if public.reposhelf_is_admin() then raise exception 'Revoked role persisted';end if;
begin perform public.reposhelf_set_admin(auth.uid(),true,false);raise exception 'Revoked admin regranted own role';exception when insufficient_privilege then null;end;
begin perform public.reposhelf_list_users();raise exception 'Revoked admin read users';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.reposhelf_set_admin('00000000-0000-0000-0000-000000000003',false,true);
do $$begin if (select count(*) from public.admin_role_changes)<>4 then raise exception 'Audit count incorrect';end if;end$$;
set role anon;
select set_config('request.jwt.claim.sub','',false);
do $$begin
begin perform public.reposhelf_list_users();raise exception 'Anonymous users read allowed';exception when insufficient_privilege then null;end;
begin perform count(*) from public.admin_role_changes;raise exception 'Anonymous audit read allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'PASS: verified GitHub user search/pagination, protected own/last admin, grant/revoke effects, denied self-promotion, stale role protection, NULL rejection, role audit and anonymous/member isolation.' as result;

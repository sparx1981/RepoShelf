-- MCP connector gate: shared per-caller limit, anonymous per-tool counts, server-only access, safe to re-run.
begin;
do $$
declare a boolean;b boolean;c boolean;
begin
 select public.reposhelf_mcp_gate('ci-bucket',2),public.reposhelf_mcp_gate('ci-bucket',2),public.reposhelf_mcp_gate('ci-bucket',2) into a,b,c;
 if not (a and b and not c) then raise exception 'limit should allow two calls then refuse (% % %)',a,b,c;end if;
 if not public.reposhelf_mcp_gate('ci-other',2) then raise exception 'another caller must be unaffected';end if;
 perform public.reposhelf_mcp_gate('ci-usage',100,'ci_tool');perform public.reposhelf_mcp_gate('ci-usage',100,'ci_tool');perform public.reposhelf_mcp_gate('ci-usage',100,'BAD TOOL!');
 if (select calls from public.reposhelf_mcp_usage(1) where tool='ci_tool')<>2 then raise exception 'tool use not counted';end if;
 if exists(select 1 from public.reposhelf_mcp_usage(1) where tool ~ '[^a-z_]') then raise exception 'unvalidated tool name stored';end if;
 begin perform public.reposhelf_mcp_gate(null,2);raise exception 'null bucket accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_mcp_gate('x',0);raise exception 'zero limit accepted';exception when check_violation then null;end;
end$$;
set local role authenticated;
do $$begin begin perform public.reposhelf_mcp_gate('x',2);raise exception 'authenticated users must not call the gate';exception when insufficient_privilege then null;end;begin perform * from public.reposhelf_mcp_usage(1);raise exception 'authenticated users must not read usage';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role anon;
do $$begin begin perform public.reposhelf_mcp_gate('x',2);raise exception 'anonymous callers must not call the gate';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;

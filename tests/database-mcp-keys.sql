-- Connector keys: hashed storage, per-member limit, revocation, verification, server-only access, merge carries keys.
begin;
do $$
declare u uuid:='00000000-0000-0000-0000-000000000001';other uuid:='00000000-0000-0000-0000-000000000002';h text:=repeat('a',64);r jsonb;owner uuid;n integer;first_id uuid;
begin
 r:=public.reposhelf_mcp_key_create(u,'Claude',h,'rsk_abcd');if r->>'ok'<>'true' then raise exception 'create failed %',r;end if;first_id:=(r->>'id')::uuid;
 if public.reposhelf_mcp_key_verify(h)<>u then raise exception 'active key should verify to its owner';end if;
 if public.reposhelf_mcp_key_verify(repeat('b',64)) is not null then raise exception 'unknown key verified';end if;
 if (select last_used_at from public.mcp_keys where key_hash=h) is null then raise exception 'last use not recorded';end if;
 if (select count(*) from public.reposhelf_mcp_key_list(u))<>1 or exists(select 1 from public.reposhelf_mcp_key_list(other)) then raise exception 'list must show only the owner keys';end if;
 begin perform public.reposhelf_mcp_key_create(u,'dup',h,'rsk_abcd');raise exception 'duplicate hash stored';exception when unique_violation then null;end;
 begin perform public.reposhelf_mcp_key_create(u,'bad','not-a-hash','rsk_abcd');raise exception 'malformed hash stored';exception when check_violation then null;end;
 for n in 2..5 loop r:=public.reposhelf_mcp_key_create(u,'k'||n,lpad(to_hex(n),64,'0'),'rsk_'||n||'xxx');if r->>'ok'<>'true' then raise exception 'key % refused',n;end if;end loop;
 r:=public.reposhelf_mcp_key_create(u,'sixth',lpad(to_hex(99),64,'0'),'rsk_sixx');if r->>'reason'<>'limit' then raise exception 'a sixth active key must be refused';end if;
 if public.reposhelf_mcp_key_revoke(other,first_id) then raise exception 'another member must not revoke the key';end if;
 if not public.reposhelf_mcp_key_revoke(u,first_id) then raise exception 'owner could not revoke';end if;
 if public.reposhelf_mcp_key_verify(h) is not null then raise exception 'revoked key still verifies';end if;
 if public.reposhelf_mcp_key_revoke(u,first_id) then raise exception 'second revoke should report nothing changed';end if;
 r:=public.reposhelf_mcp_key_create(u,'after revoke',lpad(to_hex(100),64,'0'),'rsk_newx');if r->>'ok'<>'true' then raise exception 'revoking frees a slot';end if;
 if public.reposhelf_mcp_key_create(gen_random_uuid(),'x',lpad(to_hex(101),64,'0'),'rsk_xxxx')->>'reason'<>'no_account' then raise exception 'unknown account refused';end if;
 if exists(select 1 from public.mcp_keys where key_hash like 'rsk%') then raise exception 'raw keys must never be stored';end if;
 -- keys follow an account merge
 perform public.reposhelf_merge_accounts(u,'00000000-0000-0000-0000-000000000004');
 insert into public.mcp_keys(user_id,key_hash,key_prefix) values('00000000-0000-0000-0000-000000000004',lpad(to_hex(555),64,'0'),'rsk_gone');
 perform public.reposhelf_merge_accounts(u,'00000000-0000-0000-0000-000000000004');
 if (select user_id from public.mcp_keys where key_hash=lpad(to_hex(555),64,'0'))<>u then raise exception 'keys must move to the merged account';end if;
end$$;
set local role authenticated;
do $$begin
 begin perform public.reposhelf_mcp_key_verify(repeat('a',64));raise exception 'authenticated users must not verify keys';exception when insufficient_privilege then null;end;
 begin perform * from public.reposhelf_mcp_key_list('00000000-0000-0000-0000-000000000001');raise exception 'authenticated users must not list keys';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.mcp_keys;raise exception 'authenticated users must not read the table';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role anon;
do $$begin begin perform public.reposhelf_mcp_key_create('00000000-0000-0000-0000-000000000001','x',repeat('c',64),'rsk_abcd');raise exception 'anonymous callers must not create keys';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;

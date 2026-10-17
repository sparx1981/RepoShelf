-- The account export lists sign-in methods and connector keys (never a key hash), and the merge preview counts boards and keys.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-0000000000d1'),('00000000-0000-0000-0000-0000000000d2');
insert into auth.identities(user_id,provider,provider_id,identity_data) values('00000000-0000-0000-0000-0000000000d1','github','9001','{"user_name":"dee","email":"d@example.org"}'),('00000000-0000-0000-0000-0000000000d2','google','g9002','{"email":"g@example.org"}');
insert into public.mcp_keys(user_id,key_hash,key_prefix,label) values('00000000-0000-0000-0000-0000000000d2',repeat('a',64),'rsk_abcd','Claude desktop'),('00000000-0000-0000-0000-0000000000d2',repeat('b',64),'rsk_efgh','Old one');
update public.mcp_keys set revoked_at=now() where label='Old one';
insert into public.boards(user_id,name) values('00000000-0000-0000-0000-0000000000d2','Landing'),('00000000-0000-0000-0000-0000000000d2','Dashboard');
do $$
declare r jsonb;
begin
 r:=public.reposhelf_merge_check('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000d2');
 if r->>'ok'<>'true' then raise exception 'merge check failed: %',r;end if;
 if (r->'counts'->>'boards')::int<>2 then raise exception 'merge preview should count boards: %',r;end if;
 if (r->'counts'->>'keys')::int<>1 then raise exception 'merge preview should count active keys only: %',r;end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000d2',true);
set local role authenticated;
do $$
declare data jsonb;
begin
 data:=public.reposhelf_export_account();
 if jsonb_array_length(data->'connectorKeys')<>2 then raise exception 'export should list both keys: %',data->'connectorKeys';end if;
 if data::text like '%aaaaaaaa%' or data::text like '%bbbbbbbb%' then raise exception 'export must never contain a key hash';end if;
 if data->'connectorKeys'->0->>'label'<>'Claude desktop' then raise exception 'key names are exported';end if;
 if data->'signInMethods'->0->>'provider'<>'google' then raise exception 'the Google sign-in method should be exported: %',data->'signInMethods';end if;
end$$;
reset role;
rollback;

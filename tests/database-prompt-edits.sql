-- Prompt edits and deletions: the edited_fields column, the tombstones table, idempotent re-runs and server-only access.
begin;
do $$
declare n integer;
begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='ss_prompts' and column_name='edited_fields') then raise exception 'edited_fields is missing';end if;
 insert into public.ss_prompts(source,source_id,title,original_prompt,prompt) values('sceneai','abc123','T','p','p');
 if (select edited_fields from public.ss_prompts where source_id='abc123')<>'{}' then raise exception 'edited_fields must start empty';end if;
 update public.ss_prompts set edited_fields=array['title'] where source_id='abc123';
 if (select edited_fields from public.ss_prompts where source_id='abc123')<>array['title'] then raise exception 'edited_fields must hold field names';end if;
 insert into public.ss_prompt_tombstones(source,source_id) values('sceneai','abc123');
 begin insert into public.ss_prompt_tombstones(source,source_id) values('sceneai','abc123');raise exception 'a duplicate tombstone was accepted';exception when unique_violation then null;end;
 begin insert into public.ss_prompt_tombstones(source,source_id) values('other','x');raise exception 'unknown source accepted';exception when check_violation then null;end;
 begin insert into public.ss_prompt_tombstones(source,source_id) values('sceneai','../x');raise exception 'unsafe id accepted';exception when check_violation then null;end;
 select count(*) into n from public.ss_prompt_tombstones;if n<>1 then raise exception 'expected one tombstone';end if;
end$$;
set local role anon;
do $$begin begin perform count(*) from public.ss_prompt_tombstones;raise exception 'anonymous callers must not read tombstones';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role authenticated;
do $$begin begin perform count(*) from public.ss_prompt_tombstones;raise exception 'members must not read tombstones';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;

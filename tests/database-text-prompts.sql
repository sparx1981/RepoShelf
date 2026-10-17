-- Text prompts: the kind column, the Motion film director listing, idempotent re-runs and server-only access.
begin;
do $$
declare r public.ss_prompts;n integer;
begin
 select * into r from public.ss_prompts where source='siteshelf' and source_id='motion-film-director';
 if r.id is null then raise exception 'the listing was not inserted';end if;
 if r.kind<>'text' or not r.published or r.is_new or r.type<>'free' then raise exception 'listing should be a published free text prompt: %',row_to_json(r);end if;
 if r.prompt<>r.original_prompt or r.prompt not like '<role>%' or r.prompt not like '%<brief>%mode:%[showreel | product | launch-story | explainer]%sign-off:%</brief>%' or r.prompt not like '%</deliverables>' then raise exception 'prompt text is missing or damaged';end if;
 if r.prompt like '%'||chr(13)||'%' or r.prompt ~ '[ ]+$' then raise exception 'prompt should have no carriage returns or trailing spaces';end if;
 -- CI applies the migration twice, so a second run must not add a second listing
 select count(*) into n from public.ss_prompts where source='siteshelf' and source_id='motion-film-director';
 if n<>1 then raise exception 'exactly one listing expected';end if;
 -- existing rows keep the default kind, and only 'page' or 'text' are accepted
 insert into public.ss_prompts(source,source_id,title,original_prompt,prompt) values('siteshelf','plain-page','Plain','p','p');
 if (select kind from public.ss_prompts where source_id='plain-page')<>'page' then raise exception 'default kind must be page';end if;
 begin update public.ss_prompts set kind='video' where source_id='plain-page';raise exception 'invalid kind accepted';exception when check_violation then null;end;
end$$;
-- the browser keys cannot read prompts at all (the text is withheld from visitors who are not signed in)
set local role anon;
do $$begin begin perform count(*) from public.ss_prompts;raise exception 'anonymous callers must not read prompts';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role authenticated;
do $$begin begin perform count(*) from public.ss_prompts;raise exception 'signed-in members must not read prompts directly';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;

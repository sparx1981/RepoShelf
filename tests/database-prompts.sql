-- Prompt library: server-only tables, analytics ingest and 90-day purge, admin summary, namespaced likes, legal v3.
begin;
do $$declare t text;begin
 foreach t in array array['ss_prompts','ss_previews','ss_thumbs','ss_prompt_versions','ss_sections','ss_settings','ss_sync_runs','ss_discoveries','prompt_events'] loop
  if not (select relrowsecurity from pg_class where oid=('public.'||t)::regclass) then raise exception '% must have row-level security',t;end if;
  if has_table_privilege('anon','public.'||t,'select') or has_table_privilege('authenticated','public.'||t,'select') then raise exception 'browser roles must not read %',t;end if;
 end loop;
 if not exists(select 1 from information_schema.columns where table_name='ss_prompts' and column_name='published') then raise exception 'published column missing';end if;
end$$;

-- Ingest: valid events are stored once, duplicates ignored, bad keys and kinds refused, more than 10 refused.
select set_config('t.n',public.reposhelf_ingest_prompt_events('[{"event_id":"00000000-0000-0000-0000-0000000000a1","kind":"prompt_view","prompt_key":"sceneai/abc-1","session_hash":"s","visitor_hash":"v","period_visitor_hash":"p"},{"event_id":"00000000-0000-0000-0000-0000000000a2","kind":"prompt_reveal","prompt_key":"sceneai/abc-1","session_hash":"s","visitor_hash":"v","period_visitor_hash":"p"}]'::jsonb)::text,true);
do $$begin
 if current_setting('t.n')<>'2' then raise exception 'two events should be stored';end if;
 if public.reposhelf_ingest_prompt_events('[{"event_id":"00000000-0000-0000-0000-0000000000a1","kind":"prompt_view","prompt_key":"sceneai/abc-1","session_hash":"s","visitor_hash":"v","period_visitor_hash":"p"}]'::jsonb)<>0 then raise exception 'duplicate stored';end if;
 begin perform public.reposhelf_ingest_prompt_events('[{"event_id":"00000000-0000-0000-0000-0000000000a3","kind":"prompt_view","prompt_key":"Bad Key","session_hash":"s","visitor_hash":"v","period_visitor_hash":"p"}]'::jsonb);raise exception 'bad key accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_ingest_prompt_events('[{"event_id":"00000000-0000-0000-0000-0000000000a4","kind":"nope","prompt_key":"siteshelf/x","session_hash":"s","visitor_hash":"v","period_visitor_hash":"p"}]'::jsonb);raise exception 'bad kind accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_ingest_prompt_events(('['||repeat('{},',10)||'{}]')::jsonb);raise exception 'oversized batch accepted';exception when check_violation then null;end;
end$$;

-- 90-day purge happens on the next ingest.
insert into public.prompt_events(event_id,kind,prompt_key,session_hash,visitor_hash,period_visitor_hash,created_at) values('00000000-0000-0000-0000-0000000000b1','prompt_view','sceneai/old-1','s','v','p',now()-interval '91 days');
select public.reposhelf_ingest_prompt_events('[]'::jsonb);
do $$begin if exists(select 1 from public.prompt_events where prompt_key='sceneai/old-1') then raise exception 'old events must be purged';end if;end$$;

-- Admin summary: refused for visitors and members, works for admins.
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001') on conflict do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$begin begin perform public.reposhelf_admin_prompts(30);raise exception 'a non-admin read the summary';exception when sqlstate '42501' then null;end;end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$declare s jsonb;begin
 s:=public.reposhelf_admin_prompts(30);
 if (s->'totals'->>'prompt_view')::int<>1 or (s->>'visitors')::int<>1 then raise exception 'unexpected summary %',s;end if;
 if s->'top'->0->>'prompt'<>'sceneai/abc-1' then raise exception 'top prompt missing';end if;
 begin perform public.reposhelf_admin_prompts(0);raise exception 'zero days accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_admin_prompts(400);raise exception '400 days accepted';exception when check_violation then null;end;
end$$;

-- Likes: namespaced prompt ids are accepted, malformed ones are not, repositories still work.
do $$begin
 perform public.reposhelf_set_like('ss:sceneai/abc-1',true);
 perform public.reposhelf_set_like('octocat/hello',true);
 begin perform public.reposhelf_set_like('ss:other/abc',true);raise exception 'unknown prompt source accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_set_like('ss:sceneai/Bad Id',true);raise exception 'malformed prompt id accepted';exception when check_violation then null;end;
 if (select count(*) from public.user_likes where user_id=auth.uid() and project_id like 'ss:%')<>1 then raise exception 'prompt like missing';end if;
 perform public.reposhelf_set_like('ss:sceneai/abc-1',false);
 if exists(select 1 from public.user_likes where user_id=auth.uid() and project_id like 'ss:%') then raise exception 'prompt like not removed';end if;
end$$;

-- Legal version 3 is accepted, and so is the previous one.
do $$begin
 perform public.reposhelf_accept_legal('2026-10-11-v3','2026-10-11-v3');
 begin perform public.reposhelf_accept_legal('2026-10-11-v3','2026-10-06-v2');raise exception 'mixed versions accepted';exception when check_violation then null;end;
end$$;
reset role;
do $$begin
 if has_function_privilege('anon','public.reposhelf_ingest_prompt_events(jsonb)','execute') or has_function_privilege('authenticated','public.reposhelf_ingest_prompt_events(jsonb)','execute') then raise exception 'ingest is server-only';end if;
 if has_function_privilege('anon','public.reposhelf_admin_prompts(integer)','execute') then raise exception 'visitors must not reach the summary';end if;
end$$;
rollback;
select 'PASS: prompt tables are server-only, analytics ingest and purge work, the admin summary is admin-only, prompt likes are namespaced and legal v3 is accepted.' as result;

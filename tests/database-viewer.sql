-- Demo viewer controls: server-only access, evidence separate from approval, automatic suspension on a failed run,
-- a successful run lifting only the automatic suspension, and the manual disable never cleared by a test.
begin;
do $$
declare admin_id uuid:='00000000-0000-0000-0000-000000000001';r jsonb;s jsonb;i integer;
begin
 -- global switch defaults to off
 if (public.reposhelf_viewer_state('team/demo')->>'enabled')::boolean then raise exception 'the viewer must start switched off';end if;
 if (public.reposhelf_viewer_settings(admin_id,true)->>'enabled')<>'true' then raise exception 'switch did not turn on';end if;
 -- approvals
 s:=public.reposhelf_viewer_save(admin_id,'team/demo','https://demo.example/app','{"steps":[{"action":"click","selector":"button"}]}'::jsonb,false,false,true,'pilot');
 if (s->>'approved')<>'true' or s->>'approved_by'<>admin_id::text then raise exception 'approval not recorded %',s;end if;
 begin perform public.reposhelf_viewer_save(admin_id,'team/http','http://demo.example/','{}'::jsonb,false,false,true,null);raise exception 'http address stored';exception when check_violation then null;end;
 -- no evidence yet
 if public.reposhelf_viewer_state('team/demo')->'latest' <> 'null'::jsonb then raise exception 'there should be no evidence yet';end if;
 -- a successful run is recorded and returned as the latest
 r:=public.reposhelf_viewer_record('team/demo','ok',null,'chromium','v1|popups=0|downloads=0','https://demo.example/app','https://demo.example/app','abc','{"steps":1}'::jsonb);if r->>'ok'<>'true' then raise exception 'record failed %',r;end if;
 if public.reposhelf_viewer_state('team/demo')->'latest'->>'result'<>'ok' then raise exception 'latest evidence should be the success';end if;
 if public.reposhelf_viewer_record('team/unknown','ok',null,'chromium','v1','https://x.example/','https://x.example/','a','{}'::jsonb)->>'reason'<>'unknown_demo' then raise exception 'evidence for an unlisted demo must be refused';end if;
 -- a later failed run suspends the demo automatically and becomes the latest
 perform public.reposhelf_viewer_record('team/demo','failed','top_navigation_attempt','chromium','v1|popups=0|downloads=0','https://demo.example/app',null,'abc','{}'::jsonb);
 if not (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a failed run must suspend the demo';end if;
 if public.reposhelf_viewer_state('team/demo')->'latest'->>'result'<>'failed' then raise exception 'the newest run decides';end if;
 -- an inconclusive run suspends too
 perform public.reposhelf_viewer_record('team/demo','ok',null,'chromium','v1|popups=0|downloads=0','https://demo.example/app','https://demo.example/app','abc','{}'::jsonb);
 if (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a successful run lifts the automatic suspension';end if;
 perform public.reposhelf_viewer_record('team/demo','inconclusive','timeout','chromium','v1|popups=0|downloads=0','https://demo.example/app',null,'abc','{}'::jsonb);
 if not (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'an inconclusive run must suspend the demo';end if;
 -- manual disable is never cleared by a successful run
 perform public.reposhelf_viewer_disable(admin_id,'team/demo',true,'looks broken on Safari');
 perform public.reposhelf_viewer_record('team/demo','ok',null,'chromium','v1|popups=0|downloads=0','https://demo.example/app','https://demo.example/app','abc','{}'::jsonb);
 if not (select manual_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a successful run must not clear a manual disable';end if;
 if (select manual_disabled_reason from public.viewer_demos where project_id='team/demo')<>'looks broken on Safari' then raise exception 'manual reason lost';end if;
 -- the work list excludes manually disabled demos
 if jsonb_array_length(public.reposhelf_viewer_queue())<>0 then raise exception 'manually disabled demos must not be queued';end if;
 perform public.reposhelf_viewer_disable(admin_id,'team/demo',false,null);
 if jsonb_array_length(public.reposhelf_viewer_queue())<>1 then raise exception 'an approved demo is queued';end if;
 -- an address change keeps approval; evidence keeps its own address so eligibility can detect the mismatch
 s:=public.reposhelf_viewer_save(admin_id,'team/demo','https://demo.example/new','{}'::jsonb,true,true,true,null);
 if s->>'demo_url'<>'https://demo.example/new' or s->>'approved_by'<>admin_id::text or (s->>'allow_popups')<>'true' then raise exception 'save did not update %',s;end if;
 if public.reposhelf_viewer_state('team/demo')->'latest'->>'demo_url'<>'https://demo.example/app' then raise exception 'evidence must keep the address it was recorded for';end if;
 -- un-approving
 s:=public.reposhelf_viewer_save(admin_id,'team/demo','https://demo.example/new','{}'::jsonb,false,false,false,null);if (s->>'approved')<>'false' or s->>'approved_by' is not null then raise exception 'un-approve failed %',s;end if;
 -- evidence is pruned to the newest 30
 for i in 1..40 loop perform public.reposhelf_viewer_record('team/demo','ok',null,'chromium','v1','https://demo.example/new','https://demo.example/new','h'||i,'{}'::jsonb);end loop;
 if (select count(*) from public.viewer_evidence where project_id='team/demo')<>30 then raise exception 'evidence should be pruned to 30';end if;
 -- the list includes the latest run
 if public.reposhelf_viewer_list()->'demos'->0->'latest'->>'scenario_hash'<>'h40' then raise exception 'list should include the latest run';end if;
 -- deleting a demo removes its evidence
 delete from public.viewer_demos where project_id='team/demo';
 if exists(select 1 from public.viewer_evidence where project_id='team/demo') then raise exception 'evidence must follow the demo';end if;
end$$;
-- privileges: nothing is reachable by signed-in or anonymous callers
do $$
declare t text;f text;
begin
 foreach t in array array['viewer_settings','viewer_demos','viewer_evidence'] loop
  if has_table_privilege('authenticated','public.'||t,'select') or has_table_privilege('anon','public.'||t,'select') or has_table_privilege('authenticated','public.'||t,'insert') then raise exception '% must not be reachable by clients',t;end if;
 end loop;
 foreach f in array array['reposhelf_viewer_state(text)','reposhelf_viewer_list()','reposhelf_viewer_queue()','reposhelf_viewer_settings(uuid,boolean)','reposhelf_viewer_save(uuid,text,text,jsonb,boolean,boolean,boolean,text)','reposhelf_viewer_disable(uuid,text,boolean,text)','reposhelf_viewer_record(text,text,text,text,text,text,text,text,jsonb)'] loop
  if has_function_privilege('authenticated','public.'||f,'execute') or has_function_privilege('anon','public.'||f,'execute') then raise exception '% must be server-only',f;end if;
  if not has_function_privilege('service_role','public.'||f,'execute') then raise exception '% must be callable by the server',f;end if;
 end loop;
end$$;
rollback;

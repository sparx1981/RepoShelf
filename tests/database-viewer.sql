-- Demo viewer controls: server-only access; evidence judged per browser profile; a pass in one browser never clears another
-- browser's failure; scenario edits are versioned and runs for a changed scenario or address are rejected; manual disable
-- is never cleared by a test; clearing a profile is an explicit administrator action.
begin;
do $$
declare admin_id uuid:='00000000-0000-0000-0000-000000000001';r jsonb;s jsonb;i integer;cfg text:='v1|popups=0|downloads=0';
begin
 -- the global switch starts off and required profiles start as chromium only
 if (public.reposhelf_viewer_state('team/demo')->>'enabled')::boolean then raise exception 'the viewer must start switched off';end if;
 if public.reposhelf_viewer_state('team/demo')->'required_profiles'<>'["chromium"]'::jsonb then raise exception 'required profiles default to chromium';end if;
 if (public.reposhelf_viewer_settings(admin_id,true,null)->>'enabled')<>'true' then raise exception 'switch did not turn on';end if;
 if public.reposhelf_viewer_settings(admin_id,null,array['chromium','webkit'])->'required_profiles'<>'["chromium", "webkit"]'::jsonb then raise exception 'required profiles not saved';end if;
 begin perform public.reposhelf_viewer_settings(admin_id,null,array['netscape']);raise exception 'unknown profile accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_viewer_settings(admin_id,null,array[]::text[]);raise exception 'an empty profile list accepted';exception when check_violation then null;end;
 perform public.reposhelf_viewer_settings(admin_id,null,array['chromium','firefox']);
 -- approvals, with a scenario hash and revision history
 s:=public.reposhelf_viewer_save(admin_id,'team/demo','https://demo.example/app','{"steps":[1]}'::jsonb,'hash1',false,false,true,'pilot');
 if (s->>'approved')<>'true' or s->>'approved_by'<>admin_id::text or (s->>'scenario_revision')::int<>1 or s->>'scenario_hash'<>'hash1' then raise exception 'save wrong %',s;end if;
 begin perform public.reposhelf_viewer_save(admin_id,'team/http','http://demo.example/','{}'::jsonb,'h',false,false,true,null);raise exception 'http address stored';exception when check_violation then null;end;
 if public.reposhelf_viewer_state('team/demo')->'latest' <> 'null'::jsonb or public.reposhelf_viewer_state('team/demo')->'profiles'<>'[]'::jsonb then raise exception 'there should be no evidence yet';end if;
 -- a successful chromium run is recorded
 r:=public.reposhelf_viewer_record('team/demo','ok',null,'chromium',cfg,'https://demo.example/app','https://demo.example/app','hash1','{"steps":1}'::jsonb);if r->>'ok'<>'true' then raise exception 'record failed %',r;end if;
 if public.reposhelf_viewer_record('team/unknown','ok',null,'chromium',cfg,'https://x.example/','https://x.example/','a','{}'::jsonb)->>'reason'<>'unknown_demo' then raise exception 'evidence for an unlisted demo must be refused';end if;
 if public.reposhelf_viewer_record('team/demo','ok',null,'netscape',cfg,'https://demo.example/app',null,'hash1','{}'::jsonb)->>'reason'<>'unknown_profile' then raise exception 'unknown profile must be refused';end if;
 -- a firefox failure suspends the demo, and a later chromium pass must not lift it
 perform public.reposhelf_viewer_record('team/demo','failed','frame_refused','firefox',cfg,'https://demo.example/app',null,'hash1','{}'::jsonb);
 if not (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a failed run in any profile must suspend the demo';end if;
 perform public.reposhelf_viewer_record('team/demo','ok',null,'chromium',cfg,'https://demo.example/app','https://demo.example/app','hash1','{}'::jsonb);
 if not (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a chromium pass must not clear a firefox failure';end if;
 if (select auto_disabled_reason from public.viewer_demos where project_id='team/demo') not like 'firefox:%' then raise exception 'the suspension should name the failing profile';end if;
 if jsonb_array_length(public.reposhelf_viewer_state('team/demo')->'profiles')<>2 then raise exception 'one latest result per profile expected';end if;
 -- only a later pass in the same profile (or an explicit clearance) lifts it
 perform public.reposhelf_viewer_record('team/demo','ok',null,'firefox',cfg,'https://demo.example/app','https://demo.example/app','hash1','{}'::jsonb);
 if (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a firefox pass should lift the firefox suspension';end if;
 perform public.reposhelf_viewer_record('team/demo','inconclusive','timeout','webkit',cfg,'https://demo.example/app',null,'hash1','{}'::jsonb);
 if not (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'an inconclusive run must suspend the demo';end if;
 r:=public.reposhelf_viewer_clear_profile(admin_id,'team/demo','webkit');if (r->>'cleared')::int<>1 then raise exception 'clear should remove the profile evidence %',r;end if;
 if (select auto_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'clearing the failing profile lifts the suspension';end if;
 -- editing the scenario bumps the revision, records the editor, and rejects runs that started before the edit
 s:=public.reposhelf_viewer_save(admin_id,'team/demo','https://demo.example/app','{"steps":[2]}'::jsonb,'hash2',false,false,true,null);
 if (s->>'scenario_revision')::int<>2 or s->>'scenario_hash'<>'hash2' then raise exception 'scenario edit did not bump the revision %',s;end if;
 if (select count(*) from public.viewer_scenario_history where project_id='team/demo')<>2 or (select edited_by from public.viewer_scenario_history where project_id='team/demo' and revision=2)<>admin_id then raise exception 'history must keep each revision and its editor';end if;
 if public.reposhelf_viewer_record('team/demo','ok',null,'chromium',cfg,'https://demo.example/app','https://demo.example/app','hash1','{}'::jsonb)->>'reason'<>'scenario_changed' then raise exception 'a run for the old scenario must be rejected';end if;
 if public.reposhelf_viewer_record('team/demo','ok',null,'chromium',cfg,'https://demo.example/other','https://demo.example/other','hash2','{}'::jsonb)->>'reason'<>'address_changed' then raise exception 'a run for another address must be rejected';end if;
 -- saving without a change does not add history
 perform public.reposhelf_viewer_save(admin_id,'team/demo','https://demo.example/app','{"steps":[2]}'::jsonb,'hash2',true,false,true,'notes only');
 if (select count(*) from public.viewer_scenario_history where project_id='team/demo')<>2 then raise exception 'unchanged saves must not add history';end if;
 -- manual disable is never cleared by a successful run
 perform public.reposhelf_viewer_disable(admin_id,'team/demo',true,'looks broken on Safari');
 perform public.reposhelf_viewer_record('team/demo','ok',null,'chromium',cfg,'https://demo.example/app','https://demo.example/app','hash2','{}'::jsonb);
 if not (select manual_disabled from public.viewer_demos where project_id='team/demo') then raise exception 'a successful run must not clear a manual disable';end if;
 if jsonb_array_length(public.reposhelf_viewer_queue()->'items')<>0 then raise exception 'manually disabled demos must not be queued';end if;
 perform public.reposhelf_viewer_disable(admin_id,'team/demo',false,null);
 if jsonb_array_length(public.reposhelf_viewer_queue()->'items')<>1 or public.reposhelf_viewer_queue()->'items'->0->>'scenario_hash'<>'hash2' or public.reposhelf_viewer_queue()->'required_profiles'<>'["chromium", "firefox"]'::jsonb then raise exception 'the queue carries the scenario hash and required profiles';end if;
 -- evidence is pruned per profile, not across profiles
 for i in 1..25 loop perform public.reposhelf_viewer_record('team/demo','ok',null,'chromium',cfg,'https://demo.example/app','https://demo.example/app','hash2','{}'::jsonb);end loop;
 perform public.reposhelf_viewer_record('team/demo','ok',null,'firefox',cfg,'https://demo.example/app','https://demo.example/app','hash2','{}'::jsonb);
 if (select count(*) from public.viewer_evidence where project_id='team/demo' and browser='chromium')<>15 or (select count(*) from public.viewer_evidence where project_id='team/demo' and browser='firefox')<1 then raise exception 'evidence should be pruned per profile';end if;
 if public.reposhelf_viewer_list()->'demos'->0->'history'->0->>'revision'<>'2' or jsonb_array_length(public.reposhelf_viewer_list()->'demos'->0->'profiles')<>2 then raise exception 'the list shows history and profiles';end if;
 -- deleting a demo removes its evidence and history
 delete from public.viewer_demos where project_id='team/demo';
 if exists(select 1 from public.viewer_evidence where project_id='team/demo') or exists(select 1 from public.viewer_scenario_history where project_id='team/demo') then raise exception 'evidence and history must follow the demo';end if;
end$$;
-- privileges: nothing is reachable by signed-in or anonymous callers
do $$
declare t text;f text;
begin
 foreach t in array array['viewer_settings','viewer_demos','viewer_evidence','viewer_scenario_history'] loop
  if has_table_privilege('authenticated','public.'||t,'select') or has_table_privilege('anon','public.'||t,'select') or has_table_privilege('authenticated','public.'||t,'insert') then raise exception '% must not be reachable by clients',t;end if;
 end loop;
 foreach f in array array['reposhelf_viewer_profiles(text)','reposhelf_viewer_state(text)','reposhelf_viewer_list()','reposhelf_viewer_queue()','reposhelf_viewer_settings(uuid,boolean,text[])','reposhelf_viewer_save(uuid,text,text,jsonb,text,boolean,boolean,boolean,text)','reposhelf_viewer_disable(uuid,text,boolean,text)','reposhelf_viewer_record(text,text,text,text,text,text,text,text,jsonb)','reposhelf_viewer_resuspend(text)','reposhelf_viewer_clear_profile(uuid,text,text)'] loop
  if has_function_privilege('authenticated','public.'||f,'execute') or has_function_privilege('anon','public.'||f,'execute') then raise exception '% must be server-only',f;end if;
  if not has_function_privilege('service_role','public.'||f,'execute') then raise exception '% must be callable by the server',f;end if;
 end loop;
 if to_regprocedure('public.reposhelf_viewer_save(uuid,text,text,jsonb,boolean,boolean,boolean,text)') is not null or to_regprocedure('public.reposhelf_viewer_settings(uuid,boolean)') is not null then raise exception 'the superseded function signatures must be gone';end if;
end$$;
-- administrator preview preference: per account, off by default, server-only
do $$
declare u uuid:='00000000-0000-0000-0000-000000000001';
begin
 if public.reposhelf_viewer_pref_get(u) then raise exception 'the preview preference must start off';end if;
 if not public.reposhelf_viewer_pref_set(u,true) then raise exception 'preference not saved';end if;
 if not public.reposhelf_viewer_pref_get(u) then raise exception 'preference not read back';end if;
 if public.reposhelf_viewer_pref_get('00000000-0000-0000-0000-000000000002') then raise exception 'another account must be unaffected';end if;
 if has_function_privilege('anon','public.reposhelf_viewer_pref_get(uuid)','execute') or has_function_privilege('authenticated','public.reposhelf_viewer_pref_set(uuid,boolean)','execute') then raise exception 'clients must not call the preference functions';end if;
 if not has_function_privilege('service_role','public.reposhelf_viewer_pref_set(uuid,boolean)','execute') then raise exception 'the server must be able to set the preference';end if;
end$$;
-- site-wide switch: off by default, one row, server-only
do $$
begin
 if public.reposhelf_viewer_site_get() then raise exception 'the all-users switch must start off';end if;
 if not public.reposhelf_viewer_site_set('00000000-0000-0000-0000-000000000001',true) then raise exception 'switch not saved';end if;
 if not public.reposhelf_viewer_site_get() then raise exception 'switch not read back';end if;
 if public.reposhelf_viewer_site_set(null,false) then raise exception 'switch not turned off';end if;
 if public.reposhelf_viewer_site_get() then raise exception 'switch should be off again';end if;
 if (select count(*) from public.viewer_site_prefs)<>1 then raise exception 'there must be exactly one settings row';end if;
 if has_function_privilege('anon','public.reposhelf_viewer_site_get()','execute') or has_function_privilege('authenticated','public.reposhelf_viewer_site_set(uuid,boolean)','execute') then raise exception 'visitors must not reach the switch functions';end if;
 if has_table_privilege('anon','public.viewer_site_prefs','select') or has_table_privilege('authenticated','public.viewer_site_prefs','select') then raise exception 'visitors must not read the settings table';end if;
 if not has_function_privilege('service_role','public.reposhelf_viewer_site_set(uuid,boolean)','execute') then raise exception 'the server must be able to set the switch';end if;
end$$;
rollback;

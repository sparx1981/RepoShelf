-- Demo viewer pilot, second round of review fixes. Applies on top of migration 21 and is safe to run more than once.
--  * Evidence is judged per browser profile: a passing Chromium run no longer hides or clears a Firefox or WebKit failure.
--    Which profiles must pass is a setting; a profile's failure is cleared only by a later pass or an explicit administrator action.
--  * A scenario has a hash and a revision history. Editing the scenario (or the address) makes earlier evidence stop counting, and a
--    run that finishes after its scenario or address changed is rejected instead of recorded.
begin;
alter table public.viewer_settings add column if not exists required_profiles text[] not null default array['chromium']::text[];
alter table public.viewer_demos add column if not exists scenario_hash text check(length(scenario_hash)<=80);
alter table public.viewer_demos add column if not exists scenario_revision integer not null default 1;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='viewer_settings_profiles_check') then
  alter table public.viewer_settings add constraint viewer_settings_profiles_check check(required_profiles<@array['chromium','chromium-mobile','webkit','webkit-mobile','firefox']::text[] and cardinality(required_profiles)>=1);
 end if;
end $$;

create table if not exists public.viewer_scenario_history(
 id bigint generated always as identity primary key,
 project_id text not null references public.viewer_demos(project_id) on delete cascade,
 revision integer not null,
 scenario jsonb not null,
 scenario_hash text not null,
 demo_url text not null,
 edited_by uuid,
 edited_at timestamptz not null default now());
create index if not exists viewer_scenario_history_project on public.viewer_scenario_history(project_id,revision desc);
alter table public.viewer_scenario_history enable row level security;
revoke all on public.viewer_scenario_history from public,anon,authenticated;

drop function if exists public.reposhelf_viewer_settings(uuid,boolean);
drop function if exists public.reposhelf_viewer_save(uuid,text,text,jsonb,boolean,boolean,boolean,text);

-- Latest result per browser profile, which is what eligibility needs.
create or replace function public.reposhelf_viewer_profiles(p_project text) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(l) order by l.browser),'[]'::jsonb) from (
  select distinct on (browser) * from public.viewer_evidence where project_id=p_project order by browser,checked_at desc,id desc) l
$$;

create or replace function public.reposhelf_viewer_state(p_project text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'enabled',(select enabled from public.viewer_settings where id),
  'required_profiles',to_jsonb((select required_profiles from public.viewer_settings where id)),
  'demo',(select to_jsonb(d) from public.viewer_demos d where d.project_id=p_project),
  'latest',(select to_jsonb(e) from public.viewer_evidence e where e.project_id=p_project order by e.checked_at desc,e.id desc limit 1),
  'profiles',public.reposhelf_viewer_profiles(p_project))
$$;

create or replace function public.reposhelf_viewer_list() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'enabled',(select enabled from public.viewer_settings where id),
  'required_profiles',to_jsonb((select required_profiles from public.viewer_settings where id)),
  'demos',coalesce((select jsonb_agg(to_jsonb(d)||jsonb_build_object(
     'latest',(select to_jsonb(e) from public.viewer_evidence e where e.project_id=d.project_id order by e.checked_at desc,e.id desc limit 1),
     'profiles',public.reposhelf_viewer_profiles(d.project_id),
     'history',coalesce((select jsonb_agg(jsonb_build_object('revision',h.revision,'scenario_hash',h.scenario_hash,'edited_by',h.edited_by,'edited_at',h.edited_at,'demo_url',h.demo_url) order by h.revision desc) from (select * from public.viewer_scenario_history x where x.project_id=d.project_id order by x.revision desc limit 5) h),'[]'::jsonb)) order by d.project_id) from public.viewer_demos d),'[]'::jsonb))
$$;

create or replace function public.reposhelf_viewer_queue() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'required_profiles',to_jsonb((select required_profiles from public.viewer_settings where id)),
  'items',coalesce((select jsonb_agg(jsonb_build_object('project_id',project_id,'demo_url',demo_url,'scenario',scenario,'scenario_hash',scenario_hash,'allow_popups',allow_popups,'allow_downloads',allow_downloads) order by project_id) from public.viewer_demos where approved and not manual_disabled),'[]'::jsonb))
$$;

create or replace function public.reposhelf_viewer_settings(p_actor uuid,p_enabled boolean,p_required text[]) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 update public.viewer_settings set enabled=coalesce(p_enabled,enabled),required_profiles=coalesce(p_required,required_profiles),updated_at=now(),updated_by=p_actor where id;
 return jsonb_build_object('enabled',(select enabled from public.viewer_settings where id),'required_profiles',to_jsonb((select required_profiles from public.viewer_settings where id)));
end$$;

-- Create or update a pilot entry. A changed scenario or address bumps the revision and is recorded with the editor.
create or replace function public.reposhelf_viewer_save(p_actor uuid,p_project text,p_demo_url text,p_scenario jsonb,p_scenario_hash text,p_popups boolean,p_downloads boolean,p_approved boolean,p_notes text) returns jsonb language plpgsql security definer set search_path='' as $$
declare was boolean;old_hash text;old_url text;rev integer;row_json jsonb;
begin
 select approved,scenario_hash,demo_url,scenario_revision into was,old_hash,old_url,rev from public.viewer_demos where project_id=p_project;
 if not found then rev:=1;
 elsif old_hash is distinct from p_scenario_hash or old_url is distinct from p_demo_url then rev:=rev+1;end if;
 insert into public.viewer_demos(project_id,demo_url,scenario,scenario_hash,scenario_revision,allow_popups,allow_downloads,approved,approved_by,approved_at,notes)
  values(p_project,p_demo_url,coalesce(p_scenario,'{}'::jsonb),p_scenario_hash,rev,coalesce(p_popups,false),coalesce(p_downloads,false),coalesce(p_approved,false),case when p_approved then p_actor end,case when p_approved then now() end,left(p_notes,1000))
 on conflict(project_id) do update set demo_url=excluded.demo_url,scenario=excluded.scenario,scenario_hash=excluded.scenario_hash,scenario_revision=excluded.scenario_revision,
  allow_popups=excluded.allow_popups,allow_downloads=excluded.allow_downloads,approved=excluded.approved,
  approved_by=case when excluded.approved and not coalesce(was,false) then p_actor when excluded.approved then public.viewer_demos.approved_by else null end,
  approved_at=case when excluded.approved and not coalesce(was,false) then now() when excluded.approved then public.viewer_demos.approved_at else null end,
  notes=excluded.notes,updated_at=now();
 if old_hash is distinct from p_scenario_hash or old_url is distinct from p_demo_url or not exists(select 1 from public.viewer_scenario_history where project_id=p_project) then
  insert into public.viewer_scenario_history(project_id,revision,scenario,scenario_hash,demo_url,edited_by) values(p_project,rev,coalesce(p_scenario,'{}'::jsonb),p_scenario_hash,p_demo_url,p_actor);
 end if;
 select to_jsonb(d) into row_json from public.viewer_demos d where d.project_id=p_project;
 return row_json;
end$$;

-- Recompute the automatic suspension from the latest result of every profile.
create or replace function public.reposhelf_viewer_resuspend(p_project text) returns void language plpgsql security definer set search_path='' as $$
declare bad record;
begin
 select l.browser,l.result,l.reason into bad from (select distinct on (browser) * from public.viewer_evidence where project_id=p_project order by browser,checked_at desc,id desc) l where l.result<>'ok' order by l.browser limit 1;
 if found then update public.viewer_demos set auto_disabled=true,auto_disabled_at=coalesce(auto_disabled_at,now()),auto_disabled_reason=left(bad.browser||': '||coalesce(bad.reason,bad.result),300),updated_at=now() where project_id=p_project;
 else update public.viewer_demos set auto_disabled=false,auto_disabled_at=null,auto_disabled_reason=null,updated_at=now() where project_id=p_project;end if;
end$$;

-- Record one qualification run. A run for a scenario or address that has since changed is rejected, not recorded.
create or replace function public.reposhelf_viewer_record(p_project text,p_result text,p_reason text,p_browser text,p_config_id text,p_demo_url text,p_resolved_url text,p_scenario_hash text,p_details jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.viewer_demos;e_id bigint;
begin
 select * into d from public.viewer_demos where project_id=p_project;
 if not found then return jsonb_build_object('ok',false,'reason','unknown_demo');end if;
 if p_browser !~ '^(chromium|webkit)(-mobile)?$|^firefox$' then return jsonb_build_object('ok',false,'reason','unknown_profile');end if;
 if p_scenario_hash is distinct from d.scenario_hash then return jsonb_build_object('ok',false,'reason','scenario_changed');end if;
 if p_demo_url is distinct from d.demo_url then return jsonb_build_object('ok',false,'reason','address_changed');end if;
 insert into public.viewer_evidence(project_id,result,reason,browser,config_id,demo_url,resolved_url,scenario_hash,details)
  values(p_project,p_result,left(p_reason,300),p_browser,p_config_id,p_demo_url,p_resolved_url,p_scenario_hash,coalesce(p_details,'{}'::jsonb)) returning id into e_id;
 delete from public.viewer_evidence where project_id=p_project and browser=p_browser and id not in(select id from public.viewer_evidence where project_id=p_project and browser=p_browser order by checked_at desc,id desc limit 15);
 perform public.reposhelf_viewer_resuspend(p_project);
 return jsonb_build_object('ok',true,'id',e_id);
end$$;

-- Explicit administrator clearance: forget one profile's evidence, for example when a profile is retired.
create or replace function public.reposhelf_viewer_clear_profile(p_actor uuid,p_project text,p_browser text) returns jsonb language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 delete from public.viewer_evidence where project_id=p_project and browser=p_browser;get diagnostics n=row_count;
 perform public.reposhelf_viewer_resuspend(p_project);
 return jsonb_build_object('cleared',n);
end$$;

revoke all on function public.reposhelf_viewer_profiles(text),public.reposhelf_viewer_state(text),public.reposhelf_viewer_list(),public.reposhelf_viewer_queue(),public.reposhelf_viewer_settings(uuid,boolean,text[]),public.reposhelf_viewer_save(uuid,text,text,jsonb,text,boolean,boolean,boolean,text),public.reposhelf_viewer_resuspend(text),public.reposhelf_viewer_record(text,text,text,text,text,text,text,text,jsonb),public.reposhelf_viewer_clear_profile(uuid,text,text) from public,anon,authenticated;
grant execute on function public.reposhelf_viewer_profiles(text),public.reposhelf_viewer_state(text),public.reposhelf_viewer_list(),public.reposhelf_viewer_queue(),public.reposhelf_viewer_settings(uuid,boolean,text[]),public.reposhelf_viewer_save(uuid,text,text,jsonb,text,boolean,boolean,boolean,text),public.reposhelf_viewer_resuspend(text),public.reposhelf_viewer_record(text,text,text,text,text,text,text,text,jsonb),public.reposhelf_viewer_clear_profile(uuid,text,text) to service_role;
commit;

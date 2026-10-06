-- In-page demo viewer, pilot controls. Three tables (all server-only, no direct client access):
--   viewer_settings  one row: the global on/off switch
--   viewer_demos     the hand-approved pilot list: demo address, scenario, per-demo flags, manual and automatic disable state
--   viewer_evidence  one row per qualification run; the latest run decides eligibility
-- A successful qualification never clears an administrator's manual disable. Safe to run more than once.
begin;
create table if not exists public.viewer_settings(
 id boolean primary key default true check(id),
 enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid);
insert into public.viewer_settings(id) values(true) on conflict do nothing;

create table if not exists public.viewer_demos(
 project_id text primary key check(length(project_id) between 3 and 200),
 demo_url text not null check(demo_url ~ '^https://' and length(demo_url)<=2048),
 scenario jsonb not null default '{}'::jsonb check(jsonb_typeof(scenario)='object' and length(scenario::text)<=20000),
 allow_popups boolean not null default false,
 allow_downloads boolean not null default false,
 approved boolean not null default false,
 approved_by uuid,
 approved_at timestamptz,
 manual_disabled boolean not null default false,
 manual_disabled_by uuid,
 manual_disabled_at timestamptz,
 manual_disabled_reason text check(length(manual_disabled_reason)<=300),
 auto_disabled boolean not null default false,
 auto_disabled_at timestamptz,
 auto_disabled_reason text check(length(auto_disabled_reason)<=300),
 notes text check(length(notes)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now());

create table if not exists public.viewer_evidence(
 id bigint generated always as identity primary key,
 project_id text not null references public.viewer_demos(project_id) on delete cascade,
 checked_at timestamptz not null default now(),
 result text not null check(result in ('ok','failed','inconclusive')),
 reason text check(length(reason)<=300),
 browser text not null check(length(browser)<=60),
 config_id text not null check(length(config_id)<=120),
 demo_url text not null check(length(demo_url)<=2048),
 resolved_url text check(length(resolved_url)<=2048),
 scenario_hash text check(length(scenario_hash)<=80),
 details jsonb not null default '{}'::jsonb check(length(details::text)<=20000));
create index if not exists viewer_evidence_latest on public.viewer_evidence(project_id,checked_at desc,id desc);

alter table public.viewer_settings enable row level security;
alter table public.viewer_demos enable row level security;
alter table public.viewer_evidence enable row level security;
revoke all on public.viewer_settings,public.viewer_demos,public.viewer_evidence from public,anon,authenticated;

-- What the eligibility check needs for one project: the global switch, the approval row and the latest evidence.
create or replace function public.reposhelf_viewer_state(p_project text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'enabled',(select enabled from public.viewer_settings where id),
  'demo',(select to_jsonb(d) from public.viewer_demos d where d.project_id=p_project),
  'latest',(select to_jsonb(e) from public.viewer_evidence e where e.project_id=p_project order by e.checked_at desc,e.id desc limit 1))
$$;

create or replace function public.reposhelf_viewer_list() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'enabled',(select enabled from public.viewer_settings where id),
  'demos',coalesce((select jsonb_agg(to_jsonb(d)||jsonb_build_object('latest',(select to_jsonb(e) from public.viewer_evidence e where e.project_id=d.project_id order by e.checked_at desc,e.id desc limit 1)) order by d.project_id) from public.viewer_demos d),'[]'::jsonb))
$$;

-- The qualification job's work list: approved demos that are not manually disabled.
create or replace function public.reposhelf_viewer_queue() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('project_id',project_id,'demo_url',demo_url,'scenario',scenario,'allow_popups',allow_popups,'allow_downloads',allow_downloads) order by project_id),'[]'::jsonb)
 from public.viewer_demos where approved and not manual_disabled
$$;

create or replace function public.reposhelf_viewer_settings(p_actor uuid,p_enabled boolean) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 update public.viewer_settings set enabled=coalesce(p_enabled,false),updated_at=now(),updated_by=p_actor where id;
 return jsonb_build_object('enabled',(select enabled from public.viewer_settings where id));
end$$;

-- Create or update a pilot entry. Changing the demo address keeps the approval but the old evidence stops counting,
-- because eligibility requires evidence for the exact current address.
create or replace function public.reposhelf_viewer_save(p_actor uuid,p_project text,p_demo_url text,p_scenario jsonb,p_popups boolean,p_downloads boolean,p_approved boolean,p_notes text) returns jsonb language plpgsql security definer set search_path='' as $$
declare was boolean;row_json jsonb;
begin
 select approved into was from public.viewer_demos where project_id=p_project;
 insert into public.viewer_demos(project_id,demo_url,scenario,allow_popups,allow_downloads,approved,approved_by,approved_at,notes)
  values(p_project,p_demo_url,coalesce(p_scenario,'{}'::jsonb),coalesce(p_popups,false),coalesce(p_downloads,false),coalesce(p_approved,false),case when p_approved then p_actor end,case when p_approved then now() end,left(p_notes,1000))
 on conflict(project_id) do update set demo_url=excluded.demo_url,scenario=excluded.scenario,allow_popups=excluded.allow_popups,allow_downloads=excluded.allow_downloads,
  approved=excluded.approved,
  approved_by=case when excluded.approved and not coalesce(was,false) then p_actor when excluded.approved then public.viewer_demos.approved_by else null end,
  approved_at=case when excluded.approved and not coalesce(was,false) then now() when excluded.approved then public.viewer_demos.approved_at else null end,
  notes=excluded.notes,updated_at=now();
 select to_jsonb(d) into row_json from public.viewer_demos d where d.project_id=p_project;
 return row_json;
end$$;

-- Manual disable and re-enable. Only this function changes the manual flag; qualification results never do.
create or replace function public.reposhelf_viewer_disable(p_actor uuid,p_project text,p_disabled boolean,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare row_json jsonb;
begin
 update public.viewer_demos set manual_disabled=coalesce(p_disabled,false),
  manual_disabled_by=case when p_disabled then p_actor end,manual_disabled_at=case when p_disabled then now() end,
  manual_disabled_reason=case when p_disabled then left(p_reason,300) end,updated_at=now() where project_id=p_project;
 select to_jsonb(d) into row_json from public.viewer_demos d where d.project_id=p_project;
 return row_json;
end$$;

-- Record one qualification run. A failed or inconclusive run suspends the demo automatically; only a later successful
-- run lifts that automatic suspension. The administrator's manual disable is never touched here.
create or replace function public.reposhelf_viewer_record(p_project text,p_result text,p_reason text,p_browser text,p_config_id text,p_demo_url text,p_resolved_url text,p_scenario_hash text,p_details jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare e_id bigint;
begin
 if not exists(select 1 from public.viewer_demos where project_id=p_project) then return jsonb_build_object('ok',false,'reason','unknown_demo');end if;
 insert into public.viewer_evidence(project_id,result,reason,browser,config_id,demo_url,resolved_url,scenario_hash,details)
  values(p_project,p_result,left(p_reason,300),p_browser,p_config_id,p_demo_url,p_resolved_url,p_scenario_hash,coalesce(p_details,'{}'::jsonb)) returning id into e_id;
 if p_result='ok' then
  update public.viewer_demos set auto_disabled=false,auto_disabled_at=null,auto_disabled_reason=null,updated_at=now() where project_id=p_project;
 else
  update public.viewer_demos set auto_disabled=true,auto_disabled_at=now(),auto_disabled_reason=left(coalesce(p_reason,p_result),300),updated_at=now() where project_id=p_project;
 end if;
 delete from public.viewer_evidence where project_id=p_project and id not in(select id from public.viewer_evidence where project_id=p_project order by checked_at desc,id desc limit 30);
 return jsonb_build_object('ok',true,'id',e_id);
end$$;

revoke all on function public.reposhelf_viewer_state(text),public.reposhelf_viewer_list(),public.reposhelf_viewer_queue(),public.reposhelf_viewer_settings(uuid,boolean),public.reposhelf_viewer_save(uuid,text,text,jsonb,boolean,boolean,boolean,text),public.reposhelf_viewer_disable(uuid,text,boolean,text),public.reposhelf_viewer_record(text,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_viewer_state(text),public.reposhelf_viewer_list(),public.reposhelf_viewer_queue(),public.reposhelf_viewer_settings(uuid,boolean),public.reposhelf_viewer_save(uuid,text,text,jsonb,boolean,boolean,boolean,text),public.reposhelf_viewer_disable(uuid,text,boolean,text),public.reposhelf_viewer_record(text,text,text,text,text,text,text,text,jsonb) to service_role;
commit;

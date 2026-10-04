begin;
create table if not exists public.listing_controls(project_id text primary key check(project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' and length(project_id)<=220),visibility text not null default 'visible' check(visibility in('visible','hidden','excluded')),description text check(length(description)<=2000),category text check(length(category)<=100),preview_rejected boolean not null default false,rejected_preview text check(length(rejected_preview)<=2048),rejected_at timestamptz,refresh_requested_at timestamptz,revision integer not null default 1,updated_at timestamptz not null default now());
create unique index if not exists listing_controls_case_id on public.listing_controls(lower(project_id));
create table if not exists public.listing_reports(id uuid primary key default gen_random_uuid(),project_id text not null check(project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' and length(project_id)<=220),reporter uuid references auth.users(id) on delete set null,reason text not null check(reason in('broken_demo','misleading','inappropriate','ownership','copyright','other')),explanation text not null default '' check(length(explanation)<=2000),status text not null default 'open' check(status in('open','reviewed','dismissed')),revision integer not null default 1,created_at timestamptz not null default now(),reviewed_at timestamptz);
create index if not exists listing_reports_inbox on public.listing_reports(status,created_at desc);
create table if not exists public.listing_moderation_audit(id bigint generated always as identity primary key,project_id text not null,actor uuid references auth.users(id) on delete set null,action text not null,note text not null default '' check(length(note)<=2000),changes jsonb not null default '{}',created_at timestamptz not null default now());
alter table public.listing_controls enable row level security;alter table public.listing_reports enable row level security;alter table public.listing_moderation_audit enable row level security;
revoke all on public.listing_controls,public.listing_reports,public.listing_moderation_audit from public,anon,authenticated;
grant select on public.listing_controls,public.listing_reports,public.listing_moderation_audit to authenticated;
grant all on public.listing_controls,public.listing_reports,public.listing_moderation_audit to service_role;
create policy controls_admin on public.listing_controls for select to authenticated using(public.reposhelf_is_admin());
create policy reports_admin on public.listing_reports for select to authenticated using(public.reposhelf_is_admin());
create policy moderation_audit_admin on public.listing_moderation_audit for select to authenticated using(public.reposhelf_is_admin());
create or replace function public.reposhelf_public_listing_controls() returns jsonb language sql stable security definer set search_path='' as $$select coalesce(jsonb_agg(to_jsonb(c)),'[]') from public.listing_controls c$$;
revoke all on function public.reposhelf_public_listing_controls() from public;
grant execute on function public.reposhelf_public_listing_controls() to anon,authenticated,service_role;
create or replace function public.reposhelf_report_listing(project text,report_reason text,details text) returns jsonb language plpgsql security definer set search_path='' as $$declare existing public.listing_reports;begin
if auth.uid() is null or not exists(select 1 from auth.identities where user_id=auth.uid() and provider='github') then raise insufficient_privilege;end if;
if project is null or project!~'^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' or length(project)>220 or report_reason is null or report_reason not in('broken_demo','misleading','inappropriate','ownership','copyright','other') or details is null or length(details)>2000 then raise check_violation;end if;
perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,71883010));
select * into existing from public.listing_reports where reporter=auth.uid() and lower(project_id)=lower(project) and reason=report_reason and status='open' order by created_at desc limit 1;
if found then return jsonb_build_object('id',existing.id,'status',existing.status,'duplicate',true);end if;
if (select count(*) from public.listing_reports where reporter=auth.uid() and created_at>=now()-interval '1 day')>=10 then raise exception using errcode='PT429',message='Daily report limit';end if;
insert into public.listing_reports(project_id,reporter,reason,explanation) values(project,auth.uid(),report_reason,details) returning * into existing;
return jsonb_build_object('id',existing.id,'status',existing.status,'duplicate',false);end$$;
create or replace function public.reposhelf_moderate_listing(project text,expected_revision integer,settings jsonb,admin_note text) returns public.listing_controls language plpgsql security definer set search_path='' as $$declare saved public.listing_controls;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
if project is null or project!~'^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' or length(project)>220 or expected_revision is null or jsonb_typeof(settings)<>'object' or admin_note is null or length(admin_note)>2000 or settings->>'visibility' is null or settings->>'visibility' not in('visible','hidden','excluded') or length(settings->>'description')>2000 or length(settings->>'category')>100 or length(settings->>'rejected_preview')>2048 then raise check_violation;end if;
perform pg_advisory_xact_lock(hashtextextended(lower(project),71883011));
select * into saved from public.listing_controls where project_id=project;
if coalesce(saved.revision,0)<>expected_revision then raise exception using errcode='40001',message='Listing changed';end if;
insert into public.listing_controls(project_id,visibility,description,category,preview_rejected,rejected_preview,rejected_at,refresh_requested_at) values(project,settings->>'visibility',nullif(settings->>'description',''),nullif(settings->>'category',''),coalesce((settings->>'preview_rejected')::boolean,false),settings->>'rejected_preview',case when (settings->>'preview_rejected')::boolean then now() else null end,case when (settings->>'refresh')::boolean then now() else null end)
on conflict(project_id) do update set visibility=excluded.visibility,description=excluded.description,category=excluded.category,preview_rejected=excluded.preview_rejected,rejected_preview=excluded.rejected_preview,rejected_at=excluded.rejected_at,refresh_requested_at=coalesce(excluded.refresh_requested_at,listing_controls.refresh_requested_at),revision=listing_controls.revision+1,updated_at=now() returning * into saved;
insert into public.listing_moderation_audit(project_id,actor,action,note,changes) values(project,auth.uid(),'listing_updated',admin_note,settings);return saved;end$$;
create or replace function public.reposhelf_review_report(report uuid,expected_revision integer,review_status text,admin_note text) returns boolean language plpgsql security definer set search_path='' as $$declare project text;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;if review_status is null or review_status not in('reviewed','dismissed') or admin_note is null or length(admin_note)>2000 then raise check_violation;end if;
update public.listing_reports set status=review_status,revision=revision+1,reviewed_at=now() where id=report and revision=expected_revision returning project_id into project;
if not found then raise exception using errcode='40001',message='Report changed';end if;
insert into public.listing_moderation_audit(project_id,actor,action,note,changes) values(project,auth.uid(),'report_'||review_status,admin_note,jsonb_build_object('report',report));return true;end$$;
revoke all on function public.reposhelf_report_listing(text,text,text),public.reposhelf_moderate_listing(text,integer,jsonb,text),public.reposhelf_review_report(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.reposhelf_report_listing(text,text,text),public.reposhelf_moderate_listing(text,integer,jsonb,text),public.reposhelf_review_report(uuid,integer,text,text) to authenticated;

alter table public.analytics_events add column if not exists shelf text check(shelf ~ '^[a-zA-Z0-9:_.-]{1,80}$');
alter table public.analytics_events drop constraint if exists analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check check(kind in('page_view','listing_view','demo_click','fork_click','search','like','verified_fork','sign_in_start','sign_in_complete'));
create table if not exists public.analytics_launch_tracking(id boolean primary key check(id),started_at timestamptz not null default now());
alter table public.analytics_launch_tracking enable row level security;revoke all on public.analytics_launch_tracking from public,anon,authenticated;insert into public.analytics_launch_tracking(id) values(true) on conflict do nothing;
create or replace function public.reposhelf_ingest_events(events jsonb) returns integer language plpgsql security definer set search_path='' as $$declare e jsonb; saved integer:=0; n integer; utcday date:=(now() at time zone 'UTC')::date; win timestamptz:=date_trunc('minute',now());begin
if jsonb_typeof(events)<>'array' or jsonb_array_length(events)>10 then raise check_violation;end if;
for e in select * from jsonb_array_elements(events) loop
if e->>'session_hash'!~'^[a-f0-9]{64}$' or e->>'visitor_hash'!~'^[a-f0-9]{64}$' then raise check_violation;end if;
insert into public.analytics_limits(session_hash,bucket_at,count) values(e->>'session_hash',win,1) on conflict(session_hash,bucket_at) do update set count=analytics_limits.count+1 returning count into n;
if n>120 then continue;end if;
if e->>'period_visitor_hash' is not null and e->>'period_visitor_hash'!~'^[a-f0-9]{64}$' then raise check_violation;end if;
insert into public.analytics_events(event_id,kind,session_hash,visitor_hash,project_id,period_visitor_hash,shelf,created_at) values((e->>'event_id')::uuid,e->>'kind',e->>'session_hash',e->>'visitor_hash',e->>'project_id',e->>'period_visitor_hash',e->>'shelf',clock_timestamp()) on conflict do nothing;
if not found then continue;end if;saved:=saved+1;
insert into public.analytics_daily(day) values(utcday) on conflict do nothing;
insert into public.analytics_sessions values(utcday,e->>'session_hash') on conflict do nothing;
if found then update public.analytics_daily set visits=visits+1 where day=utcday;end if;
insert into public.analytics_visitors values(utcday,e->>'visitor_hash') on conflict do nothing;
if found then update public.analytics_daily set visitors=visitors+1 where day=utcday;end if;
update public.analytics_daily set page_views=page_views+(case when e->>'kind'='page_view' then 1 else 0 end),listing_views=listing_views+(case when e->>'kind'='listing_view' then 1 else 0 end),demo_clicks=demo_clicks+(case when e->>'kind'='demo_click' then 1 else 0 end),fork_clicks=fork_clicks+(case when e->>'kind'='fork_click' then 1 else 0 end),searches=searches+(case when e->>'kind'='search' then 1 else 0 end) where day=utcday;
end loop;
-- Deduplicated daily totals remain; detailed events have a 90-day retention bucket_at.
if pg_try_advisory_xact_lock(71883002) then delete from public.analytics_limits where bucket_at<now()-interval '1 hour';delete from public.analytics_events where created_at<now()-interval '90 days';delete from public.analytics_sessions where day<utcday-90;delete from public.analytics_visitors where day<utcday-90;end if;
return saved;end$$;
revoke all on function public.reposhelf_ingest_events(jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_ingest_events(jsonb) to service_role;
create or replace function public.reposhelf_launch_analytics(days integer default 30) returns jsonb language plpgsql security definer set search_path='' as $$declare cutoff timestamptz;tracking_started timestamptz;result jsonb;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;if days not between 1 and 90 then raise check_violation;end if;
select started_at into tracking_started from public.analytics_launch_tracking where id=true;
cutoff:=greatest((((now() at time zone 'UTC')::date-days+1)::timestamp at time zone 'UTC'),tracking_started);
with events as(select * from public.analytics_events where created_at>=cutoff), pairs as(select session_hash,period_visitor_hash,project_id,min(created_at) filter(where kind='listing_view') as viewed,min(created_at) filter(where kind='demo_click') as demo,min(created_at) filter(where kind='like') as liked from events where project_id is not null group by session_hash,period_visitor_hash,project_id),signins as(select session_hash,min(created_at) filter(where kind='sign_in_start') as started,min(created_at) filter(where kind='sign_in_complete') as completed from events group by session_hash)
select jsonb_build_object('configured',true,'startedAt',tracking_started,'listingSessions',(select count(*) from pairs where viewed is not null),'viewToDemo',(select count(*) from pairs where demo>=viewed),'viewToLike',(select count(*) from pairs where liked>=viewed),'demoSessions',(select count(*) from pairs where demo is not null),'demoToLike',(select count(*) from pairs where liked>=demo),'signInStarts',(select count(*) from signins where started is not null),'signInCompletions',(select count(*) from signins where completed>=started),'forkClicks',(select count(*) from events where kind='fork_click'),'verifiedForks',(select count(*) from events where kind='verified_fork'),'returningVisitors',(select count(*) from (select period_visitor_hash from events where period_visitor_hash is not null group by period_visitor_hash having count(distinct (created_at at time zone 'UTC')::date)>1) r),'rows',coalesce((select jsonb_agg(r) from (select shelf,count(*) filter(where kind='listing_view') as listing_views,count(*) filter(where kind='demo_click') as demo_clicks,count(*) filter(where kind='like') as likes,count(*) filter(where kind='fork_click') as fork_clicks from events where shelf is not null group by shelf order by count(*) filter(where kind='listing_view') desc,shelf limit 50) r),'[]'::jsonb)) into result;return result;end$$;
revoke all on function public.reposhelf_launch_analytics(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_launch_analytics(integer) to authenticated;
notify pgrst,'reload schema';
commit;

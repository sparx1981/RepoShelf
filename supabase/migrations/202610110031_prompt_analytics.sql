begin;
-- Prompt library actions. Stored apart from analytics_events so the catalogue's own reports and
-- constraints are unchanged. Same rules: consent, privacy signals and admins are excluded before
-- anything reaches here, and visitors are stored only as keyed hashes.
create table if not exists public.prompt_events(
 event_id uuid primary key,
 kind text not null check(kind in('prompt_view','prompt_reveal','code_reveal','prompt_copy','code_copy','zip_download','ai_open','lock_signin')),
 prompt_key text not null check(prompt_key ~ '^(siteshelf|sceneai)/[a-z0-9-]{1,80}$'),
 session_hash text not null,
 visitor_hash text not null,
 period_visitor_hash text not null,
 created_at timestamptz not null default now());
create index if not exists prompt_events_time on public.prompt_events(created_at);
create index if not exists prompt_events_key on public.prompt_events(prompt_key,kind);
alter table public.prompt_events enable row level security;
revoke all on public.prompt_events from public,anon,authenticated;
grant all on public.prompt_events to service_role;

create or replace function public.reposhelf_ingest_prompt_events(events jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare e jsonb; saved integer:=0; n integer;
begin
 if jsonb_typeof(events)<>'array' or jsonb_array_length(events)>10 then raise check_violation;end if;
 -- Per-event rows are kept for 90 days, as the Privacy Policy states for other analytics events.
 if pg_try_advisory_xact_lock(71883003) then delete from public.prompt_events where created_at<now()-interval '90 days';end if;
 for e in select * from jsonb_array_elements(events) loop
  insert into public.prompt_events(event_id,kind,prompt_key,session_hash,visitor_hash,period_visitor_hash)
   values((e->>'event_id')::uuid,e->>'kind',e->>'prompt_key',e->>'session_hash',e->>'visitor_hash',e->>'period_visitor_hash') on conflict do nothing;
  get diagnostics n=row_count; saved:=saved+n;
 end loop;
 return saved;
end$$;
revoke all on function public.reposhelf_ingest_prompt_events(jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_ingest_prompt_events(jsonb) to service_role;

-- Administrator summary: totals by action, a daily series and the most-used prompts.
create or replace function public.reposhelf_admin_prompts(p_days integer default 30) returns jsonb language plpgsql security definer set search_path='' as $$
declare since timestamptz; out jsonb;
begin
 if not public.reposhelf_is_admin() then raise exception 'forbidden' using errcode='42501';end if;
 if p_days is null or p_days<1 or p_days>365 then raise check_violation;end if;
 since:=date_trunc('day',now())-((p_days-1)||' days')::interval;
 select jsonb_build_object(
  'days',p_days,
  'totals',coalesce((select jsonb_object_agg(kind,n) from (select kind,count(*) as n from public.prompt_events where created_at>=since group by kind) t),'{}'::jsonb),
  'visitors',(select count(distinct period_visitor_hash) from public.prompt_events where created_at>=since),
  'daily',coalesce((select jsonb_agg(jsonb_build_object('day',day,'views',views,'reveals',reveals,'downloads',downloads) order by day) from (
     select (created_at at time zone 'UTC')::date as day,
       count(*) filter(where kind='prompt_view') as views,
       count(*) filter(where kind in('prompt_reveal','code_reveal')) as reveals,
       count(*) filter(where kind='zip_download') as downloads
     from public.prompt_events where created_at>=since group by 1) d),'[]'::jsonb),
  'top',coalesce((select jsonb_agg(jsonb_build_object('prompt',prompt_key,'views',views,'reveals',reveals,'actions',actions) order by views desc,reveals desc) from (
     select prompt_key,
       count(*) filter(where kind='prompt_view') as views,
       count(*) filter(where kind in('prompt_reveal','code_reveal')) as reveals,
       count(*) filter(where kind in('prompt_copy','code_copy','zip_download','ai_open')) as actions
     from public.prompt_events where created_at>=since group by prompt_key order by 2 desc,3 desc limit 25) k),'[]'::jsonb)
 ) into out;
 return out;
end$$;
revoke all on function public.reposhelf_admin_prompts(integer) from public,anon;
grant execute on function public.reposhelf_admin_prompts(integer) to authenticated,service_role;
commit;

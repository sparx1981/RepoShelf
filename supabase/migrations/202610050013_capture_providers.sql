begin;
-- No API keys live in the database. All providers start disabled.
create table public.capture_settings(id boolean primary key default true check(id),providers jsonb not null default '{"screenshotone":false,"thumio":false,"cloudflare":false}',revision integer not null default 1,updated_at timestamptz not null default now());
create table public.capture_usage(provider text not null check(provider in('screenshotone','thumio','cloudflare')),period date not null,attempts integer not null default 0 check(attempts>=0),primary key(provider,period));
insert into public.capture_settings(id) values(true);
alter table public.capture_settings enable row level security;alter table public.capture_usage enable row level security;
revoke all on public.capture_settings,public.capture_usage from public,anon,authenticated;
grant select on public.capture_settings,public.capture_usage to authenticated;
grant all on public.capture_settings,public.capture_usage to service_role;
create policy capture_settings_admin on public.capture_settings for select to authenticated using(public.reposhelf_is_admin());
create policy capture_usage_admin on public.capture_usage for select to authenticated using(public.reposhelf_is_admin());
create function public.reposhelf_capture_settings(expected_revision integer,enabled jsonb) returns public.capture_settings language plpgsql security definer set search_path='' as $$declare saved public.capture_settings;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
if enabled is null or jsonb_typeof(enabled)<>'object' or (select count(*) from jsonb_object_keys(enabled))<>3 or jsonb_typeof(enabled->'screenshotone') is distinct from 'boolean' or jsonb_typeof(enabled->'thumio') is distinct from 'boolean' or jsonb_typeof(enabled->'cloudflare') is distinct from 'boolean' then raise check_violation;end if;
update public.capture_settings set providers=enabled,revision=revision+1,updated_at=now() where id and revision=expected_revision returning * into saved;
if not found then raise exception using errcode='40001',message='Screenshot settings changed';end if;return saved;end$$;
-- Reserve BEFORE contacting the provider. Failed requests also consume allowance.
-- Cloudflare reserves 60 seconds per attempt (10 attempts/day), conservatively.
create function public.reposhelf_capture_reserve(chosen text) returns jsonb language plpgsql security definer set search_path='' as $$declare allowance integer;bucket date;used integer;begin
if chosen is null or chosen not in('screenshotone','thumio','cloudflare') then raise check_violation;end if;
perform pg_advisory_xact_lock(71883013);
if not coalesce((select (providers->>chosen)::boolean from public.capture_settings where id),false) then return jsonb_build_object('allowed',false,'reason','disabled');end if;
bucket:=(now() at time zone 'UTC')::date;
if chosen<>'cloudflare' then bucket:=date_trunc('month',bucket)::date;end if;
allowance:=case chosen when 'screenshotone' then 100 when 'thumio' then 1000 else 10 end;
insert into public.capture_usage(provider,period,attempts) values(chosen,bucket,0) on conflict do nothing;
update public.capture_usage set attempts=attempts+1 where provider=chosen and period=bucket and attempts<allowance returning attempts into used;
if not found then return jsonb_build_object('allowed',false,'reason','free_allowance_exhausted','limit',allowance);end if;
return jsonb_build_object('allowed',true,'used',used,'limit',allowance,'period',bucket);end$$;
revoke all on function public.reposhelf_capture_settings(integer,jsonb),public.reposhelf_capture_reserve(text) from public,anon,authenticated;
grant execute on function public.reposhelf_capture_settings(integer,jsonb) to authenticated;
grant execute on function public.reposhelf_capture_reserve(text) to service_role;
-- Provider images must be reviewed before entering the public catalogue.
alter table public.listing_controls add column approved_preview text check(length(approved_preview)<=2048);
create function public.reposhelf_approve_preview(project text,expected_revision integer,preview text) returns boolean language plpgsql security definer set search_path='' as $$begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
if expected_revision is null or expected_revision<0 or project is null or project!~'^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' or preview is null or preview!~'^previews/[a-f0-9]{24}-provider\.jpg$' then raise check_violation;end if;
perform pg_advisory_xact_lock(hashtextextended(lower(project),71883011));
if coalesce((select revision from public.listing_controls where project_id=project),0)<>expected_revision then raise exception using errcode='40001',message='Listing changed';end if;
insert into public.listing_controls(project_id,approved_preview) values(project,preview) on conflict(project_id) do update set approved_preview=excluded.approved_preview,revision=listing_controls.revision+1,updated_at=now();
insert into public.listing_moderation_audit(project_id,actor,action) values(project,auth.uid(),'provider_preview_approved');return true;end$$;
revoke all on function public.reposhelf_approve_preview(text,integer,text) from public,anon,authenticated;
grant execute on function public.reposhelf_approve_preview(text,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;

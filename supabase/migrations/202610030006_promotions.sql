begin;
create table public.promotions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 repo_name text not null check(repo_name ~ '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'), repo_id text not null, owner_id text not null,
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=20000),
 status text not null default 'pending' check(status in ('pending','approved','rejected','checkout','paid_waiting','active','paused','expired','refunded')),
 amount integer not null default 1500 check(amount=1500), currency text not null default 'gbp' check(currency='gbp'),
 remaining_seconds numeric not null default 2592000 check(remaining_seconds between 0 and 2592000), active_since timestamptz,
 checkout_attempt uuid, checkout_session text unique, payment_intent text unique, paid_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, review_note text not null default '',
 pause_reason text, health_checked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index promotions_one_open_repo on public.promotions(repo_id) where status not in ('expired','rejected','refunded');
create index promotions_owner on public.promotions(user_id,created_at desc);
alter table public.promotions enable row level security;
revoke all on public.promotions from public,anon,authenticated;
grant select on public.promotions to authenticated;
grant select,insert,update,delete on public.promotions to service_role;
create policy promotion_owner_read on public.promotions for select to authenticated using(user_id=auth.uid() or public.reposhelf_is_admin());
create table public.promotion_events(id bigint generated always as identity primary key,promotion_id uuid references public.promotions(id) on delete cascade,event text not null,at timestamptz not null default now(),detail text not null default '');
revoke all on public.promotion_events from public,anon,authenticated;
alter table public.promotion_events enable row level security;
grant select on public.promotion_events to authenticated;
grant select,insert on public.promotion_events to service_role;
grant usage,select on sequence public.promotion_events_id_seq to service_role;
create policy promotion_event_read on public.promotion_events for select to authenticated using(public.reposhelf_is_admin() or exists(select 1 from public.promotions p where p.id=promotion_id and p.user_id=auth.uid()));
create or replace function public.reposhelf_promotion_write(operation text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.promotions; old_status text; seats integer; who uuid; elapsed numeric; healthy text; reason text;
begin
 perform pg_advisory_xact_lock(724903006);
 if operation='request' then
  who:=(payload->>'user_id')::uuid;
  if not exists(select 1 from auth.identities i where i.user_id=who and i.provider='github' and coalesce(i.provider_id,i.identity_data->>'provider_id',i.identity_data->>'sub')=payload->>'owner_id') then raise insufficient_privilege;end if;
  if (select count(*) from public.promotions where user_id=who and status='pending')>=3 then raise exception 'At most three pending requests' using errcode='PT420';end if;
  insert into public.promotions(user_id,repo_name,repo_id,owner_id,snapshot) values(who,payload->>'repo_name',payload->>'repo_id',payload->>'owner_id',payload->'snapshot') returning * into p;
 else
  select * into p from public.promotions where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'Promotion not found' using errcode='P0002';end if;
  old_status:=p.status;
  if operation in ('review','refund') then
   if not exists(select 1 from public.reposhelf_admins where user_id=(payload->>'reviewer')::uuid) then raise insufficient_privilege;end if;
  end if;
  if operation='review' then
   if p.status not in ('pending','approved') then raise exception 'Request is already in checkout or paid' using errcode='40001';end if;
   if payload->>'decision' not in ('approved','rejected') or length(coalesce(payload->>'note',''))>500 then raise check_violation;end if;
   p.status:=payload->>'decision';p.reviewed_by:=(payload->>'reviewer')::uuid;p.reviewed_at:=now();p.review_note:=coalesce(payload->>'note','');
  elsif operation='reserve' then
   if p.user_id<>(payload->>'user_id')::uuid then raise insufficient_privilege;end if;
   if p.status='checkout' then return to_jsonb(p);end if;
   if p.status<>'approved' then raise exception 'Approval required before checkout' using errcode='40001';end if;
   if exists(select 1 from public.promotions where status='paid_waiting') then raise exception 'Paid promotions are waiting for a slot' using errcode='PT429';end if;
   select count(*) into seats from public.promotions where status in ('active','paused','checkout');
   if seats>=5 then raise exception 'All five promotion slots are occupied. Try again when a slot opens.' using errcode='PT429';end if;
   p.status:='checkout';p.checkout_attempt:=gen_random_uuid();p.checkout_session:=null;
  elsif operation='session' then
   if p.status<>'checkout' or p.checkout_attempt is distinct from (payload->>'attempt')::uuid then raise exception 'Checkout changed' using errcode='40001';end if;
   if p.checkout_session is not null and p.checkout_session is distinct from payload->>'session' then raise exception 'Checkout changed' using errcode='40001';end if;
   p.checkout_session:=payload->>'session';
  elsif operation='checkout_expired' then
   if p.status='checkout' and p.checkout_session=payload->>'session' then p.status:='approved';end if;
  elsif operation='paid' then
   if p.payment_intent is not null then
    if p.payment_intent=payload->>'payment' then return to_jsonb(p);end if;
    raise exception 'Different payment already recorded' using errcode='40001';
   end if;
   if p.status not in ('checkout','approved') or p.checkout_session is distinct from payload->>'session' or p.checkout_attempt is distinct from (payload->>'attempt')::uuid or (payload->>'amount')::integer is distinct from p.amount or payload->>'currency' is distinct from p.currency then raise check_violation;end if;
   p.payment_intent:=payload->>'payment';p.paid_at:=now();p.status:='paid_waiting';
  elsif operation='health' then
   healthy:=payload->>'health';reason:=left(payload->>'reason',200);
   if healthy not in ('available','unavailable','temporary') then raise check_violation;end if;
   p.health_checked_at:=now();
   if p.status='active' then
    elapsed:=greatest(0,extract(epoch from now()-p.active_since));p.remaining_seconds:=greatest(0,p.remaining_seconds-elapsed);p.active_since:=now();
    if p.remaining_seconds=0 then p.status:='expired';p.active_since:=null;
    elsif healthy='unavailable' then p.status:='paused';p.active_since:=null;p.pause_reason:=reason;end if;
   elsif p.status='paused' and healthy='available' then p.status:='active';p.active_since:=now();p.pause_reason:=null;
   elsif p.status='paid_waiting' and healthy<>'temporary' then
    select count(*) into seats from public.promotions where status in ('active','paused','checkout');
    if seats<5 then p.status:=case when healthy='available' then 'active' else 'paused' end;p.active_since:=case when healthy='available' then now() else null end;p.pause_reason:=case when healthy='unavailable' then reason else null end;end if;
   end if;
  elsif operation in ('refund','payment_refunded') then
   if p.payment_intent is null or operation='payment_refunded' and p.payment_intent<>payload->>'payment' then raise check_violation;end if;
   p.status:='refunded';p.active_since:=null;p.pause_reason:='Full test payment refunded';
  else raise check_violation;end if;
  p.updated_at:=now();
  update public.promotions set status=p.status,remaining_seconds=p.remaining_seconds,active_since=p.active_since,checkout_attempt=p.checkout_attempt,checkout_session=p.checkout_session,payment_intent=p.payment_intent,paid_at=p.paid_at,reviewed_by=p.reviewed_by,reviewed_at=p.reviewed_at,review_note=p.review_note,pause_reason=p.pause_reason,health_checked_at=p.health_checked_at,updated_at=p.updated_at where id=p.id;
 end if;
 if old_status is null or old_status<>p.status then insert into public.promotion_events(promotion_id,event,detail) values(p.id,p.status,coalesce(p.pause_reason,p.review_note,''));end if;
 return to_jsonb(p);
end$$;
revoke all on function public.reposhelf_promotion_write(text,jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_promotion_write(text,jsonb) to service_role;
commit;

begin;
create table public.user_forks(
 user_id uuid not null references auth.users(id) on delete cascade,
 github_fork_id bigint not null check(github_fork_id>0),
 github_owner_id text not null check(github_owner_id ~ '^[0-9]+$'),
 project_id text not null check(project_id ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
 fork_full text not null check(fork_full ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
 parent_data jsonb not null default '{}'::jsonb,
 available boolean not null default true,
 verified_at timestamptz not null default now(),last_attempt_at timestamptz not null default now(),
 primary key(user_id,github_fork_id)
);
create table public.fork_sync_state(
 user_id uuid primary key references auth.users(id) on delete cascade,
 github_owner_id text not null, page integer not null default 1 check(page>0),
 page_offset integer not null default 0 check(page_offset between 0 and 100),
 completed_at timestamptz,last_attempt_at timestamptz,last_error text,
 recheck_id bigint not null default 0,lease_token uuid,lease_until timestamptz
);
alter table public.user_forks enable row level security;
alter table public.fork_sync_state enable row level security;
revoke all on public.user_forks,public.fork_sync_state from public,anon,authenticated;
grant select on public.user_forks,public.fork_sync_state to authenticated;
grant all on public.user_forks,public.fork_sync_state to service_role;
create policy forks_owner_read on public.user_forks for select to authenticated using(user_id=(select auth.uid()));
create policy forks_state_owner_read on public.fork_sync_state for select to authenticated using(user_id=(select auth.uid()));
-- Only the server can attest to GitHub evidence. Clients cannot mark forks verified.
create or replace function public.reposhelf_begin_fork_sync(owner_id uuid,github_id text,lease uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;begin
if github_id is null or github_id!~'^[0-9]+$' or lease is null then raise check_violation;end if;
if not exists(select 1 from auth.identities i where i.user_id=owner_id and i.provider='github' and coalesce(i.identity_data->>'provider_id',i.identity_data->>'sub',i.provider_id)=github_id) then raise insufficient_privilege;end if;
insert into public.fork_sync_state(user_id,github_owner_id,lease_token,lease_until,last_attempt_at)
values(owner_id,github_id,lease,now()+interval '45 seconds',now())
on conflict(user_id) do update set lease_token=excluded.lease_token,lease_until=excluded.lease_until,last_attempt_at=excluded.last_attempt_at
where (fork_sync_state.lease_until is null or fork_sync_state.lease_until<now()) and fork_sync_state.github_owner_id=excluded.github_owner_id
returning to_jsonb(fork_sync_state.*) into result;
return result;
end$$;
revoke all on function public.reposhelf_begin_fork_sync(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.reposhelf_begin_fork_sync(uuid,text,uuid) to service_role;
create or replace function public.reposhelf_save_verified_fork(entry jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
if not exists(select 1 from auth.identities i where i.user_id=(entry->>'user_id')::uuid and i.provider='github' and coalesce(i.identity_data->>'provider_id',i.identity_data->>'sub',i.provider_id)=entry->>'github_owner_id') then raise insufficient_privilege;end if;
if octet_length((entry->'parent_data')::text)>8192 then raise check_violation;end if;
insert into public.user_forks(user_id,github_fork_id,github_owner_id,project_id,fork_full,parent_data,available,verified_at,last_attempt_at)
values((entry->>'user_id')::uuid,(entry->>'github_fork_id')::bigint,entry->>'github_owner_id',entry->>'project_id',entry->>'fork_full',entry->'parent_data',true,now(),now())
on conflict(user_id,github_fork_id) do update set project_id=excluded.project_id,fork_full=excluded.fork_full,parent_data=excluded.parent_data,available=true,verified_at=now(),last_attempt_at=now();
end$$;
revoke all on function public.reposhelf_save_verified_fork(jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_save_verified_fork(jsonb) to service_role;
commit;

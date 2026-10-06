-- Personal connector keys: the MCP connector is a members-only feature. A signed-in member creates a key in
-- Account & data and sends it as "Authorization: Bearer rsk_..." from Claude or Codex. Only a SHA-256 hash of the
-- key is stored, so a key can be shown once and never recovered. All functions are server-only (service role).
-- Safe to run more than once.
begin;
create table if not exists public.mcp_keys(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 key_hash text not null unique check(key_hash ~ '^[a-f0-9]{64}$'),
 key_prefix text not null check(length(key_prefix) between 4 and 16),
 label text not null default '' check(length(label)<=60),
 created_at timestamptz not null default now(),
 last_used_at timestamptz,
 revoked_at timestamptz);
create index if not exists mcp_keys_owner on public.mcp_keys(user_id,created_at desc);
alter table public.mcp_keys enable row level security;
revoke all on public.mcp_keys from public,anon,authenticated;

create or replace function public.reposhelf_mcp_key_create(p_user uuid,p_label text,p_hash text,p_prefix text) returns jsonb language plpgsql security definer set search_path='' as $$
declare n integer;new_id uuid;
begin
 if p_user is null or not exists(select 1 from auth.users where id=p_user) then return jsonb_build_object('ok',false,'reason','no_account');end if;
 perform pg_advisory_xact_lock(hashtextextended('mcp-keys:'||p_user::text,0));
 select count(*) into n from public.mcp_keys where user_id=p_user and revoked_at is null;
 if n>=5 then return jsonb_build_object('ok',false,'reason','limit');end if;
 insert into public.mcp_keys(user_id,key_hash,key_prefix,label) values(p_user,p_hash,p_prefix,left(coalesce(p_label,''),60)) returning id into new_id;
 return jsonb_build_object('ok',true,'id',new_id);
end$$;

create or replace function public.reposhelf_mcp_key_list(p_user uuid) returns table(id uuid,label text,key_prefix text,created_at timestamptz,last_used_at timestamptz) language sql stable security definer set search_path='' as $$
 select k.id,k.label,k.key_prefix,k.created_at,k.last_used_at from public.mcp_keys k where k.user_id=p_user and k.revoked_at is null order by k.created_at desc;
$$;

create or replace function public.reposhelf_mcp_key_revoke(p_user uuid,p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.mcp_keys set revoked_at=now() where id=p_id and user_id=p_user and revoked_at is null;
 return found;
end$$;

-- Returns the owner of an active key, or null. last_used_at is refreshed at most hourly to keep writes low.
create or replace function public.reposhelf_mcp_key_verify(p_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid;used timestamptz;
begin
 select user_id,last_used_at into owner,used from public.mcp_keys where key_hash=p_hash and revoked_at is null;
 if owner is null then return null;end if;
 if used is null or used<now()-interval '1 hour' then update public.mcp_keys set last_used_at=now() where key_hash=p_hash;end if;
 return owner;
end$$;

revoke all on function public.reposhelf_mcp_key_create(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.reposhelf_mcp_key_list(uuid) from public,anon,authenticated;
revoke all on function public.reposhelf_mcp_key_revoke(uuid,uuid) from public,anon,authenticated;
revoke all on function public.reposhelf_mcp_key_verify(text) from public,anon,authenticated;
grant execute on function public.reposhelf_mcp_key_create(uuid,text,text,text) to service_role;
grant execute on function public.reposhelf_mcp_key_list(uuid) to service_role;
grant execute on function public.reposhelf_mcp_key_revoke(uuid,uuid) to service_role;
grant execute on function public.reposhelf_mcp_key_verify(text) to service_role;
commit;

-- Shared rate limiting and anonymous usage counts for the open MCP connector.
-- Rate-limit rows hold a salted hash of the caller (never the address itself) for one-minute windows and are
-- purged opportunistically after 15 minutes. Usage counts are totals per tool per day with no caller data.
-- Only the server (service role) can call these functions; the application falls back to a per-instance limiter
-- when this migration has not been applied. Safe to run more than once.
begin;
create table if not exists public.mcp_rate_limits(bucket text not null check(length(bucket)<=64),window_start timestamptz not null,hits integer not null default 0,primary key(bucket,window_start));
create table if not exists public.mcp_usage_daily(day date not null,tool text not null check(tool ~ '^[a-z_]{1,48}$'),calls bigint not null default 0,primary key(day,tool));
alter table public.mcp_rate_limits enable row level security;
alter table public.mcp_usage_daily enable row level security;
revoke all on public.mcp_rate_limits from public,anon,authenticated;
revoke all on public.mcp_usage_daily from public,anon,authenticated;

create or replace function public.reposhelf_mcp_gate(p_bucket text,p_limit integer,p_tool text default null) returns boolean language plpgsql security definer set search_path='' as $$
declare win timestamptz:=date_trunc('minute',now());total integer;tool_name text:=p_tool;
begin
 if p_bucket is null or length(p_bucket)>64 or p_limit is null or p_limit<1 or p_limit>10000 then raise check_violation;end if;
 if tool_name is not null and tool_name !~ '^[a-z_]{1,48}$' then tool_name:=null;end if;
 insert into public.mcp_rate_limits as l(bucket,window_start,hits) values(p_bucket,win,1)
  on conflict(bucket,window_start) do update set hits=l.hits+1 returning l.hits into total;
 if random()<0.02 then delete from public.mcp_rate_limits where window_start<now()-interval '15 minutes';end if;
 if total>p_limit then return false;end if;
 if tool_name is not null then
  insert into public.mcp_usage_daily as u(day,tool,calls) values((now() at time zone 'utc')::date,tool_name,1)
   on conflict(day,tool) do update set calls=u.calls+1;
 end if;
 return true;
end$$;

create or replace function public.reposhelf_mcp_usage(p_days integer default 30) returns table(day date,tool text,calls bigint) language sql security definer set search_path='' as $$
 select u.day,u.tool,u.calls from public.mcp_usage_daily u where u.day>=(now() at time zone 'utc')::date-least(greatest(coalesce(p_days,30),1),90) order by u.day desc,u.tool;
$$;

revoke all on function public.reposhelf_mcp_gate(text,integer,text) from public,anon,authenticated;
revoke all on function public.reposhelf_mcp_usage(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_mcp_gate(text,integer,text) to service_role;
grant execute on function public.reposhelf_mcp_usage(integer) to service_role;
commit;

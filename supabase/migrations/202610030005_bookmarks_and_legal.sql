begin;
alter table public.user_likes add column project_snapshot jsonb check(project_snapshot is null or jsonb_typeof(project_snapshot)='object' and octet_length(project_snapshot::text)<=16384);
grant insert(project_snapshot),update(project_snapshot) on public.user_likes to authenticated;
create or replace function public.reposhelf_save_bookmark(project text,snapshot jsonb) returns void language plpgsql security invoker set search_path='' as $$begin
if auth.uid() is null then raise insufficient_privilege;end if;
insert into public.user_likes(user_id,project_id,project_snapshot) values(auth.uid(),project,snapshot)
on conflict(user_id,project_id) do update set project_snapshot=excluded.project_snapshot;
end$$;
revoke all on function public.reposhelf_save_bookmark(text,jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_save_bookmark(text,jsonb) to authenticated;
create table public.legal_acceptances(user_id uuid not null references auth.users(id) on delete cascade,terms_version text not null,privacy_version text not null,accepted_at timestamptz not null default now(),primary key(user_id,terms_version,privacy_version));
alter table public.legal_acceptances enable row level security;
revoke all on public.legal_acceptances from public,anon,authenticated;
grant select on public.legal_acceptances to authenticated;
create policy legal_owner_read on public.legal_acceptances for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.reposhelf_accept_legal(terms text,privacy text) returns timestamptz language plpgsql security definer set search_path='' as $$declare at_time timestamptz;begin
if auth.uid() is null then raise insufficient_privilege;end if;
if terms<>'2026-10-03-v1' or privacy<>'2026-10-03-v1' or terms is null or privacy is null then raise check_violation;end if;
insert into public.legal_acceptances(user_id,terms_version,privacy_version) values(auth.uid(),terms,privacy) on conflict do nothing;
select accepted_at into at_time from public.legal_acceptances where user_id=auth.uid() and terms_version=terms and privacy_version=privacy;
return at_time;
end$$;
revoke all on function public.reposhelf_accept_legal(text,text) from public,anon,authenticated;
grant execute on function public.reposhelf_accept_legal(text,text) to authenticated;
commit;

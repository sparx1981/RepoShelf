-- Legal version 2026-10-18-v5: the Terms of Service and Privacy Policy version moves on, so members are asked to accept the current
-- version again at their next sign-in. The function keeps accepting every earlier version (existing acceptances stay valid records).
-- IMPORTANT: run this BEFORE the site version that names 2026-10-18-v5 is deployed, or accepting the Terms fails until it is run.
-- Safe to run more than once.
begin;
create or replace function public.reposhelf_accept_legal(terms text,privacy text)
 returns timestamptz language plpgsql security definer set search_path='' as $$
declare at_time timestamptz;
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 if terms is null or privacy is null or terms<>privacy
  or terms not in ('2026-10-03-v1','2026-10-06-v2','2026-10-11-v3','2026-10-13-v4','2026-10-18-v5') then raise check_violation;end if;
 insert into public.legal_acceptances(user_id,terms_version,privacy_version)
  values(auth.uid(),terms,privacy) on conflict do nothing;
 select accepted_at into at_time from public.legal_acceptances
  where user_id=auth.uid() and terms_version=terms and privacy_version=privacy;
 return at_time;
end$$;
revoke all on function public.reposhelf_accept_legal(text,text) from public,anon,authenticated;
grant execute on function public.reposhelf_accept_legal(text,text) to authenticated;
commit;

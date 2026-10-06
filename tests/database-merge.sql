-- Account merge: data moves to the target, duplicates resolve safely, blockers refuse, and only the server may call it.
-- Users from tests/database-bootstrap.sql: 1 = GitHub (target), 4 = Google (source), 2 and 3 = other GitHub accounts.
begin;
do $$
declare t uuid:='00000000-0000-0000-0000-000000000001';s uuid:='00000000-0000-0000-0000-000000000004';other uuid:='00000000-0000-0000-0000-000000000002';r jsonb;n integer;
begin
 insert into public.user_likes(user_id,project_id,project_snapshot) values(t,'team/a','{"name":"A"}'),(t,'team/shared','{"name":"target copy"}'),(s,'team/shared','{"name":"source copy"}'),(s,'team/c','{"name":"C"}');
 insert into public.user_project_history(user_id,project_id,project_snapshot,viewed_at) values(t,'team/h','{"v":"old"}','2026-01-01'),(s,'team/h','{"v":"new"}','2026-02-01'),(s,'team/only','{"v":"src"}','2026-01-15');
 insert into public.user_discovery_settings(user_id,remember_views,hide_seen) values(t,false,false),(s,true,true);
 insert into public.repository_submissions(user_id,repo_name,repo_id) values(s,'team/x','101'),(s,'team/y','102'),(t,'team/y','102');
 insert into public.promotions(user_id,repo_name,repo_id,owner_id,snapshot,status) values(s,'team/promo','201','9','{}','expired');
 insert into public.listing_reports(project_id,reporter,reason) values('team/a',s,'other');
 insert into public.legal_acceptances(user_id,terms_version,privacy_version) values(s,'2026-10-03-v1','2026-10-03-v1');
 insert into public.user_forks(user_id,github_fork_id,github_owner_id,project_id,fork_full) values(s,1,'4','team/a','src/a');
 insert into public.fork_sync_state(user_id,github_owner_id) values(s,'4');

 -- the preview reports what would move without changing anything
 r:=public.reposhelf_merge_check(t,s);if r->>'ok'<>'true' then raise exception 'check failed: %',r;end if;
 if (r->'counts'->>'likes')::int<>2 or (r->'counts'->>'history')::int<>2 or (r->'counts'->>'submissions')::int<>2 or (r->'counts'->>'forks')::int<>1 then raise exception 'unexpected preview counts %',r;end if;
 if (select count(*) from public.user_likes where user_id=s)<>2 then raise exception 'preview must not change data';end if;

 r:=public.reposhelf_merge_accounts(t,s);if r->>'ok'<>'true' then raise exception 'merge failed: %',r;end if;
 -- likes: union, the target keeps its own copy of a shared like
 if (select count(*) from public.user_likes where user_id=t)<>3 then raise exception 'likes not merged';end if;
 if (select project_snapshot->>'name' from public.user_likes where user_id=t and project_id='team/shared')<>'target copy' then raise exception 'target like overwritten';end if;
 if exists(select 1 from public.user_likes where user_id=s) then raise exception 'source likes remain';end if;
 -- history: newest view wins, unique entries carried over
 if (select project_snapshot->>'v' from public.user_project_history where user_id=t and project_id='team/h')<>'new' or (select viewed_at from public.user_project_history where user_id=t and project_id='team/h')<>'2026-02-01' then raise exception 'history not resolved by newest view';end if;
 if not exists(select 1 from public.user_project_history where user_id=t and project_id='team/only') then raise exception 'history entry lost';end if;
 -- settings: either account's choice is kept, and the hide-seen constraint still holds
 if not (select remember_views and hide_seen from public.user_discovery_settings where user_id=t) then raise exception 'discovery settings not merged';end if;
 -- submissions: unique per repo, so the duplicate stays behind with the source account
 if (select count(*) from public.repository_submissions where user_id=t)<>2 or (select count(*) from public.repository_submissions where user_id=s)<>1 then raise exception 'submissions not moved without duplicates';end if;
 if (select count(*) from public.promotions where user_id=t and repo_name='team/promo')<>1 then raise exception 'promotion not moved';end if;
 if (select count(*) from public.listing_reports where reporter=t)<>1 then raise exception 'report attribution not moved';end if;
 if not exists(select 1 from public.legal_acceptances where user_id=t and terms_version='2026-10-03-v1') then raise exception 'legal acceptance not moved';end if;
 if not exists(select 1 from public.user_forks where user_id=t and github_fork_id=1) or not exists(select 1 from public.fork_sync_state where user_id=t) then raise exception 'forks or fork verification not moved';end if;
 -- a second run is harmless
 r:=public.reposhelf_merge_accounts(t,s);if r->>'ok'<>'true' or (r->'moved'->>'likes')::int<>0 then raise exception 'second merge unexpected %',r;end if;

 -- blockers
 if public.reposhelf_merge_check(t,t)->>'reason'<>'same_account' then raise exception 'same account not refused';end if;
 if public.reposhelf_merge_check(t,other)->>'reason'<>'same_provider' then raise exception 'two GitHub accounts must not merge';end if;
 if public.reposhelf_merge_check(t,gen_random_uuid())->>'reason'<>'account_missing' then raise exception 'missing account not refused';end if;
 insert into public.reposhelf_admins(user_id) values(s);
 if public.reposhelf_merge_check(t,s)->>'reason'<>'source_is_admin' then raise exception 'an admin source must not vanish into a non-admin target';end if;
 insert into public.reposhelf_admins(user_id) values(t);
 if public.reposhelf_merge_check(t,s)->>'ok'<>'true' then raise exception 'admin into admin should be allowed';end if;
 r:=public.reposhelf_merge_accounts(t,s);if exists(select 1 from public.reposhelf_admins where user_id=s) then raise exception 'source admin row remains';end if;
 insert into public.promotions(user_id,repo_name,repo_id,owner_id,snapshot,status) values(s,'team/live','301','9','{}','active');
 if public.reposhelf_merge_check(t,s)->>'reason'<>'promotions_active' then raise exception 'running promotion must block the merge';end if;
 delete from public.promotions where repo_id='301';
 insert into public.fork_sync_state(user_id,github_owner_id,lease_until) values(s,'4',now()+interval '5 minutes');
 if public.reposhelf_merge_check(t,s)->>'reason'<>'busy' then raise exception 'a running fork verification must block the merge';end if;
end$$;

-- only the server (service role) may run it
set local role authenticated;
do $$begin
 begin perform public.reposhelf_merge_accounts('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004');raise exception 'authenticated users must not merge accounts';exception when insufficient_privilege then null;end;
 begin perform public.reposhelf_merge_check('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004');raise exception 'authenticated users must not preview merges';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role anon;
do $$begin
 begin perform public.reposhelf_merge_accounts('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004');raise exception 'anonymous callers must not merge accounts';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;

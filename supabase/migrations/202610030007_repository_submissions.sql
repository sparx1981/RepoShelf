begin;
create table public.repository_submissions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 repo_name text not null check(repo_name ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}/[a-zA-Z0-9_.-]{1,100}$'),repo_id text not null,
 status text not null default 'queued' check(status in ('queued','processing','imported','retry','unavailable')),
 canonical_name text,with_demo boolean,commit_sha text,attempts integer not null default 0,
 lease uuid,lease_until timestamptz,next_attempt_at timestamptz not null default now(),checked_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,repo_id)
);
create index repository_submissions_due on public.repository_submissions(next_attempt_at) where status in ('queued','retry','processing');
alter table public.repository_submissions enable row level security;
revoke all on public.repository_submissions from public,anon,authenticated;
grant select on public.repository_submissions to authenticated;
grant all on public.repository_submissions to service_role;
create policy submission_read on public.repository_submissions for select to authenticated using(user_id=auth.uid() or public.reposhelf_is_admin());
create function public.reposhelf_submit_repository(submitter uuid,repository text,github_id text) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare saved public.repository_submissions;
begin
 perform pg_advisory_xact_lock(hashtextextended(submitter::text,7));
 select * into saved from public.repository_submissions where user_id=submitter and repo_id=github_id;
 if found and saved.status<>'unavailable' then return jsonb_build_object('item',to_jsonb(saved),'queued',false);end if;
 if saved.id is not null and saved.updated_at>now()-interval '1 hour' then raise exception using errcode='PT429',message='Retry later';end if;
 if (select count(*) from public.repository_submissions where user_id=submitter and created_at>now()-interval '1 day')>=10 then raise exception using errcode='PT420',message='Daily submission limit reached';end if;
 if saved.id is not null then update public.repository_submissions set status='queued',next_attempt_at=now(),updated_at=now(),created_at=now(),repo_name=repository where id=saved.id returning * into saved;
 else insert into public.repository_submissions(user_id,repo_name,repo_id) values(submitter,repository,github_id) returning * into saved;end if;
 return jsonb_build_object('item',to_jsonb(saved),'queued',true);
end $$;
create function public.reposhelf_claim_submissions() returns setof public.repository_submissions
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 return query with due as (select id from public.repository_submissions where (status in ('queued','retry') and next_attempt_at<=now()) or (status='processing' and lease_until<now()) order by next_attempt_at limit 20 for update skip locked)
 update public.repository_submissions s set status='processing',lease=gen_random_uuid(),lease_until=now()+interval '45 minutes',attempts=attempts+1,updated_at=now() from due where s.id=due.id returning s.*;
end $$;
create function public.reposhelf_finish_submission(submission uuid,claim uuid,result text,canonical text,has_demo boolean,published_commit text) returns boolean
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if result not in ('imported','retry','unavailable') or (result='imported' and (canonical is null or published_commit !~ '^[a-f0-9]{40}$' or published_commit is null)) then raise exception 'Invalid submission result';end if;
 update public.repository_submissions set status=result,canonical_name=canonical,with_demo=case when result='imported' then has_demo else null end,commit_sha=published_commit,checked_at=now(),updated_at=now(),lease=null,lease_until=null,next_attempt_at=now()+interval '1 hour' where id=submission and lease=claim and status='processing';
 return found;
end $$;
revoke all on function public.reposhelf_submit_repository(uuid,text,text),public.reposhelf_claim_submissions(),public.reposhelf_finish_submission(uuid,uuid,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.reposhelf_submit_repository(uuid,text,text),public.reposhelf_claim_submissions(),public.reposhelf_finish_submission(uuid,uuid,text,text,boolean,text) to service_role;
commit;

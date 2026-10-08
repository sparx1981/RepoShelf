begin;
alter table public.repository_submissions drop constraint repository_submissions_status_check;
alter table public.repository_submissions add constraint repository_submissions_status_check check(status in ('queued','processing','imported','retry','unavailable','cancelled'));
alter table public.repository_submissions add column result_details jsonb not null default '{}'::jsonb;

create function public.reposhelf_submission_capabilities() returns jsonb language sql stable security invoker set search_path='' as $$select jsonb_build_object('version',2,'cancel',true,'targetedScan',true)$$;
revoke all on function public.reposhelf_submission_capabilities() from public,anon;
grant execute on function public.reposhelf_submission_capabilities() to authenticated,service_role;

create function public.reposhelf_cancel_submission(submission uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare saved public.repository_submissions;
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 select * into saved from public.repository_submissions where id=submission and user_id=auth.uid() for update;
 if not found then raise exception 'Submission not found' using errcode='PT404';end if;
 if saved.status='cancelled' then return to_jsonb(saved);end if;
 if saved.status not in ('queued','retry') then raise exception 'This submission has already started scanning or finished. It cannot be cancelled.' using errcode='PT409';end if;
 update public.repository_submissions set status='cancelled',lease=null,lease_until=null,updated_at=now(),result_details=jsonb_build_object('status','cancelled') where id=saved.id returning * into saved;
 return to_jsonb(saved);
end$$;
revoke all on function public.reposhelf_cancel_submission(uuid) from public,anon;
grant execute on function public.reposhelf_cancel_submission(uuid) to authenticated;

create function public.reposhelf_claim_submissions_v2(submission uuid default null) returns setof public.repository_submissions language plpgsql security invoker set search_path='' as $$
begin
 return query with due as (select id from public.repository_submissions where (submission is null or id=submission) and ((status in ('queued','retry') and next_attempt_at<=now()) or (status='processing' and lease_until<now())) order by next_attempt_at,id limit 5 for update skip locked)
 update public.repository_submissions s set status='processing',lease=gen_random_uuid(),lease_until=now()+interval '45 minutes',attempts=attempts+1,updated_at=now() from due where s.id=due.id returning s.*;
end$$;
create function public.reposhelf_finish_submission_v2(submission uuid,claim uuid,result text,canonical text,has_demo boolean,published_commit text,details jsonb) returns boolean language plpgsql security invoker set search_path='' as $$
declare done boolean;
begin
 if details is null or jsonb_typeof(details)<>'object' or length(details::text)>4000 then raise exception 'Invalid submission details';end if;
 if result='imported' and (details->>'status' is distinct from 'accepted' or has_demo is distinct from true or details->>'demoCheckedAt' is null or details->>'screenshotCapturedAt' is null) then raise exception 'Working demo and screenshot evidence required';end if;
 if result='imported' and ((details->>'demoCheckedAt')::timestamptz<now()-interval '48 hours' or (details->>'demoCheckedAt')::timestamptz>now()+interval '5 minutes' or (details->>'screenshotCapturedAt')::timestamptz<now()-interval '48 hours' or (details->>'screenshotCapturedAt')::timestamptz>now()+interval '5 minutes') then raise exception 'Submission evidence is stale';end if;
 done:=public.reposhelf_finish_submission(submission,claim,result,canonical,has_demo,published_commit);
 if done then update public.repository_submissions set result_details=details,next_attempt_at=case when result='retry' and details->>'nextAttemptAt' is not null then greatest(now()+interval '1 hour',least(now()+interval '7 days',(details->>'nextAttemptAt')::timestamptz)) else next_attempt_at end where id=submission;end if;
 return done;
end$$;
revoke all on function public.reposhelf_claim_submissions_v2(uuid),public.reposhelf_finish_submission_v2(uuid,uuid,text,text,boolean,text,jsonb) from public,anon,authenticated;
grant execute on function public.reposhelf_claim_submissions_v2(uuid),public.reposhelf_finish_submission_v2(uuid,uuid,text,text,boolean,text,jsonb) to service_role;

create or replace function public.reposhelf_submit_repository(submitter uuid,repository text,github_id text) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare saved public.repository_submissions;
begin
 perform pg_advisory_xact_lock(hashtextextended(submitter::text,7));
 select * into saved from public.repository_submissions where user_id=submitter and repo_id=github_id for update;
 if found and saved.status not in ('unavailable','cancelled') then return jsonb_build_object('item',to_jsonb(saved),'queued',false);end if;
 if saved.id is not null and saved.updated_at>now()-interval '1 hour' then raise exception using errcode='PT429',message='Wait one hour before resubmitting this repository';end if;
 if (select count(*) from public.repository_submissions where user_id=submitter and created_at>now()-interval '1 day')>=10 then raise exception using errcode='PT420',message='Daily submission limit reached';end if;
 if saved.id is not null then update public.repository_submissions set status='queued',next_attempt_at=now(),updated_at=now(),created_at=now(),repo_name=repository,result_details='{}',lease=null,lease_until=null where id=saved.id returning * into saved;
 else insert into public.repository_submissions(user_id,repo_name,repo_id) values(submitter,repository,github_id) returning * into saved;end if;
 return jsonb_build_object('item',to_jsonb(saved),'queued',true);
end$$;
notify pgrst,'reload schema';
commit;

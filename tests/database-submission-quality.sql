begin;
set role service_role;
insert into public.repository_submissions(id,user_id,repo_name,repo_id) values
 ('26000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','third-party/queued','quality-one'),
 ('26000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','third-party/active','quality-two');
reset role;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 begin perform public.reposhelf_cancel_submission('26000000-0000-0000-0000-000000000001');raise exception 'Another user cancelled the submission';exception when sqlstate 'PT404' then null;end;
 begin perform public.reposhelf_claim_submissions_v2(null);raise exception 'Member claimed submissions';exception when insufficient_privilege then null;end;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin
 if public.reposhelf_submission_capabilities()->>'version'<>'2' then raise exception 'Capabilities unavailable';end if;
 if public.reposhelf_cancel_submission('26000000-0000-0000-0000-000000000001')->>'status'<>'cancelled' then raise exception 'Cancellation failed';end if;
 if public.reposhelf_cancel_submission('26000000-0000-0000-0000-000000000001')->>'status'<>'cancelled' then raise exception 'Cancellation is not idempotent';end if;
end$$;
reset role;
set role service_role;
do $$declare item public.repository_submissions;done boolean;begin
 if exists(select 1 from public.reposhelf_claim_submissions_v2('26000000-0000-0000-0000-000000000001')) then raise exception 'Cancelled row claimed';end if;
 select * into item from public.reposhelf_claim_submissions_v2('26000000-0000-0000-0000-000000000002');
 if item.id<>'26000000-0000-0000-0000-000000000002' or item.status<>'processing' then raise exception 'Targeted claim failed';end if;
 if exists(select 1 from public.reposhelf_claim_submissions_v2(item.id)) then raise exception 'Lease claimed twice';end if;
 if public.reposhelf_finish_submission_v2(item.id,gen_random_uuid(),'retry',null,false,null,jsonb_build_object('status','retry')) then raise exception 'Stale lease completed';end if;
 begin perform public.reposhelf_finish_submission_v2(item.id,item.lease,'imported','third-party/active',true,repeat('a',40),'{}');raise exception 'Missing quality evidence accepted';exception when raise_exception then if sqlerrm='Missing quality evidence accepted' then raise;end if;end;
 done:=public.reposhelf_finish_submission_v2(item.id,item.lease,'imported','third-party/active',true,repeat('a',40),jsonb_build_object('status','accepted','demoCheckedAt',now(),'screenshotCapturedAt',now()));
 if not done or (select result_details->>'status' from public.repository_submissions where id=item.id)<>'accepted' then raise exception 'Valid quality result not saved';end if;
end$$;
reset role;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin
 begin perform public.reposhelf_cancel_submission('26000000-0000-0000-0000-000000000002');raise exception 'Imported submission cancelled';exception when sqlstate 'PT409' then null;end;
end$$;
reset role;
set role service_role;
insert into public.repository_submissions(id,user_id,repo_name,repo_id,status,lease,lease_until) values('26000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','third-party/scanning','quality-three','processing',gen_random_uuid(),now()+interval '45 minutes');
reset role;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin
 begin perform public.reposhelf_cancel_submission('26000000-0000-0000-0000-000000000003');raise exception 'Active scanner cancelled';exception when sqlstate 'PT409' then null;end;
end$$;
reset role;
set role anon;
do $$begin
 begin perform public.reposhelf_cancel_submission('26000000-0000-0000-0000-000000000001');raise exception 'Anonymous cancellation allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;

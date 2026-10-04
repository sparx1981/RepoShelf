begin;
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001');
insert into public.user_likes(user_id,project_id) values('00000000-0000-0000-0000-000000000001','owner/private-like'),('00000000-0000-0000-0000-000000000002','member/like');
insert into public.listing_reports(project_id,reporter,reason,explanation) values('member/app','00000000-0000-0000-0000-000000000002','other','Reporter private text');
insert into public.user_discovery_settings(user_id,remember_views) values('00000000-0000-0000-0000-000000000002',true);
insert into public.user_project_history(user_id,project_id,project_snapshot) values('00000000-0000-0000-0000-000000000002','member/app','{}');
set role anon;
do $$begin begin perform public.reposhelf_export_account();raise exception 'Anonymous export permitted';exception when insufficient_privilege then null;end;end$$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$declare data jsonb;begin
 data:=public.reposhelf_export_account();if jsonb_array_length(data->'likes')<>1 or data::text like '%owner/private-like%' then raise exception 'Export crossed account boundary';end if;
 if data::text not like '%Reporter private text%' then raise exception 'Own reports missing';end if;
 if data::text like '%access_token%' or data::text like '%lease_token%' then raise exception 'Export leaked credentials';end if;
 if (public.reposhelf_account_deletion_status()->>'allowed')::boolean is not true then raise exception 'Member deletion unexpectedly blocked';end if;
end$$;
reset role;
-- The Auth test fixture identity FK differs from Supabase's cascade; remove it first.
delete from auth.identities where user_id='00000000-0000-0000-0000-000000000001';
do $$begin begin delete from auth.users where id='00000000-0000-0000-0000-000000000001';raise exception 'Last admin deletion permitted';exception when sqlstate 'PT409' then null;end;end$$;
insert into public.promotions(user_id,repo_name,repo_id,owner_id,snapshot,status,payment_intent) values('00000000-0000-0000-0000-000000000002','member/app',2002,'2','{}','active','pi_fixture');
delete from auth.identities where user_id='00000000-0000-0000-0000-000000000002';
do $$begin begin delete from auth.users where id='00000000-0000-0000-0000-000000000002';raise exception 'Active promotion deletion permitted';exception when sqlstate 'PT409' then null;end;end$$;
update public.promotions set status='refunded' where repo_id='2002';
insert into public.promotion_events(promotion_id,event) select id,'refunded' from public.promotions where repo_id='2002';
delete from auth.users where id='00000000-0000-0000-0000-000000000002';
do $$begin
 if exists(select 1 from public.user_likes where project_id='member/like') or exists(select 1 from public.user_project_history where project_id='member/app') then raise exception 'Deleted account data retained';end if;
 if not exists(select 1 from public.promotions where repo_id='2002' and user_id is null and payment_intent='pi_fixture') then raise exception 'Paid history lost';end if;
 if not exists(select 1 from public.promotion_events where event='refunded') then raise exception 'Payment events lost';end if;
 if not exists(select 1 from public.listing_reports where project_id='member/app' and reporter is null and explanation='') then raise exception 'Report identity not removed';end if;
end$$;
rollback;

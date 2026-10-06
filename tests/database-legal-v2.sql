-- Legal version 2: both the previous and the current version can be accepted, other versions cannot, and it is idempotent.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$
declare first_at timestamptz;second_at timestamptz;
begin
 first_at:=public.reposhelf_accept_legal('2026-10-06-v2','2026-10-06-v2');second_at:=public.reposhelf_accept_legal('2026-10-06-v2','2026-10-06-v2');
 if first_at is null or first_at<>second_at then raise exception 'acceptance must be idempotent';end if;
 perform public.reposhelf_accept_legal('2026-10-03-v1','2026-10-03-v1');
 begin perform public.reposhelf_accept_legal('2026-10-06-v2','2026-10-03-v1');raise exception 'mixed versions accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_accept_legal('2099-01-01-v9','2099-01-01-v9');raise exception 'unknown version accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_accept_legal(null,null);raise exception 'null accepted';exception when check_violation then null;end;
end$$;
reset role;
rollback;

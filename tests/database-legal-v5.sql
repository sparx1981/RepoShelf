-- Legal v5: the acceptance function takes the new version and every earlier one, and still refuses mismatches and unknown versions.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-0000000000e1');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',true);
set local role authenticated;
do $$
begin
 if public.reposhelf_accept_legal('2026-10-18-v5','2026-10-18-v5') is null then raise exception 'v5 should be accepted';end if;
 if public.reposhelf_accept_legal('2026-10-13-v4','2026-10-13-v4') is null then raise exception 'earlier versions stay valid';end if;
 begin perform public.reposhelf_accept_legal('2026-10-18-v5','2026-10-13-v4');raise exception 'mismatched versions accepted';exception when check_violation then null;end;
 begin perform public.reposhelf_accept_legal('2099-01-01-v9','2099-01-01-v9');raise exception 'unknown version accepted';exception when check_violation then null;end;
end$$;
reset role;
rollback;

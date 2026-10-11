-- Ribbon edit conflicts raise PT409, never 40001 (serialization failure), so nothing upstream treats them as retryable.
begin;
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-000000000001') on conflict do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$declare r public.editorial_ribbons;begin
 select * into r from public.editorial_ribbons order by position,id limit 1;
 begin perform public.reposhelf_save_ribbon(r.id,r.revision+5,'Stale','','','popular',false,'[]');raise exception 'a stale save was accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.reposhelf_delete_ribbon(r.id,r.revision+5);raise exception 'a stale delete was accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.reposhelf_reorder_ribbons(array[r.id,'00000000-0000-0000-0000-00000000dead']::uuid[]);raise exception 'an unsatisfiable reorder was accepted';exception when sqlstate 'PT409' then null;end;
 perform public.reposhelf_reorder_ribbons(array(select id from public.editorial_ribbons order by position,id));
end$$;
reset role;
do $$begin
 if not has_function_privilege('authenticated','public.reposhelf_reorder_ribbons(uuid[])','execute') then raise exception 'administrators must reach the reorder function';end if;
 if not has_function_privilege('authenticated','public.reposhelf_delete_ribbon(uuid,integer)','execute') then raise exception 'administrators must reach the delete function';end if;
 if has_function_privilege('anon','public.reposhelf_reorder_ribbons(uuid[])','execute') then raise exception 'visitors must not reach the reorder function';end if;
end$$;
rollback;
select 'PASS: ribbon save, delete and reorder conflicts raise PT409 and valid reorders still succeed.' as result;

-- Boards: ownership, collection dependency, limits, cascade, merge, export and server-only access.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-0000000000b1'),('00000000-0000-0000-0000-0000000000b2'),('00000000-0000-0000-0000-0000000000b3');
do $$
declare u uuid:='00000000-0000-0000-0000-0000000000b1';other uuid:='00000000-0000-0000-0000-0000000000b2';src uuid:='00000000-0000-0000-0000-0000000000b3';r jsonb;a uuid;b uuid;c uuid;n integer;
begin
 insert into public.user_likes(user_id,project_id,project_snapshot) values(u,'team/one','{"name":"One"}'),(u,'team/two','{"name":"Two"}'),(u,'hf:team/space','{"name":"Space"}'),(other,'team/one','{"name":"Other"}');
 -- creating and naming
 r:=public.reposhelf_board_save(u,null,'  Landing   page ','Marketing site starter');if r->>'ok'<>'true' then raise exception 'create failed %',r;end if;a:=(r->>'id')::uuid;
 if (select name from public.boards where id=a)<>'Landing page' then raise exception 'name should be trimmed and collapsed';end if;
 if public.reposhelf_board_save(u,null,'LANDING PAGE','')->>'reason'<>'duplicate_name' then raise exception 'names are unique per member, ignoring case';end if;
 if public.reposhelf_board_save(other,null,'Landing page','')->>'ok'<>'true' then raise exception 'another member may reuse a name';end if;
 if public.reposhelf_board_save(u,null,'   ','')->>'reason'<>'invalid_name' then raise exception 'blank names refused';end if;
 if public.reposhelf_board_save(gen_random_uuid(),null,'x','')->>'reason'<>'no_account' then raise exception 'unknown account refused';end if;
 r:=public.reposhelf_board_save(u,null,'Dashboard',null);b:=(r->>'id')::uuid;
 if public.reposhelf_board_save(u,b,'landing page','')->>'reason'<>'duplicate_name' then raise exception 'rename into an existing name refused';end if;
 if public.reposhelf_board_save(u,b,'Dashboard v2','Admin UI')->>'ok'<>'true' then raise exception 'rename failed';end if;
 if (select description from public.boards where id=b)<>'Admin UI' then raise exception 'description not saved';end if;
 if public.reposhelf_board_save(other,b,'Hijack','')->>'reason'<>'not_found' then raise exception 'another member must not edit a board';end if;
 -- items: must be in the collection, can be on several boards, idempotent
 if public.reposhelf_board_item(u,a,'team/missing',true)->>'reason'<>'not_in_collection' then raise exception 'only collection items go on boards';end if;
 if public.reposhelf_board_item(u,a,'team/one',true)->>'ok'<>'true' or public.reposhelf_board_item(u,a,'team/one',true)->>'ok'<>'true' then raise exception 'adding twice should be harmless';end if;
 perform public.reposhelf_board_item(u,a,'team/two',true);perform public.reposhelf_board_item(u,b,'team/one',true);perform public.reposhelf_board_item(u,b,'hf:team/space',true);
 if (select count(*) from public.board_items where project_id='team/one' and user_id=u)<>2 then raise exception 'an item may be on several boards';end if;
 if public.reposhelf_board_item(other,a,'team/one',true)->>'reason'<>'not_found' then raise exception 'another member must not add to a board';end if;
 if public.reposhelf_board_item(u,gen_random_uuid(),'team/one',true)->>'reason'<>'not_found' then raise exception 'unknown board refused';end if;
 -- reading
 r:=public.reposhelf_boards_list(u);if jsonb_array_length(r)<>2 or jsonb_array_length(r->0->'items')<>2 then raise exception 'list unexpected %',r;end if;
 if jsonb_array_length(public.reposhelf_boards_list(other))<>1 then raise exception 'list must show only the owner boards';end if;
 r:=public.reposhelf_board_get(u,'landing PAGE');if r->>'id'<>a::text or jsonb_array_length(r->'items')<>2 or r->'items'->0->'snapshot'->>'name' is null then raise exception 'get by name failed %',r;end if;
 if public.reposhelf_board_get(u,a::text)->>'name'<>'Landing page' then raise exception 'get by id failed';end if;
 if public.reposhelf_board_get(other,a::text) is not null then raise exception 'another member must not read a board';end if;
 -- removing from the collection takes the item off every board
 delete from public.user_likes where user_id=u and project_id='team/one';
 if exists(select 1 from public.board_items where user_id=u and project_id='team/one') then raise exception 'unliked item must leave all boards';end if;
 if (select count(*) from public.board_items where user_id=u)<>2 then raise exception 'other items must stay';end if;
 if public.reposhelf_board_item(u,a,'team/two',false)->>'ok'<>'true' then raise exception 'remove failed';end if;
 if (select count(*) from public.board_items where board_id=a)<>0 then raise exception 'item not removed';end if;
 -- limits: 50 boards per member, 100 items per board
 for n in 1..48 loop if public.reposhelf_board_save(u,null,'board '||n,'')->>'ok'<>'true' then raise exception 'board % refused',n;end if;end loop;
 if public.reposhelf_board_save(u,null,'one too many','')->>'reason'<>'limit' then raise exception 'a 51st board must be refused';end if;
 insert into public.user_likes(user_id,project_id) select u,'bulk/p'||g from generate_series(1,101) g;
 for n in 1..100 loop if public.reposhelf_board_item(u,a,'bulk/p'||n,true)->>'ok'<>'true' then raise exception 'item % refused',n;end if;end loop;
 if public.reposhelf_board_item(u,a,'bulk/p101',true)->>'reason'<>'limit' then raise exception 'a 101st item must be refused';end if;
 -- deleting a board keeps the collection
 if not public.reposhelf_board_delete(u,a) then raise exception 'delete failed';end if;
 if exists(select 1 from public.board_items where board_id=a) then raise exception 'delete should remove the board items';end if;
 if (select count(*) from public.user_likes where user_id=u and project_id like 'bulk/%')<>101 then raise exception 'deleting a board must not touch the collection';end if;
 if public.reposhelf_board_delete(other,b) then raise exception 'another member must not delete a board';end if;
 -- merge: boards and their items move with the person, duplicates resolve, clashing names are suffixed
 delete from public.boards where user_id=u and name like 'board %';
 insert into public.user_likes(user_id,project_id,project_snapshot) values(src,'team/shared','{"name":"src"}'),(src,'team/only','{"name":"only"}'),(u,'team/shared','{"name":"tgt"}');
 r:=public.reposhelf_board_save(src,null,'Dashboard v2','from source');c:=(r->>'id')::uuid;
 perform public.reposhelf_board_item(src,c,'team/shared',true);perform public.reposhelf_board_item(src,c,'team/only',true);
 r:=public.reposhelf_merge_accounts(u,src);if r->>'ok'<>'true' then raise exception 'merge failed %',r;end if;
 if exists(select 1 from public.boards where user_id=src) then raise exception 'source boards remain';end if;
 if (select user_id from public.boards where id=c)<>u or (select name from public.boards where id=c) not like 'Dashboard v2 (merged %)' then raise exception 'source board not moved with a suffix: %',(select name from public.boards where id=c);end if;
 if (select count(*) from public.board_items where board_id=c and user_id=u)<>2 then raise exception 'board items lost in merge';end if;
 if (select count(*) from public.boards where user_id=u and name='Dashboard v2')<>1 then raise exception 'target board must keep its name';end if;
end$$;
-- export includes boards for their owner only
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1',true);
do $$declare data jsonb;begin
 data:=public.reposhelf_export_account();if jsonb_array_length(data->'boards')<>2 or data::text not like '%Admin UI%' then raise exception 'export must include the owner boards %',data->'boards';end if;
end$$;
reset role;
-- server only: members and anonymous callers cannot reach the tables or functions directly
set local role authenticated;
do $$begin
 begin perform count(*) from public.boards;raise exception 'authenticated users must not read boards';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.board_items;raise exception 'authenticated users must not read board items';exception when insufficient_privilege then null;end;
 begin perform public.reposhelf_boards_list('00000000-0000-0000-0000-0000000000b1');raise exception 'authenticated users must not list boards through the function';exception when insufficient_privilege then null;end;
 begin perform public.reposhelf_board_item('00000000-0000-0000-0000-0000000000b1',gen_random_uuid(),'x/y',true);raise exception 'authenticated users must not edit boards';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role anon;
do $$begin begin perform public.reposhelf_board_save('00000000-0000-0000-0000-0000000000b1',null,'x','');raise exception 'anonymous callers must not create boards';exception when insufficient_privilege then null;end;end$$;
reset role;
-- deleting the account removes its boards
delete from auth.users where id='00000000-0000-0000-0000-0000000000b2';
do $$begin if exists(select 1 from public.boards where user_id='00000000-0000-0000-0000-0000000000b2') then raise exception 'account deletion must remove boards';end if;end$$;
rollback;

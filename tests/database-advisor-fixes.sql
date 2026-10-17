-- Advisor fixes: the policies still allow exactly what they did, there is one SELECT policy per role on the editorial tables, and the indexes exist.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-0000000000c1'),('00000000-0000-0000-0000-0000000000c2');
insert into public.reposhelf_admins(user_id) values('00000000-0000-0000-0000-0000000000c2');
insert into public.editorial_ribbons(title,enabled,position) values('adv-on',true,990),('adv-off',false,991);
do $$
declare n integer;
begin
 -- one SELECT policy per role on the tables the advisor flagged
 select count(*) into n from pg_policies where schemaname='public' and tablename='editorial_ribbons' and cmd in ('SELECT','ALL') and roles && array['authenticated']::name[];
 if n<>1 then raise exception 'editorial_ribbons should have one read policy for members, has %',n;end if;
 select count(*) into n from pg_policies where schemaname='public' and tablename='editorial_settings' and cmd in ('SELECT','ALL') and roles && array['authenticated']::name[];
 if n<>1 then raise exception 'editorial_settings should have one read policy for members, has %',n;end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename in ('user_likes','promotions','promotion_events','repository_submissions') and policyname in ('likes_owner','promotion_owner_read','promotion_event_read','submission_read') and qual ~ 'auth\.uid\(\)' and qual !~ 'SELECT auth\.uid\(\)') then raise exception 'a policy still calls auth.uid() per row';end if;
end$$;
-- visitors read enabled shelves only
set local role anon;
do $$begin if (select count(*) from public.editorial_ribbons where title like 'adv-%')<>1 then raise exception 'anon should see only the enabled shelf';end if;end$$;
reset role;
-- a member sees enabled shelves; an administrator sees all
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c1',true);
set local role authenticated;
do $$begin
 if (select count(*) from public.editorial_ribbons where title like 'adv-%')<>1 then raise exception 'a member should see only the enabled shelf';end if;
 begin insert into public.editorial_ribbons(title,enabled,position) values('adv-x',true,992);raise exception 'a member must not write shelves';exception when insufficient_privilege or others then if sqlerrm like 'a member must not%' then raise;end if;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c2',true);
set local role authenticated;
do $$begin
 if (select count(*) from public.editorial_ribbons where title like 'adv-%')<>2 then raise exception 'an administrator should see every shelf';end if;
 update public.editorial_ribbons set description='changed' where title='adv-off';
 if (select description from public.editorial_ribbons where title='adv-off')<>'changed' then raise exception 'an administrator should update shelves';end if;
 insert into public.editorial_ribbons(title,enabled,position) values('adv-new',true,993);
 delete from public.editorial_ribbons where title='adv-new';
 if exists(select 1 from public.editorial_ribbons where title='adv-new') then raise exception 'an administrator should delete shelves';end if;
end$$;
reset role;
do $$
declare want text[]:=array['admin_role_changes_actor','admin_role_changes_target','board_items_board_user','listing_moderation_audit_actor','listing_reports_reporter','promotion_events_promotion','promotions_reviewed_by','viewer_site_prefs_updated_by'];x text;
begin
 foreach x in array want loop if not exists(select 1 from pg_indexes where schemaname='public' and indexname=x) then raise exception 'missing index %',x;end if;end loop;
end$$;
rollback;

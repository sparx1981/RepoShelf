begin;
-- Adds the "Trending on Trendshift" ribbon mode and its built-in ribbon, placed straight after "Trending now".
alter table public.editorial_ribbons drop constraint if exists editorial_ribbons_mode_check;
alter table public.editorial_ribbons add constraint editorial_ribbons_mode_check check(mode in ('manual','popular','trending','newest','random','daily','community','releases','reposhelf','trendshift'));
do $$
declare after_position integer;
begin
 if exists(select 1 from public.editorial_ribbons where builtin_key='trendshift') then return; end if;
 select position into after_position from public.editorial_ribbons where builtin_key='trending' order by position limit 1;
 -- Keep the administrator's current order: later ribbons move down one place to make room.
 if after_position is not null then update public.editorial_ribbons set position=position+1 where position>after_position; end if;
 insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values ('e0000000-0000-4000-8000-000000000049','trendshift','Trending on Trendshift','Repositories on Trendshift’s daily, weekly and monthly lists or GitHub’s daily trending list in the last few days. Ranked by list position and recency.','','trendshift',true,coalesce(after_position+1,-96),'[]') on conflict do nothing;
end $$;
commit;

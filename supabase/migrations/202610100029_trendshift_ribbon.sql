begin;
-- Adds the "Trending on Trendshift" ribbon mode and its built-in ribbon, placed straight after "Trending now".
alter table public.editorial_ribbons drop constraint if exists editorial_ribbons_mode_check;
alter table public.editorial_ribbons add constraint editorial_ribbons_mode_check check(mode in ('manual','popular','trending','newest','random','daily','community','releases','reposhelf','trendshift'));
insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values ('e0000000-0000-4000-8000-000000000049','trendshift','Trending on Trendshift','Repositories on Trendshift’s daily, weekly and monthly lists or GitHub’s daily trending list in the last few days. Ranked by list position and recency.','','trendshift',true,-96,'[]') on conflict do nothing;
commit;

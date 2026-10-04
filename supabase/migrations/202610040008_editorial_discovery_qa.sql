begin;
alter table public.editorial_ribbons add column if not exists builtin_key text;
create unique index if not exists editorial_builtin_key on public.editorial_ribbons(builtin_key) where builtin_key is not null;
alter table public.editorial_ribbons drop constraint if exists editorial_ribbons_mode_check;
alter table public.editorial_ribbons add constraint editorial_ribbons_mode_check check(mode in ('manual','popular','trending','newest','random','daily','community','releases'));
insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values
('e0000000-0000-4000-8000-000000000001'::uuid,'hero','In the spotlight','Featured projects to explore.','','manual',true,-100,'["excalidraw/excalidraw","tldraw/tldraw","hoppscotch/hoppscotch","CorentinTh/it-tools","actualbudget/actual","twentyhq/twenty","drawdb-io/drawdb","AmruthPillai/Reactive-Resume","monkeytypegame/monkeytype","benweet/stackedit","AppFlowy-IO/AppFlowy","calcom/cal.com"]'::jsonb),
('e0000000-0000-4000-8000-000000000002'::uuid,'picks','Editor’s picks','A small selection chosen for what you can build.','','manual',true,-99,'["excalidraw/excalidraw","tldraw/tldraw","hoppscotch/hoppscotch","CorentinTh/it-tools","actualbudget/actual","twentyhq/twenty","drawdb-io/drawdb","AmruthPillai/Reactive-Resume","monkeytypegame/monkeytype","benweet/stackedit","AppFlowy-IO/AppFlowy","calcom/cal.com"]'::jsonb),
('e0000000-0000-4000-8000-000000000003'::uuid,'community','Community discoveries','Recent repository discussions on Hacker News and Bluesky. Ranked by community interest and recency.','','community',true,-98,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000004'::uuid,'releases','Popular recent releases','Published GitHub releases from the last 30 days.','','releases',true,-97,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000005'::uuid,'trending','Trending now','Measured growth in stars and forks. Each card shows its observation window.','','trending',true,-96,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000006'::uuid,'category:design','Design','Popularity within each source: GitHub stars and forks, or Space likes.','Design','popular',true,-95,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000007'::uuid,'category:developer-tools','Developer tools','Popularity within each source: GitHub stars and forks, or Space likes.','Developer tools','popular',true,-94,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000008'::uuid,'category:productivity','Productivity','Popularity within each source: GitHub stars and forks, or Space likes.','Productivity','popular',true,-93,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000009'::uuid,'category:business','Business','Popularity within each source: GitHub stars and forks, or Space likes.','Business','popular',true,-92,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000010'::uuid,'category:finance','Finance','Popularity within each source: GitHub stars and forks, or Space likes.','Finance','popular',true,-91,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000011'::uuid,'category:education','Education','Popularity within each source: GitHub stars and forks, or Space likes.','Education','popular',true,-90,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000012'::uuid,'category:ai-machine-learning','AI & machine learning','Popularity within each source: GitHub stars and forks, or Space likes.','AI & machine learning','popular',true,-89,'[]'::jsonb),
('e0000000-0000-4000-8000-000000000013'::uuid,'category:other','Other','Popularity within each source: GitHub stars and forks, or Space likes.','Other','popular',true,-88,'[]'::jsonb)
on conflict do nothing;
create or replace function public.reposhelf_save_ribbon(row_id uuid,expected_revision integer,row_title text,row_description text,row_category text,row_mode text,row_enabled boolean,row_items jsonb) returns public.editorial_ribbons language plpgsql security definer set search_path='' as $$declare saved public.editorial_ribbons;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
perform pg_advisory_xact_lock(71883001);
if jsonb_typeof(row_items)<>'array' or exists(select 1 from jsonb_array_elements_text(row_items) p where p!~'^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' or length(p)>220) or (select count(*)<>count(distinct p) from jsonb_array_elements_text(row_items) p) then raise check_violation;end if;
if row_id is null then insert into public.editorial_ribbons(title,description,category,mode,enabled,items,position) values(row_title,row_description,row_category,row_mode,row_enabled,row_items,(select coalesce(max(position),0)+1 from public.editorial_ribbons)) returning * into saved;
else update public.editorial_ribbons set title=row_title,description=row_description,category=row_category,mode=row_mode,enabled=row_enabled,items=row_items,revision=revision+1,updated_at=now() where id=row_id and revision=expected_revision returning * into saved;if not found then raise exception using errcode='40001',message='Ribbon changed';end if;end if;
if row_enabled and saved.builtin_key is null then update public.editorial_settings set custom_rows=true where id=true;end if;return saved;end$$;
-- All selected-date metrics use the same UTC calendar-day boundary.
create or replace function public.reposhelf_analytics(days integer default 30) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;cutoff timestamptz;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;if days not between 1 and 90 then raise check_violation;end if;
cutoff:=(((now() at time zone 'UTC')::date-days+1)::timestamp at time zone 'UTC');
select jsonb_build_object('uniqueVisitors',(select count(distinct period_visitor_hash) from public.analytics_events where created_at>=cutoff and period_visitor_hash is not null),'uniqueVisitorsSince',(select started_at from public.analytics_unique_tracking where id=true),'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from public.analytics_daily d where day>=(now() at time zone 'UTC')::date-days+1),'[]'::jsonb),'totalLikes',(select count(*) from public.user_likes),'likesAdded',(select count(*) from public.user_likes where created_at>=cutoff),'topListings',coalesce((select jsonb_agg(t) from (select project_id,count(*) as views from public.analytics_events where kind='listing_view' and project_id is not null and created_at>=cutoff group by project_id order by count(*) desc,project_id limit 10) t),'[]'::jsonb)) into result;return result;end$$;
revoke all on function public.reposhelf_analytics(integer) from public,anon,authenticated;
grant execute on function public.reposhelf_analytics(integer) to authenticated;
notify pgrst,'reload schema';
commit;

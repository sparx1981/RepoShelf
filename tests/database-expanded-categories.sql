begin;
do $$begin
 if (select count(*) from public.editorial_ribbons where builtin_key in ('category:architecture-building-design','category:games-game-development','category:animation-motion','category:simulation-physics','category:crypto-blockchain','category:food-cooking','category:automation-workflows','category:home-automation','category:maps-geospatial','category:photography','category:health-fitness','category:android','category:apple','category:mobile','category:streaming','category:fashion','category:science','category:kids','category:automotive','category:travel'))<>20 then raise exception 'Expanded subject shelves missing';end if;
 if not exists(select 1 from public.editorial_ribbons where builtin_key='category:travel' and id='e0000000-0000-4000-8000-000000000034') then raise exception 'Travel shelf identity changed';end if;
end$$;
rollback;

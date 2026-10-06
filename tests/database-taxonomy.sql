begin;
do $$begin
 if (select count(*) from public.editorial_ribbons where builtin_key in ('category:architecture-building-design','category:games-game-development','category:animation-motion','category:simulation-physics','category:crypto-blockchain','category:food-cooking','category:automation-workflows'))<>7 then raise exception 'Subject shelves missing';end if;
 if not exists(select 1 from public.editorial_ribbons where builtin_key='reposhelf' and id='e0000000-0000-4000-8000-000000000014') then raise exception 'Existing shelf identity changed';end if;
end$$;
rollback;

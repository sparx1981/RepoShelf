begin;
-- Idempotent: includes migration 14 subjects without overwriting curated selections.
insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values
('e0000000-0000-4000-8000-000000000015','category:architecture-building-design','Architecture & building design','','Architecture & building design','popular',true,-86,'[]'),
('e0000000-0000-4000-8000-000000000016','category:games-game-development','Games & game development','','Games & game development','popular',true,-85,'[]'),
('e0000000-0000-4000-8000-000000000017','category:animation-motion','Animation & motion','','Animation & motion','popular',true,-84,'[]'),
('e0000000-0000-4000-8000-000000000018','category:simulation-physics','Simulation & physics','','Simulation & physics','popular',true,-83,'[]'),
('e0000000-0000-4000-8000-000000000019','category:crypto-blockchain','Crypto & blockchain','','Crypto & blockchain','popular',true,-82,'[]'),
('e0000000-0000-4000-8000-000000000020','category:food-cooking','Food & cooking','','Food & cooking','popular',true,-81,'[]'),
('e0000000-0000-4000-8000-000000000021','category:automation-workflows','Automation & workflows','','Automation & workflows','popular',true,-80,'[]'),
('e0000000-0000-4000-8000-000000000022','category:home-automation','Home automation','','Home automation','popular',true,-79,'[]'),
('e0000000-0000-4000-8000-000000000023','category:maps-geospatial','Maps & geospatial','','Maps & geospatial','popular',true,-78,'[]'),
('e0000000-0000-4000-8000-000000000024','category:photography','Photography','','Photography','popular',true,-77,'[]'),
('e0000000-0000-4000-8000-000000000025','category:health-fitness','Health & fitness','','Health & fitness','popular',true,-76,'[]'),
('e0000000-0000-4000-8000-000000000026','category:android','Android','','Android','popular',true,-75,'[]'),
('e0000000-0000-4000-8000-000000000027','category:apple','Apple','','Apple','popular',true,-74,'[]'),
('e0000000-0000-4000-8000-000000000028','category:mobile','Mobile','','Mobile','popular',true,-73,'[]'),
('e0000000-0000-4000-8000-000000000029','category:streaming','Streaming','','Streaming','popular',true,-72,'[]'),
('e0000000-0000-4000-8000-000000000030','category:fashion','Fashion','','Fashion','popular',true,-71,'[]'),
('e0000000-0000-4000-8000-000000000031','category:science','Science','','Science','popular',true,-70,'[]'),
('e0000000-0000-4000-8000-000000000032','category:kids','Kids','','Kids','popular',true,-69,'[]'),
('e0000000-0000-4000-8000-000000000033','category:automotive','Automotive','','Automotive','popular',true,-68,'[]'),
('e0000000-0000-4000-8000-000000000034','category:travel','Travel','','Travel','popular',true,-67,'[]')
on conflict do nothing;
notify pgrst,'reload schema';
commit;

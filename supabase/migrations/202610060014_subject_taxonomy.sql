begin;
-- Add new editable subject shelves. Existing selections, order and overrides remain.
insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values
('e0000000-0000-4000-8000-000000000015','category:architecture-building-design','Architecture & building design','','Architecture & building design','popular',true,-86,'[]'),
('e0000000-0000-4000-8000-000000000016','category:games-game-development','Games & game development','','Games & game development','popular',true,-85,'[]'),
('e0000000-0000-4000-8000-000000000017','category:animation-motion','Animation & motion','','Animation & motion','popular',true,-84,'[]'),
('e0000000-0000-4000-8000-000000000018','category:simulation-physics','Simulation & physics','','Simulation & physics','popular',true,-83,'[]'),
('e0000000-0000-4000-8000-000000000019','category:crypto-blockchain','Crypto & blockchain','','Crypto & blockchain','popular',true,-82,'[]'),
('e0000000-0000-4000-8000-000000000020','category:food-cooking','Food & cooking','','Food & cooking','popular',true,-81,'[]'),
('e0000000-0000-4000-8000-000000000021','category:automation-workflows','Automation & workflows','','Automation & workflows','popular',true,-80,'[]')
on conflict do nothing;
notify pgrst,'reload schema';
commit;

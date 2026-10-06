begin;
-- Idempotent: adds editable storefront rows for the 13 subjects introduced with taxonomy version 3.
-- Existing rows, curated selections and ordering are never overwritten.
insert into public.editorial_ribbons(id,builtin_key,title,description,category,mode,enabled,position,items) values
('e0000000-0000-4000-8000-000000000035','category:mcp-servers-agents','MCP servers & agents','','MCP servers & agents','popular',true,-66,'[]'),
('e0000000-0000-4000-8000-000000000036','category:image-audio-video-ai','Image, audio & video AI','','Image, audio & video AI','popular',true,-65,'[]'),
('e0000000-0000-4000-8000-000000000037','category:chatbots-assistants','Chatbots & assistants','','Chatbots & assistants','popular',true,-64,'[]'),
('e0000000-0000-4000-8000-000000000038','category:templates-ui-components','Templates & UI components','','Templates & UI components','popular',true,-63,'[]'),
('e0000000-0000-4000-8000-000000000039','category:portfolios-personal-sites','Portfolios & personal sites','','Portfolios & personal sites','popular',true,-62,'[]'),
('e0000000-0000-4000-8000-000000000040','category:browser-extensions-pwas','Browser extensions & PWAs','','Browser extensions & PWAs','popular',true,-61,'[]'),
('e0000000-0000-4000-8000-000000000041','category:maths-algorithms','Maths & algorithms','','Maths & algorithms','popular',true,-60,'[]'),
('e0000000-0000-4000-8000-000000000042','category:data-dashboards','Data & dashboards','','Data & dashboards','popular',true,-59,'[]'),
('e0000000-0000-4000-8000-000000000043','category:3d-graphics','3D & graphics','','3D & graphics','popular',true,-58,'[]'),
('e0000000-0000-4000-8000-000000000044','category:music-audio','Music & audio','','Music & audio','popular',true,-57,'[]'),
('e0000000-0000-4000-8000-000000000045','category:writing-documents','Writing & documents','','Writing & documents','popular',true,-56,'[]'),
('e0000000-0000-4000-8000-000000000046','category:self-hosted-apps','Self-hosted apps','','Self-hosted apps','popular',true,-55,'[]'),
('e0000000-0000-4000-8000-000000000047','category:privacy-security','Privacy & security','','Privacy & security','popular',true,-54,'[]')
on conflict do nothing;
notify pgrst,'reload schema';
commit;

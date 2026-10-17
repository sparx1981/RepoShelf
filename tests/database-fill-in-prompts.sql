-- The six more fill-in prompts: listings, categories, text with a brief block, idempotent re-runs.
begin;
do $$
declare r public.ss_prompts;n integer;ids text[]:=array['landing-page-builder','app-from-spec','brand-identity-kit','social-content-engine','explainer-video-script','market-research-brief'];i text;
begin
 foreach i in array ids loop
  select * into r from public.ss_prompts where source='siteshelf' and source_id=i;
  if r.id is null then raise exception 'the % listing was not inserted',i;end if;
  if r.kind<>'text' or not r.published or r.is_new or r.type<>'free' then raise exception '% should be a published free text prompt: %',i,row_to_json(r);end if;
  if r.category not in ('Websites & apps','Brand & marketing','Video & motion','Research & writing') then raise exception '% has an unexpected category %',i,r.category;end if;
  if r.prompt<>r.original_prompt or r.prompt not like '<role>%' or r.prompt not like '%<brief>%Leave any line blank%</brief>%' or r.prompt not like '%<deliverables>%</deliverables>' then raise exception '% prompt text is missing or damaged',i;end if;
  if r.prompt like '%'||chr(13)||'%' or r.prompt ~ '[ ]+$' or r.prompt ~ '[ ]\n' then raise exception '% should have no carriage returns or trailing spaces',i;end if;
  select count(*) into n from public.ss_prompts where source='siteshelf' and source_id=i;
  if n<>1 then raise exception 'exactly one % listing expected',i;end if;
 end loop;
 select count(*) into n from public.ss_prompts where kind='text';
 if n<7 then raise exception 'expected at least 7 text prompts, found %',n;end if;
end$$;
rollback;

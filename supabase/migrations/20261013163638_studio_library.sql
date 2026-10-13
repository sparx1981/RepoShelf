-- Studio saves and legal v4. Apply before the matching application deployment.
-- Public recipes/previews stay static. Downloadable AI rasters are private.
begin;
alter table public.user_likes drop constraint if exists user_likes_project_id_check;
alter table public.user_likes add constraint user_likes_project_id_check check(
 length(project_id)<=220 and (
  project_id ~ '^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'
  or project_id ~ '^ss:(siteshelf|sceneai|ui|bg|img)/[a-z0-9-]{1,80}$'));
alter table public.prompt_events drop constraint if exists prompt_events_prompt_key_check;
alter table public.prompt_events add constraint prompt_events_prompt_key_check
 check(prompt_key ~ '^(siteshelf|sceneai|ui|bg|img)/[a-z0-9-]{1,80}$');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('studio-images','studio-images',false,16777216,array['image/png','image/webp'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- A restrictive policy prevents broad existing permissive policies from exposing
-- this bucket. Only the server service role can upload or mint signed links;
-- the application checks the member's current legal acceptance first.
drop policy if exists studio_images_server_only on storage.objects;
create policy studio_images_server_only on storage.objects as restrictive for all
 to anon,authenticated using(bucket_id<>'studio-images') with check(bucket_id<>'studio-images');

create or replace function public.reposhelf_accept_legal(terms text,privacy text)
 returns timestamptz language plpgsql security definer set search_path='' as $$
declare at_time timestamptz;
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 if terms is null or privacy is null or terms<>privacy
  or terms not in ('2026-10-03-v1','2026-10-06-v2','2026-10-11-v3','2026-10-13-v4') then raise check_violation;end if;
 insert into public.legal_acceptances(user_id,terms_version,privacy_version)
  values(auth.uid(),terms,privacy) on conflict do nothing;
 select accepted_at into at_time from public.legal_acceptances
  where user_id=auth.uid() and terms_version=terms and privacy_version=privacy;
 return at_time;
end$$;
revoke all on function public.reposhelf_accept_legal(text,text) from public,anon,authenticated;
grant execute on function public.reposhelf_accept_legal(text,text) to authenticated;
commit;

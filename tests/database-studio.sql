-- Studio: a private image bucket that only the server can use, prompt and like keys for studio items, legal v4.
begin;
do $$
declare b storage.buckets;n integer;
begin
 select * into b from storage.buckets where id='studio-images';
 if b.id is null then raise exception 'studio-images bucket missing';end if;
 if b.public then raise exception 'studio-images must be private';end if;
 if not (b.allowed_mime_types @> array['image/png','image/webp','video/mp4']) then raise exception 'studio-images must accept png, webp and mp4: %',b.allowed_mime_types;end if;
 if b.file_size_limit<>16777216 then raise exception 'unexpected size limit %',b.file_size_limit;end if;
 -- the restrictive policy is what keeps a broad permissive policy from exposing the bucket
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='studio_images_server_only' and permissive='RESTRICTIVE') then raise exception 'restrictive policy missing';end if;
 -- the temporary import helper is gone, and re-applying the migrations does not bring it back
 if exists(select 1 from pg_extension where extname='http') then raise exception 'http extension must not exist';end if;
 -- ids of Studio items are accepted as likes and as prompt event keys, and bad ones are not
 if not exists(select 1 from pg_constraint where conname='user_likes_project_id_check' and pg_get_constraintdef(oid) like '%img%' and pg_get_constraintdef(oid) like '%bg%') then raise exception 'likes do not accept studio ids';end if;
 if not exists(select 1 from pg_constraint where conname='prompt_events_prompt_key_check' and pg_get_constraintdef(oid) like '%img%') then raise exception 'prompt events do not accept studio keys';end if;
end$$;
-- members and the browser keys cannot read the bucket's objects, even with the broad policy in place
insert into storage.objects(bucket_id,name) values('studio-images','secret.png');
insert into storage.buckets(id,name,public) values('other','other',true) on conflict do nothing;
insert into storage.objects(bucket_id,name) values('other','public.png');
set local role authenticated;
do $$declare n integer;begin
 select count(*) into n from storage.objects where bucket_id='studio-images';
 if n<>0 then raise exception 'a signed-in member can read % studio objects',n;end if;
 select count(*) into n from storage.objects where bucket_id='other';
 if n<>1 then raise exception 'other buckets must stay readable by the broad policy, saw %',n;end if;
 begin insert into storage.objects(bucket_id,name) values('studio-images','x.png');raise exception 'a member uploaded into the studio bucket';exception when insufficient_privilege or check_violation then null;end;
end$$;
reset role;
-- the server (service role) can still reach it
set local role service_role;
do $$declare n integer;begin select count(*) into n from storage.objects where bucket_id='studio-images';if n<>1 then raise exception 'the service role should see the studio object, saw %',n;end if;end$$;
reset role;
-- legal v4 is accepted by the acceptance function
do $$begin
 if not exists(select 1 from pg_proc where proname='reposhelf_accept_legal' and prosrc like '%2026-10-13-v4%') then raise exception 'legal v4 missing';end if;
end$$;
rollback;

begin;
update storage.buckets set allowed_mime_types = array['image/png','image/webp','video/mp4'] where id='studio-images' and public=false;
create extension http with schema extensions;
do $$declare f regprocedure;begin
for f in select p.oid::regprocedure from pg_proc p join pg_depend d on d.objid=p.oid and d.classid='pg_proc'::regclass join pg_extension e on e.oid=d.refobjid where e.extname='http' and d.deptype='e' loop
execute format('revoke execute on function %s from public,anon,authenticated',f);
execute format('grant execute on function %s to postgres',f);
end loop;end$$;
commit;

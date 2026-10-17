-- Studio animation: the private bucket also accepts MP4 files.
-- The original version of this file also created the temporary `http` extension for the batch import. That import is finished
-- (see 20261014053615, which removes the extension), so only the bucket change remains.
begin;
update storage.buckets set allowed_mime_types = array['image/png','image/webp','video/mp4'] where id='studio-images' and public=false;
commit;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key,created_at timestamptz default now(),last_sign_in_at timestamptz default now(),raw_user_meta_data jsonb default '{}');
create table auth.identities(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),provider text,provider_id text,identity_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
insert into auth.users(id) values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');

insert into auth.users(id,raw_user_meta_data) values('00000000-0000-0000-0000-000000000003','{"user_name":"owner","admin":true}'),('00000000-0000-0000-0000-000000000004','{"user_name":"owner"}');
insert into auth.identities(user_id,provider,provider_id,identity_data) values
('00000000-0000-0000-0000-000000000001','github','1','{"user_name":"owner"}'),
('00000000-0000-0000-0000-000000000002','github','2','{"user_name":"member"}'),
('00000000-0000-0000-0000-000000000003','github','3','{"user_name":"third"}'),
('00000000-0000-0000-0000-000000000004','google','4','{"user_name":"owner"}');

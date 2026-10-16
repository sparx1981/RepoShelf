-- Boards: a member groups items from My collection into named boards to use for a specific project.
-- An item can sit on many boards. A board item must be in the member's collection (user_likes), so removing an
-- item from the collection also takes it off every board. Boards are private to their owner: all access is through
-- server-only functions that take the verified owner, which the website API and the connector (personal key) supply.
-- Safe to run more than once.
begin;

create table if not exists public.boards(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80),
 description text not null default '' check(length(description)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,user_id));
create unique index if not exists boards_owner_name on public.boards(user_id,lower(name));

create table if not exists public.board_items(
 board_id uuid not null,
 user_id uuid not null,
 project_id text not null,
 added_at timestamptz not null default now(),
 primary key(board_id,project_id),
 foreign key(board_id,user_id) references public.boards(id,user_id) on delete cascade on update cascade,
 foreign key(user_id,project_id) references public.user_likes(user_id,project_id) on delete cascade);
create index if not exists board_items_project on public.board_items(user_id,project_id);

alter table public.boards enable row level security;
alter table public.board_items enable row level security;
revoke all on public.boards,public.board_items from public,anon,authenticated;

-- All boards of a member with the ids on each, for the website.
create or replace function public.reposhelf_boards_list(p_user uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'description',b.description,'createdAt',b.created_at,'updatedAt',b.updated_at,
  'items',coalesce((select jsonb_agg(i.project_id order by i.added_at desc,i.project_id) from public.board_items i where i.board_id=b.id),'[]'::jsonb)) order by b.created_at,b.id),'[]'::jsonb)
 from public.boards b where b.user_id=p_user;
$$;

-- One board by id or by name (case-insensitive) with each item's saved snapshot. Null when there is no such board.
create or replace function public.reposhelf_board_get(p_user uuid,p_ref text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b public.boards;
begin
 if p_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
  select * into b from public.boards where user_id=p_user and id=p_ref::uuid;
 end if;
 if b.id is null then select * into b from public.boards where user_id=p_user and lower(name)=lower(btrim(p_ref));end if;
 if b.id is null then return null;end if;
 return jsonb_build_object('id',b.id,'name',b.name,'description',b.description,'createdAt',b.created_at,'updatedAt',b.updated_at,
  'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.project_id,'addedAt',i.added_at,'snapshot',l.project_snapshot) order by i.added_at desc,i.project_id)
   from public.board_items i join public.user_likes l on l.user_id=i.user_id and l.project_id=i.project_id where i.board_id=b.id),'[]'::jsonb));
end$$;

-- Create (p_id null) or rename/describe a board. At most 50 boards per member.
create or replace function public.reposhelf_board_save(p_user uuid,p_id uuid,p_name text,p_description text) returns jsonb language plpgsql security definer set search_path='' as $$
declare clean text:=left(btrim(regexp_replace(coalesce(p_name,''),'[[:cntrl:]\s]+',' ','g')),80);new_id uuid;
begin
 if clean='' then return jsonb_build_object('ok',false,'reason','invalid_name');end if;
 if p_user is null or not exists(select 1 from auth.users where id=p_user) then return jsonb_build_object('ok',false,'reason','no_account');end if;
 perform pg_advisory_xact_lock(hashtextextended('boards:'||p_user::text,0));
 if exists(select 1 from public.boards where user_id=p_user and lower(name)=lower(clean) and id is distinct from p_id) then return jsonb_build_object('ok',false,'reason','duplicate_name');end if;
 if p_id is null then
  if (select count(*) from public.boards where user_id=p_user)>=50 then return jsonb_build_object('ok',false,'reason','limit');end if;
  insert into public.boards(user_id,name,description) values(p_user,clean,left(btrim(coalesce(p_description,'')),1000)) returning id into new_id;
  return jsonb_build_object('ok',true,'id',new_id);
 end if;
 update public.boards set name=clean,description=left(btrim(coalesce(p_description,description)),1000),updated_at=now() where id=p_id and user_id=p_user;
 if not found then return jsonb_build_object('ok',false,'reason','not_found');end if;
 return jsonb_build_object('ok',true,'id',p_id);
end$$;

create or replace function public.reposhelf_board_delete(p_user uuid,p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 delete from public.boards where id=p_id and user_id=p_user;
 return found;
end$$;

-- Put an item on a board or take it off. The item must be in the member's collection; at most 100 items per board.
create or replace function public.reposhelf_board_item(p_user uuid,p_board uuid,p_project text,p_present boolean) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('boards:'||p_user::text,0));
 if not exists(select 1 from public.boards where id=p_board and user_id=p_user) then return jsonb_build_object('ok',false,'reason','not_found');end if;
 if not p_present then
  delete from public.board_items where board_id=p_board and project_id=p_project;
  update public.boards set updated_at=now() where id=p_board;
  return jsonb_build_object('ok',true);
 end if;
 if not exists(select 1 from public.user_likes where user_id=p_user and project_id=p_project) then return jsonb_build_object('ok',false,'reason','not_in_collection');end if;
 if exists(select 1 from public.board_items where board_id=p_board and project_id=p_project) then return jsonb_build_object('ok',true);end if;
 if (select count(*) from public.board_items where board_id=p_board)>=100 then return jsonb_build_object('ok',false,'reason','limit');end if;
 insert into public.board_items(board_id,user_id,project_id) values(p_board,p_user,p_project);
 update public.boards set updated_at=now() where id=p_board;
 return jsonb_build_object('ok',true);
end$$;

revoke all on function public.reposhelf_boards_list(uuid) from public,anon,authenticated;
revoke all on function public.reposhelf_board_get(uuid,text) from public,anon,authenticated;
revoke all on function public.reposhelf_board_save(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.reposhelf_board_delete(uuid,uuid) from public,anon,authenticated;
revoke all on function public.reposhelf_board_item(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.reposhelf_boards_list(uuid) to service_role;
grant execute on function public.reposhelf_board_get(uuid,text) to service_role;
grant execute on function public.reposhelf_board_save(uuid,uuid,text,text) to service_role;
grant execute on function public.reposhelf_board_delete(uuid,uuid) to service_role;
grant execute on function public.reposhelf_board_item(uuid,uuid,text,boolean) to service_role;

-- The account export now includes boards (same body as migration 11 plus 'boards').
create or replace function public.reposhelf_export_account() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare export_user_id uuid:=auth.uid();result jsonb;
begin
 if export_user_id is null then raise insufficient_privilege;end if;
 select jsonb_build_object('formatVersion',1,'exportedAt',now(),
  'account',(select jsonb_build_object('id',u.id,'createdAt',u.created_at,'lastSignInAt',u.last_sign_in_at,'administrator',exists(select 1 from public.reposhelf_admins a where a.user_id=u.id),'github',coalesce((select jsonb_build_object('id',i.provider_id,'username',coalesce(i.identity_data->>'user_name',i.identity_data->>'preferred_username')) from auth.identities i where i.user_id=u.id and i.provider='github' limit 1),'{}'::jsonb)) from auth.users u where u.id=export_user_id),
  'likes',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.project_id) from public.user_likes r where r.user_id=export_user_id),'[]'::jsonb),
  'boards',coalesce((select jsonb_agg(jsonb_build_object('name',b.name,'description',b.description,'createdAt',b.created_at,'items',coalesce((select jsonb_agg(i.project_id order by i.added_at) from public.board_items i where i.board_id=b.id),'[]'::jsonb)) order by b.created_at) from public.boards b where b.user_id=export_user_id),'[]'::jsonb),
  'publicForks',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.github_fork_id) from public.user_forks r where r.user_id=export_user_id),'[]'::jsonb),
  'viewingSettings',coalesce((select to_jsonb(r)-'user_id' from public.user_discovery_settings r where r.user_id=export_user_id),'{}'::jsonb),
  'viewingHistory',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.viewed_at desc) from public.user_project_history r where r.user_id=export_user_id),'[]'::jsonb),
  'agreements',coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.accepted_at) from public.legal_acceptances r where r.user_id=export_user_id),'[]'::jsonb),
  'submissions',coalesce((select jsonb_agg(to_jsonb(r)-'user_id'-'lease'-'lease_until' order by r.created_at) from public.repository_submissions r where r.user_id=export_user_id),'[]'::jsonb),
  'reports',coalesce((select jsonb_agg(to_jsonb(r)-'reporter' order by r.created_at) from public.listing_reports r where r.reporter=export_user_id),'[]'::jsonb),
  'promotions',coalesce((select jsonb_agg(to_jsonb(r)-'user_id'-'reviewed_by'-'checkout_attempt' order by r.created_at) from public.promotions r where r.user_id=export_user_id),'[]'::jsonb)
 ) into result;
 return result;
end$$;
commit;

-- Per-row shuffle for the storefront: 'off' (default), 'load' (a new order on every page load) or 'daily' (one order per UTC
-- day). Shuffling only reorders a row's listings: a ranked row takes its top listings first, then shuffles those same ones.
-- Rows keep working unchanged until the setting is used. Safe to run twice.
begin;
alter table public.editorial_ribbons add column if not exists shuffle text not null default 'off';
alter table public.editorial_ribbons drop constraint if exists editorial_ribbons_shuffle_check;
alter table public.editorial_ribbons add constraint editorial_ribbons_shuffle_check check(shuffle in ('off','load','daily'));

-- The save function gains one optional argument. The old eight-argument version is removed so a call is never ambiguous;
-- callers that do not pass a shuffle keep working and reset it to 'off'.
drop function if exists public.reposhelf_save_ribbon(uuid,integer,text,text,text,text,boolean,jsonb);
create or replace function public.reposhelf_save_ribbon(row_id uuid,expected_revision integer,row_title text,row_description text,row_category text,row_mode text,row_enabled boolean,row_items jsonb,row_shuffle text default 'off') returns public.editorial_ribbons language plpgsql security definer set search_path='' as $$declare saved public.editorial_ribbons;begin
if not public.reposhelf_is_admin() then raise insufficient_privilege;end if;
perform pg_advisory_xact_lock(71883001);
if row_shuffle is null or row_shuffle not in ('off','load','daily') then raise check_violation;end if;
if jsonb_typeof(row_items)<>'array' or exists(select 1 from jsonb_array_elements_text(row_items) p where p!~'^(hf:)?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$' or length(p)>220) or (select count(*)<>count(distinct p) from jsonb_array_elements_text(row_items) p) then raise check_violation;end if;
if row_id is null then insert into public.editorial_ribbons(title,description,category,mode,enabled,items,shuffle,position) values(row_title,row_description,row_category,row_mode,row_enabled,row_items,row_shuffle,(select coalesce(max(position),0)+1 from public.editorial_ribbons)) returning * into saved;
else update public.editorial_ribbons set title=row_title,description=row_description,category=row_category,mode=row_mode,enabled=row_enabled,items=row_items,shuffle=row_shuffle,revision=revision+1,updated_at=now() where id=row_id and revision=expected_revision returning * into saved;if not found then raise exception using errcode='40001',message='Ribbon changed';end if;end if;
if row_enabled and saved.builtin_key is null then update public.editorial_settings set custom_rows=true where id=true;end if;return saved;end$$;
revoke all on function public.reposhelf_save_ribbon(uuid,integer,text,text,text,text,boolean,jsonb,text) from public,anon,authenticated;
grant execute on function public.reposhelf_save_ribbon(uuid,integer,text,text,text,text,boolean,jsonb,text) to authenticated;
notify pgrst,'reload schema';
commit;

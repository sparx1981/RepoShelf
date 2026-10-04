-- One-time curation update, not a schema migration.
-- Run in the RepoShelf Supabase project's SQL editor.
-- Prioritise qualified alternatives; retain earlier selections after them.
-- Refresh the storefront editor after running this query.
begin;

select pg_advisory_xact_lock(71883001);

do $$
begin
  if (select count(*) from public.editorial_ribbons
      where builtin_key in ('hero', 'picks')) <> 2 then
    raise exception 'The spotlight and Editor''s picks rows are missing. Apply migration 8 first.';
  end if;
end
$$;

with desired(builtin_key, priority_items) as (
  values
    ('hero', '["immich-app/immich","plausible/analytics"]'::jsonb),
    ('picks', '["visgl/deck.gl","alvarotrigo/fullPage.js"]'::jsonb)
),
merged as (
  select r.id,
    (
      select jsonb_agg(selected.project_id order by selected.ordinal)
      from (
        select distinct on (lower(entry.project_id))
          entry.project_id, entry.ordinal
        from jsonb_array_elements_text(d.priority_items || r.items)
          with ordinality as entry(project_id, ordinal)
        order by lower(entry.project_id), entry.ordinal
      ) as selected
    ) as items
  from public.editorial_ribbons as r
  join desired as d using (builtin_key)
)
update public.editorial_ribbons as r
set items = m.items,
    mode = 'manual',
    category = '',
    enabled = true,
    revision = r.revision + 1,
    updated_at = now()
from merged as m
where r.id = m.id
  and (r.items is distinct from m.items
    or r.mode <> 'manual'
    or r.category <> ''
    or not r.enabled)
returning r.title, r.items, r.revision;

-- The existing 120-item constraint aborts the transaction rather than
-- silently removing older selections if a row is already at capacity.
commit;

-- Add a `subtitle` column to outfit_sets and reshape evolution titles.
--
-- Before: an evolution row (base_set IS NOT NULL) stored only its short name in
-- `title` (e.g. "Frost Night"), so titles collided across sets in select fields
-- and read as context-free anywhere the base set wasn't already on screen.
--
-- After:
--   base rows (base_set IS NULL)      -> title unchanged, subtitle NULL
--   evolution rows (base_set NOT NULL) -> subtitle = the old title,
--                                         title = '{base set title}: {subtitle}'
--
-- Evolution slugs are unaffected — they are still derived from the subtitle.

alter table public.outfit_sets
  add column if not exists subtitle text;

comment on column public.outfit_sets.subtitle is
  'Evolution-only short name (e.g. "Frost Night"). NULL for base sets. `title` for an evolution is stored as ''{base set title}: {subtitle}''.';

-- Move the existing evolution title into subtitle, then compose the new title.
update public.outfit_sets e
set
  subtitle = e.title,
  title = b.title || ': ' || e.title
from public.outfit_sets b
where e.base_set is not null
  and b.slug = e.base_set
  and e.subtitle is null;

-- A base set must not carry a subtitle; an evolution must have one.
alter table public.outfit_sets
  drop constraint if exists outfit_sets_subtitle_base_null;

alter table public.outfit_sets
  add constraint outfit_sets_subtitle_base_null
  check (
    (base_set is null and subtitle is null)
    or (base_set is not null and subtitle is not null)
  );

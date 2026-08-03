-- 20260803140000_add_location_to_momo_cloaks.sql
-- Add a location FK to momo_cloaks, matching how seasons and trials reference
-- the locations lookup: singular `location`, pointing at locations(slug) with
-- ON UPDATE CASCADE so renaming a location's slug propagates.
--
-- Nullable with no default: a cloak's location may be unknown when the row is
-- first drafted, and there is no sensible fallback location to assume.

begin;

alter table public.momo_cloaks
  add column if not exists location text
    references public.locations(slug) on update cascade;

create index if not exists momo_cloaks_location_idx on public.momo_cloaks (location);

commit;

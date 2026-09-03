-- Add updated_at to the locations lookup table, matching abilities, seasons and
-- season_categories (20260804120000_add_timestamps_to_lookup_tables.sql).
--
-- locations already has created_at (timestamptz default now()), so only
-- updated_at is missing. This is what lets the admin list show a real "last
-- edited" date instead of an em dash, and makes locations eligible for the
-- admin recents lists, which order by updated_at and filter out NULLs.

alter table public.locations
  add column if not exists updated_at timestamptz default now();

-- `default now()` only fires for new inserts, so the two existing rows would
-- keep a NULL updated_at and stay invisible to the recents lists. Seed from
-- created_at: a truthful lower bound rather than invented history, matching how
-- 20260804120000 backfilled seasons and season_categories.
update public.locations
  set updated_at = coalesce(updated_at, created_at, now())
  where updated_at is null;

-- Keep updated_at current on every write, matching the other lookup tables.
drop trigger if exists trg_locations_updated_at on public.locations;
create trigger trg_locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

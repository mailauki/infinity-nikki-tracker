-- Add created_at/updated_at to abilities, seasons, and season_categories.
--
-- These three are the Outfits overflow sections in the admin recents card. They were
-- unreachable in the UI until the overflow row existed, which is why the missing
-- timestamps went unnoticed: the recents queries order by created_at/updated_at and
-- filter out NULLs, so these tables could never appear in either list.
--
-- abilities has neither column; seasons and season_categories already have created_at
-- (timestamptz default now()) and need only updated_at.

alter table public.abilities
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.seasons
  add column if not exists updated_at timestamptz default now();

alter table public.season_categories
  add column if not exists updated_at timestamptz default now();

-- `default now()` only fires for new inserts, so existing rows would keep NULL and stay
-- invisible to the recents lists. Backfill them to a single timestamp: it does not
-- reconstruct real history (that data was never recorded), but it makes every row
-- sortable and visible. seasons/season_categories seed updated_at from their real
-- created_at where present, which is at least a truthful lower bound.
update public.abilities
  set created_at = coalesce(created_at, now()),
      updated_at = coalesce(updated_at, now())
  where created_at is null or updated_at is null;

update public.seasons
  set updated_at = coalesce(updated_at, created_at, now())
  where updated_at is null;

update public.season_categories
  set updated_at = coalesce(updated_at, created_at, now())
  where updated_at is null;

-- Keep updated_at current on every write, matching the makeup/momo tables.
drop trigger if exists trg_abilities_updated_at on public.abilities;
create trigger trg_abilities_updated_at
  before update on public.abilities
  for each row execute function public.set_updated_at();

drop trigger if exists trg_seasons_updated_at on public.seasons;
create trigger trg_seasons_updated_at
  before update on public.seasons
  for each row execute function public.set_updated_at();

drop trigger if exists trg_season_categories_updated_at on public.season_categories;
create trigger trg_season_categories_updated_at
  before update on public.season_categories
  for each row execute function public.set_updated_at();

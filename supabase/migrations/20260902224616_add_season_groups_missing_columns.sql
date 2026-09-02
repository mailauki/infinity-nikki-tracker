-- Backfill the columns the dashboard-created season_groups table never had.
--
-- Split from 20260902224458 because the remote project recorded it as its own
-- migration; keeping the split means the repo ledger and
-- supabase_migrations.schema_migrations agree version for version.
--
-- updated_at is required by the trigger in 20260902224458, which errors on
-- UPDATE ("record \"new\" has no field \"updated_at\"") without it.

-- The dashboard-created table has only id/created_at/slug/title, so on that
-- project the create in 20260902224458 is a no-op and these columns are
-- genuinely missing. image_url/description match the shape of seasons and
-- season_categories.
alter table public.season_groups
  add column if not exists updated_at timestamptz default now(),
  add column if not exists image_url text,
  add column if not exists description text;

-- default now() only applies to new inserts, so the 7 pre-existing rows would
-- keep a null updated_at and stay invisible to the admin recents lists, which
-- filter nulls. Seed from created_at: a truthful lower bound, matching how
-- 20260804120000_add_timestamps_to_lookup_tables.sql backfilled its tables.
update public.season_groups
  set updated_at = coalesce(updated_at, created_at, now())
  where updated_at is null;

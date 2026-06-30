-- supabase/migrations/20260621000002_add_timestamps_to_evolutions.sql
-- created_at and updated_at were originally added by hand on the remote DB, so
-- the migration history was not self-contained and 20260622000001 failed a clean
-- rebuild with "column e.created_at does not exist". Add them idempotently here.
--
-- On a fresh rebuild: evolutions still exists at this point (20260622000001 drops
-- it later), so the columns are added and 20260622000001 can reference them.
-- On the remote DB: evolutions is already gone (20260622000001 ran before this
-- migration was committed), so the block is skipped safely.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'evolutions'
  ) THEN
    ALTER TABLE public.evolutions
      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  END IF;
END $$;

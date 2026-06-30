-- supabase/migrations/20260621000002_add_timestamps_to_evolutions.sql
-- created_at and updated_at were originally added by hand on the remote DB, so
-- the migration history was not self-contained and 20260622000001 failed a clean
-- rebuild with "column e.created_at does not exist". Add them idempotently here:
-- a no-op on the existing remote DB, and the missing setup on a fresh rebuild
-- (required before 20260622000001 runs).
ALTER TABLE public.evolutions
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

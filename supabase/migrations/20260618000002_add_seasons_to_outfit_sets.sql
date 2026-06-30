-- supabase/migrations/20260618000002_add_seasons_to_outfit_sets.sql
-- The seasons column and FK on outfit_sets were originally added by hand on the
-- remote DB, so the migration history was not self-contained and failed a clean
-- rebuild. Add them idempotently here: a no-op on the existing remote DB, and
-- the missing setup on a fresh rebuild (required before 20260622000001 runs).
ALTER TABLE public.outfit_sets ADD COLUMN IF NOT EXISTS seasons text;

DO $$ BEGIN
  ALTER TABLE public.outfit_sets
    ADD CONSTRAINT outfit_sets_seasons_fkey
      FOREIGN KEY (seasons) REFERENCES public.seasons (slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS outfit_sets_seasons_idx ON public.outfit_sets (seasons);

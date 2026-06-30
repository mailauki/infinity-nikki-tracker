-- supabase/migrations/20260630000002_add_missing_timestamps.sql
-- Ensure every table has created_at and updated_at columns.
-- Uses ADD COLUMN IF NOT EXISTS throughout so this is a no-op on the remote DB
-- for any column that was already added by hand.

-- Tables missing updated_at only
ALTER TABLE public.styles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.eureka_categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.eureka_colors
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.labels
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.obtained_eureka
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.obtained_outfit
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.outfit_set_carousel_images
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.season_categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Tables missing both created_at and updated_at
ALTER TABLE public.eureka_set_trials
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.abilities
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.outfit_categories
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.admin_preferences
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

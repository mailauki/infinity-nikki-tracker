-- Each outfit set references one season category
ALTER TABLE public.outfit_sets ADD COLUMN IF NOT EXISTS season_category text;

ALTER TABLE public.outfit_sets
  DROP CONSTRAINT IF EXISTS outfit_sets_season_category_fkey;

ALTER TABLE public.outfit_sets
  ADD CONSTRAINT outfit_sets_season_category_fkey
  FOREIGN KEY (season_category) REFERENCES public.season_categories(slug)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS outfit_sets_season_category_idx
  ON public.outfit_sets (season_category);

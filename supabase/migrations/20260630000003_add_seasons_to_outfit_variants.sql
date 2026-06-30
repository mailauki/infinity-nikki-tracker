-- supabase/migrations/20260630000003_add_seasons_to_outfit_variants.sql
-- Add seasons and season_category to outfit_variants, matching the columns
-- already present on outfit_sets so standalone pieces can be season-tagged.
ALTER TABLE public.outfit_variants
  ADD COLUMN IF NOT EXISTS seasons text
    REFERENCES public.seasons (slug) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS season_category text
    REFERENCES public.season_categories (slug) ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS outfit_variants_seasons_idx
  ON public.outfit_variants (seasons);

CREATE INDEX IF NOT EXISTS outfit_variants_season_category_idx
  ON public.outfit_variants (season_category);

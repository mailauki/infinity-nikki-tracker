-- Remove the seasons<->categories join table; the M2M is unused.
-- season_categories (lookup) and outfit_sets.season_category remain.
DROP TABLE IF EXISTS public.season_category_map;

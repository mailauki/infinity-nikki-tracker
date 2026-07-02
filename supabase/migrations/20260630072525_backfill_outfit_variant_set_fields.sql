-- Backfill rarity, style, label, label_2, seasons, season_category on outfit_variants
-- from the parent outfit_set row. COALESCE preserves any values already set on the variant.
UPDATE public.outfit_variants v
SET
  rarity          = COALESCE(v.rarity,         s.rarity),
  style           = COALESCE(v.style,           s.style),
  label           = COALESCE(v.label,           s.label),
  label_2         = COALESCE(v.label_2,         s.label_2),
  seasons         = COALESCE(v.seasons,         s.seasons),
  season_category = COALESCE(v.season_category, s.season_category)
FROM public.outfit_sets s
WHERE s.slug = v.outfit_set;

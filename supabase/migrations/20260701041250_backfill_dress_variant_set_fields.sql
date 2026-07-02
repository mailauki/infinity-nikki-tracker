-- Recover set-inherited fields on dress variants that were re-inserted blank by
-- the set-form variant-sync. Pull from the parent outfit_set. Only fill NULLs so
-- any intentionally-overridden variant values are preserved.
UPDATE outfit_variants v
SET
  rarity          = COALESCE(v.rarity,          s.rarity),
  style           = COALESCE(v.style,           s.style),
  label           = COALESCE(v.label,           s.label),
  label_2         = COALESCE(v.label_2,         s.label_2),
  seasons         = COALESCE(v.seasons,         s.seasons),
  season_category = COALESCE(v.season_category, s.season_category)
FROM outfit_sets s
WHERE v.outfit_set = s.slug
  AND v.outfit_category = 'dresses'
  AND (v.rarity IS NULL OR v.style IS NULL OR v.label IS NULL
       OR v.label_2 IS NULL OR v.seasons IS NULL OR v.season_category IS NULL);

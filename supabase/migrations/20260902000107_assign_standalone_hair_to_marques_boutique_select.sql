-- The eight standalone hair pieces were authored without a season assignment,
-- leaving them the only rows in outfit_variants with outfit_set =
-- 'standalone_pieces' and a NULL season. Standalone pieces are matched to a
-- season by their own columns (the container set carries none), so these were
-- unreachable from every season page.
--
-- They belong to Exploration Season -> Marques Boutique Select, which is why
-- that category read 61 instead of 69.
update outfit_variants
   set seasons = 'exploration_season',
       season_category = 'marques_boutique_select'
 where outfit_set = 'standalone_pieces'
   and seasons is null;

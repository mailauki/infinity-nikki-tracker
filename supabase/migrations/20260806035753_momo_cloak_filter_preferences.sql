-- Filter persistence for the public /momo-cloaks page. Nullable with no default,
-- matching every existing filter column: null means "no filter applied".
alter table user_preferences
  add column if not exists momo_rarity_filter text,
  add column if not exists momo_season_filter text,
  add column if not exists momo_season_category_filter text,
  add column if not exists momo_obtained_filter text;

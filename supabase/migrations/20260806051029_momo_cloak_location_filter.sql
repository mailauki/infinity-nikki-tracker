-- Location filter persistence for the public /momo-cloaks page. Nullable with no
-- default, matching every existing filter column: null means "no filter applied".
alter table user_preferences
  add column if not exists momo_location_filter text;

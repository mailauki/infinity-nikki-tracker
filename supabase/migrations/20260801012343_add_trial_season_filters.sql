-- Persist the trial (eureka) and season / season-category (outfits) filters.
-- Like the other multi-select filters (style, label, category) these are stored
-- as a comma-joined text list, with NULL meaning "no filter applied".
alter table public.user_preferences
  add column if not exists eureka_trial text,
  add column if not exists outfit_season_filter text,
  add column if not exists outfit_season_category_filter text;

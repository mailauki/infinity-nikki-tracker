-- The season page keeps its own visibility and filter state rather than sharing
-- the outfit columns. outfit_hide_evolutions / outfit_hide_glowups default to
-- false (shown), while a season page defaults them hidden: an evolution is
-- another state of a set the season already lists, not another thing to collect.
-- Flipping the shared default to match would change /outfits too.
alter table user_preferences
  add column season_hide_evolutions boolean not null default true,
  add column season_hide_glowups    boolean not null default true,
  add column season_hide_pieces     boolean not null default false,
  add column season_hide_makeup     boolean not null default false,
  add column season_hide_base_sets  boolean not null default false,
  add column season_density         text,
  add column season_obtained_filter text,
  add column season_rarity_filter   text,
  add column season_style_filter    text;

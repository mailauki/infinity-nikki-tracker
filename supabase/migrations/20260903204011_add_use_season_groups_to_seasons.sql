-- Whether a season's index card lists its season GROUPS or its season
-- CATEGORIES.
--
-- The season detail page derives grouping from the data (it shows headings iff
-- some category in the season carries a season_group), which is right there:
-- headings are decoration around the same category sections either way, so a
-- season with one grouped category loses nothing by showing that heading.
--
-- The index card is different — a group row REPLACES the category rows it
-- collects, so grouping changes what the card lists rather than how it is
-- headed. Deriving it would force the choice on every season that happens to
-- have one grouped category, collapsing a card that reads better flat. Hence an
-- explicit per-season flag rather than a second derivation.
alter table public.seasons
  add column if not exists use_season_groups boolean not null default false;

comment on column public.seasons.use_season_groups is
  'Seasons index card lists season groups (true) or season categories (false). Detail-page group headings are derived from season_categories.season_group and are unaffected.';

-- The seasons whose category lists are long enough that groups read better.
update public.seasons
set use_season_groups = true
where slug in (
  'exploration_season',
  'terras_call',
  'the_forest_need_not_listen',
  'where_all_souls_return',
  'until_tide_ends',
  'where_stars_yearn',
  'golden_dust',
  'bloom_beneath_bright_skies'
);

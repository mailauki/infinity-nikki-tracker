-- Add season_groups to the admin dashboard stats view.
--
-- ADMIN_ENTITIES in lib/admin-entities.ts is keyed to this view: an entity key
-- with no branch here renders as a phantom all-zero row in the totals strip and
-- completeness list (the same trap STANDALONE_QUEUE_KEY documents). Adding
-- 'season-groups' to that map therefore requires this branch.
--
-- The full view is restated because it is a `create or replace` — Postgres has
-- no way to append a single union branch.

create or replace view admin_entity_stats as
  select 'outfit-sets' as entity, count(*) as total,
         count(*) filter (where title is null or btrim(title) = '') as no_title,
         count(*) filter (where image_url is null or btrim(image_url) = '') as no_image,
         count(*) filter (where description is null or btrim(description) = '') as no_description,
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = '')) as gaps
    from outfit_sets where base_set is null

  union all
  select 'evolutions', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from outfit_sets where base_set is not null

  union all
  select 'outfit-variants', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from outfit_variants

  union all
  select 'makeup-sets', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from makeup_sets where base_set is null

  union all
  select 'makeup-evolutions', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from makeup_sets where base_set is not null

  union all
  select 'makeup-variants', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from makeup_variants

  union all
  select 'momo-cloaks', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from momo_cloaks

  -- eureka_sets: no meaningful image. title only.
  union all
  select 'eureka-sets', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null,
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where title is null or btrim(title) = '')
    from eureka_sets

  -- eureka_variants: no title column, no description column. image only.
  union all
  select 'eureka-variants', count(*),
         null,
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         null,
         count(*) filter (where image_url is null or btrim(image_url) = '')
    from eureka_variants

  union all
  select 'trials', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from trials

  union all
  select 'seasons', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from seasons

  -- season_categories: lookup row, no image expected. title only.
  union all
  select 'season-categories', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null,
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where title is null or btrim(title) = '')
    from season_categories

  -- abilities: lookup row, no image expected, no description column.
  union all
  select 'abilities', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null, null,
         count(*) filter (where title is null or btrim(title) = '')
    from abilities

  -- season_groups: display-only heading for season categories. Lookup row with
  -- no image expected, matching season_categories above — title only.
  union all
  select 'season-groups', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null,
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where title is null or btrim(title) = '')
    from season_groups;

-- RLS of the underlying tables applies to the caller, not the view owner.
alter view admin_entity_stats set (security_invoker = on);

grant select on admin_entity_stats to authenticated;

-- Aggregate counts for the admin dashboard. Read-only, no row data exposed.
-- Untracked fields are NULL (not 0) so the UI can tell "none missing" from
-- "this column is not part of the content model" — abilities and
-- season_categories legitimately have no images.

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
    from abilities;

-- RLS of the underlying tables applies to the caller, not the view owner.
alter view admin_entity_stats set (security_invoker = on);

grant select on admin_entity_stats to authenticated;

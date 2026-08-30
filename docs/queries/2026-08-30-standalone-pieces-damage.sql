-- Damage assessment for the standalone-pieces overwrite bug.
-- Run in the Supabase SQL editor. All queries are READ-ONLY.

-- 1. How many standalone pieces exist, and how many are missing a title
--    or description? This is the headline number.
select
  'outfit' as domain,
  count(*)                                          as pieces,
  count(*) filter (where title is null)             as null_title,
  count(*) filter (where description is null)       as null_description,
  count(*) filter (where image_url is null)         as null_image
from outfit_variants
where outfit_set = 'standalone_pieces'
union all
select
  'makeup',
  count(*),
  count(*) filter (where title is null),
  count(*) filter (where description is null),
  count(*) filter (where image_url is null)
from makeup_variants
where makeup_set = 'standalone_pieces';


-- 2. The likely-clobbered rows: blank title, but modified after creation.
--    A piece created blank and never touched has updated_at = created_at
--    (or a null updated_at); one blanked by a set save was written later.
select
  slug,
  outfit_category as category,
  title,
  description,
  created_at,
  updated_at
from outfit_variants
where outfit_set = 'standalone_pieces'
  and title is null
  and updated_at is not null
  and updated_at > created_at + interval '1 second'
order by updated_at desc;

-- Same for makeup.
select
  slug,
  makeup_category as category,
  title,
  description,
  created_at,
  updated_at
from makeup_variants
where makeup_set = 'standalone_pieces'
  and title is null
  and updated_at is not null
  and updated_at > created_at + interval '1 second'
order by updated_at desc;


-- 3. Clustering check: the bug rewrites EVERY piece in one save, so real
--    damage shows up as many rows sharing one updated_at second. A tight
--    cluster is the fingerprint of a set-page save; scattered timestamps
--    are ordinary hand edits.
select
  date_trunc('second', updated_at) as saved_at,
  count(*)                        as rows_written
from outfit_variants
where outfit_set = 'standalone_pieces'
group by 1
having count(*) > 1
order by rows_written desc, saved_at desc
limit 20;


-- 4. Recoverable titles.
--    NOTE: alt_slug is NULL for standalone rows by design -- see
--    20260810120000_add_alt_slug_to_variants.sql, which stores it only for
--    SET-OWNED rows. The recovery source is the row's own `slug`: for a
--    standalone piece the slug already IS the title-derived form
--    ({toSlug(title)}-{category}), and this bug never rewrites slug -- only
--    title/description/image. So the original words survive in the slug.
--
--    This is a lossy guess, not a restore: toSlug() lowercases, folds accents,
--    turns '&' into 'and', and drops apostrophes. Review before applying.
select
  slug,
  outfit_category as category,
  initcap(replace(
    left(slug, length(slug) - length(outfit_category) - 1),
    '_', ' '
  )) as recovered_title_guess,
  updated_at
from outfit_variants
where outfit_set = 'standalone_pieces'
  and title is null
  and outfit_category is not null
  and slug like '%-' || outfit_category
order by slug;

-- Same for makeup.
select
  slug,
  makeup_category as category,
  initcap(replace(
    left(slug, length(slug) - length(makeup_category) - 1),
    '_', ' '
  )) as recovered_title_guess,
  updated_at
from makeup_variants
where makeup_set = 'standalone_pieces'
  and title is null
  and makeup_category is not null
  and slug like '%-' || makeup_category
order by slug;

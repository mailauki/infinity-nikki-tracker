-- Normalize makeup slugs to the project rule: hyphens separate items,
-- underscores live inside an item -> '{set_name}-{category_slug}',
-- e.g. 'behind_prayers-base_makeup'.
--
-- Four changes, in dependency order:
--
--   1. makeup_categories.slug   'base-makeup'  -> 'base_makeup'
--      A category is ONE item, so its slug takes underscores throughout.
--
--   2. makeup_sets.slug         'behind_prayers_makeup' -> 'behind_prayers'
--      The '_makeup' suffix is redundant inside makeup_* tables. Also
--      'standalone-pieces' -> 'standalone_pieces', matching outfit_sets'
--      long-standing 'standalone_pieces' spelling.
--
--   3. makeup_variants.slug     rebuilt as '{set}-{category}'.
--      This also repairs the five 'wishfulaurosamakeup-*' rows, whose
--      underscores were stripped by an older import -- they are fixed as a
--      side effect of the general rule, not as a special case.
--
--      Standalone pieces are the exception: they have makeup_set IS NULL and
--      are named after THEMSELVES, not a set ('honey_frosting-base_makeup').
--      Deriving them from '{set}-{category}' would collapse all five onto
--      'standalone_pieces-base_makeup'. So their leading name is preserved and
--      only the category suffix is normalized.
--
--   4. Image URLs are REWRITTEN TO KEEP POINTING AT THE EXISTING OBJECTS.
--      Storage paths embed the slug ('images/makeup_variants/{slug}/image_url.webp'),
--      but renaming a row does not move the object. Rather than copy ~339
--      binaries (risking a partial failure that 404s images), the objects stay
--      put and the URLs keep their current paths. The next re-upload through
--      the admin form self-heals the path, since components/forms/image-upload.tsx
--      derives it from the current slug.
--
-- Every FK onto these columns is ON UPDATE CASCADE (makeup_variants.makeup_set,
-- makeup_variants.makeup_category, makeup_sets.base_set, and all three
-- obtained_makeup columns), so the renames propagate automatically and no
-- per-user collection data is touched.

-- Snapshot the current image URLs so they survive the renames verbatim.
create temporary table _makeup_image_urls on commit drop as
  select 'variant' as kind, id, image_url, alt_image_url from public.makeup_variants
  union all
  select 'set', id, image_url, alt_image_url from public.makeup_sets;

-- 1. Categories. FK cascade updates makeup_variants.makeup_category and
--    obtained_makeup.makeup_category.
update public.makeup_categories
set slug = replace(slug, '-', '_')
where slug <> replace(slug, '-', '_');

-- 2. Sets. FK cascade updates makeup_variants.makeup_set, makeup_sets.base_set,
--    and obtained_makeup.makeup_set.
update public.makeup_sets
set slug = case
             when slug = 'standalone-pieces' then 'standalone_pieces'
             when slug like '%\_makeup' then left(slug, length(slug) - 7)
             else slug
           end
where slug = 'standalone-pieces' or slug like '%\_makeup';

-- 3. Variants. Read makeup_set / makeup_category AFTER the cascades above, so
--    both already hold their new values.
update public.makeup_variants v
set slug = case
             when v.makeup_set is null
               -- Standalone piece: keep its own name, normalize the suffix.
               then regexp_replace(v.slug, '-[a-z_-]+$', '') || '-' || v.makeup_category
             else v.makeup_set || '-' || v.makeup_category
           end
where v.makeup_category is not null;

-- 4. Restore the image URLs to their pre-rename values so they keep resolving
--    to the objects that actually exist in storage.
update public.makeup_variants v
set image_url = u.image_url, alt_image_url = u.alt_image_url
from _makeup_image_urls u
where u.kind = 'variant' and u.id = v.id
  and (v.image_url is distinct from u.image_url
       or v.alt_image_url is distinct from u.alt_image_url);

update public.makeup_sets s
set image_url = u.image_url, alt_image_url = u.alt_image_url
from _makeup_image_urls u
where u.kind = 'set' and u.id = s.id
  and (s.image_url is distinct from u.image_url
       or s.alt_image_url is distinct from u.alt_image_url);

-- Align legacy outfit_variant slugs / image paths / custom_looks with the
-- 'dress' -> 'dresses' category rename. Storage objects were moved separately
-- from outfit_variants/<set>-dress/ to <set>-dresses/ before this migration.

-- 1. Rename variant slugs: trailing -dress -> -dresses (category already = dresses)
UPDATE outfit_variants
SET slug = regexp_replace(slug, '-dress$', '-dresses')
WHERE outfit_category = 'dresses' AND slug ~ '-dress$';

-- 2. Rewrite image paths: outfit_variants/<set>-dress/ -> <set>-dresses/
UPDATE outfit_variants
SET image_url = regexp_replace(image_url, '(outfit_variants/[^/]*)-dress/', '\1-dresses/')
WHERE image_url ~ 'outfit_variants/[^/]*-dress/';

-- 3. Patch custom_looks arrays: any element ending in -dress -> -dresses
UPDATE custom_looks
SET outfit_variant_slugs = (
  SELECT array_agg(regexp_replace(s, '-dress$', '-dresses'))
  FROM unnest(outfit_variant_slugs) AS s
)
WHERE EXISTS (
  SELECT 1 FROM unnest(outfit_variant_slugs) s WHERE s ~ '-dress$'
);

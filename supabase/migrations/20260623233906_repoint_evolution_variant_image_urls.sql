-- 20260623000004_repoint_evolution_variant_image_urls.sql
-- After 20260623000003 regenerated evolution-variant slugs, those variants'
-- image files were still stored under the OLD slug folder
-- (outfit_variants/{old_slug}/...). The objects have been moved to the new
-- folder (outfit_variants/{new_slug}/...) via the Storage API (real S3 copy,
-- out-of-band — storage objects can't be relocated by SQL). This migration
-- repoints image_url / alt_image_url to the new folder so the DB matches.
--
-- The rewrite replaces the path segment '/outfit_variants/{old_folder}/' with
-- '/outfit_variants/{slug}/' for evolution variants whose current image folder
-- no longer matches their slug. The filename (UUID) is preserved.
-- Data only; no schema change.

begin;

update public.outfit_variants v
set image_url = replace(
  v.image_url,
  '/outfit_variants/' || split_part(split_part(v.image_url, '/outfit_variants/', 2), '/', 1) || '/',
  '/outfit_variants/' || v.slug || '/'
)
from public.outfit_sets s
where s.slug = v.outfit_set
  and s.base_set is not null
  and v.image_url like '%/outfit_variants/%'
  and split_part(split_part(v.image_url, '/outfit_variants/', 2), '/', 1) <> v.slug;

update public.outfit_variants v
set alt_image_url = replace(
  v.alt_image_url,
  '/outfit_variants/' || split_part(split_part(v.alt_image_url, '/outfit_variants/', 2), '/', 1) || '/',
  '/outfit_variants/' || v.slug || '/'
)
from public.outfit_sets s
where s.slug = v.outfit_set
  and s.base_set is not null
  and v.alt_image_url like '%/outfit_variants/%'
  and split_part(split_part(v.alt_image_url, '/outfit_variants/', 2), '/', 1) <> v.slug;

commit;

-- 20260623000005_repoint_apostrophe_variant_image_urls.sql
-- A handful of base-variant images for "Silvergale's Aria" were stored under a
-- storage folder that kept the apostrophe (outfit_variants/silvergale's_aria-*),
-- while the variant slug strips it (silvergales_aria-*). This predates the
-- evolution merge but is the same folder!=slug class of drift. The objects have
-- been moved to outfit_variants/{slug}/ via the Storage API (real S3 copy,
-- out-of-band). This repoints the referencing image_url values to match.
--
-- Rewrite only image_urls whose /outfit_variants/{folder}/ segment differs from
-- the variant slug; the apostrophe-stripped folder equals the slug. Filename
-- (UUID) preserved. Data only; no schema change.

begin;

update public.outfit_variants v
set image_url = replace(
  v.image_url,
  '/outfit_variants/' || split_part(split_part(v.image_url, '/outfit_variants/', 2), '/', 1) || '/',
  '/outfit_variants/' || v.slug || '/'
)
where v.image_url like '%/outfit_variants/%'
  and split_part(split_part(v.image_url, '/outfit_variants/', 2), '/', 1) <> v.slug;

update public.outfit_variants v
set alt_image_url = replace(
  v.alt_image_url,
  '/outfit_variants/' || split_part(split_part(v.alt_image_url, '/outfit_variants/', 2), '/', 1) || '/',
  '/outfit_variants/' || v.slug || '/'
)
where v.alt_image_url like '%/outfit_variants/%'
  and split_part(split_part(v.alt_image_url, '/outfit_variants/', 2), '/', 1) <> v.slug;

commit;

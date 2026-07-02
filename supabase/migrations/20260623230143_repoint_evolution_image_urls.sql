-- 20260623000002_repoint_evolution_image_urls.sql
-- Follow-up to 20260622000001_merge_evolutions_into_outfit_sets, which copied
-- evolution image URLs verbatim. The physical storage objects have been moved
-- to the merged layout via the Storage API (a real S3 copy, done out-of-band):
--   evolutions/...                 -> outfit_sets/...
--   evolution_carousel_images/...  -> outfit_set_carousel_images/...
-- This migration repoints the DB URLs to match the new object paths.
--
-- NOTE: storage objects cannot be moved by renaming storage.objects.name in
-- SQL — the bytes are stored in S3 under a key derived from the name, so a
-- metadata-only rename strands them. The physical move is therefore a separate
-- Storage API step; this migration only updates the derived public URLs.
-- Data only; no schema change.

begin;

update public.outfit_sets
set image_url = replace(image_url, '/evolutions/', '/outfit_sets/')
where image_url like '%/evolutions/%';

update public.outfit_sets
set alt_image_url = replace(alt_image_url, '/evolutions/', '/outfit_sets/')
where alt_image_url like '%/evolutions/%';

update public.outfit_set_carousel_images
set image_url = replace(
  image_url,
  '/evolution_carousel_images/',
  '/outfit_set_carousel_images/'
)
where image_url like '%/evolution_carousel_images/%';

commit;

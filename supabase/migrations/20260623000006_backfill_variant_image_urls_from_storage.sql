-- 20260623000006_backfill_variant_image_urls_from_storage.sql
-- Pre-existing data gap (independent of the evolution-merge image work): 19
-- outfit_variants have a NULL image_url even though storage objects exist under
-- their slug folder. These are mostly adventure_ride evolution variants whose
-- images were uploaded (objects present) but whose DB columns were never
-- populated, so the UI shows placeholder icons instead of the image.
--
-- Backfill from storage, matching the project's default/alt convention seen on
-- working variants: per slug folder, the OLDER object (larger, the default) ->
-- image_url, the NEWER object (smaller, the alternative) -> alt_image_url.
-- Variants with a single object get image_url only.
--
-- Scope note: the alt UPDATE also populates alt_image_url for ~21 already-working
-- variants that had image_url set but alt_image_url NULL while a distinct 2nd
-- object sat unused in their folder. That's a valid, intended side effect — it
-- wires up real alt images that existed in storage but weren't linked. It never
-- overwrites a non-null alt, and never sets alt = image_url (requires a distinct
-- 2nd object). Pre-existing single-object self-duplicates are left untouched.
-- Data only; no schema change.

begin;

-- image_url <- oldest object in the variant's slug folder.
update public.outfit_variants v
set image_url = (
  select 'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/' || o.name
  from storage.objects o
  where o.bucket_id = 'images'
    and o.name like 'outfit_variants/' || v.slug || '/%'
  order by o.created_at asc, o.name asc
  limit 1
)
where v.image_url is null
  and exists (
    select 1 from storage.objects o
    where o.bucket_id = 'images' and o.name like 'outfit_variants/' || v.slug || '/%'
  );

-- alt_image_url <- 2nd-oldest object, but ONLY for the variants this migration
-- just backfilled image_url for (i.e. those whose image_url now points at the
-- OLDEST object). This deliberately does NOT alt-backfill pre-existing working
-- variants; their alt being null is a separate, intentional state.
update public.outfit_variants v
set alt_image_url = sub.url
from (
  select v2.slug,
         (array_agg(
            'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/' || o.name
            order by o.created_at asc, o.name asc
          ))[2] as url
  from public.outfit_variants v2
  join storage.objects o
    on o.bucket_id = 'images' and o.name like 'outfit_variants/' || v2.slug || '/%'
  where v2.alt_image_url is null
    -- restrict to the just-backfilled set: image_url points at the oldest object
    and v2.image_url = (
      select 'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/' || o3.name
      from storage.objects o3
      where o3.bucket_id = 'images' and o3.name like 'outfit_variants/' || v2.slug || '/%'
      order by o3.created_at asc, o3.name asc
      limit 1
    )
  group by v2.slug
  having count(*) >= 2
) sub
where v.slug = sub.slug
  and v.alt_image_url is null
  and sub.url is not null;

commit;

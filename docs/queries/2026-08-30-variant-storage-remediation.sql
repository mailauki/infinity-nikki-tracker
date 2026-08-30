-- Variant image storage remediation, makeup + outfits (applied 2026-08-30).
-- Relinked stranded artwork, deleted superseded files, and created the missing
-- variant rows that owned three unreferenced outfit folders.
-- Recorded for provenance; the writes below have ALREADY BEEN APPLIED.
--
-- PROBLEM
-- Renaming a makeup set's slug does not move its image storage paths (see
-- 20260810043259 and the `slug-renames-break-storage-paths` note): URLs embed
-- the slug, so a rename strands the images. Three folder naming generations
-- exist under images/makeup_variants/:
--
--   squashed          fairytaleswanmakeup-base_makeup     (oldest)
--   _makeup-suffixed  blooming_dreams_makeup-base_makeup  (current for most)
--   bare              <set>-<category>
--
-- A folder's NAME therefore says nothing about whether it is live. The only
-- sound test is whether any row's image_url/alt_image_url references it.
-- Naming heuristics wrongly flagged wishful_aurosa's 5 squashed folders as
-- dead; those rows genuinely point at them and deleting would have broken 5
-- working variants.
--
-- APPLIED 1/2 -- relink 14 variants whose rows had NULL images while their
-- artwork sat in a squashed folder. 10 got both images (fairytale_swan,
-- crystal_poems); 4 got alt only (flutter_storm, silvergales_aria,
-- whispers_of_waves, wings_of_wishes -- no image_url.webp was ever uploaded).
--
-- APPLIED 2/2 -- deleted 30 objects in 15 folders across bloomingdreamsmakeup,
-- blossomingstarsmakeup, dancetilldawnmakeup, all superseded by working
-- _makeup folders. Deletion went through the Storage API (DELETE
-- /storage/v1/object/images), NOT a delete on storage.objects -- deleting
-- those rows directly orphans the underlying S3 blobs.
-- Backup: ~/Desktop/makeup-orphan-backup-20260830 (30 files, 1.0 MB).
--
-- END STATE (makeup): 203 folders, 0 unreferenced, 0 broken references.
-- END STATE (outfits): 4108 folders, 0 unreferenced, 0 broken references.
--
-- Both buckets are fully consistent: every stored folder is referenced by a
-- row, and every referenced folder exists. Re-run the two queries below to
-- confirm this still holds.


-- VERIFY (read-only) -- re-run any time to confirm storage/DB consistency.
-- Both counts must be 0.
with folders as (
  select distinct split_part(name, '/', 2) as folder
  from storage.objects
  where bucket_id = 'images' and name like 'makeup_variants/%/%'
),
referenced as (
  select distinct split_part(split_part(u, '/makeup_variants/', 2), '/', 1) as folder
  from (
    select image_url as u from makeup_variants where image_url is not null
    union all
    select alt_image_url from makeup_variants where alt_image_url is not null
  ) s
  where u like '%/makeup_variants/%'
)
select
  (select count(*) from folders f
     left join referenced r on r.folder = f.folder
    where r.folder is null)                    as unreferenced_folders,  -- orphaned files
  (select count(*) from referenced r
     left join folders f on f.folder = r.folder
    where f.folder is null)                    as broken_references;     -- rows -> missing files


-- The same check for outfits, which has the identical rename hazard.
--
-- OUTFITS (2026-08-30): 4108 folders, 0 broken references. Three folders were
-- unreferenced -- dawning_heartlight-hair_accessories, hymn_to_dusk-outerwear,
-- and gold_seeking_night-chokers -- each holding only alt_image_url.webp,
-- all uploaded within an hour on 2026-07-23.
--
-- These were NOT orphans to delete. Inspecting the images showed three real,
-- distinct pieces (a gold feathered hair ornament, an orange/gold cape, a
-- beaded choker) whose variant rows had never been created: an authoring
-- session that uploaded artwork but never saved the rows. Variants 6768-6770
-- were created to own them, inheriting each set's rarity/style/label/seasons
-- and leaving `default` and `alt_slug` to their triggers.
--
-- They are intentionally left title-less and without a main image (no
-- image_url.webp was ever uploaded); the admin gap queue gates on both
-- `title.is.null` and `image_url.is.null`, so all three surface there until
-- an admin fills them in. Titles are in-game names and cannot be derived --
-- and since alt_slug is generated FROM the title and is the duplicate-detection
-- key, guessing one would install a wrong lookup key.
--
-- Lesson matching the makeup case: an unreferenced folder is not automatically
-- junk. Check whether it holds real content whose row is missing before
-- deleting anything.
with folders as (
  select distinct split_part(name, '/', 2) as folder
  from storage.objects
  where bucket_id = 'images' and name like 'outfit_variants/%/%'
),
referenced as (
  select distinct split_part(split_part(u, '/outfit_variants/', 2), '/', 1) as folder
  from (
    select image_url as u from outfit_variants where image_url is not null
    union all
    select alt_image_url from outfit_variants where alt_image_url is not null
  ) s
  where u like '%/outfit_variants/%'
)
select
  (select count(*) from folders f
     left join referenced r on r.folder = f.folder
    where r.folder is null)                    as unreferenced_folders,
  (select count(*) from referenced r
     left join folders f on f.folder = r.folder
    where f.folder is null)                    as broken_references;

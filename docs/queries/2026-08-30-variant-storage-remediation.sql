-- Variant image storage remediation, makeup + outfits (applied 2026-08-30).
-- Relinked stranded artwork, deleted superseded files, and cleaned up image
-- residue left behind by corrected miscategorizations.
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
-- END STATE (outfits): 4105 folders, 0 unreferenced, 0 broken references.
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
-- OUTFITS (2026-08-30): 4105 folders, 0 unreferenced, 0 broken references.
--
-- Three folders were briefly unreferenced -- dawning_heartlight-hair_accessories,
-- hymn_to_dusk-outerwear, and gold_seeking_night-chokers -- each holding only
-- alt_image_url.webp. They were LEFTOVER IMAGES FROM A MISCATEGORIZATION: each
-- piece had been filed under the wrong category, and removing the wrong-category
-- variant row left its uploaded image behind.
--
-- Confirmed by md5: each orphan was byte-identical to an image already attached
-- to the correctly-categorized variant --
--
--   dawning_heartlight-hair_accessories == dawning_heartlight-headwear     (Weightless Dream)
--   hymn_to_dusk-outerwear              == hymn_to_dusk-back_pieces        (Torrent of Fate)
--   gold_seeking_night-chokers          == gold_seeking_night-neckwear     (Stored Brilliance)
--
-- All three correct variants are complete (titled, both images, alt_slug set),
-- so the orphans were pure duplicates and were deleted via the Storage API.
-- Backup: ~/Desktop/outfit-miscategorized-backup-20260830 (3 files, 32 KB).
--
-- LESSON (the expensive one). An unreferenced folder has at least three
-- possible causes, and the fix differs for each:
--
--   1. superseded by a rename  -> delete (the makeup _makeup-suffixed folders)
--   2. artwork whose row is    -> relink or create the row
--      missing/unlinked           (fairytale_swan, crystal_poems)
--   3. residue of a corrected  -> delete (these three)
--      miscategorization
--
-- Neither the folder NAME nor "does a row exist for this slug" distinguishes
-- them. Case 2 and case 3 look identical from the DB alone -- both are a
-- category that legitimately exists, on a set that legitimately exists, with
-- no row. What separates them is whether the IMAGE ITSELF already lives on
-- another variant: md5 the orphan against the set's other images first. A
-- byte-identical match means case 3 and the file is redundant; no match means
-- case 2 and the content is real.
--
-- Getting this wrong is not symmetric. Deleting a case-2 file destroys the
-- only copy; creating rows for a case-3 file (as was done here, then reverted
-- -- variants 6768-6770) just adds empty duplicates that shadow the correct,
-- fully-authored variant in the UI and the gap queue.
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

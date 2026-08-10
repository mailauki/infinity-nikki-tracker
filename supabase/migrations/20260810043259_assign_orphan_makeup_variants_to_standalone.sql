-- Point the 16 setless makeup variants at the standalone_pieces bucket.
--
-- obtained_makeup already records 'standalone_pieces' as the set for every one
-- of these variants, while makeup_variants.makeup_set was still NULL — the two
-- tables disagreed. This aligns them.
--
-- Mirrors outfits, where all 164 standalone pieces reference the
-- 'standalone_pieces' row rather than sitting at NULL.
--
-- Slugs are NOT touched. They are title-derived (e.g. 'honey_frosting-base_makeup')
-- and image storage paths embed the slug, so renaming would 404 every image.
--
-- trg_enforce_base_makeup_variant_default fires on UPDATE OF makeup_set and sets
-- "default" := (owning set's order = 1). standalone_pieces has order 1, so these
-- 16 become default=true — matching outfit standalone pieces, which are all
-- default=true already.

update public.makeup_variants
set makeup_set = 'standalone_pieces'
where makeup_set is null;

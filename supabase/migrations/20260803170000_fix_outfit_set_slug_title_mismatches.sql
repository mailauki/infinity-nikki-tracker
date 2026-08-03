-- Correct three outfit_sets slugs that disagree with their titles.
--
--   dream_glimpses                 -> dream_in_glimpses               ("Dream in Glimpses", lost a word)
--   floral_rebirth-growthanddecay  -> floral_rebirth-growth_and_decay ("Growth & Decay", lost separators)
--   standalone-pieces              -> standalone_pieces               (hyphen, not the toSlug() underscore)
--
-- What cascades, and the one thing that does not:
--
-- Every FK onto outfit_sets.slug and outfit_variants.slug is ON UPDATE CASCADE,
-- so renaming a set row automatically carries outfit_variants.outfit_set,
-- obtained_outfit.outfit_set, obtained_outfit.outfit_variant,
-- outfit_sets.base_set, outfit_set_carousel_images and makeup_sets.outfit_set.
-- Those need no explicit handling — and must NOT be updated by hand, or the
-- statement fights the cascade and fails the FK check.
--
-- outfit_variants.slug is the exception: it is a DERIVED string
-- ("{state_slug}-{category}"), not a foreign key, so renaming a set leaves its
-- variant slugs still spelling the old set name. Step 2 rewrites them, and
-- obtained_outfit.outfit_variant then follows via its own cascade.
--
-- dream_glimpses also has two evolution rows (dream_glimpses-sweetness,
-- dream_glimpses-vesper). Their slugs cascade from base_set, but their variants'
-- derived slugs embed the old base name too, so step 2 matches the whole family
-- by prefix rather than just the base set's own variants.
--
-- standalone-pieces holds individually-authored variants whose slugs do NOT
-- carry a "standalone-pieces-" prefix (verified: 0 of 137 rows), so only its set
-- slug changes and step 2 does not touch it.

-- 1. Rename the set rows. FKs cascade to every child listed above.
--    The evolution rows' own slugs are ALSO derived ("{base}-{subtitle}"), so
--    renaming the base fixes their base_set column but leaves their slug
--    spelling the old base name — rename them explicitly too.
update public.outfit_sets set slug = 'dream_in_glimpses' where slug = 'dream_glimpses';
update public.outfit_sets
set slug = 'dream_in_glimpses' || right(slug, -length('dream_glimpses'))
where slug like 'dream_glimpses-%';
update public.outfit_sets set slug = 'floral_rebirth-growth_and_decay' where slug = 'floral_rebirth-growthanddecay';
update public.outfit_sets set slug = 'standalone_pieces' where slug = 'standalone-pieces';

-- 2. Rewrite the derived variant slugs (base set + its evolutions).
--    obtained_outfit.outfit_variant follows automatically via ON UPDATE CASCADE.
update public.outfit_variants
set slug = 'dream_in_glimpses' || right(slug, -length('dream_glimpses'))
where slug like 'dream_glimpses-%';

update public.outfit_variants
set slug = 'floral_rebirth-growth_and_decay' || right(slug, -length('floral_rebirth-growthanddecay'))
where slug like 'floral_rebirth-growthanddecay-%';

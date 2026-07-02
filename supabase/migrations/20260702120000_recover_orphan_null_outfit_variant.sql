-- The add-variant form historically posted outfit_set = NULL for "standalone"
-- pieces, but the Standalone Pieces set uses outfit_set = 'standalone-pieces'.
-- A NULL-set variant is grouped under '' and never rendered on the outfits page.
-- Re-point any remaining orphan to the real set so it renders and is tracked.
UPDATE outfit_variants
SET outfit_set = 'standalone-pieces'
WHERE outfit_set IS NULL;

-- Allow outfit_variants to exist without an outfit_set (standalone variant pieces)
ALTER TABLE outfit_variants ALTER COLUMN outfit_set DROP NOT NULL;

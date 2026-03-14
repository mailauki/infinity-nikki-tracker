-- Migrate all foreign keys from title columns to slug columns.
-- Affected lookup tables: labels, styles, categories, colors, trials (already has slug), eureka_sets (already has slug)
-- Affected data tables: eureka_sets (label, style, trial cols), eureka_variants (eureka_set, category, color cols), obtained_eureka (eureka_set, category, color cols)

-- ─── Step 1: Add slug columns to lookup tables that don't have one ──────────

ALTER TABLE labels    ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE styles    ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE colors    ADD COLUMN IF NOT EXISTS slug text;

-- ─── Step 2: Populate slugs from titles ──────────────────────────────────────

UPDATE labels     SET slug = lower(replace(title, ' ', '_'));
UPDATE styles     SET slug = lower(replace(title, ' ', '_'));
UPDATE categories SET slug = lower(replace(title, ' ', '_'));
UPDATE colors     SET slug = lower(replace(title, ' ', '_'));

-- ─── Step 3: Make slug columns NOT NULL and add UNIQUE constraints ────────────

ALTER TABLE labels     ALTER COLUMN slug SET NOT NULL;
ALTER TABLE styles     ALTER COLUMN slug SET NOT NULL;
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE colors     ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'labels_slug_key') THEN
    ALTER TABLE labels ADD CONSTRAINT labels_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'styles_slug_key') THEN
    ALTER TABLE styles ADD CONSTRAINT styles_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key') THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'colors_slug_key') THEN
    ALTER TABLE colors ADD CONSTRAINT colors_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eureka_sets_slug_key') THEN
    ALTER TABLE eureka_sets ADD CONSTRAINT eureka_sets_slug_key UNIQUE (slug);
  END IF;
END $$;

-- ─── Step 4: Drop all existing FK constraints (old title-based and any partially-applied slug-based) ─

-- eureka_sets FKs
ALTER TABLE eureka_sets DROP CONSTRAINT IF EXISTS eureka_sets_label_fkey;
ALTER TABLE eureka_sets DROP CONSTRAINT IF EXISTS eureka_sets_style_fkey;
ALTER TABLE eureka_sets DROP CONSTRAINT IF EXISTS "Eureka_trial_fkey";
ALTER TABLE eureka_sets DROP CONSTRAINT IF EXISTS eureka_sets_trial_fkey;

-- eureka_variants FKs
ALTER TABLE eureka_variants DROP CONSTRAINT IF EXISTS eureka_category_fkey;
ALTER TABLE eureka_variants DROP CONSTRAINT IF EXISTS eureka_color_fkey;
ALTER TABLE eureka_variants DROP CONSTRAINT IF EXISTS eureka_eureka_set_fkey;
ALTER TABLE eureka_variants DROP CONSTRAINT IF EXISTS eureka_variants_category_fkey;
ALTER TABLE eureka_variants DROP CONSTRAINT IF EXISTS eureka_variants_color_fkey;
ALTER TABLE eureka_variants DROP CONSTRAINT IF EXISTS eureka_variants_eureka_set_fkey;

-- obtained_eureka FKs
ALTER TABLE obtained_eureka DROP CONSTRAINT IF EXISTS obtained_eureka_category_fkey;
ALTER TABLE obtained_eureka DROP CONSTRAINT IF EXISTS obtained_eureka_color_fkey;
ALTER TABLE obtained_eureka DROP CONSTRAINT IF EXISTS obtained_eureka_eureka_set_fkey;

-- ─── Step 5: Drop the unique composite index on obtained_eureka (references old values) ─

DROP INDEX IF EXISTS obtained_eureka_unique_item_idx;

-- ─── Step 6: Migrate FK column values from titles to slugs ───────────────────

-- eureka_sets.label: title → label slug
UPDATE eureka_sets es
SET label = l.slug
FROM labels l
WHERE es.label = l.title;

-- eureka_sets.style: title → style slug
UPDATE eureka_sets es
SET style = s.slug
FROM styles s
WHERE es.style = s.title;

-- eureka_sets.trial: title → trial slug
UPDATE eureka_sets es
SET trial = t.slug
FROM trials t
WHERE es.trial = t.title;

-- eureka_variants.eureka_set: eureka_sets title → eureka_sets slug
UPDATE eureka_variants ev
SET eureka_set = es.slug
FROM eureka_sets es
WHERE ev.eureka_set = es.title;

-- eureka_variants.category: category title → category slug
UPDATE eureka_variants ev
SET category = c.slug
FROM categories c
WHERE ev.category = c.title;

-- eureka_variants.color: color title → color slug
UPDATE eureka_variants ev
SET color = co.slug
FROM colors co
WHERE ev.color = co.title;

-- obtained_eureka.eureka_set: eureka_sets title → eureka_sets slug
UPDATE obtained_eureka o
SET eureka_set = es.slug
FROM eureka_sets es
WHERE o.eureka_set = es.title;

-- obtained_eureka.category: category title → category slug
UPDATE obtained_eureka o
SET category = c.slug
FROM categories c
WHERE o.category = c.title;

-- obtained_eureka.color: color title → color slug
UPDATE obtained_eureka o
SET color = co.slug
FROM colors co
WHERE o.color = co.title;

-- ─── Step 7: Add new slug-based FK constraints ───────────────────────────────

ALTER TABLE eureka_sets
  ADD CONSTRAINT eureka_sets_label_fkey
  FOREIGN KEY (label) REFERENCES labels(slug)
  ON UPDATE CASCADE;

ALTER TABLE eureka_sets
  ADD CONSTRAINT eureka_sets_style_fkey
  FOREIGN KEY (style) REFERENCES styles(slug)
  ON UPDATE CASCADE;

ALTER TABLE eureka_sets
  ADD CONSTRAINT eureka_sets_trial_fkey
  FOREIGN KEY (trial) REFERENCES trials(slug)
  ON UPDATE CASCADE;

ALTER TABLE eureka_variants
  ADD CONSTRAINT eureka_variants_eureka_set_fkey
  FOREIGN KEY (eureka_set) REFERENCES eureka_sets(slug)
  ON UPDATE CASCADE;

ALTER TABLE eureka_variants
  ADD CONSTRAINT eureka_variants_category_fkey
  FOREIGN KEY (category) REFERENCES categories(slug)
  ON UPDATE CASCADE;

ALTER TABLE eureka_variants
  ADD CONSTRAINT eureka_variants_color_fkey
  FOREIGN KEY (color) REFERENCES colors(slug)
  ON UPDATE CASCADE;

ALTER TABLE obtained_eureka
  ADD CONSTRAINT obtained_eureka_eureka_set_fkey
  FOREIGN KEY (eureka_set) REFERENCES eureka_sets(slug)
  ON UPDATE CASCADE;

ALTER TABLE obtained_eureka
  ADD CONSTRAINT obtained_eureka_category_fkey
  FOREIGN KEY (category) REFERENCES categories(slug)
  ON UPDATE CASCADE;

ALTER TABLE obtained_eureka
  ADD CONSTRAINT obtained_eureka_color_fkey
  FOREIGN KEY (color) REFERENCES colors(slug)
  ON UPDATE CASCADE;

-- ─── Step 8: Recreate the unique composite index on obtained_eureka ─────────────────

CREATE UNIQUE INDEX obtained_eureka_unique_item_idx
  ON obtained_eureka (user_id, eureka_set, category, color);

-- ─── Step 9: Recreate toggle_obtained_eureka — params are now slugs ─────────────────
-- No SQL change needed: the function body is identical; callers will now pass
-- slug values instead of title values (handled in the app layer).

-- ─── Step 10: Add indexes on new slug columns in lookup tables ───────────────

CREATE INDEX IF NOT EXISTS labels_slug_idx     ON labels (slug);
CREATE INDEX IF NOT EXISTS styles_slug_idx     ON styles (slug);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS colors_slug_idx     ON colors (slug);

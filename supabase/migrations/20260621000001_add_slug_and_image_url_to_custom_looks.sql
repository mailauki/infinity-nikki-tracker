-- Add image_url and slug to custom_looks.
-- Slug is derived from the look title and is unique per user (so a user can't
-- have two looks with the same slug, but different users may reuse one).

ALTER TABLE custom_looks
  ADD COLUMN image_url text,
  ADD COLUMN slug text;

-- Backfill slugs from existing names, mirroring lib/utils.ts toSlug():
-- lowercase, drop punctuation, spaces -> underscores, collapse repeats. (App-side
-- toSlug also strips accents; the unaccent extension isn't enabled here, so the
-- backfill drops any non-ASCII letters instead — fine for existing rows.)
-- Per-user duplicate slugs get a -2, -3, … suffix so the unique index holds.
WITH base AS (
  SELECT
    id,
    user_id,
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(name),
          '[^a-z0-9 -]', '', 'g'
        ),
        '\s+', '_', 'g'
      ),
      '_+', '_', 'g'
    ) AS raw_slug
  FROM custom_looks
),
numbered AS (
  SELECT
    id,
    NULLIF(raw_slug, '') AS raw_slug,
    row_number() OVER (
      PARTITION BY user_id, NULLIF(raw_slug, '')
      ORDER BY id
    ) AS rn
  FROM base
)
UPDATE custom_looks AS cl
SET slug = CASE
    WHEN n.raw_slug IS NULL THEN 'look_' || left(cl.id::text, 8)
    WHEN n.rn = 1 THEN n.raw_slug
    ELSE n.raw_slug || '-' || n.rn
  END
FROM numbered AS n
WHERE cl.id = n.id;

CREATE UNIQUE INDEX custom_looks_user_id_slug_idx
  ON custom_looks (user_id, slug);

-- Comfort text scaling: multiplies the M3 type scale app-wide so the whole app
-- (card grids, filters, admin tables, prose) can be read at a larger size.
--
-- Stored as text rather than a numeric factor so the stored value stays a
-- named step. The multipliers live in lib/text-scale.ts; keeping them in code
-- means retuning the ladder doesn't need a data migration.
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS text_scale text NOT NULL DEFAULT 'default';

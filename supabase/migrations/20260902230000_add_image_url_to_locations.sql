-- Add image_url to the locations lookup table so the admin section can attach
-- artwork, matching the shape of the other lookup tables (seasons,
-- season_categories, season_groups).
--
-- Nullable with no default: the two existing rows (wishfield, itzaland) have no
-- artwork yet, and there is no sensible placeholder to assume.
--
-- No storage or RLS work is needed. Objects live in the shared `images` bucket
-- under `locations/{slug}/image_url.webp`, which the existing bucket policies
-- already cover, and public.locations already has RLS with a public-read policy
-- plus a `locations_admin_write` policy gated on is_admin() — the same policy
-- that lets the browser-side ImageUpload write the URL back.

alter table public.locations
  add column if not exists image_url text;

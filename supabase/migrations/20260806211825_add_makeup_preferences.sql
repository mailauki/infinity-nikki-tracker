-- 20260806211825_add_makeup_preferences.sql
-- Display preferences for the public makeup pages. Filter axes are
-- deliberately NOT persisted (see 2026-08-06-makeup-public-pages-design.md);
-- only these three cross-cutting display settings survive a reload.

begin;

alter table public.user_preferences
  add column if not exists makeup_sort_axis  text default 'date',
  add column if not exists makeup_density    text default 'standard',
  add column if not exists makeup_image_mode text default 'image';

commit;

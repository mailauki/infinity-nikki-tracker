-- Lookup / reference data for a fresh local database.
--
-- supabase/config.toml has always pointed db.seed.sql_paths at this file, but
-- the file did not exist. No migration inserts these rows either — they were
-- entered through the admin UI and live only in the production project — so a
-- `supabase db reset` produced empty lookup tables, and the one-off data
-- recovery migrations that reference them (e.g. 20260702051043, which
-- re-inserts eight hair pieces with outfit_category 'hair') failed on a foreign
-- key to a row that was never there.
--
-- Seeds run AFTER migrations complete, so this file cannot itself satisfy those
-- migrations; the recovery migrations are guarded to skip when their
-- prerequisite rows are missing. This file is what makes a freshly reset
-- database actually usable for development.
--
-- makeup_categories is NOT seeded here: 20260802120000_add_makeup_tables.sql
-- already inserts its rows (and 20260807130000 normalises their slugs), so a
-- second copy here would be redundant and could drift from it.
--
-- Scope is deliberately limited to the small, stable lookup tables. Content
-- (outfit_sets, variants, seasons, makeup) is NOT seeded: it is thousands of
-- rows that change constantly, and pinning a snapshot here would rot
-- immediately. Pull content from the remote project when you need it.
--
-- Every insert is idempotent (on conflict do nothing), so re-running is safe.

-- `type` is NOT NULL in 20260601000004_add_outfit_tables.sql but was dropped
-- from the production project by hand and never captured in a migration, so it
-- exists on a freshly migrated database and nowhere else. Nothing in the app
-- reads it (lib/types/supabase.ts, generated from production, has no such
-- column) and no live data defines its vocabulary, so it is set to `part` here
-- purely to satisfy the constraint rather than inventing a meaning for it.
insert into public.outfit_categories (slug, title, part, type) values
  ('hair', 'Hair', 'Pieces', 'Pieces'),
  ('dresses', 'Dresses', 'Pieces', 'Pieces'),
  ('outerwear', 'Outerwear', 'Pieces', 'Pieces'),
  ('tops', 'Tops', 'Pieces', 'Pieces'),
  ('bottoms', 'Bottoms', 'Pieces', 'Pieces'),
  ('socks', 'Socks', 'Pieces', 'Pieces'),
  ('shoes', 'Shoes', 'Pieces', 'Pieces'),
  ('hair_accessories', 'Hair Accessories', 'Accessories', 'Accessories'),
  ('headwear', 'Headwear', 'Accessories', 'Accessories'),
  ('earrings', 'Earrings', 'Accessories', 'Accessories'),
  ('neckwear', 'Neckwear', 'Accessories', 'Accessories'),
  ('bracelets', 'Bracelets', 'Accessories', 'Accessories'),
  ('chokers', 'Chokers', 'Accessories', 'Accessories'),
  ('gloves', 'Gloves', 'Accessories', 'Accessories'),
  ('face_decorations', 'Face Decorations', 'Accessories', 'Accessories'),
  ('chest_accessories', 'Chest Accessories', 'Accessories', 'Accessories'),
  ('pendants', 'Pendants', 'Accessories', 'Accessories'),
  ('back_pieces', 'Backpieces', 'Accessories', 'Accessories'),
  ('rings', 'Rings', 'Accessories', 'Accessories'),
  ('arm_decorations', 'Arm Decorations', 'Accessories', 'Accessories'),
  ('handhelds', 'Handhelds', 'Accessories', 'Accessories'),
  ('body_paint', 'Body Paint', 'Accessories', 'Accessories')
on conflict (slug) do nothing;

insert into public.styles (slug, title) values
  ('cool', 'Cool'),
  ('elegant', 'Elegant'),
  ('fresh', 'Fresh'),
  ('sexy', 'Sexy'),
  ('sweet', 'Sweet')
on conflict (slug) do nothing;

insert into public.locations (slug, title) values
  ('itzaland', 'Itzaland'),
  ('wishfield', 'Wishfield')
on conflict (slug) do nothing;

insert into public.labels (slug, title) values
  ('warm', 'Warm'),
  ('summer', 'Summer'),
  ('home', 'Home'),
  ('formal', 'Formal'),
  ('simple', 'Simple'),
  ('fantasy', 'Fantasy'),
  ('intellectual', 'Intellectual'),
  ('adventure', 'Adventure'),
  ('romance', 'Romance'),
  ('retro', 'Retro'),
  ('fashion', 'Fashion'),
  ('uniform', 'Uniform'),
  ('fairy', 'Fairy'),
  ('ballroom', 'Ballroom'),
  ('royal', 'Royal'),
  ('linlang', 'Linlang'),
  ('pastoral', 'Pastoral'),
  ('playful', 'Playful'),
  ('trendy', 'Trendy'),
  ('cute', 'Cute'),
  ('light', 'Light'),
  ('more_light', 'More Light'),
  ('divine', 'Divine'),
  ('forest', 'Forest'),
  ('spirited', 'Spirited'),
  ('classical', 'Classical'),
  ('terra', 'Terra'),
  ('aesthetic', 'Aesthetic'),
  ('whimsy', 'Whimsy'),
  ('glow', 'Glow')
on conflict (slug) do nothing;

insert into public.abilities (slug, title) values
  ('shrinking', 'Shrinking'),
  ('gliding', 'Gliding'),
  ('fishing', 'Fishing'),
  ('bug_catching', 'Bug Catching'),
  ('electrician', 'Electrician'),
  ('purification', 'Purification'),
  ('floating', 'Floating'),
  ('animal_grooming', 'Animal Grooming'),
  ('violinist', 'Violinist'),
  ('whimsicality', 'Whimsicality'),
  ('rainbow_summoning', 'Rainbow Summoning'),
  ('fireworks', 'Fireworks'),
  ('dizi', 'Dizi'),
  ('pipa', 'Pipa'),
  ('transformation', 'Transformation'),
  ('water_walking', 'Water Walking'),
  ('winged_hover', 'Winged Hover'),
  ('world_rhythms', 'World Rhythms'),
  ('awaken_springbloom', 'Awaken Springbloom'),
  ('celestial_promise', 'Celestial Promise'),
  ('roaming_loong', 'Roaming Loong'),
  ('danqing', 'Danqing'),
  ('dance_of_verses', 'Dance of Verses'),
  ('lyre', 'Lyre'),
  ('electric_guitar', 'Electric Guitar'),
  ('construction', 'Construction'),
  ('planting', 'Planting'),
  ('star_collecting', 'Star Collecting'),
  ('animal_inviting', 'Animal Inviting'),
  ('fish_keeping', 'Fish Keeping'),
  ('candlelit_echoes', 'Candlelit Echoes'),
  ('cooking', 'Cooking'),
  ('archery', 'Archery'),
  ('gigantification', 'Gigantification'),
  ('sticky_claw', 'Sticky Claw'),
  ('windfeather_drum', 'Windfeather Drum'),
  ('battle_companion', 'Battle Companion'),
  ('flourish_walk', 'Flourish Walk'),
  ('shapeshifting', 'Shapeshifting'),
  ('celestial_deer', 'Celestial Deer'),
  ('shadow-shatter', 'Shadow-Shatter'),
  ('mount', 'Mount'),
  ('dragonbone_master', 'Dragonbone Master'),
  ('tranquil_resonance', 'Tranquil Resonance'),
  ('celestial_tide', 'Celestial Tide'),
  ('machine_control', 'Machine Control'),
  ('spinning_reflections', 'Spinning Reflections')
on conflict (slug) do nothing;

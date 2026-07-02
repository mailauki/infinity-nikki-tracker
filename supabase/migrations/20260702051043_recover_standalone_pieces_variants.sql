-- Recover the 8 standalone hair pieces deleted by the set-edit variant-sync bug
-- (it assumed one generated {set}-{category} variant and deleted the real,
-- individually-authored pieces, inserting a bogus standalone-pieces-hair).
-- Image files survive in storage at outfit_variants/<slug>/image_url.png.
-- Note: per-user obtained records for these were cascade-deleted and are
-- unrecoverable. The variant-sync itself is guarded against standalone-pieces in
-- app/admin/outfits/sets/actions.ts so this cannot recur.

-- 1. Remove the bogus generated variant (title null, no obtained records).
delete from public.outfit_variants
where slug = 'standalone-pieces-hair' and outfit_set = 'standalone-pieces';

-- 2. Re-insert the 8 originals (category hair, default false, images from storage).
insert into public.outfit_variants (slug, outfit_set, outfit_category, title, rarity, style, "default", image_url)
values
  ('five_more_minutes-hair','standalone-pieces','hair','Five More Minutes',3,'sweet',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/five_more_minutes-hair/image_url.png'),
  ('straight_a_student-hair','standalone-pieces','hair','Straight-A Student',2,'elegant',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/straight_a_student-hair/image_url.png'),
  ('ten_second_bun-hair','standalone-pieces','hair','Ten-Second Bun',2,'sweet',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/ten_second_bun-hair/image_url.png'),
  ('silverplume-hair','standalone-pieces','hair','Silverplume',2,'fresh',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/silverplume-hair/image_url.png'),
  ('sunset_dance-hair','standalone-pieces','hair','Sunset Dance',2,'sexy',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/sunset_dance-hair/image_url.png'),
  ('autumns_melody-hair','standalone-pieces','hair','Autumn’s Melody',3,'sweet',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/autumns_melody-hair/image_url.png'),
  ('an_easy_start-hair','standalone-pieces','hair','An Easy Start',3,'cool',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/an_easy_start-hair/image_url.png'),
  ('azure_sand-hair','standalone-pieces','hair','Azure Sand',3,'fresh',false,
    'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/outfit_variants/azure_sand-hair/image_url.png');

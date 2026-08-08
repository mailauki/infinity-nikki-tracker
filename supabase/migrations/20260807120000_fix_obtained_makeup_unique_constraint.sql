-- Fix obtained_makeup: correct its unique constraint and add the missing FKs.
--
-- PROBLEM 1 — the unique constraint was unsatisfiable for standalone pieces.
-- 20260802120000_add_makeup_tables.sql created
--   unique (user_id, makeup_set, makeup_category)
-- which allows a user only ONE obtained row per (set, category). That
-- contradicts toggle_obtained_makeup, which deletes by makeup_variant alone —
-- the delete and the insert disagreed about what identifies a row.
--
-- A standalone piece has makeup_set IS NULL in makeup_variants, but the client
-- sends the 'standalone-pieces' bucket slug on insert so the NOT NULL column
-- has a value. All five standalone pieces are in the 'base-makeup' category, so
-- they collapsed to the single key (user_id, 'standalone-pieces', 'base-makeup')
-- and obtaining a second one raised
--   duplicate key value violates unique constraint "obtained_makeup_unique"
--
-- makeup_variants.slug is UNIQUE, so (user_id, makeup_variant) is a sound
-- identity and matches what the RPC actually does. It also mirrors the sibling
-- table obtained_momo_cloaks, which already uses unique (user_id, momo_cloak).
--
-- PROBLEM 2 — makeup_set / makeup_category / makeup_variant were bare text with
-- no referential integrity, so a typo or a deleted variant left orphaned rows.
-- All three referenced columns are UNIQUE, so all three can carry an FK.
--
-- The 'standalone-pieces' bucket blocked the makeup_set FK: it is a client-side
-- pseudo-set with no row in makeup_sets. Give it a real row (as outfits already
-- does for its own standalone bucket) so the FK resolves.

-- 1. A real row for the standalone bucket.
--    NOTE: outfit_sets uses 'standalone_pieces' (underscore) while the makeup
--    client constant STANDALONE_MAKEUP_SLUG is 'standalone-pieces' (hyphen).
--    Insert the hyphen form to match the slug already written to
--    obtained_makeup, so no data rewrite is needed.
insert into public.makeup_sets (slug, title, description, rarity, "order", base_set, image_url)
select 'standalone-pieces',
       'Standalone Pieces',
       'Makeup pieces that do not belong to a set.',
       2,
       1,
       null,
       (select image_url from public.makeup_variants
        where makeup_set is null and image_url is not null
        order by slug limit 1)
where not exists (
  select 1 from public.makeup_sets where slug = 'standalone-pieces'
);

-- 2. Swap the unique constraint onto the variant.
alter table public.obtained_makeup
  drop constraint if exists obtained_makeup_unique;

-- Defensive: collapse any pre-existing duplicate (user_id, makeup_variant)
-- rows before the new constraint goes on. None exist today, but the old
-- constraint never prevented them.
delete from public.obtained_makeup a
using public.obtained_makeup b
where a.user_id = b.user_id
  and a.makeup_variant = b.makeup_variant
  and a.id > b.id;

alter table public.obtained_makeup
  add constraint obtained_makeup_unique unique (user_id, makeup_variant);

-- 3. Referential integrity on all three slug columns.
--    ON UPDATE CASCADE so renaming a slug propagates (repo convention for
--    string FKs); ON DELETE CASCADE so removing a set/variant clears the
--    per-user rows that point at it rather than orphaning them.
alter table public.obtained_makeup
  drop constraint if exists obtained_makeup_makeup_set_fkey,
  drop constraint if exists obtained_makeup_makeup_category_fkey,
  drop constraint if exists obtained_makeup_makeup_variant_fkey;

alter table public.obtained_makeup
  add constraint obtained_makeup_makeup_set_fkey
    foreign key (makeup_set) references public.makeup_sets(slug)
    on update cascade on delete cascade,
  add constraint obtained_makeup_makeup_category_fkey
    foreign key (makeup_category) references public.makeup_categories(slug)
    on update cascade on delete cascade,
  add constraint obtained_makeup_makeup_variant_fkey
    foreign key (makeup_variant) references public.makeup_variants(slug)
    on update cascade on delete cascade;

-- Supporting indexes for the new FKs (the unique constraint already covers
-- makeup_variant via its leading user_id column only, so index it explicitly).
create index if not exists obtained_makeup_makeup_set_idx
  on public.obtained_makeup (makeup_set);
create index if not exists obtained_makeup_makeup_category_idx
  on public.obtained_makeup (makeup_category);
create index if not exists obtained_makeup_makeup_variant_idx
  on public.obtained_makeup (makeup_variant);

-- supabase/migrations/20260601000006_fix_outfit_lookup_table_pks.sql
-- Fix abilities, outfit_categories, and evolutions to use composite (id, slug) PKs
-- to match the pattern used by outfit_sets and outfit_variants.
-- Also add the missing slug unique constraints and relax the evolutions order check.
--
-- Sequence per table:
--   1. Add unique(slug) so the FK can reference it after the PK changes
--   2. Drop the FK that depends on the current PK index
--   3. Drop + recreate the PK as (id, slug)
--   4. Restore the FK (now backed by the unique constraint on slug)

-- abilities -----------------------------------------------------------------
-- unique(slug) is now declared inline in 20260601000004 so the FKs are valid on
-- a clean rebuild. Guard the add so this migration still applies on databases
-- where 20260601000004 ran before that constraint existed (the constraint is
-- absent there) and is a no-op on a fresh rebuild (already present).
do $$ begin
  alter table public.abilities add constraint abilities_slug_key unique (slug);
exception when duplicate_table or duplicate_object then null;
end $$;

alter table public.outfit_sets
  drop constraint outfit_sets_ability_fkey;

alter table public.abilities
  drop constraint abilities_pkey;

alter table public.abilities
  add constraint abilities_pkey primary key (id, slug);

alter table public.outfit_sets
  add constraint outfit_sets_ability_fkey
    foreign key (ability) references public.abilities (slug) on update cascade;

-- outfit_categories ---------------------------------------------------------
do $$ begin
  alter table public.outfit_categories add constraint outfit_categories_slug_key unique (slug);
exception when duplicate_table or duplicate_object then null;
end $$;

alter table public.outfit_variants
  drop constraint outfit_variants_outfit_category_fkey;

alter table public.outfit_categories
  drop constraint outfit_categories_pkey;

alter table public.outfit_categories
  add constraint outfit_categories_pkey primary key (id, slug);

alter table public.outfit_variants
  add constraint outfit_variants_outfit_category_fkey
    foreign key (outfit_category) references public.outfit_categories (slug) on update cascade;

-- evolutions ----------------------------------------------------------------
do $$ begin
  alter table public.evolutions add constraint evolutions_slug_key unique (slug);
exception when duplicate_table or duplicate_object then null;
end $$;

alter table public.outfit_variants
  drop constraint outfit_variants_evolution_fkey;

alter table public.evolutions
  drop constraint evolutions_pkey;

alter table public.evolutions
  add constraint evolutions_pkey primary key (id, slug);

alter table public.outfit_variants
  add constraint outfit_variants_evolution_fkey
    foreign key (evolution) references public.evolutions (slug) on update cascade;

-- Ensure order check uses open-ended lower bound (>= 1, no upper cap)
alter table public.evolutions
  drop constraint if exists evolutions_order_check;

alter table public.evolutions
  add constraint evolutions_order_check check ("order" >= 1);

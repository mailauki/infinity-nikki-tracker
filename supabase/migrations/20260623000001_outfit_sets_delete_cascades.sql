-- 20260623000001_outfit_sets_delete_cascades.sql
-- After merging evolutions into outfit_sets, a base row is referenced by its
-- sibling evolution rows (base_set), its variants (outfit_set), and user
-- collection records (obtained_outfit.outfit_set). All three FKs were
-- ON UPDATE CASCADE only, so deleting a state row was blocked by its children
-- (breaking the admin writer's error-rollback and intuitive set deletion).
-- Add ON DELETE CASCADE so deleting a state cleans up its whole family:
--   delete base  -> its sibling evolution rows cascade (base_set)
--   delete state -> its variants cascade (outfit_variants.outfit_set)
--   delete state -> its obtained records cascade (the collectible no longer exists)

begin;

-- 1. base_set self-FK: deleting a base row removes its sibling evolution rows.
alter table public.outfit_sets drop constraint outfit_sets_base_set_fkey;
alter table public.outfit_sets
  add constraint outfit_sets_base_set_fkey
    foreign key (base_set) references public.outfit_sets (slug)
    on update cascade on delete cascade;

-- 2. outfit_variants.outfit_set: deleting a state row removes its variants.
alter table public.outfit_variants drop constraint outfit_variants_outfit_set_fkey;
alter table public.outfit_variants
  add constraint outfit_variants_outfit_set_fkey
    foreign key (outfit_set) references public.outfit_sets (slug)
    on update cascade on delete cascade;

-- 3. obtained_outfit.outfit_set: deleting a state row removes user collection
--    records for it (the collectible is gone).
alter table public.obtained_outfit drop constraint obtained_outfit_set_fkey;
alter table public.obtained_outfit
  add constraint obtained_outfit_set_fkey
    foreign key (outfit_set) references public.outfit_sets (slug)
    on update cascade on delete cascade;

commit;

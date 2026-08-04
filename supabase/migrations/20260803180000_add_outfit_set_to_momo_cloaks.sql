-- 20260803180000_add_outfit_set_to_momo_cloaks.sql
-- Associated outfit for Momo's Cloaks, mirroring makeup_sets.outfit_set
-- (20260802120000_add_makeup_tables.sql). The FK points at outfit_sets(slug),
-- matching the slug-FK convention used across the schema.
--
-- ON DELETE SET NULL: a cloak is a standalone collectible that merely
-- references an outfit, so removing the outfit must not remove the cloak.

begin;

alter table public.momo_cloaks
  add column if not exists outfit_set text
    references public.outfit_sets(slug) on update cascade on delete set null;

create index if not exists momo_cloaks_outfit_set_idx on public.momo_cloaks (outfit_set);

commit;

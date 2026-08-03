-- 20260802130000_repoint_makeup_fks_to_slug.sql
-- 20260802120000_add_makeup_tables.sql declared makeup_sets.style/label/seasons/
-- season_category and makeup_variants.style/label as FKs against the lookup
-- tables' `title` column. Every sibling table (outfit_sets, outfit_variants,
-- eureka_sets) references `slug` instead, since 20260312000001_migrate_fks_to_slug.sql
-- moved them there — the makeup migration was inconsistent with that convention.
-- App code (app/admin/makeup/sets/makeup-set-table.tsx) writes slugs into these
-- columns, so the original `title` FKs would reject any multi-word or
-- capitalized lookup value (slug = lower(replace(title, ' ', '_')), so
-- slug != title in the normal case).
--
-- Both makeup_sets and makeup_variants are empty (0 rows) as of this writing,
-- so no data backfill is needed — this only repoints the constraints.

begin;

alter table public.makeup_sets
  drop constraint if exists makeup_sets_style_fkey,
  add constraint makeup_sets_style_fkey
    foreign key (style) references public.styles (slug) on update cascade;

alter table public.makeup_sets
  drop constraint if exists makeup_sets_label_fkey,
  add constraint makeup_sets_label_fkey
    foreign key (label) references public.labels (slug) on update cascade;

alter table public.makeup_sets
  drop constraint if exists makeup_sets_seasons_fkey,
  add constraint makeup_sets_seasons_fkey
    foreign key (seasons) references public.seasons (slug) on update cascade;

alter table public.makeup_sets
  drop constraint if exists makeup_sets_season_category_fkey,
  add constraint makeup_sets_season_category_fkey
    foreign key (season_category) references public.season_categories (slug) on update cascade;

alter table public.makeup_variants
  drop constraint if exists makeup_variants_style_fkey,
  add constraint makeup_variants_style_fkey
    foreign key (style) references public.styles (slug) on update cascade;

alter table public.makeup_variants
  drop constraint if exists makeup_variants_label_fkey,
  add constraint makeup_variants_label_fkey
    foreign key (label) references public.labels (slug) on update cascade;

commit;

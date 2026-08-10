alter table public.makeup_sets drop constraint if exists makeup_sets_label_fkey;
alter table public.makeup_sets drop column if exists label;

alter table public.makeup_variants drop constraint if exists makeup_variants_label_fkey;
alter table public.makeup_variants drop column if exists label;

alter table public.makeup_variants
  add column if not exists seasons text,
  add column if not exists season_category text;

alter table public.makeup_variants
  add constraint makeup_variants_seasons_fkey
    foreign key (seasons) references public.seasons(slug) on update cascade,
  add constraint makeup_variants_season_category_fkey
    foreign key (season_category) references public.season_categories(slug) on update cascade;

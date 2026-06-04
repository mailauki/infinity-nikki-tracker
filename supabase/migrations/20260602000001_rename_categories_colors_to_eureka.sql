-- Rename categories → eureka_categories and colors → eureka_colors
-- to disambiguate from the outfit_categories table added in 20260601000004

alter table public.categories rename to eureka_categories;
alter table public.colors rename to eureka_colors;

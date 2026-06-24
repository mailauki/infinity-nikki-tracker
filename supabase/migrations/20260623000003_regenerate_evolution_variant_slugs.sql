-- 20260623000003_regenerate_evolution_variant_slugs.sql
-- After 20260622000001 merged evolutions into outfit_sets, evolution variants'
-- outfit_set was correctly repointed at the evolution row's slug, but their
-- `slug` column kept the pre-merge format {base}-{category}-{evolution}
-- (e.g. 'silvergales_aria-hair-silvergales_aria-farewell') instead of the new
-- {outfit_set}-{category} convention ('silvergales_aria-farewell-hair') that
-- base variants and the admin forms / toSlugVariant() use.
--
-- This regenerates those slugs to {outfit_set}-{outfit_category}. Verified
-- collision-free: no regenerated slug clashes with an existing slug or another
-- row in the batch. The only out-of-band consumer of outfit_variants.slug is
-- custom_looks.outfit_variant_slugs (a text[]); no FK references it.
-- Data only; no schema change.

begin;

-- 1. Rewrite custom_looks.outfit_variant_slugs FIRST, while the old variant
--    slugs still exist to join on. For each look, map every array element that
--    is a stale evolution-variant slug to its new {outfit_set}-{category} form;
--    leave all other elements untouched.
update public.custom_looks cl
set outfit_variant_slugs = (
  select array_agg(
    coalesce(
      (select v.outfit_set || '-' || v.outfit_category
       from public.outfit_variants v
       join public.outfit_sets s on s.slug = v.outfit_set
       where v.slug = elem
         and s.base_set is not null
         and v.slug <> (v.outfit_set || '-' || v.outfit_category)),
      elem
    )
    order by ord
  )
  from unnest(cl.outfit_variant_slugs) with ordinality as t(elem, ord)
)
where exists (
  select 1
  from unnest(cl.outfit_variant_slugs) as elem
  join public.outfit_variants v on v.slug = elem
  join public.outfit_sets s on s.slug = v.outfit_set
  where s.base_set is not null
    and v.slug <> (v.outfit_set || '-' || v.outfit_category)
);

-- 2. Regenerate the evolution-variant slugs themselves.
update public.outfit_variants v
set slug = v.outfit_set || '-' || v.outfit_category
from public.outfit_sets s
where s.slug = v.outfit_set
  and s.base_set is not null
  and v.slug <> (v.outfit_set || '-' || v.outfit_category);

commit;

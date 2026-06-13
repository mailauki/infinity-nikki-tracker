-- Auto-create a "base" evolution (order = 1) for every outfit set so base
-- variants get a real FK-valid slug ({set_slug}-base) instead of NULL.
-- Existing non-base evolutions are bumped up by 1 to make room for order = 1.
--
-- PostgreSQL evaluates UNIQUE constraint violations at end-of-statement, so
-- incrementing all orders in a single UPDATE is safe (no row-by-row conflict).

-- 1. Increment all existing non-base evolution orders by 1 (base will take order = 1).
update public.evolutions
set    "order" = "order" + 1
where  subtitle is distinct from 'base';

-- 2. Insert a base evolution (order = 1) for every outfit set that doesn't
--    already have one. ON CONFLICT DO NOTHING guards against re-runs.
insert into public.evolutions (slug, title, subtitle, "order", outfit_set)
select
  s.slug || '-base',
  s.title,
  'base',
  1,
  s.slug
from public.outfit_sets s
where not exists (
  select 1 from public.evolutions e
  where e.outfit_set = s.slug and e.subtitle = 'base'
)
on conflict do nothing;

-- 3. Replace NULL evolution with the base slug in outfit_variants.
update public.outfit_variants v
set    evolution = v.outfit_set || '-base'
where  v.evolution is null;

-- 4. Replace NULL evolution with the base slug in obtained_outfit.
update public.obtained_outfit o
set    evolution = o.outfit_set || '-base'
where  o.evolution is null;

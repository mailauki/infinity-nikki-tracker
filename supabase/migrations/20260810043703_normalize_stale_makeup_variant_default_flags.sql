-- Normalize `default` on makeup variants owned by non-base sets.
--
-- 10 rows — all 5 variants each of the evolutions `farewell_aria` (order 4,
-- base silvergales_aria) and `nights_lone_song` (order 4, base wishful_aurosa) —
-- carried "default" = true even though their owning set's order <> 1.
--
-- trg_enforce_base_makeup_variant_default computes
--   "default" := (owning set's order = 1)
-- but only fires on INSERT or UPDATE OF makeup_set. These rows predate the
-- trigger, or their set's `order` changed afterwards without makeup_set being
-- rewritten, so the flag was never recalculated.
--
-- Effect of the staleness: anything selecting a set's representative image via
-- `default = true` could pick an evolution-stage variant instead of the base's.
--
-- This sets the same value the trigger would compute. It touches no slug, so
-- image storage paths are unaffected, and no obtained_makeup row is modified.

update public.makeup_variants mv
set "default" = false
from public.makeup_sets ms
where ms.slug = mv.makeup_set
  and ms."order" <> 1
  and mv."default" is true;

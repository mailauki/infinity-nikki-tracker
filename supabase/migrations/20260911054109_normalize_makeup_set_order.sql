-- makeup_sets."order" is no longer an admin-editable field: it is derived from
-- base_set. A base set is order 1; a makeup evolution is always the outfit
-- line's max evolution — order 4, matching the order-4 outfit_sets row it is
-- attached to. See makeupSetOrder() in hooks/makeup.ts, which both mutation
-- paths in app/admin/makeup/sets/actions.ts now call instead of reading a
-- submitted value.
--
-- The old add/edit forms defaulted a new evolution to order 2 and let it be
-- typed freely, so rows can disagree with the derivation. Bring the existing
-- data in line. Every writable path self-heals a row on its next save, but that
-- only fires when someone happens to edit the row.
--
-- `trg_makeup_sets_updated_at` bumps updated_at on the rows this touches, so
-- they move to the front of the admin lists' "recently updated" ordering. That
-- is cosmetic and expected.

update public.makeup_sets
set    "order" = 4
where  base_set is not null
and    "order" <> 4;

update public.makeup_sets
set    "order" = 1
where  base_set is null
and    "order" <> 1;

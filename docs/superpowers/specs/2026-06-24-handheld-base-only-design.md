# Handheld base-exclusive toggle

## Problem

In Infinity Nikki, some outfit sets ship a handheld item that belongs only to the
base outfit — it is not re-issued for the set's evolution states. The tracker's
variant-generation logic does not model this. It generates one `outfit_variants`
row per `(state × category)`, where a state is the base row or one evolution
sibling row. So when `handhelds` is a selected category, the logic produces a
handheld variant for the base **and** for every evolution, overstating what the
game actually grants.

We need a way for an admin to declare "handhelds is exclusive to the base set"
for a given set, which drops the handheld variants from that set's evolution
states.

## Decisions (from brainstorming)

- **Storage:** a single boolean on the base `outfit_sets` row (hardcoded to the
  `handhelds` category — not a generic per-category mechanism).
- **UI location:** the outfit **set** edit form (the base row is the source of
  truth for shared, set-level fields).
- **Determination:** a **manual toggle** the admin flips. No auto-detection
  heuristics.
- **Existing evolution-state handheld variants:** **deleted on save** when the
  toggle is on. This rides the edit action's existing expected-vs-DB variant
  diff. `obtained_outfit` has **no** FK to `outfit_variants` (only to
  `outfit_sets`/`outfit_categories`), so deleting a variant does not cascade to
  obtained records — `editOutfitSet` therefore deletes the now-orphaned
  `obtained_outfit` rows keyed `(evolution slug, 'handhelds')` explicitly.

## Scope

### In scope

1. **DB migration** — add `handheld_base_only boolean NOT NULL DEFAULT false` to
   `public.outfit_sets`. Meaningful only on the base row (`base_set IS NULL`);
   evolution sibling rows ignore it. Regenerate `lib/types/supabase.ts`.

2. **Variant-sync logic** (`app/admin/outfits/sets/actions.ts`) — in both
   `addOutfitSet` and `editOutfitSet`:
   - Read `handheld_base_only` from the form and persist it on the base row.
   - When building the expected variants for **evolution** states, skip the
     `handhelds` category if `handheld_base_only` is true. The base state always
     gets all selected categories.
   - No new delete code: `editOutfitSet` already deletes DB variants absent from
     `expectedVariants`, so flipping the toggle on naturally removes existing
     evolution-state handheld variants on save.

3. **Set edit form** (`app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`) —
   add a MUI `Switch` (`FormControlLabel`, label "Handhelds exclusive to base
   set") directly below the Categories `FormControl`.
   - Render it only when `handhelds` is in the selected categories **and** the
     set has at least one evolution. Otherwise the flag is meaningless — hide it.
   - Initialize from the loaded base-row value.
   - Submit as a hidden input named `handheld_base_only`.

4. **Set add form** (`app/admin/outfits/sets/new/…`) — mirror the toggle so the
   column is set consistently from creation. Sets created without evolutions (or
   without `handhelds`) submit `false`.

### Out of scope (YAGNI)

- Generalizing to arbitrary base-exclusive categories.
- Auto-detection of base-exclusivity from existing variant images.
- Any control on the evolution edit form.

## Why the display side needs no changes

All public read paths (`getEvolutions`, `createOutfitSet`, the outfit carousel,
the look builder) render whatever variants exist. Because the feature works by
simply not generating evolution-state handheld variants, those surfaces show no
handheld for evolutions with zero display-layer changes. This is the payoff of
the existing data-driven variant model.

## Risk / behavior to confirm

Flipping the toggle on is **destructive at form-save time**: existing
evolution-state handheld variants are dropped when the form is saved, and
`editOutfitSet` explicitly deletes the matching `obtained_outfit` rows
`(evolution slug, 'handhelds')` (no FK cascade exists for this — see Decisions).
This matches the chosen "delete on save" behavior; there is no separate
confirmation dialog.

## Affected files

- `supabase/migrations/<timestamp>_add_handheld_base_only_to_outfit_sets.sql` (new)
- `lib/types/supabase.ts` (regenerated)
- `app/admin/outfits/sets/actions.ts`
- `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`
- `app/admin/outfits/sets/edit/[slug]/page.tsx` (pass `handheld_base_only` to the form)
- `app/admin/outfits/sets/new/…` add form + its page (mirror the toggle)

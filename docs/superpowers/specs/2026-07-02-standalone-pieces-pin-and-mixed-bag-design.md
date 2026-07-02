# Standalone Pieces: pin to bottom, default in form, mixed-bag rarities

**Date:** 2026-07-02
**Status:** Approved

## Problem

The "Standalone Pieces" set is a catch-all for individually-authored outfit pieces
that don't belong to a gacha/season set. Three gaps:

1. On the outfits page it sorts like any other set (by date/rarity/progress/title),
   so it can appear anywhere. As a catch-all bucket it should always sit at the bottom.
2. The add-variant form's set picker offers "— Standalone piece —" as the **empty**
   option, posting `outfit_set = null`. But the real set row and its existing variants
   use `outfit_set = 'standalone-pieces'`. A null-set variant is grouped under `''`
   and never rendered on the page. The form should default to Standalone and post the
   real slug, pinned to the top of the picker.
3. Standalone is treated as a strict single-rarity set (`rarity = 2`). It should behave
   as a mixed bag: each piece carries its own rarity/style/labels, and the page's rarity
   filter should match on individual variant rarities, not the set's single value.

## Current-state facts (verified against the DB)

- `outfit_sets` has a `standalone-pieces` row: `title='Standalone Pieces'`, `rarity=2`,
  `order=1`, `base_set=null`.
- `outfit_variants`: 6007 total. **8** have `outfit_set='standalone-pieces'`; **1** has
  `outfit_set=null` (orphaned — never renders).
- FK: `outfit_variants.outfit_set → outfit_sets.slug`.
- `outfit_variants.rarity` is a nullable integer column (each variant already stores its
  own rarity independently).
- `OutfitVariant` type and `PUBLIC_VARIANT_SELECT` do **not** currently include `rarity`.
- `getOutfitVariantsBySet()` groups variants by `outfit_set ?? ''`; `getOutfitSets()`
  iterates `outfit_sets` rows and injects `variantsBySet.get(outfitSet.slug)`, so a
  `null`-set variant is never attached to any rendered set.
- Standalone variant slugs are title-based (e.g. `silverplume-hair`), NOT `standalone-pieces-hair`.

## Decisions

- **Store value:** the form posts `outfit_set = 'standalone-pieces'` (not null). Migrate
  the 1 orphaned null variant to `'standalone-pieces'`.
- **Mixed bag = per-variant fields, which already exist.** No new columns. The work is:
  the form must not force rarity/style/labels from the parent set, and the page must
  filter standalone by individual variant rarity.
- **Pin behavior:** Standalone Pieces always renders dead last, regardless of sort axis
  or direction.
- **Rarity filter:** when a rarity is selected, Standalone stays visible if it contains
  ANY variant of that rarity, showing only the matching variants.
- **Standalone slug derivation:** title + category (e.g. `silverplume-hair`), to avoid
  collisions between multiple standalone pieces in the same category.

## Changes

### 1. Data migration (`supabase/migrations/`)

New migration re-points the orphaned null variant:

```sql
UPDATE outfit_variants
SET outfit_set = 'standalone-pieces'
WHERE outfit_set IS NULL;
```

After this, `null` is unused as an outfit-variant set value; all standalone variants
share `outfit_set = 'standalone-pieces'`.

### 2. Add-variant form (`app/admin/outfits/variants/`)

**`variant-custom-fields.tsx` — `GroupedOutfitSetSelect`:**

- Replace the empty `<MenuItem value="">— Standalone piece —</MenuItem>` with a pinned
  top item: `<MenuItem value="standalone-pieces">Standalone Pieces</MenuItem>`.
- Default in **add** mode: when `values.outfit_set` is unset, treat it as `'standalone-pieces'`.
- **Mixed bag:** in `applyBackfill`, do NOT back-fill rarity/style/labels when the selected
  set is `'standalone-pieces'` — leave those fields for the user to set per variant (same
  behavior the old empty option had). Back-fill still applies for real base/evolution sets.

**`fields.tsx` — `deriveSlug`:**

- For standalone pieces, derive the slug from **title + category** (`{toSlug(title)}-{category}`),
  not `{outfit_set}-{category}`. Concretely: derive from `outfit_set + category` only when
  the set is a real (non-standalone) set; otherwise fall back to title + category.
- The `title` field's `required` predicate must stay truthy for standalone pieces (title is
  needed for the slug). Currently `required: (v) => !v.outfit_set` (title required only when
  there's no set). Since standalone now posts `outfit_set='standalone-pieces'`, that predicate
  would wrongly make title optional for standalone. Update to treat "no real set" as
  title-required, e.g. `required: (v) => !v.outfit_set || v.outfit_set === 'standalone-pieces'`
  (mirror whatever helper `deriveSlug` uses to detect a standalone/empty set so the two stay
  in sync).

### 3. Outfits page (`app/outfits/filter-outfits.tsx`)

- **Pin to bottom:** in the `.sort(...)` comparator, short-circuit so `standalone-pieces`
  is always ordered last: if only `a` is standalone return `1`, if only `b` is standalone
  return `-1`, before the axis/direction comparison. (Both standalone is impossible — one set.)
- **Mixed-bag rarity filter:** replace `set.rarity === selectedRarity` (line ~124). For the
  standalone set, keep it when any of its variants matches `selectedRarity`; for all other
  sets keep the existing set-level check. Then, in the per-variant culling, additionally
  drop standalone variants whose `rarity !== selectedRarity` when a rarity is selected, so
  only matching pieces show. Non-standalone sets are unaffected.

### 4. Per-variant rarity plumbing

- `lib/types/outfit.ts`: add `'rarity'` to the `OutfitVariant` `Pick<...>`.
- `hooks/data/outfit-variants.ts`: add `rarity` to `PUBLIC_VARIANT_SELECT`.

## Out of scope (YAGNI)

- No new per-variant fields (season/ability). Decision was per-variant rarity/style/labels,
  which already exist as columns.
- No change to the standalone set **edit** form — it already hides set-level rarity/style/labels.
- No alphabetical-title special case for the pin — Standalone is always last, including title sort.

## Testing / verification

- Migration: confirm `SELECT count(*) FROM outfit_variants WHERE outfit_set IS NULL` = 0.
- Form: add a standalone piece → it posts `outfit_set='standalone-pieces'`, slug derives from
  title+category, rarity/style/labels are NOT auto-filled and persist as chosen.
- Page: Standalone renders last under every sort axis and both directions. With a rarity
  filter set to a value present among standalone pieces, the set shows only matching variants;
  with a rarity absent from standalone, the set is hidden.
- `yarn tsc --noEmit` and `yarn lint` clean.

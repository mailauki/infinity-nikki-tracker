# Standalone pieces as a first-class set

## Problem

The Infinity Nikki tracker has 8 **standalone pieces** — individual collectibles
that don't belong to a full outfit set. Today they live in `outfit_variants` with
`outfit_set IS NULL`, are bucketed under `''` by `getOutfitVariantsBySet`, and are
rendered on the outfits page (compact view only) with a "Standalone pieces"
header and **toggling disabled**. They have no obtained tracking and no dedicated
page.

The goal: make standalone pieces behave like a set — a `/outfits/standalone-pieces`
slug page listing all of them, rendered through the existing `OutfitSetSection`,
with obtained toggling and filters, exactly like a real set.

## Findings (from data investigation)

- **8 standalone variants, all category `hair`** (distinct rarities/styles). Each
  is its own collectible: "Five More Minutes", "Straight-A Student",
  "Ten-Second Bun", "Silverplume", "Sunset Dance", "Autumn's Melody",
  "An Easy Start", "Azure Sand".
- The obtained model (`obtained_outfit`) keys on `(outfit_set, outfit_category)`
  with FK constraints: `outfit_set → outfit_sets.slug`,
  `outfit_category → outfit_categories.slug`. Because all 8 standalone pieces are
  `hair`, the `(set, category)` key **collapses them into one** — they cannot be
  tracked individually under the current scheme.
- For **regular** sets, `(outfit_set, outfit_category)` is **unique** (0
  collisions across 5,998 set variants) — each maps 1:1 to a variant slug. So the
  variant slug can serve as a universal unique obtained key for all variants,
  standalone and set alike.
- Of 10,860 existing `obtained_outfit` rows, **10,843 backfill cleanly** to a
  variant via `(outfit_set, outfit_category)`. **17 orphans** (all `handhelds` on
  still-existing sets) point to variants that no longer exist — untoggleable dead
  records, almost certainly leftovers from the `handheld_base_only` cleanup.

## Decisions (from brainstorming)

- **Standalone pieces become a real `outfit_sets` row** (slug `standalone-pieces`,
  title "Standalone Pieces"), and the 8 variants are re-pointed to it. This makes
  the existing `/outfits/[slug]` page, `getOutfitSet`, `OutfitSetSection`, set FK,
  and set-level rendering all work unchanged — standalone stops being a NULL
  special case.
- **Obtained gains a `outfit_variant` column** (variant slug) that becomes the
  unique key for every obtained record — set and standalone alike. This is the
  only key that can distinguish the 8 same-category hairs, and (per the finding
  above) it's a valid 1:1 key for regular variants too.
- **Backfill `outfit_variant` for all matchable rows.** Do not limit this to
  standalone — regular variants are equally unique, and unifying the key
  simplifies app-layer matching.
- **Delete the 17 orphan rows** so `outfit_variant` can be `NOT NULL` and the
  unique constraint can be `(user_id, outfit_variant)`.
- **Keep `outfit_set` + `outfit_category` columns and their FKs.** They stay
  populated (from the variant) but `outfit_variant` is the source of truth and the
  primary matcher. Lowest-risk: the RPC still fills all three, existing queries
  keep working, rollback is easy.
- **On the main /outfits page, "Standalone Pieces" is just another set card** — it
  flows through the normal set grid (standard) / `OutfitSetSection` (compact). The
  current special-cased standalone block in `filter-outfits.tsx` is removed.

## Scope

### In scope

#### 1. DB migration (single file under `supabase/migrations/`)

1. Insert `outfit_sets` row:
   `slug='standalone-pieces'`, `title='Standalone Pieces'`, placeholder `rarity`
   (min allowed; set-level rarity is cosmetic — variants carry their own),
   `order=1`, `base_set=NULL`, `handheld_base_only=false`. No evolutions, ability,
   or season.
2. Re-point standalone variants:
   `UPDATE outfit_variants SET outfit_set='standalone-pieces' WHERE outfit_set IS NULL`.
3. Add column: `ALTER TABLE obtained_outfit ADD COLUMN outfit_variant text` (nullable
   initially) with FK → `outfit_variants(slug) ON UPDATE CASCADE ON DELETE CASCADE`.
   **Note:** this is the first FK from `obtained_outfit` to `outfit_variants`
   (previously it referenced only `outfit_sets`/`outfit_categories`). Deleting a
   variant will now cascade-delete its obtained rows.
4. Delete orphans:

   ```sql
   DELETE FROM obtained_outfit o
   WHERE NOT EXISTS (
     SELECT 1 FROM outfit_variants v
     WHERE v.outfit_set = o.outfit_set
       AND v.outfit_category = o.outfit_category
   );
   ```

5. Backfill:

   ```sql
   UPDATE obtained_outfit o
   SET outfit_variant = v.slug
   FROM outfit_variants v
   WHERE v.outfit_set = o.outfit_set
     AND v.outfit_category = o.outfit_category;
   ```

6. `ALTER TABLE obtained_outfit ALTER COLUMN outfit_variant SET NOT NULL`.
7. Replace `obtained_outfit_unique` with `UNIQUE (user_id, outfit_variant)`.
8. Replace `toggle_obtained_outfit` with a 3-arg version keyed on the variant:
   `toggle_obtained_outfit(p_outfit_set text, p_outfit_category text, p_outfit_variant text)`.
   The delete/existence check matches on `(user_id, outfit_variant)` — the unique
   identity — while the insert writes all three columns (`outfit_set`,
   `outfit_category`, `outfit_variant`) so the kept FK columns stay populated.
   Re-grant execute to `authenticated, anon, service_role`.
9. Regenerate `lib/types/supabase.ts`.

Ordering matters: re-point variants (2) before backfill (5) so the 8 standalone
rows resolve; delete orphans (4) before `NOT NULL` (6).

#### 2. App layer

- **Types** (`lib/types/outfit.ts`): `ObtainedOutfit` gains `outfit_variant: string`.
- **Obtained matching → variant slug** (switch from `(set, category)`):
  - `hooks/outfit.ts` — `updateOutfitSet`, `updateOutfitVariants`: match
    `obtainedOutfit.some(o => o.outfit_variant === variant.slug)`.
  - `app/outfits/[slug]/outfit-set-detail.tsx`,
    `app/outfits/[slug]/outfit-evolution-variants.tsx`: same slug match.
  - `app/outfits/outfit-data-provider.tsx` — `handleToggleObtained`,
    `handleBatchToggleObtained`, realtime INSERT dedup, and the optimistic
    placeholder all key on `outfit_variant`. Placeholder becomes
    `{ id: -1, outfit_set, outfit_category, outfit_variant }`.
- **Toggle action** (`app/outfits/actions.ts`):
  `handleObtainedOutfit(outfit_set, outfit_category, outfit_variant)` passes
  `p_outfit_variant`. Provider single + batch callers pass `variant.slug`; the
  batch payload gains `outfit_variant`.
- **Queries**: `app/api/obtained-outfit/route.ts` and
  `hooks/data/obtained-outfit.ts` select `outfit_variant`.
- **Main page cleanup** (`app/outfits/filter-outfits.tsx`): remove the
  special-cased "Standalone pieces" header/Button + standalone rendering blocks;
  standalone-pieces now flows through `filteredSets` / `OutfitSetSection`
  automatically. Remove the now-unused `standaloneVariants` from the provider,
  context, and `/api/outfits` (and the `variantsBySet.get('')` bucket handling).
- **Slug page**: `/outfits/standalone-pieces` works with no new page code —
  `getOutfitSet('standalone-pieces')` returns the set and `OutfitSetDetail`
  renders it. Verify the detail view degrades gracefully with placeholder rarity
  and null ability/season (these sections are already conditional).

### Out of scope

- Admin UI for creating/editing standalone pieces as a set (they remain managed
  via the standalone-variant admin that already exists). Future work if needed.
- Changing the eureka obtained model — this is outfits-only.
- Migrating regular sets' obtained matching in a way that changes user-visible
  behavior beyond the orphan cleanup.

## Risks / notes

- **New cascade**: adding the `outfit_variant → outfit_variants.slug` FK with
  `ON DELETE CASCADE` means deleting a variant now removes its obtained rows.
  This is desirable (fixes the orphan class going forward) but is a behavior
  change from the prior model where variant deletion left obtained rows dangling.
- **17 orphan rows are deleted** — irreversible data loss, but the rows are
  untoggleable dead records referencing removed variants.
- **Set-level rarity** on `standalone-pieces` is a placeholder; the set card /
  set-level rarity filter will use it. Individual pieces show their own rarity via
  variant fields, matching how the standalone-variant metadata migration set them.
- Switching matching to `variant.slug` requires every variant object in the
  obtained pipeline to carry `slug` — confirmed present in the public variant
  select.

# StickyBar Phase 3 — Slug Toggle-Groups Design

**Date:** 2026-07-25
**Status:** Approved (pending spec review)
**Branch:** layout-shell-consolidation (completes the StickyBar work; PR #278)

## Goal

Move the selection toggle-group (plus its scoped `ProgressChip`) on the Outfit and Eureka slug
detail pages into the `StickyBar`. On outfits this is the evolution/category
`ToggleButtonGroup`; on eureka it is the color-chip row. Each currently sits in a top
`<Stack direction="row">` — toggle-group on the left, `ProgressChip` on the right — directly
above the card grid, all inside one grid component.

**Phase 3** — the final phase. After this, all three StickyBar migrations (results counts,
settings tabs, slug toggles) are done.

## Chosen decisions (from brainstorming)

- **State reaches the toggle via props from the parent** (no new context): both slug detail
  components (`OutfitSetDetail`, `EurekaSetDetail`) already own the selection state
  (`selected` / `selectedColor`) and distribute it by props. They render a NEW toggle-bar
  sibling that portals into `StickyBar`, passing the same selection props they already pass to
  the grid. `StickyBar` portals only the DOM, so tree position is irrelevant.
- **What moves:** the WHOLE top row — the toggle-group AND the `ProgressChip`. The grid
  components become just the card grid.
- **Scoped progress is reused, not recomputed:** the parents ALREADY compute a
  selection-scoped `obtained`/`total` for the sidebar card. That exact scoped progress is passed
  to the new toggle-bar's `ProgressChip` — one source of truth. The grid components drop their
  now-duplicate `obtained`/`total` computation. (Verified: the grid's scoped count and the
  parent's scoped count use identical scoping, so the numbers are guaranteed equal — see
  "Count parity" below.)
- **Derivation:** the toggle-bar derives its toggle options (evolutions/categories/colors) from
  the same source the grid used (`outfitSet` + `useOutfitData().outfitCategories`; `colors`).
  The toggle-bar and grid each derive what they render — no shared helper is extracted.

## Architecture

### New: `app/outfits/[slug]/outfit-toggle-bar.tsx` (`'use client'`)

Renders `<StickyBar>` containing the evolution/category `ToggleButtonGroup` (moved from
`OutfitEvolutionVariants`) + the `ProgressChip`. Branches on `isStandalone` exactly as the grid
does today (category chips vs. evolution states). Reads `useOutfitData()` for `outfitCategories`
(standalone mode). Preserves the `disabled={!selected && evolutions.length === 0}` state.

Props:
`{ outfitSet: OutfitSet; isStandalone: boolean; selected: string | null; onSelect: (next: string | null) => void; isLoggedIn: boolean; obtained: number; total: number }`

Toggle-option derivation (moved verbatim from `OutfitEvolutionVariants`):

- evolution mode: `[null, ...evolutions].map(...)` with base = `outfitSet.slug`, glow-up `✦ `
  prefix via `isGlowup(evolution)`.
- standalone mode: `presentCategories` = `outfitCategories.filter(c => outfit_variants.some(v =>
v.outfit_category === c.slug))`, mapped to chips, plus an "All" (`null`) option.

Render shape (matches the current top row):

```tsx
<StickyBar>
  <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
    {/* the ToggleButtonGroup, isStandalone ? category chips : evolution states */}
    {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
  </Stack>
</StickyBar>
```

### New: `app/eureka/[slug]/eureka-color-bar.tsx` (`'use client'`)

Renders `<StickyBar>` with the `ColorChip` row (moved from `EurekaVariantColorFilter`) +
`ProgressChip`.

Props:
`{ colors: EurekaColor[]; selectedColor: string | null; onToggleColor: (slug: string) => void; isLoggedIn: boolean; obtained: number; total: number }`

Render shape:

```tsx
<StickyBar>
  <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
    <Stack useFlexGap direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
      {colors.map((color) => (
        <ColorChip
          key={color.slug}
          color={color}
          selectedColor={selectedColor!}
          toggleColor={onToggleColor}
        />
      ))}
    </Stack>
    {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
  </Stack>
</StickyBar>
```

### Restructured: `app/outfits/[slug]/outfit-evolution-variants.tsx`

Loses the top `<Stack direction="row">` (toggle-group + ProgressChip) and the `obtained`/`total`
computation. Becomes just the `CardGrid` of variant cards. KEEPS its variant filter/sort logic
(the `variants` derivation) for display. The props it still needs: `outfitSet`, `isLoggedIn`,
`selected`, `isStandalone` (for `matchesSelected`/`sortKey`) — but NOT `onSelect` anymore (the
toggle moved out). Confirm `onSelect` is removed from its props and the parent stops passing it
here (passes it to the toggle-bar instead).

### Restructured: `app/eureka/[slug]/eureka-variant-color-filter.tsx`

Loses the top row (ColorChip row + ProgressChip) and the `obtained`/`total` computation. Becomes
just the `CardGrid` of variant cards, filtered by `selectedColor`. Drops `onToggleColor` from its
props (the toggle moved out); keeps `selectedColor` for filtering the grid.

### Parents: `OutfitSetDetail` / `EurekaSetDetail`

Already own `selected`/`selectedColor` + scoped `obtained`/`total`. Changes:

- Render the new toggle-bar sibling (before/with the other children — DOM position irrelevant,
  it portals): `<OutfitToggleBar … />` / `<EurekaColorBar … />`, passing selection + the scoped
  `obtained`/`total` (the SAME values already computed for the sidebar card).
- Update the grid child's props: outfits — drop `onSelect` (now on the toggle-bar), keep
  `selected` (with the existing `selected && evolutions.length > 0 ? selected : null` guard);
  eureka — drop `onToggleColor`, keep `selectedColor`.

## Count parity (verified)

- **Outfits:** grid `variants = selected===null ? all : filter(isStandalone ? outfit_category===selected : outfit_set===selected)`; parent `scopedVariants` uses the identical predicate (`outfit-set-detail.tsx:79-84`). `obtained`/`total` off the same set — equal (sort doesn't affect counts).
- **Eureka:** grid `filteredVariants = selectedColor===null ? all : filter(color===selectedColor)`; parent `scopedVariants` identical (`eureka-set-detail.tsx:46-49`), `countObtained` does the same reduction — equal.

So passing the parent's scoped `obtained`/`total` to the toggle-bar's `ProgressChip` yields
exactly the number the grid would have shown. No behavior change.

## Component / helper references (exact)

- `ProgressChip` — default export `@/components/progress-chip`, props `{ obtained: number; total: number; variant?: 'percent' | 'parts' }`. Used with `variant="parts"` (as today).
- `ColorChip` — default export `app/eureka/[slug]/color-chip.tsx`, props `{ color: EurekaColor; selectedColor?: string; toggleColor?: (value: string) => void }`.
- `isGlowup`, `evolutionSortKey` — `@/hooks/outfit` (already used by the grid).
- `StickyBar` — default export `@/components/sticky-bar`.
- `useOutfitData` — `@/components/outfits/outfit-context` (for `outfitCategories`, `obtainedOutfit`).

## AppBar offset / slug-toolbar coexistence

Slug pages ALREADY mount `components/slug-toolbar.tsx` into `ToolbarSlot` (the AppBar's 2nd row:
back, image-swap, evolution/glowup toggles for seasons, edit, sidebar info toggle). So slug
pages are **2-row AppBar** pages. Adding a `StickyBar` (the selection toggle row) is exactly the
Phase 1 situation (`/outfits`, `/eureka` list pages are also 2-row + StickyBar): the sticky
offset already accounts for `hasToolbar`, so the toggle-bar pins below the 2-row AppBar. No
conflict — `slug-toolbar` (AppBar actions) and the new toggle-bar (selection) are distinct rows
for distinct content. No mechanism change.

## Files

- Create: `app/outfits/[slug]/outfit-toggle-bar.tsx`, `app/eureka/[slug]/eureka-color-bar.tsx`
- Modify: `app/outfits/[slug]/outfit-evolution-variants.tsx`,
  `app/eureka/[slug]/eureka-variant-color-filter.tsx` (strip to just the grid)
- Modify: `app/outfits/[slug]/outfit-set-detail.tsx`, `app/eureka/[slug]/eureka-set-detail.tsx`
  (render the toggle-bar, adjust grid props)

## Edge cases

1. **Provider boundary.** The toggle-bars read `useOutfitData` (outfits) and render `ColorChip`
   (eureka); both are under the slug pages' domain providers (the outfit/eureka layouts). The
   `StickyBar` portal renders in the page tree, so hooks resolve.
2. **`disabled` state (outfits).** Preserve `disabled={!selected && evolutions.length === 0}` on
   the evolution `ToggleButtonGroup` — a set with no evolutions and no selection disables it.
3. **Standalone (outfits).** `isStandalone` switches the toggle to category chips; the parent
   already hides the sidebar card for standalone. The toggle-bar still renders (standalone has a
   category toggle). Verify the standalone set (`standalone-pieces`) shows category chips.
4. **`selected` guard consistency.** The parent passes `selected && evolutions.length > 0 ?
selected : null` to the grid today; the toggle-bar needs the raw `selected` + `evolutions` to
   compute its `value` and `disabled`. Ensure the toggle's `value` reflects the actual selection
   (pass raw `selected`), while the grid keeps its guarded value for filtering.
5. **Count parity.** The moved `ProgressChip` shows the parent's scoped `obtained`/`total`;
   verify it equals the grid's rendered count for a given selection (guaranteed by design).
6. **2-row offset.** Slug pages are 2-row (slug-toolbar); the sticky toggle-bar pins below the
   2-row AppBar. Same as Phase 1.

## Testing

No test framework — static + manual.

- `yarn tsc --noEmit` and `yarn lint` clean.
- **Outfits slug** (`/outfits/<a set with evolutions>`): the evolution toggle + ProgressChip
  render in the StickyBar (below the 2-row AppBar). Select an evolution → grid filters, sidebar
  card image/progress updates, ProgressChip updates — all in sync. A set with NO evolutions →
  toggle disabled. `standalone-pieces` → category chips, no sidebar card. Pins on scroll.
- **Eureka slug** (`/eureka/<a set>`): color chips + ProgressChip in the StickyBar. Select a
  color → grid filters, sidebar card image/progress updates, ProgressChip updates — in sync.
  Pins on scroll.
- **Count parity:** for one selection on each page, the sticky-bar ProgressChip count equals the
  grid's rendered card count.

## Out of scope

- Any change to the `StickyBar` mechanism, `slug-toolbar`, or the sidebar card.
- This completes the phased StickyBar effort.

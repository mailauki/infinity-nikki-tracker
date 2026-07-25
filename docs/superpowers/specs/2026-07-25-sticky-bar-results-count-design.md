# StickyBar Phase 1 — Results Counts Design

**Date:** 2026-07-25
**Status:** Approved (pending spec review)
**Branch:** layout-shell-consolidation (continues the StickyBar work; PR #278)

## Goal

Move the "Showing: N results" count for the Outfits and Eureka list pages into the new
`StickyBar` (the sticky sub-toolbar under the fixed AppBar). The count computations already
exist in the two toolbars but feed a commented-out display; this moves the computation into
new colocated results-bar components that render into `StickyBar`, and removes the now-dead
count logic (and its lingering unused-var lint warnings) from the toolbars.

This is **Phase 1** of a phased effort. Out of scope (later phases): the settings tabs, and the
outfit/eureka slug toggle-button-groups.

## Chosen decisions (from brainstorming)

- **Phasing:** results counts only this pass; settings tabs and slug toggle-groups are separate
  later phases.
- **Count location:** the count computation MOVES into new sticky-bar results components; the
  dead `countResults`/`resultsCount` is DELETED from both toolbars (it was always feeding a
  commented-out display). This also clears the unused-`resultsCount` lint warnings.
- **Structure:** one colocated component per domain (`app/outfits/outfit-results-bar.tsx`,
  `app/eureka/eureka-results-bar.tsx`), each computing its count and rendering into `StickyBar`,
  mounted by its page alongside the existing toolbar. Matches the project's colocation rule.
- **Presentation:** keep the original text/styling verbatim — `Typography variant="caption"
color="textSecondary" sx={{ whiteSpace: 'nowrap' }}` reading `Showing: {count} results`.
- **Alignment:** left-aligned within the full-width sticky strip (the strip's existing padding).

## Architecture & data flow

Both pages already render under their domain data providers (verified):
`app/outfits/layout.tsx` → `OutfitDataProvider` + `OutfitImageModeProvider`;
`app/eureka/layout.tsx` → `EurekaDataProvider`. `StickyBar` is a portal that renders its
children in the page tree, so the results components' hooks resolve against these providers even
though the DOM lands in the shell's sticky container.

### New: `app/outfits/outfit-results-bar.tsx` (`'use client'`)

Reads `useOutfitData()` and `useOutfitImageMode()` (`density`), runs the `countResults()` logic
moved VERBATIM from `outfit-toolbar.tsx` (the `filtered` pipeline + the density-aware
`countResults` function), and renders:

```tsx
<StickyBar>
  <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
    Showing: {resultsCount} results
  </Typography>
</StickyBar>
```

Props: `{ baseEvolutionOnly = false }` only. Of the toolbar's two props, only
`baseEvolutionOnly` affects the count; `showFilters` merely gated the toolbar's FilterMenu and
has no bearing on the count, so it does not move here. Default matches the toolbar's original
default (`false`), and the sole call site passed no args (see "Prop flow").

### New: `app/eureka/eureka-results-bar.tsx` (`'use client'`)

Reads `useEurekaData()`, runs the `filtered` + `resultsCount` reduction moved verbatim from
`eureka-toolbar.tsx`, renders the same `<StickyBar><Typography>…</Typography></StickyBar>`.
No props.

### Page wiring

- `app/outfits/page.tsx`: add `<OutfitResultsBar />` as a sibling of `<OutfitToolBar />` (both
  are portals; placement among the page's root children doesn't affect render location).
- `app/eureka/page.tsx`: add `<EurekaResultsBar />` alongside `<EurekaToolBar />`.

## Prop flow (verified call sites)

- `OutfitToolBar` is rendered exactly once: `app/outfits/page.tsx:16`, with NO args — so
  `showFilters` defaults `true` and `baseEvolutionOnly` defaults `false`. The results-bar
  therefore renders with `baseEvolutionOnly = false` (its default); the page mounts
  `<OutfitResultsBar />` with no args.
- `EurekaToolBar` is rendered exactly once: `app/eureka/page.tsx:15`, no args.

No other call sites exist, so no hidden prop values to thread. If a future page renders these
toolbars with a non-default `baseEvolutionOnly`, it must also pass it to the results-bar — noted
for later phases but not a concern now.

## Toolbar cleanup (exact)

### `app/eureka/eureka-toolbar.tsx` → minimal

After the count logic leaves, the whole component is:

```tsx
'use client'

import ToolbarSlot from '@/components/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function EurekaToolBar() {
  return (
    <ToolbarSlot>
      <SortButton />
      <FilterMenu />
    </ToolbarSlot>
  )
}
```

Removed: `useEurekaData` import + call, the `filters` destructuring, the `filtered` pipeline,
`resultsCount`, and the commented-out `<Typography>`.

### `app/outfits/outfit-toolbar.tsx` → strip count logic

Keep: the `showFilters` prop (still gates `<FilterMenu />`), `ToolbarSlot`, `SortButton`,
`FilterMenu`. Remove: the `baseEvolutionOnly` prop (moves to the results-bar), `useOutfitData`,
`useOutfitImageMode`, the `isEvolutionVisible`/`isGlowup`/`matchesObtainedFilter` imports, the
`filtered` pipeline, `countResults`, `resultsCount`, and the commented `<Typography>`. Result:

```tsx
'use client'

import ToolbarSlot from '@/components/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function OutfitToolBar({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <ToolbarSlot>
      <SortButton />
      {showFilters && <FilterMenu />}
    </ToolbarSlot>
  )
}
```

(The `baseEvolutionOnly` prop is dropped from `OutfitToolBar`; since its only call site passed no
args, no call site changes are needed. The results-bar owns `baseEvolutionOnly` now.)

## Count logic reference (moves verbatim)

- **Outfits** (`outfit-results-bar.tsx`): the entire `filtered` pipeline (lines ~17–85 of the
  current `outfit-toolbar.tsx`, reading `useOutfitData` fields + `useOutfitImageMode().density`
  - `baseEvolutionOnly`) and the `countResults()` function (density-aware:
    grouped-compact = set count; standard = distinct evolution-group count; else variant count).
- **Eureka** (`eureka-results-bar.tsx`): the `filtered` map (lines ~19–32) + the
  `resultsCount` reduction (by-color count when `showByColor`, else variant count).

These move unchanged — same inputs, same output — only their host component changes.

## Files

- Create: `app/outfits/outfit-results-bar.tsx`, `app/eureka/eureka-results-bar.tsx`
- Modify: `app/outfits/outfit-toolbar.tsx`, `app/eureka/eureka-toolbar.tsx` (strip count logic +
  dead imports/props)
- Modify: `app/outfits/page.tsx`, `app/eureka/page.tsx` (mount the results bars)

## Edge cases

1. **Provider boundary.** The results-bars read `useOutfitData`/`useOutfitImageMode`/
   `useEurekaData`; they MUST render via `StickyBar` (portal, page tree) so those hooks resolve.
   Confirmed the domain layouts provide them.
2. **Count parity.** The moved logic must produce the identical count the toolbar computed — no
   behavior change, only relocation. Verify the rendered count equals the actual card count
   across all densities/modes (see Testing).
3. **`density` dependency (outfits).** The outfit count depends on `useOutfitImageMode().density`;
   the results-bar must read it (as the toolbar did), not assume a default.
4. **Two portals, one page.** `/outfits` and `/eureka` now mount BOTH a `ToolbarSlot` (2-row
   AppBar) AND a `StickyBar`. The sticky offset already accounts for `hasToolbar` (2-row height),
   verified in the StickyBar work — the results bar pins below the 2-row AppBar. No new offset
   work.
5. **Lint warnings cleared.** After the toolbars lose `resultsCount`, the previously-lingering
   `resultsCount is assigned but never used` warnings on both toolbars must be GONE. Confirm the
   lint count drops accordingly.

## Testing

No test framework — static + manual.

- `yarn tsc --noEmit` and `yarn lint` clean; the two unused-`resultsCount` warnings are gone.
- `/outfits`: sticky bar shows "Showing: N results", left-aligned. Change sort/filters via the
  toolbar FilterMenu → count updates. Toggle density → count matches the rendered card count in
  each mode (grouped-compact = sections, standard = evolution-group cards, compact = variant
  cards). Bar pins under the 2-row AppBar on scroll.
- `/eureka`: same — count shows, updates on filter change, matches rendered count in by-color vs
  by-variant modes, pins on scroll.
- Confirm the count matches EXACTLY what the toolbar produced before the move (no off-by-one from
  the relocation) — spot-check one filtered state on each page against the pre-change behavior.

## Out of scope (later phases)

- Settings tabs → StickyBar (Phase 2).
- Outfit/eureka slug toggle-button-groups → StickyBar (Phase 3).
- Any change to the `StickyBar` mechanism itself.

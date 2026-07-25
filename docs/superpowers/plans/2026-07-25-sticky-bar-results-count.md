# StickyBar Phase 1 — Results Counts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the "Showing: N results" count for Outfits and Eureka into new colocated results-bar components that render into `StickyBar`, and strip the now-dead count logic from both toolbars.

**Architecture:** Each domain gets a colocated `*-results-bar.tsx` (`'use client'`) that computes its count from the domain data provider (moved verbatim from the toolbar) and renders `Showing: {count} results` into `StickyBar`. The pages mount the results-bar alongside the existing toolbar. Both are portals, so DOM placement is the shell; hooks resolve against the domain providers the pages already sit under.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, TypeScript.

## Global Constraints

- **No test framework in the repo.** Every task's gate is `yarn tsc --noEmit` and `yarn lint` clean, plus the task's manual check. Do NOT scaffold a test framework.
- **Package manager: Yarn.** Never npm/pnpm.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100-char width. The PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every edit — let it.
- **Path alias:** `@/` = project root.
- **Branch:** work on `layout-shell-consolidation` (already checked out). Never push to `main`.
- **Copy string verbatim:** the display text is exactly `Showing: {count} results` in a `Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption"`, left-aligned.
- **Count logic moves verbatim** — the moved computation must produce the identical count the toolbar produced; only its host component changes.
- **Scope: Phase 1 only.** Do NOT touch settings tabs or slug toggle-groups.

## File Structure

- `app/eureka/eureka-results-bar.tsx` (create) — computes eureka count, renders into StickyBar.
- `app/eureka/eureka-toolbar.tsx` (modify) — strip count logic to just SortButton + FilterMenu.
- `app/eureka/page.tsx` (modify) — mount `<EurekaResultsBar />`.
- `app/outfits/outfit-results-bar.tsx` (create) — computes outfit count (density-aware), renders into StickyBar.
- `app/outfits/outfit-toolbar.tsx` (modify) — strip count logic + drop `baseEvolutionOnly` prop.
- `app/outfits/page.tsx` (modify) — mount `<OutfitResultsBar />`.

Ordered eureka-first (simpler: no density, no props) to establish the pattern, then outfits.

---

## Task 1: Eureka results bar + toolbar cleanup

**Files:**

- Create: `app/eureka/eureka-results-bar.tsx`
- Modify: `app/eureka/eureka-toolbar.tsx`
- Modify: `app/eureka/page.tsx`

**Interfaces:**

- Consumes: `StickyBar` (default export of `@/components/sticky-bar`); `useEurekaData` (`@/components/eureka/eureka-context`).
- Produces: `export default function EurekaResultsBar()` (no props).

- [ ] **Step 1: Create the eureka results bar**

Create `app/eureka/eureka-results-bar.tsx` with the count logic moved verbatim from the current `eureka-toolbar.tsx`:

```tsx
'use client'

import { Typography } from '@mui/material'
import StickyBar from '@/components/sticky-bar'
import { useEurekaData } from '@/components/eureka/eureka-context'

export default function EurekaResultsBar() {
  const { eurekaSets, showByColor, filters } = useEurekaData()

  const {
    selectedEurekaSet,
    selectedColor,
    selectedCategory,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  const filtered = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => ({
      colors: set.colors.filter((c) => !selectedColor || c.slug === selectedColor),
      eureka_variants: set.eureka_variants
        .filter((v) => !selectedColor || v.color === selectedColor)
        .filter((v) => !selectedCategory || v.category === selectedCategory)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        }),
    }))

  const resultsCount = showByColor
    ? filtered.reduce((sum, set) => sum + set.colors.length, 0)
    : filtered.reduce((sum, set) => sum + set.eureka_variants.length, 0)

  return (
    <StickyBar>
      <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
        Showing: {resultsCount} results
      </Typography>
    </StickyBar>
  )
}
```

- [ ] **Step 2: Strip the eureka toolbar to minimal**

Replace the entire contents of `app/eureka/eureka-toolbar.tsx` with:

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

- [ ] **Step 3: Mount the results bar on the eureka page**

In `app/eureka/page.tsx`, add the import and render `<EurekaResultsBar />` right after `<EurekaToolBar />`:

Add import (with the other imports):

```tsx
import EurekaResultsBar from './eureka-results-bar'
```

Change:

```tsx
      <EurekaToolBar />
      <PageShell>
```

to:

```tsx
      <EurekaToolBar />
      <EurekaResultsBar />
      <PageShell>
```

- [ ] **Step 4: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. The eureka-toolbar `resultsCount`/unused-var warning is now GONE (it had one). No new warnings.

- [ ] **Step 5: Manual smoke check**

Run `yarn dev`, open `http://localhost:3000/eureka`. Expected: the sticky bar (below the AppBar) shows "Showing: N results", left-aligned. Change a filter via the toolbar FilterMenu → the number updates. Toggle by-color vs by-variant view → the number matches the rendered card count. The bar pins under the AppBar on scroll (already verified mechanism; just confirm no regression).

- [ ] **Step 6: Commit**

```bash
git add app/eureka/eureka-results-bar.tsx app/eureka/eureka-toolbar.tsx app/eureka/page.tsx
git commit -m "feat(eureka): move results count into StickyBar; slim eureka toolbar"
```

---

## Task 2: Outfit results bar + toolbar cleanup

**Files:**

- Create: `app/outfits/outfit-results-bar.tsx`
- Modify: `app/outfits/outfit-toolbar.tsx`
- Modify: `app/outfits/page.tsx`

**Interfaces:**

- Consumes: `StickyBar` (`@/components/sticky-bar`); `useOutfitData` (`@/components/outfits/outfit-context`); `useOutfitImageMode` (`@/components/outfits/outfit-image-mode-context`); `isEvolutionVisible`, `isGlowup`, `matchesObtainedFilter` (`@/hooks/outfit`).
- Produces: `export default function OutfitResultsBar({ baseEvolutionOnly }: { baseEvolutionOnly?: boolean })` — defaults `baseEvolutionOnly = false`.

- [ ] **Step 1: Create the outfit results bar**

Create `app/outfits/outfit-results-bar.tsx` with the `filtered` pipeline and `countResults` moved verbatim from the current `outfit-toolbar.tsx` (density-aware):

```tsx
'use client'

import { Typography } from '@mui/material'
import StickyBar from '@/components/sticky-bar'
import { isEvolutionVisible, isGlowup, matchesObtainedFilter } from '@/hooks/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

export default function OutfitResultsBar({
  baseEvolutionOnly = false,
}: {
  baseEvolutionOnly?: boolean
}) {
  const { outfitSets, groupBySet, hideEvolutions, hideGlowups, filters } = useOutfitData()
  const { density } = useOutfitImageMode()

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  // Mirror filter-outfits: grouped mode applies the obtained filter per evolution
  // group (missing / obtained); ungrouped applies it per variant.
  const groupLevelObtained = groupBySet

  const filtered = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      const baseSlug = set.slug
      const orderByStateSlug = new Map<string, number>([
        [baseSlug, 1],
        ...set.evolutions.map((e) => [e.slug, e.order] as [string, number]),
      ])
      // Group-level obtained state is judged over the FULL group (after only the
      // structural filters), so the category filter narrows display without
      // affecting completion — mirrors filter-outfits.
      const scoped = baseEvolutionOnly
        ? set.outfit_variants.filter((v) => v.outfit_set === baseSlug)
        : set.outfit_variants
            .filter((v) => {
              const evo = set.evolutions.find((e) => e.slug === v.outfit_set) ?? null
              return isEvolutionVisible({
                stateSlug: v.outfit_set,
                baseSlug,
                isGlowupState: !!evo && isGlowup(evo),
                hideEvolutions,
                hideGlowups,
              })
            })
            .filter(
              // selectedEvolution is null for "any" and 0 for glow-up, so compare to
              // null explicitly — `!selectedEvolution` would treat glow-up as no filter.
              (v) =>
                selectedEvolution === null ||
                orderByStateSlug.get(v.outfit_set ?? '') === selectedEvolution
            )
      const inMatchingGroup =
        groupLevelObtained && selectedObtainedFilter
          ? scoped.filter((v) => {
              const group = scoped.filter((g) => g.outfit_set === v.outfit_set)
              return matchesObtainedFilter(group, selectedObtainedFilter)
            })
          : scoped
      const culled = inMatchingGroup
        .filter(
          (v) =>
            selectedOutfitCategory.length === 0 ||
            (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
        )
        .filter((v) => {
          if (groupLevelObtained) return true
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        })
      return { outfit_variants: culled }
    })
    .filter((set) => set.outfit_variants.length > 0)

  // Count what is actually rendered:
  // - Group-by-set (compact) renders one section per set, so count sets.
  // - Standard density renders one card per (set, evolution) group that has
  //   variants. Variants hidden by the evolution/glowup/obtained filters are
  //   already pruned from `filtered`, so each distinct surviving evolution is
  //   exactly one rendered card.
  // - Otherwise compact density renders one card per variant, so count variants.
  function countResults() {
    if (groupLevelObtained && density === 'compact') return filtered.length
    if (density === 'standard') {
      return filtered.reduce((sum, set) => {
        const groupKeys = new Set(set.outfit_variants.map((v) => v.outfit_set))
        return sum + groupKeys.size
      }, 0)
    }
    return filtered.reduce((sum, set) => sum + set.outfit_variants.length, 0)
  }

  const resultsCount = countResults()

  return (
    <StickyBar>
      <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
        Showing: {resultsCount} results
      </Typography>
    </StickyBar>
  )
}
```

- [ ] **Step 2: Strip the outfit toolbar**

Replace the entire contents of `app/outfits/outfit-toolbar.tsx` with (drops `baseEvolutionOnly`, keeps `showFilters`):

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

- [ ] **Step 3: Mount the results bar on the outfits page**

In `app/outfits/page.tsx`, add the import and render `<OutfitResultsBar />` right after `<OutfitToolBar />`:

Add import:

```tsx
import OutfitResultsBar from './outfit-results-bar'
```

Change:

```tsx
      <OutfitToolBar />
      <PageShell>
```

to:

```tsx
      <OutfitToolBar />
      <OutfitResultsBar />
      <PageShell>
```

- [ ] **Step 4: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. The outfit-toolbar `resultsCount` unused-var warning is now GONE. No new warnings. (Confirm the total lint warning count dropped by the two `resultsCount` warnings vs. before this plan.)

- [ ] **Step 5: Manual smoke check**

Open `http://localhost:3000/outfits`. Expected: the sticky bar shows "Showing: N results", left-aligned. Change filters via the toolbar FilterMenu → count updates. Toggle density (the image-mode/density control) → the count matches the actual rendered card count in each mode:

- grouped + compact → number of set sections
- standard density → number of evolution-group cards
- compact (ungrouped) → number of variant cards

Spot-check one filtered state against what the page showed before this change (the count must be identical — this is a pure relocation).

- [ ] **Step 6: Commit**

```bash
git add app/outfits/outfit-results-bar.tsx app/outfits/outfit-toolbar.tsx app/outfits/page.tsx
git commit -m "feat(outfits): move results count into StickyBar; slim outfit toolbar"
```

---

## Task 3: Final gate

**Files:** none (verification only).

- [ ] **Step 1: Static gate**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: tsc clean; lint 0 errors and the two `resultsCount` warnings gone (net warning count down by 2 from the pre-plan baseline); build exit 0.

- [ ] **Step 2: Count-parity manual check (both pages)**

On `/outfits` and `/eureka`, with a couple of representative filter combinations, confirm the sticky-bar count equals the number of cards actually rendered below. This is the make-or-break check: the relocation must not change the number.

- [ ] **Step 3: Commit (only if a fix was needed)**

If Steps 1–2 required any correction, commit it; otherwise nothing to commit.

---

## Sequencing note

Task 1 (eureka) establishes the pattern with the simpler case (no density, no props). Task 2 (outfits) applies the same pattern with the density-aware count and the `baseEvolutionOnly` prop. Each task ends green and committed. Task 3 is the cross-page verification. No change to the `StickyBar` mechanism.

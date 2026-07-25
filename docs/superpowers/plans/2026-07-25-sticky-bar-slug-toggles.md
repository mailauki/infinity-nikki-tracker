# StickyBar Phase 3 — Slug Toggle-Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the slug-page selection toggle-group + scoped `ProgressChip` into `StickyBar` via new toggle-bar siblings that receive parent-owned selection + scoped `obtained`/`total` by props; strip the toggle + progress from the grid components.

**Architecture:** Each slug detail parent (`EurekaSetDetail`/`OutfitSetDetail`) already owns the selection state and a scoped `obtained`/`total` (for the sidebar card). It now also renders a new toggle-bar sibling that portals the toggle-group + `ProgressChip` into `StickyBar`, passing the same props. The grid components (`EurekaVariantColorFilter`/`OutfitEvolutionVariants`) lose the top row + their duplicate progress calc, becoming just the `CardGrid`.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, TypeScript.

## Global Constraints

- **No test framework in the repo.** Gate is `yarn tsc --noEmit` and `yarn lint` clean, plus the manual check. Do NOT scaffold tests.
- **Package manager: Yarn.** Never npm/pnpm.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100-char width. The PostToolUse hook auto-formats after each edit — let it.
- **Path alias:** `@/` = project root. `git add` with `[slug]` paths must be quoted in zsh.
- **Branch:** `layout-shell-consolidation`. Never push to `main`.
- **Atomic per task:** each task creates the new bar, strips the grid, AND rewires the parent together — a partial split won't compile. Do all file ops, then gate once.
- **Behavior parity:** selection, filtering, sidebar-card sync, `disabled` state, standalone branching, and the ProgressChip count must behave exactly as before — only the toggle+progress LOCATION changes (into StickyBar).
- **Count source:** the toggle-bar's `ProgressChip` uses the PARENT's already-computed scoped `obtained`/`total` (passed as props). The grid drops its own progress computation.
- **Scope: Phase 3 only.** No change to `StickyBar`, `slug-toolbar`, or the sidebar card.

## File Structure

- `app/eureka/[slug]/eureka-color-bar.tsx` (create)
- `app/eureka/[slug]/eureka-variant-color-filter.tsx` (modify → grid only)
- `app/eureka/[slug]/eureka-set-detail.tsx` (modify → render bar, adjust grid props)
- `app/outfits/[slug]/outfit-toggle-bar.tsx` (create)
- `app/outfits/[slug]/outfit-evolution-variants.tsx` (modify → grid only)
- `app/outfits/[slug]/outfit-set-detail.tsx` (modify → render bar, adjust grid props)

Eureka first (simpler: single toggle mode, no `disabled`/standalone). Then outfits.

---

## Task 1: Eureka color bar + grid strip + parent rewire

**Files:**

- Create: `app/eureka/[slug]/eureka-color-bar.tsx`
- Modify: `app/eureka/[slug]/eureka-variant-color-filter.tsx`
- Modify: `app/eureka/[slug]/eureka-set-detail.tsx`

**Interfaces:**

- Consumes: `StickyBar` (`@/components/sticky-bar`); `ProgressChip` (`@/components/progress-chip`); `ColorChip` (`./color-chip`); `EurekaColor` type (`@/lib/types/eureka`).
- Produces: `EurekaColorBar` default export with props `{ colors: EurekaColor[]; selectedColor: string | null; onToggleColor: (slug: string) => void; isLoggedIn: boolean; obtained: number; total: number }`.

- [ ] **Step 1: Create the eureka color bar**

Create `app/eureka/[slug]/eureka-color-bar.tsx`:

```tsx
'use client'

import { Stack } from '@mui/material'
import StickyBar from '@/components/sticky-bar'
import ProgressChip from '@/components/progress-chip'
import type { EurekaColor } from '@/lib/types/eureka'
import ColorChip from './color-chip'

export default function EurekaColorBar({
  colors,
  selectedColor,
  onToggleColor,
  isLoggedIn,
  obtained,
  total,
}: {
  colors: EurekaColor[]
  selectedColor: string | null
  onToggleColor: (slug: string) => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  return (
    <StickyBar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
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
  )
}
```

- [ ] **Step 2: Strip the grid to just the CardGrid**

Replace the entire contents of `app/eureka/[slug]/eureka-variant-color-filter.tsx` with (removes the top row + `obtained`/`total`; drops `onToggleColor` from props; keeps `selectedColor` for filtering):

```tsx
'use client'

import CardGrid from '@/components/card-grid'
import type { EurekaVariant } from '@/lib/types/eureka'
import EurekaVariantCard from '@/app/eureka/eureka-variant-card'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { isVariantObtained } from '@/hooks/eureka'

// Controlled: the selected color is owned by the parent (EurekaSetDetail) so the
// sidebar detail card and the sticky color bar mirror the selection. This component
// only renders the variant grid for that selection.
export default function EurekaVariantColorFilter({
  eureka_variants,
  isLoggedIn,
  selectedColor,
}: {
  eureka_variants: EurekaVariant[]
  isLoggedIn: boolean
  selectedColor: string | null
}) {
  const { obtainedKeys } = useEurekaData()

  const variantsWithObtained = eureka_variants.map((v) => ({
    ...v,
    obtained: isVariantObtained(v, obtainedKeys),
  }))

  const filteredVariants =
    selectedColor === null
      ? variantsWithObtained
      : variantsWithObtained.filter((v) => v.color === selectedColor)

  return (
    <CardGrid
      columns={{
        gridTemplateColumns: 'repeat(2, 1fr)',
        '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
        '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
        '@container (min-width: 1536px)': { gridTemplateColumns: 'repeat(5, 1fr)' },
      }}
      sx={{ py: 0 }}
    >
      {filteredVariants.map((variant) => (
        <EurekaVariantCard key={variant.id} eurekaVariant={variant} isLoggedIn={isLoggedIn} />
      ))}
    </CardGrid>
  )
}
```

Note: `colors` and `ProgressChip`/`ColorChip`/`Stack` imports are removed (moved to the bar).

- [ ] **Step 3: Rewire the parent**

In `app/eureka/[slug]/eureka-set-detail.tsx`:

Add the import (with the other imports):

```tsx
import EurekaColorBar from './eureka-color-bar'
```

Render `<EurekaColorBar />` (e.g. right after `<SlugToolBar … />`), passing the parent's owned
selection + already-computed scoped progress:

```tsx
      <SlugToolBar isAdmin={isAdmin} />
      <EurekaColorBar
        colors={colors}
        isLoggedIn={isLoggedIn}
        obtained={obtained}
        onToggleColor={toggleColor}
        selectedColor={selectedColor}
        total={total}
      />
```

Update the grid usage — drop `colors` and `onToggleColor` (no longer props of the grid):

```tsx
<EurekaVariantColorFilter
  eureka_variants={eureka_variants}
  isLoggedIn={isLoggedIn}
  selectedColor={selectedColor}
/>
```

(`obtained`/`total` are already computed in the parent at lines ~50 via `countObtained(scopedVariants)` — reuse them; no new computation.)

- [ ] **Step 4: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. No new warnings.

- [ ] **Step 5: Manual smoke check**

Run `yarn dev`, open `http://localhost:3000/eureka/<a set>`. Expected: the color chips + ProgressChip render in the STICKY BAR (below the 2-row AppBar). Selecting a color filters the grid, updates the sidebar detail card's image/progress, and updates the sticky ProgressChip — all in sync. Bar pins on scroll.

- [ ] **Step 6: Commit**

```bash
git add 'app/eureka/[slug]/eureka-color-bar.tsx' 'app/eureka/[slug]/eureka-variant-color-filter.tsx' 'app/eureka/[slug]/eureka-set-detail.tsx'
git commit -m "feat(eureka): move slug color toggle + progress into StickyBar"
```

---

## Task 2: Outfit toggle bar + grid strip + parent rewire

**Files:**

- Create: `app/outfits/[slug]/outfit-toggle-bar.tsx`
- Modify: `app/outfits/[slug]/outfit-evolution-variants.tsx`
- Modify: `app/outfits/[slug]/outfit-set-detail.tsx`

**Interfaces:**

- Consumes: `StickyBar`; `ProgressChip`; `useOutfitData` (`@/components/outfits/outfit-context`); `isGlowup` (`@/hooks/outfit`); `OutfitSet` type (`@/lib/types/outfit`); MUI `Stack`, `ToggleButton`, `ToggleButtonGroup`.
- Produces: `OutfitToggleBar` default export with props `{ outfitSet: OutfitSet; isStandalone: boolean; selected: string | null; onSelect: (next: string | null) => void; isLoggedIn: boolean; obtained: number; total: number }`.

- [ ] **Step 1: Create the outfit toggle bar**

Create `app/outfits/[slug]/outfit-toggle-bar.tsx` (toggle-option derivation moved verbatim from
the current `OutfitEvolutionVariants`, both standalone and evolution branches, preserving
`disabled`):

```tsx
'use client'

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import ProgressChip from '@/components/progress-chip'
import StickyBar from '@/components/sticky-bar'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitToggleBar({
  outfitSet,
  isStandalone = false,
  selected,
  onSelect,
  isLoggedIn,
  obtained,
  total,
}: {
  outfitSet: OutfitSet
  isStandalone?: boolean
  selected: string | null
  onSelect: (next: string | null) => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  const { obtainedOutfit, outfitCategories } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const presentCategories = outfitCategories.filter((c) =>
    outfit_variants.some((v) => v.outfit_category === c.slug)
  )

  return (
    <StickyBar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        {isStandalone ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            sx={{ flexWrap: 'wrap' }}
            value={selected}
            onChange={(_, next) => onSelect(next)}
          >
            <ToggleButton value={null as unknown as string}>All</ToggleButton>
            {presentCategories.map((category) => (
              <ToggleButton key={category.slug} value={category.slug}>
                {category.title}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : (
          <ToggleButtonGroup
            exclusive
            disabled={!selected && evolutions.length === 0}
            size="small"
            sx={{ flexWrap: 'wrap' }}
            value={selected}
            onChange={(_, next) => onSelect(next)}
          >
            {[null, ...evolutions].map((evolution) => {
              const value = evolution?.slug ?? baseSlug
              const glowup = !!evolution && isGlowup(evolution)
              return (
                <ToggleButton key={value} value={value}>
                  {glowup && '✦ '}
                  {evolution ? evolution.title : 'Base'}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        )}
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>
    </StickyBar>
  )
}
```

- [ ] **Step 2: Strip the grid to just the CardGrid**

Replace the entire contents of `app/outfits/[slug]/outfit-evolution-variants.tsx` with (removes
the top row + `obtained`/`total`; drops `onSelect` from props; keeps the variant filter/sort for
display):

```tsx
'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { evolutionSortKey } from '@/hooks/outfit'
import CardGrid from '@/components/card-grid'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitEvolutionVariants({
  outfitSet,
  isLoggedIn,
  selected,
  isStandalone = false,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  selected: string | null
  isStandalone?: boolean
}) {
  const { obtainedOutfit, outfitCategories } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const categoryOrder = outfitCategories.map((c) => c.slug)

  const stateOrder = new Map<string, number>([
    [baseSlug, -Infinity],
    ...evolutions.map((e) => [e.slug, evolutionSortKey(e)] as [string, number]),
  ])
  const orderOf = (stateSlug: string) => stateOrder.get(stateSlug) ?? Infinity

  const matchesSelected = (v: (typeof outfit_variants)[number]) =>
    isStandalone ? v.outfit_category === selected : v.outfit_set === selected

  const sortKey = (v: (typeof outfit_variants)[number]) =>
    isStandalone ? categoryOrder.indexOf(v.outfit_category ?? '') : orderOf(v.outfit_set ?? '')

  const variants = (selected === null ? outfit_variants : outfit_variants.filter(matchesSelected))
    .slice()
    .sort((a, b) => sortKey(a) - sortKey(b))

  return (
    <CardGrid
      columns={{
        gridTemplateColumns: 'repeat(2, 1fr)',
        '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
        '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
        '@container (min-width: 1536px)': { gridTemplateColumns: 'repeat(5, 1fr)' },
      }}
    >
      {variants.map((variant) => (
        <OutfitVariantCard key={variant.id} isLoggedIn={isLoggedIn} outfitVariant={variant} />
      ))}
    </CardGrid>
  )
}
```

- [ ] **Step 3: Rewire the parent**

In `app/outfits/[slug]/outfit-set-detail.tsx`:

Add the import:

```tsx
import OutfitToggleBar from './outfit-toggle-bar'
```

Render `<OutfitToggleBar />` after `<SlugToolBar … />`, passing the RAW `selected` (so the
toggle's `value`/`disabled` reflect the actual selection) + the parent's scoped
`obtained`/`total` (already computed at lines ~85-86):

```tsx
      <SlugToolBar isAdmin={isAdmin} />
      <OutfitToggleBar
        isLoggedIn={isLoggedIn}
        isStandalone={isStandalone}
        obtained={obtained}
        onSelect={handleSelectEvolution}
        outfitSet={outfitSet}
        selected={selected}
        total={total}
      />
```

Update the grid usage — drop `onSelect` (moved to the toggle-bar); keep the guarded `selected`:

```tsx
<OutfitEvolutionVariants
  isLoggedIn={isLoggedIn}
  isStandalone={isStandalone}
  outfitSet={outfitSet}
  selected={selected && evolutions.length > 0 ? selected : null}
/>
```

Note: the toggle-bar gets RAW `selected`; the grid keeps the `selected && evolutions.length > 0 ? selected : null` guard it already used. This preserves current behavior exactly.

- [ ] **Step 4: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. No new warnings.

- [ ] **Step 5: Manual smoke check**

Open `http://localhost:3000/outfits/<a set with evolutions>`. Expected: the evolution toggle +
ProgressChip render in the STICKY BAR. Selecting an evolution filters the grid, updates the
sidebar card image/progress, and updates the sticky ProgressChip — in sync. A set with NO
evolutions → toggle disabled. Open `standalone-pieces` → category chips show, no sidebar card,
category selection filters the grid. Bar pins on scroll.

- [ ] **Step 6: Commit**

```bash
git add 'app/outfits/[slug]/outfit-toggle-bar.tsx' 'app/outfits/[slug]/outfit-evolution-variants.tsx' 'app/outfits/[slug]/outfit-set-detail.tsx'
git commit -m "feat(outfits): move slug evolution/category toggle + progress into StickyBar"
```

---

## Task 3: Final gate

**Files:** none (verification only).

- [ ] **Step 1: Static gate**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: tsc clean; lint 0 errors, no new warnings; build exit 0.

- [ ] **Step 2: Cross-page sync + parity manual check**

- `/eureka/<set>`: color select → grid + sidebar card + sticky ProgressChip all in sync; count parity (ProgressChip total = grid card count for the selection).
- `/outfits/<set with evolutions>`: evolution select → grid + sidebar card + sticky ProgressChip in sync; `disabled` on a no-evolution set; `standalone-pieces` category mode + no sidebar card. Count parity.
- Both: toggle-bar pins below the 2-row AppBar on scroll.

- [ ] **Step 3: Commit (only if a fix was needed)**

If Steps 1–2 required a correction, commit it; otherwise nothing to commit.

---

## Sequencing note

Each domain task is atomic (new bar + grid strip + parent rewire land together, else the split doesn't compile). Eureka (Task 1) is the simpler pattern — single toggle mode, no disabled/standalone. Outfits (Task 2) adds the standalone/evolution branch and the `disabled` state, with the raw-vs-guarded `selected` distinction. Task 3 verifies cross-component sync and count parity. This completes the phased StickyBar effort.

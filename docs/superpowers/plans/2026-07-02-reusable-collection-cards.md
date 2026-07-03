# Reusable Collection Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `OutfitSetCard`, `OutfitVariantCard`, and `EurekaVariantCard` onto a shared `CardShell` + two focused card components (`SetCard`, `VariantCard`), keeping the three existing files as thin domain wrappers so no caller changes.

**Architecture:** A small presentational `CardShell` owns the `Grow` + `Card` + badge slots + a `CollectionToggle` helper. `SetCard` (poster) and `VariantCard` (avatar) build on it. The three existing card files become thin wrappers that keep their context hooks, image resolution, and animation state, mapping to the new primitives. Behavior-preserving.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, TypeScript. No test runner — verification is `yarn tsc --noEmit` + `yarn lint` + manual dev-server checks.

## Global Constraints

- Package manager: **Yarn** (`yarn tsc --noEmit`, `yarn lint`, `yarn format`). Never `npm`/`pnpm`, never `yarn dlx tsc`.
- Code style: no semicolons, single quotes, 2-space indent, 100 char width (Prettier enforces; the PostToolUse hook runs `yarn format && yarn lint:fix` after edits).
- Path alias `@/` = project root.
- New shared components go in `components/` (imported by both outfits + eureka routes → shared per the colocation rule).
- `'use client'` on every component here (all use hooks/interactivity).
- No test suite exists — do NOT scaffold one. Each task's verification gate is `yarn tsc --noEmit` clean + `yarn lint` no new warnings + the stated manual check.
- Callers must NOT change: `app/outfits/filter-outfits.tsx`, `app/outfits/outfit-set-section.tsx`, `app/outfits/[slug]/outfit-evolution-variants.tsx`, `app/eureka/filter-eureka.tsx`, `app/eureka/[slug]/eureka-variant-color-filter.tsx`. The three wrapper files keep their default export + prop signatures.

## File Structure

- **Create** `components/card-shell.tsx` — `CardShell` (Grow + Card + badge slots) and `CollectionToggle` helper. Presentational; no context, no `ProgressChip`/`ToggleIcon` imports.
- **Create** `components/variant-card.tsx` — `VariantCard` (avatar shape) on `CardShell`.
- **Create** `components/set-card.tsx` — `SetCard` (poster shape) on `CardShell`.
- **Rewrite** `app/outfits/outfit-variant-card.tsx` — wrapper → `VariantCard`.
- **Rewrite** `app/eureka/eureka-variant-card.tsx` — wrapper → `VariantCard`.
- **Rewrite** `app/outfits/outfit-set-card.tsx` — wrapper → `SetCard`.

Reference signatures (already in the codebase, do not change):

- `LazyImage` (`components/lazy-image.tsx`): `kind?: 'avatar' | 'square' | 'media'`; avatar takes `size`, `variant`, `optimized`, `src`, `color`, `alt`, `sx`, children; square takes `kind="square"`, `src`, `alt`, `variant`, `maxWidth`, `sx`; media takes `kind="media"`, `image`, `title`, `sx`.
- `ToggleIcon` (`components/toggle-icon.tsx`, default export): `{ item: { title, image?, image_url? }, isSelected?, disabled?, size? }`.
- `ProgressChip` (`components/progress-chip.tsx`, default export): `{ obtained, total, size?, variant? }`.
- `categoryIconSrc(slug: string): string | undefined` (`lib/look-utils.ts`).
- `isGlowup(row: { order: number }): boolean` (`hooks/outfit.ts`).
- `resolveOutfitImage`, `useOutfitImageMode` (`components/outfits/outfit-image-mode-context.tsx`).
- `useOutfitData()` → `{ onToggleObtained }` (`components/outfits/outfit-context.tsx`); `useEurekaData()` → `{ onToggleObtained }` (`components/eureka/eureka-context.tsx`).
- `toTitle` (`lib/utils.ts`).

---

### Task 1: `CardShell` + `CollectionToggle`

**Files:**

- Create: `components/card-shell.tsx`

**Interfaces:**

- Produces:
  - `CollectionToggle(props: { show: boolean; obtained: boolean; label: string; onToggle: () => void }): ReactElement | null` — default-ish named export; renders an `IconButton` (`TaskAlt` when `obtained`, else `RadioButtonUncheckedOutlined`) with `aria-label={label}`; returns `null` when `!show`.
  - `CardShell(props: CardShellProps)` default export, where:
    ```ts
    type CardShellProps = {
      in: boolean
      unmountOnExit?: boolean
      onExited?: () => void
      raised?: boolean
      topLeft?: ReactNode
      topRight?: ReactNode
      children: ReactNode
    }
    ```

- [ ] **Step 1: Create the file**

Create `components/card-shell.tsx` with exactly:

```tsx
'use client'

import { ReactNode } from 'react'
import { Box, Card, Grow, IconButton } from '@mui/material'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'

export function CollectionToggle({
  show,
  obtained,
  label,
  onToggle,
}: {
  show: boolean
  obtained: boolean
  label: string
  onToggle: () => void
}) {
  if (!show) return null
  return (
    <IconButton aria-label={label} onClick={onToggle}>
      {obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
    </IconButton>
  )
}

export default function CardShell({
  in: shown,
  unmountOnExit,
  onExited,
  raised,
  topLeft,
  topRight,
  children,
}: {
  in: boolean
  unmountOnExit?: boolean
  onExited?: () => void
  raised?: boolean
  topLeft?: ReactNode
  topRight?: ReactNode
  children: ReactNode
}) {
  return (
    <Grow in={shown} unmountOnExit={unmountOnExit} onExited={onExited} timeout={300}>
      <Card elevation={raised ? 3 : 1} sx={{ position: 'relative', flexGrow: 1 }}>
        {children}
        {topLeft && <Box sx={{ position: 'absolute', top: 12, left: 12 }}>{topLeft}</Box>}
        {topRight && <Box sx={{ position: 'absolute', top: 8, right: 8 }}>{topRight}</Box>}
      </Card>
    </Grow>
  )
}
```

- [ ] **Step 2: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors; no new warnings referencing `card-shell.tsx`. (`CollectionToggle`/`CardShell` are unused until Task 2 — that's fine, unused _exports_ don't warn; do not add a throwaway consumer.)

- [ ] **Step 3: Commit**

```bash
git add components/card-shell.tsx
git commit -m "feat(cards): add shared CardShell + CollectionToggle primitive"
```

---

### Task 2: `VariantCard` (avatar shape)

**Files:**

- Create: `components/variant-card.tsx`

**Interfaces:**

- Consumes: `CardShell` (default), `CollectionToggle` (named) from `@/components/card-shell`.
- Produces: `VariantCard(props: VariantCardProps)` default export:

  ```ts
  type VariantCardProps = {
    imageSrc?: string | null
    imageAlt: string
    title?: string
    subtitle: string
    obtained: boolean
    isLoggedIn: boolean
    disableToggle?: boolean
    optimized?: boolean
    in: boolean
    onToggle: () => void
    onExited?: () => void
    topLeft?: ReactNode
  }
  ```

- [ ] **Step 1: Create the file**

Create `components/variant-card.tsx` with exactly:

```tsx
'use client'

import { ReactNode } from 'react'
import { CardHeader, Stack } from '@mui/material'
import { Category } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import CardShell, { CollectionToggle } from '@/components/card-shell'

export default function VariantCard({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  obtained,
  isLoggedIn,
  disableToggle = false,
  optimized = false,
  in: shown,
  onToggle,
  onExited,
  topLeft,
}: {
  imageSrc?: string | null
  imageAlt: string
  title?: string
  subtitle: string
  obtained: boolean
  isLoggedIn: boolean
  disableToggle?: boolean
  optimized?: boolean
  in: boolean
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode
}) {
  return (
    <CardShell in={shown} onExited={onExited} raised={obtained} topLeft={topLeft}>
      <Stack sx={{ pt: 1, alignItems: 'center' }}>
        <LazyImage
          alt={imageAlt}
          color="transparent"
          optimized={optimized}
          size="lg"
          src={imageSrc ?? undefined}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </LazyImage>
      </Stack>
      <CardHeader
        action={
          <CollectionToggle
            label={obtained ? 'Mark as not obtained' : 'Mark as obtained'}
            obtained={obtained}
            onToggle={onToggle}
            show={isLoggedIn && !disableToggle}
          />
        }
        slotProps={{
          title: { variant: 'subtitle2', noWrap: true },
          subheader: { variant: 'caption' },
        }}
        subheader={subtitle}
        sx={{ pr: 1, '& .MuiCardHeader-content': { maxWidth: 'calc(100% - 40px)' } }}
        title={title}
      />
    </CardShell>
  )
}
```

- [ ] **Step 2: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors; no new warnings.

- [ ] **Step 3: Commit**

```bash
git add components/variant-card.tsx
git commit -m "feat(cards): add VariantCard avatar shape on CardShell"
```

---

### Task 3: Rewrite `OutfitVariantCard` as a wrapper

**Files:**

- Modify (full rewrite): `app/outfits/outfit-variant-card.tsx`

**Interfaces:**

- Consumes: `VariantCard` (default) from `@/components/variant-card`.
- Produces: unchanged default export `OutfitVariantCard({ outfitVariant, isLoggedIn, isMissingFilter?, disableToggle? })` — callers untouched.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `app/outfits/outfit-variant-card.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import { categoryIconSrc } from '@/lib/look-utils'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import VariantCard from '@/components/variant-card'

export default function OutfitVariantCard({
  outfitVariant,
  isLoggedIn,
  isMissingFilter = false,
  disableToggle = false,
}: {
  outfitVariant: OutfitVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
  disableToggle?: boolean
}) {
  const { onToggleObtained } = useOutfitData()
  const { mode } = useOutfitImageMode()
  const [exiting, setExiting] = useState(false)

  // Variants have no poster image, so only alt mode differs from the default.
  const imageSrc =
    (mode === 'alt' && outfitVariant.alt_image_url) || outfitVariant.image_url || undefined

  function onToggle() {
    onToggleObtained(outfitVariant.outfit_set!, outfitVariant.outfit_category!, outfitVariant.slug)
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const categoryLabel = toTitle(outfitVariant.outfit_category ?? '')

  return (
    <VariantCard
      disableToggle={disableToggle}
      imageAlt={outfitVariant.slug || 'Outfit Variant'}
      imageSrc={imageSrc}
      in={!exiting}
      isLoggedIn={isLoggedIn}
      obtained={!!outfitVariant.obtained}
      onToggle={onToggle}
      subtitle={categoryLabel}
      title={outfitVariant.title || undefined}
      topLeft={
        <ToggleIcon
          item={{
            title: categoryLabel,
            image: categoryIconSrc(outfitVariant.outfit_category || ''),
          }}
          size="xs"
        />
      }
    />
  )
}
```

- [ ] **Step 2: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors; no new warnings.

- [ ] **Step 3: Manual check (outfit variants render + toggle)**

Run `yarn dev`. Visit an outfit set-detail page (e.g. `/outfits/<any-slug>`) where variant cards show. Confirm: centered icon image, category subtitle, category badge top-left, and — when logged in — the toggle button flips `TaskAlt`/outlined on click. On the outfits grid with the "missing" filter active, toggling a variant animates it out.
Expected: visually identical to before the refactor.

- [ ] **Step 4: Commit**

```bash
git add "app/outfits/outfit-variant-card.tsx"
git commit -m "refactor(outfits): OutfitVariantCard wraps shared VariantCard"
```

---

### Task 4: Rewrite `EurekaVariantCard` as a wrapper

**Files:**

- Modify (full rewrite): `app/eureka/eureka-variant-card.tsx`

**Interfaces:**

- Consumes: `VariantCard` (default) from `@/components/variant-card`.
- Produces: unchanged default export `EurekaVariantCard({ eurekaVariant, isLoggedIn, isMissingFilter? })` — callers untouched.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `app/eureka/eureka-variant-card.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { toTitle } from '@/lib/utils'
import { EurekaVariant } from '@/lib/types/eureka'
import { useEurekaData } from '@/components/eureka/eureka-context'
import VariantCard from '@/components/variant-card'

export default function EurekaVariantCard({
  eurekaVariant,
  isLoggedIn,
  isMissingFilter = false,
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
}) {
  const { onToggleObtained } = useEurekaData()
  const [exiting, setExiting] = useState(false)

  function onToggle() {
    onToggleObtained(eurekaVariant.eureka_set!, eurekaVariant.category!, eurekaVariant.color!)
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const subtitle = `${toTitle(eurekaVariant.category ?? '')} • ${toTitle(eurekaVariant.color ?? '')}`

  return (
    <VariantCard
      imageAlt={eurekaVariant.slug || 'Eureka Variant'}
      imageSrc={eurekaVariant.image_url}
      in={!exiting}
      isLoggedIn={isLoggedIn}
      obtained={!!eurekaVariant.obtained}
      optimized
      onToggle={onToggle}
      subtitle={subtitle}
    />
  )
}
```

- [ ] **Step 2: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors; no new warnings.

- [ ] **Step 3: Manual check (eureka variants render + toggle)**

With `yarn dev` running, visit the eureka set-detail / color-filter view where variant cards show. Confirm: centered icon (next/image, `optimized`), `"Category • Color"` subtitle, no top-left badge, and the toggle flips on click when logged in.
Expected: visually identical to before.

- [ ] **Step 4: Commit**

```bash
git add app/eureka/eureka-variant-card.tsx
git commit -m "refactor(eureka): EurekaVariantCard wraps shared VariantCard"
```

---

### Task 5: `SetCard` (poster shape)

**Files:**

- Create: `components/set-card.tsx`

**Interfaces:**

- Consumes: `CardShell` (default), `CollectionToggle` (named) from `@/components/card-shell`.
- Produces: `SetCard(props: SetCardProps)` default export:

  ```ts
  type SetCardProps = {
    href: string
    title: string
    rarity: number
    imageSrc: string
    showAlt: boolean
    obtained: number
    total: number
    isLoggedIn: boolean
    in: boolean
    unmountOnExit?: boolean
    onToggle: () => void
    onExited?: () => void
    topLeft?: ReactNode
    topRight?: ReactNode
  }
  ```

- [ ] **Step 1: Create the file**

Create `components/set-card.tsx` with exactly:

```tsx
'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { CardActionArea, Stack, Typography } from '@mui/material'
import LazyImage from '@/components/lazy-image'
import RarityStars from '@/components/rarity-stars'
import CardShell, { CollectionToggle } from '@/components/card-shell'

export default function SetCard({
  href,
  title,
  rarity,
  imageSrc,
  showAlt,
  obtained,
  total,
  isLoggedIn,
  in: shown,
  unmountOnExit,
  onToggle,
  onExited,
  topLeft,
  topRight,
}: {
  href: string
  title: string
  rarity: number
  imageSrc: string
  showAlt: boolean
  obtained: number
  total: number
  isLoggedIn: boolean
  in: boolean
  unmountOnExit?: boolean
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode
  topRight?: ReactNode
}) {
  return (
    <CardShell
      in={shown}
      onExited={onExited}
      topLeft={topLeft}
      topRight={topRight}
      unmountOnExit={unmountOnExit}
    >
      <CardActionArea component={Link} href={href}>
        {showAlt ? (
          <LazyImage alt={title} kind="square" src={imageSrc} />
        ) : (
          <LazyImage
            image={imageSrc}
            kind="media"
            sx={{ width: '100%', aspectRatio: '2 / 3' }}
            title={title}
          />
        )}
      </CardActionArea>
      <Stack direction="row" sx={{ px: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack spacing={1} sx={{ px: 1, py: 2, maxWidth: 'calc(100% - 40px)' }}>
          <Typography noWrap variant="overline">
            {title}
          </Typography>
          <RarityStars rarity={rarity} />
        </Stack>
        <CollectionToggle
          label={obtained === total ? 'Mark as not obtained' : 'Mark as obtained'}
          obtained={obtained === total}
          onToggle={onToggle}
          show={isLoggedIn}
        />
      </Stack>
    </CardShell>
  )
}
```

- [ ] **Step 2: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors; no new warnings.

- [ ] **Step 3: Commit**

```bash
git add components/set-card.tsx
git commit -m "feat(cards): add SetCard poster shape on CardShell"
```

---

### Task 6: Rewrite `OutfitSetCard` as a wrapper

**Files:**

- Modify (full rewrite): `app/outfits/outfit-set-card.tsx`

**Interfaces:**

- Consumes: `SetCard` (default) from `@/components/set-card`.
- Produces: unchanged default export `OutfitSetCard({ set, evolution?, isLoggedIn, obtained, total, onToggle, isMissingFilter?, shouldHide? })` — caller (`filter-outfits.tsx`) untouched.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `app/outfits/outfit-set-card.tsx` with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Evolution, OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import { toTitle } from '@/lib/utils'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

export default function OutfitSetCard({
  set,
  evolution = null,
  isLoggedIn,
  obtained,
  total,
  onToggle,
  isMissingFilter = false,
  shouldHide = false,
}: {
  set: OutfitSet
  // When provided, the card represents this evolution of the set (its image,
  // title, and link); otherwise it represents the base set.
  evolution?: Evolution | null
  isLoggedIn: boolean
  obtained: number
  total: number
  onToggle: () => void
  // When the "missing" filter is active, completing this group animates the
  // card out (the obtained toggle is committed in onExited) so it leaves the
  // filtered view smoothly instead of vanishing instantly.
  isMissingFilter?: boolean
  // When true (e.g. an evolution card while "hide evolutions" is active), the
  // card animates out and stays unmounted.
  shouldHide?: boolean
}) {
  const { mode } = useOutfitImageMode()
  const [grown, setGrown] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => setGrown(true), [])

  // Animate out when this card should be hidden by a filter change, and grow
  // back in when the filter is cleared.
  useEffect(() => {
    setExiting(shouldHide)
  }, [shouldHide])

  function handleToggle() {
    onToggle()
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const href = evolution
    ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
    : `/outfits/${set.slug}`
  const title = evolution ? `${set.title}: ${toTitle(evolution.title)}` : set.title

  const imageSrc = evolution
    ? resolveOutfitImage(mode, { image: evolution.image_url, alt: evolution.alt_image_url })
    : resolveOutfitImage(mode, { image: set.image_url, alt: set.alt_image_url })
  const showAlt = mode === 'alt' && !!(evolution ? evolution.alt_image_url : set.alt_image_url)

  const glowup = !!evolution && isGlowup(evolution)

  return (
    <SetCard
      href={href}
      imageSrc={imageSrc || set.image_url || ''}
      in={grown && !exiting}
      isLoggedIn={isLoggedIn}
      obtained={obtained}
      rarity={set.rarity}
      showAlt={showAlt}
      title={title}
      total={total}
      unmountOnExit
      onToggle={handleToggle}
      topLeft={
        evolution && !glowup ? (
          <ToggleIcon item={{ title: 'evolution', image: '/icons/evolution.png' }} size="xs" />
        ) : glowup ? (
          <ToggleIcon item={{ title: 'glowup', image: '/icons/glowup.png' }} size="xs" />
        ) : undefined
      }
      topRight={
        isLoggedIn ? <ProgressChip obtained={obtained} total={total} variant="parts" /> : undefined
      }
    />
  )
}
```

Note: the original committed the obtained toggle synchronously (there is no `onExited` commit in the current `OutfitSetCard` — the toggle fires in `handleToggle`, and `setExiting(true)` animates the card out afterward). This wrapper preserves that exact behavior; `unmountOnExit` matches the original `Grow unmountOnExit`.

- [ ] **Step 2: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors; no new warnings.

- [ ] **Step 3: Manual check (outfit set grid, poster + link + progress + animation)**

With `yarn dev` running, visit `/outfits`. Confirm for set cards: 2:3 poster image that links to the detail page on click; `overline` title + rarity stars; `ProgressChip` top-right when logged in; evolution/glowup badge top-left where applicable. Toggle the "alt image" mode → square image renders. With the "missing" filter active, marking a set complete animates the card out. Toggle "hide evolutions" → evolution cards animate out and stay unmounted; clearing brings them back.
Expected: visually and behaviorally identical to before.

- [ ] **Step 4: Commit**

```bash
git add "app/outfits/outfit-set-card.tsx"
git commit -m "refactor(outfits): OutfitSetCard wraps shared SetCard"
```

---

### Task 7: Final verification + a11y review

**Files:** none (verification only).

- [ ] **Step 1: Format, type-check, lint clean**

Run: `yarn format && yarn lint && yarn tsc --noEmit`
Expected: format applies (commit if it changes anything), lint has only the 2 pre-existing unrelated warnings (in `outfit-evolution-variants.tsx` and `quick-access.tsx`), tsc clean.

- [ ] **Step 2: a11y review of the new shared components**

Dispatch the `a11y-reviewer` subagent against `components/card-shell.tsx`, `components/set-card.tsx`, `components/variant-card.tsx`. Confirm: toggle `aria-label`s present (they are, via `CollectionToggle`), `CardActionArea` link semantics intact. Address any AA violations it reports.

- [ ] **Step 3: Commit any format/a11y fixes**

```bash
git add -A
git commit -m "chore(cards): format + a11y pass on shared card components"
```

(Skip the commit if Steps 1–2 produced no changes.)

## Self-Review Notes

- **Spec coverage:** CardShell (Task 1), CollectionToggle helper (Task 1), VariantCard serving both variant domains (Tasks 2/3/4), SetCard poster (Tasks 5/6), thin wrappers keeping names+state (Tasks 3/4/6), verification + a11y (Task 7). All spec sections mapped.
- **No test scaffolding:** intentional — repo has no runner; gates are tsc/lint/manual per Global Constraints.
- **Type consistency:** `CollectionToggle` prop names (`show`/`obtained`/`label`/`onToggle`) identical across Tasks 1, 2, 5. `CardShell` `in`/`unmountOnExit`/`onExited`/`raised`/`topLeft`/`topRight` identical across Tasks 1, 2, 5. `VariantCard`/`SetCard` prop shapes in Tasks 2/5 match their consumers in Tasks 3/4/6.
- **Behavior preservation:** `OutfitSetCard` keeps synchronous toggle + `unmountOnExit` (no `onExited` commit, matching current source). Variant cards keep simple `exiting`, no `unmountOnExit`, `raised={obtained}`.

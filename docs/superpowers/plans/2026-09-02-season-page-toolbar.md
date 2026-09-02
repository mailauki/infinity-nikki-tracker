# Season Page Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `/seasons/[slug]` a full toolbar — alt-image and sort buttons, a clickable contents sidebar, and a seasons branch of the shared FilterMenu with density plus obtained / rarity / style — all persisted per user.

**Architecture:** Nine new `user_preferences` columns back a rewritten `SeasonFilterProvider` that hydrates on mount and persists through `savePreferences()`. Obtained / rarity / style are applied as a predicate over the output of `groupSeasonEntries`, so all three entry kinds filter uniformly and every existing count follows. The sidebar hosts two panels (contents, filters) that swap.

**Tech Stack:** Next.js 16 App Router, Supabase, MUI v9, Vitest, Yarn.

**Spec:** `docs/superpowers/specs/2026-09-02-season-page-toolbar-design.md`

## Global Constraints

- Package manager is **Yarn**. Type-check with `yarn tsc --noEmit` (never `yarn dlx tsc`).
- Prettier: no semicolons, single quotes, 2-space indent, 100 char width.
- Never push directly to `main`; branch first. Load the `git-workflow` skill before any push/PR.
- `git add` paths containing `[slug]` must be quoted — zsh glob-expands them.
- Adding a `user_preferences` column requires **five** lockstep updates. Missing one fails silently (reads return `undefined`, no error):
  1. `WRITABLE_KEYS` in `app/api/preferences/route.ts`
  2. `PREFERENCE_COLUMNS` in the same file
  3. `DEFAULT_PREFERENCES` in `lib/preferences.ts`
  4. The `UserPreferences` type in `lib/types/eureka.ts`
  5. The select string in `hooks/data/preferences.ts`
- Preference writes use `savePreferences()` from `lib/save-preferences.ts` with a `.catch(persistFailed)` — **never** a cookie-setting Server Action, which remounts the provider on every toggle.
- The migration must be applied to a **Supabase preview branch** and verified before production.

## File Structure

| File                                                         | Action  | Responsibility                   |
| ------------------------------------------------------------ | ------- | -------------------------------- |
| `supabase/migrations/<ts>_add_season_filter_preferences.sql` | Create  | The nine columns                 |
| `app/api/preferences/route.ts`                               | Modify  | Lockstep 1 + 2                   |
| `lib/preferences.ts`                                         | Modify  | Lockstep 3                       |
| `lib/types/eureka.ts`                                        | Modify  | Lockstep 4                       |
| `hooks/data/preferences.ts`                                  | Modify  | Lockstep 5                       |
| `app/seasons/[slug]/season-filter-context.tsx`               | Rewrite | Hydration, persistence, new axes |
| `app/seasons/[slug]/season-entries.ts`                       | Modify  | `applySeasonFilters` predicate   |
| `components/filter/season-filter-body.tsx`                   | Create  | Sidebar filter panel             |
| `components/filter/filter-menu.tsx`                          | Modify  | Delegate the seasons branch      |
| `app/seasons/[slug]/season-contents.tsx`                     | Create  | TOC sidebar                      |
| `app/seasons/[slug]/season-outfit-list.tsx`                  | Modify  | Section ids, apply filters       |
| `components/navbar/slug-toolbar.tsx`                         | Modify  | New buttons                      |
| `app/seasons/[slug]/season-visibility-menu.tsx`              | Delete  | Replaced by the filter panel     |

---

### Task 1: Migration and preference plumbing

**Files:**

- Create: `supabase/migrations/<timestamp>_add_season_filter_preferences.sql`
- Modify: `app/api/preferences/route.ts` (WRITABLE_KEYS ~line 45, PREFERENCE_COLUMNS ~line 51)
- Modify: `lib/preferences.ts:40` (end of DEFAULT_PREFERENCES)
- Modify: `lib/types/eureka.ts:114` (end of the UserPreferences Pick union)
- Modify: `hooks/data/preferences.ts:13` (the select string)
- Test: `lib/__tests__/season-preferences.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: nine `DEFAULT_PREFERENCES` keys — `season_hide_evolutions: true`, `season_hide_glowups: true`, `season_hide_pieces: false`, `season_hide_makeup: false`, `season_hide_base_sets: false`, `season_density: 'standard'`, `season_obtained_filter: null`, `season_rarity_filter: null`, `season_style_filter: null`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/season-preferences.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'

// Each column needs five lockstep edits; a miss shows up as a silent undefined.
// These assert the defaults exist AND carry the values the season page relies on.
const SEASON_KEYS = [
  'season_hide_evolutions',
  'season_hide_glowups',
  'season_hide_pieces',
  'season_hide_makeup',
  'season_hide_base_sets',
  'season_density',
  'season_obtained_filter',
  'season_rarity_filter',
  'season_style_filter',
] as const

describe('season preference defaults', () => {
  it.each(SEASON_KEYS)('defines a default for %s', (key) => {
    expect(DEFAULT_PREFERENCES).toHaveProperty(key)
  })

  it('hides evolutions and glow-ups by default, preserving the season page default', () => {
    expect(DEFAULT_PREFERENCES.season_hide_evolutions).toBe(true)
    expect(DEFAULT_PREFERENCES.season_hide_glowups).toBe(true)
  })

  it('shows base sets, pieces and makeup by default', () => {
    expect(DEFAULT_PREFERENCES.season_hide_base_sets).toBe(false)
    expect(DEFAULT_PREFERENCES.season_hide_pieces).toBe(false)
    expect(DEFAULT_PREFERENCES.season_hide_makeup).toBe(false)
  })

  it('defaults density to standard and the filter axes to null', () => {
    expect(DEFAULT_PREFERENCES.season_density).toBe('standard')
    expect(DEFAULT_PREFERENCES.season_obtained_filter).toBeNull()
    expect(DEFAULT_PREFERENCES.season_rarity_filter).toBeNull()
    expect(DEFAULT_PREFERENCES.season_style_filter).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/season-preferences.test.ts`
Expected: FAIL — the `season_*` properties do not exist on `DEFAULT_PREFERENCES`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/<timestamp>_add_season_filter_preferences.sql` (use a timestamp later than `20260902000107`):

```sql
-- The season page keeps its own visibility and filter state rather than sharing
-- the outfit columns. outfit_hide_evolutions / outfit_hide_glowups default to
-- false (shown), while a season page defaults them hidden: an evolution is
-- another state of a set the season already lists, not another thing to collect.
-- Flipping the shared default to match would change /outfits too.
ALTER TABLE user_preferences
  ADD COLUMN season_hide_evolutions boolean NOT NULL DEFAULT true,
  ADD COLUMN season_hide_glowups    boolean NOT NULL DEFAULT true,
  ADD COLUMN season_hide_pieces     boolean NOT NULL DEFAULT false,
  ADD COLUMN season_hide_makeup     boolean NOT NULL DEFAULT false,
  ADD COLUMN season_hide_base_sets  boolean NOT NULL DEFAULT false,
  ADD COLUMN season_density         text,
  ADD COLUMN season_obtained_filter text,
  ADD COLUMN season_rarity_filter   text,
  ADD COLUMN season_style_filter    text;
```

- [ ] **Step 4: Apply to a Supabase preview branch**

Do **not** apply to production. Create/reuse a preview branch, apply, and confirm the columns exist:

```sql
select column_name, data_type, column_default
  from information_schema.columns
 where table_name = 'user_preferences' and column_name like 'season_%'
 order by column_name;
```

Expected: nine rows; the two `*_evolutions` / `*_glowups` defaults read `true`.

- [ ] **Step 5: Regenerate the Supabase types**

`lib/types/supabase.ts` is generated — regenerate rather than hand-editing, and confirm `season_hide_evolutions` and the other eight appear under `user_preferences`.

- [ ] **Step 6: Apply the five lockstep updates**

In `app/api/preferences/route.ts`, add to `WRITABLE_KEYS` after `'makeup_image_mode',`:

```ts
  'season_hide_evolutions',
  'season_hide_glowups',
  'season_hide_pieces',
  'season_hide_makeup',
  'season_hide_base_sets',
  'season_density',
  'season_obtained_filter',
  'season_rarity_filter',
  'season_style_filter',
```

In the same file append to the `PREFERENCE_COLUMNS` string (before the closing quote):

```
, season_hide_evolutions, season_hide_glowups, season_hide_pieces, season_hide_makeup, season_hide_base_sets, season_density, season_obtained_filter, season_rarity_filter, season_style_filter
```

In `lib/preferences.ts`, add to `DEFAULT_PREFERENCES` after `makeup_image_mode: 'image',`:

```ts
  season_hide_evolutions: true,
  season_hide_glowups: true,
  season_hide_pieces: false,
  season_hide_makeup: false,
  season_hide_base_sets: false,
  season_density: 'standard',
  season_obtained_filter: null,
  season_rarity_filter: null,
  season_style_filter: null,
```

In `lib/types/eureka.ts`, add to the `UserPreferences` Pick union after `| 'makeup_image_mode'`:

```ts
  | 'season_hide_evolutions'
  | 'season_hide_glowups'
  | 'season_hide_pieces'
  | 'season_hide_makeup'
  | 'season_hide_base_sets'
  | 'season_density'
  | 'season_obtained_filter'
  | 'season_rarity_filter'
  | 'season_style_filter'
```

In `hooks/data/preferences.ts`, append the same nine names to the select string.

- [ ] **Step 7: Run the tests and type-check**

Run: `npx vitest run lib/__tests__/season-preferences.test.ts && yarn tsc --noEmit`
Expected: PASS, and tsc silent.

- [ ] **Step 8: Verify the round-trip against the preview branch**

Signed in against the preview branch, `PATCH /api/preferences` with `{"season_density":"compact"}`, then `GET /api/preferences` and confirm the response contains `season_density: "compact"`. This is what catches a missed lockstep entry — a write that appears to succeed but reads back undefined.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations lib/preferences.ts lib/types/eureka.ts lib/types/supabase.ts \
        hooks/data/preferences.ts app/api/preferences/route.ts lib/__tests__/season-preferences.test.ts
git commit -m "feat(seasons): add season filter preference columns"
```

---

### Task 2: Filter predicate in season-entries

**Files:**

- Modify: `app/seasons/[slug]/season-entries.ts`
- Test: `app/seasons/[slug]/__tests__/season-entries-filters.test.ts`

**Interfaces:**

- Consumes: `SeasonEntry`, `entryVariants` from Task 0 (existing code).
- Produces: `export type SeasonFilters = { obtained: 'obtained' | 'missing' | null; rarity: number | null; styles: string[] }` and `export function applySeasonFilters(groups: [string, SeasonEntry[]][], filters: SeasonFilters): [string, SeasonEntry[]][]`.

- [ ] **Step 1: Write the failing test**

Create `app/seasons/[slug]/__tests__/season-entries-filters.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { applySeasonFilters, type SeasonEntry } from '../season-entries'

const piece = (slug: string, obtained: boolean, rarity: number, style: string): SeasonEntry => ({
  kind: 'standalone',
  key: slug,
  variant: { slug, obtained, rarity, style } as never,
})

const groups: [string, SeasonEntry[]][] = [
  ['cat-a', [piece('a', true, 5, 'sweet'), piece('b', false, 3, 'cool')]],
  ['cat-b', [piece('c', false, 5, 'sweet')]],
]

const NO_FILTERS = { obtained: null, rarity: null, styles: [] }

describe('applySeasonFilters', () => {
  it('returns every group unchanged when no filter is set', () => {
    expect(applySeasonFilters(groups, NO_FILTERS)).toEqual(groups)
  })

  it('keeps only obtained entries', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, obtained: 'obtained' })
    expect(out).toHaveLength(1)
    expect(out[0][0]).toBe('cat-a')
    expect(out[0][1].map((e) => e.key)).toEqual(['a'])
  })

  it('keeps only missing entries', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, obtained: 'missing' })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['b', 'c'])
  })

  it('filters by rarity', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, rarity: 5 })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['a', 'c'])
  })

  it('filters by style', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, styles: ['cool'] })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['b'])
  })

  it('drops a category whose every entry is filtered out', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, styles: ['cool'] })
    expect(out.map(([name]) => name)).toEqual(['cat-a'])
  })

  it('combines axes conjunctively', () => {
    const out = applySeasonFilters(groups, { obtained: 'missing', rarity: 5, styles: ['sweet'] })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['c'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run 'app/seasons/[slug]/__tests__/season-entries-filters.test.ts'`
Expected: FAIL — `applySeasonFilters` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `app/seasons/[slug]/season-entries.ts`:

```ts
/** The season page's non-visibility filter axes. Null / empty means "no filter". */
export type SeasonFilters = {
  obtained: 'obtained' | 'missing' | null
  rarity: number | null
  styles: string[]
}

/**
 * Apply the obtained / rarity / style axes to already-grouped entries.
 *
 * These select WITHIN a kind, unlike the hide-flags which gate whole kinds, so
 * they run over the grouped output rather than being threaded into the expansion
 * functions — one predicate then covers outfit sets, outfit pieces and makeup
 * pieces uniformly, and every count downstream follows because those counts
 * already derive from this same entry list.
 *
 * An outfit set card matches on rarity/style if ANY variant it shows does: the
 * card is one row, and hiding it because one of its ten variants disagrees would
 * misrepresent what the set contains.
 */
export function applySeasonFilters(
  groups: [string, SeasonEntry[]][],
  filters: SeasonFilters
): [string, SeasonEntry[]][] {
  const { obtained, rarity, styles } = filters
  if (!obtained && rarity === null && styles.length === 0) return groups

  const matches = (entry: SeasonEntry) => {
    const variants = entryVariants(entry) as Array<{
      obtained?: boolean
      rarity?: number | null
      style?: string | null
    }>
    if (variants.length === 0) return false

    if (obtained === 'obtained' && !variants.every((v) => v.obtained)) return false
    if (obtained === 'missing' && variants.every((v) => v.obtained)) return false
    if (rarity !== null && !variants.some((v) => v.rarity === rarity)) return false
    if (styles.length > 0 && !variants.some((v) => v.style && styles.includes(v.style)))
      return false
    return true
  }

  return groups
    .map(([category, entries]) => [category, entries.filter(matches)] as [string, SeasonEntry[]])
    .filter(([, entries]) => entries.length > 0)
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run 'app/seasons/[slug]/__tests__/' && yarn tsc --noEmit`
Expected: PASS — including the pre-existing `season-entries-live-obtained.test.ts`, which must be unaffected.

- [ ] **Step 5: Commit**

```bash
git add 'app/seasons/[slug]/season-entries.ts' 'app/seasons/[slug]/__tests__/season-entries-filters.test.ts'
git commit -m "feat(seasons): add obtained/rarity/style filter predicate"
```

---

### Task 3: SeasonFilterProvider hydration and persistence

**Files:**

- Modify: `app/seasons/[slug]/season-filter-context.tsx`
- Test: `app/seasons/[slug]/__tests__/season-filter-context.test.tsx`

**Interfaces:**

- Consumes: `DEFAULT_PREFERENCES` (Task 1), `SeasonFilters` (Task 2), `savePreferences` from `lib/save-preferences.ts`.
- Produces: `useSeasonFilter()` returning the existing five flags and their handlers plus `density: 'standard' | 'compact'`, `onDensityChange(d)`, `filters: SeasonFilters`, `onFiltersChange(updates: Partial<SeasonFilters>)`, `onClearFilters()`, `hasActiveFilters: boolean`. `useSeasonFilterOptional()` keeps its current non-throwing behaviour.

- [ ] **Step 1: Write the failing test**

Create `app/seasons/[slug]/__tests__/season-filter-context.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { SeasonFilterProvider, useSeasonFilter } from '../season-filter-context'

const save = vi.fn(() => Promise.resolve())
vi.mock('@/lib/save-preferences', () => ({ savePreferences: (u: unknown) => save(u) }))

function Probe() {
  const { hideEvolutions, density, filters, onDensityChange, onFiltersChange } = useSeasonFilter()
  return (
    <div>
      <span data-testid="evo">{String(hideEvolutions)}</span>
      <span data-testid="density">{density}</span>
      <span data-testid="rarity">{String(filters.rarity)}</span>
      <button onClick={() => onDensityChange('compact')}>density</button>
      <button onClick={() => onFiltersChange({ rarity: 5 })}>rarity</button>
    </div>
  )
}

beforeEach(() => save.mockClear())

describe('SeasonFilterProvider', () => {
  it('defaults evolutions to hidden and density to standard', () => {
    render(
      <SeasonFilterProvider isLoggedIn={false}>
        <Probe />
      </SeasonFilterProvider>
    )
    expect(screen.getByTestId('evo')).toHaveTextContent('true')
    expect(screen.getByTestId('density')).toHaveTextContent('standard')
  })

  it('hydrates from passed-in preferences', () => {
    render(
      <SeasonFilterProvider
        isLoggedIn
        preferences={{ season_hide_evolutions: false, season_density: 'compact' }}
      >
        <Probe />
      </SeasonFilterProvider>
    )
    expect(screen.getByTestId('evo')).toHaveTextContent('false')
    expect(screen.getByTestId('density')).toHaveTextContent('compact')
  })

  it('persists a density change for a signed-in user', () => {
    render(
      <SeasonFilterProvider isLoggedIn>
        <Probe />
      </SeasonFilterProvider>
    )
    act(() => screen.getByText('density').click())
    expect(save).toHaveBeenCalledWith({ season_density: 'compact' })
  })

  it('does not persist for a signed-out user', () => {
    render(
      <SeasonFilterProvider isLoggedIn={false}>
        <Probe />
      </SeasonFilterProvider>
    )
    act(() => screen.getByText('rarity').click())
    expect(save).not.toHaveBeenCalled()
    expect(screen.getByTestId('rarity')).toHaveTextContent('5')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run 'app/seasons/[slug]/__tests__/season-filter-context.test.tsx'`
Expected: FAIL — `SeasonFilterProvider` takes no `isLoggedIn` / `preferences` props and exposes no `density`.

- [ ] **Step 3: Rewrite the provider**

Rewrite `app/seasons/[slug]/season-filter-context.tsx`. Keep the existing five flags and handler names so current call sites compile unchanged; add the new state. Key points:

```tsx
'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { savePreferences } from '@/lib/save-preferences'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import type { UserPreferences } from '@/lib/types/eureka'
import type { SeasonFilters } from './season-entries'

// A failed preference write must not disrupt filtering — the user's choices
// still apply for this session, they just may not persist across a reload.
// Mirrors app/outfits/outfit-data-provider.tsx.
const persistFailed = (err: unknown) => {
  console.error('Failed to persist season preferences:', err)
}
```

The provider signature becomes:

```tsx
export function SeasonFilterProvider({
  children,
  isLoggedIn = false,
  preferences,
}: {
  children: React.ReactNode
  isLoggedIn?: boolean
  preferences?: Partial<UserPreferences>
})
```

Each state initialises from `preferences?.<key> ?? DEFAULT_PREFERENCES.<key>`. Each setter persists when signed in:

```tsx
const onHideEvolutionsChange = useCallback(() => {
  setHideEvolutions((prev) => {
    const next = !prev
    if (isLoggedIn) void savePreferences({ season_hide_evolutions: next }).catch(persistFailed)
    return next
  })
}, [isLoggedIn])
```

`filters` is `SeasonFilters`, initialised from the stored columns — `season_style_filter` is comma-joined text, so split it: `preferences?.season_style_filter ? preferences.season_style_filter.split(',').filter(Boolean) : []`. `onFiltersChange` merges and persists the joined form: `season_style_filter: next.styles.length ? next.styles.join(',') : null`.

`hasActiveFilters` is true when any hide-flag differs from its default, density is not `'standard'`, or any axis is set.

- [ ] **Step 4: Pass preferences in from the layout**

`app/seasons/layout.tsx` already reads `getUserID()`. `getPreferences` takes the
user id and is only meaningful when signed in (`hooks/data/preferences.ts:7` —
`getPreferences(user_id: string)`), so guard it:

```tsx
const userId = await getUserID()
const preferences = userId ? await getPreferences(userId) : undefined
```

Pass `isLoggedIn={!!userId}` and `preferences` into `SeasonFilterProvider`.

The provider is currently mounted in `app/seasons/[slug]/page.tsx`, not the
layout. Move it to the layout, wrapping the existing providers' children, so the
toolbar — rendered by `SlugToolBar`, outside the page — sits inside it. Without
this move the filter button cannot read the context.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run 'app/seasons/[slug]/__tests__/' && yarn tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'app/seasons/[slug]/season-filter-context.tsx' 'app/seasons/[slug]/__tests__/season-filter-context.test.tsx' app/seasons/layout.tsx 'app/seasons/[slug]/page.tsx'
git commit -m "feat(seasons): persist season filter state per user"
```

---

### Task 4: Season filter body and the FilterMenu branch

**Files:**

- Create: `components/filter/season-filter-body.tsx`
- Modify: `components/filter/filter-menu.tsx` (add `isSeasons` beside `isOutfits`/`isMakeup`, ~line 130)
- Delete: `app/seasons/[slug]/season-visibility-menu.tsx`
- Modify: `components/navbar/slug-toolbar.tsx` (drop the `SeasonVisibilityMenu` import and render)

**Interfaces:**

- Consumes: `useSeasonFilter()` (Task 3), `DensityToggle`, `ObtainedToggle`, `RarityToggle`, `StyleLabelSelect`.
- Produces: `export default function SeasonFilterBody()` — renders the panel contents only; `FilterMenu` supplies the toolbar button and `SidebarBody` wrapper.

- [ ] **Step 1: Write the component**

Create `components/filter/season-filter-body.tsx`. It renders, in order: `DensityToggle` (from `useSeasonFilter().density`), the five visibility switches, `ObtainedToggle`, `RarityToggle`, `StyleLabelSelect`, and Clear all / Reset buttons. Widget signatures, copied exactly:

```tsx
<ObtainedToggle
  selectedObtainedFilter={filters.obtained}
  onObtainedFilterChange={(_e, next) => onFiltersChange({ obtained: next })}
/>
<RarityToggle
  selectedRarity={filters.rarity}
  onRarityChange={(_e, next) => onFiltersChange({ rarity: next })}
/>
<StyleLabelSelect
  id="season-style"
  label="Style"
  options={styles}
  selected={filters.styles}
  onChange={(next) => onFiltersChange({ styles: next })}
/>
<DensityToggle density={density} setDensity={onDensityChange} />
```

`styles` comes from `useOutfitData().styles`, already available on the season page.

- [ ] **Step 2: Add the branch to FilterMenu**

In `components/filter/filter-menu.tsx`, beside the existing `isOutfits` / `isMakeup` constants:

```tsx
const isSeasons = pathname.startsWith('/seasons/')
```

and, before the `isOutfits` branch, a block that renders the toolbar `IconButton` (same shape as the outfits branch, `aria-label={sidebarOpen ? 'Hide filters' : 'Show filters'}`) plus `<SidebarBody><SeasonFilterBody /></SidebarBody>`. The body lives in its own file so this 696-line file does not grow a third large branch inline.

- [ ] **Step 3: Delete the visibility menu**

```bash
git rm 'app/seasons/[slug]/season-visibility-menu.tsx'
```

and remove its import and render from `components/navbar/slug-toolbar.tsx`.

- [ ] **Step 4: Verify**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: tsc silent, no new lint warnings, all tests pass.

Then `yarn dev`, open a season page, and confirm: the filter button opens the sidebar; each of the five visibility switches changes the grid; density switches the card size; obtained / rarity / style narrow the sections; a reload preserves every choice.

- [ ] **Step 5: Commit**

```bash
git add components/filter/season-filter-body.tsx components/filter/filter-menu.tsx components/navbar/slug-toolbar.tsx
git commit -m "feat(seasons): replace the visibility dropdown with a filter panel"
```

---

### Task 5: Contents sidebar

**Files:**

- Create: `app/seasons/[slug]/season-contents.tsx`
- Modify: `app/seasons/[slug]/season-outfit-list.tsx` (add a section id per category)
- Modify: `app/seasons/[slug]/page.tsx` (render `<SeasonContents />`)

**Interfaces:**

- Consumes: `groupSeasonEntries`, `applySeasonFilters`, `countEntryKinds` (Tasks 0 and 2), `CompositionCounts` from `@/components/seasons/composition-counts`.
- Produces: `export function seasonSectionId(category: string): string` exported from `season-outfit-list.tsx`, used by both the list and the sidebar so the anchor can never drift.

- [ ] **Step 1: Add the shared id helper and section ids**

In `app/seasons/[slug]/season-outfit-list.tsx`:

```tsx
/** Anchor id for a category's section. Shared with the contents sidebar so the
 *  link target and the rendered section can never drift apart. */
export function seasonSectionId(category: string) {
  return `season-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}
```

Put `id={seasonSectionId(category)}` and `scrollMarginTop: 72` (clearing the sticky app bar) on the per-category `<Stack>`.

- [ ] **Step 2: Write the contents sidebar**

Create `app/seasons/[slug]/season-contents.tsx` — a `'use client'` component rendering `<SidebarBody>` with a `List` of the categories from the same `groupSeasonEntries` + `applySeasonFilters` call the list uses, each row a `ListItemButton` showing the category title and `<CompositionCounts outfits={...} pieces={...} />`, with:

```tsx
onClick={() => {
  document.getElementById(seasonSectionId(category))?.scrollIntoView({ behavior: 'smooth' })
}}
```

Because it derives from the same grouped output, a category hidden by a filter disappears from the TOC too.

- [ ] **Step 3: Mount it**

Render `<SeasonContents ... />` in `app/seasons/[slug]/page.tsx` beside `SeasonOutfitList`, passing the same props.

- [ ] **Step 4: Verify**

Run: `yarn tsc --noEmit && yarn test`
Then in `yarn dev`: the contents button opens the sidebar, clicking a row scrolls to that section with the heading clear of the app bar, opening the filter panel replaces the contents panel, and filtering removes rows from both.

- [ ] **Step 5: Commit**

```bash
git add 'app/seasons/[slug]/season-contents.tsx' 'app/seasons/[slug]/season-outfit-list.tsx' 'app/seasons/[slug]/page.tsx'
git commit -m "feat(seasons): add a contents sidebar for category navigation"
```

---

### Task 6: Toolbar buttons

**Files:**

- Modify: `components/navbar/slug-toolbar.tsx`

**Interfaces:**

- Consumes: `useSeasonFilterOptional()`, `ImageModeButton`, `SortButton` from `@/components/navbar/appbar-actions`.
- Produces: nothing downstream.

- [ ] **Step 1: Add the buttons**

In `components/navbar/slug-toolbar.tsx`, extend `showImageSwap` to include seasons:

```tsx
const showImageSwap =
  isMakeupSlug ||
  pathname.startsWith('/outfits/') ||
  pathname.startsWith('/momo-cloaks/') ||
  pathname.startsWith('/seasons/')
```

and, inside the existing `seasonFilter &&` guard, render `<SortButton />` alongside the contents button. `ImageModeButton` then comes from the `showImageSwap` branch already present — do not add a second one, or the season page gets two image toggles (the mistake `DensityToggle`'s comment records for /makeup).

- [ ] **Step 2: Verify**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Then in `yarn dev` on a season page: exactly one image toggle, and it swaps card art; the sort button reverses category order; both persist across a reload.

- [ ] **Step 3: Commit**

```bash
git add components/navbar/slug-toolbar.tsx
git commit -m "feat(seasons): add alt-image and sort buttons to the season toolbar"
```

---

### Task 7: Promote the migration and open the PR

- [ ] **Step 1: Full verification**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: tsc silent, lint clean apart from the pre-existing `app/settings/account-settings.tsx` nested-ternary warning, all tests pass.

- [ ] **Step 2: Apply the migration to production**

Only after the preview branch has been exercised. Confirm the nine columns exist and that an existing user's first load is unchanged — `season_hide_evolutions` / `season_hide_glowups` must read `true`.

- [ ] **Step 3: Open the PR**

Load the `git-workflow` skill, push the branch, and open a PR describing: the nine columns and why they are season-scoped rather than shared with outfits, the new filter axes, the contents sidebar, and the toolbar buttons. Note in the body that the migration is already applied.

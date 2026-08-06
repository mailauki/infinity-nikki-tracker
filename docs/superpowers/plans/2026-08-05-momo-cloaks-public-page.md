# Public Momo's Cloaks Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `ComingSoon` stub at `/momo-cloaks` with a filterable card grid of all 119 cloaks plus a detail page, wiring up the already-built data layer.

**Architecture:** Server Components fetch cloaks + obtained rows and pass them as props to a client provider (there is no `/api/momo-cloaks` bootstrap route and none is being added — 119 rows render fine server-side). The provider holds filter state, hydrates it from `/api/preferences`, and persists changes via `savePreferences()`. A dedicated `MomoCloakFilterMenu` is used rather than the shared `FilterMenu`.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, Supabase, notistack.

## Global Constraints

- **Package manager is Yarn.** Never npm or pnpm.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100 char width.
- **Path alias `@/`** maps to project root.
- **Never wrap a mutation in React `cache()`** — it silently no-ops on repeat calls.
- **Auth-dependent hooks use React `cache()`**, not `use cache` (they call `cookies()`).
- **Preference writes must NOT use a Server Action.** Use `savePreferences()` from
  `lib/save-preferences.ts`. See "Why not a Server Action" below.
- **MUI `Stack`** does not accept `justifyContent`/`alignItems` as direct props — put them in `sx`.
- **Avoid `useState` + `useEffect` for derived data** — compute during render.
- **`git add` with `[slug]` paths must be quoted** in zsh: `git add 'app/momo-cloaks/[slug]/page.tsx'`.
- **Cloak title prefix** is `MOMO_CLOAK_TITLE_PREFIX` = `'Momo’s Cloak: '` with a U+2019 apostrophe.
- Run `yarn tsc --noEmit` and `yarn lint` before every commit. There is **no test framework** in
  this repo — verification is type-check, lint, build, and manual browser checks.

### Why not a Server Action (read before Task 4)

`app/actions/preferences.ts` carries this warning, echoed in `lib/save-preferences.ts` and
`app/api/preferences/route.ts`:

> A Server Action that sets cookies — which the Supabase SSR client does whenever it refreshes a
> session — marks its response as revalidated. That invalidates the client router cache, which
> remounts the data provider and refires its fetch on every single preference toggle.

The existing `EurekaDataProvider` uses Server Actions (`updateEurekaFilters`) because its remount is
cheap. **Do not copy that part.** Cloak filters go through `savePreferences()` → `POST /api/preferences`.

---

## File Structure

**Create:**

| File                                                         | Responsibility                        |
| ------------------------------------------------------------ | ------------------------------------- |
| `supabase/migrations/<ts>_momo_cloak_filter_preferences.sql` | 4 new preference columns              |
| `app/momo-cloaks/momo-cloak-context.tsx`                     | Context + `FilterState` + defaults    |
| `app/momo-cloaks/momo-cloak-data-provider.tsx`               | Client state, prefs hydration, toggle |
| `app/momo-cloaks/momo-cloak-filter-menu.tsx`                 | Cloak-specific filter drawer          |
| `app/momo-cloaks/momo-cloak-toolbar.tsx`                     | Toolbar slot hosting the filter menu  |
| `app/momo-cloaks/filter-momo-cloaks.tsx`                     | Filter pipeline + card grid           |
| `app/momo-cloaks/loading.tsx`                                | Skeleton                              |
| `app/momo-cloaks/layout.tsx`                                 | Server data fetch + provider wrap     |
| `app/momo-cloaks/[slug]/page.tsx`                            | Detail route                          |
| `app/momo-cloaks/[slug]/momo-cloak-detail.tsx`               | Detail body                           |

**Modify:**

| File                                  | Change                                      |
| ------------------------------------- | ------------------------------------------- |
| `app/api/preferences/route.ts`        | +4 `WRITABLE_KEYS`, +4 `PREFERENCE_COLUMNS` |
| `lib/preferences.ts`                  | +4 defaults (`null`)                        |
| `lib/types/eureka.ts`                 | +4 fields on `UserPreferences`              |
| `lib/types/supabase.ts`               | Regenerated                                 |
| `hooks/data/momo-cloaks.ts`           | `getMomoCloak` resolves `outfitSet`         |
| `components/filter/rarity-toggle.tsx` | Optional `options` prop                     |
| `app/momo-cloaks/page.tsx`            | Replace `ComingSoon`                        |

---

### Task 1: Preference columns end-to-end

Adds the 4 columns and the 4 lockstep updates. These ship together because a column that isn't in
all four places is silently unreadable — a reviewer cannot meaningfully accept one without the rest.

**Files:**

- Create: `supabase/migrations/<timestamp>_momo_cloak_filter_preferences.sql`
- Modify: `app/api/preferences/route.ts`, `lib/preferences.ts`, `lib/types/eureka.ts`, `lib/types/supabase.ts`

**Interfaces:**

- Produces: 4 nullable text columns on `user_preferences` — `momo_rarity_filter`,
  `momo_season_filter`, `momo_season_category_filter`, `momo_obtained_filter`. All 4 become
  readable fields on the `UserPreferences` type and writable keys on `POST /api/preferences`.

- [ ] **Step 1: Create the migration file**

Name it with a current UTC timestamp, e.g. `supabase/migrations/20260805120000_momo_cloak_filter_preferences.sql`:

```sql
-- Filter persistence for the public /momo-cloaks page. Nullable with no default,
-- matching every existing filter column: null means "no filter applied".
alter table user_preferences
  add column if not exists momo_rarity_filter text,
  add column if not exists momo_season_filter text,
  add column if not exists momo_season_category_filter text,
  add column if not exists momo_obtained_filter text;
```

No RLS change — the existing per-user policies on `user_preferences` already cover new columns.

- [ ] **Step 2: Push the migration**

Run: `supabase db push --include-all`
Expected: applies cleanly. If local migrations predate the remote, `--include-all` is required.

- [ ] **Step 3: Regenerate Supabase types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Expected: `lib/types/supabase.ts` now lists the 4 `momo_*` columns on `user_preferences`.

- [ ] **Step 4: Add the 4 fields to `UserPreferences`**

In `lib/types/eureka.ts`, the `UserPreferences` type is a `Pick<Tables<'user_preferences'>, ...>`.
Add these 4 entries to the union (after `'outfit_sort_axis'`):

```ts
  | 'momo_rarity_filter'
  | 'momo_season_filter'
  | 'momo_season_category_filter'
  | 'momo_obtained_filter'
```

- [ ] **Step 5: Add the 4 defaults**

In `lib/preferences.ts`, add to `DEFAULT_PREFERENCES` (after `outfit_sort_axis: 'date',`):

```ts
  momo_rarity_filter: null,
  momo_season_filter: null,
  momo_season_category_filter: null,
  momo_obtained_filter: null,
```

- [ ] **Step 6: Add the 4 keys to the API route**

In `app/api/preferences/route.ts`, add to the `WRITABLE_KEYS` set (after `'outfit_sort_axis',`):

```ts
  'momo_rarity_filter',
  'momo_season_filter',
  'momo_season_category_filter',
  'momo_obtained_filter',
```

Then append the same 4 names to the `PREFERENCE_COLUMNS` string. It is a single comma-separated
string; the last existing entry is `outfit_sort_axis`, so it becomes:

```ts
'... , sort_order, outfit_sort_axis, momo_rarity_filter, momo_season_filter, momo_season_category_filter, momo_obtained_filter'
```

Miss this and clients read `undefined` while writes appear to succeed.

- [ ] **Step 7: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. A missing field in `DEFAULT_PREFERENCES` surfaces here as a type error, because
`DEFAULT_PREFERENCES` is annotated `: UserPreferences`.

- [ ] **Step 8: Verify the round-trip manually**

Run `yarn dev`, log in, then in the browser console:

```js
await fetch('/api/preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ momo_rarity_filter: '5' }),
}).then((r) => r.json())
// Expected: { ok: true }

await fetch('/api/preferences').then((r) => r.json())
// Expected: the returned object includes momo_rarity_filter: '5'
```

If the second call shows `undefined`, `PREFERENCE_COLUMNS` was missed in Step 6.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations lib/types/supabase.ts lib/types/eureka.ts lib/preferences.ts app/api/preferences/route.ts
git commit -m "feat(momo-cloaks): add filter preference columns

Four nullable text columns on user_preferences for the public cloaks
page, plus the four lockstep updates a new preference column needs:
WRITABLE_KEYS and PREFERENCE_COLUMNS in the route, DEFAULT_PREFERENCES,
and the UserPreferences type. Missing any one of them makes the column
silently read as undefined.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `RarityToggle` options prop

**Files:**

- Modify: `components/filter/rarity-toggle.tsx`

**Interfaces:**

- Produces: `RarityToggle` accepts an optional `options?: number[]` prop, defaulting to
  `[2, 3, 4, 5]`. Existing callers (eureka + outfits in `filter-menu.tsx`) are unaffected.

- [ ] **Step 1: Add the prop**

`components/filter/rarity-toggle.tsx` currently hardcodes `([2, 3, 4, 5] as const)`. No cloak has
rarity 2, so that button would be permanently dead on the cloaks page. Replace the component with:

```tsx
import { SparkleIcon } from '@/components/rarity-stars'
import { FormControl, ToggleButton, ToggleButtonGroup } from '@mui/material'
import ToggleGroupLabel from '../forms/toggle-group-label'

// Rarity values offered when a caller doesn't narrow them. Cloaks pass [3, 4, 5]
// because no cloak has rarity 2 and a dead toggle button is worse than none.
const DEFAULT_RARITY_OPTIONS = [2, 3, 4, 5]

export default function RarityToggle({
  selectedRarity,
  onRarityChange,
  options = DEFAULT_RARITY_OPTIONS,
}: {
  selectedRarity: number | null
  onRarityChange: (event: React.MouseEvent<HTMLElement>, value: number | null) => void
  options?: number[]
}) {
  return (
    <FormControl>
      <ToggleGroupLabel id="rating-buttons-group-label">Rarity</ToggleGroupLabel>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="rating-buttons-group-label"
        value={selectedRarity}
        onChange={onRarityChange}
      >
        {options.map((rarity) => (
          <ToggleButton key={rarity} sx={{ py: 1.25 }} value={rarity}>
            {rarity}
            <SparkleIcon color="inherit" fontSize="inherit" sx={{ rotate: '15deg', ml: 0.5 }} />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. Both existing call sites in `components/filter/filter-menu.tsx` omit `options`, so
they keep the `[2, 3, 4, 5]` behavior.

- [ ] **Step 3: Commit**

```bash
git add components/filter/rarity-toggle.tsx
git commit -m "refactor(filter): let RarityToggle narrow its rarity options

Defaults to the current [2, 3, 4, 5] so eureka and outfits are
unchanged. Cloaks pass [3, 4, 5] — no cloak has rarity 2.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Context and filter state

**Files:**

- Create: `app/momo-cloaks/momo-cloak-context.tsx`

**Interfaces:**

- Consumes: `MomoCloak` from `@/lib/types/momo`, `ObtainedFilter` from `@/lib/types/props`.
- Produces:
  - `MomoCloakFilterState` — `{ selectedRarity: number | null; selectedSeason: string[]; selectedSeasonCategory: string[]; selectedObtainedFilter: ObtainedFilter | null }`
  - `DEFAULT_MOMO_FILTERS: MomoCloakFilterState`
  - `MomoCloakDataContext`, and `useMomoCloakData(): MomoCloakDataContextValue`
  - Context value fields: `cloaks`, `obtainedSlugs: Set<string>`, `isLoggedIn`, `isObtainedError`,
    `filters`, `onFiltersChange`, `onClearFilters`, `onToggleObtained`.

- [ ] **Step 1: Write the context file**

```tsx
'use client'

import { createContext, useContext } from 'react'

import { MomoCloak } from '@/lib/types/momo'
import { ObtainedFilter } from '@/lib/types/props'

// Season and season-category are multi-select (11 and 3 distinct values in the
// data) so they mirror the outfits page's string[] shape. Rarity and obtained are
// exclusive toggles, matching eureka.
export interface MomoCloakFilterState {
  selectedRarity: number | null
  selectedSeason: string[]
  selectedSeasonCategory: string[]
  selectedObtainedFilter: ObtainedFilter | null
}

export const DEFAULT_MOMO_FILTERS: MomoCloakFilterState = {
  selectedRarity: null,
  selectedSeason: [],
  selectedSeasonCategory: [],
  selectedObtainedFilter: null,
}

interface MomoCloakDataContextValue {
  cloaks: MomoCloak[]
  /** Slugs of cloaks the signed-in user has obtained. O(1) lookups. */
  obtainedSlugs: Set<string>
  isLoggedIn: boolean
  /** The cloaks themselves loaded, but the obtained rows failed — toggles disabled. */
  isObtainedError: boolean
  filters: MomoCloakFilterState
  onFiltersChange: (updates: Partial<MomoCloakFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (slug: string) => void
}

export const MomoCloakDataContext = createContext<MomoCloakDataContextValue>({
  cloaks: [],
  obtainedSlugs: new Set(),
  isLoggedIn: false,
  isObtainedError: false,
  filters: DEFAULT_MOMO_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
})

export function useMomoCloakData() {
  return useContext(MomoCloakDataContext)
}
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/momo-cloaks/momo-cloak-context.tsx
git commit -m "feat(momo-cloaks): add filter state context

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Data provider

**Files:**

- Create: `app/momo-cloaks/momo-cloak-data-provider.tsx`

**Interfaces:**

- Consumes: `MomoCloakFilterState`, `DEFAULT_MOMO_FILTERS`, `MomoCloakDataContext` (Task 3);
  `handleObtainedMomoCloak` from `@/app/momo-cloaks/actions`; `savePreferences` from
  `@/lib/save-preferences`; `fetchPreferencesOnce` from `@/lib/preferences-cache`.
- Produces: default-exported `MomoCloakDataProvider` with props
  `{ cloaks: MomoCloak[]; obtainedSlugs: string[]; isLoggedIn: boolean; isObtainedError?: boolean; children: React.ReactNode }`.

- [ ] **Step 1: Write the provider**

Note three deliberate departures from `EurekaDataProvider`:
data arrives as **props** (no bootstrap route); persistence uses **`savePreferences`**, not a
Server Action; and there is **no realtime subscription** (the app moved off `postgres_changes` for
new work).

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { enqueueSnackbar } from 'notistack'

import { handleObtainedMomoCloak } from '@/app/momo-cloaks/actions'
import { fetchPreferencesOnce } from '@/lib/preferences-cache'
import { savePreferences } from '@/lib/save-preferences'
import { MomoCloak } from '@/lib/types/momo'
import { ObtainedFilter } from '@/lib/types/props'

import {
  DEFAULT_MOMO_FILTERS,
  MomoCloakDataContext,
  MomoCloakFilterState,
} from './momo-cloak-context'

export default function MomoCloakDataProvider({
  cloaks,
  obtainedSlugs: initialObtained,
  isLoggedIn,
  isObtainedError = false,
  children,
}: {
  cloaks: MomoCloak[]
  obtainedSlugs: string[]
  isLoggedIn: boolean
  isObtainedError?: boolean
  children: React.ReactNode
}) {
  const [obtainedSlugs, setObtainedSlugs] = useState<Set<string>>(() => new Set(initialObtained))
  const [filters, setFilters] = useState<MomoCloakFilterState>(DEFAULT_MOMO_FILTERS)

  // Gates the persistence effect below: without it, the effect fires on mount
  // with DEFAULT_MOMO_FILTERS and overwrites the user's saved filters with nulls
  // before the hydrate fetch has even landed.
  const prefsLoaded = useRef(false)

  useEffect(() => {
    if (!isLoggedIn) return
    fetchPreferencesOnce()
      .then((prefs) => {
        setFilters({
          selectedRarity: prefs.momo_rarity_filter
            ? Number(prefs.momo_rarity_filter) || null
            : null,
          selectedSeason: prefs.momo_season_filter
            ? prefs.momo_season_filter.split(',').filter(Boolean)
            : [],
          selectedSeasonCategory: prefs.momo_season_category_filter
            ? prefs.momo_season_category_filter.split(',').filter(Boolean)
            : [],
          selectedObtainedFilter: (prefs.momo_obtained_filter as ObtainedFilter) ?? null,
        })
        prefsLoaded.current = true
      })
      .catch(() => {
        // A failed preference read is not fatal — fall back to defaults and still
        // allow subsequent writes.
        prefsLoaded.current = true
      })
  }, [isLoggedIn])

  // Persist filters whenever they change, after hydration. savePreferences —
  // NOT a Server Action: a cookie-setting action would mark its response
  // revalidated, remount this provider, and refire on every toggle.
  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded.current) return
    savePreferences({
      momo_rarity_filter: filters.selectedRarity ? String(filters.selectedRarity) : null,
      momo_season_filter: filters.selectedSeason.length ? filters.selectedSeason.join(',') : null,
      momo_season_category_filter: filters.selectedSeasonCategory.length
        ? filters.selectedSeasonCategory.join(',')
        : null,
      momo_obtained_filter: filters.selectedObtainedFilter,
    }).catch((err) => {
      // Non-blocking: the filter still applies in-session.
      console.error('Failed to persist momo cloak filters:', err)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleFiltersChange = (updates: Partial<MomoCloakFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_MOMO_FILTERS)
  }

  const handleToggleObtained = async (slug: string) => {
    const saved = obtainedSlugs
    setObtainedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
    try {
      await handleObtainedMomoCloak(slug)
    } catch (err) {
      console.error('Failed to toggle obtained momo cloak:', err)
      setObtainedSlugs(saved)
      enqueueSnackbar('Failed to update your collection. Please try again.', { variant: 'error' })
    }
  }

  return (
    <MomoCloakDataContext.Provider
      value={{
        cloaks,
        obtainedSlugs,
        isLoggedIn,
        isObtainedError,
        filters,
        onFiltersChange: handleFiltersChange,
        onClearFilters: handleClearFilters,
        onToggleObtained: handleToggleObtained,
      }}
    >
      {children}
    </MomoCloakDataContext.Provider>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/momo-cloaks/momo-cloak-data-provider.tsx
git commit -m "feat(momo-cloaks): add data provider with persisted filters

Filters persist through savePreferences() -> POST /api/preferences
rather than a Server Action: a cookie-setting action marks its response
revalidated, which would remount this provider on every toggle.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Filter menu and toolbar

**Files:**

- Create: `app/momo-cloaks/momo-cloak-filter-menu.tsx`, `app/momo-cloaks/momo-cloak-toolbar.tsx`

**Interfaces:**

- Consumes: `useMomoCloakData()` (Task 3); `RarityToggle` with `options` (Task 2);
  `ObtainedToggle`, `StyleLabelSelect`, `SidebarBody`, `useSidebar`, `ToolbarSlot`.
- Produces: default-exported `MomoCloakFilterMenu` and `MomoCloakToolBar` (no props).

**Why a separate menu:** the shared `components/filter/filter-menu.tsx` calls **both**
`useEurekaData()` and `useOutfitData()` unconditionally at the top of its body and branches on
`pathname`. Reusing it on `/momo-cloaks` would mean mounting the Eureka and Outfit providers on this
route. Both contexts do have safe defaults, so it would not crash — but it would silently render
eureka controls wired to empty arrays. A dedicated menu is correct here.

- [ ] **Step 1: Write the filter menu**

`StyleLabelSelect` takes `options: { slug: string; title: string | null }[]`. Season and
season-category options are derived from the loaded cloaks — no extra query.

```tsx
'use client'

import { useMemo } from 'react'
import { Button, Divider, IconButton, List, ListItem, Stack } from '@mui/material'
import { FilterList } from '@mui/icons-material'

import ObtainedToggle from '@/components/filter/obtained-toggle'
import RarityToggle from '@/components/filter/rarity-toggle'
import StyleLabelSelect from '@/components/filter/style-label-select'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SidebarBody from '@/components/sidebar/sidebar-body'

import { useMomoCloakData } from './momo-cloak-context'

// Every rarity present in the cloak data. No cloak has rarity 2, so the shared
// default of [2, 3, 4, 5] would render a permanently dead button.
const CLOAK_RARITY_OPTIONS = [3, 4, 5]

export default function MomoCloakFilterMenu() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { cloaks, isLoggedIn, isObtainedError, filters, onFiltersChange, onClearFilters } =
    useMomoCloakData()

  const { selectedRarity, selectedSeason, selectedSeasonCategory, selectedObtainedFilter } = filters

  // Options come from the values actually present on the loaded cloaks, so a
  // season with no cloaks never appears as a dead choice.
  const seasonOptions = useMemo(() => {
    const slugs = [...new Set(cloaks.map((c) => c.seasons).filter((s): s is string => !!s))]
    return slugs.sort().map((slug) => ({ slug, title: slug }))
  }, [cloaks])

  const seasonCategoryOptions = useMemo(() => {
    const slugs = [...new Set(cloaks.map((c) => c.season_category).filter((s): s is string => !!s))]
    return slugs.sort().map((slug) => ({ slug, title: slug }))
  }, [cloaks])

  const hasActiveFilters =
    selectedRarity !== null ||
    selectedSeason.length > 0 ||
    selectedSeasonCategory.length > 0 ||
    selectedObtainedFilter !== null

  return (
    <>
      <IconButton
        aria-label="Filter cloaks"
        color={sidebarOpen ? 'primary' : 'default'}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FilterList />
      </IconButton>
      <SidebarBody>
        <List>
          {isLoggedIn && (
            <ListItem>
              <ObtainedToggle
                disabled={isObtainedError}
                selectedObtainedFilter={selectedObtainedFilter}
                onObtainedFilterChange={(_e, v) => onFiltersChange({ selectedObtainedFilter: v })}
              />
            </ListItem>
          )}
          <ListItem>
            <RarityToggle
              options={CLOAK_RARITY_OPTIONS}
              selectedRarity={selectedRarity}
              onRarityChange={(_e, v) => onFiltersChange({ selectedRarity: v })}
            />
          </ListItem>
          <ListItem sx={{ gap: 1 }}>
            <StyleLabelSelect
              id="momo-season-select"
              label="Season"
              options={seasonOptions}
              selected={selectedSeason}
              onChange={(next) => onFiltersChange({ selectedSeason: next })}
            />
            <StyleLabelSelect
              id="momo-season-category-select"
              label="Season Category"
              options={seasonCategoryOptions}
              selected={selectedSeasonCategory}
              onChange={(next) => onFiltersChange({ selectedSeasonCategory: next })}
            />
          </ListItem>
          <Divider sx={{ mx: 2, mt: 2 }} />
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
              {hasActiveFilters && (
                <Button color="secondary" variant="outlined" onClick={onClearFilters}>
                  Clear all
                </Button>
              )}
              <Button variant="contained" onClick={() => setSidebarOpen(false)}>
                Apply
              </Button>
            </Stack>
          </ListItem>
        </List>
      </SidebarBody>
    </>
  )
}
```

- [ ] **Step 2: Write the toolbar**

```tsx
'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'

import MomoCloakFilterMenu from './momo-cloak-filter-menu'

export default function MomoCloakToolBar() {
  return (
    <ToolbarSlot>
      <MomoCloakFilterMenu />
    </ToolbarSlot>
  )
}
```

No `SortButton` — sorting is out of scope; cloaks render title-ascending as `getMomoCloaks()` returns them.

- [ ] **Step 3: Verify the imports resolve**

Run: `yarn tsc --noEmit`
Expected: clean. If `@/components/sidebar/sidebar-body` or
`@/components/navbar/navbar-toolbar-context` fails to resolve, re-check the exact paths used by
`components/filter/filter-menu.tsx` and match them — do not invent a path.

- [ ] **Step 4: Lint and commit**

```bash
yarn lint
git add app/momo-cloaks/momo-cloak-filter-menu.tsx app/momo-cloaks/momo-cloak-toolbar.tsx
git commit -m "feat(momo-cloaks): add filter menu and toolbar

A dedicated menu rather than the shared FilterMenu, which reads both the
eureka and outfit contexts unconditionally and would need both providers
mounted on this route.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Filter pipeline and grid

**Files:**

- Create: `app/momo-cloaks/filter-momo-cloaks.tsx`, `app/momo-cloaks/loading.tsx`

**Interfaces:**

- Consumes: `useMomoCloakData()` (Task 3); `SetCard`, `CardGrid`, `LoginAlert`, `ProgressChip`.
- Produces: default-exported `FilterMomoCloaks` and `MomoCloaksLoading` (both no props).

- [ ] **Step 1: Write the grid**

`SetCard` maps a boolean onto its count API: its toggle compares `obtained === total`, so
`total={1}` with `obtained={0 | 1}` works unchanged. `SetCard` requires `in` (a transition flag) and
`onToggle`; pass `in={true}` since there is no exit animation here.

```tsx
'use client'

import { useMemo } from 'react'
import { Alert, Stack, Typography } from '@mui/material'

import CardGrid from '@/components/card-grid'
import LoginAlert from '@/components/login-alert'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

import { useMomoCloakData } from './momo-cloak-context'

export default function FilterMomoCloaks() {
  const { cloaks, obtainedSlugs, isLoggedIn, isObtainedError, filters } = useMomoCloakData()
  const { onToggleObtained } = useMomoCloakData()
  const { selectedRarity, selectedSeason, selectedSeasonCategory, selectedObtainedFilter } = filters

  const visible = useMemo(
    () =>
      cloaks.filter((cloak) => {
        if (selectedRarity !== null && cloak.rarity !== selectedRarity) return false
        if (selectedSeason.length > 0 && !selectedSeason.includes(cloak.seasons ?? '')) return false
        if (
          selectedSeasonCategory.length > 0 &&
          !selectedSeasonCategory.includes(cloak.season_category ?? '')
        )
          return false
        // The obtained filter is meaningless logged out — every cloak reads as
        // not-obtained — so it only applies for signed-in users.
        if (isLoggedIn && selectedObtainedFilter) {
          const isObtained = obtainedSlugs.has(cloak.slug)
          if (selectedObtainedFilter === 'obtained' && !isObtained) return false
          if (selectedObtainedFilter === 'missing' && isObtained) return false
        }
        return true
      }),
    [
      cloaks,
      obtainedSlugs,
      isLoggedIn,
      selectedRarity,
      selectedSeason,
      selectedSeasonCategory,
      selectedObtainedFilter,
    ]
  )

  const obtainedCount = useMemo(
    () => cloaks.filter((c) => obtainedSlugs.has(c.slug)).length,
    [cloaks, obtainedSlugs]
  )

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      {isObtainedError && (
        <Alert severity="warning">
          We couldn&apos;t load your collection. Cloaks are shown, but tracking is unavailable.
        </Alert>
      )}
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, mt: 1 }}
      >
        <Typography variant="body2">
          {visible.length} of {cloaks.length} cloaks
        </Typography>
        {isLoggedIn && !isObtainedError && (
          <ProgressChip obtained={obtainedCount} total={cloaks.length} size="md" />
        )}
      </Stack>
      {visible.length === 0 ? (
        <Alert severity="info">No cloaks match these filters.</Alert>
      ) : (
        <CardGrid columns="outfit">
          {visible.map((cloak) => {
            const isObtained = obtainedSlugs.has(cloak.slug)
            return (
              <SetCard
                key={cloak.slug}
                in
                href={`/momo-cloaks/${cloak.slug}`}
                imageSrc={cloak.image_url ?? ''}
                isLoggedIn={isLoggedIn && !isObtainedError}
                obtained={isObtained ? 1 : 0}
                rarity={cloak.rarity ?? 0}
                showAlt={false}
                title={cloak.title}
                total={1}
                onToggle={() => onToggleObtained(cloak.slug)}
              />
            )
          })}
        </CardGrid>
      )}
    </>
  )
}
```

- [ ] **Step 2: Write the loading skeleton**

```tsx
import { Skeleton } from '@mui/material'

import CardGrid from '@/components/card-grid'

export default function MomoCloaksLoading() {
  return (
    <CardGrid columns="outfit">
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton
          key={i}
          height={0}
          style={{ paddingBottom: '150%' }}
          sx={{ borderRadius: 1 }}
          variant="rectangular"
          width="100%"
        />
      ))}
    </CardGrid>
  )
}
```

- [ ] **Step 3: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. If `SetCard` rejects a prop, open `components/set-card.tsx` and match its exact
signature rather than casting.

- [ ] **Step 4: Commit**

```bash
git add app/momo-cloaks/filter-momo-cloaks.tsx app/momo-cloaks/loading.tsx
git commit -m "feat(momo-cloaks): add filter pipeline and card grid

SetCard is reused with total=1 and obtained=0|1; its obtained === total
check maps a boolean cleanly onto the count API.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Wire up the grid page

**Files:**

- Create: `app/momo-cloaks/layout.tsx`
- Modify: `app/momo-cloaks/page.tsx`

**Interfaces:**

- Consumes: `getMomoCloaks()`, `getObtainedMomoCloaks(user_id)`, `getUserID()`;
  `MomoCloakDataProvider` (Task 4); `MomoCloakToolBar` (Task 5); `FilterMomoCloaks` (Task 6).
- Produces: a working `/momo-cloaks` route.

- [ ] **Step 1: Write the layout**

The layout fetches server-side and passes props down. `getObtainedMomoCloaks` returns
`ObtainedMomoCloak[]` (`{ id, momo_cloak }`), so map to slugs. `getUserID()` returns `null` when
signed out — guard before calling the user-scoped query.

```tsx
import { Suspense } from 'react'

import { getMomoCloaks } from '@/hooks/data/momo-cloaks'
import { getObtainedMomoCloaks } from '@/hooks/data/obtained-momo-cloaks'
import { getUserID } from '@/hooks/user'

import MomoCloakDataProvider from './momo-cloak-data-provider'
import MomoCloaksLoading from './loading'

async function MomoCloakProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()
  const cloaks = await getMomoCloaks()

  // getUserID() returns null when signed out — never pass that to a user-scoped
  // query. A failed obtained fetch still renders the grid, with toggles disabled.
  let obtainedSlugs: string[] = []
  let isObtainedError = false
  if (userId) {
    try {
      const obtained = await getObtainedMomoCloaks(userId)
      obtainedSlugs = obtained.map((o) => o.momo_cloak).filter((slug): slug is string => !!slug)
    } catch (err) {
      console.error('Failed to load obtained momo cloaks:', err)
      isObtainedError = true
    }
  }

  return (
    <MomoCloakDataProvider
      cloaks={cloaks}
      isLoggedIn={!!userId}
      isObtainedError={isObtainedError}
      obtainedSlugs={obtainedSlugs}
    >
      {children}
    </MomoCloakDataProvider>
  )
}

export default function MomoCloaksLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MomoCloaksLoading />}>
      <MomoCloakProviders>{children}</MomoCloakProviders>
    </Suspense>
  )
}
```

- [ ] **Step 2: Replace the ComingSoon page**

Overwrite `app/momo-cloaks/page.tsx` (currently `return <ComingSoon />`):

```tsx
import { Metadata } from 'next'

import PageShell from '@/components/page-shell'

import FilterMomoCloaks from './filter-momo-cloaks'
import MomoCloakToolBar from './momo-cloak-toolbar'

export const metadata: Metadata = {
  title: "Momo's Cloaks",
}

export default function MomoCloaksPage() {
  return (
    <>
      <MomoCloakToolBar />
      <PageShell>
        <FilterMomoCloaks />
      </PageShell>
    </>
  )
}
```

- [ ] **Step 3: Type-check, lint, and build**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: all clean. The build is the first real check that the layout's server/client boundary is
valid.

- [ ] **Step 4: Verify in the browser**

Run `yarn dev` and open `http://localhost:3000/momo-cloaks`.

Signed out — expect: 119 cards, no obtained toggles, a `LoginAlert`, filter menu opens, rarity shows
only 3/4/5.

Signed in — expect: toggles present; toggling a card flips it immediately and survives a reload;
each filter narrows the count line; combined filters intersect; "Clear all" resets; **filters
survive a full page reload** (this is what proves persistence).

Critically, with the Network tab open, toggle a filter repeatedly: expect one `POST /api/preferences`
per change and **no** repeated refetch of the page data. A refetch storm means a Server Action crept
into the persistence path.

- [ ] **Step 5: Commit**

```bash
git add app/momo-cloaks/layout.tsx app/momo-cloaks/page.tsx
git commit -m "feat(momo-cloaks): replace the ComingSoon stub with the real grid

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Detail page

**Files:**

- Modify: `hooks/data/momo-cloaks.ts`
- Create: `app/momo-cloaks/[slug]/page.tsx`, `app/momo-cloaks/[slug]/momo-cloak-detail.tsx`

**Interfaces:**

- Consumes: `getMomoCloak(slug)`; `SetDetailCard`; `useMomoCloakData()` (Task 3).
- Produces: a working `/momo-cloaks/[slug]` route.

- [ ] **Step 1: Resolve `outfitSet` in `getMomoCloak`**

`lib/types/momo.ts` types `MomoCloak.outfitSet` and notes it is "not yet populated by the momo data
hooks — optional so a future consumer gets a compile-time signal instead of a silent null." The
detail page is that consumer.

In `hooks/data/momo-cloaks.ts`, add a detail-only column list and use it in `getMomoCloak` **only**.
Leave `getMomoCloaks` (the list) on `CLOAK_COLUMNS` — the grid does not need the join, and adding it
would cost a join across all 119 rows for nothing.

```ts
// getMomoCloak only: the list query has no use for the outfit join. `outfit_set`
// is a slug FK, so this resolves the referenced row for display.
const CLOAK_DETAIL_COLUMNS = `
	${CLOAK_COLUMNS},
	outfit_set,
	outfitSet:outfit_sets!momo_cloaks_outfit_set_fkey ( slug, title, image_url )
`
```

Then in `getMomoCloak`, change `.select(CLOAK_COLUMNS)` to `.select(CLOAK_DETAIL_COLUMNS)`.

The constraint name is **verified against production**, not assumed:

```text
momo_cloaks_outfit_set_fkey
  FOREIGN KEY (outfit_set) REFERENCES outfit_sets(slug) ON UPDATE CASCADE ON DELETE SET NULL
```

If the embed nonetheless fails at runtime, fall back to selecting the plain `outfit_set` column plus
a second `getOutfitSet(slug)` call in the page — do not leave a broken embed in place.

- [ ] **Step 2: Write the detail body**

```tsx
'use client'

import Link from 'next/link'
import { Button, Stack, Typography } from '@mui/material'

import LazyImage from '@/components/lazy-image'
import SetDetailCard from '@/components/set-detail-card'
import { MomoCloak } from '@/lib/types/momo'
import { toTitle } from '@/lib/utils'

import { useMomoCloakData } from '../momo-cloak-context'

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}

export default function MomoCloakDetail({ cloak }: { cloak: MomoCloak }) {
  const { obtainedSlugs, isLoggedIn } = useMomoCloakData()
  const isObtained = obtainedSlugs.has(cloak.slug)

  const extraRows = [
    cloak.seasons ? <MetaRow key="season" label="Season" value={toTitle(cloak.seasons)} /> : null,
    cloak.season_category ? (
      <MetaRow
        key="season-category"
        label="Season Category"
        value={toTitle(cloak.season_category)}
      />
    ) : null,
    cloak.location ? (
      <MetaRow key="location" label="Location" value={toTitle(cloak.location)} />
    ) : null,
    cloak.outfitSet ? (
      <Stack key="outfit" direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography variant="body2">Outfit</Typography>
        <Button component={Link} href={`/outfits/${cloak.outfitSet.slug}`} size="small">
          {cloak.outfitSet.title}
        </Button>
      </Stack>
    ) : null,
  ].filter((row): row is React.ReactElement => row !== null)

  return (
    <SetDetailCard
      description={cloak.description}
      extraRows={extraRows}
      isLoggedIn={isLoggedIn}
      media={
        <LazyImage
          image={cloak.image_url ?? ''}
          kind="media"
          sx={{ width: '100%', maxWidth: 320, aspectRatio: '2 / 3' }}
          title={cloak.title}
        />
      }
      obtained={isObtained ? 1 : 0}
      rarity={cloak.rarity ?? 0}
      title={cloak.title}
      total={1}
    />
  )
}
```

`style` and `labels` are omitted deliberately — both columns are empty for all 119 cloaks.

- [ ] **Step 3: Write the detail route**

```tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import PageShell from '@/components/page-shell'
import { getMomoCloak } from '@/hooks/data/momo-cloaks'

import MomoCloakDetail from './momo-cloak-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cloak = await getMomoCloak(slug)

  return { title: cloak?.title ?? "Momo's Cloaks" }
}

async function MomoCloakContent({ slug }: { slug: string }) {
  const cloak = await getMomoCloak(slug)

  // getMomoCloak uses maybeSingle() and returns null for an unknown slug.
  if (!cloak) notFound()

  return <MomoCloakDetail cloak={cloak} />
}

export default async function MomoCloakPage({ params }: Props) {
  const { slug } = await params

  return (
    <PageShell>
      <Suspense>
        <MomoCloakContent slug={slug} />
      </Suspense>
    </PageShell>
  )
}
```

- [ ] **Step 4: Type-check, lint, build**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: clean.

- [ ] **Step 5: Verify in the browser**

With `yarn dev`:

- Click any card from `/momo-cloaks` → its detail page loads with title, rarity, description
- A cloak **with** an outfit set (41 of them) shows the outfit link, and it navigates to `/outfits/<slug>`
- A cloak **without** one shows no outfit row and does not crash
- `/momo-cloaks/not-a-real-slug` → 404, not a 500
- Signed out: page renders, no progress indicator

- [ ] **Step 6: Commit**

```bash
git add hooks/data/momo-cloaks.ts 'app/momo-cloaks/[slug]'
git commit -m "feat(momo-cloaks): add the cloak detail page

getMomoCloak now resolves the outfit_set join that MomoCloak.outfitSet
was typed for. The list query is left alone — the grid has no use for
the join across all 119 rows.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Final verification and PR

**Files:** none modified.

- [ ] **Step 1: Full clean verification**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: all three clean. Do not proceed on a warning you have not read.

- [ ] **Step 2: Full manual pass**

Against `yarn dev`, confirm every item, signed in and signed out:

| Check                         | Expected                                            |
| ----------------------------- | --------------------------------------------------- |
| `/momo-cloaks` signed out     | 119 cards, no toggles, LoginAlert                   |
| `/momo-cloaks` signed in      | toggles work, persist across reload                 |
| Rarity filter                 | only 3/4/5 offered; narrows correctly               |
| Season filter                 | 11 options; narrows correctly                       |
| Season category filter        | 3 options; narrows correctly                        |
| Obtained filter               | hidden signed out; narrows signed in                |
| Combined filters              | intersect, do not union                             |
| No matches                    | "No cloaks match these filters."                    |
| Clear all                     | resets every control                                |
| Reload with filters set       | filters restored                                    |
| Filter toggling (Network tab) | one POST per change, **no** page-data refetch storm |
| Detail page                   | loads; outfit link works for the 41 that have one   |
| Unknown slug                  | 404, not 500                                        |

- [ ] **Step 3: Mark the PR ready**

```bash
git push
gh pr ready 309
```

- [ ] **Step 4: Confirm CI**

Run: `gh pr checks 309`
Expected: Vercel check passes. A red **Supabase Preview** check is usually benign and self-clearing
per CLAUDE.md — it means the PR branch DB's migration history drifted, not that the migration is
broken. Confirm the Vercel deployment build succeeded before treating the PR as green.

---

## Self-Review

**Spec coverage:** migration + 4 lockstep updates → Task 1. `RarityToggle` options → Task 2.
Provider/context/toolbar/grid → Tasks 3–7. Detail page + `outfitSet` join → Task 8. Logged-out
behavior → Tasks 6, 7, 9. Error handling → Tasks 4 (toggle rollback), 6 (obtained-error alert),
7 (fetch guard). Testing → Tasks 7, 8, 9. No spec section is unimplemented.

**Deviation from spec, deliberate:** the spec listed `momo-cloak-toolbar.tsx` using the shared
`FilterMenu`. Inspection showed `FilterMenu` calls `useEurekaData()` and `useOutfitData()`
unconditionally, so Task 5 adds a dedicated `momo-cloak-filter-menu.tsx`. This adds one file beyond
the spec's list; rationale is recorded in Task 5.

**Type consistency:** `MomoCloakFilterState` field names (`selectedRarity`, `selectedSeason`,
`selectedSeasonCategory`, `selectedObtainedFilter`) are identical across Tasks 3, 4, 5, and 6.
`obtainedSlugs` is `string[]` as a provider **prop** and `Set<string>` in context — intentional, and
converted once in Task 4's `useState` initializer. Preference column names are byte-identical across
Tasks 1 and 4.

**Known risk carried into execution:** the FK constraint name in Task 8's embed
(`momo_cloaks_outfit_set_fkey`) is assumed, not verified. Task 8 Step 1 includes the query to
confirm it and a fallback if it differs.

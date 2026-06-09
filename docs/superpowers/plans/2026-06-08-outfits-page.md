# Outfits Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/outfits` page with the same structure, filtering, realtime obtained-toggling, and grouping behavior as `/eureka`, using outfit-specific data and an evolution grouping axis instead of color.

**Architecture:** A client-side `OutfitDataProvider` fetches outfit sets + obtained records via two new API routes, subscribes to `postgres_changes` on `obtained_outfit`, and exposes filter/grouping state through `OutfitDataContext`. The page renders a toolbar and a filterable grid of variant cards, optionally grouped by outfit set and togglable to show evolution-grouped cards instead of individual piece cards.

**Tech Stack:** Next.js 15 App Router, MUI v7, Supabase (Postgres + realtime), TypeScript, Yarn

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260608000003_outfit_preference_columns.sql` | Create | Add outfit preference columns to `user_preferences` |
| `lib/types/eureka.ts` | Modify | Extend `UserPreferences` with outfit pref fields |
| `lib/preferences.ts` | Modify | Add outfit defaults to `DEFAULT_PREFERENCES` |
| `hooks/data/preferences.ts` | Modify | Include outfit columns in the select query |
| `app/api/preferences/route.ts` | Modify | Include outfit columns in the select query |
| `app/api/outfits/route.ts` | Create | GET — outfit sets with variants + obtained flags |
| `app/api/obtained-outfit/route.ts` | Create | GET — current user's obtained_outfit records |
| `app/outfits/actions.ts` | Create | `handleObtainedOutfit` server action |
| `app/actions/preferences.ts` | Modify | Add `updateOutfitFilters`, `updateOutfitGroupBySet`, `updateOutfitShowByEvolution` |
| `components/outfits/outfit-context.tsx` | Create | `OutfitDataContext`, `useOutfitData`, filter state types |
| `components/outfits/outfit-data-provider.tsx` | Create | Client provider: fetch, realtime, filter/grouping state |
| `components/outfits/outfit-toolbar.tsx` | Create | NavBarToolbar with result count + sort + filter button |
| `components/outfits/outfit-variant-card.tsx` | Create | Individual piece card with obtained toggle |
| `components/outfits/outfit-evolution-set-card.tsx` | Create | Evolution-grouped card with progress bar |
| `components/outfits/filter-outfits.tsx` | Create | Filterable grid — loading/error/empty states + card rendering |
| `components/navbar/filter-menu.tsx` | Modify | Add outfits filter section, route-aware via `usePathname` |
| `app/outfits/layout.tsx` | Create | Server layout wrapping children in `SortProvider` + `OutfitDataProvider` |
| `app/outfits/loading.tsx` | Create | Skeleton loading UI |
| `app/outfits/page.tsx` | Modify | Replace "Coming Soon" with toolbar + filter grid |

---

### Task 1: Supabase migration — outfit preference columns

**Files:**
- Create: `supabase/migrations/20260608000003_outfit_preference_columns.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260608000003_outfit_preference_columns.sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS outfit_set_filter        text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_category_filter   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_evolution_filter  text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_rarity_filter     integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_obtained_filter   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_group_by_set      boolean DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS outfit_show_by_evolution boolean DEFAULT FALSE;
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push --include-all
```

Expected: migration applied without errors.

- [ ] **Step 3: Regenerate TypeScript types**

```bash
supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts
```

Expected: `lib/types/supabase.ts` updated. The `user_preferences` `Row` type now includes the seven new columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260608000003_outfit_preference_columns.sql lib/types/supabase.ts
git commit -m "feat: add outfit preference columns to user_preferences"
```

---

### Task 2: Update `UserPreferences` type, defaults, and preference queries

**Files:**
- Modify: `lib/types/eureka.ts`
- Modify: `lib/preferences.ts`
- Modify: `hooks/data/preferences.ts`
- Modify: `app/api/preferences/route.ts`

- [ ] **Step 1: Extend `UserPreferences` in `lib/types/eureka.ts`**

Replace the existing `UserPreferences` Pick (lines 76–87) with:

```ts
export type UserPreferences = Pick<
  Tables<'user_preferences'>,
  | 'group_by_set'
  | 'show_by_color'
  | 'eureka_set_filter'
  | 'eureka_category'
  | 'eureka_obtained_filter'
  | 'eureka_color'
  | 'eureka_rarity'
  | 'theme'
  | 'color_theme'
  | 'outfit_set_filter'
  | 'outfit_category_filter'
  | 'outfit_evolution_filter'
  | 'outfit_rarity_filter'
  | 'outfit_obtained_filter'
  | 'outfit_group_by_set'
  | 'outfit_show_by_evolution'
>
```

- [ ] **Step 2: Add outfit defaults to `lib/preferences.ts`**

Replace the full file content:

```ts
import { AdminPreferences, UserPreferences } from './types/eureka'

export const DEFAULT_PREFERENCES: UserPreferences = {
  group_by_set: true,
  show_by_color: false,
  eureka_set_filter: null,
  eureka_category: null,
  eureka_obtained_filter: null,
  eureka_color: null,
  eureka_rarity: null,
  theme: 'system',
  color_theme: 'default',
  outfit_set_filter: null,
  outfit_category_filter: null,
  outfit_evolution_filter: null,
  outfit_rarity_filter: null,
  outfit_obtained_filter: null,
  outfit_group_by_set: true,
  outfit_show_by_evolution: false,
}

export const DEFAULT_ADMIN_PREFERENCES: AdminPreferences = {
  admin_view: 'list',
}
```

- [ ] **Step 3: Update select query in `hooks/data/preferences.ts`**

Replace the select string on line 13:

```ts
'group_by_set, show_by_color, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme, color_theme, outfit_set_filter, outfit_category_filter, outfit_evolution_filter, outfit_rarity_filter, outfit_obtained_filter, outfit_group_by_set, outfit_show_by_evolution'
```

- [ ] **Step 4: Update select query in `app/api/preferences/route.ts`**

Replace the select string on line 26:

```ts
'group_by_set, show_by_color, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme, color_theme, outfit_set_filter, outfit_category_filter, outfit_evolution_filter, outfit_rarity_filter, outfit_obtained_filter, outfit_group_by_set, outfit_show_by_evolution'
```

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/types/eureka.ts lib/preferences.ts hooks/data/preferences.ts app/api/preferences/route.ts
git commit -m "feat: extend UserPreferences with outfit-specific preference fields"
```

---

### Task 3: API route — `/api/outfits`

**Files:**
- Create: `app/api/outfits/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/outfits/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OutfitSet, OutfitVariant, ObtainedOutfit } from '@/lib/types/outfit'
import { createOutfitSet } from '@/hooks/outfit'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'

export async function GET() {
  const supabase = await createClient()

  const { data: outfitSets, error } = await supabase
    .from('outfit_sets')
    .select(
      `id, slug, title, description, rarity, style, label, label_2, ability,
       image_url, alt_image_url, glowup_evolution, updated_at,
       outfit_variants ( id, slug, outfit_set, evolution, outfit_category, image_url, alt_image_url, default )`
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: true })

  if (error) {
    console.error('Failed to fetch outfit sets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const [outfitCategories, evolutions] = await Promise.all([
    getOutfitCategories(),
    getEvolutions(),
  ])

  const outfits = (outfitSets ?? []).map((outfitSet) =>
    createOutfitSet({
      outfitSet: outfitSet as Omit<OutfitSet, 'created_at' | 'outfit_categories' | 'evolutions'>,
      outfitCategories,
      evolutions,
    })
  ) as OutfitSet[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(outfits)
  }

  const { data: obtained, error: obtainedError } = await supabase
    .from('obtained_outfit')
    .select('id, outfit_set, outfit_category, evolution')
    .eq('user_id', user.id)

  if (obtainedError) {
    console.error('Failed to fetch obtained outfits:', obtainedError)
    return NextResponse.json({ error: obtainedError.message }, { status: 500 })
  }

  const obtainedOutfit = (obtained ?? []) as ObtainedOutfit[]

  const outfitsWithObtained = outfits.map((outfitSet) => ({
    ...outfitSet,
    outfit_variants: outfitSet.outfit_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedOutfit.find(
        (o) =>
          variant.outfit_set === o.outfit_set &&
          variant.outfit_category === o.outfit_category &&
          (variant.evolution === null ? o.evolution === null : variant.evolution === o.evolution)
      ),
    })) as OutfitVariant[],
  })) as OutfitSet[]

  return NextResponse.json(outfitsWithObtained)
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/outfits/route.ts
git commit -m "feat: add /api/outfits GET route"
```

---

### Task 4: API route — `/api/obtained-outfit`

**Files:**
- Create: `app/api/obtained-outfit/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/obtained-outfit/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit } from '@/lib/types/outfit'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('obtained_outfit')
    .select('id, outfit_set, outfit_category, evolution')
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to fetch obtained outfit:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []) as ObtainedOutfit[])
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/obtained-outfit/route.ts
git commit -m "feat: add /api/obtained-outfit GET route"
```

---

### Task 5: Server action — `handleObtainedOutfit`

**Files:**
- Create: `app/outfits/actions.ts`

- [ ] **Step 1: Create the action**

```ts
// app/outfits/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function handleObtainedOutfit(
  outfit_set: string,
  outfit_category: string,
  evolution: string | null
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained_outfit', {
    p_outfit_set: outfit_set,
    p_outfit_category: outfit_category,
    p_evolution: evolution ?? '',
  })

  if (error) {
    console.error('toggle_obtained_outfit failed:', error)
    throw new Error(error.message)
  }
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/outfits/actions.ts
git commit -m "feat: add handleObtainedOutfit server action"
```

---

### Task 6: Preference server actions — outfit-specific updaters

**Files:**
- Modify: `app/actions/preferences.ts`

- [ ] **Step 1: Add three new exported functions** at the end of `app/actions/preferences.ts`

```ts
export async function updateOutfitFilters(filters: {
  outfit_set_filter?: string | null
  outfit_category_filter?: string | null
  outfit_evolution_filter?: string | null
  outfit_rarity_filter?: number | null
  outfit_obtained_filter?: string | null
}) {
  await upsertUserPreference(filters as Record<string, string | number | null>)
}

export async function updateOutfitGroupBySet(value: boolean) {
  await upsertUserPreference({ outfit_group_by_set: value })
}

export async function updateOutfitShowByEvolution(value: boolean) {
  await upsertUserPreference({ outfit_show_by_evolution: value })
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions/preferences.ts
git commit -m "feat: add outfit preference server actions"
```

---

### Task 7: Outfit context

**Files:**
- Create: `components/outfits/outfit-context.tsx`

- [ ] **Step 1: Create the context file**

```tsx
// components/outfits/outfit-context.tsx
'use client'

import { createContext, useContext } from 'react'
import { OutfitCategory, OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'

export interface OutfitFilterState {
  selectedOutfitSet: string | null
  selectedOutfitCategory: string | null
  selectedEvolution: string | null
  selectedRarity: number | null
  selectedObtainedFilter: ObtainedFilter | null
}

interface OutfitDataContextValue {
  outfitSets: OutfitSet[]
  obtainedOutfit: ObtainedOutfit[]
  outfitCategories: OutfitCategory[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  userId: string | null
  groupBySet: boolean
  showByEvolution: boolean
  onGroupBySetChange: () => void
  onShowByEvolutionChange: () => void
  filters: OutfitFilterState
  onFiltersChange: (updates: Partial<OutfitFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (outfit_set: string, outfit_category: string, evolution: string | null) => void
}

export const DEFAULT_OUTFIT_FILTERS: OutfitFilterState = {
  selectedOutfitSet: null,
  selectedOutfitCategory: null,
  selectedEvolution: null,
  selectedRarity: null,
  selectedObtainedFilter: null,
}

export const OutfitDataContext = createContext<OutfitDataContextValue>({
  outfitSets: [],
  obtainedOutfit: [],
  outfitCategories: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  userId: null,
  groupBySet: true,
  showByEvolution: false,
  onGroupBySetChange: () => {},
  onShowByEvolutionChange: () => {},
  filters: DEFAULT_OUTFIT_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
})

export function useOutfitData() {
  return useContext(OutfitDataContext)
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/outfits/outfit-context.tsx
git commit -m "feat: add OutfitDataContext and useOutfitData hook"
```

---

### Task 8: Outfit data provider

**Files:**
- Create: `components/outfits/outfit-data-provider.tsx`

- [ ] **Step 1: Create the provider**

```tsx
// components/outfits/outfit-data-provider.tsx
'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OutfitCategory, OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'
import { UserPreferences } from '@/lib/types/eureka'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import {
  updateOutfitFilters,
  updateOutfitGroupBySet,
  updateOutfitShowByEvolution,
} from '@/app/actions/preferences'
import { handleObtainedOutfit } from '@/app/outfits/actions'
import { updateOutfitSet } from '@/hooks/outfit'
import {
  DEFAULT_OUTFIT_FILTERS,
  OutfitDataContext,
  OutfitFilterState,
} from './outfit-context'

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

export default function OutfitDataProvider({
  isLoggedIn,
  isAdmin = false,
  userId,
  children,
}: {
  isLoggedIn: boolean
  isAdmin?: boolean
  userId: string | null
  children: React.ReactNode
}) {
  const [outfitSets, setOutfitSets] = useState<OutfitSet[]>([])
  const [outfitCategories, setOutfitCategories] = useState<OutfitCategory[]>([])
  const [obtainedOutfit, setObtainedOutfit] = useState<ObtainedOutfit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState<boolean>(DEFAULT_PREFERENCES.outfit_group_by_set)
  const [showByEvolution, setShowByEvolution] = useState<boolean>(
    DEFAULT_PREFERENCES.outfit_show_by_evolution
  )
  const [filters, setFilters] = useState<OutfitFilterState>(DEFAULT_OUTFIT_FILTERS)
  const [, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])
  const prefsLoaded = useRef(false)

  useEffect(() => {
    fetchJson<OutfitSet[]>('/api/outfits')
      .then((sets) => {
        setOutfitSets(sets)
        if (sets.length > 0) {
          setOutfitCategories(sets[0].outfit_categories)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load outfit data:', err)
        setIsError(true)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchJson<UserPreferences>('/api/preferences')
      .then((prefs) => {
        setGroupBySet(prefs.outfit_group_by_set)
        setShowByEvolution(prefs.outfit_show_by_evolution)
        setFilters({
          selectedOutfitSet: prefs.outfit_set_filter ?? null,
          selectedOutfitCategory: prefs.outfit_category_filter ?? null,
          selectedEvolution: prefs.outfit_evolution_filter ?? null,
          selectedRarity: prefs.outfit_rarity_filter ?? null,
          selectedObtainedFilter: (prefs.outfit_obtained_filter as ObtainedFilter) ?? null,
        })
        prefsLoaded.current = true
      })
      .catch(() => {
        prefsLoaded.current = true
      })
  }, [isLoggedIn])

  const handleGroupBySetChange = () => {
    const next = !groupBySet
    setGroupBySet(next)
    if (isLoggedIn) startTransition(() => updateOutfitGroupBySet(next))
  }

  const handleShowByEvolutionChange = () => {
    const next = !showByEvolution
    setShowByEvolution(next)
    if (isLoggedIn) startTransition(() => updateOutfitShowByEvolution(next))
  }

  const handleFiltersChange = (updates: Partial<OutfitFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_OUTFIT_FILTERS)
  }

  const handleToggleObtained = (
    outfit_set: string,
    outfit_category: string,
    evolution: string | null
  ) => {
    const isObtained = obtainedOutfit.some(
      (o) =>
        o.outfit_set === outfit_set &&
        o.outfit_category === outfit_category &&
        (evolution === null ? o.evolution === null : o.evolution === evolution)
    )
    if (isObtained) {
      setObtainedOutfit((prev) =>
        prev.filter(
          (o) =>
            !(
              o.outfit_set === outfit_set &&
              o.outfit_category === outfit_category &&
              (evolution === null ? o.evolution === null : o.evolution === evolution)
            )
        )
      )
    } else {
      setObtainedOutfit((prev) => [
        ...prev,
        { id: -1, outfit_set, outfit_category, evolution },
      ])
    }
    handleObtainedOutfit(outfit_set, outfit_category, evolution)
  }

  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded.current) return
    startTransition(() =>
      updateOutfitFilters({
        outfit_set_filter: filters.selectedOutfitSet,
        outfit_category_filter: filters.selectedOutfitCategory,
        outfit_evolution_filter: filters.selectedEvolution,
        outfit_rarity_filter: filters.selectedRarity,
        outfit_obtained_filter: filters.selectedObtainedFilter,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (!isLoggedIn) return

    fetchJson<ObtainedOutfit[]>('/api/obtained-outfit')
      .then((data) => setObtainedOutfit(data))
      .catch((err) => {
        console.error('Failed to load obtained outfit:', err)
        setIsObtainedError(true)
      })

    const channel = supabase
      .channel(`obtained-outfit-channel:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'obtained_outfit',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setObtainedOutfit((prev) => [...prev, payload.new as ObtainedOutfit])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'obtained_outfit',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setObtainedOutfit((prev) =>
            prev.filter((o) => o.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const outfitSetsWithObtained = outfitSets.map((outfitSet) =>
    updateOutfitSet({ outfitSet, obtainedOutfit })
  )

  return (
    <OutfitDataContext.Provider
      value={{
        outfitSets: outfitSetsWithObtained,
        obtainedOutfit,
        outfitCategories,
        isLoggedIn,
        isAdmin,
        isLoading,
        isError,
        isObtainedError,
        userId,
        groupBySet,
        showByEvolution,
        onGroupBySetChange: handleGroupBySetChange,
        onShowByEvolutionChange: handleShowByEvolutionChange,
        filters,
        onFiltersChange: handleFiltersChange,
        onClearFilters: handleClearFilters,
        onToggleObtained: handleToggleObtained,
      }}
    >
      {children}
    </OutfitDataContext.Provider>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/outfits/outfit-data-provider.tsx
git commit -m "feat: add OutfitDataProvider with fetch, realtime, and filter state"
```

---

### Task 9: Outfit variant card

**Files:**
- Create: `components/outfits/outfit-variant-card.tsx`

- [ ] **Step 1: Create the card**

```tsx
// components/outfits/outfit-variant-card.tsx
'use client'

import { useState } from 'react'
import { Box, Card, Grow, IconButton, Stack, Typography } from '@mui/material'
import { Category, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import LazyAvatar from '@/components/lazy-avatar'
import { useOutfitData } from './outfit-context'

export default function OutfitVariantCard({
  outfitVariant,
  isLoggedIn,
  isMissingFilter = false,
}: {
  outfitVariant: OutfitVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
}) {
  const { onToggleObtained } = useOutfitData()
  const [exiting, setExiting] = useState(false)

  function onToggle() {
    if (isMissingFilter) {
      setExiting(true)
    } else {
      onToggleObtained(
        outfitVariant.outfit_set!,
        outfitVariant.outfit_category!,
        outfitVariant.evolution ?? null
      )
    }
  }

  function onExited() {
    onToggleObtained(
      outfitVariant.outfit_set!,
      outfitVariant.outfit_category!,
      outfitVariant.evolution ?? null
    )
  }

  const categoryLabel = toTitle(outfitVariant.outfit_category ?? '')
  const evolutionLabel = outfitVariant.evolution ? toTitle(outfitVariant.evolution) : 'Base'

  return (
    <Grow in={!exiting} timeout={300} onExited={onExited}>
      <Card
        sx={{
          minWidth: 'fit-content',
          bgcolor: outfitVariant.obtained
            ? 'surface.containerLow'
            : 'surface.containerHighest',
        }}
      >
        <Box sx={{ position: 'relative', height: '100%' }}>
          <Stack sx={{ pt: 1, alignItems: 'center' }}>
            <LazyAvatar
              alt={outfitVariant.slug || 'Outfit Variant'}
              color="transparent"
              size="lg"
              src={outfitVariant.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          </Stack>
          <Stack
            direction="row"
            sx={{
              py: 0.75,
              px: 1.25,
              my: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography color="textSecondary" variant="caption">
              {categoryLabel} • {evolutionLabel}
            </Typography>
          </Stack>
          <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
            {isLoggedIn && (
              <IconButton onClick={onToggle}>
                {outfitVariant.obtained ? (
                  <TaskAlt />
                ) : (
                  <RadioButtonUncheckedOutlined />
                )}
              </IconButton>
            )}
          </Box>
        </Box>
      </Card>
    </Grow>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/outfits/outfit-variant-card.tsx
git commit -m "feat: add OutfitVariantCard with obtained toggle"
```

---

### Task 10: Outfit evolution set card

**Files:**
- Create: `components/outfits/outfit-evolution-set-card.tsx`

- [ ] **Step 1: Create the card**

```tsx
// components/outfits/outfit-evolution-set-card.tsx
import { Box, Card, LinearProgress, Stack, Typography } from '@mui/material'
import { Category } from '@mui/icons-material'
import { Evolution, OutfitSet } from '@/lib/types/outfit'
import { countObtained, percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import LazyAvatar from '@/components/lazy-avatar'
import RarityStars from '@/components/rarity-stars'

export default function OutfitEvolutionSetCard({
  outfitSet,
  evolution,
  isLoggedIn,
}: {
  outfitSet: OutfitSet
  evolution: Evolution | null
  isLoggedIn: boolean
}) {
  const variants = outfitSet.outfit_variants.filter((v) =>
    evolution === null ? v.evolution === null : v.evolution === evolution?.slug
  )
  const representativeVariant = variants.find((v) => v.outfit_category === 'hair') ?? variants[0]
  const image = evolution?.image_url ?? representativeVariant?.image_url ?? outfitSet.image_url
  const label = evolution ? toTitle(evolution.title ?? evolution.slug) : 'Base'

  // countObtained expects EurekaVariant[] shape; OutfitVariant has obtained? too
  const obtainedCount = {
    obtained: variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0),
    total: variants.length,
  }
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Card
      data-active={percentage === 100 ? '' : undefined}
      sx={{
        minWidth: 'fit-content',
        '&[data-active]': { backgroundColor: 'surface.lowest' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Stack sx={{ pt: 1, alignItems: 'center' }}>
          <LazyAvatar
            alt={label}
            color="transparent"
            size="lg"
            src={image!}
            sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
          >
            <Category fontSize="inherit" />
          </LazyAvatar>
        </Stack>
        <Stack
          direction="row"
          sx={{ py: 0.75, px: 1.25, my: 0, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="overline">{label}</Typography>
          {isLoggedIn && (
            <Typography color="textSecondary" variant="caption">
              {`${percentage}%`}
            </Typography>
          )}
        </Stack>
        {isLoggedIn && (
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <LinearProgress color="inherit" value={percentage} variant="determinate" />
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
          {outfitSet.rarity && (
            <Typography color="textSecondary" variant="overline">
              <RarityStars rarity={outfitSet.rarity} />
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/outfits/outfit-evolution-set-card.tsx
git commit -m "feat: add OutfitEvolutionSetCard with progress bar"
```

---

### Task 11: Filter outfits grid component

**Files:**
- Create: `components/outfits/filter-outfits.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/outfits/filter-outfits.tsx
'use client'

import React from 'react'
import { Alert, Box, Button, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'
import { useOutfitData } from './outfit-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import { percent } from '@/hooks/count-obtained'
import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import ProgressChip from '@/components/progress-chip'
import OutfitVariantCard from './outfit-variant-card'
import OutfitEvolutionSetCard from './outfit-evolution-set-card'

function GroupHeaderSkeleton() {
  return (
    <Box sx={{ gridColumn: { xs: '1/4', sm: '1/5', md: '1/6' } }}>
      <Stack
        direction="row"
        sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <Skeleton height={28} variant="text" width={120} />
        <Skeleton height={24} variant="rounded" width={60} />
      </Stack>
      <Divider />
    </Box>
  )
}

function VariantCardSkeleton() {
  return (
    <Skeleton
      height={0}
      style={{ paddingBottom: '133%' }}
      sx={{ borderRadius: 1 }}
      variant="rectangular"
      width="100%"
    />
  )
}

export default function FilterOutfits() {
  const {
    outfitSets,
    isLoggedIn,
    isLoading,
    isError,
    isObtainedError,
    groupBySet,
    showByEvolution,
    filters,
  } = useOutfitData()
  const { sortOrder } = useSortOrder()

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  if (isError) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <ErrorAlert message="Failed to load Outfits data. Please refresh the page." />
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <Skeleton height={20} sx={{ mt: 2, mb: 0.5 }} variant="text" width={100} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            gap: { xs: 1, sm: 1.5, md: 2 },
          }}
        >
          <GroupHeaderSkeleton />
          {Array.from({ length: 5 }).map((_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
          <GroupHeaderSkeleton />
          {Array.from({ length: 4 }).map((_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
          <GroupHeaderSkeleton />
          {Array.from({ length: 3 }).map((_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
        </Box>
      </Box>
    )
  }

  const filteredSets = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      if (showByEvolution) {
        return set
      }
      const filteredVariants = set.outfit_variants
        .filter((v) => !selectedOutfitCategory || v.outfit_category === selectedOutfitCategory)
        .filter((v) => !selectedEvolution || v.evolution === selectedEvolution)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        })
      return { ...set, outfit_variants: filteredVariants }
    })
    .filter((set) => (showByEvolution ? set.evolutions.length > 0 : set.outfit_variants.length > 0))
    .sort((a, b) => (sortOrder === 'new' ? b.id! - a.id! : a.id! - b.id!))

  return (
    <>
      {!isLoggedIn && (
        <Box sx={{ width: 'fit-content', my: 2 }}>
          <LoginAlert />
        </Box>
      )}

      {isObtainedError && (
        <Alert severity="warning" sx={{ width: 'fit-content', my: 2 }}>
          Could not load your collection status. Progress may be inaccurate.
        </Alert>
      )}

      {filteredSets.length === 0 ? (
        <Stack sx={{ py: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary" variant="h6">
            No results
          </Typography>
          <Typography color="textDisabled" variant="body2">
            Try adjusting your filters
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: groupBySet ? 0 : 2,
          }}
        >
          {filteredSets.map((set) => {
            const obtained = set.outfit_variants.reduce(
              (sum, v) => sum + (v.obtained ? 1 : 0),
              0
            )
            const total = set.outfit_variants.length
            return (
              <React.Fragment key={set.slug}>
                {groupBySet && (
                  <Box
                    sx={{ gridColumn: { xs: '1/4', sm: '1/5', md: '1/6' }, mt: 2 }}
                  >
                    <Stack
                      direction="row"
                      sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
                    >
                      <Button
                        color="inherit"
                        endIcon={<ChevronRight />}
                        href={`/outfits/${set.slug}`}
                        size="small"
                      >
                        {set.title}
                      </Button>
                      {isLoggedIn && (
                        <ProgressChip percentage={percent(obtained, total)} size="lg" />
                      )}
                    </Stack>
                    <Divider />
                  </Box>
                )}
                {showByEvolution
                  ? [null, ...set.evolutions].map((evolution) => (
                      <OutfitEvolutionSetCard
                        key={evolution?.slug ?? 'base'}
                        evolution={evolution}
                        isLoggedIn={isLoggedIn}
                        outfitSet={set}
                      />
                    ))
                  : set.outfit_variants.map((variant) => (
                      <OutfitVariantCard
                        key={variant.id}
                        isLoggedIn={isLoggedIn}
                        isMissingFilter={selectedObtainedFilter === 'missing'}
                        outfitVariant={variant}
                      />
                    ))}
              </React.Fragment>
            )
          })}
        </Box>
      )}
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/outfits/filter-outfits.tsx
git commit -m "feat: add FilterOutfits grid component"
```

---

### Task 12: Outfit toolbar

**Files:**
- Create: `components/outfits/outfit-toolbar.tsx`

- [ ] **Step 1: Create the toolbar**

```tsx
// components/outfits/outfit-toolbar.tsx
'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import FilterMenu from '@/components/navbar/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import { useOutfitData } from './outfit-context'

export default function OutfitToolBar() {
  const { outfitSets, showByEvolution, filters } = useOutfitData()

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  const filtered = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => ({
      evolutions: set.evolutions,
      outfit_variants: set.outfit_variants
        .filter((v) => !selectedOutfitCategory || v.outfit_category === selectedOutfitCategory)
        .filter((v) => !selectedEvolution || v.evolution === selectedEvolution)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        }),
    }))

  const resultsCount = showByEvolution
    ? filtered.reduce((sum, set) => sum + set.evolutions.length + 1, 0) // +1 for base
    : filtered.reduce((sum, set) => sum + set.outfit_variants.length, 0)

  return (
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {resultsCount} results
        </Typography>
        <Stack direction="row" spacing={1}>
          <SortButton />
          <FilterMenu />
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/outfits/outfit-toolbar.tsx
git commit -m "feat: add OutfitToolBar"
```

---

### Task 13: Extend `FilterMenu` for outfits

**Files:**
- Modify: `components/navbar/filter-menu.tsx`

The current `FilterMenu` only handles `/eureka`. We need to add an outfits branch that renders when `pathname` starts with `/outfits`.

- [ ] **Step 1: Add outfit filter imports**

At the top of `components/navbar/filter-menu.tsx`, add these imports after the existing ones:

```tsx
import { useOutfitData } from '../outfits/outfit-context'
import OutfitSelect from '../filter/outfit-select'
import SortEvolutionToggle from '../filter/sort-evolution-toggle'
import OutfitCategoryToggle from '../filter/outfit-category-toggle'
import OutfitEvolutionSelect from '../filter/outfit-evolution-select'
```

- [ ] **Step 2: Replace the `FILTER_PAGES` constant and component body**

Replace the entire `FilterMenu` component (lines 28–176 of the original file) with this:

```tsx
const FILTER_PAGES = ['/eureka', '/outfits']

export default function FilterMenu() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const isOutfits = pathname.startsWith('/outfits')

  // Eureka context (safe to call unconditionally — only used when !isOutfits)
  const {
    eurekaSets,
    categories,
    colors,
    isLoggedIn: eurekaLoggedIn,
    groupBySet,
    showByColor,
    onGroupBySetChange,
    onShowByColorChange,
    filters: eurekaFilters,
    onFiltersChange: onEurekaFiltersChange,
    onClearFilters: onClearEurekaFilters,
  } = useEurekaData()

  // Outfit context (safe to call unconditionally — only used when isOutfits)
  const {
    outfitSets,
    outfitCategories,
    isLoggedIn: outfitLoggedIn,
    groupBySet: outfitGroupBySet,
    showByEvolution,
    onGroupBySetChange: onOutfitGroupBySetChange,
    onShowByEvolutionChange,
    filters: outfitFilters,
    onFiltersChange: onOutfitFiltersChange,
    onClearFilters: onClearOutfitFilters,
  } = useOutfitData()

  if (!FILTER_PAGES.some((p) => pathname.startsWith(p))) return null

  if (isOutfits) {
    const {
      selectedOutfitSet,
      selectedOutfitCategory,
      selectedEvolution,
      selectedObtainedFilter,
      selectedRarity,
    } = outfitFilters

    const hasActiveFilters =
      selectedOutfitSet ||
      selectedOutfitCategory ||
      selectedEvolution ||
      selectedObtainedFilter ||
      selectedRarity

    const allEvolutions = [
      ...new Map(
        outfitSets.flatMap((s) => s.evolutions).map((e) => [e.slug, e])
      ).values(),
    ]

    const handleShowByEvolutionChange = () => {
      if (!showByEvolution) {
        onOutfitFiltersChange({
          selectedOutfitCategory: null,
          selectedObtainedFilter: null,
          selectedEvolution: null,
        })
      }
      onShowByEvolutionChange()
    }

    return (
      <>
        <IconButton onClick={() => setOpen(true)}>
          <FilterList />
        </IconButton>
        <Drawer
          anchor="right"
          open={open}
          sx={{ '& .MuiDrawer-paper': { width: 350 } }}
          onClose={() => setOpen(false)}
        >
          <Toolbar sx={{ mb: 2 }} />
          <Toolbar>
            <Stack direction="row" sx={{ flex: 1, justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </Toolbar>
          <List>
            <ListItem sx={{ gap: 1 }}>
              <SortEvolutionToggle
                groupBySet={outfitGroupBySet}
                showByEvolution={showByEvolution}
                onGroupBySetChange={onOutfitGroupBySetChange}
                onShowByEvolutionChange={handleShowByEvolutionChange}
              />
              <OutfitSelect
                outfitSets={outfitSets}
                selectedOutfitSet={selectedOutfitSet}
                onOutfitSetChange={(e) =>
                  onOutfitFiltersChange({ selectedOutfitSet: e.target.value || null })
                }
              />
            </ListItem>
            <ListItem>
              <OutfitEvolutionSelect
                disabled={showByEvolution}
                evolutions={allEvolutions}
                selectedEvolution={selectedEvolution}
                onEvolutionChange={(e) =>
                  onOutfitFiltersChange({ selectedEvolution: e.target.value || null })
                }
              />
            </ListItem>
            {outfitLoggedIn && (
              <ListItem>
                <ObtainedToggle
                  disabled={showByEvolution}
                  selectedObtainedFilter={selectedObtainedFilter}
                  onObtainedFilterChange={(_e, v) =>
                    onOutfitFiltersChange({ selectedObtainedFilter: v })
                  }
                />
              </ListItem>
            )}
            <ListItem>
              <OutfitCategoryToggle
                categories={outfitCategories}
                disabled={showByEvolution}
                selectedCategory={showByEvolution ? null : selectedOutfitCategory}
                onCategoryChange={(_e, v) =>
                  onOutfitFiltersChange({ selectedOutfitCategory: v })
                }
              />
            </ListItem>
            <ListItem>
              <RarityToggle
                selectedRarity={selectedRarity}
                onRarityChange={(_e, v) => onOutfitFiltersChange({ selectedRarity: v })}
              />
            </ListItem>
            <Divider sx={{ mx: 2, mt: 2 }} />
            <ListItem>
              <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button color="secondary" variant="outlined" onClick={onClearOutfitFilters}>
                    Clear all
                  </Button>
                )}
                <Button variant="contained" onClick={() => setOpen(false)}>
                  Apply
                </Button>
              </Stack>
            </ListItem>
          </List>
        </Drawer>
      </>
    )
  }

  // Eureka branch (unchanged)
  const {
    selectedEurekaSet,
    selectedCategory,
    selectedObtainedFilter,
    selectedColor,
    selectedRarity,
  } = eurekaFilters

  const hasActiveFilters =
    selectedEurekaSet || selectedCategory || selectedObtainedFilter || selectedColor || selectedRarity

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    onEurekaFiltersChange({ selectedEurekaSet: event.target.value || null })
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    onEurekaFiltersChange({ selectedCategory: newCategory })
  }

  const handleObtainedFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => {
    onEurekaFiltersChange({ selectedObtainedFilter: newFilter })
  }

  const handleShowByColorChange = () => {
    if (!showByColor) {
      onEurekaFiltersChange({ selectedCategory: null, selectedObtainedFilter: null, selectedColor: null })
    }
    onShowByColorChange()
  }

  const handleColorChange = (event: SelectChangeEvent) => {
    onEurekaFiltersChange({ selectedColor: event.target.value || null })
  }

  const handleRarityChange = (_event: React.MouseEvent<HTMLElement>, value: number | null) => {
    onEurekaFiltersChange({ selectedRarity: value })
  }

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <FilterList />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        sx={{ '& .MuiDrawer-paper': { width: 350 } }}
        onClose={() => setOpen(false)}
      >
        <Toolbar sx={{ mb: 2 }} />
        <Toolbar>
          <Stack direction="row" sx={{ flex: 1, justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </Toolbar>
        <List>
          <ListItem sx={{ gap: 1 }}>
            <SortEurekaToggle groupBySet={groupBySet} onGroupBySetChange={onGroupBySetChange} />
            <EurekaSelect
              eurekaSets={eurekaSets}
              selectedEurekaSet={selectedEurekaSet}
              onEurekaSetChange={handleEurekaSetChange}
            />
          </ListItem>
          <ListItem sx={{ gap: 1 }}>
            <SortColorToggle showByColor={showByColor} onShowByColorChange={handleShowByColorChange} />
            <ColorSelect
              colors={colors}
              disabled={showByColor}
              selectedColor={selectedColor}
              onColorChange={handleColorChange}
            />
          </ListItem>
          {eurekaLoggedIn && (
            <ListItem>
              <ObtainedToggle
                disabled={showByColor}
                selectedObtainedFilter={selectedObtainedFilter}
                onObtainedFilterChange={handleObtainedFilterChange}
              />
            </ListItem>
          )}
          <ListItem>
            <CategoryToggle
              categories={categories}
              disabled={showByColor}
              selectedCategory={showByColor ? null : selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </ListItem>
          <ListItem>
            <RarityToggle selectedRarity={selectedRarity} onRarityChange={handleRarityChange} />
          </ListItem>
          <Divider sx={{ mx: 2, mt: 2 }} />
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
              {hasActiveFilters && (
                <Button color="secondary" variant="outlined" onClick={onClearEurekaFilters}>
                  Clear all
                </Button>
              )}
              <Button variant="contained" onClick={() => setOpen(false)}>
                Apply
              </Button>
            </Stack>
          </ListItem>
        </List>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors (new sub-components don't exist yet — errors from missing imports are expected and will be fixed in the next task).

- [ ] **Step 4: Commit after sub-components are created in Task 14**

(Hold this commit until Task 14 is complete.)

---

### Task 14: New filter sub-components for outfits

**Files:**
- Create: `components/filter/outfit-select.tsx`
- Create: `components/filter/outfit-evolution-select.tsx`
- Create: `components/filter/outfit-category-toggle.tsx`
- Create: `components/filter/sort-evolution-toggle.tsx`

- [ ] **Step 1: Create `components/filter/outfit-select.tsx`**

```tsx
// components/filter/outfit-select.tsx
import { OutfitSet } from '@/lib/types/outfit'
import { Category } from '@mui/icons-material'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItem,
  ListItemAvatar,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material'
import LazyAvatar from '../lazy-avatar'
import { MENU_PROPS } from '@/lib/types/props'

export default function OutfitSelect({
  outfitSets,
  selectedOutfitSet,
  onOutfitSetChange,
}: {
  outfitSets: OutfitSet[]
  selectedOutfitSet: string | null
  onOutfitSetChange: (event: SelectChangeEvent) => void
}) {
  return (
    <FormControl sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-set-select-label">Outfit Set</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Outfit Set"
        id="outfit-set-select"
        label="Outfit Set"
        labelId="outfit-set-select-label"
        sx={{ '& .MuiOutlinedInput-input': { py: selectedOutfitSet ? 1 : undefined } }}
        value={selectedOutfitSet ?? ''}
        onChange={onOutfitSetChange}
      >
        <MenuItem value="">—</MenuItem>
        {outfitSets.map((set) => (
          <MenuItem key={set.slug} value={set.slug}>
            <ListItem disablePadding component="div">
              <ListItemAvatar>
                <LazyAvatar alt={set.title} size="sm" src={set.image_url!}>
                  <Category fontSize="inherit" />
                </LazyAvatar>
              </ListItemAvatar>
              <ListItemText>{set.title}</ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
```

- [ ] **Step 2: Create `components/filter/outfit-evolution-select.tsx`**

```tsx
// components/filter/outfit-evolution-select.tsx
import { Evolution } from '@/lib/types/outfit'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import { toTitle } from '@/lib/utils'
import { MENU_PROPS } from '@/lib/types/props'

export default function OutfitEvolutionSelect({
  evolutions,
  selectedEvolution,
  onEvolutionChange,
  disabled,
}: {
  evolutions: Evolution[]
  selectedEvolution: string | null
  onEvolutionChange: (event: SelectChangeEvent) => void
  disabled?: boolean
}) {
  return (
    <FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-evolution-select-label">Evolution</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Evolution"
        id="outfit-evolution-select"
        label="Evolution"
        labelId="outfit-evolution-select-label"
        value={selectedEvolution ?? ''}
        onChange={onEvolutionChange}
      >
        <MenuItem value="">—</MenuItem>
        {evolutions.map((evolution) => (
          <MenuItem key={evolution.slug} value={evolution.slug}>
            {toTitle(evolution.title ?? evolution.slug)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
```

- [ ] **Step 3: Create `components/filter/outfit-category-toggle.tsx`**

```tsx
// components/filter/outfit-category-toggle.tsx
'use client'

import { OutfitCategory } from '@/lib/types/outfit'
import {
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { toTitle } from '@/lib/utils'

export default function OutfitCategoryToggle({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
}: {
  categories: OutfitCategory[]
  selectedCategory: string | null
  onCategoryChange: (event: React.MouseEvent<HTMLElement>, value: string | null) => void
  disabled?: boolean
}) {
  return (
    <FormControl>
      <Typography component={FormLabel} id="outfit-category-buttons-label" variant="overline">
        Category
      </Typography>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="outfit-category-buttons-label"
        disabled={disabled}
        value={selectedCategory}
        onChange={onCategoryChange}
      >
        {categories.map((category) => (
          <Tooltip key={category.slug} title={toTitle(category.title)}>
            <ToggleButton sx={{ py: 0.75 }} value={category.slug}>
              <Typography variant="caption">{toTitle(category.title)}</Typography>
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}
```

- [ ] **Step 4: Create `components/filter/sort-evolution-toggle.tsx`**

```tsx
// components/filter/sort-evolution-toggle.tsx
import { AutoAwesome, ViewDay } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

export default function SortEvolutionToggle({
  groupBySet,
  showByEvolution,
  onGroupBySetChange,
  onShowByEvolutionChange,
}: {
  groupBySet: boolean
  showByEvolution: boolean
  onGroupBySetChange: () => void
  onShowByEvolutionChange: () => void
}) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Group by Outfit Set">
        <ToggleButton
          selected={groupBySet}
          sx={{ py: 1.25 }}
          value="groupBySet"
          onChange={onGroupBySetChange}
        >
          <ViewDay />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Show by Evolution">
        <ToggleButton
          selected={showByEvolution}
          sx={{ py: 1.25 }}
          value="showByEvolution"
          onChange={onShowByEvolutionChange}
        >
          <AutoAwesome />
        </ToggleButton>
      </Tooltip>
    </Stack>
  )
}
```

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit Tasks 13 + 14 together**

```bash
git add components/navbar/filter-menu.tsx components/filter/outfit-select.tsx components/filter/outfit-evolution-select.tsx components/filter/outfit-category-toggle.tsx components/filter/sort-evolution-toggle.tsx
git commit -m "feat: extend FilterMenu with outfits branch and add outfit filter sub-components"
```

---

### Task 15: Route files — layout, loading, page

**Files:**
- Create: `app/outfits/layout.tsx`
- Create: `app/outfits/loading.tsx`
- Modify: `app/outfits/page.tsx`

- [ ] **Step 1: Create `app/outfits/layout.tsx`**

```tsx
// app/outfits/layout.tsx
import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import OutfitDataProvider from '@/components/outfits/outfit-data-provider'
import { SortProvider } from '@/components/sort-context'

async function OutfitProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()

  return (
    <OutfitDataProvider isLoggedIn={!!userId} userId={userId}>
      {children}
    </OutfitDataProvider>
  )
}

export default function OutfitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SortProvider>
      <Suspense>
        <OutfitProviders>{children}</OutfitProviders>
      </Suspense>
    </SortProvider>
  )
}
```

- [ ] **Step 2: Create `app/outfits/loading.tsx`**

```tsx
// app/outfits/loading.tsx
import { Box, Divider, Skeleton, Stack } from '@mui/material'
import { GRID_COLUMNS } from '@/lib/types/props'

function GroupSkeleton() {
  return (
    <Box>
      <Stack
        direction="row"
        sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <Skeleton height={28} variant="text" width={120} />
        <Skeleton height={24} variant="rounded" width={60} />
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          gap: { xs: 1, sm: 1.5, md: 2 },
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            height={0}
            style={{ paddingBottom: '133%' }}
            sx={{ borderRadius: 1 }}
            variant="rectangular"
            width="100%"
          />
        ))}
      </Box>
    </Box>
  )
}

export default function OutfitsLoading() {
  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={4}>
        <GroupSkeleton />
        <GroupSkeleton />
        <GroupSkeleton />
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 3: Replace `app/outfits/page.tsx`**

```tsx
// app/outfits/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from '@/components/outfits/outfit-toolbar'
import FilterOutfits from '@/components/outfits/filter-outfits'
import OutfitsLoading from './loading'

export const metadata: Metadata = {
  title: 'Outfits',
}

export default function OutfitsPage() {
  return (
    <>
      <OutfitToolBar />
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfits />
      </Suspense>
    </>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/outfits/layout.tsx app/outfits/loading.tsx app/outfits/page.tsx
git commit -m "feat: build /outfits page with layout, loading skeleton, and filter grid"
```

---

### Task 16: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
yarn dev
```

- [ ] **Step 2: Verify unauthenticated view**

Visit `http://localhost:3000/outfits`. Confirm:
- Grid loads with outfit variant cards
- "Login to track your collection" alert appears
- Sort button and filter icon appear in toolbar
- Loading skeleton shows during initial fetch

- [ ] **Step 3: Verify filter menu**

Open the filter drawer. Confirm:
- Outfit Set dropdown lists all sets
- Evolution dropdown lists all evolutions
- Category toggle shows outfit categories
- Rarity toggle shows 2–5 stars
- "Group by Set" and "Show by Evolution" toggle buttons work

- [ ] **Step 4: Verify authenticated view**

Log in, then visit `/outfits`. Confirm:
- Obtained toggle icons appear on cards
- Clicking a toggle marks/unmarks the piece
- Progress chips appear in group headers
- "Show by Evolution" switch renders `OutfitEvolutionSetCard` cards
- Filter preferences survive page refresh

- [ ] **Step 5: Verify `/eureka` is unaffected**

Visit `http://localhost:3000/eureka` and confirm the filter menu, variant cards, and obtained toggling still work correctly.

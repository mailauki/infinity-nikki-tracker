# Outfits Page Design

**Date:** 2026-06-08
**Status:** Approved

## Overview

Build the `/outfits` page to match the `/eureka` page in structure and behavior. Users can browse all outfit sets and their variants, toggle individual pieces as obtained, filter and sort the grid, and switch between flat variant view and evolution-grouped view.

## Architecture

### Route files (`app/outfits/`)

- `layout.tsx` — async server component; reads `getUserID()`, wraps children in `SortProvider` + `OutfitDataProvider` (mirrors `app/eureka/layout.tsx`)
- `page.tsx` — renders `<OutfitToolBar />` + `<Suspense fallback={<OutfitsLoading />}><FilterOutfits /></Suspense>`
- `loading.tsx` — skeleton grid matching `EurekaLoading` shape (3 group skeletons, each with 5 variant card skeletons at 4:3 aspect ratio)

### API routes

- `app/api/outfits/route.ts` — GET; fetches `outfit_sets` with nested `outfit_variants`, resolves evolutions and outfit categories, attaches `obtained` boolean per variant from `obtained_outfit` when user is logged in. Returns `OutfitSet[]`.
- `app/api/obtained-outfit/route.ts` — GET; returns current user's `obtained_outfit` records as `ObtainedOutfit[]`. Returns `[]` for unauthenticated users.

### Server action

- `app/outfits/actions.ts` — `handleObtainedOutfit(outfit_set: string, outfit_category: string, evolution: string | null)` — calls `toggle_obtained_outfit` RPC. Mirrors `app/eureka/actions.ts`.

### Schema migration

New columns on the `preferences` table (outfit-specific, separate from eureka columns):

```sql
outfit_set_filter       text default null
outfit_category_filter  text default null
outfit_evolution_filter text default null
outfit_rarity_filter    integer default null
outfit_obtained_filter  text default null
outfit_group_by_set     boolean default true
outfit_show_by_evolution boolean default false
```

`UserPreferences` type in `lib/types/eureka.ts` (where it currently lives) must be extended with these fields.

## Data Layer

### Context (`components/outfits/outfit-context.tsx`)

```ts
interface OutfitFilterState {
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
```

Exports `OutfitDataContext`, `DEFAULT_OUTFIT_FILTERS`, `OutfitFilterState`, and `useOutfitData()`.

### Provider (`components/outfits/outfit-data-provider.tsx`)

Client component. On mount:

1. Fetches `OutfitSet[]` from `/api/outfits`
2. Fetches `OutfitCategory[]` inline (derived from the outfit sets response or a separate call)
3. If logged in: fetches `ObtainedOutfit[]` from `/api/obtained-outfit` and outfit-specific preferences from `/api/preferences`
4. Subscribes to `postgres_changes` on `obtained_outfit` (INSERT + DELETE filtered by `user_id`) for realtime obtained updates

Preference persistence: on filter/grouping state changes (after prefs loaded), calls new server actions `updateOutfitFilters(...)`, `updateOutfitGroupBySet(bool)`, `updateOutfitShowByEvolution(bool)` in `app/actions/preferences.ts`.

## Components (`components/outfits/`)

### `outfit-toolbar.tsx`

Client component. Uses `useOutfitData()` to compute result count (respecting active filters + showByEvolution toggle). Renders inside `NavBarToolbar`:

- Left: "Showing: N results" caption
- Right: `SortButton` + `FilterMenu` (outfit-aware variant)

### `filter-outfits.tsx`

Client component. Uses `useOutfitData()` + `useSortOrder()`. Handles:

- Loading skeleton
- Error alert
- Empty state ("No results / Try adjusting your filters")
- Login alert for unauthenticated users
- Obtained error warning
- Grid: `display: grid`, `gridTemplateColumns: GRID_COLUMNS`, gap responsive
- When `groupBySet`: renders a group header row (set title button + progress chip) before each set's cards
- When `showByEvolution`: renders `OutfitEvolutionSetCard` per evolution within each set
- Otherwise: renders `OutfitVariantCard` per variant

Filter logic mirrors `FilterEureka`: filter by set slug, rarity, evolution slug, category slug, obtained/missing status; then sort by id asc/desc per `sortOrder`.

### `outfit-variant-card.tsx`

Client component. Props: `outfitVariant: OutfitVariant`, `isLoggedIn: boolean`, `isMissingFilter?: boolean`.

- Displays variant image (fallback: `Category` icon)
- Caption: `{OutfitCategory title} • {Evolution title or 'Base'}`
- Obtained toggle icon button (top-right), `TaskAlt` / `RadioButtonUncheckedOutlined`
- Grow exit animation when `isMissingFilter` and toggled (same pattern as `EurekaVariantCard`)
- Uses `useOutfitData().onToggleObtained`

### `outfit-evolution-set-card.tsx`

Client component. Props: `outfitSet: OutfitSet`, `evolution: Evolution | null`, `isLoggedIn: boolean`.

- Shows the evolution's image (fallback: set image)
- Caption: evolution title or "Base"
- Links to `/outfits/${outfitSet.slug}`
- Shows mini progress for this evolution's variants if logged in

### FilterMenu extension

`components/navbar/filter-menu.tsx` needs an outfits-aware section. Since the menu currently reads exclusively from `useEurekaData()`, extend it to detect the active route (via `usePathname()`) and conditionally render outfit filters using `useOutfitData()` when on `/outfits`.

Outfit filter options:

- **Set**: select from `outfitSets` list
- **Category**: select from `outfitCategories`
- **Evolution**: derived from all evolutions present across filtered sets
- **Rarity**: 2–5 stars
- **Obtained**: All / Obtained / Missing

## Key Invariants

- `evolution` can be `null` (base/no-evolution variants) — `onToggleObtained` and `handleObtainedOutfit` must pass `null` for those, matching the RPC signature (`p_evolution` accepts null)
- Outfit categories have a `part` field (`top`, `bottom`, etc.) — not used for filtering but available
- `OutfitDataProvider` must not pass `cookies()` inside a `use cache` block — use React `cache()` pattern, same as Eureka
- Guard `onToggleObtained` calls: only fire if `isLoggedIn`

## File List

**New files:**

- `app/outfits/layout.tsx`
- `app/outfits/loading.tsx`
- `app/outfits/actions.ts`
- `app/api/outfits/route.ts`
- `app/api/obtained-outfit/route.ts`
- `components/outfits/outfit-context.tsx`
- `components/outfits/outfit-data-provider.tsx`
- `components/outfits/outfit-toolbar.tsx`
- `components/outfits/filter-outfits.tsx`
- `components/outfits/outfit-variant-card.tsx`
- `components/outfits/outfit-evolution-set-card.tsx`
- `supabase/migrations/YYYYMMDD_outfit_preference_columns.sql`

**Modified files:**

- `app/outfits/page.tsx` — replace "Coming Soon" with toolbar + filter grid
- `app/actions/preferences.ts` — add outfit preference update actions
- `lib/types/preferences.ts` (or `eureka.ts`) — add outfit preference fields to `UserPreferences`
- `components/navbar/filter-menu.tsx` — add outfit filter section, route-aware

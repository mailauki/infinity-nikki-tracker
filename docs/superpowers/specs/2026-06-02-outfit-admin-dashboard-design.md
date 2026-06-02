# Outfit Admin & Dashboard Pages — Design Spec

## Context

The Infinity Nikki Tracker already has admin forms and a dashboard for Eureka content (sets, variants, trials). This spec covers adding equivalent pages for Outfit content, which uses the same structural pattern but references `outfit_categories`, `evolutions`, and `abilities` instead of `categories`, `colors`, and trials.

The outfit schema is already live in Supabase. TypeScript types (`lib/types/outfit.ts`) and all data hooks are already implemented. This work is purely UI: admin forms + server actions + dashboard tables + nav wiring.

---

## Route Structure

### Admin routes (under `app/(admin)/outfits/`)

These sit inside the existing `app/(admin)/layout.tsx` route group, which already handles admin role guard and `FormContext` / `FormToolBar`.

```
app/(admin)/outfits/
  sets/
    actions.ts                          — addOutfitSet, editOutfitSet server actions
    new/
      page.tsx                          — Server Component, fetches lookup data
      add-outfit-set-form.tsx           — 'use client' form
    edit/[slug]/
      page.tsx                          — Server Component, fetches set + lookup data
      edit-outfit-set-form.tsx          — 'use client' form
  variants/
    actions.ts                          — addOutfitVariant, editOutfitVariant server actions
    new/
      page.tsx                          — Server Component, fetches lookup data
      add-outfit-variant-form.tsx       — 'use client' form
    edit/[slug]/
      page.tsx                          — Server Component, fetches variant + lookup data
      edit-outfit-variant-form.tsx      — 'use client' form
```

### Dashboard routes

```
app/dashboard/outfits/
  sets/
    page.tsx                            — Server Component, fetches outfit sets + styles + labels + abilities
    outfit-set-view.tsx                 — 'use client' view toggle (table / list)
  variants/
    page.tsx                            — Server Component, fetches variants + sets + categories + evolutions
    outfit-variant-view.tsx             — 'use client' view toggle (table / list)
```

### New files in existing directories

```
app/dashboard/
  outfit-set-table.tsx                  — 'use client' DataGrid for outfit sets
  outfit-set-list.tsx                   — 'use client' list view for outfit sets
  outfit-variant-table.tsx              — 'use client' DataGrid for outfit variants
  outfit-variant-list.tsx               — 'use client' list view for outfit variants
```

### Modified files

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Add Outfit Sets + Outfit Variants stat cards |
| `app/dashboard/actions.ts` | Add `updateOutfitSet`, `updateOutfitVariant` |
| `lib/nav-links.tsx` | Add `dashboard.outfits.sets` + `dashboard.outfits.variants`; add dashboard nav sub-items for outfits |
| `lib/types/props.ts` | Extend `DashboardLinks` with `outfits` section |

---

## Data Flow

Each admin/dashboard page follows the established pattern:

1. Server Component fetches data via `hooks/data/` hooks (using React `cache()`)
2. Passes serializable props to a `'use client'` form or view component
3. Forms call server actions (`'use server'`) which write to Supabase and redirect

No new hooks are needed — all required hooks already exist:
- `getOutfitSetsRaw()`, `getOutfitSetRaw(slug)` — `hooks/data/admin/outfit-sets.ts`
- `getOutfitVariantsRaw()`, `getOutfitVariantRaw(slug)` — `hooks/data/admin/outfit-variants.ts`
- `getOutfitSets()` — `hooks/data/outfit-sets.ts`
- `getOutfitCategories()` — `hooks/data/outfit-categories.ts`
- `getEvolutions()` — `hooks/data/evolutions.ts`
- `getAbilities()` — `hooks/data/abilities.ts`
- `getStyles()`, `getLabels()` — existing hooks

---

## Admin Forms

### Add Outfit Set (`add-outfit-set-form.tsx`)

Fields:
- **Title** — text, required; drives slug auto-generation
- **Slug** — read-only by default, unlocked via edit icon; hidden input passes value to server action
- **Description** — multiline text, optional
- **Rarity** — single select 2–5 (same `SparkleIcon` pattern as eureka); limits max evolutions: `{ 5: 5, 4: 3, 3: 1, 2: 0 }`
- **Style** — single select from `getStyles()`
- **Label** — single select from `getLabels()`
- **Ability** — single select from `getAbilities()`
- **Evolutions** — multi-select from `getEvolutions()` (ordered by `order` ASC), capped by rarity; same `ColorSelect`-style chip render or equivalent
- **Default Evolution** — single select from chosen evolutions; disabled if none selected

On save (`addOutfitSet` server action):
1. Insert row into `outfit_sets`
2. Auto-create `outfit_variants` for every `outfit_category × evolution` combination using `toSlugVariant(outfit_set_slug, category_slug, evolution_slug)`; set `default = true` for variants whose evolution matches the default evolution

### Edit Outfit Set (`edit-outfit-set-form.tsx`)

Same metadata fields as add form, pre-populated. Additionally:

- Shows a variant image grid: one `ImageUpload` per variant (keyed by variant slug), `table="outfit_variants"`
- Evolution changes sync variants: added evolutions → insert new variants for all categories; removed evolutions → delete variants for removed evolutions
- Default evolution change → `UPDATE outfit_variants SET default = false WHERE outfit_set = slug`, then `UPDATE ... SET default = true WHERE evolution = defaultEvolution`

### Add Outfit Variant (`add-outfit-variant-form.tsx`)

Fields:
- **Outfit Set** — single select from `getOutfitSetsRaw()`
- **Outfit Category** — single select, grouped by `type` using `ListSubheader` (`Piece` then `Accessory`), showing `part` as the item label
- **Evolution** — single select from `getEvolutions()`, ordered by `order` ASC
- **Image Upload** — `ImageUpload` component, `table="outfit_variants"`
- **Slug** — auto-generated from `toSlugVariant(outfit_set, outfit_category, evolution)`; edit icon unlocks manual entry
- **Default** — Switch; disabled with helper text if the selected outfit_set + outfit_category already has a default variant

### Edit Outfit Variant (`edit-outfit-variant-form.tsx`)

Same fields as add, pre-populated from `getOutfitVariantRaw(slug)`.

---

## Server Actions

### `app/(admin)/outfits/sets/actions.ts`

**`addOutfitSet(_: unknown, formData: FormData)`**
- Parses: title, slug, description, rarity, style, label, ability, `evolution_select` (JSON array of slugs), `default_evolution` (slug string), `outfit_categories` (JSON array of `{slug}` objects)
- Inserts into `outfit_sets`
- Inserts `outfit_variants` for every `outfit_category × evolution` pair; `default = (evolution === defaultEvolution)`
- Rolls back `outfit_sets` insert if variant insert fails
- Redirects to `navLinksData.dashboard.outfits.sets.add.replace('/new', '')`

**`editOutfitSet(id: number, initialEvolutions: string[], backUrl: string, _: unknown, formData: FormData)`**
- Parses same fields as add, plus `original_evolutions` (JSON)
- Updates `outfit_sets` row
- Diffs added/removed evolutions; inserts new variants, deletes removed variants
- Syncs default flag across all variants for this set
- Redirects to `backUrl`

### `app/(admin)/outfits/variants/actions.ts`

**`addOutfitVariant(_: unknown, formData: FormData)`**
- Parses: outfit_set, outfit_category, evolution, image_url, slug, default (boolean)
- Inserts into `outfit_variants`
- Redirects to variants dashboard page

**`editOutfitVariant(id: number, backUrl: string, _: unknown, formData: FormData)`**
- Parses same fields
- Updates `outfit_variants` row
- Redirects to `backUrl`

---

## Dashboard Tables

### `outfit-set-table.tsx` (`OutfitSetTable`)

Type: `OutfitSet` (from `hooks/data/outfit-sets.ts` — enriched type with `evolutions[]`)

Columns:
| Field | Editable | Notes |
|-------|----------|-------|
| actions | — | Edit row / Open in new (→ `/outfits/{slug}`) |
| image_url | locked | Shows `LazyAvatar`; locked to full form |
| title | ✅ | Bold font |
| slug | locked | Monospace |
| rarity | ✅ | `singleSelect` [2,3,4,5]; renders `RarityStars` |
| style | ✅ | `singleSelect` from styles |
| label | ✅ | `singleSelect` from labels |
| ability | ✅ | `singleSelect` from abilities |
| evolutions | locked | Chip list; locked to full form |
| description | ✅ | Plain text |
| updated_at | — | Formatted date |

`processRowUpdate` calls `updateOutfitSet(id, { title, description, rarity, style, label, ability })`

### `outfit-variant-table.tsx` (`OutfitVariantTable`)

Type: `OutfitVariantRaw`

Columns:
| Field | Editable | Notes |
|-------|----------|-------|
| actions | — | Edit row / Open (→ `/outfits/{outfit_set}`) |
| image_url | locked | `LazyAvatar`; locked to full form |
| outfit_set | ✅ | `singleSelect` from outfit sets |
| slug | locked | Monospace |
| outfit_category | ✅ | `singleSelect` from outfit categories |
| evolution | ✅ | `singleSelect` from evolutions |
| default | ✅ | boolean; renders `CheckBox` icon |
| updated_at | — | Formatted date |

`processRowUpdate` calls `updateOutfitVariant(id, { outfit_set, outfit_category, evolution, default })`

---

## Dashboard Stat Cards & Nav

### `app/dashboard/page.tsx`

Add two new `StatCard` entries to the existing grid (making 5 total):
- **Outfit Sets** — `count={outfitSets?.length ?? 0}`, `addHref={isAdmin ? navLinksData.dashboard.outfits.sets.add : undefined}`
- **Outfit Variants** — `count={outfitVariants?.length ?? 0}`, `addHref={isAdmin ? navLinksData.dashboard.outfits.variants.add : undefined}`

Fetch `outfitSets` via `getOutfitSets()` and `outfitVariants` via `getOutfitVariantsRaw()` in the existing `Promise.all`.

### `lib/nav-links.tsx`

Add to `dashboard`:
```ts
outfits: {
  sets:     { add: '/outfits/sets/new',     edit: '/outfits/sets/edit' },
  variants: { add: '/outfits/variants/new', edit: '/outfits/variants/edit' },
}
```

Add outfit sub-items to the Dashboard nav link's `items` array:
```ts
{ title: 'Outfit Sets',      url: '/dashboard/outfits/sets' },
{ title: 'Outfit Variants',  url: '/dashboard/outfits/variants' },
```

### `lib/types/props.ts`

Extend `DashboardLinks`:
```ts
export type DashboardLinks = {
  eureka:  { sets: DashboardLink; variants: DashboardLink; trials: DashboardLink }
  outfits: { sets: DashboardLink; variants: DashboardLink }
}
```

---

## List View Components

`outfit-set-list.tsx` and `outfit-variant-list.tsx` mirror `eureka-set-list.tsx` and `eureka-variant-list.tsx` — simple card/row list for the non-table dashboard view. Display title, slug, rarity (stars), and edit link.

---

## Verification

1. `yarn tsc --noEmit` — no errors after all files are created
2. Navigate to `/outfits/sets/new` as admin — form renders, submit creates outfit_sets row + variants in Supabase
3. Navigate to `/outfits/sets/edit/[slug]` — form pre-populated, image uploads work per variant
4. Navigate to `/outfits/variants/new` — category grouped by type, slug auto-generates, submit creates variant row
5. Navigate to `/dashboard` — see 5 stat cards including Outfit Sets and Outfit Variants with correct counts
6. Navigate to `/dashboard/outfits/sets` — DataGrid renders with inline editing; save calls `updateOutfitSet`
7. Navigate to `/dashboard/outfits/variants` — DataGrid renders; save calls `updateOutfitVariant`
8. Dashboard nav drawer shows outfit sub-items under Dashboard for admin users

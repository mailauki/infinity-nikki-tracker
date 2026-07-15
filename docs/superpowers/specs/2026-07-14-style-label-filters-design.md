# Style & Label Multi-Select Filters — Design

**Date:** 2026-07-14
**Status:** Approved

## Goal

Add two new **multi-select** filters — **Style** and **Label** — to the filter menu of
**both** the Eureka and Outfits domains, persisted across sessions like the existing
filters (set, category, rarity, obtained).

## Background

Both `EurekaSet` (`Tables<'eureka_sets'>`) and `OutfitSet` (`Tables<'outfit_sets'>`)
carry set-level `style` (single slug FK → `styles`) and `label` (single slug FK →
`labels`). Outfit sets additionally carry `label_2` — a set may have up to two labels.

Lookup hooks already exist and are used by admin forms:

- `getStyles()` — `hooks/data/styles.ts` (React `cache()`, returns `Style[]`)
- `getLabels()` — `hooks/data/labels.ts` (React `cache()`, returns `Label[]`)

`Style` / `Label` types (`{ slug, title }`) already live in `lib/types/eureka.ts`.

The filter architecture is: domain `layout.tsx` → data provider (holds filter state +
lookup data) → context → consumed by `filter-menu.tsx` (the controls) and
`filter-eureka.tsx` / `filter-outfits.tsx` (the `.filter()` chains). Existing filters
persist to `user_preferences` via `app/actions/preferences.ts`.

## Decisions

- **Domains:** both Eureka and Outfits.
- **Persistence:** yes — add `user_preferences` columns + migration.
- **Outfit label matching:** a set matches if the selected label is in **either**
  `label` **or** `label_2`.
- **Layout:** Style and Label each on their **own** `ListItem` row (full width),
  consistent with the Category / Rarity rows.

## Matching Semantics

Multi-select = OR within a filter, AND across filters. Both filters apply at the
**set** level (alongside the existing rarity filter), before the per-variant filters.

**Eureka** (`app/eureka/filter-eureka.tsx`, in the `eurekaSets.filter(...)` chain):

```ts
.filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
.filter((set) => !selectedLabel.length || selectedLabel.includes(set.label ?? ''))
```

**Outfits** (`app/outfits/filter-outfits.tsx`, in the `outfitSets.filter(...)` chain):

```ts
.filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
.filter(
  (set) =>
    !selectedLabel.length ||
    selectedLabel.some((l) => l === set.label || l === set.label_2)
)
```

Note: `Standalone Pieces` has a single set-level `style`/`label` like other sets, so no
special-casing is needed (unlike rarity, which it mixes per-variant).

## Components / Changes

### 1. New shared UI component — `components/filter/style-label-select.tsx`

A generic multi-select modeled on `components/filter/outfit-category-select.tsx`:

- Props: `label: string` (e.g. `'Style'` / `'Label'`), `options: { slug, title }[]`,
  `selected: string[]`, `onChange: (next: string[]) => void`, `id: string`,
  optional `disabled`.
- `Select<string[]>` with `multiple`, `MENU_PROPS`, chips in `renderValue`,
  `Checkbox` + `ListItemText` per `MenuItem`, and a Clear `InputAdornment` that
  resets to `[]` when any are selected.
- `onChange` normalizes the MUI event value to `string[]` and hands the parent a
  clean array (parent stays decoupled from `SelectChangeEvent`).

This one component serves all four selects (Style/Label × Eureka/Outfits).

### 2. Filter state — contexts

**`components/eureka/eureka-context.tsx`** — `FilterState` gains:

```ts
selectedStyle: string[]
selectedLabel: string[]
```

Both default to `[]` in `DEFAULT_FILTERS`. Context value gains `styles: Style[]` and
`labels: Label[]` (default `[]`).

**`components/outfits/outfit-context.tsx`** — `OutfitFilterState` gains the same two
fields (default `[]` in `DEFAULT_OUTFIT_FILTERS`); context value gains `styles` /
`labels`.

### 3. Providers — load lookups + persist

**`app/eureka/eureka-data-provider.tsx`** and the Eureka bootstrap route
(`app/api/eureka/bootstrap/route.ts`):

- Add `getStyles()` / `getLabels()` to the bootstrap `Promise.all`, return them in the
  payload, and thread `styles` / `labels` into provider state + context (mirror how
  `categories` / `colors` flow today).

**`app/outfits/outfit-data-provider.tsx`** + **`app/api/outfits/route.ts`:**

- The provider seeds from `fetchJson('/api/outfits')` (currently `{ outfitSets }`,
  deriving `outfitCategories` from `sets[0].outfit_categories`). Styles/labels are
  global lookups, not per-set, so add `getStyles()` / `getLabels()` to the
  `/api/outfits` route and return them in that payload
  (`{ outfitSets, styles, labels }`). The provider's existing seed `useEffect` reads
  them into new `styles` / `labels` state → context.

**Persist effects (both providers):** extend the existing `[filters]` persist effect to
write the new fields (comma-joined slugs, matching `outfit_category_filter`), and extend
the hydrate-from-preferences path to split them back into arrays. `onClearFilters` resets
`selectedStyle` / `selectedLabel` to `[]` (already covered by resetting to
`DEFAULT_*_FILTERS`).

### 4. Filter menu — `components/filter/filter-menu.tsx`

Both the outfits branch and the eureka branch gain two new `ListItem`s (each its own
row), rendering `StyleLabelSelect` for Style and for Label:

```tsx
<ListItem>
  <StyleLabelSelect
    id="style-select"
    label="Style"
    options={styles}
    selected={selectedStyle}
    onChange={(next) => onFiltersChange({ selectedStyle: next })}
  />
</ListItem>
<ListItem>
  <StyleLabelSelect
    id="label-select"
    label="Label"
    options={labels}
    selected={selectedLabel}
    onChange={(next) => onFiltersChange({ selectedLabel: next })}
  />
</ListItem>
```

(Outfits branch reads from `useOutfitData()`, eureka branch from `useEurekaData()`.)

Place them near the existing Category / Rarity rows. Extend both `hasActiveFilters`
expressions with `selectedStyle.length > 0 || selectedLabel.length > 0`.

### 5. Filter application

Add the set-level `.filter(...)` calls from **Matching Semantics** to
`app/eureka/filter-eureka.tsx` and `app/outfits/filter-outfits.tsx`, and destructure
`selectedStyle` / `selectedLabel` from `filters` in each.

### 6. Persistence — DB migration

New migration `supabase/migrations/<timestamp>_add_style_label_filters.sql` adding four
nullable `text` columns to `user_preferences`. Column names follow each domain's
existing convention: Eureka filter columns are bare (`eureka_category`, `eureka_color`),
Outfit ones are suffixed (`outfit_category_filter`):

- `eureka_style`
- `eureka_label`
- `outfit_style_filter`
- `outfit_label_filter`

Stored as comma-joined slug strings (same convention as `outfit_category_filter`);
`null` / empty = no filter.

Wire-up:

- `lib/preferences.ts` `DEFAULT_PREFERENCES` — add the four keys, default `null`.
- `app/actions/preferences.ts` — extend `updateEurekaFilters` and `updateOutfitFilters`
  parameter types + upsert with the new fields.
- Regenerate `lib/types/supabase.ts`
  (`supabase gen types typescript ... > lib/types/supabase.ts`).

## Out of Scope (YAGNI)

- No filter for `label_2` as a distinct control — it participates in the single Label
  filter via the either-match rule.
- No changes to admin forms (styles/labels already editable there).
- No new lookup hooks — `getStyles()` / `getLabels()` already exist.

## Testing / Verification

- `yarn tsc --noEmit` clean.
- Manually (via `/run` or dev server): open each domain's filter menu, confirm Style
  and Label multi-selects appear, chips render, Clear works, selecting narrows the grid
  (OR within, AND across), "Clear all" shows and resets them, and selections survive a
  page reload (persistence).
- Verify the either-label match on an outfit set that has a distinct `label_2`.

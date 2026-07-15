# Style & Label Multi-Select Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persisted multi-select **Style** and **Label** filters to both the Eureka and Outfits filter menus.

**Architecture:** Follows the existing filter pattern — new filter-state fields in each domain context, new lookup data (`styles`/`labels`) threaded provider → context, one reusable `StyleLabelSelect` control rendered in `filter-menu.tsx`, set-level `.filter()` calls in `filter-eureka.tsx`/`filter-outfits.tsx`, and persistence via four new `user_preferences` columns.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, Supabase, TypeScript. Package manager: **Yarn**.

## Global Constraints

- Package manager is **Yarn** — never npm/pnpm.
- Prettier: no semicolons, single quotes, 2-space indent, 100-char width, ES5 trailing commas.
- Path alias `@/` = project root.
- **No test framework exists.** "Verify" = `yarn tsc --noEmit` (clean) + manual check where noted. There is no `pytest`/`jest` in this repo; do not invent one.
- The PostToolUse hook auto-runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write — treat its tsc output as the typecheck signal.
- `git add` on paths with `[slug]` brackets must be quoted (not relevant to files in this plan, but hold the rule).
- Multi-select matching: **OR within a filter, AND across filters**. Outfit label matches on `label` OR `label_2`; Eureka on single `label`.
- DB column names: Eureka bare (`eureka_style`, `eureka_label`), Outfit suffixed (`outfit_style_filter`, `outfit_label_filter`). Stored as comma-joined slug strings; `null`/empty = no filter.
- Work happens on branch `feat/style-label-filters` (already created; the spec commit is its first commit).

---

## File Structure

- **Create:** `components/filter/style-label-select.tsx` — reusable multi-select control.
- **Create:** `supabase/migrations/<timestamp>_add_style_label_filters.sql` — 4 new columns.
- **Modify:** `lib/types/supabase.ts` (regenerated), `lib/types/eureka.ts` (`UserPreferences` picks), `lib/preferences.ts` (defaults), `app/actions/preferences.ts` (action param types).
- **Modify:** `components/eureka/eureka-context.tsx`, `components/outfits/outfit-context.tsx` (state + context value).
- **Modify:** `app/api/eureka/bootstrap/route.ts`, `app/api/outfits/route.ts` (return styles/labels).
- **Modify:** `app/eureka/eureka-data-provider.tsx`, `app/outfits/outfit-data-provider.tsx` (load, persist, hydrate).
- **Modify:** `components/filter/filter-menu.tsx` (render controls + active-filter checks).
- **Modify:** `app/eureka/filter-eureka.tsx`, `app/outfits/filter-outfits.tsx` (apply filters).

Task order is dependency-driven: DB/types first, then the shared control, then context, then providers/routes, then menu + application.

---

### Task 1: DB migration + regenerate types

**Files:**

- Create: `supabase/migrations/<timestamp>_add_style_label_filters.sql`
- Modify: `lib/types/supabase.ts` (regenerated)
- Modify: `lib/types/eureka.ts:76-100` (UserPreferences Pick list)
- Modify: `lib/preferences.ts:3-25` (DEFAULT_PREFERENCES)

**Interfaces:**

- Produces: four `user_preferences` columns (`eureka_style`, `eureka_label`, `outfit_style_filter`, `outfit_label_filter`, all `text` nullable); `UserPreferences` type gains those four keys; `DEFAULT_PREFERENCES` gains them defaulting to `null`.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/<timestamp>_add_style_label_filters.sql` (use a timestamp later than the latest existing migration, format `YYYYMMDDHHMMSS`, e.g. `20260714120000_add_style_label_filters.sql`):

```sql
alter table public.user_preferences
  add column if not exists eureka_style text,
  add column if not exists eureka_label text,
  add column if not exists outfit_style_filter text,
  add column if not exists outfit_label_filter text;
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push --include-all`
Expected: reports the new migration applied with no error. (If local migrations predate the remote, `--include-all` is required — per CLAUDE.md.)

- [ ] **Step 3: Regenerate Supabase types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Expected: `lib/types/supabase.ts` now lists the four new columns under `user_preferences` Row/Insert/Update.

- [ ] **Step 4: Add the columns to the UserPreferences type**

In `lib/types/eureka.ts`, add these four lines to the `UserPreferences` `Pick<...>` union (after `'eureka_rarity'` and `'outfit_obtained_filter'` respectively, grouping by domain):

```ts
  | 'eureka_style'
  | 'eureka_label'
```

```ts
  | 'outfit_style_filter'
  | 'outfit_label_filter'
```

- [ ] **Step 5: Add defaults to DEFAULT_PREFERENCES**

In `lib/preferences.ts`, add to the `DEFAULT_PREFERENCES` object — `eureka_style: null` and `eureka_label: null` alongside the other `eureka_*` keys; `outfit_style_filter: null` and `outfit_label_filter: null` alongside the other `outfit_*` keys:

```ts
  eureka_style: null,
  eureka_label: null,
```

```ts
  outfit_style_filter: null,
  outfit_label_filter: null,
```

- [ ] **Step 6: Typecheck**

Run: `yarn tsc --noEmit`
Expected: clean (no errors). `DEFAULT_PREFERENCES` still satisfies `UserPreferences` now that both sides gained the same four keys.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations lib/types/supabase.ts lib/types/eureka.ts lib/preferences.ts
git commit -m "feat(filters): add style/label columns to user_preferences"
```

---

### Task 2: Reusable StyleLabelSelect control

**Files:**

- Create: `components/filter/style-label-select.tsx`

**Interfaces:**

- Consumes: `Style` / `Label` are structurally `{ slug: string; title: string | null }` (both from `lib/types/eureka.ts`); `MENU_PROPS` from `lib/types/props.ts`; `toTitle` from `lib/utils.ts`.
- Produces: default export `StyleLabelSelect` with props:

  ```ts
  {
    id: string
    label: string
    options: { slug: string; title: string | null }[]
    selected: string[]
    onChange: (next: string[]) => void
    disabled?: boolean
  }
  ```

- [ ] **Step 1: Write the component**

Create `components/filter/style-label-select.tsx` (modeled on `components/filter/outfit-category-select.tsx`, but generic and handing the parent a clean `string[]`):

```tsx
'use client'

import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import { Clear } from '@mui/icons-material'

import { MENU_PROPS } from '@/lib/types/props'
import { toTitle } from '@/lib/utils'

type Option = { slug: string; title: string | null }

type StyleLabelSelectProps = {
  id: string
  label: string
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export default function StyleLabelSelect({
  id,
  label,
  options,
  selected,
  onChange,
  disabled,
}: StyleLabelSelectProps) {
  const optionLabel = (option: Option) => toTitle(option.title ?? option.slug)

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    onChange(typeof value === 'string' ? value.split(',').filter(Boolean) : value)
  }

  return (
    <FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select<string[]>
        multiple
        MenuProps={MENU_PROPS}
        aria-label={label}
        endAdornment={
          selected.length > 0 && (
            <InputAdornment position="end" sx={{ mr: 3 }}>
              <IconButton
                aria-label={`Clear ${label.toLowerCase()}`}
                edge="end"
                size="small"
                onClick={() => onChange([])}
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }
        id={id}
        label={label}
        labelId={`${id}-label`}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {options
              .filter((option) => value.includes(option.slug))
              .map((option) => (
                <Chip key={option.slug} label={optionLabel(option)} size="small" />
              ))}
          </Box>
        )}
        value={selected}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.slug} value={option.slug}>
            <Checkbox checked={selected.includes(option.slug)} />
            <ListItemText primary={optionLabel(option)} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn tsc --noEmit`
Expected: clean. (Component is not yet imported anywhere; this just confirms it compiles.)

- [ ] **Step 3: Commit**

```bash
git add components/filter/style-label-select.tsx
git commit -m "feat(filters): add reusable StyleLabelSelect control"
```

---

### Task 3: Context state — Eureka & Outfits

**Files:**

- Modify: `components/eureka/eureka-context.tsx`
- Modify: `components/outfits/outfit-context.tsx`

**Interfaces:**

- Consumes: `Style`, `Label` from `@/lib/types/eureka`.
- Produces:
  - Eureka `FilterState` gains `selectedStyle: string[]` and `selectedLabel: string[]` (default `[]`); context value gains `styles: Style[]` and `labels: Label[]` (default `[]`).
  - Outfit `OutfitFilterState` gains `selectedStyle: string[]` and `selectedLabel: string[]` (default `[]`); context value gains `styles: Style[]` and `labels: Label[]` (default `[]`).

- [ ] **Step 1: Update the Eureka context**

In `components/eureka/eureka-context.tsx`:

Add to the import from `@/lib/types/eureka` — include `Label` and `Style`:

```ts
import {
  EurekaCategory,
  EurekaColor,
  EurekaSet,
  Label,
  ObtainedEureka,
  Style,
  Trial,
} from '@/lib/types/eureka'
```

Add to `interface FilterState` (after `selectedRarity`):

```ts
  selectedStyle: string[]
  selectedLabel: string[]
```

Add to `interface EurekaDataContextValue` (after `colors: EurekaColor[]`):

```ts
  styles: Style[]
  labels: Label[]
```

Add to `DEFAULT_FILTERS` (after `selectedRarity: null`):

```ts
  selectedStyle: [],
  selectedLabel: [],
```

Add to the `createContext(...)` default value (after `colors: [],`):

```ts
  styles: [],
  labels: [],
```

- [ ] **Step 2: Update the Outfit context**

In `components/outfits/outfit-context.tsx`:

Add an import for the lookup types:

```ts
import { Label, Style } from '@/lib/types/eureka'
```

Add to `OutfitFilterState` (after `selectedObtainedFilter`):

```ts
  selectedStyle: string[]
  selectedLabel: string[]
```

Add to `interface OutfitDataContextValue` (after `outfitCategories: OutfitCategory[]`):

```ts
  styles: Style[]
  labels: Label[]
```

Add to `DEFAULT_OUTFIT_FILTERS` (after `selectedObtainedFilter: null`):

```ts
  selectedStyle: [],
  selectedLabel: [],
```

Add to the `createContext(...)` default value (after `outfitCategories: [],`):

```ts
  styles: [],
  labels: [],
```

- [ ] **Step 3: Typecheck**

Run: `yarn tsc --noEmit`
Expected: errors are acceptable ONLY in the two providers (they don't yet supply `styles`/`labels` to the context value) — those are fixed in Task 4/5. If any error appears outside `eureka-data-provider.tsx` / `outfit-data-provider.tsx`, fix it before continuing.

- [ ] **Step 4: Commit**

```bash
git add components/eureka/eureka-context.tsx components/outfits/outfit-context.tsx
git commit -m "feat(filters): add style/label state to eureka & outfit contexts"
```

---

### Task 4: Eureka provider + bootstrap route

**Files:**

- Modify: `app/api/eureka/bootstrap/route.ts`
- Modify: `app/eureka/eureka-data-provider.tsx`

**Interfaces:**

- Consumes: `getStyles` from `@/hooks/data/styles`, `getLabels` from `@/hooks/data/labels` (both `() => Promise<Style[] | Label[]>`); the Task 3 Eureka context fields.
- Produces: `/api/eureka/bootstrap` JSON gains `styles` and `labels`; provider supplies `styles`/`labels` to context and persists/hydrates `selectedStyle`/`selectedLabel` via `eureka_style`/`eureka_label`.

- [ ] **Step 1: Return styles/labels from the bootstrap route**

In `app/api/eureka/bootstrap/route.ts`:

Add imports:

```ts
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
```

Add `getStyles()` and `getLabels()` to the `Promise.all` and destructure them:

```ts
const [sets, categories, colors, trials, styles, labels, obtained] = await Promise.all([
  getEurekaSets(),
  getEurekaCategories(),
  getEurekaColors(),
  getTrials(),
  getStyles(),
  getLabels(),
  userId ? getObtainedEureka(userId) : Promise.resolve<ObtainedEureka[]>([]),
])

return NextResponse.json({ sets, categories, colors, trials, styles, labels, obtained })
```

- [ ] **Step 2: Read styles/labels into provider state**

In `app/eureka/eureka-data-provider.tsx`:

Add `Label` and `Style` to the `@/lib/types/eureka` import:

```ts
import {
  EurekaCategory,
  EurekaColor,
  EurekaSet,
  Label,
  ObtainedEureka,
  Style,
  Trial,
  UserPreferences,
} from '@/lib/types/eureka'
```

Extend the `EurekaBootstrap` interface:

```ts
interface EurekaBootstrap {
  sets: EurekaSet[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
  trials: Trial[]
  styles: Style[]
  labels: Label[]
  obtained: ObtainedEureka[]
}
```

Add state (after the `colors` state line):

```ts
const [styles, setStyles] = useState<Style[]>([])
const [labels, setLabels] = useState<Label[]>([])
```

Update the bootstrap `.then(...)` destructure + setters:

```ts
      .then(({ sets, categories: cats, colors: cols, trials: trls, styles: sty, labels: lbl, obtained }) => {
        setEurekaSets(sets)
        setCategories(cats)
        setColors(cols)
        setTrials(trls)
        setStyles(sty)
        setLabels(lbl)
        setObtainedEureka(obtained)
        setIsLoading(false)
      })
```

- [ ] **Step 3: Hydrate style/label from preferences**

In the same file, in the preferences `.then((prefs) => { setFilters({ ... }) })`, add to the `setFilters` object (after `selectedRarity`):

```ts
          selectedStyle: prefs.eureka_style ? prefs.eureka_style.split(',').filter(Boolean) : [],
          selectedLabel: prefs.eureka_label ? prefs.eureka_label.split(',').filter(Boolean) : [],
```

- [ ] **Step 4: Persist style/label on filter change**

In the `useEffect(... [filters])` persist effect, add to the `updateEurekaFilters({ ... })` call (after `eureka_rarity`):

```ts
        eureka_style: filters.selectedStyle.length ? filters.selectedStyle.join(',') : null,
        eureka_label: filters.selectedLabel.length ? filters.selectedLabel.join(',') : null,
```

- [ ] **Step 5: Expose styles/labels on the context value**

In the `<EurekaDataContext.Provider value={{ ... }}>`, add (after `colors,`):

```ts
        styles,
        labels,
```

- [ ] **Step 6: Extend updateEurekaFilters action signature**

In `app/actions/preferences.ts`, extend the `updateEurekaFilters` param type (after `eureka_rarity?`):

```ts
  eureka_style?: string | null
  eureka_label?: string | null
```

- [ ] **Step 7: Typecheck**

Run: `yarn tsc --noEmit`
Expected: no errors related to the Eureka provider, bootstrap route, or `updateEurekaFilters`. (Outfit provider may still error — fixed in Task 5.)

- [ ] **Step 8: Commit**

```bash
git add app/api/eureka/bootstrap/route.ts app/eureka/eureka-data-provider.tsx app/actions/preferences.ts
git commit -m "feat(filters): load & persist eureka style/label filters"
```

---

### Task 5: Outfit provider + outfits route

**Files:**

- Modify: `app/api/outfits/route.ts`
- Modify: `app/outfits/outfit-data-provider.tsx`
- Modify: `app/actions/preferences.ts`

**Interfaces:**

- Consumes: `getStyles`, `getLabels`; the Task 3 Outfit context fields.
- Produces: `/api/outfits` JSON gains `styles`/`labels`; provider supplies them to context and persists/hydrates `selectedStyle`/`selectedLabel` via `outfit_style_filter`/`outfit_label_filter`.

- [ ] **Step 1: Return styles/labels from the outfits route**

In `app/api/outfits/route.ts`:

Add imports:

```ts
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { Label, Style } from '@/lib/types/eureka'
```

Fetch them alongside the other lookups. Replace the existing `outfitCategories`/`evolutions` fetch line:

```ts
const [outfitCategories, evolutions, styles, labels] = await Promise.all([
  getOutfitCategories(),
  getEvolutions(),
  getStyles(),
  getLabels(),
])
```

Both `return NextResponse.json(...)` calls must include `styles`/`labels`. The logged-out return:

```ts
return NextResponse.json({ outfitSets: outfits, styles, labels })
```

The final return:

```ts
return NextResponse.json({ outfitSets: outfitsWithObtained, styles, labels })
```

(Type the destructured `styles`/`labels` via the imported `Style`/`Label` if tsc needs it — `getStyles`/`getLabels` already return those types.)

- [ ] **Step 2: Read styles/labels into provider state**

In `app/outfits/outfit-data-provider.tsx`:

Add to the `@/lib/types/eureka` import (currently `import { UserPreferences } from '@/lib/types/eureka'`):

```ts
import { Label, Style, UserPreferences } from '@/lib/types/eureka'
```

Add state (after the `outfitCategories` state line):

```ts
const [styles, setStyles] = useState<Style[]>([])
const [labels, setLabels] = useState<Label[]>([])
```

Update the `/api/outfits` fetch generic + `.then(...)`:

```ts
fetchJson<{ outfitSets: OutfitSet[]; styles: Style[]; labels: Label[] }>('/api/outfits').then(
  ({ outfitSets: sets, styles: sty, labels: lbl }) => {
    setOutfitSets(sets)
    if (sets.length > 0) {
      setOutfitCategories(sets[0].outfit_categories)
    }
    setStyles(sty)
    setLabels(lbl)
    setIsLoading(false)
  }
)
```

- [ ] **Step 3: Hydrate style/label from preferences**

In the preferences `.then((prefs) => { ... setFilters({ ... }) })`, add to the `setFilters` object (after `selectedObtainedFilter`):

```ts
          selectedStyle: prefs.outfit_style_filter
            ? prefs.outfit_style_filter.split(',').filter(Boolean)
            : [],
          selectedLabel: prefs.outfit_label_filter
            ? prefs.outfit_label_filter.split(',').filter(Boolean)
            : [],
```

- [ ] **Step 4: Persist style/label on filter change**

In the `useEffect(... [filters])` persist effect, add to the `updateOutfitFilters({ ... })` call (after `outfit_obtained_filter`):

```ts
        outfit_style_filter: filters.selectedStyle.length
          ? filters.selectedStyle.join(',')
          : null,
        outfit_label_filter: filters.selectedLabel.length
          ? filters.selectedLabel.join(',')
          : null,
```

- [ ] **Step 5: Expose styles/labels on the context value**

In the `<OutfitDataContext.Provider value={{ ... }}>`, add (after `outfitCategories,`):

```ts
        styles,
        labels,
```

- [ ] **Step 6: Extend updateOutfitFilters action signature**

In `app/actions/preferences.ts`, extend the `updateOutfitFilters` param type (after `outfit_obtained_filter?`):

```ts
  outfit_style_filter?: string | null
  outfit_label_filter?: string | null
```

- [ ] **Step 7: Typecheck**

Run: `yarn tsc --noEmit`
Expected: clean across the whole project now (both providers supply `styles`/`labels`; both action signatures accept the new fields).

- [ ] **Step 8: Commit**

```bash
git add app/api/outfits/route.ts app/outfits/outfit-data-provider.tsx app/actions/preferences.ts
git commit -m "feat(filters): load & persist outfit style/label filters"
```

---

### Task 6: Render controls in the filter menu

**Files:**

- Modify: `components/filter/filter-menu.tsx`

**Interfaces:**

- Consumes: `StyleLabelSelect` (Task 2); `styles`/`labels` and `selectedStyle`/`selectedLabel` from both contexts (Tasks 3-5).
- Produces: Style + Label rows in both the outfits branch and the eureka branch; both `hasActiveFilters` checks account for the new filters.

- [ ] **Step 1: Import the control**

In `components/filter/filter-menu.tsx`, add:

```ts
import StyleLabelSelect from './style-label-select'
```

- [ ] **Step 2: Destructure the new data (outfits branch)**

Extend the `useOutfitData()` destructure to include `styles: outfitStyles` and `labels: outfitLabels`:

```ts
const {
  outfitSets,
  outfitCategories,
  styles: outfitStyles,
  labels: outfitLabels,
  isLoggedIn: outfitLoggedIn,
  // ...existing fields unchanged...
} = useOutfitData()
```

And where `outfitFilters` is destructured in the outfits branch (`const { selectedOutfitSet, selectedEvolution, selectedObtainedFilter, selectedRarity } = outfitFilters`), add `selectedStyle` and `selectedLabel`:

```ts
const {
  selectedOutfitSet,
  selectedEvolution,
  selectedObtainedFilter,
  selectedRarity,
  selectedStyle,
  selectedLabel,
} = outfitFilters
```

- [ ] **Step 3: Add the rows and active-filter check (outfits branch)**

Add to the `hasActiveFilters` expression in the outfits branch:

```ts
      selectedStyle.length > 0 ||
      selectedLabel.length > 0 ||
```

Add two new `<ListItem>`s after the `RarityToggle` `ListItem` in the outfits branch:

```tsx
            <ListItem>
              <StyleLabelSelect
                id="outfit-style-select"
                label="Style"
                options={outfitStyles}
                selected={selectedStyle}
                onChange={(next) => onOutfitFiltersChange({ selectedStyle: next })}
              />
            </ListItem>
            <ListItem>
              <StyleLabelSelect
                id="outfit-label-select"
                label="Label"
                options={outfitLabels}
                selected={selectedLabel}
                onChange={(next) => onOutfitFiltersChange({ selectedLabel: next })}
              />
            </ListItem>
```

- [ ] **Step 4: Destructure the new data (eureka branch)**

Extend the `useEurekaData()` destructure to include `styles` and `labels`:

```ts
const {
  eurekaSets,
  categories,
  colors,
  styles,
  labels,
  isLoggedIn,
  // ...existing fields unchanged...
} = useEurekaData()
```

Add `selectedStyle` and `selectedLabel` to the eureka `filters` destructure (`const { selectedEurekaSet, selectedCategory, selectedObtainedFilter, selectedColor, selectedRarity } = filters`):

```ts
const {
  selectedEurekaSet,
  selectedCategory,
  selectedObtainedFilter,
  selectedColor,
  selectedRarity,
  selectedStyle,
  selectedLabel,
} = filters
```

- [ ] **Step 5: Add the rows and active-filter check (eureka branch)**

Add to the eureka `hasActiveFilters` expression:

```ts
    selectedStyle.length > 0 ||
    selectedLabel.length > 0 ||
```

Add two new `<ListItem>`s after the eureka `RarityToggle` `ListItem`:

```tsx
          <ListItem>
            <StyleLabelSelect
              id="eureka-style-select"
              label="Style"
              options={styles}
              selected={selectedStyle}
              onChange={(next) => onFiltersChange({ selectedStyle: next })}
            />
          </ListItem>
          <ListItem>
            <StyleLabelSelect
              id="eureka-label-select"
              label="Label"
              options={labels}
              selected={selectedLabel}
              onChange={(next) => onFiltersChange({ selectedLabel: next })}
            />
          </ListItem>
```

- [ ] **Step 6: Typecheck**

Run: `yarn tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add components/filter/filter-menu.tsx
git commit -m "feat(filters): render style/label selects in the filter menu"
```

---

### Task 7: Apply the filters to the grids

**Files:**

- Modify: `app/eureka/filter-eureka.tsx`
- Modify: `app/outfits/filter-outfits.tsx`

**Interfaces:**

- Consumes: `selectedStyle`/`selectedLabel` from each domain's `filters`.
- Produces: filtered grids honoring style (both) and label (either `label`/`label_2` for outfits, single `label` for eureka).

- [ ] **Step 1: Apply in Eureka**

In `app/eureka/filter-eureka.tsx`:

Add `selectedStyle` and `selectedLabel` to the `filters` destructure:

```ts
const {
  selectedEurekaSet,
  selectedCategory,
  selectedObtainedFilter,
  selectedColor,
  selectedRarity,
  selectedStyle,
  selectedLabel,
} = filters
```

Add two `.filter(...)` calls to the `eurekaSets` chain, right after the `selectedRarity` filter (before the `.map(...)`):

```ts
    .filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
    .filter((set) => !selectedLabel.length || selectedLabel.includes(set.label ?? ''))
```

- [ ] **Step 2: Apply in Outfits**

In `app/outfits/filter-outfits.tsx`:

Add `selectedStyle` and `selectedLabel` to the `filters` destructure:

```ts
const {
  selectedOutfitSet,
  selectedOutfitCategory,
  selectedEvolution,
  selectedObtainedFilter,
  selectedRarity,
  selectedStyle,
  selectedLabel,
} = filters
```

Add two `.filter(...)` calls to the `outfitSets` chain, right after the `selectedRarity` set-level filter (the one ending `return set.rarity === selectedRarity`), before the `.map(...)`:

```ts
    .filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
    .filter(
      (set) =>
        !selectedLabel.length ||
        selectedLabel.some((l) => l === set.label || l === set.label_2)
    )
```

- [ ] **Step 3: Typecheck**

Run: `yarn tsc --noEmit`
Expected: clean. (`set.style`, `set.label`, `set.label_2` all exist on the DB row types the domain types extend.)

- [ ] **Step 4: Manual verification**

Run: `yarn dev`, open `http://localhost:3000/eureka` and `http://localhost:3000/outfits`. In each filter menu:

- Style and Label multi-selects appear with chips + checkboxes.
- Selecting one or more styles narrows the grid to matching sets; same for labels; combining them ANDs (fewer results).
- The Clear (×) adornment on each select empties it.
- "Clear all" appears when a style/label is selected and resets them.
- On an outfit set known to carry a distinct `label_2`, selecting that secondary label shows the set (proves the either-match).
- Reload the page while logged in — selections persist.

Expected: all of the above hold.

- [ ] **Step 5: Commit**

```bash
git add app/eureka/filter-eureka.tsx app/outfits/filter-outfits.tsx
git commit -m "feat(filters): apply style/label filters to eureka & outfit grids"
```

---

## Final Verification

- [ ] `yarn tsc --noEmit` clean.
- [ ] `yarn lint` clean (or only pre-existing warnings).
- [ ] Manual pass from Task 7 Step 4 all green in both domains.
- [ ] Open a PR from `feat/style-label-filters` into `main`.

## Notes / Risks

- **Migration ordering:** if a PR is already open when the migration lands, add it as a _new_ file rather than renaming — a rewritten timestamp mid-PR triggers the (benign but noisy) Supabase Preview red check (per CLAUDE.md).
- **`toTitle` on styles/labels:** styles/labels store `title` already human-readable; `toTitle(title ?? slug)` is defensive and matches the category control's approach. If titles come out double-cased oddly, prefer `option.title ?? toTitle(option.slug)` — but only if a real display bug appears (YAGNI otherwise).
- **`set.style ?? ''`**: a set with a null style can never match a non-empty selection (correct — `includes('')` is false for real slugs), so the `?? ''` is only to satisfy the `string[]` `includes` signature.

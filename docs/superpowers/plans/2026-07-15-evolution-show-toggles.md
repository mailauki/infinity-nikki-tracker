# Evolution Show-Toggles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the main outfits filter's two hide-toggles with three additive show-toggles (Show Base / Show Evolutions / Show Glow-ups) that work in tandem with the order-toggle, and persist them.

**Architecture:** Flip the evolution filter from hide-semantics to show-semantics end-to-end: rewrite `isEvolutionVisible`, swap the two `outfit_hide_*` preference columns for three `outfit_show_*` columns, add a new `EvolutionShowToggle` control, and thread three show-flags through context → provider → filter-menu → filter-outfits. The seasons subsystem is intentionally untouched (follow-up), so `isEvolutionVisible`'s seasons caller is adapted with inverted values and `EvolutionToggle`/`GlowupToggle` are kept.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, Supabase, TypeScript. Package manager: **Yarn**.

## Global Constraints

- Package manager is **Yarn** — never npm/pnpm.
- Prettier: no semicolons, single quotes, 2-space indent, 100-char width, ES5 trailing commas.
- Path alias `@/` = project root.
- **No test framework exists.** "Verify" = `yarn tsc --noEmit` (clean) + manual check where noted. No pytest/jest — do not invent one.
- The PostToolUse hook auto-runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write.
- Show-flags default to `true` (everything visible), matching today's "nothing hidden" default.
- **Seasons is OUT of scope.** Do NOT modify `app/outfits/seasons/[slug]/season-filter-context.tsx`, `season-progress.tsx`, or `components/slug-toolbar.tsx`. Do NOT delete `EvolutionToggle` or `GlowupToggle` — the seasons path still renders them.
- DB columns: add `outfit_show_base`, `outfit_show_evolutions`, `outfit_show_glowups` (boolean, not null, default true); drop `outfit_hide_evolutions`, `outfit_hide_glowups`.
- Work happens on the existing branch `chore/filter-menu-tweaks` (already has the spec commit + the WIP `availableOrders`/`styles` edits). Do NOT create a new branch.
- `git add` on paths with `[slug]` brackets must be quoted in zsh.

---

## File Structure

- **Modify:** `hooks/outfit.ts` — `isEvolutionVisible` signature/body.
- **Create:** `components/filter/evolution-show-toggle.tsx` — the new three-button control.
- **Keep untouched:** `components/filter/evolution-toggle.tsx`, `glowup-toggle.tsx` (seasons still uses them).
- **Modify:** `supabase/migrations/<new>.sql`, `lib/types/supabase.ts` (regen), `lib/types/eureka.ts`, `lib/preferences.ts`, `hooks/data/preferences.ts`, `app/actions/preferences.ts`.
- **Modify:** `components/outfits/outfit-context.tsx`, `app/outfits/outfit-data-provider.tsx`.
- **Modify:** `components/filter/filter-menu.tsx`, `app/outfits/filter-outfits.tsx`, `app/outfits/outfit-toolbar.tsx`, `app/outfits/seasons/[slug]/season-outfit-list.tsx` (the last: inverted-value adaptation only).

Task order: shared function first (Task 1) so all callers compile against the new signature within their tasks; then DB/prefs (Task 2); then the control (Task 3); then context+provider (Task 4); then the two main-outfits consumers + toolbar + seasons-caller (Task 5); then filter-menu wiring (Task 6). Task 1 deliberately updates all four call sites in the same task to keep the tree tsc-clean.

---

### Task 1: Rewrite `isEvolutionVisible` + update all four call sites

**Files:**

- Modify: `hooks/outfit.ts:74-90`
- Modify: `app/outfits/filter-outfits.tsx` (~line 142, ~line 274)
- Modify: `app/outfits/outfit-toolbar.tsx` (~line 50; destructure ~line 18)
- Modify: `app/outfits/seasons/[slug]/season-outfit-list.tsx` (~line 31)

**Interfaces:**

- Produces: `isEvolutionVisible({ stateSlug, baseSlug, isGlowupState, showBase, showEvolutions, showGlowups }): boolean` — replaces the old `hideEvolutions`/`hideGlowups` params. Base→`showBase`, glow-up→`showGlowups`, other→`showEvolutions`.
- Consumes (this task only, temporary): `filter-outfits.tsx` and `outfit-toolbar.tsx` still read `hideEvolutions`/`hideGlowups` from context (Task 4 renames those); to keep this task self-contained and tsc-clean, pass `showBase: true, showEvolutions: !hideEvolutions, showGlowups: !hideGlowups` at those two sites for now. Task 5 replaces them with the real show-flags.

- [ ] **Step 1: Rewrite the function**

In `hooks/outfit.ts`, replace the whole `isEvolutionVisible` function (lines 74-90):

```ts
export function isEvolutionVisible({
  stateSlug,
  baseSlug,
  isGlowupState,
  showBase,
  showEvolutions,
  showGlowups,
}: {
  stateSlug: string | null
  baseSlug: string
  isGlowupState: boolean
  showBase: boolean
  showEvolutions: boolean
  showGlowups: boolean
}): boolean {
  if (stateSlug === baseSlug) return showBase
  if (isGlowupState) return showGlowups
  return showEvolutions
}
```

- [ ] **Step 2: Update `filter-outfits.tsx` call site 1 (scopedVariants, ~line 142)**

Change the `isEvolutionVisible({ ... })` call in the `scopedVariants` filter from `hideEvolutions, hideGlowups` to:

```ts
return isEvolutionVisible({
  stateSlug: v.outfit_set,
  baseSlug,
  isGlowupState: !!evo && isGlowup(evo),
  showBase: true,
  showEvolutions: !hideEvolutions,
  showGlowups: !hideGlowups,
})
```

- [ ] **Step 3: Update `filter-outfits.tsx` call site 2 (OutfitSetCard shouldHide, ~line 274)**

Change the `!isEvolutionVisible({ ... })` call the same way:

```ts
!isEvolutionVisible({
  stateSlug,
  baseSlug,
  isGlowupState: !!evolution && isGlowup(evolution),
  showBase: true,
  showEvolutions: !hideEvolutions,
  showGlowups: !hideGlowups,
})
```

- [ ] **Step 4: Update `outfit-toolbar.tsx` (~line 50)**

The destructure at line 18 (`const { outfitSets, groupBySet, hideEvolutions, hideGlowups, filters } = useOutfitData()`) stays as-is for this task. Change the `isEvolutionVisible({ ... })` call:

```ts
return isEvolutionVisible({
  stateSlug: v.outfit_set,
  baseSlug,
  isGlowupState: !!evo && isGlowup(evo),
  showBase: true,
  showEvolutions: !hideEvolutions,
  showGlowups: !hideGlowups,
})
```

- [ ] **Step 5: Update `season-outfit-list.tsx` (~line 31)**

This is the seasons caller — it keeps its own hide-based context (untouched). Adapt the call to the new signature with inverted values:

```ts
const visible = isEvolutionVisible({
  stateSlug: evolution.slug,
  baseSlug,
  isGlowupState: isGlowup(evolution),
  showBase: true,
  showEvolutions: !hideEvolutions,
  showGlowups: !hideGlowups,
})
```

- [ ] **Step 6: Typecheck**

Run: `yarn tsc --noEmit`
Expected: clean. All four callers now match the new signature; seasons behavior is preserved (inverted values).

- [ ] **Step 7: Commit**

```bash
git add hooks/outfit.ts app/outfits/filter-outfits.tsx app/outfits/outfit-toolbar.tsx 'app/outfits/seasons/[slug]/season-outfit-list.tsx'
git commit -m "refactor(outfits): flip isEvolutionVisible to show-semantics"
```

---

### Task 2: DB migration + prefs plumbing

**Files:**

- Create: `supabase/migrations/<timestamp>_evolution_show_toggles.sql`
- Modify: `lib/types/supabase.ts` (regen)
- Modify: `lib/types/eureka.ts` (UserPreferences Pick)
- Modify: `lib/preferences.ts` (DEFAULT_PREFERENCES)
- Modify: `hooks/data/preferences.ts` (.select())
- Modify: `app/actions/preferences.ts` (actions)

**Interfaces:**

- Produces: `user_preferences` gains `outfit_show_base`/`outfit_show_evolutions`/`outfit_show_glowups` (boolean not null default true), loses `outfit_hide_evolutions`/`outfit_hide_glowups`. `UserPreferences` type + `DEFAULT_PREFERENCES` swap accordingly. New actions `updateOutfitShowBase`/`updateOutfitShowEvolutions`/`updateOutfitShowGlowups`; old `updateOutfitHideEvolutions`/`updateOutfitHideGlowups` removed.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/<timestamp>_evolution_show_toggles.sql` (timestamp later than the newest existing file — check `ls supabase/migrations/ | tail`; format `YYYYMMDDHHMMSS`):

```sql
alter table public.user_preferences
  add column if not exists outfit_show_base boolean not null default true,
  add column if not exists outfit_show_evolutions boolean not null default true,
  add column if not exists outfit_show_glowups boolean not null default true;

alter table public.user_preferences
  drop column if exists outfit_hide_evolutions,
  drop column if exists outfit_hide_glowups;
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push --include-all`
Expected: reports the migration applied, no error. If it fails (auth/network/history), STOP and report — do not improvise against prod.

- [ ] **Step 3: Regenerate types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Expected: `user_preferences` now lists the three `outfit_show_*` columns and no longer lists the two `outfit_hide_*` columns. (If the CLI appends any non-TypeScript "update notice" lines, strip them — the file must be valid TS.)

- [ ] **Step 4: Update the UserPreferences Pick**

In `lib/types/eureka.ts`, in the `UserPreferences` `Pick<...>` union: remove `| 'outfit_hide_evolutions'` and `| 'outfit_hide_glowups'`; add:

```ts
  | 'outfit_show_base'
  | 'outfit_show_evolutions'
  | 'outfit_show_glowups'
```

- [ ] **Step 5: Update DEFAULT_PREFERENCES**

In `lib/preferences.ts`, remove the `outfit_hide_evolutions: false` and `outfit_hide_glowups: false` lines; add (near the other `outfit_*` keys):

```ts
  outfit_show_base: true,
  outfit_show_evolutions: true,
  outfit_show_glowups: true,
```

- [ ] **Step 6: Update the preferences .select()**

In `hooks/data/preferences.ts`, in the `.select('...')` column list: remove `outfit_hide_evolutions` and `outfit_hide_glowups`; add `outfit_show_base`, `outfit_show_evolutions`, `outfit_show_glowups`.

- [ ] **Step 7: Swap the preference actions**

In `app/actions/preferences.ts`, remove `updateOutfitHideEvolutions` and `updateOutfitHideGlowups` (lines ~81-87). Add:

```ts
export async function updateOutfitShowBase(value: boolean) {
  await upsertUserPreference({ outfit_show_base: value })
}

export async function updateOutfitShowEvolutions(value: boolean) {
  await upsertUserPreference({ outfit_show_evolutions: value })
}

export async function updateOutfitShowGlowups(value: boolean) {
  await upsertUserPreference({ outfit_show_glowups: value })
}
```

- [ ] **Step 8: Typecheck**

Run: `yarn tsc --noEmit`
Expected: errors ONLY in `app/outfits/outfit-data-provider.tsx` and `components/filter/filter-menu.tsx` (they still reference the removed `outfit_hide_*` prefs / actions) — these are fixed in Tasks 4 and 6. If an error appears anywhere else, fix it before committing. `DEFAULT_PREFERENCES` must still satisfy `UserPreferences`.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations lib/types/supabase.ts lib/types/eureka.ts lib/preferences.ts hooks/data/preferences.ts app/actions/preferences.ts
git commit -m "feat(prefs): swap outfit_hide_* for outfit_show_* columns"
```

---

### Task 3: `EvolutionShowToggle` control

**Files:**

- Create: `components/filter/evolution-show-toggle.tsx`

**Interfaces:**

- Consumes: `ToggleIcon` from `../toggle-icon`; MUI `ToggleButton`/`Tooltip`; `LooksOne` from `@mui/icons-material`.
- Produces: default export `EvolutionShowToggle` with props `{ showBase, showEvolutions, showGlowups, onShowBaseChange, onShowEvolutionsChange, onShowGlowupsChange }` (each `boolean` / `() => void`).

- [ ] **Step 1: Write the component**

Create `components/filter/evolution-show-toggle.tsx` (three independent, non-exclusive `ToggleButton`s; `selected` = shown). Modeled on `evolution-toggle.tsx`/`glowup-toggle.tsx` but combined and show-semantic:

```tsx
'use client'

import { LooksOne } from '@mui/icons-material'
import { ToggleButton, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'

export default function EvolutionShowToggle({
  showBase,
  showEvolutions,
  showGlowups,
  onShowBaseChange,
  onShowEvolutionsChange,
  onShowGlowupsChange,
}: {
  showBase: boolean
  showEvolutions: boolean
  showGlowups: boolean
  onShowBaseChange: () => void
  onShowEvolutionsChange: () => void
  onShowGlowupsChange: () => void
}) {
  return (
    <>
      <Tooltip title="Show Base">
        <ToggleButton selected={showBase} size="small" value="showBase" onChange={onShowBaseChange}>
          <LooksOne fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Show Evolutions">
        <ToggleButton
          selected={showEvolutions}
          size="small"
          value="showEvolutions"
          onChange={onShowEvolutionsChange}
        >
          <ToggleIcon
            image="/icons/evolution.png"
            isSelected={showEvolutions}
            size="xs"
            title="evolution"
          />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Show Glow-ups">
        <ToggleButton
          selected={showGlowups}
          size="small"
          sx={{ py: 0.75 }}
          value="showGlowups"
          onChange={onShowGlowupsChange}
        >
          <ToggleIcon image="/icons/glowup.png" isSelected={showGlowups} size="xs" title="glowup" />
        </ToggleButton>
      </Tooltip>
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn tsc --noEmit`
Expected: same residual errors as Task 2 (provider + filter-menu) — the new component itself compiles. No NEW errors from this file.

- [ ] **Step 3: Commit**

```bash
git add components/filter/evolution-show-toggle.tsx
git commit -m "feat(filters): add EvolutionShowToggle control"
```

---

### Task 4: Context + provider (show-flags)

**Files:**

- Modify: `components/outfits/outfit-context.tsx`
- Modify: `app/outfits/outfit-data-provider.tsx`

**Interfaces:**

- Consumes: new prefs columns + actions from Task 2.
- Produces: `OutfitDataContextValue` exposes `showBase`/`showEvolutions`/`showGlowups: boolean` + `onShowBaseChange`/`onShowEvolutionsChange`/`onShowGlowupsChange: () => void` (replacing the two `hide*` fields + handlers). Provider supplies real values, hydrates/persists them, and resets them in `onClearFilters`.

- [ ] **Step 1: Update the context type + defaults**

In `components/outfits/outfit-context.tsx`, in `OutfitDataContextValue`: remove `hideEvolutions`, `hideGlowups`, `onHideEvolutionsChange`, `onHideGlowupsChange`. Add:

```ts
  showBase: boolean
  showEvolutions: boolean
  showGlowups: boolean
  onShowBaseChange: () => void
  onShowEvolutionsChange: () => void
  onShowGlowupsChange: () => void
```

In the `createContext(...)` default value: remove the two `hide*: false` + two `onHide*` no-ops; add `showBase: true`, `showEvolutions: true`, `showGlowups: true`, and `onShowBaseChange: () => {}`, `onShowEvolutionsChange: () => {}`, `onShowGlowupsChange: () => {}`.

- [ ] **Step 2: Update the provider imports**

In `app/outfits/outfit-data-provider.tsx`, in the `@/app/actions/preferences` import: remove `updateOutfitHideEvolutions`, `updateOutfitHideGlowups`; add `updateOutfitShowBase`, `updateOutfitShowEvolutions`, `updateOutfitShowGlowups`.

- [ ] **Step 3: Swap the state (lines ~50-53)**

Replace:

```ts
const [hideEvolutions, setHideEvolutions] = useState<boolean>(
  DEFAULT_PREFERENCES.outfit_hide_evolutions
)
const [hideGlowups, setHideGlowups] = useState<boolean>(DEFAULT_PREFERENCES.outfit_hide_glowups)
```

with:

```ts
const [showBase, setShowBase] = useState<boolean>(DEFAULT_PREFERENCES.outfit_show_base)
const [showEvolutions, setShowEvolutions] = useState<boolean>(
  DEFAULT_PREFERENCES.outfit_show_evolutions
)
const [showGlowups, setShowGlowups] = useState<boolean>(DEFAULT_PREFERENCES.outfit_show_glowups)
```

- [ ] **Step 4: Swap the hydrate (lines ~82-83)**

Replace:

```ts
setHideEvolutions(prefs.outfit_hide_evolutions)
setHideGlowups(prefs.outfit_hide_glowups)
```

with:

```ts
setShowBase(prefs.outfit_show_base)
setShowEvolutions(prefs.outfit_show_evolutions)
setShowGlowups(prefs.outfit_show_glowups)
```

- [ ] **Step 5: Swap the handlers**

Find `handleHideEvolutionsChange` and `handleHideGlowupsChange` (they toggle state + `startTransition(() => updateOutfitHide*(next))`). Replace both with three handlers:

```ts
const handleShowBaseChange = () => {
  const next = !showBase
  setShowBase(next)
  if (isLoggedIn) startTransition(() => updateOutfitShowBase(next))
}

const handleShowEvolutionsChange = () => {
  const next = !showEvolutions
  setShowEvolutions(next)
  if (isLoggedIn) startTransition(() => updateOutfitShowEvolutions(next))
}

const handleShowGlowupsChange = () => {
  const next = !showGlowups
  setShowGlowups(next)
  if (isLoggedIn) startTransition(() => updateOutfitShowGlowups(next))
}
```

- [ ] **Step 6: Update `onClearFilters` (handleClearFilters)**

In `handleClearFilters`, replace the `setHideEvolutions(...)`/`setHideGlowups(...)` resets and their persisted `updateOutfitHide*` calls with:

```ts
setShowBase(DEFAULT_PREFERENCES.outfit_show_base)
setShowEvolutions(DEFAULT_PREFERENCES.outfit_show_evolutions)
setShowGlowups(DEFAULT_PREFERENCES.outfit_show_glowups)
```

and inside the `if (isLoggedIn) startTransition(() => { ... })` block, replace the two `updateOutfitHide*` calls with:

```ts
updateOutfitShowBase(DEFAULT_PREFERENCES.outfit_show_base)
updateOutfitShowEvolutions(DEFAULT_PREFERENCES.outfit_show_evolutions)
updateOutfitShowGlowups(DEFAULT_PREFERENCES.outfit_show_glowups)
```

- [ ] **Step 7: Update the context value object**

In the `<OutfitDataContext.Provider value={{ ... }}>`, remove `hideEvolutions`, `hideGlowups`, `onHideEvolutionsChange: handleHideEvolutionsChange`, `onHideGlowupsChange: handleHideGlowupsChange`. Add:

```ts
        showBase,
        showEvolutions,
        showGlowups,
        onShowBaseChange: handleShowBaseChange,
        onShowEvolutionsChange: handleShowEvolutionsChange,
        onShowGlowupsChange: handleShowGlowupsChange,
```

- [ ] **Step 8: Typecheck**

Run: `yarn tsc --noEmit`
Expected: errors now ONLY in `components/filter/filter-menu.tsx` (still reads `hideEvolutions`/`hideGlowups`/`onHide*` from context) and `app/outfits/outfit-toolbar.tsx` + `app/outfits/filter-outfits.tsx` (still destructure `hideEvolutions`/`hideGlowups`). These are fixed in Task 5/6. No errors elsewhere.

- [ ] **Step 9: Commit**

```bash
git add components/outfits/outfit-context.tsx app/outfits/outfit-data-provider.tsx
git commit -m "feat(outfits): expose show-flags from outfit context/provider"
```

---

### Task 5: Point the two main-outfits consumers + toolbar at the real show-flags

**Files:**

- Modify: `app/outfits/filter-outfits.tsx`
- Modify: `app/outfits/outfit-toolbar.tsx`

**Interfaces:**

- Consumes: `showBase`/`showEvolutions`/`showGlowups` from `useOutfitData()` (Task 4).
- Produces: both files use the real show-flags instead of the temporary `!hideEvolutions`/`!hideGlowups` inversion from Task 1.

- [ ] **Step 1: Update `filter-outfits.tsx` destructure**

Find the `useOutfitData()` destructure that currently pulls `hideEvolutions, hideGlowups`. Replace those two names with `showBase, showEvolutions, showGlowups`.

- [ ] **Step 2: Update `filter-outfits.tsx` both call sites**

At both `isEvolutionVisible({ ... })` calls (the Task-1 temporary versions), replace:

```ts
            showBase: true,
            showEvolutions: !hideEvolutions,
            showGlowups: !hideGlowups,
```

with:

```ts
            showBase,
            showEvolutions,
            showGlowups,
```

(same replacement at both sites; indentation matches each site).

- [ ] **Step 3: Update `outfit-toolbar.tsx` destructure + call**

Change the destructure at line 18 from `hideEvolutions, hideGlowups` to `showBase, showEvolutions, showGlowups`. Then in the `isEvolutionVisible({ ... })` call, replace the `showBase: true, showEvolutions: !hideEvolutions, showGlowups: !hideGlowups` lines with `showBase, showEvolutions, showGlowups`.

- [ ] **Step 4: Typecheck**

Run: `yarn tsc --noEmit`
Expected: errors now ONLY in `components/filter/filter-menu.tsx` (Task 6). No errors in filter-outfits or outfit-toolbar.

- [ ] **Step 5: Commit**

```bash
git add app/outfits/filter-outfits.tsx app/outfits/outfit-toolbar.tsx
git commit -m "feat(outfits): consume real show-flags in grid + toolbar"
```

---

### Task 6: Filter-menu wiring (new toggle + order tandem + reconciliation)

**Files:**

- Modify: `components/filter/filter-menu.tsx`

**Interfaces:**

- Consumes: `EvolutionShowToggle` (Task 3); show-flags + handlers from `useOutfitData()` (Task 4).
- Produces: the Evolutions section renders `EvolutionShowToggle`; `availableOrders` is dynamically computed and filtered by the show-flags; a reconciliation effect clears a hidden order selection; `hasActiveFilters` accounts for hidden categories.

- [ ] **Step 1: Update imports**

In `components/filter/filter-menu.tsx`, remove `import EvolutionToggle from './evolution-toggle'` and `import GlowupToggle from './glowup-toggle'`. Add `import EvolutionShowToggle from './evolution-show-toggle'`.

- [ ] **Step 2: Update the `useOutfitData()` destructure (lines ~87-91)**

Replace:

```ts
    hideEvolutions,
    hideGlowups,
    onGroupBySetChange: onOutfitGroupBySetChange,
    onHideEvolutionsChange,
    onHideGlowupsChange,
```

with:

```ts
    showBase,
    showEvolutions,
    showGlowups,
    onGroupBySetChange: onOutfitGroupBySetChange,
    onShowBaseChange,
    onShowEvolutionsChange,
    onShowGlowupsChange,
```

- [ ] **Step 3: Restore + filter `availableOrders`**

Find the current `availableOrders` (hardcoded `const availableOrders = [2, 3, 4, 0]` with a commented-out block above it). Replace that whole hardcoded line + the comment block with:

```ts
const allOrders = [
  1, // base is always a possible order
  ...new Set(outfitSets.flatMap((s) => s.evolutions).map((e) => e.order)),
]
const availableOrders = allOrders
  .filter((o) => (o === 1 ? showBase : o === 0 ? showGlowups : showEvolutions))
  .sort((a, b) => a - b)
```

- [ ] **Step 4: Update the `EvolutionOrderToggle` `disabled` prop + render the new toggle**

In the Evolutions `ListItem` (~lines 209-224): change `EvolutionOrderToggle`'s `disabled={hideEvolutions && hideGlowups}` to `disabled={!showBase && !showEvolutions && !showGlowups}`. Replace the inner `<Stack direction="row" spacing={1}>` containing `EvolutionToggle` + `GlowupToggle` with:

```tsx
<Stack direction="row" spacing={1}>
  <EvolutionShowToggle
    showBase={showBase}
    showEvolutions={showEvolutions}
    showGlowups={showGlowups}
    onShowBaseChange={onShowBaseChange}
    onShowEvolutionsChange={onShowEvolutionsChange}
    onShowGlowupsChange={onShowGlowupsChange}
  />
</Stack>
```

- [ ] **Step 5: Add the reconciliation effect**

Add a reconciliation effect beside the existing density→category `React.useEffect`
(which lives at line ~108, right after `const { selectedOutfitCategory } = outfitFilters`
at line ~107).

**Scope note:** the in-block `selectedEvolution` (destructured from `outfitFilters` at
line ~117, inside `if (isOutfits)`) is NOT visible at component-level effect scope. So
read it from `outfitFilters` at the top level, exactly as line ~107 reads
`selectedOutfitCategory`. Add this line right after line ~107:

```ts
const { selectedEvolution: selectedEvolutionForReconcile } = outfitFilters
```

Then add the effect immediately after the existing density effect (line ~112):

```ts
React.useEffect(() => {
  if (!isOutfits) return
  const orderVisible =
    selectedEvolutionForReconcile === null ||
    (selectedEvolutionForReconcile === 1
      ? showBase
      : selectedEvolutionForReconcile === 0
        ? showGlowups
        : showEvolutions)
  if (!orderVisible) {
    onOutfitFiltersChange({ selectedEvolution: null })
  }
}, [
  isOutfits,
  selectedEvolutionForReconcile,
  showBase,
  showEvolutions,
  showGlowups,
  onOutfitFiltersChange,
])
```

(Use a distinct local name `selectedEvolutionForReconcile` to avoid colliding with the
in-block `selectedEvolution` destructured later at line ~117 — that in-block one is still
used by the `EvolutionOrderToggle` render and must remain.)

- [ ] **Step 6: Update `hasActiveFilters` (lines ~136-137)**

In the outfits-branch `hasActiveFilters` expression, replace:

```ts
      hideEvolutions ||
      hideGlowups ||
```

with:

```ts
      !showBase ||
      !showEvolutions ||
      !showGlowups ||
```

- [ ] **Step 7: Typecheck**

Run: `yarn tsc --noEmit`
Expected: fully clean across the project.

- [ ] **Step 8: Manual verification**

Run `yarn dev` (or use the already-running dev server if present on :3000 — confirm it serves this branch). On `/outfits`, open the filter menu → Evolutions section:

- Three show-toggles (1️⃣ base, evolution icon, glow-up icon) render, all selected by default; the order-toggle sits beside them.
- Toggle **Show Evolutions** off → orders 2-5 vanish from the order-toggle AND evolution cards vanish from the grid (both densities). Same for **Show Glow-ups** (✨ / glow-up cards) and **Show Base** (1 / base cards).
- Select order 2, then toggle Show Evolutions off → the order selection resets to "all" (no empty-because-of-stale-order state).
- Turn all three off → grid shows the "No results" empty state; order-toggle disabled.
- "Clear all" restores all three to on.
- Logged in: toggle some off, reload → selections persist.

Expected: all hold.

- [ ] **Step 9: Commit**

```bash
git add components/filter/filter-menu.tsx
git commit -m "feat(filters): show-toggles + order-toggle tandem in filter menu"
```

---

## Final Verification

- [ ] `yarn tsc --noEmit` clean.
- [ ] `yarn lint` clean (or only pre-existing warnings).
- [ ] Manual pass from Task 6 Step 8 green in both densities.
- [ ] Seasons pages (`/outfits/seasons/[slug]`) still work with their old hide-toggles (unchanged) — spot-check one season page's evolution/glow-up toggles still filter.
- [ ] Open a PR from `chore/filter-menu-tweaks` into `main`.

## Notes / Risks

- **Migration ordering:** add the migration as a NEW file; don't rewrite an existing timestamp mid-PR (avoids the benign-but-noisy Supabase Preview red check per CLAUDE.md).
- **Two evolution UIs coexist intentionally:** main outfits uses show-toggles; seasons keeps the old hide-toggles until the follow-up. The branch name (`chore/filter-menu-tweaks`) also carries the earlier WIP `styles`-ordering commit and the base filter work — the PR body should list both.
- **`selectedEvolution` values:** base=1, evolutions=2-5, glow-up=0 (0 is falsy — the codebase already compares to `null` explicitly; preserve that in the reconciliation effect, which this plan does).
- **Backward compat:** old users' `outfit_hide_*` values are dropped; `false/false` (their default) maps exactly to the new all-`true` show default, so effective behavior is unchanged.

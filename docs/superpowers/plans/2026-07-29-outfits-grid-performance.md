# Outfits Grid Render Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the re-render cascade that makes the `/outfits` grid lag, without changing any visible behavior.

**Architecture:** Three layers, applied in order. First stop the provider from rebuilding its context value and re-mapping ~6k variants every render. Second memoize the filter/sort pipeline and remove its quadratic group lookup. Third wrap the cards in `React.memo` with stable callbacks so the memo actually holds. Order is load-bearing — `React.memo` without stable props is pure overhead.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, TypeScript. Yarn.

## Global Constraints

- **Package manager is Yarn.** Never `npm` or `pnpm`.
- **No new dependencies.** This work adds zero packages.
- **No test runner exists in this repo.** There are no `*.test.*` files and no test script. Verification is `yarn tsc --noEmit`, `yarn lint`, and the specific manual browser checks written into each task. Do not scaffold Vitest/Jest.
- **Prettier config:** no semicolons, single quotes, 2-space indent, 100 char width. A PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every edit, so formatting self-corrects.
- **Behavior must not change.** Layout, filter semantics, sort order, animations, and the group-level vs per-variant obtained distinction all stay exactly as they are.
- **Keep the `Grow` transition** in `components/card-shell.tsx`. It is deliberately retained; see spec.
- **Branch:** work continues on `perf/outfits-grid-render`. Never push to `main`.
- **Commit trailer:** end every commit message with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Baseline profiling (do this once, before Task 1)

- [ ] **Step 0.1: Capture the "before" trace**

Run `yarn dev`, open `http://localhost:3000/outfits` logged in, install/open React DevTools → Profiler tab. Enable "Record why each component rendered".

Record three interactions separately, in **standard** density and again in **compact** density:

1. Initial page load
2. Clicking one variant's obtained toggle
3. Changing one filter (e.g. select a rarity)

For each, note: **commit duration** and **number of components rendered**. Write these six numbers into a scratch file — they are the comparison baseline for the final verification.

Expected before-state: toggling one variant re-renders every card on screen.

---

### Task 1: Provider — stop rebuilding the world

**Files:**

- Modify: `hooks/outfit.ts:153-167` (`updateOutfitSet`)
- Modify: `app/outfits/outfit-data-provider.tsx:114-152` (handlers), `:284-286` (the map), `:288-313` (context value)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: a stable `OutfitDataContext` value. Consumers (`useOutfitData()`) keep the exact same shape and field names — no consumer changes. `updateOutfitSet` keeps its existing signature `({ outfitSet, obtainedOutfit }) => OutfitSet`.

- [ ] **Step 1.1: Fix the O(n×m) lookup inside `updateOutfitSet`**

`hooks/outfit.ts:160-167` currently calls `.find()` on `obtainedOutfit` once per variant — with ~6k variants that is ~6k linear scans per set. Build the lookup once instead.

Replace the body of `updateOutfitSet` (lines 160-167) with:

```ts
const obtainedSlugs = new Set((obtainedOutfit ?? []).map((o) => o.outfit_variant))
return {
  ...outfitSet,
  outfit_variants: outfitSet.outfit_variants.map((variant) => ({
    ...variant,
    obtained: obtainedSlugs.has(variant.slug),
  })) as OutfitVariant[],
} as OutfitSet
```

Note: `obtained` was `!!find(...)` (a boolean) and `Set.has()` is also a boolean, so the value semantics are identical.

- [ ] **Step 1.2: Verify types and lint pass**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 1.3: Memoize the per-render set re-map**

In `app/outfits/outfit-data-provider.tsx`, replace lines 284-286:

```ts
const outfitSetsWithObtained = outfitSets.map((outfitSet) =>
  updateOutfitSet({ outfitSet, obtainedOutfit })
)
```

with:

```ts
const outfitSetsWithObtained = useMemo(
  () => outfitSets.map((outfitSet) => updateOutfitSet({ outfitSet, obtainedOutfit })),
  [outfitSets, obtainedOutfit]
)
```

`useMemo` is already imported on line 3 — do not add a duplicate import.

- [ ] **Step 1.4: Stabilize the handlers with `useCallback`**

Add `useCallback` to the React import on line 3.

Wrap each of these six handlers. Keep every function body byte-for-byte identical; only add the wrapper and dependency array:

- `handleGroupBySetChange` (line 114) → deps `[groupBySet, isLoggedIn]`
- `handleHideEvolutionsChange` (line 120) → deps `[hideEvolutions, isLoggedIn]`
- `handleHideGlowupsChange` (line 126) → deps `[hideGlowups, isLoggedIn]`
- `handleFiltersChange` (line 132) → deps `[]` (uses only the `setFilters` updater form)
- `handleClearFilters` (line 136) → deps `[isLoggedIn]`
- `handleToggleObtained` (line 154) → deps `[obtainedOutfit]`
- `handleBatchToggleObtained` (line 178) → deps `[obtainedOutfit]`

Example of the transformation for the first one:

```ts
const handleGroupBySetChange = useCallback(() => {
  const next = !groupBySet
  setGroupBySet(next)
  if (isLoggedIn) startTransition(() => updateOutfitGroupBySet(next))
}, [groupBySet, isLoggedIn])
```

`startTransition` from `useTransition` is stable across renders, so it does not belong in any dependency array.

- [ ] **Step 1.5: Memoize the context value**

Wrap the object literal passed to `OutfitDataContext.Provider` (lines 289-313) in `useMemo`. Keep every key exactly as-is. The dependency array must list every value referenced:

```ts
const contextValue = useMemo(
  () => ({
    outfitSets: outfitSetsWithObtained,
    obtainedOutfit,
    outfitCategories,
    styles,
    labels,
    isLoggedIn,
    isAdmin,
    isLoading,
    isError,
    isObtainedError,
    userId,
    groupBySet,
    hideEvolutions,
    hideGlowups,
    onGroupBySetChange: handleGroupBySetChange,
    onHideEvolutionsChange: handleHideEvolutionsChange,
    onHideGlowupsChange: handleHideGlowupsChange,
    filters,
    onFiltersChange: handleFiltersChange,
    onClearFilters: handleClearFilters,
    onToggleObtained: handleToggleObtained,
    onBatchToggleObtained: handleBatchToggleObtained,
  }),
  [
    outfitSetsWithObtained,
    obtainedOutfit,
    outfitCategories,
    styles,
    labels,
    isLoggedIn,
    isAdmin,
    isLoading,
    isError,
    isObtainedError,
    userId,
    groupBySet,
    hideEvolutions,
    hideGlowups,
    handleGroupBySetChange,
    handleHideEvolutionsChange,
    handleHideGlowupsChange,
    filters,
    handleFiltersChange,
    handleClearFilters,
    handleToggleObtained,
    handleBatchToggleObtained,
  ]
)
```

Then render `<OutfitDataContext.Provider value={contextValue}>`.

- [ ] **Step 1.6: Verify types, lint, and the exhaustive-deps rule**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors. In particular, no `react-hooks/exhaustive-deps` warnings for the new hooks. If the linter reports a missing dependency, add it rather than suppressing it — a wrong dep array here causes stale-data bugs, which is worse than the perf problem being fixed.

- [ ] **Step 1.7: Manual behavior check**

Run `yarn dev`, open `/outfits` logged in. Confirm all of the following still work:

- Toggling a variant's obtained icon updates the card and the progress chip
- The batch toggle on a set header marks/clears the whole group
- Every filter control still filters (set, category, evolution, rarity, style, label, obtained)
- "Clear filters" resets filters _and_ the grouping/evolution toggles
- Reloading the page restores your filters (preference persistence still fires)

- [ ] **Step 1.8: Commit**

```bash
git add hooks/outfit.ts app/outfits/outfit-data-provider.tsx
git commit -m "perf(outfits): memoize provider context and obtained lookup

updateOutfitSet did a linear .find() per variant (~6k scans per set per
render); it now builds a Set of obtained slugs once. The set re-map, the
context value, and every handler are memoized so consumers stop
re-rendering on unrelated state changes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2a: Filter pipeline — memoize (no logic change)

**Files:**

- Modify: `app/outfits/filter-outfits.tsx:44-216`

**Interfaces:**

- Consumes: the stable context value from Task 1 via `useOutfitData()`.
- Produces: `filteredSets`, same type and contents as before — `OutfitSet[]` with `outfit_variants` culled. Task 2b depends on this being unchanged.

This task is split from 2b deliberately: it is pure caching with zero logic change, so any behavior difference it causes is a bug in the memo boundary, not in the filter logic.

- [ ] **Step 2a.1: Capture the before-snapshot for the pipeline**

The filter logic has subtle group-level vs per-variant obtained semantics (documented at `filter-outfits.tsx:104-110`). Capture its output so Task 2b can be proven equivalent.

Temporarily add this immediately after the `filteredSets` declaration ends (after line 216):

```ts
// TEMP-SNAPSHOT: remove before commit
if (typeof window !== 'undefined') {
  ;(window as unknown as { __snap?: unknown }).__snap = filteredSets.map((s) => ({
    slug: s.slug,
    variants: s.outfit_variants.map((v) => v.slug),
  }))
}
```

Run `yarn dev`, open `/outfits` logged in, and for **each** of these six filter states, run `copy(JSON.stringify(window.__snap))` in the browser console and save the result to a scratch file (one file per state, named for the state):

1. No filters, grouped by set, standard density
2. No filters, grouped by set, compact density
3. Obtained filter = "missing", grouped by set
4. Obtained filter = "missing", **ungrouped** (this is where semantics differ)
5. Obtained filter = "obtained", grouped by set
6. A rarity filter + a category filter together, grouped

- [ ] **Step 2a.2: Hoist the early returns above the hook**

Hooks cannot run conditionally, so the `useMemo` must sit above the `isError` (line 72) and `isLoading` (line 80) early returns. Move both `if` blocks to _after_ the `filteredSets` `useMemo` you are about to add. They render independent UI and read no value from the pipeline, so moving them is safe.

- [ ] **Step 2a.3: Wrap the pipeline in `useMemo`**

Add `useMemo` to the React import at the top of the file.

Wrap the entire chain currently at lines 112-216 (`outfitSets.filter(...)...sort(...)`) so it reads:

```ts
const filteredSets = useMemo(() => {
  return outfitSets.filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
  // ... every existing .filter/.map/.sort step, unchanged ...
}, [
  outfitSets,
  selectedOutfitSet,
  selectedOutfitCategory,
  selectedEvolution,
  selectedObtainedFilter,
  selectedRarity,
  selectedStyle,
  selectedLabel,
  hideEvolutions,
  hideGlowups,
  groupLevelObtained,
  axis,
  sortDir,
])
```

Do not alter a single line of the chain body in this task — only add the wrapper.

One gotcha: two call sites refer to `(typeof filteredSets)[number]` — the sort callback at line 195 and `renderSetVariants` at line 218. Line 195 moves _inside_ the `useMemo` initializer, where referencing `filteredSets` while it is still being defined is a circular type reference and will not compile.

Declare a row type alias near the top of the component (before the `useMemo`):

```ts
type FilteredSet = (typeof outfitSets)[number]
```

Then replace **both** annotations with it:

- line 195: `const progress = (s: FilteredSet) => {`
- line 218: `function renderSetVariants(set: FilteredSet) {`

Line 218 would still compile unchanged since it sits outside the memo, but use the alias in both places so the two stay consistent.

- [ ] **Step 2a.4: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors, no exhaustive-deps warnings.

- [ ] **Step 2a.5: Verify output is byte-identical**

With the TEMP-SNAPSHOT block still in place, re-collect all six states from Step 2a.1 and diff each against its saved file:

Run: `diff <saved-state-N>.json <new-state-N>.json`
Expected: **no differences** for all six. Memoization must not change output. If any state differs, the dependency array is missing an input — fix it before continuing.

- [ ] **Step 2a.6: Commit (snapshot block stays for Task 2b)**

```bash
git add app/outfits/filter-outfits.tsx
git commit -m "perf(outfits): memoize the filter/sort pipeline

The ~100-line filter/sort chain re-ran on every render. Wrapped in
useMemo keyed on the sets plus every filter and sort input; early
returns moved below the hook since hooks cannot run conditionally.
Output verified byte-identical across six filter states.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2d: Take preference persistence out of the interaction path

**Added 2026-07-29 after Task 2c failed to help.** Diagnosis correction: every filter change fires a `updateOutfitFilters` Server Action — a network POST to Supabase — at `outfit-data-provider.tsx:225-241`. Server Actions are serialized, so rapid filter changes queue sequential round-trips. Worse, line 227 wraps the write in `startTransition`, the same primitive Task 2c used, so `isFiltering` tracked the **network write** rather than the render. Task 2c therefore dimmed the grid and blocked pointer events for the duration of a database write.

This task removes persistence from the interaction path entirely.

**Files:**

- Modify: `app/outfits/outfit-data-provider.tsx:225-243` (the persistence effect)

**Interfaces:**

- Consumes: `filters` state and the `prefsLoaded` guard, both already present.
- Produces: no API change. `isFiltering` keeps its name but now reflects only render work, because the write no longer runs inside a transition the UI observes.

- [ ] **Step 2d.1: Debounce the write and remove it from the transition**

Replace the persistence effect at lines 225-243 with a debounced, fire-and-forget version. Two changes matter: the `setTimeout` collapses rapid filter changes into one write, and dropping `startTransition` means no UI state tracks the network call.

```ts
useEffect(() => {
  if (!isLoggedIn || !prefsLoaded) return
  // Persist filter choices as fire-and-forget: the UI must never wait on this
  // write. Server Actions are serialized, so an un-debounced write per filter
  // click queues sequential round-trips and stalls the interaction. Debouncing
  // collapses a burst of filter changes into a single write, and staying out of
  // startTransition keeps isFiltering tracking render work only.
  const id = setTimeout(() => {
    void updateOutfitFilters({
      outfit_set_filter: filters.selectedOutfitSet,
      outfit_category_filter: filters.selectedOutfitCategory.length
        ? filters.selectedOutfitCategory.join(',')
        : null,
      // selectedEvolution can be 0 (glow-up), so persist on null — not falsiness.
      outfit_evolution_filter:
        filters.selectedEvolution !== null ? String(filters.selectedEvolution) : null,
      outfit_rarity_filter: filters.selectedRarity ? String(filters.selectedRarity) : null,
      outfit_obtained_filter: filters.selectedObtainedFilter,
      outfit_style_filter: filters.selectedStyle.length ? filters.selectedStyle.join(',') : null,
      outfit_label_filter: filters.selectedLabel.length ? filters.selectedLabel.join(',') : null,
    }).catch((err) => {
      // A failed preference write must not disrupt filtering — the user's
      // filters still work, they just may not persist across a reload.
      console.error('Failed to persist outfit filters:', err)
    })
  }, PREFERENCE_DEBOUNCE_MS)
  return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters])
```

Add the constant near the top of the file, above the component:

```ts
// Filter changes arrive in bursts as the user adjusts several controls; collapse
// them into one preference write instead of one write per click.
const PREFERENCE_DEBOUNCE_MS = 500
```

Keep the existing `// eslint-disable-next-line react-hooks/exhaustive-deps` comment on the `[filters]` dep array — it is pre-existing and intentional, since including every handler would refire the effect spuriously.

Note the cleanup function: `clearTimeout` on unmount or on the next filter change is what makes the debounce work. Without it every filter change still writes, just later.

- [ ] **Step 2d.2: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors. `updateOutfitFilters` returns a promise; the `void` operator plus the `.catch()` satisfies lint rules about unhandled promises.

- [ ] **Step 2d.3: Manual check (human)**

- Change a filter — the grid updates without waiting on a network call
- Change five filters quickly, wait ~1s, reload the page — the **last** filter state is restored, proving the debounced write landed
- With the network tab open, confirm a burst of filter clicks produces **one** preference request, not one per click

- [ ] **Step 2d.4: Commit**

```bash
git add app/outfits/outfit-data-provider.tsx
git commit -m "perf(outfits): debounce filter persistence out of the render path

Every filter change fired a serialized Server Action POST, and it ran
inside startTransition -- so the pending state tracked a network write
rather than the render. The write is now debounced fire-and-forget, so
filtering never waits on persistence.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2e: Stop the pending state from swallowing clicks

**Added 2026-07-29.** Task 2c added `pointerEvents: 'none'` to the grid while `isFiltering` was true. Because the transition tracked a network write (see Task 2d), that blocked interaction for the duration of a database round-trip — recreating the swallowed-click problem Task 2c was meant to fix. With persistence moved out of the path by Task 2d, the dim is useful feedback but the pointer block is not worth its cost.

**Files:**

- Modify: `app/outfits/filter-outfits.tsx` (both `CardGrid` blocks)

**Interfaces:**

- Consumes: `isFiltering` from context (added by Task 2c).
- Produces: no API change.

- [ ] **Step 2e.1: Remove the pointerEvents block from both grids**

In `app/outfits/filter-outfits.tsx` there are two `CardGrid` blocks (the `density === 'standard'` branch and the `density === 'compact'` branch). Each currently has:

```tsx
sx={{
  opacity: isFiltering ? 0.5 : 1,
  transition: 'opacity 150ms ease',
  pointerEvents: isFiltering ? 'none' : 'auto',
}}
```

Delete the `pointerEvents` line from **both**, leaving:

```tsx
sx={{
  opacity: isFiltering ? 0.5 : 1,
  transition: 'opacity 150ms ease',
}}
```

Keep the opacity and transition — the dim is the feedback. Do not remove `isFiltering` from the component or the context; it is still used.

- [ ] **Step 2e.2: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors, and no unused-variable warning for `isFiltering` (it is still read by the opacity expression).

- [ ] **Step 2e.3: Commit**

```bash
git add app/outfits/filter-outfits.tsx
git commit -m "fix(outfits): stop the filtering pending state blocking clicks

pointerEvents: none while isFiltering blocked interaction with the grid
during the pending window, recreating the dropped-click problem it was
meant to solve. The dim stays as feedback; the block is removed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2b: Filter pipeline — remove the quadratic group lookup

**Files:**

- Modify: `app/outfits/filter-outfits.tsx:159-167`

**Interfaces:**

- Consumes: the memoized `filteredSets` structure from Task 2a.
- Produces: identical `filteredSets` output, computed in O(n) instead of O(n²).

- [ ] **Step 2b.1: Replace the nested filter with a Map lookup**

At lines 159-167, `scopedVariants.filter((g) => g.outfit_set === v.outfit_set)` runs _inside_ a `.filter()` — it re-scans every variant in the set once per variant. Build the grouping once.

Replace:

```ts
const inMatchingGroup =
  groupLevelObtained && selectedObtainedFilter
    ? scopedVariants.filter((v) => {
        const group = scopedVariants.filter((g) => g.outfit_set === v.outfit_set)
        return matchesObtainedFilter(group, selectedObtainedFilter)
      })
    : scopedVariants
```

with:

```ts
let inMatchingGroup = scopedVariants
if (groupLevelObtained && selectedObtainedFilter) {
  // Group once by state slug, then judge each group a single time, instead of
  // re-scanning every variant for every variant (quadratic per set).
  const byState = new Map<string, typeof scopedVariants>()
  for (const v of scopedVariants) {
    const key = v.outfit_set ?? ''
    const group = byState.get(key)
    if (group) group.push(v)
    else byState.set(key, [v])
  }
  const keptStates = new Set<string>()
  for (const [key, group] of byState) {
    if (matchesObtainedFilter(group, selectedObtainedFilter)) keptStates.add(key)
  }
  inMatchingGroup = scopedVariants.filter((v) => keptStates.has(v.outfit_set ?? ''))
}
```

Two details that preserve exact behavior: the original grouped on the raw `v.outfit_set` value, so `?? ''` must be applied consistently on both the build and the lookup; and the original preserved `scopedVariants` order, which the final `.filter()` also does.

- [ ] **Step 2b.2: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 2b.3: Prove output is unchanged**

Re-collect all six states from Step 2a.1 and diff against the saved files.

Run: `diff <saved-state-N>.json <new-state-N>.json`
Expected: **no differences** for all six. State 4 (missing + ungrouped) and state 3 (missing + grouped) are the ones that would expose a semantics regression — check those most carefully.

- [ ] **Step 2b.4: Remove the TEMP-SNAPSHOT block**

Delete the `// TEMP-SNAPSHOT` block added in Step 2a.1. Confirm it is gone:

Run: `grep -n "TEMP-SNAPSHOT\|__snap" app/outfits/filter-outfits.tsx`
Expected: no output.

- [ ] **Step 2b.5: Verify and commit**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

```bash
git add app/outfits/filter-outfits.tsx
git commit -m "perf(outfits): de-nest the group-level obtained filter

The group-level obtained filter re-scanned each set's variants once per
variant. Groups are now built into a Map once and judged a single time.
Output verified identical across six filter states, including the
missing+ungrouped case where group and per-variant semantics diverge.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2c: Make filter changes non-blocking

**Added 2026-07-29** after field testing during the Step 2a.1 snapshot capture: changing a filter froze the whole page, and a second filter could not be applied until the full grid had re-rendered. Worst in compact density.

This is a different failure from Tasks 1/2a/2b. Those remove _wasted_ re-renders. This one is a _blocking_ re-render: `handleFiltersChange` sets state urgently, so React cannot interrupt the ~6,000-card render it triggers, and the main thread stays busy — dropping the next click. Memoization cannot fix it; only marking the update interruptible can.

**Files:**

- Modify: `app/outfits/outfit-data-provider.tsx:132-134` (`handleFiltersChange`), context value + deps
- Modify: `components/outfits/outfit-context.tsx:18-48` (add `isFiltering` to the interface), `:60-83` (default)
- Modify: `app/outfits/filter-outfits.tsx` (consume `isFiltering`, dim the grid)

**Interfaces:**

- Consumes: the memoized context value from Task 1 and the memoized pipeline from Task 2a.
- Produces: a new context field `isFiltering: boolean`. Task 3 does not depend on it, but must not drop it when editing the same files.

- [ ] **Step 2c.1: Add a dedicated transition for filter updates**

In `app/outfits/outfit-data-provider.tsx`, do **not** reuse the existing `useTransition` on line 56. That one is `const [, startTransition]` — it discards `isPending` and is shared with preference-persistence writes, so reusing it would dim the grid whenever a preference saves. Add a second, dedicated one:

```ts
const [isFiltering, startFilterTransition] = useTransition()
```

Then change `handleFiltersChange` (lines 132-134) to:

```ts
const handleFiltersChange = useCallback((updates: Partial<OutfitFilterState>) => {
  // Mark the filter re-render interruptible: the control stays responsive and
  // React abandons in-flight work when another filter arrives. Without this the
  // ~6k-card render blocks the main thread and swallows the next click.
  startFilterTransition(() => {
    setFilters((prev) => ({ ...prev, ...updates }))
  })
}, [])
```

`startFilterTransition` is stable, so the empty dep array stays correct.

- [ ] **Step 2c.2: Expose `isFiltering` through the context**

In `components/outfits/outfit-context.tsx`, add to the `OutfitDataContextValue` interface (after `isObtainedError` on line 28):

```ts
isFiltering: boolean
```

and to the `createContext` default object (after `isObtainedError: false` on line 70):

```ts
isFiltering: false,
```

Then in `outfit-data-provider.tsx`, add `isFiltering,` to the `contextValue` object and `isFiltering,` to its dependency array. Both must be updated together — a value added to the object but not the deps is a stale-context bug.

- [ ] **Step 2c.3: Dim the grid while filtering**

In `app/outfits/filter-outfits.tsx`, pull `isFiltering` from `useOutfitData()`.

Both `CardGrid` blocks (the `density === 'standard'` and `density === 'compact'` branches) already accept an `sx` prop. Apply the pending state to each:

```tsx
sx={{
  opacity: isFiltering ? 0.5 : 1,
  transition: 'opacity 150ms ease',
  pointerEvents: isFiltering ? 'none' : 'auto',
}}
```

`pointerEvents: 'none'` while pending prevents a click landing on a card that is about to be replaced. Do not add a spinner — the dim plus the already-responsive filter control is the feedback.

- [ ] **Step 2c.4: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors. Adding a required field to `OutfitDataContextValue` makes TypeScript flag any other object literal that must supply it — if a second construction site exists, fix it rather than making the field optional.

- [ ] **Step 2c.5: Manual responsiveness check (human)**

In compact density with no filters (the ~6,000-card worst case):

- Click a filter — the control must respond immediately, not after the grid settles
- Click a second filter while the grid is still updating — it must register, not be swallowed
- The grid dims while pending and returns to full opacity when done
- Rapidly toggling several filters ends on the correct final result, not an intermediate one

- [ ] **Step 2c.6: Commit**

```bash
git add app/outfits/outfit-data-provider.tsx components/outfits/outfit-context.tsx app/outfits/filter-outfits.tsx
git commit -m "perf(outfits): make filter changes non-blocking

Filter updates were urgent state changes, so React could not interrupt
the ~6k-card re-render they triggered -- the main thread blocked and the
next click was dropped. Filter updates now run in a dedicated transition,
with isFiltering dimming the grid while the render is in flight.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Cards — make `React.memo` hold

**Files:**

- Modify: `app/outfits/outfit-set-card.tsx`
- Modify: `app/outfits/outfit-variant-card.tsx`
- Modify: `app/outfits/filter-outfits.tsx:254-298` (the inline `onToggle` closure)
- Modify: `app/outfits/outfit-set-section.tsx:48-57` (the `handleToggle` closure)

**Interfaces:**

- Consumes: stable context (Task 1) and memoized `filteredSets` (Tasks 2a/2b). Both are prerequisites — `React.memo` without stable props is pure overhead.
- Produces: memoized card components. Props are unchanged, so no call site needs new arguments.

- [ ] **Step 3.1: Stabilize the `onToggle` passed to `OutfitSetCard`**

In `filter-outfits.tsx`, the `onToggle={() => {...}}` at line 283 allocates a new closure per render, which defeats `memo`. It closes over `variants` and `onBatchToggleObtained`.

Hoist the toggle into a stable callback that takes its data as arguments. Add near the other callbacks in the component:

```ts
const handleGroupToggle = useCallback(
  (variants: OutfitVariant[]) => {
    const allObtained = variants.every((v) => v.obtained === true)
    const toToggle = variants
      .filter((v) => v.obtained === allObtained)
      .map((v) => ({
        outfit_set: v.outfit_set!,
        outfit_category: v.outfit_category!,
        outfit_variant: v.slug,
      }))
    onBatchToggleObtained(toToggle, !allObtained)
  },
  [onBatchToggleObtained]
)
```

Import `useCallback` and the `OutfitVariant` type (`@/lib/types/outfit`).

**Do not change `OutfitSetCard`'s `onToggle` prop type.** It stays `() => void`. `OutfitSetCard` has no `variants` prop (it receives `obtained` and `total` as numbers), so it cannot supply the argument itself.

Instead, keep the zero-argument prop and make the _identity_ stable per group. Because `filteredSets` is now memoized (Task 2a), the `variants` array for a given group has a stable identity between renders, so a per-group callback cache keyed on the group works:

```ts
const toggleCache = useMemo(
  () => new Map<string, () => void>(),
  // Rebuild the cache whenever the underlying data or handler changes.
  [filteredSets, handleGroupToggle]
)

const getGroupToggle = useCallback(
  (key: string, variants: OutfitVariant[]) => {
    const cached = toggleCache.get(key)
    if (cached) return cached
    const fn = () => handleGroupToggle(variants)
    toggleCache.set(key, fn)
    return fn
  },
  [toggleCache, handleGroupToggle]
)
```

At the call site (line 283), replace the inline arrow with:

```ts
onToggle={getGroupToggle(`${set.id}-${stateSlug}`, variants)}
```

The cache key matches the existing React `key` on line 267, so it is already unique per rendered card.

Note: `allObtained` was previously computed at the call site (line 263) and is now computed inside `handleGroupToggle` from the same `variants` array — identical result.

- [ ] **Step 3.2: Stabilize the `handleToggle` in `OutfitSetSection`**

`outfit-set-section.tsx:48-57` builds `handleToggle` inside a `.map()`, so it is a new identity per group per render.

This component returns an array from `.map()` rather than JSX, and the `.map()` runs during render — so hooks cannot be called per group. Use the same two-part pattern as Step 3.1:

1. Add a component-level `handleGroupToggle` identical to the one in Step 3.1, wrapped in `useCallback` with deps `[onBatchToggleObtained]`. It takes `groupVariants: OutfitVariant[]` and contains the current body of lines 48-57.
2. Add the same `toggleCache` / `getGroupToggle` pair, with the cache `useMemo` keyed on `[outfitSets, handleGroupToggle]` (this component reads `outfitSets` from context rather than `filteredSets`).
3. Replace `onClick={handleToggle}` on the `IconButton` (line 78) with `onClick={getGroupToggle(stateSlug, groupVariants)}`.

`stateSlug` is unique per group within this component, so it is a valid cache key.

Important: pass `groupVariants` (the full unfiltered group from line 42), **not** `variants` (the filtered display list from line 35). The existing code toggles over `groupVariants`, and that must not change — toggling should act on the whole group even when the display is filtered.

- [ ] **Step 3.3: Wrap the two card components in `React.memo`**

In `outfit-variant-card.tsx`, change the default export to a memoized component:

```ts
import { memo, useState } from 'react'

function OutfitVariantCard({ ... }) {
  // body unchanged
}

export default memo(OutfitVariantCard)
```

Do the same in `outfit-set-card.tsx`, keeping its existing `useState`/`useEffect` imports.

Use the default shallow comparison — do **not** write a custom `areEqual`. A custom comparator that ignores a changed prop is a stale-UI bug, and the props here are primitives plus the now-stable callbacks.

- [ ] **Step 3.4: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 3.5: Manual behavior check**

Run `yarn dev` and confirm, in **both** standard and compact density:

- Single variant toggle updates that card only, and its progress chip
- Set-header batch toggle marks/clears the whole group
- The "missing" filter animates a card out when you complete it
- Hiding evolutions / glow-ups animates those cards out
- Cards still `Grow` in on load (the transition is deliberately retained)

- [ ] **Step 3.6: Commit**

```bash
git add app/outfits/outfit-set-card.tsx app/outfits/outfit-variant-card.tsx app/outfits/filter-outfits.tsx app/outfits/outfit-set-section.tsx
git commit -m "perf(outfits): memoize card components with stable callbacks

Wrapped OutfitSetCard and OutfitVariantCard in React.memo and hoisted
the inline onToggle closures into useCallback so the memo actually
holds. A new closure identity per render would have defeated it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Take density / image-mode persistence out of the interaction path

**Added 2026-07-29.** User reported that switching standard → compact takes **seconds to register the toggle itself**, before any card rendering. Cause: `setDensity` (`components/outfits/outfit-image-mode-context.tsx:77-80`) fires the `updateOutfitDensity` Server Action inside `startTransition`. This is the identical bug Task 2d fixed for filters — in a second provider that was never touched. `setMode` and `reset` have it too.

**Files:**

- Modify: `components/outfits/outfit-image-mode-context.tsx:72-93`

**Interfaces:**

- Consumes: nothing new.
- Produces: no API change. `setMode`, `setDensity`, `cycleMode`, and `reset` keep their signatures.

- [ ] **Step 6.1: Make all three write sites fire-and-forget**

The pattern for all three: update local state synchronously, then persist without any transition the UI observes. Unlike Task 2d these are single discrete clicks rather than a burst, so a debounce is unnecessary — the fix is removing `startTransition`, not adding a timer.

Replace lines 72-93 with:

```ts
const setMode = (next: OutfitImageMode) => {
  setModeState(next)
  // Fire-and-forget: the UI must never wait on this write. Running it inside a
  // transition made the pending state track a network round-trip, so toggling
  // took seconds to register (same bug as the filter persistence in Task 2d).
  if (isLoggedIn) void updateOutfitImageMode(next).catch(persistFailed)
}

const setDensity = (next: OutfitDensity) => {
  setDensityState(next)
  if (isLoggedIn) void updateOutfitDensity(next).catch(persistFailed)
}

// Restore both image mode and density to their defaults ('image' / 'standard'),
// persisting the reset for logged-in users. Used by the filter menu "Clear all".
const reset = () => {
  setModeState('image')
  setDensityState('standard')
  if (isLoggedIn) {
    void updateOutfitImageMode('image').catch(persistFailed)
    void updateOutfitDensity('standard').catch(persistFailed)
  }
}
```

Add this helper at module scope, above the provider:

```ts
// A failed view-preference write must not disrupt the UI — the setting still
// applies for this session, it just may not survive a reload.
const persistFailed = (err: unknown) => {
  console.error('Failed to persist outfit view preference:', err)
}
```

- [ ] **Step 6.2: Remove the now-unused transition**

With all three call sites converted, `startTransition` (line 57) is unused. Delete the `const [, startTransition] = useTransition()` line and drop `useTransition` from the React import on line 3 — but **only** if nothing else in the file uses it. Grep the file to confirm before deleting.

Leave the `useMemo` on the context value and its `eslint-disable-next-line react-hooks/exhaustive-deps` (line 108) exactly as they are.

- [ ] **Step 6.3: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors, and no unused-import warning for `useTransition`.

- [ ] **Step 6.4: Manual check (human)**

- Toggling density registers **immediately** — the toggle's own visual state must not wait
- The image-mode swap toggles immediately
- "Clear all" in the filter menu still resets density and image mode
- Change density, reload the page — the choice persisted

- [ ] **Step 6.5: Commit**

```bash
git add components/outfits/outfit-image-mode-context.tsx
git commit -m "perf(outfits): stop density and image-mode toggles awaiting writes

setDensity, setMode, and reset each ran their Server Action inside a
transition, so the toggle's own state waited on a Supabase round-trip --
seconds before a density switch even registered. Same bug Task 2d fixed
for filters, in the other provider. Writes are now fire-and-forget.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Cap rendered cards with progressive reveal

**Added 2026-07-29.** Chosen by the user over virtualization ("cap now, virtualize later if needed"). The compact ungrouped view mounts ~6,000 cards at once; no amount of memoization helps because the work is genuinely necessary. Capping avoids both the new dependency and the JS/CSS breakpoint duplication that Task 5 would require.

**Files:**

- Modify: `app/outfits/filter-outfits.tsx`

**Interfaces:**

- Consumes: the memoized `filteredSets` (Tasks 2a/2b) and memoized cards (Task 3).
- Produces: no new exports.

- [ ] **Step 7.1: Add the cap state**

Near the top of the `FilterOutfits` component (with the other hooks, above the early returns), add:

```ts
const [visibleCount, setVisibleCount] = useState(INITIAL_CARD_LIMIT)
```

And at module scope:

```ts
// The compact ungrouped view can hold ~6000 variants; mounting them all at once
// blocks the main thread for seconds. Render a window and let the user extend it.
const INITIAL_CARD_LIMIT = 200
const CARD_LIMIT_STEP = 200
```

- [ ] **Step 7.2: Reset the cap when the result set changes**

This is the subtle part. If the user filters down and the cap stays where they scrolled it, behavior is confusing. Reset the cap whenever the filtered results change:

```ts
// Collapse back to the first window when the result set changes, so a new
// filter starts from the top rather than inheriting a previous "load more".
useEffect(() => {
  setVisibleCount(INITIAL_CARD_LIMIT)
}, [filteredSets])
```

Place this with the other hooks, above the early returns.

- [ ] **Step 7.3: Slice the ungrouped compact list and add the reveal control**

In the compact branch, the ungrouped side currently reads:

```tsx
<>{filteredSets.flatMap((set) => renderSetVariants(set))}</>
```

Replace it so the flattened list is sliced, and a "Load more" button follows the grid when more remain. The button must sit **outside** the `CardGrid` (it is not a card), so restructure the ungrouped branch to render the grid and the button as siblings.

```tsx
const allCards = filteredSets.flatMap((set) => renderSetVariants(set))
const visibleCards = allCards.slice(0, visibleCount)
const remaining = allCards.length - visibleCards.length
```

Compute these inside the compact-ungrouped branch. Render `visibleCards` in the `CardGrid`, then below it:

```tsx
{
  remaining > 0 && (
    <Stack sx={{ alignItems: 'center', py: 3 }}>
      <Button variant="outlined" onClick={() => setVisibleCount((n) => n + CARD_LIMIT_STEP)}>
        Load {Math.min(remaining, CARD_LIMIT_STEP)} more ({remaining} remaining)
      </Button>
    </Stack>
  )
}
```

`Stack` and `Button` are already imported from `@mui/material` in this file — verify before adding imports.

Important: apply the cap **only** to the compact ungrouped branch. Leave the grouped compact branch and the standard-density branch untouched — grouped mode's set sections are a different structure, and standard density renders only hundreds of cards.

Note `renderSetVariants` returns an array of elements, so `flatMap` over it yields a flat element array that slices cleanly. The elements already carry stable `key`s from `variant.id`.

- [ ] **Step 7.4: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors, no exhaustive-deps warnings on the new effect.

- [ ] **Step 7.5: Manual check (human)**

In compact density, ungrouped, no filters:

- Initial load renders quickly (~200 cards, not ~6000)
- Scrolling is smooth
- "Load more" appends the next batch and the count decrements correctly
- Applying a filter resets back to the first window
- Toggling a variant's obtained state still works, and does **not** reset the cap unexpectedly
- Switching to grouped mode or standard density still shows everything as before

- [ ] **Step 7.6: Commit**

```bash
git add app/outfits/filter-outfits.tsx
git commit -m "perf(outfits): cap rendered cards in the compact ungrouped view

The compact ungrouped view mounted ~6000 cards at once, which blocks the
main thread for seconds regardless of memoization -- the work is real,
just too much at once. It now renders 200 with a Load more control, and
resets to the first window when the filtered results change.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Stop preference writes from remounting the provider

**Added 2026-07-29 after a user-supplied server log disproved an earlier claim of mine.** Toggling density produced:

```text
POST /outfits 200 in 399ms      -> updateOutfitFilters 218ms
GET /api/obtained-outfit 200 in 2.4s
GET /api/outfits 200 in 6.7s    (application-code: 5.7s)
POST /outfits 200 in 1087ms     -> updateOutfitDensity 596ms
```

I had told the user the DB fetch "happens once on mount." It does not — it refires on every preference toggle. Tasks 2d and 6 removed the `await` on a 200-600ms write while leaving a **6.7s refetch** behind it, which is why the user noticed no improvement.

**The mechanism, verified against the Next.js 16 source.** A Server Action does _not_ automatically refresh the router — it bails out unless `revalidatePath`, `revalidateTag`, `refresh()`, or **`cookies.set()`** is called. `upsertUserPreference` calls `getUserID()` → `createClient()`, and the Supabase SSR client **sets auth cookies** (`lib/supabase/server.ts:22-27`) when it refreshes the session. In `action-handler.ts`, `isCookieRevalidated` sets the revalidation header → `ActionDidRevalidateStaticAndDynamic` → full client cache invalidation → the route re-renders → `app/outfits/layout.tsx` re-runs `getUserID()` → `OutfitDataProvider` remounts → its `useEffect(…, [])` refires both fetches.

**The fix:** write preferences through a route handler instead. Route handlers cannot trigger client-cache revalidation, so the cookie write no longer invalidates anything.

**Files:**

- Modify: `app/api/preferences/route.ts` (add `POST`)
- Modify: `app/outfits/outfit-data-provider.tsx` (filter writes)
- Modify: `components/outfits/outfit-image-mode-context.tsx` (density / image-mode writes)

**Scope note:** five other files import `app/actions/preferences` (`app/settings/appearance-settings.tsx`, `app/eureka/eureka-data-provider.tsx`, `app/admin/admin-view-toggle.tsx`, `components/sort-context.tsx`, `components/navbar/theme-switcher.tsx`). They have the same latent bug, but this task covers **only the two outfits-path files**. Leave the Server Actions in `app/actions/preferences.ts` in place for those other callers — do not delete them.

**Interfaces:**

- Consumes: the existing `GET /api/preferences` route.
- Produces: `POST /api/preferences` accepting a partial preferences object, and a client helper for calling it.

- [ ] **Step 8.1: Add a POST handler to the preferences route**

In `app/api/preferences/route.ts`, add a `POST` alongside the existing `GET`. Reuse the same auth pattern the `GET` uses.

```ts
// Allowed preference columns. An explicit allowlist keeps a malicious body from
// writing arbitrary columns through the upsert.
const WRITABLE_KEYS = new Set([
  'group_by_set',
  'show_by_color',
  'eureka_set_filter',
  'eureka_category',
  'eureka_obtained_filter',
  'eureka_color',
  'eureka_rarity',
  'theme',
  'color_theme',
  'outfit_set_filter',
  'outfit_category_filter',
  'outfit_evolution_filter',
  'outfit_rarity_filter',
  'outfit_obtained_filter',
  'outfit_group_by_set',
  'outfit_hide_evolutions',
  'outfit_hide_glowups',
  'outfit_image_mode',
  'outfit_density',
  'sort_order',
  'outfit_sort_axis',
])

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await request.json()) as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (WRITABLE_KEYS.has(key)) updates[key] = value
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Failed to persist preferences:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 8.2: Add a client helper**

Create `lib/save-preferences.ts`:

```ts
// Persist view preferences through the API route rather than a Server Action.
// A Server Action that sets cookies (which the Supabase SSR client does when it
// refreshes a session) invalidates the client router cache, remounting the
// outfits provider and refiring its ~6.7s data fetch. Route handlers cannot
// trigger that revalidation.
export function savePreferences(updates: Record<string, unknown>) {
  return fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).then((r) => {
    if (!r.ok) throw new Error(`POST /api/preferences returned ${r.status}`)
  })
}
```

- [ ] **Step 8.3: Switch the outfits filter writes**

In `app/outfits/outfit-data-provider.tsx`, replace the imported Server Action calls with `savePreferences`. The debounced `[filters]` effect from Task 2d keeps its `setTimeout` and `clearTimeout` — only the call inside changes:

```ts
void savePreferences({
  outfit_set_filter: filters.selectedOutfitSet,
  outfit_category_filter: filters.selectedOutfitCategory.length
    ? filters.selectedOutfitCategory.join(',')
    : null,
  outfit_evolution_filter:
    filters.selectedEvolution !== null ? String(filters.selectedEvolution) : null,
  outfit_rarity_filter: filters.selectedRarity ? String(filters.selectedRarity) : null,
  outfit_obtained_filter: filters.selectedObtainedFilter,
  outfit_style_filter: filters.selectedStyle.length ? filters.selectedStyle.join(',') : null,
  outfit_label_filter: filters.selectedLabel.length ? filters.selectedLabel.join(',') : null,
}).catch((err) => {
  console.error('Failed to persist outfit filters:', err)
})
```

Also convert the three toggle handlers that call `updateOutfitGroupBySet`, `updateOutfitHideEvolutions`, and `updateOutfitHideGlowups`, plus the `handleClearFilters` block that calls all three. Each becomes a `void savePreferences({ … }).catch(…)` with the matching column (`outfit_group_by_set`, `outfit_hide_evolutions`, `outfit_hide_glowups`). Remove the now-unused `startTransition` wrapper around those calls, and delete the `useTransition` on line 60 **only if** nothing else in the file uses it — grep first.

Note: `outfit_style_filter` and `outfit_label_filter` are not in the `GET`'s select list nor in my `WRITABLE_KEYS` list above. Check whether those columns exist on `user_preferences`; if they do, add them to `WRITABLE_KEYS` and to the `GET` select. If they do not, drop them from the write. Report what you found.

- [ ] **Step 8.4: Switch the density / image-mode writes**

In `components/outfits/outfit-image-mode-context.tsx`, replace `updateOutfitImageMode` / `updateOutfitDensity` with `savePreferences({ outfit_image_mode: next })` and `savePreferences({ outfit_density: next })`. Keep the existing fire-and-forget shape and the `persistFailed` handler from Task 6. `reset` writes both keys — send them in **one** call (`{ outfit_image_mode: 'image', outfit_density: 'standard' }`) rather than two, which also fixes a race noted in an earlier review.

- [ ] **Step 8.5: Verify types, lint, and build**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: clean. The build matters — a route handler with a bad signature can pass `tsc` and fail the build.

- [ ] **Step 8.6: Manual verification (human) — THE decisive check**

With the dev server's request log visible, toggle density in the browser. Confirm:

- **`GET /api/outfits` does NOT appear** — this is the whole point of the task
- `GET /api/obtained-outfit` does not appear either
- A single `POST /api/preferences` appears instead of `POST /outfits`
- The density toggle registers immediately
- Reload the page — the density choice persisted
- The same for a filter change: one debounced `POST /api/preferences`, no refetch

- [ ] **Step 8.7: Commit**

```bash
git add app/api/preferences/route.ts lib/save-preferences.ts app/outfits/outfit-data-provider.tsx components/outfits/outfit-image-mode-context.tsx
git commit -m "perf(outfits): write preferences via route handler, not Server Action

The Supabase SSR client sets auth cookies while refreshing a session.
Inside a Server Action that marks the response as revalidated, which
invalidates the client router cache, remounts OutfitDataProvider, and
refires its ~6.7s /api/outfits fetch on every preference toggle. Writing
through a route handler avoids the revalidation entirely.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Extend the card cap to grouped compact

**Added 2026-07-29.** Task 7 capped only the **ungrouped** compact branch, but `outfit_group_by_set` defaults to `true` (`lib/preferences.ts:22`), so the user never saw the cap or the "Load more" button. Task 7 was scoped by which branch was easiest to cap rather than which branch is actually used.

**Files:**

- Modify: `app/outfits/filter-outfits.tsx`

**Interfaces:**

- Consumes: `visibleCount` / `setVisibleCount` and the `INITIAL_CARD_LIMIT` / `CARD_LIMIT_STEP` constants added by Task 7, plus the existing cap-reset effect. Reuse them — do not add a second cap mechanism.
- Produces: no new exports.

- [ ] **Step 9.1: Cap the number of set sections**

In grouped compact mode the unit is a **set section**, not a card, so the cap counts sections. Sections vary in size, so a fixed section count is the pragmatic choice.

Add at module scope, beside the existing card constants:

```ts
// Grouped mode renders whole set sections rather than a flat card list, so its
// window is measured in sections. Each section is one header plus its variants.
const INITIAL_SECTION_LIMIT = 20
const SECTION_LIMIT_STEP = 20
```

Do **not** reuse `visibleCount` for sections — the two branches have different units and would fight each other when the user switches grouping. Add a separate state:

```ts
const [visibleSections, setVisibleSections] = useState(INITIAL_SECTION_LIMIT)
```

Place it with the other hooks, above the early returns.

- [ ] **Step 9.2: Reset the section cap on the same criteria**

Add `setVisibleSections(INITIAL_SECTION_LIMIT)` to the body of the existing cap-reset `useEffect` that Task 7 added. Do not create a second effect, and do not change that effect's dependency array — it is deliberately keyed on the filter/sort criteria rather than `filteredSets` so an obtained toggle does not reset the window mid-scroll. Read the comment above it before editing.

- [ ] **Step 9.3: Slice the grouped branch and add its reveal control**

The grouped compact branch currently renders every set:

```tsx
{
  filteredSets.map((set) => <OutfitSetSection key={set.id} isLoggedIn={isLoggedIn} set={set} />)
}
```

Slice it to `filteredSets.slice(0, visibleSections)`, and render a "Load more" button below the grid when sections remain — following the same shape Task 7 used, with the button **outside** `CardGrid` (it is not a card). Label it in terms of sets, e.g. `Load N more sets (M remaining)`.

Keep using `OutfitSetSection` unchanged; do not modify that component.

- [ ] **Step 9.4: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean, no exhaustive-deps warnings.

- [ ] **Step 9.5: Manual check (human)**

In compact density, **grouped** (the default):

- Only ~20 set sections render initially, and the "Load more" button is visible
- "Load more" appends the next 20 and the remaining count decrements
- Applying a filter resets to 20 sections
- Toggling a variant's obtained state does **not** reset the window
- Switching to ungrouped still shows the 200-card window from Task 7
- Standard density is unaffected

- [ ] **Step 9.6: Commit**

```bash
git add app/outfits/filter-outfits.tsx
git commit -m "perf(outfits): cap set sections in the grouped compact view

Task 7 capped only the ungrouped branch, but grouped is the default, so
the cap was unreachable for most users. Grouped compact now renders 20
set sections with a Load more control, using a separate counter since
its unit is sections rather than cards.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Parallelize the variant fetch

**Added 2026-07-29 from measurements against the production database.** The route was 6.8s of server time. `EXPLAIN ANALYZE` shows the database is not the problem:

| Query                                  | Time         |
| -------------------------------------- | ------------ |
| All 6,567 variants, one query          | **4.9 ms**   |
| Same columns, `LIMIT 1000 OFFSET 6000` | **323.7 ms** |

`hooks/data/outfit-variants.ts:16-25` loops **sequentially**, 1000 rows per request, ~7 round-trips each awaiting the previous. Worse, `OFFSET N` makes Postgres scan and discard N rows every time, so per-page cost climbs.

**Pagination cannot simply be removed.** Verified by curl against production with `Range: 0-99999`: PostgREST returns `content-range: 0-999/6567`. The 1000-row cap applies to **top-level** selects, not just embeds. Dropping the loop would silently truncate to 1000 rows and lose 5,567 variants. **The fix is to parallelize, not eliminate.**

**Urgency:** the `authenticated` Postgres role has an **8-second `statement_timeout`** (`anon` is 3s). At 6.8s this route is near a hard failure cliff — as the variant count grows it will start returning 500s in production.

**Files:**

- Modify: `hooks/data/outfit-variants.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `getOutfitVariantsBySet()` keeps its exact signature — `() => Promise<Map<string, OutfitVariant[]>>` — and must return identical data. Callers (`app/api/outfits/route.ts`, `hooks/data/outfit-sets.ts`) need no changes.

- [ ] **Step 10.1: Fetch the exact count, then request all pages in parallel**

Replace `fetchAllOutfitVariants` (lines 12-27). Get the total first with a head request, compute every range, then `Promise.all` them:

```ts
async function fetchAllOutfitVariants(): Promise<OutfitVariant[]> {
  const supabase = await createClient()
  const PAGE = 1000

  // PostgREST caps every response at 1000 rows — including top-level selects,
  // not just embeds — so the ~6.5k variants must be paged. Fetching the exact
  // count first lets all pages go out at once: the old sequential loop cost ~7
  // round-trips in series, and each OFFSET made Postgres scan and discard the
  // rows before it.
  const { count, error: countError } = await supabase
    .from('outfit_variants')
    .select('id', { count: 'exact', head: true })
  if (countError) throw countError

  const total = count ?? 0
  if (total === 0) return []

  const pages = Array.from({ length: Math.ceil(total / PAGE) }, (_, i) => i * PAGE)
  const results = await Promise.all(
    pages.map(async (from) => {
      const { data, error } = await supabase
        .from('outfit_variants')
        .select(PUBLIC_VARIANT_SELECT)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      return (data ?? []) as OutfitVariant[]
    })
  )

  return results.flat()
}
```

Two properties this preserves, both load-bearing:

- **Order.** Every page carries `.order('id')`, and `results.flat()` concatenates them in range order, so the combined array is still sorted by `id` exactly as the sequential loop produced. Downstream `createOutfitSet` relies on variant order for its category sorting — do not drop the `.order()` from any page.
- **Completeness.** A row inserted between the count and the page reads could shift rows across page boundaries. That is a pre-existing property of the old loop too, and this data is admin-edited rather than high-churn, so it is accepted rather than solved with a snapshot transaction.

- [ ] **Step 10.2: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 10.3: Verify the row count did not change (human, decisive)**

This is the check that matters — a silent truncation here would drop variants from the whole app.

With the dev server running, hit `/api/outfits` and confirm the total variant count across all sets is **6,567** (the production count as of 2026-07-29). Compare against `main` if in doubt. Also confirm `/api/outfits` server time drops substantially from ~6.8s.

- [ ] **Step 10.4: Commit**

```bash
git add hooks/data/outfit-variants.ts
git commit -m "perf(outfits): fetch variant pages in parallel

The variant fetch looped sequentially, ~7 round-trips each awaiting the
previous, and every OFFSET made Postgres scan and discard the preceding
rows. Measured: one unpaginated query is 4.9ms while LIMIT 1000 OFFSET
6000 alone is 323ms. Pagination is still required (PostgREST caps
top-level selects at 1000 rows), so the pages now go out in parallel
after an exact-count head request.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Fetch preferences once per page, not once per provider

**Added 2026-07-29 from the user's server log**, which showed `GET /api/preferences` three times on a single `/outfits` load (562ms + 671ms + 1019ms ≈ 2.25s). Three providers each fetch it independently:

- `app/outfits/outfit-data-provider.tsx:84`
- `components/sort-context.tsx:67`
- `components/outfits/outfit-image-mode-context.tsx:67`

**Files:**

- Create: `lib/preferences-cache.ts`
- Modify: the three call sites above

**Scope note:** `app/eureka/eureka-data-provider.tsx` and `app/settings/appearance-settings.tsx` also fetch it, but on their own pages. Converting them is optional; if the shared helper makes it trivial, do it, but do not restructure those pages.

**Interfaces:**

- Produces: `fetchPreferencesOnce(): Promise<UserPreferences>` — de-duplicates concurrent callers by sharing one in-flight promise.

- [ ] **Step 12.1: Create the shared fetch**

Create `lib/preferences-cache.ts`:

```ts
import type { UserPreferences } from '@/lib/types/eureka'

// Three providers mount together on /outfits and each used to fetch preferences
// independently — three identical round-trips on every page load. They share one
// in-flight promise instead. Module scope is correct here: the module is
// per-client-bundle, and preferences are per-session, so there is no cross-user
// leak the way a module-level cache on the server would risk.
let inFlight: Promise<UserPreferences> | null = null

export function fetchPreferencesOnce(): Promise<UserPreferences> {
  if (inFlight) return inFlight
  inFlight = fetch('/api/preferences')
    .then((r) => {
      if (!r.ok) throw new Error(`/api/preferences returned ${r.status}`)
      return r.json() as Promise<UserPreferences>
    })
    .catch((err) => {
      // Clear on failure so a later mount can retry rather than inheriting a
      // permanently rejected promise.
      inFlight = null
      throw err
    })
  return inFlight
}

// Call after a write so the next read reflects it. Not needed for the current
// callers (they all read once on mount) but required if a consumer ever refetches.
export function invalidatePreferences() {
  inFlight = null
}
```

- [ ] **Step 12.2: Switch the three call sites**

In each of the three files, replace the direct `fetch('/api/preferences')` (or `fetchJson<UserPreferences>('/api/preferences')`) with `fetchPreferencesOnce()`. Keep every `.then()` body, each `.catch()`, and all existing guards exactly as they are — only the call that produces the promise changes.

Note `outfit-data-provider.tsx` uses a local `fetchJson` helper; leave that helper in place, since its other call sites (`/api/outfits`, `/api/obtained-outfit`) still use it.

- [ ] **Step 12.3: Verify types and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 12.4: Manual check (human)**

Load `/outfits` with the dev log visible: exactly **one** `GET /api/preferences` should appear, not three. Then confirm all three preference-driven features still hydrate correctly from saved values: filters, sort order/axis, and density/image mode.

- [ ] **Step 12.5: Commit**

```bash
git add lib/preferences-cache.ts app/outfits/outfit-data-provider.tsx components/sort-context.tsx components/outfits/outfit-image-mode-context.tsx
git commit -m "perf: fetch preferences once per page instead of per provider

Three providers mount together on /outfits and each fetched
/api/preferences independently -- three identical round-trips totalling
~2.25s on the user's load. They now share one in-flight promise.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Single source of truth for the grid breakpoints

**Added 2026-07-29.** Prerequisite for Task 5. The user approved virtualization specifically on the condition that the breakpoints not be duplicated.

`OUTFIT_GRID_COLUMNS_CONTAINER` (`lib/types/props.ts:80-86`) encodes the column counts as CSS `@container` rules. A virtualizer must know the column count **in JavaScript** — container queries resolve only inside the CSS engine, and there is no API to read the resolved column count. Writing those thresholds a second time in JS creates two sources of truth that can silently drift, producing overlapping or gapped cards with no type error and no test to catch it (this repo has no test runner).

**Files:**

- Modify: `lib/types/props.ts`

**Interfaces:**

- Produces: `OUTFIT_GRID_BREAKPOINTS` (the single source) plus `outfitColumnsForWidth(width: number): number`. `OUTFIT_GRID_COLUMNS_CONTAINER` keeps its existing name, shape, and behavior — it is consumed by `components/card-grid.tsx` and must stay a drop-in.

- [ ] **Step 13.1: Derive the CSS object from a declared list**

In `lib/types/props.ts`, replace the hand-written `OUTFIT_GRID_COLUMNS_CONTAINER` (lines 80-86) with a declared breakpoint list plus a derivation. The generated object must be **exactly equivalent** to the current one: base 2 columns, then 600→3, 900→4, 1200→6, 1536→8.

```ts
// THE single source of truth for the outfit grid's responsive columns. Both the
// CSS container-query object below and the JS lookup used by the virtualizer are
// derived from this list, so the two can never disagree. Add or change a
// breakpoint here and both follow.
export const OUTFIT_GRID_BREAKPOINTS = [
  { minWidth: 0, columns: 2 },
  { minWidth: 600, columns: 3 },
  { minWidth: 900, columns: 4 },
  { minWidth: 1200, columns: 6 },
  { minWidth: 1536, columns: 8 },
] as const

// Container-query grid template derived from the breakpoints. Pair with
// GRID_CONTAINER on an ancestor so it reads CONTENT width, not viewport.
export const OUTFIT_GRID_COLUMNS_CONTAINER = OUTFIT_GRID_BREAKPOINTS.reduce(
  (acc, { minWidth, columns }) => {
    const template = `repeat(${columns}, 1fr)`
    if (minWidth === 0) return { ...acc, gridTemplateColumns: template }
    return { ...acc, [`@container (min-width: ${minWidth}px)`]: { gridTemplateColumns: template } }
  },
  {} as Record<string, unknown>
)

// The same breakpoints resolved in JS, for code that must know the column count
// (the virtualizer maps a flat item list onto rows). Mirrors how CSS resolves
// min-width rules: the last matching breakpoint wins.
export function outfitColumnsForWidth(width: number): number {
  let columns = OUTFIT_GRID_BREAKPOINTS[0].columns
  for (const bp of OUTFIT_GRID_BREAKPOINTS) {
    if (width >= bp.minWidth) columns = bp.columns
  }
  return columns
}
```

- [ ] **Step 13.2: Verify the derived object is identical to the original**

This is the crux — a mismatch changes the layout of every outfit grid in the app.

The original object was exactly:

```ts
{
  gridTemplateColumns: 'repeat(2, 1fr)',
  '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
  '@container (min-width: 900px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
  '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(6, 1fr)' },
  '@container (min-width: 1536px)': { gridTemplateColumns: 'repeat(8, 1fr)' },
}
```

Confirm the derived value deep-equals this — same keys, same order, same strings. If `reduce` produces a type MUI's `sx` rejects, keep the runtime shape identical and adjust only the type annotation (e.g. assert to the shape `card-grid.tsx` expects). Do **not** change the emitted CSS to satisfy the type checker.

- [ ] **Step 13.3: Verify types, lint, and build**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: clean. `OUTFIT_GRID_COLUMNS_CONTAINER` is passed through MUI's `sx`, so a type regression here would surface at the `CardGrid` call sites.

- [ ] **Step 13.4: Manual check (human)**

Load `/outfits` and confirm the column counts are unchanged at several window widths, including with the filter drawer open and closed (the drawer narrowing the content column must still reflow the grid). Check `/eureka` too if it shares any of these constants.

- [ ] **Step 13.5: Commit**

```bash
git add lib/types/props.ts
git commit -m "refactor: derive outfit grid columns from one breakpoint list

The virtualizer needs the column count in JS, but the counts lived only in
CSS container queries, which JS cannot read. Rather than write the
thresholds twice, both the container-query object and a new
outfitColumnsForWidth() lookup are derived from one exported list.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Virtualize the ungrouped compact grid

**Status: specified but DEFERRED.** The user chose Task 7's card cap instead ("cap now, virtualize later if needed"). Revisit this task only if capping proves unsatisfying — it costs a new dependency and duplicates the container-query breakpoints in JS, where they can silently drift from the CSS.

**Added 2026-07-29.** Approved by the user after Tasks 2c/2d showed that filter interaction, while improved, is still limited by rendering ~6,000 cards synchronously. This was the user's original instinct; it is now evidence-backed rather than assumed.

**Scope decision — read before starting.** Only the **ungrouped compact** branch is virtualized. Three reasons:

1. That branch (`filteredSets.flatMap((set) => renderSetVariants(set))`) is a flat, uniform list of `OutfitVariantCard`s — the only branch with a simple row model.
2. The **grouped** compact branch renders `OutfitSetSection`s that emit full-width headers (`gridColumn: '1 / -1'`) interleaved with variable-length card runs. Virtualizing it requires flattening headers and cards into one indexed row model — materially harder, and deferred.
3. **Standard** density renders only hundreds of set cards; it does not need virtualization.

**The central obstacle.** `OUTFIT_GRID_COLUMNS_CONTAINER` (`lib/types/props.ts:80-86`) sets 2/3/4/6/8 columns via CSS **container queries**, keyed on content width so the grid reflows when the filter drawer opens. A virtualizer must know the column count **in JS** to map items to rows, but container queries resolve only in CSS. There is no way around this — every TanStack Virtual grid example needs the lane count in JS. So this task derives the column count with a `ResizeObserver` and accepts that the virtualized branch no longer reflows by pure CSS.

**Files:**

- Add dependency: `@tanstack/react-virtual`
- Create: `app/outfits/virtual-variant-grid.tsx`
- Modify: `app/outfits/filter-outfits.tsx` (ungrouped compact branch only)

**Interfaces:**

- Consumes: the memoized `filteredSets` (Task 2a/2b) and the memoized `OutfitVariantCard` (Task 3). Both are prerequisites — virtualizing unmemoized cards would still re-render the visible window on every parent render.
- Produces: `VirtualVariantGrid`, a component taking `variants: OutfitVariant[]` plus the props `OutfitVariantCard` needs, and rendering only the visible rows.

- [ ] **Step 5.1: Add the dependency**

Run: `yarn add @tanstack/react-virtual`

This is the **only** new dependency in the entire plan. Confirm it lands in `dependencies` (not `devDependencies`) and that `yarn.lock` updates.

- [ ] **Step 5.2: Create the virtualized grid component**

Create `app/outfits/virtual-variant-grid.tsx`. Key design points, each load-bearing:

- Use `useWindowVirtualizer`, **not** `useVirtualizer`. The page scrolls; there is no inner scroll container (verified: neither `CardGrid` nor `PageShell` sets `overflow`). `useVirtualizer` would silently never scroll.
- Pass `scrollMargin: parentRef.current?.offsetTop ?? 0` captured in a `useLayoutEffect`, so row offsets account for everything above the grid (toolbar, alerts, results bar).
- Derive the column count with a `ResizeObserver` on the wrapper, calling **`outfitColumnsForWidth(width)`** from `@/lib/types/props` (added by Task 13). Do **not** write the thresholds into this file — Task 13 exists precisely so the CSS grid and this lookup share one source of truth. If you find yourself typing `600` or `1536` here, stop and import instead.
- Observe the same element that carries `containerType: 'inline-size'`, so the drawer-open reflow still works: the `ResizeObserver` sees the same content-width changes the container query does.
- Row count is `Math.ceil(variants.length / columnCount)`.
- Use `measureElement` on each row so real card heights replace the estimate. Provide a sensible `estimateSize` (cards are ~4:3 plus a header; measure one in the browser and use that number rather than guessing).
- `overscan: 3` rows.

Render each virtual row as an absolutely-positioned flex/grid row of up to `columnCount` cards, sliced from `variants`. Keep using the existing `OutfitVariantCard` — do not reimplement the card.

- [ ] **Step 5.3: Wire it into the ungrouped compact branch**

In `app/outfits/filter-outfits.tsx`, the compact branch currently reads:

```tsx
{groupBySet ? (
  <>{filteredSets.map((set) => (<OutfitSetSection ... />))}</>
) : (
  <>{filteredSets.flatMap((set) => renderSetVariants(set))}</>
)}
```

Replace **only** the `else` branch with `VirtualVariantGrid`, passing the flattened variant list. The grouped branch stays exactly as it is.

Note: `VirtualVariantGrid` positions its own rows, so it must NOT be a child of `CardGrid`'s CSS grid — nesting an absolutely-positioned virtualizer inside a grid container will fight the grid. Restructure so the ungrouped compact branch renders `VirtualVariantGrid` outside `CardGrid` while the grouped branch keeps using `CardGrid`.

- [ ] **Step 5.4: Verify types, lint, and build**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: all clean. The build matters here because a new dependency plus `window` access can surface SSR errors that the dev server tolerates.

`useWindowVirtualizer` touches `window`, so confirm the component is under `'use client'` (`filter-outfits.tsx` already is) and that nothing reads `window` during the server render pass.

- [ ] **Step 5.5: Manual verification (human)**

In compact density, ungrouped, with no filters (~6,000 variants):

- Scrolling is smooth, and cards appear as you scroll without gaps or overlap
- The column count matches the non-virtualized grid at several window widths, including after opening/closing the filter drawer
- Toggling a variant's obtained state still works and the card updates
- The "missing" filter still animates a completed card out
- Scrolling to the very bottom reaches the last variant (no truncation)
- Switching density to standard and back restores the normal grid

- [ ] **Step 5.6: Commit**

```bash
git add package.json yarn.lock app/outfits/virtual-variant-grid.tsx app/outfits/filter-outfits.tsx
git commit -m "perf(outfits): virtualize the ungrouped compact grid

The ungrouped compact view renders ~6000 variant cards synchronously,
which memoization cannot fix -- the work is necessary, just too much at
once. That branch now renders only visible rows via a window
virtualizer, with the column count derived from a ResizeObserver to
match the container-query breakpoints.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Verify against the baseline

**Files:** none modified.

- [ ] **Step 4.1: Capture the "after" trace**

Repeat Step 0.1 exactly — same three interactions, both densities, same metrics.

- [ ] **Step 4.2: Compare against baseline**

The headline metric is **components re-rendered when toggling one variant**. It should drop from _every card on screen_ to approximately _one card_.

Record the before/after numbers for all six measurements in the PR description.

- [ ] **Step 4.3: Decide on the follow-ups**

Two items were deliberately deferred. Decide each with the trace in hand, and state the decision explicitly rather than leaving it implicit:

1. **The `Grow` transition** (`components/card-shell.tsx:44`) — if commits are still long and the profiler attributes time to transitions, removing it is now justified by evidence. Otherwise keep it.
2. **Virtualization of the compact/ungrouped grid** — if that ~6k-card view still lags after this work, it becomes a scoped follow-up on that one flat, uniform grid. If it no longer lags, virtualization is not needed at all and the original plan is correctly abandoned.

- [ ] **Step 4.4: Run the production build**

Run: `yarn build`
Expected: build succeeds. This catches anything the dev server tolerates.

- [ ] **Step 4.5: Open the PR**

```bash
git push -u origin perf/outfits-grid-render
```

Then open a PR against `main` including the before/after profiler numbers and the Step 4.3 decisions.

---

## Notes for the implementer

- **Why not virtualization?** It was the original request. It was rejected because the lag reproduces in standard density at only a few hundred cards, where node count is not the bottleneck — re-render churn is. Virtualization reduces node count but not re-renders. See `docs/superpowers/specs/2026-07-29-outfits-grid-performance-design.md`.
- **If a dependency array fights you,** add the missing dependency rather than suppressing the lint rule. A stale dep array causes wrong data on screen, which is a worse bug than the slowness being fixed.
- **The riskiest change is Task 2b.** The group-level vs per-variant obtained semantics at `filter-outfits.tsx:104-110` are subtle. The six-state snapshot diff exists specifically to catch a regression there — do not skip it.

---

### Task 14: Virtualize the grouped compact view

**Added 2026-07-30 at the user's request.** Task 5 virtualized only the ungrouped compact branch. Grouped is the **default** view (`outfit_group_by_set` defaults to `true` in `lib/preferences.ts:22`), so most users never reach the virtualized path — they get the 20-section cap from Task 9 instead.

**Why this is harder than Task 5.** The ungrouped grid is uniform: every row is `columnCount` cards. The grouped view interleaves **full-width headers** (set title link, progress chips, batch-toggle button, divider) with variable-length runs of cards, and one set can contribute several header+cards groups (base plus each evolution). A virtualizer needs a single indexed list of rows, so this task builds a **flattened row model** and virtualizes that.

**Files:**

- Create: `app/outfits/outfit-group-header.tsx` (extracted from `outfit-set-section.tsx`)
- Create: `app/outfits/virtual-grouped-grid.tsx`
- Modify: `app/outfits/filter-outfits.tsx` (grouped compact branch only)
- Delete or reduce: `app/outfits/outfit-set-section.tsx`

**Interfaces:**

- Consumes: the memoized `filteredSets`, the memoized `OutfitVariantCard`, `outfitColumnsForWidth` and `GRID_CONTAINER` from `lib/types/props`.
- Produces: `VirtualGroupedGrid`, taking the same `sets` the grouped branch renders today plus `isLoggedIn` / `isFiltering`.

- [ ] **Step 14.1: Extract the group header into its own component**

`outfit-set-section.tsx` currently returns an array mixing a header `Box` and card elements — exactly the shape the flat row model replaces. Extract the header (lines 59-86: the `Box` with `gridColumn: '1 / -1'`, the title `Button`, both `ProgressChip`s, the toggle `IconButton`, and the `Divider`) into `app/outfits/outfit-group-header.tsx`.

Its props: `title: string`, `href: string`, `isLoggedIn: boolean`, `obtained: number`, `total: number`, `allObtained: boolean`, `onToggle: () => void`.

Drop the `gridColumn: '1 / -1'` from the extracted component — in the virtualized layout a header occupies its own row rather than spanning grid columns. Keep the `mt: 1`, the `Stack` layout, and the `Divider` exactly as they are so the header looks identical.

Wrap it in `React.memo`, matching the card components.

- [ ] **Step 14.2: Build the flattened row model**

In `virtual-grouped-grid.tsx`, derive a flat row array from `sets` inside a `useMemo` keyed on `[sets, columnCount]`. Two row kinds:

```ts
type GroupRow =
  | { kind: 'header'; key: string; title: string; href: string; obtained: number; total: number; allObtained: boolean; variants: OutfitVariant[] }
  | { kind: 'cards'; key: string; variants: OutfitVariant[] }
```

Build it by reproducing the grouping logic currently in `outfit-set-section.tsx:30-57`, for each set in order:

- iterate `[null, ...set.evolutions]`; the state slug is `evolution?.slug ?? set.slug`
- `variants` = `set.outfit_variants.filter((v) => v.outfit_set === stateSlug)`; **skip the group entirely when empty** (the current code returns `null` for these)
- `href` = `evolution ? \`/outfits/${evolution.slug.replace('-', '?evolution=')}\` : \`/outfits/${set.slug}\``
- `title` = `evolution ? \`${set.title}: ${toTitle(evolution.title)}\` : set.title`
- push one `header` row, then `Math.ceil(variants.length / columnCount)` `cards` rows, each holding `variants.slice(i * columnCount, (i + 1) * columnCount)`

**Load-bearing detail — do not lose this.** The progress numbers and the batch toggle must be computed from the **full, unfiltered** group, not the displayed subset. `outfit-set-section.tsx:24` reads `fullSet` from context (`outfitSets.find((s) => s.id === set.id) ?? set`) precisely because `set.outfit_variants` is already filter-culled. Reproduce that: `groupVariants` comes from `fullSet`, and `obtained` / `total` / `allObtained` / the toggle payload all derive from `groupVariants` — never from the displayed `variants`. Getting this wrong silently shows wrong progress and makes the batch toggle act on a partial group.

The toggle body is `outfit-set-section.tsx:48-57`; carry it over verbatim, including `onBatchToggleObtained(toToggle, !allObtained)`.

- [ ] **Step 14.3: Virtualize the flat row list**

Model this on `app/outfits/virtual-variant-grid.tsx` — reuse its proven structure rather than inventing a second approach. Specifically keep, unchanged in spirit:

- `useWindowVirtualizer` (the page scrolls; there is no inner overflow container)
- the `ResizeObserver` on the `GRID_CONTAINER` element feeding `outfitColumnsForWidth` — **never write breakpoint literals**; that shared lookup is the only permitted source of the column count
- the `useLayoutEffect` `scrollMargin` block **including its `MutationObserver` on the parent's `childList`** (a fix-round found that conditional siblings above the grid mount/unmount without resizing, leaving `scrollMargin` stale)
- `overscan: 3`, `measureElement` on each row, `data-index`
- the `isFiltering` opacity dim; do **not** reintroduce `pointerEvents: 'none'`
- `columnCount === null` → render nothing (SSR safety)

Two things must differ from Task 5:

1. **`estimateSize` branches on row kind.** A header is roughly 48px (a `size="small"` Button plus a `Divider` and `mt: 1`); a card row is the existing `ESTIMATED_ROW_HEIGHT` of 191. Returning one number for both makes the initial scrollbar badly wrong on a header-dense list. Export or re-declare the card constant with a comment pointing at `virtual-variant-grid.tsx` so the two stay recognizably linked; measure a header in the browser later if 48 proves off.
2. **`getItemKey` must fold in `columnCount`** exactly as Task 5 does — row N holds different content at 4 columns than at 8, so cached heights must be discarded on reflow. Use the row's own `key` combined with `columnCount`.

Render a `header` row as the extracted `OutfitGroupHeader` at full width, and a `cards` row as the same `display: grid` / `repeat(${columnCount}, minmax(0, 1fr))` / `gap: 16px` row Task 5 uses.

- [ ] **Step 14.4: Wire it into the grouped branch and remove the section cap**

In `filter-outfits.tsx`, replace the grouped compact branch's `CardGrid` + `filteredSets.slice(0, visibleSections).map(...)` + "Load more sets" button with `VirtualGroupedGrid`. Render it **outside** `CardGrid` for the same reason Task 5's grid is — it positions rows absolutely and would fight the CSS grid.

Virtualization supersedes the section cap, so remove `visibleSections`, `INITIAL_SECTION_LIMIT`, `SECTION_LIMIT_STEP`, the "Load more sets" button, and the `setVisibleSections` line inside the cap-reset `useEffect`. **If that effect's body becomes empty, delete the whole effect** — do not leave a no-op effect behind. Check whether any other state still needs resetting there first.

`OutfitSetSection` should now have no consumers. Verify with a grep, then delete the file. If something still imports it, keep it and say so.

- [ ] **Step 14.5: Verify types, lint, and build**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: all clean. The build matters — `window`/`ResizeObserver`/`MutationObserver` access must stay inside effects so `/outfits` still prerenders.

- [ ] **Step 14.6: Manual verification (human)**

In compact density, **grouped** (the default):

- Set headers appear above their cards, with correct titles, and each header's progress chips show the **full** group's obtained-out-of-total — not the filtered subset
- The batch-toggle button on a header marks/clears the whole group, including variants currently hidden by a filter
- Scrolling reaches the last set with no gaps, overlaps, or duplicated headers
- Opening/closing the filter drawer reflows the columns and rows re-measure cleanly
- Applying a filter that culls sets updates the list correctly
- A set whose variants are entirely filtered out shows **no** orphaned header
- Switching to ungrouped still shows Task 5's virtualized flat grid; standard density is unchanged

- [ ] **Step 14.7: Commit**

```bash
git add app/outfits/outfit-group-header.tsx app/outfits/virtual-grouped-grid.tsx app/outfits/filter-outfits.tsx
git rm app/outfits/outfit-set-section.tsx
git commit -m "perf(outfits): virtualize the grouped compact view

Grouped is the default view, so the Task 5 virtualization never reached
most users -- they got the 20-section cap instead. The interleaved
full-width headers and variable-length card runs are flattened into one
indexed row model (header rows and card rows) and virtualized, replacing
the cap entirely.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

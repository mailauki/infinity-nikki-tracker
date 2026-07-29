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

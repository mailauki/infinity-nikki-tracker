# Outfits Grid Render Performance

**Date:** 2026-07-29
**Status:** Approved, ready for implementation plan

## Problem

Scrolling the `/outfits` page lags. The lag appears in **standard density** as well as
compact density.

That detail drives the entire design. The two densities render very different volumes:

| Density              | What renders                          | Approx. count |
| -------------------- | ------------------------------------- | ------------- |
| `standard` (default) | one `OutfitSetCard` per set+evolution | hundreds      |
| `compact`            | one `OutfitVariantCard` per variant   | ~6,000        |

A few hundred static cards is not a node-count problem for any modern browser. Since the
lag is present at that scale, the bottleneck is **per-render cost and re-render churn**,
not the size of the DOM.

## Why not virtualization

Virtualization was the original instinct and is explicitly **rejected as the first fix**.

It reduces node count only. It does not reduce the number of components React re-renders
when state changes — the visible window still re-renders in full. It therefore cannot
explain or fix the standard-density lag, and it would add a permanent dependency plus a
row model that fights two existing behaviors:

- the interleaved full-width group headers (`gridColumn: '1 / -1'`) emitted by
  `app/outfits/outfit-set-section.tsx`
- the container-query column presets in `components/card-grid.tsx`, which reflow on
  content width when the filter drawer opens

Virtualization returns as a scoped follow-up **only if** the compact/ungrouped grid still
lags after this work. That view is flat and uniform, so it is the easy case to virtualize
in isolation.

## Findings

Established by reading the render path. These are structural facts, not hypotheses.

1. **The context value is rebuilt every render.**
   `app/outfits/outfit-data-provider.tsx:288-313` passes a fresh object literal as
   `value`. Line 284 additionally re-maps every set and its ~6k variants through
   `updateOutfitSet` on every render, producing new object identities. Every consumer of
   `useOutfitData()` — which is every card — re-renders as a result.

2. **The filter/sort pipeline re-runs every render.**
   `app/outfits/filter-outfits.tsx:112-216` is ~100 lines of chained
   `.filter().map().sort()` with no memoization. Line 162 nests `scopedVariants.filter()`
   inside another `.filter()`, re-scanning the group once per variant — quadratic per set.

3. **No card is memoized.**
   Zero `React.memo` across the outfits render path. Each `OutfitSetCard` subscribes to
   context and runs two `useEffect`s (`outfit-set-card.tsx:45-51`); each `LazyImage` runs
   three more via `useLazyImage`. All of them re-render whenever the context object
   changes.

Together these mean a single toggle re-renders every card on screen and re-maps ~6k
variants. That is the lag.

## Design

### 1. Provider: stop rebuilding the world

In `app/outfits/outfit-data-provider.tsx`:

- Wrap `outfitSetsWithObtained` (line 284) in `useMemo` keyed on
  `[outfitSets, obtainedOutfit]`.
- Wrap the context `value` object (line 289) in `useMemo`, and stabilize each handler with
  `useCallback`.

**Known limitation, deliberately deferred.** `updateOutfitSet` maps per set, so one toggle
invalidates the whole array. Whole-array memoization is the honest first step. If toggle
latency remains poor, the next refinement is an obtained-lookup `Set` so cards derive
their own obtained state instead of the array being rebuilt. Held in reserve pending
measurement rather than built speculatively.

### 2. Filter pipeline: memoize and de-nest

In `app/outfits/filter-outfits.tsx`:

- Wrap the `filteredSets` chain (lines 112-216) in `useMemo`, keyed on the sets plus every
  filter and sort input.
- Replace the nested group lookup at line 162 with a `Map<stateSlug, variants[]>` built
  once per set, then look up each group in O(1). This is an algorithmic fix, not caching.

**Constraint:** hooks cannot run conditionally, so the `useMemo` must sit above the early
`isError` / `isLoading` returns. This requires a small restructure of the component's top.

### 3. Cards: make memo actually hold

- Wrap `OutfitSetCard` and `OutfitVariantCard` in `React.memo`.
- Stabilize the inline `onToggle={() => {...}}` closures at `filter-outfits.tsx:283` and in
  `OutfitSetSection`. A new function identity per render **defeats `memo` entirely**, so
  these must be `useCallback`-stabilized or restructured to pass stable props.

**Ordering is load-bearing:** sections 1 and 2 must land before section 3. `memo` without
stable props is pure overhead.

### Animations

The per-card `Grow` transition in `components/card-shell.tsx:44` is **kept**. It is a real
per-card cost but a secondary one — `Grow` animates via CSS transforms, which are
compositor-friendly. The dominant cost is React re-rendering hundreds of components.
Removing it is a visible UX regression, so it is retained unless a post-fix profile shows
the transitions still hurting; then it is pulled with evidence justifying the trade.

## Verification

Capture React DevTools Profiler traces before and after, across three interactions —
initial load, toggling one variant, changing one filter — in both standard and compact
density.

Headline metric: **components re-rendered per toggle**, expected to drop from _all cards_
to _one_.

Behavior, layout, filter semantics, and visible animation must be unchanged. The
group-level vs per-variant obtained filter semantics documented at
`filter-outfits.tsx:104-110` are subtle and must survive the refactor intact.

## Follow-up

If the compact/ungrouped grid still lags after this work, virtualize that single flat grid
as a separate, measured change.

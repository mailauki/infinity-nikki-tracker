# Known Issue: overlapping-card flash in the virtualized standard grid

**Filed:** 2026-07-30
**Status:** Accepted, not fixed. Revisit or revert.
**File:** `app/outfits/virtual-set-grid.tsx`
**Severity:** Cosmetic. Self-corrects in ~200ms. No data or interaction impact.

## Symptom

In **standard density** on `/outfits`, changing a filter or toggling the nav
drawer can flash overlapping cards for a few frames. During the flash the
scrollbar is roughly twice its settled height.

Compact density (grouped and ungrouped) is unaffected.

## Reproduction

Toggle the nav drawer with the standard grid in view. Measured frame by frame
with a `requestAnimationFrame` sampler:

| frame | total scroll height | columns | overlap |
| ----- | ------------------- | ------- | ------- |
| 0     | 18,470              | 4       | no      |
| 4     | 75,470              | 4       | no      |
| 5     | 106,619             | 3       | **yes** |
| 6     | 104,791             | 3       | **yes** |
| 7     | 116,577             | 3       | no      |

## Cause (partially isolated)

`rowCount = Math.ceil(items.length / columnCount)` scales **inversely** with the
column count. The drawer animates the content column's width across many frames;
each intermediate width re-derives the column count. A 6→3 transition therefore
**exactly doubles** `rowCount` and `getTotalSize()` mid-animation, while rows are
still positioned for the previous, wider column count inside the now-narrower
box — so the cards overlap.

Verified arithmetically: at ~1,457 items, 6→3 columns is 243→486 rows (2.00×);
8→4 is 183→365 (1.99×).

## What was tried

Debouncing the published layout (`RESIZE_SETTLE_MS = 250`) so a whole drawer
animation resolves to a single layout change. **Committed** (`cf57cb0f`) — it
removes most of the churn but does **not** eliminate the flash.

Re-measured after the debounce: still 12 overlapping frames, and the total swings
115,683 → 62,215 → **2,928** → 18,470. That 2,928 low is far too small to be a
column-count effect; it is the **measurement cache being wiped**, leaving almost
nothing measured. That second mechanism has not been isolated.

## Why it is tolerated

Standard density renders only a few hundred cards. Virtualizing it was never
load-bearing — the ~6,500-card problem that motivated this work lives entirely in
the compact views, which are fixed-height and work correctly.

## Recommended resolution

**Prefer reverting over further debugging.** Replace `VirtualSetGrid` in the
`density === 'standard'` branch of `app/outfits/filter-outfits.tsx` with a plain
`CardGrid`, matching the shape the compact branches used before virtualization.
That eliminates this entire class of bug at negligible performance cost.

If someone does want to fix it properly, the open question is _what invalidates
the measurement cache during a resize_ — `getItemKey` folds in `columnCount`, so
a column change legitimately discards every cached height, and the total collapses
until rows re-measure. A fix likely means keeping a stable height estimate across
the transition rather than falling back to the arithmetic one.

## Background

Aspect-ratio-driven virtualization over a CSS-animated container has materially
more failure modes than the fixed-height compact grids. Three separate bugs were
found and fixed in this file before this one, each surfaced only by running it:

1. `columnCount` / `containerWidth` as split state → 84px fallback estimate (`2582ed66`)
2. Arithmetic estimate slightly off → stacked scroll adjustments on toggles (`a5b79e71`)
3. Positional `getItemKey` → stale height reused on new content (`1b5ae4c6`)
4. State write inside the measure ref callback → `flushSync` mid-lifecycle (`6716e70b`)

'use client'

import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { GRID_CONTAINER, outfitColumnsForWidth } from '@/lib/types/props'
import type { Evolution, OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import OutfitSetCard from './outfit-set-card'
import { GAP_PX } from './virtual-variant-grid'

// Height of the title/rarity block below a set card's image, derived from
// `components/set-card.tsx:57-73`:
//   - the inner `Stack spacing={1}` carries `py: 2` -> 16px top + 16px bottom = 32
//   - an `overline` Typography: 0.6875rem (11px) x lineHeight 1.455 = ~16
//   - `spacing={1}` between the two children = 8
//   - `RarityStars`, a `caption` Typography (0.75rem = 12px) whose sparkle icons
//     inherit that font size, so its line box is ~12
// 32 + 16 + 8 + 12 = 68. The sibling `CollectionToggle` IconButton is only ~40px
// tall (24px icon + 8px padding per side) so it never drives the row height, and
// the outer row `Stack` adds `px: 1` only — no vertical padding. `MuiCard` adds
// no padding of its own (lib/theme.ts only sets borderRadius).
//
// This is an estimate for the FIRST paint of each row; `measureElement` replaces
// it with the real height, so it only has to keep the initial scrollbar honest.
// How long the observed width must hold steady before the grid re-lays-out.
// Comfortably longer than a MUI drawer transition (~225ms) so the whole
// animation resolves to a single layout change rather than dozens.
const RESIZE_SETTLE_MS = 250

const SET_CARD_TEXT_HEIGHT = 68

type SetGridItem = {
  key: string
  set: OutfitSet
  evolution: Evolution | null
  obtained: number
  total: number
  variants: OutfitVariant[]
}

// The standard-density view is a flat uniform list — one `OutfitSetCard` per
// set+evolution group — so it mirrors `virtual-variant-grid.tsx` almost exactly.
// Read the comments there for why each piece exists; they apply verbatim here.
//
// The ONE real difference: set cards are aspect-ratio driven rather than
// fixed-height, so the row estimate is computed from the observed column width
// and the current image mode instead of being a constant.
//
// ─────────────────────────────────────────────────────────────────────────────
// KNOWN ISSUE — brief overlapping-card flash on layout change (accepted, 2026-07-30)
//
// Toggling the nav drawer (or otherwise animating the content column's width)
// can flash overlapping cards for a few frames, with the scrollbar briefly ~2x
// its settled height. It self-corrects within ~200ms. Measured, frame by frame:
//
//   f0: total  18470, 4 cols          f5: total 106619, 3 cols  <- overlapping
//   f4: total  75470, 4 cols          f7: total 116577, 3 cols  <- recovered
//
// Cause: `rowCount = ceil(items.length / columnCount)` scales INVERSELY with the
// column count, so a drawer animation that takes the grid from 6 columns to 3
// exactly doubles the row count and the total size mid-animation, while rows are
// still positioned for the old column count inside the new narrower box.
//
// Debouncing the published layout (see RESIZE_SETTLE_MS below) removes the
// worst of the churn but does NOT eliminate the flash: a second mechanism wipes
// the measurement cache, dropping the total to a few thousand px before it
// rebuilds. That path has not been isolated.
//
// Why this is tolerated rather than fixed: standard density renders only a few
// hundred cards, so virtualizing it was never load-bearing — the ~6.5k-card
// problem lives in the compact views, which are fixed-height and unaffected.
// If this becomes annoying, the cheap and safe fix is to REVERT this branch to
// a plain non-virtualized `CardGrid` (see the grouped/ungrouped branches in
// `filter-outfits.tsx` for the shape) rather than to keep chasing it.
// ─────────────────────────────────────────────────────────────────────────────
export default function VirtualSetGrid({
  items,
  isLoggedIn,
  isMissingFilter,
  isFiltering,
}: {
  items: SetGridItem[]
  isLoggedIn: boolean
  isMissingFilter: boolean
  isFiltering: boolean
}) {
  const { mode } = useOutfitImageMode()
  // Matches how `OutfitSetCard` computes it: the alt toggle switches the whole
  // grid to the square (1/1) layout, so the aspect ratio follows the mode alone.
  const showAlt = mode === 'alt'

  const containerRef = useRef<HTMLDivElement | null>(null)
  // Column count and raw width live in ONE state object on purpose. Row height
  // here is a function of column width, so a commit that had the count but not
  // yet the width would fall back to the text-only estimate (~84px) and position
  // rows that far apart while the cards actually occupy ~450px — a brief flash of
  // wildly overlapping cards. Kept together, the two can never disagree.
  const [layout, setLayout] = useState<{ columnCount: number; width: number } | null>(null)
  const columnCount = layout?.columnCount ?? null
  const containerWidth = layout?.width ?? 0

  // The nav drawer animates the content column's width over many frames. Every
  // intermediate width re-derives the column count and therefore `rowCount`, and
  // because `rowCount` scales inversely with columns, the scroll height swings
  // violently mid-animation (measured: 18k -> 75k -> 106k -> 116k across four
  // frames, with rows overlapping while it settled). Debouncing the PUBLISHED
  // layout means the grid keeps rendering the last stable geometry until the
  // animation finishes, so there is no intermediate state to flash.
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  // Column count is derived from the observed content width, so it stays null
  // until the first observation — during SSR and the first client render there is
  // no element to measure and `window`/`ResizeObserver` do not exist on the
  // server. Rendering nothing until then is correct: an unmeasured guess would
  // lay out the wrong number of columns and then reflow.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const publish = (width: number) => {
      const next = { columnCount: outfitColumnsForWidth(width), width }
      setLayout((prev) =>
        prev && prev.columnCount === next.columnCount && prev.width === next.width ? prev : next
      )
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        // A zero width carries no usable layout — publishing it would swap a
        // correct estimate for the text-only fallback and squash every row.
        if (width === 0) continue
        // Wait for the width to stop moving before republishing. A drawer
        // animation delivers dozens of intermediate widths; acting on each one is
        // what produced the overlapping-card flash and the doubled scrollbar.
        if (settleRef.current) clearTimeout(settleRef.current)
        settleRef.current = setTimeout(() => publish(width), RESIZE_SETTLE_MS)
      }
    })
    // Seed synchronously from the element's current width. The observer's first
    // callback is async, so without this the grid would paint one frame using
    // whatever `layout` already held.
    const initial = el.getBoundingClientRect().width
    if (initial > 0) publish(initial)

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (settleRef.current) clearTimeout(settleRef.current)
    }
  }, [])

  // Row offsets are measured from the document top, so the virtualizer needs to
  // know how much page sits above the grid (toolbar, alerts, results bar).
  //
  // That offset moves for TWO independent reasons, and both have to be watched:
  //
  //  1. A sibling above the grid RESIZES (the toolbar wrapping to a second row,
  //     an alert reflowing to two lines) — caught by the ResizeObserver.
  //  2. A sibling above the grid MOUNTS OR UNMOUNTS. FilterOutfits renders a
  //     fragment, so the conditional `LoginAlert`, the `isObtainedError` warning
  //     and the "No results" block are all real siblings of this grid. When the
  //     obtained fetch fails mid-scroll, that warning appears and shifts the grid
  //     down without any *observed* element resizing — a ResizeObserver over the
  //     sibling list captured at mount would never fire, leaving scrollMargin
  //     stale and every row painted ~56px above its true position. A
  //     MutationObserver on the parent's childList catches exactly this.
  //
  // Why a MutationObserver rather than a ResizeObserver on the parent: the parent
  // is this grid's own ancestor, so its height also tracks the virtualizer's
  // total size — observing it would re-fire on every scroll-driven remeasure.
  // childList mutations fire only on the mount/unmount that is actually missed,
  // with no overlap with the resize path.
  //
  // DO NOT change this back to `useLayoutEffect`, and do not call `read()` from
  // any other layout-phase code. `setScrollMargin` must never run synchronously
  // inside React's commit phase. Writing it there re-renders the grid while React
  // is still committing, which mounts row elements whose `virtualizer.measureElement`
  // ref callbacks ALSO run in that same commit phase. A measured row whose real
  // height differs from its estimate makes virtual-core call
  // `applyScrollAdjustment` -> `notify(sync = true)` -> `flushSync(rerender)`, and
  // React throws "flushSync was called from inside a lifecycle method. React
  // cannot flush when React is already rendering."
  //
  // `useEffect` runs after paint, outside the commit phase, so the same
  // `flushSync` lands on an idle React and is legal. Nothing is lost by waiting:
  // rows do not render at all until `columnCount` is measured, and that too is
  // set from a `useEffect`-driven ResizeObserver above — so the first paint that
  // contains any row already happens after an effect has run. A layout-phase read
  // could only beat a paint that renders nothing.
  useEffect(() => {
    const el = containerRef.current
    const parent = el?.parentElement
    if (!el || !parent) return

    // Bail when the offset is unchanged: both observers re-read on every
    // callback, and an unguarded setter would re-render the whole grid on
    // sibling resizes that did not actually move it.
    const read = () => setScrollMargin((prev) => (prev === el.offsetTop ? prev : el.offsetTop))
    read()

    // Resize path: watch the siblings above the grid. Deliberately NOT the parent
    // or the body, whose heights both track the virtualizer's own total size.
    const resizeObserver = new ResizeObserver(read)
    const observeSiblings = () => {
      resizeObserver.disconnect()
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== el) resizeObserver.observe(sibling)
      }
    }
    observeSiblings()

    // Mount/unmount path. Re-reads the offset and re-subscribes, so a sibling
    // that appears later is also watched for subsequent resizes.
    const mutationObserver = new MutationObserver(() => {
      observeSiblings()
      read()
    })
    mutationObserver.observe(parent, { childList: true })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  const effectiveColumnCount = columnCount
  const liveWidth = containerWidth

  const rowCount =
    effectiveColumnCount === null ? 0 : Math.ceil(items.length / effectiveColumnCount)

  // Set cards are aspect-ratio driven (2/3, or 1/1 in alt mode), so row height
  // scales with column width — a fixed constant would make the scrollbar badly
  // wrong at narrow and wide windows alike. Estimate from the measured width;
  // `measureElement` still corrects each row on its first paint.
  // `layout` is null or fully populated — never half-set — so there is no
  // width-less branch that could yield a text-only height. When it is null the
  // grid renders nothing anyway, so the value is unused.
  const computedRowHeight =
    layout === null
      ? SET_CARD_TEXT_HEIGHT + GAP_PX
      : (() => {
          const width = liveWidth || layout.width
          const cols = effectiveColumnCount ?? layout.columnCount
          const columnWidth = (width - GAP_PX * (cols - 1)) / cols
          const imageHeight = columnWidth * (showAlt ? 1 : 3 / 2)
          return imageHeight + SET_CARD_TEXT_HEIGHT + GAP_PX
        })()

  // The computed estimate is derived from the component tree, so it is close but
  // not exact — MUI padding and the title/rarity block round differently than the
  // arithmetic predicts.
  //
  // That gap is what makes a density or image-mode toggle feel jumpy. Both change
  // every row's height at once, so `getItemKey` (correctly) invalidates every
  // cached measurement and all rows fall back to the estimate together. The
  // virtualizer then shifts the scroll position to compensate for each row that
  // measures differently, and those adjustments stack into a visible lurch.
  //
  // Remembering the first real measurement per width/mode makes every subsequent
  // row's estimate exact, so the bulk re-measure produces no deltas to correct
  // for. Keyed by width too, since a resize changes the true height as well.
  // (The core's `shouldAdjustScrollPositionOnItemSizeChange` would suppress the
  // adjustment directly, but it is a class property rather than a passable
  // option, so it cannot be set through `useWindowVirtualizer`.)
  // State rather than a ref: the estimate is read during render, and a newly
  // recorded height has to re-render for the virtualizer to pick it up.
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({})
  const measureKey = `${effectiveColumnCount}-${showAlt}-${Math.round(liveWidth || containerWidth)}`
  const estimatedRowHeight = measuredHeights[measureKey] ?? computedRowHeight

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimatedRowHeight,
    overscan: 3,
    scrollMargin,
    // The key must identify a row's CONTENT, not its position. `itemSizeCache` is
    // keyed by this value and is never cleared on a count or content change, so a
    // key that is only positional lets row 0 reuse the previous row 0's height
    // after a filter swaps which sets are at index 0 — cards then paint at a
    // stale, much smaller height and overlap.
    //
    // Three things therefore participate:
    //  - the first item's key, which changes whenever filtering, sorting or
    //    grouping changes what lands in this row
    //  - `columnCount`, since row N holds different items at 4 columns than at 8
    //  - `showAlt`, since flipping the image mode swaps the card aspect ratio
    //    between 2/3 and 1/1 and makes every cached height wrong by ~a third
    getItemKey: (index) => {
      const first = items[index * (effectiveColumnCount ?? 1)]
      return `${effectiveColumnCount}-${showAlt}-${first?.key ?? index}`
    },
    // `measureElement`'s ResizeObserver callback runs synchronously, and a row
    // whose measured height differs from the estimate calls `resizeItem` ->
    // `notify(sync = true)` -> `flushSync(rerender)`. When rows mount during a
    // React commit — which is exactly what happens as `density` hydrates from
    // saved preferences and this grid replaces a compact one — that lands
    // mid-lifecycle and React throws "flushSync was called from inside a
    // lifecycle method". This option defers each measurement into a
    // requestAnimationFrame, which is the "scheduler task" the error asks for.
    useAnimationFrameWithResizeObserver: true,
  })

  const rows = virtualizer.getVirtualItems()

  return (
    <Box
      ref={containerRef}
      sx={{
        ...GRID_CONTAINER,
        opacity: isFiltering ? 0.5 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      <Box sx={{ position: 'relative', height: virtualizer.getTotalSize() }}>
        {effectiveColumnCount !== null &&
          rows.map((row) => {
            const start = row.index * effectiveColumnCount
            // The last row is usually partial; slice clamps it so no phantom
            // cells are padded in.
            const rowItems = items.slice(start, start + effectiveColumnCount)
            return (
              <Box
                key={row.key}
                ref={(node: HTMLDivElement | null) => {
                  // Hand the node to the virtualizer FIRST and without anything
                  // else in this callback touching React state. A ref callback
                  // runs during the commit phase, so a `setState` here puts React
                  // into rendering; `measureElement` can then reach
                  // `flushSync(rerender)` mid-lifecycle and React throws
                  // "flushSync was called from inside a lifecycle method".
                  // (`useAnimationFrameWithResizeObserver` only defers the
                  // ResizeObserver path, not this direct call.)
                  virtualizer.measureElement(node)

                  // Record the first real height for this width/mode so later
                  // rows estimate from a measured value instead of arithmetic.
                  // Only full rows count: a partial last row is shorter and would
                  // skew the estimate for every row above it. Deferred to a
                  // microtask so the state write lands after the commit, never
                  // inside it.
                  if (
                    node &&
                    rowItems.length === effectiveColumnCount &&
                    !measuredHeights[measureKey]
                  ) {
                    const height = node.getBoundingClientRect().height
                    if (height > 0) {
                      queueMicrotask(() => {
                        setMeasuredHeights((prev) =>
                          prev[measureKey] ? prev : { ...prev, [measureKey]: height }
                        )
                      })
                    }
                  }
                }}
                data-index={row.index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${effectiveColumnCount}, minmax(0, 1fr))`,
                  gap: `${GAP_PX}px`,
                  pb: `${GAP_PX}px`,
                }}
              >
                {rowItems.map((item) => (
                  <OutfitSetCard
                    key={item.key}
                    evolution={item.evolution}
                    isLoggedIn={isLoggedIn}
                    isMissingFilter={isMissingFilter}
                    obtained={item.obtained}
                    set={item.set}
                    total={item.total}
                    variants={item.variants}
                  />
                ))}
              </Box>
            )
          })}
      </Box>
    </Box>
  )
}

export type { SetGridItem }

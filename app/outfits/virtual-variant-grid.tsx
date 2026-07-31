'use client'

import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { GRID_CONTAINER, outfitColumnsForWidth } from '@/lib/types/props'
import type { OutfitVariant } from '@/lib/types/outfit'
import OutfitVariantCard from './outfit-variant-card'

// Row height estimate used before a row has been measured. The compact variant
// card is fixed-height, not aspect-ratio driven: CardShell > Stack(pt: 1 = 8px) +
// a `size="lg"` Avatar (94px, lib/theme.ts) + a CardHeader whose 16px vertical
// padding wraps a subtitle2 title over a caption subheader (~41px) — about 175px,
// plus the grid's 16px (gap={2}) row gap. `measureElement` replaces this with the
// real height on the first paint of every row, so it only has to be close enough
// to keep the initial scrollbar honest.
// Exported so `virtual-grouped-grid.tsx` estimates card rows with the exact same
// number — the two grids render identical card rows and must not drift.
export const ESTIMATED_ROW_HEIGHT = 191

// Matches the `gap={2}` the non-virtualized outfit grids pass to CardGrid.
export const GAP_PX = 16

// The flat compact grid can hold ~6500 variants. Mounting them all costs seconds
// of main-thread time that no amount of memoization removes — the work is real,
// just far more than one frame can hold. This renders only the rows in view.
//
// The column count has to exist in JS here (rows are `columnCount` items wide),
// but the non-virtualized grids resolve it from CSS `@container` queries, which
// JS cannot read back. So a ResizeObserver watches the same inline-size container
// the container query would key on and feeds its width to
// `outfitColumnsForWidth` — the shared lookup derived from the very same
// breakpoint list as `OUTFIT_GRID_COLUMNS_CONTAINER`. That keeps the two in step
// and preserves the drawer-open reflow, since the drawer changes exactly the
// width being observed.
export default function VirtualVariantGrid({
  variants,
  isLoggedIn,
  isMissingFilter,
  isFiltering,
}: {
  variants: OutfitVariant[]
  isLoggedIn: boolean
  isMissingFilter: boolean
  isFiltering: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [columnCount, setColumnCount] = useState<number | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  // Column count is derived from the observed content width, so it stays null
  // until the first observation — during SSR and the first client render there is
  // no element to measure and `window`/`ResizeObserver` do not exist on the
  // server. Rendering nothing until then is correct: an unmeasured guess would
  // lay out the wrong number of columns and then reflow.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setColumnCount(outfitColumnsForWidth(entry.contentRect.width))
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
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
  // height differs from ESTIMATED_ROW_HEIGHT makes virtual-core call
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

  const rowCount = columnCount === null ? 0 : Math.ceil(variants.length / columnCount)

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 3,
    scrollMargin,
    // The key identifies a row's CONTENT, not its position. `itemSizeCache` is
    // keyed by this value and is never cleared when the item list changes, so a
    // purely positional key lets row 0 reuse the previous row 0's height after a
    // filter swaps which variants land there. These cards are fixed-height so the
    // usual case is harmless, but a partial last row is shorter than a full one
    // and that height would otherwise leak onto a full row.
    //
    // `columnCount` also participates: row N holds different items at 4 columns
    // than at 8, so its cached height is meaningless after a reflow.
    getItemKey: (index) => {
      const first = variants[index * (columnCount ?? 1)]
      return `${columnCount}-${first?.id ?? index}`
    },
    // `measureElement`'s ResizeObserver callback runs synchronously, and a row
    // whose measured height differs from the estimate calls `resizeItem` ->
    // `notify(sync = true)` -> `flushSync(rerender)`. When rows mount during a
    // React commit — which is exactly what happens as `density` hydrates from
    // saved preferences and this grid replaces the standard-density one — that
    // lands mid-lifecycle and React throws "flushSync was called from inside a
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
        {columnCount !== null &&
          rows.map((row) => {
            const start = row.index * columnCount
            // The last row is usually partial; slice clamps it so no phantom
            // cells are padded in.
            const rowVariants = variants.slice(start, start + columnCount)
            return (
              <Box
                key={row.key}
                ref={virtualizer.measureElement}
                data-index={row.index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  gap: `${GAP_PX}px`,
                  pb: `${GAP_PX}px`,
                }}
              >
                {rowVariants.map((variant) => (
                  <OutfitVariantCard
                    key={variant.id}
                    isLoggedIn={isLoggedIn}
                    isMissingFilter={isMissingFilter}
                    outfitVariant={variant}
                  />
                ))}
              </Box>
            )
          })}
      </Box>
    </Box>
  )
}

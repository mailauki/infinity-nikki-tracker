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
  const [columnCount, setColumnCount] = useState<number | null>(null)
  // Unlike the compact grids, this one needs the raw width too: row height is a
  // function of the column width, so the estimate cannot be a constant.
  const [containerWidth, setContainerWidth] = useState(0)
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
        const width = entry.contentRect.width
        setColumnCount(outfitColumnsForWidth(width))
        setContainerWidth((prev) => (prev === width ? prev : width))
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

  const rowCount = columnCount === null ? 0 : Math.ceil(items.length / columnCount)

  // Set cards are aspect-ratio driven (2/3, or 1/1 in alt mode), so row height
  // scales with column width — a fixed constant would make the scrollbar badly
  // wrong at narrow and wide windows alike. Estimate from the measured width;
  // `measureElement` still corrects each row on its first paint.
  const estimatedRowHeight =
    columnCount === null || containerWidth === 0
      ? SET_CARD_TEXT_HEIGHT + GAP_PX
      : (() => {
          const columnWidth = (containerWidth - GAP_PX * (columnCount - 1)) / columnCount
          const imageHeight = columnWidth * (showAlt ? 1 : 3 / 2)
          return imageHeight + SET_CARD_TEXT_HEIGHT + GAP_PX
        })()

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimatedRowHeight,
    overscan: 3,
    scrollMargin,
    // Row N holds different items at 4 columns than at 8, so its cached height is
    // meaningless after a reflow. Folding columnCount into the key makes the
    // virtualizer discard the old measurements instead of reusing them.
    //
    // `showAlt` is folded in for the same reason, one step further: even at an
    // unchanged column count, flipping the image mode swaps the card aspect ratio
    // between 2/3 and 1/1, so every cached row height is wrong by ~a third.
    getItemKey: (index) => `${columnCount}-${showAlt}-${index}`,
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
        {columnCount !== null &&
          rows.map((row) => {
            const start = row.index * columnCount
            // The last row is usually partial; slice clamps it so no phantom
            // cells are padded in.
            const rowItems = items.slice(start, start + columnCount)
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

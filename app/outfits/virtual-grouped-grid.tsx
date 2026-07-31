'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { GRID_CONTAINER, outfitColumnsForWidth } from '@/lib/types/props'
import type { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import { useOutfitData } from '@/components/outfits/outfit-context'
import OutfitGroupHeader from './outfit-group-header'
import OutfitVariantCard from './outfit-variant-card'
import { ESTIMATED_ROW_HEIGHT, GAP_PX } from './virtual-variant-grid'

// A group header is a `size="small"` Button (~30px) plus a 4px bottom margin
// (mb: 0.5), a 1px Divider and the wrapper's 8px top margin (mt: 1) — roughly
// 43px, rounded to 48 to stay slightly conservative. `measureElement` replaces
// this with the real height on first paint, so it only has to keep the initial
// scrollbar honest. Card rows reuse ESTIMATED_ROW_HEIGHT from
// `virtual-variant-grid.tsx` — the two grids render the same card row.
const ESTIMATED_HEADER_HEIGHT = 48

type GroupRow =
  | {
      kind: 'header'
      key: string
      title: string
      href: string
      obtained: number
      total: number
      allObtained: boolean
      // The FULL, unfiltered group. Drives the batch-toggle payload so the
      // toggle acts on hidden variants too.
      groupVariants: OutfitVariant[]
    }
  // The DISPLAYED (already filter-culled) variants for this row.
  | { kind: 'cards'; key: string; variants: OutfitVariant[] }

// The grouped compact view interleaves full-width group headers with
// variable-length runs of cards, and one set contributes several groups (base
// plus each evolution). A virtualizer needs a single indexed list, so this
// flattens the whole thing into one row array (header rows + card rows) and
// virtualizes that, replacing the old 20-section "Load more" cap.
//
// Structure deliberately mirrors `virtual-variant-grid.tsx` — same
// ResizeObserver column derivation, same scrollMargin block (including its
// MutationObserver), same overscan and measureElement wiring. Read the comments
// there for why each piece exists; they apply verbatim here.
export default function VirtualGroupedGrid({
  sets,
  isLoggedIn,
  isFiltering,
}: {
  sets: OutfitSet[]
  isLoggedIn: boolean
  isFiltering: boolean
}) {
  const { outfitSets, onBatchToggleObtained } = useOutfitData()
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
  // height differs from its estimate makes virtual-core call
  // `applyScrollAdjustment` -> `notify(sync = true)` -> `flushSync(rerender)`, and
  // React throws "flushSync was called from inside a lifecycle method. React
  // cannot flush when React is already rendering." This grid is the DEFAULT
  // compact view, so it is where the error actually surfaced.
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

  // Flatten the grouping logic of the former `outfit-set-section.tsx` into one
  // indexed row list. Keyed on `columnCount` too, since the number of card rows
  // per group changes with the column count.
  const rowModel = useMemo<GroupRow[]>(() => {
    if (columnCount === null) return []
    const rows: GroupRow[] = []

    for (const set of sets) {
      // `set.outfit_variants` is already filter-culled (e.g. the missing filter
      // or the category filter drops variants), so progress and the batch toggle
      // must read the FULL, unfiltered set from context instead. Two lists are in
      // play per group: `variants` (displayed) and `groupVariants` (the truth).
      const fullSet = outfitSets.find((s) => s.id === set.id) ?? set
      const baseSlug = set.slug

      for (const evolution of [null, ...set.evolutions]) {
        const stateSlug = evolution?.slug ?? baseSlug
        const inState = (v: { outfit_set: string | null }) => v.outfit_set === stateSlug

        // DISPLAYED variants. An empty group emits no header at all — an
        // orphaned header with no cards under it is a visible bug.
        const variants = set.outfit_variants.filter(inState)
        if (variants.length === 0) continue

        const href = evolution
          ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
          : `/outfits/${set.slug}`
        const title = evolution ? `${set.title}: ${toTitle(evolution.title)}` : set.title

        // FULL group — the source of truth for progress and the toggle payload.
        const groupVariants = fullSet.outfit_variants.filter(inState)
        const obtained = groupVariants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
        const allObtained = groupVariants.length > 0 && obtained === groupVariants.length

        rows.push({
          kind: 'header',
          key: `h-${set.id}-${stateSlug}`,
          title,
          href,
          obtained,
          total: groupVariants.length,
          allObtained,
          groupVariants,
        })

        const cardRowCount = Math.ceil(variants.length / columnCount)
        for (let i = 0; i < cardRowCount; i++) {
          rows.push({
            kind: 'cards',
            key: `c-${set.id}-${stateSlug}-${i}`,
            variants: variants.slice(i * columnCount, (i + 1) * columnCount),
          })
        }
      }
    }

    return rows
  }, [sets, outfitSets, columnCount])

  const virtualizer = useWindowVirtualizer({
    count: rowModel.length,
    // Header rows and card rows have wildly different heights; one number for
    // both makes the initial scrollbar badly wrong on a header-dense list.
    estimateSize: (index) =>
      rowModel[index]?.kind === 'header' ? ESTIMATED_HEADER_HEIGHT : ESTIMATED_ROW_HEIGHT,
    overscan: 3,
    scrollMargin,
    // Row N holds different items at 4 columns than at 8, so its cached height is
    // meaningless after a reflow. Folding columnCount into the key makes the
    // virtualizer discard the old measurements instead of reusing them.
    getItemKey: (index) => `${columnCount}-${rowModel[index]?.key ?? index}`,
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

  // Batch-toggle the whole evolution group: when fully obtained, clear it;
  // otherwise mark the remaining (not-yet-obtained) variants obtained. Carried
  // over verbatim from the former OutfitSetSection — it acts on `groupVariants`,
  // the full group, so filtered-out variants are toggled too.
  const handleToggle = (row: Extract<GroupRow, { kind: 'header' }>) => {
    const toToggle = row.groupVariants
      .filter((v) => !!v.obtained === row.allObtained)
      .map((v) => ({
        outfit_set: v.outfit_set!,
        outfit_category: v.outfit_category!,
        outfit_variant: v.slug,
      }))
    onBatchToggleObtained(toToggle, !row.allObtained)
  }

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
            const item = rowModel[row.index]
            if (!item) return null
            return (
              <Box
                key={row.key}
                ref={virtualizer.measureElement}
                data-index={row.index}
                sx={
                  item.kind === 'header'
                    ? {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                        pb: `${GAP_PX}px`,
                      }
                    : {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                        gap: `${GAP_PX}px`,
                        pb: `${GAP_PX}px`,
                      }
                }
              >
                {item.kind === 'header' ? (
                  <OutfitGroupHeader
                    allObtained={item.allObtained}
                    href={item.href}
                    isLoggedIn={isLoggedIn}
                    obtained={item.obtained}
                    title={item.title}
                    total={item.total}
                    onToggle={() => handleToggle(item)}
                  />
                ) : (
                  item.variants.map((variant) => (
                    // Within the grouped-by-set view, a toggled variant stays put
                    // under its set header even under the missing filter — only
                    // the flat (ungrouped) missing view culls obtained variants on
                    // toggle. So no `isMissingFilter` is passed here.
                    <OutfitVariantCard
                      key={variant.id}
                      isLoggedIn={isLoggedIn}
                      outfitVariant={variant}
                    />
                  ))
                )}
              </Box>
            )
          })}
      </Box>
    </Box>
  )
}

'use client'

import { useMemo, useRef } from 'react'
import { Box } from '@mui/material'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import type { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import OutfitGroupHeader from './outfit-group-header'
import OutfitVariantCard from './outfit-variant-card'
import {
  ESTIMATED_ROW_HEIGHT,
  VIRTUALIZER_DEFAULTS,
  deferredMeasureRef,
  gridContainerSx,
  useColumnCount,
  useScrollMargin,
  virtualRowSx,
} from '@/components/virtual-grid'

// A group header is a `size="small"` Button (~30px) plus a 4px bottom margin
// (mb: 0.5), a 1px Divider and the wrapper's 8px top margin (mt: 1) — roughly
// 43px, rounded to 48 to stay slightly conservative. `measureElement` replaces
// this with the real height on first paint, so it only has to keep the initial
// scrollbar honest. Card rows reuse ESTIMATED_ROW_HEIGHT — the flat compact
// grid renders the same card row.
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
// Column derivation, scrollMargin and measurement wiring come from
// `components/virtual-grid.tsx` — read the comments there for why each exists.
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
  const columnCount = useColumnCount(containerRef)
  const scrollMargin = useScrollMargin(containerRef)

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
        // Evolution titles are stored pre-composed as "{base set title}: {subtitle}".
        const title = evolution ? evolution.title : set.title

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
    ...VIRTUALIZER_DEFAULTS,
    scrollMargin,
    // Row N holds different items at 4 columns than at 8, so its cached height is
    // meaningless after a reflow. Folding columnCount into the key makes the
    // virtualizer discard the old measurements instead of reusing them.
    getItemKey: (index) => `${columnCount}-${rowModel[index]?.key ?? index}`,
  })

  const rows = virtualizer.getVirtualItems()
  // Deferred past the commit phase — see deferredMeasureRef.
  const measureRef = useMemo(() => deferredMeasureRef(virtualizer), [virtualizer])

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
    <Box ref={containerRef} sx={gridContainerSx(isFiltering)}>
      <Box sx={{ position: 'relative', height: virtualizer.getTotalSize() }}>
        {columnCount !== null &&
          rows.map((row) => {
            const item = rowModel[row.index]
            if (!item) return null
            return (
              <Box
                key={row.key}
                ref={measureRef}
                data-index={row.index}
                sx={virtualRowSx(
                  row.start - virtualizer.options.scrollMargin,
                  item.kind === 'header' ? undefined : columnCount
                )}
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

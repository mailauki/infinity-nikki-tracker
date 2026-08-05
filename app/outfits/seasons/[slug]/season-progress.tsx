'use client'

import ProgressChip from '@/components/progress-chip'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useSeasonFilter } from './season-filter-context'
import { countEntries, groupSeasonEntries } from './season-entries'

// Season completion aggregates the variants of every row currently shown in the
// list — i.e. it reflects the evolution / glow-up toggles. With both toggles off
// (default) this counts base + evolutions + glow-ups; hiding either drops those
// variants from the total, matching exactly what the list displays. Standalone
// pieces and makeup count alongside outfit sets, as they do in the list.
export default function SeasonProgress({
  seasonSets,
  standaloneVariants,
  makeupSets,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
}) {
  const { hideEvolutions, hideGlowups } = useSeasonFilter()

  const entries = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    hideEvolutions,
    hideGlowups,
  }).flatMap(([, groupEntries]) => groupEntries)

  const { obtained, total } = countEntries(entries)

  return <ProgressChip obtained={obtained} total={total} />
}

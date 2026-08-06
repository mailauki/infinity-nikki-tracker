'use client'

import ProgressChip from '@/components/progress-chip'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSeasonFilter } from './season-filter-context'
import { countEntries, groupSeasonEntries } from './season-entries'

// Season completion aggregates the variants of every card currently shown — i.e.
// it reflects the evolution / glow-up / pieces toggles. With all toggles off
// (default) this counts base + evolutions + glow-ups + pieces + makeup; hiding
// any drops those variants from the total, matching what the sections display.
export default function SeasonProgress({
  seasonSets,
  standaloneVariants,
  makeupSets,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
}) {
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets } = useSeasonFilter()
  const { obtainedOutfit } = useOutfitData()

  const entries = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    hideEvolutions,
    hideGlowups,
    hidePieces,
    hideMakeup,
    hideBaseSets,
    obtainedOutfit,
  }).flatMap(([, groupEntries]) => groupEntries)

  const { obtained, total } = countEntries(entries)

  return <ProgressChip obtained={obtained} size="lg" total={total} />
}

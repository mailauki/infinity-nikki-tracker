'use client'

import ProgressChip from '@/components/progress-chip'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useSeasonFilter } from './season-filter-context'
import { countEntryCards, groupSeasonEntries } from './season-entries'

// Season completion counts every card currently shown — i.e. it reflects the
// evolution / glow-up / pieces toggles. Cards rather than variants, so this
// agrees with the outfits/pieces chips on each category: an outfit set is one
// card however many variants it holds, and is complete once all of them are.
export default function SeasonProgress({
  seasonSets,
  standaloneVariants,
  makeupSets,
  seasonSlug,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  seasonSlug: string
}) {
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets } = useSeasonFilter()
  const { obtainedOutfit } = useOutfitData()
  const { obtainedMakeup } = useMakeupData()

  const entries = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    seasonSlug,
    hideEvolutions,
    hideGlowups,
    hidePieces,
    hideMakeup,
    hideBaseSets,
    obtainedOutfit,
    obtainedMakeup,
  }).flatMap(([, groupEntries]) => groupEntries)

  const { obtained, total } = countEntryCards(entries)

  return <ProgressChip obtained={obtained} size="lg" total={total} />
}

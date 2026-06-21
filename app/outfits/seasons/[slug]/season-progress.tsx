'use client'

import ProgressChip from '@/components/progress-chip'
import { OutfitSet } from '@/lib/types/outfit'
import { useSeasonFilter } from './season-filter-context'
import { expandSet } from './season-outfit-list'

// Season completion aggregates the variants of every row currently shown in the
// list — i.e. it reflects the evolution / glow-up toggles. With both toggles off
// (default) this counts base + evolutions + glow-ups; hiding either drops those
// variants from the total, matching exactly what the list displays.
export default function SeasonProgress({ seasonSets }: { seasonSets: OutfitSet[] }) {
  const { hideEvolutions, hideGlowups } = useSeasonFilter()

  const visibleVariants = seasonSets
    .flatMap((set) => expandSet(set, hideEvolutions, hideGlowups))
    .flatMap((entry) => entry.variants)

  const total = visibleVariants.length
  const obtained = visibleVariants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0)

  return <ProgressChip obtained={obtained} total={total} />
}

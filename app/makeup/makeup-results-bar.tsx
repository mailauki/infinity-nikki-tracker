'use client'

import { Chip } from '@mui/material'
import StickyBar from '@/components/navbar/sticky-bar'
import { matchesObtainedFilter } from '@/hooks/outfit'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useMakeupImageMode } from '@/components/makeup/makeup-image-mode-context'

export default function MakeupResultsBar() {
  const { makeupSets, groupBySet, filters } = useMakeupData()
  const { density } = useMakeupImageMode()

  const {
    selectedMakeupSet,
    selectedMakeupCategory,
    selectedObtainedFilter,
    selectedRarity,
    selectedStyle,
    selectedSeason,
    selectedSeasonCategory,
  } = filters

  // Mirror filter-makeup: grouped mode applies the obtained filter per evolution
  // group (missing / obtained); ungrouped applies it per variant.
  const groupLevelObtained = groupBySet

  const filtered = makeupSets
    .filter((set) => !selectedMakeupSet || set.slug === selectedMakeupSet)
    .filter((set) => {
      if (!selectedRarity) return true
      // The standalone bucket has no rarity of its own — keep it if any of its
      // pieces match the rarity. Every other set has a single set-level rarity.
      if (isStandaloneMakeupSet(set)) {
        return set.makeup_variants.some((v) => v.rarity === selectedRarity)
      }
      return set.rarity === selectedRarity
    })
    .filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
    .filter((set) => !selectedSeason.length || selectedSeason.includes(set.seasons ?? ''))
    .filter(
      (set) =>
        !selectedSeasonCategory.length || selectedSeasonCategory.includes(set.season_category ?? '')
    )
    .map((set) => {
      // Group-level obtained state is judged over the FULL group (makeup has no
      // structural evolution/glow-up scoping), so the category filter narrows
      // display without affecting completion — mirrors filter-makeup.
      const scoped = set.makeup_variants
      const inMatchingGroup =
        groupLevelObtained && selectedObtainedFilter
          ? scoped.filter((v) => {
              const group = scoped.filter((g) => g.makeup_set === v.makeup_set)
              return matchesObtainedFilter(group, selectedObtainedFilter)
            })
          : scoped
      const culled = inMatchingGroup
        .filter(
          (v) =>
            selectedMakeupCategory.length === 0 ||
            (v.makeup_category !== null && selectedMakeupCategory.includes(v.makeup_category))
        )
        .filter((v) => {
          if (groupLevelObtained) return true
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        })
        // The standalone bucket is a mixed bag: when a rarity is selected, show
        // only the matching pieces. Other sets are single-rarity, so this is a
        // no-op for them.
        .filter(
          (v) => !selectedRarity || !isStandaloneMakeupSet(set) || v.rarity === selectedRarity
        )
      return { makeup_variants: culled }
    })
    .filter((set) => set.makeup_variants.length > 0)

  // Count what is actually rendered:
  // - Group-by-set (compact) renders one section per set, so count sets.
  // - Standard density renders one card per (set, evolution) group that has
  //   variants. Variants hidden by the obtained filter are already pruned from
  //   `filtered`, so each distinct surviving evolution is exactly one rendered
  //   card.
  // - Otherwise compact density renders one card per variant, so count variants.
  function countResults() {
    if (groupLevelObtained && density === 'compact') return filtered.length
    if (density === 'standard') {
      return filtered.reduce((sum, set) => {
        const groupKeys = new Set(set.makeup_variants.map((v) => v.makeup_set))
        return sum + groupKeys.size
      }, 0)
    }
    return filtered.reduce((sum, set) => sum + set.makeup_variants.length, 0)
  }

  const resultsCount = countResults()

  return (
    <StickyBar>
      <Chip
        color="secondary"
        label={`Showing: ${resultsCount} results`}
        sx={{ backgroundColor: 'surface.mainHover', backdropFilter: 'blur(8px)' }}
        variant="outlined"
      />
    </StickyBar>
  )
}

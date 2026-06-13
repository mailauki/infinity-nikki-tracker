'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import FilterMenu from '@/components/navbar/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import { useOutfitData } from './outfit-context'
import { useOutfitImageMode } from './outfit-image-mode-context'

export default function OutfitToolBar() {
  const { outfitSets, groupBySet, hideEvolutions, filters } = useOutfitData()
  const { density } = useOutfitImageMode()

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  // The grouped section view (group-by-set in compact density) applies the
  // obtained/missing filter at the set level, keeping every variant. Mirror that
  // here so the results count matches what is rendered.
  const setLevelObtained = groupBySet && density === 'compact'

  const filtered = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => ({
      outfit_variants: set.outfit_variants
        .filter((v) => !hideEvolutions || v.evolution === null)
        .filter(
          (v) =>
            selectedOutfitCategory.length === 0 ||
            (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
        )
        .filter((v) => !selectedEvolution || v.evolution === selectedEvolution)
        .filter((v) => {
          if (setLevelObtained) return true
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        }),
    }))
    .filter((set) => set.outfit_variants.length > 0)
    .filter((set) => {
      if (!setLevelObtained || !selectedObtainedFilter) return true
      const allObtained = set.outfit_variants.every((v) => v.obtained === true)
      return selectedObtainedFilter === 'obtained' ? allObtained : !allObtained
    })

  // Count what is actually rendered:
  // - Group-by-set (compact) renders one section per set, so count sets.
  // - Standard density renders one card per (set, evolution) group that has
  //   variants — base set plus each evolution. Hidden evolution cards
  //   (hideEvolutions) are unmounted, so exclude them.
  // - Otherwise compact density renders one card per variant, so count variants.
  function countResults() {
    if (setLevelObtained) return filtered.length
    if (density === 'standard') {
      return filtered.reduce((sum, set) => {
        const groupKeys = hideEvolutions
          ? [null]
          : [...new Set(set.outfit_variants.map((v) => v.evolution))]
        return (
          sum +
          groupKeys.filter((key) => set.outfit_variants.some((v) => v.evolution === key)).length
        )
      }, 0)
    }
    return filtered.reduce((sum, set) => sum + set.outfit_variants.length, 0)
  }

  const resultsCount = countResults()

  return (
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {resultsCount} results
        </Typography>
        <Stack direction="row" spacing={1}>
          <SortButton />
          <FilterMenu />
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}

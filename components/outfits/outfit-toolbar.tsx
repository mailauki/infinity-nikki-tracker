'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import FilterMenu from '@/components/navbar/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import { useOutfitData } from './outfit-context'

export default function OutfitToolBar() {
  const { outfitSets, showByEvolution, filters } = useOutfitData()

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  const filtered = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => ({
      evolutions: set.evolutions,
      outfit_variants: set.outfit_variants
        .filter((v) => !selectedOutfitCategory || v.outfit_category === selectedOutfitCategory)
        .filter((v) => !selectedEvolution || v.evolution === selectedEvolution)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        }),
    }))

  const resultsCount = showByEvolution
    ? filtered.reduce((sum, set) => sum + set.evolutions.length + 1, 0) // +1 for base
    : filtered.reduce((sum, set) => sum + set.outfit_variants.length, 0)

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

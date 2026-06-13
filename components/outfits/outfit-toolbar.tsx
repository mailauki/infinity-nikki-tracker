'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import FilterMenu from '@/components/navbar/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import { useOutfitData } from './outfit-context'
import { useOutfitImageMode } from './outfit-image-mode-context'
import DensityMenu from '../navbar/density-menu'

export default function OutfitToolBar() {
  const { outfitSets, hideEvolutions, filters } = useOutfitData()
  const { density } = useOutfitImageMode()

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
      outfit_variants: set.outfit_variants
        .filter(
          (v) =>
            selectedOutfitCategory.length === 0 ||
            (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
        )
        .filter((v) => !selectedEvolution || v.evolution === selectedEvolution)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        }),
    }))

  // Standard density renders one card per (set, evolution) group that has
  // variants — base set plus each evolution — so count those visible groups.
  // Hidden evolution cards (hideEvolutions) are unmounted, so exclude them.
  // Compact density renders one card per variant, so count variants.
  const resultsCount =
    density === 'standard'
      ? filtered.reduce((sum, set) => {
          // When hiding evolutions, only the base (null) group card stays mounted.
          const groupKeys = hideEvolutions
            ? [null]
            : [...new Set(set.outfit_variants.map((v) => v.evolution))]
          return (
            sum +
            groupKeys.filter((key) => set.outfit_variants.some((v) => v.evolution === key)).length
          )
        }, 0)
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
          <DensityMenu />
          <SortButton />
          <FilterMenu />
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}

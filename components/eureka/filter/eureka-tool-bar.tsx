'use client'

import { Stack, Typography } from '@mui/material'
import SubAppBar from '@/components/sub-appbar'
import FilterMenu from '@/components/navbar/filter-menu'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function EurekaToolBar() {
  const { eurekaSets, showByColor, filters } = useEurekaData()

  const {
    selectedEurekaSet,
    selectedColor,
    selectedCategory,
    selectedObtainedFilter,
    selectedRarities,
  } = filters

  const filtered = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .filter((set) => selectedRarities.length === 0 || selectedRarities.includes(set.rarity ?? 0))
    .map((set) => ({
      colors: set.colors.filter((c) => !selectedColor || c.slug === selectedColor),
      eureka_variants: set.eureka_variants
        .filter((v) => !selectedColor || v.color === selectedColor)
        .filter((v) => !selectedCategory || v.category === selectedCategory)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        }),
    }))

  const resultsCount = showByColor
    ? filtered.reduce((sum, set) => sum + set.colors.length, 0)
    : filtered.reduce((sum, set) => sum + set.eureka_variants.length, 0)

  return (
    <SubAppBar>
      <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {resultsCount} results
        </Typography>
        <Stack direction="row" spacing={1}>
          <SortButton />
          <FilterMenu />
        </Stack>
      </Stack>
    </SubAppBar>
  )
}

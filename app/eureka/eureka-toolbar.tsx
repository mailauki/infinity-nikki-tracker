'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import FilterMenu from '@/components/filter/filter-menu'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function EurekaToolBar() {
  const { eurekaSets, showByColor, filters } = useEurekaData()

  const {
    selectedEurekaSet,
    selectedColor,
    selectedCategory,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  const filtered = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
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
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{
          width: '100%',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {resultsCount} results
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'relative', width: '88px', height: '40px' }}
        >
          <SortButton />
          <FilterMenu />
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}

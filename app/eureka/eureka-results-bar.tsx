'use client'

import { Chip } from '@mui/material'
import StickyBar from '@/components/navbar/sticky-bar'
import { useEurekaData } from '@/components/eureka/eureka-context'

export default function EurekaResultsBar() {
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
    <StickyBar>
      <Chip
        color="secondary"
        label={`Showing: ${resultsCount} results`}
        sx={{ backgroundColor: 'surface.mainHover' }}
        variant="outlined"
      />
    </StickyBar>
  )
}

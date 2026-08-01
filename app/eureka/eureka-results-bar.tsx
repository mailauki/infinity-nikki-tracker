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
    selectedStyle,
    selectedLabel,
    selectedTrial,
  } = filters

  // Mirrors the filter pipeline in filter-eureka.tsx so the count always matches
  // what is actually rendered.
  const filtered = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
    .filter((set) => !selectedLabel.length || selectedLabel.includes(set.label ?? ''))
    // A set belongs to many trials, so it matches if ANY of its trials is selected.
    .filter(
      (set) =>
        !selectedTrial.length ||
        set.eureka_set_trials.some((t) => selectedTrial.includes(t.trial ?? ''))
    )
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
    // filter-eureka drops sets left with nothing to show; a set contributing 0 to
    // the sum is equivalent, but keep the cull so the two pipelines stay aligned.
    .filter((set) => (showByColor ? set.colors.length > 0 : set.eureka_variants.length > 0))

  const resultsCount = showByColor
    ? filtered.reduce((sum, set) => sum + set.colors.length, 0)
    : filtered.reduce((sum, set) => sum + set.eureka_variants.length, 0)

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

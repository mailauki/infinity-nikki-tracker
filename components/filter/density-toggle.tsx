'use client'

import { ViewCompact, ViewModule } from '@mui/icons-material'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { OutfitDensity, useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

// The image swap used to live here as a trailing toggle button. It now sits in
// the page toolbar (ImageModeButton), matching every other page that offers it —
// eureka, seasons, momo-cloaks, and the slug pages.
export default function DensityToggle({
  onDensityChange,
}: {
  onDensityChange?: (density: OutfitDensity) => void
}) {
  const { density, setDensity } = useOutfitImageMode()

  return (
    <ToggleButtonGroup
      exclusive
      aria-label="View density"
      value={density}
      onChange={(_e, value: OutfitDensity | null) => {
        if (!value) return
        setDensity(value)
        onDensityChange?.(value)
      }}
    >
      <ToggleButton sx={{ py: 0.75 }} value="standard">
        <ViewModule fontSize="small" sx={{ mr: 0.5 }} />
        Standard
      </ToggleButton>
      <ToggleButton sx={{ py: 0.75 }} value="compact">
        <ViewCompact fontSize="small" sx={{ mr: 0.5 }} />
        Compact
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

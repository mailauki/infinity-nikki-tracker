'use client'

import { ViewCompact, ViewModule } from '@mui/icons-material'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'

// Domain-agnostic: structurally identical to OutfitDensity / MakeupDensity, but
// declared locally so this widget doesn't couple to either domain's context.
type Density = 'standard' | 'compact'

// Density only. The main/alt image swap deliberately does NOT live here — it
// belongs in the page toolbar (ImageModeButton / MakeupImageModeButton /
// SlugToolBar) so there is exactly one image toggle per page, in the same place
// on every route. Rendering it here too gave /makeup two.
export default function DensityToggle({
  density,
  setDensity,
  onDensityChange,
}: {
  density: Density
  setDensity: (density: Density) => void
  onDensityChange?: (density: Density) => void
}) {
  return (
    <ToggleButtonGroup
      exclusive
      aria-label="View density"
      value={density}
      onChange={(_e, value: Density | null) => {
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

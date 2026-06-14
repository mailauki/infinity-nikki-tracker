'use client'

import { Compare, ViewCompact, ViewModule } from '@mui/icons-material'
import { Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import { OutfitDensity, useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

export default function DensityToggle() {
  const { mode, cycleMode, density, setDensity } = useOutfitImageMode()

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' }}
    >
      <ToggleButtonGroup
        exclusive
        aria-label="View density"
        value={density}
        onChange={(_e, value: OutfitDensity | null) => value && setDensity(value)}
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
      <Tooltip title={IMAGE_MODE_LABEL[mode]}>
        <ToggleButton
          aria-label={IMAGE_MODE_LABEL[mode]}
          selected={mode === 'alt'}
          sx={{ py: 1.25 }}
          value="imageMode"
          onChange={cycleMode}
        >
          <Compare />
        </ToggleButton>
      </Tooltip>
    </Stack>
  )
}

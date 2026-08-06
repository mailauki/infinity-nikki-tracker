'use client'

import { ToggleButton, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'

// Hides makeup sets, which share a season with outfits but are their own
// collection domain. Mirrors EvolutionToggle / GlowupToggle / PiecesToggle.
export default function MakeupToggle({
  hideMakeup,
  onHideMakeupChange,
  disabled,
}: {
  hideMakeup: boolean
  onHideMakeupChange: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip title="Hide Makeup">
      <ToggleButton
        disabled={disabled}
        selected={hideMakeup}
        size="small"
        sx={{ py: 0.75 }}
        value="hideMakeup"
        onChange={onHideMakeupChange}
      >
        <ToggleIcon image="/icons/makeup.png" isSelected={hideMakeup} size="xs" title="makeup" />
      </ToggleButton>
    </Tooltip>
  )
}

'use client'

import { ToggleButton, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'

// Hides standalone pieces — individually-authored variants that sit alongside
// full sets. Mirrors EvolutionToggle / GlowupToggle.
export default function PiecesToggle({
  hidePieces,
  onHidePiecesChange,
  disabled,
}: {
  hidePieces: boolean
  onHidePiecesChange: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip title="Hide Pieces">
      <ToggleButton
        disabled={disabled}
        selected={hidePieces}
        size="small"
        sx={{ py: 0.75 }}
        value="hidePieces"
        onChange={onHidePiecesChange}
      >
        <ToggleIcon
          image="/icons/accessories.png"
          isSelected={hidePieces}
          size="xs"
          title="pieces"
        />
      </ToggleButton>
    </Tooltip>
  )
}

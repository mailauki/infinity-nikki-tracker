'use client'

import { ToggleButton, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'

export default function GlowupToggle({
  hideGlowups,
  onHideGlowupsChange,
  disabled,
}: {
  hideGlowups: boolean
  onHideGlowupsChange: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip title="Hide Glowups">
      <ToggleButton
        disabled={disabled}
        selected={hideGlowups}
        size="small"
        sx={{ py: 0.75 }}
        value="hideGlowups"
        onChange={onHideGlowupsChange}
      >
        <ToggleIcon image="/icons/glowup.png" isSelected={hideGlowups} size="xs" title="glowup" />
      </ToggleButton>
    </Tooltip>
  )
}

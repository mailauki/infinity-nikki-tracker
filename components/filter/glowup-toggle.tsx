'use client'

import { ToggleButton, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'

export default function GlowupToggle({
  hideGlowups,
  onHideGlowupsChange,
}: {
  hideGlowups: boolean
  onHideGlowupsChange: () => void
}) {
  return (
    <Tooltip title="Hide Glowups">
      <ToggleButton
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

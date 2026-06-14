'use client'

import { ViewDay } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material'

export default function SortOutfitToggle({
  groupBySet,
  onGroupBySetChange,
  disabled = false,
}: {
  groupBySet: boolean
  onGroupBySetChange: () => void
  disabled?: boolean
}) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip
        title={disabled ? 'Standard density already groups by outfit set' : 'Group by Outfit Set'}
      >
        {/* span keeps the tooltip working while the button is disabled */}
        <span>
          <ToggleButton
            disabled={disabled}
            selected={disabled ? false : groupBySet}
            value="groupBySet"
            onChange={onGroupBySetChange}
          >
            <ViewDay />
          </ToggleButton>
        </span>
      </Tooltip>
    </Stack>
  )
}

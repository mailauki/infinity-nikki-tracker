'use client'

import { ViewDay } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

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
        {/* span keeps the tooltip working while the button is disabled. MUI clones
            its aria-label onto this wrapper, which is prohibited on a role-less
            span — role="presentation" makes it inert instead. The button carries
            its own aria-label, since it is icon-only. */}
        <span role="presentation">
          <ToggleButton
            aria-label="Group by Outfit Set"
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

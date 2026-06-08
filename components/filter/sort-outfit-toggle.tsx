'use client'

import { ViewDay } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

export default function SortOutfitToggle({
  groupBySet,
  onGroupBySetChange,
}: {
  groupBySet: boolean
  onGroupBySetChange: () => void
}) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Group by Outfit Set">
        <ToggleButton
          selected={groupBySet}
          sx={{ py: 1.25 }}
          value="groupBySet"
          onChange={onGroupBySetChange}
        >
          <ViewDay />
        </ToggleButton>
      </Tooltip>
    </Stack>
  )
}
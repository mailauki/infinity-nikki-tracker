'use client'

import { AutoAwesomeOutlined } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

export default function SortEvolutionToggle({
  hideEvolutions,
  onHideEvolutionsChange,
}: {
  hideEvolutions: boolean
  onHideEvolutionsChange: () => void
}) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Hide Evolutions">
        <ToggleButton
          selected={hideEvolutions}
          sx={{ py: 1.25 }}
          value="hideEvolutions"
          onChange={onHideEvolutionsChange}
        >
          <AutoAwesomeOutlined />
        </ToggleButton>
      </Tooltip>
    </Stack>
  )
}

'use client'

import { AutoAwesome } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

export default function SortEvolutionToggle({
  showByEvolution,
  onShowByEvolutionChange,
}: {
  showByEvolution: boolean
  onShowByEvolutionChange: () => void
}) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Show by Evolution">
        <ToggleButton
          selected={showByEvolution}
          sx={{ py: 1.25 }}
          value="showByEvolution"
          onChange={onShowByEvolutionChange}
        >
          <AutoAwesome />
        </ToggleButton>
      </Tooltip>
    </Stack>
  )
}

'use client'

import { AutoAwesome, AutoAwesomeOutlined } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

export default function SortEvolutionToggle({
  showByEvolution,
  hideEvolutions,
  onShowByEvolutionChange,
  onHideEvolutionsChange,
}: {
  showByEvolution: boolean
  hideEvolutions: boolean
  onShowByEvolutionChange: () => void
  onHideEvolutionsChange: () => void
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
      <Tooltip title="Hide Evolutions">
        <ToggleButton
          disabled={showByEvolution}
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

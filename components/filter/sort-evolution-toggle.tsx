import { AutoAwesome, ViewDay } from '@mui/icons-material'
import { Stack, Tooltip, ToggleButton } from '@mui/material'

export default function SortEvolutionToggle({
  groupBySet,
  showByEvolution,
  onGroupBySetChange,
  onShowByEvolutionChange,
}: {
  groupBySet: boolean
  showByEvolution: boolean
  onGroupBySetChange: () => void
  onShowByEvolutionChange: () => void
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

import { ViewDay } from '@mui/icons-material'
import { Tooltip, ToggleButton } from '@mui/material'

export default function SortEurekaToggle({
  groupBySet,
  onGroupBySetChange,
}: {
  groupBySet: boolean
  onGroupBySetChange: () => void
}) {
  return (
    <Tooltip title="Sort by Eureka Set">
      <ToggleButton
        selected={groupBySet}
        sx={{ py: 1.75, whiteSpace: 'nowrap' }}
        value="groupBySet"
        onChange={onGroupBySetChange}
      >
        <ViewDay />
      </ToggleButton>
    </Tooltip>
  )
}

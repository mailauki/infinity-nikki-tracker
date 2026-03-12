import { ColorLens } from '@mui/icons-material'
import { Tooltip, ToggleButton } from '@mui/material'

export default function SortColorToggle({
  showByColor,
  onShowByColorChange,
}: {
  showByColor: boolean
  onShowByColorChange: () => void
}) {
  return (
    <Tooltip title="Show by Color">
      <ToggleButton
        selected={showByColor}
        sx={{ py: 1.75, whiteSpace: 'nowrap' }}
        value="showByColor"
        onChange={onShowByColorChange}
      >
        <ColorLens />
      </ToggleButton>
    </Tooltip>
  )
}

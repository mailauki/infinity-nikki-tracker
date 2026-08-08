import { SparkleIcon } from '@/components/rarity-stars'
import { FormControl, ToggleButton, ToggleButtonGroup } from '@mui/material'
import ToggleGroupLabel from '../forms/toggle-group-label'

// Rarity values offered when a caller doesn't narrow them. Cloaks pass [3, 4, 5]
// because no cloak has rarity 2 and a dead toggle button is worse than none.
const DEFAULT_RARITY_OPTIONS = [2, 3, 4, 5]

export default function RarityToggle({
  selectedRarity,
  onRarityChange,
  options = DEFAULT_RARITY_OPTIONS,
}: {
  selectedRarity: number | null
  onRarityChange: (event: React.MouseEvent<HTMLElement>, value: number | null) => void
  options?: number[]
}) {
  return (
    <FormControl>
      <ToggleGroupLabel id="rating-buttons-group-label">Rarity</ToggleGroupLabel>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="rating-buttons-group-label"
        value={selectedRarity}
        onChange={onRarityChange}
      >
        {options.map((rarity) => (
          <ToggleButton key={rarity} sx={{ py: 1.25 }} value={rarity}>
            {rarity}
            <SparkleIcon color="inherit" fontSize="inherit" sx={{ rotate: '15deg', ml: 0.5 }} />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

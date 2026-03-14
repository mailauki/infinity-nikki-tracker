import { SparkleIcon } from '@/components/rarity-stars'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'

export default function RarityToggle({
  selectedRarities,
  onRarityChange,
}: {
  selectedRarities: number[]
  onRarityChange: (event: React.MouseEvent<HTMLElement>, value: number[]) => void
}) {
  return (
    <ToggleButtonGroup value={selectedRarities} onChange={onRarityChange}>
      {([2, 3, 4, 5] as const).map((rarity) => (
        <ToggleButton key={rarity} sx={{ py: 1.25 }} value={rarity}>
          {rarity}<SparkleIcon color="inherit" fontSize="inherit" sx={{ rotate: '15deg', ml: 0.5 }} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

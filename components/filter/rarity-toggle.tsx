import { SparkleIcon } from '@/components/rarity-stars'
import { FormControl, FormLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

export default function RarityToggle({
  selectedRarity,
  onRarityChange,
}: {
  selectedRarity: number | null
  onRarityChange: (event: React.MouseEvent<HTMLElement>, value: number | null) => void
}) {
  return (
    <FormControl>
      <Typography
        component={FormLabel}
        id="rating-buttons-group-label"
        variant="overline"
        sx={{ fontSize: 'overline.fontSize', pb: 0.5 }}
      >
        Rarity
      </Typography>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="rating-buttons-group-label"
        value={selectedRarity}
        onChange={onRarityChange}
      >
        {([2, 3, 4, 5] as const).map((rarity) => (
          <ToggleButton key={rarity} sx={{ py: 1.25 }} value={rarity}>
            {rarity}
            <SparkleIcon color="inherit" fontSize="inherit" sx={{ rotate: '15deg', ml: 0.5 }} />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

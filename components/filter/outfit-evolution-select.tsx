import { Evolution } from '@/lib/types/outfit'
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material'
import { toTitle } from '@/lib/utils'
import { MENU_PROPS } from '@/lib/types/props'

export default function OutfitEvolutionSelect({
  evolutions,
  selectedEvolution,
  onEvolutionChange,
  disabled,
}: {
  evolutions: Evolution[]
  selectedEvolution: string | null
  onEvolutionChange: (event: SelectChangeEvent) => void
  disabled?: boolean
}) {
  return (
    <FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-evolution-select-label">Evolution</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Evolution"
        id="outfit-evolution-select"
        label="Evolution"
        labelId="outfit-evolution-select-label"
        value={selectedEvolution ?? ''}
        onChange={onEvolutionChange}
      >
        <MenuItem value="">—</MenuItem>
        {evolutions.map((evolution) => (
          <MenuItem key={evolution.slug} value={evolution.slug}>
            {toTitle(evolution.title ?? evolution.slug)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

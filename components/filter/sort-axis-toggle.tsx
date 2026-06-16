'use client'

import { FormControl, FormLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useSortOrder, SortAxis } from '@/components/sort-context'
import { useOutfitData } from '../outfits/outfit-context'

const AXIS_OPTIONS: { value: SortAxis; label: string; loggedInOnly?: boolean }[] = [
  { value: 'date', label: 'Date' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'progress', label: 'Progress', loggedInOnly: true },
]

export default function SortAxisToggle() {
  const { sortAxis, setSortAxis } = useSortOrder()
  const { isLoggedIn } = useOutfitData()

  const options = AXIS_OPTIONS.filter((o) => !o.loggedInOnly || isLoggedIn)

  return (
    <FormControl>
      <Typography
        component={FormLabel}
        id="sort-axis-buttons-group-label"
        sx={{ fontSize: 'overline.fontSize', pb: 0.5 }}
        variant="overline"
      >
        Sort by
      </Typography>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="sort-axis-buttons-group-label"
        value={sortAxis}
        // There is always an active axis; ignore the null the group emits when
        // the selected button is clicked again.
        onChange={(_e, axis: SortAxis | null) => axis && setSortAxis(axis)}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} sx={{ py: 0.75 }} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

'use client'

import { FormControl, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useSortOrder, SortAxis } from '@/components/sort-context'
import { useOutfitData } from '../outfits/outfit-context'
import ToggleGroupLabel from '../forms/toggle-group-label'

const AXIS_OPTIONS: { value: SortAxis; label: string; loggedInOnly?: boolean }[] = [
  { value: 'date', label: 'Date' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'progress', label: 'Progress', loggedInOnly: true },
]

// `isLoggedIn` defaults to the outfit context so existing outfit call sites keep
// working untouched. Routes without that provider mounted (e.g. /momo-cloaks)
// pass it explicitly rather than silently reading the context's `false` default.
//
// `axes` narrows which axes are offered. Domains whose items are a single unit
// (Momo's Cloaks) omit 'progress': obtained is a boolean there, so sorting by it
// only groups obtained from missing — which the obtained filter already does.
export default function SortAxisToggle({
  isLoggedIn: isLoggedInProp,
  axes,
}: {
  isLoggedIn?: boolean
  axes?: SortAxis[]
}) {
  const { sortAxis, setSortAxis } = useSortOrder()
  const { isLoggedIn: outfitIsLoggedIn } = useOutfitData()
  const isLoggedIn = isLoggedInProp ?? outfitIsLoggedIn

  const options = AXIS_OPTIONS.filter(
    (o) => (!o.loggedInOnly || isLoggedIn) && (!axes || axes.includes(o.value))
  )

  return (
    <FormControl>
      <ToggleGroupLabel id="sort-axis-buttons-group-label">Sort by</ToggleGroupLabel>
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

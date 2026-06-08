'use client'

import { OutfitCategory } from '@/lib/types/outfit'
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import { toTitle } from '@/lib/utils'
import { MENU_PROPS } from '@/lib/types/props'

export default function OutfitCategorySelect({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
}: {
  categories: OutfitCategory[]
  selectedCategory: string | null
	onCategoryChange: (event: SelectChangeEvent) => void
  disabled?: boolean
}) {
  return (
		<FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-category-select-label">Category</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Category"
        id="outfit-evolution-select"
        label="Evolution"
        labelId="outfit-category-select-label"
        value={selectedCategory ?? ''}
        onChange={onCategoryChange}
      >
        <MenuItem value="">—</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.slug} value={category.slug}>
            {toTitle(category.title ?? category.slug)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

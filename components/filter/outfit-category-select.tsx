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

export const DRESS_SLUGS = ['dress']
export const SEPARATES_SLUGS = ['tops', 'bottoms']

export function isCategoryDisabled(
  category: OutfitCategory,
  selectedSlugs: string | string[] | null,
) {
  const selected = selectedSlugs === null ? [] : Array.isArray(selectedSlugs) ? selectedSlugs : [selectedSlugs]
  if (selected.length === 0) return false
  const hasDress = selected.some((s) => DRESS_SLUGS.includes(s))
  const hasSeparates = selected.some((s) => SEPARATES_SLUGS.includes(s))
  if (hasDress) return SEPARATES_SLUGS.includes(category.slug)
  if (hasSeparates) return DRESS_SLUGS.includes(category.slug)
  return false
}

export default function OutfitCategorySelect({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
  name,
}: {
  categories: OutfitCategory[]
  selectedCategory: string | null
  onCategoryChange: (event: SelectChangeEvent) => void
  disabled?: boolean
  name?: string
}) {
  return (
    <FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-category-select-label">Category</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Category"
        id="outfit-category-select"
        label="Category"
        labelId="outfit-category-select-label"
        name={name}
        value={selectedCategory ?? ''}
        onChange={onCategoryChange}
      >
        <MenuItem value="">—</MenuItem>
        {categories.map((category) => (
          <MenuItem
            key={category.slug}
            disabled={isCategoryDisabled(category, selectedCategory)}
            value={category.slug}
          >
            {toTitle(category.title ?? category.slug)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

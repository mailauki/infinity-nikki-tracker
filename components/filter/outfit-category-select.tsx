'use client'

import { OutfitCategory } from '@/lib/types/outfit'
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import { toTitle } from '@/lib/utils'
import { MENU_PROPS } from '@/lib/types/props'

export const DRESS_SLUGS = ['dress']
export const SEPARATES_SLUGS = ['tops', 'bottoms']

function toSlugArray(selectedSlugs: string | string[] | null): string[] {
  if (selectedSlugs === null) return []
  return Array.isArray(selectedSlugs) ? selectedSlugs : [selectedSlugs]
}

export function isCategoryDisabled(
  category: OutfitCategory,
  selectedSlugs: string | string[] | null
) {
  const selected = toSlugArray(selectedSlugs)
  if (selected.length === 0) return false
  const hasDress = selected.some((s) => DRESS_SLUGS.includes(s))
  const hasSeparates = selected.some((s) => SEPARATES_SLUGS.includes(s))
  if (hasDress) return SEPARATES_SLUGS.includes(category.slug)
  if (hasSeparates) return DRESS_SLUGS.includes(category.slug)
  return false
}

type SingleProps = {
  multiple?: false
  selectedCategory: string | null
  onCategoryChange: (event: SelectChangeEvent) => void
}

type MultipleProps = {
  multiple: true
  selectedCategory: string[]
  onCategoryChange: (event: SelectChangeEvent<string[]>) => void
}

type OutfitCategorySelectProps = (SingleProps | MultipleProps) & {
  categories: OutfitCategory[]
  disabled?: boolean
  name?: string
}

export default function OutfitCategorySelect({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
  name,
  multiple,
}: OutfitCategorySelectProps) {
  const selectedSlugs = Array.isArray(selectedCategory) ? selectedCategory : []

  const categoryLabel = (category: OutfitCategory) => toTitle(category.title ?? category.slug)

  return (
    <FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-category-select-label">Category</InputLabel>
      {multiple ? (
        <Select<string[]>
          multiple
          MenuProps={MENU_PROPS}
          aria-label="Category"
          id="outfit-category-select"
          label="Category"
          labelId="outfit-category-select-label"
          name={name}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {categories
                .filter((category) => selected.includes(category.slug))
                .map((category) => (
                  <Chip key={category.slug} label={categoryLabel(category)} size="small" />
                ))}
            </Box>
          )}
          value={selectedSlugs}
          onChange={onCategoryChange}
        >
          {categories.map((category) => (
            <MenuItem key={category.slug} value={category.slug}>
              <Checkbox checked={selectedSlugs.includes(category.slug)} />
              <ListItemText primary={categoryLabel(category)} />
            </MenuItem>
          ))}
        </Select>
      ) : (
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
              {categoryLabel(category)}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  )
}

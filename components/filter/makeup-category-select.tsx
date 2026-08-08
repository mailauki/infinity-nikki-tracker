'use client'

import { MakeupCategory } from '@/lib/types/makeup'
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import { Clear } from '@mui/icons-material'
import { toTitle } from '@/lib/utils'
import { MENU_PROPS } from '@/lib/types/props'

// Every makeup set carries all five categories by design (no per-set subset,
// unlike outfits' dress/separates exclusivity), so this is always a plain
// fixed five-way multi-select — no single-select mode, no disabled pairing
// logic to mirror OutfitCategorySelect's DRESS_SLUGS/SEPARATES_SLUGS.
export default function MakeupCategorySelect({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
  name,
}: {
  categories: MakeupCategory[]
  selectedCategory: string[]
  onCategoryChange: (event: SelectChangeEvent<string[]>) => void
  disabled?: boolean
  name?: string
}) {
  const categoryLabel = (category: MakeupCategory) => toTitle(category.title ?? category.slug)

  return (
    <FormControl disabled={disabled} size="small" sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="makeup-category-select-label">Category</InputLabel>
      <Select<string[]>
        multiple
        MenuProps={MENU_PROPS}
        aria-label="Category"
        endAdornment={
          selectedCategory.length > 0 && (
            <InputAdornment position="end" sx={{ mr: 3 }}>
              <IconButton
                aria-label="Clear categories"
                edge="end"
                size="small"
                onClick={() =>
                  onCategoryChange({
                    target: { value: [], name: name ?? '' },
                  } as unknown as SelectChangeEvent<string[]>)
                }
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }
        id="makeup-category-select"
        label="Category"
        labelId="makeup-category-select-label"
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
        value={selectedCategory}
        onChange={onCategoryChange}
      >
        {categories.map((category) => (
          <MenuItem key={category.slug} value={category.slug}>
            <Checkbox checked={selectedCategory.includes(category.slug)} />
            <ListItemText primary={categoryLabel(category)} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

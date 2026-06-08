'use client'

import { OutfitCategory } from '@/lib/types/outfit'
import {
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { toTitle } from '@/lib/utils'

export default function OutfitCategoryToggle({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
}: {
  categories: OutfitCategory[]
  selectedCategory: string | null
  onCategoryChange: (event: React.MouseEvent<HTMLElement>, value: string | null) => void
  disabled?: boolean
}) {
  return (
    <FormControl>
      <Typography component={FormLabel} id="outfit-category-buttons-label" variant="overline">
        Category
      </Typography>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="outfit-category-buttons-label"
        disabled={disabled}
        value={selectedCategory}
        onChange={onCategoryChange}
      >
        {categories.map((category) => (
          <Tooltip key={category.slug} title={toTitle(category.title)}>
            <ToggleButton sx={{ py: 0.75 }} value={category.slug}>
              <Typography variant="caption">{toTitle(category.title)}</Typography>
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

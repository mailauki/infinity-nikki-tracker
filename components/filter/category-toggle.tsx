'use client'

import { EurekaCategory } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'
import {
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import ToggleIcon from '../toggle-icon'

export default function CategoryToggle({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
}: {
  categories: EurekaCategory[]
  selectedCategory: CategoryFilter | null
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
  disabled?: boolean
}) {
  return (
    <FormControl>
      <Typography
        component={FormLabel}
        id="category-buttons-group-label"
        sx={{ fontSize: 'overline.fontSize', pb: 0.5 }}
        variant="overline"
      >
        Category
      </Typography>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="category-buttons-group-label"
        disabled={disabled}
        value={selectedCategory}
        onChange={onCategoryChange}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug

          return (
            <Tooltip key={category.slug} title={category.title}>
              <ToggleButton sx={{ py: 0.75 }} value={category.slug}>
                <ToggleIcon disabled={disabled} isSelected={isSelected} item={category} />
              </ToggleButton>
            </Tooltip>
          )
        })}
      </ToggleButtonGroup>
    </FormControl>
  )
}

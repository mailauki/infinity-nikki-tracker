'use client'

import { EurekaCategory } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'
import { FormControl, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'
import ToggleGroupLabel from '../forms/toggle-group-label'

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
      <ToggleGroupLabel id="category-buttons-group-label">Category</ToggleGroupLabel>
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
                <ToggleIcon category={category.slug} disabled={disabled} isSelected={isSelected} />
              </ToggleButton>
            </Tooltip>
          )
        })}
      </ToggleButtonGroup>
    </FormControl>
  )
}

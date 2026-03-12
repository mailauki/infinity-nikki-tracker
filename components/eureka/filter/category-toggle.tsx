'use client'

import { Category } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'
import CategoryIcon from '@mui/icons-material/Category'
import { Avatar, ToggleButton, ToggleButtonGroup, Tooltip, useColorScheme } from '@mui/material'

export default function CategoryToggle({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
}: {
  categories: Category[]
  selectedCategory: CategoryFilter | null
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
  disabled?: boolean
}) {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  return (
    <ToggleButtonGroup
      exclusive
      aria-label="Categories"
      disabled={disabled}
      value={selectedCategory}
      onChange={onCategoryChange}
    >
      {categories.map((category) => (
        <Tooltip key={category.title} title={category.title}>
          <ToggleButton sx={{ p: 0.75 }} value={category.title}>
            <Avatar
              alt={category.title}
              src={category.image_url!}
              sx={{
                backgroundColor: 'transparent',
                filter:
                  isDarkMode || selectedCategory === category.title ? 'none' : 'brightness(40%)',
                opacity: disabled ? 0.3 : 1,
                '&:hover': { filter: isDarkMode ? 'none' : 'brightness(40%)' },
              }}
              variant="rounded"
            >
              <CategoryIcon sx={{ color: 'divider' }} />
            </Avatar>
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  )
}

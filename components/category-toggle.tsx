'use client'

import { Category } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'
import CategoryIcon from '@mui/icons-material/Category'
import { Avatar, ToggleButton, ToggleButtonGroup, useColorScheme } from '@mui/material'

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
      value={selectedCategory}
      onChange={onCategoryChange}
      exclusive
      disabled={disabled}
      aria-label="Categories"
    >
      {categories.map((category) => (
        <ToggleButton key={category.title} value={category.title} sx={{ p: 0.75 }}>
          <Avatar
            sx={{
              backgroundColor: 'transparent',
              filter: isDarkMode ? 'none' : 'brightness(40%)',
							opacity: disabled ? 0.3 : 1,
            }}
            src={category.image_url!}
            alt={category.title}
          >
            <CategoryIcon sx={{ color: 'divider' }} />
          </Avatar>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

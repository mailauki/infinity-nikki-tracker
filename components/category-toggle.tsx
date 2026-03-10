'use client'

import { Category } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'
import CategoryIcon from '@mui/icons-material/Category'
import { Avatar, ToggleButton, ToggleButtonGroup, useColorScheme } from '@mui/material'
import { useState } from 'react'

export default function CategoryToggle({ categories }: { categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>('Head')

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    setSelectedCategory(newCategory)
  }
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  return (
    <ToggleButtonGroup
      value={selectedCategory}
      onChange={handleChange}
      exclusive
      aria-label="Categories"
    >
      {categories.map((category) => (
        <ToggleButton key={category.title} value={category.title} sx={{ p: 0.75 }}>
          <Avatar
            sx={{
							backgroundColor: 'transparent',
							filter: isDarkMode ? 'none' : 'brightness(40%)'
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

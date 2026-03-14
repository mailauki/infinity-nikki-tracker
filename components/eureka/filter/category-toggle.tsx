'use client'

import { Category } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'
import CategoryIcon from '@mui/icons-material/Category'
import {
  Avatar,
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useColorScheme,
} from '@mui/material'

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
    <FormControl>
      <Typography component={FormLabel} id="category-buttons-group-label" variant="overline">
        Category
      </Typography>
      <ToggleButtonGroup
        exclusive
        aria-labelledby="category-buttons-group-label"
        disabled={disabled}
        value={selectedCategory}
        onChange={onCategoryChange}
      >
        {categories.map((category) => (
          <Tooltip key={category.slug} title={category.title}>
            <ToggleButton sx={{ py: 0.75 }} value={category.slug}>
              <Avatar
                alt={category.title}
                src={category.image_url!}
                sx={{
                  backgroundColor: 'transparent',
                  filter:
                    isDarkMode || selectedCategory === category.slug ? 'none' : 'brightness(40%)',
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
    </FormControl>
  )
}

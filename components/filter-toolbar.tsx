'use client'

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Toolbar,
} from '@mui/material'
import CategoryToggle from './category-toggle'
import { Category, EurekaSet } from '@/lib/types/eureka'
import { CategoryFilter } from '@/lib/types/props'

export default function FilterToolbar({
  eurekaSets,
  categories,
  selectedEurekaSet,
  selectedCategory,
  onEurekaSetChange,
  onCategoryChange,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  onEurekaSetChange: (event: SelectChangeEvent) => void
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
}) {
  return (
    <Toolbar disableGutters>
      <Stack
        direction="row"
        spacing={4}
        alignItems="center"
        justifyContent="space-between"
        sx={{ flex: 1 }}
      >
        <FormControl fullWidth>
          <InputLabel id="eureka-set-select-label">Eureka Set</InputLabel>
          <Select
            labelId="eureka-set-select-label"
            id="eureka-set-select"
            value={selectedEurekaSet ?? ''}
            aria-label="Eureka Set"
            label="Eureka Set"
            onChange={onEurekaSetChange}
          >
            <MenuItem value="">—</MenuItem>
            {eurekaSets.map((set) => (
              <MenuItem key={set.slug} value={set.slug!}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <CategoryToggle
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      </Stack>
    </Toolbar>
  )
}

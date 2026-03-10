'use client'

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  Toolbar,
} from '@mui/material'
import CategoryToggle from './category-toggle'
import { Category, EurekaSet } from '@/lib/types/eureka'
import { CategoryFilter, ToggleFilter } from '@/lib/types/props'
import FilterToggle from './filter-toggle'

export default function FilterToolbar({
  eurekaSets,
  categories,
  selectedEurekaSet,
  selectedCategory,
  selectedFilter,
  groupBySet,
  onEurekaSetChange,
  onCategoryChange,
  onFilterChange,
  onGroupBySetChange,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedFilter: ToggleFilter | null
  groupBySet: boolean
  onEurekaSetChange: (event: SelectChangeEvent) => void
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
  onFilterChange: (event: React.MouseEvent<HTMLElement>, newFilter: ToggleFilter | null) => void
  onGroupBySetChange: () => void
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
        <FilterToggle selectedFilter={selectedFilter} onFilterChange={onFilterChange} />
        <ToggleButton
          value="groupBySet"
          selected={groupBySet}
          onChange={onGroupBySetChange}
          sx={{ py: 1.75, whiteSpace: 'nowrap' }}
        >
          Sort by Eureka Set
        </ToggleButton>

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

'use client'

import { Box, Container, SelectChangeEvent, Stack, Toolbar, Typography } from '@mui/material'
import CategoryToggle from './category-toggle'
import { Category, Color, EurekaSet } from '@/lib/types/eureka'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import ObtainedToggle from './obtained-toggle'
import EurekaSelect from './eureka-select'
import SortColorToggle from './sort-color-toggle'
import ColorSelect from './color-select'
import SortEurekaToggle from './sort-eureka-toggle'
import ClearFiltersButton from './clear-filters-button'

export default function FilterToolbar({
  eurekaSets,
  categories,
  colors,
  selectedEurekaSet,
  selectedCategory,
  selectedObtainedFilter,
  groupBySet,
  showByColor,
  selectedColor,
  onEurekaSetChange,
  onCategoryChange,
  onObtainedFilterChange,
  onGroupBySetChange,
  onShowByColorChange,
  onColorChange,
  onClearFilters,
  resultsCount,
  isLoggedIn,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedObtainedFilter: ObtainedFilter | null
  groupBySet: boolean
  showByColor: boolean
  selectedColor: string | null
  onEurekaSetChange: (event: SelectChangeEvent) => void
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
  onObtainedFilterChange: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => void
  onGroupBySetChange: () => void
  onShowByColorChange: () => void
  onColorChange: (event: SelectChangeEvent) => void
  onClearFilters: () => void
  resultsCount: number
  isLoggedIn: boolean
}) {
  return (
    <Box
      sx={{
        py: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backdropFilter: 'blur(8px)',
        mask: 'linear-gradient(to bottom, black 60%, transparent 100%)',
      }}
    >
      <Container maxWidth="md">
        <Toolbar disableGutters>
          <Stack
            useFlexGap
            alignItems="center"
            direction="row"
            flexWrap="wrap"
            justifyContent="space-between"
            spacing={1}
            sx={{ flex: 1 }}
          >
            <SortEurekaToggle groupBySet={groupBySet} onGroupBySetChange={onGroupBySetChange} />

            <EurekaSelect
              eurekaSets={eurekaSets}
              selectedEurekaSet={selectedEurekaSet}
              onEurekaSetChange={onEurekaSetChange}
            />

            <SortColorToggle showByColor={showByColor} onShowByColorChange={onShowByColorChange} />

            <ColorSelect
              colors={colors}
              disabled={showByColor}
              selectedColor={selectedColor}
              onColorChange={onColorChange}
            />

            {isLoggedIn && (
              <ObtainedToggle
                disabled={showByColor}
                selectedFilter={selectedObtainedFilter}
                onFilterChange={onObtainedFilterChange}
              />
            )}

            <CategoryToggle
              categories={categories}
              disabled={showByColor}
              selectedCategory={showByColor ? null : selectedCategory}
              onCategoryChange={onCategoryChange}
            />

            <ClearFiltersButton
              groupBySet={groupBySet}
              selectedCategory={selectedCategory}
              selectedColor={selectedColor}
              selectedEurekaSet={selectedEurekaSet}
              selectedObtainedFilter={selectedObtainedFilter}
              showByColor={showByColor}
              onClearFilters={onClearFilters}
            />
          </Stack>
        </Toolbar>

        <Toolbar disableGutters>
          <Typography sx={{ px: 0.5, pb: 2 }} variant="caption">
            Showing: {resultsCount} results
          </Typography>
        </Toolbar>
      </Container>
    </Box>
  )
}

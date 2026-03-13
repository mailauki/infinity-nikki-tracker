'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Menu from '@mui/material/Menu'
import { IconButton, ListItem, SelectChangeEvent, Typography } from '@mui/material'
import { FilterList } from '@mui/icons-material'

import { useEurekaData } from '../eureka/eureka-context'
import { applyFilterParams } from '@/lib/filter-params'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import ObtainedToggle from '../eureka/filter/obtained-toggle'
import ColorSelect from '../eureka/filter/color-select'
import CategoryToggle from '../eureka/filter/category-toggle'
import SortColorToggle from '../eureka/filter/sort-color-toggle'
import SortEurekaToggle from '../eureka/filter/sort-eureka-toggle'
import EurekaSelect from '../eureka/filter/eureka-select'
import ClearFiltersButton from '../eureka/filter/clear-filters-button'

export default function FilterMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const { eurekaSets, categories, colors, isLoggedIn } = useEurekaData()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const selectedEurekaSet = searchParams.get('set')
  const selectedCategory = searchParams.get('category') as CategoryFilter | null
  const selectedObtainedFilter = searchParams.get('filter') as ObtainedFilter | null
  const groupBySet = searchParams.get('groupBySet') !== 'false'
  const showByColor = searchParams.get('showByColor') === 'true'
  const selectedColor = searchParams.get('color')

  function push(updates: Record<string, string | null>) {
    router.push(applyFilterParams(pathname, searchParams, updates), { scroll: false })
  }

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    push({ set: event.target.value || null })
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    push({ category: newCategory })
  }

  const handleObtainedFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => {
    push({ filter: newFilter })
  }

  const handleGroupBySetChange = () => {
    push({ groupBySet: groupBySet ? 'false' : null })
  }

  const handleShowByColorChange = () => {
    if (!showByColor) {
      push({ showByColor: 'true', category: null, filter: null, color: null })
    } else {
      push({ showByColor: null })
    }
  }

  const handleColorChange = (event: SelectChangeEvent) => {
    push({ color: event.target.value || null })
  }

  const handleClearFilters = () => {
    router.push(pathname, { scroll: false })
  }

  return (
    <div>
      <IconButton
        aria-controls={open ? 'filter-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        aria-label="Filter menu"
        id="filter-button"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <FilterList />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        id="filter-menu"
        open={open}
        slotProps={{
          list: {
            'aria-labelledby': 'filter-button',
          },
          paper: {
            sx: {
              borderRadius: '12px',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        onClose={() => setAnchorEl(null)}
      >
        <ListItem>
          <Typography variant="subtitle2">Filter Eureka</Typography>

          <ClearFiltersButton
            groupBySet={groupBySet}
            selectedCategory={selectedCategory}
            selectedColor={selectedColor}
            selectedEurekaSet={selectedEurekaSet}
            selectedObtainedFilter={selectedObtainedFilter}
            showByColor={showByColor}
            onClearFilters={handleClearFilters}
          />
        </ListItem>

        <ListItem sx={{ gap: 1 }}>
          <SortEurekaToggle groupBySet={groupBySet} onGroupBySetChange={handleGroupBySetChange} />

          <EurekaSelect
            eurekaSets={eurekaSets}
            selectedEurekaSet={selectedEurekaSet}
            onEurekaSetChange={handleEurekaSetChange}
          />
        </ListItem>

        <ListItem sx={{ gap: 1 }}>
          <SortColorToggle showByColor={showByColor} onShowByColorChange={handleShowByColorChange} />

          <ColorSelect
            colors={colors}
            disabled={showByColor}
            selectedColor={selectedColor}
            onColorChange={handleColorChange}
          />
        </ListItem>

        {isLoggedIn && (
          <ListItem>
            <ObtainedToggle
              disabled={showByColor}
              selectedObtainedFilter={selectedObtainedFilter}
              onObtainedFilterChange={handleObtainedFilterChange}
            />
          </ListItem>
        )}

        <ListItem>
          <CategoryToggle
            categories={categories}
            disabled={showByColor}
            selectedCategory={showByColor ? null : selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </ListItem>
      </Menu>
    </div>
  )
}

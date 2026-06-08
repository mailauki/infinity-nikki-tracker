'use client'

import * as React from 'react'
import {
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  SelectChangeEvent,
  Stack,
  Toolbar,
} from '@mui/material'
import { Close, FilterList } from '@mui/icons-material'
import { usePathname } from 'next/navigation'

import { useEurekaData } from '../eureka/eureka-context'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import ObtainedToggle from '../filter/obtained-toggle'
import ColorSelect from '../filter/color-select'
import CategoryToggle from '../filter/category-toggle'
import SortColorToggle from '../filter/sort-color-toggle'
import SortEurekaToggle from '../filter/sort-eureka-toggle'
import EurekaSelect from '../filter/eureka-select'
import RarityToggle from '../filter/rarity-toggle'

const FILTER_PAGES = ['/eureka']

export default function FilterMenu() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const {
    eurekaSets,
    categories,
    colors,
    isLoggedIn,
    groupBySet,
    showByColor,
    onGroupBySetChange,
    onShowByColorChange,
    filters,
    onFiltersChange,
    onClearFilters,
  } = useEurekaData()

  const {
    selectedEurekaSet,
    selectedCategory,
    selectedObtainedFilter,
    selectedColor,
    selectedRarity,
  } = filters

  if (!FILTER_PAGES.includes(pathname)) return null

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    onFiltersChange({ selectedEurekaSet: event.target.value || null })
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    onFiltersChange({ selectedCategory: newCategory })
  }

  const handleObtainedFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => {
    onFiltersChange({ selectedObtainedFilter: newFilter })
  }

  const handleShowByColorChange = () => {
    if (!showByColor) {
      onFiltersChange({ selectedCategory: null, selectedObtainedFilter: null, selectedColor: null })
    }
    onShowByColorChange()
  }

  const handleColorChange = (event: SelectChangeEvent) => {
    onFiltersChange({ selectedColor: event.target.value || null })
  }

  const handleRarityChange = (_event: React.MouseEvent<HTMLElement>, value: number | null) => {
    onFiltersChange({ selectedRarity: value })
  }

  const hasActiveFilters =
    selectedEurekaSet ||
    selectedCategory ||
    selectedObtainedFilter ||
    selectedColor ||
    selectedRarity

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <FilterList />
      </IconButton>

      <Drawer
				disableScrollLock
        anchor="right"
        open={open}
        sx={{ '& .MuiDrawer-paper': { width: 350 } }}
        onClose={() => setOpen(false)}
      >
				<Toolbar sx={{ mb: 2 }} />
        <Toolbar>
          <Stack direction="row" sx={{ flex: 1, justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </Toolbar>
        <List>
          <ListItem sx={{ gap: 1 }}>
            <SortEurekaToggle groupBySet={groupBySet} onGroupBySetChange={onGroupBySetChange} />
            <EurekaSelect
              eurekaSets={eurekaSets}
              selectedEurekaSet={selectedEurekaSet}
              onEurekaSetChange={handleEurekaSetChange}
            />
          </ListItem>
          <ListItem sx={{ gap: 1 }}>
            <SortColorToggle
              showByColor={showByColor}
              onShowByColorChange={handleShowByColorChange}
            />
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
          <ListItem>
            <RarityToggle selectedRarity={selectedRarity} onRarityChange={handleRarityChange} />
          </ListItem>
          <Divider sx={{ mx: 2, mt: 2 }} />
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
              {hasActiveFilters && (
                <Button color="secondary" variant="outlined" onClick={onClearFilters}>
                  Clear all
                </Button>
              )}
              <Button variant="contained" onClick={() => setOpen(false)}>
                Apply
              </Button>
            </Stack>
          </ListItem>
        </List>
      </Drawer>
    </>
  )
}

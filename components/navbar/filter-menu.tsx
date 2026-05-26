'use client'

import * as React from 'react'
import Menu from '@mui/material/Menu'
import {
  Button,
  Divider,
  IconButton,
  ListItem,
  SelectChangeEvent,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { Close, FilterList } from '@mui/icons-material'

import { useEurekaData } from '../eureka/eureka-context'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import ObtainedToggle from '../eureka/filter/obtained-toggle'
import ColorSelect from '../eureka/filter/color-select'
import CategoryToggle from '../eureka/filter/category-toggle'
import SortColorToggle from '../eureka/filter/sort-color-toggle'
import SortEurekaToggle from '../eureka/filter/sort-eureka-toggle'
import EurekaSelect from '../eureka/filter/eureka-select'
import RarityToggle from '../eureka/filter/rarity-toggle'

export default function FilterMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

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
    selectedRarities,
  } = filters

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

  const handleRarityChange = (_event: React.MouseEvent<HTMLElement>, value: number[]) => {
    onFiltersChange({ selectedRarities: value })
  }

  const hasActiveFilters =
    selectedEurekaSet ||
    selectedCategory ||
    selectedObtainedFilter ||
    selectedColor ||
    selectedRarities.length > 0

  return (
    <div>
      <Tooltip placement="bottom-end" title="Open filter menu">
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
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        id="filter-menu"
        open={open}
        slotProps={{
          list: {
            'aria-labelledby': 'filter-button',
            disablePadding: true,
            sx: { paddingBottom: 2 },
          },
          paper: { sx: { borderRadius: '12px' } },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        onClose={() => setAnchorEl(null)}
      >
        <Toolbar disableGutters sx={{ px: 2 }}>
          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Filter Eureka</Typography>
          </Stack>
          <IconButton aria-label="Close filter menu" onClick={() => setAnchorEl(null)}>
            <Close />
          </IconButton>
        </Toolbar>
        <ListItem sx={{ gap: 1 }}>
          <SortEurekaToggle groupBySet={groupBySet} onGroupBySetChange={onGroupBySetChange} />
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
        <ListItem>
          <RarityToggle selectedRarities={selectedRarities} onRarityChange={handleRarityChange} />
        </ListItem>
        <Divider sx={{ mx: 2, mt: 2 }} />
        <ListItem>
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ flex: 1 }}>
            {hasActiveFilters && (
              <Button color="secondary" variant="outlined" onClick={onClearFilters}>
                Clear all
              </Button>
            )}
            <Button variant="contained" onClick={() => setAnchorEl(null)}>
              Apply
            </Button>
          </Stack>
        </ListItem>
      </Menu>
    </div>
  )
}

import * as React from 'react'
import Menu from '@mui/material/Menu'
import { IconButton, ListItem, SelectChangeEvent, Typography } from '@mui/material'
import { FilterList } from '@mui/icons-material'
import ObtainedToggle from '../eureka/filter/obtained-toggle'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import ColorSelect from '../eureka/filter/color-select'
import CategoryToggle from '../eureka/filter/category-toggle'
import SortColorToggle from '../eureka/filter/sort-color-toggle'
import SortEurekaToggle from '../eureka/filter/sort-eureka-toggle'
import EurekaSelect from '../eureka/filter/eureka-select'
import ClearFiltersButton from '../eureka/filter/clear-filters-button'

export default function FilterMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      <IconButton
        aria-controls={open ? 'filter-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        aria-label="Filter menu"
        id="filter-button"
        onClick={handleClick}
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
        onClose={handleClose}
      >
        <ListItem>
          <Typography variant="subtitle2">Filter Eureka</Typography>

          <ClearFiltersButton
            groupBySet={true}
            selectedCategory={null}
            selectedColor={null}
            selectedEurekaSet={null}
            selectedObtainedFilter={null}
            showByColor={true}
            onClearFilters={function (): void {
              throw new Error('Function not implemented.')
            }}
          />
        </ListItem>

        <ListItem sx={{ gap: 1 }}>
          <SortEurekaToggle
            groupBySet={false}
            onGroupBySetChange={function (): void {
              throw new Error('Function not implemented.')
            }}
          />

          <EurekaSelect
            eurekaSets={[]}
            selectedEurekaSet={null}
            onEurekaSetChange={function (event: SelectChangeEvent): void {
              throw new Error('Function not implemented.')
            }}
          />
        </ListItem>

        <ListItem sx={{ gap: 1 }}>
          <SortColorToggle
            showByColor={false}
            onShowByColorChange={function (): void {
              throw new Error('Function not implemented.')
            }}
          />

          <ColorSelect
            colors={[]}
            disabled={false}
            selectedColor={null}
            onColorChange={function (event: SelectChangeEvent): void {
              throw new Error('Function not implemented.')
            }}
          />
        </ListItem>

        <ListItem>
          <ObtainedToggle
            selectedFilter={null}
            onFilterChange={function (
              event: React.MouseEvent<HTMLElement>,
              newFilter: ObtainedFilter | null
            ): void {
              throw new Error('Function not implemented.')
            }}
          />
        </ListItem>

        <ListItem>
          <CategoryToggle
            categories={[]}
            selectedCategory={null}
            onCategoryChange={function (
              event: React.MouseEvent<HTMLElement>,
              newCategory: CategoryFilter | null
            ): void {
              throw new Error('Function not implemented.')
            }}
          />
        </ListItem>
      </Menu>
    </div>
  )
}

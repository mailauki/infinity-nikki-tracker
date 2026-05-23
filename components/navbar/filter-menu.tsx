'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { applyFilterParams } from '@/lib/filter-params'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import { updateEurekaFilters } from '@/app/actions/preferences'
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
  } = useEurekaData()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = React.useTransition()

  const selectedEurekaSet = searchParams.get('set')
  const selectedCategory = searchParams.get('category') as CategoryFilter | null
  const selectedObtainedFilter = searchParams.get('filter') as ObtainedFilter | null
  const selectedColor = searchParams.get('color')
  const selectedRarities = searchParams.get('rarity')?.split(',').map(Number).filter(Boolean) ?? []

  React.useEffect(() => {
    if (isLoggedIn && !searchParams.has('filter')) {
      router.replace(applyFilterParams(pathname, searchParams, { filter: 'missing' }), {
        scroll: false,
      })
    }
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  function push(updates: Record<string, string | null>) {
    router.push(applyFilterParams(pathname, searchParams, updates), { scroll: false })
  }

  function saveFilters(updates: Record<string, string | null>) {
    if (!isLoggedIn) return
    const merged = {
      eureka_set_filter: updates.set !== undefined ? updates.set : selectedEurekaSet,
      eureka_category: updates.category !== undefined ? updates.category : selectedCategory,
      eureka_obtained_filter:
        updates.filter !== undefined ? updates.filter : selectedObtainedFilter,
      eureka_color: updates.color !== undefined ? updates.color : selectedColor,
      eureka_rarity:
        updates.rarity !== undefined
          ? updates.rarity
          : selectedRarities.length
            ? selectedRarities.join(',')
            : null,
    }
    startTransition(() => updateEurekaFilters(merged))
  }

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    const val = event.target.value || null
    push({ set: val })
    saveFilters({ set: val })
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    push({ category: newCategory })
    saveFilters({ category: newCategory })
  }

  const handleObtainedFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => {
    push({ filter: newFilter })
    saveFilters({ filter: newFilter })
  }

  const handleShowByColorChange = () => {
    if (!showByColor) {
      push({ category: null, filter: null, color: null })
      saveFilters({ category: null, filter: null, color: null })
    }
    onShowByColorChange()
  }

  const handleColorChange = (event: SelectChangeEvent) => {
    const val = event.target.value || null
    push({ color: val })
    saveFilters({ color: val })
  }

  const handleRarityChange = (_event: React.MouseEvent<HTMLElement>, value: number[]) => {
    const val = value.length ? value.join(',') : null
    push({ rarity: val })
    saveFilters({ rarity: val })
  }

  const handleClearFilters = () => {
    router.push(pathname, { scroll: false })
    if (isLoggedIn) {
      startTransition(() =>
        updateEurekaFilters({
          eureka_set_filter: null,
          eureka_category: null,
          eureka_obtained_filter: null,
          eureka_color: null,
          eureka_rarity: null,
        })
      )
    }
  }

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
            sx: {
              paddingBottom: 2,
            },
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
          <RarityToggle selectedRarities={selectedRarities} onRarityChange={handleRarityChange} />
        </ListItem>
        <Divider sx={{ mx: 2, mt: 2 }} />
        <ListItem>
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ flex: 1 }}>
            {(selectedEurekaSet ||
              selectedCategory ||
              selectedObtainedFilter ||
              selectedColor ||
              selectedRarities.length > 0) && (
              <Button color="secondary" variant="outlined" onClick={handleClearFilters}>
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

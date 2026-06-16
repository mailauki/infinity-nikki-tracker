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
  Typography,
} from '@mui/material'
import { Close, FilterList } from '@mui/icons-material'
import { usePathname } from 'next/navigation'

import { useEurekaData } from '../eureka/eureka-context'
import { useOutfitData } from '../outfits/outfit-context'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import ObtainedToggle from './obtained-toggle'
import ColorSelect from './color-select'
import CategoryToggle from './category-toggle'
import SortColorToggle from './sort-color-toggle'
import SortEurekaToggle from './sort-eureka-toggle'
import EurekaSelect from './eureka-select'
import RarityToggle from './rarity-toggle'
import OutfitSelect from './outfit-select'
import EvolutionToggle from './evolution-toggle'
import SortOutfitToggle from './sort-outfit-toggle'
import DensityToggle from './density-toggle'
import { useOutfitImageMode } from '../outfits/outfit-image-mode-context'
import OutfitCategorySelect from './outfit-category-select'
import EvolutionOrderToggle from './evolution-order-toggle'
import GlowupToggle from './glowup-toggle'
import SortAxisToggle from './sort-axis-toggle'

const FILTER_PAGES = ['/eureka', '/outfits']

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

  const {
    outfitSets,
    outfitCategories,
    isLoggedIn: outfitLoggedIn,
    groupBySet: outfitGroupBySet,
    hideEvolutions,
    hideGlowups,
    onGroupBySetChange: onOutfitGroupBySetChange,
    onHideEvolutionsChange,
    onHideGlowupsChange,
    filters: outfitFilters,
    onFiltersChange: onOutfitFiltersChange,
    onClearFilters: onClearOutfitFilters,
  } = useOutfitData()

  const { density, mode: imageMode, reset: resetImageMode } = useOutfitImageMode()

  const isOutfits = pathname.startsWith('/outfits')

  if (!FILTER_PAGES.includes(pathname)) return null

  if (isOutfits) {
    const {
      selectedOutfitSet,
      selectedOutfitCategory,
      selectedEvolution,
      selectedObtainedFilter,
      selectedRarity,
    } = outfitFilters

    // "Clear all" resets every control in this drawer, so it should appear when
    // any of them is non-default — the filters, the grouping/evolution toggles,
    // or the density / image-mode controls.
    const hasActiveFilters =
      selectedOutfitSet ||
      selectedOutfitCategory.length > 0 ||
      selectedEvolution ||
      selectedObtainedFilter ||
      selectedRarity ||
      !outfitGroupBySet ||
      hideEvolutions ||
      hideGlowups ||
      density !== 'standard' ||
      imageMode !== 'image'

    const handleClearAll = () => {
      onClearOutfitFilters()
      resetImageMode()
    }

    const availableOrders = [
      ...new Set(outfitSets.flatMap((s) => s.evolutions).map((e) => e.order)),
    ].sort((a, b) => a - b)

    return (
      <>
        <IconButton onClick={() => setOpen(true)}>
          <FilterList />
        </IconButton>
        <Drawer
          anchor="right"
          open={open}
          sx={{ '& .MuiDrawer-paper': { width: 400 } }}
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
            <ListItem>
              <DensityToggle />
            </ListItem>
            <ListItem sx={{ gap: 1 }}>
              <SortOutfitToggle
                disabled={density === 'standard'}
                groupBySet={outfitGroupBySet}
                onGroupBySetChange={onOutfitGroupBySetChange}
              />
              <OutfitSelect
                outfitSets={outfitSets}
                selectedOutfitSet={selectedOutfitSet}
                onOutfitSetChange={(slug) => onOutfitFiltersChange({ selectedOutfitSet: slug })}
              />
            </ListItem>
            <ListItem>
              <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                <Typography variant="overline">Evolutions</Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <EvolutionOrderToggle
                    availableOrders={availableOrders}
                    disabled={hideEvolutions && hideGlowups}
                    selectedEvolution={selectedEvolution}
                    onEvolutionChange={(_e, v) => onOutfitFiltersChange({ selectedEvolution: v })}
                  />
                  <Stack direction="row" spacing={1}>
                    <EvolutionToggle
                      hideEvolutions={hideEvolutions}
                      onHideEvolutionsChange={onHideEvolutionsChange}
                    />
                    <GlowupToggle
                      hideGlowups={hideGlowups}
                      onHideGlowupsChange={onHideGlowupsChange}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </ListItem>
            <ListItem>
              <SortAxisToggle />
            </ListItem>
            {outfitLoggedIn && (
              <ListItem>
                <ObtainedToggle
                  selectedObtainedFilter={selectedObtainedFilter}
                  onObtainedFilterChange={(_e, v) =>
                    onOutfitFiltersChange({ selectedObtainedFilter: v })
                  }
                />
              </ListItem>
            )}
            <ListItem>
              <OutfitCategorySelect
                multiple
                categories={outfitCategories}
                disabled={density === 'standard'}
                selectedCategory={selectedOutfitCategory}
                onCategoryChange={(e) =>
                  onOutfitFiltersChange({
                    selectedOutfitCategory:
                      typeof e.target.value === 'string'
                        ? e.target.value.split(',').filter(Boolean)
                        : e.target.value,
                  })
                }
              />
            </ListItem>
            <ListItem>
              <RarityToggle
                selectedRarity={selectedRarity}
                onRarityChange={(_e, v) => onOutfitFiltersChange({ selectedRarity: v })}
              />
            </ListItem>
            <Divider sx={{ mx: 2, mt: 2 }} />
            <ListItem>
              <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button color="secondary" variant="outlined" onClick={handleClearAll}>
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

  // "Clear all" resets every control in this drawer, so it should appear when
  // any of them is non-default — the filters or the grouping toggles.
  const hasActiveFilters =
    selectedEurekaSet ||
    selectedCategory ||
    selectedObtainedFilter ||
    selectedColor ||
    selectedRarity ||
    !groupBySet ||
    showByColor

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <FilterList />
      </IconButton>

      <Drawer
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

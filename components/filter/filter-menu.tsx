'use client'

import * as React from 'react'
import {
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material'
import { FilterList } from '@mui/icons-material'
import { usePathname } from 'next/navigation'

import { useSidebar } from '../navbar/navbar-toolbar-context'
import SidebarBody from '@/components/sidebar/sidebar-body'
import { SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'

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
import SortOutfitToggle from './sort-outfit-toggle'
import DensityToggle from './density-toggle'
import { useOutfitImageMode } from '../outfits/outfit-image-mode-context'
import { useSortOrder } from '../sort-context'
import OutfitCategorySelect from './outfit-category-select'
import EvolutionOrderToggle from './evolution-order-toggle'
import EvolutionShowToggle from './evolution-show-toggle'
import SortAxisToggle from './sort-axis-toggle'
import StyleLabelSelect from './style-label-select'

export default function FilterMenu() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  // Persisted close used by the Apply / Close buttons inside the panel body,
  // matching the toggle in Sidebar.
  const closeFilter = () => {
    setSidebarOpen(false)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false')
  }

  const {
    eurekaSets,
    categories,
    colors,
    styles,
    labels,
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
    selectedStyle,
    selectedLabel,
  } = filters

  const {
    outfitSets,
    outfitCategories,
    styles: outfitStyles,
    labels: outfitLabels,
    isLoggedIn: outfitLoggedIn,
    groupBySet: outfitGroupBySet,
    showBase,
    showEvolutions,
    showGlowups,
    onGroupBySetChange: onOutfitGroupBySetChange,
    onShowBaseChange,
    onShowEvolutionsChange,
    onShowGlowupsChange,
    filters: outfitFilters,
    onFiltersChange: onOutfitFiltersChange,
    onClearFilters: onClearOutfitFilters,
  } = useOutfitData()

  const { density, mode: imageMode, reset: resetImageMode } = useOutfitImageMode()
  const { resetSort, isSortDefault } = useSortOrder()

  const isOutfits = pathname.startsWith('/outfits')

  // Category filtering only applies in compact view. Density can settle on
  // 'standard' after the toggle handler runs (e.g. hydrated from saved
  // preferences), so reconcile here too: clear any category selection whenever
  // density is standard. Idempotent — only fires an update when a selection
  // is actually present.
  const { selectedOutfitCategory } = outfitFilters
  const { selectedEvolution: selectedEvolutionForReconcile } = outfitFilters
  React.useEffect(() => {
    if (isOutfits && density === 'standard' && selectedOutfitCategory.length > 0) {
      onOutfitFiltersChange({ selectedOutfitCategory: [] })
    }
  }, [isOutfits, density, selectedOutfitCategory, onOutfitFiltersChange])

  React.useEffect(() => {
    if (!isOutfits) return
    const orderVisible =
      selectedEvolutionForReconcile === null ||
      (selectedEvolutionForReconcile === 1
        ? showBase
        : selectedEvolutionForReconcile === 0
          ? showGlowups
          : showEvolutions)
    if (!orderVisible) {
      onOutfitFiltersChange({ selectedEvolution: null })
    }
  }, [
    isOutfits,
    selectedEvolutionForReconcile,
    showBase,
    showEvolutions,
    showGlowups,
    onOutfitFiltersChange,
  ])

  if (isOutfits) {
    const {
      selectedOutfitSet,
      selectedEvolution,
      selectedObtainedFilter,
      selectedRarity,
      selectedStyle,
      selectedLabel,
    } = outfitFilters

    // "Clear all" resets every control in this drawer, so it should appear when
    // any of them is non-default — the filters, the grouping/evolution toggles,
    // or the density / image-mode controls.
    const hasActiveFilters =
      selectedOutfitSet ||
      selectedOutfitCategory.length > 0 ||
      selectedEvolution !== null ||
      selectedObtainedFilter ||
      selectedRarity ||
      selectedStyle.length > 0 ||
      selectedLabel.length > 0 ||
      !outfitGroupBySet ||
      !showBase ||
      !showEvolutions ||
      !showGlowups ||
      density !== 'standard' ||
      imageMode !== 'image'

    const handleClearAll = () => {
      onClearOutfitFilters()
      resetImageMode()
    }

    // "Reset" restores only the view controls — density, image mode, and sort —
    // to their defaults, leaving the filter selections intact.
    const hasViewChanges = density !== 'standard' || imageMode !== 'image' || !isSortDefault

    const handleReset = () => {
      resetImageMode()
      resetSort()
    }

    const allOrders = [
      1, // base is always a possible order
      ...new Set(outfitSets.flatMap((s) => s.evolutions).map((e) => e.order)),
    ]
    const availableOrders = allOrders
      .filter((o) => (o === 1 ? showBase : o === 0 ? showGlowups : showEvolutions))
      .sort((a, b) => a - b)

    return (
      <>
        <IconButton
          color={sidebarOpen ? 'primary' : 'default'}
          onClick={() => {
            const next = !sidebarOpen
            setSidebarOpen(next)
            localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
          }}
        >
          <FilterList />
        </IconButton>
        <SidebarBody>
          <List>
            <ListItem>
              <DensityToggle
                onDensityChange={(next) => {
                  // Category filtering only applies in compact view; clear the
                  // selection when switching back to standard so it isn't retained
                  // while the (disabled) control is hidden from effect.
                  if (next === 'standard' && selectedOutfitCategory.length > 0) {
                    onOutfitFiltersChange({ selectedOutfitCategory: [] })
                  }
                }}
              />
            </ListItem>
            <ListItem>
              <SortAxisToggle />
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
                    disabled={!showBase && !showEvolutions && !showGlowups}
                    selectedEvolution={selectedEvolution}
                    onEvolutionChange={(_e, v) => onOutfitFiltersChange({ selectedEvolution: v })}
                  />
                  <Stack direction="row" spacing={1}>
                    <EvolutionShowToggle
                      showBase={showBase}
                      showEvolutions={showEvolutions}
                      showGlowups={showGlowups}
                      onShowBaseChange={onShowBaseChange}
                      onShowEvolutionsChange={onShowEvolutionsChange}
                      onShowGlowupsChange={onShowGlowupsChange}
                    />
                  </Stack>
                </Stack>
              </Stack>
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
            <ListItem>
              <StyleLabelSelect
                id="outfit-style-select"
                label="Style"
                options={outfitStyles}
                selected={selectedStyle}
                onChange={(next) => onOutfitFiltersChange({ selectedStyle: next })}
              />
            </ListItem>
            <ListItem>
              <StyleLabelSelect
                id="outfit-label-select"
                label="Label"
                options={outfitLabels}
                selected={selectedLabel}
                onChange={(next) => onOutfitFiltersChange({ selectedLabel: next })}
              />
            </ListItem>
            <Divider sx={{ mx: 2, mt: 2 }} />
            <ListItem>
              <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                {hasViewChanges && (
                  <Button color="secondary" variant="outlined" onClick={handleReset}>
                    Reset
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button color="secondary" variant="outlined" onClick={handleClearAll}>
                    Clear all
                  </Button>
                )}
                <Button variant="contained" onClick={closeFilter}>
                  Apply
                </Button>
              </Stack>
            </ListItem>
          </List>
        </SidebarBody>
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
    selectedStyle.length > 0 ||
    selectedLabel.length > 0 ||
    !groupBySet ||
    showByColor

  return (
    <>
      <IconButton
        color={sidebarOpen ? 'primary' : 'default'}
        onClick={() => {
          const next = !sidebarOpen
          setSidebarOpen(next)
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
        }}
      >
        <FilterList />
      </IconButton>
      <SidebarBody>
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
          <ListItem>
            <StyleLabelSelect
              id="eureka-style-select"
              label="Style"
              options={styles}
              selected={selectedStyle}
              onChange={(next) => onFiltersChange({ selectedStyle: next })}
            />
          </ListItem>
          <ListItem>
            <StyleLabelSelect
              id="eureka-label-select"
              label="Label"
              options={labels}
              selected={selectedLabel}
              onChange={(next) => onFiltersChange({ selectedLabel: next })}
            />
          </ListItem>
          <Divider sx={{ mx: 2, mt: 2 }} />
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
              {hasActiveFilters && (
                <Button color="secondary" variant="outlined" onClick={onClearFilters}>
                  Clear all
                </Button>
              )}
              <Button variant="contained" onClick={closeFilter}>
                Apply
              </Button>
            </Stack>
          </ListItem>
        </List>
      </SidebarBody>
    </>
  )
}

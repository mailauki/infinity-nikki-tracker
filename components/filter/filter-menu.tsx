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
import EvolutionToggle from './evolution-toggle'
import GlowupToggle from './glowup-toggle'
import SortAxisToggle from './sort-axis-toggle'
import StyleLabelSelect from './style-label-select'
import ToggleGroupLabel from '../forms/toggle-group-label'

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
  const { resetSort, isSortDefault } = useSortOrder()

  const isOutfits = pathname.startsWith('/outfits')

  // Category filtering only applies in compact view. Density can settle on
  // 'standard' after the toggle handler runs (e.g. hydrated from saved
  // preferences), so reconcile here too: clear any category selection whenever
  // density is standard. Idempotent — only fires an update when a selection
  // is actually present.
  const { selectedOutfitCategory } = outfitFilters
  const { selectedEvolution: selectedEvolutionForReconcile } = outfitFilters

  // Whether an evolution order is currently shown, per the hide-toggles. Base is
  // order 1 (always shown — no hide-toggle), glow-up is order 0, everything else
  // is a regular evolution. Drives which order buttons are disabled (via
  // `isOrderDisabled`) and the reconciliation effect below (which clears a
  // selection whose category was just hidden).
  const isOrderShown = React.useCallback(
    (order: number) => {
      if (order === 1) return true
      if (order === 0) return !hideGlowups
      return !hideEvolutions
    },
    [hideEvolutions, hideGlowups]
  )

  React.useEffect(() => {
    if (isOutfits && density === 'standard' && selectedOutfitCategory.length > 0) {
      onOutfitFiltersChange({ selectedOutfitCategory: [] })
    }
  }, [isOutfits, density, selectedOutfitCategory, onOutfitFiltersChange])

  React.useEffect(() => {
    if (!isOutfits) return
    const orderVisible =
      selectedEvolutionForReconcile === null || isOrderShown(selectedEvolutionForReconcile)
    if (!orderVisible) {
      onOutfitFiltersChange({ selectedEvolution: null })
    }
  }, [isOutfits, selectedEvolutionForReconcile, isOrderShown, onOutfitFiltersChange])

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
      hideEvolutions ||
      hideGlowups ||
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

    // Static: every order that exists in the data (plus base, order 1, which is
    // conceptually always present). Buttons for hidden categories are disabled —
    // not removed — via `isOrderDisabled` below.
    const availableOrders = [
      1,
      ...new Set(outfitSets.flatMap((s) => s.evolutions).map((e) => e.order)),
    ].sort((a, b) => a - b)

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
              <Stack sx={{ flexGrow: 1 }}>
                <ToggleGroupLabel>Evolutions</ToggleGroupLabel>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <EvolutionOrderToggle
                    availableOrders={availableOrders}
                    isOrderDisabled={(o) => !isOrderShown(o)}
                    selectedEvolution={selectedEvolution}
                    onEvolutionChange={(_e, v) => onOutfitFiltersChange({ selectedEvolution: v })}
                  />
                  <Stack direction="row" spacing={1}>
                    <EvolutionToggle
                      disabled={Boolean(selectedEvolution)}
                      hideEvolutions={hideEvolutions}
                      onHideEvolutionsChange={onHideEvolutionsChange}
                    />
                    <GlowupToggle
                      disabled={Boolean(selectedEvolution)}
                      hideGlowups={hideGlowups}
                      onHideGlowupsChange={onHideGlowupsChange}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </ListItem>
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

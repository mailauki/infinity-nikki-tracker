'use client'

import { useMemo } from 'react'
import { Button, Divider, IconButton, List, ListItem, Stack } from '@mui/material'
import { FilterList } from '@mui/icons-material'

import ObtainedToggle from '@/components/filter/obtained-toggle'
import RarityToggle from '@/components/filter/rarity-toggle'
import StyleLabelSelect from '@/components/filter/style-label-select'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SidebarBody from '@/components/sidebar/sidebar-body'

import { useMomoCloakData } from './momo-cloak-context'

// Every rarity present in the cloak data. No cloak has rarity 2, so the shared
// default of [2, 3, 4, 5] would render a permanently dead button.
const CLOAK_RARITY_OPTIONS = [3, 4, 5]

export default function MomoCloakFilterMenu() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { cloaks, isLoggedIn, isObtainedError, filters, onFiltersChange, onClearFilters } =
    useMomoCloakData()

  const { selectedRarity, selectedSeason, selectedSeasonCategory, selectedObtainedFilter } = filters

  // Options come from the values actually present on the loaded cloaks, so a
  // season with no cloaks never appears as a dead choice.
  const seasonOptions = useMemo(() => {
    const slugs = [...new Set(cloaks.map((c) => c.seasons).filter((s): s is string => !!s))]
    return slugs.sort().map((slug) => ({ slug, title: slug }))
  }, [cloaks])

  const seasonCategoryOptions = useMemo(() => {
    const slugs = [...new Set(cloaks.map((c) => c.season_category).filter((s): s is string => !!s))]
    return slugs.sort().map((slug) => ({ slug, title: slug }))
  }, [cloaks])

  const hasActiveFilters =
    selectedRarity !== null ||
    selectedSeason.length > 0 ||
    selectedSeasonCategory.length > 0 ||
    selectedObtainedFilter !== null

  return (
    <>
      <IconButton
        aria-label="Filter cloaks"
        color={sidebarOpen ? 'primary' : 'default'}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FilterList />
      </IconButton>
      <SidebarBody>
        <List>
          {isLoggedIn && (
            <ListItem>
              <ObtainedToggle
                disabled={isObtainedError}
                selectedObtainedFilter={selectedObtainedFilter}
                onObtainedFilterChange={(_e, v) => onFiltersChange({ selectedObtainedFilter: v })}
              />
            </ListItem>
          )}
          <ListItem>
            <RarityToggle
              options={CLOAK_RARITY_OPTIONS}
              selectedRarity={selectedRarity}
              onRarityChange={(_e, v) => onFiltersChange({ selectedRarity: v })}
            />
          </ListItem>
          <ListItem sx={{ gap: 1 }}>
            <StyleLabelSelect
              id="momo-season-select"
              label="Season"
              options={seasonOptions}
              selected={selectedSeason}
              onChange={(next) => onFiltersChange({ selectedSeason: next })}
            />
            <StyleLabelSelect
              id="momo-season-category-select"
              label="Season Category"
              options={seasonCategoryOptions}
              selected={selectedSeasonCategory}
              onChange={(next) => onFiltersChange({ selectedSeasonCategory: next })}
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
              <Button variant="contained" onClick={() => setSidebarOpen(false)}>
                Apply
              </Button>
            </Stack>
          </ListItem>
        </List>
      </SidebarBody>
    </>
  )
}

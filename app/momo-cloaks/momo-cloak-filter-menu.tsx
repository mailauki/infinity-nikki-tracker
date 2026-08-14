'use client'

import { useMemo } from 'react'
import {
  Button,
  Divider,
  FormControl,
  IconButton,
  List,
  ListItem,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { FilterList } from '@mui/icons-material'

import ObtainedToggle from '@/components/filter/obtained-toggle'
import RarityToggle from '@/components/filter/rarity-toggle'
import SortAxisToggle from '@/components/filter/sort-axis-toggle'
import StyleLabelSelect from '@/components/filter/style-label-select'
import ToggleGroupLabel from '@/components/forms/toggle-group-label'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SidebarBody from '@/components/sidebar/sidebar-body'
import { SortAxis, useSortOrder } from '@/components/sort-context'
import { toTitle } from '@/lib/utils'

import { useMomoCloakData } from './momo-cloak-context'

// Every rarity present in the cloak data. No cloak has rarity 2, so the shared
// default of [2, 3, 4, 5] would render a permanently dead button.
const CLOAK_RARITY_OPTIONS = [3, 4, 5]

// 'progress' is deliberately absent: a cloak is a single unit, so its obtained
// state is a boolean and sorting by it only groups obtained from missing —
// which the obtained filter already does directly. Exported so the grid can
// fall back off a `progress` axis persisted by another domain's page.
export const CLOAK_SORT_AXES: SortAxis[] = ['date', 'rarity', 'title']

export default function MomoCloakFilterMenu() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { cloaks, isLoggedIn, isObtainedError, filters, onFiltersChange, onClearFilters } =
    useMomoCloakData()
  const { resetSort, isSortDefault } = useSortOrder()

  const {
    selectedRarity,
    selectedSeason,
    selectedSeasonCategory,
    selectedLocation,
    selectedObtainedFilter,
  } = filters

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

  // Only two locations exist in the data (wishfield, itzaland), so these render
  // as a pair of exclusive toggle buttons rather than a select.
  const locationOptions = useMemo(() => {
    const slugs = [...new Set(cloaks.map((c) => c.location).filter((s): s is string => !!s))]
    return slugs
  }, [cloaks])

  const hasActiveFilters =
    selectedRarity !== null ||
    selectedSeason.length > 0 ||
    selectedSeasonCategory.length > 0 ||
    selectedLocation !== null ||
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
          <ListItem>
            {/* Explicit isLoggedIn: this route has no OutfitDataProvider, which
                is where the toggle otherwise reads it from. `progress` is
                omitted — a cloak is a single unit, so its obtained state is a
                boolean and sorting by it just replays the obtained filter. */}
            <SortAxisToggle axes={CLOAK_SORT_AXES} isLoggedIn={isLoggedIn} />
          </ListItem>
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
          {locationOptions.length > 0 && (
            <ListItem>
              <FormControl>
                <ToggleGroupLabel id="momo-location-group-label">Location</ToggleGroupLabel>
                <ToggleButtonGroup
                  exclusive
                  aria-labelledby="momo-location-group-label"
                  value={selectedLocation}
                  onChange={(_e, v: string | null) => onFiltersChange({ selectedLocation: v })}
                >
                  {locationOptions.map((slug) => (
                    <ToggleButton key={slug} sx={{ py: 0.75 }} value={slug}>
                      {toTitle(slug)}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </FormControl>
            </ListItem>
          )}
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
          <Divider component="li" role="listitem" sx={{ mx: 2, mt: 2 }} />
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
              {/* "Reset" restores only the sort controls, leaving filter
                  selections intact — same split as the outfits menu. */}
              {!isSortDefault && (
                <Button color="secondary" variant="outlined" onClick={resetSort}>
                  Reset
                </Button>
              )}
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

'use client'

import { Button, Checkbox, Divider, List, ListItem, ListItemIcon, Stack } from '@mui/material'
import { useSeasonFilter } from '@/app/seasons/[slug]/season-filter-context'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import ToggleIcon from '@/components/toggle-icon'
import ToggleGroupLabel from '@/components/forms/toggle-group-label'
import DensityToggle from './density-toggle'
import ObtainedToggle from './obtained-toggle'
import RarityToggle from './rarity-toggle'
import StyleLabelSelect from './style-label-select'

// Every kind of card a season can display. Together these are exhaustive, so the
// "All" row above them genuinely means all. `hidden` is what the filter context
// stores, but the panel is phrased positively ("Evolutions" checked = shown), so
// each row inverts it — a hide-flag reads badly as a checkable item. Mirrors the
// KINDS table from the deleted SeasonVisibilityMenu.
const KINDS = [
  { key: 'baseSets', label: 'Base sets', icon: '/icons/outfits.png' },
  { key: 'evolutions', label: 'Evolutions', icon: '/icons/evolution.png' },
  { key: 'glowups', label: 'Glow-ups', icon: '/icons/glowup.png' },
  { key: 'pieces', label: 'Pieces', icon: '/icons/accessories.png' },
  { key: 'makeup', label: 'Makeup', icon: '/icons/makeup.png' },
] as const

export default function SeasonFilterBody() {
  const { setSidebarOpen } = useSidebar()
  const { styles } = useOutfitData()

  const {
    hideBaseSets,
    hideEvolutions,
    hideGlowups,
    hidePieces,
    hideMakeup,
    onHideBaseSetsChange,
    onHideEvolutionsChange,
    onHideGlowupsChange,
    onHidePiecesChange,
    onHideMakeupChange,
    onSetAllVisible,
    density,
    onDensityChange,
    filters,
    onFiltersChange,
    onClearFilters,
  } = useSeasonFilter()

  // "Reset" restores only the view controls — the five visibility toggles and
  // density — to their defaults, leaving the obtained/rarity/style filter
  // selections intact. Mirrors the Reset/Clear split in the outfits and makeup
  // branches of FilterMenu.
  const hasViewChanges =
    hideBaseSets !== DEFAULT_PREFERENCES.season_hide_base_sets ||
    hideEvolutions !== DEFAULT_PREFERENCES.season_hide_evolutions ||
    hideGlowups !== DEFAULT_PREFERENCES.season_hide_glowups ||
    hidePieces !== DEFAULT_PREFERENCES.season_hide_pieces ||
    hideMakeup !== DEFAULT_PREFERENCES.season_hide_makeup ||
    density !== DEFAULT_PREFERENCES.season_density

  const handleReset = () => {
    if (hideBaseSets !== DEFAULT_PREFERENCES.season_hide_base_sets) onHideBaseSetsChange()
    if (hideEvolutions !== DEFAULT_PREFERENCES.season_hide_evolutions) onHideEvolutionsChange()
    if (hideGlowups !== DEFAULT_PREFERENCES.season_hide_glowups) onHideGlowupsChange()
    if (hidePieces !== DEFAULT_PREFERENCES.season_hide_pieces) onHidePiecesChange()
    if (hideMakeup !== DEFAULT_PREFERENCES.season_hide_makeup) onHideMakeupChange()
    if (density !== DEFAULT_PREFERENCES.season_density) onDensityChange('standard')
  }

  const state = {
    baseSets: { hidden: hideBaseSets, toggle: onHideBaseSetsChange },
    evolutions: { hidden: hideEvolutions, toggle: onHideEvolutionsChange },
    glowups: { hidden: hideGlowups, toggle: onHideGlowupsChange },
    pieces: { hidden: hidePieces, toggle: onHidePiecesChange },
    makeup: { hidden: hideMakeup, toggle: onHideMakeupChange },
  }

  const shownCount = KINDS.filter((kind) => !state[kind.key].hidden).length
  const allShown = shownCount === KINDS.length
  const noneShown = shownCount === 0

  // "Clear all" only resets the three filter axes (obtained/rarity/styles) —
  // it must be gated on those axes alone, not on `hasActiveFilters` (which also
  // covers the visibility toggles and density). Gating on the wider flag let
  // the button appear from a visibility-only change and then no-op on click,
  // since onClearFilters never touched those flags. See season-filter-body
  // test for the regression this guards.
  const hasActiveFilterAxes =
    filters.obtained !== null || filters.rarity !== null || filters.styles.length > 0

  const closeFilter = () => {
    setSidebarOpen(false)
  }

  return (
    <List>
      <ListItem>
        <DensityToggle density={density} setDensity={onDensityChange} />
      </ListItem>
      <ListItem>
        <Stack sx={{ flexGrow: 1 }}>
          <ToggleGroupLabel>Show</ToggleGroupLabel>
          <List dense disablePadding>
            <ListItem disableGutters onClick={() => onSetAllVisible(!allShown)}>
              <Checkbox
                disableRipple
                checked={allShown}
                indeterminate={!allShown && !noneShown}
                size="small"
                slotProps={{ input: { 'aria-label': allShown ? 'Hide all' : 'Show all' } }}
                sx={{ mr: 0.5, p: 0.5 }}
              />
              All
            </ListItem>
            <Divider component="li" role="listitem" />
            {KINDS.map((kind) => {
              const { hidden, toggle } = state[kind.key]
              const shown = !hidden
              return (
                <ListItem key={kind.key} disableGutters onClick={toggle}>
                  <Checkbox
                    disableRipple
                    checked={shown}
                    size="small"
                    slotProps={{ input: { 'aria-label': `Show ${kind.label}` } }}
                    sx={{ mr: 0.5, p: 0.5 }}
                  />
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ToggleIcon image={kind.icon} size="xs" title={kind.label} />
                  </ListItemIcon>
                  {kind.label}
                </ListItem>
              )
            })}
          </List>
        </Stack>
      </ListItem>
      <ListItem>
        <ObtainedToggle
          selectedObtainedFilter={filters.obtained}
          onObtainedFilterChange={(_e, next) => onFiltersChange({ obtained: next })}
        />
      </ListItem>
      <ListItem>
        <RarityToggle
          selectedRarity={filters.rarity}
          onRarityChange={(_e, next) => onFiltersChange({ rarity: next })}
        />
      </ListItem>
      <ListItem>
        <StyleLabelSelect
          id="season-style"
          label="Style"
          options={styles}
          selected={filters.styles}
          onChange={(next) => onFiltersChange({ styles: next })}
        />
      </ListItem>
      <Divider component="li" role="listitem" sx={{ mx: 2, mt: 2 }} />
      <ListItem>
        <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          {hasViewChanges && (
            <Button color="secondary" variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          )}
          {hasActiveFilterAxes && (
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
  )
}

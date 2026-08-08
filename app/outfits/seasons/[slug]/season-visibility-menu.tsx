'use client'

import { useId, useState } from 'react'
import {
  Button,
  Checkbox,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import { ExpandMore, Visibility } from '@mui/icons-material'
import ToggleIcon from '@/components/toggle-icon'
import { useSeasonFilter } from './season-filter-context'

// Every kind of card a season can display. Together these are exhaustive, so the
// "All" row above them genuinely means all. `hidden` is what the filter context
// stores, but the menu is phrased positively ("Evolutions" checked = shown), so
// each row inverts it — a hide-flag reads badly as a checkable item.
const KINDS = [
  { key: 'baseSets', label: 'Base sets', icon: '/icons/outfits.png' },
  { key: 'evolutions', label: 'Evolutions', icon: '/icons/evolution.png' },
  { key: 'glowups', label: 'Glow-ups', icon: '/icons/glowup.png' },
  { key: 'pieces', label: 'Pieces', icon: '/icons/accessories.png' },
  { key: 'makeup', label: 'Makeup', icon: '/icons/makeup.png' },
] as const

/**
 * Consolidates the season's four show/hide toggles into one dropdown, in the
 * shape of OutfitFilterMenu (labelled Button + anchored Menu). Four separate
 * ToggleButtons crowded the toolbar; a single control also leaves room for the
 * count of what is currently hidden.
 *
 * The menu stays open on select so several kinds can be toggled in one pass.
 */
export default function SeasonVisibilityMenu() {
  const id = useId()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

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
  } = useSeasonFilter()

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

  const label = allShown ? 'Showing all' : `Showing ${shownCount} of ${KINDS.length}`

  return (
    <>
      <Tooltip title="Choose what to show">
        <Button
          aria-controls={isOpen ? `${id}-menu` : undefined}
          aria-expanded={isOpen}
          aria-haspopup="true"
          color="inherit"
          endIcon={<ExpandMore />}
          id={`${id}-button`}
          size="small"
          startIcon={<Visibility />}
          sx={{ whiteSpace: 'nowrap' }}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          {label}
        </Button>
      </Tooltip>
      <Menu
        disableScrollLock
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        id={`${id}-menu`}
        open={isOpen}
        slotProps={{ list: { 'aria-labelledby': `${id}-button`, dense: true } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => onSetAllVisible(!allShown)}>
          <Checkbox
            disableRipple
            checked={allShown}
            // Some-but-not-all shown reads as a partial selection.
            indeterminate={!allShown && !noneShown}
            size="small"
            slotProps={{ input: { 'aria-label': allShown ? 'Hide all' : 'Show all' } }}
            sx={{ mr: 0.5, p: 0.5 }}
          />
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 'medium' } } }}>All</ListItemText>
        </MenuItem>

        <Divider />

        {KINDS.map((kind) => {
          const { hidden, toggle } = state[kind.key]
          const shown = !hidden

          return (
            <MenuItem key={kind.key} selected={shown} onClick={toggle}>
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
              <ListItemText>{kind.label}</ListItemText>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

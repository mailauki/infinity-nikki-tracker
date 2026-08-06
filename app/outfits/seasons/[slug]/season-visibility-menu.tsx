'use client'

import { useId, useState } from 'react'
import {
  Button,
  Checkbox,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import { ExpandMore, Visibility } from '@mui/icons-material'
import ToggleIcon from '@/components/toggle-icon'
import { useSeasonFilter } from './season-filter-context'

// The four content kinds a season can show. `hidden` is what the filter context
// stores, but the menu is phrased positively ("Evolutions" checked = shown), so
// each row inverts it — a hide-flag reads badly as a checkable item.
const KINDS = [
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
    hideEvolutions,
    hideGlowups,
    hidePieces,
    hideMakeup,
    onHideEvolutionsChange,
    onHideGlowupsChange,
    onHidePiecesChange,
    onHideMakeupChange,
  } = useSeasonFilter()

  const state = {
    evolutions: { hidden: hideEvolutions, toggle: onHideEvolutionsChange },
    glowups: { hidden: hideGlowups, toggle: onHideGlowupsChange },
    pieces: { hidden: hidePieces, toggle: onHidePiecesChange },
    makeup: { hidden: hideMakeup, toggle: onHideMakeupChange },
  }

  const hiddenCount = KINDS.filter((kind) => state[kind.key].hidden).length
  const label =
    hiddenCount > 0 ? `Showing ${KINDS.length - hiddenCount} of ${KINDS.length}` : 'Show all'

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
        id={`${id}-menu`}
        open={isOpen}
        slotProps={{ list: { 'aria-labelledby': `${id}-button`, dense: true } }}
        onClose={() => setAnchorEl(null)}
      >
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
                <ToggleIcon image={kind.icon} isSelected={shown} size="xs" title={kind.label} />
              </ListItemIcon>
              <ListItemText>{kind.label}</ListItemText>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

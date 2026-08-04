'use client'

import { Button, Menu, MenuItem } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import React from 'react'

export type OutfitFilterOption = {
  value: string
  label: string
}

// A single-select dropdown in the shape of the admin nav menu (labelled Button
// + anchored Menu). Used on the standalone-pieces detail page, where the filter
// axes (category, season) have too many options to sit in a ToggleButtonGroup.
export default function OutfitFilterMenu({
  label,
  options,
  value,
  allLabel = 'All',
  onSelect,
}: {
  label: string
  options: OutfitFilterOption[]
  value: string | null
  allLabel?: string
  onSelect: (next: string | null) => void
}) {
  const id = React.useId()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const selected = options.find((option) => option.value === value)

  const handleClose = () => setAnchorEl(null)

  const handleSelect = (next: string | null) => {
    onSelect(next)
    handleClose()
  }

  return (
    <>
      <Button
        aria-controls={isOpen ? `${id}-menu` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="true"
        color="secondary"
        endIcon={<ExpandMore />}
        id={`${id}-button`}
        sx={{ backdropFilter: 'blur(8px)' }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {selected ? selected.label : label}
      </Button>
      <Menu
        disableScrollLock
        anchorEl={anchorEl}
        id={`${id}-menu`}
        open={isOpen}
        slotProps={{ list: { 'aria-labelledby': `${id}-button` } }}
        onClose={handleClose}
      >
        <MenuItem selected={value === null} onClick={() => handleSelect(null)}>
          {allLabel}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

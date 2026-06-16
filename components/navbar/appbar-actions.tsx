'use client'

import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import { Divider, ListSubheader, Menu, MenuItem, Tooltip } from '@mui/material'
import { Check, Edit, EditOff, Sort, SwitchLeft, SwitchRight } from '@mui/icons-material'
import { useProfileEdit } from '@/app/profile/profile-context'
import { useSortOrder, OutfitSortOrder } from '@/components/sort-context'

export function ProfileEditButton() {
  const context = useProfileEdit()
  if (!context) return null
  const { isEditing, setIsEditing } = context
  return (
    <IconButton
      aria-label={isEditing ? 'Cancel editing' : 'Edit profile'}
      onClick={() => setIsEditing(!isEditing)}
    >
      {isEditing ? <EditOff /> : <Edit />}
    </IconButton>
  )
}

export function SortButton() {
  const { sortOrder, toggleSort } = useSortOrder()
  const label = sortOrder === 'new' ? 'New to Old' : 'Old to New'

  return (
    <Tooltip title={`Sort: ${label}`}>
      <IconButton aria-label={`Sort ${label}`} onClick={toggleSort}>
        {sortOrder === 'new' ? (
          <SwitchRight sx={{ rotate: '90deg' }} />
        ) : (
          <SwitchLeft sx={{ rotate: '90deg' }} />
        )}
      </IconButton>
    </Tooltip>
  )
}

const OUTFIT_SORT_OPTIONS: { value: OutfitSortOrder; label: string; group: string }[] = [
  { value: 'rarity_desc', label: 'High to Low', group: 'Quality' },
  { value: 'rarity_asc', label: 'Low to High', group: 'Quality' },
  { value: 'progress_desc', label: 'High to Low', group: 'Progress' },
  { value: 'progress_asc', label: 'Low to High', group: 'Progress' },
]

export function OutfitSortMenu() {
  const { outfitSortOrder, setOutfitSortOrder } = useSortOrder()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  function handleSelect(value: OutfitSortOrder) {
    setOutfitSortOrder(value)
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title="Sort">
        <IconButton aria-label="Sort options" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Sort />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        slotProps={{ list: { dense: true } }}
        onClose={() => setAnchorEl(null)}
      >
        <ListSubheader disableSticky sx={{ lineHeight: '32px' }}>
          Quality
        </ListSubheader>
        {OUTFIT_SORT_OPTIONS.filter((o) => o.group === 'Quality').map((option) => (
          <MenuItem
            key={option.value}
            selected={outfitSortOrder === option.value}
            sx={{ gap: 1 }}
            onClick={() => handleSelect(option.value)}
          >
            {outfitSortOrder === option.value ? (
              <Check fontSize="small" />
            ) : (
              <Check fontSize="small" sx={{ visibility: 'hidden' }} />
            )}
            {option.label}
          </MenuItem>
        ))}
        <Divider />
        <ListSubheader disableSticky sx={{ lineHeight: '32px' }}>
          Progress
        </ListSubheader>
        {OUTFIT_SORT_OPTIONS.filter((o) => o.group === 'Progress').map((option) => (
          <MenuItem
            key={option.value}
            selected={outfitSortOrder === option.value}
            sx={{ gap: 1 }}
            onClick={() => handleSelect(option.value)}
          >
            {outfitSortOrder === option.value ? (
              <Check fontSize="small" />
            ) : (
              <Check fontSize="small" sx={{ visibility: 'hidden' }} />
            )}
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

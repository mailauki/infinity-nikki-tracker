'use client'

import IconButton from '@mui/material/IconButton'
import { Tooltip } from '@mui/material'
import { Edit, EditOff, SwitchLeft, SwitchRight } from '@mui/icons-material'
import { useProfileEdit } from '@/app/profile/profile-context'
import { useSortOrder, SortAxis } from '@/components/sort-context'

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

// Direction labels per axis. `desc` is the first ("default") direction for each.
const DIR_LABELS: Record<SortAxis, { desc: string; asc: string }> = {
  date: { desc: 'New to Old', asc: 'Old to New' },
  rarity: { desc: 'High to Low', asc: 'Low to High' },
  progress: { desc: 'High to Low', asc: 'Low to High' },
  title: { desc: 'Z to A', asc: 'A to Z' },
}

export function SortButton() {
  const { sortAxis, sortDir, toggleSortDir } = useSortOrder()
  const label = DIR_LABELS[sortAxis][sortDir]

  return (
    <Tooltip title={`Sort: ${label}`}>
      <IconButton aria-label={`Sort ${label}`} onClick={toggleSortDir}>
        {sortDir === 'desc' ? (
          <SwitchRight sx={{ rotate: '90deg' }} />
        ) : (
          <SwitchLeft sx={{ rotate: '90deg' }} />
        )}
      </IconButton>
    </Tooltip>
  )
}

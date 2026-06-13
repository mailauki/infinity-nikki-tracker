'use client'

import IconButton from '@mui/material/IconButton'
import { Tooltip } from '@mui/material'
import { Edit, EditOff, SwitchLeft, SwitchRight } from '@mui/icons-material'
import { useProfileEdit } from '@/app/profile/profile-context'
import { useSortOrder } from '@/components/sort-context'

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

'use client'

import IconButton from '@mui/material/IconButton'
import { Tooltip } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { toTitle } from '@/lib/utils'
import { useProfileEdit } from '@/components/profile/profile-context'

export function EurekaSetEditButton({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  if (!isAdmin) return null
  return (
    <Tooltip title={`Edit ${toTitle(slug) || 'Eureka'} Set`}>
      <IconButton aria-label="Edit Eureka Set" href={`/eureka-set/edit/${slug}`}>
        <Edit />
      </IconButton>
    </Tooltip>
  )
}

export function TrialEditButton({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  if (!isAdmin) return null
  return (
    <Tooltip title={`Edit ${toTitle(slug) || 'Trial'}`}>
      <IconButton aria-label="Edit Trial" href={`/trial/edit/${slug}`}>
        <Edit />
      </IconButton>
    </Tooltip>
  )
}

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

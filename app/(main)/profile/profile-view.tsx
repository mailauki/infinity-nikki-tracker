'use client'

import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/components/forms/auth/avatar-preview'
import { Alert, Chip, Stack, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

export default function ProfileView({
  user,
  isAdmin = false,
  fullname,
  username,
  avatar_url,
  loadError,
}: {
  user: User | null
  isAdmin?: boolean
  fullname: string | null
  username: string | null
  avatar_url: string | null
  loadError: boolean
}) {
  if (loadError) {
    return <Alert severity="error">Could not load your profile. Please refresh the page.</Alert>
  }

  return (
    <Stack>
      {isAdmin && (
        <Stack alignItems="flex-end" justifyContent="flex-start">
          <Chip
            color="secondary"
            icon={<AdminPanelSettingsIcon />}
            label="Admin access"
            variant="outlined"
          />
        </Stack>
      )}

      <Stack alignItems="center" direction="row" spacing={2}>
        <AvatarPreview size="xl" url={avatar_url} />

        <Stack spacing={0.5}>
          <Typography variant="h6">{fullname ?? '—'}</Typography>
          <Typography color="textSecondary" variant="body2">
            @{username ?? '—'}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {user?.email}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  )
}

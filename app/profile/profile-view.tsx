'use client'

import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/components/forms/auth/avatar-preview'
import { Alert, Button, Chip, Stack, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { Dashboard } from '@mui/icons-material'
import Link from 'next/link'

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
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <Chip
            color="secondary"
            icon={<AdminPanelSettingsIcon />}
            label="Admin access"
            variant="outlined"
          />
          <Button
            component={Link}
            href="/dashboard"
            size="small"
            startIcon={<Dashboard />}
            variant="outlined"
          >
            Dashboard
          </Button>
        </Stack>
      )}

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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

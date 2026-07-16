'use client'

import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/app/settings/avatar-preview'
import { Alert, Stack, Tooltip, Typography } from '@mui/material'
import { Verified } from '@mui/icons-material'

export default function ProfileCard({
  user,
  fullname,
  username,
  avatar_url,
  loadError,
  isPremium,
}: {
  user: User | null
  fullname: string | null
  username: string | null
  avatar_url: string | null
  loadError: boolean
  isPremium?: boolean
}) {
  if (loadError) {
    return <Alert severity="error">Could not load your profile. Please refresh the page.</Alert>
  }

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <AvatarPreview size="xl" url={avatar_url} />

      <Stack spacing={0.5}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6">{fullname ?? '—'}</Typography>
          {isPremium && (
            <Tooltip title="Verified supporter">
              <Verified color="primary" />
            </Tooltip>
          )}
        </Stack>
        <Typography color="textSecondary" variant="body2">
          @{username ?? '—'}
        </Typography>
        <Typography color="textSecondary" variant="body2">
          {user?.email}
        </Typography>
      </Stack>
    </Stack>
  )
}

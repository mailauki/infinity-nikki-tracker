'use client'

import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/app/settings/avatar-preview'
import { Alert, Chip, Stack, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

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
            <Chip
              color="primary"
              icon={<AutoAwesomeIcon fontSize="small" />}
              label="Supporter"
              size="small"
              variant="outlined"
            />
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

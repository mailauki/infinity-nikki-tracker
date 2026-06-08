'use client'

import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/app/settings/avatar-preview'
import { Alert, Stack, Typography } from '@mui/material'

export default function ProfileView({
  user,
  fullname,
  username,
  avatar_url,
  loadError,
}: {
  user: User | null
  fullname: string | null
  username: string | null
  avatar_url: string | null
  loadError: boolean
}) {
  if (loadError) {
    return <Alert severity="error">Could not load your profile. Please refresh the page.</Alert>
  }

  return (
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
  )
}

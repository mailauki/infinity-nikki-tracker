'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/components/forms/auth/avatar-preview'
import { Alert, Chip, Stack, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

export default function ProfileView({
  user,
  isAdmin = false,
}: {
  user: User | null
  isAdmin?: boolean
}) {
  const supabase = useMemo(() => createClient(), [])
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  const getProfile = useCallback(async () => {
    if (!user) return
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, avatar_url`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setLoadError(true)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [getProfile])

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

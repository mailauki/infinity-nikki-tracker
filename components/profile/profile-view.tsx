'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarPreview from '@/components/forms/auth/avatar-preview'
import { Alert, Button, Chip, Stack, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DashboardIcon from '@mui/icons-material/Dashboard'

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
    return (
      <Alert severity="error">Could not load your profile. Please refresh the page.</Alert>
    )
  }

  return (
    <div className="mb-4 flex w-full flex-wrap justify-between gap-4">
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

      <Stack alignItems="flex-end" justifyContent="flex-start" spacing={1} sx={{ mt: 2 }}>
        {isAdmin ? (
          <>
            <Chip
              color="secondary"
              icon={<AdminPanelSettingsIcon />}
              label="Admin access"
              variant="outlined"
            />
            <Button href="/dashboard" size="small" startIcon={<DashboardIcon />} variant="outlined">
              Go to Dashboard
            </Button>
          </>
        ) : (
          <Alert
            action={
              <Button
                color="inherit"
                href="mailto:julie.ux.dev@gmail.com?subject=Admin%20Access%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20admin%20access%20for%20the%20Infinity%20Nikki%20Tracker."
                size="small"
              >
                Request access
              </Button>
            }
            severity="info"
          >
            You don&apos;t have admin access.
          </Alert>
        )}
      </Stack>
    </div>
  )
}

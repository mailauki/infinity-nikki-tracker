'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarUpload from './avatar-upload'
import ProfileView from '@/components/profile/profile-view'
import { Alert, Button, Chip, Container, Stack, TextField } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useProfileEdit } from '@/components/profile/profile-context'

export default function ProfileForm({
  user,
  isAdmin = false,
}: {
  user: User | null
  isAdmin?: boolean
}) {
  const profileEdit = useProfileEdit()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, avatar_url`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) throw error

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [getProfile])

  async function updateProfile({
    username,
    avatar_url,
  }: {
    username: string | null
    fullname: string | null
    avatar_url: string | null
  }) {
    try {
      setLoading(true)

      const { error } = await supabase.from('profiles').upsert({
        id: user?.id as string,
        full_name: fullname,
        username,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      profileEdit!.setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!profileEdit?.isEditing) {
    return (
      <ProfileView
        avatar_url={avatar_url}
        fullname={fullname}
        isAdmin={isAdmin}
        loadError={loadError}
        user={user}
        username={username}
      />
    )
  }

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

      <Stack alignItems="flex-start" spacing={2}>
        <AvatarUpload
          uid={user?.id ?? null}
          url={avatar_url}
          onUpload={(url) => {
            setAvatarUrl(url)
            updateProfile({ fullname, username, avatar_url: url })
          }}
        />

        <Container disableGutters maxWidth="sm">
          <Stack component="form">
            <TextField
              disabled
              id="email"
              label="Email"
              margin="normal"
              placeholder="Email"
              type="email"
              value={user?.email}
            />

            <TextField
              id="fullName"
              label="Full Name"
              margin="normal"
              type="text"
              value={fullname || ''}
              onChange={(event) => setFullname(event.target.value)}
            />

            <TextField
              id="username"
              label="Username"
              margin="normal"
              type="text"
              value={username || ''}
              onChange={(event) => setUsername(event.target.value)}
            />

            {saveError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                Failed to save profile. Please try again.
              </Alert>
            )}

            <Button
              fullWidth
              disabled={loading}
              size="large"
              sx={{ my: 2 }}
              variant="contained"
              onClick={() => updateProfile({ fullname, username, avatar_url })}
            >
              {loading ? 'Loading ...' : 'Update'}
            </Button>
          </Stack>
        </Container>
      </Stack>
    </Stack>
  )
}

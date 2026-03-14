'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarUpload from './avatar-upload'
import ProfileView from '@/components/profile/profile-view'
import { Alert, Button, Chip, Stack, TextField } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DashboardIcon from '@mui/icons-material/Dashboard'
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
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, avatar_url`)
        .eq('id', user!.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert('Error loading user data!')
      console.log(error)
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
      alert('Error updating the data!')
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  if (!profileEdit?.isEditing) {
    return <ProfileView isAdmin={isAdmin} user={user} />
  }

  return (
    <>
      <div className="mb-4 flex w-full flex-wrap justify-between gap-4">
        <AvatarUpload
          uid={user?.id ?? null}
          url={avatar_url}
          onUpload={(url) => {
            setAvatarUrl(url)
            updateProfile({ fullname, username, avatar_url: url })
          }}
        />

        <Stack
          alignItems="flex-end"
          justifyContent="flex-start"
          spacing={1}
          sx={{ mt: 2, maxWidth: 'sm' }}
        >
          {isAdmin ? (
            <>
              <Chip
                color="secondary"
                icon={<AdminPanelSettingsIcon />}
                label="Admin access"
                variant="outlined"
              />
              <Button
                href="/dashboard"
                size="small"
                startIcon={<DashboardIcon />}
                variant="outlined"
              >
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
      <div className="w-full max-w-sm">
        <form className="flex flex-col">
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
        </form>
      </div>
    </>
  )
}

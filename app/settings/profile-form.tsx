'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarUpload from './avatar-upload'
import { Alert, Button, Chip, Snackbar, Stack, TextField, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

export default function ProfileForm({
  user,
  isAdmin = false,
}: {
  user: User | null
  isAdmin?: boolean
}) {
  const supabase = useRef(createClient()).current
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error, status }) => {
        if (error && status !== 406) {
          setLoadError(true)
        } else if (data) {
          setFullname(data.display_name)
          setUsername(data.username)
          setAvatarUrl(data.avatar_url)
        }
        setLoading(false)
      })
  }, [user?.id])

  async function saveProfile(updates: {
    fullname: string | null
    username: string | null
    avatar_url: string | null
  }) {
    if (!user?.id) return
    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.fullname,
          username: updates.username,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (error) throw error
      setSaveSuccess(true)
    } catch (err) {
      console.error('saveProfile error:', err)
      setSaveError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (!event.target.files?.length || !user?.id) return
    try {
      setUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Math.random()}.${fileExt}`
      const { error } = await supabase.storage.from('avatars').upload(filePath, file)
      if (error) throw error
      setAvatarUrl(filePath)
      await saveProfile({ fullname, username, avatar_url: filePath })
    } catch (err) {
      console.error('Avatar upload error:', err)
      setSaveError(true)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (loadError) {
    return <Alert severity="error">Could not load your profile. Please refresh the page.</Alert>
  }

  return (
    <Stack spacing={2}>
      {isAdmin && (
        <Stack sx={{ alignItems: 'flex-end' }}>
          <Chip
            color="secondary"
            icon={<AdminPanelSettingsIcon />}
            label="Admin access"
            variant="outlined"
          />
        </Stack>
      )}

      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <AvatarUpload inputRef={fileInputRef} uploading={uploading} url={avatar_url} />
        <input
          ref={fileInputRef}
          accept="image/*"
          disabled={uploading}
          style={{ display: 'none' }}
          type="file"
          onChange={handleAvatarChange}
        />
        <Stack spacing={3}>
          <Typography variant="subtitle1">Profile picture</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              disabled={uploading}
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            {avatar_url && (
              <Button
                color="inherit"
                onClick={() => {
                  setAvatarUrl(null)
                  saveProfile({ fullname, username, avatar_url: null })
                }}
              >
                Remove
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Stack component="form" spacing={0}>
        <TextField
          disabled
          id="email"
          label="Email"
          margin="normal"
          type="email"
          value={user?.email ?? ''}
        />
        <TextField
          id="displayName"
          label="Display Name"
          margin="normal"
          type="text"
          value={fullname ?? ''}
          onChange={(e) => setFullname(e.target.value)}
        />
        <TextField
          id="username"
          label="Username"
          margin="normal"
          type="text"
          value={username ?? ''}
          onChange={(e) => setUsername(e.target.value)}
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
          onClick={() => saveProfile({ fullname, username, avatar_url })}
        >
          {loading ? 'Loading…' : 'Update'}
        </Button>
      </Stack>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'left' }} autoHideDuration={6000} open={saveSuccess} onClose={() => setSaveSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%' }} variant="filled">
          Profile saved successfully!
        </Alert>
      </Snackbar>
    </Stack>
  )
}

'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarUpload from './avatar-upload'
import { Alert, Button, ButtonBase, Chip, Stack, TextField, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { enqueueSnackbar } from 'notistack'
import { fileToWebp } from '@/lib/image-to-webp'
import LazyImage from '@/components/lazy-image'
import { DEFAULT_BANNER } from '@/app/profile/profile-card'

// Both profile images live in the `avatars` bucket; the kind doubles as the
// object's base name and the `{kind}_url` column it writes.
type ProfileImageKind = 'avatar' | 'banner'

// Mirrors the profiles_username_charset CHECK constraint. The handle is a URL
// segment (/u/[username]), so anything needing percent-encoding is rejected.
// This is for feedback only — the database is what actually enforces it.
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/

export default function ProfileForm({
  user,
  isAdmin = false,
  isPremium = false,
}: {
  user: User | null
  isAdmin?: boolean
  isPremium?: boolean
}) {
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [banner_url, setBannerUrl] = useState<string | null>(null)

  // Derived during render rather than mirrored into state — see CLAUDE.md.
  const usernameError =
    username && !USERNAME_PATTERN.test(username)
      ? 'Only letters, numbers, and underscores are allowed.'
      : null

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('display_name, username, avatar_url, banner_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error, status }) => {
        if (error && status !== 406) {
          setLoadError(true)
        } else if (data) {
          setDisplayName(data.display_name)
          setUsername(data.username)
          setAvatarUrl(data.avatar_url)
          setBannerUrl(data.banner_url)
        }
        setLoading(false)
      })
  }, [user, supabase])

  // avatar_url/banner_url are optional so a text-only save leaves the images
  // untouched rather than nulling whichever one wasn't passed.
  async function saveProfile(updates: {
    displayName: string | null
    username: string | null
    avatar_url?: string | null
    banner_url?: string | null
  }) {
    if (!user?.id) return
    // An image upload also routes through here carrying the current username.
    // If the field is mid-edit and invalid, sending it would fail the DB
    // constraint and lose the upload — omit it and let the save proceed.
    const usernameIsValid = !updates.username || USERNAME_PATTERN.test(updates.username)
    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          ...(usernameIsValid ? { username: updates.username } : {}),
          ...('avatar_url' in updates ? { avatar_url: updates.avatar_url } : {}),
          ...('banner_url' in updates ? { banner_url: updates.banner_url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (error) throw error
      enqueueSnackbar('Profile saved successfully!', { variant: 'success' })
    } catch (err) {
      console.error('saveProfile error:', err)
      setSaveError(true)
    } finally {
      setLoading(false)
    }
  }

  // Avatar and banner differ only by object name and which column they write,
  // so both share one upload path. `kind` is also the file's base name, giving
  // the stable {user_id}/{kind}.webp the bucket's no-orphan guarantee relies on.
  const uploadImage = async (kind: ProfileImageKind, file: File) => {
    if (!user?.id) return
    const setUrl = kind === 'avatar' ? setAvatarUrl : setBannerUrl
    try {
      setUploading(true)
      // Re-encode to WebP so every object in the bucket has a consistent
      // `.webp` extension and content type, matching the `images` bucket.
      const webp = await fileToWebp(file, kind)
      // One stable object per user per kind: a re-upload upserts over the
      // previous image instead of orphaning it. Because the extension is fixed
      // too, no explicit removal of a prior path is needed.
      const filePath = `${user.id}/${kind}.webp`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, webp, { upsert: true, contentType: 'image/webp' })
      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      // The public URL is stable across re-uploads, so bust the CDN/browser
      // cache with the upload time — otherwise the new image looks unchanged.
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`

      setUrl(publicUrl)
      await saveProfile({ displayName, username, [`${kind}_url`]: publicUrl })
    } catch (err) {
      console.error(`${kind} upload error:`, err)
      setSaveError(true)
    } finally {
      setUploading(false)
    }
  }

  // Clearing an image deletes the storage object too — leaving it behind is
  // exactly the orphan the stable `{kind}.webp` path exists to prevent.
  const removeImage = async (kind: ProfileImageKind) => {
    if (!user?.id) return
    const setUrl = kind === 'avatar' ? setAvatarUrl : setBannerUrl
    try {
      setUploading(true)
      const { error } = await supabase.storage.from('avatars').remove([`${user.id}/${kind}.webp`])
      if (error) throw error
      setUrl(null)
      await saveProfile({ displayName, username, [`${kind}_url`]: null })
    } catch (err) {
      console.error(`${kind} remove error:`, err)
      setSaveError(true)
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput =
    (kind: ProfileImageKind): React.ChangeEventHandler<HTMLInputElement> =>
    async (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      await uploadImage(kind, file)
      event.target.value = ''
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
          onChange={handleFileInput('avatar')}
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
              <Button color="inherit" disabled={uploading} onClick={() => removeImage('avatar')}>
                Remove
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1">Profile banner</Typography>
          {!isPremium && (
            <Typography color="primary" variant="caption">
              Premium
            </Typography>
          )}
        </Stack>
        <Typography color="textSecondary" variant="body2">
          Shown behind your profile card. Leave empty to use the default artwork.
        </Typography>
        {/* 2:1 preview so the crop matches roughly what the profile hero shows. */}
        <ButtonBase
          aria-label="Upload banner image"
          disabled={uploading || !isPremium}
          sx={{
            borderRadius: 1,
            overflow: 'hidden',
            aspectRatio: '2 / 1',
            maxWidth: 400,
            '&:focus-visible': { outline: '2px solid', outlineOffset: '2px' },
            '&.Mui-disabled': { opacity: 0.6 },
          }}
          onClick={() => bannerInputRef.current?.click()}
        >
          <LazyImage
            image={banner_url || DEFAULT_BANNER}
            kind="media"
            sx={{ width: '100%', height: '100%', '& img': { objectPosition: 'center' } }}
          />
        </ButtonBase>
        <input
          ref={bannerInputRef}
          accept="image/*"
          disabled={uploading || !isPremium}
          style={{ display: 'none' }}
          type="file"
          onChange={handleFileInput('banner')}
        />
        <Stack direction="row" spacing={2}>
          <Button
            disabled={uploading || !isPremium}
            variant="outlined"
            onClick={() => bannerInputRef.current?.click()}
          >
            Upload
          </Button>
          {banner_url && (
            <Button
              color="inherit"
              disabled={uploading || !isPremium}
              onClick={() => removeImage('banner')}
            >
              Remove
            </Button>
          )}
        </Stack>
        {!isPremium && (
          <Typography color="textSecondary" variant="caption">
            Set a custom profile banner with a one-time premium upgrade.
          </Typography>
        )}
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
          value={displayName ?? ''}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          error={Boolean(usernameError)}
          helperText={usernameError ?? 'Letters, numbers, and underscores only.'}
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
          disabled={loading || Boolean(usernameError)}
          size="large"
          sx={{ my: 2 }}
          variant="contained"
          onClick={() => saveProfile({ displayName, username })}
        >
          {loading ? 'Loading…' : 'Update'}
        </Button>
      </Stack>
    </Stack>
  )
}

'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import AvatarUpload from './avatar-upload'
import { Button, TextField } from '@mui/material'
import { LogOut } from 'lucide-react'

export default function ProfileForm({ user }: { user: User | null }) {
  const supabase = createClient()
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
  }, [user, getProfile])

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
      alert('Profile updated!')
    } catch (error) {
      alert('Error updating the data!')
      console.log(error)
    } finally {
      setLoading(false)
    }
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

        <div>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outlined"
						startIcon={<LogOut fontSize="small" />}>
              Log out
            </Button>
          </form>
        </div>
      </div>
      <div className="w-full max-w-sm">
        <form className="flex flex-col">
          <TextField
            label="Email"
            id="email"
            type="email"
            margin="normal"
            placeholder="Email"
            value={user?.email}
            disabled
          />

          <TextField
            label="Full Name"
            id="fullName"
            type="text"
            margin="normal"
            value={fullname || ''}
            onChange={(event) => setFullname(event.target.value)}
          />

          <TextField
            label="Userame"
            id="username"
            type="text"
            margin="normal"
            value={username || ''}
            onChange={(event) => setUsername(event.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => updateProfile({ fullname, username, avatar_url })}
            disabled={loading}
            sx={{ my: 2 }}
          >
            {loading ? 'Loading ...' : 'Update'}
          </Button>
        </form>
      </div>
    </>
  )
}

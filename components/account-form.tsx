'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { Field, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Button } from './ui/button'
import AvatarUpload from './avatar-upload'
import { LogOut } from 'lucide-react'

export default function AccountForm({ user }: { user: User | null }) {
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
    <div className="mx-auto w-full max-w-sm px-2">
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
            <Button type="submit" variant="outline">
              <LogOut />
              Log out
            </Button>
          </form>
        </div>
      </div>

      <form className="flex flex-col gap-4">
        <Field data-disabled>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="Email" value={user?.email} disabled />
        </Field>

        <Field>
          <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
          <Input
            id="fullName"
            type="text"
            value={fullname || ''}
            onChange={(e) => setFullname(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <div className="my-2 w-full">
          <Button
            className="w-full"
            variant="default"
            onClick={() => updateProfile({ fullname, username, avatar_url })}
            disabled={loading}
          >
            {loading ? 'Loading ...' : 'Update'}
          </Button>
        </div>
      </form>
    </div>
  )
}

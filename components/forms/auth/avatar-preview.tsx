'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@mui/material'

export default function AvatarPreview({
  size = 'sm',
  url,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  url: string | null
}) {
  const supabase = useMemo(() => createClient(), [])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)

  useEffect(() => {
    let objectUrl: string | null = null

    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path)
        if (error) {
          throw error
        }

        objectUrl = URL.createObjectURL(data)
        setAvatarUrl(objectUrl)
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, supabase])

  return <Avatar alt="Avatar" size={size} src={avatarUrl!} />
}

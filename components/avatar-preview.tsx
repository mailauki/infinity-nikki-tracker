'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Avatar } from '@mui/material'

const largeSize = 140

export default function AvatarPreview({ size, url }: { size?: 'large'; url: string | null }) {
  const supabase = createClient()
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

  if (size === 'large') {
    return <Avatar src={avatarUrl!} alt="Avatar" sx={{ width: largeSize, height: largeSize }} />
  }

  return <Avatar src={avatarUrl!} alt="Avatar" />
}

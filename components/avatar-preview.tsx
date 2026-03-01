import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Avatar } from '@mui/material'

export default function AvatarPreview({ size, url }: { size?: 'large'; url: string | null }) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path)
        if (error) {
          throw error
        }

        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url, supabase])

  if (size === 'large') {
    return <Avatar src={avatarUrl!} alt="Avatar" sx={{ width: 140, height: 140 }} />
  }

  return <Avatar src={avatarUrl!} alt="Avatar" />
}

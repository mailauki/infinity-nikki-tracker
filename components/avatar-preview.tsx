import { Camera, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

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

  return (
    <Avatar className={`${size === 'large' ? 'size-40' : 'size-8'} rounded-lg`}>
      <AvatarImage src={avatarUrl!} alt="Avatar" />
      <AvatarFallback className="rounded-lg">
        {size === 'large' ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-card">
            <Camera className="size-6 text-foreground" />
          </div>
        ) : (
          <UserIcon size={16} />
        )}
      </AvatarFallback>
    </Avatar>
  )
}

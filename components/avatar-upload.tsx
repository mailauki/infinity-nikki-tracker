'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Camera } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

export default function AvatarUpload({
  uid,
  url,
  onUpload,
}: {
  uid: string | null
  url: string | null
  onUpload: (url: string) => void
}) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

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

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      onUpload(filePath)
    } catch (error) {
      alert('Error uploading avatar!')
			console.log(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Avatar className="my-2 size-40 rounded-lg">
        <AvatarImage src={avatarUrl!} alt="Avatar" />
        <AvatarFallback className="rounded-lg">
          <div className="flex h-full w-full flex-col items-center justify-center bg-card">
            <Camera className="size-6 text-foreground" />
          </div>
        </AvatarFallback>
      </Avatar>
      <label htmlFor="avatar">
        <Input
          className="hidden"
          type="file"
          id="avatar"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
        <Button asChild className="w-40">
          <label htmlFor="avatar">{uploading ? 'Uploading...' : 'Upload Avatar'}</label>
        </Button>
      </label>
</div>
  )
}

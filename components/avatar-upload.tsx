'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from './ui/input'
import { Button } from './ui/button'
import AvatarPreview from './avatar-preview'

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
  const [uploading, setUploading] = useState(false)

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
      <AvatarPreview url={url} size="large" />
      <label htmlFor="avatar">
        <Input
          className="hidden"
          type="file"
          id="avatar"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
        <Button asChild className="my-2 w-40">
          <label htmlFor="avatar">{uploading ? 'Uploading...' : 'Upload Avatar'}</label>
        </Button>
      </label>
    </div>
  )
}

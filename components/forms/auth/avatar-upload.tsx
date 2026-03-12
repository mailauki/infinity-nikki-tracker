'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AvatarPreview from './avatar-preview'
import { ButtonBase } from '@mui/material'

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
    <ButtonBase
      aria-label="Avatar image"
      component="label"
      role={undefined}
      sx={{
        borderRadius: '100px',
        '&:has(:focus-visible)': {
          outline: '2px solid',
          outlineOffset: '2px',
        },
      }}
      tabIndex={-1} // prevent label from tab focus
    >
      <AvatarPreview size="xl" url={url} />
      <input
        accept="image/*"
        disabled={uploading}
        id="avatar"
        style={{
          border: 0,
          clip: 'rect(0 0 0 0)',
          height: '1px',
          margin: '-1px',
          overflow: 'hidden',
          padding: 0,
          position: 'absolute',
          whiteSpace: 'nowrap',
          width: '1px',
        }}
        type="file"
        onChange={uploadAvatar}
      />
    </ButtonBase>
  )
}

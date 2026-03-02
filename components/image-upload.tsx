'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, Box, ButtonBase, CircularProgress } from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'

const SIZE = 140

export default function ImageUpload({
  url,
  bucket,
  onUpload,
}: {
  url: string | null
  bucket: string
  onUpload: (url: string) => void
}) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  const uploadImage: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      onUpload(data.publicUrl)
    } catch (error) {
      alert('Error uploading image!')
      console.log(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ButtonBase
      component="label"
      role={undefined}
      tabIndex={-1}
      aria-label="Upload image"
      sx={{
        borderRadius: 1,
        '&:has(:focus-visible)': {
          outline: '2px solid',
          outlineOffset: '2px',
        },
      }}
    >
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        <Avatar
          src={url ?? undefined}
          alt="Image preview"
          variant="rounded"
          sx={{ width: SIZE, height: SIZE }}
        >
          <ImageIcon fontSize="large" />
        </Avatar>
        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              bgcolor: 'action.disabledBackground',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
      </Box>
      <input
        type="file"
        accept="image/*"
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
        onChange={uploadImage}
        disabled={uploading}
      />
    </ButtonBase>
  )
}

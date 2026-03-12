'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, Box, ButtonBase, CircularProgress } from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'

const SIZE = 140

export default function ImageUpload({
  url,
  table,
  slug,
  onUpload,
}: {
  url: string | null
  table?: 'eureka_variants' | 'trials'
  slug?: string
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
      if (!table || !slug) throw new Error('Table and slug are required to upload an image.')
      const filePath = `${table}/${slug}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)

      if (table && slug) {
        const { error: dbError } = await supabase
          .from(table)
          .update({ image_url: data.publicUrl })
          .eq('slug', slug)
        if (dbError) throw dbError
      }

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
      aria-label="Upload image"
      component="label"
      role={undefined}
      sx={{
        borderRadius: 1,
        '&:has(:focus-visible)': {
          outline: '2px solid',
          outlineOffset: '2px',
        },
        width: table === 'trials' ? '100%' : SIZE,
        height: SIZE,
      }}
      tabIndex={-1}
    >
      <Box sx={{ position: 'relative', width: table === 'trials' ? '100%' : SIZE, height: SIZE }}>
        <Avatar
          alt="Image preview"
          src={url ?? undefined}
          sx={{ width: table === 'trials' ? '100%' : SIZE, height: SIZE }}
          variant="rounded"
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
        accept="image/*"
        disabled={uploading}
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
        onChange={uploadImage}
      />
    </ButtonBase>
  )
}

'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'
import FileUploadIcon from '@mui/icons-material/FileUpload'

const SIZE = 90
const TRIAL_SIZE = 180

export default function ImageUpload({
  url,
  table,
  slug,
  onUpload,
  caption,
}: {
  url: string | null
  table?: 'eureka_variants' | 'trials'
  slug?: string
  onUpload: (url: string) => void
  caption?: string
}) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  const isTrial = table === 'trials'
  const w = isTrial ? '100%' : SIZE
  const h = isTrial ? TRIAL_SIZE : SIZE

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

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from(table)
        .update({ image_url: data.publicUrl })
        .eq('slug', slug)
      if (dbError) throw dbError

      onUpload(data.publicUrl)
    } catch (error) {
      alert('Error uploading image!')
      console.log(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card sx={{ minWidth: 'fit-content' }}>
      <CardActionArea
        component="label"
        sx={{
          position: 'relative',
          '& .upload-overlay': {
            opacity: uploading ? 1 : 0,
            transition: 'opacity 0.2s',
          },
          '&:hover .upload-overlay': { opacity: 1 },
        }}
      >
        <Stack alignItems="center">
          <Avatar
            alt="Image preview"
            src={url ?? undefined}
            sx={{ width: w, height: h }}
            variant="rounded"
          >
            <ImageIcon fontSize="large" />
          </Avatar>
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
        </Stack>
        {caption && (
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ py: 0.75, px: 1.25 }}
          >
            <Typography color="textSecondary" variant="caption">
              {caption}
            </Typography>
          </Stack>
        )}
        <Box
          className="upload-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.disabledBackground',
            borderRadius: 'inherit',
						color: 'surface.containerLowest'
          }}
        >
          {uploading ? <CircularProgress size={32} /> : <FileUploadIcon fontSize="large" />}
        </Box>
      </CardActionArea>
    </Card>
  )
}

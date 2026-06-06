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
  column = 'image_url',
}: {
  url: string | null
  table: 'eureka_variants' | 'outfit_variants' | 'trials' | 'outfit_sets' | 'evolutions'
  slug: string | undefined
  onUpload: (url: string) => void
  caption?: string
  column?: string
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
      if (!slug) throw new Error('Cannot upload image: record has no slug yet.')
      const fileExt = file.name.split('.').pop()
      const filePath = `${table}/${slug}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ [column]: data.publicUrl } as any)
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
    <Card sx={{ minWidth: 'fit-content', flexGrow: 1 }}>
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
        <Stack sx={{ alignItems: 'center' }}>
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
            direction="row"
            sx={{ py: 0.75, px: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
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
            color: 'surface.containerLowest',
          }}
        >
          {uploading ? <CircularProgress size={32} /> : <FileUploadIcon fontSize="large" />}
        </Box>
      </CardActionArea>
    </Card>
  )
}

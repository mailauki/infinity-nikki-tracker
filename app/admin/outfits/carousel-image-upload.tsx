'use client'

import React, { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Box,
  Card,
  CardActionArea,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { AddPhotoAlternate, Delete } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'
import { CarouselImage } from '@/lib/types/outfit'

export default function CarouselImageUpload({
  slug,
  table,
  images,
  onChange,
}: {
  slug: string
  table: 'outfit_set_carousel_images'
  images: CarouselImage[]
  onChange: (images: CarouselImage[]) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadImage: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${table}/${slug}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: false })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      const nextOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0

      const { data: row, error } = await supabase
        .from('outfit_set_carousel_images')
        .insert({ outfit_set: slug, image_url: data.publicUrl, sort_order: nextOrder })
        .select('id, image_url, sort_order')
        .single()
      if (error) throw error

      onChange([...images, row])
    } catch {
      enqueueSnackbar('Error uploading gallery image!', { variant: 'error' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const deleteImage = async (img: CarouselImage) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', img.id)
      if (error) throw error
      onChange(images.filter((i) => i.id !== img.id))
    } catch {
      enqueueSnackbar('Error deleting gallery image!', { variant: 'error' })
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 1,
      }}
    >
      {images.map((img) => (
        <Box key={img.id} sx={{ position: 'relative' }}>
          <Card sx={{ aspectRatio: '9 / 16', overflow: 'hidden' }}>
            <Box
              alt=""
              component="img"
              src={img.image_url}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Card>
          <Tooltip title="Remove">
            <IconButton
              aria-label="Remove gallery image"
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'background.paper',
                opacity: 0.85,
                '&:hover': { opacity: 1 },
              }}
              onClick={() => deleteImage(img)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ))}

      <Card
        sx={{
          aspectRatio: '9 / 16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 80,
        }}
      >
        <CardActionArea
          component="label"
          disabled={uploading}
          sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {uploading ? (
            <CircularProgress size={24} />
          ) : (
            <Stack sx={{ alignItems: 'center', gap: 0.5 }}>
              <AddPhotoAlternate color="action" />
              <Typography color="textSecondary" variant="caption">
                Add
              </Typography>
            </Stack>
          )}
          <input
            ref={inputRef}
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
        </CardActionArea>
      </Card>
    </Box>
  )
}

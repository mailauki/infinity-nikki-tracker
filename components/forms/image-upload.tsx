'use client'
import React, { useMemo, useState } from 'react'
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
import { AvatarSize } from '@/lib/types/props'
import { fileToWebp } from '@/lib/image-to-webp'
import { enqueueSnackbar } from 'notistack'

export type ImageUploadTable =
  | 'eureka_variants'
  | 'outfit_variants'
  | 'trials'
  | 'outfit_sets'
  | 'abilities'
  | 'seasons'
  | 'season_categories'
  | 'custom_looks'

export default function ImageUpload({
  url,
  table,
  slug,
  onUpload,
  caption,
  column = 'image_url',
  size = 'md',
}: {
  url: string | null
  table: ImageUploadTable
  slug: string | undefined
  onUpload: (url: string) => void
  caption?: string
  column?: string
  size?: AvatarSize
}) {
  const supabase = useMemo(() => createClient(), [])
  const [uploading, setUploading] = useState(false)

  const isTrial = table === 'trials'
  const isSeason = table === 'seasons'
  const isFullWidth = isTrial || isSeason

  const uploadImage: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      if (!slug) throw new Error('Cannot upload image: record has no slug yet.')
      // Re-encode to WebP so every object in the bucket has a consistent
      // `.webp` extension and content type.
      const file = await fileToWebp(event.target.files[0], column)
      // Stable path per record+column so a re-upload overwrites the same object
      // instead of orphaning the previous one. Default and alt live in the same
      // slug folder but differ by `column` (image_url vs alt_image_url).
      const folder = `${table}/${slug}`
      const filePath = `${folder}/${column}.webp`

      // Remove the object this column currently points at (if any) before the new
      // upload, so we don't orphan it. This covers the legacy UUID-named files and
      // a stable file whose extension is changing. We key off the current DB value
      // (`url`) rather than listing the folder, because default and alt share the
      // folder and only the DB columns say which object belonged to which.
      let prevPath: string | undefined
      try {
        if (url) prevPath = decodeURIComponent(new URL(url).pathname).split('/images/')[1]
      } catch {
        prevPath = undefined
      }
      if (prevPath && prevPath !== filePath) {
        await supabase.storage.from('images').remove([prevPath])
      }

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      // The public URL is stable across re-uploads, so bust the CDN/browser
      // cache with the upload time — otherwise the replaced image looks unchanged.
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`

      const { error: dbError } = await supabase
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ [column]: publicUrl } as any)
        .eq('slug', slug)
      if (dbError) throw dbError

      onUpload(publicUrl)
    } catch {
      enqueueSnackbar('Error uploading image!', { variant: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card sx={{ minWidth: 'fit-content', flexGrow: 1 }} variant="outlined">
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
        <Stack sx={{ alignItems: 'center', pt: 1, px: 1 }}>
          <Avatar
            alt="Image preview"
            size={size}
            src={url ?? undefined}
            sx={isFullWidth ? { width: '100%' } : undefined}
            variant="rounded"
          >
            <ImageIcon fontSize="inherit" />
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
          {uploading ? (
            <CircularProgress size={32} />
          ) : (
            <FileUploadIcon fontSize={size === 'md' ? 'large' : 'medium'} />
          )}
        </Box>
      </CardActionArea>
    </Card>
  )
}

'use client'

import { Box, Stack } from '@mui/material'
import { AvatarSize } from '@/lib/types/props'
import ImageUpload, { ImageUploadTable } from '@/components/forms/image-upload'

export default function ImageUploadPair({
  table,
  slug,
  image,
  altImage,
  onImageChange,
  onAltImageChange,
  size = 'lg',
  hiddenInputName,
}: {
  table: ImageUploadTable
  slug: string | undefined
  image: string | null
  altImage: string | null
  onImageChange: (url: string) => void
  onAltImageChange: (url: string) => void
  size?: AvatarSize
  hiddenInputName?: string
}) {
  return (
    <Box sx={{ pb: 1 }}>
      {hiddenInputName && <input name={hiddenInputName} type="hidden" value={image ?? ''} />}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
        <ImageUpload
          caption="Default"
          size={size}
          slug={slug}
          table={table}
          url={image}
          onUpload={onImageChange}
        />
        <ImageUpload
          caption="Alternative"
          column="alt_image_url"
          size={size}
          slug={slug}
          table={table}
          url={altImage}
          onUpload={onAltImageChange}
        />
      </Stack>
    </Box>
  )
}

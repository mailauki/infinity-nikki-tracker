'use client'

import { Card, CardContent, CardHeader, Stack, TextField } from '@mui/material'
import { toTitle } from '@/lib/utils'
import { Tables } from '@/lib/types/supabase'
import ImageUpload from '@/components/forms/image-upload'
import ToggleIcon from '@/components/toggle-icon'

type OutfitVariantRow = Pick<
  Tables<'outfit_variants'>,
  'id' | 'slug' | 'outfit_category' | 'image_url' | 'alt_image_url' | 'title' | 'description'
>

export type { OutfitVariantRow }

export default function OutfitVariantImageCard({
  variant,
  image,
  altImage,
  title,
  description,
  onImageChange,
  onAltImageChange,
  onTitleChange,
  onDescriptionChange,
}: {
  variant: OutfitVariantRow
  image: string | null
  altImage: string | null
  title: string
  description: string
  onImageChange: (url: string | null) => void
  onAltImageChange: (url: string | null) => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}) {
  const slug = variant.slug ?? undefined
  const categoryTitle = variant.outfit_category ? toTitle(variant.outfit_category) : undefined

  return (
    <Card>
      <CardHeader
        avatar={
          <ToggleIcon
            item={{
              title: variant.outfit_category || '',
              image_url: `/icons/categories/${variant.outfit_category?.replace('_', '-')}.png`,
            }}
            size="xs"
          />
        }
        sx={{ pb: 0 }}
        title={categoryTitle ?? variant.slug}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5}>
          <input name={`variant_image_${variant.slug}`} type="hidden" value={image ?? ''} />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', pb: 1 }}>
            <ImageUpload
              caption={categoryTitle}
              slug={slug}
              table="outfit_variants"
              url={image}
              onUpload={onImageChange}
            />
            <ImageUpload
              caption={categoryTitle && `Alt ${categoryTitle}`}
              column="alt_image_url"
              slug={slug}
              table="outfit_variants"
              url={altImage}
              onUpload={onAltImageChange}
            />
          </Stack>
          <TextField
            label="Title"
            name={`variant_title_${variant.slug}`}
            size="small"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <TextField
            multiline
            label="Description"
            minRows={2}
            name={`variant_description_${variant.slug}`}
            size="small"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

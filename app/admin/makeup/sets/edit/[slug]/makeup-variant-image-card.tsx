'use client'

import { Card, CardContent, CardHeader, Stack, TextField } from '@mui/material'
import { toTitle } from '@/lib/utils'
import { Tables } from '@/lib/types/supabase'
import ImageUploadPair from '@/components/forms/image-upload-pair'
import ToggleIcon from '@/components/toggle-icon'

type MakeupVariantRow = Pick<
  Tables<'makeup_variants'>,
  'id' | 'slug' | 'makeup_category' | 'image_url' | 'alt_image_url' | 'title' | 'description'
>

export type { MakeupVariantRow }

export default function MakeupVariantImageCard({
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
  variant: MakeupVariantRow
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
  const categoryTitle = variant.makeup_category ? toTitle(variant.makeup_category) : undefined

  return (
    <Card>
      <CardHeader
        avatar={<ToggleIcon category={variant.makeup_category ?? ''} size="xs" />}
        sx={{ pb: 0 }}
        title={categoryTitle ?? variant.slug}
      />
      <CardContent>
        <Stack spacing={1.5}>
          {/* hiddenInputName lets the set form's action re-apply this image under the
              variant's new slug if the set is renamed in the same submit (see
              app/admin/makeup/sets/actions.ts variant_image_ loop). */}
          <ImageUploadPair
            altImage={altImage}
            hiddenInputName={`variant_image_${variant.slug}`}
            image={image}
            size="lg"
            slug={slug}
            table="makeup_variants"
            onAltImageChange={onAltImageChange}
            onImageChange={onImageChange}
          />
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

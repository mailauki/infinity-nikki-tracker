'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/(admin)/form-context'
import { editEvolution } from './actions'
import { navLinksData } from '@/lib/nav-links'
import { Tables } from '@/lib/types/supabase'

type EvolutionRow = Pick<
  Tables<'evolutions'>,
  'slug' | 'title' | 'subtitle' | 'description' | 'order' | 'outfit_set' | 'image_url'
>

type VariantRow = Pick<
  Tables<'outfit_variants'>,
  'id' | 'slug' | 'outfit_category' | 'image_url' | 'default' | 'updated_at'
>

const FORM_ID = 'edit-evolution'

export default function EditEvolutionForm({
  evolution,
  variants,
  back,
}: {
  evolution: EvolutionRow
  variants: VariantRow[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [subtitle, setSubtitle] = useState(evolution.subtitle ?? '')
  const [description, setDescription] = useState(evolution.description ?? '')
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(variants.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
  )

  const boundAction = editEvolution.bind(null, evolution.slug, evolution.outfit_set, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.dashboard.outfits.evolutions.edit,
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <TextField
          disabled
          label="Set Title"
          value={evolution.title}
        />

        <TextField
          required
          label="Subtitle"
          name="subtitle"
          slotProps={{ htmlInput: { maxLength: 100 } }}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Evolution Set Image</Typography>
          <ImageUpload
            slug={evolution.slug}
            table="evolutions"
            url={evolution.image_url ?? null}
            onUpload={() => {}}
          />
        </Stack>

        {variants.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Variant Images</Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              {variants
                .filter((v) => v.slug)
                .map((v) => (
                  <Stack key={v.slug} spacing={0.5}>
                    <Typography sx={{ fontFamily: 'monospace' }} variant="caption">
                      {v.slug}
                    </Typography>
                    <input
                      name={`variant_image_${v.slug}`}
                      type="hidden"
                      value={variantImages[v.slug!] ?? ''}
                    />
                    <ImageUpload
                      slug={v.slug ?? undefined}
                      table="outfit_variants"
                      url={variantImages[v.slug!] ?? null}
                      onUpload={(url) =>
                        setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))
                      }
                    />
                  </Stack>
                ))}
            </Box>
          </Stack>
        )}
      </Stack>
    </form>
  )
}

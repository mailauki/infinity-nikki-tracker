'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, Box, Stack, TextField, Typography } from '@mui/material'
import ImageUpload from '@/components/forms/image-upload'
import CarouselImageUpload from '@/components/forms/carousel-image-upload'
import { useFormConfig } from '@/app/admin/form-context'
import { CarouselImage } from '@/lib/types/outfit'
import { editEvolution } from './actions'
import { navLinksData } from '@/lib/nav-links'
import { Tables } from '@/lib/types/supabase'
import { toTitle } from '@/lib/utils'

type EvolutionRow = Pick<
  Tables<'evolutions'>,
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'order'
  | 'outfit_set'
  | 'image_url'
  | 'alt_image_url'
>

type VariantRow = Pick<
  Tables<'outfit_variants'>,
  'id' | 'slug' | 'outfit_category' | 'image_url' | 'alt_image_url' | 'default' | 'updated_at'
>

const FORM_ID = 'edit-evolution'

export default function EditEvolutionForm({
  evolution,
  variants,
  initialCarouselImages = [],
  back,
}: {
  evolution: EvolutionRow
  variants: VariantRow[]
  initialCarouselImages?: CarouselImage[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [subtitle, setSubtitle] = useState(evolution.subtitle ?? '')
  const [description, setDescription] = useState(evolution.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(evolution.image_url ?? null)
  const [altImageUrl, setAltImageUrl] = useState<string | null>(evolution.alt_image_url ?? null)
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(initialCarouselImages)
  const [currentSlug, setCurrentSlug] = useState(evolution.slug)
  const [variantRows, setVariantRows] = useState<VariantRow[]>(variants)
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(variants.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
  )
  const [variantAltImages, setVariantAltImages] = useState<Record<string, string | null>>(
    Object.fromEntries(variants.filter((v) => v.slug).map((v) => [v.slug, v.alt_image_url]))
  )

  const boundAction = editEvolution.bind(null, currentSlug, evolution.outfit_set, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.admin.outfits.evolutions.list,
      pending,
      showUpdateOnly: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  useEffect(() => {
    if (state && 'savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })

      if ('slug' in state) setCurrentSlug(state.slug)

      if ('variants' in state) {
        const fresh = state.variants
        setVariantRows(fresh)
        setVariantImages(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
        )
        setVariantAltImages(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.alt_image_url]))
        )
      }
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <TextField disabled label="Set Title" value={evolution.title} />

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
          <Typography variant="subtitle2">Gallery Images</Typography>
          <CarouselImageUpload
            foreignKeyField="evolution"
            images={carouselImages}
            slug={currentSlug}
            table="evolution_carousel_images"
            onChange={setCarouselImages}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Evolution Set Images</Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <ImageUpload
              caption="Default"
              size="lg"
              slug={evolution.slug}
              table="evolutions"
              url={imageUrl}
              onUpload={(url) => setImageUrl(url)}
            />
            <ImageUpload
              caption="Alternative"
              column="alt_image_url"
              size="lg"
              slug={evolution.slug}
              table="evolutions"
              url={altImageUrl}
              onUpload={(url) => setAltImageUrl(url)}
            />
          </Stack>
        </Stack>

        {variantRows.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Variant Images</Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              {variantRows
                .filter((v) => v.slug)
                .map((v) => (
                  <Stack key={v.slug} spacing={0.5}>
                    <Typography variant="caption">
                      {(v.outfit_category && toTitle(v.outfit_category)) ?? v.slug}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <input
                        name={`variant_image_${v.slug}`}
                        type="hidden"
                        value={variantImages[v.slug!] ?? ''}
                      />
                      <ImageUpload
                        caption={(v.outfit_category && toTitle(v.outfit_category)) ?? undefined}
                        slug={v.slug ?? undefined}
                        table="outfit_variants"
                        url={variantImages[v.slug!] ?? null}
                        onUpload={(url) =>
                          setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))
                        }
                      />
                      <input
                        name={`variant_alt_image_${v.slug}`}
                        type="hidden"
                        value={variantAltImages[v.slug!] ?? ''}
                      />
                      <ImageUpload
                        caption={
                          (v.outfit_category && `Alt ${toTitle(v.outfit_category)}`) ?? undefined
                        }
                        column="alt_image_url"
                        slug={v.slug ?? undefined}
                        table="outfit_variants"
                        url={variantAltImages[v.slug!] ?? null}
                        onUpload={(url) =>
                          setVariantAltImages((prev) => ({ ...prev, [v.slug!]: url }))
                        }
                      />
                    </Stack>
                  </Stack>
                ))}
            </Box>
          </Stack>
        )}
      </Stack>
    </form>
  )
}

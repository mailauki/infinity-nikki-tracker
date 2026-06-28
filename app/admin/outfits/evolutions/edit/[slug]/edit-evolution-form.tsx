'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, Box, Stack, TextField, Typography } from '@mui/material'
import ImageUpload from '@/components/forms/image-upload'
import CarouselImageUpload from '@/app/admin/outfits/carousel-image-upload'
import { useFormConfig } from '@/app/admin/form-context'
import { CarouselImage } from '@/lib/types/outfit'
import { editEvolution } from './actions'
import { navLinksData } from '@/lib/nav-links'
import { Tables } from '@/lib/types/supabase'
import OutfitVariantImageCard from '@/components/outfits/outfit-variant-image-card'

type EvolutionRow = Pick<
  Tables<'outfit_sets'>,
  'slug' | 'title' | 'description' | 'order' | 'base_set' | 'image_url' | 'alt_image_url'
>

type VariantRow = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_category'
  | 'image_url'
  | 'alt_image_url'
  | 'title'
  | 'description'
  | 'default'
  | 'updated_at'
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
  const [variantTitles, setVariantTitles] = useState<Record<string, string>>(
    Object.fromEntries(variants.filter((v) => v.slug).map((v) => [v.slug, v.title ?? '']))
  )
  const [variantDescriptions, setVariantDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(variants.filter((v) => v.slug).map((v) => [v.slug, v.description ?? '']))
  )

  const boundAction = editEvolution.bind(null, currentSlug, evolution.base_set ?? '', back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.admin.outfits.evolutions.list,
      pending,
      showUpdateOnly: true,
      showUpdateNext: true,
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
        setVariantTitles(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.title ?? '']))
        )
        setVariantDescriptions(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.description ?? '']))
        )
      }
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <TextField disabled label="Set Title" value={evolution.title} />
        <TextField disabled label="Base Set" value={evolution.base_set ?? ''} />

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
            images={carouselImages}
            slug={currentSlug}
            table="outfit_set_carousel_images"
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
              table="outfit_sets"
              url={imageUrl}
              onUpload={(url) => setImageUrl(url)}
            />
            <ImageUpload
              caption="Alternative"
              column="alt_image_url"
              size="lg"
              slug={evolution.slug}
              table="outfit_sets"
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
                  <OutfitVariantImageCard
                    key={v.id}
                    altImage={variantAltImages[v.slug!] ?? null}
                    description={variantDescriptions[v.slug!] ?? ''}
                    image={variantImages[v.slug!] ?? null}
                    title={variantTitles[v.slug!] ?? ''}
                    variant={v}
                    onAltImageChange={(url) =>
                      setVariantAltImages((prev) => ({ ...prev, [v.slug!]: url }))
                    }
                    onDescriptionChange={(value) =>
                      setVariantDescriptions((prev) => ({ ...prev, [v.slug!]: value }))
                    }
                    onImageChange={(url) =>
                      setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))
                    }
                    onTitleChange={(value) =>
                      setVariantTitles((prev) => ({ ...prev, [v.slug!]: value }))
                    }
                  />
                ))}
            </Box>
          </Stack>
        )}
      </Stack>
    </form>
  )
}

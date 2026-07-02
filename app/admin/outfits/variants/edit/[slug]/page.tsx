import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getOutfitVariantRaw } from '@/hooks/data/admin/outfit-variants'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import EntityForm from '@/app/admin/entity-form'
import { editOutfitVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Outfit Variant',
}

export default async function EditOutfitVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitVariant params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitVariant({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [variant, outfitSets, outfitCategories, seasons, seasonCategories, styles, labels] =
    await Promise.all([
      getOutfitVariantRaw(slug),
      getOutfitSetsRaw(),
      getOutfitCategories(),
      getSeasons(),
      getSeasonCategories(),
      getStyles(),
      getLabels(),
    ])

  if (!variant) notFound()

  const back = '/admin/outfits/variants'

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editOutfitVariant.bind(null, variant.id, back)}
      backUrl={back}
      formId="edit-outfit-variant"
      formKind="outfitVariant"
      initialValues={{
        outfit_set: variant.outfit_set ?? '',
        outfit_category: variant.outfit_category ?? '',
        seasons: variant.seasons ?? '',
        season_category: variant.season_category ?? '',
        rarity: variant.rarity ?? '',
        style: variant.style ?? '',
        label: variant.label ?? '',
        label_2: variant.label_2 ?? '',
        title: variant.title ?? '',
        description: variant.description ?? '',
        slug: variant.slug,
        image_url: variant.image_url,
        image_url_alt: variant.alt_image_url,
        default: variant.default,
      }}
      lookups={{ outfitSets, outfitCategories, seasons, seasonCategories, styles, labels }}
      mode="edit"
    />
  )
}

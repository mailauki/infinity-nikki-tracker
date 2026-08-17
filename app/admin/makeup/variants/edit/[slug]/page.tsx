import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { getMakeupVariantRaw } from '@/hooks/data/admin/makeup-variants'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getStyles } from '@/hooks/data/styles'
import EntityForm from '@/app/admin/entity-form'
import { editMakeupVariant } from '../../actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/makeup/variants/edit/[slug]'),
}

export default async function EditMakeupVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditMakeupVariant params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditMakeupVariant({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [variant, makeupSets, makeupCategories, seasons, seasonCategories, styles] =
    await Promise.all([
      getMakeupVariantRaw(slug),
      getMakeupSetsRaw(),
      getMakeupCategories(),
      getSeasons(),
      getSeasonCategories(),
      getStyles(),
    ])

  if (!variant) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editMakeupVariant.bind(null, variant.id)}
      formId="edit-makeup-variant"
      formKind="makeupVariant"
      initialValues={{
        makeup_set: variant.makeup_set ?? '',
        makeup_category: variant.makeup_category ?? '',
        seasons: variant.seasons ?? '',
        season_category: variant.season_category ?? '',
        rarity: variant.rarity ?? '',
        style: variant.style ?? '',
        title: variant.title ?? '',
        description: variant.description ?? '',
        slug: variant.slug,
        image_url: variant.image_url,
        image_url_alt: variant.alt_image_url,
      }}
      lookups={{ makeupSets, makeupCategories, seasons, seasonCategories, styles }}
      mode="edit"
    />
  )
}

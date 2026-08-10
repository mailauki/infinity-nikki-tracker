import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { getMakeupVariantRaw } from '@/hooks/data/admin/makeup-variants'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import EntityForm from '@/app/admin/entity-form'
import { editMakeupVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Makeup Variant',
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

  const [variant, makeupSets, makeupCategories, styles, labels] = await Promise.all([
    getMakeupVariantRaw(slug),
    getMakeupSetsRaw(),
    getMakeupCategories(),
    getStyles(),
    getLabels(),
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
        rarity: variant.rarity ?? '',
        style: variant.style ?? '',
        label: variant.label ?? '',
        title: variant.title ?? '',
        description: variant.description ?? '',
        slug: variant.slug,
        image_url: variant.image_url,
        image_url_alt: variant.alt_image_url,
      }}
      lookups={{ makeupSets, makeupCategories, styles, labels }}
      mode="edit"
    />
  )
}

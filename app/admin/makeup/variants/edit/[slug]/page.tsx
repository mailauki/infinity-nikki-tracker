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
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'
import { editMakeupVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Makeup Variant',
}

type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function EditMakeupVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditMakeupVariant params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditMakeupVariant({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { entity: rawEntity, gap: rawGap, page: rawPage } = await searchParams
  const entity = parseEntityKey(rawEntity)
  const gap = rawGap ? parseGapKind(rawGap) : null
  const page = Number.parseInt(rawPage ?? '1', 10)

  const [variant, makeupSets, makeupCategories, styles, labels] = await Promise.all([
    getMakeupVariantRaw(slug),
    getMakeupSetsRaw(),
    getMakeupCategories(),
    getStyles(),
    getLabels(),
  ])

  if (!variant) notFound()

  const formId = 'edit-makeup-variant'

  return (
    <>
      <EntityForm
        showUpdateNext
        showUpdateOnly
        action={editMakeupVariant.bind(null, variant.id)}
        formId={formId}
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
      {entity && <input form={formId} name="entity" type="hidden" value={entity} />}
      {gap && <input form={formId} name="gap" type="hidden" value={gap} />}
      {entity && (
        <input
          form={formId}
          name="page"
          type="hidden"
          value={Number.isFinite(page) && page > 0 ? page : 1}
        />
      )}
    </>
  )
}

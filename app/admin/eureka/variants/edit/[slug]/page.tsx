import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAdminData } from '@/hooks/data/user'
import { toSlugVariant } from '@/lib/utils'
import EntityForm from '@/app/admin/entity-form'
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'
import { editEurekaVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Eureka Variant',
}

type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function EditEurekaVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditEurekaVariant params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditEurekaVariant({
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
  const supabase = await createClient()

  const { data: variant } = await supabase
    .from('eureka_variants')
    .select('id, eureka_set, category, color, image_url, default, slug')
    .eq('slug', slug)
    .single()

  if (!variant) notFound()

  const { eurekaSets, categories, colors, eurekaVariants } = await getAdminData()

  const formId = 'edit-eureka-variant'

  return (
    <>
      <EntityForm
        showUpdateNext
        showUpdateOnly
        action={editEurekaVariant.bind(null, variant.id)}
        builderData={{ eurekaVariants: eurekaVariants ?? [], currentId: variant.id }}
        formId={formId}
        formKind="eurekaVariant"
        initialValues={{
          eureka_set: variant.eureka_set ?? '',
          category: variant.category ?? '',
          color: variant.color ?? '',
          slug:
            variant.slug ??
            toSlugVariant(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? ''),
          image_url: variant.image_url,
          default: variant.default,
        }}
        lookups={{
          eurekaSets: eurekaSets ?? [],
          categories: categories ?? [],
          colors: colors ?? [],
        }}
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

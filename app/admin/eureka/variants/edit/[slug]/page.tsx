import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAdminData } from '@/hooks/data/user'
import { toSlugVariant } from '@/lib/utils'
import EntityForm from '@/app/admin/entity-form'
import { eurekaVariantFields } from '../../fields'
import { editEurekaVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Eureka Variant',
}

export default async function EditEurekaVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditEurekaVariant params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditEurekaVariant({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: variant } = await supabase
    .from('eureka_variants')
    .select('id, eureka_set, category, color, image_url, default, slug')
    .eq('slug', slug)
    .single()

  if (!variant) notFound()

  const { eurekaSets, categories, colors, eurekaVariants } = await getAdminData()
  const back = '/admin/eureka/variants'

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editEurekaVariant.bind(null, variant.id, back)}
      backUrl={back}
      fields={eurekaVariantFields('edit', eurekaVariants ?? [], variant.id)}
      formId="edit-eureka-variant"
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
  )
}

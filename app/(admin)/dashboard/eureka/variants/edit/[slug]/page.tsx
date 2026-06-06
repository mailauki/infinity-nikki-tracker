import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEurekaVariantForm from './edit-eureka-variant-form'
import { getAdminData } from '@/hooks/data/user'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

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
    .select(
      'id, eureka_set, category, color, image_url, default, slug, updated_at, eureka_sets ( title ), eureka_categories ( title ), eureka_colors ( title )'
    )
    .eq('slug', slug)
    .single()

  if (!variant) notFound()

  const { eurekaSets, categories, colors, eurekaVariants } = await getAdminData()

  return (
    <EditEurekaVariantForm
      back="/dashboard/eureka/variants"
      categories={categories ?? []}
      colors={colors ?? []}
      eurekaSets={eurekaSets ?? []}
      variant={variant}
      variants={eurekaVariants ?? []}
    />
  )
}

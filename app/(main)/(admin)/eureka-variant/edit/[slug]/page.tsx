import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEurekaVariantForm from '@/components/forms/eureka-variant/edit-eureka-variant-form'
import { getAdminData } from '@/hooks/data/user'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Eureka Variant',
}

export default async function EditEurekaVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <EditEurekaVariant params={params} searchParams={searchParams} />
        </Stack>
      </Container>
    </Suspense>
  )
}

async function EditEurekaVariant({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back } = await searchParams
  const supabase = await createClient()

  const { data: variant } = await supabase
    .from('eureka_variants')
    .select('id, eureka_set, category, color, image_url, default, slug, updated_at')
    .eq('slug', slug)
    .single()

  if (!variant) notFound()

  const { eurekaSets, categories, colors, eurekaVariants } = await getAdminData()

  return (
    <EditEurekaVariantForm
      back={back}
      categories={categories ?? []}
      colors={colors ?? []}
      eurekaSets={eurekaSets ?? []}
      variant={variant}
      variants={eurekaVariants ?? []}
    />
  )
}

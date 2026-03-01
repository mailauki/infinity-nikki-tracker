import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { createClient } from '@/lib/supabase/server'
import { getAdminData } from '@/lib/data'
import EditEurekaVariantForm from '@/components/forms/eureka-variant/edit-eureka-variant-form'

export default async function EditEurekaVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <EditEurekaVariant params={params} />
      </Container>
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

  const { eurekaSets, categories, colors } = await getAdminData()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Edit Eureka Variant
      </Typography>
      <EditEurekaVariantForm
        variant={variant}
        eurekaSets={eurekaSets ?? []}
        categories={categories ?? []}
        colors={colors ?? []}
      />
    </Box>
  )
}

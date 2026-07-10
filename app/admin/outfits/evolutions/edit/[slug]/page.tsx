import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEvolutionForm from './edit-evolution-form'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Evolution',
}

export default async function EditEvolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditEvolution params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditEvolution({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = await createClient()

  const { data: evolution } = await supabase
    .from('outfit_sets')
    .select('slug, title, description, "order", base_set, image_url, alt_image_url')
    .eq('slug', slug)
    .not('base_set', 'is', null)
    .single()

  if (!evolution) notFound()

  const [{ data: variantRows }, carouselRows] = await Promise.all([
    supabase
      .from('outfit_variants')
      .select(
        'id, slug, outfit_category, image_url, alt_image_url, title, description, default, updated_at, outfit_categories ( id )'
      )
      .eq('outfit_set', slug)
      .order('id', { ascending: true }),
    supabase
      .from('outfit_set_carousel_images')
      .select('id, image_url, sort_order')
      .eq('outfit_set', slug)
      .order('sort_order', { ascending: true })
      .then((r) => r.data ?? []),
  ])

  return (
    <EditEvolutionForm
      evolution={evolution}
      initialCarouselImages={carouselRows}
      variants={variantRows ?? []}
    />
  )
}

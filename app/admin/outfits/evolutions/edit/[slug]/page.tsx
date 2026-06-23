import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEvolutionForm from './edit-evolution-form'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'

export const metadata: Metadata = {
  title: 'Edit Evolution',
}

export default async function EditEvolutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditEvolution params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditEvolution({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back: backParam } = await searchParams
  const back = backParam?.startsWith('/admin/')
    ? backParam
    : navLinksData.admin.outfits.evolutions.list

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
        'id, slug, outfit_category, image_url, alt_image_url, title, description, default, updated_at'
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
      back={back}
      evolution={evolution}
      initialCarouselImages={carouselRows}
      variants={variantRows ?? []}
    />
  )
}

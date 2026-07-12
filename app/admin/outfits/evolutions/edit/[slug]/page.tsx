import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEvolutionForm from './edit-evolution-form'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { isGlowup } from '@/hooks/outfit'

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

  // For a glow-up evolution, map each base-set category to its variant title so the
  // form can default an empty variant title to "{base title}: {glow-up set title}".
  const baseTitleByCategory: Record<string, string> = {}
  if (isGlowup(evolution) && evolution.base_set) {
    const { data: baseVariants } = await supabase
      .from('outfit_variants')
      .select('outfit_category, title')
      .eq('outfit_set', evolution.base_set)
    for (const v of baseVariants ?? []) {
      const title = v.title?.trim()
      if (v.outfit_category && title) baseTitleByCategory[v.outfit_category] = title
    }
  }

  return (
    <EditEvolutionForm
      baseTitleByCategory={baseTitleByCategory}
      evolution={evolution}
      initialCarouselImages={carouselRows}
      variants={variantRows ?? []}
    />
  )
}

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditOutfitVariantForm from './edit-outfit-variant-form'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Outfit Variant',
}

export default async function EditOutfitVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitVariant params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitVariant({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: variant } = await supabase
    .from('outfit_variants')
    .select(
      'id, outfit_set, outfit_category, evolution, image_url, alt_image_url, default, slug, updated_at, outfit_sets ( title ), outfit_categories ( title ), evolutions ( title )'
    )
    .eq('slug', slug)
    .single()

  if (!variant) notFound()

  const [outfitSets, outfitVariants, outfitCategories, evolutions] = await Promise.all([
    getOutfitSetsRaw(),
    getOutfitVariantsRaw(),
    getOutfitCategories(),
    getEvolutions(),
  ])

  return (
    <EditOutfitVariantForm
      back="/admin/outfits/variants"
      evolutions={evolutions}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets ?? []}
      variant={variant}
      variants={outfitVariants ?? []}
    />
  )
}

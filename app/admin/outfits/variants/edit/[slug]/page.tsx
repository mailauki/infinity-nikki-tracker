import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditOutfitVariantForm from './edit-outfit-variant-form'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getOutfitVariantRaw } from '@/hooks/data/admin/outfit-variants'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
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

  const [variant, outfitSets, outfitCategories, seasons, seasonCategories] = await Promise.all([
    getOutfitVariantRaw(slug),
    getOutfitSetsRaw(),
    getOutfitCategories(),
    getSeasons(),
    getSeasonCategories(),
  ])

  if (!variant) notFound()

  return (
    <EditOutfitVariantForm
      back="/admin/outfits/variants"
      outfitCategories={outfitCategories}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      variant={variant}
    />
  )
}

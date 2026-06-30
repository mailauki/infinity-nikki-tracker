import { Suspense } from 'react'
import AddOutfitVariantForm from './add-outfit-variant-form'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Outfit Variant',
}

export default function NewOutfitVariantPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewOutfitVariant />
      </Stack>
    </Suspense>
  )
}

async function NewOutfitVariant() {
  const [outfitSets, outfitCategories, seasons, seasonCategories] = await Promise.all([
    getOutfitSetsRaw(),
    getOutfitCategories(),
    getSeasons(),
    getSeasonCategories(),
  ])

  return (
    <AddOutfitVariantForm
      outfitCategories={outfitCategories}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
    />
  )
}

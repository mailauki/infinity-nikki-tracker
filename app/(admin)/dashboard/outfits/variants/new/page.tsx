import { Suspense } from 'react'
import AddOutfitVariantForm from './add-outfit-variant-form'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
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
  const [outfitSets, outfitVariants, outfitCategories, evolutions] = await Promise.all([
    getOutfitSetsRaw(),
    getOutfitVariantsRaw(),
    getOutfitCategories(),
    getEvolutions(),
  ])

  return (
    <AddOutfitVariantForm
      evolutions={evolutions}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets ?? []}
      variants={outfitVariants ?? []}
    />
  )
}

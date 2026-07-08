import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { bySlug } from '@/lib/utils'
import { Suspense } from 'react'
import OutfitVariantView from './outfit-variant-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Outfit Variants',
}

export default function OutfitVariantsAdminPage() {
  return (
    <Suspense>
			<AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [outfitVariants, outfitSets, outfitCategories] = await Promise.all([
    getOutfitVariantsRaw(),
    getOutfitSetsRaw(),
    getOutfitCategories(),
  ])

  const sortedVariants = [...outfitVariants].sort(bySlug)

  return (
    <OutfitVariantView
      outfitCategories={outfitCategories}
      outfitSets={outfitSets}
      outfitVariants={sortedVariants}
    />
  )
}

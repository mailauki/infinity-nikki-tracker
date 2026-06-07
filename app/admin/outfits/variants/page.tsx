import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { Suspense } from 'react'
import OutfitVariantView from './outfit-variant-view'

export default function OutfitVariantsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [outfitVariants, outfitSets, outfitCategories, evolutions] = await Promise.all([
    getOutfitVariantsRaw(),
    getOutfitSets(),
    getOutfitCategories(),
    getEvolutions(),
  ])

  return (
    <OutfitVariantView
      evolutions={evolutions}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets}
      outfitVariants={outfitVariants}
    />
  )
}

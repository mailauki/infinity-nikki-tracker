import { getEvolutionsWithVariants } from '@/hooks/data/evolutions'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { Suspense } from 'react'
import OutfitEvolutionView from './outfit-evolution-view'

export default function OutfitEvolutionsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [evolutions, outfitCategories] = await Promise.all([
    getEvolutionsWithVariants(),
    getOutfitCategories(),
  ])

  return <OutfitEvolutionView evolutions={evolutions} outfitCategories={outfitCategories} />
}

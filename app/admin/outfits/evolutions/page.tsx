import { getEvolutionsWithVariants } from '@/hooks/data/evolutions'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { byTitleThenOrder } from '@/lib/utils'
import { Suspense } from 'react'
import OutfitEvolutionView from './outfit-evolution-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/outfits/evolutions') }

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

  const sortedEvolutions = [...evolutions].sort(byTitleThenOrder)

  return <OutfitEvolutionView evolutions={sortedEvolutions} outfitCategories={outfitCategories} />
}

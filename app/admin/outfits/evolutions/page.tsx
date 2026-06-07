import { getEvolutions } from '@/hooks/data/evolutions'
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
  const evolutions = await getEvolutions()

  return <OutfitEvolutionView evolutions={evolutions} />
}

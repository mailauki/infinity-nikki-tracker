import { getEvolutions } from '@/hooks/data/evolutions'
import { Suspense } from 'react'
import OutfitEvolutionView from './outfit-evolution-view'

export default function OutfitEvolutionsDashboard() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  )
}

async function DashboardView() {
  const evolutions = await getEvolutions()

  return <OutfitEvolutionView evolutions={evolutions} />
}

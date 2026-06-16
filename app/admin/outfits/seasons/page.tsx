import { getSeasonsRaw } from '@/hooks/data/admin/seasons'
import { Suspense } from 'react'
import OutfitSeasonView from './outfit-season-view'

export default function OutfitSeasonsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const seasons = await getSeasonsRaw()

  return <OutfitSeasonView seasons={seasons} />
}

import { getSeasonsRaw } from '@/hooks/data/admin/seasons'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import OutfitSeasonView from './outfit-season-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/outfits/seasons') }

export default function OutfitSeasonsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const seasons = await getSeasonsRaw()
  const sortedSeasons = [...seasons].sort(byTitleThenSlug)

  return <OutfitSeasonView seasons={sortedSeasons} />
}

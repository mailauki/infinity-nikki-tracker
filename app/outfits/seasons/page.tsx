import { Suspense } from 'react'
import { Metadata } from 'next'
import SeasonsToolBar from '@/components/outfits/seasons-toolbar'
import SeasonsLoading from './loading'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getLocations } from '@/hooks/data/locations'
import SeasonsContent from '@/app/outfits/seasons/seasons-content'

export const metadata: Metadata = {
  title: 'Outfits by Season',
}

export default async function SeasonsPage() {
  const [seasons, seasonCategories, locations] = await Promise.all([
    getSeasons(),
    getSeasonCategories(),
    getLocations(),
  ])

  return (
    <>
      <SeasonsToolBar count={seasons.length} />
      <Suspense fallback={<SeasonsLoading />}>
        <SeasonsContent
          locations={locations}
          seasonCategories={seasonCategories}
          seasons={seasons}
        />
      </Suspense>
    </>
  )
}

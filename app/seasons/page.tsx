import { Suspense } from 'react'
import { Metadata } from 'next'
import SeasonsToolBar from '@/app/seasons/seasons-toolbar'
import SeasonsLoading from './loading'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getLocations } from '@/hooks/data/locations'
import SeasonsContent from '@/app/seasons/seasons-content'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/seasons'),
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
      <PageShell>
        <Suspense fallback={<SeasonsLoading />}>
          <SeasonsContent
            locations={locations}
            seasonCategories={seasonCategories}
            seasons={seasons}
          />
        </Suspense>
      </PageShell>
    </>
  )
}

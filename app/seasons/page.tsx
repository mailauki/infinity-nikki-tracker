import { Suspense } from 'react'
import { Metadata } from 'next'
import SeasonsToolBar from '@/app/seasons/seasons-toolbar'
import SeasonsLoading from './loading'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getSeasonGroups } from '@/hooks/data/season-groups'
import { getLocations } from '@/hooks/data/locations'
import { getMakeupSets } from '@/hooks/data/makeup-sets'
import SeasonsContent from '@/app/seasons/seasons-content'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/seasons'),
}

export default async function SeasonsPage() {
  const [seasons, seasonCategories, seasonGroups, locations, makeupSets] = await Promise.all([
    getSeasons(),
    getSeasonCategories(),
    getSeasonGroups(),
    getLocations(),
    getMakeupSets(),
  ])

  return (
    <>
      <SeasonsToolBar count={seasons.length} />
      <PageShell>
        <Suspense fallback={<SeasonsLoading />}>
          <SeasonsContent
            locations={locations}
            makeupSets={makeupSets}
            seasonCategories={seasonCategories}
            seasonGroups={seasonGroups}
            seasons={seasons}
          />
        </Suspense>
      </PageShell>
    </>
  )
}

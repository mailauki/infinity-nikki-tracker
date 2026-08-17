import { Suspense } from 'react'
import { getMomoCloaksRaw } from '@/hooks/data/admin/momo-cloaks'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getLocations } from '@/hooks/data/locations'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { byTitleThenSlug } from '@/lib/utils'
import MomoCloakView from './momo-cloak-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/momo-cloaks') }

export default function MomoCloaksAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [momoCloaks, styles, labels, seasons, seasonCategories, locations, outfitSets] =
    await Promise.all([
      getMomoCloaksRaw(),
      getStyles(),
      getLabels(),
      getSeasons(),
      getSeasonCategories(),
      getLocations(),
      getOutfitSetsRaw(),
    ])

  const sortedMomoCloaks = [...momoCloaks].sort(byTitleThenSlug)

  return (
    <MomoCloakView
      labels={labels}
      locations={locations}
      momoCloaks={sortedMomoCloaks}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}

import { Suspense } from 'react'
import { getMomoCloaksRaw } from '@/hooks/data/admin/momo-cloaks'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getLocations } from '@/hooks/data/locations'
import { byTitleThenSlug } from '@/lib/utils'
import MomoCloakView from './momo-cloak-view'

export default function MomoCloaksAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [momoCloaks, styles, labels, seasons, seasonCategories, locations] = await Promise.all([
    getMomoCloaksRaw(),
    getStyles(),
    getLabels(),
    getSeasons(),
    getSeasonCategories(),
    getLocations(),
  ])

  const sortedMomoCloaks = [...momoCloaks].sort(byTitleThenSlug)

  return (
    <MomoCloakView
      labels={labels}
      locations={locations}
      momoCloaks={sortedMomoCloaks}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}

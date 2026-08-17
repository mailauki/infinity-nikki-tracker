import { Suspense } from 'react'
import { getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getStyles } from '@/hooks/data/styles'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { byTitleThenSlug } from '@/lib/utils'
import MakeupSetView from './makeup-set-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/makeup/sets') }

export default function MakeupSetsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [makeupSets, outfitSets, styles, seasons, seasonCategories] = await Promise.all([
    getMakeupSetsRaw(),
    getOutfitSetsRaw(),
    getStyles(),
    getSeasons(),
    getSeasonCategories(),
  ])

  const sortedMakeupSets = [...makeupSets].sort(byTitleThenSlug)

  return (
    <MakeupSetView
      makeupSets={sortedMakeupSets}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}

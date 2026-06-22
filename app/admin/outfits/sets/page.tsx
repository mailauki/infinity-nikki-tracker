import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getLabels } from '@/hooks/data/labels'
import { getStyles } from '@/hooks/data/styles'
import { getAbilities } from '@/hooks/data/abilities'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import OutfitSetView from './outfit-set-view'

export default function OutfitSetsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [outfitSets, styles, labels, abilities, seasons, seasonCategories, outfitCategories] =
    await Promise.all([
      getOutfitSets(),
      getStyles(),
      getLabels(),
      getAbilities(),
      getSeasons(),
      getSeasonCategories(),
      getOutfitCategories(),
    ])

  const sortedOutfitSets = [...outfitSets].sort(byTitleThenSlug)

  return (
    <OutfitSetView
      abilities={abilities}
      labels={labels}
      outfitCategories={outfitCategories}
      outfitSets={sortedOutfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}

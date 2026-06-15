import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getLabels } from '@/hooks/data/labels'
import { getStyles } from '@/hooks/data/styles'
import { getAbilities } from '@/hooks/data/abilities'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
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
  const [outfitSets, styles, labels, abilities, outfitCategories] = await Promise.all([
    getOutfitSets(),
    getStyles(),
    getLabels(),
    getAbilities(),
    getOutfitCategories(),
  ])

  return (
    <OutfitSetView
      abilities={abilities}
      labels={labels}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets}
      styles={styles}
    />
  )
}

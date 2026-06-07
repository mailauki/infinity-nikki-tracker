import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getLabels } from '@/hooks/data/labels'
import { getStyles } from '@/hooks/data/styles'
import { getAbilities } from '@/hooks/data/abilities'
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
  const [outfitSets, styles, labels, abilities] = await Promise.all([
    getOutfitSets(),
    getStyles(),
    getLabels(),
    getAbilities(),
  ])

  return (
    <OutfitSetView abilities={abilities} labels={labels} outfitSets={outfitSets} styles={styles} />
  )
}
